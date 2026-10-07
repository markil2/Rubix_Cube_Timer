import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createDatabase } from "./database.js";

const config = loadConfig();
const database = createDatabase(config.databasePath);
const app = createApp({ database, corsOrigins: config.corsOrigins });

const server = app.listen(config.port, () => {
  console.log(`Rubix Cube Timer API listening on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
