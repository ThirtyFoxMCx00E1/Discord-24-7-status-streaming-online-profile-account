# Discord 24/7 streaming status

Keeps a Discord account showing a **Streaming** status 24/7 with a YouTube link,
a live clock and two buttons (Watch / Subscribe, or Watch / Join).

Based on Streaming-24-7-RPC by mrnekrozyt (see LICENSE).

> **Heads up:** this signs in with a *user account token*. Discord's Terms of Service
> don't allow automating user accounts, so the account can be limited or banned.
> Use at your own risk, preferably on an alt account.

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
   - Optional variables: `BUTTONS`, `VIDEO_URL`, `STATUS`, `TIMEZONE`
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

## Never share your token

Anyone with your token can log in as you without the password or 2FA.
