import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function loadConfig(environment = process.env) {
  const port = Number.parseInt(environment.PORT ?? "3000", 10);

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535");
  }

  return {
    port,
    databasePath: path.resolve(
      backendDirectory,
      environment.DATABASE_PATH ?? "./data/solves.sqlite",
    ),
    corsOrigins: (environment.CORS_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}
