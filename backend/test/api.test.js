import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/database.js";

describe("solve API", () => {
  let baseUrl;
  let database;
  let server;

  before(async () => {
    database = createDatabase(":memory:");
    await new Promise((resolve, reject) => {
      server = createApp({ database }).listen(0, "127.0.0.1", (error) => {
        if (error) reject(error);
        else resolve();
      });
      server.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    database.close();
  });

  async function request(path, options = {}, userId = "test-user") {
    return fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId,
        ...options.headers,
      },
    });
  }

  test("creates and retrieves a solve", async () => {
    const createResponse = await request("/api/solves", {
      method: "POST",
      body: JSON.stringify({ time: 12.47, scramble: "R U R'", penalty: null }),
    });
    assert.equal(createResponse.status, 201);
    const created = await createResponse.json();
    assert.equal(created.time, 12.47);
    assert.equal(created.scramble, "R U R'");
    assert.match(created.id, /^[0-9a-f-]{36}$/);

    const listResponse = await request("/api/solves");
    assert.equal(listResponse.status, 200);
    const solves = await listResponse.json();
    assert.equal(solves.length, 1);
    assert.equal(solves[0].id, created.id);
  });

  test("rejects invalid solve times", async () => {
    for (const time of [0, -1, "12.47", null]) {
      const response = await request("/api/solves", {
        method: "POST",
        body: JSON.stringify({ time }),
      });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "INVALID_SOLVE_TIME");
    }
  });

  test("calculates personal best and average", async () => {
    for (const time of [10, 20, 15]) {
      await request(
        "/api/solves",
        { method: "POST", body: JSON.stringify({ time }) },
        "stats-user",
      );
    }

    const response = await request("/api/stats", {}, "stats-user");
    assert.deepEqual(await response.json(), {
      personalBest: 10,
      average: 15,
      solveCount: 3,
      completedCount: 3,
      dnfCount: 0,
      worst: 20,
    });
  });

  test("applies +2 penalties to statistics", async () => {
    await request(
      "/api/solves",
      { method: "POST", body: JSON.stringify({ time: 9.5, penalty: "+2" }) },
      "plus-two-user",
    );
    const response = await request("/api/stats", {}, "plus-two-user");
    const stats = await response.json();
    assert.equal(stats.personalBest, 11.5);
    assert.equal(stats.average, 11.5);
    assert.equal(stats.worst, 11.5);
  });

  test("excludes DNF solves from numerical statistics", async () => {
    await request(
      "/api/solves",
      { method: "POST", body: JSON.stringify({ time: 8, penalty: "DNF" }) },
      "dnf-user",
    );
    await request(
      "/api/solves",
      { method: "POST", body: JSON.stringify({ time: 14 }) },
      "dnf-user",
    );
    const response = await request("/api/stats", {}, "dnf-user");
    assert.deepEqual(await response.json(), {
      personalBest: 14,
      average: 14,
      solveCount: 2,
      completedCount: 1,
      dnfCount: 1,
      worst: 14,
    });
  });

  test("keeps different users' solve histories separate", async () => {
    await request(
      "/api/solves",
      { method: "POST", body: JSON.stringify({ time: 7.25 }) },
      "private-user-a",
    );
    const response = await request("/api/solves", {}, "private-user-b");
    assert.deepEqual(await response.json(), []);
  });
});
