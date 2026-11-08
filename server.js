const express = require("express");
const server = express();

// Only needed on hosts that want an open web port (Replit, Railway.app, ...).
// Started when PORT or KEEPALIVE=1 is set; skipped on GitHub Actions / MP Railway.
const PORT = process.env.PORT || 3000;

function keepAlive(isDiscordReady = () => true) {
  server.all("/", (req, res) => {
    res.send(`Bot is alive! Server pinged at ${new Date().toLocaleString()}`);
  });

  server.get("/health", (req, res) => {
    if (isDiscordReady()) return res.status(200).send("ok");
    res.status(503).send("discord not ready");
  });

  server
    .listen(PORT, () => console.log(`Keep-alive server on port ${PORT}`))
    .on("error", (err) => console.warn("Keep-alive server not started:", err.message));
}

module.exports = keepAlive;
