const express = require("express");
const server = express();

// Railway/Replit tell the app which port to use through PORT.
const PORT = process.env.PORT || 3000;

function keepAlive(isDiscordReady = () => true) {
  server.all("/", (req, res) => {
    res.send(`Bot is alive! Server pinged at ${new Date().toLocaleString()}`);
  });

  // 200 only while the Discord connection is ready. Used by the GitHub watchdog.
  server.get("/health", (req, res) => {
    if (isDiscordReady()) return res.status(200).send("ok");
    res.status(503).send("discord not ready");
  });

  server.listen(PORT, () => {
    console.log("Server is Ready!! " + Date.now());

    setInterval(
      () => {
        fetch(`http://localhost:${PORT}`)
          .then((res) =>
            console.log(`Keep-alive ping successful: ${res.status}`),
          )
          .catch((err) => console.log("Keep-alive ping failed:", err.message));
      },
      5 * 60 * 1000,
    ); // Ping every 5 minutes
  });
}

module.exports = keepAlive;
