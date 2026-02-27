const crypto = require("crypto");
const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const { init, run, all, get } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(attachAuthUser);

const QUESTION_TYPES = new Set(["text", "single", "multi", "rating"]);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const SESSION_COOKIE = "asking_sid";
const SESSION_TTL_DAYS = 30;
const VERIFY_TOKEN_TTL_HOURS = 48;
const RESET_TOKEN_TTL_HOURS = 1;
const APP_BASE_URL = process.env.APP_BASE_URL || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "noreply@asking.local";
const GOOGLE_CLIENT = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const AUTH_RATE_BUCKETS = new Map();
const AUTH_LIMITS = {
  login: { limit: 12, windowMs: 15 * 60 * 1000 },
  register: { limit: 6, windowMs: 20 * 60 * 1000 },
  forgot: { limit: 5, windowMs: 20 * 60 * 1000 },
  reset: { limit: 7, windowMs: 20 * 60 * 1000 },
  verify: { limit: 10, windowMs: 20 * 60 * 1000 },
  resend: { limit: 6, windowMs: 20 * 60 * 1000 }
};

function nowIso() {
  return new Date().toISOString();
}

function safeJsonParse(value, fallback) {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeStatus(status) {
  return ["draft", "published", "archived"].includes(status) ? status : null;
}

function computeIsActive(survey) {
  const now = Date.now();
  if (survey.status !== "published") return false;
  if (survey.starts_at && Date.parse(survey.starts_at) > now) return false;
  if (survey.ends_at && Date.parse(survey.ends_at) < now) return false;
  return true;
}

function parseBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return fallback;
}

function baseUrl(req) {
  if (APP_BASE_URL) return APP_BASE_URL.replace(/\/+$/, "");
  const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`;
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

function randomToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

function rateLimitAuth(action) {
  const conf = AUTH_LIMITS[action];
  return (req, res, next) => {
    if (!conf) return next();
    const forwarded = req.headers["x-forwarded-for"];
    const ipRaw = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.ip || "unknown";
    const ip = String(ipRaw).split(",")[0].trim();
    const key = `${action}:${ip}`;
    const now = Date.now();
    const bucket = AUTH_RATE_BUCKETS.get(key) || [];
    const recent = bucket.filter((ts) => now - ts < conf.windowMs);
    if (recent.length >= conf.limit) {
      return res.status(429).json({ error: "Too many auth attempts. Try again later." });
    }
    recent.push(now);
    AUTH_RATE_BUCKETS.set(key, recent);
    return next();
  };
}

function antiBotPayload(req, res, next) {
  const website = String(req.body?.website || "").trim();
  if (website) return res.status(400).json({ error: "Bot protection triggered" });
  return next();
}

async function issueVerificationToken(userId) {
  const token = randomToken(24);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  await run("DELETE FROM email_verification_tokens WHERE user_id = ?", [userId]);
  await run(
    "INSERT INTO email_verification_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [token, userId, createdAt, expiresAt]
  );
  return token;
}

async function issueResetToken(userId) {
  const token = randomToken(24);
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  await run("DELETE FROM password_reset_tokens WHERE user_id = ?", [userId]);
  await run(
    "INSERT INTO password_reset_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [token, userId, createdAt, expiresAt]
  );
  return token;
}

function getMailer() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    family: 4,
    connectionTimeout: 15000,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

async function sendEmail({ to, subject, text, html }) {
  const mailer = getMailer();
  if (!mailer) {
    console.log("[mail disabled] to=%s subject=%s text=%s", to, subject, text);
    return false;
  }
  await mailer.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html
  });
  return true;
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const entries = header
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const index = chunk.indexOf("=");
      if (index === -1) return [chunk, ""];
      return [chunk.slice(0, index), decodeURIComponent(chunk.slice(index + 1))];
    });
  return Object.fromEntries(entries);
}

function setSessionCookie(req, res, token, expiresAtIso) {
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAtIso).toUTCString()}`
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(req, res) {
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, oldHash] = stored.split(":");
  const currentHash = crypto.scryptSync(password, salt, 64).toString("hex");
  const left = Buffer.from(oldHash, "hex");
  const right = Buffer.from(currentHash, "hex");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function createSession(userId) {
  const token = crypto.randomBytes(48).toString("hex");
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await run(
    "INSERT INTO auth_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    [token, userId, createdAt, expiresAt]
  );
  return { token, expiresAt };
}

function hashParticipant(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.ip || "").split(",")[0].trim();
  const userAgent = req.headers["user-agent"] || "";
  return crypto.createHash("sha256").update(`${ip}|${userAgent}`).digest("hex");
}

function normalizeQuestion(question, index) {
  const text = String(question?.text || "").trim();
  const type = String(question?.type || "").trim();
  const rawOptions = Array.isArray(question?.options) ? question.options : [];
  const options = rawOptions.map((item) => String(item).trim()).filter(Boolean);
  const required = question?.required === false ? 0 : 1;

  return {
    text,
    type,
    options,
    required,
    order: Number.isFinite(question?.order) ? question.order : index
  };
}

function validateSurveyPayload(payload) {
  const fields = [];
  const title = String(payload?.title || "").trim();
  const description = String(payload?.description || "").trim();
  const audience = String(payload?.audience || "").trim();
  const startsAt = payload?.startsAt ? String(payload.startsAt).trim() : null;
  const endsAt = payload?.endsAt ? String(payload.endsAt).trim() : null;
  const allowMultipleResponses = parseBool(payload?.allowMultipleResponses, false) ? 1 : 0;

  if (title.length < 3) fields.push("title");

  if (!Array.isArray(payload?.questions) || payload.questions.length === 0) {
    fields.push("questions");
  }

  const questions = (payload?.questions || []).map((question, idx) => normalizeQuestion(question, idx));

  questions.forEach((question, idx) => {
    if (question.text.length < 3) fields.push(`questions[${idx}].text`);
    if (!QUESTION_TYPES.has(question.type)) fields.push(`questions[${idx}].type`);
    if ((question.type === "single" || question.type === "multi") && question.options.length < 2) {
      fields.push(`questions[${idx}].options`);
    }
  });

  if (startsAt && Number.isNaN(Date.parse(startsAt))) fields.push("startsAt");
  if (endsAt && Number.isNaN(Date.parse(endsAt))) fields.push("endsAt");
  if (startsAt && endsAt && Date.parse(startsAt) >= Date.parse(endsAt)) fields.push("dateRange");

  return {
    fields,
    payload: { title, description, audience, startsAt, endsAt, allowMultipleResponses, questions }
  };
}

function surveyIsActive(survey) {
  return computeIsActive(survey);
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[,"\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    emailVerified: row.email_verified === 1
  };
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function sanitizeUsernameBase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 24);
}

async function ensureUniqueUsername(baseRaw) {
  const base = sanitizeUsernameBase(baseRaw) || `user${Math.floor(Date.now() / 1000)}`;
  let candidate = base.slice(0, 32);
  let suffix = 0;
  while (true) {
    const existing = await get("SELECT id FROM users WHERE lower(username) = lower(?) LIMIT 1", [candidate]);
    if (!existing) return candidate;
    suffix += 1;
    const tail = String(suffix);
    candidate = `${base.slice(0, Math.max(3, 32 - tail.length))}${tail}`;
  }
}

async function attachAuthUser(req, _res, next) {
  try {
    const token = parseCookies(req)[SESSION_COOKIE];
    req.user = null;
    req.sessionToken = token || null;
    if (!token) return next();

    const session = await get(
      `SELECT s.token, s.user_id, s.expires_at, u.id, u.name, u.username, u.email, u.email_verified
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
      [token]
    );

    if (!session) return next();
    if (Date.parse(session.expires_at) < Date.now()) {
      await run("DELETE FROM auth_sessions WHERE token = ?", [token]);
      return next();
    }

    req.user = toPublicUser(session);
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Authentication required" });
  return next();
}

async function seedDemoSurvey() {
  const existing = await get("SELECT COUNT(*) as count FROM surveys");
  if (existing?.count > 0) return;

  const createdAt = nowIso();
  const surveyResult = await run(
    `INSERT INTO surveys
      (title, description, audience, status, allow_multiple_responses, starts_at, ends_at, created_at, updated_at)
      VALUES (?, ?, ?, 'published', 1, ?, ?, ?, ?)`,
    [
      "Digital Product Benchmark 2026",
      "Исследование пользовательского опыта и приоритетов развития платформы.",
      "Клиенты и product-команда",
      new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      createdAt,
      createdAt
    ]
  );

  const surveyId = surveyResult.lastID;
  const questions = [
    { text: "Как вы оцениваете общий UX платформы?", type: "rating", options: [], required: 1, order: 0 },
    {
      text: "Какую функцию нужно внедрить в первую очередь?",
      type: "single",
      options: ["Расширенная аналитика", "AI-помощник", "Мобильное приложение", "Гибкие роли"],
      required: 1,
      order: 1
    },
    {
      text: "Какие каналы вы используете для привлечения респондентов?",
      type: "multi",
      options: ["Email", "Соцсети", "Сайт", "Оффлайн мероприятия"],
      required: 0,
      order: 2
    },
    { text: "Ваше главное предложение по улучшению", type: "text", options: [], required: 0, order: 3 }
  ];

  for (const q of questions) {
    await run(
      `INSERT INTO questions (survey_id, question_text, type, options_json, required, question_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [surveyId, q.text, q.type, JSON.stringify(q.options), q.required, q.order]
    );
  }

  const questionRows = await all("SELECT id, question_text FROM questions WHERE survey_id = ?", [surveyId]);
  const idsByText = new Map(questionRows.map((item) => [item.question_text, item.id]));

  const responses = [
    {
      "Как вы оцениваете общий UX платформы?": 5,
      "Какую функцию нужно внедрить в первую очередь?": "AI-помощник",
      "Какие каналы вы используете для привлечения респондентов?": ["Email", "Соцсети"],
      "Ваше главное предложение по улучшению": "Добавить фильтры и сегменты в отчётах."
    },
    {
      "Как вы оцениваете общий UX платформы?": 4,
      "Какую функцию нужно внедрить в первую очередь?": "Расширенная аналитика",
      "Какие каналы вы используете для привлечения респондентов?": ["Сайт", "Email"]
    },
    {
      "Как вы оцениваете общий UX платформы?": 5,
      "Какую функцию нужно внедрить в первую очередь?": "Мобильное приложение",
      "Какие каналы вы используете для привлечения респондентов?": ["Соцсети"],
      "Ваше главное предложение по улучшению": "Нужны готовые отраслевые шаблоны анкет."
    }
  ];

  for (let i = 0; i < responses.length; i += 1) {
    const responseResult = await run(
      "INSERT INTO responses (survey_id, participant_hash, created_at) VALUES (?, ?, ?)",
      [surveyId, `seed_${i + 1}`, new Date(Date.now() - i * 3600 * 1000).toISOString()]
    );

    for (const [questionText, value] of Object.entries(responses[i])) {
      const questionId = idsByText.get(questionText);
      if (!questionId) continue;
      await run(
        "INSERT INTO answers (response_id, question_id, answer_json) VALUES (?, ?, ?)",
        [responseResult.lastID, questionId, JSON.stringify(value)]
      );
    }
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: nowIso() });
});

app.get("/auth", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "auth.html"));
});

app.get("/api/auth/google-config", (_req, res) => {
  res.json({ enabled: Boolean(GOOGLE_CLIENT_ID), clientId: GOOGLE_CLIENT_ID || null });
});

app.get("/api/auth/me", (req, res) => {
  res.json({ user: req.user || null });
});

app.post("/api/auth/register", rateLimitAuth("register"), antiBotPayload, async (req, res, next) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    const name = email.split("@")[0] || "User";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const existingEmail = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (existingEmail) return res.status(409).json({ error: "Email already in use" });

    const createdAt = nowIso();
    const result = await run(
      "INSERT INTO users (name, username, email, email_verified, password_hash, created_at) VALUES (?, NULL, ?, 1, ?, ?)",
      [name, email, hashPassword(password), createdAt]
    );

    const session = await createSession(result.lastID);
    setSessionCookie(req, res, session.token, session.expiresAt);
    res.status(201).json({ user: { id: result.lastID, name, email, email_verified: 1 } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", rateLimitAuth("login"), antiBotPayload, async (req, res, next) => {
  try {
    const email = String(req.body?.email || req.body?.identifier || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    if (!email) return res.status(400).json({ error: "Email is required" });
    const user = await get(
      `SELECT id, name, username, email, email_verified, password_hash FROM users WHERE lower(email) = ?`,
      [email]
    );
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const session = await createSession(user.id);
    setSessionCookie(req, res, session.token, session.expiresAt);
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/google", async (req, res, next) => {
  try {
    if (!GOOGLE_CLIENT || !GOOGLE_CLIENT_ID) return res.status(400).json({ error: "Google sign-in is not configured" });
    const credential = String(req.body?.credential || "");
    if (!credential) return res.status(400).json({ error: "Missing Google credential" });

    const ticket = await GOOGLE_CLIENT.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) return res.status(400).json({ error: "Invalid Google profile" });

    const googleSub = payload.sub;
    const email = String(payload.email).toLowerCase();
    const name = String(payload.name || email.split("@")[0] || "Google User").trim();
    const preferredUsername = sanitizeUsernameBase(payload.given_name || name || email.split("@")[0]);

    let user = await get("SELECT id, name, username, email, email_verified FROM users WHERE google_sub = ?", [googleSub]);
    if (!user) {
      const byEmail = await get("SELECT id, name, username, email, email_verified FROM users WHERE email = ?", [email]);
      if (byEmail) {
        let username = byEmail.username;
        if (!username) {
          username = await ensureUniqueUsername(preferredUsername || email.split("@")[0]);
          await run("UPDATE users SET google_sub = ?, username = ?, email_verified = 1 WHERE id = ?", [
            googleSub,
            username,
            byEmail.id
          ]);
        } else {
          await run("UPDATE users SET google_sub = ?, email_verified = 1 WHERE id = ?", [googleSub, byEmail.id]);
        }
        user = { ...byEmail, username, email_verified: 1 };
      } else {
        const username = await ensureUniqueUsername(preferredUsername || email.split("@")[0]);
        const created = await run(
          "INSERT INTO users (name, username, email, email_verified, google_sub, created_at) VALUES (?, ?, ?, 1, ?, ?)",
          [name, username, email, googleSub, nowIso()]
        );
        user = { id: created.lastID, name, username, email, email_verified: 1 };
      }
    }

    const session = await createSession(user.id);
    setSessionCookie(req, res, session.token, session.expiresAt);
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/verify-email", rateLimitAuth("verify"), async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) return res.status(400).json({ error: "Missing verification token" });

    const row = await get(
      `SELECT t.token, t.user_id, t.expires_at, u.id, u.name, u.username, u.email, u.email_verified
       FROM email_verification_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token = ?`,
      [token]
    );
    if (!row) return res.status(400).json({ error: "Invalid verification token" });
    if (Date.parse(row.expires_at) < Date.now()) {
      await run("DELETE FROM email_verification_tokens WHERE token = ?", [token]);
      return res.status(400).json({ error: "Verification token expired" });
    }

    await run("UPDATE users SET email_verified = 1 WHERE id = ?", [row.user_id]);
    await run("DELETE FROM email_verification_tokens WHERE user_id = ?", [row.user_id]);

    const session = await createSession(row.user_id);
    setSessionCookie(req, res, session.token, session.expiresAt);
    res.json({
      ok: true,
      user: {
        id: row.id,
        name: row.name,
        username: row.username,
        email: row.email,
        emailVerified: true
      }
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/resend-verification", rateLimitAuth("resend"), antiBotPayload, async (req, res, next) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) return res.json({ ok: true });

    const user = await get("SELECT id, email, email_verified FROM users WHERE email = ?", [email]);
    if (!user || user.email_verified === 1) return res.json({ ok: true });

    const token = await issueVerificationToken(user.id);
    const verifyLink = `${baseUrl(req)}/auth?verify=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Confirm your Asking Pro email",
      text: `Confirm your email: ${verifyLink}`,
      html: `<p>Confirm your email for Asking Pro:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/forgot-password", rateLimitAuth("forgot"), antiBotPayload, async (req, res, next) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) return res.json({ ok: true });
    const user = await get("SELECT id, email FROM users WHERE email = ?", [email]);
    if (!user) return res.json({ ok: true });

    const token = await issueResetToken(user.id);
    const resetLink = `${baseUrl(req)}/auth?reset=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Asking Pro password",
      text: `Reset your password: ${resetLink}`,
      html: `<p>Reset your Asking Pro password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/reset-password", rateLimitAuth("reset"), antiBotPayload, async (req, res, next) => {
  try {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");
    if (!token) return res.status(400).json({ error: "Missing reset token" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const tokenRow = await get("SELECT token, user_id, expires_at FROM password_reset_tokens WHERE token = ?", [token]);
    if (!tokenRow) return res.status(400).json({ error: "Invalid reset token" });
    if (Date.parse(tokenRow.expires_at) < Date.now()) {
      await run("DELETE FROM password_reset_tokens WHERE token = ?", [token]);
      return res.status(400).json({ error: "Reset token expired" });
    }

    await run("UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?", [
      hashPassword(password),
      tokenRow.user_id
    ]);
    await run("DELETE FROM password_reset_tokens WHERE user_id = ?", [tokenRow.user_id]);
    await run("DELETE FROM auth_sessions WHERE user_id = ?", [tokenRow.user_id]);

    const user = await get("SELECT id, name, username, email, email_verified FROM users WHERE id = ?", [tokenRow.user_id]);
    const session = await createSession(tokenRow.user_id);
    setSessionCookie(req, res, session.token, session.expiresAt);
    res.json({ ok: true, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (token) await run("DELETE FROM auth_sessions WHERE token = ?", [token]);
    clearSessionCookie(req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/account/password", requireAuth, antiBotPayload, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords are required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const user = await get("SELECT id, password_hash FROM users WHERE id = ?", [req.user.id]);
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: "Current password is invalid" });
    }

    await run("UPDATE users SET password_hash = ? WHERE id = ?", [hashPassword(newPassword), req.user.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/account/logout-all", requireAuth, async (req, res, next) => {
  try {
    await run("DELETE FROM auth_sessions WHERE user_id = ?", [req.user.id]);
    clearSessionCookie(req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/account", requireAuth, antiBotPayload, async (req, res, next) => {
  try {
    const password = String(req.body?.password || "");
    if (!password) return res.status(400).json({ error: "Password is required" });

    const user = await get("SELECT id, password_hash FROM users WHERE id = ?", [req.user.id]);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: "Invalid password" });
    }

    await run("DELETE FROM users WHERE id = ?", [req.user.id]);
    clearSessionCookie(req, res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/dashboard", async (_req, res, next) => {
  try {
    const [surveyMetrics, responseMetrics, activeMetrics, recentSurveys] = await Promise.all([
      get("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published FROM surveys"),
      get("SELECT COUNT(*) as total FROM responses"),
      get(
        `SELECT COUNT(*) as active
         FROM surveys
         WHERE status = 'published'
           AND (starts_at IS NULL OR starts_at <= ?)
           AND (ends_at IS NULL OR ends_at >= ?)`,
        [nowIso(), nowIso()]
      ),
      all(
        `SELECT id, title, status, created_at
         FROM surveys
         ORDER BY created_at DESC
         LIMIT 6`
      )
    ]);

    res.json({
      metrics: {
        totalSurveys: surveyMetrics?.total || 0,
        publishedSurveys: surveyMetrics?.published || 0,
        activeSurveys: activeMetrics?.active || 0,
        totalResponses: responseMetrics?.total || 0
      },
      recentSurveys
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/templates", (_req, res) => {
  res.json({
    templates: [
      {
        key: "product-feedback",
        title: "Product Feedback",
        description: "Оценка удовлетворенности и приоритетов продукта.",
        audience: "Пользователи продукта",
        questions: [
          { text: "Как вы оцениваете продукт в целом?", type: "rating", options: [], required: true },
          {
            text: "Что улучшить в первую очередь?",
            type: "single",
            options: ["Скорость", "Дизайн", "Надежность", "Интеграции"],
            required: true
          },
          { text: "Что вам нравится больше всего?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "event-voting",
        title: "Event Voting",
        description: "Голосование за темы и формат мероприятия.",
        audience: "Участники мероприятия",
        questions: [
          {
            text: "За какую тему вы голосуете?",
            type: "single",
            options: ["AI", "Frontend", "Backend", "Product"],
            required: true
          },
          {
            text: "Какие форматы вам интересны?",
            type: "multi",
            options: ["Доклады", "Воркшопы", "Панельные дискуссии", "Нетворкинг"],
            required: true
          },
          { text: "Оставьте комментарий", type: "text", options: [], required: false }
        ]
      }
    ]
  });
});

app.get("/api/surveys", async (req, res, next) => {
  try {
    const status = normalizeStatus(String(req.query.status || ""));
    const q = String(req.query.q || "").trim();

    const filters = [];
    const params = [];

    if (status) {
      filters.push("status = ?");
      params.push(status);
    }

    if (q) {
      filters.push("(title LIKE ? OR description LIKE ?)");
      params.push(`%${q}%`, `%${q}%`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const surveysRaw = await all(
      `SELECT s.id, s.owner_user_id, s.title, s.description, s.audience, s.status, s.allow_multiple_responses, s.starts_at, s.ends_at, s.created_at, s.updated_at,
              (SELECT COUNT(*) FROM responses r WHERE r.survey_id = s.id) as responses_count
       FROM surveys s ${whereClause}
       ORDER BY s.created_at DESC`,
      params
    );

    const surveys = surveysRaw.map((survey) => ({
      ...survey,
      is_active: computeIsActive(survey),
      can_manage: Boolean(req.user && survey.owner_user_id === req.user.id)
    }));

    res.json({ surveys });
  } catch (error) {
    next(error);
  }
});

app.post("/api/surveys/:id/duplicate", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get(
      `SELECT id, title, description, audience, allow_multiple_responses, starts_at, ends_at
       FROM surveys
       WHERE id = ? AND owner_user_id = ?`,
      [surveyId, req.user.id]
    );
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    const questions = await all(
      `SELECT question_text, type, options_json, required, question_order
       FROM questions WHERE survey_id = ? ORDER BY question_order ASC`,
      [surveyId]
    );

    const createdAt = nowIso();
    const clone = await run(
      `INSERT INTO surveys
        (owner_user_id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        `${survey.title} (Copy)`,
        survey.description,
        survey.audience,
        survey.allow_multiple_responses,
        survey.starts_at,
        survey.ends_at,
        createdAt,
        createdAt
      ]
    );

    for (const question of questions) {
      await run(
        `INSERT INTO questions (survey_id, question_text, type, options_json, required, question_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          clone.lastID,
          question.question_text,
          question.type,
          question.options_json,
          question.required,
          question.question_order
        ]
      );
    }

    res.status(201).json({ id: clone.lastID });
  } catch (error) {
    next(error);
  }
});

app.get("/api/surveys/:id", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get(
      `SELECT id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at, created_at, updated_at
       FROM surveys
       WHERE id = ?`,
      [surveyId]
    );

    if (!survey) return res.status(404).json({ error: "Survey not found" });

    const questions = await all(
      `SELECT id, question_text, type, options_json, required, question_order
       FROM questions
       WHERE survey_id = ?
       ORDER BY question_order ASC`,
      [surveyId]
    );

    res.json({
      survey,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.question_text,
        type: q.type,
        options: safeJsonParse(q.options_json, []),
        required: q.required === 1,
        order: q.question_order
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/surveys", requireAuth, async (req, res, next) => {
  try {
    const { fields, payload } = validateSurveyPayload(req.body);
    if (fields.length) return res.status(400).json({ error: "Invalid survey payload", fields });

    const createdAt = nowIso();
    const created = await run(
      `INSERT INTO surveys
        (owner_user_id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        payload.title,
        payload.description,
        payload.audience,
        payload.allowMultipleResponses,
        payload.startsAt,
        payload.endsAt,
        createdAt,
        createdAt
      ]
    );

    for (const question of payload.questions) {
      await run(
        `INSERT INTO questions (survey_id, question_text, type, options_json, required, question_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          created.lastID,
          question.text,
          question.type,
          JSON.stringify(question.options),
          question.required,
          question.order
        ]
      );
    }

    res.status(201).json({ id: created.lastID });
  } catch (error) {
    next(error);
  }
});

app.put("/api/surveys/:id", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get("SELECT id, status FROM surveys WHERE id = ? AND owner_user_id = ?", [surveyId, req.user.id]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.status !== "draft") {
      return res.status(400).json({ error: "Only draft surveys can be edited" });
    }

    const { fields, payload } = validateSurveyPayload(req.body);
    if (fields.length) return res.status(400).json({ error: "Invalid survey payload", fields });

    await run(
      `UPDATE surveys
       SET title = ?, description = ?, audience = ?, allow_multiple_responses = ?, starts_at = ?, ends_at = ?, updated_at = ?
       WHERE id = ?`,
      [
        payload.title,
        payload.description,
        payload.audience,
        payload.allowMultipleResponses,
        payload.startsAt,
        payload.endsAt,
        nowIso(),
        surveyId
      ]
    );

    await run("DELETE FROM questions WHERE survey_id = ?", [surveyId]);

    for (const question of payload.questions) {
      await run(
        `INSERT INTO questions (survey_id, question_text, type, options_json, required, question_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          surveyId,
          question.text,
          question.type,
          JSON.stringify(question.options),
          question.required,
          question.order
        ]
      );
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/surveys/:id/publish", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id, status FROM surveys WHERE id = ? AND owner_user_id = ?", [surveyId, req.user.id]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.status === "archived") return res.status(400).json({ error: "Archived survey cannot be published" });

    await run("UPDATE surveys SET status = 'published', updated_at = ? WHERE id = ?", [nowIso(), surveyId]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/surveys/:id/archive", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id FROM surveys WHERE id = ? AND owner_user_id = ?", [surveyId, req.user.id]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    await run("UPDATE surveys SET status = 'archived', updated_at = ? WHERE id = ?", [nowIso(), surveyId]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/surveys/:id", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id FROM surveys WHERE id = ? AND owner_user_id = ?", [surveyId, req.user.id]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    await run("DELETE FROM surveys WHERE id = ?", [surveyId]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/surveys/:id/respond", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get(
      `SELECT id, status, allow_multiple_responses, starts_at, ends_at
       FROM surveys WHERE id = ?`,
      [surveyId]
    );

    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (!surveyIsActive(survey)) return res.status(400).json({ error: "Survey is not active" });

    const questions = await all(
      `SELECT id, type, options_json, required
       FROM questions WHERE survey_id = ?`,
      [surveyId]
    );

    const answersInput = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const answersByQuestion = new Map();
    answersInput.forEach((answer) => {
      if (!Number.isInteger(Number(answer?.questionId))) return;
      answersByQuestion.set(Number(answer.questionId), answer.value);
    });

    const invalidQuestions = [];

    for (const q of questions) {
      const value = answersByQuestion.get(q.id);
      const required = q.required === 1;

      if (required && (value === undefined || value === null || value === "")) {
        invalidQuestions.push(q.id);
        continue;
      }

      if (value === undefined || value === null || value === "") continue;

      const options = safeJsonParse(q.options_json, []);

      if (q.type === "single") {
        if (!options.includes(String(value))) invalidQuestions.push(q.id);
      }

      if (q.type === "multi") {
        const values = Array.isArray(value) ? value.map((item) => String(item)) : [];
        if (values.length === 0 || values.some((item) => !options.includes(item))) invalidQuestions.push(q.id);
      }

      if (q.type === "rating") {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) invalidQuestions.push(q.id);
      }

      if (q.type === "text" && String(value).trim().length > 2000) {
        invalidQuestions.push(q.id);
      }
    }

    if (invalidQuestions.length) {
      return res.status(400).json({ error: "Invalid answers", questions: [...new Set(invalidQuestions)] });
    }

    const participantHash = hashParticipant(req);

    if (!survey.allow_multiple_responses) {
      const previous = await get(
        "SELECT id FROM responses WHERE survey_id = ? AND participant_hash = ? LIMIT 1",
        [surveyId, participantHash]
      );
      if (previous) return res.status(409).json({ error: "Only one response is allowed" });
    }

    const response = await run(
      "INSERT INTO responses (survey_id, participant_hash, created_at) VALUES (?, ?, ?)",
      [surveyId, participantHash, nowIso()]
    );

    for (const q of questions) {
      if (!answersByQuestion.has(q.id)) continue;
      await run(
        "INSERT INTO answers (response_id, question_id, answer_json) VALUES (?, ?, ?)",
        [response.lastID, q.id, JSON.stringify(answersByQuestion.get(q.id))]
      );
    }

    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/surveys/:id/results", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get(
      `SELECT id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at, created_at, updated_at
       FROM surveys WHERE id = ?`,
      [surveyId]
    );
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    const [questions, responses, answers, trend] = await Promise.all([
      all(
        `SELECT id, question_text, type, options_json, required, question_order
         FROM questions WHERE survey_id = ?
         ORDER BY question_order ASC`,
        [surveyId]
      ),
      all("SELECT id, created_at FROM responses WHERE survey_id = ? ORDER BY created_at DESC", [surveyId]),
      all(
        `SELECT a.question_id, a.answer_json
         FROM answers a
         JOIN responses r ON r.id = a.response_id
         WHERE r.survey_id = ?`,
        [surveyId]
      ),
      all(
        `SELECT substr(created_at, 1, 10) as day, COUNT(*) as count
         FROM responses
         WHERE survey_id = ?
         GROUP BY substr(created_at, 1, 10)
         ORDER BY day ASC`,
        [surveyId]
      )
    ]);

    const statsByQuestion = new Map();

    questions.forEach((q) => {
      statsByQuestion.set(q.id, {
        id: q.id,
        text: q.question_text,
        type: q.type,
        options: safeJsonParse(q.options_json, []),
        required: q.required === 1,
        total: 0,
        counts: {},
        ratings: [],
        samples: []
      });
    });

    answers.forEach((answer) => {
      const entry = statsByQuestion.get(answer.question_id);
      if (!entry) return;

      const value = safeJsonParse(answer.answer_json, null);
      entry.total += 1;

      if (entry.type === "single") {
        const key = String(value);
        entry.counts[key] = (entry.counts[key] || 0) + 1;
      } else if (entry.type === "multi") {
        const values = Array.isArray(value) ? value : [];
        values.forEach((item) => {
          const key = String(item);
          entry.counts[key] = (entry.counts[key] || 0) + 1;
        });
      } else if (entry.type === "rating") {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) entry.ratings.push(numeric);
      } else if (typeof value === "string" && value.trim()) {
        entry.samples.push(value.trim());
      }
    });

    const results = Array.from(statsByQuestion.values()).map((item) => {
      if (item.type !== "rating") return item;
      const average = item.ratings.length
        ? item.ratings.reduce((sum, value) => sum + value, 0) / item.ratings.length
        : 0;
      return {
        ...item,
        average: Number(average.toFixed(2))
      };
    });

    res.json({
      survey,
      summary: {
        totalResponses: responses.length,
        active: surveyIsActive(survey)
      },
      trend,
      results
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/surveys/:id/export.csv", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id, title FROM surveys WHERE id = ?", [surveyId]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    const questions = await all(
      `SELECT id, question_text, question_order
       FROM questions
       WHERE survey_id = ?
       ORDER BY question_order ASC`,
      [surveyId]
    );

    const responses = await all(
      `SELECT id, created_at
       FROM responses
       WHERE survey_id = ?
       ORDER BY created_at ASC`,
      [surveyId]
    );

    const answers = await all(
      `SELECT response_id, question_id, answer_json
       FROM answers
       WHERE response_id IN (SELECT id FROM responses WHERE survey_id = ?)`,
      [surveyId]
    );

    const answerMap = new Map();
    answers.forEach((item) => {
      const key = `${item.response_id}:${item.question_id}`;
      answerMap.set(key, safeJsonParse(item.answer_json, ""));
    });

    const columns = ["response_id", "created_at", ...questions.map((question) => question.question_text)];
    const rows = [columns.map(csvEscape).join(",")];

    responses.forEach((response) => {
      const row = [response.id, response.created_at];
      questions.forEach((question) => {
        const value = answerMap.get(`${response.id}:${question.id}`);
        if (Array.isArray(value)) {
          row.push(value.join(" | "));
        } else if (value == null) {
          row.push("");
        } else {
          row.push(value);
        }
      });
      rows.push(row.map(csvEscape).join(","));
    });

    const fileName = `survey-${surveyId}-export.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(rows.join("\n"));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

init()
  .then(async () => {
    await seedDemoSurvey();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize application", error);
    process.exit(1);
  });
