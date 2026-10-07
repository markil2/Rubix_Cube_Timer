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

- Timer input: space (or touch-and-hold on phones) with WCA 15s inspection, or the Arduino cube sensor over USB. Both feed one state machine (`src/timer/timerMachine.ts`).
- Data: `src/data/api.ts` is the only place the UI gets data from. History is loaded from `GET /api/solves` (paged, 100 at a time) and new solves are saved with `POST /api/solves`; stats are computed from that history. The profile is still local mock data. Run `VITE_USE_MOCK=true npm run dev` to use built-in demo solves with no backend.

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

`POST /api/solves` body: `{ "time": 12.347, "scramble": "R U R' …", "penalty": null | "+2" | "DNF" }`. If the backend is unreachable, solves stay on the page marked "Not synced" and are re-sent when History's Retry succeeds.

## Deploying the frontend (Vercel)

- Root directory `frontend`, framework Vite (build `npm run build`, output `dist`). `frontend/vercel.json` rewrites all routes to `index.html` so `/history` etc. work on refresh.
- Set `VITE_API_URL` to the deployed backend's origin (e.g. `https://rubtimer-api.onrender.com`) and add the Vercel URL to the backend's `CORS_ORIGINS`.
