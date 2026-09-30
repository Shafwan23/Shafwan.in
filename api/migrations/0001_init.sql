-- A run is one play of one game. The server holds its state, so the score it
-- ends with is computed here, never sent by the browser.
CREATE TABLE runs (
  id          TEXT PRIMARY KEY,
  game        TEXT    NOT NULL,
  state       TEXT    NOT NULL,             -- JSON, private to the server
  step        INTEGER NOT NULL DEFAULT 0,   -- optimistic lock for concurrent answers
  status      TEXT    NOT NULL,             -- live | scored | claimed
  score       INTEGER,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
CREATE INDEX runs_created ON runs (created_at);

-- The public boards. One row per claimed run.
CREATE TABLE scores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game        TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  name_key    TEXT    NOT NULL,             -- case-folded name; anonymous rows get a unique key
  score       INTEGER NOT NULL,
  run_id      TEXT    NOT NULL UNIQUE,
  created_at  INTEGER NOT NULL
);
CREATE INDEX scores_board ON scores (game, score DESC, created_at);

-- Anonymous notes from the contact page. No IP or identity is stored with them.
CREATE TABLE messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  body        TEXT    NOT NULL,
  reply_to    TEXT,
  created_at  INTEGER NOT NULL,
  delivered   INTEGER NOT NULL DEFAULT 0,
  attempts    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX messages_pending ON messages (delivered, attempts);

-- Rate-limit ledger. ip_hash is a keyed hash, pruned daily.
CREATE TABLE hits (
  bucket      TEXT    NOT NULL,
  ip_hash     TEXT    NOT NULL,
  at          INTEGER NOT NULL
);
CREATE INDEX hits_lookup ON hits (bucket, ip_hash, at);
