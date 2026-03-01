const LANG_KEY = "asking-pro-lang";

const pagesList = document.getElementById("pagesList");
const addPageBtn = document.getElementById("addPageBtn");
const questionsCanvas = document.getElementById("questionsCanvas");
const surveyTitle = document.getElementById("surveyTitle");
const surveyDescription = document.getElementById("surveyDescription");
const surveyAudience = document.getElementById("surveyAudience");
const startsAt = document.getElementById("startsAt");
const endsAt = document.getElementById("endsAt");
const allowMultiple = document.getElementById("allowMultiple");
const createSurveyBtn = document.getElementById("createSurveyBtn");
const createStatus = document.getElementById("createStatus");

const settingsEmpty = document.getElementById("settingsEmpty");
const settingsPanel = document.getElementById("settingsPanel");
const settingText = document.getElementById("settingText");
const settingHint = document.getElementById("settingHint");
const settingType = document.getElementById("settingType");
const settingRequired = document.getElementById("settingRequired");
const settingOptions = document.getElementById("settingOptions");
const deleteQuestionBtn = document.getElementById("deleteQuestionBtn");

const questionModal = document.getElementById("questionModal");
const openQuestionModalBtn = document.getElementById("openQuestionModalBtn");
const closeQuestionModalBtn = document.getElementById("closeQuestionModalBtn");
const saveQuestionBtn = document.getElementById("saveQuestionBtn");
const newQuestionText = document.getElementById("newQuestionText");
const newQuestionHint = document.getElementById("newQuestionHint");
const newQuestionType = document.getElementById("newQuestionType");
const newQuestionOptions = document.getElementById("newQuestionOptions");
const newQuestionRequired = document.getElementById("newQuestionRequired");

const logoutBtn = document.getElementById("logoutBtn");
const languageSelect = document.getElementById("languageSelect");

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }
};

const state = {
  pages: [{ id: 1, title: "Страница 1", questions: [] }],
  activePageId: 1,
  selectedQuestionId: null
};

let nextPageId = 2;
let nextQuestionId = 1;

function activePage() {
  return state.pages.find((p) => p.id === state.activePageId);
}

function parseOptions(text) {
  return String(text || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionsRequired(type) {
  return type === "single" || type === "multi";
}

function renderPages() {
  pagesList.innerHTML = "";
  state.pages.forEach((page) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `builder-page-item${page.id === state.activePageId ? " is-active" : ""}`;
    node.textContent = page.title;
    node.addEventListener("click", () => {
      state.activePageId = page.id;
      state.selectedQuestionId = null;
      renderAll();
    });
    pagesList.appendChild(node);
  });
}

function questionSummary(question) {
  if (question.type === "rating") return "Рейтинг 1-5";
  if (question.type === "single") return "Одиночный выбор";
  if (question.type === "multi") return "Множественный выбор";
  return "Текст";
}

function renderQuestions() {
  const page = activePage();
  questionsCanvas.innerHTML = "";

  if (!page.questions.length) {
    questionsCanvas.innerHTML = `<div class="card">На этой странице пока нет вопросов. Нажмите «Добавить вопрос».</div>`;
    return;
  }

  page.questions.forEach((question, index) => {
    const node = document.createElement("button");
    node.type = "button";
    node.className = `builder-question${question.id === state.selectedQuestionId ? " is-selected" : ""}`;
    node.innerHTML = `
      <div class="builder-question__top">
        <strong>${index + 1}. ${question.text || "Без текста"}</strong>
        <span>${question.required ? "Обязательный" : "Необязательный"}</span>
      </div>
      <p>${question.hint || "-"}</p>
      <small>${questionSummary(question)}</small>
    `;
    node.addEventListener("click", () => {
      state.selectedQuestionId = question.id;
      renderSettings();
      renderQuestions();
    });
    questionsCanvas.appendChild(node);
  });
}

function selectedQuestion() {
  const page = activePage();
  return page.questions.find((q) => q.id === state.selectedQuestionId) || null;
}

function renderSettings() {
  const question = selectedQuestion();
  if (!question) {
    settingsEmpty.hidden = false;
    settingsPanel.hidden = true;
    return;
  }
  settingsEmpty.hidden = true;
  settingsPanel.hidden = false;

  settingText.value = question.text || "";
  settingHint.value = question.hint || "";
  settingType.value = question.type;
  settingRequired.checked = !!question.required;
  settingOptions.value = (question.options || []).join("\n");
  settingOptions.disabled = !optionsRequired(question.type);
}

function renderAll() {
  renderPages();
  renderQuestions();
  renderSettings();
}

function openQuestionModal() {
  newQuestionText.value = "";
  newQuestionHint.value = "";
  newQuestionType.value = "text";
  newQuestionOptions.value = "";
  newQuestionRequired.checked = true;
  questionModal.hidden = false;
}

function closeQuestionModal() {
  questionModal.hidden = true;
}

function setStatus(message, error = false) {
  createStatus.textContent = message;
  createStatus.style.color = error ? "#b91c1c" : "#166534";
}

function collectPayload() {
  const allQuestions = [];
  let order = 0;
  state.pages.forEach((page) => {
    page.questions.forEach((q) => {
      allQuestions.push({
        text: q.text,
        type: q.type,
        required: !!q.required,
        options: optionsRequired(q.type) ? q.options : [],
        order: order++
      });
    });
  });

  return {
    title: surveyTitle.value.trim(),
    description: surveyDescription.value.trim(),
    audience: surveyAudience.value.trim(),
    startsAt: startsAt.value ? new Date(startsAt.value).toISOString() : null,
    endsAt: endsAt.value ? new Date(endsAt.value).toISOString() : null,
    allowMultipleResponses: allowMultiple.checked,
    questions: allQuestions
  };
}

async function createSurvey() {
  const payload = collectPayload();
  if (payload.title.length < 3) {
    setStatus("Название должно быть не менее 3 символов.", true);
    return;
  }
  if (!payload.questions.length) {
    setStatus("Добавьте хотя бы один вопрос.", true);
    return;
  }
  for (const q of payload.questions) {
    if (!q.text || q.text.length < 2) {
      setStatus("У каждого вопроса должен быть текст.", true);
      return;
    }
    if (optionsRequired(q.type) && (!q.options || q.options.length < 2)) {
      setStatus("Для вопросов с выбором добавьте минимум 2 варианта.", true);
      return;
    }
  }

  try {
    const created = await api.request("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setStatus(`Анкета #${created.id} создана. Переход в кабинет...`);
    setTimeout(() => {
      window.location.href = "/cabinet";
    }, 800);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function wireSettings() {
  const sync = () => {
    const question = selectedQuestion();
    if (!question) return;
    question.text = settingText.value.trim();
    question.hint = settingHint.value.trim();
    question.type = settingType.value;
    question.required = settingRequired.checked;
    question.options = parseOptions(settingOptions.value);
    settingOptions.disabled = !optionsRequired(question.type);
    if (!optionsRequired(question.type)) question.options = [];
    renderQuestions();
  };

  settingText.addEventListener("input", sync);
  settingHint.addEventListener("input", sync);
  settingType.addEventListener("change", sync);
  settingRequired.addEventListener("change", sync);
  settingOptions.addEventListener("input", sync);

  deleteQuestionBtn.addEventListener("click", () => {
    const page = activePage();
    page.questions = page.questions.filter((q) => q.id !== state.selectedQuestionId);
    state.selectedQuestionId = null;
    renderAll();
  });
}

function wireActions() {
  addPageBtn.addEventListener("click", () => {
    const id = nextPageId++;
    state.pages.push({ id, title: `Страница ${state.pages.length + 1}`, questions: [] });
    state.activePageId = id;
    state.selectedQuestionId = null;
    renderAll();
  });

  openQuestionModalBtn.addEventListener("click", openQuestionModal);
  closeQuestionModalBtn.addEventListener("click", closeQuestionModal);
  questionModal.addEventListener("click", (event) => {
    if (event.target === questionModal) closeQuestionModal();
  });

  saveQuestionBtn.addEventListener("click", () => {
    const text = newQuestionText.value.trim();
    const type = newQuestionType.value;
    const options = parseOptions(newQuestionOptions.value);
    if (text.length < 2) {
      setStatus("Введите текст вопроса.", true);
      return;
    }
    if (optionsRequired(type) && options.length < 2) {
      setStatus("Для выбора нужно минимум 2 варианта.", true);
      return;
    }

    const question = {
      id: nextQuestionId++,
      text,
      hint: newQuestionHint.value.trim(),
      type,
      required: newQuestionRequired.checked,
      options
    };
    activePage().questions.push(question);
    state.selectedQuestionId = question.id;
    closeQuestionModal();
    setStatus("");
    renderAll();
  });

  createSurveyBtn.addEventListener("click", createSurvey);

  languageSelect.addEventListener("change", () => {
    localStorage.setItem(LANG_KEY, languageSelect.value);
  });

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });
}

async function bootstrap() {
  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }
  const lang = ["en", "ru", "kz"].includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : "ru";
  languageSelect.value = lang;

  renderAll();
  wireSettings();
  wireActions();
}

bootstrap().catch(() => {
  setStatus("Не удалось загрузить конструктор.", true);
});
