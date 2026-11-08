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

## Deploy 24/7 on Railway

1. Push this repo to GitHub.
2. Railway > New Project > Deploy from GitHub repo > pick this repo.
3. In the Railway service > **Variables**, add `TOKEN` and `YT_CHANNEL_URL`.
4. Service > Settings > Networking > **Generate Domain** (needed for the watchdog).
5. Railway project > Settings > Tokens > create a **project token**.
6. In GitHub: repo > Settings > Secrets and variables > Actions, add:
   - `RAILWAY_TOKEN` - the project token from step 5
   - `RAILWAY_SERVICE` - the Railway service name or ID
   - `RAILWAY_URL` - e.g. `https://your-app.up.railway.app`

What runs:

- `railway.json` restarts the app if it crashes (up to 10 times).
- `.github/workflows/deploy.yml` redeploys on every push to `main`.
- `.github/workflows/watchdog.yml` checks `/health` every 30 minutes and
  redeploys if the app is down or Discord is disconnected.

Your Discord `TOKEN` goes **only** in Railway Variables - never in GitHub secrets, code or commits.

## Never share your token

Anyone with your token can log in as you without the password or 2FA.
