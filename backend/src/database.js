import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const migrationsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations",
);

function runMigrations(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const isApplied = database.prepare(
    "SELECT 1 FROM schema_migrations WHERE filename = ?",
  );
  const recordMigration = database.prepare(
    "INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)",
  );

  const filenames = fs
    .readdirSync(migrationsDirectory)
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of filenames) {
    if (isApplied.get(filename)) continue;

    const sql = fs.readFileSync(path.join(migrationsDirectory, filename), "utf8");
    database.exec("BEGIN IMMEDIATE;");
    try {
      database.exec(sql);
      recordMigration.run(filename, new Date().toISOString());
      database.exec("COMMIT;");
    } catch (error) {
      database.exec("ROLLBACK;");
      throw error;
    }
  }
}

export function createDatabase(filename) {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }

  const database = new DatabaseSync(filename);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  runMigrations(database);

  return database;
}
