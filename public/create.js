const surveyForm = document.getElementById("surveyForm");
const questionsWrap = document.getElementById("questions");
const addQuestionBtn = document.getElementById("addQuestion");
const templateSelect = document.getElementById("templateSelect");
const templateCards = document.getElementById("templateCards");
const templateCounter = document.getElementById("templateCounter");
const statusNode = document.getElementById("status");
const logoutBtn = document.getElementById("logoutBtn");
const languageSelect = document.getElementById("languageSelect");
const prevStepBtn = document.getElementById("prevStepBtn");
const nextStepBtn = document.getElementById("nextStepBtn");
const createBtn = document.getElementById("createBtn");
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
    cabinet: "Cabinet",
    logout: "Logout",
    title: "Create Survey Wizard",
    step1: "1. Basics",
    step2: "2. Questions",
    step3: "3. Launch",
    labelTitle: "Title",
    labelDescription: "Description",
    labelAudience: "Audience",
    labelTemplate: "Template",
    templatesCount: "Templates available: {count}",
    addQuestion: "+ Add question",
    labelStartsAt: "Starts at",
    labelEndsAt: "Ends at",
    allowMultiple: "Allow multiple responses",
    publishImmediately: "Publish immediately after draft creation",
    afterDraft: "After draft creation:",
    afterDraftLead: "Publish in cabinet, copy public link, and share with participants.",
    back: "Back",
    next: "Next",
    createDraft: "Create draft",
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
    selectTemplate: "Select template",
    useTemplate: "Use",
    audiencePreview: "Audience",
    questionsPreview: "Questions",
    untitled: "Survey title",
    undescribed: "Description preview",
    noQuestions: "No questions yet",
    restorePrompt: "Restore saved draft?",
    titleTooShort: "Title must be at least 3 characters.",
    needQuestion: "Add at least one question.",
    draftCreated: "Draft #{id} created. Publish and share from cabinet.",
    failedLoad: "Failed to load create page",
    noDescription: "No description"
  },
  ru: {
    cabinet: "Кабинет",
    logout: "Выйти",
    title: "Мастер создания анкеты",
    step1: "1. Основа",
    step2: "2. Вопросы",
    step3: "3. Публикация",
    labelTitle: "Название",
    labelDescription: "Описание",
    labelAudience: "Аудитория",
    labelTemplate: "Шаблон",
    templatesCount: "Доступно шаблонов: {count}",
    addQuestion: "+ Добавить вопрос",
    labelStartsAt: "Начало",
    labelEndsAt: "Окончание",
    allowMultiple: "Разрешить повторные ответы",
    publishImmediately: "Опубликовать сразу после создания черновика",
    afterDraft: "После создания:",
    afterDraftLead: "Публикуйте в кабинете, копируйте публичную ссылку и отправляйте участникам.",
    back: "Назад",
    next: "Далее",
    createDraft: "Сохранить черновик",
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
    selectTemplate: "Выберите шаблон",
    useTemplate: "Использовать",
    audiencePreview: "Аудитория",
    questionsPreview: "Вопросы",
    untitled: "Название анкеты",
    undescribed: "Описание анкеты",
    noQuestions: "Вопросов пока нет",
    restorePrompt: "Восстановить сохраненный черновик?",
    titleTooShort: "Название должно быть не менее 3 символов.",
    needQuestion: "Добавьте минимум один вопрос.",
    draftCreated: "Черновик #{id} создан. Опубликуйте его в кабинете.",
    failedLoad: "Не удалось загрузить страницу создания",
    noDescription: "Без описания"
  },
  kz: {
    cabinet: "Кабинет",
    logout: "Шығу",
    title: "Сауалнама құру шебері",
    step1: "1. Негізгі",
    step2: "2. Сұрақтар",
    step3: "3. Жариялау",
    labelTitle: "Атауы",
    labelDescription: "Сипаттама",
    labelAudience: "Аудитория",
    labelTemplate: "Үлгі",
    templatesCount: "Қолжетімді үлгілер: {count}",
    addQuestion: "+ Сұрақ қосу",
    labelStartsAt: "Басталуы",
    labelEndsAt: "Аяқталуы",
    allowMultiple: "Қайта жауап беруге рұқсат",
    publishImmediately: "Черновиктен кейін бірден жариялау",
    afterDraft: "Құрылғаннан кейін:",
    afterDraftLead: "Кабинетте жариялап, сілтемені көшіріп, қатысушыларға таратыңыз.",
    back: "Артқа",
    next: "Келесі",
    createDraft: "Черновик сақтау",
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
    selectTemplate: "Үлгіні таңдаңыз",
    useTemplate: "Қолдану",
    audiencePreview: "Аудитория",
    questionsPreview: "Сұрақтар",
    untitled: "Сауалнама атауы",
    undescribed: "Сипаттама",
    noQuestions: "Сұрақтар әлі жоқ",
    restorePrompt: "Сақталған черновикті қалпына келтіру керек пе?",
    titleTooShort: "Атау кемінде 3 таңбадан тұруы тиіс.",
    needQuestion: "Кемінде бір сұрақ қосыңыз.",
    draftCreated: "#{id} черновик сақталды. Кабинетте жариялаңыз.",
    failedLoad: "Құру беті жүктелмеді",
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

function formatText(template, values = {}) {
  return Object.keys(values).reduce((acc, key) => acc.replaceAll(`{${key}}`, String(values[key] ?? "")), template);
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
  templateCounter.textContent = formatText(t("templatesCount"), { count: templates.length });
  renderPreview();
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#b6201f" : "#0f766e";
}

function cacheDraft() {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        payload: collectPayload(),
        step
      })
    );
  } catch {
    // noop
  }
}

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    if (!window.confirm(t("restorePrompt"))) return;
    const saved = JSON.parse(raw);
    const payload = saved?.payload || {};
    surveyForm.title.value = payload.title || "";
    surveyForm.description.value = payload.description || "";
    surveyForm.audience.value = payload.audience || "";
    surveyForm.startsAt.value = payload.startsAt ? new Date(payload.startsAt).toISOString().slice(0, 16) : "";
    surveyForm.endsAt.value = payload.endsAt ? new Date(payload.endsAt).toISOString().slice(0, 16) : "";
    surveyForm.allowMultipleResponses.checked = !!payload.allowMultipleResponses;
    surveyForm.publishImmediately.checked = !!payload.publishImmediately;
    questionsWrap.innerHTML = "";
    (payload.questions || []).forEach((q) => addQuestion(q));
    if (!(payload.questions || []).length) addQuestion();
    setStep(Number(saved?.step || 1));
  } catch {
    // noop
  }
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
  payload.questions.slice(0, 6).forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "recent-item";
    item.innerHTML = `<strong>${i + 1}. ${q.text || "..."}</strong><span>${q.type}</span>`;
    previewQuestionList.appendChild(item);
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
  createBtn.hidden = step !== 3;
  cacheDraft();
}

function validateStep() {
  if (step === 1) {
    const title = String(new FormData(surveyForm).get("title") || "").trim();
    if (title.length < 3) {
      setStatus(t("titleTooShort"), true);
      return false;
    }
  }
  if (step === 2) {
    const count = questionsWrap.querySelectorAll(".question").length;
    if (count < 1) {
      setStatus(t("needQuestion"), true);
      return false;
    }
  }
  setStatus("");
  return true;
}

function addOptionInput(wrap, value = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = t("option");
  input.value = value;
  wrap.appendChild(input);
  input.addEventListener("input", () => {
    cacheDraft();
    renderPreview();
  });
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
  const options = node.querySelector(".options");
  const addOption = node.querySelector(".add-option");

  const sync = () => {
    const isChoice = type.value === "single" || type.value === "multi";
    optionsBox.style.display = isChoice ? "block" : "none";
    if (!isChoice) return;
    if (options.children.length === 0) {
      addOptionInput(options, t("option1"));
      addOptionInput(options, t("option2"));
    } else if (options.children.length === 1) {
      addOptionInput(options, t("option2"));
    }
  };

  type.addEventListener("change", () => {
    sync();
    cacheDraft();
    renderPreview();
  });
  text.addEventListener("input", () => {
    cacheDraft();
    renderPreview();
  });
  required.addEventListener("change", cacheDraft);
  addOption.addEventListener("click", () => {
    addOptionInput(options);
    cacheDraft();
    renderPreview();
  });
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
      options.innerHTML = "";
      question.options.forEach((value) => addOptionInput(options, value));
    }
  }

  sync();
  questionsWrap.appendChild(node);
  renderPreview();
}

function collectPayload() {
  const formData = new FormData(surveyForm);
  const questions = Array.from(questionsWrap.querySelectorAll(".question")).map((q, idx) => ({
    text: q.querySelector("input[name='q_text']").value.trim(),
    type: q.querySelector("select[name='q_type']").value,
    required: q.querySelector("input[name='q_required']").checked,
    options: Array.from(q.querySelectorAll(".options input"))
      .map((n) => n.value.trim())
      .filter(Boolean),
    order: idx
  }));

  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    audience: String(formData.get("audience") || "").trim(),
    startsAt: formData.get("startsAt") ? new Date(String(formData.get("startsAt"))).toISOString() : null,
    endsAt: formData.get("endsAt") ? new Date(String(formData.get("endsAt"))).toISOString() : null,
    allowMultipleResponses: formData.get("allowMultipleResponses") === "on",
    publishImmediately: formData.get("publishImmediately") === "on",
    questions
  };
}

function fillTemplateSelect() {
  const selected = templateSelect.value;
  templateSelect.innerHTML = `<option value="">${t("selectTemplate")}</option>`;
  templates.forEach((tpl) => {
    const option = document.createElement("option");
    option.value = tpl.key;
    option.textContent = tpl.title;
    templateSelect.appendChild(option);
  });
  if (templates.some((tpl) => tpl.key === selected)) {
    templateSelect.value = selected;
  }
  templateCounter.textContent = formatText(t("templatesCount"), { count: templates.length });
}

function fillTemplateCards() {
  templateCards.innerHTML = "";
  templates.forEach((tpl) => {
    const card = document.createElement("article");
    card.className = "survey-card";
    card.innerHTML = `
      <h3>${tpl.title}</h3>
      <p>${tpl.description || t("noDescription")}</p>
      <div class="meta"><span>${t("audiencePreview")}: ${tpl.audience || "-"}</span></div>
      <div class="survey-card__actions">
        <button type="button" class="btn btn--ghost">${t("useTemplate")}</button>
      </div>
    `;
    card.querySelector("button").addEventListener("click", () => {
      applyTemplate(tpl.key);
      setStep(2);
    });
    templateCards.appendChild(card);
  });
}

function applyTemplate(templateKey) {
  const selected = templates.find((tpl) => tpl.key === templateKey);
  if (!selected) return;
  templateSelect.value = selected.key;
  surveyForm.title.value = selected.title || "";
  surveyForm.description.value = selected.description || "";
  surveyForm.audience.value = selected.audience || "";
  questionsWrap.innerHTML = "";
  (selected.questions || []).forEach((q) => addQuestion(q));
  cacheDraft();
  renderPreview();
}

function rerenderQuestionsWithLang() {
  const saved = collectPayload();
  questionsWrap.innerHTML = "";
  (saved.questions || []).forEach((q) => addQuestion(q));
  if (!saved.questions.length) addQuestion();
  renderPreview();
}

async function loadTemplates() {
  const data = await api.request(`/api/templates?lang=${encodeURIComponent(lang)}`);
  templates = Array.isArray(data.templates) ? data.templates : [];
  fillTemplateSelect();
  fillTemplateCards();
}

async function handleLanguageChange(nextLang) {
  lang = nextLang;
  localStorage.setItem(LANG_KEY, lang);
  languageSelect.value = lang;
  await loadTemplates();
  applyI18n();
  rerenderQuestionsWithLang();
}

async function bootstrap() {
  languageSelect.value = lang;

  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }
  if (["en", "ru", "kz"].includes(me.user.locale) && !localStorage.getItem(LANG_KEY)) {
    lang = me.user.locale;
    localStorage.setItem(LANG_KEY, lang);
    languageSelect.value = lang;
  }

  await loadTemplates();
  applyI18n();

  addQuestion();
  setStep(1);
  restoreDraft();
  renderPreview();

  languageSelect.addEventListener("change", () => {
    handleLanguageChange(languageSelect.value).catch((error) => setStatus(error.message, true));
  });

  addQuestionBtn.addEventListener("click", () => addQuestion());
  prevStepBtn.addEventListener("click", () => setStep(step - 1));
  nextStepBtn.addEventListener("click", () => {
    if (!validateStep()) return;
    setStep(step + 1);
  });
  wizardStepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.stepBtn);
      if (target <= step || validateStep()) setStep(target);
    });
  });

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });

  templateSelect.addEventListener("change", () => {
    applyTemplate(templateSelect.value);
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
      if (payload.publishImmediately) {
        await api.request(`/api/surveys/${created.id}/publish`, { method: "POST" });
      }
      setStatus(t("draftCreated").replace("#{id}", created.id));
      surveyForm.reset();
      questionsWrap.innerHTML = "";
      templateSelect.value = "";
      addQuestion();
      setStep(1);
      localStorage.removeItem(DRAFT_KEY);
      renderPreview();
    } catch (error) {
      setStatus(error.message, true);
    }
  });
}

bootstrap().catch(() => {
  setStatus(t("failedLoad"), true);
});
