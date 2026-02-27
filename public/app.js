const state = {
  editingSurveyId: null,
  filters: {
    status: "",
    q: "",
    sort: "newest"
  },
  surveys: [],
  templates: [],
  lang: localStorage.getItem("asking-pro-lang") || "ru"
};

const DRAFT_CACHE_KEY = "asking-pro-builder-draft";
const languageSelect = document.getElementById("languageSelect");

const i18n = {
  en: {
    navDashboard: "Dashboard",
    navBuilder: "Builder",
    navSurveys: "Surveys",
    navAnalytics: "Analytics",
    newSurvey: "New Survey",
    heroEyebrow: "INTERACTIVE WEB PLATFORM",
    heroTitle: "Professional survey and voting workspace.",
    heroLead: "Build surveys, launch public voting, collect live responses, and export results to CSV for deep analysis.",
    startBuilding: "Start Building",
    openDemoResults: "Open Demo Results",
    coreCapabilities: "Core capabilities",
    heroFeature1: "Question builder: text, single, multi, rating",
    heroFeature2: "Survey lifecycle: draft, publish, archive",
    heroFeature3: "Duplicate survey and share links",
    heroFeature4: "Analytics, trends, and CSV export",
    dashboardTitle: "Operations dashboard",
    dashboardLead: "Track platform KPIs and latest activity.",
    recentSurveysTitle: "Recent surveys",
    builderTitle: "Survey builder",
    titleLabel: "Title",
    titlePlaceholder: "Example: Customer Experience 2026",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Survey goal and context",
    audienceLabel: "Audience",
    audiencePlaceholder: "Customers, team members, event attendees",
    templateLabel: "Template",
    startsAtLabel: "Starts at",
    endsAtLabel: "Ends at",
    allowMultipleResponses: "Allow multiple responses",
    addQuestion: "+ Add question",
    saveDraft: "Save Draft",
    bestPractices: "Best practices",
    bestPractice1: "Add one rating question for quick quality scoring.",
    bestPractice2: "Use single choice for priority votes and multi choice for channels.",
    bestPractice3: "Archive finished surveys to keep active board clean.",
    libraryTitle: "Survey library",
    libraryLead: "Manage drafts, published surveys, and archives.",
    allStatuses: "All statuses",
    sortNewest: "Newest first",
    sortResponses: "Most responses",
    sortActive: "Active only",
    searchPlaceholder: "Search by title",
    analyticsTitle: "Analytics and voting results",
    analyticsLead: "Open a survey from the library and click Results.",
    close: "Close",
    statusDraft: "Draft",
    statusPublished: "Published",
    statusArchived: "Archived",
    metricTotalSurveys: "Total surveys",
    metricPublished: "Published",
    metricActive: "Active",
    metricResponses: "Total responses",
    noSurveysYet: "No surveys yet",
    noSurveysFound: "No surveys found.",
    selectTemplate: "Select a template"
  },
  ru: {
    navDashboard: "Дашборд",
    navBuilder: "Конструктор",
    navSurveys: "Анкеты",
    navAnalytics: "Аналитика",
    newSurvey: "Новая анкета",
    heroEyebrow: "ИНТЕРАКТИВНАЯ WEB-ПЛАТФОРМА",
    heroTitle: "Профессиональное пространство для анкет и голосований.",
    heroLead: "Создавайте анкеты, запускайте голосования, собирайте ответы в реальном времени и экспортируйте результаты в CSV.",
    startBuilding: "Начать",
    openDemoResults: "Открыть демо",
    coreCapabilities: "Ключевые возможности",
    heroFeature1: "Конструктор вопросов: текст, одиночный, множественный, рейтинг",
    heroFeature2: "Жизненный цикл анкеты: черновик, публикация, архив",
    heroFeature3: "Дублирование анкеты и ссылка для респондентов",
    heroFeature4: "Аналитика, тренды и экспорт CSV",
    dashboardTitle: "Операционный дашборд",
    dashboardLead: "Отслеживайте KPI платформы и последнюю активность.",
    recentSurveysTitle: "Последние анкеты",
    builderTitle: "Конструктор анкеты",
    titleLabel: "Название",
    titlePlaceholder: "Пример: Оценка сервиса 2026",
    descriptionLabel: "Описание",
    descriptionPlaceholder: "Цель и контекст анкеты",
    audienceLabel: "Аудитория",
    audiencePlaceholder: "Клиенты, команда, участники мероприятия",
    templateLabel: "Шаблон",
    startsAtLabel: "Начало",
    endsAtLabel: "Окончание",
    allowMultipleResponses: "Разрешить повторные ответы",
    addQuestion: "+ Добавить вопрос",
    saveDraft: "Сохранить черновик",
    bestPractices: "Практики",
    bestPractice1: "Добавьте минимум один вопрос рейтинга для быстрой оценки качества.",
    bestPractice2: "Используйте одиночный выбор для приоритетов и мультивыбор для каналов.",
    bestPractice3: "Архивируйте завершенные анкеты, чтобы очищать активную ленту.",
    libraryTitle: "Библиотека анкет",
    libraryLead: "Управляйте черновиками, публикациями и архивом.",
    allStatuses: "Все статусы",
    sortNewest: "Сначала новые",
    sortResponses: "Больше ответов",
    sortActive: "Только активные",
    searchPlaceholder: "Поиск по названию",
    analyticsTitle: "Аналитика и результаты",
    analyticsLead: "Откройте анкету в библиотеке и нажмите «Результаты».",
    close: "Закрыть",
    statusDraft: "Черновик",
    statusPublished: "Опубликована",
    statusArchived: "Архив",
    metricTotalSurveys: "Всего анкет",
    metricPublished: "Опубликовано",
    metricActive: "Активные",
    metricResponses: "Всего ответов",
    noSurveysYet: "Анкет пока нет",
    noSurveysFound: "Анкеты не найдены.",
    selectTemplate: "Выберите шаблон"
  }
};

function t(key) {
  return i18n[state.lang]?.[key] || i18n.en[key] || key;
}

function applyStaticI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key));
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    el.setAttribute("aria-label", t(key));
  });
}

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Request failed");
      error.payload = data;
      throw error;
    }
    return data;
  },
  getDashboard() {
    return this.request("/api/dashboard");
  },
  getTemplates() {
    return this.request("/api/templates");
  },
  getSurveys(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.q) query.set("q", params.q);
    return this.request(`/api/surveys${query.toString() ? `?${query.toString()}` : ""}`);
  },
  getSurvey(id) {
    return this.request(`/api/surveys/${id}`);
  },
  createSurvey(payload) {
    return this.request("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  updateSurvey(id, payload) {
    return this.request(`/api/surveys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  duplicateSurvey(id) {
    return this.request(`/api/surveys/${id}/duplicate`, { method: "POST" });
  },
  publishSurvey(id) {
    return this.request(`/api/surveys/${id}/publish`, { method: "POST" });
  },
  archiveSurvey(id) {
    return this.request(`/api/surveys/${id}/archive`, { method: "POST" });
  },
  deleteSurvey(id) {
    return this.request(`/api/surveys/${id}`, { method: "DELETE" });
  },
  respond(id, payload) {
    return this.request(`/api/surveys/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  getResults(id) {
    return this.request(`/api/surveys/${id}/results`);
  }
};

const questionTypes = [
  { value: "text", label: "Text" },
  { value: "single", label: "Single choice" },
  { value: "multi", label: "Multiple choice" },
  { value: "rating", label: "Rating 1-5" }
];

const surveyForm = document.getElementById("surveyForm");
const questionsWrap = document.getElementById("questions");
const addQuestionBtn = document.getElementById("addQuestion");
const builderStatus = document.getElementById("builderStatus");
const templateSelect = document.getElementById("templateSelect");
const metricsWrap = document.getElementById("metrics");
const recentSurveysWrap = document.getElementById("recentSurveys");
const surveyList = document.getElementById("surveyList");
const resultsWrap = document.getElementById("results");
const statusFilter = document.getElementById("statusFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");
const toast = document.getElementById("toast");

let questionCounter = 0;
let toastTimer = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = `toast${isError ? " toast--error" : ""}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3000);
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function toIsoFromLocal(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function statusLabel(status) {
  if (status === "published") return t("statusPublished");
  if (status === "archived") return t("statusArchived");
  return t("statusDraft");
}

function badgeClass(status) {
  if (status === "published") return "badge badge--published";
  if (status === "archived") return "badge badge--archived";
  return "badge badge--draft";
}

function setStatus(message, isError = false) {
  builderStatus.textContent = message;
  builderStatus.style.color = isError ? "#b6201f" : "#c33f17";
}

function cacheBuilderDraft() {
  try {
    const payload = collectSurveyPayload();
    localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore cache errors
  }
}

function restoreBuilderDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_CACHE_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object") return;

    surveyForm.title.value = payload.title || "";
    surveyForm.description.value = payload.description || "";
    surveyForm.audience.value = payload.audience || "";
    surveyForm.startsAt.value = toDateTimeLocalValue(payload.startsAt);
    surveyForm.endsAt.value = toDateTimeLocalValue(payload.endsAt);
    surveyForm.allowMultipleResponses.checked = !!payload.allowMultipleResponses;

    questionsWrap.innerHTML = "";
    const questions = Array.isArray(payload.questions) ? payload.questions : [];
    if (!questions.length) {
      addQuestion();
    } else {
      questions.forEach((q) => addQuestion(q));
    }
  } catch {
    // ignore parse errors
  }
}

function createOptionInput(value = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Answer option";
  input.value = value;
  input.addEventListener("input", cacheBuilderDraft);
  return input;
}

function createQuestionBlock(question = null) {
  const block = document.createElement("div");
  block.className = "question";
  block.dataset.questionId = String(questionCounter++);

  block.innerHTML = `
    <div class="row">
      <div class="form-row">
        <label>Question text</label>
        <input name="questionText" type="text" required />
      </div>
      <div class="form-row">
        <label>Type</label>
        <select name="questionType">
          ${questionTypes.map((type) => `<option value="${type.value}">${type.label}</option>`).join("")}
        </select>
      </div>
      <div class="form-row options-box" style="display:none;">
        <label>Options</label>
        <div class="options"></div>
        <button type="button" class="btn btn--ghost add-option">+ Add option</button>
      </div>
      <label class="inline-check">
        <input type="checkbox" name="required" checked />
        Required question
      </label>
      <button type="button" class="btn btn--outline remove-question">Remove question</button>
    </div>
  `;

  const textInput = block.querySelector("input[name='questionText']");
  const typeSelect = block.querySelector("select[name='questionType']");
  const requiredInput = block.querySelector("input[name='required']");
  const optionsBox = block.querySelector(".options-box");
  const optionsWrap = block.querySelector(".options");
  const addOptionButton = block.querySelector(".add-option");

  function addOption(value = "") {
    optionsWrap.appendChild(createOptionInput(value));
  }

  function ensureMinimumOptions() {
    if ((typeSelect.value === "single" || typeSelect.value === "multi") && optionsWrap.children.length < 2) {
      if (optionsWrap.children.length === 0) {
        addOption("Option 1");
        addOption("Option 2");
      } else if (optionsWrap.children.length === 1) {
        addOption("Option 2");
      }
    }
  }

  function syncOptionsVisibility() {
    const isChoice = typeSelect.value === "single" || typeSelect.value === "multi";
    optionsBox.style.display = isChoice ? "block" : "none";
    if (isChoice) ensureMinimumOptions();
  }

  typeSelect.addEventListener("change", () => {
    syncOptionsVisibility();
    cacheBuilderDraft();
  });
  textInput.addEventListener("input", cacheBuilderDraft);
  requiredInput.addEventListener("change", cacheBuilderDraft);
  addOptionButton.addEventListener("click", () => {
    addOption("");
    cacheBuilderDraft();
  });

  block.querySelector(".remove-question").addEventListener("click", () => {
    block.remove();
    cacheBuilderDraft();
  });

  if (question) {
    textInput.value = question.text || "";
    typeSelect.value = question.type || "text";
    requiredInput.checked = !!question.required;
    if (Array.isArray(question.options)) {
      question.options.forEach((option) => addOption(option));
    }
  }

  syncOptionsVisibility();
  return block;
}

function addQuestion(question = null) {
  questionsWrap.appendChild(createQuestionBlock(question));
}

function resetBuilder() {
  state.editingSurveyId = null;
  surveyForm.reset();
  questionsWrap.innerHTML = "";
  addQuestion();
  localStorage.removeItem(DRAFT_CACHE_KEY);
}

function collectSurveyPayload() {
  const formData = new FormData(surveyForm);
  const questions = Array.from(questionsWrap.querySelectorAll(".question")).map((block, index) => {
    const options = Array.from(block.querySelectorAll(".options input"))
      .map((input) => input.value.trim())
      .filter(Boolean);

    return {
      text: block.querySelector("input[name='questionText']").value.trim(),
      type: block.querySelector("select[name='questionType']").value,
      required: block.querySelector("input[name='required']").checked,
      options,
      order: index
    };
  });

  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    audience: String(formData.get("audience") || "").trim(),
    startsAt: toIsoFromLocal(String(formData.get("startsAt") || "")),
    endsAt: toIsoFromLocal(String(formData.get("endsAt") || "")),
    allowMultipleResponses: formData.get("allowMultipleResponses") === "on",
    questions
  };
}

function openModal(contentNode) {
  modalBody.innerHTML = "";
  modalBody.appendChild(contentNode);
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  modalBody.innerHTML = "";
}

function renderMetrics(metrics) {
  metricsWrap.innerHTML = "";
  const cards = [
    [t("metricTotalSurveys"), metrics.totalSurveys],
    [t("metricPublished"), metrics.publishedSurveys],
    [t("metricActive"), metrics.activeSurveys],
    [t("metricResponses"), metrics.totalResponses]
  ];

  cards.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "metric";
    card.innerHTML = `<span>${label}</span><strong>${Number(value || 0)}</strong>`;
    metricsWrap.appendChild(card);
  });
}

function renderRecentSurveys(items) {
  recentSurveysWrap.innerHTML = "";
  if (!items.length) {
    recentSurveysWrap.innerHTML = `<div class='recent-item'>${t("noSurveysYet")}</div>`;
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "recent-item";
    row.innerHTML = `<strong>${escapeHtml(item.title)}</strong><span>${statusLabel(item.status)}</span>`;
    recentSurveysWrap.appendChild(row);
  });
}

async function loadDashboard() {
  const data = await api.getDashboard();
  renderMetrics(data.metrics);
  renderRecentSurveys(data.recentSurveys || []);
}

function buildResponseForm(survey, questions) {
  const wrapper = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = survey.title;
  const desc = document.createElement("p");
  desc.textContent = survey.description || "";
  wrapper.appendChild(title);
  wrapper.appendChild(desc);

  const form = document.createElement("form");
  form.className = "card";
  form.style.marginTop = "10px";

  questions.forEach((question) => {
    const block = document.createElement("div");
    block.className = "form-row";

    const label = document.createElement("label");
    label.textContent = `${question.text}${question.required ? " *" : ""}`;
    block.appendChild(label);

    if (question.type === "text") {
      const input = document.createElement("textarea");
      input.name = `q_${question.id}`;
      block.appendChild(input);
    } else if (question.type === "rating") {
      const select = document.createElement("select");
      select.name = `q_${question.id}`;
      select.appendChild(new Option("Select rating", ""));
      [1, 2, 3, 4, 5].forEach((value) => select.appendChild(new Option(String(value), String(value))));
      block.appendChild(select);
    } else if (question.type === "single") {
      const select = document.createElement("select");
      select.name = `q_${question.id}`;
      select.appendChild(new Option("Select option", ""));
      question.options.forEach((value) => select.appendChild(new Option(value, value)));
      block.appendChild(select);
    } else if (question.type === "multi") {
      const multiWrap = document.createElement("div");
      multiWrap.className = "options";
      question.options.forEach((value) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "inline-check";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = `q_${question.id}`;
        checkbox.value = value;
        optionLabel.appendChild(checkbox);
        optionLabel.appendChild(document.createTextNode(value));
        multiWrap.appendChild(optionLabel);
      });
      block.appendChild(multiWrap);
    }

    form.appendChild(block);
  });

  const submit = document.createElement("button");
  submit.className = "btn";
  submit.type = "submit";
  submit.textContent = "Submit response";
  form.appendChild(submit);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = { answers: [] };

    questions.forEach((question) => {
      const key = `q_${question.id}`;
      if (question.type === "multi") {
        const values = Array.from(form.querySelectorAll(`input[name='${key}']:checked`)).map((node) => node.value);
        if (values.length) payload.answers.push({ questionId: question.id, value: values });
      } else {
        const field = form.querySelector(`[name='${key}']`);
        const value = field ? String(field.value || "").trim() : "";
        if (value) payload.answers.push({ questionId: question.id, value });
      }
    });

    try {
      await api.respond(survey.id, payload);
      submit.textContent = "Response saved";
      submit.disabled = true;
      showToast("Response submitted");
      await loadDashboard();
      await loadResults(survey.id);
      await loadSurveys();
    } catch (error) {
      showToast(error.message || "Submission failed", true);
    }
  });

  wrapper.appendChild(form);
  return wrapper;
}

function fillBuilderForEdit(survey, questions) {
  state.editingSurveyId = survey.id;
  surveyForm.title.value = survey.title || "";
  surveyForm.description.value = survey.description || "";
  surveyForm.audience.value = survey.audience || "";
  surveyForm.startsAt.value = toDateTimeLocalValue(survey.starts_at);
  surveyForm.endsAt.value = toDateTimeLocalValue(survey.ends_at);
  surveyForm.allowMultipleResponses.checked = survey.allow_multiple_responses === 1;

  questionsWrap.innerHTML = "";
  questions.forEach((question) => addQuestion(question));
  setStatus(`Edit mode for survey #${survey.id}`);
  document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
  cacheBuilderDraft();
}

function sortSurveys(items) {
  const list = [...items];

  if (state.filters.sort === "responses") {
    return list.sort((a, b) => Number(b.responses_count || 0) - Number(a.responses_count || 0));
  }

  if (state.filters.sort === "active") {
    return list.filter((item) => item.is_active);
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

async function copyShareLink(id) {
  const link = `${window.location.origin}/?survey=${id}`;
  try {
    await navigator.clipboard.writeText(link);
    showToast("Share link copied");
  } catch {
    showToast("Cannot copy link", true);
  }
}

function renderSurveyCard(survey) {
  const card = document.createElement("article");
  card.className = "survey-card";
  card.innerHTML = `
    <div class="survey-card__top">
      <div>
        <h3>${escapeHtml(survey.title)}</h3>
        <p>${escapeHtml(survey.description || "No description")}</p>
      </div>
      <span class="${badgeClass(survey.status)}">${statusLabel(survey.status)}</span>
    </div>
    <div class="meta">
      <span>Audience: ${escapeHtml(survey.audience || "not specified")}</span>
      <span>Starts: ${escapeHtml(formatDateTime(survey.starts_at))}</span>
      <span>Ends: ${escapeHtml(formatDateTime(survey.ends_at))}</span>
      <span>Responses: ${Number(survey.responses_count || 0)}</span>
      <span>Active: ${survey.is_active ? "yes" : "no"}</span>
      <span>Multi response: ${survey.allow_multiple_responses ? "yes" : "no"}</span>
    </div>
    <div class="survey-card__actions"></div>
  `;

  const actions = card.querySelector(".survey-card__actions");

  const openButton = document.createElement("button");
  openButton.className = "btn btn--ghost";
  openButton.textContent = "Open";
  openButton.addEventListener("click", async () => {
    try {
      const details = await api.getSurvey(survey.id);
      openModal(buildResponseForm(details.survey, details.questions));
    } catch (error) {
      showToast(error.message, true);
    }
  });
  actions.appendChild(openButton);

  const resultsButton = document.createElement("button");
  resultsButton.className = "btn btn--outline";
  resultsButton.textContent = "Results";
  resultsButton.addEventListener("click", async () => {
    await loadResults(survey.id);
    document.getElementById("analytics").scrollIntoView({ behavior: "smooth" });
  });
  actions.appendChild(resultsButton);

  const shareButton = document.createElement("button");
  shareButton.className = "btn btn--ghost";
  shareButton.textContent = "Copy Link";
  shareButton.addEventListener("click", () => copyShareLink(survey.id));
  actions.appendChild(shareButton);

  const exportButton = document.createElement("a");
  exportButton.className = "btn btn--ghost";
  exportButton.href = `/api/surveys/${survey.id}/export.csv`;
  exportButton.textContent = "Export CSV";
  actions.appendChild(exportButton);

  const duplicateButton = document.createElement("button");
  duplicateButton.className = "btn btn--ghost";
  duplicateButton.textContent = "Duplicate";
  duplicateButton.addEventListener("click", async () => {
    await api.duplicateSurvey(survey.id);
    showToast("Survey duplicated");
    await refreshAll();
  });
  actions.appendChild(duplicateButton);

  if (survey.status === "draft") {
    const editButton = document.createElement("button");
    editButton.className = "btn btn--ghost";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", async () => {
      const details = await api.getSurvey(survey.id);
      fillBuilderForEdit(details.survey, details.questions);
    });
    actions.appendChild(editButton);

    const publishButton = document.createElement("button");
    publishButton.className = "btn";
    publishButton.textContent = "Publish";
    publishButton.addEventListener("click", async () => {
      await api.publishSurvey(survey.id);
      showToast("Survey published");
      await refreshAll();
    });
    actions.appendChild(publishButton);
  }

  if (survey.status === "published") {
    const archiveButton = document.createElement("button");
    archiveButton.className = "btn btn--outline";
    archiveButton.textContent = "Archive";
    archiveButton.addEventListener("click", async () => {
      await api.archiveSurvey(survey.id);
      showToast("Survey archived");
      await refreshAll();
    });
    actions.appendChild(archiveButton);
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn--danger";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", async () => {
    if (!window.confirm(`Delete survey '${survey.title}'?`)) return;
    await api.deleteSurvey(survey.id);
    showToast("Survey deleted");
    await refreshAll();
  });
  actions.appendChild(deleteButton);

  return card;
}

async function loadSurveys() {
  const data = await api.getSurveys(state.filters);
  state.surveys = sortSurveys(data.surveys || []);
  surveyList.innerHTML = "";

  if (!state.surveys.length) {
    surveyList.innerHTML = `<div class='card'>${t("noSurveysFound")}</div>`;
    return;
  }

  state.surveys.forEach((survey) => surveyList.appendChild(renderSurveyCard(survey)));
}

function renderTrend(trend) {
  if (!trend.length) return "<p>No responses yet.</p>";
  const max = Math.max(...trend.map((item) => Number(item.count || 0)), 1);

  return trend
    .map((item) => {
      const count = Number(item.count || 0);
      const percent = Math.round((count / max) * 100);
      return `
        <div class="result-row">
          <div class="result-head"><span>${escapeHtml(item.day)}</span><strong>${count}</strong></div>
          <div class="track"><div style="width:${percent}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderQuestionResult(result) {
  if (result.type === "rating") {
    return `<p>Average rating: <strong>${Number(result.average || 0)}</strong> / 5</p><p>Responses: ${result.total}</p>`;
  }

  if (result.type === "text") {
    if (!result.samples.length) return "<p>No text answers yet.</p>";
    return `<div>${result.samples
      .slice(0, 8)
      .map((item) => `<div class='result-row'><div class='card'>${escapeHtml(item)}</div></div>`)
      .join("")}</div>`;
  }

  const entries = Object.entries(result.counts || {});
  if (!entries.length) return "<p>No responses yet.</p>";

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => {
      const percent = result.total ? Math.round((count / result.total) * 100) : 0;
      return `
        <div class="result-row">
          <div class="result-head"><span>${escapeHtml(label)}</span><strong>${count} (${percent}%)</strong></div>
          <div class="track"><div style="width:${percent}%"></div></div>
        </div>
      `;
    })
    .join("");
}

async function loadResults(surveyId) {
  const data = await api.getResults(surveyId);
  resultsWrap.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "result-card";
  summary.innerHTML = `
    <h3>${escapeHtml(data.survey.title)}</h3>
    <p>${escapeHtml(data.survey.description || "")}</p>
    <p>Total responses: <strong>${Number(data.summary.totalResponses || 0)}</strong></p>
    <p>Active status: <strong>${data.summary.active ? "active" : "inactive"}</strong></p>
  `;
  resultsWrap.appendChild(summary);

  const trendCard = document.createElement("div");
  trendCard.className = "result-card";
  trendCard.innerHTML = `<h3>Response trend</h3>${renderTrend(data.trend || [])}`;
  resultsWrap.appendChild(trendCard);

  data.results.forEach((result) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `<h3>${escapeHtml(result.text)}</h3>${renderQuestionResult(result)}`;
    resultsWrap.appendChild(card);
  });
}

function fillTemplateSelect() {
  templateSelect.innerHTML = `<option value="">${t("selectTemplate")}</option>`;
  state.templates.forEach((template) => {
    const option = document.createElement("option");
    option.value = template.key;
    option.textContent = template.title;
    templateSelect.appendChild(option);
  });
}

function applyTemplate(templateKey) {
  const template = state.templates.find((item) => item.key === templateKey);
  if (!template) return;

  surveyForm.title.value = template.title;
  surveyForm.description.value = template.description;
  surveyForm.audience.value = template.audience;

  questionsWrap.innerHTML = "";
  template.questions.forEach((question, index) => {
    addQuestion({ ...question, order: index });
  });

  cacheBuilderDraft();
  showToast("Template applied");
}

async function submitSurvey(event) {
  event.preventDefault();
  const payload = collectSurveyPayload();

  try {
    if (state.editingSurveyId) {
      await api.updateSurvey(state.editingSurveyId, payload);
      setStatus(`Survey #${state.editingSurveyId} updated.`);
      showToast("Survey updated");
    } else {
      const created = await api.createSurvey(payload);
      setStatus(`Survey #${created.id} saved as draft.`);
      showToast("Survey created");
    }

    resetBuilder();
    await refreshAll();
  } catch (error) {
    const fields = error.payload?.fields?.join(", ");
    setStatus(`Error: ${error.message}${fields ? ` (${fields})` : ""}`, true);
    showToast(error.message || "Cannot save survey", true);
  }
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadSurveys()]);
}

function wireEvents() {
  addQuestionBtn.addEventListener("click", () => {
    addQuestion();
    cacheBuilderDraft();
  });

  surveyForm.addEventListener("submit", submitSurvey);
  surveyForm.addEventListener("input", debounce(cacheBuilderDraft, 250));

  templateSelect.addEventListener("change", () => {
    if (!templateSelect.value) return;
    applyTemplate(templateSelect.value);
  });

  languageSelect.addEventListener("change", async () => {
    state.lang = languageSelect.value === "en" ? "en" : "ru";
    localStorage.setItem("asking-pro-lang", state.lang);
    applyStaticI18n();
    fillTemplateSelect();
    await refreshAll();
  });

  statusFilter.addEventListener("change", async () => {
    state.filters.status = statusFilter.value;
    await loadSurveys();
  });

  sortFilter.addEventListener("change", async () => {
    state.filters.sort = sortFilter.value;
    await loadSurveys();
  });

  searchInput.addEventListener(
    "input",
    debounce(async () => {
      state.filters.q = searchInput.value.trim();
      await loadSurveys();
    }, 300)
  );

  document.getElementById("startNow").addEventListener("click", () => {
    document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("quickCreate").addEventListener("click", () => {
    resetBuilder();
    setStatus("Ready for a new survey");
    document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("openDemo").addEventListener("click", async () => {
    const surveys = await api.getSurveys({ status: "published" });
    if (!surveys.surveys.length) {
      showToast("No published surveys", true);
      return;
    }
    await loadResults(surveys.surveys[0].id);
    document.getElementById("analytics").scrollIntoView({ behavior: "smooth" });
  });

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
}

function openSurveyFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("survey") || 0);
  if (!id || !Number.isInteger(id)) return;

  api
    .getSurvey(id)
    .then((details) => {
      openModal(buildResponseForm(details.survey, details.questions));
    })
    .catch(() => {
      showToast("Survey from URL is not available", true);
    });
}

async function bootstrap() {
  languageSelect.value = state.lang;
  applyStaticI18n();
  addQuestion();
  wireEvents();

  const templatesData = await api.getTemplates();
  state.templates = templatesData.templates || [];
  fillTemplateSelect();

  restoreBuilderDraft();
  await refreshAll();
  openSurveyFromUrl();
}

bootstrap().catch((error) => {
  console.error(error);
  setStatus("Failed to load app", true);
  showToast("Application load failed", true);
});
