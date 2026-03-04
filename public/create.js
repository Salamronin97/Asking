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
    settingsPane: "question"
  };

  const refs = {};
  let surveyId = null;
  let saveTimer = null;
  let isSaving = false;
  const dragState = { questionId: null, fromPageId: null };
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
      "previewSurveyBtn",
      "shareSurveyBtn",
      "saveState",
      "saveStateText",
      "publishBtn",
      "addQuestionBtn",
      "openTemplateCatalogBtn",
      "undoBtn",
      "redoBtn",
      "restoreDraftInlineBtn",
      "clearDraftInlineBtn",
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
      "applyThemeBtn"
    ].forEach((id) => {
      refs[id] = document.getElementById(id);
    });

    refs.mobileTabs = Array.from(document.querySelectorAll("[data-panel-tab]"));
    refs.panels = Array.from(document.querySelectorAll(".constructor-panel"));
    refs.quickTypeButtons = Array.from(document.querySelectorAll("[data-quick-question-type]"));
    refs.quickAddButtons = Array.from(document.querySelectorAll("[data-quick-add-type]"));

    must(refs.pagesList, "pagesList");
    must(refs.questionList, "questionList");
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
      renderAll();
      markDirty("Страница добавлена");
      focusPanelOnMobile("pages");
    });
    refs.renamePageBtn?.addEventListener("click", renameSelectedPage);
    refs.duplicatePageBtn?.addEventListener("click", duplicateSelectedPage);
    refs.removePageBtn?.addEventListener("click", removeSelectedPage);

    refs.addQuestionBtn?.addEventListener("click", openQuestionTypeModal);
    refs.openTemplateCatalogBtn?.addEventListener("click", openTemplateCatalogModal);
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

    refs.questionLogicEnabledInput?.addEventListener("change", (event) => {
      const question = getSelectedQuestion();
      if (!question || !CHOICE_TYPES.has(question.type)) return;
      question.logicEnabled = event.target.checked;
      renderOptions(question);
      markDirty();
    });

    refs.removeQuestionBtn?.addEventListener("click", () => {
      const page = getSelectedPage();
      if (!page || !state.selectedQuestionId) return;
      const index = page.questions.findIndex((q) => q.id === state.selectedQuestionId);
      if (index < 0) return;
      page.questions.splice(index, 1);
      const next = page.questions[index] || page.questions[index - 1] || null;
      state.selectedQuestionId = next ? next.id : null;
      renderAll();
      markDirty("Вопрос удалён");
    });

    bindModal(refs.questionTypeOverlay, refs.closeQuestionTypeModalBtn, closeQuestionTypeModal);
    bindModal(refs.creationEntryOverlay, refs.closeCreationEntryBtn, closeCreationEntryModal);
    bindModal(refs.templateCatalogOverlay, refs.closeTemplateCatalogBtn, closeTemplateCatalogModal);
    bindModal(refs.templatePreviewOverlay, refs.closeTemplatePreviewBtn, closeTemplatePreviewModal);
    bindModal(refs.themePickerOverlay, refs.closeThemePickerBtn, closeThemePickerModal);

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

      if (isTextEditingTarget(event.target)) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        if (!state.selectedQuestionId) return;
        event.preventDefault();
        duplicateQuestion(state.selectedQuestionId);
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
        removeQuestion(state.selectedQuestionId);
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
        pages: [{ title: "Страница 1", questions: [] }]
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
    const firstTheme = state.survey.pages[0]?.design?.themeId || state.activeThemeId;
    state.activeThemeId = firstTheme;
    state.previewThemeId = firstTheme;
  }

  function renderAll() {
    refs.surveyTitle.value = state.survey.title;
    refs.surveyDescription.value = state.survey.description;
    if (refs.worktopSurveyTitle) refs.worktopSurveyTitle.textContent = state.survey.title || "Новая анкета";
    updateBuilderMeta();

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

    const checks = {
      title: String(state.survey.title || "").trim().length >= 3,
      questions: questions >= 3,
      pages: pages >= 1,
      logic: logicRoutes >= 1
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const percent = Math.round((passed / 4) * 100);

    if (refs.builderHealthPercent) refs.builderHealthPercent.textContent = `${percent}%`;
    if (refs.builderHealthBarFill) refs.builderHealthBarFill.style.width = `${percent}%`;
    refs.builderCheckTitle?.classList.toggle("is-done", checks.title);
    refs.builderCheckQuestions?.classList.toggle("is-done", checks.questions);
    refs.builderCheckPages?.classList.toggle("is-done", checks.pages);
    refs.builderCheckLogic?.classList.toggle("is-done", checks.logic);
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
        const toPageId = page.id;
        if (!fromQuestionId || !fromPageId || fromPageId === toPageId) return;

        const sourcePage = state.survey.pages.find((item) => item.id === fromPageId);
        const targetPage = state.survey.pages.find((item) => item.id === toPageId);
        if (!sourcePage || !targetPage) return;

        const fromIndex = sourcePage.questions.findIndex((q) => q.id === fromQuestionId);
        if (fromIndex < 0) return;

        const [moved] = sourcePage.questions.splice(fromIndex, 1);
        targetPage.questions.push(moved);

        dragState.questionId = null;
        dragState.fromPageId = null;
        state.selectedPageId = targetPage.id;
        state.selectedQuestionId = moved.id;
        renderAll();
        markDirty(`Вопрос перенесён: ${sourcePage.title} -> ${targetPage.title}`);
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
    const index = state.survey.pages.findIndex((item) => item.id === page.id);
    if (index < 0) return;
    state.survey.pages.splice(index, 1);
    const fallback = state.survey.pages[Math.max(0, index - 1)] || state.survey.pages[0];
    state.selectedPageId = fallback?.id || null;
    state.selectedQuestionId = fallback?.questions?.[0]?.id || null;
    renderAll();
    markDirty("Страница удалена");
  }

  function renderQuestions() {
    refs.questionList.innerHTML = "";
    const page = getSelectedPage();
    const design = normalizePageDesign(page?.design);
    refs.questionList.style.cssText = buildCanvasStyle(design);

    if (!page || !page.questions.length) {
      refs.questionList.innerHTML = `
        <div class="constructor-empty card">
          <h3>Добавьте первый вопрос</h3>
          <p>Начните с кнопки «Добавить вопрос», затем настройте параметры справа.</p>
          <button type="button" class="btn btn--primary" id="emptyAddQuestionBtn">+ Добавить вопрос</button>
        </div>
      `;
      document.getElementById("emptyAddQuestionBtn")?.addEventListener("click", openQuestionTypeModal);
      return;
    }

    page.questions.forEach((question, index) => {
      const card = document.createElement("article");
      card.className = `question-card${question.id === state.selectedQuestionId ? " is-active" : ""}`;
      card.dataset.questionId = question.id;
      card.dataset.questionIndex = String(index);
      card.innerHTML = `
        <div class="question-card__head">
          <div class="question-card__left">
            <button type="button" class="question-card__drag" data-action="drag" draggable="true" title="Перетащить вопрос">≡</button>
            <div class="question-card__title-wrap">
              <h4 class="q-title">${escapeHtml(`${index + 1}. ${question.title || "Новый вопрос"}`)}</h4>
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
        if (action === "duplicate") {
          duplicateQuestion(question.id);
          return;
        }
        if (action === "delete") {
          removeQuestion(question.id);
          return;
        }

        state.selectedQuestionId = question.id;
        setSettingsPane("question");
        renderEditor();
        highlightActiveQuestion();
        focusPanelOnMobile("settings");
      });

      const dragHandle = card.querySelector("[data-action='drag']");
      dragHandle?.addEventListener("dragstart", (event) => {
        dragState.questionId = question.id;
        dragState.fromPageId = page.id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", question.id);
        card.classList.add("is-dragging");
      });

      dragHandle?.addEventListener("dragend", () => {
        dragState.questionId = null;
        dragState.fromPageId = null;
        refs.questionList.querySelectorAll(".question-card").forEach((node) => {
          node.classList.remove("is-dragging", "drop-before", "drop-after");
        });
        refs.pagesList.querySelectorAll(".constructor-page-item").forEach((node) => {
          node.classList.remove("drop-target");
        });
      });

      card.addEventListener("dragover", (event) => {
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

        state.selectedQuestionId = moved.id;
        renderQuestions();
        renderSurveyPreview();
        markDirty("Порядок вопросов обновлён");
      });

      refs.questionList.appendChild(card);
    });
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
          addQuestion(button.dataset.questionType);
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
      const category = TEMPLATE_CATEGORY_MAP[key] || "Другие";
      const passCategory = selectedCategory === "Все категории" || category === selectedCategory;
      const textBlob = `${template.title || ""} ${template.description || ""}`.toLowerCase();
      const passSearch = !search || textBlob.includes(search);
      return passCategory && passSearch;
    });

    refs.templateCatalogGrid.innerHTML = filtered
      .map(([key, template]) => {
        const category = TEMPLATE_CATEGORY_MAP[key] || "Другие";
        const tintClass = `constructor-template-card--${String(key).replace(/[^a-z0-9_-]/gi, "")}`;
        return `
          <article class="constructor-template-card ${tintClass}">
            <div class="constructor-template-card__image"></div>
            <div class="constructor-template-card__body">
              <span class="constructor-template-card__cat">${escapeHtml(category)}</span>
              <h4>${escapeHtml(template.title || key)}</h4>
              <p>${escapeHtml(template.description || "")}</p>
              <button type="button" class="btn btn--outline btn--xs" data-template-preview="${escapeHtml(key)}">Предпросмотр</button>
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
  }

  function closeAllModals() {
    closeQuestionTypeModal();
    closeCreationEntryModal(false);
    closeTemplateCatalogModal();
    closeTemplatePreviewModal();
    closeThemePickerModal();
    document.body.classList.remove("modal-open");
  }

  function cleanupModals() {
    const open =
      isModalVisible(refs.questionTypeOverlay) ||
      isModalVisible(refs.creationEntryOverlay) ||
      isModalVisible(refs.templateCatalogOverlay) ||
      isModalVisible(refs.templatePreviewOverlay) ||
      isModalVisible(refs.themePickerOverlay);
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

  function addQuestion(type) {
    const page = ensureSelectedPage();
    const normalizedType = normalizeType(type);

    const question = {
      id: createId(),
      type: normalizedType,
      title: "Новый вопрос",
      description: "",
      required: false,
      logicEnabled: false,
      options: CHOICE_TYPES.has(normalizedType)
        ? [createOption("Вариант 1"), createOption("Вариант 2")]
        : [],
      ratingLabels: normalizedType === "rating" ? { low: "", high: "" } : null,
      rating: normalizedType === "rating" ? { minLabel: "", maxLabel: "" } : null
    };

    page.questions.push(question);
    state.selectedQuestionId = question.id;
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
    state.selectedQuestionId = clone.id;

    renderAll();
    markDirty("Вопрос продублирован");
  }

  function removeQuestion(questionId) {
    const page = getSelectedPage();
    if (!page) return;

    const index = page.questions.findIndex((q) => q.id === questionId);
    if (index < 0) return;

    page.questions.splice(index, 1);
    const next = page.questions[index] || page.questions[index - 1] || null;
    state.selectedQuestionId = next ? next.id : null;

    renderAll();
    markDirty("Вопрос удалён");
  }

  function highlightActiveQuestion() {
    refs.questionList.querySelectorAll(".question-card").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.questionId === state.selectedQuestionId);
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
    if (isSaving) return;
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
          if (!text) return null;
          const parsedJumpIndex = parseJumpIndex(item.jumpToPageIndex);
          return {
            id: String(item.id || createId()),
            text,
            imageUrl: String(item.imageUrl || ""),
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
