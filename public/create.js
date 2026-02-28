const surveyForm = document.getElementById("surveyForm");
const questionsWrap = document.getElementById("questions");
const addQuestionBtn = document.getElementById("addQuestion");
const templateSelect = document.getElementById("templateSelect");
const statusNode = document.getElementById("status");
const logoutBtn = document.getElementById("logoutBtn");
const languageSelect = document.getElementById("languageSelect");
const prevStepBtn = document.getElementById("prevStepBtn");
const nextStepBtn = document.getElementById("nextStepBtn");
const createBtn = document.getElementById("createBtn");
const wizardPanes = Array.from(document.querySelectorAll(".wizard-pane"));
const wizardStepButtons = Array.from(document.querySelectorAll("[data-step-btn]"));

const LANG_KEY = "asking-pro-lang";
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
    addQuestion: "+ Add question",
    labelStartsAt: "Starts at",
    labelEndsAt: "Ends at",
    allowMultiple: "Allow multiple responses",
    afterDraft: "After draft creation:",
    afterDraftLead: "Publish in cabinet, copy public link, and share with participants.",
    back: "Back",
    next: "Next",
    createDraft: "Create draft",
    flowTitle: "Professional flow",
    flow1: "Build structure with clear goals and audience.",
    flow2: "Prepare question blocks for measurable feedback.",
    flow3: "Publish and distribute public link by messengers/email.",
    flow4: "Use cabinet response table and export files for reporting.",
    openCabinet: "Open cabinet",
    questionText: "Question text",
    type: "Type",
    options: "Options",
    addOption: "+ Add option",
    requiredQuestion: "Required question",
    removeQuestion: "Remove question",
    option: "Option",
    option1: "Option 1",
    option2: "Option 2",
    selectTemplate: "Select template",
    titleTooShort: "Title must be at least 3 characters.",
    needQuestion: "Add at least one question.",
    draftCreated: "Draft #{id} created. Publish and share from cabinet.",
    failedLoad: "Failed to load create page"
  },
  ru: {
    cabinet: "Кабинет",
    logout: "Выйти",
    title: "Мастер создания анкеты",
    step1: "1. Основа",
    step2: "2. Вопросы",
    step3: "3. Запуск",
    labelTitle: "Название",
    labelDescription: "Описание",
    labelAudience: "Аудитория",
    labelTemplate: "Шаблон",
    addQuestion: "+ Добавить вопрос",
    labelStartsAt: "Начало",
    labelEndsAt: "Окончание",
    allowMultiple: "Разрешить повторные ответы",
    afterDraft: "После создания черновика:",
    afterDraftLead: "Опубликуйте в кабинете, скопируйте публичную ссылку и отправьте участникам.",
    back: "Назад",
    next: "Далее",
    createDraft: "Создать черновик",
    flowTitle: "Профессиональный сценарий",
    flow1: "Определите цели и аудиторию.",
    flow2: "Подготовьте измеримые вопросы.",
    flow3: "Опубликуйте и разошлите публичную ссылку.",
    flow4: "Анализируйте таблицу ответов и выгружайте файлы.",
    openCabinet: "Открыть кабинет",
    questionText: "Текст вопроса",
    type: "Тип",
    options: "Варианты",
    addOption: "+ Добавить вариант",
    requiredQuestion: "Обязательный вопрос",
    removeQuestion: "Удалить вопрос",
    option: "Вариант",
    option1: "Вариант 1",
    option2: "Вариант 2",
    selectTemplate: "Выберите шаблон",
    titleTooShort: "Название должно быть не короче 3 символов.",
    needQuestion: "Добавьте хотя бы один вопрос.",
    draftCreated: "Черновик #{id} создан. Публикуйте и делитесь ссылкой из кабинета.",
    failedLoad: "Не удалось загрузить страницу создания"
  },
  kz: {
    cabinet: "Кабинет",
    logout: "Шығу",
    title: "Сауалнама құру шебері",
    step1: "1. Негізгі",
    step2: "2. Сұрақтар",
    step3: "3. Іске қосу",
    labelTitle: "Атауы",
    labelDescription: "Сипаттама",
    labelAudience: "Аудитория",
    labelTemplate: "Үлгі",
    addQuestion: "+ Сұрақ қосу",
    labelStartsAt: "Басталу уақыты",
    labelEndsAt: "Аяқталу уақыты",
    allowMultiple: "Қайта жауап беруге рұқсат",
    afterDraft: "Жоба жасалғаннан кейін:",
    afterDraftLead: "Кабинетте жариялап, ашық сілтемені қатысушыларға жіберіңіз.",
    back: "Артқа",
    next: "Келесі",
    createDraft: "Жоба жасау",
    flowTitle: "Кәсіби жұмыс ағымы",
    flow1: "Мақсат пен аудиторияны анықтаңыз.",
    flow2: "Өлшенетін сұрақ блоктарын дайындаңыз.",
    flow3: "Жариялап, ашық сілтемені таратыңыз.",
    flow4: "Жауап кестесін қарап, файлдарды жүктеңіз.",
    openCabinet: "Кабинетті ашу",
    questionText: "Сұрақ мәтіні",
    type: "Түрі",
    options: "Нұсқалар",
    addOption: "+ Нұсқа қосу",
    requiredQuestion: "Міндетті сұрақ",
    removeQuestion: "Сұрақты жою",
    option: "Нұсқа",
    option1: "Нұсқа 1",
    option2: "Нұсқа 2",
    selectTemplate: "Үлгіні таңдаңыз",
    titleTooShort: "Атауы кемінде 3 таңба болуы керек.",
    needQuestion: "Кемінде бір сұрақ қосыңыз.",
    draftCreated: "#{id} нөмірлі жоба жасалды. Кабинеттен жариялап, сілтеме таратыңыз.",
    failedLoad: "Құру беті жүктелмеді"
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

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  });
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#b6201f" : "#c33f17";
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
        <select name="q_type">
          <option value="text">Text</option>
          <option value="single">Single choice</option>
          <option value="multi">Multiple choice</option>
          <option value="rating">Rating 1-5</option>
        </select>
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
    if (isChoice && options.children.length < 2) {
      if (!options.children.length) {
        addOptionInput(options, t("option1"));
        addOptionInput(options, t("option2"));
      } else {
        addOptionInput(options, t("option2"));
      }
    }
  };

  type.addEventListener("change", sync);
  addOption.addEventListener("click", () => addOptionInput(options));
  node.querySelector(".remove-question").addEventListener("click", () => node.remove());

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
    questions
  };
}

function fillTemplateSelect() {
  templateSelect.innerHTML = `<option value=''>${t("selectTemplate")}</option>`;
  templates.forEach((tpl) => {
    const option = document.createElement("option");
    option.value = tpl.key;
    option.textContent = tpl.title;
    templateSelect.appendChild(option);
  });
}

function rerenderQuestionsWithLang() {
  const saved = collectPayload();
  questionsWrap.innerHTML = "";
  (saved.questions || []).forEach((q) => addQuestion(q));
  if (!saved.questions?.length) addQuestion();
}

async function bootstrap() {
  languageSelect.value = lang;
  applyI18n();
  languageSelect.addEventListener("change", () => {
    lang = languageSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    applyI18n();
    fillTemplateSelect();
    rerenderQuestionsWithLang();
  });

  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }

  addQuestion();
  setStep(1);

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

  surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    try {
      const created = await api.request("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectPayload())
      });
      setStatus(t("draftCreated").replace("#{id}", created.id));
      surveyForm.reset();
      questionsWrap.innerHTML = "";
      addQuestion();
      setStep(1);
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  const tplData = await api.request("/api/templates");
  templates = tplData.templates || [];
  fillTemplateSelect();

  templateSelect.addEventListener("change", () => {
    const selected = templates.find((t) => t.key === templateSelect.value);
    if (!selected) return;
    surveyForm.title.value = selected.title || "";
    surveyForm.description.value = selected.description || "";
    surveyForm.audience.value = selected.audience || "";
    questionsWrap.innerHTML = "";
    (selected.questions || []).forEach((q) => addQuestion(q));
  });
}

bootstrap().catch(() => {
  setStatus(t("failedLoad"), true);
});
