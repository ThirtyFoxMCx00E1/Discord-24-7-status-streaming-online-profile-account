// Offline sanity check for the TOKEN before the bot logs in. It never prints the token.
//   TOKEN=...  DISCORD_USER_ID=...  node scripts/check-token.js
// A Discord token starts with your numeric user ID (base64 encoded), so we can prove the token
// belongs to the account you expect without contacting Discord.
const token = process.env.TOKEN || "";
const expected = (process.env.DISCORD_USER_ID || "").trim();

function stop(msg) {
  console.error("Token check failed: " + msg);
  process.exit(1);
}

if (!token) stop("TOKEN is empty.");
if (/\s/.test(token)) stop("TOKEN contains a space or line break. Paste it again without any extra characters.");
if (/^["']|["']$/.test(token)) stop("TOKEN is wrapped in quotes. Paste only the token itself.");

let id = "";
try {
  id = Buffer.from(token.split(".")[0], "base64url").toString("utf8");
} catch (e) {
  id = "";
}
const numeric = /^\d{17,20}$/.test(id);

if (expected) {
  if (!/^\d{17,20}$/.test(expected)) stop("DISCORD_USER_ID must be the 17-20 digit numeric user ID.");
  if (!numeric) stop("could not read an account ID from the TOKEN, so it cannot be matched to DISCORD_USER_ID.");
  if (id !== expected) stop("this TOKEN belongs to a different account than DISCORD_USER_ID.");
  console.log("TOKEN matches the account in DISCORD_USER_ID.");
} else if (numeric) {
  console.log("TOKEN format looks right. Set DISCORD_USER_ID to also check which account it belongs to.");
} else {
  console.warn("TOKEN is in an unusual format; continuing, but it could not be matched to an account.");
}
