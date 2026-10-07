# Rubix Cube Timer

A Rubik's Cube timer app.

## Structure

- `frontend/` — UI
- `backend/` — API and data storage

## Workflow

- `main` is the stable branch. Don't commit to it directly.
- Do frontend work on `frontend` (or feature branches off it) and backend work on `backend`.
- Merge into `main` through pull requests.

## Frontend

React + Vite + TypeScript, in `frontend/`.

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build   # typecheck + production build
```

- Timer input: space (or touch-and-hold on phones) with WCA 15s inspection. Arduino events (`{"event":"start"}`, `{"event":"stop","time":12.47}`) are parsed in `src/input/arduinoSource.ts` and drive the same state machine (`src/timer/timerMachine.ts`).
- Data: `src/data/api.ts` is the only place the UI gets data from. It's backed by mock data for now; swap its internals for `fetch()` calls to the backend.
