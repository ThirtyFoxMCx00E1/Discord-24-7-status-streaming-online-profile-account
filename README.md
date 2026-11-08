# Discord 24/7 streaming status

Keeps a Discord account showing a **Streaming** status 24/7 with a YouTube link,
a live clock and two buttons (Watch / Subscribe, or Watch / Join).

Based on Streaming-24-7-RPC by mrnekrozyt (see LICENSE).

> **Heads up:** this signs in with a *user account token*. Discord's Terms of Service
> don't allow automating user accounts, so the account can be limited or banned.
> Use at your own risk, preferably on an alt account.
>
> **GitHub's terms too:** for GitHub-hosted runners, the Actions terms say Actions should not be used
> for activity unrelated to building, testing, deploying or publishing the project in the repository,
> and misuse can lead to cancelled jobs, limited Actions or disabled repositories. A 24/7 bot on Actions
> (Option A) is outside that, so treat Option A as a stop-gap and prefer Option B or C on a machine you
> control.

## Setup

1. `npm install`
2. Set environment variables (see `.env.example`):
   - `TOKEN` - your account token (**secret**, never commit it)
   - `YT_CHANNEL_URL` - e.g. `https://www.youtube.com/@yourhandle`
3. `npm start`

## Buttons

Discord allows **2** custom buttons. Choose which two with `BUTTONS`:

| Value       | Button    | Link                              |
|-------------|-----------|-----------------------------------|
| `watch`     | Watch     | `VIDEO_URL`                       |
| `subscribe` | Subscribe | `YT_CHANNEL_URL?sub_confirmation=1` |
| `join`      | Join      | `YT_CHANNEL_URL/join` (channel memberships) |

Default: `BUTTONS=watch,subscribe`.

## Run it 24/7

### Option A - GitHub Actions runner (like wagu's cloud runner)

No server needed. `.github/workflows/stream-247.yml` runs the bot in ~5 h 40 min shifts and
queues the next shift itself, starting it a few minutes early so the status never drops.
An hourly check restarts the chain if a shift ever failed, and a push to `main` is hot-loaded
by the shift that is already running.

1. Keep the repo **public** (a private repo would use up the free Actions minutes in about a day and a half).
2. Settings > Secrets and variables > Actions:
   - Secret `TOKEN` - your Discord token
   - Variable `YT_CHANNEL_URL` - e.g. `https://www.youtube.com/@yourhandle`
   - Variable `DISCORD_USER_ID` - your numeric Discord user ID. The run stops before logging in if `TOKEN`
     belongs to a different account, so the token and the account always match.
   - Optional variables: `APPLICATION_ID`, `BUTTONS`, `VIDEO_URL`, `STATUS`, `TIMEZONE`
3. Actions > **Streaming 24/7 runner** > Run workflow (once).
4. Stop it: set the variable `STREAM_RUNNER` to `off`.

### Option B - MP Railway (your own server or a Termux phone)

On the machine that runs MP Railway:

```
sudo mp-railway add stream https://github.com/ThirtyFoxMCx00E1/Discord-24-7-status-streaming-online-profile-account.git
sudo mp-railway env set TOKEN "" stream            # asks for the token, hidden
sudo mp-railway env set YT_CHANNEL_URL https://www.youtube.com/@yourhandle stream
sudo mp-railway status stream
```

It restarts the bot on a crash and after a reboot, and deploys every new commit on `main` within 2 minutes.
A phone or home connection is also less likely to look suspicious to Discord than a datacenter address.

Your Discord token goes **only** in the GitHub secret / MP Railway env - never in code or commits.

### Option C - `run_24_7.sh` (VPS, home PC, Termux, Bot-Hosting.net)

The same restart-by-itself loop as wagu's `server/run_24_7.sh`, for any machine that stays on:

```
cp .env.example .env        # fill in TOKEN and DISCORD_USER_ID
./run_24_7.sh               # start in the background (also after you close the terminal)
./run_24_7.sh status        # running? + last log lines
./run_24_7.sh logs          # follow the log
./run_24_7.sh stop
```

It checks that `TOKEN` belongs to `DISCORD_USER_ID` before starting, restarts the bot if it crashes, and gives
up after three start-ups in a row that die within 90 seconds (usually a reset token) instead of hammering Discord.

On **Bot-Hosting.net** (the panel from the tutorial video): upload the repo, upload your `.env` in the Files tab
instead of pasting the token into `index.js`, and set the startup command to `bash run_24_7.sh run`.

## Website (GitHub Pages)

The `docs/` folder is published as a website by `.github/workflows/pages.yml`
(https://thirtyfoxmcx00e1.github.io/Discord-24-7-status-streaming-online-profile-account/).
It shows the video with **Watch**, **Subscribe** and **Join** buttons - all three, since a web page has no 2-button limit.

1. Repo > Settings > Pages > Source: **GitHub Actions** (once).
2. Edit `docs/config.json` (`title`, `video`, `channel`) and push - the site updates itself.
   Subscribe and Join appear when `channel` is set, e.g. `https://www.youtube.com/@yourhandle`.

## Console

`docs/console.html` is a Bot-Hosting.net-style panel for Option A: Start / Restart / Stop, status, uptime,
the next shift hand-over, the bot's output and the run history. It is published with the site at
`https://thirtyfoxmcx00e1.github.io/Discord-24-7-status-streaming-online-profile-account/console.html`.

- Viewing needs no login. The running shift publishes `status.json` to the `live-status` branch every 10 minutes.
- To press Start / Restart / Stop on the page, open **Settings** and paste a fine-grained GitHub token limited to
  this repository (Actions: read and write, Variables: read and write). It stays in that browser tab only.
  Without a token the buttons open the matching GitHub page instead.
- Stop sets the variable `STREAM_RUNNER` to `off` and cancels the running shift; Start sets it back to `on`.

## Never share your token

Anyone with your token can log in as you without the password or 2FA.

If a token ever ended up in a photo, screenshot, chat or commit, treat it as stolen: change your Discord password
(this invalidates every token of the account), then use the new token.
