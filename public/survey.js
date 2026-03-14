(() => {
  "use strict";

  const ownerApp = document.getElementById("ownerApp");
  const publicApp = document.getElementById("publicApp");
  const surveyCard = document.getElementById("surveyCard");
  const authBtn = document.getElementById("authBtn");
  const surveyToast = document.getElementById("surveyToast");

  const shareModal = document.getElementById("shareModal");
  const shareModalClose = document.getElementById("shareModalClose");
  const shareLinkText = document.getElementById("shareLinkText");
  const shareCopyBtn = document.getElementById("shareCopyBtn");
  const shareOpenBtn = document.getElementById("shareOpenBtn");

  const api = {
    async request(url, options) {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Ошибка запроса");
      return data;
    }
  };

  const ownerState = {
    me: null,
    surveyId: null,
    survey: null,
    pages: [],
    questions: [],
    activeTab: "constructor"
  };

  const publicState = {
    lang: "ru",
    currentStep: 0,
    history: [0],
    logicNotice: ""
  };

  const PUBLIC_I18N = {
    ru: {
      invalidLink: "Некорректная ссылка на анкету",
      selectRating: "Выберите оценку",
      selectOption: "Выберите вариант",
      next: "Далее",
      back: "Назад",
      finish: "Отправить",
      success: "Ответ успешно отправлен.",
      inactiveTitle: "Анкета сейчас недоступна",
      inactiveLead: "Форма временно не принимает ответы.",
      cannotOpen: "Не удалось открыть анкету",
      progress: "Страница {current} из {total}",
      previewMode: "Режим предпросмотра: анкета пока не опубликована."
      ,
      logicJumpTo: "Переход по условию: {page}"
    }
  };

  function showToast(message, isError = false) {
    if (!surveyToast) return;
    surveyToast.textContent = message;
    surveyToast.hidden = false;
    surveyToast.classList.toggle("is-error", isError);
    surveyToast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      surveyToast.classList.remove("is-visible");
      setTimeout(() => {
        surveyToast.hidden = true;
      }, 180);
    }, 2200);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeType(type) {
    const normalized = String(type || "text").trim().toLowerCase();
    if (normalized === "multi") return "multiple";
    if (normalized === "dropdown") return "select";
    if (["text", "single", "multiple", "rating", "select"].includes(normalized)) return normalized;
    return "text";
  }

  function toLocalDateTimeValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function toIsoOrNull(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  function getSurveyIdFromQuery() {
    const value = Number(new URLSearchParams(window.location.search).get("id") || 0);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  function getSurveyIdFromPath() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;
    if (parts[0] !== "survey" && parts[0] !== "s") return null;
    const value = Number(parts[1]);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  function getPublicSurveyLink(id) {
    return `${window.location.origin}/survey/${id}`;
  }

  async function initAuthButton() {
    try {
      const me = await api.request("/api/auth/me");
      if (me.user) {
        authBtn.textContent = "Выйти";
        authBtn.onclick = async () => {
          await api.request("/api/auth/logout", { method: "POST" }).catch(() => {});
          window.location.href = "/auth";
        };
        return me.user;
      }
      authBtn.textContent = "Войти";
      authBtn.onclick = () => {
        window.location.href = "/auth";
      };
      return null;
    } catch {
      authBtn.textContent = "Войти";
      authBtn.onclick = () => {
        window.location.href = "/auth";
      };
      return null;
    }
  }

  function setTab(tab) {
    ownerState.activeTab = tab;
    document.querySelectorAll(".survey-tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.tab === tab);
    });
    document.querySelectorAll(".survey-pane").forEach((pane) => {
      pane.classList.toggle("is-active", pane.dataset.pane === tab);
    });
  }

  function statusLabel(status) {
    if (status === "archived") return "Архив";
    if (status === "published") return "Опубликована";
    return "Черновик";
  }

  function typeLabel(type) {
    const map = {
      text: "Текст",
      single: "Один выбор",
      multiple: "Множественный",
      rating: "Рейтинг",
      select: "Список"
    };
    return map[normalizeType(type)] || "Текст";
  }

  function normalizeQuestionFromApi(question) {
    return {
      ...question,
      type: normalizeType(question.type),
      options: Array.isArray(question.options)
        ? question.options
            .map((item) => {
              if (typeof item === "string") return { text: item, imageUrl: "", jumpToPageIndex: null, jumpToPageId: "" };
              if (!item || typeof item !== "object") return null;
              const text = String(item.text || "").trim();
              const imageUrl = String(item.imageUrl || "");
              const jumpToPageIndexRaw = Number(item.jumpToPageIndex);
              if (!text && !imageUrl) return null;
              return {
                text: text || "Option",
                imageUrl,
                jumpToPageId: String(item.jumpToPageId || item.targetPageId || ""),
                jumpToPageIndex: Number.isInteger(jumpToPageIndexRaw) ? jumpToPageIndexRaw : null
              };
            })
            .filter(Boolean)
        : []
    };
  }

  function normalizeOwnerPageFromApi(page, index) {
    return {
      id: String(page?.id || `page_${index + 1}`),
      title: String(page?.title || `Страница ${index + 1}`),
      orderIndex: Number.isFinite(Number(page?.order_index)) ? Number(page.order_index) : index
    };
  }

  function getQuestionValue(form, question) {
    const key = `q_${question.id}`;
    if (question.type === "multiple") {
      return Array.from(form.querySelectorAll(`input[name='${key}']:checked`)).map((node) => node.value);
    }
    const input = form.querySelector(`[name='${key}']`);
    return String(input?.value || "").trim();
  }

  function buildPublicPages(pagesRaw, questions) {
    const pages = Array.isArray(pagesRaw)
      ? pagesRaw
          .map((page, index) => ({
            id: String(page?.id || `page_${index}`),
            title: String(page?.title || `Страница ${index + 1}`),
            orderIndex: Number.isFinite(Number(page?.order_index)) ? Number(page.order_index) : index,
            questions: []
          }))
          .sort((a, b) => a.orderIndex - b.orderIndex)
      : [];

    const pageMap = new Map(pages.map((page) => [page.id, page]));
    questions.forEach((question) => {
      const key = String(question.pageId || question.page_id || "");
      if (pageMap.has(key)) {
        pageMap.get(key).questions.push(question);
      }
    });

    if (!pages.length) {
      return [{ id: "page_1", title: "Страница 1", orderIndex: 0, questions: [...questions] }];
    }

    const assigned = pages.some((page) => page.questions.length > 0);
    if (!assigned) {
      pages[0].questions = [...questions];
    }

    return pages.filter((page) => page.questions.length > 0);
  }

  function resolveJumpIndex(option, pages) {
    if (!option || typeof option !== "object") return null;
    if (Number.isInteger(option.jumpToPageIndex) && option.jumpToPageIndex >= 0 && option.jumpToPageIndex < pages.length) {
      return option.jumpToPageIndex;
    }
    const byId = String(option.jumpToPageId || "").trim();
    if (!byId) return null;
    const index = pages.findIndex((page) => String(page.id) === byId);
    return index >= 0 ? index : null;
  }

  function resolveNextPageIndex(currentIndex, pages, form) {
    const page = pages[currentIndex];
    if (!page) return currentIndex;

    for (const question of page.questions) {
      if (!question.logicEnabled) continue;
      const value = getQuestionValue(form, question);
      if ((Array.isArray(value) && !value.length) || (!Array.isArray(value) && !value)) continue;
      const options = Array.isArray(question.options) ? question.options : [];

      if (Array.isArray(value)) {
        for (const option of options) {
          if (!value.includes(option.text)) continue;
          const jumpIndex = resolveJumpIndex(option, pages);
          if (Number.isInteger(jumpIndex) && jumpIndex !== currentIndex) return jumpIndex;
        }
        continue;
      }

      const selected = options.find((option) => option.text === value);
      const jumpIndex = resolveJumpIndex(selected, pages);
      if (Number.isInteger(jumpIndex) && jumpIndex !== currentIndex) return jumpIndex;
    }

    return Math.min(pages.length - 1, currentIndex + 1);
  }

  function renderOwnerHead() {
    const title = document.getElementById("ownerSurveyTitle");
    const description = document.getElementById("ownerSurveyDescription");
    const status = document.getElementById("ownerSurveyStatus");
    const publishToggleBtn = document.getElementById("publishToggleBtn");

    title.textContent = ownerState.survey.title || "Без названия";
    description.textContent = ownerState.survey.description || "Описание не заполнено.";
    status.textContent = statusLabel(ownerState.survey.status);
    status.classList.toggle("is-archived", ownerState.survey.status === "archived");

    publishToggleBtn.textContent = ownerState.survey.status === "archived" ? "Опубликовать" : "Снять с публикации";
  }

  function renderQuestionPreview() {
    const list = document.getElementById("questionsList");
    if (!list) return;

    if (!ownerState.questions.length) {
      list.innerHTML = `
        <div class="builder-empty-state">
          <h3 class="builder-empty-state__title">В анкете пока нет вопросов</h3>
          <p class="builder-empty-state__lead">Откройте конструктор и добавьте первый вопрос.</p>
          <a class="btn btn--primary" href="/create?surveyId=${ownerState.surveyId}">Добавить вопрос</a>
        </div>
      `;
      return;
    }

    list.innerHTML = ownerState.questions
      .map((question, index) => {
        const requiredText = question.required ? " • обязательный" : "";
        return `
          <article class="question-card is-visible">
            <div class="question-card__head">
              <div class="question-card__left">
                <div class="question-card__title-wrap">
                  <h4 class="q-title">${index + 1}. ${escapeHtml(question.text || "Вопрос без текста")}</h4>
                  <div class="q-meta">${typeLabel(question.type)}${requiredText}</div>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function fillOwnerSettings() {
    const s = ownerState.survey;
    document.getElementById("settingsTitle").value = s.title || "";
    document.getElementById("settingsDescription").value = s.description || "";
    document.getElementById("settingsAudience").value = s.audience || "";
    document.getElementById("settingsStartsAt").value = toLocalDateTimeValue(s.starts_at);
    document.getElementById("settingsEndsAt").value = toLocalDateTimeValue(s.ends_at);
    document.getElementById("settingsAllowMulti").checked = Boolean(s.allow_multiple_responses);
  }

  function renderResultsSummary(data) {
    const summary = document.getElementById("resultsSummary");
    summary.innerHTML = `
      <article class="stat-card"><span>Всего ответов</span><strong>${Number(data.summary?.totalResponses || 0)}</strong></article>
      <article class="stat-card"><span>Вопросов</span><strong>${ownerState.questions.length}</strong></article>
      <article class="stat-card"><span>Тренд (дней)</span><strong>${Array.isArray(data.trend) ? data.trend.length : 0}</strong></article>
      <article class="stat-card"><span>Статус</span><strong>${data.summary?.active ? "Активна" : "Неактивна"}</strong></article>
    `;
  }

  function renderResultsCards(data) {
    const container = document.getElementById("resultsStats");
    const blocks = (data.results || [])
      .map((item) => {
        const itemType = normalizeType(item.type);

        if (itemType === "rating") {
          return `
            <article class="card result-card">
              <h4>${escapeHtml(item.text)}</h4>
              <p>Средняя оценка: <strong>${Number(item.average || 0).toFixed(2)}</strong></p>
            </article>
          `;
        }

        if (itemType === "single" || itemType === "multiple" || itemType === "select") {
          const rows = Object.entries(item.counts || {})
            .map(([k, v]) => `<li><span>${escapeHtml(k)}</span><strong>${Number(v)}</strong></li>`)
            .join("");
          return `
            <article class="card result-card">
              <h4>${escapeHtml(item.text)}</h4>
              <ul class="result-list">${rows || "<li><span>Нет данных</span><strong>0</strong></li>"}</ul>
            </article>
          `;
        }

        return `
          <article class="card result-card">
            <h4>${escapeHtml(item.text)}</h4>
            <p>Текстовые ответы: ${Array.isArray(item.samples) ? item.samples.length : 0}</p>
          </article>
        `;
      })
      .join("");
    container.innerHTML = blocks || "<div class='card'>Пока нет статистики по ответам.</div>";
  }

  function renderResponsesTable(data) {
    const head = document.getElementById("responsesHead");
    const body = document.getElementById("responsesBody");
    const columns = data.columns || [];
    const rows = data.rows || [];

    head.innerHTML = `<tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
    body.innerHTML = rows
      .map((row) => `<tr class="table-row">${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("");

    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="${Math.max(columns.length, 1)}"><div class="cabinet-empty">Пока нет ответов.</div></td></tr>`;
    }
  }

  async function loadResults() {
    try {
      const [resultData, tableData] = await Promise.all([
        api.request(`/api/surveys/${ownerState.surveyId}/results`),
        api.request(`/api/surveys/${ownerState.surveyId}/responses-table`)
      ]);
      renderResultsSummary(resultData);
      renderResultsCards(resultData);
      renderResponsesTable(tableData);
    } catch (error) {
      document.getElementById("resultsStats").innerHTML = `<div class="card">${escapeHtml(error.message)}</div>`;
    }
  }

  function initAccessSettings() {
    const storageKey = `asking_access_${ownerState.surveyId}`;
    const defaults = {
      publicLink: true,
      passwordEnabled: false,
      password: "",
      responseLimit: "",
      anonymous: false
    };

    let value = defaults;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) value = { ...defaults, ...JSON.parse(raw) };
    } catch {
      value = defaults;
    }

    const publicLink = document.getElementById("accessPublicLink");
    const passwordEnabled = document.getElementById("accessPasswordEnabled");
    const password = document.getElementById("accessPassword");
    const passwordWrap = document.getElementById("accessPasswordWrap");
    const responseLimit = document.getElementById("accessLimit");
    const anonymous = document.getElementById("accessAnonymous");
    const saveBtn = document.getElementById("saveAccessBtn");

    publicLink.checked = Boolean(value.publicLink);
    passwordEnabled.checked = Boolean(value.passwordEnabled);
    password.value = value.password || "";
    responseLimit.value = value.responseLimit || "";
    anonymous.checked = Boolean(value.anonymous);

    const syncPassword = () => {
      passwordWrap.hidden = !passwordEnabled.checked;
    };
    syncPassword();

    passwordEnabled.addEventListener("change", syncPassword);

    saveBtn.addEventListener("click", () => {
      const payload = {
        publicLink: publicLink.checked,
        passwordEnabled: passwordEnabled.checked,
        password: password.value.trim(),
        responseLimit: responseLimit.value,
        anonymous: anonymous.checked
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      showToast("Параметры доступа сохранены локально");
    });
  }

  function initShareModal() {
    const shareBtn = document.getElementById("shareBtn");
    const link = getPublicSurveyLink(ownerState.surveyId);

    shareBtn.addEventListener("click", () => {
      shareLinkText.textContent = link;
      shareOpenBtn.href = link;
      shareModal.hidden = false;
    });

    shareModalClose.addEventListener("click", () => {
      shareModal.hidden = true;
    });

    shareModal.addEventListener("click", (event) => {
      if (event.target === shareModal) shareModal.hidden = true;
    });

    shareCopyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(link);
        showToast("Ссылка скопирована");
      } catch {
        showToast("Не удалось скопировать ссылку", true);
      }
    });
  }

  function buildOwnerPayload() {
    const normalizedPages = Array.isArray(ownerState.pages)
      ? ownerState.pages.map((page, index) => normalizeOwnerPageFromApi(page, index))
      : [];
    const pagesPayload = normalizedPages.map((page, index) => ({
      id: page.id,
      title: String(page.title || `Страница ${index + 1}`).trim() || `Страница ${index + 1}`,
      orderIndex: index,
      questions: []
    }));
    const pageIndexById = new Map(pagesPayload.map((page, index) => [String(page.id), index]));
    const fallbackQuestions = [];
    const normalizedQuestions = ownerState.questions.map((q, index) => ({
      text: String(q.text || "").trim(),
      type: q.type === "multiple" ? "multi" : q.type === "select" ? "dropdown" : q.type,
      required: q.required !== false,
      options: Array.isArray(q.options) ? q.options : [],
      order: Number.isFinite(q.order) ? q.order : index
    }));
    normalizedQuestions.forEach((question, index) => {
      const pageId = String(ownerState.questions[index]?.pageId || ownerState.questions[index]?.page_id || "");
      const targetIndex = pageIndexById.has(pageId) ? pageIndexById.get(pageId) : 0;
      if (pagesPayload[targetIndex]) {
        pagesPayload[targetIndex].questions.push(question);
      } else {
        fallbackQuestions.push(question);
      }
    });
    if (fallbackQuestions.length) {
      if (!pagesPayload.length) {
        pagesPayload.push({ title: "Страница 1", orderIndex: 0, questions: [...fallbackQuestions] });
      } else {
        pagesPayload[0].questions = [...(pagesPayload[0].questions || []), ...fallbackQuestions];
      }
    }

    return {
      title: document.getElementById("settingsTitle").value.trim(),
      description: document.getElementById("settingsDescription").value.trim(),
      audience: document.getElementById("settingsAudience").value.trim(),
      startsAt: toIsoOrNull(document.getElementById("settingsStartsAt").value),
      endsAt: toIsoOrNull(document.getElementById("settingsEndsAt").value),
      allowMultipleResponses: document.getElementById("settingsAllowMulti").checked,
      pages: pagesPayload.length ? pagesPayload : [{ title: "Страница 1", orderIndex: 0, questions: normalizedQuestions }],
      questions: normalizedQuestions
    };
  }

  function setOwnerStatus(message, isError = false) {
    const status = document.getElementById("surveyTabStatus");
    status.textContent = message;
    status.style.color = isError ? "#b91c1c" : "#334155";
  }

  async function saveSettings() {
    const payload = buildOwnerPayload();
    if (!payload.title || payload.title.length < 3) {
      setOwnerStatus("Название анкеты должно содержать минимум 3 символа.", true);
      return;
    }

    try {
      setOwnerStatus("Сохранение...");
      await api.request(`/api/surveys/${ownerState.surveyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      ownerState.survey = {
        ...ownerState.survey,
        title: payload.title,
        description: payload.description,
        audience: payload.audience,
        starts_at: payload.startsAt,
        ends_at: payload.endsAt,
        allow_multiple_responses: payload.allowMultipleResponses ? 1 : 0
      };
      renderOwnerHead();
      setOwnerStatus("Изменения сохранены.");
      showToast("Настройки сохранены");
    } catch (error) {
      setOwnerStatus(error.message || "Не удалось сохранить изменения.", true);
    }
  }

  async function togglePublishStatus() {
    const current = ownerState.survey.status;
    try {
      if (current === "archived") {
        await api.request(`/api/surveys/${ownerState.surveyId}/publish`, { method: "POST" });
        ownerState.survey.status = "published";
        showToast("Анкета опубликована");
      } else {
        await api.request(`/api/surveys/${ownerState.surveyId}/archive`, { method: "POST" });
        ownerState.survey.status = "archived";
        showToast("Анкета снята с публикации");
      }
      renderOwnerHead();
    } catch (error) {
      showToast(error.message || "Не удалось изменить статус", true);
    }
  }

  function wireOwnerEvents() {
    document.querySelectorAll(".survey-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        setTab(btn.dataset.tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", btn.dataset.tab);
        window.history.replaceState({}, "", url);
        if (btn.dataset.tab === "results") loadResults();
      });
    });

    document.getElementById("saveSettingsBtn").addEventListener("click", () => {
      saveSettings().catch((error) => setOwnerStatus(error.message || "Ошибка", true));
    });

    document.getElementById("publishToggleBtn").addEventListener("click", () => {
      togglePublishStatus();
    });

    document.getElementById("refreshResultsBtn").addEventListener("click", () => {
      loadResults();
    });
  }

  async function bootOwnerMode(surveyId) {
    const me = await initAuthButton();
    if (!me) {
      window.location.href = "/auth";
      return;
    }

    ownerState.me = me;
    ownerState.surveyId = surveyId;
    ownerApp.hidden = false;
    publicApp.hidden = true;

    const data = await api.request(`/api/surveys/${surveyId}`);
    ownerState.survey = data.survey;
    ownerState.pages = Array.isArray(data.pages) ? data.pages.map(normalizeOwnerPageFromApi) : [];
    ownerState.questions = Array.isArray(data.questions) ? data.questions.map(normalizeQuestionFromApi) : [];

    if (!ownerState.survey) {
      setOwnerStatus("Анкета не найдена.", true);
      return;
    }

    renderOwnerHead();
    fillOwnerSettings();
    renderQuestionPreview();
    initAccessSettings();
    initShareModal();

    const openBuilderLink = document.getElementById("openBuilderLink");
    openBuilderLink.href = `/create?surveyId=${surveyId}`;

    const exportCsvBtn = document.getElementById("exportCsvBtn");
    const exportXlsxBtn = document.getElementById("exportXlsxBtn");
    exportCsvBtn.href = `/api/surveys/${surveyId}/export.csv`;
    exportXlsxBtn.href = `/api/surveys/${surveyId}/export.xlsx`;

    wireOwnerEvents();

    const queryTab = new URLSearchParams(window.location.search).get("tab");
    const available = new Set(["constructor", "settings", "access", "results", "export"]);
    const firstTab = available.has(queryTab) ? queryTab : "constructor";
    setTab(firstTab);
    if (firstTab === "results") {
      loadResults();
    }
  }

  function tPublic(key) {
    return PUBLIC_I18N[publicState.lang]?.[key] || PUBLIC_I18N.ru[key] || key;
  }

  function formatPublicText(template, values) {
    return Object.keys(values).reduce((acc, key) => acc.replaceAll(`{${key}}`, values[key]), template);
  }

  function buildPublicQuestion(question) {
    const row = document.createElement("div");
    row.className = "form-row";
    row.dataset.questionId = String(question.id);

    const label = document.createElement("label");
    label.textContent = `${question.text}${question.required ? " *" : ""}`;

    if (Array.isArray(question.media) && question.media.length) {
      const mediaWrap = document.createElement("div");
      mediaWrap.className = "question-media";
      question.media.forEach((file) => {
        const img = document.createElement("img");
        img.src = file.path;
        img.alt = file.originalName || question.text || "question image";
        img.loading = "lazy";
        mediaWrap.appendChild(img);
      });
      row.appendChild(mediaWrap);
    }

    row.appendChild(label);

    const key = `q_${question.id}`;
    const options = Array.isArray(question.options) ? question.options : [];

    if (question.type === "text") {
      const textarea = document.createElement("textarea");
      textarea.name = key;
      row.appendChild(textarea);
      return row;
    }

    if (question.type === "rating") {
      const select = document.createElement("select");
      select.name = key;
      select.appendChild(new Option(tPublic("selectRating"), ""));
      [1, 2, 3, 4, 5].forEach((value) => select.appendChild(new Option(String(value), String(value))));
      row.appendChild(select);
      return row;
    }

    if (question.type === "single" || question.type === "select") {
      const select = document.createElement("select");
      select.name = key;
      select.appendChild(new Option(tPublic("selectOption"), ""));
      options.forEach((option) => {
        select.appendChild(new Option(option.text, option.text));
      });
      row.appendChild(select);
      return row;
    }

    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";

    options.forEach((option) => {
      const optionLabel = document.createElement("label");
      optionLabel.className = "inline-check";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = key;
      input.value = option.text;
      optionLabel.appendChild(input);

      if (option.imageUrl) {
        const image = document.createElement("img");
        image.src = option.imageUrl;
        image.alt = option.text;
        image.className = "option-image";
        image.loading = "lazy";
        optionLabel.appendChild(image);
      }

      optionLabel.appendChild(document.createTextNode(option.text));
      optionsWrap.appendChild(optionLabel);
    });

    row.appendChild(optionsWrap);
    return row;
  }

  function collectPublicAnswers(form, questions) {
    const answers = [];

    questions.forEach((question) => {
      const key = `q_${question.id}`;

      if (question.type === "multiple") {
        const values = Array.from(form.querySelectorAll(`input[name='${key}']:checked`)).map((node) => node.value);
        if (values.length) {
          answers.push({ questionId: question.id, value: values });
        }
        return;
      }

      const input = form.querySelector(`[name='${key}']`);
      const value = String(input?.value || "").trim();
      if (value) {
        answers.push({ questionId: question.id, value });
      }
    });

    return answers;
  }

  function renderPublicWizard(survey, pagesRaw, questions, isPreview = false) {
    publicState.currentStep = 0;
    publicState.history = [0];
    const pages = buildPublicPages(pagesRaw, questions);

    const wrap = document.createElement("div");
    wrap.innerHTML = `<h2>${escapeHtml(survey.title)}</h2><p>${escapeHtml(survey.description || "")}</p>`;

    if (isPreview) {
      const note = document.createElement("p");
      note.className = "status";
      note.style.color = "#0f766e";
      note.textContent = tPublic("previewMode");
      wrap.appendChild(note);
    }

    const progress = document.createElement("div");
    progress.className = "survey-progress";
    const progressText = document.createElement("div");
    progressText.className = "survey-progress__text";
    const logicBadge = document.createElement("span");
    logicBadge.className = "survey-logic-badge";
    logicBadge.textContent = "Логика переходов";
    const progressTrack = document.createElement("div");
    progressTrack.className = "survey-progress__track";
    const progressBar = document.createElement("div");
    progressBar.className = "survey-progress__bar";
    progressTrack.appendChild(progressBar);
    const hasAnyLogic = pages.some((page) => page.questions.some((question) => question.logicEnabled));
    logicBadge.hidden = !hasAnyLogic;
    progress.append(progressText, logicBadge, progressTrack);
    wrap.appendChild(progress);

    const logicNote = document.createElement("div");
    logicNote.className = "survey-logic-note";
    logicNote.hidden = true;
    wrap.appendChild(logicNote);

    const form = document.createElement("form");
    form.className = "card";
    form.style.marginTop = "12px";

    const panes = pages.map((page) => {
      const pane = document.createElement("section");
      pane.className = "wizard-pane";
      if (pages.length > 1) {
        const pageTitle = document.createElement("h3");
        pageTitle.textContent = page.title || "Страница";
        pane.appendChild(pageTitle);
      }
      page.questions.forEach((question) => {
        pane.appendChild(buildPublicQuestion(question));
      });
      form.appendChild(pane);
      return pane;
    });

    const actionRow = document.createElement("div");
    actionRow.className = "action-row";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn btn--outline";
    backBtn.textContent = tPublic("back");

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn--primary";
    nextBtn.textContent = tPublic("next");

    const finishBtn = document.createElement("button");
    finishBtn.type = "submit";
    finishBtn.className = "btn btn--primary";
    finishBtn.textContent = tPublic("finish");

    actionRow.append(backBtn, nextBtn, finishBtn);
    form.appendChild(actionRow);

    const status = document.createElement("p");
    status.className = "status";
    form.appendChild(status);

    const renderStep = () => {
      panes.forEach((pane, index) => {
        pane.hidden = index !== publicState.currentStep;
      });

      progressText.textContent = formatPublicText(tPublic("progress"), {
        current: String(publicState.currentStep + 1),
        total: String(pages.length)
      });

      progressBar.style.width = `${Math.round(((publicState.currentStep + 1) / Math.max(1, pages.length)) * 100)}%`;
      backBtn.hidden = publicState.currentStep === 0;
      nextBtn.hidden = publicState.currentStep === pages.length - 1;
      finishBtn.hidden = publicState.currentStep !== pages.length - 1;

      if (publicState.logicNotice) {
        logicNote.hidden = false;
        logicNote.textContent = publicState.logicNotice;
        logicNote.classList.add("is-visible");
        logicBadge.classList.add("is-active");
      } else {
        logicNote.hidden = true;
        logicNote.textContent = "";
        logicNote.classList.remove("is-visible");
        logicBadge.classList.remove("is-active");
      }
    };

    backBtn.addEventListener("click", () => {
      publicState.logicNotice = "";
      if (publicState.history.length > 1) {
        publicState.history.pop();
        publicState.currentStep = publicState.history[publicState.history.length - 1];
      } else {
        publicState.currentStep = Math.max(0, publicState.currentStep - 1);
      }
      renderStep();
    });

    nextBtn.addEventListener("click", () => {
      const nextIndex = resolveNextPageIndex(publicState.currentStep, pages, form);
      const linearIndex = Math.min(pages.length - 1, publicState.currentStep + 1);
      if (nextIndex !== linearIndex) {
        const targetTitle = pages[nextIndex]?.title || `Страница ${nextIndex + 1}`;
        publicState.logicNotice = formatPublicText(tPublic("logicJumpTo"), { page: targetTitle });
      } else {
        publicState.logicNotice = "";
      }
      publicState.currentStep = Math.min(pages.length - 1, Math.max(0, nextIndex));
      publicState.history.push(publicState.currentStep);
      renderStep();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const answers = collectPublicAnswers(form, questions);
        await api.request(`/api/surveys/${survey.id}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers })
        });
        status.textContent = tPublic("success");
        status.style.color = "#166534";
        finishBtn.disabled = true;
        nextBtn.disabled = true;
        backBtn.disabled = true;
      } catch (error) {
        status.textContent = error.message;
        status.style.color = "#b91c1c";
      }
    });

    renderStep();
    wrap.appendChild(form);
    return wrap;
  }

  async function bootPublicMode(surveyId) {
    await initAuthButton();

    ownerApp.hidden = true;
    publicApp.hidden = false;

    if (!surveyId) {
      surveyCard.innerHTML = `<h2>${tPublic("invalidLink")}</h2>`;
      return;
    }

    try {
      const data = await api.request(`/api/public/surveys/${surveyId}`);
      if (!data.active && !data.preview) {
        surveyCard.innerHTML = `<h2>${tPublic("inactiveTitle")}</h2><p>${tPublic("inactiveLead")}</p>`;
        return;
      }

      surveyCard.innerHTML = "";
      const questions = Array.isArray(data.questions) ? data.questions.map(normalizeQuestionFromApi) : [];
      const pages = Array.isArray(data.pages) ? data.pages : [];
      surveyCard.appendChild(renderPublicWizard(data.survey, pages, questions, Boolean(data.preview)));
    } catch (error) {
      surveyCard.innerHTML = `<h2>${tPublic("cannotOpen")}</h2><p>${escapeHtml(error.message)}</p>`;
    }
  }

  async function bootstrap() {
    const queryId = getSurveyIdFromQuery();
    if (queryId) {
      await bootOwnerMode(queryId);
      return;
    }

    const pathId = getSurveyIdFromPath();
    await bootPublicMode(pathId);
  }

  bootstrap().catch((error) => {
    showToast(error.message || "Ошибка загрузки страницы", true);
  });
})();
