#!/usr/bin/env bash
# Keeps the Discord streaming status online 24/7 on ANY always-on machine: a VPS, a home PC,
# an Android phone with Termux, or a Bot-Hosting.net / Pterodactyl panel. Same idea as wagu's
# server/run_24_7.sh: it restarts the bot by itself if it ever stops or crashes.
#
#   ./run_24_7.sh            start in the background (also after you close the terminal)
#   ./run_24_7.sh run        stay in the foreground (Docker, Railway, systemd, Pterodactyl panels)
#   ./run_24_7.sh status     is it running? + the last log lines
#   ./run_24_7.sh logs       follow the log (Ctrl+C leaves the bot running)
#   ./run_24_7.sh stop       stop it
#
# The token is read from the environment or from a local .env file (copy .env.example to .env).
# It is never written to the log. Do not commit .env.
#
# Bot-Hosting.net / Pterodactyl: upload this repo, upload your .env in the Files tab and set the
# startup command to:  bash run_24_7.sh run
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
cd "$(dirname "$SELF")" || exit 1

CMD="${1:-start}"
LOG=logs/stream.log
PIDFILE=run/stream.pid
mkdir -p logs run

load_env() {
  if [ -f .env ]; then set -a; . ./.env; set +a; fi
}

is_running() {
  [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

# Fail fast with a clear message instead of a bot that dies in a loop.
preflight() {
  load_env
  if [ -z "${TOKEN:-}" ]; then
    echo "Missing TOKEN. Copy .env.example to .env and fill it in (or export TOKEN first)."
    return 1
  fi
  node scripts/check-token.js || return 1
}

supervise() {
  preflight || exit 1
  if [ ! -d node_modules/discord.js-selfbot-v13 ]; then
    echo "[run_24_7] installing dependencies..."
    npm ci --omit=dev || npm install --omit=dev || exit 1
  fi
  echo $$ > "$PIDFILE"
  NODE_PID=""
  trap 'echo "[run_24_7] stopping"; [ -n "$NODE_PID" ] && kill "$NODE_PID" 2>/dev/null; rm -f "$PIDFILE"; exit 0' TERM INT

  fails=0
  while true; do
    started=$(date +%s)
    node index.js &
    NODE_PID=$!
    wait "$NODE_PID"
    code=$?
    NODE_PID=""
    up=$(( $(date +%s) - started ))
    # a bot that dies within 90 s, three times in a row, has a start-up problem (bad token, no network):
    # stop instead of hammering Discord with logins
    if [ "$up" -lt 90 ]; then fails=$((fails + 1)); else fails=0; fi
    echo "[run_24_7] bot exited (code $code) after ${up}s"
    if [ "$fails" -ge 3 ]; then
      echo "[run_24_7] the bot keeps dying at start-up - giving up. Check the TOKEN (invalid or reset?)."
      rm -f "$PIDFILE"
      exit 1
    fi
    sleep 10 &
    wait $!
  done
}

case "$CMD" in
  run)
    supervise
    ;;
  start)
    if is_running; then echo "already running (pid $(cat "$PIDFILE"))"; exit 0; fi
    preflight || exit 1
    # keep the log from growing forever
    if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 5000000 ]; then tail -n 500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; fi
    nohup bash "$SELF" run >> "$LOG" 2>&1 < /dev/null &   # via bash: works even if the exec bit was lost (zip, Windows)
    sleep 2
    if is_running; then
      echo "started (pid $(cat "$PIDFILE")). Logs: $LOG    Stop: ./run_24_7.sh stop"
    else
      echo "did not start - see the end of $LOG"; tail -n 5 "$LOG"; exit 1
    fi
    ;;
  stop)
    if is_running; then
      pid="$(cat "$PIDFILE")"
      kill "$pid" 2>/dev/null
      for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
      kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null
      rm -f "$PIDFILE"
      echo "stopped"
    else
      rm -f "$PIDFILE"
      echo "not running"
    fi
    ;;
  status)
    if is_running; then echo "running (pid $(cat "$PIDFILE"))"; else echo "not running"; fi
    [ -f "$LOG" ] && tail -n 5 "$LOG"
    ;;
  logs)
    touch "$LOG"
    tail -n 50 -f "$LOG"
    ;;
  *)
    sed -n '2,13p' "$SELF" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
