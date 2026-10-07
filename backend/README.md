# Rubix Cube Timer Backend

## Architecture decisions

- **Runtime:** Node.js 22.13 or newer with Express. The API is intentionally
  small and split into configuration, HTTP, persistence, and solve-domain
  modules.
- **Database:** SQLite provides durable local storage without requiring a
  separate database server. Numbered SQL migrations are applied automatically
  at startup and recorded in `schema_migrations`.
- **Time precision:** Raw solve times are stored as SQLite `REAL` values and are
  not rounded by the application. A `+2` penalty is applied only while
  calculating statistics, so the original Arduino-reported time is preserved.
- **Identity:** `X-User-Id` is a temporary development identity mechanism, not
  authentication. The database associates every solve with a user ID now so a
  verified identity can replace the middleware later without redesigning the
  solve data.

For a deployed student project, use a managed authentication provider that
issues verifiable tokens (for example, Supabase Auth, Clerk, or Firebase Auth).
The backend should verify the token, take the user ID from its claims, and never
trust a client-supplied user ID in production.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

The default URL is `http://localhost:3000`. Data is written to
`data/solves.sqlite`, which is intentionally ignored by Git.

Run the test suite:

```bash
npm test
```

See [API.md](./API.md) for endpoints, payloads, errors, and frontend examples.

## Current data model

Each solve stores:

- UUID solve ID
- User ID
- Positive raw time in seconds
- Optional scramble
- Optional `+2` or `DNF` penalty
- UTC creation timestamp

The current statistics endpoint returns personal best, arithmetic average,
total solve count, completed count, DNF count, and worst completed solve.
Rolling WCA-style averages can be added in a later phase.
