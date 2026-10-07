# Backend API

Local base URL: `http://localhost:3000`

All `/api` requests may include an `X-User-Id` header. Until real authentication is
added, it defaults to `dev-user`. The frontend should send a stable development
user ID when testing multiple users. Do not treat this header as secure
authentication in production.

All errors use this shape:

```json
{
  "error": {
    "code": "INVALID_SOLVE_TIME",
    "message": "time must be a finite number greater than zero."
  }
}
```

## Save a solve

`POST /api/solves`

Request body:

```json
{
  "time": 12.47,
  "scramble": "R U R' F2 D L'",
  "penalty": null
}
```

- `time` is the raw solve time in seconds and must be a positive JSON number.
- `scramble` is optional (maximum 1000 characters).
- `penalty` is optional and must be `null`, `"+2"`, or `"DNF"`.

Success: `201 Created`

```json
{
  "id": "84e803cb-acf6-4491-bf1d-fba248eb47a4",
  "time": 12.47,
  "scramble": "R U R' F2 D L'",
  "penalty": null,
  "createdAt": "2026-10-06T20:00:00.000Z"
}
```

Possible errors: `INVALID_BODY`, `INVALID_SOLVE_TIME`, `INVALID_SCRAMBLE`, and
`INVALID_PENALTY` (`400`).

```js
const response = await fetch("http://localhost:3000/api/solves", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-Id": "dev-user",
  },
  body: JSON.stringify({
    time: 12.47,
    scramble: "R U R' F2 D L'",
    penalty: null,
  }),
});

if (!response.ok) throw new Error("Could not save solve");
const solve = await response.json();
```

## List solves

`GET /api/solves?limit=50&offset=0`

Returns the current user's newest solves first. `limit` defaults to 50 and may
range from 1 to 100. `offset` defaults to 0.

Success: `200 OK`

```json
[
  {
    "id": "84e803cb-acf6-4491-bf1d-fba248eb47a4",
    "time": 12.47,
    "scramble": "R U R' F2 D L'",
    "penalty": null,
    "createdAt": "2026-10-06T20:00:00.000Z"
  }
]
```

```js
const response = await fetch("http://localhost:3000/api/solves?limit=20", {
  headers: { "X-User-Id": "dev-user" },
});
const solves = await response.json();
```

Possible errors: `INVALID_LIMIT` or `INVALID_OFFSET` (`400`).

## Get statistics

`GET /api/stats`

`+2` adds two seconds to the effective time. DNF solves count toward
`solveCount` and `dnfCount`, but are excluded from personal best, average, and
worst. Empty numerical statistics are returned as `null`.

Success: `200 OK`

```json
{
  "personalBest": 9.82,
  "average": 12.476666666666667,
  "solveCount": 4,
  "completedCount": 3,
  "dnfCount": 1,
  "worst": 15.14
}
```

```js
const response = await fetch("http://localhost:3000/api/stats", {
  headers: { "X-User-Id": "dev-user" },
});
const stats = await response.json();
```

## Health check

`GET /health` returns `200 OK` with `{ "status": "ok" }`.
