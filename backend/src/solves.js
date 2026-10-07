import { randomUUID } from "node:crypto";
import { HttpError } from "./http-error.js";

const VALID_PENALTIES = new Set([null, "DNF", "+2"]);

function toSolve(row) {
  return {
    id: row.id,
    time: row.time,
    scramble: row.scramble,
    penalty: row.penalty,
    createdAt: row.created_at,
  };
}

export function validateSolve(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "INVALID_BODY", "Request body must be a JSON object.");
  }

  if (typeof body.time !== "number" || !Number.isFinite(body.time) || body.time <= 0) {
    throw new HttpError(
      400,
      "INVALID_SOLVE_TIME",
      "time must be a finite number greater than zero.",
    );
  }

  const penalty = body.penalty ?? null;
  if (!VALID_PENALTIES.has(penalty)) {
    throw new HttpError(400, "INVALID_PENALTY", 'penalty must be null, "DNF", or "+2".');
  }

  if (body.scramble != null && (typeof body.scramble !== "string" || body.scramble.length > 1000)) {
    throw new HttpError(
      400,
      "INVALID_SCRAMBLE",
      "scramble must be a string no longer than 1000 characters.",
    );
  }

  return {
    time: body.time,
    scramble: body.scramble?.trim() || null,
    penalty,
  };
}

export function createSolveRepository(database) {
  const insert = database.prepare(`
    INSERT INTO solves (id, user_id, time, scramble, penalty, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const list = database.prepare(`
    SELECT id, time, scramble, penalty, created_at
    FROM solves
    WHERE user_id = ?
    ORDER BY created_at DESC, rowid DESC
    LIMIT ? OFFSET ?
  `);
  const allForStats = database.prepare(`
    SELECT time, penalty
    FROM solves
    WHERE user_id = ?
  `);

  return {
    create(userId, input) {
      const solve = {
        id: randomUUID(),
        userId,
        ...input,
        createdAt: new Date().toISOString(),
      };
      insert.run(
        solve.id,
        solve.userId,
        solve.time,
        solve.scramble,
        solve.penalty,
        solve.createdAt,
      );
      return {
        id: solve.id,
        time: solve.time,
        scramble: solve.scramble,
        penalty: solve.penalty,
        createdAt: solve.createdAt,
      };
    },

    list(userId, { limit, offset }) {
      return list.all(userId, limit, offset).map(toSolve);
    },

    stats(userId) {
      const rows = allForStats.all(userId);
      const completedTimes = rows
        .filter((row) => row.penalty !== "DNF")
        .map((row) => row.time + (row.penalty === "+2" ? 2 : 0));

      if (completedTimes.length === 0) {
        return {
          personalBest: null,
          average: null,
          solveCount: rows.length,
          completedCount: 0,
          dnfCount: rows.length,
          worst: null,
        };
      }

      return {
        personalBest: Math.min(...completedTimes),
        average: completedTimes.reduce((sum, time) => sum + time, 0) / completedTimes.length,
        solveCount: rows.length,
        completedCount: completedTimes.length,
        dnfCount: rows.length - completedTimes.length,
        worst: Math.max(...completedTimes),
      };
    },
  };
}
