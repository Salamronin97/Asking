const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const railwayVolumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.RAILWAY_VOLUME_PATH || "";
  if (railwayVolumePath) return path.join(railwayVolumePath, "app.db");
  return path.join(__dirname, "data", "app.db");
}

const DB_PATH = resolveDbPath();
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
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      company TEXT,
      position TEXT,
      locale TEXT,
      theme TEXT,
      date_format TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      password_hash TEXT,
      google_sub TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      audience TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      allow_multiple_responses INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT,
      ends_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      design_json TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(survey_id) REFERENCES surveys(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      page_id INTEGER,
      question_text TEXT NOT NULL,
      help_text TEXT,
      type TEXT NOT NULL,
      options_json TEXT,
      required INTEGER NOT NULL DEFAULT 1,
      question_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
      FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE SET NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      participant_hash TEXT,
      respondent_hash TEXT,
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

  await run(`
    CREATE TABLE IF NOT EXISTS question_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      original_name TEXT,
      mime TEXT,
      size INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  const surveyColumns = await all("PRAGMA table_info(surveys)");
  if (!surveyColumns.some((column) => column.name === "owner_user_id")) {
    await run("ALTER TABLE surveys ADD COLUMN owner_user_id INTEGER");
  }
  const userColumns = await all("PRAGMA table_info(users)");
  if (!userColumns.some((column) => column.name === "username")) {
    await run("ALTER TABLE users ADD COLUMN username TEXT");
  }
  if (!userColumns.some((column) => column.name === "email_verified")) {
    await run("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0");
  }
  if (!userColumns.some((column) => column.name === "company")) {
    await run("ALTER TABLE users ADD COLUMN company TEXT");
  }
  if (!userColumns.some((column) => column.name === "position")) {
    await run("ALTER TABLE users ADD COLUMN position TEXT");
  }
  if (!userColumns.some((column) => column.name === "locale")) {
    await run("ALTER TABLE users ADD COLUMN locale TEXT");
  }
  if (!userColumns.some((column) => column.name === "updated_at")) {
    await run("ALTER TABLE users ADD COLUMN updated_at TEXT");
  }
  if (!userColumns.some((column) => column.name === "theme")) {
    await run("ALTER TABLE users ADD COLUMN theme TEXT");
  }
  if (!userColumns.some((column) => column.name === "date_format")) {
    await run("ALTER TABLE users ADD COLUMN date_format TEXT");
  }
  const questionColumns = await all("PRAGMA table_info(questions)");
  const pageColumns = await all("PRAGMA table_info(pages)");
  if (!pageColumns.some((column) => column.name === "design_json")) {
    await run("ALTER TABLE pages ADD COLUMN design_json TEXT");
  }
  if (!questionColumns.some((column) => column.name === "page_id")) {
    await run("ALTER TABLE questions ADD COLUMN page_id INTEGER");
  }
  if (!questionColumns.some((column) => column.name === "help_text")) {
    await run("ALTER TABLE questions ADD COLUMN help_text TEXT");
  }
  const responseColumns = await all("PRAGMA table_info(responses)");
  if (!responseColumns.some((column) => column.name === "respondent_hash")) {
    await run("ALTER TABLE responses ADD COLUMN respondent_hash TEXT");
  }
  const sessionColumns = await all("PRAGMA table_info(auth_sessions)");
  if (!sessionColumns.some((column) => column.name === "user_agent")) {
    await run("ALTER TABLE auth_sessions ADD COLUMN user_agent TEXT");
  }
  if (!sessionColumns.some((column) => column.name === "ip_address")) {
    await run("ALTER TABLE auth_sessions ADD COLUMN ip_address TEXT");
  }

  const now = new Date().toISOString();
  const surveys = await all("SELECT id FROM surveys ORDER BY id ASC");
  for (const survey of surveys) {
    const existingPages = await all("SELECT id FROM pages WHERE survey_id = ? ORDER BY order_index ASC, id ASC", [survey.id]);
    if (!existingPages.length) {
      await run(
        `INSERT INTO pages (survey_id, title, order_index, created_at, updated_at)
         VALUES (?, ?, 0, ?, ?)`,
        [survey.id, "Страница 1", now, now]
      );
    }

    const firstPage = await get("SELECT id FROM pages WHERE survey_id = ? ORDER BY order_index ASC, id ASC LIMIT 1", [survey.id]);
    if (!firstPage) continue;

    await run("UPDATE questions SET page_id = ? WHERE survey_id = ? AND (page_id IS NULL OR page_id = 0)", [
      firstPage.id,
      survey.id
    ]);
  }

  const questions = await all("SELECT id, options_json FROM questions");
  for (const question of questions) {
    const existing = await get("SELECT COUNT(*) as count FROM options WHERE question_id = ?", [question.id]);
    if ((existing?.count || 0) > 0) continue;
    let parsed = [];
    try {
      parsed = JSON.parse(question.options_json || "[]");
    } catch {
      parsed = [];
    }
    if (!Array.isArray(parsed) || !parsed.length) continue;
    for (let i = 0; i < parsed.length; i += 1) {
      const text = String(parsed[i] || "").trim();
      if (!text) continue;
      await run("INSERT INTO options (question_id, text, order_index) VALUES (?, ?, ?)", [question.id, text, i]);
    }
  }

  await run("CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status)");
  await run("CREATE INDEX IF NOT EXISTS idx_surveys_owner ON surveys(owner_user_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_pages_survey ON pages(survey_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_pages_order ON pages(survey_id, order_index)");
  await run("CREATE INDEX IF NOT EXISTS idx_questions_survey ON questions(survey_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_questions_page ON questions(page_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_responses_survey ON responses(survey_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_responses_respondent_hash ON responses(respondent_hash)");
  await run("CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_question_media_question ON question_media(question_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  await run("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username) WHERE username IS NOT NULL");
  await run("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)");
  await run("CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub)");
  await run("CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at)");
  await run(
    "CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at)"
  );
  await run("CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at)");
}

module.exports = {
  db,
  DB_PATH,
  init,
  run,
  all,
  get
};
