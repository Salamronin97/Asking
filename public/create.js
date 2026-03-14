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
    { id: "sea", name: "Sea", description: "Светлая тема с мягким голубым фоном.", bgColor: "#eaf3fb", accent: "#3159f5" },
    { id: "school", name: "School", description: "Нейтральная тема для образовательных анкет.", bgColor: "#f5efe2", accent: "#6b7280" },
    { id: "forest", name: "Forest", description: "Спокойная зелёная палитра для вовлечения.", bgColor: "#e8f4ed", accent: "#0f766e" },
    { id: "sunset", name: "Sunset", description: "Тёплая контрастная тема для ярких кампаний.", bgColor: "#fff2e8", accent: "#ea580c" },
    { id: "violet", name: "Violet", description: "Фиолетовый акцент для брендовых опросов.", bgColor: "#f5f3ff", accent: "#7c3aed" },
    { id: "graphite", name: "Graphite", description: "Строгая светло-серая тема для бизнеса.", bgColor: "#eef2f7", accent: "#334155" },
    { id: "peach", name: "Peach", description: "Лёгкая персиковая тема для дружелюбных форм.", bgColor: "#fff4ec", accent: "#f97316" },
    { id: "mint", name: "Mint", description: "Свежая мятная палитра для HR и onboarding.", bgColor: "#ecfdf5", accent: "#059669" },
    { id: "skyline", name: "Skyline", description: "Чистая корпоративная тема для B2B-опросов.", bgColor: "#eef6ff", accent: "#2563eb" },
    { id: "sand", name: "Sand", description: "Мягкая песочная тема для офлайн-мероприятий.", bgColor: "#f8f1e5", accent: "#a16207" },
    { id: "rose", name: "Rose", description: "Нежный розовый акцент для lifestyle анкет.", bgColor: "#fff1f2", accent: "#e11d48" },
    { id: "ice", name: "Ice", description: "Сдержанная холодная тема для формальных исследований.", bgColor: "#f1f5f9", accent: "#0f766e" }
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
        description: "eNPS вопрос",
        required: true,
        options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((value) => createOption(value))
      }
    ]
  };
  const DENSITY_STORAGE_KEY = "asking_builder_density";
  const FOCUS_STORAGE_KEY = "asking_builder_focus";
  const ADVANCED_STORAGE_KEY = "asking_builder_advanced";

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
    settingsPane: "question",
    densityMode: localStorage.getItem(DENSITY_STORAGE_KEY) === "compact" ? "compact" : "cozy",
    focusMode: localStorage.getItem(FOCUS_STORAGE_KEY) === "on",
    advancedMode: localStorage.getItem(ADVANCED_STORAGE_KEY) === "on",
    commandSearch: "",
    questionFilter: "",
    matchCursor: 0,
    selectedQuestionIds: [],
    editorSection: "content"
  };

  const refs = {};
  let surveyId = null;
  let saveTimer = null;
  let isSaving = false;
  let pendingSave = false;
  const dragState = { questionId: null, fromPageId: null, questionIds: [] };
  const historyState = { undoStack: [], redoStack: [], lastHash: "", isApplying: false, max: 60 };
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    new URLSearchParams(window.location.search).get("debug") === "1";

  const query = new URLSearchParams(window.location.search);
  const templateFromQuery = query.get("template");

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheRefs();
    applyStaticBuilderTextFixes();
    enhanceQuestionEditorLayout();
    setAdvancedMode(state.advancedMode, false);
    setDensityMode(state.densityMode, false);
    setFocusMode(state.focusMode, false);
    bindEvents();

    try {
      if (query.get("surveyId")) {
        await ensureSurvey();
        await loadSurvey();
        renderAll();
        updateDraftBanner();
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

    setText("#draftBanner > span", "Найден черновик. Восстановить изменения?");
    setText("#restoreDraftBtn", "Восстановить");
    setText("#resetDraftBtn", "Сбросить");

    setText(".constructor-mobile-tab[data-panel-tab='pages']", "Страницы");
    setText(".constructor-mobile-tab[data-panel-tab='questions']", "Вопросы");
    setText(".constructor-mobile-tab[data-panel-tab='settings']", "Настройки");

    setText("#pagesPanel .constructor-head-sm h3", "Страницы");
    setText("#renamePageBtn", "Переименовать");
    setText("#duplicatePageBtn", "Дублировать");
    setText("#removePageBtn", "Удалить");
    setText("#addPageBtn", "+ Добавить страницу");
    setText(".constructor-bank__head h4", "Банк вопросов");

    const bankButtons = Array.from(document.querySelectorAll(".constructor-bank__item"));
    if (bankButtons[0]) setHtml(".constructor-bank__item:nth-of-type(1)", "<strong>Один выбор</strong><span>Радио-кнопки</span>");
    if (bankButtons[1]) setHtml(".constructor-bank__item:nth-of-type(2)", "<strong>Множественный</strong><span>Чекбоксы</span>");
    if (bankButtons[2]) setHtml(".constructor-bank__item:nth-of-type(3)", "<strong>Список</strong><span>Выпадающий select</span>");
    if (bankButtons[3]) setHtml(".constructor-bank__item:nth-of-type(4)", "<strong>Рейтинг</strong><span>Шкала 1-5</span>");
    if (bankButtons[4]) setHtml(".constructor-bank__item:nth-of-type(5)", "<strong>Текст</strong><span>Свободный ответ</span>");

    setText(".constructor-kitbank .constructor-bank__head h4", "Готовые наборы");
    setHtml(".constructor-kitbank__item[data-question-preset='registration']", "<strong>Регистрация</strong><span>Имя, контакт, согласие</span>");
    setHtml(".constructor-kitbank__item[data-question-preset='event-feedback']", "<strong>Фидбек события</strong><span>NPS, оценка, комментарий</span>");
    setHtml(".constructor-kitbank__item[data-question-preset='product-discovery']", "<strong>Исследование продукта</strong><span>Проблема, приоритет, барьеры</span>");
    setHtml(".constructor-kitbank__item[data-question-preset='hr-pulse']", "<strong>HR Pulse</strong><span>Атмосфера, нагрузка, eNPS</span>");

    setText("#publishBtn", "Опубликовать");
    setAttr("#surveyTitle", "placeholder", "Название анкеты");
    setAttr("#surveyDescription", "placeholder", "Краткое описание анкеты");
    setText("#saveStateText", "Сохранено");

    setAttr("#settingsPanel", "aria-label", "Редактор вопроса");
    setText("#settingsPanel .constructor-head-sm h3", "Настройки вопроса");
    setText("#settingsTabQuestion", "Вопрос");
    setText("#settingsTabDesign", "Дизайн");
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
    setText(".constructor-option-presets__label", "Готовые варианты:");
    setText("[data-option-preset='yes-no']", "Да / Нет");
    setText("[data-option-preset='agree']", "Степень согласия");
    setText("[data-option-preset='satisfaction']", "Оценка 1-5");
    setText("#addOptionBtn", "+ Добавить вариант");
    setText("#normalizeOptionsBtn", "Нормализовать");
    setText("#bulkOptionsToggleBtn", "Массовый ввод");
    setText("#bulkOptionsWrap .form-row span", "Один вариант на строку");
    setAttr("#bulkOptionsInput", "placeholder", "Вариант 1\nВариант 2\nВариант 3");
    setText("#applyBulkOptionsBtn", "Применить список");
    setText("#removeQuestionBtn", "Удалить вопрос");

    setText("#settingsDesignPane .constructor-design__head h4", "Дизайн страницы");
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
    if (pageOverlayRow) {
      const label = pageOverlayRow.querySelector("span");
      if (label) label.innerHTML = 'Накладка: <strong id="pageOverlayValue">0%</strong>';
    }
    setText("#applyDesignAllBtn", "Применить ко всем");
    setText("#resetDesignBtn", "Сброс");

    setText(".constructor-health .constructor-fold__summary span", "Качество анкеты");
    setText("#builderCheckTitle", "Качество названия");
    setText("#builderCheckQuestions", "Минимум 4 вопроса");
    setText("#builderCheckPages", "Хотя бы 1 страница");
    setText("#builderCheckLogic", "Хотя бы 1 логический переход");
    setText("#builderCheckRequired", "Хотя бы 1 обязательный вопрос");
    setText("#builderCheckOptions", "В вопросах с выбором 2+ варианта");
    setText(".constructor-health-reco h4", "Что улучшить");

    setText("#questionTypeTitle", "Выберите тип вопроса");
    const typeGroups = Array.from(document.querySelectorAll(".constructor-type-group"));
    if (typeGroups[0]) {
      const h4 = typeGroups[0].querySelector("h4");
      if (h4) h4.textContent = "Базовые";
      const buttons = Array.from(typeGroups[0].querySelectorAll(".constructor-type-item"));
      if (buttons[0]) buttons[0].innerHTML = "<strong>Одиночный выбор</strong><span>Один вариант ответа</span>";
      if (buttons[1]) buttons[1].innerHTML = "<strong>Множественный выбор</strong><span>Несколько вариантов ответа</span>";
      if (buttons[2]) buttons[2].innerHTML = "<strong>Выбор изображения</strong><span>Карточки с изображениями</span>";
    }
    if (typeGroups[1]) {
      const h4 = typeGroups[1].querySelector("h4");
      if (h4) h4.textContent = "Открытые";
      const buttons = Array.from(typeGroups[1].querySelectorAll(".constructor-type-item"));
      if (buttons[0]) buttons[0].innerHTML = "<strong>Текстовый ответ</strong><span>Свободный текст</span>";
      if (buttons[1]) buttons[1].innerHTML = "<strong>Ответ электронной почты</strong><span>Проверка email</span>";
      if (buttons[2]) buttons[2].innerHTML = "<strong>Числовой ответ</strong><span>Числа и значения</span>";
      if (buttons[3]) buttons[3].innerHTML = "<strong>Ответ с датой</strong><span>Дата и время</span>";
    }
    if (typeGroups[2]) {
      const h4 = typeGroups[2].querySelector("h4");
      if (h4) h4.textContent = "Структурированные";
      const buttons = Array.from(typeGroups[2].querySelectorAll(".constructor-type-item"));
      if (buttons[0]) buttons[0].innerHTML = "<strong>Матрица</strong><span>Сетка ответов</span>";
      if (buttons[1]) buttons[1].innerHTML = "<strong>Ранжирование</strong><span>Порядок приоритетов</span>";
      if (buttons[2]) buttons[2].innerHTML = "<strong>Выпадающий список</strong><span>Компактный выбор</span>";
    }
    if (typeGroups[3]) {
      const h4 = typeGroups[3].querySelector("h4");
      if (h4) h4.textContent = "Оценочные";
      const buttons = Array.from(typeGroups[3].querySelectorAll(".constructor-type-item"));
      if (buttons[0]) buttons[0].innerHTML = "<strong>Эмодзи рейтинг</strong><span>Быстрая оценка</span>";
      if (buttons[1]) buttons[1].innerHTML = "<strong>Звездный рейтинг</strong><span>Шкала 1-5</span>";
      if (buttons[2]) buttons[2].innerHTML = "<strong>Семантический дифференциал</strong><span>Оценка по полюсам</span>";
      if (buttons[3]) buttons[3].innerHTML = "<strong>Распределительная шкала</strong><span>Распределение баллов</span>";
    }
    if (typeGroups[4]) {
      const h4 = typeGroups[4].querySelector("h4");
      if (h4) h4.textContent = "Элементы";
      const button = typeGroups[4].querySelector(".constructor-type-item");
      if (button) button.innerHTML = "<strong>Собственный текст</strong><span>Информационный блок</span>";
    }

    setText("#creationEntryTitle", "Создайте опрос");
    setHtml("#entryCustomBtn", "<strong>Собственный опрос</strong><span>Создайте анкету с нуля и настройте вопросы вручную.</span>");
    setHtml("#entryTemplateBtn", "<strong>Опрос из шаблона</strong><span>Выберите готовую структуру и адаптируйте под себя.</span>");
    setText("#templateCatalogTitle", "Шаблоны опросов");
    setText(".constructor-modal-lead", "Выберите категорию и создайте анкету на готовой структуре.");
    setText("#templatePreviewTitle", "Предпросмотр шаблона");
    setText("#themePickerTitle", "Выберите тему");
    setText("#templateCreateBlankBtn", "+ Создать анкету");
    setText("#applyTemplateBtn", "Использовать шаблон");
    setText("#applyThemeBtn", "Использовать тему");
    setText("#templateCountBadge", "0 шаблонов");
    setAttr("#templateSearchInput", "placeholder", "Поиск шаблона");

    ["#closeQuestionTypeModalBtn", "#closeCreationEntryBtn", "#closeTemplateCatalogBtn", "#closeTemplatePreviewBtn", "#closeThemePickerBtn"]
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
      "draftBanner",
      "restoreDraftBtn",
      "resetDraftBtn",
      "pagesList",
      "renamePageBtn",
      "duplicatePageBtn",
      "removePageBtn",
      "addPageBtn",
      "surveyTitle",
      "surveyDescription",
      "worktopSurveyTitle",
      "builderMetaPages",
      "builderMetaQuestions",
      "builderMetaLogic",
      "builderHealthPercent",
      "builderHealthBarFill",
      "builderCheckTitle",
      "builderCheckQuestions",
      "builderCheckPages",
      "builderCheckLogic",
      "builderCheckRequired",
      "builderCheckOptions",
      "builderHealthRecommendations",
      "previewSurveyBtn",
      "shareSurveyBtn",
      "saveState",
      "saveStateText",
      "publishBtn",
      "addQuestionBtn",
      "openTemplateCatalogBtn",
      "toggleAdvancedBuilderBtn",
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
      "restoreDraftInlineBtn",
      "clearDraftInlineBtn",
      "questionBulkDock",
      "bulkDockCount",
      "bulkDockMoveBtn",
      "bulkDockDuplicateBtn",
      "bulkDockDeleteBtn",
      "bulkDockClearBtn",
      "hotkeysHint",
      "questionList",
      "surveyPreviewList",
      "statusText",
      "questionEditor",
      "emptyEditor",
      "questionTitleInput",
      "questionDescriptionInput",
      "questionRequiredInput",
      "questionTypeInput",
      "ratingEditor",
      "ratingLabelMin",
      "ratingLabelMax",
      "optionsEditor",
      "questionLogicEnabledInput",
      "questionLogicHint",
      "optionsList",
      "addOptionBtn",
      "normalizeOptionsBtn",
      "bulkOptionsToggleBtn",
      "bulkOptionsWrap",
      "bulkOptionsInput",
      "applyBulkOptionsBtn",
      "removeQuestionBtn",
      "questionTypeOverlay",
      "closeQuestionTypeModalBtn",
      "creationEntryOverlay",
      "closeCreationEntryBtn",
      "entryCustomBtn",
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
      "templatePreviewQuestions",
      "applyTemplateBtn",
      "pagesPanel",
      "questionsPanel",
      "settingsPanel",
      "settingsTabQuestion",
      "settingsTabDesign",
      "settingsQuestionPane",
      "settingsDesignPane"
      ,
      "openThemePickerBtn",
      "activeThemeBadge",
      "pageBgColorInput",
      "pageBgImageInput",
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
    refs.panels = Array.from(document.querySelectorAll(".constructor-panel"));
    refs.quickTypeButtons = Array.from(document.querySelectorAll("[data-quick-question-type]"));
    refs.quickAddButtons = Array.from(document.querySelectorAll("[data-quick-add-type]"));
    refs.questionPresetButtons = Array.from(document.querySelectorAll("[data-question-preset]"));

    must(refs.pagesList, "pagesList");
    must(refs.questionList, "questionList");
  }

  function enhanceQuestionEditorLayout() {
    const editor = refs.questionEditor;
    if (!editor || editor.dataset.layoutEnhanced === "1") return;

    const titleRow = refs.questionTitleInput?.closest(".form-row");
    const descriptionRow = refs.questionDescriptionInput?.closest(".form-row");
    const requiredRow = refs.questionRequiredInput?.closest(".inline-check");
    const typeRow = refs.questionTypeInput?.closest(".form-row");
    const ratingSection = refs.ratingEditor;
    const optionsSection = refs.optionsEditor;
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
    const setupGroup = createGroup("Параметры");
    setupGroup.dataset.editorSection = "setup";
    const optionsGroup = createGroup("Варианты и логика");
    optionsGroup.dataset.editorSection = "options";
    const actionGroup = createGroup("Опасная зона", "constructor-editor-group--danger");
    actionGroup.dataset.editorSection = "actions";
    const typeHint = document.createElement("div");
    typeHint.id = "questionTypeHint";
    typeHint.className = "constructor-type-hint";
    typeHint.textContent = "Подсказки появятся после выбора вопроса.";
    const nav = document.createElement("div");
    nav.className = "constructor-editor-nav";
    nav.innerHTML = `
      <button type="button" class="constructor-editor-nav__tab is-active" data-editor-section-tab="content">Текст</button>
      <button type="button" class="constructor-editor-nav__tab" data-editor-section-tab="setup">Параметры</button>
      <button type="button" class="constructor-editor-nav__tab" data-editor-section-tab="options">Варианты</button>
      <button type="button" class="constructor-editor-nav__tab" data-editor-section-tab="actions">Удаление</button>
    `;

    [titleRow, descriptionRow].forEach((node) => {
      if (node) mainGroup.appendChild(node);
    });
    [requiredRow, typeRow, ratingSection].forEach((node) => {
      if (node) setupGroup.appendChild(node);
    });
    [typeHint].forEach((node) => {
      if (node) mainGroup.appendChild(node);
    });
    if (optionsSection) optionsGroup.appendChild(optionsSection);
    if (removeButton) actionGroup.appendChild(removeButton);

    editor.innerHTML = "";
    editor.appendChild(nav);
    [mainGroup, setupGroup, optionsGroup, actionGroup].forEach((group) => {
      if (group.children.length > 1) editor.appendChild(group);
    });
    nav.addEventListener("click", (event) => {
      const tab = event.target.closest("[data-editor-section-tab]");
      if (!tab) return;
      setEditorSection(String(tab.dataset.editorSectionTab || "content"));
    });

    editor.dataset.layoutEnhanced = "1";
    setEditorSection(state.editorSection || "content");
  }

  function setEditorSection(section) {
    const editor = refs.questionEditor;
    if (!editor) return;
    const normalized = ["content", "setup", "options", "actions"].includes(section) ? section : "content";
    state.editorSection = normalized;
    editor.querySelectorAll("[data-editor-section]").forEach((node) => {
      node.hidden = node.dataset.editorSection !== normalized;
    });
    editor.querySelectorAll("[data-editor-section-tab]").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.editorSectionTab === normalized);
    });
  }

  function getQuestionTypeHint(type) {
    const hints = {
      text: "Свободный ответ. Используйте для обратной связи и длинных комментариев.",
      single: "Один вариант ответа. Лучший выбор для быстрых и однозначных решений.",
      multiple: "Несколько вариантов. Подходит для чек-листов и составных предпочтений.",
      select: "Компактный список. Удобно, когда вариантов много и нужен чистый интерфейс.",
      rating: "Оценка по шкале. Идеально для измерения удовлетворенности и качества."
    };
    return hints[normalizeType(type)] || hints.text;
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

    refs.addQuestionBtn?.addEventListener("click", openQuestionTypeModal);
    refs.openTemplateCatalogBtn?.addEventListener("click", openTemplateCatalogModal);
    refs.toggleAdvancedBuilderBtn?.addEventListener("click", () => {
      setAdvancedMode(!state.advancedMode, true);
    });
    refs.toggleDensityBtn?.addEventListener("click", () => {
      setDensityMode(state.densityMode === "compact" ? "cozy" : "compact", true);
    });
    refs.toggleFocusBtn?.addEventListener("click", () => {
      setFocusMode(!state.focusMode, true);
    });
    refs.openCommandPaletteBtn?.addEventListener("click", openCommandPalette);
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
      setSettingsPane("design");
      openThemePickerModal();
    });
    refs.settingsTabQuestion?.addEventListener("click", () => setSettingsPane("question"));
    refs.settingsTabDesign?.addEventListener("click", () => setSettingsPane("design"));
    refs.entryCustomBtn?.addEventListener("click", () => {
      startNewBlankSurvey().catch((error) => {
        console.error(error);
        setStatus(error.message || "Не удалось создать анкету", true);
      });
    });
    refs.entryTemplateBtn?.addEventListener("click", () => {
      closeCreationEntryModal(false);
      openTemplateCatalogModal();
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

    refs.publishBtn?.addEventListener("click", async () => {
      try {
        const validationError = validateBeforePublish();
        if (validationError) {
          setStatus(validationError, true);
          return;
        }
        await saveRemote();
        await apiRequest(`/api/surveys/${surveyId}/publish`, { method: "POST" });
        setStatus("Анкета опубликована");
        toast("Анкета опубликована");
      } catch (error) {
        console.error(error);
        setStatus(error.message || "Ошибка публикации", true);
      }
    });

    refs.previewSurveyBtn?.addEventListener("click", () => {
      if (!surveyId) {
        setStatus("Сначала сохраните анкету", true);
        return;
      }
      window.open(`/survey/${encodeURIComponent(surveyId)}`, "_blank", "noopener,noreferrer");
    });

    refs.shareSurveyBtn?.addEventListener("click", async () => {
      if (!surveyId) {
        setStatus("Сначала сохраните анкету", true);
        return;
      }
      const link = `${window.location.origin}/survey/${encodeURIComponent(surveyId)}`;
      try {
        await navigator.clipboard.writeText(link);
        toast("Ссылка скопирована");
      } catch {
        setStatus(link);
      }
    });

    refs.restoreDraftBtn?.addEventListener("click", restoreDraft);
    refs.resetDraftBtn?.addEventListener("click", resetDraft);
    refs.restoreDraftInlineBtn?.addEventListener("click", restoreDraft);
    refs.clearDraftInlineBtn?.addEventListener("click", resetDraft);

    refs.surveyTitle?.addEventListener("input", (event) => {
      state.survey.title = event.target.value;
      if (refs.worktopSurveyTitle) refs.worktopSurveyTitle.textContent = state.survey.title || "Новая анкета";
      markDirty();
    });

    refs.surveyDescription?.addEventListener("input", (event) => {
      state.survey.description = event.target.value;
      markDirty();
    });

    refs.questionTitleInput?.addEventListener("input", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.title = event.target.value;
      renderQuestions();
      renderSurveyPreview();
      markDirty();
    });

    refs.questionDescriptionInput?.addEventListener("input", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.description = event.target.value;
      markDirty();
    });

    refs.questionRequiredInput?.addEventListener("change", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.required = event.target.checked;
      renderQuestions();
      renderSurveyPreview();
      markDirty();
    });

    refs.questionTypeInput?.addEventListener("change", (event) => {
      const question = getSelectedQuestion();
      if (!question) return;
      question.type = normalizeType(event.target.value);

      if (question.type === "rating") {
        question.ratingLabels = ensureRatingLabels(question);
        question.rating = { ...question.ratingLabels };
        question.options = [];
        question.logicEnabled = false;
      } else if (CHOICE_TYPES.has(question.type)) {
        question.options = normalizeOptions(question.options);
        if (question.options.length < 2) {
          question.options = [createOption("Вариант 1"), createOption("Вариант 2")];
        }
        question.logicEnabled = Boolean(question.logicEnabled);
      } else {
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

    refs.normalizeOptionsBtn?.addEventListener("click", () => {
      const question = getSelectedQuestion();
      if (!question || !CHOICE_TYPES.has(question.type)) return;
      question.options = normalizeOptions(question.options);
      if (!question.options.length) {
        question.options = [createOption("Вариант 1"), createOption("Вариант 2")];
      } else {
        question.options = question.options.map((option, index) => ({
          ...option,
          text: `Вариант ${index + 1}`
        }));
      }
      renderOptions(question);
      renderSurveyPreview();
      markDirty("Варианты обновлены");
    });

    refs.bulkOptionsToggleBtn?.addEventListener("click", () => {
      const question = getSelectedQuestion();
      if (!question || !CHOICE_TYPES.has(question.type) || !refs.bulkOptionsWrap || !refs.bulkOptionsInput) return;
      const opening = refs.bulkOptionsWrap.hidden;
      refs.bulkOptionsWrap.hidden = !opening;
      if (opening) {
        refs.bulkOptionsInput.value = normalizeOptions(question.options).map((option) => option.text).join("\n");
        refs.bulkOptionsInput.focus();
      }
    });

    refs.applyBulkOptionsBtn?.addEventListener("click", () => {
      const question = getSelectedQuestion();
      if (!question || !CHOICE_TYPES.has(question.type) || !refs.bulkOptionsInput) return;
      const lines = String(refs.bulkOptionsInput.value || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        setStatus("Для выбора нужно минимум 2 варианта", true);
        return;
      }
      question.options = lines.map((line) => createOption(line));
      renderOptions(question);
      renderSurveyPreview();
      markDirty("Варианты применены");
    });
    refs.optionsEditor?.addEventListener("click", (event) => {
      const presetButton = event.target.closest("[data-option-preset]");
      if (!presetButton) return;
      const presetKey = String(presetButton.dataset.optionPreset || "").trim();
      if (!presetKey) return;
      applyOptionPreset(presetKey);
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
    bindModal(refs.themePickerOverlay, refs.closeThemePickerBtn, closeThemePickerModal);
    bindModal(refs.commandPaletteOverlay, refs.closeCommandPaletteBtn, closeCommandPalette);

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

    refs.mobileTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const panel = tab.dataset.panelTab;
        setMobilePanel(panel);
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

    const url = new URL(window.location.href);
    url.searchParams.set("surveyId", surveyId);
    history.replaceState({}, "", url.toString());
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
    if (refs.worktopSurveyTitle) refs.worktopSurveyTitle.textContent = state.survey.title || "Новая анкета";
    if (refs.questionSearchInput) refs.questionSearchInput.value = state.questionFilter || "";
    updateQuestionActionButtons();
    updateBuilderMeta();
    if (refs.hotkeysHint) {
      refs.hotkeysHint.textContent =
        `Ctrl/Cmd+клик множественный выбор • Ctrl+D дубль • Del удалить • Ctrl+K команды • Alt+↑/↓ страницы • режим: ${state.densityMode === "compact" ? "компакт" : "обычный"}`;
    }

    renderPages();
    renderQuestions();
    renderEditor();
    setSettingsPane(state.settingsPane);
    updateHistoryControls();
    updateDesignEditor();
    renderSurveyPreview();

    if (window.innerWidth <= 1100) {
      setMobilePanel(state.mobilePanel);
    }
  }

  function updateBuilderMeta() {
    const pages = Array.isArray(state.survey.pages) ? state.survey.pages.length : 0;
    const questions = (state.survey.pages || []).reduce((sum, page) => sum + (Array.isArray(page.questions) ? page.questions.length : 0), 0);
    const logicRoutes = (state.survey.pages || []).reduce(
      (sum, page) =>
        sum +
        (Array.isArray(page.questions)
          ? page.questions.reduce(
              (qSum, question) =>
                qSum +
                (Array.isArray(question.options)
                  ? question.options.filter((opt) => {
                      if (!question.logicEnabled) return false;
                      return Number.isInteger(resolveOptionJumpIndex(opt));
                    }).length
                  : 0),
              0
            )
          : 0),
      0
    );
    if (refs.builderMetaPages) refs.builderMetaPages.textContent = `${pages} стр.`;
    if (refs.builderMetaQuestions) refs.builderMetaQuestions.textContent = `${questions} вопросов`;
    if (refs.builderMetaLogic) refs.builderMetaLogic.textContent = `${logicRoutes} переходов`;
    updateBuilderHealth({ pages, questions, logicRoutes });
  }

  function updateBuilderHealth(metrics = null) {
    const pages = metrics?.pages ?? (Array.isArray(state.survey.pages) ? state.survey.pages.length : 0);
    const questions =
      metrics?.questions ??
      (state.survey.pages || []).reduce((sum, page) => sum + (Array.isArray(page.questions) ? page.questions.length : 0), 0);
    const logicRoutes =
      metrics?.logicRoutes ??
      (state.survey.pages || []).reduce(
        (sum, page) =>
          sum +
          (Array.isArray(page.questions)
            ? page.questions.reduce(
                (qSum, question) =>
                  qSum +
                  (Array.isArray(question.options)
                    ? question.options.filter((opt) => question.logicEnabled && Number.isInteger(resolveOptionJumpIndex(opt))).length
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

    const checks = {
      title: titleLength >= 5,
      questions: questions >= 4,
      pages: pages >= 1,
      logic: logicRoutes >= 1,
      required: requiredCount >= 1,
      options: choiceQuestionsWithBadOptions === 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const percent = Math.round((passed / Object.keys(checks).length) * 100);

    if (refs.builderHealthPercent) refs.builderHealthPercent.textContent = `${percent}%`;
    if (refs.builderHealthBarFill) refs.builderHealthBarFill.style.width = `${percent}%`;
    if (refs.builderCheckTitle) refs.builderCheckTitle.textContent = `Title quality (${titleLength}/5+)`;
    if (refs.builderCheckQuestions) refs.builderCheckQuestions.textContent = `Minimum 4 questions (${questions})`;
    if (refs.builderCheckPages) refs.builderCheckPages.textContent = `At least 1 page (${pages})`;
    if (refs.builderCheckLogic) refs.builderCheckLogic.textContent = `At least 1 logic route (${logicRoutes})`;
    if (refs.builderCheckRequired) refs.builderCheckRequired.textContent = `At least 1 required question (${requiredCount})`;
    if (refs.builderCheckOptions) {
      refs.builderCheckOptions.textContent =
        choiceQuestionsWithBadOptions === 0
          ? "Choice questions have 2+ options"
          : `Fix choice options (${choiceQuestionsWithBadOptions} issue${choiceQuestionsWithBadOptions > 1 ? "s" : ""})`;
    }
    refs.builderCheckTitle?.classList.toggle("is-done", checks.title);
    refs.builderCheckQuestions?.classList.toggle("is-done", checks.questions);
    refs.builderCheckPages?.classList.toggle("is-done", checks.pages);
    refs.builderCheckLogic?.classList.toggle("is-done", checks.logic);
    refs.builderCheckRequired?.classList.toggle("is-done", checks.required);
    refs.builderCheckOptions?.classList.toggle("is-done", checks.options);

    renderHealthRecommendations({
      checks,
      pages,
      questions,
      logicRoutes,
      requiredCount,
      choiceQuestionsWithBadOptions
    });
  }

  function renderHealthRecommendations(report) {
    if (!refs.builderHealthRecommendations) return;
    const suggestions = [];
    if (!report.checks.title) {
      suggestions.push({
        text: "Improve title clarity for better completion rate.",
        action: "auto-title",
        label: "Auto title"
      });
    }
    if (!report.checks.questions) {
      suggestions.push({
        text: "Add more questions to collect enough signal.",
        action: "add-question",
        label: "Add question"
      });
    }
    if (!report.checks.pages) {
      suggestions.push({
        text: "Create at least one page to structure the survey.",
        action: "add-page",
        label: "Add page"
      });
    }
    if (!report.checks.logic) {
      suggestions.push({
        text: "Add one logic jump to personalize respondent flow.",
        action: "focus-logic",
        label: "Go to logic"
      });
    }
    if (!report.checks.required) {
      suggestions.push({
        text: "Mark at least one key question as required.",
        action: "mark-required",
        label: "Mark required"
      });
    }
    if (!report.checks.options) {
      suggestions.push({
        text: "Some choice questions have less than 2 options.",
        action: "fix-options",
        label: "Fix options"
      });
    }

    if (!suggestions.length) {
      refs.builderHealthRecommendations.innerHTML = "<li class='is-good'>Great structure. Survey is ready to publish.</li>";
      return;
    }

    refs.builderHealthRecommendations.innerHTML = suggestions
      .slice(0, 4)
      .map(
        (item) =>
          `<li><span>${escapeHtml(item.text)}</span><button class="btn btn--ghost btn--xs" type="button" data-health-action="${escapeAttr(
            item.action
          )}">${escapeHtml(item.label)}</button></li>`
      )
      .join("");
  }

  function runHealthAction(action) {
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
      const fallbackTitle = firstQuestion?.title ? `Survey: ${String(firstQuestion.title).slice(0, 36)}` : "Customer Feedback Survey";
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
        setStatus("Add a choice question first to configure logic", true);
        return;
      }
      setSingleQuestionSelection(choiceQuestion.id);
      choiceQuestion.logicEnabled = true;
      renderAll();
      setStatus("Logic enabled for selected question");
      markDirty();
      return;
    }
    if (action === "fix-options") {
      const page = getSelectedPage();
      const invalid = (page?.questions || []).find(
        (question) => CHOICE_TYPES.has(normalizeType(question.type)) && normalizeOptions(question.options).length < 2
      );
      if (!invalid) return;
      invalid.options = [createOption("Option 1"), createOption("Option 2")];
      setSingleQuestionSelection(invalid.id);
      renderAll();
      markDirty("Варианты восстановлены");
    }
  }

  function renderPages() {
    refs.pagesList.innerHTML = "";
    state.survey.pages.forEach((page, index) => {
      const design = normalizePageDesign(page.design);
      const questionCount = Array.isArray(page.questions) ? page.questions.length : 0;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `constructor-page-item${page.id === state.selectedPageId ? " is-active" : ""}`;
      button.innerHTML = `
        <span class="constructor-page-item__thumb" style="${buildPageBackgroundStyle(design)}"></span>
        <span class="constructor-page-item__title">${escapeHtml(page.title || `Страница ${index + 1}`)}</span>
        <span class="constructor-page-item__meta">${questionCount} ${declOfNum(questionCount, ["вопрос", "вопроса", "вопросов"])}</span>
      `;
      button.addEventListener("click", () => {
        state.selectedPageId = page.id;
        state.selectedQuestionId = page.questions[0]?.id || null;
        state.selectedQuestionIds = state.selectedQuestionId ? [state.selectedQuestionId] : [];
        state.activeThemeId = design.themeId || state.activeThemeId;
        state.previewThemeId = state.activeThemeId;
        renderAll();
        focusPanelOnMobile("questions");
      });

      button.addEventListener("dragover", (event) => {
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
            ? `Moved ${moved.length} questions to "${targetPage.title}"`
            : `Moved question to "${targetPage.title}"`
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
    if (refs.clearQuestionSelectionBtn) refs.clearQuestionSelectionBtn.disabled = selectedCount <= 1;
    if (refs.selectAllVisibleQuestionsBtn) refs.selectAllVisibleQuestionsBtn.disabled = getVisibleQuestions(page).length < 2;
    if (refs.moveSelectedToPageBtn) {
      refs.moveSelectedToPageBtn.disabled = selectedCount < 1 || (Array.isArray(state.survey.pages) ? state.survey.pages.length : 0) < 2;
    }
    if (refs.questionBulkDock) refs.questionBulkDock.hidden = selectedCount < 2;
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
    const answer = window.prompt(`Move selected questions to page number:\n${hint}`);
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

    const targetTitle = targetPage.title || "Target page";
    markDirty(`Вопросов перенесено: ${moved.length} -> ${targetTitle}`);
    toast(moved.length > 1 ? `Moved ${moved.length} questions to "${targetTitle}"` : `Moved question to "${targetTitle}"`);
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
      document.getElementById("emptyAddQuestionBtn")?.addEventListener("click", openQuestionTypeModal);
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

      card.addEventListener("click", (event) => {
        const action = event.target.closest("[data-action]")?.dataset.action;

        if (action === "drag") return;
        if (action === "select") {
          toggleQuestionSelection(question.id, page);
          renderQuestions();
          renderEditor();
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

        if (event.shiftKey && state.selectedQuestionId) {
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
    });

    updateQuestionActionButtons(page);
  }

  function renderEditor() {
    const question = getSelectedQuestion();
    refs.questionEditor.hidden = !question;
    refs.emptyEditor.hidden = Boolean(question);
    if (refs.removeQuestionBtn) refs.removeQuestionBtn.disabled = !question;

    if (!question) return;

    refs.questionTitleInput.value = question.title || "";
    refs.questionDescriptionInput.value = question.description || "";
    refs.questionRequiredInput.checked = Boolean(question.required);
    refs.questionTypeInput.value = normalizeType(question.type);
    const typeHint = document.getElementById("questionTypeHint");
    if (typeHint) typeHint.textContent = getQuestionTypeHint(question.type);

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
      if (refs.bulkOptionsWrap) refs.bulkOptionsWrap.hidden = true;
      if (refs.bulkOptionsInput) {
        refs.bulkOptionsInput.value = normalizeOptions(question.options).map((option) => option.text).join("\n");
      }
      renderOptions(question);
    } else {
      refs.optionsList.innerHTML = "";
      if (refs.bulkOptionsWrap) refs.bulkOptionsWrap.hidden = true;
      if (refs.bulkOptionsInput) refs.bulkOptionsInput.value = "";
    }
    const optionsTab = refs.questionEditor?.querySelector("[data-editor-section-tab='options']");
    if (optionsTab) {
      optionsTab.disabled = !CHOICE_TYPES.has(question.type);
    }
    if (!CHOICE_TYPES.has(question.type) && state.editorSection === "options") {
      setEditorSection("setup");
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
    const currentPage = getSelectedPage();
    const showLogic = Boolean(question.logicEnabled) && (question.type === "single" || question.type === "select" || question.type === "multiple");
    const jumpChoices = state.survey.pages
      .filter((page) => !currentPage || page.id !== currentPage.id)
      .map((page) => {
        const pageIndex = state.survey.pages.findIndex((item) => item.id === page.id);
        return `<option value="${escapeAttr(String(pageIndex))}">${escapeHtml(page.title || `Страница ${pageIndex + 1}`)}</option>`;
      })
      .join("");

    question.options.forEach((option, index) => {
      const row = document.createElement("div");
      row.className = "constructor-option-row";
      row.innerHTML = `
        <label class="form-row">
          <span>Вариант ${index + 1}</span>
          <input data-role="text" type="text" value="${escapeAttr(option.text || "")}" />
        </label>
        <label class="form-row">
          <span>URL картинки (необязательно)</span>
          <input data-role="imageUrl" type="url" value="${escapeAttr(option.imageUrl || "")}" placeholder="https://..." />
        </label>
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
        <div class="constructor-option-preview" data-role="preview" hidden>
          <img alt="Превью" data-role="previewImg" />
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
      const jumpSelect = row.querySelector("[data-role='jumpToPageIndex']");
      const preview = row.querySelector("[data-role='preview']");
      const previewImg = row.querySelector("[data-role='previewImg']");
      const previewError = row.querySelector("[data-role='previewError']");

      textInput?.addEventListener("input", (event) => {
        option.text = event.target.value;
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
        option.imageUrl = event.target.value.trim();
        updateOptionPreview(preview, previewImg, previewError, option.imageUrl);
        markDirty();
      });

      if (jumpSelect) {
        const resolvedJump = resolveOptionJumpIndex(option);
        jumpSelect.value = Number.isInteger(resolvedJump) ? String(resolvedJump) : "";
        jumpSelect.addEventListener("change", (event) => {
          const value = String(event.target.value || "").trim();
          option.jumpToPageIndex = value === "" ? null : Number(value);
          option.jumpToPageId = "";
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

      updateOptionPreview(preview, previewImg, previewError, option.imageUrl);
      refs.optionsList.appendChild(row);
    });
  }

  function renderSurveyPreview() {
    if (!refs.surveyPreviewList) return;
    const page = getSelectedPage();
    refs.surveyPreviewList.innerHTML = "";

    if (!page || !page.questions.length) {
      refs.surveyPreviewList.innerHTML = `
        <div class="constructor-preview-empty">
          <p>Пока нет вопросов для предпросмотра.</p>
        </div>
      `;
      return;
    }

    page.questions.forEach((question, index) => {
      const block = document.createElement("article");
      block.className = "preview-question";
      block.innerHTML = `
        <h4>${escapeHtml(`${index + 1}. ${question.title || "Новый вопрос"}`)}</h4>
        ${question.description ? `<p>${escapeHtml(question.description)}</p>` : ""}
        <div class="preview-question__body">${renderQuestionCardPreview(question)}</div>
      `;
      refs.surveyPreviewList.appendChild(block);
    });
  }

  function renderQuestionCardPreview(question) {
    const type = normalizeType(question.type);

    if (type === "text") {
      return `<div class="preview-control preview-control--text">Ответ участника...</div>`;
    }

    if (type === "rating") {
      const labels = ensureRatingLabels(question);
      return `
        <div class="preview-control preview-control--rating">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
        ${(labels.low || labels.high) ? `<div class="preview-rating-labels"><span>${escapeHtml(labels.low || "")}</span><span>${escapeHtml(labels.high || "")}</span></div>` : ""}
      `;
    }

    if (type === "select") {
      const options = normalizeOptions(question.options);
      const rendered = options.map((opt) => `<option>${escapeHtml(opt.text)}</option>`).join("");
      return `<select class="preview-control preview-control--select" disabled><option>Выберите вариант</option>${rendered}</select>`;
    }

    const options = normalizeOptions(question.options).slice(0, 3);
    const inputType = type === "single" ? "radio" : "checkbox";
    if (!options.length) {
      return `<div class="preview-control preview-control--text">Добавьте варианты ответа</div>`;
    }
    return `
      <div class="preview-choice-list">
        ${options
          .map(
            (opt) => `
            <label class="preview-choice-item">
              <input type="${inputType}" disabled />
              <span>${escapeHtml(opt.text)}</span>
              ${
                question.logicEnabled && Number.isInteger(resolveOptionJumpIndex(opt))
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

  function openQuestionTypeModal() {
    if (!refs.questionTypeOverlay || !refs.questionTypeOverlay.hidden) return;

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
    cleanupModals();
  }

  async function startNewBlankSurvey() {
    closeCreationEntryModal(false);
    closeTemplateCatalogModal();
    closeTemplatePreviewModal();
    await ensureSurvey();
    await loadSurvey();
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
    refs.templatePreviewName.textContent = template.title || templateKey;
    refs.templatePreviewDescription.textContent = template.description || "Шаблон для быстрого запуска анкеты.";
    const questions = (Array.isArray(template.pages) ? template.pages : [])
      .flatMap((page) => (Array.isArray(page.questions) ? page.questions : []))
      .slice(0, 8);
    refs.templatePreviewQuestions.innerHTML = questions
      .map((q, index) => `<li>${index + 1}. ${escapeHtml(q.title || q.text || "Вопрос")}</li>`)
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

  function renderThemePicker() {
    if (!refs.themeGrid) return;
    refs.themeGrid.innerHTML = "";
    BUILDER_THEMES.forEach((theme) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `constructor-theme-item${theme.id === state.previewThemeId ? " is-active" : ""}`;
      btn.innerHTML = `
        <span class="constructor-theme-item__preview" style="background:${theme.bgColor}"></span>
        <span class="constructor-theme-item__label">${escapeHtml(theme.name)}</span>
      `;
      btn.addEventListener("click", () => {
        state.previewThemeId = theme.id;
        renderThemePicker();
      });
      refs.themeGrid.appendChild(btn);
    });

    const preview = getThemeById(state.previewThemeId);
    refs.themePreviewCard.style.background = preview.bgColor;
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
      bgColor: theme.bgColor
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
    const templates = Object.entries(window.ASKING_TEMPLATES || {}).filter(
      ([key]) => key !== "event" && key !== "vote"
    );
    const selectedCategory = state.selectedTemplateCategory;
    const search = state.templateSearch;

    const filtered = templates.filter(([key, template]) => {
      const category = resolveTemplateCategory(key);
      const passCategory = selectedCategory === "Все категории" || category === selectedCategory;
      const textBlob = `${template.title || ""} ${template.description || ""}`.toLowerCase();
      const passSearch = !search || textBlob.includes(search);
      return passCategory && passSearch;
    });
    if (refs.templateCountBadge) refs.templateCountBadge.textContent = `${filtered.length}/${templates.length} templates`;

    refs.templateCatalogGrid.innerHTML = filtered
      .map(([key, template]) => {
        const category = resolveTemplateCategory(key);
        const tintClass = `constructor-template-card--${String(key).replace(/[^a-z0-9_-]/gi, "")}`;
        const pagesCount = Array.isArray(template.pages) ? template.pages.length : 0;
        const questionsCount = Array.isArray(template.pages)
          ? template.pages.reduce(
              (sum, page) => sum + (Array.isArray(page?.questions) ? page.questions.length : 0),
              0
            )
          : 0;
        return `
          <article class="constructor-template-card ${tintClass}">
            <div class="constructor-template-card__image"></div>
            <div class="constructor-template-card__body">
              <span class="constructor-template-card__cat">${escapeHtml(category)}</span>
              <h4>${escapeHtml(template.title || key)}</h4>
              <p>${escapeHtml(template.description || "")}</p>
              <div class="constructor-template-card__meta">
                <span>${pagesCount} стр.</span>
                <span>${questionsCount} вопр.</span>
              </div>
              <div class="constructor-template-card__actions">
                <button type="button" class="btn btn--outline btn--xs" data-template-preview="${escapeHtml(key)}">Предпросмотр</button>
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
    closeThemePickerModal();
    closeCommandPalette();
    document.body.classList.remove("modal-open");
  }

  function cleanupModals() {
    const open =
      isModalVisible(refs.questionTypeOverlay) ||
      isModalVisible(refs.creationEntryOverlay) ||
      isModalVisible(refs.templateCatalogOverlay) ||
      isModalVisible(refs.templatePreviewOverlay) ||
      isModalVisible(refs.themePickerOverlay) ||
      isModalVisible(refs.commandPaletteOverlay);
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
      design: normalizePageDesign({ themeId: state.activeThemeId }),
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
    return {
      id: createId(),
      type,
      title: String(source.title || source.text || "Новый вопрос"),
      description: String(source.description || source.help || ""),
      required: Boolean(source.required),
      logicEnabled: Boolean(source.logicEnabled),
      options: CHOICE_TYPES.has(type) ? normalizeOptions(source.options) : [],
      ratingLabels: type === "rating" ? { low: "", high: "" } : null,
      rating: type === "rating" ? { minLabel: "", maxLabel: "" } : null
    };
  }

  function addQuestionPresetPack(key) {
    const presetPack = QUESTION_PRESETS[key];
    if (!Array.isArray(presetPack) || !presetPack.length) return;
    const page = ensureSelectedPage();
    const createdIds = [];

    presetPack.forEach((preset) => {
      const normalizedType = normalizeType(preset.type);
      const question = {
        id: createId(),
        type: normalizedType,
        title: String(preset.title || "Новый вопрос"),
        description: String(preset.description || ""),
        required: Boolean(preset.required),
        logicEnabled: false,
        options: CHOICE_TYPES.has(normalizedType)
          ? normalizeOptions(preset.options || [createOption("Вариант 1"), createOption("Вариант 2")])
          : [],
        ratingLabels: normalizedType === "rating" ? { low: "", high: "" } : null,
        rating: normalizedType === "rating" ? { minLabel: "", maxLabel: "" } : null
      };
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
      addQuestion("single", {
        title: "Выберите изображение",
        options: [
          createOption("Вариант 1"),
          createOption("Вариант 2"),
          createOption("Вариант 3")
        ]
      });
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
    const normalizedType = normalizeType(type);

    const question = {
      id: createId(),
      type: normalizedType,
      title: String(preset?.title || "Новый вопрос"),
      description: String(preset?.description || ""),
      required: Boolean(preset?.required),
      logicEnabled: false,
      options: CHOICE_TYPES.has(normalizedType)
        ? normalizeOptions(preset?.options || [createOption("Вариант 1"), createOption("Вариант 2")])
        : [],
      ratingLabels: normalizedType === "rating" ? { low: "", high: "" } : null,
      rating: normalizedType === "rating" ? { minLabel: "", maxLabel: "" } : null
    };

    page.questions.push(question);
    setSingleQuestionSelection(question.id);
    setSettingsPane("question");

    renderAll();
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
        title: String(page.title || `Страница ${pageIndex + 1}`),
        questions: page.questions.map((q, qIndex) => ({
          text: String(q.title || `Вопрос ${qIndex + 1}`),
          helpText: String(q.description || ""),
          type: toApiType(q.type),
          required: Boolean(q.required),
          logicEnabled: Boolean(q.logicEnabled),
          options: CHOICE_TYPES.has(q.type)
            ? normalizeOptions(q.options).map((opt) => ({
                text: opt.text,
                imageUrl: opt.imageUrl || "",
                jumpToPageIndex: Number.isInteger(resolveOptionJumpIndex(opt)) ? resolveOptionJumpIndex(opt) : null
              }))
            : []
        }))
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
    const draft = {
      survey: state.survey,
      selectedPageId: state.selectedPageId,
      selectedQuestionId: state.selectedQuestionId,
      selectedQuestionIds: state.selectedQuestionIds,
      savedAt: Date.now()
    };

    localStorage.setItem(getDraftKey(), JSON.stringify(draft));
    localStorage.setItem("draft_survey", JSON.stringify(draft));
    updateDraftBanner();
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(getDraftKey()) || localStorage.getItem("draft_survey");
      if (!raw) {
        setStatus("Черновик не найден", true);
        return;
      }

      const parsed = JSON.parse(raw);
      const normalized = normalizeDraft(parsed?.survey);
      if (!normalized) throw new Error("Некорректный черновик");

      state.survey = normalized;
      state.selectedPageId = parsed.selectedPageId || state.survey.pages[0]?.id || null;
      state.selectedQuestionId = parsed.selectedQuestionId || getSelectedPage()?.questions[0]?.id || null;
      state.selectedQuestionIds = Array.isArray(parsed.selectedQuestionIds)
        ? parsed.selectedQuestionIds.map((id) => String(id))
        : (state.selectedQuestionId ? [state.selectedQuestionId] : []);

      renderAll();
      recordHistorySnapshot(true);
      setStatus("Черновик восстановлен");
      toast("Черновик восстановлен");
      setSaveState("saving", "Сохранение...");
      markDirty();
    } catch (error) {
      console.error(error);
      setStatus("Не удалось восстановить черновик", true);
    }
  }

  function resetDraft() {
    localStorage.removeItem(getDraftKey());
    localStorage.removeItem("draft_survey");

    state.survey = {
      id: state.survey.id || surveyId,
      title: "Новая анкета",
      description: "",
      pages: [createPage("Страница 1")],
      published: false,
      updatedAt: new Date().toISOString()
    };

    state.selectedPageId = state.survey.pages[0].id;
    state.selectedQuestionId = null;
    state.selectedQuestionIds = [];

    renderAll();
    recordHistorySnapshot(true);
    updateDraftBanner();
    setStatus("Черновик сброшен");
    toast("Черновик сброшен");
    markDirty();
  }

  function updateDraftBanner() {
    const hasDraft = Boolean(localStorage.getItem(getDraftKey()) || localStorage.getItem("draft_survey"));
    refs.draftBanner.hidden = !hasDraft;
  }

  function getDraftKey() {
    return `draft_survey_${surveyId || "new"}`;
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
      tab.classList.toggle("is-active", tab.dataset.panelTab === panel);
    });

    refs.panels.forEach((panelNode) => {
      panelNode.classList.toggle("is-active", panelNode.dataset.panel === panel);
    });
  }

  function focusPanelOnMobile(panel) {
    if (window.innerWidth > 1100) return;
    setMobilePanel(panel);
  }

  function setAdvancedMode(on, notify = false) {
    state.advancedMode = Boolean(on);
    localStorage.setItem(ADVANCED_STORAGE_KEY, state.advancedMode ? "on" : "off");
    document.body.classList.toggle("builder-advanced", state.advancedMode);
    refs.toggleAdvancedBuilderBtn?.setAttribute("aria-pressed", state.advancedMode ? "true" : "false");
    if (refs.toggleAdvancedBuilderBtn) {
      refs.toggleAdvancedBuilderBtn.textContent = state.advancedMode ? "Скрыть расширенное" : "Расширенный режим";
    }
    if (notify) {
      toast(state.advancedMode ? "Расширенный режим включён" : "Расширенный режим выключен");
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
      { id: "save", label: "Сохранить", hint: "Ctrl+S", run: () => saveRemote().then(() => toast("Сохранено")) },
      { id: "openPreview", label: "Открыть предпросмотр", hint: "-", run: () => refs.previewSurveyBtn?.click() }
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
    state.settingsPane = pane === "design" ? "design" : "question";
    const isQuestion = state.settingsPane === "question";
    refs.settingsTabQuestion?.classList.toggle("is-active", isQuestion);
    refs.settingsTabQuestion?.setAttribute("aria-selected", isQuestion ? "true" : "false");
    refs.settingsTabDesign?.classList.toggle("is-active", !isQuestion);
    refs.settingsTabDesign?.setAttribute("aria-selected", !isQuestion ? "true" : "false");
    if (refs.settingsQuestionPane) refs.settingsQuestionPane.hidden = !isQuestion;
    if (refs.settingsDesignPane) refs.settingsDesignPane.hidden = isQuestion;
  }

  function ensureSelectionConsistency() {
    if (!Array.isArray(state.survey.pages) || !state.survey.pages.length) {
      state.survey.pages = [createPage("Страница 1")];
    }

    if (!state.survey.pages.some((page) => page.id === state.selectedPageId)) {
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

    if (!page.questions.some((question) => question.id === state.selectedQuestionId)) {
      state.selectedQuestionId = page.questions[0].id;
    }

    const selectedSet = new Set(page.questions.map((question) => question.id));
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
      const question = {
        id: String(row.id || createId()),
        type,
        title: String(row.text || row.question_text || `Вопрос ${index + 1}`),
        description: String(row.helpText || row.help_text || ""),
        required: Boolean(row.required),
        logicEnabled: Boolean(row.logicEnabled || row.logic_enabled),
        options: CHOICE_TYPES.has(type) ? normalizeOptions(row.options) : [],
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
              return {
                id: String(question.id || createId()),
                type,
                title: String(question.title || `Вопрос ${qIdx + 1}`),
                description: String(question.description || ""),
                required: Boolean(question.required),
                logicEnabled: Boolean(question.logicEnabled),
                options: CHOICE_TYPES.has(type) ? normalizeOptions(question.options) : [],
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
            jumpToPageId: String(item.jumpToPageId || item.targetPageId || ""),
            jumpToPageIndex: parsedJumpIndex
          };
        }

        return null;
      })
      .filter(Boolean);
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

  function getSelectedPage() {
    return state.survey.pages.find((page) => page.id === state.selectedPageId) || null;
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
      overlay: Number.isFinite(overlayValue) ? Math.max(0, Math.min(90, Math.round(overlayValue))) : 0
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
    jumpToPageId: "",
    jumpToPageIndex: null
  };
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
    const label = TYPE_LABELS[normalizeType(question.type)] || "Текст";
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
