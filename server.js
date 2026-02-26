const express = require("express");
const path = require("path");
const { init, run, all, get } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

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

function validateSurveyInput(body) {
  const errors = [];
  if (!body.title || String(body.title).trim().length < 3) {
    errors.push("title");
  }
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    errors.push("questions");
  }
  const normalizedQuestions = (body.questions || []).map((q, idx) => {
    const text = String(q.text || "").trim();
    const type = String(q.type || "").trim();
    const options = Array.isArray(q.options) ? q.options.map(String) : [];
    return {
      text,
      type,
      options,
      required: q.required === false ? 0 : 1,
      order: Number.isFinite(q.order) ? q.order : idx
    };
  });

  normalizedQuestions.forEach((q, i) => {
    if (!q.text || q.text.length < 3) errors.push(`questions[${i}].text`);
    if (!["text", "single", "multi", "rating"].includes(q.type)) {
      errors.push(`questions[${i}].type`);
    }
    if ((q.type === "single" || q.type === "multi") && q.options.length < 2) {
      errors.push(`questions[${i}].options`);
    }
  });

  return { errors, normalizedQuestions };
}

async function seedDemoSurvey() {
  const existing = await get("SELECT COUNT(*) as count FROM surveys");
  if (existing && existing.count > 0) return;

  const title = "Product Pulse 2026";
  const description =
    "Demo survey: collect feedback on experience, priorities, and feature votes.";

  const surveyRes = await run(
    "INSERT INTO surveys (title, description, status, created_at) VALUES (?, ?, ?, ?)",
    [title, description, "published", nowIso()]
  );

  const surveyId = surveyRes.lastID;
  const questions = [
    {
      text: "How satisfied are you with the new platform?",
      type: "rating",
      options: [],
      required: 1,
      order: 0
    },
    {
      text: "Which feature should we prioritize next?",
      type: "single",
      options: ["Live dashboards", "Team collaboration", "Mobile app", "AI insights"],
      required: 1,
      order: 1
    },
    {
      text: "Which channels do you use to reach participants?",
      type: "multi",
      options: ["Email", "Social", "Website", "Events"],
      required: 0,
      order: 2
    },
    {
      text: "What is the biggest improvement we should make?",
      type: "text",
      options: [],
      required: 0,
      order: 3
    }
  ];

  for (const q of questions) {
    await run(
      "INSERT INTO questions (survey_id, question_text, type, options_json, required, question_order) VALUES (?, ?, ?, ?, ?, ?)",
      [surveyId, q.text, q.type, JSON.stringify(q.options), q.required, q.order]
    );
  }

  const questionRows = await all(
    "SELECT id, question_text FROM questions WHERE survey_id = ?",
    [surveyId]
  );
  const qByText = new Map(questionRows.map((q) => [q.question_text, q.id]));

  const sampleResponses = [
    {
      "How satisfied are you with the new platform?": 5,
      "Which feature should we prioritize next?": "Live dashboards",
      "Which channels do you use to reach participants?": ["Email", "Website"],
      "What is the biggest improvement we should make?":
        "More templates for professional research programs."
    },
    {
      "How satisfied are you with the new platform?": 4,
      "Which feature should we prioritize next?": "AI insights",
      "Which channels do you use to reach participants?": ["Social", "Events"],
      "What is the biggest improvement we should make?":
        "Export results to more formats."
    },
    {
      "How satisfied are you with the new platform?": 5,
      "Which feature should we prioritize next?": "Team collaboration",
      "Which channels do you use to reach participants?": ["Email", "Social"]
    }
  ];

  for (const response of sampleResponses) {
    const responseRes = await run(
      "INSERT INTO responses (survey_id, created_at) VALUES (?, ?)",
      [surveyId, nowIso()]
    );
    const responseId = responseRes.lastID;
    for (const [text, value] of Object.entries(response)) {
      const questionId = qByText.get(text);
      if (!questionId) continue;
      await run(
        "INSERT INTO answers (response_id, question_id, answer_json) VALUES (?, ?, ?)",
        [responseId, questionId, JSON.stringify(value)]
      );
    }
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/surveys", async (req, res, next) => {
  try {
    const status = req.query.status;
    const where = status ? "WHERE status = ?" : "";
    const rows = await all(
      `SELECT id, title, description, status, created_at FROM surveys ${where} ORDER BY created_at DESC`,
      status ? [status] : []
    );
    res.json({ surveys: rows });
  } catch (err) {
    next(err);
  }
});

app.post("/api/surveys", async (req, res, next) => {
  try {
    const { errors, normalizedQuestions } = validateSurveyInput(req.body);
    if (errors.length) {
      return res.status(400).json({ error: "Invalid survey", fields: errors });
    }

    const title = String(req.body.title).trim();
    const description = String(req.body.description || "").trim();

    const result = await run(
      "INSERT INTO surveys (title, description, status, created_at) VALUES (?, ?, ?, ?)",
      [title, description, "draft", nowIso()]
    );

    const surveyId = result.lastID;

    for (const q of normalizedQuestions) {
      await run(
        "INSERT INTO questions (survey_id, question_text, type, options_json, required, question_order) VALUES (?, ?, ?, ?, ?, ?)",
        [surveyId, q.text, q.type, JSON.stringify(q.options), q.required, q.order]
      );
    }

    res.status(201).json({ id: surveyId });
  } catch (err) {
    next(err);
  }
});

app.post("/api/surveys/:id/publish", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id FROM surveys WHERE id = ?", [surveyId]);
    if (!survey) return res.status(404).json({ error: "Not found" });

    await run("UPDATE surveys SET status = 'published' WHERE id = ?", [surveyId]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get("/api/surveys/:id", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get(
      "SELECT id, title, description, status, created_at FROM surveys WHERE id = ?",
      [surveyId]
    );
    if (!survey) return res.status(404).json({ error: "Not found" });

    const questions = await all(
      "SELECT id, question_text, type, options_json, required, question_order FROM questions WHERE survey_id = ? ORDER BY question_order ASC",
      [surveyId]
    );

    const normalizedQuestions = questions.map((q) => ({
      id: q.id,
      text: q.question_text,
      type: q.type,
      options: safeJsonParse(q.options_json, []),
      required: q.required === 1,
      order: q.question_order
    }));

    res.json({ survey, questions: normalizedQuestions });
  } catch (err) {
    next(err);
  }
});

app.post("/api/surveys/:id/respond", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get("SELECT id, status FROM surveys WHERE id = ?", [surveyId]);
    if (!survey) return res.status(404).json({ error: "Not found" });
    if (survey.status !== "published") {
      return res.status(400).json({ error: "Survey is not published" });
    }

    const questions = await all(
      "SELECT id, question_text, type, options_json, required FROM questions WHERE survey_id = ?",
      [surveyId]
    );

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answerByQuestion = new Map();
    answers.forEach((a) => {
      answerByQuestion.set(Number(a.questionId), a.value);
    });

    const validationErrors = [];

    for (const q of questions) {
      const value = answerByQuestion.get(q.id);
      const required = q.required === 1;
      if (required && (value === undefined || value === null || value === "")) {
        validationErrors.push(q.id);
        continue;
      }
      if (value === undefined || value === null || value === "") continue;

      const options = safeJsonParse(q.options_json, []);

      if (q.type === "single") {
        if (!options.includes(String(value))) validationErrors.push(q.id);
      }
      if (q.type === "multi") {
        const arr = Array.isArray(value) ? value.map(String) : [];
        if (arr.length === 0 || arr.some((v) => !options.includes(String(v)))) {
          validationErrors.push(q.id);
        }
      }
      if (q.type === "rating") {
        const rating = Number(value);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
          validationErrors.push(q.id);
        }
      }
    }

    if (validationErrors.length) {
      return res.status(400).json({ error: "Invalid answers", questions: validationErrors });
    }

    const responseResult = await run(
      "INSERT INTO responses (survey_id, created_at) VALUES (?, ?)",
      [surveyId, nowIso()]
    );

    const responseId = responseResult.lastID;

    for (const q of questions) {
      if (!answerByQuestion.has(q.id)) continue;
      const value = answerByQuestion.get(q.id);
      await run(
        "INSERT INTO answers (response_id, question_id, answer_json) VALUES (?, ?, ?)",
        [responseId, q.id, JSON.stringify(value)]
      );
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get("/api/surveys/:id/results", async (req, res, next) => {
  try {
    const surveyId = Number(req.params.id);
    const survey = await get(
      "SELECT id, title, description, status, created_at FROM surveys WHERE id = ?",
      [surveyId]
    );
    if (!survey) return res.status(404).json({ error: "Not found" });

    const questions = await all(
      "SELECT id, question_text, type, options_json, required, question_order FROM questions WHERE survey_id = ? ORDER BY question_order ASC",
      [surveyId]
    );

    const answers = await all(
      "SELECT question_id, answer_json FROM answers WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)",
      [surveyId]
    );

    const statsByQuestion = new Map();
    for (const q of questions) {
      const options = safeJsonParse(q.options_json, []);
      statsByQuestion.set(q.id, {
        id: q.id,
        text: q.question_text,
        type: q.type,
        options,
        required: q.required === 1,
        total: 0,
        counts: {},
        ratings: [],
        samples: []
      });
    }

    for (const a of answers) {
      const entry = statsByQuestion.get(a.question_id);
      if (!entry) continue;
      const value = safeJsonParse(a.answer_json, null);
      entry.total += 1;

      if (entry.type === "single") {
        const key = String(value);
        entry.counts[key] = (entry.counts[key] || 0) + 1;
      } else if (entry.type === "multi") {
        const arr = Array.isArray(value) ? value : [];
        arr.forEach((v) => {
          const key = String(v);
          entry.counts[key] = (entry.counts[key] || 0) + 1;
        });
      } else if (entry.type === "rating") {
        const rating = Number(value);
        if (Number.isFinite(rating)) entry.ratings.push(rating);
      } else {
        if (typeof value === "string" && value.trim()) {
          entry.samples.push(value.trim());
        }
      }
    }

    const results = Array.from(statsByQuestion.values()).map((q) => {
      if (q.type === "rating") {
        const avg = q.ratings.length
          ? q.ratings.reduce((a, b) => a + b, 0) / q.ratings.length
          : 0;
        return { ...q, average: Number(avg.toFixed(2)) };
      }
      return q;
    });

    res.json({ survey, results });
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

init()
  .then(async () => {
    await seedDemoSurvey();
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to init DB", err);
    process.exit(1);
  });
