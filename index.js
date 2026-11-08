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

keepAlive(() => client.isReady());

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
  console.log(`${client.user.tag} - rich presence started!`);

  const { timeString, currentHour } = getTimeData();
  const emoji = getEmoji(currentHour);

  const r = new Discord.RichPresence(client)
    .setApplicationId("1426964594215227456")
    .setType("STREAMING")
    .setURL(VIDEO_URL) // must be a YouTube video link
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
const token = process.env.TOKEN;
if (!token) {
  console.error("Missing TOKEN. Set it as an environment variable (see README).");
  process.exit(1);
}

// If something fatal happens, exit so Railway restarts the app.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

client.login(token).catch((err) => {
  console.error("Login failed:", err.message);
  process.exit(1);
});
