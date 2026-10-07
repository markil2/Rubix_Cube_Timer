# Rubix Cube Timer

A Rubik's Cube timer app.

## Structure

- `frontend/` — UI, maintained separately; Codex must not modify it
- `backend/` — API and data storage; this is the only application area Codex works on

## Codex scope

Codex is configured for backend development only. It may implement APIs, data
storage, backend tests, and backend configuration. It must not create or change
frontend code. See `AGENTS.md` for the repository-level rules.

## Workflow

- `main` is the stable branch. Don't commit to it directly.
- Frontend work is handled outside this Codex workspace.
- Do backend work on `backend` (or backend feature branches off it).
- Merge into `main` through pull requests.

## Run the backend

The backend requires Node.js 22.13 or newer. From `backend/`:

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs at `http://localhost:3000` and stores solves in a local SQLite
database. Run the automated tests with `npm test`. See `backend/API.md` for the
complete frontend integration contract.
