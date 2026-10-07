CREATE TABLE solves (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  time REAL NOT NULL CHECK (time > 0),
  scramble TEXT,
  penalty TEXT CHECK (penalty IS NULL OR penalty IN ('DNF', '+2')),
  created_at TEXT NOT NULL
);

CREATE INDEX solves_user_created_at_idx
  ON solves (user_id, created_at DESC);
