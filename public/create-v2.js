(function () {
  const params = new URLSearchParams(window.location.search);
  const surveyIdFromUrl = params.get("surveyId");
  const templateFromUrl = String(params.get("template") || params.get("templateId") || params.get("templateKey") || "").trim().toLowerCase();

  const QUESTION_TYPES = [
    { value: "text", label: "Текст", icon: "T", description: "Короткий ответ с подсказкой и лимитом символов." },
    { value: "participant_name", label: "Имя участника", icon: "ID", description: "Имя респондента для результатов." },
    { value: "participant_email", label: "Email участника", icon: "@", description: "Email респондента с проверкой формата." },
    { value: "long_text", label: "Длинный текст", icon: "TXT", description: "Большое поле для развернутого ответа." },
    { value: "email", label: "Email", icon: "@", description: "Поле для адреса электронной почты." },
    { value: "single", label: "Один выбор", icon: "○", description: "Один вариант из списка." },
    { value: "multi", label: "Несколько вариантов", icon: "☑", description: "Несколько ответов с ограничениями." },
    { value: "dropdown", label: "Выпадающий список", icon: "⌄", description: "Выбор одного варианта из меню." },
    { value: "image_choice", label: "Выбор изображений", icon: "▧", description: "Карточки с изображениями и подписями." },
    { value: "rating", label: "Рейтинг", icon: "★", description: "Оценка по звездной шкале." },
    { value: "nps", label: "NPS", icon: "NPS", description: "Шкала рекомендации от 0 до 10." },
    { value: "info", label: "Информационный блок", icon: "i", description: "Текстовый блок без поля ответа." }
  ];

  const RATIO_OPTIONS = ["1:1", "16:9", "4:3", "3:4"];
  const IMAGE_FIT_OPTIONS = [
    { value: "cover", label: "Заполнение" },
    { value: "contain", label: "Вместить" }
  ];
  const DEFAULT_IMAGE_OPTIONS = [
    {
      text: "Горы",
      description: "Свежий воздух и масштаб",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80"
    },
    {
      text: "Озеро",
      description: "Спокойствие и отражения",
      imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
    },
    {
      text: "Пляж",
      description: "Теплый свет и горизонт",
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80"
    },
    {
      text: "Лес",
      description: "Тишина и глубина",
      imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80"
    }
  ];

  const SURVEY_TEMPLATES = [
    {
      id: "feedback",
      icon: "💬",
      title: "Обратная связь",
      description: "Сбор мнения клиентов",
      questions: 7,
      pages: [
        {
          title: "Основные впечатления",
          questions: [
            ["rating", "Оцените общий опыт взаимодействия"],
            ["single", "Что вам понравилось больше всего?"],
            ["long_text", "Что можно улучшить?"],
            ["nps", "Насколько вероятно, что вы порекомендуете нас?"]
          ]
        },
        {
          title: "Контакты",
          questions: [
            ["email", "Email для обратной связи"],
            ["single", "Можно ли связаться с вами для уточнений?"],
            ["info", "Спасибо за обратную связь"]
          ]
        }
      ]
    },
    {
      id: "service",
      icon: "★",
      title: "Оценка сервиса",
      description: "Качество обслуживания и скорость реакции",
      questions: 6,
      pages: [
        { title: "Сервис", questions: [["rating", "Оцените качество сервиса"], ["rating", "Оцените скорость ответа"], ["single", "Какой канал обращения вы использовали?"]] },
        { title: "Комментарий", questions: [["long_text", "Опишите ваш опыт подробнее"], ["nps", "Порекомендуете ли вы наш сервис?"], ["email", "Email для ответа"]] }
      ]
    },
    {
      id: "hr",
      icon: "👥",
      title: "HR-опрос",
      description: "Пульс команды и вовлеченность",
      questions: 8,
      pages: [
        { title: "Команда", questions: [["rating", "Оцените атмосферу в команде"], ["multi", "Что помогает вам работать эффективнее?"], ["single", "Хватает ли вам обратной связи?"]] },
        { title: "Нагрузка", questions: [["rating", "Оцените уровень нагрузки"], ["long_text", "Что стоит изменить в процессах?"], ["nps", "Насколько вероятно, что вы порекомендуете компанию как место работы?"], ["info", "Ответы будут обработаны в обобщенном виде"], ["text", "Команда или отдел"]] }
      ]
    },
    {
      id: "education",
      icon: "🎓",
      title: "Образование",
      description: "Оценка курса, урока или программы",
      questions: 6,
      pages: [
        { title: "Материал", questions: [["rating", "Оцените понятность материала"], ["single", "Какой формат был полезнее всего?"], ["multi", "Какие темы требуют повторения?"]] },
        { title: "Результат", questions: [["long_text", "Что было самым ценным?"], ["rating", "Оцените работу преподавателя"], ["email", "Email для материалов"]] }
      ]
    },
    {
      id: "event",
      icon: "📅",
      title: "Оценка мероприятия",
      description: "Впечатления участников после события",
      questions: 7,
      pages: [
        { title: "Мероприятие", questions: [["rating", "Оцените мероприятие в целом"], ["single", "Какой блок был самым полезным?"], ["image_choice", "Какая атмосфера ближе всего описывает событие?"]] },
        { title: "Детали", questions: [["rating", "Оцените организацию"], ["multi", "Что стоит улучшить в следующий раз?"], ["nps", "Порекомендуете ли вы следующее мероприятие?"], ["long_text", "Ваш комментарий"]] }
      ]
    },
    {
      id: "blank",
      icon: "+",
      title: "Пустая анкета",
      description: "Чистая структура для нового сценария",
      questions: 1,
      pages: [{ title: "Страница 1", questions: [["text", "Первый вопрос"]] }]
    }
  ];

  const DEFAULT_DESIGN = {
    theme: "corporate",
    primaryColor: "#6C63FF",
    secondaryColor: "#22C55E",
    backgroundColor: "#F6F7FB",
    backgroundImage: "",
    backgroundType: "color",
    overlay: 0,
    gradientStyle: "soft",
    accentColor: "#6C63FF",
    textColor: "#111827",
    cardStyle: "shadow",
    buttonStyle: "filled",
    progressStyle: "top",
    questionNumbers: true,
    animationStyle: "fade",
    layout: "full"
  };

  const DESIGN_THEMES = {
    corporate: {
      label: "Корпоративная",
      primaryColor: "#6C63FF",
      secondaryColor: "#22C55E",
      cardStyle: "shadow",
      buttonStyle: "filled",
      progressStyle: "top"
    },
    nature: {
      label: "Природа",
      primaryColor: "#0F766E",
      secondaryColor: "#84CC16",
      cardStyle: "outlined",
      buttonStyle: "soft",
      progressStyle: "segments",
      recommendedBackground: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80"
    },
    dark: {
      label: "Темная",
      primaryColor: "#8B5CF6",
      secondaryColor: "#38BDF8",
      cardStyle: "shadow",
      buttonStyle: "filled",
      progressStyle: "dots"
    },
    minimal: {
      label: "Минимализм",
      primaryColor: "#111827",
      secondaryColor: "#6B7280",
      cardStyle: "light",
      buttonStyle: "outline",
      progressStyle: "top"
    },
    creative: {
      label: "Креативная",
      primaryColor: "#DB2777",
      secondaryColor: "#F59E0B",
      cardStyle: "shadow",
      buttonStyle: "soft",
      progressStyle: "segments",
      recommendedBackground: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80"
    },
    academic: {
      label: "Академическая",
      primaryColor: "#2563EB",
      secondaryColor: "#7C3AED",
      cardStyle: "outlined",
      buttonStyle: "outline",
      progressStyle: "top"
    }
  };

  const els = {
    constructorView: document.getElementById("constructorView"),
    settingsView: document.getElementById("settingsView"),
    publishView: document.getElementById("publishView"),
    flowNav: document.querySelector(".bv2-flow-nav"),
    title: document.getElementById("surveyTitleInput"),
    saveState: document.getElementById("saveState"),
    pagesList: document.getElementById("pagesList"),
    questionsList: document.getElementById("questionsList"),
    pageTitle: document.getElementById("pageTitleInput"),
    statQuestions: document.getElementById("statQuestions"),
    statTime: document.getElementById("statTime"),
    statLogic: document.getElementById("statLogic"),
    addPage: document.getElementById("addPageBtn"),
    addPageIcon: document.getElementById("addPageIconBtn"),
    deletePage: document.getElementById("deletePageBtn"),
    addQuestion: document.getElementById("addQuestionBtn"),
    addQuestionBottom: document.getElementById("addQuestionBottomBtn"),
    save: document.getElementById("saveBtn"),
    publish: document.getElementById("publishBtn"),
    templates: document.getElementById("templatesBtn"),
    surveySettings: document.getElementById("settingsBtn"),
    preview: document.getElementById("previewBtn"),
    previewTop: document.getElementById("previewTopBtn"),
    toast: document.getElementById("toast"),
    designBgColor: document.getElementById("designBgColor"),
    designGradient: document.getElementById("designGradient"),
    designBgImage: document.getElementById("designBgImage"),
    designBgUpload: document.getElementById("designBgUploadBtn"),
    designBgClear: document.getElementById("designBgClearBtn"),
    designBgFile: document.getElementById("designBgFileInput"),
    designBgPreview: document.getElementById("designBgPreview"),
    designOverlayLabel: document.getElementById("designOverlayLabel"),
    designOverlay: document.getElementById("designOverlay"),
    designLayout: document.getElementById("designLayout"),
    designTabs: document.querySelectorAll("[data-design-tab]"),
    designPanels: document.querySelectorAll("[data-design-panel]"),
    backgroundTypeButtons: document.querySelectorAll("[data-background-type]"),
    backgroundModes: document.querySelectorAll("[data-background-mode]"),
    backgroundColorButtons: document.querySelectorAll("[data-bg-color]"),
    gradientButtons: document.querySelectorAll("[data-gradient-style]"),
    applyRecommendedBg: document.getElementById("applyRecommendedBgBtn"),
    designPrimaryColor: document.getElementById("designPrimaryColor"),
    designSecondaryColor: document.getElementById("designSecondaryColor"),
    designAccentColor: document.getElementById("designAccentColor"),
    designTextColor: document.getElementById("designTextColor"),
    themeCards: document.querySelectorAll("[data-theme]"),
    colorSwatches: document.querySelectorAll("[data-color]"),
    cardStyleButtons: document.querySelectorAll("[data-card-style]"),
    buttonStyleButtons: document.querySelectorAll("[data-button-style]"),
    progressStyleButtons: document.querySelectorAll("[data-progress-style]"),
    animationStyleButtons: document.querySelectorAll("[data-animation-style]"),
    designQuestionNumbers: document.getElementById("designQuestionNumbers"),
    addTypeModal: document.getElementById("addTypeModal"),
    addTypeGrid: document.getElementById("addTypeGrid"),
    addTypeClose: document.getElementById("addTypeCloseBtn"),
    addTypeCancel: document.getElementById("addTypeCancelBtn"),
    modal: document.getElementById("questionModal"),
    modalClose: document.getElementById("modalCloseBtn"),
    modalCancel: document.getElementById("modalCancelBtn"),
    modalApply: document.getElementById("modalApplyBtn"),
    modalDelete: document.getElementById("modalDeleteBtn"),
    modalTitle: document.getElementById("modalQuestionTitle"),
    modalDescription: document.getElementById("modalQuestionDescription"),
    modalType: document.getElementById("modalQuestionType"),
    modalRequired: document.getElementById("modalQuestionRequired"),
    typeSpecific: document.getElementById("typeSpecificFields"),
    templatesModal: document.getElementById("templatesModal"),
    templatesGrid: document.getElementById("templatesGrid"),
    templatesClose: document.getElementById("templatesCloseBtn"),
    templatesCancel: document.getElementById("templatesCancelBtn"),
    templateConfirmModal: document.getElementById("templateConfirmModal"),
    templateConfirmClose: document.getElementById("templateConfirmCloseBtn"),
    templateConfirmCancel: document.getElementById("templateConfirmCancelBtn"),
    templateConfirmApply: document.getElementById("templateConfirmApplyBtn"),
    settingsBackTop: document.getElementById("settingsBackTopBtn"),
    settingsBack: document.getElementById("settingsBackBtn"),
    settingsToPublish: document.getElementById("settingsToPublishBtn"),
    settingsTitle: document.getElementById("settingsTitleInput"),
    settingsDescription: document.getElementById("settingsDescriptionInput"),
    settingsLanguage: document.getElementById("settingsLanguageSelect"),
    welcomeTitle: document.getElementById("welcomeTitleInput"),
    welcomeSubtitle: document.getElementById("welcomeSubtitleInput"),
    welcomeDescription: document.getElementById("welcomeDescriptionInput"),
    welcomeButtonText: document.getElementById("welcomeButtonTextInput"),
    welcomeCover: document.getElementById("welcomeCoverInput"),
    welcomeCoverUpload: document.getElementById("welcomeCoverUploadBtn"),
    welcomeCoverFile: document.getElementById("welcomeCoverFileInput"),
    welcomeBg: document.getElementById("welcomeBgInput"),
    welcomeBgUpload: document.getElementById("welcomeBgUploadBtn"),
    welcomeBgFile: document.getElementById("welcomeBgFileInput"),
    welcomeOverlay: document.getElementById("welcomeOverlayInput"),
    welcomePreviewCard: document.getElementById("welcomePreviewCard"),
    welcomePreviewTitle: document.getElementById("welcomePreviewTitle"),
    welcomePreviewSubtitle: document.getElementById("welcomePreviewSubtitle"),
    welcomePreviewDescription: document.getElementById("welcomePreviewDescription"),
    welcomePreviewButton: document.getElementById("welcomePreviewButton"),
    settingsPassword: document.getElementById("settingsPasswordInput"),
    settingsPublic: document.getElementById("settingsPublicInput"),
    settingsHidden: document.getElementById("settingsHiddenInput"),
    settingsEndsAt: document.getElementById("settingsEndsAtInput"),
    settingsResponseLimit: document.getElementById("settingsResponseLimitInput"),
    settingsTimeLimit: document.getElementById("settingsTimeLimitInput"),
    settingsShowProgress: document.getElementById("settingsShowProgressInput"),
    settingsAllowBack: document.getElementById("settingsAllowBackInput"),
    settingsShowNumbers: document.getElementById("settingsShowNumbersInput"),
    previewModal: document.getElementById("previewModal"),
    previewBack: document.getElementById("previewBackBtn"),
    previewStage: document.getElementById("previewStage"),
    previewSurveyTitle: document.getElementById("previewSurveyTitle"),
    previewThemeBadge: document.getElementById("previewThemeBadge"),
    previewIndicator: document.getElementById("previewIndicator"),
    publishStatusBadge: document.getElementById("publishStatusBadge"),
    publishUrl: document.getElementById("publishUrlInput"),
    copyPublishUrl: document.getElementById("copyPublishUrlBtn"),
    publishQrImage: document.getElementById("publishQrImage"),
    downloadQr: document.getElementById("downloadQrLink"),
    publishInfoGrid: document.getElementById("publishInfoGrid"),
    publishBack: document.getElementById("publishBackBtn"),
    openSurveyLink: document.getElementById("openSurveyLink"),
    publishSurvey: document.getElementById("publishSurveyBtn"),
    onboardingStart: document.getElementById("onboardingStartBtn"),
    onboarding: document.getElementById("builderOnboarding"),
    onboardingSpotlight: document.getElementById("onboardingSpotlight"),
    onboardingCard: document.getElementById("onboardingCard"),
    onboardingStepLabel: document.getElementById("onboardingStepLabel"),
    onboardingTitle: document.getElementById("onboardingTitle"),
    onboardingText: document.getElementById("onboardingText"),
    onboardingSubtext: document.getElementById("onboardingSubtext"),
    onboardingDots: document.getElementById("onboardingDots"),
    onboardingNext: document.getElementById("onboardingNextBtn"),
    onboardingClose: document.getElementById("onboardingCloseBtn"),
    onboardingDone: document.getElementById("onboardingDoneCard"),
    onboardingCreateQuestion: document.getElementById("onboardingCreateQuestionBtn"),
    onboardingDoneClose: document.getElementById("onboardingDoneCloseBtn")
  };

  const state = {
    surveyId: surveyIdFromUrl ? Number(surveyIdFromUrl) : null,
    status: "draft",
    activePageId: null,
    editingQuestionId: null,
    selectedQuestionId: null,
    pendingTemplateId: null,
    previewPageIndex: 0,
    previewQuestionIndex: 0,
    previewStep: "welcome",
    previewDirection: "next",
    previewTransitioning: false,
    previewAnswers: {},
    design: { ...DEFAULT_DESIGN },
    survey: {
      title: "Новая анкета",
      description: "",
      audience: "",
      allowMultipleResponses: false,
      startsAt: null,
      endsAt: null,
      responseLimit: null,
      timeLimitSeconds: null,
      settings: {
        language: "ru",
        accessPassword: "",
        isPublic: true,
        isHidden: false,
        thanksTitle: "Спасибо!",
        thanksText: "Ваши ответы сохранены.",
        welcomeTitle: "Название анкеты",
        welcomeSubtitle: "Добро пожаловать",
        welcomeDescription: "Описание анкеты",
        welcomeButtonText: "Начать опрос",
        welcomeCover: "",
        welcomeBackground: "",
        welcomeOverlay: 24,
        showProgress: true,
        allowBack: true,
        showQuestionNumbers: true
      },
      pages: [createPage("Страница 1")]
    }
  };

  const ONBOARDING_STORAGE_KEY = "asking_builder_v2_onboarding_complete";
  const onboardingState = {
    active: false,
    step: 0,
    resizeTimer: null
  };

  const ONBOARDING_STEPS = [
    {
      selector: ".bv2-pages",
      title: "Страницы",
      text: "Страницы позволяют разделить анкету на логические блоки.",
      subtext: "Можно создавать многостраничные сценарии прохождения."
    },
    {
      selector: "#addQuestionBtn",
      title: "Вопросы",
      text: "Добавляйте вопросы разных типов.",
      subtext: "Текст, выбор, рейтинг, изображения и другие варианты."
    },
    {
      selector: ".bv2-design",
      title: "Дизайн",
      text: "Настройте внешний вид анкеты.",
      subtext: "Темы, цвета, фоновые изображения и оформление."
    },
    {
      selector: ".bv2-flow-nav",
      title: "Настройки и публикация",
      text: "После создания анкеты настройте доступ и опубликуйте ссылку для участников.",
      subtext: ""
    }
  ];

  function createId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function createPage(title) {
    return {
      id: createId("page"),
      title: title || "Страница",
      design: { themeId: "lavender", bgColor: "#F6F7FB", bgImage: "", layout: "full", overlay: 0 },
      questions: []
    };
  }

  function createOption(text, imageUrl, description = "") {
    return {
      id: createId("option"),
      text,
      imageUrl: imageUrl || "",
      description,
      imageFit: "cover",
      imageScale: 100,
      jumpToPageId: "",
      jumpToPageIndex: null
    };
  }

  function defaultOptions(type) {
    if (["single", "multi", "dropdown"].includes(type)) {
      return [createOption("Вариант 1"), createOption("Вариант 2"), createOption("Вариант 3")];
    }
    if (type === "image_choice") {
      return DEFAULT_IMAGE_OPTIONS.map((item) => createOption(item.text, item.imageUrl, item.description));
    }
    return [];
  }

  function defaultSettings(type) {
    return {
      placeholder: type === "email" || type === "participant_email" ? "name@company.com" : type === "participant_name" ? "Имя и фамилия" : "Введите ответ...",
      characterLimit: type === "long_text" ? 500 : 120,
      randomize: false,
      minSelections: 1,
      maxSelections: 3,
      aspectRatio: type === "image_choice" ? "16:9" : "1:1",
      imageFit: "cover",
      ratingScale: 5,
      npsLeftLabel: "Совсем не вероятно",
      npsRightLabel: "Очень вероятно",
      infoContent: "Добавьте пояснение перед следующим вопросом.",
      infoIcon: "i"
    };
  }

  function defaultQuestionTitle(type) {
    return {
      text: "Как вас зовут?",
      participant_name: "Имя участника",
      participant_email: "Email участника",
      long_text: "Расскажите подробнее",
      email: "Укажите ваш Email",
      single: "Выберите один вариант",
      multi: "Выберите подходящие варианты",
      dropdown: "Выберите вариант из списка",
      image_choice: "Какое изображение вам ближе?",
      rating: "Оцените ваш опыт",
      nps: "Насколько вероятно, что вы нас порекомендуете?",
      info: "Важная информация"
    }[type] || "Новый вопрос";
  }

  function normalizeType(type) {
    const raw = String(type || "").trim().toLowerCase();
    if (raw === "multiple") return "multi";
    if (raw === "select") return "dropdown";
    if (raw === "image") return "image_choice";
    if (raw === "textarea") return "long_text";
    if (raw === "name" || raw === "respondent_name") return "participant_name";
    if (raw === "respondent_email") return "participant_email";
    return QUESTION_TYPES.some((item) => item.value === raw) ? raw : "single";
  }

  function apiType(type) {
    const normalized = normalizeType(type);
    if (["single", "multi", "dropdown", "rating", "text", "participant_name", "participant_email"].includes(normalized)) return normalized;
    if (normalized === "image_choice") return "single";
    if (normalized === "nps") return "rating";
    return "text";
  }

  function createQuestion(type) {
    const resolvedType = normalizeType(type);
    return {
      id: createId("question"),
      text: defaultQuestionTitle(resolvedType),
      helpText: "",
      type: resolvedType,
      required: resolvedType !== "info",
      panelOpacity: 72,
      imageUrl: "",
      options: defaultOptions(resolvedType),
      settings: defaultSettings(resolvedType)
    };
  }

  function createQuestionFromTemplate(type, title) {
    const question = createQuestion(type);
    question.text = title || question.text;
    if (question.type === "single") {
      question.options = [createOption("Качество"), createOption("Скорость"), createOption("Поддержка")];
    }
    if (question.type === "multi") {
      question.options = [createOption("Коммуникация"), createOption("Процессы"), createOption("Материалы"), createOption("Поддержка")];
    }
    if (question.type === "dropdown") {
      question.options = [createOption("Вариант 1"), createOption("Вариант 2"), createOption("Вариант 3")];
    }
    return question;
  }

  function pageHasContent() {
    return state.survey.pages.some((page) => (page.questions || []).length > 0 || String(page.title || "").trim() !== "Страница 1");
  }

  function applyTemplate(templateId) {
    const template = SURVEY_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    state.survey.pages = template.pages.map((page) => ({
      id: createId("page"),
      title: page.title,
      design: { themeId: "lavender", bgColor: "#F6F7FB", bgImage: "", layout: "full", overlay: 0 },
      questions: page.questions.map(([type, title]) => createQuestionFromTemplate(type, title))
    }));
    state.survey.title = template.title === "Пустая анкета" ? "Новая анкета" : template.title;
    state.survey.description = template.description;
    state.activePageId = state.survey.pages[0]?.id || null;
    state.selectedQuestionId = state.survey.pages[0]?.questions[0]?.id || null;
    markDirty();
    closeTemplateConfirmModal();
    closeTemplatesModal();
    render();
    showToast("Шаблон применен");
  }

  function activePage() {
    return state.survey.pages.find((page) => String(page.id) === String(state.activePageId)) || state.survey.pages[0];
  }

  function allQuestions() {
    return state.survey.pages.flatMap((page) => page.questions || []);
  }

  function typeMeta(type) {
    return QUESTION_TYPES.find((item) => item.value === normalizeType(type)) || QUESTION_TYPES[0];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#96;");
  }

  function showToast(message, isError) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.toggle("is-error", Boolean(isError));
    els.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      els.toast.hidden = true;
    }, 2600);
  }

  function markDirty() {
    els.saveState.textContent = "Есть несохраненные изменения";
    els.saveState.style.color = "#b45309";
  }

  async function apiRequest(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Ошибка запроса");
    return data;
  }

  async function uploadImageFile(file) {
    if (!file) throw new Error("Выберите изображение");
    const formData = new FormData();
    formData.append("file", file);
    const result = await apiRequest("/api/uploads/image", { method: "POST", body: formData });
    const path = String(result?.path || "").trim();
    if (!path) throw new Error("Сервер не вернул путь файла");
    return path;
  }

  function render() {
    if (!state.activePageId && state.survey.pages[0]) state.activePageId = state.survey.pages[0].id;
    const page = activePage();
    els.title.value = state.survey.title || "Новая анкета";
    els.pageTitle.value = page?.title || "Страница";
    renderPages();
    renderQuestions();
    renderStats();
    applyDesignState({ renderPreview: false });
  }

  function renderPages() {
    els.pagesList.innerHTML = state.survey.pages
      .map((page, index) => {
        const count = Array.isArray(page.questions) ? page.questions.length : 0;
        const active = String(page.id) === String(state.activePageId);
        return `
          <button class="bv2-page-item${active ? " is-active" : ""}" type="button" data-page-id="${escapeHtml(page.id)}">
            <span class="bv2-page-index">${index + 1}</span>
            <span>
              <strong>${escapeHtml(page.title || `Страница ${index + 1}`)}</strong>
              <span>${count} ${plural(count, ["вопрос", "вопроса", "вопросов"])}</span>
            </span>
          </button>
        `;
      })
      .join("");
  }

  function renderQuestions() {
    const page = activePage();
    const questions = Array.isArray(page?.questions) ? page.questions : [];
    if (!questions.length) {
      els.questionsList.innerHTML = `
        <div class="bv2-empty">
          <div class="bv2-empty__icon">+</div>
          <h3>На этой странице пока нет вопросов</h3>
          <p>Добавьте первый вопрос, чтобы начать собирать анкету</p>
          <button class="bv2-btn bv2-btn--primary" type="button" data-empty-add>+ Добавить вопрос</button>
          <small>Можно добавить текст, выбор, рейтинг или изображения</small>
        </div>
      `;
      return;
    }

    els.questionsList.innerHTML = questions.map((question, index) => renderQuestionCard(question, index)).join("");
  }

  function renderQuestionCard(question, index) {
    const meta = typeMeta(question.type);
    const selected = String(question.id) === String(state.selectedQuestionId);
    const required = question.required ? '<span class="bv2-badge bv2-badge--required">Обязательный</span>' : "";
    return `
      <article class="bv2-question-card ${selected ? "is-selected" : ""} bv2-question-card--${escapeAttr(normalizeType(question.type))}" data-question-id="${escapeHtml(question.id)}">
        <div class="bv2-qnum">${index + 1}</div>
        <div class="bv2-question-main">
          <div class="bv2-question-headline">
            <span class="bv2-qicon">${escapeHtml(meta.icon)}</span>
            <div>
              <h3>${escapeHtml(question.text || "Без названия")}</h3>
              ${question.helpText ? `<p>${escapeHtml(question.helpText)}</p>` : ""}
            </div>
          </div>
          <div class="bv2-qmeta">
            <span class="bv2-badge">${escapeHtml(meta.label)}</span>
            ${required}
          </div>
          <div class="bv2-preview">${renderAnswerPreview(question)}</div>
        </div>
        <div class="bv2-card-actions">
          <button type="button" title="Редактировать" data-edit-question="${escapeHtml(question.id)}">✎</button>
          <button type="button" title="Дублировать" data-duplicate-question="${escapeHtml(question.id)}">⧉</button>
          <button type="button" title="Удалить" data-delete-question="${escapeHtml(question.id)}">×</button>
        </div>
      </article>
    `;
  }

  function renderAnswerPreview(question) {
    const type = normalizeType(question.type);
    const settings = question.settings || defaultSettings(type);
    const options = Array.isArray(question.options) ? question.options : [];
    if (type === "text" || type === "participant_name") return `<div class="bv2-input-preview">${escapeHtml(settings.placeholder || "Введите ответ...")}</div>`;
    if (type === "long_text") return `<div class="bv2-textarea-preview">${escapeHtml(settings.placeholder || "Введите развернутый ответ...")}</div>`;
    if (type === "email" || type === "participant_email") return `<div class="bv2-input-preview bv2-input-preview--email">name@company.com</div>`;
    if (type === "single") return renderChoicePreview(options, "radio");
    if (type === "multi") return renderChoicePreview(options, "checkbox");
    if (type === "dropdown") return `<div class="bv2-select-preview">Выберите вариант <span>⌄</span></div>`;
    if (type === "image_choice") return renderImageChoicePreview(question);
    if (type === "rating") return `<div class="bv2-rating-preview">${"★".repeat(Number(settings.ratingScale || 5))}</div>`;
    if (type === "nps") return `<div class="bv2-nps-preview">${Array.from({ length: 11 }, (_, index) => `<span>${index}</span>`).join("")}</div>`;
    if (type === "info") {
      return `
        <div class="bv2-info-preview">
          <span>${escapeHtml(settings.infoIcon || "i")}</span>
          <div>
            <strong>${escapeHtml(settings.infoContent || question.text || "Информационный блок")}</strong>
            ${question.helpText ? `<p>${escapeHtml(question.helpText)}</p>` : ""}
          </div>
        </div>
      `;
    }
    return `<div class="bv2-input-preview">Предпросмотр ответа</div>`;
  }

  function renderChoicePreview(options, mode) {
    const visible = options.length ? options : defaultOptions(mode === "radio" ? "single" : "multi");
    return `<div class="bv2-choice-preview bv2-choice-preview--${mode}">${visible
      .slice(0, 3)
      .map((option) => `<span><i></i>${escapeHtml(option.text || "Вариант")}</span>`)
      .join("")}</div>`;
  }

  function renderImageChoicePreview(question) {
    const settings = question.settings || defaultSettings("image_choice");
    const options = Array.isArray(question.options) && question.options.length ? question.options : defaultOptions("image_choice");
    const ratioClass = `is-ratio-${String(settings.aspectRatio || "16:9").replace(":", "-")}`;
    return `
      <div class="bv2-image-preview ${ratioClass}">
        ${options
          .slice(0, 4)
          .map(
            (option) => `
              <div class="bv2-image-option">
                <img src="${escapeAttr(option.imageUrl || DEFAULT_IMAGE_OPTIONS[0].imageUrl)}" alt="${escapeAttr(option.text || "Вариант")}" loading="lazy" />
                <strong>${escapeHtml(option.text || "Вариант")}</strong>
                ${option.description ? `<span>${escapeHtml(option.description)}</span>` : ""}
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderStats() {
    const questions = allQuestions();
    const logic = questions.filter((question) => (question.options || []).some((option) => option.jumpToPageId || Number.isInteger(option.jumpToPageIndex))).length;
    els.statQuestions.textContent = String(questions.length);
    els.statTime.textContent = `${Math.max(1, Math.ceil(questions.length * 0.45))} мин`;
    els.statLogic.textContent = String(logic);
  }

  function plural(count, forms) {
    const n = Math.abs(Number(count));
    if (n % 10 === 1 && n % 100 !== 11) return forms[0];
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return forms[1];
    return forms[2];
  }

  function normalizeDesign(design = {}) {
    const theme = DESIGN_THEMES[design.theme] ? design.theme : DEFAULT_DESIGN.theme;
    const cardAliases = { soft: "shadow", elevated: "shadow", flat: "light" };
    const progressAliases = { rounded: "segments", minimal: "dots" };
    const rawImage = String(design.backgroundImage || design.bgImage || "").trim();
    const blockedImage = /encrypted-tbn\d*\.gstatic\.com/i.test(rawImage);
    return {
      ...DEFAULT_DESIGN,
      ...DESIGN_THEMES[theme],
      ...design,
      theme,
      primaryColor: design.primaryColor || DESIGN_THEMES[theme].primaryColor,
      secondaryColor: design.secondaryColor || DESIGN_THEMES[theme].secondaryColor,
      accentColor: design.accentColor || design.primaryColor || DESIGN_THEMES[theme].primaryColor,
      textColor: design.textColor || DEFAULT_DESIGN.textColor,
      backgroundColor: design.backgroundColor || design.bgColor || DEFAULT_DESIGN.backgroundColor,
      backgroundImage: blockedImage ? "" : rawImage,
      backgroundType: design.backgroundType || (rawImage && !blockedImage ? "image" : (design.gradientStyle && design.gradientStyle !== "none" ? "gradient" : "color")),
      overlay: Number.isFinite(Number(design.overlay)) ? Number(design.overlay) : DEFAULT_DESIGN.overlay,
      gradientStyle: design.gradientStyle || design.gradient || DESIGN_THEMES[theme].gradientStyle || DEFAULT_DESIGN.gradientStyle,
      cardStyle: cardAliases[design.cardStyle] || design.cardStyle || DESIGN_THEMES[theme].cardStyle,
      buttonStyle: design.buttonStyle || DESIGN_THEMES[theme].buttonStyle,
      progressStyle: progressAliases[design.progressStyle] || design.progressStyle || DESIGN_THEMES[theme].progressStyle,
      questionNumbers: design.questionNumbers !== false,
      animationStyle: design.animationStyle || DEFAULT_DESIGN.animationStyle,
      layout: design.layout || DEFAULT_DESIGN.layout
    };
  }

  function colorToRgb(hex) {
    const value = String(hex || "").replace("#", "");
    const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value.padEnd(6, "0").slice(0, 6);
    const numeric = Number.parseInt(full, 16);
    return {
      r: (numeric >> 16) & 255,
      g: (numeric >> 8) & 255,
      b: numeric & 255
    };
  }

  function colorAlpha(hex, alpha) {
    const rgb = colorToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function gradientBackground(design) {
    if (design.gradientStyle === "none") return design.backgroundColor;
    if (design.gradientStyle === "contrast") {
      return `linear-gradient(135deg, ${colorAlpha(design.primaryColor, 0.20)}, ${colorAlpha(design.secondaryColor, 0.14)}), ${design.backgroundColor}`;
    }
    if (design.gradientStyle === "dark") return "linear-gradient(135deg, #111827, #312E81)";
    if (design.gradientStyle === "sunset") return "linear-gradient(135deg, #FFF7ED, #FDBA74, #DB2777)";
    if (design.gradientStyle === "forest") return "linear-gradient(135deg, #F0FDF4, #86EFAC, #0F766E)";
    if (design.gradientStyle === "academic") return "linear-gradient(135deg, #EFF6FF, #DBEAFE, #2563EB)";
    return `radial-gradient(circle at 18% 0%, ${colorAlpha(design.primaryColor, 0.14)}, transparent 34%), ${design.backgroundColor}`;
  }

  function designBackground(design) {
    const base = design.backgroundType === "gradient" ? gradientBackground(design) : design.backgroundColor;
    if (design.backgroundType !== "image" || !design.backgroundImage) return base;
    const overlay = Math.max(0, Math.min(90, Number(design.overlay || 0))) / 100;
    return `linear-gradient(rgba(17,24,39,${overlay}), rgba(17,24,39,${overlay})), url("${design.backgroundImage}"), ${base}`;
  }

  function welcomeDesignFromSettings(existingWelcome = {}) {
    const settings = state.survey.settings || {};
    const overlay = Number(settings.welcomeOverlay);
    const coverImage = String(settings.welcomeCover || existingWelcome.coverImage || "").trim();
    return {
      ...existingWelcome,
      welcomeTitle: String(settings.welcomeTitle || state.survey.title || "").trim(),
      welcomeSubtitle: String(settings.welcomeSubtitle || "Добро пожаловать").trim(),
      welcomeDescription: String(settings.welcomeDescription || state.survey.description || "").trim(),
      welcomeButtonText: String(settings.welcomeButtonText || "Начать опрос").trim(),
      welcomeCoverImage: coverImage,
      welcomeBackgroundImage: String(settings.welcomeBackground || existingWelcome.welcomeBackgroundImage || existingWelcome.backgroundImage || "").trim(),
      welcomeOverlayStrength: Number.isFinite(overlay) ? Math.max(0, Math.min(90, Math.round(overlay))) : Math.max(0, Math.min(90, Number(state.design.overlay || 0))),
      title: String(settings.welcomeTitle || state.survey.title || "").trim(),
      subtitle: String(settings.welcomeSubtitle || "Добро пожаловать").trim(),
      description: String(settings.welcomeDescription || state.survey.description || "").trim(),
      buttonText: String(settings.welcomeButtonText || "Начать опрос").trim(),
      coverImage,
      backgroundImage: String(settings.welcomeBackground || existingWelcome.welcomeBackgroundImage || existingWelcome.backgroundImage || "").trim(),
      overlay: Number.isFinite(overlay) ? Math.max(0, Math.min(90, Math.round(overlay))) : Math.max(0, Math.min(90, Number(state.design.overlay || 0))),
      layout: existingWelcome.layout || "image-right",
      imageOpacity: Number.isFinite(Number(existingWelcome.imageOpacity)) ? Number(existingWelcome.imageOpacity) : 86,
      imageEnabled: existingWelcome.imageEnabled !== false && Boolean(coverImage)
    };
  }

  function persistDesignToPages() {
    state.survey.pages.forEach((page) => {
      const previousDesign = page.design || {};
      page.design = {
        ...previousDesign,
        ...state.design,
        builderV2Design: { ...state.design },
        bgColor: state.design.backgroundColor,
        bgImage: state.design.backgroundImage,
        overlay: state.design.overlay,
        layout: state.design.layout,
        welcome: welcomeDesignFromSettings(previousDesign.welcome || {})
      };
    });
  }

  function applyDesignState({ dirty = false, renderPreview = true } = {}) {
    state.design = normalizeDesign(state.design);
    persistDesignToPages();
    const root = document.body;
    root.dataset.theme = state.design.theme;
    root.dataset.cardStyle = state.design.cardStyle;
    root.dataset.buttonStyle = state.design.buttonStyle;
    root.dataset.progressStyle = state.design.progressStyle;
    root.dataset.animationStyle = state.design.animationStyle;
    root.style.setProperty("--bv2-accent", state.design.primaryColor);
    root.style.setProperty("--bv2-accent-dark", state.design.primaryColor);
    root.style.setProperty("--bv2-secondary", state.design.secondaryColor);
    root.style.setProperty("--bv2-ui-accent", state.design.accentColor);
    root.style.setProperty("--bv2-text", state.design.textColor);
    root.style.setProperty("--bv2-soft", colorAlpha(state.design.primaryColor, 0.11));
    root.style.setProperty("--bv2-design-bg", designBackground(state.design));
    root.style.setProperty("--bv2-design-bg-color", state.design.backgroundColor);
    root.style.setProperty("--bv2-design-overlay", String(Math.max(0, Math.min(90, Number(state.design.overlay || 0))) / 100));
    state.survey.settings = {
      ...(state.survey.settings || {}),
      showQuestionNumbers: state.design.questionNumbers !== false
    };
    if (els.previewStage) els.previewStage.style.setProperty("--preview-bg", designBackground(state.design));
    syncDesignControls();
    if (renderPreview && els.previewModal && !els.previewModal.hidden) renderPreviewV2();
    if (dirty) markDirty();
  }

  function syncDesignControls() {
    const design = normalizeDesign(state.design);
    els.designBgColor.value = design.backgroundColor;
    els.designGradient.value = design.gradientStyle;
    els.designBgImage.value = design.backgroundImage;
    els.designOverlay.value = String(design.overlay);
    els.designOverlayLabel.textContent = `Затемнение: ${design.overlay}%`;
    els.designLayout.value = design.layout;
    els.designPrimaryColor.value = design.primaryColor;
    els.designSecondaryColor.value = design.secondaryColor;
    els.designAccentColor.value = design.accentColor;
    els.designTextColor.value = design.textColor;
    els.designQuestionNumbers.checked = design.questionNumbers !== false;
    els.themeCards.forEach((node) => node.classList.toggle("is-active", node.dataset.theme === design.theme));
    els.colorSwatches.forEach((node) => node.classList.toggle("is-active", node.dataset.color?.toLowerCase() === design.primaryColor.toLowerCase()));
    els.backgroundColorButtons.forEach((node) => node.classList.toggle("is-active", node.dataset.bgColor?.toLowerCase() === design.backgroundColor.toLowerCase()));
    els.gradientButtons.forEach((node) => node.classList.toggle("is-active", node.dataset.gradientStyle === design.gradientStyle));
    els.backgroundTypeButtons.forEach((node) => node.classList.toggle("is-active", node.dataset.backgroundType === design.backgroundType));
    els.backgroundModes.forEach((node) => {
      const active = node.dataset.backgroundMode === design.backgroundType;
      node.hidden = !active;
      node.classList.toggle("is-active", active);
    });
    els.cardStyleButtons.forEach((node) => node.classList.toggle("is-active", node.dataset.cardStyle === design.cardStyle));
    els.buttonStyleButtons.forEach((node) => node.classList.toggle("is-active", node.dataset.buttonStyle === design.buttonStyle));
    els.progressStyleButtons.forEach((node) => node.classList.toggle("is-active", node.dataset.progressStyle === design.progressStyle));
    els.animationStyleButtons.forEach((node) => node.classList.toggle("is-active", node.dataset.animationStyle === design.animationStyle));
    if (els.designBgPreview) {
      if (design.backgroundImage) els.designBgPreview.src = design.backgroundImage;
      else els.designBgPreview.removeAttribute("src");
      els.designBgPreview.parentElement.hidden = !design.backgroundImage;
    }
  }

  function showDesignTab(tab) {
    const target = ["themes", "background", "colors", "elements"].includes(tab) ? tab : "themes";
    els.designTabs.forEach((node) => node.classList.toggle("is-active", node.dataset.designTab === target));
    els.designPanels.forEach((node) => {
      const active = node.dataset.designPanel === target;
      node.hidden = !active;
      node.classList.toggle("is-active", active);
    });
  }

  function anyModalOpen() {
    return [els.addTypeModal, els.modal, els.templatesModal, els.templateConfirmModal].some((node) => node && !node.hidden);
  }

  function syncModalBodyLock() {
    document.body.classList.toggle("bv2-modal-open", anyModalOpen() || (els.previewModal && !els.previewModal.hidden));
  }

  function openTemplatesModal() {
    renderTemplates();
    els.templatesModal.hidden = false;
    syncModalBodyLock();
  }

  function closeTemplatesModal() {
    els.templatesModal.hidden = true;
    syncModalBodyLock();
  }

  function openTemplateConfirmModal(templateId) {
    state.pendingTemplateId = templateId;
    els.templateConfirmModal.hidden = false;
    syncModalBodyLock();
  }

  function closeTemplateConfirmModal() {
    state.pendingTemplateId = null;
    els.templateConfirmModal.hidden = true;
    syncModalBodyLock();
  }

  function renderTemplates() {
    els.templatesGrid.innerHTML = SURVEY_TEMPLATES.map(
      (template) => `
        <article class="bv2-template-card">
          <div class="bv2-template-card__icon">${escapeHtml(template.icon)}</div>
          <div>
            <h3>${escapeHtml(template.title)}</h3>
            <p>${escapeHtml(template.description)}</p>
            <span>${template.questions} ${plural(template.questions, ["вопрос", "вопроса", "вопросов"])}</span>
          </div>
          <button class="bv2-btn bv2-btn--primary" type="button" data-template-use="${escapeAttr(template.id)}">Использовать</button>
        </article>
      `
    ).join("");
  }

  function showStep(step) {
    const target = ["constructor", "settings", "publish"].includes(step) ? step : "constructor";
    [
      [els.constructorView, "constructor"],
      [els.settingsView, "settings"],
      [els.publishView, "publish"]
    ].forEach(([node, name]) => {
      if (!node) return;
      const active = name === target;
      node.hidden = !active;
      node.classList.toggle("bv2-step-view--active", active);
    });
    els.flowNav?.querySelectorAll("[data-flow-target]").forEach((button) => {
      button.classList.toggle("is-active", button.getAttribute("data-flow-target") === target);
    });
    if (target === "settings") syncSettingsScreen();
    if (target === "publish") renderPublishScreen();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function currentStep() {
    if (!els.settingsView?.hidden) return "settings";
    if (!els.publishView?.hidden) return "publish";
    return "constructor";
  }

  function syncSettingsScreen() {
    const settings = state.survey.settings || {};
    els.settingsTitle.value = state.survey.title || "";
    els.settingsDescription.value = state.survey.description || "";
    els.settingsLanguage.value = settings.language || "ru";
    els.welcomeTitle.value = settings.welcomeTitle || state.survey.title || "Название анкеты";
    els.welcomeSubtitle.value = settings.welcomeSubtitle || "Добро пожаловать";
    els.welcomeDescription.value = settings.welcomeDescription || state.survey.description || "Описание анкеты";
    els.welcomeButtonText.value = settings.welcomeButtonText || "Начать опрос";
    els.welcomeCover.value = settings.welcomeCover || "";
    els.welcomeBg.value = settings.welcomeBackground || "";
    els.welcomeOverlay.value = Number.isFinite(Number(settings.welcomeOverlay)) ? String(settings.welcomeOverlay) : "24";
    els.settingsPassword.value = settings.accessPassword || "";
    els.settingsPublic.checked = settings.isPublic !== false;
    els.settingsHidden.checked = Boolean(settings.isHidden);
    els.settingsEndsAt.value = state.survey.endsAt ? String(state.survey.endsAt).slice(0, 10) : "";
    els.settingsResponseLimit.value = state.survey.responseLimit || "";
    if (els.settingsTimeLimit) els.settingsTimeLimit.value = state.survey.timeLimitSeconds ? String(Math.ceil(Number(state.survey.timeLimitSeconds) / 60)) : "";
    els.settingsShowProgress.checked = settings.showProgress !== false;
    els.settingsAllowBack.checked = settings.allowBack !== false;
    els.settingsShowNumbers.checked = settings.showQuestionNumbers !== false;
    renderWelcomePreview();
  }

  function applySettingsScreen() {
    const previousSettings = state.survey.settings || {};
    state.survey.title = els.settingsTitle.value.trim() || "Новая анкета";
    state.survey.description = els.settingsDescription.value.trim();
    state.survey.endsAt = els.settingsEndsAt.value ? `${els.settingsEndsAt.value}T23:59:59.000Z` : null;
    state.survey.responseLimit = els.settingsResponseLimit.value ? Math.max(1, Number(els.settingsResponseLimit.value)) : null;
    state.survey.timeLimitSeconds = els.settingsTimeLimit?.value ? Math.max(60, Math.round(Number(els.settingsTimeLimit.value) * 60)) : null;
    state.survey.settings = {
      ...(state.survey.settings || {}),
      language: els.settingsLanguage.value || "ru",
      accessPassword: els.settingsPassword.value.trim(),
      isPublic: els.settingsPublic.checked,
      isHidden: els.settingsHidden.checked,
      thanksTitle: previousSettings.thanksTitle || "Спасибо!",
      thanksText: previousSettings.thanksText || "Ваши ответы сохранены.",
      welcomeTitle: els.welcomeTitle.value.trim() || state.survey.title || "Название анкеты",
      welcomeSubtitle: els.welcomeSubtitle.value.trim() || "Добро пожаловать",
      welcomeDescription: els.welcomeDescription.value.trim() || state.survey.description || "Описание анкеты",
      welcomeButtonText: els.welcomeButtonText.value.trim() || "Начать опрос",
      welcomeCover: els.welcomeCover.value.trim(),
      welcomeBackground: els.welcomeBg.value.trim(),
      welcomeOverlay: Number(els.welcomeOverlay.value || 0),
      showProgress: els.settingsShowProgress.checked,
      allowBack: els.settingsAllowBack.checked,
      showQuestionNumbers: els.settingsShowNumbers.checked
    };
    els.title.value = state.survey.title;
    persistDesignToPages();
    markDirty();
    render();
    renderWelcomePreview();
  }

  function renderWelcomePreview() {
    if (!els.welcomePreviewCard) return;
    const overlay = Number(els.welcomeOverlay?.value || 0);
    const cover = String(els.welcomeCover?.value || "").trim();
    const bg = String(els.welcomeBg?.value || "").trim();
    els.welcomePreviewTitle.textContent = els.welcomeTitle?.value || state.survey.title || "Название анкеты";
    els.welcomePreviewSubtitle.textContent = els.welcomeSubtitle?.value || "Добро пожаловать";
    els.welcomePreviewDescription.textContent = els.welcomeDescription?.value || state.survey.description || "Описание анкеты";
    els.welcomePreviewButton.textContent = els.welcomeButtonText?.value || "Начать опрос";
    els.welcomePreviewCard.style.setProperty("--welcome-overlay", `${overlay / 100}`);
    if (bg) {
      els.welcomePreviewCard.style.backgroundImage = `linear-gradient(rgba(17,24,39,${overlay / 100}), rgba(17,24,39,${overlay / 100})), url("${bg}")`;
    } else {
      els.welcomePreviewCard.style.backgroundImage = designBackground(state.design);
    }
    const media = els.welcomePreviewCard.querySelector(".bv2-welcome-card__media");
    if (media) {
      media.style.backgroundImage = cover ? `url("${cover}")` : "";
      media.hidden = !cover;
    }
  }

  function settingsBackToConstructor() {
    applySettingsScreen();
    showStep("constructor");
  }

  function settingsContinueToPublish() {
    applySettingsScreen();
    showStep("publish");
  }

  function publishUrl() {
    return state.surveyId ? `${window.location.origin}/s/${state.surveyId}` : "Ссылка появится после сохранения";
  }

  function renderPublishScreen() {
    const questionCount = allQuestions().filter((question) => normalizeType(question.type) !== "info").length;
    const pageCount = state.survey.pages.length;
    const estimated = Math.max(1, Math.ceil(questionCount * 0.45));
    const url = publishUrl();
    els.publishStatusBadge.textContent = state.status === "published" ? "Опубликовано" : "Черновик";
    els.publishStatusBadge.classList.toggle("is-published", state.status === "published");
    els.publishUrl.value = url;
    els.openSurveyLink.href = state.surveyId ? `/s/${state.surveyId}` : "#";
    els.openSurveyLink.toggleAttribute("aria-disabled", !state.surveyId);
    const encoded = encodeURIComponent(state.surveyId ? url : window.location.origin);
    els.publishQrImage.src = `/api/qr.png?data=${encoded}`;
    els.downloadQr.href = `/api/qr.png?data=${encoded}&download=1`;
    els.publishInfoGrid.innerHTML = `
      <div><span>Количество страниц</span><strong>${pageCount}</strong></div>
      <div><span>Количество вопросов</span><strong>${questionCount}</strong></div>
      <div><span>Примерное время прохождения</span><strong>${estimated} мин</strong></div>
      <div><span>Пароль</span><strong>${state.survey.settings?.accessPassword || state.survey.hasAccessPassword ? "включен" : "выключен"}</strong></div>
      <div><span>Дата окончания</span><strong>${state.survey.endsAt ? new Date(state.survey.endsAt).toLocaleDateString("ru-RU") : "не задана"}</strong></div>
    `;
  }

  function copyPublishUrl() {
    const url = state.surveyId ? publishUrl() : "";
    if (!url) {
      showToast("Сначала сохраните анкету", true);
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => showToast("Ссылка скопирована"))
        .catch(() => {
          els.publishUrl.select();
          document.execCommand("copy");
          showToast("Ссылка скопирована");
        });
      return;
    }
    els.publishUrl.select();
    document.execCommand("copy");
    showToast("Ссылка скопирована");
  }

  async function uploadWelcomeImage(input, targetInput) {
    const file = input.files?.[0];
    if (!file) return;
    try {
      input.disabled = true;
      const path = await uploadImageFile(file);
      targetInput.value = path;
      renderWelcomePreview();
      markDirty();
      showToast("Изображение загружено");
    } catch (error) {
      showToast(error.message || "Не удалось загрузить изображение", true);
    } finally {
      input.disabled = false;
      input.value = "";
    }
  }

  async function uploadDesignBackground() {
    const file = els.designBgFile.files?.[0];
    if (!file) return;
    try {
      els.designBgFile.disabled = true;
      const path = await uploadImageFile(file);
      state.design.backgroundImage = path;
      state.design.backgroundType = "image";
      applyDesignState({ dirty: true });
      showToast("Фон загружен");
    } catch (error) {
      showToast(error.message || "Не удалось загрузить фон", true);
    } finally {
      els.designBgFile.disabled = false;
      els.designBgFile.value = "";
    }
  }

  function clearDesignBackground() {
    state.design.backgroundImage = "";
    state.design.backgroundType = state.design.gradientStyle && state.design.gradientStyle !== "none" ? "gradient" : "color";
    applyDesignState({ dirty: true });
  }

  function openTypeModal() {
    els.addTypeModal.hidden = false;
    syncModalBodyLock();
  }

  function closeTypeModal() {
    els.addTypeModal.hidden = true;
    syncModalBodyLock();
  }

  function addQuestion(type) {
    const page = activePage();
    if (!page) return;
    const question = createQuestion(type || "single");
    page.questions.push(question);
    state.selectedQuestionId = question.id;
    markDirty();
    closeTypeModal();
    render();
    openQuestionModal(question.id);
  }

  function addPage() {
    const page = createPage(`Страница ${state.survey.pages.length + 1}`);
    state.survey.pages.push(page);
    state.activePageId = page.id;
    markDirty();
    render();
  }

  function deleteActivePage() {
    if (state.survey.pages.length <= 1) {
      showToast("Нужна хотя бы одна страница", true);
      return;
    }
    const current = activePage();
    state.survey.pages = state.survey.pages.filter((page) => page.id !== current.id);
    state.activePageId = state.survey.pages[0]?.id || null;
    markDirty();
    render();
  }

  function findQuestion(questionId) {
    for (const page of state.survey.pages) {
      const question = (page.questions || []).find((item) => String(item.id) === String(questionId));
      if (question) return { page, question };
    }
    return null;
  }

  function openQuestionModal(questionId) {
    const found = findQuestion(questionId);
    if (!found) return;
    const question = found.question;
    question.settings = { ...defaultSettings(normalizeType(question.type)), ...(question.settings || {}) };
    state.editingQuestionId = question.id;
    state.selectedQuestionId = question.id;
    els.modalTitle.value = question.text || "";
    els.modalDescription.value = question.helpText || "";
    els.modalType.value = normalizeType(question.type);
    els.modalRequired.checked = question.required !== false;
    renderTypeSpecificFields(question);
    els.modal.hidden = false;
    syncModalBodyLock();
    renderQuestions();
    setTimeout(() => els.modalTitle.focus(), 30);
  }

  function closeQuestionModal() {
    state.editingQuestionId = null;
    els.modal.hidden = true;
    syncModalBodyLock();
  }

  function renderTypeSpecificFields(question) {
    const type = normalizeType(question.type);
    const settings = { ...defaultSettings(type), ...(question.settings || {}) };
    const options = Array.isArray(question.options) ? question.options : [];
    const optionEditor = (includeImages) => `
      <div class="bv2-option-editor ${includeImages ? "bv2-option-editor--images" : ""}" data-options-editor>
        <div class="bv2-editor-head">
          <strong>Варианты ответа</strong>
          <button class="bv2-mini-btn" type="button" data-add-option>Добавить вариант</button>
        </div>
        ${options.map((option, index) => renderOptionRow(option, index, includeImages, settings)).join("")}
      </div>
    `;
    const fields = {
      text: `${fieldInput("placeholder", "Подсказка", settings.placeholder)}${fieldInput("characterLimit", "Лимит символов", settings.characterLimit, "number", 1)}`,
      participant_name: `${fieldInput("placeholder", "Подсказка", settings.placeholder)}${fieldInput("characterLimit", "Лимит символов", settings.characterLimit, "number", 1)}`,
      participant_email: `${fieldInput("placeholder", "Подсказка", settings.placeholder)}${fieldInput("characterLimit", "Лимит символов", settings.characterLimit, "number", 1)}`,
      long_text: `${fieldInput("placeholder", "Подсказка", settings.placeholder)}${fieldInput("characterLimit", "Лимит символов", settings.characterLimit, "number", 1)}`,
      email: `${fieldInput("placeholder", "Подсказка", settings.placeholder)}${fieldInput("characterLimit", "Лимит символов", settings.characterLimit, "number", 1)}`,
      single: `${optionEditor(false)}${fieldCheckbox("randomize", "Перемешивать варианты", settings.randomize)}`,
      multi: `${optionEditor(false)}<div class="bv2-two-col">${fieldInput("minSelections", "Минимум вариантов", settings.minSelections, "number", 0)}${fieldInput("maxSelections", "Максимум вариантов", settings.maxSelections, "number", 1)}</div>`,
      dropdown: optionEditor(false),
      image_choice: `${optionEditor(true)}<div class="bv2-two-col">${fieldSelect("aspectRatio", "Соотношение сторон", settings.aspectRatio, RATIO_OPTIONS)}${fieldSelect("imageFit", "Отображение изображения", settings.imageFit, IMAGE_FIT_OPTIONS)}</div>`,
      rating: fieldInput("ratingScale", "Размер шкалы", settings.ratingScale, "number", 2),
      nps: `<div class="bv2-two-col">${fieldInput("npsLeftLabel", "Левая подпись", settings.npsLeftLabel)}${fieldInput("npsRightLabel", "Правая подпись", settings.npsRightLabel)}</div>`,
      info: `${fieldInput("infoIcon", "Иконка", settings.infoIcon)}${fieldTextarea("infoContent", "Содержание", settings.infoContent)}`
    };
    const settingsTitle = {
      text: "Настройки текста",
      participant_name: "Настройки имени участника",
      participant_email: "Настройки Email участника",
      long_text: "Настройки длинного текста",
      email: "Настройки Email",
      single: "Настройки одного выбора",
      multi: "Настройки нескольких вариантов",
      dropdown: "Настройки выпадающего списка",
      image_choice: "Настройки изображений",
      rating: "Настройки рейтинга",
      nps: "Настройки NPS",
      info: "Настройки информационного блока"
    }[type];
    els.typeSpecific.innerHTML = `<section class="bv2-type-settings"><h3>${escapeHtml(settingsTitle)}</h3>${fields[type] || ""}</section>`;
  }

  function fieldInput(name, label, value, type = "text", min = "") {
    return `<label class="bv2-field bv2-field--stack"><span>${escapeHtml(label)}</span><input data-setting="${escapeAttr(name)}" type="${escapeAttr(type)}" value="${escapeAttr(value)}" ${min !== "" ? `min="${escapeAttr(min)}"` : ""} /></label>`;
  }

  function fieldTextarea(name, label, value) {
    return `<label class="bv2-field bv2-field--stack"><span>${escapeHtml(label)}</span><textarea data-setting="${escapeAttr(name)}" rows="4">${escapeHtml(value)}</textarea></label>`;
  }

  function fieldSelect(name, label, value, options) {
    const normalized = options.map((option) => (typeof option === "object" ? option : { value: option, label: option }));
    return `
      <label class="bv2-field bv2-field--stack">
        <span>${escapeHtml(label)}</span>
        <select data-setting="${escapeAttr(name)}">
          ${normalized.map((option) => `<option value="${escapeAttr(option.value)}" ${String(option.value) === String(value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  function fieldCheckbox(name, label, checked) {
    return `<label class="bv2-check"><input data-setting="${escapeAttr(name)}" type="checkbox" ${checked ? "checked" : ""} />${escapeHtml(label)}</label>`;
  }

  function renderOptionRow(option, index, includeImages, settings) {
    if (!includeImages) {
      return `
        <div class="bv2-option-row bv2-option-row--simple" data-option-index="${index}">
          <input data-option-field="text" value="${escapeAttr(option.text || "")}" placeholder="Название варианта" />
          <button type="button" data-remove-option="${index}" title="Удалить">×</button>
        </div>
      `;
    }
    const imageUrl = option.imageUrl || DEFAULT_IMAGE_OPTIONS[index % DEFAULT_IMAGE_OPTIONS.length].imageUrl;
    const ratioClass = `is-ratio-${String(settings.aspectRatio || "16:9").replace(":", "-")}`;
    return `
      <article class="bv2-image-edit-card" data-option-index="${index}">
        <div class="bv2-image-edit-card__preview ${ratioClass}">
          <img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(option.text || "Вариант")}" />
        </div>
        <div class="bv2-image-edit-card__fields">
          <input data-option-field="text" value="${escapeAttr(option.text || "")}" placeholder="Название варианта" />
          <input data-option-field="description" value="${escapeAttr(option.description || "")}" placeholder="Описание варианта" />
          <div class="bv2-image-edit-card__url">
            <input data-option-field="imageUrl" value="${escapeAttr(option.imageUrl || "")}" placeholder="URL изображения" />
            <button class="bv2-upload-btn" type="button" data-upload-option="${index}">Загрузить</button>
            <input type="file" accept="image/*" data-upload-input="${index}" hidden />
            <button class="bv2-remove-btn" type="button" data-remove-option="${index}">Удалить</button>
          </div>
        </div>
      </article>
    `;
  }

  function collectModalValues(question) {
    const previousType = normalizeType(question.type);
    const nextType = normalizeType(els.modalType.value);
    question.text = els.modalTitle.value.trim() || "Без названия";
    question.helpText = els.modalDescription.value.trim();
    question.type = nextType;
    question.required = nextType === "info" ? false : els.modalRequired.checked;
    question.settings = { ...defaultSettings(nextType), ...(question.settings || {}) };
    els.typeSpecific.querySelectorAll("[data-setting]").forEach((node) => {
      const key = node.getAttribute("data-setting");
      if (!key) return;
      if (node.type === "checkbox") question.settings[key] = node.checked;
      else if (node.type === "number") question.settings[key] = Number(node.value || 0);
      else question.settings[key] = node.value;
    });
    const optionRows = [...els.typeSpecific.querySelectorAll("[data-option-index]")];
    if (optionRows.length) {
      question.options = optionRows
        .map((row) => {
          const original = question.options[Number(row.getAttribute("data-option-index"))] || {};
          const next = { ...createOption(""), ...original };
          row.querySelectorAll("[data-option-field]").forEach((input) => {
            next[input.getAttribute("data-option-field")] = input.value.trim();
          });
          return next.text || next.imageUrl ? next : null;
        })
        .filter(Boolean);
    } else if (previousType !== nextType) {
      question.options = defaultOptions(nextType);
    }
    if (["single", "multi", "dropdown", "image_choice"].includes(nextType) && question.options.length < 2) {
      question.options = [...question.options, ...defaultOptions(nextType)].slice(0, nextType === "image_choice" ? 4 : 3);
    }
  }

  function applyQuestionModal() {
    const found = findQuestion(state.editingQuestionId);
    if (!found) return closeQuestionModal();
    collectModalValues(found.question);
    markDirty();
    closeQuestionModal();
    render();
  }

  function deleteQuestion(questionId) {
    const found = findQuestion(questionId);
    if (!found) return;
    found.page.questions = found.page.questions.filter((question) => String(question.id) !== String(questionId));
    markDirty();
    render();
  }

  function duplicateQuestion(questionId) {
    const found = findQuestion(questionId);
    if (!found) return;
    const index = found.page.questions.findIndex((question) => String(question.id) === String(questionId));
    const clone = JSON.parse(JSON.stringify(found.question));
    clone.id = createId("question");
    clone.text = `${clone.text || "Вопрос"} (копия)`;
    clone.options = (clone.options || []).map((option) => ({ ...option, id: createId("option") }));
    found.page.questions.splice(index + 1, 0, clone);
    state.selectedQuestionId = clone.id;
    markDirty();
    render();
  }

  function getPreviewPages() {
    return state.survey.pages.filter((page) => (page.questions || []).length > 0);
  }

  function getPreviewQuestions() {
    return getPreviewPages().flatMap((page, pageIndex) =>
      (page.questions || []).map((question, questionIndex) => ({
        page,
        pageIndex,
        question,
        questionIndex
      }))
    );
  }

  function previewEstimatedMinutes(questionCount) {
    return Math.max(1, Math.ceil(questionCount * 0.45));
  }

  function previewQuestionCountLabel(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return "вопрос";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "вопроса";
    return "вопросов";
  }

  function hasWelcomeScreenV2() {
    const settings = state.survey.settings || {};
    return Boolean(settings.welcomeTitle || settings.welcomeSubtitle || settings.welcomeDescription || settings.welcomeCover || settings.welcomeBackground);
  }

  function openPreviewV2() {
    const pages = getPreviewPages();
    if (!pages.length) {
      showToast("Добавьте хотя бы один вопрос для предпросмотра", true);
      return;
    }
    state.previewPageIndex = 0;
    state.previewQuestionIndex = 0;
    state.previewStep = hasWelcomeScreenV2() ? "welcome" : "page";
    state.previewAnswers = {};
    els.previewSurveyTitle.textContent = state.survey.title || "Новая анкета";
    els.previewThemeBadge.textContent = "Режим предпросмотра";
    els.previewIndicator.textContent = "Ответы не сохраняются";
    els.previewModal.hidden = false;
    syncModalBodyLock();
    renderPreviewV2();
  }

  function renderPreviewV2() {
    const questions = getPreviewQuestions();
    const current = questions[state.previewQuestionIndex];
    if (!current && state.previewStep !== "complete") return;
    const settings = state.survey.settings || {};
    const total = questions.length;
    const currentType = current ? normalizeType(current.question.type) : "";
    const required = current?.question.required && currentType !== "info" ? `<span class="bv2-badge bv2-badge--required">Обязательный</span>` : "";
    const cardMode = currentType === "image_choice" ? "image" : "standard";
    const progress = state.previewStep === "welcome" ? 0 : state.previewStep === "complete" ? 100 : Math.round(((state.previewQuestionIndex + 1) / total) * 100);
    const welcomeBackground = String(settings.welcomeBackground || "").trim();
    const welcomeOverlay = Math.max(0, Math.min(90, Number(settings.welcomeOverlay || 0))) / 100;
    els.previewStage.style.setProperty("--preview-bg", welcomeBackground ? `linear-gradient(rgba(17,24,39,${welcomeOverlay}), rgba(17,24,39,${welcomeOverlay})), url("${welcomeBackground}"), ${state.design.backgroundColor}` : designBackground(state.design));
    if (state.previewStep === "welcome") {
      els.previewStage.innerHTML = renderPreviewWelcomeV2(total);
      focusPreviewPrimaryAction();
      return;
    }
    if (state.previewStep === "complete") {
      els.previewStage.innerHTML = renderPreviewCompleteV2();
      focusPreviewPrimaryAction();
      return;
    }
    els.previewStage.innerHTML = `
      <section class="bv2-preview-runtime-card bv2-preview-runtime-card--question bv2-preview-runtime-card--${cardMode}" data-preview-view data-preview-direction="${escapeAttr(state.previewDirection)}">
        ${settings.showProgress !== false ? `<div class="bv2-preview-progress is-${escapeAttr(state.design.progressStyle)}"><i style="width:${progress}%"></i></div>` : ""}
        <div class="bv2-preview-runtime-meta">
          <span>${state.previewQuestionIndex + 1} / ${total}</span>
          ${required}
        </div>
        <div class="bv2-preview-runtime-head">
          ${current.page?.title ? `<span>${escapeHtml(current.page.title)}</span>` : ""}
          <h1>${escapeHtml(current.question.text || "Без названия")}</h1>
          ${current.question.helpText ? `<p>${escapeHtml(current.question.helpText)}</p>` : ""}
        </div>
        <div class="bv2-preview-runtime-questions">
          ${renderPreviewQuestionV2(current.question, state.previewQuestionIndex)}
        </div>
        ${renderPreviewNavV2(total, settings)}
      </section>
    `;
    restorePreviewAnswers();
    focusPreviewQuestion();
  }

  function renderPreviewWelcomeV2(questionCount = getPreviewQuestions().length) {
    const settings = state.survey.settings || {};
    const cover = settings.welcomeCover || "";
    const estimated = previewEstimatedMinutes(questionCount);
    return `
      <section class="bv2-preview-runtime-card bv2-preview-runtime-card--welcome" data-preview-view>
        ${cover ? `<img class="bv2-preview-welcome-image" src="${escapeAttr(cover)}" alt="" />` : ""}
        <div class="bv2-preview-runtime-head">
          ${settings.welcomeSubtitle ? `<span>${escapeHtml(settings.welcomeSubtitle)}</span>` : ""}
          <h1>${escapeHtml(settings.welcomeTitle || state.survey.title || "Новая анкета")}</h1>
          <p>${escapeHtml(settings.welcomeDescription || state.survey.description || "Описание анкеты")}</p>
        </div>
        <div class="bv2-preview-start-meta" aria-label="Параметры анкеты">
          <span><strong>${estimated} мин</strong>примерное время</span>
          <span><strong>${questionCount}</strong>${previewQuestionCountLabel(questionCount)}</span>
        </div>
        <div class="bv2-preview-actions">
          <span class="bv2-preview-note"></span>
          <button class="bv2-btn bv2-btn--primary" type="button" data-preview-start>${escapeHtml(settings.welcomeButtonText || "Начать опрос")}</button>
        </div>
      </section>
    `;
  }

  function renderPreviewCompleteV2() {
    const settings = state.survey.settings || {};
    const defaultSavedText = "Ваши ответы сохранены.";
    const completionText = settings.thanksText && settings.thanksText !== defaultSavedText ? settings.thanksText : "Предпросмотр завершен.";
    return `
      <section class="bv2-preview-runtime-card bv2-preview-runtime-card--thanks" data-preview-view>
        <div class="bv2-preview-runtime-head">
          <h1>${escapeHtml(settings.thanksTitle || "Спасибо!")}</h1>
          <p>${escapeHtml(completionText)}</p>
        </div>
        <div class="bv2-preview-actions">
          <span class="bv2-preview-note"></span>
          <button class="bv2-btn bv2-btn--primary" type="button" data-preview-return>Вернуться в Builder</button>
        </div>
      </section>
    `;
  }

  function renderPreviewNavV2(total, settings) {
    const canGoBack = state.previewQuestionIndex > 0 && settings.allowBack !== false;
    return `
      <div class="bv2-preview-actions">
        <button class="bv2-btn bv2-btn--light" type="button" data-preview-prev ${canGoBack ? "" : "disabled"}>Назад</button>
        <span class="bv2-preview-note">Enter ↵ для продолжения</span>
        <button class="bv2-btn bv2-btn--primary" type="button" data-preview-next>${state.previewQuestionIndex === total - 1 ? "Завершить" : "Далее"}</button>
      </div>
    `;
  }

  function renderPreviewQuestionV2(question, index) {
    const type = normalizeType(question.type);
    const settings = question.settings || defaultSettings(type);
    return `
      <article class="bv2-preview-runtime-question" data-preview-question="${escapeAttr(question.id)}">
        ${renderPreviewAnswerV2(question, settings)}
      </article>
    `;
  }

  function renderPreviewAnswerV2(question, settings) {
    const type = normalizeType(question.type);
    const options = Array.isArray(question.options) ? question.options : [];
    if (type === "text" || type === "email" || type === "participant_name" || type === "participant_email") return `<input class="bv2-preview-input" data-preview-answer="${escapeAttr(question.id)}" type="${type === "email" || type === "participant_email" ? "email" : "text"}" placeholder="${escapeAttr(settings.placeholder || "Введите ответ...")}" />`;
    if (type === "long_text") return `<textarea class="bv2-preview-input" data-preview-answer="${escapeAttr(question.id)}" rows="5" placeholder="${escapeAttr(settings.placeholder || "Введите ответ...")}"></textarea>`;
    if (type === "single") return renderPreviewOptionsV2(question, options, "radio");
    if (type === "multi") return renderPreviewOptionsV2(question, options, "checkbox");
    if (type === "dropdown") return `<select class="bv2-preview-input" data-preview-answer="${escapeAttr(question.id)}"><option value="">Выберите вариант</option>${options.map((option) => `<option>${escapeHtml(option.text || "Вариант")}</option>`).join("")}</select>`;
    if (type === "image_choice") return `<div class="bv2-preview-image-options">${options.map((option) => `<button type="button" data-preview-choice="${escapeAttr(question.id)}" data-value="${escapeAttr(option.text || "Вариант")}"><img src="${escapeAttr(option.imageUrl || DEFAULT_IMAGE_OPTIONS[0].imageUrl)}" alt="" /><strong>${escapeHtml(option.text || "Вариант")}</strong>${option.description ? `<span>${escapeHtml(option.description)}</span>` : ""}</button>`).join("")}</div>`;
    if (type === "rating") return `<div class="bv2-preview-rating">${Array.from({ length: Number(settings.ratingScale || 5) }, (_, index) => `<button type="button" data-preview-choice="${escapeAttr(question.id)}" data-value="${index + 1}">★</button>`).join("")}</div>`;
    if (type === "nps") return `<div class="bv2-preview-nps-wrap"><div class="bv2-preview-nps">${Array.from({ length: 11 }, (_, index) => `<button type="button" data-preview-choice="${escapeAttr(question.id)}" data-value="${index}">${index}</button>`).join("")}</div><div class="bv2-preview-nps-labels"><span>Точно нет</span><span>Точно да</span></div></div>`;
    if (type === "info") return `<div class="bv2-preview-info">${escapeHtml(settings.infoContent || question.text || "Информационный блок")}</div>`;
    return "";
  }

  function renderPreviewOptionsV2(question, options, mode) {
    return `<div class="bv2-preview-options">${options.map((option, index) => `<label><input data-preview-answer="${escapeAttr(question.id)}" name="preview_${escapeAttr(question.id)}" type="${mode}" value="${escapeAttr(option.text || `Вариант ${index + 1}`)}" />${escapeHtml(option.text || `Вариант ${index + 1}`)}</label>`).join("")}</div>`;
  }

  function restorePreviewAnswers() {
    Object.entries(state.previewAnswers || {}).forEach(([questionId, value]) => {
      const inputs = [...els.previewStage.querySelectorAll(`[data-preview-answer="${CSS.escape(questionId)}"]`)];
      inputs.forEach((input) => {
        if (input.type === "checkbox") input.checked = Array.isArray(value) && value.includes(input.value);
        else if (input.type === "radio") input.checked = String(input.value) === String(value);
        else input.value = value || "";
      });
      const choices = [...els.previewStage.querySelectorAll(`[data-preview-choice="${CSS.escape(questionId)}"]`)];
      const question = findQuestion(questionId)?.question;
      const isRating = normalizeType(question?.type) === "rating";
      choices.forEach((choice) => {
        const choiceValue = choice.getAttribute("data-value");
        const selected = isRating ? Number(choiceValue) <= Number(value) : Array.isArray(value) ? value.includes(choiceValue) : String(value) === String(choiceValue);
        choice.classList.toggle("is-selected", selected);
      });
    });
  }

  function focusPreviewPrimaryAction() {
    window.setTimeout(() => {
      els.previewStage.querySelector("[data-preview-start], [data-preview-return], [data-preview-next]")?.focus();
    }, 0);
  }

  function focusPreviewQuestion() {
    window.setTimeout(() => {
      els.previewStage.querySelector("[data-preview-answer], [data-preview-choice], [data-preview-next]")?.focus();
    }, 0);
  }

  function transitionPreviewV2(update, direction = "next") {
    if (state.previewTransitioning) return;
    state.previewTransitioning = true;
    state.previewDirection = direction;
    els.previewStage.dataset.previewDirection = direction;
    const view = els.previewStage.querySelector("[data-preview-view]");
    if (!view || state.design.animationStyle === "none") {
      update();
      renderPreviewV2();
      state.previewTransitioning = false;
      return;
    }
    view.classList.add("is-preview-exiting");
    window.setTimeout(() => {
      update();
      renderPreviewV2();
      state.previewTransitioning = false;
    }, 240);
  }

  function openPreviewModal() {
    const pages = getPreviewPages();
    if (!pages.length) {
      showToast("Добавьте хотя бы один вопрос для предпросмотра", true);
      return;
    }
    state.previewPageIndex = 0;
    state.previewAnswers = {};
    els.previewSurveyTitle.textContent = state.survey.title || "Новая анкета";
    els.previewThemeBadge.textContent = "Тема: Корпоративная";
    els.previewIndicator.textContent = "Режим предпросмотра";
    els.previewModal.hidden = false;
    syncModalBodyLock();
    renderPreviewPage();
  }

  function closePreviewModal() {
    els.previewModal.hidden = true;
    syncModalBodyLock();
  }

  function renderPreviewPage() {
    const pages = getPreviewPages();
    const page = pages[state.previewPageIndex];
    if (!page) return;
    const settings = state.survey.settings || {};
    const progress = Math.round(((state.previewPageIndex + 1) / pages.length) * 100);
    els.previewThemeBadge.textContent = `Тема: ${DESIGN_THEMES[state.design.theme]?.label || DESIGN_THEMES.corporate.label}`;
    els.previewStage.style.setProperty("--preview-bg", designBackground(state.design));
    els.previewStage.innerHTML = `
      <section class="bv2-preview-card">
        <div class="bv2-preview-card__head">
          <span>${state.previewPageIndex + 1} / ${pages.length}</span>
          <h1>${escapeHtml(page.title || `Страница ${state.previewPageIndex + 1}`)}</h1>
          ${settings.showProgress !== false ? `<div class="bv2-preview-progress"><i style="width:${progress}%"></i></div>` : ""}
        </div>
        <div class="bv2-preview-questions">
          ${(page.questions || []).map((question, index) => renderPreviewQuestion(question, index)).join("")}
        </div>
        <div class="bv2-preview-actions">
          <button class="bv2-btn bv2-btn--light" type="button" data-preview-prev ${state.previewPageIndex === 0 || settings.allowBack === false ? "disabled" : ""}>Назад</button>
          <button class="bv2-btn bv2-btn--primary" type="button" data-preview-next>${state.previewPageIndex === pages.length - 1 ? "Завершить" : "Далее"}</button>
        </div>
      </section>
    `;
  }

  function renderPreviewQuestion(question, index) {
    const type = normalizeType(question.type);
    const settings = question.settings || defaultSettings(type);
    const number = (state.survey.settings?.showQuestionNumbers !== false) ? `<span class="bv2-preview-question__num">${index + 1}</span>` : "";
    const required = question.required ? `<span class="bv2-badge bv2-badge--required">Обязательный</span>` : "";
    return `
      <article class="bv2-preview-question" data-preview-question="${escapeAttr(question.id)}">
        <div class="bv2-preview-question__title">
          ${number}
          <div>
            <h2>${escapeHtml(question.text || "Без названия")}</h2>
            ${question.helpText ? `<p>${escapeHtml(question.helpText)}</p>` : ""}
          </div>
          ${required}
        </div>
        ${renderPreviewAnswer(question, settings)}
      </article>
    `;
  }

  function renderPreviewAnswer(question, settings) {
    const type = normalizeType(question.type);
    const options = Array.isArray(question.options) ? question.options : [];
    if (type === "text" || type === "email" || type === "participant_name" || type === "participant_email") return `<input class="bv2-preview-input" data-preview-answer="${escapeAttr(question.id)}" type="${type === "email" || type === "participant_email" ? "email" : "text"}" placeholder="${escapeAttr(settings.placeholder || "Введите ответ...")}" />`;
    if (type === "long_text") return `<textarea class="bv2-preview-input" data-preview-answer="${escapeAttr(question.id)}" rows="5" placeholder="${escapeAttr(settings.placeholder || "Введите ответ...")}"></textarea>`;
    if (type === "single") return renderPreviewOptions(question, options, "radio");
    if (type === "multi") return renderPreviewOptions(question, options, "checkbox");
    if (type === "dropdown") return `<select class="bv2-preview-input" data-preview-answer="${escapeAttr(question.id)}"><option value="">Выберите вариант</option>${options.map((option) => `<option>${escapeHtml(option.text || "Вариант")}</option>`).join("")}</select>`;
    if (type === "image_choice") return `<div class="bv2-preview-image-options">${options.map((option) => `<button type="button" data-preview-choice="${escapeAttr(question.id)}" data-value="${escapeAttr(option.text || "Вариант")}"><img src="${escapeAttr(option.imageUrl || DEFAULT_IMAGE_OPTIONS[0].imageUrl)}" alt="" /><strong>${escapeHtml(option.text || "Вариант")}</strong></button>`).join("")}</div>`;
    if (type === "rating") return `<div class="bv2-preview-rating">${Array.from({ length: Number(settings.ratingScale || 5) }, (_, index) => `<button type="button" data-preview-choice="${escapeAttr(question.id)}" data-value="${index + 1}">★</button>`).join("")}</div>`;
    if (type === "nps") return `<div class="bv2-preview-nps">${Array.from({ length: 11 }, (_, index) => `<button type="button" data-preview-choice="${escapeAttr(question.id)}" data-value="${index}">${index}</button>`).join("")}</div>`;
    if (type === "info") return `<div class="bv2-preview-info">${escapeHtml(settings.infoContent || question.text || "Информационный блок")}</div>`;
    return "";
  }

  function renderPreviewOptions(question, options, mode) {
    return `<div class="bv2-preview-options">${options.map((option, index) => `<label><input data-preview-answer="${escapeAttr(question.id)}" name="preview_${escapeAttr(question.id)}" type="${mode}" value="${escapeAttr(option.text || `Вариант ${index + 1}`)}" />${escapeHtml(option.text || `Вариант ${index + 1}`)}</label>`).join("")}</div>`;
  }

  function toPayload() {
    persistDesignToPages();
    return {
      title: (state.survey.title || els.title.value || "").trim() || "Новая анкета",
      description: state.survey.description || "",
      audience: state.survey.audience || "",
      allowMultipleResponses: Boolean(state.survey.allowMultipleResponses),
      startsAt: state.survey.startsAt || null,
      endsAt: state.survey.endsAt || null,
      responseLimit: state.survey.responseLimit || null,
      timeLimitSeconds: state.survey.timeLimitSeconds || null,
      settings: {
        ...(state.survey.settings || {}),
        language: ["ru", "en"].includes(String(state.survey.settings?.language || "").toLowerCase())
          ? String(state.survey.settings.language).toLowerCase()
          : "ru"
      },
      pages: state.survey.pages.map((page) => ({
        title: page.title || "Страница",
        design: {
          ...(page.design || {}),
          ...state.design,
          builderV2Design: { ...state.design },
          bgColor: state.design.backgroundColor,
          bgImage: state.design.backgroundImage
        },
        questions: (page.questions || [])
          .filter((question) => normalizeType(question.type) !== "info")
          .map((question, index) => ({
            text: question.text || "Без названия",
            helpText: question.helpText || question.settings?.infoContent || "",
            imageUrl: question.imageUrl || "",
            panelOpacity: question.panelOpacity || 72,
            type: apiType(question.type),
            required: question.required !== false,
            order: index,
            options: Array.isArray(question.options) ? question.options : []
          }))
      }))
    };
  }

  async function saveSurvey() {
    if (currentStep() === "settings") applySettingsScreen();
    const payload = toPayload();
    const questionCount = payload.pages.reduce((sum, page) => sum + page.questions.length, 0);
    if (payload.title.length < 3) return showToast("Название анкеты должно быть не короче 3 символов", true);
    if (!questionCount) return showToast("Добавьте хотя бы один отвечаемый вопрос перед сохранением", true);
    els.save.disabled = true;
    els.saveState.textContent = "Сохраняем...";
    els.saveState.style.color = "#4f46e5";
    try {
      if (state.surveyId) {
        await apiRequest(`/api/surveys/${state.surveyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        const created = await apiRequest("/api/surveys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        state.surveyId = Number(created.id);
        window.history.replaceState({}, "", `/create-v2?surveyId=${encodeURIComponent(state.surveyId)}`);
      }
      if (state.surveyId && currentStep() === "settings") {
        const typedPassword = String(state.survey.settings?.accessPassword || "").trim();
        const passwordEnabled = Boolean(typedPassword) || Boolean(state.survey.hasAccessPassword);
        await apiRequest(`/api/surveys/${state.surveyId}/access`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passwordEnabled,
            password: typedPassword,
            responseLimit: state.survey.responseLimit || "",
            timeLimitSeconds: state.survey.timeLimitSeconds || ""
          })
        });
        state.survey.hasAccessPassword = passwordEnabled;
      }
      state.survey.title = payload.title;
      els.saveState.textContent = "Черновик сохранён";
      els.saveState.style.color = "#0f766e";
      showToast("Анкета сохранена");
    } catch (error) {
      els.saveState.textContent = "Ошибка сохранения";
      els.saveState.style.color = "#b91c1c";
      showToast(error.message || "Не удалось сохранить", true);
    } finally {
      els.save.disabled = false;
    }
  }

  async function publishSurvey() {
    if (!state.surveyId) {
      await saveSurvey();
      if (!state.surveyId) return;
    }
    try {
      await apiRequest(`/api/surveys/${state.surveyId}/publish`, { method: "POST" });
      state.status = "published";
      showToast("Анкета опубликована");
    } catch (error) {
      showToast(error.message || "Не удалось опубликовать", true);
    }
  }

  function inferBuilderType(question) {
    const type = normalizeType(question.type);
    if (type === "single" && Array.isArray(question.options) && question.options.some((option) => option.imageUrl)) return "image_choice";
    return type;
  }

  async function loadExistingSurvey(id) {
    els.saveState.textContent = "Загружаем...";
    const data = await apiRequest(`/api/surveys/${id}`);
    const survey = data.survey || {};
    const pagesRaw = Array.isArray(data.pages) && data.pages.length ? data.pages : [{ id: "page_1", title: "Страница 1", design: {} }];
    const pages = pagesRaw.map((page, index) => ({
      id: String(page.id || createId("page")),
      title: page.title || `Страница ${index + 1}`,
      design: page.design || {},
      questions: []
    }));
    const byPageId = new Map(pages.map((page) => [String(page.id), page]));
    (Array.isArray(data.questions) ? data.questions : []).forEach((question) => {
      const target = byPageId.get(String(question.pageId || question.page_id)) || pages[0];
      const builderType = inferBuilderType(question);
      target.questions.push({
        id: String(question.id || createId("question")),
        text: question.text || question.question_text || "Без названия",
        helpText: question.helpText || question.help_text || "",
        type: builderType,
        required: question.required !== false,
        panelOpacity: question.panelOpacity || question.panel_opacity || 72,
        imageUrl: question.imageUrl || question.image_url || "",
        options: Array.isArray(question.options) ? question.options : defaultOptions(builderType),
        settings: defaultSettings(builderType)
      });
    });
    state.surveyId = Number(id);
    state.status = survey.status || "draft";
    const firstDesign = pages[0]?.design || {};
    const firstWelcome = firstDesign.welcome && typeof firstDesign.welcome === "object" ? firstDesign.welcome : {};
    const welcomeOverlay = Number(firstWelcome.welcomeOverlayStrength ?? firstWelcome.overlay);
    const persistedSettings = survey.settings && typeof survey.settings === "object" ? survey.settings : {};
    state.survey = {
      title: survey.title || "Новая анкета",
      description: survey.description || "",
      audience: survey.audience || "",
      allowMultipleResponses: Boolean(survey.allow_multiple_responses),
      startsAt: survey.starts_at || null,
      endsAt: survey.ends_at || null,
      responseLimit: survey.response_limit || null,
      timeLimitSeconds: survey.time_limit_seconds || null,
      hasAccessPassword: Boolean(survey.has_access_password),
      settings: {
        ...(state.survey.settings || {}),
        ...persistedSettings,
        language: ["ru", "en"].includes(String(persistedSettings.language || "").toLowerCase()) ? String(persistedSettings.language).toLowerCase() : "ru",
        welcomeTitle: firstWelcome.welcomeTitle || firstWelcome.title || survey.title || "Название анкеты",
        welcomeSubtitle: firstWelcome.welcomeSubtitle || firstWelcome.subtitle || "Добро пожаловать",
        welcomeDescription: firstWelcome.welcomeDescription || firstWelcome.description || survey.description || "Описание анкеты",
        welcomeButtonText: firstWelcome.welcomeButtonText || firstWelcome.buttonText || "Начать опрос",
        welcomeCover: firstWelcome.welcomeCoverImage || firstWelcome.coverImage || "",
        welcomeBackground: firstWelcome.welcomeBackgroundImage || firstWelcome.backgroundImage || "",
        welcomeOverlay: Number.isFinite(welcomeOverlay) ? welcomeOverlay : Number(firstWelcome.welcomeOverlayStrength || firstDesign.overlay || 24),
        isPublic: survey.status !== "draft",
        isHidden: survey.status === "draft"
      },
      pages
    };
    state.design = normalizeDesign(pages[0]?.design?.builderV2Design || pages[0]?.design || {});
    state.activePageId = pages[0]?.id || null;
    applyDesignState({ renderPreview: false });
    els.saveState.textContent = state.status === "published" ? "Опубликована" : "Черновик сохранён";
    els.saveState.style.color = "#0f766e";
  }

  async function createSurveyFromTemplate(templateId) {
    const key = String(templateId || "").trim().toLowerCase();
    if (!key) return null;
    console.info("[Builder V2] Creating survey from template", key);
    els.save.disabled = true;
    els.saveState.textContent = "Создаём анкету из шаблона...";
    els.saveState.style.color = "#4f46e5";
    try {
      const created = await apiRequest("/api/surveys/from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: key })
      });
      const surveyId = Number(created.surveyId || created.id);
      if (!Number.isInteger(surveyId) || surveyId <= 0) {
        throw new Error("Сервер не вернул id анкеты");
      }
      console.info("[Builder V2] Template survey created", { templateId: key, surveyId });
      window.history.replaceState({}, "", `/create-v2?surveyId=${encodeURIComponent(surveyId)}`);
      await loadExistingSurvey(surveyId);
      showToast("Шаблон применён");
      return surveyId;
    } catch (error) {
      console.error("[Builder V2] Template creation failed", { templateId: key, error });
      throw error;
    } finally {
      els.save.disabled = false;
    }
  }

  function hasCompletedOnboarding() {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function markOnboardingComplete() {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    } catch {}
  }

  function onboardingTarget(step) {
    const selector = ONBOARDING_STEPS[step]?.selector;
    return selector ? document.querySelector(selector) : null;
  }

  function renderOnboardingDots() {
    if (!els.onboardingDots) return;
    els.onboardingDots.innerHTML = ONBOARDING_STEPS.map((_, index) => `<span class="${index === onboardingState.step ? "is-active" : ""}"></span>`).join("");
  }

  function placeOnboardingCard(targetRect) {
    if (!els.onboardingCard) return;
    const margin = 18;
    const cardRect = els.onboardingCard.getBoundingClientRect();
    const availableRight = window.innerWidth - targetRect.right;
    const availableLeft = targetRect.left;
    let left = targetRect.right + margin;
    let top = targetRect.top + Math.min(24, Math.max(0, targetRect.height * 0.18));

    if (availableRight < cardRect.width + margin && availableLeft > cardRect.width + margin) {
      left = targetRect.left - cardRect.width - margin;
    }

    if (window.innerWidth < cardRect.width + margin * 2 || targetRect.width > window.innerWidth * 0.72) {
      left = Math.max(margin, Math.min(window.innerWidth - cardRect.width - margin, targetRect.left));
      top = targetRect.bottom + margin;
    }

    top = Math.max(margin, Math.min(window.innerHeight - cardRect.height - margin, top));
    left = Math.max(margin, Math.min(window.innerWidth - cardRect.width - margin, left));
    els.onboardingCard.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }

  function positionOnboarding() {
    if (!onboardingState.active || !els.onboardingSpotlight) return;
    const target = onboardingTarget(onboardingState.step);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const pad = 10;
    const left = Math.max(8, rect.left - pad);
    const top = Math.max(8, rect.top - pad);
    const width = Math.min(window.innerWidth - left - 8, rect.width + pad * 2);
    const height = Math.min(window.innerHeight - top - 8, rect.height + pad * 2);

    els.onboardingSpotlight.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    els.onboardingSpotlight.style.width = `${Math.round(width)}px`;
    els.onboardingSpotlight.style.height = `${Math.round(height)}px`;
    placeOnboardingCard({ left, top, right: left + width, bottom: top + height, width, height });
  }

  function renderOnboardingStep() {
    const step = ONBOARDING_STEPS[onboardingState.step];
    if (!step || !els.onboarding) return;
    if (currentStep() !== "constructor") showStep("constructor");
    const target = onboardingTarget(onboardingState.step);
    target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    if (els.onboardingStepLabel) els.onboardingStepLabel.textContent = `Шаг ${onboardingState.step + 1} из ${ONBOARDING_STEPS.length}`;
    if (els.onboardingTitle) els.onboardingTitle.textContent = step.title;
    if (els.onboardingText) els.onboardingText.textContent = step.text;
    if (els.onboardingSubtext) {
      els.onboardingSubtext.textContent = step.subtext || "";
      els.onboardingSubtext.hidden = !step.subtext;
    }
    if (els.onboardingNext) els.onboardingNext.textContent = onboardingState.step >= ONBOARDING_STEPS.length - 1 ? "Завершить" : "Далее";
    renderOnboardingDots();
    window.setTimeout(positionOnboarding, 220);
  }

  function startOnboarding({ force = false } = {}) {
    if (!els.onboarding || (!force && hasCompletedOnboarding())) return;
    closeTypeModal();
    closeQuestionModal();
    closeTemplatesModal();
    closeTemplateConfirmModal();
    if (els.previewModal && !els.previewModal.hidden) closePreviewModal();
    onboardingState.active = true;
    onboardingState.step = 0;
    els.onboarding.hidden = false;
    document.body.classList.add("bv2-onboarding-active");
    renderOnboardingStep();
  }

  function closeOnboarding({ complete = false, showDone = false } = {}) {
    onboardingState.active = false;
    if (els.onboarding) els.onboarding.hidden = true;
    document.body.classList.remove("bv2-onboarding-active");
    if (complete) markOnboardingComplete();
    if (showDone && els.onboardingDone) {
      els.onboardingDone.hidden = false;
      els.onboardingCreateQuestion?.focus();
    }
  }

  function nextOnboardingStep() {
    if (onboardingState.step >= ONBOARDING_STEPS.length - 1) {
      closeOnboarding({ complete: true, showDone: true });
      return;
    }
    onboardingState.step += 1;
    renderOnboardingStep();
  }

  function closeOnboardingDone() {
    if (els.onboardingDone) els.onboardingDone.hidden = true;
  }

  function bindOnboardingEvents() {
    els.onboardingStart?.addEventListener("click", () => startOnboarding({ force: true }));
    els.onboardingNext?.addEventListener("click", nextOnboardingStep);
    els.onboardingClose?.addEventListener("click", () => closeOnboarding({ complete: true }));
    els.onboardingDoneClose?.addEventListener("click", closeOnboardingDone);
    els.onboardingCreateQuestion?.addEventListener("click", () => {
      closeOnboardingDone();
      openTypeModal();
    });
    window.addEventListener("resize", () => {
      if (!onboardingState.active) return;
      clearTimeout(onboardingState.resizeTimer);
      onboardingState.resizeTimer = setTimeout(positionOnboarding, 80);
    });
    window.addEventListener("scroll", positionOnboarding, true);
  }

  function maybeShowFirstVisitOnboarding() {
    if (hasCompletedOnboarding()) return;
    window.setTimeout(() => startOnboarding(), 550);
  }

  function bindEvents() {
    bindOnboardingEvents();
    els.modalType.innerHTML = QUESTION_TYPES.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
    els.addTypeGrid.innerHTML = QUESTION_TYPES.map(
      (item) => `
        <button class="bv2-type-card" type="button" data-add-type="${escapeAttr(item.value)}">
          <span>${escapeHtml(item.icon)}</span>
          <strong>${escapeHtml(item.label)}</strong>
          <small>${escapeHtml(item.description)}</small>
        </button>
      `
    ).join("");
    els.addPage.addEventListener("click", addPage);
    els.addPageIcon.addEventListener("click", addPage);
    els.deletePage.addEventListener("click", deleteActivePage);
    els.templates.addEventListener("click", openTemplatesModal);
    els.surveySettings.addEventListener("click", () => showStep("settings"));
    els.addQuestion.addEventListener("click", openTypeModal);
    els.addQuestionBottom.addEventListener("click", openTypeModal);
    els.save.addEventListener("click", () => {
      if (currentStep() === "settings") applySettingsScreen();
      saveSurvey();
    });
    els.publish.addEventListener("click", () => showStep("publish"));
    els.preview.addEventListener("click", openPreviewV2);
    els.previewTop.addEventListener("click", () => els.preview.click());
    els.flowNav?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-flow-target]");
      if (!button) return;
      if (currentStep() === "settings") applySettingsScreen();
      showStep(button.getAttribute("data-flow-target"));
    });
    els.settingsBackTop.addEventListener("click", settingsBackToConstructor);
    els.settingsBack.addEventListener("click", settingsBackToConstructor);
    els.settingsToPublish.addEventListener("click", settingsContinueToPublish);
    els.publishBack.addEventListener("click", () => showStep("settings"));
    els.publishSurvey.addEventListener("click", async () => {
      await publishSurvey();
      renderPublishScreen();
    });
    els.copyPublishUrl.addEventListener("click", copyPublishUrl);
    els.openSurveyLink.addEventListener("click", (event) => {
      if (state.surveyId) return;
      event.preventDefault();
      showToast("Сначала сохраните анкету", true);
    });
    [
      els.welcomeTitle,
      els.welcomeSubtitle,
      els.welcomeDescription,
      els.welcomeButtonText,
      els.welcomeCover,
      els.welcomeBg,
      els.welcomeOverlay
    ].forEach((node) => {
      node.addEventListener("input", () => {
        renderWelcomePreview();
        markDirty();
      });
    });
    els.welcomeCoverUpload.addEventListener("click", () => els.welcomeCoverFile.click());
    els.welcomeBgUpload.addEventListener("click", () => els.welcomeBgFile.click());
    els.welcomeCoverFile.addEventListener("change", () => uploadWelcomeImage(els.welcomeCoverFile, els.welcomeCover));
    els.welcomeBgFile.addEventListener("change", () => uploadWelcomeImage(els.welcomeBgFile, els.welcomeBg));
    els.title.addEventListener("input", () => {
      state.survey.title = els.title.value;
      markDirty();
    });
    els.pageTitle.addEventListener("input", () => {
      const page = activePage();
      if (!page) return;
      page.title = els.pageTitle.value;
      markDirty();
      renderPages();
    });
    els.designTabs.forEach((node) => {
      node.addEventListener("click", () => showDesignTab(node.dataset.designTab));
    });
    els.themeCards.forEach((node) => {
      node.addEventListener("click", () => {
        const theme = node.dataset.theme;
        const preset = DESIGN_THEMES[theme] || DESIGN_THEMES.corporate;
        state.design = normalizeDesign({
          ...state.design,
          theme,
          primaryColor: preset.primaryColor,
          secondaryColor: preset.secondaryColor,
          accentColor: preset.primaryColor,
          cardStyle: preset.cardStyle,
          buttonStyle: preset.buttonStyle,
          progressStyle: preset.progressStyle
        });
        applyDesignState({ dirty: true });
      });
    });
    els.applyRecommendedBg.addEventListener("click", () => {
      const recommended = DESIGN_THEMES[state.design.theme]?.recommendedBackground;
      if (!recommended) {
        showToast("Для этой темы нет рекомендуемого фона", true);
        return;
      }
      state.design.backgroundImage = recommended;
      state.design.backgroundType = "image";
      applyDesignState({ dirty: true });
    });
    els.backgroundTypeButtons.forEach((node) => {
      node.addEventListener("click", () => {
        state.design.backgroundType = node.dataset.backgroundType || "color";
        applyDesignState({ dirty: true });
      });
    });
    els.backgroundColorButtons.forEach((node) => {
      node.addEventListener("click", () => {
        state.design.backgroundColor = node.dataset.bgColor || DEFAULT_DESIGN.backgroundColor;
        state.design.backgroundType = "color";
        applyDesignState({ dirty: true });
      });
    });
    els.gradientButtons.forEach((node) => {
      node.addEventListener("click", () => {
        state.design.gradientStyle = node.dataset.gradientStyle || DEFAULT_DESIGN.gradientStyle;
        state.design.backgroundType = "gradient";
        applyDesignState({ dirty: true });
      });
    });
    els.colorSwatches.forEach((node) => {
      node.addEventListener("click", () => {
        state.design.primaryColor = node.dataset.color || DEFAULT_DESIGN.primaryColor;
        state.design.accentColor = state.design.primaryColor;
        applyDesignState({ dirty: true });
      });
    });
    els.cardStyleButtons.forEach((node) => {
      node.addEventListener("click", () => {
        state.design.cardStyle = node.dataset.cardStyle || DEFAULT_DESIGN.cardStyle;
        applyDesignState({ dirty: true });
      });
    });
    els.buttonStyleButtons.forEach((node) => {
      node.addEventListener("click", () => {
        state.design.buttonStyle = node.dataset.buttonStyle || DEFAULT_DESIGN.buttonStyle;
        applyDesignState({ dirty: true });
      });
    });
    els.progressStyleButtons.forEach((node) => {
      node.addEventListener("click", () => {
        state.design.progressStyle = node.dataset.progressStyle || DEFAULT_DESIGN.progressStyle;
        applyDesignState({ dirty: true });
      });
    });
    els.animationStyleButtons.forEach((node) => {
      node.addEventListener("click", () => {
        state.design.animationStyle = node.dataset.animationStyle || DEFAULT_DESIGN.animationStyle;
        applyDesignState({ dirty: true });
      });
    });
    els.designQuestionNumbers.addEventListener("change", () => {
      state.design.questionNumbers = els.designQuestionNumbers.checked;
      state.survey.settings = {
        ...(state.survey.settings || {}),
        showQuestionNumbers: els.designQuestionNumbers.checked
      };
      applyDesignState({ dirty: true });
      if (els.previewModal && !els.previewModal.hidden) renderPreviewV2();
    });
    [els.designBgColor, els.designBgImage, els.designOverlay, els.designLayout, els.designPrimaryColor, els.designSecondaryColor, els.designAccentColor, els.designTextColor].forEach((node) => {
      node.addEventListener("input", () => {
        state.design = normalizeDesign({
          ...state.design,
          backgroundType: node === els.designBgImage ? "image" : state.design.backgroundType,
          backgroundColor: els.designBgColor.value,
          backgroundImage: els.designBgImage.value.trim(),
          overlay: Number(els.designOverlay.value || 0),
          layout: els.designLayout.value,
          primaryColor: els.designPrimaryColor.value,
          secondaryColor: els.designSecondaryColor.value,
          accentColor: els.designAccentColor.value,
          textColor: els.designTextColor.value
        });
        applyDesignState({ dirty: true });
      });
    });
    els.designBgUpload.addEventListener("click", () => els.designBgFile.click());
    els.designBgFile.addEventListener("change", uploadDesignBackground);
    els.designBgClear.addEventListener("click", clearDesignBackground);
    els.designBgPreview.addEventListener("error", () => {
      if (!state.design.backgroundImage) return;
      state.design.backgroundImage = "";
      state.design.backgroundType = state.design.gradientStyle ? "gradient" : "color";
      applyDesignState({ dirty: true });
      showToast("Изображение фона недоступно, применён цвет или градиент", true);
    });
    els.addTypeGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-add-type]");
      if (button) addQuestion(button.getAttribute("data-add-type"));
    });
    els.addTypeClose.addEventListener("click", closeTypeModal);
    els.addTypeCancel.addEventListener("click", closeTypeModal);
    els.addTypeModal.addEventListener("click", (event) => {
      if (event.target === els.addTypeModal) closeTypeModal();
    });
    els.templatesGrid.addEventListener("click", (event) => {
      const button = event.target.closest("[data-template-use]");
      if (!button) return;
      const templateId = button.getAttribute("data-template-use");
      if (pageHasContent()) openTemplateConfirmModal(templateId);
      else applyTemplate(templateId);
    });
    els.templatesClose.addEventListener("click", closeTemplatesModal);
    els.templatesCancel.addEventListener("click", closeTemplatesModal);
    els.templatesModal.addEventListener("click", (event) => {
      if (event.target === els.templatesModal) closeTemplatesModal();
    });
    els.templateConfirmClose.addEventListener("click", closeTemplateConfirmModal);
    els.templateConfirmCancel.addEventListener("click", closeTemplateConfirmModal);
    els.templateConfirmApply.addEventListener("click", () => {
      if (state.pendingTemplateId) applyTemplate(state.pendingTemplateId);
    });
    els.templateConfirmModal.addEventListener("click", (event) => {
      if (event.target === els.templateConfirmModal) closeTemplateConfirmModal();
    });
    els.pagesList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page-id]");
      if (!button) return;
      state.activePageId = button.getAttribute("data-page-id");
      render();
    });
    els.questionsList.addEventListener("click", (event) => {
      const emptyAdd = event.target.closest("[data-empty-add]");
      if (emptyAdd) return openTypeModal();
      const edit = event.target.closest("[data-edit-question]");
      const duplicate = event.target.closest("[data-duplicate-question]");
      const del = event.target.closest("[data-delete-question]");
      const card = event.target.closest("[data-question-id]");
      if (duplicate) return duplicateQuestion(duplicate.getAttribute("data-duplicate-question"));
      if (del) return deleteQuestion(del.getAttribute("data-delete-question"));
      if (edit) return openQuestionModal(edit.getAttribute("data-edit-question"));
      if (card) return openQuestionModal(card.getAttribute("data-question-id"));
    });
    els.modalType.addEventListener("change", () => {
      const found = findQuestion(state.editingQuestionId);
      if (!found) return;
      const nextType = normalizeType(els.modalType.value);
      const draft = {
        ...found.question,
        type: nextType,
        settings: { ...defaultSettings(nextType), ...(found.question.settings || {}) },
        options: found.question.options?.length ? found.question.options : defaultOptions(nextType)
      };
      renderTypeSpecificFields(draft);
    });
    els.typeSpecific.addEventListener("click", (event) => {
      const found = findQuestion(state.editingQuestionId);
      if (!found) return;
      const add = event.target.closest("[data-add-option]");
      const remove = event.target.closest("[data-remove-option]");
      const upload = event.target.closest("[data-upload-option]");
      if (add) {
        found.question.options = found.question.options || [];
        found.question.options.push(createOption(`Вариант ${found.question.options.length + 1}`));
        renderTypeSpecificFields(found.question);
      }
      if (remove) {
        const index = Number(remove.getAttribute("data-remove-option"));
        found.question.options = (found.question.options || []).filter((_, idx) => idx !== index);
        renderTypeSpecificFields(found.question);
      }
      if (upload) {
        const index = upload.getAttribute("data-upload-option");
        els.typeSpecific.querySelector(`[data-upload-input="${CSS.escape(index)}"]`)?.click();
      }
    });
    els.typeSpecific.addEventListener("input", (event) => {
      const input = event.target.closest('[data-option-field="imageUrl"]');
      if (!input) return;
      const card = input.closest("[data-option-index]");
      const img = card?.querySelector("img");
      if (img && input.value.trim()) img.src = input.value.trim();
    });
    els.typeSpecific.addEventListener("change", async (event) => {
      const input = event.target.closest("[data-upload-input]");
      if (!input) return;
      const found = findQuestion(state.editingQuestionId);
      if (!found) return;
      const index = Number(input.getAttribute("data-upload-input"));
      const file = input.files?.[0];
      if (!file) return;
      try {
        input.disabled = true;
        const path = await uploadImageFile(file);
        const row = els.typeSpecific.querySelector(`[data-option-index="${CSS.escape(String(index))}"]`);
        const imageInput = row?.querySelector('[data-option-field="imageUrl"]');
        const img = row?.querySelector("img");
        if (imageInput) imageInput.value = path;
        if (img) img.src = path;
        found.question.options[index] = { ...(found.question.options[index] || createOption(`Вариант ${index + 1}`)), imageUrl: path };
        showToast("Изображение загружено");
      } catch (error) {
        showToast(error.message || "Не удалось загрузить изображение", true);
      } finally {
        input.disabled = false;
        input.value = "";
      }
    });
    els.modalApply.addEventListener("click", applyQuestionModal);
    els.modalDelete.addEventListener("click", () => {
      const id = state.editingQuestionId;
      closeQuestionModal();
      deleteQuestion(id);
    });
    els.modalClose.addEventListener("click", closeQuestionModal);
    els.modalCancel.addEventListener("click", closeQuestionModal);
    els.modal.addEventListener("click", (event) => {
      if (event.target === els.modal) closeQuestionModal();
    });
    els.previewBack.addEventListener("click", closePreviewModal);
    els.previewStage.addEventListener("click", (event) => {
      const questions = getPreviewQuestions();
      const start = event.target.closest("[data-preview-start]");
      const prev = event.target.closest("[data-preview-prev]");
      const next = event.target.closest("[data-preview-next]");
      const choice = event.target.closest("[data-preview-choice]");
      if (start) {
        transitionPreviewV2(() => {
          state.previewStep = "page";
          state.previewQuestionIndex = 0;
        }, "next");
        return;
      }
      if (choice) {
        const questionId = choice.getAttribute("data-preview-choice");
        const value = choice.getAttribute("data-value");
        const question = findQuestion(questionId)?.question;
        if (normalizeType(question?.type) === "multi") {
          const current = Array.isArray(state.previewAnswers[questionId]) ? state.previewAnswers[questionId] : [];
          state.previewAnswers[questionId] = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
          choice.classList.toggle("is-selected");
        } else {
          state.previewAnswers[questionId] = value;
          choice.parentElement?.querySelectorAll("[data-preview-choice]").forEach((node) => node.classList.remove("is-selected"));
          if (normalizeType(question?.type) === "rating") {
            choice.parentElement?.querySelectorAll("[data-preview-choice]").forEach((node) => {
              node.classList.toggle("is-selected", Number(node.getAttribute("data-value")) <= Number(value));
            });
          } else {
            choice.classList.add("is-selected");
          }
        }
        return;
      }
      if (prev) {
        transitionPreviewV2(() => {
          state.previewQuestionIndex = Math.max(0, state.previewQuestionIndex - 1);
        }, "back");
        return;
      }
      if (next) {
        if (state.previewQuestionIndex >= questions.length - 1) {
          transitionPreviewV2(() => {
            state.previewStep = "complete";
          }, "next");
          return;
        }
        transitionPreviewV2(() => {
          state.previewQuestionIndex = Math.min(questions.length - 1, state.previewQuestionIndex + 1);
        }, "next");
      }
      if (event.target.closest("[data-preview-return]")) {
        closePreviewModal();
      }
      if (event.target.closest("[data-preview-restart]")) {
        state.previewPageIndex = 0;
        state.previewQuestionIndex = 0;
        state.previewStep = hasWelcomeScreenV2() ? "welcome" : "page";
        state.previewAnswers = {};
        renderPreviewV2();
      }
    });
    els.previewStage.addEventListener("input", (event) => {
      const input = event.target.closest("[data-preview-answer]");
      if (!input) return;
      const questionId = input.getAttribute("data-preview-answer");
      if (input.type === "checkbox") {
        const checked = [...els.previewStage.querySelectorAll(`[data-preview-answer="${CSS.escape(questionId)}"]:checked`)].map((node) => node.value);
        state.previewAnswers[questionId] = checked;
      } else {
        state.previewAnswers[questionId] = input.value;
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (onboardingState.active) closeOnboarding({ complete: true });
        if (els.onboardingDone && !els.onboardingDone.hidden) closeOnboardingDone();
        if (!els.previewModal.hidden) closePreviewModal();
        if (!els.templateConfirmModal.hidden) closeTemplateConfirmModal();
        if (!els.templatesModal.hidden) closeTemplatesModal();
        if (!els.modal.hidden) closeQuestionModal();
        if (!els.addTypeModal.hidden) closeTypeModal();
      }
      if (!els.previewModal.hidden) {
        const target = event.target;
        const tagName = target?.tagName ? target.tagName.toLowerCase() : "";
        const isTyping = tagName === "textarea" || (tagName === "input" && !["radio", "checkbox", "button"].includes(target.type));
        if (event.key === "Enter" && !event.shiftKey && !isTyping) {
          const next = els.previewStage.querySelector("[data-preview-start], [data-preview-next], [data-preview-return]");
          if (next) {
            event.preventDefault();
            next.click();
          }
        }
        if (event.key === "ArrowLeft") {
          const prev = els.previewStage.querySelector("[data-preview-prev]:not(:disabled)");
          if (prev) {
            event.preventDefault();
            prev.click();
          }
        }
        if (event.key === "ArrowRight") {
          const next = els.previewStage.querySelector("[data-preview-next]");
          if (next) {
            event.preventDefault();
            next.click();
          }
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveSurvey();
      }
    });
  }

  (async function boot() {
    bindEvents();
    try {
      const me = await apiRequest("/api/auth/me");
      if (!me.user) {
        window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (state.surveyId) await loadExistingSurvey(state.surveyId);
      else if (templateFromUrl) await createSurveyFromTemplate(templateFromUrl);
      render();
      maybeShowFirstVisitOnboarding();
    } catch (error) {
      showToast(error.message || "Не удалось открыть Builder V2", true);
      render();
      maybeShowFirstVisitOnboarding();
    }
  })();
})();
