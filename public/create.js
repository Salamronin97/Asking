const surveyForm = document.getElementById("surveyForm");
const questionsWrap = document.getElementById("questions");
const addQuestionBtn = document.getElementById("addQuestion");
const templateSelect = document.getElementById("templateSelect");
const templateCards = document.getElementById("templateCards");
const templateCounter = document.getElementById("templateCounter");
const toggleTemplatesBtn = document.getElementById("toggleTemplatesBtn");
const templatePanel = document.getElementById("templatePanel");
const statusNode = document.getElementById("status");
const logoutBtn = document.getElementById("logoutBtn");
const languageSelect = document.getElementById("languageSelect");
const prevStepBtn = document.getElementById("prevStepBtn");
const nextStepBtn = document.getElementById("nextStepBtn");
const createPublishBtn = document.getElementById("createPublishBtn");
const wizardPanes = Array.from(document.querySelectorAll(".wizard-pane"));
const wizardStepButtons = Array.from(document.querySelectorAll("[data-step-btn]"));
const previewTitle = document.getElementById("previewTitle");
const previewDescription = document.getElementById("previewDescription");
const previewAudience = document.getElementById("previewAudience");
const previewQuestions = document.getElementById("previewQuestions");
const previewQuestionList = document.getElementById("previewQuestionList");

const LANG_KEY = "asking-pro-lang";
const DRAFT_KEY = "asking-pro-create-wizard-draft";
let lang = ["en", "ru", "kz"].includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : "ru";
let questionCounter = 0;
let templates = [];
let step = 1;

const i18n = {
  en: {
    guide: "Guide",
    author: "Author",
    cabinet: "Cabinet",
    logout: "Logout",
    title: "Survey Builder",
    step1: "1. Basics",
    step2: "2. Questions",
    step3: "3. Launch",
    labelTitle: "Title",
    labelDescription: "Description",
    labelAudience: "Audience",
    labelTemplate: "Template",
    selectTemplate: "Select template",
    templatesCount: "Templates: {count}",
    showTemplates: "Show templates",
    hideTemplates: "Hide templates",
    addQuestion: "+ Add question",
    labelStartsAt: "Starts at",
    labelEndsAt: "Ends at",
    allowMultiple: "Allow multiple responses",
    afterDraft: "After create:",
    afterDraftLead: "Copy public link, send respondents, open analytics in cabinet.",
    back: "Back",
    next: "Next",
    createAndPublish: "Create survey",
    publishedCreated: "Survey #{id} created.",
    openCabinet: "Open cabinet",
    livePreview: "Live preview",
    questionText: "Question text",
    type: "Type",
    options: "Options",
    addOption: "+ Add option",
    requiredQuestion: "Required question",
    removeQuestion: "Remove question",
    option: "Option",
    option1: "Option 1",
    option2: "Option 2",
    typeText: "Text",
    typeSingle: "Single choice",
    typeMulti: "Multiple choice",
    typeRating: "Rating 1-5",
    useTemplate: "Use",
    audiencePreview: "Audience",
    questionsPreview: "Questions",
    untitled: "Survey title",
    undescribed: "Description preview",
    noQuestions: "No questions yet",
    restorePrompt: "Restore saved draft?",
    titleTooShort: "Title must be at least 3 characters.",
    needQuestion: "Add at least one question.",
    failedLoad: "Failed to load builder",
    noDescription: "No description"
  },
  ru: {
    guide: "Гайд",
    author: "Автор",
    cabinet: "Кабинет",
    logout: "Выйти",
    title: "Конструктор анкеты",
    step1: "1. Основа",
    step2: "2. Вопросы",
    step3: "3. Публикация",
    labelTitle: "Название",
    labelDescription: "Описание",
    labelAudience: "Аудитория",
    labelTemplate: "Шаблон",
    selectTemplate: "Выберите шаблон",
    templatesCount: "Шаблонов: {count}",
    showTemplates: "Показать шаблоны",
    hideTemplates: "Скрыть шаблоны",
    addQuestion: "+ Добавить вопрос",
    labelStartsAt: "Начало",
    labelEndsAt: "Окончание",
    allowMultiple: "Разрешить повторные ответы",
    afterDraft: "После создания:",
    afterDraftLead: "Скопируйте ссылку, отправьте респондентам и откройте аналитику в кабинете.",
    back: "Назад",
    next: "Далее",
    createAndPublish: "Создать анкету",
    publishedCreated: "Анкета #{id} создана.",
    openCabinet: "Открыть кабинет",
    livePreview: "Предпросмотр",
    questionText: "Текст вопроса",
    type: "Тип",
    options: "Варианты",
    addOption: "+ Добавить вариант",
    requiredQuestion: "Обязательный вопрос",
    removeQuestion: "Удалить вопрос",
    option: "Вариант",
    option1: "Вариант 1",
    option2: "Вариант 2",
    typeText: "Текст",
    typeSingle: "Один выбор",
    typeMulti: "Несколько вариантов",
    typeRating: "Рейтинг 1-5",
    useTemplate: "Использовать",
    audiencePreview: "Аудитория",
    questionsPreview: "Вопросы",
    untitled: "Название анкеты",
    undescribed: "Описание анкеты",
    noQuestions: "Вопросов пока нет",
    restorePrompt: "Восстановить сохраненный черновик?",
    titleTooShort: "Название должно быть не менее 3 символов.",
    needQuestion: "Добавьте минимум один вопрос.",
    failedLoad: "Не удалось загрузить конструктор",
    noDescription: "Без описания"
  },
  kz: {
    guide: "Нұсқаулық",
    author: "Автор",
    cabinet: "Кабинет",
    logout: "Шығу",
    title: "Сауалнама құрастырушы",
    step1: "1. Негізгі",
    step2: "2. Сұрақтар",
    step3: "3. Жариялау",
    labelTitle: "Атауы",
    labelDescription: "Сипаттама",
    labelAudience: "Аудитория",
    labelTemplate: "Үлгі",
    selectTemplate: "Үлгіні таңдаңыз",
    templatesCount: "Үлгілер: {count}",
    showTemplates: "Үлгілерді көрсету",
    hideTemplates: "Үлгілерді жасыру",
    addQuestion: "+ Сұрақ қосу",
    labelStartsAt: "Басталуы",
    labelEndsAt: "Аяқталуы",
    allowMultiple: "Қайта жауап беруге рұқсат",
    afterDraft: "Құрылғаннан кейін:",
    afterDraftLead: "Жариялап, сілтемені көшіріп, респонденттерге жіберіп, кабинеттен аналитика ашыңыз.",
    back: "Артқа",
    next: "Келесі",
    createDraft: "Черновик сақтау",
    createAndPublish: "Жасап жариялау",
    publishedCreated: "#{id} сауалнамасы жасалып, жарияланды.",
    draftCreated: "#{id} черновигі сақталды.",
    openCabinet: "Кабинет ашу",
    livePreview: "Алдын ала көру",
    questionText: "Сұрақ мәтіні",
    type: "Түрі",
    options: "Нұсқалар",
    addOption: "+ Нұсқа қосу",
    requiredQuestion: "Міндетті сұрақ",
    removeQuestion: "Сұрақты жою",
    option: "Нұсқа",
    option1: "Нұсқа 1",
    option2: "Нұсқа 2",
    typeText: "Мәтін",
    typeSingle: "Бір таңдау",
    typeMulti: "Бірнеше таңдау",
    typeRating: "Рейтинг 1-5",
    useTemplate: "Қолдану",
    audiencePreview: "Аудитория",
    questionsPreview: "Сұрақтар",
    untitled: "Сауалнама атауы",
    undescribed: "Сипаттама",
    noQuestions: "Сұрақтар әлі жоқ",
    restorePrompt: "Сақталған черновикті қалпына келтіру керек пе?",
    titleTooShort: "Атау кемінде 3 таңба болуы керек.",
    needQuestion: "Кемінде бір сұрақ қосыңыз.",
    failedLoad: "Конструктор жүктелмеді",
    noDescription: "Сипаттама жоқ"
  }
};

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }
};

function t(key) {
  return i18n[lang]?.[key] || i18n.en[key] || key;
}

function formatText(template, values) {
  return Object.keys(values).reduce((acc, key) => acc.replaceAll(`{${key}}`, values[key]), template);
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
  templateCounter.textContent = formatText(t("templatesCount"), { count: String(templates.length) });
  toggleTemplatesBtn.textContent = templatePanel.hidden ? t("showTemplates") : t("hideTemplates");
  renderPreview();
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#b91c1c" : "#0f766e";
}

function cacheDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ payload: collectPayload(), step }));
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    if (!window.confirm(t("restorePrompt"))) return;
    const saved = JSON.parse(raw);
    const payload = saved.payload || {};
    surveyForm.title.value = payload.title || "";
    surveyForm.description.value = payload.description || "";
    surveyForm.audience.value = payload.audience || "";
    surveyForm.startsAt.value = payload.startsAt ? new Date(payload.startsAt).toISOString().slice(0, 16) : "";
    surveyForm.endsAt.value = payload.endsAt ? new Date(payload.endsAt).toISOString().slice(0, 16) : "";
    surveyForm.allowMultipleResponses.checked = !!payload.allowMultipleResponses;
    questionsWrap.innerHTML = "";
    (payload.questions || []).forEach((q) => addQuestion(q));
    if (!payload.questions?.length) addQuestion();
    setStep(Number(saved.step || 1));
  } catch {}
}

function renderPreview() {
  const payload = collectPayload();
  previewTitle.textContent = payload.title || t("untitled");
  previewDescription.textContent = payload.description || t("undescribed");
  previewAudience.textContent = `${t("audiencePreview")}: ${payload.audience || "-"}`;
  previewQuestions.textContent = `${t("questionsPreview")}: ${payload.questions.length}`;
  previewQuestionList.innerHTML = "";
  if (!payload.questions.length) {
    previewQuestionList.innerHTML = `<div class="recent-item">${t("noQuestions")}</div>`;
    return;
  }
  payload.questions.slice(0, 6).forEach((q, idx) => {
    const row = document.createElement("div");
    row.className = "recent-item";
    row.innerHTML = `<strong>${idx + 1}. ${q.text || "..."}</strong><span>${q.type}</span>`;
    previewQuestionList.appendChild(row);
  });
}

function setStep(nextStep) {
  step = Math.max(1, Math.min(3, Number(nextStep)));
  wizardPanes.forEach((pane) => {
    pane.hidden = Number(pane.dataset.step) !== step;
  });
  wizardStepButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.stepBtn) === step);
  });
  prevStepBtn.disabled = step === 1;
  nextStepBtn.hidden = step === 3;
  createPublishBtn.hidden = step !== 3;
  cacheDraft();
}

function validateStep() {
  if (step === 1) {
    if (String(surveyForm.title.value || "").trim().length < 3) {
      setStatus(t("titleTooShort"), true);
      return false;
    }
  }
  if (step === 2 && questionsWrap.querySelectorAll(".question").length < 1) {
    setStatus(t("needQuestion"), true);
    return false;
  }
  setStatus("");
  return true;
}

function addOptionInput(wrap, value = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = t("option");
  input.addEventListener("input", () => {
    cacheDraft();
    renderPreview();
  });
  wrap.appendChild(input);
}

function questionTypeOptions() {
  return `
    <option value="text">${t("typeText")}</option>
    <option value="single">${t("typeSingle")}</option>
    <option value="multi">${t("typeMulti")}</option>
    <option value="rating">${t("typeRating")}</option>
  `;
}

function addQuestion(question = null) {
  const node = document.createElement("div");
  node.className = "question";
  node.dataset.id = String(questionCounter++);
  node.innerHTML = `
    <div class="row">
      <div class="form-row">
        <label>${t("questionText")}</label>
        <input name="q_text" required />
      </div>
      <div class="form-row">
        <label>${t("type")}</label>
        <select name="q_type">${questionTypeOptions()}</select>
      </div>
      <div class="form-row options-box" style="display:none;">
        <label>${t("options")}</label>
        <div class="options"></div>
        <button type="button" class="btn btn--ghost add-option">${t("addOption")}</button>
      </div>
      <label class="inline-check">
        <input type="checkbox" name="q_required" checked />
        ${t("requiredQuestion")}
      </label>
      <button type="button" class="btn btn--outline remove-question">${t("removeQuestion")}</button>
    </div>
  `;

  const text = node.querySelector("input[name='q_text']");
  const type = node.querySelector("select[name='q_type']");
  const required = node.querySelector("input[name='q_required']");
  const optionsBox = node.querySelector(".options-box");
  const optionsWrap = node.querySelector(".options");

  const syncType = () => {
    const choice = type.value === "single" || type.value === "multi";
    optionsBox.style.display = choice ? "block" : "none";
    if (choice && optionsWrap.children.length < 2) {
      if (optionsWrap.children.length === 0) addOptionInput(optionsWrap, t("option1"));
      addOptionInput(optionsWrap, t("option2"));
    }
  };

  text.addEventListener("input", () => {
    cacheDraft();
    renderPreview();
  });
  type.addEventListener("change", () => {
    syncType();
    cacheDraft();
    renderPreview();
  });
  required.addEventListener("change", cacheDraft);
  node.querySelector(".add-option").addEventListener("click", () => addOptionInput(optionsWrap));
  node.querySelector(".remove-question").addEventListener("click", () => {
    node.remove();
    cacheDraft();
    renderPreview();
  });

  if (question) {
    text.value = question.text || "";
    type.value = question.type || "text";
    required.checked = question.required !== false;
    if (Array.isArray(question.options) && question.options.length) {
      optionsWrap.innerHTML = "";
      question.options.forEach((item) => addOptionInput(optionsWrap, item));
    }
  }
  syncType();
  questionsWrap.appendChild(node);
}

function collectPayload() {
  return {
    title: String(surveyForm.title.value || "").trim(),
    description: String(surveyForm.description.value || "").trim(),
    audience: String(surveyForm.audience.value || "").trim(),
    startsAt: surveyForm.startsAt.value ? new Date(surveyForm.startsAt.value).toISOString() : null,
    endsAt: surveyForm.endsAt.value ? new Date(surveyForm.endsAt.value).toISOString() : null,
    allowMultipleResponses: surveyForm.allowMultipleResponses.checked,
    questions: Array.from(questionsWrap.querySelectorAll(".question")).map((q, idx) => ({
      text: q.querySelector("input[name='q_text']").value.trim(),
      type: q.querySelector("select[name='q_type']").value,
      required: q.querySelector("input[name='q_required']").checked,
      options: Array.from(q.querySelectorAll(".options input"))
        .map((n) => n.value.trim())
        .filter(Boolean),
      order: idx
    }))
  };
}

function fillTemplates() {
  const current = templateSelect.value;
  templateSelect.innerHTML = `<option value="">${t("selectTemplate")}</option>`;
  templates.forEach((tpl) => {
    const option = document.createElement("option");
    option.value = tpl.key;
    option.textContent = tpl.title;
    templateSelect.appendChild(option);
  });
  if (templates.some((tpl) => tpl.key === current)) templateSelect.value = current;

  templateCards.innerHTML = "";
  templates.forEach((tpl) => {
    const card = document.createElement("article");
    card.className = "survey-card";
    card.innerHTML = `
      <h3>${tpl.title}</h3>
      <p>${tpl.description || t("noDescription")}</p>
      <div class="meta"><span>${t("audiencePreview")}: ${tpl.audience || "-"}</span></div>
      <div class="survey-card__actions"><button type="button" class="btn btn--ghost">${t("useTemplate")}</button></div>
    `;
    card.querySelector("button").addEventListener("click", () => applyTemplate(tpl.key));
    templateCards.appendChild(card);
  });
}

function applyTemplate(key) {
  const tpl = templates.find((item) => item.key === key);
  if (!tpl) return;
  templateSelect.value = tpl.key;
  surveyForm.title.value = tpl.title || "";
  surveyForm.description.value = tpl.description || "";
  surveyForm.audience.value = tpl.audience || "";
  questionsWrap.innerHTML = "";
  (tpl.questions || []).forEach((q) => addQuestion(q));
  cacheDraft();
  renderPreview();
  setStep(2);
}

async function loadTemplates() {
  const data = await api.request(`/api/templates?lang=${encodeURIComponent(lang)}`);
  templates = data.templates || [];
  fillTemplates();
}

function setupTemplatePanel() {
  templatePanel.hidden = true;
  templatePanel.classList.remove("is-open");
  toggleTemplatesBtn.addEventListener("click", () => {
    const opening = templatePanel.hidden;
    if (opening) {
      templatePanel.hidden = false;
      requestAnimationFrame(() => templatePanel.classList.add("is-open"));
    } else {
      templatePanel.classList.remove("is-open");
      window.setTimeout(() => {
        if (!templatePanel.classList.contains("is-open")) templatePanel.hidden = true;
      }, 250);
    }
    toggleTemplatesBtn.textContent = opening ? t("hideTemplates") : t("showTemplates");
  });
}

async function bootstrap() {
  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }
  if (["en", "ru", "kz"].includes(me.user.locale) && !localStorage.getItem(LANG_KEY)) {
    lang = me.user.locale;
    localStorage.setItem(LANG_KEY, lang);
  }

  languageSelect.value = lang;
  await loadTemplates();
  applyI18n();
  setupTemplatePanel();

  addQuestion();
  setStep(1);
  restoreDraft();
  renderPreview();

  languageSelect.addEventListener("change", async () => {
    lang = languageSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    await loadTemplates();
    applyI18n();
  });

  addQuestionBtn.addEventListener("click", () => {
    addQuestion();
    cacheDraft();
    renderPreview();
  });
  prevStepBtn.addEventListener("click", () => setStep(step - 1));
  nextStepBtn.addEventListener("click", () => {
    if (validateStep()) setStep(step + 1);
  });
  wizardStepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.stepBtn);
      if (target <= step || validateStep()) setStep(target);
    });
  });

  templateSelect.addEventListener("change", () => applyTemplate(templateSelect.value));
  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });

  surveyForm.addEventListener("input", () => {
    cacheDraft();
    renderPreview();
  });

  surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    try {
      const payload = collectPayload();
      const created = await api.request("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setStatus(t("publishedCreated").replace("#{id}", created.id));

      surveyForm.reset();
      questionsWrap.innerHTML = "";
      addQuestion();
      setStep(1);
      localStorage.removeItem(DRAFT_KEY);
      renderPreview();
    } catch (error) {
      setStatus(error.message, true);
    }
  });
}

bootstrap().catch(() => setStatus(t("failedLoad"), true));
