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

## Frontend

React + Vite + TypeScript, in `frontend/`.

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build   # typecheck + production build
```

- Timer input: space (or touch-and-hold on phones) with WCA 15s inspection, or the Arduino cube sensor over USB. Both feed one state machine (`src/timer/timerMachine.ts`).
- Data: `src/data/api.ts` is the only place the UI gets data from. Solves are saved with `POST /api/solves`; history and profile still load mock data until the backend has GET endpoints.

## Arduino

The Arduino sends newline-terminated messages at **9600 baud**: `START` when the cube is lifted, `STOP:12.347` (seconds) when it is put back. The browser reads them with Web Serial (`src/input/webSerial.ts`, parsed in `src/input/arduinoSource.ts`); the Arduino never talks to the backend.

- Click **Connect** next to "Arduino disconnected" (top right of the timer page) and pick the board. Chrome/Edge only, on `localhost` or HTTPS.
- Close the Arduino IDE Serial Monitor first: only one program can hold the port.
- Inspection: press space, lift the cube to inspect, put it down (timer turns green), lift again to start the solve.

## Backend

In development, Vite forwards `/api/*` to `http://localhost:3000`. Use another port with:

```bash
BACKEND_URL=http://localhost:8000 npm run dev
```

`POST /api/solves` body: `{ "time": 12.347, "scramble": "R U R' …", "penalty": null | "+2" | "DNF" }`. Until it responds with a 2xx, solves stay in the page and show "Not synced".
