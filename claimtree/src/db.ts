import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve('data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

export const db = new Database(path.join(DB_DIR, 'claimtree.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS claim_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS claims (
  claim_set_id INTEGER NOT NULL REFERENCES claim_sets(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  type TEXT NOT NULL,
  parent INTEGER,
  preamble TEXT NOT NULL,
  offset INTEGER NOT NULL,
  raw_text TEXT NOT NULL,
  elements_json TEXT NOT NULL,
  PRIMARY KEY (claim_set_id, number)
);

CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_set_id INTEGER NOT NULL REFERENCES claim_sets(id) ON DELETE CASCADE,
  claim_number INTEGER NOT NULL,
  severity TEXT NOT NULL,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  span_start INTEGER NOT NULL,
  span_end INTEGER NOT NULL
);
`);

