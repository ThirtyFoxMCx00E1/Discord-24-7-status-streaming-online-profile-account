#!/usr/bin/env bash
# Publishes a tiny status.json (last log lines + "is Discord ready") to the `live-status` branch.
# docs/console.html reads it. Same idea as wagu's live-status.yml. It never prints or stores the
# token, and any failure is harmless (the caller ignores the exit code).
#   needs: GH_TOKEN, GITHUB_REPOSITORY, RUN_ID, SHIFT_START (epoch seconds), and bot.log in the cwd
#   test:  STATUS_REMOTE=/path/to/bare.git bash scripts/publish-status.sh
set -u
[ -n "${GITHUB_REPOSITORY:-}" ] || exit 0
REMOTE="${STATUS_REMOTE:-https://x-access-token:${GH_TOKEN:-}@github.com/${GITHUB_REPOSITORY}.git}"
[ -n "${STATUS_REMOTE:-}" ] || [ -n "${GH_TOKEN:-}" ] || exit 0

out="$(mktemp -d)" || exit 0
trap 'rm -rf "$out"' EXIT

OUT="$out" node -e '
const fs = require("fs");
let log = "";
try { log = fs.readFileSync("bot.log", "utf8"); } catch (e) {}
// belt and braces: anything shaped like a Discord token is hidden before it is published
const hide = (s) => s.replace(/[\w-]{20,}\.[\w-]{5,}\.[\w-]{20,}/g, "[token hidden]");
const lines = log.split("\n").filter(Boolean).slice(-40)
  .map((l) => hide(l.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")).slice(0, 300));
const readyAt = log.lastIndexOf("rich presence started");
const exitAt = log.lastIndexOf("bot exited");
const repo = process.env.GITHUB_REPOSITORY;
const start = Number(process.env.SHIFT_START || 0);
const status = {
  updated: new Date().toISOString(),
  run_id: String(process.env.RUN_ID || ""),
  run_url: "https://github.com/" + repo + "/actions/runs/" + (process.env.RUN_ID || ""),
  shift_started: start ? new Date(start * 1000).toISOString() : null,
  discord_ready: readyAt >= 0 && readyAt > exitAt,
  log: lines,
};
fs.writeFileSync(process.env.OUT + "/status.json", JSON.stringify(status, null, 1) + "\n");
' || exit 0

cd "$out" || exit 0
printf 'Live status written by .github/workflows/stream-247.yml on main. Read by docs/console.html.\n' > README.md
export GIT_TERMINAL_PROMPT=0
git init -q -b live-status \
  && git config user.name "github-actions[bot]" \
  && git config user.email "41898282+github-actions[bot]@users.noreply.github.com" \
  && git add -A \
  && git commit -qm "status $(date -u +%Y-%m-%dT%H:%MZ)" \
  && timeout 60 git push -qf "$REMOTE" live-status >/dev/null 2>&1
exit 0
