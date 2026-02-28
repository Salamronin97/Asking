const crypto = require("crypto");
const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");
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
    email: row.email,
    emailVerified: row.email_verified === 1,
    company: row.company || "",
    position: row.position || "",
    locale: row.locale || "ru"
  };
}

async function attachAuthUser(req, _res, next) {
  try {
    const token = parseCookies(req)[SESSION_COOKIE];
    req.user = null;
    req.sessionToken = token || null;
    if (!token) return next();

    const session = await get(
      `SELECT s.token, s.user_id, s.expires_at, u.id, u.name, u.email, u.email_verified, u.company, u.position, u.locale
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

app.get("/create", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "create.html"));
});

app.get("/cabinet", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "cabinet.html"));
});

app.get("/guide", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "guide.html"));
});

app.get("/author", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "author.html"));
});

app.get("/survey/:id", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "survey.html"));
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
      "INSERT INTO users (name, username, email, email_verified, password_hash, created_at, updated_at, locale) VALUES (?, NULL, ?, 1, ?, ?, ?, ?)",
      [name, email, hashPassword(password), createdAt, createdAt, "ru"]
    );

    const session = await createSession(result.lastID);
    setSessionCookie(req, res, session.token, session.expiresAt);
    res.status(201).json({
      user: {
        id: result.lastID,
        name,
        email,
        emailVerified: true,
        company: "",
        position: "",
        locale: "ru"
      }
    });
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
      `SELECT id, name, email, email_verified, company, position, locale, password_hash FROM users WHERE lower(email) = ?`,
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

    let user = await get("SELECT id, name, email, email_verified, company, position, locale FROM users WHERE google_sub = ?", [
      googleSub
    ]);
    if (!user) {
      const byEmail = await get("SELECT id, name, email, email_verified, company, position, locale FROM users WHERE email = ?", [
        email
      ]);
      if (byEmail) {
        await run("UPDATE users SET google_sub = ?, email_verified = 1, updated_at = ? WHERE id = ?", [
          googleSub,
          nowIso(),
          byEmail.id
        ]);
        user = { ...byEmail, email_verified: 1 };
      } else {
        const createdAt = nowIso();
        const created = await run(
          "INSERT INTO users (name, username, email, email_verified, google_sub, created_at, updated_at, locale) VALUES (?, NULL, ?, 1, ?, ?, ?, ?)",
          [name, email, googleSub, createdAt, createdAt, "ru"]
        );
        user = { id: created.lastID, name, email, email_verified: 1, company: "", position: "", locale: "ru" };
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
      `SELECT t.token, t.user_id, t.expires_at, u.id, u.name, u.email, u.email_verified, u.company, u.position, u.locale
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
      user: toPublicUser({ ...row, email_verified: 1 })
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

    const user = await get("SELECT id, name, email, email_verified, company, position, locale FROM users WHERE id = ?", [
      tokenRow.user_id
    ]);
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

app.get("/api/account/profile", requireAuth, async (req, res, next) => {
  try {
    const profile = await get(
      `SELECT id, name, email, email_verified, company, position, locale, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json({
      profile: {
        id: profile.id,
        name: profile.name || "",
        email: profile.email,
        emailVerified: profile.email_verified === 1,
        company: profile.company || "",
        position: profile.position || "",
        locale: profile.locale || "ru",
        createdAt: profile.created_at || null,
        updatedAt: profile.updated_at || null
      }
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/account/profile", requireAuth, antiBotPayload, async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const company = String(req.body?.company || "").trim();
    const position = String(req.body?.position || "").trim();
    const locale = String(req.body?.locale || "ru")
      .trim()
      .toLowerCase();

    if (!name || name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Name must be 2-80 characters" });
    }
    if (company.length > 120) return res.status(400).json({ error: "Company is too long" });
    if (position.length > 120) return res.status(400).json({ error: "Position is too long" });
    if (!["en", "ru", "kz"].includes(locale)) return res.status(400).json({ error: "Unsupported language" });

    const updatedAt = nowIso();
    await run("UPDATE users SET name = ?, company = ?, position = ?, locale = ?, updated_at = ? WHERE id = ?", [
      name,
      company || null,
      position || null,
      locale,
      updatedAt,
      req.user.id
    ]);

    const profile = await get(
      `SELECT id, name, email, email_verified, company, position, locale, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    res.json({
      profile: {
        id: profile.id,
        name: profile.name || "",
        email: profile.email,
        emailVerified: profile.email_verified === 1,
        company: profile.company || "",
        position: profile.position || "",
        locale: profile.locale || "ru",
        createdAt: profile.created_at || null,
        updatedAt: profile.updated_at || null
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/account/sessions", requireAuth, async (req, res, next) => {
  try {
    const rows = await all(
      `SELECT rowid as id, token, created_at, expires_at
       FROM auth_sessions
       WHERE user_id = ?
       ORDER BY datetime(created_at) DESC`,
      [req.user.id]
    );
    res.json({
      sessions: rows.map((item) => ({
        id: item.id,
        createdAt: item.created_at,
        expiresAt: item.expires_at,
        isCurrent: item.token === req.sessionToken
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/account/sessions/:sessionId", requireAuth, async (req, res, next) => {
  try {
    const sessionId = Number.parseInt(req.params.sessionId, 10);
    if (!Number.isInteger(sessionId) || sessionId <= 0) return res.status(400).json({ error: "Invalid session id" });

    const row = await get("SELECT rowid as id, token, user_id FROM auth_sessions WHERE rowid = ?", [sessionId]);
    if (!row || row.user_id !== req.user.id) return res.status(404).json({ error: "Session not found" });

    await run("DELETE FROM auth_sessions WHERE rowid = ?", [sessionId]);
    if (row.token === req.sessionToken) clearSessionCookie(req, res);
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

    await run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", [hashPassword(newPassword), nowIso(), req.user.id]);
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

app.get("/api/templates", (req, res) => {
  const lang = ["en", "ru", "kz"].includes(String(req.query.lang || "").toLowerCase())
    ? String(req.query.lang).toLowerCase()
    : "ru";

  const templatesByLang = {
    en: [
      {
        key: "product-feedback",
        title: "Product Feedback",
        description: "Measure satisfaction and product priorities.",
        audience: "Product users",
        questions: [
          { text: "How do you rate the product overall?", type: "rating", options: [], required: true },
          {
            text: "What should be improved first?",
            type: "single",
            options: ["Speed", "Design", "Stability", "Integrations"],
            required: true
          },
          { text: "What do you like most?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "event-voting",
        title: "Event Voting",
        description: "Vote for event topics and formats.",
        audience: "Event participants",
        questions: [
          { text: "Which topic do you vote for?", type: "single", options: ["AI", "Frontend", "Backend", "Product"], required: true },
          {
            text: "Which formats are most useful?",
            type: "multi",
            options: ["Talks", "Workshops", "Panel discussion", "Networking"],
            required: true
          },
          { text: "Additional comments", type: "text", options: [], required: false }
        ]
      },
      {
        key: "education-quality",
        title: "Education Quality",
        description: "Collect student feedback about program quality.",
        audience: "Students",
        questions: [
          { text: "How do you rate the quality of classes?", type: "rating", options: [], required: true },
          { text: "Which area needs improvement first?", type: "single", options: ["Schedule", "Teaching style", "Materials", "Support"], required: true },
          { text: "What should we keep unchanged?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "teacher-evaluation",
        title: "Teacher Evaluation",
        description: "Anonymous feedback on teaching practice.",
        audience: "Students and parents",
        questions: [
          { text: "How clear are explanations?", type: "rating", options: [], required: true },
          { text: "How approachable is the teacher?", type: "rating", options: [], required: true },
          { text: "What should be improved?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "employee-engagement",
        title: "Employee Engagement",
        description: "Assess motivation and team climate.",
        audience: "Company employees",
        questions: [
          { text: "How motivated are you at work?", type: "rating", options: [], required: true },
          { text: "What influences your motivation most?", type: "multi", options: ["Compensation", "Leadership", "Growth", "Team culture"], required: true },
          { text: "One action that would improve engagement", type: "text", options: [], required: false }
        ]
      },
      {
        key: "pulse-check",
        title: "Weekly Pulse Check",
        description: "Quick operational check for teams.",
        audience: "Project team",
        questions: [
          { text: "How was your week overall?", type: "rating", options: [], required: true },
          { text: "What blocked your work?", type: "multi", options: ["Dependencies", "Unclear tasks", "Lack of time", "Technical issues"], required: false },
          { text: "What help do you need next week?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "customer-satisfaction",
        title: "Customer Satisfaction",
        description: "Post-service quality survey for clients.",
        audience: "Customers",
        questions: [
          { text: "How satisfied are you with our service?", type: "rating", options: [], required: true },
          { text: "Would you recommend us?", type: "single", options: ["Yes", "No"], required: true },
          { text: "How can we improve?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "nps",
        title: "NPS Survey",
        description: "Classic recommendation score with context.",
        audience: "Users or customers",
        questions: [
          { text: "How likely are you to recommend us (1-5)?", type: "rating", options: [], required: true },
          { text: "Main reason for your score", type: "text", options: [], required: true },
          { text: "What one improvement would raise your score?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "service-quality",
        title: "Service Quality Audit",
        description: "Evaluate support quality across key criteria.",
        audience: "Clients and partners",
        questions: [
          { text: "How do you rate response speed?", type: "rating", options: [], required: true },
          { text: "How do you rate communication quality?", type: "rating", options: [], required: true },
          { text: "Where did the process fail?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "meeting-retro",
        title: "Meeting Retrospective",
        description: "Improve meetings and decision quality.",
        audience: "Meeting attendees",
        questions: [
          { text: "Was the meeting productive?", type: "rating", options: [], required: true },
          { text: "What worked well?", type: "text", options: [], required: false },
          { text: "What should be changed next time?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "campus-event-review",
        title: "Campus Event Review",
        description: "Collect school/college event feedback.",
        audience: "Students, teachers, administrators",
        questions: [
          { text: "How do you rate the event overall?", type: "rating", options: [], required: true },
          { text: "Which part was best?", type: "single", options: ["Program", "Speakers", "Organization", "Venue"], required: true },
          { text: "What should be improved for the next event?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "public-opinion",
        title: "Public Opinion Poll",
        description: "Run a public vote with transparent options.",
        audience: "Open audience",
        questions: [
          { text: "Choose your preferred option", type: "single", options: ["Option A", "Option B", "Option C", "Option D"], required: true },
          { text: "How confident are you in your choice?", type: "rating", options: [], required: false },
          { text: "Optional comment", type: "text", options: [], required: false }
        ]
      }
    ],
    ru: [
      {
        key: "product-feedback",
        title: "Обратная связь по продукту",
        description: "Оценка удовлетворенности и приоритетов продукта.",
        audience: "Пользователи продукта",
        questions: [
          { text: "Как вы оцениваете продукт в целом?", type: "rating", options: [], required: true },
          { text: "Что улучшить в первую очередь?", type: "single", options: ["Скорость", "Дизайн", "Стабильность", "Интеграции"], required: true },
          { text: "Что вам нравится больше всего?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "event-voting",
        title: "Голосование по мероприятию",
        description: "Выбор тем и формата мероприятия.",
        audience: "Участники мероприятия",
        questions: [
          { text: "За какую тему вы голосуете?", type: "single", options: ["AI", "Frontend", "Backend", "Product"], required: true },
          { text: "Какие форматы вам интересны?", type: "multi", options: ["Доклады", "Воркшопы", "Панельная дискуссия", "Нетворкинг"], required: true },
          { text: "Дополнительный комментарий", type: "text", options: [], required: false }
        ]
      },
      {
        key: "education-quality",
        title: "Качество обучения",
        description: "Сбор мнений о качестве учебной программы.",
        audience: "Студенты",
        questions: [
          { text: "Как вы оцениваете качество занятий?", type: "rating", options: [], required: true },
          { text: "Что нужно улучшить в первую очередь?", type: "single", options: ["Расписание", "Подача материала", "Материалы", "Поддержка"], required: true },
          { text: "Что стоит оставить без изменений?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "teacher-evaluation",
        title: "Оценка преподавателя",
        description: "Анонимная оценка преподавательской практики.",
        audience: "Студенты и родители",
        questions: [
          { text: "Насколько понятны объяснения?", type: "rating", options: [], required: true },
          { text: "Насколько комфортна коммуникация?", type: "rating", options: [], required: true },
          { text: "Что можно улучшить?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "employee-engagement",
        title: "Вовлеченность сотрудников",
        description: "Оценка мотивации и климата в команде.",
        audience: "Сотрудники компании",
        questions: [
          { text: "Насколько вы мотивированы в работе?", type: "rating", options: [], required: true },
          { text: "Что сильнее всего влияет на мотивацию?", type: "multi", options: ["Оплата", "Руководство", "Рост", "Культура команды"], required: true },
          { text: "Какой один шаг повысит вовлеченность?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "pulse-check",
        title: "Еженедельный пульс-опрос",
        description: "Короткая проверка состояния команды.",
        audience: "Проектная команда",
        questions: [
          { text: "Как прошла неделя в целом?", type: "rating", options: [], required: true },
          { text: "Что блокировало вашу работу?", type: "multi", options: ["Зависимости", "Нечеткие задачи", "Нехватка времени", "Технические проблемы"], required: false },
          { text: "Какая помощь нужна на следующей неделе?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "customer-satisfaction",
        title: "Удовлетворенность клиентов",
        description: "Опрос качества после оказания услуги.",
        audience: "Клиенты",
        questions: [
          { text: "Насколько вы довольны нашим сервисом?", type: "rating", options: [], required: true },
          { text: "Порекомендуете ли вы нас?", type: "single", options: ["Да", "Нет"], required: true },
          { text: "Что можно улучшить?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "nps",
        title: "NPS-опрос",
        description: "Классический индекс готовности рекомендовать.",
        audience: "Пользователи или клиенты",
        questions: [
          { text: "Насколько вероятно, что вы порекомендуете нас (1-5)?", type: "rating", options: [], required: true },
          { text: "Главная причина вашей оценки", type: "text", options: [], required: true },
          { text: "Какое одно улучшение повысит оценку?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "service-quality",
        title: "Аудит качества сервиса",
        description: "Оценка поддержки по ключевым критериям.",
        audience: "Клиенты и партнеры",
        questions: [
          { text: "Как вы оцениваете скорость ответа?", type: "rating", options: [], required: true },
          { text: "Как вы оцениваете качество коммуникации?", type: "rating", options: [], required: true },
          { text: "Где в процессе возникли проблемы?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "meeting-retro",
        title: "Ретроспектива встречи",
        description: "Улучшение рабочих встреч и решений.",
        audience: "Участники встречи",
        questions: [
          { text: "Насколько продуктивной была встреча?", type: "rating", options: [], required: true },
          { text: "Что сработало хорошо?", type: "text", options: [], required: false },
          { text: "Что изменить в следующий раз?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "campus-event-review",
        title: "Оценка мероприятия колледжа",
        description: "Сбор мнений о школьном/колледжном мероприятии.",
        audience: "Студенты, преподаватели, администрация",
        questions: [
          { text: "Как вы оцениваете мероприятие в целом?", type: "rating", options: [], required: true },
          { text: "Что понравилось больше всего?", type: "single", options: ["Программа", "Спикеры", "Организация", "Локация"], required: true },
          { text: "Что улучшить в следующий раз?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "public-opinion",
        title: "Публичное голосование",
        description: "Открытый опрос с прозрачным выбором вариантов.",
        audience: "Широкая аудитория",
        questions: [
          { text: "Выберите предпочтительный вариант", type: "single", options: ["Вариант A", "Вариант B", "Вариант C", "Вариант D"], required: true },
          { text: "Насколько вы уверены в выборе?", type: "rating", options: [], required: false },
          { text: "Комментарий (необязательно)", type: "text", options: [], required: false }
        ]
      }
    ],
    kz: [
      {
        key: "product-feedback",
        title: "Өнім бойынша кері байланыс",
        description: "Өнім сапасы мен басымдықтарын бағалау.",
        audience: "Өнім пайдаланушылары",
        questions: [
          { text: "Өнімді жалпы қалай бағалайсыз?", type: "rating", options: [], required: true },
          { text: "Алдымен нені жақсарту керек?", type: "single", options: ["Жылдамдық", "Дизайн", "Тұрақтылық", "Интеграциялар"], required: true },
          { text: "Сізге ең ұнайтын нәрсе не?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "event-voting",
        title: "Іс-шара бойынша дауыс беру",
        description: "Іс-шара тақырыптары мен форматын таңдау.",
        audience: "Қатысушылар",
        questions: [
          { text: "Қай тақырыпқа дауыс бересіз?", type: "single", options: ["AI", "Frontend", "Backend", "Product"], required: true },
          { text: "Қай форматтар пайдалы?", type: "multi", options: ["Баяндамалар", "Воркшоптар", "Панельдік талқылау", "Нетворкинг"], required: true },
          { text: "Қосымша пікір", type: "text", options: [], required: false }
        ]
      },
      {
        key: "education-quality",
        title: "Білім сапасы",
        description: "Оқу бағдарламасының сапасы бойынша пікір жинау.",
        audience: "Студенттер",
        questions: [
          { text: "Сабақ сапасын қалай бағалайсыз?", type: "rating", options: [], required: true },
          { text: "Алдымен нені жақсарту қажет?", type: "single", options: ["Кесте", "Оқыту әдісі", "Материалдар", "Қолдау"], required: true },
          { text: "Нені өзгеріссіз қалдырған дұрыс?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "teacher-evaluation",
        title: "Оқытушыны бағалау",
        description: "Оқыту тәжірибесіне анонимді кері байланыс.",
        audience: "Студенттер және ата-аналар",
        questions: [
          { text: "Түсіндіру қаншалықты түсінікті?", type: "rating", options: [], required: true },
          { text: "Қарым-қатынас қаншалықты ыңғайлы?", type: "rating", options: [], required: true },
          { text: "Нені жақсартуға болады?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "employee-engagement",
        title: "Қызметкерлердің тартылуы",
        description: "Мотивация мен команда ахуалын бағалау.",
        audience: "Компания қызметкерлері",
        questions: [
          { text: "Жұмыстағы мотивацияңызды қалай бағалайсыз?", type: "rating", options: [], required: true },
          { text: "Мотивацияға ең көп не әсер етеді?", type: "multi", options: ["Жалақы", "Басшылық", "Өсу", "Команда мәдениеті"], required: true },
          { text: "Тартылуды арттыратын бір қадам", type: "text", options: [], required: false }
        ]
      },
      {
        key: "pulse-check",
        title: "Апталық pulse-сауалнама",
        description: "Команда күйін жылдам тексеру.",
        audience: "Жоба командасы",
        questions: [
          { text: "Аптаңыз жалпы қалай өтті?", type: "rating", options: [], required: true },
          { text: "Жұмысыңызға не кедергі болды?", type: "multi", options: ["Тәуелділіктер", "Тапсырма түсініксіз", "Уақыт аз", "Техникалық ақау"], required: false },
          { text: "Келесі аптада қандай көмек керек?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "customer-satisfaction",
        title: "Клиент қанағаттануы",
        description: "Қызметтен кейінгі сапа сауалнамасы.",
        audience: "Клиенттер",
        questions: [
          { text: "Біздің сервиске қаншалықты қанағаттанасыз?", type: "rating", options: [], required: true },
          { text: "Бізді ұсынасыз ба?", type: "single", options: ["Иә", "Жоқ"], required: true },
          { text: "Нені жақсарту керек?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "nps",
        title: "NPS сауалнамасы",
        description: "Ұсыну ықтималдығын өлшейтін классикалық формат.",
        audience: "Пайдаланушылар немесе клиенттер",
        questions: [
          { text: "Бізді ұсыну ықтималдығы қандай (1-5)?", type: "rating", options: [], required: true },
          { text: "Бағаңыздың негізгі себебі", type: "text", options: [], required: true },
          { text: "Қай өзгеріс бағаңызды арттырады?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "service-quality",
        title: "Сервис сапасын аудиттеу",
        description: "Қолдау сапасын негізгі критерийлер бойынша бағалау.",
        audience: "Клиенттер мен серіктестер",
        questions: [
          { text: "Жауап беру жылдамдығын бағалаңыз", type: "rating", options: [], required: true },
          { text: "Коммуникация сапасын бағалаңыз", type: "rating", options: [], required: true },
          { text: "Процесте қай жерде мәселе болды?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "meeting-retro",
        title: "Кездесу ретроспективасы",
        description: "Жұмыс кездесулері мен шешім сапасын жақсарту.",
        audience: "Кездесу қатысушылары",
        questions: [
          { text: "Кездесу қаншалықты өнімді болды?", type: "rating", options: [], required: true },
          { text: "Не жақсы өтті?", type: "text", options: [], required: false },
          { text: "Келесіде нені өзгерту керек?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "campus-event-review",
        title: "Колледж іс-шарасын бағалау",
        description: "Мектеп/колледж іс-шарасы бойынша пікір жинау.",
        audience: "Студенттер, оқытушылар, әкімшілік",
        questions: [
          { text: "Іс-шараны жалпы қалай бағалайсыз?", type: "rating", options: [], required: true },
          { text: "Ең ұнаған бөлік қайсы?", type: "single", options: ["Бағдарлама", "Спикерлер", "Ұйымдастыру", "Локация"], required: true },
          { text: "Келесі жолы нені жақсарту керек?", type: "text", options: [], required: false }
        ]
      },
      {
        key: "public-opinion",
        title: "Қоғамдық пікір сауалнамасы",
        description: "Ашық аудиторияға арналған дауыс беру.",
        audience: "Кең аудитория",
        questions: [
          { text: "Өзіңізге ұнайтын нұсқаны таңдаңыз", type: "single", options: ["Нұсқа A", "Нұсқа B", "Нұсқа C", "Нұсқа D"], required: true },
          { text: "Таңдауыңызға қаншалықты сенімдісіз?", type: "rating", options: [], required: false },
          { text: "Пікір (міндетті емес)", type: "text", options: [], required: false }
        ]
      }
    ]
  };

  res.json({ templates: templatesByLang[lang] || templatesByLang.ru });
});

app.get("/api/surveys", async (req, res, next) => {
  try {
    const status = normalizeStatus(String(req.query.status || ""));
    const q = String(req.query.q || "").trim();
    const mine = parseBool(req.query.mine, false);

    const filters = [];
    const params = [];

    if (mine) {
      if (!req.user) return res.status(401).json({ error: "Authentication required" });
      filters.push("owner_user_id = ?");
      params.push(req.user.id);
    }

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

app.get("/api/public/surveys/:id", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get(
      `SELECT id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at
       FROM surveys
       WHERE id = ?`,
      [surveyId]
    );
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.status !== "published") return res.status(403).json({ error: "Survey is not published" });

    const questions = await all(
      `SELECT id, question_text, type, options_json, required, question_order
       FROM questions
       WHERE survey_id = ?
       ORDER BY question_order ASC`,
      [surveyId]
    );

    res.json({
      survey,
      active: surveyIsActive(survey),
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

app.get("/api/surveys/:id/results", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get(
      `SELECT id, owner_user_id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at, created_at, updated_at
       FROM surveys WHERE id = ?`,
      [surveyId]
    );
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.owner_user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

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

app.get("/api/surveys/:id/responses-table", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get("SELECT id, owner_user_id, title FROM surveys WHERE id = ?", [surveyId]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.owner_user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

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
       ORDER BY created_at DESC
       LIMIT 300`,
      [surveyId]
    );

    const responseIds = responses.map((row) => row.id);
    if (!responseIds.length) {
      return res.json({
        columns: ["response_id", "created_at", ...questions.map((q) => q.question_text)],
        rows: []
      });
    }

    const placeholders = responseIds.map(() => "?").join(",");
    const answers = await all(
      `SELECT response_id, question_id, answer_json
       FROM answers
       WHERE response_id IN (${placeholders})`,
      responseIds
    );

    const answerMap = new Map();
    answers.forEach((item) => {
      const value = safeJsonParse(item.answer_json, "");
      const normalized = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
      answerMap.set(`${item.response_id}:${item.question_id}`, normalized);
    });

    const rows = responses.map((response) => {
      const cells = [response.id, response.created_at];
      questions.forEach((question) => {
        cells.push(answerMap.get(`${response.id}:${question.id}`) || "");
      });
      return cells;
    });

    res.json({
      columns: ["response_id", "created_at", ...questions.map((q) => q.question_text)],
      rows
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/surveys/:id/export.xlsx", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get("SELECT id, owner_user_id, title FROM surveys WHERE id = ?", [surveyId]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.owner_user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

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

    const responseIds = responses.map((row) => row.id);
    const answerMap = new Map();
    if (responseIds.length) {
      const placeholders = responseIds.map(() => "?").join(",");
      const answers = await all(
        `SELECT response_id, question_id, answer_json
         FROM answers
         WHERE response_id IN (${placeholders})`,
        responseIds
      );
      answers.forEach((item) => {
        const value = safeJsonParse(item.answer_json, "");
        const normalized = Array.isArray(value) ? value.join(" | ") : value == null ? "" : String(value);
        answerMap.set(`${item.response_id}:${item.question_id}`, normalized);
      });
    }

    const columns = ["response_id", "created_at", ...questions.map((q) => q.question_text)];
    const rows = responses.map((response) => {
      const row = [response.id, response.created_at];
      questions.forEach((question) => {
        row.push(answerMap.get(`${response.id}:${question.id}`) || "");
      });
      return row;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const safeTitle = String(survey.title || `survey-${surveyId}`)
      .replace(/[^\w.-]+/g, "_")
      .slice(0, 64);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle || `survey-${surveyId}`}-responses.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
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
