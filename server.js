const crypto = require("crypto");
const fs = require("fs");
const express = require("express");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");
const { OAuth2Client } = require("google-auth-library");
const { init, run, all, get, DB_PATH } = require("./db");
const QUICK_TEMPLATES_RU = require("./public/templates");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html") || filePath.endsWith(".css") || filePath.endsWith(".js")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.setHeader("Surrogate-Control", "no-store");
      }
      if (filePath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      } else if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      } else if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      }
    }
  })
);
app.use(attachAuthUser);

function sendHtmlUtf8(res, filePath) {
  res.type("html");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  res.sendFile(filePath);
}

const QUESTION_TYPES = new Set(["text", "single", "multi", "rating", "dropdown"]);
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
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");
const RESPONSE_HASH_SALT = process.env.RESPONSE_HASH_SALT || crypto.randomBytes(24).toString("hex");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, UPLOAD_DIR);
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = ext && ext.length <= 8 ? ext : "";
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExt}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!String(file.mimetype || "").startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  }
});
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

function normalizePageDesign(raw) {
  const obj = raw && typeof raw === "object" ? raw : {};
  const allowedLayouts = new Set(["full", "split-right-image", "split-left-image", "cover-top-image", "center-card"]);
  const bgColorRaw = String(obj.bgColor || "").trim();
  const bgImageRaw = String(obj.bgImage || "").trim();
  const layoutRaw = String(obj.layout || "").trim();
  const themeIdRaw = String(obj.themeId || "").trim();
  const overlayRaw = Number(obj.overlay);

  return {
    themeId: themeIdRaw ? themeIdRaw.slice(0, 80) : "",
    bgColor: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bgColorRaw) ? bgColorRaw : "#eaf3fb",
    bgImage: /^https?:\/\//i.test(bgImageRaw) ? bgImageRaw.slice(0, 1200) : "",
    layout: allowedLayouts.has(layoutRaw) ? layoutRaw : "full",
    overlay: Number.isFinite(overlayRaw) ? Math.max(0, Math.min(90, Math.round(overlayRaw))) : 0
  };
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.ip || "";
  return String(raw).split(",")[0].trim();
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
    if (process.env.DISABLE_AUTH_RATE_LIMIT === "1" || process.env.NODE_ENV === "test") {
      return next();
    }
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

async function createSession(userId, req = null) {
  const token = crypto.randomBytes(48).toString("hex");
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const userAgent = req?.headers?.["user-agent"] ? String(req.headers["user-agent"]).slice(0, 400) : null;
  const ipAddress = req ? getClientIp(req).slice(0, 120) : null;
  await run(
    "INSERT INTO auth_sessions (token, user_id, user_agent, ip_address, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
    [token, userId, userAgent, ipAddress, createdAt, expiresAt]
  );
  return { token, expiresAt };
}

function hashParticipant(req) {
  const ip = getClientIp(req);
  const userAgent = String(req.headers["user-agent"] || "");
  const day = new Date().toISOString().slice(0, 10);
  return crypto
    .createHash("sha256")
    .update(`${userAgent}|${ip}|${day}|${RESPONSE_HASH_SALT}`)
    .digest("hex");
}

function normalizeQuestion(question, index) {
  const text = String(question?.text || question?.title || "").trim();
  const type = String(question?.type || "").trim();
  const logicEnabled = Boolean(question?.logicEnabled || question?.logic_enabled);
  const rawOptions = Array.isArray(question?.options) ? question.options : [];
  const options = rawOptions
    .map((item) => {
      if (typeof item === "string") {
        const cleaned = item.trim();
        return cleaned ? { text: cleaned, imageUrl: "", jumpToPageId: "", jumpToPageIndex: null } : null;
      }
      if (item && typeof item === "object") {
        const cleanedText = String(item.text || "").trim();
        const imageUrl = String(item.imageUrl || "").trim();
        const jumpToPageId = String(item.jumpToPageId || item.targetPageId || "").trim();
        const jumpToPageIndexRaw = Number(item.jumpToPageIndex);
        const jumpToPageIndex = Number.isInteger(jumpToPageIndexRaw) ? jumpToPageIndexRaw : null;
        if (!cleanedText && !imageUrl) return null;
        return { text: cleanedText || "Option", imageUrl, jumpToPageId, jumpToPageIndex };
      }
      return null;
    })
    .filter(Boolean);
  const required = question?.required === false ? 0 : 1;
  const helpText = String(question?.helpText || question?.hint || question?.description || "").trim();

  return {
    text,
    helpText,
    type,
    logicEnabled,
    options,
    required,
    order: Number.isFinite(question?.order) ? question.order : index
  };
}

async function syncQuestionOptions(questionId, options) {
  await run("DELETE FROM options WHERE question_id = ?", [questionId]);
  for (let i = 0; i < options.length; i += 1) {
    const entry = options[i];
    const text = String(entry?.text || "").trim();
    if (!text) continue;
    await run("INSERT INTO options (question_id, text, order_index) VALUES (?, ?, ?)", [questionId, text, i]);
  }
  await run("UPDATE questions SET options_json = ? WHERE id = ?", [JSON.stringify(options), questionId]);
}

async function getSurveyPages(surveyId) {
  const rows = await all(
    `SELECT id, survey_id, title, design_json, order_index
     FROM pages
     WHERE survey_id = ?
     ORDER BY order_index ASC, id ASC`,
    [surveyId]
  );
  return rows.map((page) => ({
    ...page,
    design: normalizePageDesign(safeJsonParse(page.design_json, {}))
  }));
}

async function getSurveyQuestionsDetailed(surveyId) {
  const questions = await all(
    `SELECT q.id, q.survey_id, q.page_id, q.question_text, q.help_text, q.type, q.options_json, q.required, q.question_order
     FROM questions q
     WHERE q.survey_id = ?
     ORDER BY q.question_order ASC, q.id ASC`,
    [surveyId]
  );
  if (!questions.length) return [];
  const questionIds = questions.map((item) => item.id);
  const placeholders = questionIds.map(() => "?").join(",");
  const [optionRows, mediaRows] = await Promise.all([
    all(
      `SELECT question_id, text, order_index
       FROM options
       WHERE question_id IN (${placeholders})
       ORDER BY order_index ASC, id ASC`,
      questionIds
    ),
    all(
      `SELECT question_id, file_path, original_name, mime, size
       FROM question_media
       WHERE question_id IN (${placeholders})
       ORDER BY id ASC`,
      questionIds
    )
  ]);

  const optionsByQuestion = new Map();
  optionRows.forEach((row) => {
    const list = optionsByQuestion.get(row.question_id) || [];
    list.push({ text: row.text, imageUrl: "", jumpToPageId: "", jumpToPageIndex: null });
    optionsByQuestion.set(row.question_id, list);
  });

  const mediaByQuestion = new Map();
  mediaRows.forEach((row) => {
    const list = mediaByQuestion.get(row.question_id) || [];
    list.push({
      path: row.file_path,
      originalName: row.original_name || "",
      mime: row.mime || "",
      size: Number(row.size || 0)
    });
    mediaByQuestion.set(row.question_id, list);
  });

  return questions.map((q) => {
    const parsedJsonOptions = safeJsonParse(q.options_json, []);
    const normalizedJsonOptions = Array.isArray(parsedJsonOptions)
      ? parsedJsonOptions
          .map((item) => {
            if (typeof item === "string") {
              const cleaned = item.trim();
              return cleaned ? { text: cleaned, imageUrl: "", jumpToPageId: "", jumpToPageIndex: null } : null;
            }
            if (item && typeof item === "object") {
              const cleanedText = String(item.text || "").trim();
              const imageUrl = String(item.imageUrl || "").trim();
              const jumpToPageIndexRaw = Number(item.jumpToPageIndex);
              const jumpToPageIndex = Number.isInteger(jumpToPageIndexRaw) ? jumpToPageIndexRaw : null;
              if (!cleanedText && !imageUrl) return null;
              return {
                text: cleanedText || "Option",
                imageUrl,
                jumpToPageId: String(item.jumpToPageId || item.targetPageId || "").trim(),
                jumpToPageIndex
              };
            }
            return null;
          })
          .filter(Boolean)
      : [];
    const options = normalizedJsonOptions.length
      ? normalizedJsonOptions
      : optionsByQuestion.has(q.id)
        ? optionsByQuestion.get(q.id)
        : [];
    return {
      id: q.id,
      surveyId: q.survey_id,
      pageId: q.page_id,
      text: q.question_text,
      helpText: q.help_text || "",
      type: q.type,
      logicEnabled: Boolean(
        safeJsonParse(q.options_json, [])?.some?.(
          (item) => item && typeof item === "object" && (item.jumpToPageId || Number.isInteger(Number(item.jumpToPageIndex)))
        )
      ),
      options: Array.isArray(options) ? options : [],
      required: q.required === 1,
      order: q.question_order,
      media: mediaByQuestion.get(q.id) || []
    };
  });
}

async function ensureSurveyPage(surveyId, title = "Страница 1") {
  const first = await get(
    `SELECT id, title
     FROM pages
     WHERE survey_id = ?
     ORDER BY order_index ASC, id ASC
     LIMIT 1`,
    [surveyId]
  );
  if (first) return first;
  const stamp = nowIso();
  const created = await run(
    `INSERT INTO pages (survey_id, title, design_json, order_index, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?)`,
    [surveyId, title, JSON.stringify(normalizePageDesign({})), stamp, stamp]
  );
  return { id: created.lastID, title };
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

  const incomingPages = Array.isArray(payload?.pages) ? payload.pages : [];
  const fallbackQuestions = Array.isArray(payload?.questions) ? payload.questions : [];
  const normalizedPages = [];
  const questions = [];

  if (incomingPages.length) {
    incomingPages.forEach((page, pageIndex) => {
      const pageTitle = String(page?.title || `Страница ${pageIndex + 1}`).trim() || `Страница ${pageIndex + 1}`;
      const pageQuestionsRaw = Array.isArray(page?.questions) ? page.questions : [];
      const pageQuestions = pageQuestionsRaw.map((question, idx) => normalizeQuestion(question, questions.length + idx));
      normalizedPages.push({
        title: pageTitle,
        design: normalizePageDesign(page?.design),
        orderIndex: Number.isFinite(page?.orderIndex) ? Number(page.orderIndex) : pageIndex,
        questions: pageQuestions
      });
      questions.push(...pageQuestions);
    });
  } else {
    const normalizedQuestions = fallbackQuestions.map((question, idx) => normalizeQuestion(question, idx));
    normalizedPages.push({ title: "Страница 1", design: normalizePageDesign({}), orderIndex: 0, questions: normalizedQuestions });
    questions.push(...normalizedQuestions);
  }

  if (!questions.length) fields.push("questions");

  questions.forEach((question, idx) => {
    if (question.text.length < 3) fields.push(`questions[${idx}].text`);
    if (!QUESTION_TYPES.has(question.type)) fields.push(`questions[${idx}].type`);
    if ((question.type === "single" || question.type === "multi" || question.type === "dropdown") && question.options.length < 2) {
      fields.push(`questions[${idx}].options`);
    }
  });

  if (startsAt && Number.isNaN(Date.parse(startsAt))) fields.push("startsAt");
  if (endsAt && Number.isNaN(Date.parse(endsAt))) fields.push("endsAt");
  if (startsAt && endsAt && Date.parse(startsAt) >= Date.parse(endsAt)) fields.push("dateRange");

  return {
    fields,
    payload: { title, description, audience, startsAt, endsAt, allowMultipleResponses, questions, pages: normalizedPages }
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
    locale: row.locale || "ru",
    theme: row.theme || "light",
    dateFormat: row.date_format || "dd.mm.yyyy"
  };
}

async function attachAuthUser(req, _res, next) {
  try {
    const token = parseCookies(req)[SESSION_COOKIE];
    req.user = null;
    req.sessionToken = token || null;
    if (!token) return next();

    const session = await get(
      `SELECT s.token, s.user_id, s.expires_at, u.id, u.name, u.email, u.email_verified, u.company, u.position, u.locale, u.theme, u.date_format
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
  res.json({
    ok: true,
    timestamp: nowIso(),
    dbPath: DB_PATH,
    railwayVolumeMountPath: process.env.RAILWAY_VOLUME_MOUNT_PATH || null
  });
});

app.get("/auth", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "auth.html"));
});

app.get("/create", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "create.html"));
});

app.get("/cabinet", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "cabinet.html"));
});

app.get("/guide", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "guide.html"));
});

app.get("/author", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "author.html"));
});

app.get("/account", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "account.html"));
});

app.get("/survey/:id", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "survey.html"));
});

app.get("/s/:surveyId", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "survey.html"));
});

app.get("/survey/:id/settings", (_req, res) => {
  sendHtmlUtf8(res, path.join(__dirname, "public", "survey-settings.html"));
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

    const session = await createSession(result.lastID, req);
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
    const session = await createSession(user.id, req);
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

    const session = await createSession(user.id, req);
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

    const session = await createSession(row.user_id, req);
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
      subject: "Confirm your Asking email",
      text: `Confirm your email: ${verifyLink}`,
      html: `<p>Confirm your email for Asking:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
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
      subject: "Reset your Asking password",
      text: `Reset your password: ${resetLink}`,
      html: `<p>Reset your Asking password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
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
    const session = await createSession(tokenRow.user_id, req);
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

function mapAccountProfile(profile) {
  return {
    id: profile.id,
    displayName: profile.name || "",
    name: profile.name || "",
    email: profile.email,
    emailVerified: profile.email_verified === 1,
    company: profile.company || "",
    position: profile.position || "",
    locale: profile.locale || "ru",
    theme: profile.theme || "light",
    dateFormat: profile.date_format || "dd.mm.yyyy",
    hasPassword: Boolean(profile.password_hash),
    createdAt: profile.created_at || null,
    updatedAt: profile.updated_at || null
  };
}

app.get("/api/account/profile", requireAuth, async (req, res, next) => {
  try {
    const profile = await get(
      `SELECT id, name, email, email_verified, company, position, locale, theme, date_format, password_hash, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json({ profile: mapAccountProfile(profile) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/account/profile", requireAuth, antiBotPayload, async (req, res, next) => {
  try {
    const name = String(req.body?.name || req.body?.displayName || "").trim();
    const company = String(req.body?.company || "").trim();
    const position = String(req.body?.position || "").trim();
    const locale = String(req.body?.locale || "ru")
      .trim()
      .toLowerCase();
    const theme = String(req.body?.theme || "light")
      .trim()
      .toLowerCase();
    const dateFormat = String(req.body?.dateFormat || req.body?.date_format || "dd.mm.yyyy")
      .trim()
      .toLowerCase();

    if (!name || name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Name must be 2-80 characters" });
    }
    if (company.length > 120) return res.status(400).json({ error: "Company is too long" });
    if (position.length > 120) return res.status(400).json({ error: "Position is too long" });
    if (!["en", "ru", "kz"].includes(locale)) return res.status(400).json({ error: "Unsupported language" });
    if (!["light", "dark", "system"].includes(theme)) return res.status(400).json({ error: "Unsupported theme" });
    if (!["dd.mm.yyyy", "yyyy-mm-dd", "mm/dd/yyyy"].includes(dateFormat)) {
      return res.status(400).json({ error: "Unsupported date format" });
    }

    const updatedAt = nowIso();
    await run(
      "UPDATE users SET name = ?, company = ?, position = ?, locale = ?, theme = ?, date_format = ?, updated_at = ? WHERE id = ?",
      [name, company || null, position || null, locale, theme, dateFormat, updatedAt, req.user.id]
    );

    const profile = await get(
      `SELECT id, name, email, email_verified, company, position, locale, theme, date_format, password_hash, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    res.json({ profile: mapAccountProfile(profile) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/account", requireAuth, async (req, res, next) => {
  try {
    const profile = await get(
      `SELECT id, name, email, email_verified, company, position, locale, theme, date_format, password_hash, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json(mapAccountProfile(profile));
  } catch (error) {
    next(error);
  }
});

app.put("/api/account", requireAuth, antiBotPayload, async (req, res, next) => {
  try {
    const name = String(req.body?.displayName || req.body?.name || "").trim();
    const locale = String(req.body?.locale || "ru")
      .trim()
      .toLowerCase();
    const theme = String(req.body?.theme || "light")
      .trim()
      .toLowerCase();
    const dateFormat = String(req.body?.dateFormat || "dd.mm.yyyy")
      .trim()
      .toLowerCase();

    if (!name || name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Name must be 2-80 characters" });
    }
    if (!["en", "ru", "kz"].includes(locale)) return res.status(400).json({ error: "Unsupported language" });
    if (!["light", "dark", "system"].includes(theme)) return res.status(400).json({ error: "Unsupported theme" });
    if (!["dd.mm.yyyy", "yyyy-mm-dd", "mm/dd/yyyy"].includes(dateFormat)) {
      return res.status(400).json({ error: "Unsupported date format" });
    }

    await run("UPDATE users SET name = ?, locale = ?, theme = ?, date_format = ?, updated_at = ? WHERE id = ?", [
      name,
      locale,
      theme,
      dateFormat,
      nowIso(),
      req.user.id
    ]);

    const profile = await get(
      `SELECT id, name, email, email_verified, company, position, locale, theme, date_format, password_hash, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json(mapAccountProfile(profile));
  } catch (error) {
    next(error);
  }
});

app.get("/api/account/sessions", requireAuth, async (req, res, next) => {
  try {
    const rows = await all(
      `SELECT rowid as id, token, user_agent, ip_address, created_at, expires_at
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
        isCurrent: item.token === req.sessionToken,
        userAgent: item.user_agent || "",
        ip: item.ip_address || ""
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

app.post("/api/account/change-password", requireAuth, antiBotPayload, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || req.body?.current_password || "");
    const newPassword = String(req.body?.newPassword || req.body?.new_password || "");
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

app.post("/api/auth/logout_all", requireAuth, async (req, res, next) => {
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
  const templates = Object.entries(QUICK_TEMPLATES_RU).map(([key, template]) => ({
    key,
    id: template.id || key,
    title: template.title,
    description: template.description || "",
    audience: template.audience || "",
    pages: Array.isArray(template.pages) ? template.pages : [],
    questions: (Array.isArray(template.pages) ? template.pages : [])
      .flatMap((page) => (Array.isArray(page.questions) ? page.questions : []))
      .map((q) => ({
        type: q.type,
        text: q.text || q.title || "",
        help: q.help || "",
        required: q.required !== false,
        options: Array.isArray(q.options) ? q.options : []
      }))
  }));

  res.json({ templates });
});
app.post("/api/surveys/from-template", requireAuth, async (req, res, next) => {
  try {
    const key = String(req.body?.templateId || req.body?.templateKey || req.body?.template || "").trim().toLowerCase();
    const template = QUICK_TEMPLATES_RU[key];
    if (!template) return res.status(404).json({ error: "Template not found" });

    const createdAt = nowIso();
    const created = await run(
      `INSERT INTO surveys
        (owner_user_id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'draft', 0, NULL, NULL, ?, ?)`,
      [req.user.id, template.title, template.description, template.audience, createdAt, createdAt]
    );
    const surveyId = created.lastID;
    let order = 0;
    const pages = Array.isArray(template.pages) && template.pages.length ? template.pages : [{ title: "Страница 1", questions: [] }];

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
      const pagePayload = pages[pageIndex] || {};
      const pageTitle = String(pagePayload.title || `Страница ${pageIndex + 1}`).trim() || `Страница ${pageIndex + 1}`;
      const pageStamp = nowIso();
      const pageCreated = await run(
        `INSERT INTO pages (survey_id, title, design_json, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [surveyId, pageTitle, JSON.stringify(normalizePageDesign(pagePayload.design)), pageIndex, pageStamp, pageStamp]
      );

      const pageQuestions = Array.isArray(pagePayload.questions) ? pagePayload.questions : [];
      for (let i = 0; i < pageQuestions.length; i += 1) {
        const q = normalizeQuestion(pageQuestions[i], order);
        if (!q.text || !QUESTION_TYPES.has(q.type)) continue;
        const inserted = await run(
          `INSERT INTO questions (survey_id, page_id, question_text, help_text, type, options_json, required, question_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [surveyId, pageCreated.lastID, q.text, q.helpText, q.type, JSON.stringify(q.options), q.required, order]
        );
        await syncQuestionOptions(inserted.lastID, q.options);
        order += 1;
      }
    }

    if (order === 0) {
      const fallbackPage = await ensureSurveyPage(surveyId, "Страница 1");
      const question = normalizeQuestion({ text: "Новый вопрос", type: "text", required: true, options: [] }, 0);
      const inserted = await run(
        `INSERT INTO questions (survey_id, page_id, question_text, help_text, type, options_json, required, question_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [surveyId, fallbackPage.id, question.text, question.helpText, question.type, JSON.stringify(question.options), question.required, 0]
      );
      await syncQuestionOptions(inserted.lastID, question.options);
    }

    res.status(201).json({ id: surveyId, surveyId, status: "draft" });
  } catch (error) {
    next(error);
  }
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
      `SELECT id, owner_user_id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at
       FROM surveys
       WHERE id = ?`,
      [surveyId]
    );
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    const isOwnerPreview = Boolean(req.user && survey.owner_user_id === req.user.id);
    const now = Date.now();
    const startsTs = survey.starts_at ? Date.parse(survey.starts_at) : null;
    const endsTs = survey.ends_at ? Date.parse(survey.ends_at) : null;
    const beforeStart = startsTs && startsTs > now;
    const afterEnd = endsTs && endsTs < now;

    if (survey.status !== "published" && !isOwnerPreview) {
      return res.status(403).json({ error: "Survey is not published" });
    }

    const [pages, questions] = await Promise.all([getSurveyPages(surveyId), getSurveyQuestionsDetailed(surveyId)]);
    const publicOpen = survey.status === "published" && !beforeStart && !afterEnd;

    res.json({
      survey,
      active: publicOpen || (isOwnerPreview && survey.status !== "published"),
      preview: isOwnerPreview && survey.status !== "published",
      blockedByWindow: beforeStart || afterEnd,
      windowState: beforeStart ? "not_started" : afterEnd ? "ended" : "open",
      pages,
      questions
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

    const questions = await getSurveyQuestionsDetailed(surveyId);

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
    const page = await ensureSurveyPage(clone.lastID);

    for (const question of questions) {
      const inserted = await run(
        `INSERT INTO questions (survey_id, page_id, question_text, help_text, type, options_json, required, question_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clone.lastID,
          page.id,
          question.text,
          question.helpText || "",
          question.type,
          JSON.stringify(question.options || []),
          question.required ? 1 : 0,
          question.order
        ]
      );
      await syncQuestionOptions(inserted.lastID, question.options || []);
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
      `SELECT id, owner_user_id, title, description, audience, status, allow_multiple_responses, starts_at, ends_at, created_at, updated_at
       FROM surveys
       WHERE id = ?`,
      [surveyId]
    );

    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.status === "draft" && (!req.user || survey.owner_user_id !== req.user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [pages, questions] = await Promise.all([getSurveyPages(surveyId), getSurveyQuestionsDetailed(surveyId)]);

    res.json({
      survey,
      pages,
      questions
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
    let questionOrder = 0;
    for (let pageIndex = 0; pageIndex < payload.pages.length; pageIndex += 1) {
      const pagePayload = payload.pages[pageIndex];
      const pageStamp = nowIso();
      const page = await run(
        `INSERT INTO pages (survey_id, title, design_json, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [created.lastID, pagePayload.title, JSON.stringify(normalizePageDesign(pagePayload.design)), pageIndex, pageStamp, pageStamp]
      );

      for (const question of pagePayload.questions) {
        const inserted = await run(
          `INSERT INTO questions (survey_id, page_id, question_text, help_text, type, options_json, required, question_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            created.lastID,
            page.lastID,
            question.text,
            question.helpText || "",
            question.type,
            JSON.stringify(question.options),
            question.required,
            questionOrder
          ]
        );
        await syncQuestionOptions(inserted.lastID, question.options || []);
        questionOrder += 1;
      }
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
    if (survey.status === "archived") return res.status(400).json({ error: "Archived survey cannot be edited" });

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
    await run("DELETE FROM pages WHERE survey_id = ?", [surveyId]);

    let questionOrder = 0;
    for (let pageIndex = 0; pageIndex < payload.pages.length; pageIndex += 1) {
      const pagePayload = payload.pages[pageIndex];
      const pageStamp = nowIso();
      const page = await run(
        `INSERT INTO pages (survey_id, title, design_json, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [surveyId, pagePayload.title, JSON.stringify(normalizePageDesign(pagePayload.design)), pageIndex, pageStamp, pageStamp]
      );

      for (const question of pagePayload.questions) {
        const inserted = await run(
          `INSERT INTO questions (survey_id, page_id, question_text, help_text, type, options_json, required, question_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            surveyId,
            page.lastID,
            question.text,
            question.helpText || "",
            question.type,
            JSON.stringify(question.options),
            question.required,
            questionOrder
          ]
        );
        await syncQuestionOptions(inserted.lastID, question.options || []);
        questionOrder += 1;
      }
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/surveys/:id", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get("SELECT id, status FROM surveys WHERE id = ? AND owner_user_id = ?", [surveyId, req.user.id]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.status === "archived") return res.status(400).json({ error: "Archived survey cannot be edited" });

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
    await run("DELETE FROM pages WHERE survey_id = ?", [surveyId]);

    let questionOrder = 0;
    for (let pageIndex = 0; pageIndex < payload.pages.length; pageIndex += 1) {
      const pagePayload = payload.pages[pageIndex];
      const pageStamp = nowIso();
      const page = await run(
        `INSERT INTO pages (survey_id, title, design_json, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [surveyId, pagePayload.title, JSON.stringify(normalizePageDesign(pagePayload.design)), pageIndex, pageStamp, pageStamp]
      );

      for (const question of pagePayload.questions) {
        const inserted = await run(
          `INSERT INTO questions (survey_id, page_id, question_text, help_text, type, options_json, required, question_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            surveyId,
            page.lastID,
            question.text,
            question.helpText || "",
            question.type,
            JSON.stringify(question.options),
            question.required,
            questionOrder
          ]
        );
        await syncQuestionOptions(inserted.lastID, question.options || []);
        questionOrder += 1;
      }
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
    const questionCount = await get("SELECT COUNT(*) as count FROM questions WHERE survey_id = ?", [surveyId]);
    if (!Number(questionCount?.count || 0)) {
      return res.status(400).json({ error: "Add at least one question before publishing" });
    }

    await run("UPDATE surveys SET status = 'published', updated_at = ? WHERE id = ?", [nowIso(), surveyId]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/surveys/:id/archive", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id, status FROM surveys WHERE id = ? AND owner_user_id = ?", [surveyId, req.user.id]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    const nextStatus = survey.status === "archived" ? "published" : "archived";
    await run("UPDATE surveys SET status = ?, updated_at = ? WHERE id = ?", [nextStatus, nowIso(), surveyId]);
    res.json({ ok: true, status: nextStatus });
  } catch (error) {
    next(error);
  }
});

app.post("/api/surveys/:id/unarchive", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id FROM surveys WHERE id = ? AND owner_user_id = ?", [surveyId, req.user.id]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    await run("UPDATE surveys SET status = 'published', updated_at = ? WHERE id = ?", [nowIso(), surveyId]);
    res.json({ ok: true, status: "published" });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/surveys/:id", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId) || surveyId <= 0) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const survey = await get("SELECT id, owner_user_id FROM surveys WHERE id = ?", [surveyId]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.owner_user_id !== req.user.id && survey.owner_user_id != null) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await run("BEGIN IMMEDIATE TRANSACTION");
    try {
      // Explicit cleanup keeps deletion working even on legacy DB schemas without reliable cascades.
      await run("DELETE FROM answers WHERE response_id IN (SELECT id FROM responses WHERE survey_id = ?)", [surveyId]);
      await run("DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)", [surveyId]);
      await run("DELETE FROM question_media WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)", [surveyId]);
      await run("DELETE FROM options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)", [surveyId]);
      await run("DELETE FROM responses WHERE survey_id = ?", [surveyId]);
      await run("DELETE FROM questions WHERE survey_id = ?", [surveyId]);
      await run("DELETE FROM pages WHERE survey_id = ?", [surveyId]);
      await run("DELETE FROM surveys WHERE id = ?", [surveyId]);
      await run("COMMIT");
    } catch (error) {
      await run("ROLLBACK").catch(() => {});
      throw error;
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

async function handleSurveySubmit(req, res, next, surveyIdRaw) {
  try {
    const surveyId = Number(surveyIdRaw);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });

    const survey = await get(
      `SELECT id, status, allow_multiple_responses, starts_at, ends_at
       FROM surveys WHERE id = ?`,
      [surveyId]
    );

    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.status !== "published") return res.status(400).json({ error: "Survey is not published" });
    if (survey.starts_at && Date.parse(survey.starts_at) > Date.now()) {
      return res.status(403).json({ error: "Survey has not started yet" });
    }
    if (survey.ends_at && Date.parse(survey.ends_at) < Date.now()) {
      return res.status(403).json({ error: "Survey is already closed" });
    }

    const questions = await getSurveyQuestionsDetailed(surveyId);

    const answersInput = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const answersByQuestion = new Map();
    answersInput.forEach((answer) => {
      if (!Number.isInteger(Number(answer?.questionId))) return;
      answersByQuestion.set(Number(answer.questionId), answer.value);
    });

    const invalidQuestions = [];

    for (const q of questions) {
      const value = answersByQuestion.get(q.id);
      const required = q.required === 1 || q.required === true;

      if (required && (value === undefined || value === null || value === "")) {
        invalidQuestions.push(q.id);
        continue;
      }

      if (value === undefined || value === null || value === "") continue;

      const options = Array.isArray(q.options) ? q.options : [];
      const optionTexts = options.map((item) => String(item?.text || "").trim()).filter(Boolean);

      if (q.type === "single") {
        if (!optionTexts.includes(String(value))) invalidQuestions.push(q.id);
      }

      if (q.type === "multi") {
        const values = Array.isArray(value) ? value.map((item) => String(item)) : [];
        if (values.length === 0 || values.some((item) => !optionTexts.includes(item))) invalidQuestions.push(q.id);
      }

      if (q.type === "dropdown") {
        if (!optionTexts.includes(String(value))) invalidQuestions.push(q.id);
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
    const respondentHash = participantHash;

    if (!survey.allow_multiple_responses) {
      const previous = await get(
        "SELECT id FROM responses WHERE survey_id = ? AND participant_hash = ? LIMIT 1",
        [surveyId, participantHash]
      );
      if (previous) return res.status(409).json({ error: "Only one response is allowed" });
    }

    const response = await run(
      "INSERT INTO responses (survey_id, participant_hash, respondent_hash, created_at) VALUES (?, ?, ?, ?)",
      [surveyId, participantHash, respondentHash, nowIso()]
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
}

app.post("/api/surveys/:id/respond", async (req, res, next) => {
  return handleSurveySubmit(req, res, next, req.params.id);
});

app.post("/api/public/surveys/:surveyId/submit", async (req, res, next) => {
  return handleSurveySubmit(req, res, next, req.params.surveyId);
});

app.post("/api/surveys/:id/pages", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    if (!Number.isInteger(surveyId)) return res.status(400).json({ error: "Invalid id" });
    const survey = await get("SELECT id FROM surveys WHERE id = ? AND owner_user_id = ?", [surveyId, req.user.id]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });

    const title = String(req.body?.title || "Страница").trim() || "Страница";
    const order = Number(req.body?.orderIndex);
    const maxRow = await get("SELECT COALESCE(MAX(order_index), -1) as max_order FROM pages WHERE survey_id = ?", [surveyId]);
    const orderIndex = Number.isFinite(order) ? order : Number(maxRow?.max_order || -1) + 1;
    const stamp = nowIso();
    const created = await run(
      `INSERT INTO pages (survey_id, title, design_json, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [surveyId, title, JSON.stringify(normalizePageDesign(req.body?.design)), orderIndex, stamp, stamp]
    );
    res.status(201).json({ id: created.lastID, title, orderIndex });
  } catch (error) {
    next(error);
  }
});

app.put("/api/pages/:pageId", requireAuth, async (req, res, next) => {
  try {
    const pageId = Number(req.params.pageId);
    if (!Number.isInteger(pageId)) return res.status(400).json({ error: "Invalid page id" });
    const page = await get(
      `SELECT p.id, p.survey_id
       FROM pages p
       JOIN surveys s ON s.id = p.survey_id
       WHERE p.id = ? AND s.owner_user_id = ?`,
      [pageId, req.user.id]
    );
    if (!page) return res.status(404).json({ error: "Page not found" });
    const title = String(req.body?.title || "").trim();
    const orderIndex = Number(req.body?.orderIndex);
    const hasDesign = req.body && Object.prototype.hasOwnProperty.call(req.body, "design");
    const designJson = hasDesign ? JSON.stringify(normalizePageDesign(req.body.design)) : null;
    await run(
      `UPDATE pages
       SET title = COALESCE(?, title),
           design_json = CASE WHEN ? IS NULL THEN design_json ELSE ? END,
           order_index = CASE WHEN ? IS NULL THEN order_index ELSE ? END,
           updated_at = ?
       WHERE id = ?`,
      [
        title || null,
        designJson,
        designJson,
        Number.isFinite(orderIndex) ? orderIndex : null,
        Number.isFinite(orderIndex) ? orderIndex : null,
        nowIso(),
        pageId
      ]
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/pages/:pageId", requireAuth, async (req, res, next) => {
  try {
    const pageId = Number(req.params.pageId);
    if (!Number.isInteger(pageId)) return res.status(400).json({ error: "Invalid page id" });
    const page = await get(
      `SELECT p.id, p.survey_id
       FROM pages p
       JOIN surveys s ON s.id = p.survey_id
       WHERE p.id = ? AND s.owner_user_id = ?`,
      [pageId, req.user.id]
    );
    if (!page) return res.status(404).json({ error: "Page not found" });

    const pages = await getSurveyPages(page.survey_id);
    if (pages.length <= 1) return res.status(400).json({ error: "Survey must have at least one page" });
    const fallbackPage = pages.find((item) => item.id !== pageId);
    await run("UPDATE questions SET page_id = ? WHERE page_id = ?", [fallbackPage.id, pageId]);
    await run("DELETE FROM pages WHERE id = ?", [pageId]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/pages/:pageId/questions", requireAuth, async (req, res, next) => {
  try {
    const pageId = Number(req.params.pageId);
    if (!Number.isInteger(pageId)) return res.status(400).json({ error: "Invalid page id" });
    const page = await get(
      `SELECT p.id, p.survey_id
       FROM pages p
       JOIN surveys s ON s.id = p.survey_id
       WHERE p.id = ? AND s.owner_user_id = ?`,
      [pageId, req.user.id]
    );
    if (!page) return res.status(404).json({ error: "Page not found" });

    const parsed = normalizeQuestion(req.body, 0);
    if (!QUESTION_TYPES.has(parsed.type)) return res.status(400).json({ error: "Unsupported question type" });
    if (!parsed.text) return res.status(400).json({ error: "Question text is required" });
    const maxOrder = await get("SELECT COALESCE(MAX(question_order), -1) as max_order FROM questions WHERE survey_id = ?", [page.survey_id]);
    const order = Number.isFinite(Number(req.body?.order)) ? Number(req.body.order) : Number(maxOrder?.max_order || -1) + 1;
    const inserted = await run(
      `INSERT INTO questions (survey_id, page_id, question_text, help_text, type, options_json, required, question_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [page.survey_id, pageId, parsed.text, parsed.helpText, parsed.type, JSON.stringify(parsed.options), parsed.required, order]
    );
    await syncQuestionOptions(inserted.lastID, parsed.options || []);
    res.status(201).json({ id: inserted.lastID });
  } catch (error) {
    next(error);
  }
});

app.put("/api/questions/:questionId", requireAuth, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    if (!Number.isInteger(questionId)) return res.status(400).json({ error: "Invalid question id" });
    const question = await get(
      `SELECT q.id, q.survey_id
       FROM questions q
       JOIN surveys s ON s.id = q.survey_id
       WHERE q.id = ? AND s.owner_user_id = ?`,
      [questionId, req.user.id]
    );
    if (!question) return res.status(404).json({ error: "Question not found" });

    const payload = normalizeQuestion(req.body, Number(req.body?.order || 0));
    if (!QUESTION_TYPES.has(payload.type)) return res.status(400).json({ error: "Unsupported question type" });
    const pageId = Number(req.body?.pageId);
    const resolvedPageId = Number.isInteger(pageId) ? pageId : null;
    await run(
      `UPDATE questions
       SET page_id = COALESCE(?, page_id),
           question_text = ?,
           help_text = ?,
           type = ?,
           required = ?,
           question_order = ?
       WHERE id = ?`,
      [resolvedPageId, payload.text, payload.helpText, payload.type, payload.required, payload.order, questionId]
    );
    await syncQuestionOptions(questionId, payload.options || []);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/questions/:questionId", requireAuth, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    if (!Number.isInteger(questionId)) return res.status(400).json({ error: "Invalid question id" });
    const question = await get(
      `SELECT q.id
       FROM questions q
       JOIN surveys s ON s.id = q.survey_id
       WHERE q.id = ? AND s.owner_user_id = ?`,
      [questionId, req.user.id]
    );
    if (!question) return res.status(404).json({ error: "Question not found" });
    await run("DELETE FROM questions WHERE id = ?", [questionId]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/questions/:questionId/options", requireAuth, async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    if (!Number.isInteger(questionId)) return res.status(400).json({ error: "Invalid question id" });
    const question = await get(
      `SELECT q.id
       FROM questions q
       JOIN surveys s ON s.id = q.survey_id
       WHERE q.id = ? AND s.owner_user_id = ?`,
      [questionId, req.user.id]
    );
    if (!question) return res.status(404).json({ error: "Question not found" });
    const options = Array.isArray(req.body?.options)
      ? req.body.options
          .map((item) => {
            if (typeof item === "string") {
              const text = item.trim();
              return text ? { text, imageUrl: "" } : null;
            }
            if (item && typeof item === "object") {
              const text = String(item.text || "").trim();
              const imageUrl = String(item.imageUrl || "").trim();
              if (!text && !imageUrl) return null;
              return { text: text || "Option", imageUrl };
            }
            return null;
          })
          .filter(Boolean)
      : [];
    await syncQuestionOptions(questionId, options);
    res.json({ ok: true, options });
  } catch (error) {
    next(error);
  }
});

app.post("/api/questions/:questionId/media", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    const questionId = Number(req.params.questionId);
    if (!Number.isInteger(questionId)) return res.status(400).json({ error: "Invalid question id" });
    const question = await get(
      `SELECT q.id
       FROM questions q
       JOIN surveys s ON s.id = q.survey_id
       WHERE q.id = ? AND s.owner_user_id = ?`,
      [questionId, req.user.id]
    );
    if (!question) return res.status(404).json({ error: "Question not found" });
    if (!req.file) return res.status(400).json({ error: "File is required" });

    const publicPath = `/uploads/${req.file.filename}`;
    await run(
      `INSERT INTO question_media (question_id, file_path, original_name, mime, size, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [questionId, publicPath, req.file.originalname || "", req.file.mimetype || "", Number(req.file.size || 0), nowIso()]
    );
    res.status(201).json({
      path: publicPath,
      originalName: req.file.originalname || "",
      mime: req.file.mimetype || "",
      size: Number(req.file.size || 0)
    });
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

      if (entry.type === "single" || entry.type === "dropdown") {
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

    const resultsData = await all(
      `SELECT q.question_text, q.type, a.answer_json
       FROM answers a
       JOIN questions q ON q.id = a.question_id
       JOIN responses r ON r.id = a.response_id
       WHERE r.survey_id = ?
       ORDER BY q.question_order ASC`,
      [surveyId]
    );
    const summaryMap = new Map();
    resultsData.forEach((row) => {
      const questionKey = `${row.question_text}||${row.type}`;
      const bucket = summaryMap.get(questionKey) || { question: row.question_text, type: row.type, total: 0, values: {} };
      bucket.total += 1;
      const parsed = safeJsonParse(row.answer_json, "");
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          const key = String(item);
          bucket.values[key] = (bucket.values[key] || 0) + 1;
        });
      } else {
        const key = String(parsed);
        bucket.values[key] = (bucket.values[key] || 0) + 1;
      }
      summaryMap.set(questionKey, bucket);
    });

    const summaryRows = [["question", "type", "total_answers", "value", "count"]];
    summaryMap.forEach((bucket) => {
      const entries = Object.entries(bucket.values);
      if (!entries.length) {
        summaryRows.push([bucket.question, bucket.type, bucket.total, "", 0]);
      } else {
        entries.forEach(([value, count], idx) => {
          summaryRows.push([idx === 0 ? bucket.question : "", idx === 0 ? bucket.type : "", idx === 0 ? bucket.total : "", value, count]);
        });
      }
    });
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
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

app.get("/api/surveys/:id/export.csv", requireAuth, async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id, owner_user_id, title FROM surveys WHERE id = ?", [surveyId]);
    if (!survey) return res.status(404).json({ error: "Survey not found" });
    if (survey.owner_user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    const rowsRaw = await all(
      `SELECT r.id as response_id, r.created_at, q.question_text, a.answer_json
       FROM responses r
       JOIN answers a ON a.response_id = r.id
       JOIN questions q ON q.id = a.question_id
       WHERE r.survey_id = ?
       ORDER BY r.created_at ASC, q.question_order ASC`,
      [surveyId]
    );

    const rows = [["response_id", "created_at", "question_text", "answer_value"].map(csvEscape).join(",")];
    rowsRaw.forEach((item) => {
      const parsed = safeJsonParse(item.answer_json, "");
      const normalized = Array.isArray(parsed) ? parsed.join(" | ") : parsed == null ? "" : String(parsed);
      rows.push([item.response_id, item.created_at, item.question_text, normalized].map(csvEscape).join(","));
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
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.message || "Upload error" });
    return;
  }
  if (error?.message === "Only image files are allowed") {
    res.status(400).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

init()
  .then(async () => {
    await seedDemoSurvey();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(`DB path: ${DB_PATH}`);
      if (process.env.RAILWAY_ENVIRONMENT && !process.env.RAILWAY_VOLUME_MOUNT_PATH && !process.env.DB_PATH) {
        console.warn("No Railway volume mount detected. Database may be ephemeral between deploys.");
      }
    });
  })
  .catch((error) => {
    console.error("Failed to initialize application", error);
    process.exit(1);
  });



