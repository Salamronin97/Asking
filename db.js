const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "app.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function init() {
  await run(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      audience TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      allow_multiple_responses INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT,
      ends_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      type TEXT NOT NULL,
      options_json TEXT,
      required INTEGER NOT NULL DEFAULT 1,
      question_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(survey_id) REFERENCES surveys(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      participant_hash TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(survey_id) REFERENCES surveys(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer_json TEXT,
      FOREIGN KEY(response_id) REFERENCES responses(id) ON DELETE CASCADE,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  await run("CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status)");
  await run("CREATE INDEX IF NOT EXISTS idx_questions_survey ON questions(survey_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_responses_survey ON responses(survey_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id)");
}

module.exports = {
  db,
  init,
  run,
  all,
  get
};
