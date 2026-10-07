import express from "express";
import { HttpError } from "./http-error.js";
import { currentUser } from "./middleware/current-user.js";
import { createSolveRepository, validateSolve } from "./solves.js";

function parsePagination(request) {
  const limit = request.query.limit === undefined ? 50 : Number(request.query.limit);
  const offset = request.query.offset === undefined ? 0 : Number(request.query.offset);

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(400, "INVALID_LIMIT", "limit must be an integer from 1 to 100.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw new HttpError(400, "INVALID_OFFSET", "offset must be a non-negative integer.");
  }

  return { limit, offset };
}

export function createApp({ database, corsOrigins = [] }) {
  const app = express();
  const solves = createSolveRepository(database);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use((request, response, next) => {
    const origin = request.get("Origin");
    if (origin && corsOrigins.includes(origin)) {
      response.set("Access-Control-Allow-Origin", origin);
      response.set("Vary", "Origin");
      response.set("Access-Control-Allow-Headers", "Content-Type, X-User-Id");
      response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }
    next();
  });

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api", currentUser);

  app.post("/api/solves", (request, response) => {
    const input = validateSolve(request.body);
    response.status(201).json(solves.create(request.user.id, input));
  });

  app.get("/api/solves", (request, response) => {
    response.json(solves.list(request.user.id, parsePagination(request)));
  });

  app.get("/api/stats", (request, response) => {
    response.json(solves.stats(request.user.id));
  });

  app.use((_request, _response, next) => {
    next(new HttpError(404, "NOT_FOUND", "Route not found."));
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json({
        error: { code: "INVALID_JSON", message: "Request body contains invalid JSON." },
      });
      return;
    }

    const status = error.status ?? 500;
    const payload = {
      error: {
        code: error.code ?? "INTERNAL_ERROR",
        message: status === 500 ? "An unexpected server error occurred." : error.message,
      },
    };
    if (error.details !== undefined) payload.error.details = error.details;
    response.status(status).json(payload);
  });

  return app;
}
