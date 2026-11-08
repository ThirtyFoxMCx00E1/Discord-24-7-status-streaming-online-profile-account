const Discord = require("discord.js-selfbot-v13");

const keepAlive = require("./server.js");

// ---------------------------------------------------------------------------
// CONFIG  (edit these, or override with environment variables)
// ---------------------------------------------------------------------------

// Your stream / video. Must be a YouTube watch link (no ?si= tracking part).
const VIDEO_URL = process.env.VIDEO_URL || "https://www.youtube.com/watch?v=feeQHBrvLiE";

// Your YouTube channel, e.g. https://www.youtube.com/@yourhandle
// Needed for the Subscribe and Join buttons.
const CHANNEL_URL = (process.env.YT_CHANNEL_URL || "").replace(/\/+$/, "");

// Discord allows at most 2 custom buttons on a rich presence.
// Pick any two of: watch, subscribe, join   (comma separated)
const BUTTONS = (process.env.BUTTONS || "watch,subscribe")
  .split(",")
  .map((b) => b.trim().toLowerCase())
  .filter(Boolean);

const STATUS = process.env.STATUS || "idle"; // online, idle, dnd, offline

// The Discord application the presence is attached to. Create one at
// https://discord.com/developers/applications and copy its Application ID.
// It does not have to be tied to your account; it only has to be a real application ID.
const APPLICATION_ID = (process.env.APPLICATION_ID || "133741060487268231").trim();
if (!/^\d{17,20}$/.test(APPLICATION_ID)) {
  console.error("APPLICATION_ID must be the 17-20 digit Application ID from the Discord Developer Portal.");
  process.exit(1);
}
const TIMEZONE = process.env.TIMEZONE || "Asia/Manila";

const BUTTON_DEFS = {
  watch: { label: "Watch", url: VIDEO_URL },
  subscribe: {
    label: "Subscribe",
    url: CHANNEL_URL ? `${CHANNEL_URL}?sub_confirmation=1` : null,
  },
  join: {
    label: "Join",
    url: CHANNEL_URL ? `${CHANNEL_URL}/join` : null,
  },
};

// ---------------------------------------------------------------------------

const client = new Discord.Client({
  readyStatus: false,
  checkUpdate: false,
});

if (process.env.PORT || process.env.KEEPALIVE === "1") {
  keepAlive(() => client.isReady());
}

function getTimeData() {
  const date = new Date();

  const timeString = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  }).format(date);

  const currentHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour12: true,
      hour: "numeric",
    }).format(date),
  );

  return { timeString, currentHour };
}

function getEmoji(h) {
  if (h >= 6 && h < 9) return "🌄";
  if (h >= 9 && h < 16) return "🌞";
  if (h >= 16 && h < 18) return "🌇";
  return "🌛";
}

function addButtons(presence) {
  let added = 0;
  for (const key of BUTTONS) {
    const def = BUTTON_DEFS[key];
    if (!def) {
      console.warn(`Unknown button "${key}" - use watch, subscribe or join.`);
      continue;
    }
    if (!def.url) {
      console.warn(`Skipping "${key}" button: set YT_CHANNEL_URL first.`);
      continue;
    }
    if (added >= 2) {
      console.warn(`Skipping "${key}" button: Discord allows only 2 buttons.`);
      continue;
    }
    presence.addButton(def.label, def.url);
    added++;
  }
}

client.on("ready", async () => {
  // Public Actions logs: do not print the account name there.
  const who = process.env.GITHUB_ACTIONS ? "account" : client.user.tag;
  console.log(`${who} - rich presence started!`);

  const { timeString, currentHour } = getTimeData();
  const emoji = getEmoji(currentHour);

  const r = new Discord.RichPresence(client)
    .setApplicationId(133741060487268231)
    .setType("STREAMING")
    .setURL("https://youtu.be/feeQHBrvLiE?si=GGrT1v4F3U3nP9xX") // must be a YouTube video link
    .setState("​🇲🇾 🇩🇪🇦🇷")
    .setName("𝕴𝖘 𝖙𝖍𝖎𝖘 𝖗𝖊𝖆𝖑𝖑𝖞 𝖑𝖔𝖛𝖊?")
    .setDetails(`${emoji} [${timeString}]`)
    .setStartTimestamp(Date.now())
    .setAssetsLargeImage("https://cdn.discordapp.com/emojis/1523219969276641381.gif")
    .setAssetsLargeText("🇮 🇭🇦🇻🇪 🇫🇦🇱🇱🇪🇳 🇫🇴🇷 🇾🇴🇺")
    .setAssetsSmallImage("https://cdn.discordapp.com/emojis/1523219997051195432.png")
    .setAssetsSmallText("ι'м σвѕєѕѕє∂ ωιтн уσυ");

  addButtons(r);

  client.user.setActivity(r);
  client.user.setPresence({ status: STATUS });

  let prevTime = null;

  setInterval(() => {
    const { timeString, currentHour } = getTimeData();

    if (timeString !== prevTime) {
      r.setDetails(`${getEmoji(currentHour)} [${timeString}]`);
      client.user.setActivity(r);
      prevTime = timeString;
    }
  }, 1000);
});

// The token is read from the environment - never paste it into this file.
// On a fatal error we wait before exiting, so a supervisor that restarts us
// (systemd, MP Railway, the GitHub runner) can't hammer Discord with logins.
function fatal(message, err, delayMs = 30000) {
  console.error(message, err && err.message ? err.message : err || "");
  setTimeout(() => process.exit(1), delayMs);
}

const token = process.env.TOKEN;
if (!token) {
  fatal("Missing TOKEN. Set it as an environment variable / secret (see README).");
} else {
  process.on("unhandledRejection", (err) => fatal("Unhandled rejection:", err));
  client.login(token).catch((err) => fatal("Login failed:", err, 60000));
}
