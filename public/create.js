(() => {
  "use strict";

  const CHOICE_TYPES = new Set(["single", "multiple", "select"]);
  const TYPE_LABELS = {
    text: "Текст",
    single: "Один выбор",
    multiple: "Множественный",
    rating: "Рейтинг",
    select: "Список"
  };
  const TEMPLATE_CATEGORY_MAP = {
    education: "Образование",
    hr: "Управление кадрами",
    marketing: "Маркетинговое исследование",
    service: "Услуги",
    events: "Мероприятия",
    voting: "Другие",
    registration: "Мероприятия",
    event_feedback: "Мероприятия",
    conference_summit: "Мероприятия",
    product_discovery: "Продукт",
    product_beta_feedback: "Продукт",
    customer_satisfaction: "Удовлетворенность клиентов",
    market_segmentation: "Маркетинговое исследование",
    lead_qualification: "Продажи и лиды",
    hr_pulse: "Управление кадрами",
    onboarding_30_60_90: "Управление кадрами",
    course_evaluation: "Образование",
    clinic_patient_experience: "Здравоохранение",
    restaurant_guest_experience: "Услуги",
    support_quality_audit: "Удовлетворенность клиентов",
    nonprofit_volunteer_feedback: "Госсектор и НКО",
    employee_engagement_pulse: "Управление кадрами",
    internal_tools_audit: "Управление кадрами",
    training_needs_assessment: "Образование",
    brand_perception: "Маркетинговое исследование",
    ecommerce_checkout_audit: "Маркетинговое исследование",
    hotel_guest_stay: "Услуги",
    public_service_feedback: "Госсектор и НКО",
    pricing_research: "Маркетинговое исследование",
    community_event_feedback: "Мероприятия",
    event_registration_premium: "Мероприятия",
    product_beta_feedback: "Продукт",
    customer_satisfaction_pro: "Удовлетворенность клиентов",
    course_evaluation_pro: "Образование",
    retail: "Услуги",
    ecommerce: "Маркетинговое исследование",
    product: "Маркетинговое исследование",
    healthcare: "Здравоохранение",
    nps: "Удовлетворенность клиентов",
    onboarding: "Управление кадрами",
    conference: "Мероприятия",
    training: "Образование",
    course: "Образование",
    support: "Удовлетворенность клиентов",
    government: "Госсектор и НКО",
    nonprofit: "Госсектор и НКО",
    feedback: "Удовлетворенность клиентов",
    event: "Мероприятия",
    vote: "Другие"
  };
  const TEMPLATE_CATEGORIES = [
    "Все категории",
    "Госсектор и НКО",
    "Здравоохранение",
    "Продукт",
    "Продажи и лиды",
    "Маркетинговое исследование",
    "Мероприятия",
    "Образование",
    "Удовлетворенность клиентов",
    "Управление кадрами",
    "Услуги",
    "Другие"
  ];
  function resolveTemplateCategory(key) {
    if (TEMPLATE_CATEGORY_MAP[key]) return TEMPLATE_CATEGORY_MAP[key];
    const normalized = String(key || "").toLowerCase();
    const byToken = Object.entries(TEMPLATE_CATEGORY_MAP).find(([token]) => normalized.includes(String(token).toLowerCase()));
    return byToken ? byToken[1] : "Другие";
  }
  const BUILDER_THEMES = [
    { id: "sea", name: "Sea", description: "Светлая тема с мягким голубым фоном.", bgColor: "#eaf3fb", accent: "#3159f5", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #eaf3fb 0%, #ffffff 58%, #dbeafe 100%)" },
    { id: "skyline", name: "Skyline", description: "Чистая корпоративная тема для B2B-опросов.", bgColor: "#eef6ff", accent: "#2563eb", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 48%, #ffffff 100%)" },
    { id: "graphite", name: "Graphite", description: "Строгая светло-серая тема для бизнеса.", bgColor: "#eef2f7", accent: "#334155", bgImage: "", layout: "center-card", overlay: 0, preview: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)" },
    { id: "boardroom", name: "Boardroom", description: "Премиальный деловой фон с фото переговорной.", bgColor: "#f8fbff", accent: "#1d4ed8", bgImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=78", layout: "split-right-image", overlay: 18, preview: "linear-gradient(135deg, #f8fbff 0 52%, #1d4ed8 52% 100%)" },
    { id: "product_lab", name: "Product Lab", description: "Современная продуктовая тема для исследований и beta feedback.", bgColor: "#f5f9ff", accent: "#4f46e5", bgImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=78", layout: "cover-top-image", overlay: 22, preview: "linear-gradient(135deg, #eef2ff 0%, #4f46e5 100%)" },
    { id: "forest", name: "Forest", description: "Спокойная зелёная палитра для вовлечения.", bgColor: "#e8f4ed", accent: "#0f766e", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #ecfdf5 0%, #99f6e4 100%)" },
    { id: "mint", name: "Mint", description: "Свежая мятная палитра для HR и onboarding.", bgColor: "#ecfdf5", accent: "#059669", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 52%, #ffffff 100%)" },
    { id: "clinic", name: "Clinic", description: "Чистый медицинский стиль для patient experience.", bgColor: "#ecfeff", accent: "#0891b2", bgImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1600&q=78", layout: "split-left-image", overlay: 18, preview: "linear-gradient(135deg, #ecfeff 0%, #67e8f9 100%)" },
    { id: "academy", name: "Academy", description: "Собранная тема для обучения, курсов и аттестаций.", bgColor: "#f0f9ff", accent: "#0369a1", bgImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=78", layout: "cover-top-image", overlay: 20, preview: "linear-gradient(135deg, #e0f2fe 0%, #0ea5e9 100%)" },
    { id: "event_pro", name: "Event Pro", description: "Контрастная тема для регистрации и фидбека мероприятий.", bgColor: "#fff7ed", accent: "#ea580c", bgImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=78", layout: "full", overlay: 32, preview: "linear-gradient(135deg, #fff7ed 0%, #fb923c 100%)" },
    { id: "support", name: "Support Desk", description: "Аккуратная тема для service quality и customer success.", bgColor: "#f8fafc", accent: "#0f766e", bgImage: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1600&q=78", layout: "split-right-image", overlay: 16, preview: "linear-gradient(135deg, #f8fafc 0%, #14b8a6 100%)" },
    { id: "retail", name: "Retail Studio", description: "Визуальная тема для e-commerce и customer research.", bgColor: "#fff1f2", accent: "#e11d48", bgImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=78", layout: "split-left-image", overlay: 18, preview: "linear-gradient(135deg, #fff1f2 0%, #f43f5e 100%)" },
    { id: "restaurant", name: "Restaurant", description: "Теплая, но сдержанная тема для гостевого опыта.", bgColor: "#fff7ed", accent: "#c2410c", bgImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=78", layout: "center-card", overlay: 26, preview: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)" },
    { id: "violet", name: "Violet", description: "Фиолетовый акцент для брендовых опросов.", bgColor: "#f5f3ff", accent: "#7c3aed", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)" },
    { id: "rose", name: "Rose", description: "Нежный розовый акцент для lifestyle анкет.", bgColor: "#fff1f2", accent: "#e11d48", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #fff1f2 0%, #fecdd3 100%)" },
    { id: "ice", name: "Ice", description: "Сдержанная холодная тема для формальных исследований.", bgColor: "#f1f5f9", accent: "#0f766e", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #f8fafc 0%, #ccfbf1 100%)" },
    { id: "school", name: "School", description: "Нейтральная тема для образовательных анкет.", bgColor: "#f5efe2", accent: "#6b7280", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #f8f1e5 0%, #e5e7eb 100%)" },
    { id: "sunset", name: "Sunset", description: "Тёплая контрастная тема для ярких кампаний.", bgColor: "#fff2e8", accent: "#ea580c", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fb923c 100%)" },
    { id: "sand", name: "Sand", description: "Мягкая песочная тема для офлайн-мероприятий.", bgColor: "#f8f1e5", accent: "#a16207", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #f8f1e5 0%, #fde68a 100%)" },
    { id: "peach", name: "Peach", description: "Лёгкая персиковая тема для дружелюбных форм.", bgColor: "#fff4ec", accent: "#f97316", bgImage: "", layout: "full", overlay: 0, preview: "linear-gradient(135deg, #fff4ec 0%, #ffedd5 100%)" }
  ];
  const OPTION_PRESETS = {
    "yes-no": ["Да", "Нет"],
    agree: ["Полностью не согласен", "Скорее не согласен", "Нейтрально", "Скорее согласен", "Полностью согласен"],
    satisfaction: ["1", "2", "3", "4", "5"],
    nps: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
  };
  const QUESTION_PRESETS = {
    registration: [
      { type: "text", title: "Ваше имя", description: "Как к вам обращаться?", required: true },
      { type: "text", title: "Контакт для связи", description: "Email или телефон", required: true },
      {
        type: "single",
        title: "Согласие на обработку данных",
        description: "Подтвердите согласие перед отправкой",
        required: true,
        options: [createOption("Согласен"), createOption("Не согласен")]
      }
    ],
    "event-feedback": [
      { type: "rating", title: "Как вам мероприятие?", description: "Оценка от 1 до 5", required: true },
      {
        type: "single",
        title: "Порекомендовали бы вы это мероприятие?",
        description: "Оцените готовность рекомендовать",
        required: true,
        options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((value) => createOption(value))
      },
      { type: "text", title: "Что улучшить?", description: "Короткий комментарий", required: false }
    ],
    "product-discovery": [
      { type: "text", title: "Какую проблему вы решаете?", description: "Опишите задачу", required: true },
      {
        type: "multiple",
        title: "Какие функции для вас важны?",
        description: "Можно выбрать несколько",
        required: true,
        options: [createOption("Скорость"), createOption("Простота"), createOption("Интеграции"), createOption("Цена")]
      },
      {
        type: "single",
        title: "Что мешает использовать решение чаще?",
        description: "Выберите главный барьер",
        required: false,
        options: [createOption("Цена"), createOption("Сложно настроить"), createOption("Нет нужной функции"), createOption("Неактуально")]
      }
    ],
    "hr-pulse": [
      { type: "rating", title: "Оцените атмосферу в команде", description: "1 — плохо, 5 — отлично", required: true },
      {
        type: "single",
        title: "Как вы оцениваете текущую нагрузку?",
        description: "Один вариант",
        required: true,
        options: [createOption("Слишком высокая"), createOption("Нормальная"), createOption("Низкая")]
      },
      {
        type: "single",
        title: "Готовы рекомендовать компанию знакомым?",
        description: "Оценка рекомендации",
        required: true,
        options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((value) => createOption(value))
      }
    ]
  };
  const QUICK_START_TEMPLATE_MAP = {
    registration: "registration",
    "event-feedback": "event_feedback",
    "product-discovery": "product_discovery",
    "hr-pulse": "hr_pulse"
  };
  const DENSITY_STORAGE_KEY = "asking_builder_density";
  const FOCUS_STORAGE_KEY = "asking_builder_focus";
  const ADVANCED_STORAGE_KEY = "asking_builder_advanced";
  const TOOLBAR_LANE_STORAGE_KEY = "asking_builder_toolbar_lane";
  const SIMPLE_MODE_STORAGE_KEY = "asking_builder_simple_mode";
  const THEME_STORAGE_KEY = "asking_theme";
  const VERSION_LIMIT = 25;
  const WELCOME_DEFAULT_COVER =
    "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=78";
  const WELCOME_LAYOUTS = new Set(["image-right", "image-left", "image-top", "background", "typographic"]);
  const IMAGE_FIT_VALUES = new Set(["cover", "contain"]);

  const state = {
    survey: {
      id: null,
      title: "Новая анкета",
      description: "",
      pages: []
    },
    selectedPageId: null,
    selectedQuestionId: null,
    dirty: false,
    mobilePanel: "questions",
    selectedTemplateCategory: "Все категории",
    templateSearch: "",
    previewTemplateKey: null,
    activeThemeId: "sea",
    previewThemeId: "sea",
    builderSection: "questions",
    settingsPane: "question",
    densityMode: localStorage.getItem(DENSITY_STORAGE_KEY) === "compact" ? "compact" : "cozy",
    focusMode: localStorage.getItem(FOCUS_STORAGE_KEY) === "on",
    advancedMode: false,
    simpleMode: true,
    commandSearch: "",
    questionFilter: "",
    matchCursor: 0,
    selectedQuestionIds: [],
    editorSection: "content",
    toolbarLane: (localStorage.getItem(TOOLBAR_LANE_STORAGE_KEY) || "compose") === "advanced"
      ? "organize"
      : (localStorage.getItem(TOOLBAR_LANE_STORAGE_KEY) || "compose"),
    wizard: {
      step: 1,
      preset: "registration",
      themeId: "sea",
      title: "Новая анкета"
    },
    pendingPublishIssues: []
  };

  const refs = {};
  let pendingQuestionInsertIndex = null;
  let surveyId = null;
  let saveTimer = null;
  let isSaving = false;
  let pendingSave = false;
  let lastVersionHash = "";
  let lastSyncedDraftFingerprint = "";
  const dragState = { questionId: null, fromPageId: null, questionIds: [] };
  const pageDragState = { pageId: null };
  const paletteDragState = { questionType: null };
  const historyState = { undoStack: [], redoStack: [], lastHash: "", isApplying: false, max: 60 };
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    new URLSearchParams(window.location.search).get("debug") === "1";

  const query = new URLSearchParams(window.location.search);
  const templateFromQuery = query.get("template");

  function applyTheme(theme) {
    const preferred = theme || localStorage.getItem(THEME_STORAGE_KEY) || "light";
    const resolved = preferred === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preferred;
    document.documentElement.setAttribute("data-theme", resolved);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preferred);
    } catch {}
  }

  applyTheme();

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheRefs();
    applyStaticBuilderTextFixes();
    document.body.style.visibility = "visible";
    enhanceQuestionEditorLayout();
    mountDesignSidebar();
    setAdvancedMode(state.advancedMode, false);
    setToolbarLane(state.toolbarLane, false);
    setSimpleMode(state.simpleMode, false);
    setDensityMode(state.densityMode, false);
    setFocusMode(state.focusMode, false);
    bindEvents();

    try {
      const me = await apiRequest("/api/auth/me");
      if (me?.user?.theme) applyTheme(me.user.theme);
    } catch {}

    try {
      if (query.get("surveyId")) {
        await ensureSurvey();
        await loadSurvey();
        markSyncedDraftBaseline();
        renderAll();
        recordHistorySnapshot(true);
        setSaveState("saved", "Сохранено");
        return;
      }

      if (templateFromQuery) {
        await createSurveyFromTemplateRemote(templateFromQuery);
        return;
      }

      await startNewBlankSurvey();
      setSaveState("saved", "Сохранено");
    } catch (error) {
      console.error(error);
      document.body.style.visibility = "visible";
      setStatus(error.message || "Ошибка инициализации", true);
      closeAllModals();
    }
  }

  function applyStaticBuilderTextFixes() {
    const setText = (selector, value) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = value;
    };
    const setAttr = (selector, attr, value) => {
      const node = document.querySelector(selector);
      if (node) node.setAttribute(attr, value);
    };
    const setHtml = (selector, value) => {
      const node = document.querySelector(selector);
      if (node) node.innerHTML = value;
    };

    document.title = "Конструктор анкеты | Asking";

    setText(".topbar__actions a[href='/guide']", "Инструкция");
    setText(".topbar__actions a[href='/cabinet']", "Кабинет");
    setText(".topbar__actions a[href='/account']", "Аккаунт");
    setText("#logoutBtn", "Выйти");

    setHtml("[data-builder-section='questions']", "<strong>Вопросы</strong><span>Состав анкеты</span>");
    setHtml("[data-builder-section='survey']", "<strong>Настройки</strong><span>Доступ и описание</span>");
    setHtml("[data-builder-section='publish']", "<strong>Публикация</strong><span>Ссылка и QR</span>");

    setText("#pagesPanel .constructor-head-sm h3", "Страницы");
    setText("#renamePageBtn", "Переименовать");
    setText("#duplicatePageBtn", "Дублировать");
    setText("#removePageBtn", "Удалить");
    setText("#addPageBtn", "+ Страница");
    setText(".constructor-bank__head h4", "Банк вопросов");

    const bankButtons = Array.from(document.querySelectorAll(".constructor-bank__item"));
    if (bankButtons[0]) setHtml(".constructor-bank__item:nth-of-type(1)", "<strong>Один выбор</strong><span>Радио-кнопки</span>");
    if (bankButtons[1]) setHtml(".constructor-bank__item:nth-of-type(2)", "<strong>Множественный</strong><span>Чекбоксы</span>");
    if (bankButtons[2]) setHtml(".constructor-bank__item:nth-of-type(3)", "<strong>Список</strong><span>Выпадающий select</span>");
    if (bankButtons[3]) setHtml(".constructor-bank__item:nth-of-type(4)", "<strong>Рейтинг</strong><span>Шкала 1-5</span>");
    if (bankButtons[4]) setHtml(".constructor-bank__item:nth-of-type(5)", "<strong>Опрос с изображениями</strong><span>Карточки с фото</span>");
    if (bankButtons[5]) setHtml(".constructor-bank__item:nth-of-type(6)", "<strong>Текст</strong><span>Свободный ответ</span>");

    setText(".constructor-kitbank .constructor-bank__head h4", "Готовые наборы");
    setHtml(".constructor-kitbank__item[data-question-preset='registration']", "<strong>Регистрация</strong><span>Имя, контакт, согласие</span>");
    setHtml(".constructor-kitbank__item[data-question-preset='event-feedback']", "<strong>Фидбек события</strong><span>NPS, оценка, комментарий</span>");
    setHtml(".constructor-kitbank__item[data-question-preset='product-discovery']", "<strong>Исследование продукта</strong><span>Проблема, приоритет, барьеры</span>");
    setHtml(".constructor-kitbank__item[data-question-preset='hr-pulse']", "<strong>Опрос команды</strong><span>Атмосфера, нагрузка, обратная связь</span>");

    setText("#publishBtn", "Опубликовать");
    setText("#openQuickStartWizardBtn", "Быстрый старт");
    setText("#openVersionHistoryBtn", "Версии");
    setText("#toolbarLaneComposeBtn", "Конструктор");
    setText("#toolbarLaneOrganizeBtn", "Структура");
    setText("#toolbarLaneAdvancedBtn", "Продвинутое");
    setAttr("#surveyTitle", "placeholder", "Название анкеты");
    setAttr("#surveyDescription", "placeholder", "Краткое описание анкеты");
    setText("#saveStateText", "Сохранено");
    setText("#builderMetaTime", "~0 мин");
    setText("#builderMetaDifficulty", "Лёгкая");
    setText("#mobileAddQuestionFab", "+ Вопрос");

    setAttr("#settingsPanel", "aria-label", "Редактор вопроса");
    setText(".constructor-editor-top span", "Редактор");
    setText(".constructor-editor-top h3", "Вопрос и страница");
    setText("#openDesignSettingsBtn", "Дизайн");
    setText("#settingsTabQuestion", "Вопрос");
    setText("[data-editor-section-shortcut='content']", "1. Вопрос");
    setText("[data-editor-section-shortcut='options']", "2. Варианты");
    setText("[data-editor-section-shortcut='logic']", "3. Логика");
    setText("#emptyEditor p", "Выберите вопрос в центре, чтобы изменить его параметры.");

    const questionTitleRow = document.querySelector("#questionTitleInput")?.closest(".form-row");
    const questionDescriptionRow = document.querySelector("#questionDescriptionInput")?.closest(".form-row");
    const questionTypeRow = document.querySelector("#questionTypeInput")?.closest(".form-row");
    const ratingMinRow = document.querySelector("#ratingLabelMin")?.closest(".form-row");
    const ratingMaxRow = document.querySelector("#ratingLabelMax")?.closest(".form-row");
    const inlineChecks = Array.from(document.querySelectorAll("label.inline-check span"));

    if (questionTitleRow) {
      const label = questionTitleRow.querySelector("span");
      if (label) label.textContent = "Текст вопроса";
    }
    if (questionDescriptionRow) {
      const label = questionDescriptionRow.querySelector("span");
      if (label) label.textContent = "Описание / подсказка";
    }
    setAttr("#questionDescriptionInput", "placeholder", "Дополнительный текст под вопросом");
    if (inlineChecks[0]) inlineChecks[0].textContent = "Обязательный вопрос";
    if (questionTypeRow) {
      const label = questionTypeRow.querySelector("span");
      if (label) label.textContent = "Тип вопроса";
    }
    const questionTypeSelect = document.querySelector("#questionTypeInput");
    if (questionTypeSelect) {
      const optionMap = {
        text: "Текст",
        single: "Один выбор",
        multiple: "Множественный",
        rating: "Рейтинг",
        select: "Список"
      };
      Array.from(questionTypeSelect.options).forEach((option) => {
        option.textContent = optionMap[option.value] || option.textContent;
      });
    }

    setText("#ratingEditor h4", "Шкала рейтинга");
    if (ratingMinRow) {
      const label = ratingMinRow.querySelector("span");
      if (label) label.textContent = "Подпись 1";
    }
    setAttr("#ratingLabelMin", "placeholder", "Например: Плохо");
    if (ratingMaxRow) {
      const label = ratingMaxRow.querySelector("span");
      if (label) label.textContent = "Подпись 5";
    }
    setAttr("#ratingLabelMax", "placeholder", "Например: Отлично");

    setText("#optionsEditor h4", "Варианты ответа");
    const optionsInlineCheck = document.querySelector("#optionsEditor .inline-check span");
    if (optionsInlineCheck) optionsInlineCheck.textContent = "Логика переходов по ответам";
    setText("#questionLogicHint", "Выберите, на какую страницу перейдет участник после каждого варианта.");
    setText("#addOptionBtn", "+ Добавить вариант");
    setText("#removeQuestionBtn", "Удалить вопрос");

    setText("#designSettingsTitle", "Дизайн страницы");
    setText("#designSettingsPanel .constructor-modal-lead", "Цвет, фон и макет выбранной страницы.");
    setText("#closeDesignSettingsBtn", "×");
    setAttr("#closeDesignSettingsBtn", "aria-label", "Закрыть");
    setText("#designSettingsPanel .constructor-design__head h4", "Тема");
    setText("#openThemePickerBtn", "Выбрать тему");
    const pageBgColorRow = document.querySelector("#pageBgColorInput")?.closest(".form-row");
    const pageBgImageRow = document.querySelector("#pageBgImageInput")?.closest(".form-row");
    const pageLayoutRow = document.querySelector("#pageLayoutInput")?.closest(".form-row");
    const pageOverlayRow = document.querySelector("#pageOverlayInput")?.closest(".form-row");
    if (pageBgColorRow) {
      const label = pageBgColorRow.querySelector("span");
      if (label) label.textContent = "Цвет фона";
    }
    if (pageBgImageRow) {
      const label = pageBgImageRow.querySelector("span");
      if (label) label.textContent = "Фоновое изображение (URL)";
    }
    if (pageLayoutRow) {
      const label = pageLayoutRow.querySelector("span");
      if (label) label.textContent = "Макет";
    }
    const pageLayoutSelect = document.querySelector("#pageLayoutInput");
    if (pageLayoutSelect) {
      const layoutMap = {
        full: "Цельный фон",
        "split-right-image": "Фото справа",
        "split-left-image": "Фото слева",
        "cover-top-image": "Обложка сверху",
        "center-card": "Карточка по центру"
      };
      Array.from(pageLayoutSelect.options).forEach((option) => {
        option.textContent = layoutMap[option.value] || option.textContent;
      });
    }
    if (pageOverlayRow) {
      const label = pageOverlayRow.querySelector("span");
      if (label) label.innerHTML = 'Накладка: <strong id="pageOverlayValue">0%</strong>';
    }
    setText("#applyDesignAllBtn", "Применить ко всем");
    setText("#resetDesignBtn", "Сброс");

    setText("#questionTypeTitle", "Выберите тип вопроса");
    const typeGroups = Array.from(document.querySelectorAll(".constructor-type-group"));
    if (typeGroups[0]) {
      const h4 = typeGroups[0].querySelector("h4");
      if (h4) h4.textContent = "Базовые";
      const buttons = Array.from(typeGroups[0].querySelectorAll(".constructor-type-item"));
      if (buttons[0]) buttons[0].innerHTML = "<strong>Одиночный выбор</strong><span>Один вариант ответа</span>";
      if (buttons[1]) buttons[1].innerHTML = "<strong>Множественный выбор</strong><span>Несколько вариантов ответа</span>";
      if (buttons[2]) buttons[2].innerHTML = "<strong>Выпадающий список</strong><span>Компактный выбор из длинного списка</span>";
      if (buttons[3]) buttons[3].innerHTML = "<strong>Опрос с изображениями</strong><span>Карточки вариантов с картинками</span>";
    }
    if (typeGroups[1]) {
      const h4 = typeGroups[1].querySelector("h4");
      if (h4) h4.textContent = "Открытые";
      const buttons = Array.from(typeGroups[1].querySelectorAll(".constructor-type-item"));
      if (buttons[0]) buttons[0].innerHTML = "<strong>Текстовый ответ</strong><span>Свободный текст</span>";
      if (buttons[1]) buttons[1].innerHTML = "<strong>Ответ электронной почты</strong><span>Проверка email</span>";
    }
    if (typeGroups[2]) {
      const h4 = typeGroups[2].querySelector("h4");
      if (h4) h4.textContent = "Оценочные";
      const buttons = Array.from(typeGroups[2].querySelectorAll(".constructor-type-item"));
      if (buttons[0]) buttons[0].innerHTML = "<strong>Звездный рейтинг</strong><span>Шкала 1-5</span>";
      if (buttons[1]) buttons[1].innerHTML = "<strong>NPS-оценка</strong><span>Быстрая шкала лояльности</span>";
    }
    if (typeGroups[3]) {
      const h4 = typeGroups[3].querySelector("h4");
      if (h4) h4.textContent = "Элементы";
      const button = typeGroups[3].querySelector(".constructor-type-item");
      if (button) button.innerHTML = "<strong>Собственный текст</strong><span>Информационный блок</span>";
    }

    setText("#creationEntryTitle", "Создайте опрос");
    setHtml("#entryCustomBtn", "<strong>Собственный опрос</strong><span>Создайте анкету с нуля и настройте вопросы вручную.</span>");
    setHtml("#entryQuickStartBtn", "<strong>Быстрый старт</strong><span>Получите готовую структуру и настройте её под задачу.</span>");
    setHtml("#entryTemplateBtn", "<strong>Опрос из шаблона</strong><span>Выберите готовую структуру и адаптируйте под себя.</span>");
    setText("#templateCatalogTitle", "Шаблоны опросов");
    setText("#templateCatalogOverlay .constructor-modal-lead", "Выберите категорию и создайте анкету на готовой структуре.");
    setText("#templatePreviewTitle", "Состав шаблона");
    setText("#themePickerTitle", "Выберите тему");
    setText("#versionHistoryTitle", "История версий");
    setText("#templateCreateBlankBtn", "+ Создать анкету");
    setText("#applyTemplateBtn", "Использовать шаблон");
    setText("#applyThemeBtn", "Использовать тему");
    setText("#templateCountBadge", "0 шаблонов");
    setAttr("#templateSearchInput", "placeholder", "Поиск шаблона");
    setText(".constructor-builder-hero h1", "Конструктор анкеты");
    setText(".constructor-builder-hero p", "Соберите страницы, добавьте вопросы, настройте переходы и проверьте анкету перед публикацией.");
    setText(".constructor-spotlight__head h3", "Рекомендуемые сценарии");
    setText(".constructor-spotlight__head p", "Готовые заготовки для частых задач: регистрация, обратная связь, исследование и опрос команды.");
    setHtml("[data-hero-template='event_feedback']", "<span>После события</span><strong>Фидбек события</strong><p>Впечатление, программа, организация и причины оценки.</p>");
    setHtml("[data-hero-template='product_discovery']", "<span>Исследование</span><strong>Проверка идеи</strong><p>Задача пользователя, текущий процесс, критерии выбора и барьеры внедрения.</p>");
    setHtml("[data-hero-template='hr_pulse']", "<span>Команда</span><strong>Опрос команды</strong><p>Нагрузка, атмосфера, обратная связь и риски удержания команды.</p>");
    setText("#quickStartWizardTitle", "Быстрый старт");
    setText("#wizardBackBtn", "Назад");
    setText("#wizardNextBtn", "Далее");
    setText("#wizardApplyBtn", "Создать анкету");
    setHtml("[data-wizard-preset='registration']", "<strong>Регистрация</strong><span>3 страницы: контакты, сегментация, согласия</span>");
    setHtml("[data-wizard-preset='event-feedback']", "<strong>Фидбек события</strong><span>3 страницы: впечатление, программа, организация</span>");
    setHtml("[data-wizard-preset='product-discovery']", "<strong>Проверка идеи</strong><span>3 страницы: задача, процесс, критерии выбора</span>");
    setHtml("[data-wizard-preset='hr-pulse']", "<strong>Опрос команды</strong><span>3 страницы: самочувствие, процессы, удержание</span>");

    ["#closeQuestionTypeModalBtn", "#closeCreationEntryBtn", "#closeTemplateCatalogBtn", "#closeTemplatePreviewBtn", "#closeThemePickerBtn", "#closeVersionHistoryBtn"]
      .forEach((selector) => {
        setText(selector, "×");
        setAttr(selector, "aria-label", "Закрыть");
      });
  }

  async function apiRequest(url, options = {}) {
    const method = options.method || "GET";
    if (isDev) {
      console.log("[builder:request]", method, url, options.body || null);
    }
    const response = await fetch(url, options);
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }
    if (isDev) {
      console.log("[builder:response]", method, url, response.status, data);
    }
    if (response.status === 401) {
      const nextUrl = encodeURIComponent(`/create?surveyId=${surveyId || ""}`);
      window.location.href = `/auth?next=${nextUrl}`;
      throw new Error("Требуется вход");
    }
    if (!response.ok) {
      throw new Error(data.error || data.message || `Ошибка ${response.status}`);
    }
    return data;
  }

  function cacheRefs() {
    [
      "logoutBtn",
      "pagesList",
      "pagesPanelMeta",
      "renamePageBtn",
      "duplicatePageBtn",
      "removePageBtn",
      "addPageBtn",
      "surveyTitle",
      "surveyDescription",
      "welcomeCoverImageInput",
      "welcomeCoverUploadBtn",
      "welcomeCoverUploadInput",
      "welcomeLayoutInput",
      "welcomeImageOpacityInput",
      "welcomeImageOpacityValue",
      "welcomeImageEnabledInput",
      "welcomePreviewCard",
      "questionsStep",
      "surveySettingsStep",
      "publishStep",
      "accessPasswordEnabledInput",
      "accessPasswordInput",
      "responseLimitInput",
      "confirmSettingsBtn",
      "backToQuestionsBtn",
      "backToSettingsBtn",
      "shareLinkInput",
      "openPublishedSurveyLink",
      "shareQrImage",
      "downloadQrLink",
      "worktopSurveyTitle",
      "builderMetaPages",
      "builderMetaQuestions",
      "builderMetaLogic",
      "builderMetaTime",
      "builderMetaDifficulty",
      "heroQuickStartBtn",
      "heroTemplateCatalogBtn",
      "heroAddQuestionBtn",
      "spotlightCatalogBtn",
      "heroMetaPages",
      "heroMetaQuestions",
      "heroMetaLogic",
      "heroMetaTime",
      "shareSurveyBtn",
      "saveState",
      "saveStateText",
      "publishBtn",
      "openQuickStartWizardBtn",
      "toolbarLaneComposeBtn",
      "toolbarLaneOrganizeBtn",
      "toolbarLaneAdvancedBtn",
      "addQuestionBtn",
      "openTemplateCatalogBtn",
      "openVersionHistoryBtn",
      "toggleDensityBtn",
      "toggleFocusBtn",
      "openCommandPaletteBtn",
      "questionSearchInput",
      "prevQuestionMatchBtn",
      "nextQuestionMatchBtn",
      "questionMatchCount",
      "selectAllVisibleQuestionsBtn",
      "clearQuestionSelectionBtn",
      "clearQuestionSearchBtn",
      "duplicateSelectedQuestionBtn",
      "deleteSelectedQuestionBtn",
      "moveSelectedToPageBtn",
      "undoBtn",
      "redoBtn",
      "questionBulkDock",
      "bulkDockCount",
      "bulkDockMoveBtn",
      "bulkDockDuplicateBtn",
      "bulkDockDeleteBtn",
      "bulkDockClearBtn",
      "hotkeysHint",
      "questionList",
      "logicMapCount",
      "logicMapList",
      "statusText",
      "mobileAddQuestionFab",
      "questionEditor",
      "quickStartWizardOverlay",
      "closeQuickStartWizardBtn",
      "wizardStep1",
      "wizardStep2",
      "wizardStep3",
      "wizardPaneScenario",
      "wizardPaneTheme",
      "wizardPaneLaunch",
      "wizardSurveyTitleInput",
      "wizardThemeSelect",
      "wizardSummaryText",
      "wizardBackBtn",
      "wizardNextBtn",
      "wizardApplyBtn",
      "versionHistoryOverlay",
      "closeVersionHistoryBtn",
      "versionHistoryList",
      "emptyEditor",
      "questionTitleInput",
      "questionDescriptionInput",
      "questionPanelOpacityInput",
      "questionPanelOpacityValue",
      "questionRequiredInput",
      "questionRequiredQuickBtn",
      "questionTypeInput",
      "ratingEditor",
      "ratingLabelMin",
      "ratingLabelMax",
      "optionsEditor",
      "questionLogicEnabledInput",
      "questionLogicHint",
      "optionsList",
      "addOptionBtn",
      "removeQuestionBtn",
      "questionTypeOverlay",
      "closeQuestionTypeModalBtn",
      "creationEntryOverlay",
      "closeCreationEntryBtn",
      "entryCustomBtn",
      "entryQuickStartBtn",
      "entryTemplateBtn",
      "templateCatalogOverlay",
      "closeTemplateCatalogBtn",
      "templateCategoryList",
      "templateSearchInput",
      "templateCountBadge",
      "templateCreateBlankBtn",
      "templateCatalogGrid",
      "templatePreviewOverlay",
      "closeTemplatePreviewBtn",
      "templatePreviewName",
      "templatePreviewDescription",
      "templatePreviewMeta",
      "templatePreviewQuestions",
      "applyTemplateBtn",
      "pagesPanel",
      "questionsPanel",
      "settingsPanel",
      "settingsTabQuestion",
      "settingsQuestionPane",
      "closeInspectorBtn",
      "openDesignSettingsBtn",
      "designSettingsOverlay",
      "designSettingsPanel",
      "closeDesignSettingsBtn",
      "openThemePickerBtn",
      "activeThemeBadge",
      "pageBgColorInput",
      "pageBgImageInput",
      "pageBgUploadBtn",
      "pageBgUploadInput",
      "pageLayoutInput",
      "pageOverlayInput",
      "pageOverlayValue",
      "applyDesignAllBtn",
      "resetDesignBtn",
      "themePickerOverlay",
      "closeThemePickerBtn",
      "themeGrid",
      "themePreviewCard",
      "themePreviewName",
      "themePreviewDescription",
      "applyThemeBtn",
      "commandPaletteOverlay",
      "closeCommandPaletteBtn",
      "commandPaletteInput",
      "commandPaletteList"
    ].forEach((id) => {
      refs[id] = document.getElementById(id);
    });

    refs.mobileTabs = Array.from(document.querySelectorAll("[data-panel-tab]"));
    refs.builderSectionButtons = Array.from(document.querySelectorAll("[data-builder-section]"));
    refs.panels = Array.from(document.querySelectorAll(".constructor-panel"));
    refs.quickTypeButtons = Array.from(document.querySelectorAll("[data-quick-question-type]"));
    refs.quickAddButtons = Array.from(document.querySelectorAll("[data-quick-add-type]"));
    refs.dragAddButtons = Array.from(document.querySelectorAll("[data-drag-add-type]"));
    refs.questionPresetButtons = Array.from(document.querySelectorAll("[data-question-preset]"));
    refs.toolbarLaneButtons = Array.from(document.querySelectorAll("[data-toolbar-lane-btn]"));
    refs.toolbarLaneGroups = Array.from(document.querySelectorAll("[data-toolbar-lane]"));
    refs.wizardPresetButtons = Array.from(document.querySelectorAll("[data-wizard-preset]"));
    refs.editorSectionShortcutButtons = Array.from(document.querySelectorAll("[data-editor-section-shortcut]"));
    refs.heroTemplateButtons = Array.from(document.querySelectorAll("[data-hero-template]"));

    must(refs.pagesList, "pagesList");
    must(refs.questionList, "questionList");
  }

  function enhanceQuestionEditorLayout() {
    const editor = refs.questionEditor;
    if (!editor || editor.dataset.layoutEnhanced === "1") return;

    const titleRow = refs.questionTitleInput?.closest(".form-row");
    const descriptionRow = refs.questionDescriptionInput?.closest(".form-row");
    const opacityRow = refs.questionPanelOpacityInput?.closest(".form-row");
    const requiredRow = refs.questionRequiredInput?.closest(".inline-check");
    const requiredQuickBtn = refs.questionRequiredQuickBtn;
    const typeRow = refs.questionTypeInput?.closest(".form-row");
    const ratingSection = refs.ratingEditor;
    const optionsSection = refs.optionsEditor;
    const logicRow = refs.questionLogicEnabledInput?.closest(".inline-check");
    const logicHint = refs.questionLogicHint;
    const removeButton = refs.removeQuestionBtn;

    const createGroup = (title, tone = "") => {
      const section = document.createElement("section");
      section.className = `constructor-editor-group${tone ? ` ${tone}` : ""}`;
      const heading = document.createElement("h4");
      heading.className = "constructor-editor-group__title";
      heading.textContent = title;
      section.appendChild(heading);
      return section;
    };

    const mainGroup = createGroup("Текст вопроса");
    mainGroup.dataset.editorSection = "content";
    const optionsGroup = createGroup("Варианты");
    optionsGroup.dataset.editorSection = "options";
    const logicGroup = createGroup("Логика");
    logicGroup.dataset.editorSection = "logic";
    const actionGroup = createGroup("Удаление вопроса", "constructor-editor-group--danger");
    actionGroup.dataset.editorSection = "logic";
    const typeHint = document.createElement("div");
    typeHint.id = "questionTypeHint";
    typeHint.className = "constructor-type-hint";
    typeHint.textContent = "Подсказки появятся после выбора вопроса.";

    [titleRow, descriptionRow, opacityRow].forEach((node) => {
      if (node) mainGroup.appendChild(node);
    });
    [requiredRow, requiredQuickBtn, typeRow, ratingSection].forEach((node) => {
      if (node) mainGroup.appendChild(node);
    });
    [typeHint].forEach((node) => {
      if (node) mainGroup.appendChild(node);
    });
    if (logicRow && logicRow.parentElement === optionsSection) logicGroup.appendChild(logicRow);
    if (logicHint && logicHint.parentElement === optionsSection) logicGroup.appendChild(logicHint);
    if (optionsSection) optionsGroup.appendChild(optionsSection);
    if (removeButton) actionGroup.appendChild(removeButton);

    editor.innerHTML = "";
    [mainGroup, optionsGroup, logicGroup, actionGroup].forEach((group) => {
      if (group.children.length > 1) editor.appendChild(group);
    });

    editor.dataset.layoutEnhanced = "1";
    setEditorSection(state.editorSection || "content");
  }

  function setEditorSection(section) {
    const editor = refs.questionEditor;
    if (!editor) return;
    const normalized = ["content", "options", "logic"].includes(section) ? section : "content";
    state.editorSection = normalized;
    editor.querySelectorAll("[data-editor-section]").forEach((node) => {
      const isUnavailable = node.dataset.sectionAvailable === "0";
      if (state.simpleMode) {
        node.hidden = isUnavailable;
      } else {
        node.hidden = isUnavailable || node.dataset.editorSection !== normalized;
      }
    });
    refs.editorSectionShortcutButtons.forEach((node) => {
      node.classList.toggle("is-active", node.dataset.editorSectionShortcut === normalized);
    });
  }

  function getQuestionTypeHint(type) {
    const hints = {
      text: "Свободный ответ. Используйте для обратной связи и длинных комментариев.",
      single: "Один вариант ответа. Лучший выбор для быстрых и однозначных решений.",
      multiple: "Несколько вариантов. Подходит для чек-листов и составных предпочтений.",
      image: "Карточки с изображениями. Доступны загрузка фото, Cover/Contain и безопасный масштаб.",
      select: "Компактный список. Удобно, когда вариантов много и нужен чистый интерфейс.",
      rating: "Оценка по шкале. Идеально для измерения удовлетворенности и качества."
    };
    return hints[String(type || "").trim().toLowerCase()] || hints[normalizeType(type)] || hints.text;
  }

  function mountDesignSidebar() {
    const sidebar = refs.settingsPanel;
    const designPanel = refs.designSettingsPanel;
    if (!sidebar || !designPanel || designPanel.dataset.sidebarMounted === "1") return;

    const archive = document.createElement("div");
    archive.id = "questionSettingsArchive";
    archive.className = "question-settings-overlay";
    archive.hidden = true;
    const modal = document.createElement("section");
    modal.className = "question-settings-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Настройки вопроса");
    while (sidebar.firstChild) {
      modal.appendChild(sidebar.firstChild);
    }
    archive.appendChild(modal);
    archive.addEventListener("click", (event) => {
      if (event.target === archive) setInspectorOpen(false);
    });
    document.body.appendChild(archive);

    designPanel.dataset.sidebarMounted = "1";
    designPanel.classList.remove("constructor-modal", "constructor-modal--design");
    designPanel.classList.add("constructor-design--sidebar");
    designPanel.removeAttribute("role");
    designPanel.removeAttribute("aria-modal");
    designPanel.removeAttribute("aria-labelledby");

    if (refs.closeDesignSettingsBtn) refs.closeDesignSettingsBtn.hidden = true;
    refs.designSettingsOverlay?.setAttribute("hidden", "");

    sidebar.classList.add("constructor-editor--design");
    sidebar.setAttribute("aria-label", "Дизайн анкеты");
    sidebar.appendChild(designPanel);
  }

  function applyOptionPreset(presetKey) {
    const question = getSelectedQuestion();
    if (!question || !CHOICE_TYPES.has(question.type)) return;
    const preset = OPTION_PRESETS[presetKey];
    if (!Array.isArray(preset) || !preset.length) return;
    question.options = preset.map((label) => createOption(label));
    renderOptions(question);
    renderSurveyPreview();
    markDirty(`Пресет применён: ${preset.length} вариантов`);
  }

  function bindEvents() {
    refs.logoutBtn?.addEventListener("click", async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } finally {
        window.location.href = "/auth";
      }
    });

    refs.addPageBtn?.addEventListener("click", () => {
      const page = createPage();
      state.survey.pages.push(page);
      state.selectedPageId = page.id;
      state.selectedQuestionId = null;
      state.selectedQuestionIds = [];
      renderAll();
      markDirty("Страница добавлена");
      focusPanelOnMobile("pages");
    });
    refs.renamePageBtn?.addEventListener("click", renameSelectedPage);
    refs.duplicatePageBtn?.addEventListener("click", duplicateSelectedPage);
    refs.removePageBtn?.addEventListener("click", removeSelectedPage);

    refs.addQuestionBtn?.addEventListener("click", () => openQuestionTypeModal(null));
    refs.mobileAddQuestionFab?.addEventListener("click", () => openQuestionTypeModal(null));
    refs.openQuickStartWizardBtn?.addEventListener("click", openQuickStartWizard);
    refs.openTemplateCatalogBtn?.addEventListener("click", openTemplateCatalogModal);
    refs.toolbarLaneButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const lane = String(button.dataset.toolbarLaneBtn || "").trim();
        if (!lane) return;
        setToolbarLane(lane, true);
      });
    });
    refs.toggleDensityBtn?.addEventListener("click", () => {
      setDensityMode(state.densityMode === "compact" ? "cozy" : "compact", true);
    });
    refs.toggleFocusBtn?.addEventListener("click", () => {
      setFocusMode(!state.focusMode, true);
    });
    refs.openCommandPaletteBtn?.addEventListener("click", openCommandPalette);
    refs.openVersionHistoryBtn?.addEventListener("click", openVersionHistoryModal);
    refs.closeQuickStartWizardBtn?.addEventListener("click", closeQuickStartWizard);
    refs.wizardBackBtn?.addEventListener("click", () => setWizardStep(state.wizard.step - 1));
    refs.wizardNextBtn?.addEventListener("click", nextWizardStep);
    refs.wizardApplyBtn?.addEventListener("click", applyQuickStartWizard);
    refs.wizardSurveyTitleInput?.addEventListener("input", (event) => {
      state.wizard.title = String(event.target.value || "").trim() || "Новая анкета";
      updateWizardSummary();
    });
    refs.wizardThemeSelect?.addEventListener("change", (event) => {
      state.wizard.themeId = String(event.target.value || "sea");
      updateWizardSummary();
    });
    refs.wizardPresetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const preset = String(button.dataset.wizardPreset || "").trim();
        if (!preset) return;
        state.wizard.preset = preset;
        refs.wizardPresetButtons.forEach((node) => node.classList.toggle("is-active", node === button));
        updateWizardSummary();
      });
    });
    refs.editorSectionShortcutButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const section = String(button.dataset.editorSectionShortcut || "").trim();
        setEditorSection(section);
      });
    });
    refs.questionSearchInput?.addEventListener("input", (event) => {
      state.questionFilter = String(event.target.value || "").trim().toLowerCase();
      state.matchCursor = 0;
      renderQuestions();
    });
    refs.questionSearchInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      moveQuestionMatch(event.shiftKey ? -1 : 1);
    });
    refs.prevQuestionMatchBtn?.addEventListener("click", () => moveQuestionMatch(-1));
    refs.nextQuestionMatchBtn?.addEventListener("click", () => moveQuestionMatch(1));
    refs.clearQuestionSearchBtn?.addEventListener("click", () => {
      state.questionFilter = "";
      state.matchCursor = 0;
      if (refs.questionSearchInput) refs.questionSearchInput.value = "";
      renderQuestions();
      refs.questionSearchInput?.focus();
    });
    refs.selectAllVisibleQuestionsBtn?.addEventListener("click", selectAllVisibleQuestions);
    refs.clearQuestionSelectionBtn?.addEventListener("click", clearQuestionSelection);
    refs.duplicateSelectedQuestionBtn?.addEventListener("click", () => {
      duplicateSelectedQuestions();
    });
    refs.deleteSelectedQuestionBtn?.addEventListener("click", () => {
      removeSelectedQuestions();
    });
    refs.moveSelectedToPageBtn?.addEventListener("click", () => {
      moveSelectedQuestionsToPagePrompt();
    });
    refs.bulkDockDuplicateBtn?.addEventListener("click", () => {
      duplicateSelectedQuestions();
    });
    refs.bulkDockDeleteBtn?.addEventListener("click", () => {
      removeSelectedQuestions();
    });
    refs.bulkDockMoveBtn?.addEventListener("click", () => {
      moveSelectedQuestionsToPagePrompt();
    });
    refs.bulkDockClearBtn?.addEventListener("click", () => {
      clearQuestionSelection();
    });
    refs.questionList?.addEventListener("dragover", (event) => {
      if (!paletteDragState.questionType) return;
      event.preventDefault();
      refs.questionList.classList.add("is-drop-add");
    });
    refs.questionList?.addEventListener("dragleave", () => {
      refs.questionList.classList.remove("is-drop-add");
    });
    refs.questionList?.addEventListener("drop", (event) => {
      refs.questionList.classList.remove("is-drop-add");
      const type = paletteDragState.questionType || event.dataTransfer.getData("application/x-question-type");
      if (!type) return;
      event.preventDefault();
      paletteDragState.questionType = null;
      addQuestion(type);
    });
    refs.builderHealthRecommendations?.addEventListener("click", (event) => {
      const actionBtn = event.target.closest("[data-health-action]");
      if (!actionBtn) return;
      const action = String(actionBtn.dataset.healthAction || "").trim();
      if (!action) return;
      runHealthAction(action);
    });
    refs.undoBtn?.addEventListener("click", undoChange);
    refs.redoBtn?.addEventListener("click", redoChange);
    refs.openThemePickerBtn?.addEventListener("click", () => {
      openThemePickerModal();
    });
    refs.confirmSettingsBtn?.addEventListener("click", () => {
      saveSurveySettingsStep().then(() => activateBuilderSection("publish")).catch((error) => {
        console.error(error);
        setStatus(error.message || "Не удалось сохранить настройки", true);
      });
    });
    refs.backToQuestionsBtn?.addEventListener("click", () => activateBuilderSection("questions"));
    refs.backToSettingsBtn?.addEventListener("click", () => activateBuilderSection("survey"));
    refs.closeInspectorBtn?.addEventListener("click", () => setInspectorOpen(false));
    refs.settingsTabQuestion?.addEventListener("click", () => setSettingsPane("question"));
    refs.openDesignSettingsBtn?.addEventListener("click", openDesignSettingsModal);
    refs.entryCustomBtn?.addEventListener("click", () => {
      startNewBlankSurvey().catch((error) => {
        console.error(error);
        setStatus(error.message || "Не удалось создать анкету", true);
      });
    });
    refs.entryQuickStartBtn?.addEventListener("click", () => {
      closeCreationEntryModal(false);
      openQuickStartWizard();
    });
    refs.entryTemplateBtn?.addEventListener("click", () => {
      closeCreationEntryModal(false);
      openTemplateCatalogModal();
    });
    refs.heroQuickStartBtn?.addEventListener("click", openQuickStartWizard);
    refs.heroTemplateCatalogBtn?.addEventListener("click", openTemplateCatalogModal);
    refs.spotlightCatalogBtn?.addEventListener("click", openTemplateCatalogModal);
    refs.heroAddQuestionBtn?.addEventListener("click", () => addQuestion());
    refs.heroTemplateButtons?.forEach((button) => {
      button.addEventListener("click", () => {
        const key = String(button.dataset.heroTemplate || "").trim();
        if (!key) return;
        openTemplatePreviewModal(key);
      });
    });
    refs.templateCreateBlankBtn?.addEventListener("click", () => {
      closeTemplateCatalogModal();
      startNewBlankSurvey().catch((error) => {
        console.error(error);
        setStatus(error.message || "Не удалось создать анкету", true);
      });
    });
    refs.templateSearchInput?.addEventListener("input", (event) => {
      state.templateSearch = String(event.target.value || "").trim().toLowerCase();
      renderTemplateCatalogGrid();
    });
    refs.applyTemplateBtn?.addEventListener("click", () => {
      if (!state.previewTemplateKey) return;
      createSurveyFromTemplateRemote(state.previewTemplateKey).catch((error) => {
        console.error(error);
        setStatus(error.message || "Не удалось применить шаблон", true);
      });
    });
    refs.applyThemeBtn?.addEventListener("click", () => {
      applyThemeToCurrentPage(state.previewThemeId || state.activeThemeId);
      closeThemePickerModal();
    });
    refs.pageBgColorInput?.addEventListener("input", (event) => {
      const page = ensureSelectedPage();
      page.design = normalizePageDesign({ ...(page.design || {}), bgColor: event.target.value });
      renderPages();
      renderQuestions();
      updateDesignEditor();
      markDirty();
    });
    refs.pageBgImageInput?.addEventListener("input", (event) => {
      const page = ensureSelectedPage();
      page.design = normalizePageDesign({ ...(page.design || {}), bgImage: event.target.value.trim() });
      renderPages();
      renderQuestions();
      updateDesignEditor();
      markDirty();
    });
    refs.pageBgUploadBtn?.addEventListener("click", () => {
      refs.pageBgUploadInput?.click();
    });
    refs.pageBgUploadInput?.addEventListener("change", async (event) => {
      const input = event.target;
      const file = input?.files?.[0];
      if (!file) return;
      const page = ensureSelectedPage();
      refs.pageBgUploadBtn.disabled = true;
      setStatus("Загрузка фона...");
      try {
        const uploadedPath = await uploadImageFile(file);
        page.design = normalizePageDesign({ ...(page.design || {}), bgImage: uploadedPath });
        if (refs.pageBgImageInput) refs.pageBgImageInput.value = uploadedPath;
        renderPages();
        renderQuestions();
        updateDesignEditor();
        markDirty("Фон загружен");
        toast("Фон страницы загружен");
      } catch (error) {
        setStatus(error.message || "Не удалось загрузить изображение", true);
      } finally {
        refs.pageBgUploadBtn.disabled = false;
        input.value = "";
      }
    });
    refs.pageLayoutInput?.addEventListener("change", (event) => {
      const page = ensureSelectedPage();
      page.design = normalizePageDesign({ ...(page.design || {}), layout: event.target.value });
      renderPages();
      renderQuestions();
      updateDesignEditor();
      markDirty();
    });
    refs.pageOverlayInput?.addEventListener("input", (event) => {
      const page = ensureSelectedPage();
      page.design = normalizePageDesign({ ...(page.design || {}), overlay: Number(event.target.value || 0) });
      renderPages();
      renderQuestions();
      updateDesignEditor();
      markDirty();
    });
    refs.applyDesignAllBtn?.addEventListener("click", () => {
      const current = ensureSelectedPage();
      const currentDesign = normalizePageDesign(current.design);
      state.survey.pages = state.survey.pages.map((page) => ({
        ...page,
        design: { ...currentDesign }
      }));
      renderAll();
      markDirty("Дизайн применён ко всем страницам");
    });
    refs.resetDesignBtn?.addEventListener("click", () => {
      const page = ensureSelectedPage();
      const theme = getThemeById(state.activeThemeId);
      page.design = normalizePageDesign({
        bgColor: theme.bgColor,
        bgImage: "",
        layout: "full",
        overlay: 0
      });
      renderPages();
      renderQuestions();
      updateDesignEditor();
      markDirty("Дизайн страницы сброшен");
    });

    refs.publishBtn?.addEventListener("click", () => {
      if (state.builderSection === "questions") {
        activateBuilderSection("survey");
        return;
      }
      if (state.builderSection === "survey") {
        refs.confirmSettingsBtn?.click();
        return;
      }
      publishSurvey(true).catch((error) => {
        console.error(error);
        setStatus(error.message || "Ошибка публикации", true);
      });
    });
    refs.shareSurveyBtn?.addEventListener("click", async () => {
      if (!surveyId) {
        setStatus("Сначала сохраните анкету", true);
        return;
      }
      const link = `${window.location.origin}/s/${encodeURIComponent(surveyId)}`;
      try {
        await navigator.clipboard.writeText(link);
        toast("Ссылка скопирована");
      } catch {
        setStatus(link);
      }
    });

    refs.surveyTitle?.addEventListener("input", (event) => {
      state.survey.title = event.target.value;
      if (refs.worktopSurveyTitle) refs.worktopSurveyTitle.textContent = state.survey.title || "Новая анкета";
      renderWelcomeSettings();
      markDirty();
    });

    refs.surveyDescription?.addEventListener("input", (event) => {
      state.survey.description = event.target.value;
      renderWelcomeSettings();
      markDirty();
    });

    refs.welcomeCoverImageInput?.addEventListener("input", (event) => {
      updateWelcomeSettings({ coverImage: String(event.target.value || "").trim() || WELCOME_DEFAULT_COVER });
    });

    refs.welcomeCoverUploadBtn?.addEventListener("click", () => {
      refs.welcomeCoverUploadInput?.click();
    });

    refs.welcomeCoverUploadInput?.addEventListener("change", async (event) => {
      const input = event.target;
      const file = input?.files?.[0];
      if (!file) return;
      refs.welcomeCoverUploadBtn.disabled = true;
      setStatus("Загрузка обложки...");
      try {
        const uploadedPath = await uploadImageFile(file);
        updateWelcomeSettings({ coverImage: uploadedPath, imageEnabled: true });
        toast("Обложка вступления загружена");
      } catch (error) {
        setStatus(error.message || "Не удалось загрузить обложку", true);
      } finally {
        refs.welcomeCoverUploadBtn.disabled = false;
        input.value = "";
      }
    });

    refs.welcomeLayoutInput?.addEventListener("change", (event) => {
      const layout = String(event.target.value || "image-right");
      updateWelcomeSettings({
        layout,
        imageEnabled: layout === "typographic" ? false : getWelcomeSettings().imageEnabled
      });
    });

    refs.welcomeImageOpacityInput?.addEventListener("input", (event) => {
      updateWelcomeSettings({ imageOpacity: Number(event.target.value || 86) });
    });

    refs.welcomeImageEnabledInput?.addEventListener("change", (event) => {
      updateWelcomeSettings({
        imageEnabled: Boolean(event.target.checked),
        layout: event.target.checked && getWelcomeSettings().layout === "typographic" ? "image-right" : getWelcomeSettings().layout
      });
    });

    refs.questionTitleInput?.addEventListener("input", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.title = event.target.value;
      refreshQuestionCard(question);
      renderSurveyPreview();
      markDirty();
    });

    refs.questionDescriptionInput?.addEventListener("input", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.description = event.target.value;
      refreshQuestionCard(question);
      renderSurveyPreview();
      markDirty();
    });

    refs.questionPanelOpacityInput?.addEventListener("input", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.panelOpacity = normalizeQuestionPanelOpacity(event.target.value);
      if (refs.questionPanelOpacityValue) refs.questionPanelOpacityValue.textContent = `${question.panelOpacity}%`;
      renderQuestions();
      renderSurveyPreview();
      markDirty();
    });

    refs.questionRequiredInput?.addEventListener("change", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.required = event.target.checked;
      renderQuestions();
      renderSurveyPreview();
      renderEditor();
      markDirty();
    });

    refs.questionRequiredQuickBtn?.addEventListener("click", () => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.required = !Boolean(question.required);
      renderQuestions();
      renderSurveyPreview();
      renderEditor();
      markDirty(question.required ? "Вопрос стал обязательным" : "Обязательность убрана");
    });

    refs.questionTypeInput?.addEventListener("change", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      const selectedType = String(event.target.value || "text").trim().toLowerCase();
      const imageMode = selectedType === "image";
      question.type = normalizeType(imageMode ? "single" : selectedType);
      question.imageChoice = imageMode;

      if (question.type === "rating") {
        question.ratingLabels = ensureRatingLabels(question);
        question.rating = { ...question.ratingLabels };
        question.options = [];
        question.logicEnabled = false;
      } else if (CHOICE_TYPES.has(question.type)) {
        question.options = normalizeOptions(imageMode && !question.options?.length ? getImagePollPreset().options : question.options);
        if (question.options.length < 2) {
          question.options = [createOption("Вариант 1"), createOption("Вариант 2")];
        }
        if (imageMode) {
          applyQuestionImageSettings(question);
        } else {
          question.imageChoice = false;
          question.imageFit = "";
          question.imageScale = 100;
          question.options = question.options.map((option) => ({
            ...option,
            imageUrl: "",
            imageFit: "cover",
            imageScale: 100
          }));
        }
        question.logicEnabled = Boolean(question.logicEnabled);
      } else {
        question.imageChoice = false;
        question.imageFit = "";
        question.imageScale = 100;
        question.options = [];
        question.ratingLabels = null;
        question.rating = null;
        question.logicEnabled = false;
      }

      renderEditor();
      renderQuestions();
      renderSurveyPreview();
      markDirty();
    });

    refs.ratingLabelMin?.addEventListener("input", (event) => {
      const question = getSelectedQuestion();
      if (!question || question.type !== "rating") return;
      question.ratingLabels = ensureRatingLabels(question);
      question.ratingLabels.low = event.target.value;
      question.rating = {
        minLabel: question.ratingLabels.low || "",
        maxLabel: question.ratingLabels.high || ""
      };
      markDirty();
    });

    refs.ratingLabelMax?.addEventListener("input", (event) => {
      const question = getSelectedQuestion();
      if (!question || question.type !== "rating") return;
      question.ratingLabels = ensureRatingLabels(question);
      question.ratingLabels.high = event.target.value;
      question.rating = {
        minLabel: question.ratingLabels.low || "",
        maxLabel: question.ratingLabels.high || ""
      };
      markDirty();
    });

    refs.addOptionBtn?.addEventListener("click", () => {
      const question = getSelectedQuestion();
      if (!question || !CHOICE_TYPES.has(question.type)) return;
      question.options.push(createOption("Вариант"));
      renderOptions(question);
      renderSurveyPreview();
      markDirty();
    });

    refs.questionLogicEnabledInput?.addEventListener("change", (event) => {
      const question = getSelectedQuestion();
      if (!question || !CHOICE_TYPES.has(question.type)) return;
      question.logicEnabled = event.target.checked;
      renderOptions(question);
      markDirty();
    });

    refs.removeQuestionBtn?.addEventListener("click", () => {
      removeSelectedQuestions();
    });

    bindModal(refs.questionTypeOverlay, refs.closeQuestionTypeModalBtn, closeQuestionTypeModal);
    bindModal(refs.creationEntryOverlay, refs.closeCreationEntryBtn, closeCreationEntryModal);
    bindModal(refs.templateCatalogOverlay, refs.closeTemplateCatalogBtn, closeTemplateCatalogModal);
    bindModal(refs.templatePreviewOverlay, refs.closeTemplatePreviewBtn, closeTemplatePreviewModal);
    bindModal(refs.designSettingsOverlay, refs.closeDesignSettingsBtn, closeDesignSettingsModal);
    bindModal(refs.themePickerOverlay, refs.closeThemePickerBtn, closeThemePickerModal);
    bindModal(refs.commandPaletteOverlay, refs.closeCommandPaletteBtn, closeCommandPalette);
    bindModal(refs.quickStartWizardOverlay, refs.closeQuickStartWizardBtn, closeQuickStartWizard);
    bindModal(refs.versionHistoryOverlay, refs.closeVersionHistoryBtn, closeVersionHistoryModal);

    refs.commandPaletteInput?.addEventListener("input", (event) => {
      state.commandSearch = String(event.target.value || "").trim().toLowerCase();
      renderCommandPaletteList();
    });

    window.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redoChange();
        } else {
          undoChange();
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoChange();
        return;
      }

      if (event.key === "Escape") {
        closeAllModals();
        setInspectorOpen(false);
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRemote().then(() => toast("Сохранено")).catch((e) => setStatus(e.message || "Ошибка сохранения", true));
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        refs.questionSearchInput?.focus();
        refs.questionSearchInput?.select();
        return;
      }

      if (isTextEditingTarget(event.target)) return;

      if (event.altKey && event.key === "ArrowUp") {
        event.preventDefault();
        shiftPageSelection(-1);
        return;
      }

      if (event.altKey && event.key === "ArrowDown") {
        event.preventDefault();
        shiftPageSelection(1);
        return;
      }

      if (event.key.toLowerCase() === "v") {
        event.preventDefault();
        setFocusMode(!state.focusMode, true);
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        refs.addPageBtn?.click();
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        refs.publishBtn?.click();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        if (!state.selectedQuestionId) return;
        event.preventDefault();
        duplicateSelectedQuestions();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        addQuestion("text");
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && !event.ctrlKey && !event.metaKey) {
        if (!state.selectedQuestionId) return;
        event.preventDefault();
        removeSelectedQuestions();
      }
    });

    refs.builderSectionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const section = String(button.dataset.builderSection || "questions");
        activateBuilderSection(section);
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1100) {
        refs.panels.forEach((panel) => panel.classList.add("is-active"));
      } else {
        setMobilePanel(state.mobilePanel);
      }
    });

    refs.quickTypeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const type = String(button.dataset.quickQuestionType || "").trim();
        if (!type) return;
        addQuestion(type);
      });
    });

    refs.quickAddButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const type = String(button.dataset.quickAddType || "").trim();
        if (!type) return;
        addQuestion(type);
      });
    });
    refs.dragAddButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const type = String(button.dataset.dragAddType || "").trim();
        if (!type) return;
        addQuestion(type);
      });
      button.addEventListener("dragstart", (event) => {
        const type = String(button.dataset.dragAddType || "").trim();
        if (!type) return;
        paletteDragState.questionType = type;
        button.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("application/x-question-type", type);
      });
      button.addEventListener("dragend", () => {
        paletteDragState.questionType = null;
        refs.dragAddButtons.forEach((node) => node.classList.remove("is-dragging"));
      });
    });
    refs.questionPresetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const key = String(button.dataset.questionPreset || "").trim();
        if (!key) return;
        addQuestionPresetPack(key);
      });
    });
  }

  async function ensureSurvey() {
    surveyId = query.get("surveyId");
    if (surveyId) return;
    if (state.survey?.id) {
      surveyId = String(state.survey.id);
      return;
    }

    const data = await apiRequest("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Новая анкета",
        description: "",
        pages: [
          {
            title: "Страница 1",
            questions: [{ text: "Новый вопрос", type: "text", required: true }]
          }
        ]
      })
    });
    surveyId = String(data.surveyId || data.id || "");
    if (!surveyId) throw new Error("Сервер не вернул ID анкеты");
    state.survey.id = surveyId;

    const url = new URL(window.location.href);
    url.searchParams.set("surveyId", surveyId);
    history.replaceState({}, "", url.toString());
  }

  function safeJsonParse(raw, fallback = null) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  async function loadSurvey() {
    const data = await apiRequest(`/api/surveys/${surveyId}`);

    const pages = normalizePages(data.pages || [], data.questions || []);
    state.survey = {
      id: String(data.survey?.id || surveyId),
      title: String(data.survey?.title || "Новая анкета"),
      description: String(data.survey?.description || ""),
      pages: pages.length ? pages : [createPage("Страница 1")],
      published: data.survey?.status === "published",
      accessPasswordEnabled: Boolean(data.survey?.has_access_password),
      responseLimit: data.survey?.response_limit ?? null,
      updatedAt: data.survey?.updated_at || new Date().toISOString()
    };

    state.selectedPageId = state.survey.pages[0]?.id || null;
    state.selectedQuestionId = state.survey.pages[0]?.questions[0]?.id || null;
    state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];
    const firstTheme = state.survey.pages[0]?.design?.themeId || state.activeThemeId;
    state.activeThemeId = firstTheme;
    state.previewThemeId = firstTheme;
  }

  function renderAll() {
    ensureSelectionConsistency();
    refs.surveyTitle.value = state.survey.title;
    refs.surveyDescription.value = state.survey.description;
    if (refs.accessPasswordEnabledInput) refs.accessPasswordEnabledInput.checked = Boolean(state.survey.accessPasswordEnabled);
    if (refs.responseLimitInput) refs.responseLimitInput.value = state.survey.responseLimit == null ? "" : String(state.survey.responseLimit);
    if (refs.worktopSurveyTitle) refs.worktopSurveyTitle.textContent = state.survey.title || "Новая анкета";
    if (refs.questionSearchInput) refs.questionSearchInput.value = state.questionFilter || "";
    updateQuestionActionButtons();
    updateBuilderMeta();
    if (refs.hotkeysHint) {
      refs.hotkeysHint.textContent = state.simpleMode
        ? "Клик по карточке открывает редактирование • Режим: простой"
        : `Ctrl/Cmd+клик множественный выбор • Ctrl+D дубль • Del удалить • Ctrl+K команды • Alt+↑/↓ страницы • режим: ${state.densityMode === "compact" ? "компакт" : "обычный"}`;
    }

    renderPages();
    renderQuestions();
    renderEditor();
    setSettingsPane(state.settingsPane);
    updateHistoryControls();
    updateDesignEditor();
    renderSurveyPreview();
    renderLogicMap();
    renderWelcomeSettings();
    activateBuilderSection(state.builderSection || "questions");
    updateSharePanel();

    if (window.innerWidth <= 1100) {
      setMobilePanel(state.mobilePanel);
    }
  }

  function updateBuilderMeta() {
    const pages = Array.isArray(state.survey.pages) ? state.survey.pages.length : 0;
    const questions = (state.survey.pages || []).reduce((sum, page) => sum + (Array.isArray(page.questions) ? page.questions.length : 0), 0);
    const logicRoutes = (state.survey.pages || []).reduce(
      (sum, page, pageIndex) =>
        sum +
        (Array.isArray(page.questions)
          ? page.questions.reduce(
              (qSum, question) =>
                qSum +
                (Array.isArray(question.options)
                  ? question.options.filter((opt) => {
                      if (!question.logicEnabled) return false;
                      return hasActiveLogicRoute(opt, pageIndex);
                    }).length
                  : 0),
              0
            )
          : 0),
      0
    );
    const estimatedSeconds = (state.survey.pages || []).reduce((sum, page) => {
      if (!Array.isArray(page.questions)) return sum;
      return (
        sum +
        page.questions.reduce((qSum, question) => {
          const type = normalizeType(question?.type);
          if (type === "text") return qSum + 24;
          if (type === "rating") return qSum + 12;
          if (type === "select") return qSum + 14;
          const optionCount = normalizeOptions(question?.options).length;
          return qSum + (optionCount >= 5 ? 18 : 14);
        }, 0)
      );
    }, 0);
    const estimatedMinutes = Math.max(1, Math.round(estimatedSeconds / 60));
    const difficulty = questions <= 8 ? "Лёгкая" : questions <= 16 ? "Средняя" : "Большая";
    if (refs.builderMetaPages) refs.builderMetaPages.textContent = `${pages} стр.`;
    if (refs.builderMetaQuestions) refs.builderMetaQuestions.textContent = `${questions} вопросов`;
    if (refs.builderMetaLogic) refs.builderMetaLogic.textContent = `${logicRoutes} переходов`;
    if (refs.builderMetaTime) refs.builderMetaTime.textContent = `~${estimatedMinutes} мин`;
    if (refs.builderMetaDifficulty) refs.builderMetaDifficulty.textContent = difficulty;
    if (refs.heroMetaPages) refs.heroMetaPages.textContent = String(pages);
    if (refs.heroMetaQuestions) refs.heroMetaQuestions.textContent = String(questions);
    if (refs.heroMetaLogic) refs.heroMetaLogic.textContent = String(logicRoutes);
    if (refs.heroMetaTime) refs.heroMetaTime.textContent = `~${estimatedMinutes} мин`;
    updateBuilderHealth({ pages, questions, logicRoutes });
  }

  function updateBuilderHealth(metrics = null) {
    const report = buildCurrentSurveyQualityReport(metrics);
    const { pages, questions, logicRoutes, requiredCount, choiceQuestionsWithBadOptions } = report;
    const checks = Object.fromEntries(report.checks.map((check) => [check.id, check.passed]));
    const percent = report.score;

    if (refs.builderHealthPercent) refs.builderHealthPercent.textContent = `${percent}%`;
    if (refs.builderHealthBarFill) refs.builderHealthBarFill.style.width = `${percent}%`;
    [
      refs.builderCheckTitle,
      refs.builderCheckQuestions,
      refs.builderCheckPages,
      refs.builderCheckLogic,
      refs.builderCheckRequired,
      refs.builderCheckOptions
    ].forEach((node, index) => {
      const check = report.checks[index];
      if (!node || !check) return;
      node.textContent = check.label;
      node.classList.toggle("is-done", check.passed);
      node.classList.toggle("is-warning", !check.passed && check.severity === "warning");
      node.classList.toggle("is-danger", !check.passed && check.severity === "error");
    });

    renderHealthRecommendations({
      ...report,
      checks,
      pages,
      questions,
      logicRoutes,
      requiredCount,
      choiceQuestionsWithBadOptions
    });
  }

  function buildCurrentSurveyQualityReport(metrics = null) {
    const pages = metrics?.pages ?? (Array.isArray(state.survey.pages) ? state.survey.pages.length : 0);
    const questions =
      metrics?.questions ??
      (state.survey.pages || []).reduce((sum, page) => sum + (Array.isArray(page.questions) ? page.questions.length : 0), 0);
    const logicRoutes =
      metrics?.logicRoutes ??
      (state.survey.pages || []).reduce(
        (sum, page, pageIndex) =>
          sum +
          (Array.isArray(page.questions)
            ? page.questions.reduce(
                (qSum, question) =>
                  qSum +
                  (Array.isArray(question.options)
                    ? question.options.filter((opt) => question.logicEnabled && hasActiveLogicRoute(opt, pageIndex)).length
                    : 0),
                0
              )
            : 0),
        0
      );
    const allQuestions = (state.survey.pages || []).flatMap((page) => (Array.isArray(page.questions) ? page.questions : []));
    const requiredCount = allQuestions.filter((question) => question?.required !== false).length;
    const titleLength = String(state.survey.title || "").trim().length;
    const choiceQuestionsWithBadOptions = allQuestions.filter((question) => {
      if (!CHOICE_TYPES.has(normalizeType(question?.type))) return false;
      return normalizeOptions(question?.options).length < 2;
    }).length;

    const report = buildSurveyQualityReport({
      pages,
      questions,
      logicRoutes,
      allQuestions,
      requiredCount,
      titleLength,
      choiceQuestionsWithBadOptions
    });
    return {
      ...report,
      pages,
      questions,
      logicRoutes,
      requiredCount,
      choiceQuestionsWithBadOptions
    };
  }

  function buildSurveyQualityReport(input) {
    const allQuestions = Array.isArray(input.allQuestions) ? input.allQuestions : [];
    const pages = Number(input.pages || 0);
    const questions = Number(input.questions || allQuestions.length || 0);
    const logicRoutes = Number(input.logicRoutes || 0);
    const requiredCount = Number(input.requiredCount || 0);
    const titleLength = Number(input.titleLength || 0);
    const choiceQuestionsWithBadOptions = Number(input.choiceQuestionsWithBadOptions || 0);
    const textQuestions = allQuestions.filter((question) => normalizeType(question?.type) === "text");
    const choiceQuestions = allQuestions.filter((question) => CHOICE_TYPES.has(normalizeType(question?.type)));
    const requiredRatio = questions ? requiredCount / questions : 0;
    const estimatedSeconds = allQuestions.reduce((sum, question) => {
      const type = normalizeType(question?.type);
      if (type === "text") return sum + 24;
      if (type === "rating") return sum + 12;
      if (type === "select") return sum + 14;
      return sum + (normalizeOptions(question?.options).length >= 5 ? 18 : 14);
    }, 0);
    const estimatedMinutes = questions ? Math.max(1, Math.round(estimatedSeconds / 60)) : 0;
    const duplicateTitles = new Set();
    const seenTitles = new Set();
    const leadingPattern = /(не правда ли|согласн[ыа]? ли вы,? что|разве|очевидно|лучший|идеальн|ужасн|кошмарн)/i;
    const doublePattern = /(цена и качеств|быстр.* и удоб|прост.* и понят|качество и скорост|доставка и упаков|сервис и поддержк)/i;
    const issues = [];

    allQuestions.forEach((question, index) => {
      const title = String(question?.title || question?.text || "").trim();
      const titleKey = title.toLowerCase();
      if (titleKey) {
        if (seenTitles.has(titleKey)) duplicateTitles.add(titleKey);
        seenTitles.add(titleKey);
      }
      if (title.length > 140) {
        issues.push({
          severity: "warning",
          text: `Вопрос ${index + 1} слишком длинный. Разбейте формулировку или сократите её.`,
          action: `focus-question:${question.id}`,
          label: "Открыть"
        });
      }
      if (leadingPattern.test(title)) {
        issues.push({
          severity: "error",
          text: `Вопрос ${index + 1} похож на наводящий. Сделайте формулировку нейтральной.`,
          action: `focus-question:${question.id}`,
          label: "Исправить"
        });
      }
      if (doublePattern.test(title)) {
        issues.push({
          severity: "warning",
          text: `Вопрос ${index + 1} смешивает две темы. Лучше разделить его на два вопроса.`,
          action: `focus-question:${question.id}`,
          label: "Открыть"
        });
      }

      if (CHOICE_TYPES.has(normalizeType(question?.type))) {
        const options = normalizeOptions(question?.options);
        const optionTexts = options.map((option) => String(option.text || "").trim().toLowerCase()).filter(Boolean);
        const uniqueOptions = new Set(optionTexts);
        if (optionTexts.length !== uniqueOptions.size) {
          issues.push({
            severity: "warning",
            text: `В вопросе ${index + 1} есть повторяющиеся варианты ответа.`,
            action: `focus-question:${question.id}`,
            label: "Открыть"
          });
        }
        const hasOther = optionTexts.some((text) => ["другое", "другой вариант", "иное", "other"].includes(text));
        if (options.length >= 4 && !hasOther) {
          issues.push({
            severity: "info",
            text: `В вопрос ${index + 1} стоит добавить вариант «Другое».`,
            action: `focus-question:${question.id}`,
            label: "Открыть"
          });
        }
      }
    });

    if (duplicateTitles.size) {
      issues.push({
        severity: "warning",
        text: "Есть повторяющиеся формулировки вопросов. Это ухудшает аналитику.",
        action: "focus-duplicates",
        label: "Найти"
      });
    }
    if (questions >= 4 && requiredRatio > 0.8) {
      issues.push({
        severity: "warning",
        text: "Слишком много обязательных вопросов. Это снижает процент завершения.",
        action: "make-last-optional",
        label: "Ослабить"
      });
    }

    const checks = [
      {
        id: "purpose",
        passed: titleLength >= 8 && String(state.survey.description || "").trim().length >= 20,
        severity: "warning",
        label: `Цель понятна: название 8+ и описание 20+ (${titleLength})`
      },
      {
        id: "structure",
        passed: pages >= 1 && questions >= 4,
        severity: "error",
        label: `Структура: ${pages} стр., ${questions} вопросов`
      },
      {
        id: "effort",
        passed: estimatedMinutes <= 5 && questions <= 16,
        severity: "warning",
        label: `Нагрузка: ~${estimatedMinutes} мин, до 16 вопросов`
      },
      {
        id: "bias",
        passed: !issues.some((issue) => issue.severity === "error"),
        severity: "error",
        label: "Нейтральные формулировки без явного смещения"
      },
      {
        id: "insight",
        passed: textQuestions.length >= 1,
        severity: "warning",
        label: `Есть открытый вопрос для причины/контекста (${textQuestions.length})`
      },
      {
        id: "answers",
        passed: choiceQuestionsWithBadOptions === 0 && choiceQuestions.length > 0,
        severity: "error",
        label:
          choiceQuestionsWithBadOptions === 0
            ? `Варианты ответа готовы (${choiceQuestions.length})`
            : `Исправьте варианты в вопросах (${choiceQuestionsWithBadOptions})`
      }
    ];

    if (!checks[1].passed && questions < 4) {
      issues.unshift({
        severity: "error",
        text: "Для полезной аналитики добавьте минимум 4 вопроса.",
        action: "add-question",
        label: "Добавить"
      });
    }
    if (!checks[4].passed && questions >= 2) {
      issues.push({
        severity: "warning",
        text: "Добавьте открытый вопрос «Почему вы так считаете?», чтобы понять причины ответов.",
        action: "add-open-text",
        label: "Добавить"
      });
    }
    if (logicRoutes === 0 && questions >= 5) {
      issues.push({
        severity: "info",
        text: "Для длинной анкеты можно добавить логический переход и убрать лишние вопросы для части респондентов.",
        action: "focus-logic",
        label: "Логика"
      });
    }

    const penalty = issues.reduce((sum, issue) => {
      if (issue.severity === "error") return sum + 18;
      if (issue.severity === "warning") return sum + 10;
      return sum + 5;
    }, 0);
    const missingChecksPenalty = checks.filter((check) => !check.passed).length * 6;
    const score = Math.max(0, Math.min(100, 100 - penalty - missingChecksPenalty));

    return {
      score,
      checks,
      issues,
      estimatedMinutes,
      requiredRatio
    };
  }

  function renderHealthRecommendations(report) {
    if (!refs.builderHealthRecommendations) return;
    const suggestions = Array.isArray(report.issues) ? [...report.issues] : [];
    if (!report.checks.purpose) {
      suggestions.push({
        text: "Сделайте название анкеты более конкретным.",
        action: "auto-title",
        label: "Исправить название"
      });
    }
    if (!report.checks.structure) {
      suggestions.push({
        text: "Добавьте больше вопросов для качественного анализа.",
        action: "add-question",
        label: "Добавить вопрос"
      });
    }
    if (report.pages < 1) {
      suggestions.push({
        text: "Добавьте страницу, чтобы структурировать анкету.",
        action: "add-page",
        label: "Добавить страницу"
      });
    }
    if (report.questions >= 5 && report.logicRoutes === 0) {
      suggestions.push({
        text: "Добавьте хотя бы один логический переход.",
        action: "focus-logic",
        label: "Настроить логику"
      });
    }
    if (report.requiredCount < 1) {
      suggestions.push({
        text: "Сделайте минимум один ключевой вопрос обязательным.",
        action: "mark-required",
        label: "Сделать обязательным"
      });
    }
    if (!report.checks.answers) {
      suggestions.push({
        text: "В части вопросов с выбором меньше двух вариантов.",
        action: "fix-options",
        label: "Исправить варианты"
      });
    }

    if (!suggestions.length) {
      refs.builderHealthRecommendations.innerHTML =
        "<li class='is-good'>Анкета выглядит готовой к публикации.</li>";
      return;
    }

    refs.builderHealthRecommendations.innerHTML = suggestions
      .slice(0, 5)
      .map(
        (item) =>
          `<li class="is-${escapeAttr(item.severity || "warning")}"><span>${escapeHtml(item.text)}</span><button class="btn btn--ghost btn--xs" type="button" data-health-action="${escapeAttr(
            item.action
          )}">${escapeHtml(item.label)}</button></li>`
      )
      .join("");
  }

  function runHealthAction(action) {
    if (action.startsWith("focus-question:")) {
      const questionId = action.slice("focus-question:".length);
      if (!questionId) return;
      const targetPage = (state.survey.pages || []).find((page) =>
        (page.questions || []).some((question) => String(question.id) === String(questionId))
      );
      if (targetPage) state.selectedPageId = String(targetPage.id);
      setSingleQuestionSelection(questionId);
      setSettingsPane("question");
      renderAll();
      setStatus("Открыл проблемный вопрос");
      return;
    }
    if (action === "focus-duplicates") {
      const seen = new Set();
      const duplicate = (state.survey.pages || [])
        .flatMap((page) => page.questions || [])
        .find((question) => {
          const key = String(question?.title || "").trim().toLowerCase();
          if (!key) return false;
          if (seen.has(key)) return true;
          seen.add(key);
          return false;
        });
      if (duplicate) runHealthAction(`focus-question:${duplicate.id}`);
      return;
    }
    if (action === "add-open-text") {
      addQuestion("text", {
        title: "Почему вы так считаете?",
        description: "Коротко опишите причину вашего ответа.",
        required: false
      });
      return;
    }
    if (action === "make-last-optional") {
      const questions = (state.survey.pages || []).flatMap((page) => page.questions || []);
      const target = [...questions].reverse().find((question) => question.required !== false);
      if (!target) return;
      target.required = false;
      setSingleQuestionSelection(target.id);
      renderAll();
      markDirty("Вопрос сделан необязательным");
      return;
    }
    if (action === "add-question") {
      addQuestion("text");
      return;
    }
    if (action === "add-page") {
      const page = createPage();
      state.survey.pages.push(page);
      state.selectedPageId = page.id;
      state.selectedQuestionId = null;
      state.selectedQuestionIds = [];
      renderAll();
      markDirty("Страница добавлена");
      return;
    }
    if (action === "auto-title") {
      const firstPage = state.survey.pages?.[0];
      const firstQuestion = firstPage?.questions?.[0];
      const fallbackTitle = firstQuestion?.title ? `Анкета: ${String(firstQuestion.title).slice(0, 36)}` : "Анкета обратной связи";
      state.survey.title = fallbackTitle;
      if (refs.surveyTitle) refs.surveyTitle.value = state.survey.title;
      if (refs.worktopSurveyTitle) refs.worktopSurveyTitle.textContent = state.survey.title;
      renderAll();
      markDirty("Название обновлено");
      return;
    }
    if (action === "mark-required") {
      const question = getSelectedQuestion();
      if (question) {
        question.required = true;
        renderEditor();
        renderQuestions();
        markDirty("Вопрос отмечен как обязательный");
        return;
      }
      const page = getSelectedPage();
      const first = page?.questions?.[0];
      if (first) {
        first.required = true;
        setSingleQuestionSelection(first.id);
        renderAll();
        markDirty("Вопрос отмечен как обязательный");
      }
      return;
    }
    if (action === "focus-logic") {
      const page = getSelectedPage();
      const choiceQuestion = (page?.questions || []).find((question) => CHOICE_TYPES.has(normalizeType(question.type)));
      if (!choiceQuestion) {
        setStatus("Сначала добавьте вопрос с выбором, чтобы настроить логику", true);
        return;
      }
      setSingleQuestionSelection(choiceQuestion.id);
      choiceQuestion.logicEnabled = true;
      renderAll();
      setStatus("Логика включена для выбранного вопроса");
      markDirty();
      return;
    }
    if (action === "fix-options") {
      const page = getSelectedPage();
      const invalid = (page?.questions || []).find(
        (question) => CHOICE_TYPES.has(normalizeType(question.type)) && normalizeOptions(question.options).length < 2
      );
      if (!invalid) return;
      invalid.options = [createOption("Вариант 1"), createOption("Вариант 2")];
      setSingleQuestionSelection(invalid.id);
      renderAll();
      markDirty("Варианты восстановлены");
    }
  }

  async function saveSurveySettingsStep() {
    await ensureSurvey();
    await saveRemote();
    const passwordEnabled = Boolean(refs.accessPasswordEnabledInput?.checked);
    const password = String(refs.accessPasswordInput?.value || "").trim();
    const responseLimitRaw = String(refs.responseLimitInput?.value || "").trim();
    const responseLimit = responseLimitRaw ? Number(responseLimitRaw) : null;
    if (responseLimitRaw && (!Number.isFinite(responseLimit) || responseLimit < 0)) {
      throw new Error("Лимит ответов должен быть положительным числом");
    }
    await apiRequest(`/api/surveys/${surveyId}/access`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passwordEnabled,
        password,
        responseLimit
      })
    });
    state.survey.accessPasswordEnabled = passwordEnabled;
    state.survey.responseLimit = responseLimit;
    if (refs.accessPasswordInput) refs.accessPasswordInput.value = "";
    updateSharePanel();
    toast("Настройки сохранены");
  }

  function updateSharePanel() {
    if (!surveyId) return;
    const link = `${window.location.origin}/s/${encodeURIComponent(surveyId)}`;
    const qr = `/api/qr.png?data=${encodeURIComponent(link)}`;
    if (refs.shareLinkInput) refs.shareLinkInput.value = link;
    if (refs.openPublishedSurveyLink) refs.openPublishedSurveyLink.href = link;
    if (refs.shareQrImage) refs.shareQrImage.src = qr;
    if (refs.downloadQrLink) refs.downloadQrLink.href = `${qr}&download=1`;
  }

  async function publishSurvey(skipQualityReview = true) {
    const validationError = validateBeforePublish();
    if (validationError) {
      setStatus(validationError, true);
      return;
    }

    await saveRemote();
    await apiRequest(`/api/surveys/${surveyId}/publish`, { method: "POST" });
    state.survey.published = true;
    setStatus("Анкета опубликована");
    toast("Анкета опубликована");
    updateSharePanel();
    activateBuilderSection("publish");
  }

  function renderPages() {
    refs.pagesList.innerHTML = "";
    const pageTotal = Array.isArray(state.survey.pages) ? state.survey.pages.length : 0;
    const questionTotal = (state.survey.pages || []).reduce((sum, page) => sum + (page.questions?.length || 0), 0);
    if (refs.pagesPanelMeta) {
      refs.pagesPanelMeta.textContent = `${pageTotal + 1} ${declOfNum(pageTotal + 1, ["стр.", "стр.", "стр."])} · ${questionTotal} ${declOfNum(questionTotal, ["вопрос", "вопроса", "вопросов"])}`;
    }
    const welcome = getWelcomeSettings();
    const welcomeButton = document.createElement("button");
    welcomeButton.type = "button";
    welcomeButton.className = `constructor-page-item constructor-page-item--welcome${state.builderSection === "survey" ? " is-active" : ""}`;
    welcomeButton.innerHTML = `
      <span class="constructor-page-item__thumb constructor-page-item__thumb--welcome" style="background-image:url('${sanitizeCssUrl(welcome.coverImage)}')"></span>
      <span class="constructor-page-item__title">0. Заглавная</span>
      <span class="constructor-page-item__meta">PowerPoint intro · не удаляется</span>
    `;
    welcomeButton.addEventListener("click", () => {
      activateBuilderSection("survey");
      renderPages();
      refs.surveyTitle?.focus();
    });
    refs.pagesList.appendChild(welcomeButton);

    state.survey.pages.forEach((page, index) => {
      const design = normalizePageDesign(page.design);
      const questionCount = Array.isArray(page.questions) ? page.questions.length : 0;
      const button = document.createElement("button");
      button.type = "button";
      button.draggable = true;
      button.className = `constructor-page-item${String(page.id) === String(state.selectedPageId) ? " is-active" : ""}`;
      button.dataset.pageId = page.id;
      button.innerHTML = `
        <span class="constructor-page-item__thumb" style="${buildPageBackgroundStyle(design)}"></span>
        <span class="constructor-page-item__title">${escapeHtml(`${index + 1}. ${page.title || `Страница ${index + 1}`}`)}</span>
        <span class="constructor-page-item__meta">${questionCount} ${declOfNum(questionCount, ["вопрос", "вопроса", "вопросов"])}</span>
      `;
      button.addEventListener("click", () => {
        state.selectedPageId = String(page.id);
        state.selectedQuestionId = page.questions[0]?.id || null;
        state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];
        state.activeThemeId = design.themeId || state.activeThemeId;
        state.previewThemeId = state.activeThemeId;
        renderAll();
        focusPanelOnMobile("questions");
      });

      button.addEventListener("dragstart", (event) => {
        pageDragState.pageId = page.id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", page.id);
        button.classList.add("is-drag-origin");
      });

      button.addEventListener("dragend", () => {
        pageDragState.pageId = null;
        refs.pagesList.querySelectorAll(".constructor-page-item").forEach((node) => {
          node.classList.remove("drop-target", "is-drag-origin");
        });
      });

      button.addEventListener("dragover", (event) => {
        if (pageDragState.pageId) {
          if (pageDragState.pageId === page.id) return;
          event.preventDefault();
          button.classList.add("drop-target");
          return;
        }
        if (!dragState.questionId || !dragState.fromPageId) return;
        if (dragState.fromPageId === page.id) return;
        event.preventDefault();
        button.classList.add("drop-target");
      });

      button.addEventListener("dragleave", () => {
        button.classList.remove("drop-target");
      });

      button.addEventListener("drop", (event) => {
        event.preventDefault();
        button.classList.remove("drop-target");

        if (pageDragState.pageId) {
          const fromId = pageDragState.pageId;
          pageDragState.pageId = null;
          if (fromId === page.id) return;
          const fromIndex = state.survey.pages.findIndex((item) => item.id === fromId);
          const toIndex = state.survey.pages.findIndex((item) => item.id === page.id);
          if (fromIndex < 0 || toIndex < 0) return;
          const [movedPage] = state.survey.pages.splice(fromIndex, 1);
          state.survey.pages.splice(toIndex, 0, movedPage);
          renderPages();
          markDirty("Порядок страниц обновлён");
          toast("Страница перемещена");
          return;
        }

        const fromQuestionId = dragState.questionId;
        const fromPageId = dragState.fromPageId;
        const fromQuestionIds = Array.isArray(dragState.questionIds) ? dragState.questionIds : [];
        const toPageId = page.id;
        if (!fromQuestionId || !fromPageId || fromPageId === toPageId) return;

        const sourcePage = state.survey.pages.find((item) => item.id === fromPageId);
        const targetPage = state.survey.pages.find((item) => item.id === toPageId);
        if (!sourcePage || !targetPage) return;

        const idsToMove = fromQuestionIds.length ? fromQuestionIds : [fromQuestionId];
        const selectedSet = new Set(idsToMove);
        const moved = sourcePage.questions.filter((question) => selectedSet.has(question.id));
        if (!moved.length) return;
        sourcePage.questions = sourcePage.questions.filter((question) => !selectedSet.has(question.id));
        targetPage.questions.push(...moved);

        dragState.questionId = null;
        dragState.fromPageId = null;
        dragState.questionIds = [];
        state.selectedPageId = targetPage.id;
        state.selectedQuestionId = moved.find((question) => question.id === fromQuestionId)?.id || moved[0].id;
        state.selectedQuestionIds = moved.map((question) => question.id);
        renderAll();
        const moveMessage =
          moved.length > 1
            ? `Вопросов перенесено: ${moved.length} (${sourcePage.title} -> ${targetPage.title})`
            : `Вопрос перенесён: ${sourcePage.title} -> ${targetPage.title}`;
        markDirty(moveMessage);
        toast(
          moved.length > 1
            ? `Перенесено вопросов: ${moved.length} → ${targetPage.title}`
            : `Вопрос перенесен → ${targetPage.title}`
        );
      });

      refs.pagesList.appendChild(button);
    });

    const hasPage = Boolean(getSelectedPage());
    if (refs.renamePageBtn) refs.renamePageBtn.disabled = !hasPage;
    if (refs.duplicatePageBtn) refs.duplicatePageBtn.disabled = !hasPage;
    if (refs.removePageBtn) refs.removePageBtn.disabled = state.survey.pages.length <= 1;
  }

  function renameSelectedPage() {
    const page = getSelectedPage();
    if (!page) return;
    const currentIndex = state.survey.pages.findIndex((item) => item.id === page.id);
    const nextTitle = window.prompt("Название страницы", page.title || `Страница ${currentIndex + 1}`);
    if (nextTitle == null) return;
    const cleaned = String(nextTitle).trim();
    if (!cleaned) {
      setStatus("Название страницы не может быть пустым", true);
      return;
    }
    page.title = cleaned;
    renderPages();
    markDirty("Страница переименована");
  }

  function duplicateSelectedPage() {
    const page = getSelectedPage();
    if (!page) return;
    const index = state.survey.pages.findIndex((item) => item.id === page.id);
    if (index < 0) return;

    const clone = deepClone(page);
    clone.id = createId();
    clone.title = `${page.title || `Страница ${index + 1}`} (копия)`;
    clone.questions = (clone.questions || []).map((question) => ({
      ...question,
      id: createId(),
      options: normalizeOptions(question.options).map((option) => ({ ...option, id: createId() }))
    }));

    state.survey.pages.splice(index + 1, 0, clone);
    state.selectedPageId = clone.id;
    state.selectedQuestionId = clone.questions[0]?.id || null;
    state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];

    renderAll();
    markDirty("Страница продублирована");
  }

  function removeSelectedPage() {
    if (state.survey.pages.length <= 1) {
      setStatus("В анкете должна остаться хотя бы одна страница", true);
      return;
    }
    const page = getSelectedPage();
    if (!page) return;
    const remainingQuestions = state.survey.pages
      .filter((item) => item.id !== page.id)
      .reduce((sum, item) => sum + (Array.isArray(item.questions) ? item.questions.length : 0), 0);
    if (remainingQuestions < 1) {
      setStatus("Сначала добавьте вопрос на другую страницу", true);
      return;
    }
    const index = state.survey.pages.findIndex((item) => item.id === page.id);
    if (index < 0) return;
    state.survey.pages.splice(index, 1);
    const fallback = state.survey.pages[Math.max(0, index - 1)] || state.survey.pages[0];
    state.selectedPageId = fallback?.id || null;
    state.selectedQuestionId = fallback?.questions?.[0]?.id || null;
    state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];
    renderAll();
    markDirty("Страница удалена");
  }

  function getVisibleQuestions(page) {
    const list = Array.isArray(page?.questions) ? page.questions : [];
    const filter = String(state.questionFilter || "").trim().toLowerCase();
    if (!filter) {
      return list.map((question, index) => ({ question, index }));
    }
    return list
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => {
        const text = `${question.title || ""} ${question.description || ""} ${getMetaText(question)}`.toLowerCase();
        return text.includes(filter);
      });
  }

  function getSelectedQuestionIdsForPage(page = getSelectedPage()) {
    const questionIds = new Set(Array.isArray(page?.questions) ? page.questions.map((question) => question.id) : []);
    const selected = Array.isArray(state.selectedQuestionIds) ? state.selectedQuestionIds : [];
    const unique = [];
    selected.forEach((id) => {
      if (!questionIds.has(id) || unique.includes(id)) return;
      unique.push(id);
    });
    if (state.selectedQuestionId && questionIds.has(state.selectedQuestionId) && !unique.includes(state.selectedQuestionId)) {
      unique.unshift(state.selectedQuestionId);
    }
    return unique;
  }

  function isQuestionSelected(questionId, page = getSelectedPage()) {
    return getSelectedQuestionIdsForPage(page).includes(questionId);
  }

  function setSingleQuestionSelection(questionId) {
    state.selectedQuestionId = questionId || null;
    state.selectedQuestionIds = questionId ? [questionId] : [];
    updateQuestionActionButtons();
  }

  function toggleQuestionSelection(questionId, page = getSelectedPage()) {
    if (!questionId || !page) return;
    const selected = getSelectedQuestionIdsForPage(page);
    const exists = selected.includes(questionId);
    if (exists && selected.length > 1) {
      state.selectedQuestionIds = selected.filter((id) => id !== questionId);
      if (state.selectedQuestionId === questionId) {
        state.selectedQuestionId = state.selectedQuestionIds[0] || null;
      }
    } else if (!exists) {
      state.selectedQuestionIds = [...selected, questionId];
      state.selectedQuestionId = questionId;
    } else {
      state.selectedQuestionIds = [questionId];
      state.selectedQuestionId = questionId;
    }
    updateQuestionActionButtons(page);
  }

  function selectQuestionRange(fromId, toId, page = getSelectedPage()) {
    if (!page || !fromId || !toId) return;
    const fromIndex = page.questions.findIndex((question) => question.id === fromId);
    const toIndex = page.questions.findIndex((question) => question.id === toId);
    if (fromIndex < 0 || toIndex < 0) {
      setSingleQuestionSelection(toId);
      return;
    }
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    state.selectedQuestionIds = page.questions.slice(start, end + 1).map((question) => question.id);
    state.selectedQuestionId = toId;
    updateQuestionActionButtons(page);
  }

  function clearQuestionSelection() {
    if (!state.selectedQuestionId) {
      state.selectedQuestionIds = [];
      updateQuestionActionButtons();
      return;
    }
    state.selectedQuestionIds = [state.selectedQuestionId];
    renderQuestions();
    updateQuestionActionButtons();
    setStatus("Выделение очищено");
  }

  function selectAllVisibleQuestions() {
    const page = getSelectedPage();
    const visible = getVisibleQuestions(page);
    if (!visible.length) return;
    const ids = visible.map(({ question }) => question.id);
    state.selectedQuestionIds = ids;
    state.selectedQuestionId = ids.includes(state.selectedQuestionId) ? state.selectedQuestionId : ids[0];
    renderQuestions();
    updateQuestionActionButtons(page);
    setStatus(`Выделено вопросов: ${ids.length}`);
  }

  function updateQuestionActionButtons(page = getSelectedPage()) {
    const selectedCount = getSelectedQuestionIdsForPage(page).length;
    if (refs.duplicateSelectedQuestionBtn) {
      refs.duplicateSelectedQuestionBtn.disabled = selectedCount < 1;
      refs.duplicateSelectedQuestionBtn.textContent = selectedCount > 1 ? `Дубль (${selectedCount})` : "Дубль";
    }
    if (refs.deleteSelectedQuestionBtn) {
      refs.deleteSelectedQuestionBtn.disabled = selectedCount < 1;
      refs.deleteSelectedQuestionBtn.textContent = selectedCount > 1 ? `Удалить (${selectedCount})` : "Удалить";
    }
    if (refs.clearQuestionSelectionBtn) refs.clearQuestionSelectionBtn.disabled = state.simpleMode || selectedCount <= 1;
    if (refs.selectAllVisibleQuestionsBtn) refs.selectAllVisibleQuestionsBtn.disabled = state.simpleMode || getVisibleQuestions(page).length < 2;
    if (refs.moveSelectedToPageBtn) {
      refs.moveSelectedToPageBtn.disabled = selectedCount < 1 || (Array.isArray(state.survey.pages) ? state.survey.pages.length : 0) < 2;
    }
    if (refs.questionBulkDock) refs.questionBulkDock.hidden = state.simpleMode || selectedCount < 2;
    if (refs.bulkDockCount) refs.bulkDockCount.textContent = `${selectedCount} выбрано`;
    if (refs.bulkDockMoveBtn) {
      refs.bulkDockMoveBtn.disabled = selectedCount < 1 || (Array.isArray(state.survey.pages) ? state.survey.pages.length : 0) < 2;
    }
    if (refs.bulkDockDuplicateBtn) refs.bulkDockDuplicateBtn.disabled = selectedCount < 1;
    if (refs.bulkDockDeleteBtn) refs.bulkDockDeleteBtn.disabled = selectedCount < 1;
    if (refs.bulkDockClearBtn) refs.bulkDockClearBtn.disabled = selectedCount < 1;
  }

  function duplicateSelectedQuestions() {
    const page = getSelectedPage();
    if (!page) return;
    const selectedIds = getSelectedQuestionIdsForPage(page);
    if (!selectedIds.length && state.selectedQuestionId) {
      duplicateQuestion(state.selectedQuestionId);
      return;
    }
    if (selectedIds.length <= 1) {
      if (selectedIds[0]) duplicateQuestion(selectedIds[0]);
      return;
    }

    const idToIndex = new Map(page.questions.map((question, index) => [question.id, index]));
    const ordered = selectedIds
      .map((id) => ({ id, index: idToIndex.get(id) }))
      .filter((item) => Number.isInteger(item.index))
      .sort((a, b) => b.index - a.index);

    const clones = [];
    ordered.forEach(({ id, index }) => {
      const source = page.questions[index];
      if (!source || source.id !== id) return;
      const clone = deepClone(source);
      clone.id = createId();
      clone.options = (clone.options || []).map((option) => ({ ...option, id: createId() }));
      page.questions.splice(index + 1, 0, clone);
      clones.push({ index, id: clone.id });
    });

    if (!clones.length) return;
    clones.sort((a, b) => a.index - b.index);
    state.selectedQuestionIds = clones.map((item) => item.id);
    state.selectedQuestionId = state.selectedQuestionIds[0];
    renderAll();
    markDirty(`Продублировано вопросов: ${clones.length}`);
  }

  function removeSelectedQuestions() {
    const page = getSelectedPage();
    if (!page) return;
    const selectedIds = getSelectedQuestionIdsForPage(page);
    if (!selectedIds.length && state.selectedQuestionId) {
      removeQuestion(state.selectedQuestionId);
      return;
    }
    if (selectedIds.length <= 1) {
      if (selectedIds[0]) removeQuestion(selectedIds[0]);
      return;
    }

    const totalQuestions = state.survey.pages.reduce(
      (sum, currentPage) => sum + (Array.isArray(currentPage.questions) ? currentPage.questions.length : 0),
      0
    );
    if (totalQuestions - selectedIds.length < 1) {
      setStatus("В анкете должен остаться хотя бы один вопрос", true);
      return;
    }

    const selectedSet = new Set(selectedIds);
    const selectedIndexes = page.questions
      .map((question, index) => (selectedSet.has(question.id) ? index : -1))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);
    if (!selectedIndexes.length) return;

    page.questions = page.questions.filter((question) => !selectedSet.has(question.id));
    const fallbackIndex = Math.min(selectedIndexes[0], Math.max(0, page.questions.length - 1));
    const next = page.questions[fallbackIndex] || page.questions[fallbackIndex - 1] || null;
    setSingleQuestionSelection(next ? next.id : null);
    renderAll();
    markDirty(`Удалено вопросов: ${selectedIds.length}`);
  }

  function moveSelectedQuestionsToPagePrompt() {
    const sourcePage = getSelectedPage();
    if (!sourcePage) return;
    const selectedIds = getSelectedQuestionIdsForPage(sourcePage);
    if (!selectedIds.length) {
      setStatus("Выберите хотя бы один вопрос", true);
      return;
    }

    const pages = Array.isArray(state.survey.pages) ? state.survey.pages : [];
    const targetOptions = pages
      .map((page, index) => ({ page, index: index + 1 }))
      .filter(({ page }) => page.id !== sourcePage.id);

    if (!targetOptions.length) {
      setStatus("Для переноса нужна минимум одна дополнительная страница", true);
      return;
    }

    const hint = targetOptions.map(({ page, index }) => `${index}: ${page.title || `Страница ${index}`}`).join("\n");
    const answer = window.prompt(`Перенести выбранные вопросы на страницу:\n${hint}`);
    if (answer == null) return;
    const targetIndex = Number(String(answer).trim());
    if (!Number.isInteger(targetIndex)) {
      setStatus("Укажите номер страницы из списка", true);
      return;
    }
    const target = targetOptions.find((item) => item.index === targetIndex);
    if (!target) {
      setStatus("Страница не найдена", true);
      return;
    }

    moveSelectedQuestionsToPage(target.page.id);
  }

  function moveSelectedQuestionsToPage(targetPageId) {
    const sourcePage = getSelectedPage();
    if (!sourcePage) return;
    const targetPage = state.survey.pages.find((page) => page.id === targetPageId);
    if (!targetPage) {
      setStatus("Целевая страница не найдена", true);
      return;
    }
    if (targetPage.id === sourcePage.id) {
      setStatus("Выберите другую страницу", true);
      return;
    }

    const selectedIds = getSelectedQuestionIdsForPage(sourcePage);
    if (!selectedIds.length) {
      setStatus("Выберите хотя бы один вопрос", true);
      return;
    }

    const selectedSet = new Set(selectedIds);
    const moved = sourcePage.questions.filter((question) => selectedSet.has(question.id));
    if (!moved.length) return;

    sourcePage.questions = sourcePage.questions.filter((question) => !selectedSet.has(question.id));
    targetPage.questions.push(...moved);

    state.selectedPageId = targetPage.id;
    state.selectedQuestionId = moved[0].id;
    state.selectedQuestionIds = moved.map((question) => question.id);
    renderAll();

    const targetTitle = targetPage.title || "Страница";
    markDirty(`Вопросов перенесено: ${moved.length} -> ${targetTitle}`);
    toast(moved.length > 1 ? `Перенесено вопросов: ${moved.length} → ${targetTitle}` : `Вопрос перенесен → ${targetTitle}`);
  }

  function highlightQuestionText(text, query) {
    const source = String(text || "");
    if (!query) return escapeHtml(source);
    const lower = source.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if (idx < 0) return escapeHtml(source);
    const before = source.slice(0, idx);
    const match = source.slice(idx, idx + query.length);
    const after = source.slice(idx + query.length);
    return `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
  }

  function updateMatchMeta(page) {
    const visible = getVisibleQuestions(page);
    const total = visible.length;
    if (total > 0) {
      state.matchCursor = Math.max(0, Math.min(total - 1, state.matchCursor));
    } else {
      state.matchCursor = 0;
    }

    if (refs.questionMatchCount) {
      refs.questionMatchCount.textContent = `${total ? state.matchCursor + 1 : 0}/${total}`;
    }
    if (refs.prevQuestionMatchBtn) refs.prevQuestionMatchBtn.disabled = total <= 1;
    if (refs.nextQuestionMatchBtn) refs.nextQuestionMatchBtn.disabled = total <= 1;
  }

  function moveQuestionMatch(direction) {
    const page = getSelectedPage();
    const visible = getVisibleQuestions(page);
    if (!visible.length) return;

    state.matchCursor = (state.matchCursor + direction + visible.length) % visible.length;
    const target = visible[state.matchCursor]?.question;
    if (!target) return;
    setSingleQuestionSelection(target.id);
    renderEditor();
    highlightActiveQuestion();
    refs.questionList.querySelector(`[data-question-id="${cssEscape(target.id)}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    updateMatchMeta(page);
  }

  function renderQuestions() {
    refs.questionList.innerHTML = "";
    const page = getSelectedPage();
    const design = normalizePageDesign(page?.design);
    refs.questionList.style.cssText = buildCanvasStyle(design);
    const visibleQuestions = getVisibleQuestions(page);
    updateMatchMeta(page);

    if (!page || !page.questions.length) {
      refs.questionList.innerHTML = `
        <div class="constructor-empty card">
          <h3>Добавьте первый вопрос</h3>
          <p>Начните с кнопки «Добавить вопрос», затем настройте параметры справа.</p>
          <button type="button" class="btn btn--primary" id="emptyAddQuestionBtn">+ Добавить вопрос</button>
        </div>
      `;
      document.getElementById("emptyAddQuestionBtn")?.addEventListener("click", () => openQuestionTypeModal(null));
      updateQuestionActionButtons(page);
      return;
    }

    if (!visibleQuestions.length) {
      refs.questionList.innerHTML = `
        <div class="constructor-empty card">
          <h3>Ничего не найдено</h3>
          <p>Измените поисковый запрос или очистите фильтр вопросов.</p>
          <button type="button" class="btn btn--outline" id="clearQuestionFilterBtn">Очистить фильтр</button>
        </div>
      `;
      document.getElementById("clearQuestionFilterBtn")?.addEventListener("click", () => {
        state.questionFilter = "";
        if (refs.questionSearchInput) refs.questionSearchInput.value = "";
        renderQuestions();
        refs.questionSearchInput?.focus();
      });
      updateQuestionActionButtons(page);
      return;
    }

    visibleQuestions.forEach(({ question, index }) => {
      const card = document.createElement("article");
      const isSelected = isQuestionSelected(question.id, page);
      card.className = `question-card${question.id === state.selectedQuestionId ? " is-active" : ""}${isSelected ? " is-selected" : ""}`;
      card.dataset.questionId = question.id;
      card.dataset.questionIndex = String(index);
      card.style.setProperty("--question-panel-alpha", (normalizeQuestionPanelOpacity(question.panelOpacity) / 100).toFixed(2));
      if (state.simpleMode) {
        card.innerHTML = `
          <div class="question-card__head question-card__head--simple">
            <div class="question-card__left">
              <div class="question-card__title-wrap">
                <h4 class="q-title">${highlightQuestionText(`${index + 1}. ${question.title || "Новый вопрос"}`, state.questionFilter)}</h4>
                <div class="q-meta">${escapeHtml(getMetaText(question))}</div>
              </div>
            </div>
            <div class="question-card__actions">
              <button type="button" class="btn btn--ghost btn--xs" data-action="select" aria-pressed="${isSelected ? "true" : "false"}">Выбрать</button>
              <button type="button" class="btn btn--ghost btn--xs" data-action="focus">Редактировать</button>
              <button type="button" class="btn btn--ghost btn--xs question-card__action-extra" data-action="duplicate">Копия</button>
              <button type="button" class="btn btn--ghost btn--xs question-card__action-extra" data-action="delete">Удалить</button>
            </div>
          </div>
          <div class="question-card__preview">${renderQuestionCardPreview(question)}</div>
        `;
      } else {
        card.innerHTML = `
          <div class="question-card__head">
            <div class="question-card__left">
              <button type="button" class="question-card__drag" data-action="drag" draggable="true" title="Перетащить вопрос">≡</button>
              <button type="button" class="question-card__select${isSelected ? " is-on" : ""}" data-action="select" aria-pressed="${isSelected ? "true" : "false"}" title="Выделить вопрос">✓</button>
              <div class="question-card__title-wrap">
                <h4 class="q-title">${highlightQuestionText(`${index + 1}. ${question.title || "Новый вопрос"}`, state.questionFilter)}</h4>
                <div class="q-meta">${escapeHtml(getMetaText(question))}</div>
              </div>
            </div>
            <div class="question-card__actions">
              <button type="button" class="question-card__icon" data-action="duplicate" title="Дублировать">⧉</button>
              <button type="button" class="question-card__icon danger" data-action="delete" title="Удалить">✕</button>
            </div>
          </div>
          <div class="question-card__preview">${renderQuestionCardPreview(question)}</div>
        `;
      }

      card.addEventListener("click", (event) => {
        const action = event.target.closest("[data-action]")?.dataset.action;

        if (action === "drag") return;
        if (!action && state.simpleMode) {
          setSingleQuestionSelection(question.id);
          state.builderSection = "questions";
          updateBuilderSectionNav();
          setInspectorOpen(true);
          setSettingsPane("question");
          renderQuestions();
          renderEditor();
          return;
        }
        if (action === "select") {
          toggleQuestionSelection(question.id, page);
          renderQuestions();
          renderEditor();
          return;
        }
        if (action === "focus") {
          setSingleQuestionSelection(question.id);
          state.builderSection = "questions";
          updateBuilderSectionNav();
          setInspectorOpen(true);
          setSettingsPane("question");
          renderQuestions();
          renderEditor();
          focusPanelOnMobile("settings");
          return;
        }
        if (action === "duplicate") {
          if (isQuestionSelected(question.id, page) && getSelectedQuestionIdsForPage(page).length > 1) {
            duplicateSelectedQuestions();
          } else {
            duplicateQuestion(question.id);
          }
          return;
        }
        if (action === "delete") {
          if (isQuestionSelected(question.id, page) && getSelectedQuestionIdsForPage(page).length > 1) {
            removeSelectedQuestions();
          } else {
            removeQuestion(question.id);
          }
          return;
        }

        if (state.simpleMode) {
          setSingleQuestionSelection(question.id);
        } else if (event.shiftKey && state.selectedQuestionId) {
          selectQuestionRange(state.selectedQuestionId, question.id, page);
        } else if (event.ctrlKey || event.metaKey) {
          toggleQuestionSelection(question.id, page);
        } else {
          setSingleQuestionSelection(question.id);
        }
        setSettingsPane("question");
        renderQuestions();
        renderEditor();
        focusPanelOnMobile("settings");
      });

      const dragHandle = card.querySelector("[data-action='drag']");
      dragHandle?.addEventListener("dragstart", (event) => {
        if (state.questionFilter) {
          event.preventDefault();
          return;
        }
        const selectedIds = getSelectedQuestionIdsForPage(page);
        const dragIds = selectedIds.includes(question.id) && selectedIds.length > 1 ? selectedIds : [question.id];
        dragState.questionId = question.id;
        dragState.fromPageId = page.id;
        dragState.questionIds = dragIds;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", question.id);
        refs.questionList.querySelectorAll(".question-card").forEach((node) => {
          node.classList.toggle("is-dragging", dragIds.includes(node.dataset.questionId));
          const isOrigin = node.dataset.questionId === question.id;
          node.classList.toggle("is-drag-origin", isOrigin);
          if (isOrigin && dragIds.length > 1) {
            node.dataset.dragLabel = `Moving ${dragIds.length} questions`;
          } else {
            delete node.dataset.dragLabel;
          }
        });
      });

      dragHandle?.addEventListener("dragend", () => {
        dragState.questionId = null;
        dragState.fromPageId = null;
        dragState.questionIds = [];
        refs.questionList.querySelectorAll(".question-card").forEach((node) => {
          node.classList.remove("is-dragging", "is-drag-origin", "drop-before", "drop-after");
          delete node.dataset.dragLabel;
        });
        refs.pagesList.querySelectorAll(".constructor-page-item").forEach((node) => {
          node.classList.remove("drop-target");
        });
      });

      card.addEventListener("dragover", (event) => {
        if (Array.isArray(dragState.questionIds) && dragState.questionIds.length > 1) return;
        if (!dragState.questionId || dragState.questionId === question.id) return;
        event.preventDefault();
        const rect = card.getBoundingClientRect();
        const before = event.clientY < rect.top + rect.height / 2;
        card.classList.toggle("drop-before", before);
        card.classList.toggle("drop-after", !before);
      });

      card.addEventListener("dragleave", () => {
        card.classList.remove("drop-before", "drop-after");
      });

      card.addEventListener("drop", (event) => {
        if (Array.isArray(dragState.questionIds) && dragState.questionIds.length > 1) return;
        event.preventDefault();
        const fromId = dragState.questionId;
        const toId = question.id;
        card.classList.remove("drop-before", "drop-after");
        if (!fromId || fromId === toId) return;

        const currentPage = getSelectedPage();
        if (!currentPage) return;

        const fromIndex = currentPage.questions.findIndex((q) => q.id === fromId);
        const targetIndex = currentPage.questions.findIndex((q) => q.id === toId);
        if (fromIndex < 0 || targetIndex < 0) return;

        const rect = card.getBoundingClientRect();
        const before = event.clientY < rect.top + rect.height / 2;
        const [moved] = currentPage.questions.splice(fromIndex, 1);
        const insertIndex = fromIndex < targetIndex ? (before ? targetIndex - 1 : targetIndex) : (before ? targetIndex : targetIndex + 1);
        currentPage.questions.splice(insertIndex, 0, moved);

        setSingleQuestionSelection(moved.id);
        renderQuestions();
        renderSurveyPreview();
        markDirty("Порядок вопросов обновлён");
      });

      refs.questionList.appendChild(card);

      if (state.simpleMode) {
        const insertButton = document.createElement("button");
        insertButton.type = "button";
        insertButton.className = "constructor-insert-question";
        insertButton.dataset.insertQuestionAt = String(index + 1);
        insertButton.setAttribute("aria-label", "Добавить вопрос после текущего");
        insertButton.innerHTML = "<span>+</span>";
        insertButton.addEventListener("click", (event) => {
          event.stopPropagation();
          openQuestionTypeModal(index + 1);
        });
        refs.questionList.appendChild(insertButton);
      }
    });

    updateQuestionActionButtons(page);
  }

  function refreshQuestionCard(question = getSelectedQuestion()) {
    if (!question || !refs.questionList) return;
    const card = refs.questionList.querySelector(`[data-question-id="${cssEscape(question.id)}"]`);
    if (!card) return;
    const page = getSelectedPage();
    const questionIndex = page?.questions?.findIndex((item) => item.id === question.id) ?? -1;
    const title = card.querySelector(".q-title");
    const meta = card.querySelector(".q-meta");
    const preview = card.querySelector(".question-card__preview");
    if (title) {
      const prefix = questionIndex >= 0 ? `${questionIndex + 1}. ` : "";
      title.innerHTML = highlightQuestionText(`${prefix}${question.title || "Новый вопрос"}`, state.questionFilter);
    }
    if (meta) meta.textContent = getMetaText(question);
    if (preview) preview.innerHTML = renderQuestionCardPreview(question, state.survey.pages.findIndex((item) => item.id === page?.id));
    card.style.setProperty("--question-panel-alpha", (normalizeQuestionPanelOpacity(question.panelOpacity) / 100).toFixed(2));
  }

  function renderEditor() {
    const question = getSelectedQuestion();
    refs.questionEditor.hidden = !question;
    refs.emptyEditor.hidden = Boolean(question);
    if (refs.removeQuestionBtn) refs.removeQuestionBtn.disabled = !question;

    if (!question) return;

    const questionModal = document.querySelector(".question-settings-modal");
    if (questionModal) {
      questionModal.dataset.questionType = normalizeType(question.type);
      const heading = questionModal.querySelector(".constructor-editor-top h3");
      if (heading) heading.textContent = `Настройки: ${TYPE_LABELS[normalizeType(question.type)] || "Вопрос"}`;
    }

    refs.questionTitleInput.value = question.title || "";
    refs.questionDescriptionInput.value = question.description || "";
    question.panelOpacity = normalizeQuestionPanelOpacity(question.panelOpacity);
    if (refs.questionPanelOpacityInput) refs.questionPanelOpacityInput.value = String(question.panelOpacity);
    if (refs.questionPanelOpacityValue) refs.questionPanelOpacityValue.textContent = `${question.panelOpacity}%`;
    refs.questionRequiredInput.checked = Boolean(question.required);
    if (refs.questionRequiredQuickBtn) {
      refs.questionRequiredQuickBtn.textContent = question.required ? "Убрать обязательность" : "Сделать обязательным";
    }
    refs.questionTypeInput.value = isImageChoiceQuestion(question) ? "image" : normalizeType(question.type);
    const typeHint = document.getElementById("questionTypeHint");
    if (typeHint) typeHint.textContent = getQuestionTypeHint(isImageChoiceQuestion(question) ? "image" : question.type);

    refs.optionsEditor.hidden = !CHOICE_TYPES.has(question.type);
    refs.ratingEditor.hidden = question.type !== "rating";
    const logicAvailable = question.type === "single" || question.type === "select" || question.type === "multiple";
    if (refs.questionLogicEnabledInput) {
      refs.questionLogicEnabledInput.checked = Boolean(question.logicEnabled) && logicAvailable;
      refs.questionLogicEnabledInput.disabled = !logicAvailable;
    }
    if (refs.questionLogicHint) {
      refs.questionLogicHint.hidden = !logicAvailable || !Boolean(question.logicEnabled);
    }

    if (CHOICE_TYPES.has(question.type)) {
      renderOptions(question);
    } else {
      refs.optionsList.innerHTML = "";
    }
    const optionsGroup = refs.questionEditor?.querySelector("[data-editor-section='options']");
    const logicGroup = refs.questionEditor?.querySelector("[data-editor-section='logic']");
    if (optionsGroup) optionsGroup.dataset.sectionAvailable = CHOICE_TYPES.has(question.type) ? "1" : "0";
    if (logicGroup) logicGroup.dataset.sectionAvailable = logicAvailable ? "1" : "0";
    const optionsTab = refs.questionEditor?.querySelector("[data-editor-section-tab='options']");
    const logicTab = refs.questionEditor?.querySelector("[data-editor-section-tab='logic']");
    if (optionsTab) optionsTab.disabled = !CHOICE_TYPES.has(question.type);
    if (logicTab) logicTab.disabled = !logicAvailable;
    if ((!CHOICE_TYPES.has(question.type) && state.editorSection === "options") || (!logicAvailable && state.editorSection === "logic")) {
      setEditorSection("content");
    } else {
      setEditorSection(state.editorSection || "content");
    }

    if (question.type === "rating") {
      question.ratingLabels = ensureRatingLabels(question);
      refs.ratingLabelMin.value = question.ratingLabels.low || "";
      refs.ratingLabelMax.value = question.ratingLabels.high || "";
    }
  }

  function renderOptions(question) {
    refs.optionsList.innerHTML = "";
    question.options = normalizeOptions(question.options);
    const imageMode = isImageChoiceQuestion(question);
    if (imageMode) applyQuestionImageSettings(question);
    const currentPage = getSelectedPage();
    const showLogic = Boolean(question.logicEnabled) && (question.type === "single" || question.type === "select" || question.type === "multiple");
    const jumpChoices = state.survey.pages
      .filter((page) => !currentPage || page.id !== currentPage.id)
      .map((page) => {
        const pageIndex = state.survey.pages.findIndex((item) => item.id === page.id);
        return `<option value="${escapeAttr(String(pageIndex))}">${escapeHtml(page.title || `Страница ${pageIndex + 1}`)}</option>`;
      })
      .join("");

    if (imageMode) {
      const controls = document.createElement("section");
      controls.className = "constructor-image-controls";
      controls.innerHTML = `
        <div class="constructor-image-controls__head">
          <div>
            <strong>Image Fit & Scale</strong>
            <span>Ограничивает фото внутри карточек вариантов.</span>
          </div>
        </div>
        <label class="form-row">
          <span>Заполнение изображения</span>
          <select data-role="questionImageFit">
            <option value="cover">Cover - заполнить карточку</option>
            <option value="contain">Contain - показать полностью</option>
          </select>
        </label>
        <label class="form-row">
          <span>Масштаб фото: <strong data-role="questionImageScaleValue">${getQuestionImageScale(question)}%</strong></span>
          <input data-role="questionImageScale" type="range" min="60" max="130" step="5" value="${getQuestionImageScale(question)}" />
        </label>
      `;
      const fitSelect = controls.querySelector("[data-role='questionImageFit']");
      const scaleInput = controls.querySelector("[data-role='questionImageScale']");
      const scaleValue = controls.querySelector("[data-role='questionImageScaleValue']");
      if (fitSelect) fitSelect.value = getQuestionImageFit(question);
      fitSelect?.addEventListener("change", (event) => {
        applyQuestionImageSettings(question, { imageFit: event.target.value });
        refs.optionsList.querySelectorAll("[data-role='previewImg']").forEach((img) => {
          img.style.objectFit = getQuestionImageFit(question);
        });
        refreshQuestionCard(question);
        markDirty("Настройки изображений обновлены");
      });
      scaleInput?.addEventListener("input", (event) => {
        applyQuestionImageSettings(question, { imageScale: Number(event.target.value || 100) });
        if (scaleValue) scaleValue.textContent = `${getQuestionImageScale(question)}%`;
        refs.optionsList.querySelectorAll("[data-role='preview']").forEach((preview) => {
          preview.style.setProperty("--option-image-scale", String(getQuestionImageScale(question) / 100));
        });
        refreshQuestionCard(question);
        markDirty("Масштаб изображений обновлён");
      });
      refs.optionsList.appendChild(controls);
    }

    question.options.forEach((option, index) => {
      const row = document.createElement("div");
      row.className = "constructor-option-row";
      row.innerHTML = `
        <label class="form-row">
          <span>Вариант ${index + 1}</span>
          <input data-role="text" type="text" value="${escapeAttr(option.text || "")}" />
        </label>
        ${
          imageMode
            ? `
        <label class="form-row">
          <span>Изображение варианта</span>
          <input data-role="imageUrl" type="url" value="${escapeAttr(option.imageUrl || "")}" placeholder="https://..." />
        </label>
        <div class="constructor-option-actions">
          <button type="button" class="btn btn--ghost btn--xs" data-role="uploadImage">Загрузить фото</button>
          <input data-role="uploadImageInput" type="file" accept="image/*" hidden />
        </div>
        `
            : ""
        }
        ${
          showLogic
            ? `
        <label class="form-row">
          <span>Переход после ответа</span>
          <select data-role="jumpToPageIndex">
            <option value="">Следующая страница по порядку</option>
            ${jumpChoices}
          </select>
        </label>
        `
            : ""
        }
        <div class="constructor-option-preview${imageMode ? " constructor-option-preview--image-choice" : ""}" data-role="preview" hidden>
          <img alt="Изображение варианта" data-role="previewImg" />
          <span data-role="previewError" hidden>Не удалось загрузить изображение</span>
        </div>
        <div class="constructor-option-actions">
          <button type="button" class="btn btn--ghost btn--xs" data-role="up">↑</button>
          <button type="button" class="btn btn--ghost btn--xs" data-role="down">↓</button>
          <button type="button" class="btn btn--ghost btn--xs" data-role="duplicate">Дублировать</button>
          <button type="button" class="btn btn--ghost btn--xs" data-role="remove">Удалить</button>
        </div>
      `;

      const textInput = row.querySelector("[data-role='text']");
      const imageInput = row.querySelector("[data-role='imageUrl']");
      const uploadImageBtn = row.querySelector("[data-role='uploadImage']");
      const uploadImageInput = row.querySelector("[data-role='uploadImageInput']");
      const jumpSelect = row.querySelector("[data-role='jumpToPageIndex']");
      const preview = row.querySelector("[data-role='preview']");
      const previewImg = row.querySelector("[data-role='previewImg']");
      const previewError = row.querySelector("[data-role='previewError']");
      if (preview) preview.style.setProperty("--option-image-scale", String(getQuestionImageScale(question) / 100));
      if (previewImg) previewImg.style.objectFit = getQuestionImageFit(question);

      textInput?.addEventListener("input", (event) => {
        option.text = event.target.value;
        refreshQuestionCard(question);
        markDirty();
      });

      textInput?.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        question.options.splice(index + 1, 0, createOption(""));
        renderOptions(question);
        const next = refs.optionsList.querySelectorAll("[data-role='text']")[index + 1];
        if (next) next.focus();
        markDirty();
      });

      imageInput?.addEventListener("input", (event) => {
        if (!imageMode) return;
        option.imageUrl = event.target.value.trim();
        applyQuestionImageSettings(question);
        updateOptionPreview(preview, previewImg, previewError, option.imageUrl);
        refreshQuestionCard(question);
        markDirty();
      });
      uploadImageBtn?.addEventListener("click", () => {
        if (!imageMode) return;
        uploadImageInput?.click();
      });
      uploadImageInput?.addEventListener("change", async (event) => {
        if (!imageMode) return;
        const file = event.target?.files?.[0];
        if (!file) return;
        uploadImageBtn.disabled = true;
        setStatus("Загрузка изображения варианта...");
        try {
          const uploadedPath = await uploadImageFile(file);
          option.imageUrl = uploadedPath;
          applyQuestionImageSettings(question);
          if (imageInput) imageInput.value = uploadedPath;
          updateOptionPreview(preview, previewImg, previewError, option.imageUrl);
          refreshQuestionCard(question);
          renderSurveyPreview();
          markDirty("Картинка варианта загружена");
          toast("Картинка загружена");
        } catch (error) {
          setStatus(error.message || "Не удалось загрузить изображение", true);
        } finally {
          uploadImageBtn.disabled = false;
          event.target.value = "";
        }
      });

      if (jumpSelect) {
        const resolvedJump = resolveOptionJumpIndex(option);
        jumpSelect.value = Number.isInteger(resolvedJump) ? String(resolvedJump) : "";
        jumpSelect.addEventListener("change", (event) => {
          const value = String(event.target.value || "").trim();
          const nextIndex = value === "" ? null : Number(value);
          option.jumpToPageIndex = Number.isInteger(nextIndex) ? nextIndex : null;
          option.jumpToPageId = Number.isInteger(nextIndex) && state.survey.pages[nextIndex] ? String(state.survey.pages[nextIndex].id) : "";
          markDirty();
        });
      }

      row.querySelector("[data-role='up']")?.addEventListener("click", () => {
        if (index <= 0) return;
        [question.options[index - 1], question.options[index]] = [question.options[index], question.options[index - 1]];
        renderOptions(question);
        markDirty();
      });

      row.querySelector("[data-role='down']")?.addEventListener("click", () => {
        if (index >= question.options.length - 1) return;
        [question.options[index + 1], question.options[index]] = [question.options[index], question.options[index + 1]];
        renderOptions(question);
        markDirty();
      });

      row.querySelector("[data-role='remove']")?.addEventListener("click", () => {
        question.options.splice(index, 1);
        renderOptions(question);
        markDirty();
      });

      row.querySelector("[data-role='duplicate']")?.addEventListener("click", () => {
        const clone = {
          ...option,
          id: createId()
        };
        question.options.splice(index + 1, 0, clone);
        renderOptions(question);
        markDirty();
      });

      updateOptionPreview(preview, previewImg, previewError, imageMode ? option.imageUrl : "");
      refs.optionsList.appendChild(row);
    });
  }

  function renderSurveyPreview() {
    return;
  }

  function renderLogicMap() {
    if (!refs.logicMapList) return;
    const routes = collectLogicRoutes();
    if (refs.logicMapCount) refs.logicMapCount.textContent = String(routes.length);
    refs.logicMapList.innerHTML = "";

    if (!routes.length) {
      refs.logicMapList.innerHTML = `
        <div class="constructor-logic-map__empty">
          <p>Переходов пока нет. Включите логику у вопроса с вариантами и выберите страницу для ответа.</p>
        </div>
      `;
      return;
    }

    routes.forEach((route) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "constructor-logic-route";
      item.dataset.questionId = route.questionId;
      item.innerHTML = `
        <span>${escapeHtml(route.fromPageTitle)}</span>
        <strong>${escapeHtml(route.questionTitle)}</strong>
        <em>${escapeHtml(route.optionText)} -> ${escapeHtml(route.toPageTitle)}</em>
      `;
      item.addEventListener("click", () => {
        state.selectedPageId = route.fromPageId;
        state.selectedQuestionId = route.questionId;
        state.selectedQuestionIds = [route.questionId];
        state.editorSection = "logic";
        setSettingsPane("question");
        renderAll();
        refs.questionEditor?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      refs.logicMapList.appendChild(item);
    });
  }

  function collectLogicRoutes() {
    const pages = Array.isArray(state.survey.pages) ? state.survey.pages : [];
    const routes = [];
    pages.forEach((page, pageIndex) => {
      const questions = Array.isArray(page.questions) ? page.questions : [];
      questions.forEach((question) => {
        if (!question.logicEnabled || !CHOICE_TYPES.has(normalizeType(question.type))) return;
        normalizeOptions(question.options).forEach((option) => {
          const targetIndex = resolveOptionJumpIndex(option);
          if (!hasActiveLogicRoute(option, pageIndex) || !pages[targetIndex]) return;
          routes.push({
            fromPageId: page.id,
            fromPageTitle: page.title || `Страница ${pageIndex + 1}`,
            questionId: question.id,
            questionTitle: question.title || "Новый вопрос",
            optionText: option.text || "Вариант ответа",
            toPageTitle: pages[targetIndex].title || `Страница ${targetIndex + 1}`
          });
        });
      });
    });
    return routes;
  }

  function renderQuestionCardPreview(question, pageIndex = null) {
    const type = normalizeType(question.type);
    const hint = String(question.description || "").trim()
      ? `<p class="preview-question-hint">${escapeHtml(question.description)}</p>`
      : "";

    if (type === "text") {
      return `${hint}<div class="preview-control preview-control--text">Ответ участника...</div>`;
    }

    if (type === "rating") {
      const labels = ensureRatingLabels(question);
      return `
        ${hint}
        <div class="preview-control preview-control--rating">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
        ${(labels.low || labels.high) ? `<div class="preview-rating-labels"><span>${escapeHtml(labels.low || "")}</span><span>${escapeHtml(labels.high || "")}</span></div>` : ""}
      `;
    }

    if (type === "select") {
      const options = normalizeOptions(question.options);
      const rendered = options.map((opt) => `<option>${escapeHtml(opt.text)}</option>`).join("");
      return `${hint}<select class="preview-control preview-control--select" disabled><option>Выберите вариант</option>${rendered}</select>`;
    }

    if (isImageChoiceQuestion(question)) {
      const imageFit = getQuestionImageFit(question);
      const imageScale = getQuestionImageScale(question);
      const options = normalizeOptions(question.options).slice(0, 4);
      if (!options.length) {
        return `${hint}<div class="preview-control preview-control--text">Добавьте изображения вариантов</div>`;
      }
      return `
        ${hint}
        <div class="preview-image-choice-grid" style="--preview-image-scale:${imageScale / 100}">
          ${options
            .map(
              (opt) => `
                <div class="preview-image-choice">
                  ${
                    opt.imageUrl
                      ? `<img src="${escapeAttr(opt.imageUrl)}" alt="${escapeAttr(opt.text || "Вариант")}" style="object-fit:${escapeAttr(imageFit)}" />`
                      : `<span class="preview-image-choice__empty">Фото</span>`
                  }
                  <strong>${escapeHtml(opt.text || "Вариант")}</strong>
                </div>
              `
            )
            .join("")}
        </div>
      `;
    }

    const options = normalizeOptions(question.options).slice(0, 3);
    const inputType = type === "single" ? "radio" : "checkbox";
    if (!options.length) {
      return `${hint}<div class="preview-control preview-control--text">Добавьте варианты ответа</div>`;
    }
    return `
      ${hint}
      <div class="preview-choice-list">
        ${options
          .map(
            (opt) => `
            <label class="preview-choice-item">
              <input type="${inputType}" disabled />
              <span>${escapeHtml(opt.text)}</span>
              ${
                question.logicEnabled && hasActiveLogicRoute(opt, pageIndex)
                  ? `<em class="preview-choice-logic">Переход</em>`
                  : ""
              }
            </label>
          `
          )
          .join("")}
      </div>
    `;
  }

  function updateOptionPreview(previewWrap, imgNode, errorNode, url) {
    if (!previewWrap || !imgNode || !errorNode) return;
    const safe = isValidHttpUrl(url);
    if (!safe) {
      previewWrap.hidden = true;
      imgNode.removeAttribute("src");
      errorNode.hidden = true;
      return;
    }

    previewWrap.hidden = false;
    errorNode.hidden = true;
    imgNode.src = url;

    imgNode.onload = () => {
      previewWrap.hidden = false;
      errorNode.hidden = true;
    };

    imgNode.onerror = () => {
      errorNode.hidden = false;
    };
  }

  function openQuestionTypeModal(insertIndex = null) {
    if (!refs.questionTypeOverlay || !refs.questionTypeOverlay.hidden) return;
    pendingQuestionInsertIndex = Number.isInteger(insertIndex) ? insertIndex : null;

    refs.questionTypeOverlay.hidden = false;
    document.body.classList.add("modal-open");

    refs.questionTypeOverlay.querySelectorAll("[data-question-type]").forEach((button) => {
      button.onclick = () => {
        try {
          addQuestionFromPicker(button);
        } catch (error) {
          console.error(error);
        } finally {
          closeQuestionTypeModal();
        }
      };
    });
  }

  function closeQuestionTypeModal() {
    if (!refs.questionTypeOverlay || refs.questionTypeOverlay.hidden) return;
    refs.questionTypeOverlay.hidden = true;
    pendingQuestionInsertIndex = null;
    cleanupModals();
  }

  async function startNewBlankSurvey() {
    closeCreationEntryModal(false);
    closeTemplateCatalogModal();
    closeTemplatePreviewModal();
    await ensureSurvey();
    await loadSurvey();
    markSyncedDraftBaseline();
    renderAll();
    updateDraftBanner();
    recordHistorySnapshot(true);
    setSaveState("saved", "Сохранено");
  }

  async function createSurveyFromTemplateRemote(templateKey) {
    const data = await apiRequest("/api/surveys/from-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: templateKey })
    });
    const createdId = String(data.surveyId || data.id || "");
    if (!createdId) throw new Error("Сервер не вернул ID анкеты");
    window.location.href = `/create?surveyId=${encodeURIComponent(createdId)}`;
  }

  function openCreationEntryModal() {
    if (!refs.creationEntryOverlay || !refs.creationEntryOverlay.hidden) return;
    refs.creationEntryOverlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeCreationEntryModal(allowRedirect = false) {
    if (!refs.creationEntryOverlay || refs.creationEntryOverlay.hidden) return;
    refs.creationEntryOverlay.hidden = true;
    cleanupModals();
    if (allowRedirect && !surveyId && !query.get("surveyId")) {
      window.location.href = "/cabinet";
    }
  }

  function openTemplateCatalogModal() {
    if (!refs.templateCatalogOverlay || !refs.templateCatalogOverlay.hidden) return;
    renderTemplateCatalog();
    refs.templateCatalogOverlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeTemplateCatalogModal() {
    if (!refs.templateCatalogOverlay || refs.templateCatalogOverlay.hidden) return;
    refs.templateCatalogOverlay.hidden = true;
    cleanupModals();
  }

  function openTemplatePreviewModal(templateKey) {
    const template = (window.ASKING_TEMPLATES || {})[templateKey];
    if (!template || !refs.templatePreviewOverlay) return;
    state.previewTemplateKey = templateKey;
    const pages = Array.isArray(template.pages) ? template.pages : [];
    const questionsCount = pages.reduce(
      (sum, page) => sum + (Array.isArray(page?.questions) ? page.questions.length : 0),
      0
    );
    refs.templatePreviewName.textContent = template.title || templateKey;
    refs.templatePreviewDescription.textContent = template.description || "Шаблон для быстрого запуска анкеты.";
    if (refs.templatePreviewMeta) {
      refs.templatePreviewMeta.innerHTML = `
        <span>${pages.length} ${declOfNum(pages.length, ["страница", "страницы", "страниц"])}</span>
        <span>${questionsCount} ${declOfNum(questionsCount, ["вопрос", "вопроса", "вопросов"])}</span>
        <span>${escapeHtml(resolveTemplateCategory(templateKey))}</span>
      `;
    }
    refs.templatePreviewQuestions.innerHTML = pages
      .map((page, pageIndex) => {
        const questions = Array.isArray(page?.questions) ? page.questions : [];
        const previewQuestions = questions
          .slice(0, 4)
          .map((q, index) => `<li class="constructor-preview-question">${pageIndex + 1}.${index + 1} ${escapeHtml(q.title || q.text || "Вопрос")}</li>`)
          .join("");
        const more = questions.length > 4
          ? `<li class="constructor-preview-question is-muted">+ ещё ${questions.length - 4} ${declOfNum(questions.length - 4, ["вопрос", "вопроса", "вопросов"])}</li>`
          : "";
        return `
          <li class="constructor-preview-page">
            <strong>${pageIndex + 1}. ${escapeHtml(page?.title || `Страница ${pageIndex + 1}`)}</strong>
            <ol class="constructor-preview-page__questions">${previewQuestions}${more}</ol>
          </li>
        `;
      })
      .join("");
    refs.templatePreviewOverlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeTemplatePreviewModal() {
    if (!refs.templatePreviewOverlay || refs.templatePreviewOverlay.hidden) return;
    refs.templatePreviewOverlay.hidden = true;
    state.previewTemplateKey = null;
    cleanupModals();
  }

  function openThemePickerModal() {
    if (!refs.themePickerOverlay || !refs.themePickerOverlay.hidden) return;
    state.previewThemeId = state.activeThemeId;
    renderThemePicker();
    refs.themePickerOverlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeThemePickerModal() {
    if (!refs.themePickerOverlay || refs.themePickerOverlay.hidden) return;
    refs.themePickerOverlay.hidden = true;
    cleanupModals();
  }

  function openDesignSettingsModal() {
    if (refs.designSettingsPanel?.dataset.sidebarMounted === "1") {
      refs.settingsPanel?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      refs.pageBgColorInput?.focus();
      return;
    }
    if (!refs.designSettingsOverlay || !refs.designSettingsOverlay.hidden) return;
    updateDesignEditor();
    refs.designSettingsOverlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeDesignSettingsModal() {
    if (!refs.designSettingsOverlay || refs.designSettingsOverlay.hidden) return;
    refs.designSettingsOverlay.hidden = true;
    cleanupModals();
  }

  function openQuickStartWizard() {
    if (!refs.quickStartWizardOverlay || !refs.quickStartWizardOverlay.hidden) return;
    state.wizard.step = 1;
    state.wizard.preset = state.wizard.preset || "registration";
    state.wizard.themeId = state.wizard.themeId || state.activeThemeId || "sea";
    state.wizard.title = String(state.survey.title || "Новая анкета").trim() || "Новая анкета";

    if (refs.wizardSurveyTitleInput) refs.wizardSurveyTitleInput.value = state.wizard.title;
    if (refs.wizardThemeSelect) {
      refs.wizardThemeSelect.innerHTML = BUILDER_THEMES
        .map((theme) => `<option value="${escapeAttr(theme.id)}">${escapeHtml(theme.name)}</option>`)
        .join("");
      refs.wizardThemeSelect.value = getThemeById(state.wizard.themeId).id;
    }
    refs.wizardPresetButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.wizardPreset === state.wizard.preset);
    });

    refs.quickStartWizardOverlay.hidden = false;
    document.body.classList.add("modal-open");
    setWizardStep(1);
    updateWizardSummary();
  }

  function closeQuickStartWizard() {
    if (!refs.quickStartWizardOverlay || refs.quickStartWizardOverlay.hidden) return;
    refs.quickStartWizardOverlay.hidden = true;
    cleanupModals();
  }

  function setWizardStep(step) {
    const normalized = Math.max(1, Math.min(3, Number(step) || 1));
    state.wizard.step = normalized;

    if (refs.wizardPaneScenario) refs.wizardPaneScenario.hidden = normalized !== 1;
    if (refs.wizardPaneTheme) refs.wizardPaneTheme.hidden = normalized !== 2;
    if (refs.wizardPaneLaunch) refs.wizardPaneLaunch.hidden = normalized !== 3;

    if (refs.wizardStep1) refs.wizardStep1.classList.toggle("is-active", normalized === 1);
    if (refs.wizardStep2) refs.wizardStep2.classList.toggle("is-active", normalized === 2);
    if (refs.wizardStep3) refs.wizardStep3.classList.toggle("is-active", normalized === 3);

    if (refs.wizardBackBtn) refs.wizardBackBtn.disabled = normalized <= 1;
    if (refs.wizardNextBtn) refs.wizardNextBtn.hidden = normalized >= 3;
    if (refs.wizardNextBtn) refs.wizardNextBtn.disabled = normalized === 2 && !isWizardStepValid(2, false);
    if (refs.wizardApplyBtn) refs.wizardApplyBtn.hidden = normalized < 3;
    if (refs.wizardApplyBtn) refs.wizardApplyBtn.disabled = !isWizardStepValid(3, false);
    updateWizardSummary();
  }

  function isWizardStepValid(step, notify = true) {
    if (step <= 1) {
      const ok = Boolean((window.ASKING_TEMPLATES || {})[QUICK_START_TEMPLATE_MAP[state.wizard.preset]]);
      if (!ok && notify) setStatus("Выбери сценарий для быстрого старта", true);
      return ok;
    }
    if (step === 2 || step === 3) {
      const title = String(state.wizard.title || "").trim();
      if (title.length < 3) {
        if (notify) setStatus("Название анкеты должно быть не короче 3 символов", true);
        return false;
      }
      return true;
    }
    return true;
  }

  function nextWizardStep() {
    if (!isWizardStepValid(state.wizard.step, true)) return;
    setWizardStep(state.wizard.step + 1);
  }

  function updateWizardSummary() {
    if (!refs.wizardSummaryText) return;
    const templateKey = QUICK_START_TEMPLATE_MAP[state.wizard.preset];
    const template = (window.ASKING_TEMPLATES || {})[templateKey];
    const theme = getThemeById(state.wizard.themeId);
    const pages = Array.isArray(template?.pages) ? template.pages.length : 0;
    const questions = Array.isArray(template?.pages)
      ? template.pages.reduce((sum, page) => sum + (Array.isArray(page?.questions) ? page.questions.length : 0), 0)
      : 0;
    refs.wizardSummaryText.textContent =
      `Анкета «${state.wizard.title || "Новая анкета"}»: ${template?.title || "Свой сценарий"}, ${pages} ${declOfNum(pages, ["страница", "страницы", "страниц"])}, ${questions} ${declOfNum(questions, ["вопрос", "вопроса", "вопросов"])}, тема ${theme.name}.`;
  }

  function getVersionStorageKey() {
    return `asking_builder_versions_${surveyId || state.survey.id || "new"}`;
  }

  function loadVersionHistory() {
    const raw = localStorage.getItem(getVersionStorageKey());
    const parsed = safeJsonParse(raw, []);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object" && item.snapshot && item.createdAt);
  }

  function saveVersionHistory(items) {
    localStorage.setItem(getVersionStorageKey(), JSON.stringify(items.slice(0, VERSION_LIMIT)));
  }

  function createVersionSnapshot(reason = "Автосохранение") {
    const snapshot = {
      survey: deepClone(state.survey),
      selectedPageId: state.selectedPageId,
      selectedQuestionId: state.selectedQuestionId,
      selectedQuestionIds: deepClone(state.selectedQuestionIds),
      activeThemeId: state.activeThemeId,
      previewThemeId: state.previewThemeId,
      settingsPane: state.settingsPane
    };
    const hash = JSON.stringify(snapshot.survey);
    if (hash === lastVersionHash) return;
    lastVersionHash = hash;

    const items = loadVersionHistory();
    items.unshift({
      id: createId(),
      createdAt: new Date().toISOString(),
      reason,
      title: String(state.survey.title || "Новая анкета"),
      pages: Array.isArray(state.survey.pages) ? state.survey.pages.length : 0,
      questions: (state.survey.pages || []).reduce((sum, page) => sum + (page.questions?.length || 0), 0),
      snapshot
    });
    saveVersionHistory(items);
  }

  function openVersionHistoryModal() {
    if (!refs.versionHistoryOverlay || !refs.versionHistoryOverlay.hidden) return;
    renderVersionHistoryList();
    refs.versionHistoryOverlay.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeVersionHistoryModal() {
    if (!refs.versionHistoryOverlay || refs.versionHistoryOverlay.hidden) return;
    refs.versionHistoryOverlay.hidden = true;
    cleanupModals();
  }

  function renderVersionHistoryList() {
    if (!refs.versionHistoryList) return;
    const items = loadVersionHistory();
    if (!items.length) {
      refs.versionHistoryList.innerHTML = "<p class='constructor-version-empty'>Пока нет сохраненных версий.</p>";
      return;
    }
    refs.versionHistoryList.innerHTML = items
      .map((item) => {
        const date = new Date(item.createdAt);
        const dateLabel = Number.isNaN(date.getTime()) ? item.createdAt : date.toLocaleString("ru-RU");
        return `
          <article class="constructor-version-item">
            <div class="constructor-version-item__meta">
              <strong>${escapeHtml(item.title || "Анкета")}</strong>
              <span>${escapeHtml(dateLabel)} • ${escapeHtml(item.reason || "Автосохранение")}</span>
              <span>${Number(item.pages || 0)} стр. • ${Number(item.questions || 0)} вопросов</span>
            </div>
            <div class="constructor-version-item__actions">
              <button class="btn btn--ghost btn--xs" type="button" data-version-restore="${escapeAttr(item.id)}">Восстановить</button>
              <button class="btn btn--outline btn--xs" type="button" data-version-delete="${escapeAttr(item.id)}">Удалить</button>
            </div>
          </article>
        `;
      })
      .join("");

    refs.versionHistoryList.querySelectorAll("[data-version-restore]").forEach((button) => {
      button.addEventListener("click", () => {
        restoreVersionSnapshot(String(button.dataset.versionRestore || ""));
      });
    });
    refs.versionHistoryList.querySelectorAll("[data-version-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        deleteVersionSnapshot(String(button.dataset.versionDelete || ""));
      });
    });
  }

  function restoreVersionSnapshot(versionId) {
    const items = loadVersionHistory();
    const selected = items.find((item) => item.id === versionId);
    if (!selected?.snapshot) return;
    applyHistorySnapshot(selected.snapshot, "Версия восстановлена");
    closeVersionHistoryModal();
    markDirty("Версия восстановлена");
  }

  function deleteVersionSnapshot(versionId) {
    const items = loadVersionHistory().filter((item) => item.id !== versionId);
    saveVersionHistory(items);
    renderVersionHistoryList();
  }

  function renderThemePicker() {
    if (!refs.themeGrid) return;
    refs.themeGrid.innerHTML = "";
    BUILDER_THEMES.forEach((theme) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `constructor-theme-item${theme.id === state.previewThemeId ? " is-active" : ""}`;
      btn.innerHTML = `
        <span class="constructor-theme-item__preview" style="background:${escapeAttr(theme.preview || theme.bgColor)}"></span>
        <span class="constructor-theme-item__label">${escapeHtml(theme.name)}</span>
        <span class="constructor-theme-item__desc">${escapeHtml(theme.bgImage ? "Фото-фон" : "Цветовая тема")}</span>
      `;
      btn.addEventListener("click", () => {
        state.previewThemeId = theme.id;
        renderThemePicker();
      });
      refs.themeGrid.appendChild(btn);
    });

    const preview = getThemeById(state.previewThemeId);
    refs.themePreviewCard.style.background = preview.bgImage
      ? `linear-gradient(rgba(15,23,42,${Math.max(0.08, Number(preview.overlay || 0) / 100)}), rgba(15,23,42,${Math.max(0.08, Number(preview.overlay || 0) / 100)})), url('${sanitizeCssUrl(preview.bgImage)}') center/cover no-repeat, ${preview.bgColor}`
      : preview.preview || preview.bgColor;
    refs.themePreviewCard.style.setProperty("--theme-accent", preview.accent);
    refs.themePreviewName.textContent = preview.name;
    refs.themePreviewDescription.textContent = preview.description;
  }

  function applyThemeToCurrentPage(themeId) {
    const theme = getThemeById(themeId);
    const page = ensureSelectedPage();
    page.design = normalizePageDesign({
      ...(page.design || {}),
      themeId: theme.id,
      bgColor: theme.bgColor,
      bgImage: theme.bgImage || "",
      layout: theme.layout || "full",
      overlay: Number.isFinite(Number(theme.overlay)) ? Number(theme.overlay) : 0
    });
    state.activeThemeId = theme.id;
    state.previewThemeId = theme.id;
    renderPages();
    renderQuestions();
    updateDesignEditor();
    markDirty("Тема применена");
  }

  function renderTemplateCatalog() {
    if (!refs.templateCategoryList) return;
    refs.templateCategoryList.innerHTML = "";
    TEMPLATE_CATEGORIES.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `constructor-category-item${category === state.selectedTemplateCategory ? " is-active" : ""}`;
      button.textContent = category;
      button.addEventListener("click", () => {
        state.selectedTemplateCategory = category;
        renderTemplateCatalog();
      });
      refs.templateCategoryList.appendChild(button);
    });
    renderTemplateCatalogGrid();
  }

  function renderTemplateCatalogGrid() {
    if (!refs.templateCatalogGrid) return;
    const seenTemplates = new Set();
    const templates = Object.entries(window.ASKING_TEMPLATES || {})
      .filter(([key]) => !["event", "vote", "feedback", "education", "hr", "marketing", "service", "events", "voting", "ecommerce", "healthcare", "onboarding", "conference", "nps"].includes(key))
      .filter(([, template]) => {
        const fingerprint = `${String(template?.title || "")}|${String(template?.description || "")}|${Array.isArray(template?.pages) ? template.pages.length : 0}`;
        if (!template || seenTemplates.has(fingerprint)) return false;
        seenTemplates.add(fingerprint);
        return true;
      })
      .sort((a, b) => String(a[1]?.title || a[0]).localeCompare(String(b[1]?.title || b[0]), "ru"));
    const selectedCategory = state.selectedTemplateCategory;
    const search = state.templateSearch;

    const filtered = templates.filter(([key, template]) => {
      const category = resolveTemplateCategory(key);
      const passCategory = selectedCategory === "Все категории" || category === selectedCategory;
      const textBlob = `${template.title || ""} ${template.description || ""}`.toLowerCase();
      const passSearch = !search || textBlob.includes(search);
      return passCategory && passSearch;
    });
    if (refs.templateCountBadge) {
      refs.templateCountBadge.textContent = `${filtered.length} из ${templates.length} шаблонов`;
    }

    refs.templateCatalogGrid.innerHTML = filtered
      .map(([key, template]) => {
        const category = resolveTemplateCategory(key);
        const tintClass = `constructor-template-card--${String(key).replace(/[^a-z0-9_-]/gi, "")}`;
        const coverImage = template.pages?.[0]?.design?.welcome?.coverImage || template.pages?.[0]?.design?.bgImage || "";
        const coverStyle = coverImage
          ? ` style="background-image:url('${sanitizeCssUrl(coverImage)}')"`
          : "";
        const pagesCount = Array.isArray(template.pages) ? template.pages.length : 0;
        const questionsCount = Array.isArray(template.pages)
          ? template.pages.reduce(
              (sum, page) => sum + (Array.isArray(page?.questions) ? page.questions.length : 0),
              0
            )
          : 0;
        return `
          <article class="constructor-template-card ${tintClass}">
            <div class="constructor-template-card__image"${coverStyle}></div>
            <div class="constructor-template-card__body">
              <span class="constructor-template-card__cat">${escapeHtml(category)}</span>
              <h4>${escapeHtml(template.title || key)}</h4>
              <p>${escapeHtml(template.description || "")}</p>
              <div class="constructor-template-card__meta">
                <span>${pagesCount} стр.</span>
                <span>${questionsCount} вопр.</span>
              </div>
              <div class="constructor-template-card__actions">
                <button type="button" class="btn btn--outline btn--xs" data-template-preview="${escapeHtml(key)}">Состав</button>
                <button type="button" class="btn btn--primary btn--xs" data-template-apply="${escapeHtml(key)}">Использовать</button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    refs.templateCatalogGrid.querySelectorAll("[data-template-preview]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-template-preview");
        if (!key) return;
        openTemplatePreviewModal(key);
      });
    });

    refs.templateCatalogGrid.querySelectorAll("[data-template-apply]").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-template-apply");
        if (!key) return;
        createSurveyFromTemplateRemote(key).catch((error) => {
          console.error(error);
          setStatus(error.message || "Не удалось применить шаблон", true);
        });
      });
    });
  }

  function closeAllModals() {
    closeQuestionTypeModal();
    closeCreationEntryModal(false);
    closeTemplateCatalogModal();
    closeTemplatePreviewModal();
    closeDesignSettingsModal();
    closeThemePickerModal();
    closeCommandPalette();
    closeQuickStartWizard();
    closeVersionHistoryModal();
    document.body.classList.remove("modal-open");
  }

  function cleanupModals() {
    const open =
      isModalVisible(refs.questionTypeOverlay) ||
      isModalVisible(refs.creationEntryOverlay) ||
      isModalVisible(refs.templateCatalogOverlay) ||
      isModalVisible(refs.templatePreviewOverlay) ||
      isModalVisible(refs.designSettingsOverlay) ||
      isModalVisible(refs.themePickerOverlay) ||
      isModalVisible(refs.commandPaletteOverlay) ||
      isModalVisible(refs.quickStartWizardOverlay) ||
      isModalVisible(refs.versionHistoryOverlay);
    if (!open) document.body.classList.remove("modal-open");
  }

  function bindModal(overlay, closeBtn, closeFn) {
    if (!overlay) return;

    overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      closeFn();
    });

    closeBtn?.addEventListener("click", closeFn);
  }

  function isModalVisible(node) {
    return Boolean(node && !node.hidden);
  }

  function hasAnyModalOpen() {
    return Boolean(
      isModalVisible(refs.questionTypeOverlay) ||
      isModalVisible(refs.creationEntryOverlay) ||
      isModalVisible(refs.templateCatalogOverlay) ||
      isModalVisible(refs.templatePreviewOverlay) ||
      isModalVisible(refs.designSettingsOverlay) ||
      isModalVisible(refs.themePickerOverlay) ||
      isModalVisible(refs.commandPaletteOverlay) ||
      isModalVisible(refs.quickStartWizardOverlay) ||
      isModalVisible(refs.versionHistoryOverlay) ||
      isModalVisible(document.getElementById("questionSettingsArchive"))
    );
  }

  function applyTemplate(templateId, notify = true) {
    const template = (window.ASKING_TEMPLATES || {})[templateId];
    if (!template) {
      setStatus("Шаблон не найден", true);
      return;
    }

    state.survey.title = template.title || "Новая анкета";
    state.survey.description = template.description || "";
    state.survey.pages = (template.pages || []).map((page, index) => ({
      id: createId(),
      title: String(page.title || `Страница ${index + 1}`),
      design: normalizePageDesign({ themeId: state.activeThemeId, ...(page.design || {}) }),
      questions: Array.isArray(page.questions)
        ? page.questions.map((q) => fromTemplateQuestion(q))
        : []
    }));

    if (!state.survey.pages.length) {
      state.survey.pages = [createPage("Страница 1")];
    }

    state.selectedPageId = state.survey.pages[0].id;
    state.selectedQuestionId = state.survey.pages[0].questions[0]?.id || null;
    state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];

    renderAll();
    saveDraft();
    markDirty(notify ? "Шаблон применён" : "");
    if (notify) toast("Шаблон применён");
  }

  function fromTemplateQuestion(source) {
    const type = normalizeType(source.type);
    const options = CHOICE_TYPES.has(type) ? normalizeOptions(source.options) : [];
    const sourceType = String(source.type || "").trim().toLowerCase();
    const imageChoice = source.imageChoice === true || sourceType.includes("image") || (type === "single" && options.some(optionHasImage));
    return {
      id: createId(),
      type,
      title: String(source.title || source.text || "Новый вопрос"),
      description: String(source.description || source.help || ""),
      panelOpacity: normalizeQuestionPanelOpacity(source.panelOpacity),
      required: Boolean(source.required),
      logicEnabled: Boolean(source.logicEnabled),
      imageChoice,
      imageFit: normalizeImageFit(source.imageFit || options.find((option) => option.imageFit)?.imageFit),
      imageScale: normalizeImageScale(source.imageScale ?? options.find((option) => option.imageScale)?.imageScale),
      options,
      ratingLabels: type === "rating" ? { low: "", high: "" } : null,
      rating: type === "rating" ? { minLabel: "", maxLabel: "" } : null
    };
  }

  function createQuestionFromPreset(preset) {
    const normalizedType = normalizeType(preset.type);
    const options = CHOICE_TYPES.has(normalizedType)
      ? normalizeOptions(preset.options || [createOption("Вариант 1"), createOption("Вариант 2")])
      : [];
    const presetType = String(preset.type || "").trim().toLowerCase();
    const imageChoice = preset.imageChoice === true || presetType.includes("image") || (normalizedType === "single" && options.some(optionHasImage));
    return {
      id: createId(),
      type: normalizedType,
      title: String(preset.title || "Новый вопрос"),
      description: String(preset.description || ""),
      panelOpacity: normalizeQuestionPanelOpacity(preset.panelOpacity),
      required: Boolean(preset.required),
      logicEnabled: false,
      imageChoice,
      imageFit: normalizeImageFit(preset.imageFit || options.find((option) => option.imageFit)?.imageFit),
      imageScale: normalizeImageScale(preset.imageScale ?? options.find((option) => option.imageScale)?.imageScale),
      options,
      ratingLabels: normalizedType === "rating" ? { low: "", high: "" } : null,
      rating: normalizedType === "rating" ? { minLabel: "", maxLabel: "" } : null
    };
  }

  function buildSurveyPagesFromTemplate(template, themeId) {
    const theme = getThemeById(themeId);
    const pages = Array.isArray(template?.pages) && template.pages.length ? template.pages : [{ title: "Страница 1", questions: [] }];
    return pages.map((page, pageIndex) => ({
      id: createId(),
      title: String(page?.title || `Страница ${pageIndex + 1}`),
      design: normalizePageDesign({
        themeId: theme.id,
        bgColor: theme.bgColor,
        ...(page?.design || {})
      }),
      questions: Array.isArray(page?.questions) ? page.questions.map((preset) => createQuestionFromPreset(preset)) : []
    }));
  }

  function addQuestionPresetPack(key) {
    const presetPack = QUESTION_PRESETS[key];
    if (!Array.isArray(presetPack) || !presetPack.length) return;
    const page = ensureSelectedPage();
    const createdIds = [];

    presetPack.forEach((preset) => {
      const question = createQuestionFromPreset(preset);
      page.questions.push(question);
      createdIds.push(question.id);
    });

    const lastId = createdIds[createdIds.length - 1] || null;
    if (lastId) setSingleQuestionSelection(lastId);
    setSettingsPane("question");
    renderAll();
    markDirty(`Добавлен набор: ${presetPack.length} вопросов`);
    focusPanelOnMobile("questions");
    toast(`Добавлено ${presetPack.length} вопросов`);

    requestAnimationFrame(() => {
      if (!lastId) return;
      refs.questionList.querySelector(`[data-question-id="${cssEscape(lastId)}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    });
  }

  function applyQuickStartWizard() {
    if (!isWizardStepValid(3, true)) return;
    const templateKey = QUICK_START_TEMPLATE_MAP[state.wizard.preset];
    const template = (window.ASKING_TEMPLATES || {})[templateKey];
    if (!template) {
      setStatus("Выберите сценарий для быстрого старта", true);
      return;
    }

    const theme = getThemeById(state.wizard.themeId);
    state.survey.title = state.wizard.title || "Новая анкета";
    state.survey.description = template.description || "";
    state.survey.pages = buildSurveyPagesFromTemplate(template, theme.id);
    state.selectedPageId = state.survey.pages[0]?.id || null;
    state.selectedQuestionId = state.survey.pages[0]?.questions[0]?.id || null;
    state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];
    state.activeThemeId = theme.id;
    state.previewThemeId = theme.id;
    state.settingsPane = "question";

    closeQuickStartWizard();
    renderAll();
    const questionsCount = state.survey.pages.reduce((sum, page) => sum + page.questions.length, 0);
    markDirty(`Быстрый старт: ${questionsCount} вопросов`);
    toast(`Создан сценарий: ${state.survey.pages.length} стр. и ${questionsCount} вопр.`);
    focusPanelOnMobile("questions");
  }

  function addQuestionFromPicker(button) {
    const label = String(button?.textContent || "").toLowerCase();
    if (!label) {
      addQuestion(button?.dataset?.questionType || "text");
      return;
    }

    if (label.includes("email")) {
      addQuestion("text", { title: "Введите email", description: "Например: name@company.com", required: true });
      return;
    }
    if (label.includes("числ")) {
      addQuestion("text", { title: "Введите числовое значение", description: "Только цифры", required: true });
      return;
    }
    if (label.includes("дата")) {
      addQuestion("text", { title: "Выберите дату", description: "Укажите дату или дату и время", required: true });
      return;
    }
    if (label.includes("матриц")) {
      addQuestion("multiple", {
        title: "Матрица оценки",
        description: "Отметьте все подходящие оценки",
        options: [createOption("Пункт 1"), createOption("Пункт 2"), createOption("Пункт 3")]
      });
      return;
    }
    if (label.includes("ранж")) {
      addQuestion("single", {
        title: "Выберите приоритет",
        description: "Определите самый важный вариант",
        options: [createOption("Приоритет A"), createOption("Приоритет B"), createOption("Приоритет C")]
      });
      return;
    }
    if (label.includes("изображ")) {
      addQuestion("image");
      return;
    }
    if (label.includes("выпада")) {
      addQuestion("select", {
        title: "Выберите вариант из списка",
        options: [createOption("Вариант 1"), createOption("Вариант 2"), createOption("Вариант 3")]
      });
      return;
    }
    if (label.includes("рейтинг") || label.includes("зв")) {
      addQuestion("rating", { title: "Оцените по шкале", description: "1 — минимум, 5 — максимум", required: true });
      return;
    }

    addQuestion(button?.dataset?.questionType || "text");
  }

  function addQuestion(type, preset = null) {
    const page = ensureSelectedPage();
    const imageMode = String(type || "").trim().toLowerCase() === "image";
    const resolvedPreset = imageMode && !preset ? getImagePollPreset() : preset;
    const normalizedType = normalizeType(imageMode ? "single" : type);

    const question = {
      id: createId(),
      type: normalizedType,
      title: String(resolvedPreset?.title || "Новый вопрос"),
      description: String(resolvedPreset?.description || ""),
      panelOpacity: normalizeQuestionPanelOpacity(resolvedPreset?.panelOpacity ?? (88 - page.questions.length * 8)),
      required: Boolean(resolvedPreset?.required),
      logicEnabled: false,
      imageChoice: imageMode,
      imageFit: normalizeImageFit(resolvedPreset?.imageFit),
      imageScale: normalizeImageScale(resolvedPreset?.imageScale),
      options: CHOICE_TYPES.has(normalizedType)
        ? normalizeOptions(resolvedPreset?.options || [createOption("Вариант 1"), createOption("Вариант 2")])
        : [],
      ratingLabels: normalizedType === "rating" ? { low: "", high: "" } : null,
      rating: normalizedType === "rating" ? { minLabel: "", maxLabel: "" } : null
    };
    if (imageMode) applyQuestionImageSettings(question);

    const insertIndex = Number.isInteger(pendingQuestionInsertIndex)
      ? Math.max(0, Math.min(pendingQuestionInsertIndex, page.questions.length))
      : page.questions.length;
    page.questions.splice(insertIndex, 0, question);
    pendingQuestionInsertIndex = null;
    setSingleQuestionSelection(question.id);
    state.builderSection = "questions";
    setSettingsPane("question");

    renderAll();
    setInspectorOpen(true);
    markDirty("Вопрос добавлен");
    focusPanelOnMobile("settings");

    requestAnimationFrame(() => {
      refs.questionList.querySelector(`[data-question-id="${cssEscape(question.id)}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    });
  }

  function duplicateQuestion(questionId) {
    const page = getSelectedPage();
    if (!page) return;

    const index = page.questions.findIndex((q) => q.id === questionId);
    if (index < 0) return;

    const clone = deepClone(page.questions[index]);
    clone.id = createId();
    clone.options = (clone.options || []).map((option) => ({ ...option, id: createId() }));

    page.questions.splice(index + 1, 0, clone);
    setSingleQuestionSelection(clone.id);

    renderAll();
    markDirty("Вопрос продублирован");
  }

  function removeQuestion(questionId) {
    const page = getSelectedPage();
    if (!page) return;
    const totalQuestions = state.survey.pages.reduce(
      (sum, currentPage) => sum + (Array.isArray(currentPage.questions) ? currentPage.questions.length : 0),
      0
    );
    if (totalQuestions <= 1) {
      setStatus("В анкете должен остаться хотя бы один вопрос", true);
      return;
    }

    const index = page.questions.findIndex((q) => q.id === questionId);
    if (index < 0) return;

    page.questions.splice(index, 1);
    const next = page.questions[index] || page.questions[index - 1] || null;
    setSingleQuestionSelection(next ? next.id : null);

    renderAll();
    markDirty("Вопрос удалён");
  }

  function highlightActiveQuestion() {
    const selected = new Set(getSelectedQuestionIdsForPage());
    refs.questionList.querySelectorAll(".question-card").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.questionId === state.selectedQuestionId);
      card.classList.toggle("is-selected", selected.has(card.dataset.questionId));
    });
  }

  function markDirty(message = "") {
    state.dirty = true;
    state.survey.updatedAt = new Date().toISOString();

    setSaveState("saving", "Сохранение...");
    if (message) setStatus(message);

    saveDraft();
    renderSurveyPreview();
    renderLogicMap();
    updateBuilderMeta();
    if (!historyState.isApplying) recordHistorySnapshot();

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveRemote().catch((error) => {
        console.error(error);
        setSaveState("error", "Не сохранено");
        setStatus(error.message || "Ошибка сохранения", true);
      });
    }, 900);
  }

  async function saveRemote() {
    if (isSaving) {
      pendingSave = true;
      return;
    }
    isSaving = true;

    try {
      const payload = toApiPayload();
      await apiRequest(`/api/surveys/${surveyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      state.dirty = false;
      markSyncedDraftBaseline();
      clearStoredDraft();
      createVersionSnapshot("Автосохранение");
      setSaveState("saved", "Сохранено");
      setStatus("Сохранено");
    } finally {
      isSaving = false;
      if (pendingSave) {
        pendingSave = false;
        await saveRemote();
      }
    }
  }

  function toApiPayload() {
    return {
      title: String(state.survey.title || "").trim() || "Новая анкета",
      description: String(state.survey.description || "").trim(),
      pages: state.survey.pages.map((page, pageIndex) => ({
        id: String(page.id || ""),
        title: String(page.title || `Страница ${pageIndex + 1}`),
        order: pageIndex,
        order_index: pageIndex,
        design: normalizePageDesign(page.design || {}),
        questions: page.questions.map((q, qIndex) => {
          const questionType = normalizeType(q.type);
          return {
            id: String(q.id || ""),
            pageId: String(page.id || ""),
            order: qIndex,
            question_order: qIndex,
            text: String(q.title || `Вопрос ${qIndex + 1}`),
            helpText: String(q.description || ""),
            panelOpacity: normalizeQuestionPanelOpacity(q.panelOpacity),
            type: toApiType(questionType),
            required: Boolean(q.required),
            logicEnabled: Boolean(q.logicEnabled),
            options: CHOICE_TYPES.has(questionType)
              ? normalizeOptions(q.options).map((opt) => {
                  const jumpIndex = resolveOptionJumpIndex(opt);
                  return {
                    id: String(opt.id || ""),
                    text: String(opt.text || ""),
                    imageUrl: String(opt.imageUrl || ""),
                    imageFit: normalizeImageFit(opt.imageFit || q.imageFit),
                    imageScale: normalizeImageScale(opt.imageScale ?? q.imageScale),
                    jumpToPageIndex: Number.isInteger(jumpIndex) ? jumpIndex : null,
                    jumpToPageId:
                      Number.isInteger(jumpIndex) && state.survey.pages[jumpIndex]
                        ? String(state.survey.pages[jumpIndex].id)
                        : String(opt.jumpToPageId || "")
                  };
                })
              : []
          };
        })
      }))
    };
  }

  function validateBeforePublish() {
    const title = String(state.survey.title || "").trim();
    if (!title) return "Введите название анкеты";
    const totalQuestions = state.survey.pages.reduce((sum, page) => sum + (Array.isArray(page.questions) ? page.questions.length : 0), 0);
    if (totalQuestions < 1) return "Добавьте хотя бы один вопрос";
    return "";
  }

  function saveDraft() {
    clearStoredDraft();
  }

  function restoreDraft() {
    clearStoredDraft();
  }

  function resetDraft() {
    clearStoredDraft();
  }

  function updateDraftBanner() {
    clearStoredDraft();
  }

  function getDraftKey() {
    return `draft_survey_${surveyId || "new"}`;
  }

  function clearStoredDraft() {
    localStorage.removeItem(getDraftKey());
    localStorage.removeItem("draft_survey");
  }

  function buildDraftPayload() {
    return {
      survey: state.survey,
      selectedPageId: state.selectedPageId,
      selectedQuestionId: state.selectedQuestionId,
      selectedQuestionIds: state.selectedQuestionIds,
      savedAt: Date.now()
    };
  }

  function markSyncedDraftBaseline() {
    lastSyncedDraftFingerprint = getDraftFingerprint(state.survey);
  }

  function getDraftFingerprint(survey) {
    if (!survey || typeof survey !== "object") return "";
    return JSON.stringify({
      title: String(survey.title || ""),
      description: String(survey.description || ""),
      pages: (Array.isArray(survey.pages) ? survey.pages : []).map((page) => ({
        id: String(page.id || ""),
        title: String(page.title || ""),
        design: normalizePageDesign(page.design || {}),
        questions: (Array.isArray(page.questions) ? page.questions : []).map((question) => ({
          id: String(question.id || ""),
          type: normalizeType(question.type),
          title: String(question.title || ""),
          description: String(question.description || ""),
          panelOpacity: normalizeQuestionPanelOpacity(question.panelOpacity),
          required: Boolean(question.required),
          logicEnabled: Boolean(question.logicEnabled),
          options: CHOICE_TYPES.has(normalizeType(question.type)) ? normalizeOptions(question.options) : [],
          ratingLabels: question.ratingLabels || question.rating || null
        }))
      }))
    });
  }

  function setStatus(text, isError = false) {
    refs.statusText.textContent = text || "";
    refs.statusText.classList.toggle("is-error", isError);
  }

  function setSaveState(type, text) {
    refs.saveState.classList.remove("is-saved", "is-saving", "is-error");
    refs.saveState.classList.add(type === "error" ? "is-error" : type === "saving" ? "is-saving" : "is-saved");
    refs.saveStateText.textContent = text;
  }

  function toast(message) {
    const node = document.createElement("div");
    node.className = "builder-toast";
    node.textContent = message;
    document.body.appendChild(node);

    requestAnimationFrame(() => node.classList.add("is-visible"));

    setTimeout(() => {
      node.classList.remove("is-visible");
      setTimeout(() => node.remove(), 220);
    }, 1800);
  }

  function setMobilePanel(panel) {
    state.mobilePanel = panel;

    refs.mobileTabs.forEach((tab) => {
      if (!tab.dataset.builderSection) {
        tab.classList.toggle("is-active", tab.dataset.panelTab === panel);
      }
    });

    refs.panels.forEach((panelNode) => {
      panelNode.classList.toggle("is-active", panelNode.dataset.panel === panel);
    });
  }

  function focusPanelOnMobile(panel) {
    if (window.innerWidth > 1100) return;
    setMobilePanel(panel);
  }

  function updateBuilderSectionNav() {
    refs.builderSectionButtons?.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.builderSection === state.builderSection);
    });
    document.body.classList.remove(
      "builder-section-survey",
      "builder-section-questions",
      "builder-section-publish"
    );
    document.body.classList.add(`builder-section-${state.builderSection || "questions"}`);
  }

  function setInspectorOpen(open) {
    const overlay = document.getElementById("questionSettingsArchive");
    const shouldOpen = Boolean(open) && Boolean(getSelectedQuestion());
    document.body.classList.toggle("builder-inspector-open", shouldOpen);
    if (overlay) overlay.hidden = !shouldOpen;
    document.body.classList.toggle("modal-open", shouldOpen || hasAnyModalOpen());
    if (shouldOpen) {
      renderEditor();
      requestAnimationFrame(() => {
        refs.questionTitleInput?.focus();
      });
    }
  }

  function activateBuilderSection(section) {
    const normalized = ["questions", "survey", "publish"].includes(section)
      ? section
      : "questions";
    state.builderSection = normalized;
    updateBuilderSectionNav();
    setInspectorOpen(false);

    if (refs.questionsStep) refs.questionsStep.hidden = normalized !== "questions";
    if (refs.surveySettingsStep) refs.surveySettingsStep.hidden = normalized !== "survey";
    if (refs.publishStep) refs.publishStep.hidden = normalized !== "publish";
    if (refs.publishBtn) {
      refs.publishBtn.textContent = state.survey.published && normalized === "publish"
        ? "Опубликовано"
        : normalized === "questions"
        ? "Далее"
        : normalized === "survey"
          ? "Продолжить"
          : "Опубликовать";
      refs.publishBtn.disabled = Boolean(state.survey.published && normalized === "publish");
    }
    if (normalized === "publish") updateSharePanel();
  }

  function setAdvancedMode(on, notify = false) {
    state.advancedMode = false;
    localStorage.setItem(ADVANCED_STORAGE_KEY, "off");
    document.body.classList.remove("builder-advanced");
    setToolbarLane(state.toolbarLane, false);
  }

  function setSimpleMode(on, notify = false) {
    state.simpleMode = true;
    localStorage.setItem(SIMPLE_MODE_STORAGE_KEY, "on");
    document.body.classList.toggle("builder-simple", state.simpleMode);
    if (state.simpleMode) {
      state.toolbarLane = "compose";
      state.advancedMode = false;
      state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];
      localStorage.setItem(ADVANCED_STORAGE_KEY, "off");
      document.body.classList.remove("builder-advanced");
    }
    setToolbarLane(state.toolbarLane, false);
    setEditorSection(state.editorSection || "content");
    renderQuestions();
    updateQuestionActionButtons();
  }

  function setToolbarLane(lane, notify = false) {
    const normalizedBase = ["compose", "organize"].includes(lane) ? lane : "compose";
    const normalized = state.simpleMode ? "compose" : normalizedBase;
    state.toolbarLane = normalized;
    localStorage.setItem(TOOLBAR_LANE_STORAGE_KEY, normalized);

    refs.toolbarLaneButtons.forEach((button) => {
      const isActive = button.dataset.toolbarLaneBtn === normalized;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    refs.toolbarLaneGroups.forEach((group) => {
      const laneNames = String(group.dataset.toolbarLane || "compose")
        .split(/\s+/)
        .filter(Boolean);
      const hiddenByLane = !laneNames.includes(normalized);
      const hiddenByAdvanced = group.classList.contains("constructor-advanced") && !state.advancedMode;
      group.classList.toggle("is-hidden", hiddenByLane || hiddenByAdvanced);
    });

    if (notify) {
      const laneTitle = normalized === "compose" ? "Конструктор" : "Структура";
      toast(`Режим: ${laneTitle}`);
    }
  }

  function setDensityMode(mode, notify = false) {
    state.densityMode = mode === "compact" ? "compact" : "cozy";
    localStorage.setItem(DENSITY_STORAGE_KEY, state.densityMode);
    document.body.classList.toggle("builder-compact", state.densityMode === "compact");
    refs.toggleDensityBtn?.setAttribute("aria-pressed", state.densityMode === "compact" ? "true" : "false");
    if (refs.toggleDensityBtn) {
      refs.toggleDensityBtn.textContent = state.densityMode === "compact" ? "Вид: обычный" : "Компактно";
    }
    if (notify) {
      toast(state.densityMode === "compact" ? "Компактный режим включён" : "Обычный режим включён");
    }
  }

  function setFocusMode(on, notify = false) {
    state.focusMode = Boolean(on);
    localStorage.setItem(FOCUS_STORAGE_KEY, state.focusMode ? "on" : "off");
    document.body.classList.toggle("builder-focus", state.focusMode);
    refs.toggleFocusBtn?.setAttribute("aria-pressed", state.focusMode ? "true" : "false");
    if (refs.toggleFocusBtn) {
      refs.toggleFocusBtn.textContent = state.focusMode ? "Фокус: ON" : "Фокус";
    }
    if (notify) {
      toast(state.focusMode ? "Фокус-режим включён" : "Фокус-режим выключен");
    }
  }

  function shiftPageSelection(direction) {
    const pages = Array.isArray(state.survey.pages) ? state.survey.pages : [];
    if (pages.length <= 1) return;
    const currentIndex = pages.findIndex((page) => page.id === state.selectedPageId);
    if (currentIndex < 0) return;
    const nextIndex = Math.max(0, Math.min(pages.length - 1, currentIndex + direction));
    if (nextIndex === currentIndex) return;
    const page = pages[nextIndex];
    state.selectedPageId = page.id;
    state.selectedQuestionId = page.questions?.[0]?.id || null;
    state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];
    renderAll();
    setStatus(`Открыта страница: ${page.title || `Страница ${nextIndex + 1}`}`);
  }

  function getCommandEntries() {
    return [
      { id: "addQuestion", label: "Добавить вопрос", hint: "Ctrl+Enter", run: () => addQuestion("text") },
      { id: "addPage", label: "Добавить страницу", hint: "Alt+Down", run: () => refs.addPageBtn?.click() },
      { id: "focusSearch", label: "Фокус на поиск вопросов", hint: "Ctrl+F", run: () => refs.questionSearchInput?.focus() },
      { id: "clearSearch", label: "Очистить фильтр вопросов", hint: "-", run: () => refs.clearQuestionSearchBtn?.click() },
      { id: "selectAllVisible", label: "Выделить видимые вопросы", hint: "-", run: () => selectAllVisibleQuestions() },
      { id: "clearSelection", label: "Сбросить выделение", hint: "-", run: () => clearQuestionSelection() },
      { id: "duplicateSelected", label: "Дублировать выделенные", hint: "Ctrl+D", run: () => duplicateSelectedQuestions() },
      { id: "deleteSelected", label: "Удалить выделенные", hint: "Delete", run: () => removeSelectedQuestions() },
      { id: "moveSelected", label: "Перенести выделенные на страницу", hint: "-", run: () => moveSelectedQuestionsToPagePrompt() },
      { id: "nextMatch", label: "Следующее совпадение", hint: "Enter", run: () => moveQuestionMatch(1) },
      { id: "prevMatch", label: "Предыдущее совпадение", hint: "Shift+Enter", run: () => moveQuestionMatch(-1) },
      { id: "toggleFocus", label: state.focusMode ? "Выключить фокус-режим" : "Включить фокус-режим", hint: "V", run: () => setFocusMode(!state.focusMode, true) },
      { id: "toggleDensity", label: state.densityMode === "compact" ? "Обычная плотность" : "Компактная плотность", hint: "-", run: () => setDensityMode(state.densityMode === "compact" ? "cozy" : "compact", true) },
      { id: "openTemplates", label: "Открыть каталог шаблонов", hint: "-", run: () => openTemplateCatalogModal() },
      { id: "publish", label: "Опубликовать анкету", hint: "-", run: () => refs.publishBtn?.click() },
      { id: "save", label: "Сохранить", hint: "Ctrl+S", run: () => saveRemote().then(() => toast("Сохранено")) }
    ];
  }

  function renderCommandPaletteList() {
    if (!refs.commandPaletteList) return;
    const queryText = String(state.commandSearch || "").trim().toLowerCase();
    const items = getCommandEntries().filter((item) => {
      if (!queryText) return true;
      return `${item.label} ${item.hint}`.toLowerCase().includes(queryText);
    });

    refs.commandPaletteList.innerHTML = items
      .map(
        (item) => `
          <button type="button" class="constructor-command-item" data-command-id="${escapeAttr(item.id)}">
            <span>${escapeHtml(item.label)}</span>
            <small>${escapeHtml(item.hint)}</small>
          </button>
        `
      )
      .join("");

    refs.commandPaletteList.querySelectorAll("[data-command-id]").forEach((node) => {
      node.addEventListener("click", async () => {
        const id = node.getAttribute("data-command-id");
        const entry = getCommandEntries().find((item) => item.id === id);
        if (!entry) return;
        closeCommandPalette();
        try {
          await Promise.resolve(entry.run());
        } catch (error) {
          setStatus(error.message || "Команда завершилась с ошибкой", true);
        }
      });
    });
  }

  function openCommandPalette() {
    if (!refs.commandPaletteOverlay || !refs.commandPaletteOverlay.hidden) return;
    state.commandSearch = "";
    if (refs.commandPaletteInput) refs.commandPaletteInput.value = "";
    renderCommandPaletteList();
    refs.commandPaletteOverlay.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => refs.commandPaletteInput?.focus());
  }

  function closeCommandPalette() {
    if (!refs.commandPaletteOverlay || refs.commandPaletteOverlay.hidden) return;
    refs.commandPaletteOverlay.hidden = true;
    cleanupModals();
  }

  function setSettingsPane(pane) {
    state.settingsPane = "question";
    refs.settingsTabQuestion?.classList.add("is-active");
    refs.settingsTabQuestion?.setAttribute("aria-selected", "true");
    if (refs.settingsQuestionPane) refs.settingsQuestionPane.hidden = false;
  }

  function ensureSelectionConsistency() {
    if (!Array.isArray(state.survey.pages) || !state.survey.pages.length) {
      state.survey.pages = [createPage("Страница 1")];
    }

    state.survey.pages = state.survey.pages.map((page, index) => ({
      ...page,
      id: String(page?.id || `page_${index + 1}`),
      questions: Array.isArray(page?.questions)
        ? page.questions.map((question, qIndex) => ({
            ...question,
            id: String(question?.id || `q_${index + 1}_${qIndex + 1}`)
          }))
        : []
    }));

    state.selectedPageId = state.selectedPageId == null ? null : String(state.selectedPageId);
    state.selectedQuestionId = state.selectedQuestionId == null ? null : String(state.selectedQuestionId);
    state.selectedQuestionIds = Array.isArray(state.selectedQuestionIds)
      ? state.selectedQuestionIds.map((id) => String(id))
      : [];

    if (!state.survey.pages.some((page) => String(page.id) === state.selectedPageId)) {
      state.selectedPageId = state.survey.pages[0].id;
    }

    const page = getSelectedPage();
    if (!page) {
      state.selectedQuestionId = null;
      state.selectedQuestionIds = [];
      return;
    }

    if (!Array.isArray(page.questions) || !page.questions.length) {
      state.selectedQuestionId = null;
      state.selectedQuestionIds = [];
      return;
    }

    if (!page.questions.some((question) => String(question.id) === state.selectedQuestionId)) {
      state.selectedQuestionId = page.questions[0].id;
    }

    const selectedSet = new Set(page.questions.map((question) => String(question.id)));
    const normalizedSelected = (Array.isArray(state.selectedQuestionIds) ? state.selectedQuestionIds : [])
      .filter((id, index, list) => selectedSet.has(id) && list.indexOf(id) === index);

    if (!normalizedSelected.length && state.selectedQuestionId) {
      normalizedSelected.push(state.selectedQuestionId);
    }

    if (!normalizedSelected.includes(state.selectedQuestionId)) {
      normalizedSelected.unshift(state.selectedQuestionId);
    }

    state.selectedQuestionIds = normalizedSelected;
  }

  function normalizePages(pageRows, questionRows) {
    const pageMap = new Map();

    pageRows.forEach((page, index) => {
      pageMap.set(String(page.id), {
        id: String(page.id),
        title: String(page.title || `Страница ${index + 1}`),
        design: normalizePageDesign(page.design || {}),
        questions: []
      });
    });

    if (!pageMap.size) {
      const fallback = createPage("Страница 1");
      pageMap.set(fallback.id, fallback);
    }

    questionRows.forEach((row, index) => {
      const pageId = String(row.pageId || row.page_id || "");
      const page = pageMap.get(pageId) || pageMap.values().next().value;
      if (!page) return;

      const type = normalizeType(row.type);
      const options = CHOICE_TYPES.has(type) ? normalizeOptions(row.options) : [];
      const imageChoice = Boolean(row.imageChoice || row.image_choice) || (type === "single" && options.some(optionHasImage));
      const question = {
        id: String(row.id || createId()),
        type,
        title: String(row.text || row.question_text || `Вопрос ${index + 1}`),
        description: String(row.helpText || row.help_text || ""),
        panelOpacity: normalizeQuestionPanelOpacity(row.panelOpacity || row.panel_opacity),
        required: Boolean(row.required),
        logicEnabled: Boolean(row.logicEnabled || row.logic_enabled),
        imageChoice,
        imageFit: normalizeImageFit(row.imageFit || options.find((option) => option.imageFit)?.imageFit),
        imageScale: normalizeImageScale(row.imageScale ?? options.find((option) => option.imageScale)?.imageScale),
        options,
        rating: type === "rating" ? { minLabel: "", maxLabel: "" } : null
      };

      if (CHOICE_TYPES.has(type) && question.options.length < 2) {
        question.options = [createOption("Вариант 1"), createOption("Вариант 2")];
      }

      page.questions.push(question);
    });

    return Array.from(pageMap.values());
  }

  function buildHistorySnapshot() {
    return {
      survey: deepClone(state.survey),
      selectedPageId: state.selectedPageId,
      selectedQuestionId: state.selectedQuestionId,
      selectedQuestionIds: deepClone(state.selectedQuestionIds),
      activeThemeId: state.activeThemeId,
      previewThemeId: state.previewThemeId,
      settingsPane: state.settingsPane
    };
  }

  function recordHistorySnapshot(reset = false) {
    const snapshot = buildHistorySnapshot();
    const hash = JSON.stringify(snapshot);
    if (!reset && hash === historyState.lastHash) return;

    if (reset) {
      historyState.undoStack = [snapshot];
      historyState.redoStack = [];
      historyState.lastHash = hash;
      updateHistoryControls();
      return;
    }

    historyState.undoStack.push(snapshot);
    if (historyState.undoStack.length > historyState.max) historyState.undoStack.shift();
    historyState.redoStack = [];
    historyState.lastHash = hash;
    updateHistoryControls();
  }

  function applyHistorySnapshot(snapshot, message) {
    if (!snapshot) return;
    historyState.isApplying = true;
    try {
      state.survey = deepClone(snapshot.survey);
      state.selectedPageId = snapshot.selectedPageId || state.survey.pages[0]?.id || null;
      state.selectedQuestionId = snapshot.selectedQuestionId || null;
      state.selectedQuestionIds = Array.isArray(snapshot.selectedQuestionIds)
        ? snapshot.selectedQuestionIds.map((id) => String(id))
        : (state.selectedQuestionId ? [state.selectedQuestionId] : []);
      state.activeThemeId = snapshot.activeThemeId || state.activeThemeId;
      state.previewThemeId = snapshot.previewThemeId || state.previewThemeId;
      state.settingsPane = snapshot.settingsPane || state.settingsPane;
      renderAll();
      saveDraft();
      setSaveState("saving", "Сохранение...");
      if (message) setStatus(message);
    } finally {
      historyState.isApplying = false;
    }

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveRemote().catch((error) => {
        console.error(error);
        setSaveState("error", "Не сохранено");
        setStatus(error.message || "Ошибка сохранения", true);
      });
    }, 120);
  }

  function undoChange() {
    if (historyState.undoStack.length <= 1) {
      setStatus("Больше нечего отменять");
      return;
    }
    const current = historyState.undoStack.pop();
    historyState.redoStack.push(current);
    const previous = historyState.undoStack[historyState.undoStack.length - 1];
    historyState.lastHash = JSON.stringify(previous);
    updateHistoryControls();
    applyHistorySnapshot(previous, "Действие отменено");
  }

  function redoChange() {
    if (!historyState.redoStack.length) {
      setStatus("Больше нечего повторять");
      return;
    }
    const next = historyState.redoStack.pop();
    historyState.undoStack.push(next);
    historyState.lastHash = JSON.stringify(next);
    updateHistoryControls();
    applyHistorySnapshot(next, "Действие повторено");
  }

  function updateHistoryControls() {
    if (refs.undoBtn) refs.undoBtn.disabled = historyState.undoStack.length <= 1;
    if (refs.redoBtn) refs.redoBtn.disabled = historyState.redoStack.length === 0;
  }

  function normalizeDraft(survey) {
    if (!survey || typeof survey !== "object") return null;
    const pages = Array.isArray(survey.pages) ? survey.pages : [];

    const normalizedPages = pages.length
      ? pages.map((page, pIdx) => {
          const questions = Array.isArray(page.questions) ? page.questions : [];
          return {
            id: String(page.id || createId()),
            title: String(page.title || `Страница ${pIdx + 1}`),
            design: normalizePageDesign(page.design || {}),
            questions: questions.map((question, qIdx) => {
              const type = normalizeType(question.type);
              const options = CHOICE_TYPES.has(type) ? normalizeOptions(question.options) : [];
              const imageChoice = Boolean(question.imageChoice) || (type === "single" && options.some(optionHasImage));
              return {
                id: String(question.id || createId()),
                type,
                title: String(question.title || `Вопрос ${qIdx + 1}`),
                description: String(question.description || ""),
                panelOpacity: normalizeQuestionPanelOpacity(question.panelOpacity || question.panel_opacity),
                required: Boolean(question.required),
                logicEnabled: Boolean(question.logicEnabled),
                imageChoice,
                imageFit: normalizeImageFit(question.imageFit || options.find((option) => option.imageFit)?.imageFit),
                imageScale: normalizeImageScale(question.imageScale ?? options.find((option) => option.imageScale)?.imageScale),
                options,
                ratingLabels: type === "rating"
                  ? {
                      low: String(question?.ratingLabels?.low || question?.rating?.minLabel || ""),
                      high: String(question?.ratingLabels?.high || question?.rating?.maxLabel || "")
                    }
                  : null,
                rating: type === "rating"
                  ? {
                      minLabel: String(question?.ratingLabels?.low || question?.rating?.minLabel || ""),
                      maxLabel: String(question?.ratingLabels?.high || question?.rating?.maxLabel || "")
                    }
                  : null
              };
            })
          };
        })
      : [createPage("Страница 1")];

    return {
      id: String(survey.id || surveyId),
      title: String(survey.title || "Новая анкета"),
      description: String(survey.description || ""),
      pages: normalizedPages,
      published: Boolean(survey.published),
      updatedAt: survey.updatedAt || new Date().toISOString()
    };
  }

  function normalizeType(type) {
    const normalized = String(type || "text").trim().toLowerCase();
    if (normalized === "multi") return "multiple";
    if (normalized === "dropdown") return "select";
    if (normalized === "image" || normalized === "image-choice" || normalized === "image_choice") return "single";
    if (["text", "single", "multiple", "rating", "select"].includes(normalized)) return normalized;
    return "text";
  }

  function toApiType(type) {
    if (type === "multiple") return "multi";
    if (type === "select") return "dropdown";
    return type;
  }

  function normalizeOptions(options) {
    if (!Array.isArray(options)) return [];
    return options
      .map((item) => {
        if (typeof item === "string") {
          const text = item.trim();
          return text ? createOption(text) : null;
        }

        if (item && typeof item === "object") {
          const text = String(item.text || "").trim();
          const imageUrl = String(item.imageUrl || "").trim();
          if (!text && !imageUrl) return null;
          const parsedJumpIndex = parseJumpIndex(item.jumpToPageIndex);
          return {
            id: String(item.id || createId()),
            text: text || "Option",
            imageUrl,
            imageFit: normalizeImageFit(item.imageFit),
            imageScale: normalizeImageScale(item.imageScale),
            jumpToPageId: String(item.jumpToPageId || item.targetPageId || ""),
            jumpToPageIndex: parsedJumpIndex
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  function normalizeImageFit(value) {
    const fit = String(value || "cover").trim().toLowerCase();
    return IMAGE_FIT_VALUES.has(fit) ? fit : "cover";
  }

  function normalizeImageScale(value) {
    const scale = Number(value);
    return Number.isFinite(scale) ? Math.max(60, Math.min(130, Math.round(scale))) : 100;
  }

  function optionHasImage(option) {
    return Boolean(String(option?.imageUrl || "").trim());
  }

  function isImageChoiceQuestion(question) {
    if (!question) return false;
    if (question.imageChoice === true) return true;
    const type = normalizeType(question.type);
    return type === "single" && normalizeOptions(question.options).some(optionHasImage);
  }

  function getQuestionImageFit(question) {
    if (!question) return "cover";
    if (question.imageFit) return normalizeImageFit(question.imageFit);
    const option = normalizeOptions(question.options).find((item) => item.imageFit);
    return normalizeImageFit(option?.imageFit);
  }

  function getQuestionImageScale(question) {
    if (!question) return 100;
    if (question.imageScale) return normalizeImageScale(question.imageScale);
    const option = normalizeOptions(question.options).find((item) => item.imageScale);
    return normalizeImageScale(option?.imageScale);
  }

  function applyQuestionImageSettings(question, patch = {}) {
    if (!question) return;
    question.imageChoice = true;
    question.imageFit = normalizeImageFit(patch.imageFit || question.imageFit || getQuestionImageFit(question));
    question.imageScale = normalizeImageScale(patch.imageScale ?? question.imageScale ?? getQuestionImageScale(question));
    question.options = normalizeOptions(question.options).map((option) => ({
      ...option,
      imageFit: question.imageFit,
      imageScale: question.imageScale
    }));
  }

  function resolveOptionJumpIndex(option) {
    if (!option || typeof option !== "object") return null;
    if (Number.isInteger(option.jumpToPageIndex)) return option.jumpToPageIndex;
    const parsed = parseJumpIndex(option.jumpToPageIndex);
    if (Number.isInteger(parsed)) return parsed;

    const targetId = String(option.jumpToPageId || option.targetPageId || "").trim();
    if (!targetId) return null;
    const index = state.survey.pages.findIndex((page) => String(page.id) === targetId);
    return index >= 0 ? index : null;
  }

  function hasActiveLogicRoute(option, sourcePageIndex = null) {
    const targetIndex = resolveOptionJumpIndex(option);
    if (!Number.isInteger(targetIndex)) return false;
    if (!state.survey.pages[targetIndex]) return false;
    if (Number.isInteger(sourcePageIndex) && targetIndex === sourcePageIndex) return false;
    return true;
  }

  function getSelectedPage() {
    const selectedId = state.selectedPageId == null ? null : String(state.selectedPageId);
    return state.survey.pages.find((page) => String(page.id) === selectedId) || null;
  }

  function ensureSelectedPage() {
    let page = getSelectedPage();
    if (page) return page;

    if (!state.survey.pages.length) {
      state.survey.pages.push(createPage("Страница 1"));
    }

    state.selectedPageId = state.survey.pages[0].id;
    return state.survey.pages[0];
  }

  function getSelectedQuestion() {
    const page = getSelectedPage();
    if (!page) return null;
    return page.questions.find((q) => q.id === state.selectedQuestionId) || null;
  }

  function createPage(title = null) {
    const theme = getThemeById(state.activeThemeId);
    return {
      id: createId(),
      title: title || `Страница ${state.survey.pages.length + 1}`,
      design: normalizePageDesign({ themeId: theme.id, bgColor: theme.bgColor }),
      questions: []
    };
  }

  function normalizeWelcomeSettings(raw) {
    const value = raw && typeof raw === "object" ? raw : {};
    const layout = String(value.layout || "image-right");
    const opacity = Number(value.imageOpacity);
    const coverImage = String(value.coverImage || "").trim();
    return {
      coverImage: coverImage || WELCOME_DEFAULT_COVER,
      layout: WELCOME_LAYOUTS.has(layout) ? layout : "image-right",
      imageOpacity: Number.isFinite(opacity) ? Math.max(20, Math.min(100, Math.round(opacity))) : 86,
      imageEnabled: value.imageEnabled !== false
    };
  }

  function getWelcomeSettings() {
    const firstPage = state.survey.pages?.[0] || ensureSelectedPage();
    const design = normalizePageDesign(firstPage.design || {});
    firstPage.design = design;
    return normalizeWelcomeSettings(design.welcome);
  }

  function updateWelcomeSettings(patch = {}) {
    const firstPage = state.survey.pages?.[0] || ensureSelectedPage();
    const currentDesign = normalizePageDesign(firstPage.design || {});
    firstPage.design = normalizePageDesign({
      ...currentDesign,
      welcome: {
        ...normalizeWelcomeSettings(currentDesign.welcome),
        ...patch
      }
    });
    renderPages();
    renderWelcomeSettings();
    markDirty("Заглавная страница обновлена");
  }

  function renderWelcomeSettings() {
    const welcome = getWelcomeSettings();
    if (refs.welcomeCoverImageInput) refs.welcomeCoverImageInput.value = welcome.coverImage;
    if (refs.welcomeLayoutInput) refs.welcomeLayoutInput.value = welcome.layout;
    if (refs.welcomeImageOpacityInput) refs.welcomeImageOpacityInput.value = String(welcome.imageOpacity);
    if (refs.welcomeImageOpacityValue) refs.welcomeImageOpacityValue.textContent = `${welcome.imageOpacity}%`;
    if (refs.welcomeImageEnabledInput) refs.welcomeImageEnabledInput.checked = Boolean(welcome.imageEnabled);
    if (!refs.welcomePreviewCard) return;
    refs.welcomePreviewCard.dataset.layout = welcome.layout;
    refs.welcomePreviewCard.dataset.imageEnabled = welcome.imageEnabled ? "true" : "false";
    refs.welcomePreviewCard.style.setProperty("--welcome-image-opacity", (welcome.imageOpacity / 100).toFixed(2));
    refs.welcomePreviewCard.innerHTML = `
      <div class="constructor-welcome-preview__media" style="background-image:url('${sanitizeCssUrl(welcome.coverImage)}')"></div>
      <div class="constructor-welcome-preview__body">
        <span>Asking</span>
        <strong>${escapeHtml(state.survey.title || "Новая анкета")}</strong>
        <p>${escapeHtml(state.survey.description || "Краткое описание анкеты")}</p>
      </div>
    `;
  }

  function updateDesignEditor() {
    const page = getSelectedPage();
    if (!page) return;
    const design = normalizePageDesign(page.design);
    state.activeThemeId = design.themeId || state.activeThemeId;
    refs.activeThemeBadge.textContent = getThemeById(design.themeId).name;
    refs.pageBgColorInput.value = design.bgColor;
    refs.pageBgImageInput.value = design.bgImage || "";
    refs.pageLayoutInput.value = design.layout;
    refs.pageOverlayInput.value = String(design.overlay);
    refs.pageOverlayValue.textContent = `${design.overlay}%`;
  }

  function normalizePageDesign(raw) {
    const theme = getThemeById(raw?.themeId || state.activeThemeId);
    const layoutRaw = String(raw?.layout || "full");
    const overlayValue = Number(raw?.overlay);
    return {
      themeId: theme.id,
      bgColor: isHexColor(raw?.bgColor) ? raw.bgColor : theme.bgColor,
      bgImage: String(raw?.bgImage || ""),
      layout: ["full", "split-right-image", "split-left-image", "cover-top-image", "center-card"].includes(layoutRaw)
        ? layoutRaw
        : "full",
      overlay: Number.isFinite(overlayValue) ? Math.max(0, Math.min(90, Math.round(overlayValue))) : 0,
      welcome: normalizeWelcomeSettings(raw?.welcome)
    };
  }

  function getThemeById(themeId) {
    return BUILDER_THEMES.find((item) => item.id === themeId) || BUILDER_THEMES[0];
  }

  function buildPageBackgroundStyle(design) {
    const image = sanitizeCssUrl(design.bgImage);
    const hasImage = Boolean(design.bgImage);
    if (design.layout === "full" || !hasImage) {
      return hasImage
        ? `background:url('${image}') center/cover no-repeat, ${design.bgColor};`
        : `background:${design.bgColor};`;
    }
    if (design.layout === "cover-top-image") {
      return `background:linear-gradient(180deg, transparent 0 38%, ${design.bgColor} 38%), url('${image}') top center/100% 40% no-repeat, ${design.bgColor};`;
    }
    if (design.layout === "center-card") {
      return `background:radial-gradient(circle at center, rgba(255,255,255,0.88) 0 28%, rgba(255,255,255,0) 58%), url('${image}') center/cover no-repeat, ${design.bgColor};`;
    }
    if (design.layout === "split-right-image") {
      return `background:linear-gradient(90deg, ${design.bgColor} 0 52%, transparent 52%), url('${image}') right center/50% 100% no-repeat;`;
    }
    return `background:linear-gradient(90deg, transparent 0 48%, ${design.bgColor} 48%), url('${image}') left center/50% 100% no-repeat;`;
  }

  function buildCanvasStyle(design) {
    const image = sanitizeCssUrl(design.bgImage);
    const overlayAlpha = (design.overlay || 0) / 100;
    const overlayColor = `rgba(15, 23, 42, ${overlayAlpha.toFixed(2)})`;
    const overlayLayer = `linear-gradient(${overlayColor}, ${overlayColor})`;
    let backgroundLayer = design.bgColor;

    if (design.bgImage) {
      if (design.layout === "split-right-image") {
        backgroundLayer = `linear-gradient(90deg, ${design.bgColor} 0 56%, transparent 56%), ${overlayLayer}, url('${image}') right center/48% 100% no-repeat, ${design.bgColor}`;
      } else if (design.layout === "split-left-image") {
        backgroundLayer = `linear-gradient(90deg, transparent 0 44%, ${design.bgColor} 44%), ${overlayLayer}, url('${image}') left center/48% 100% no-repeat, ${design.bgColor}`;
      } else if (design.layout === "cover-top-image") {
        backgroundLayer = `linear-gradient(180deg, transparent 0 38%, ${design.bgColor} 38%), ${overlayLayer}, url('${image}') top center/100% 40% no-repeat, ${design.bgColor}`;
      } else if (design.layout === "center-card") {
        backgroundLayer = `radial-gradient(circle at center, rgba(255,255,255,0.82) 0 34%, rgba(255,255,255,0) 62%), ${overlayLayer}, url('${image}') center/cover no-repeat, ${design.bgColor}`;
      } else {
        backgroundLayer = `${overlayLayer}, url('${image}') center/cover no-repeat, ${design.bgColor}`;
      }
    }

    return `background:${backgroundLayer}; border-radius:14px; border:1px solid #dfe7f5; padding:12px;`;
  }

  function declOfNum(value, forms) {
    const n = Math.abs(Number(value) || 0) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  function isHexColor(value) {
    return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
  }

  function sanitizeCssUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return encodeURI(raw)
      .replace(/\\/g, "")
      .replace(/'/g, "%27")
      .replace(/"/g, "%22")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
  }

function createOption(text = "") {
  return {
    id: createId(),
    text,
    imageUrl: "",
    imageFit: "cover",
    imageScale: 100,
    jumpToPageId: "",
    jumpToPageIndex: null
  };
}

  function getImagePollPreset() {
    return {
      title: "Выберите вариант по изображению",
      description: "Добавьте свои URL изображений в вариантах ниже",
      required: true,
      options: [
        { ...createOption("Вариант 1"), imageUrl: "https://picsum.photos/seed/asking-1/900/560" },
        { ...createOption("Вариант 2"), imageUrl: "https://picsum.photos/seed/asking-2/900/560" },
        { ...createOption("Вариант 3"), imageUrl: "https://picsum.photos/seed/asking-3/900/560" }
      ]
    };
  }

  async function uploadImageFile(file) {
    const payload = new FormData();
    payload.append("file", file);
    const result = await apiRequest("/api/uploads/image", {
      method: "POST",
      body: payload
    });
    const uploadedPath = String(result?.path || "").trim();
    if (!uploadedPath) throw new Error("Сервер не вернул путь файла");
    return uploadedPath;
  }

  function normalizeQuestionPanelOpacity(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 72;
    return Math.max(28, Math.min(100, Math.round(number)));
  }

  function parseJumpIndex(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return null;
    if (parsed < 0) return null;
    return parsed;
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function getMetaText(question) {
    const label = isImageChoiceQuestion(question) ? "Опрос с изображениями" : TYPE_LABELS[normalizeType(question.type)] || "Текст";
    return question.required ? `${label} • Обязательный` : label;
  }

  function ensureRatingLabels(question) {
    const low = String(question?.ratingLabels?.low || question?.rating?.minLabel || "");
    const high = String(question?.ratingLabels?.high || question?.rating?.maxLabel || "");
    const normalized = { low, high };
    question.ratingLabels = normalized;
    return normalized;
  }

  function isValidHttpUrl(value) {
    if (!value) return false;
    try {
      const url = new URL(value, window.location.origin);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#96;");
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  function deepClone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function isTextEditingTarget(target) {
    if (!target || !(target instanceof Element)) return false;
    return Boolean(target.closest("input, textarea, [contenteditable='true'], [contenteditable='']"));
  }

  function must(element, name) {
    if (!element) throw new Error(`Missing element: ${name}`);
    return element;
  }
})();
