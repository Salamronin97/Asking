(function () {
  const params = new URLSearchParams(window.location.search);
  const surveyId = params.get("surveyId") || params.get("id") || "";

  const els = {
    surveyTitle: document.getElementById("surveyTitle"),
    surveyMeta: document.getElementById("surveyMeta"),
    responseCount: document.getElementById("responseCount"),
    builderLink: document.getElementById("builderLink"),
    statsGrid: document.getElementById("statsGrid"),
    emptyState: document.getElementById("emptyState"),
    loadingState: document.getElementById("loadingState"),
    resultsContent: document.getElementById("resultsContent"),
    openSurveyEmptyBtn: document.getElementById("openSurveyEmptyBtn"),
    responsesSummary: document.getElementById("responsesSummary"),
    analyticsSummary: document.getElementById("analyticsSummary"),
    responsesList: document.getElementById("responsesList"),
    analyticsList: document.getElementById("analyticsList"),
    drawer: document.getElementById("responseDrawer"),
    drawerTitle: document.getElementById("drawerTitle"),
    drawerStatus: document.getElementById("drawerStatus"),
    drawerBody: document.getElementById("drawerBody"),
    closeDrawer: document.getElementById("closeDrawerBtn"),
    exportCsv: document.getElementById("exportCsvBtn"),
    exportExcel: document.getElementById("exportExcelBtn"),
    refresh: document.getElementById("refreshBtn")
  };

  const state = {
    survey: null,
    questions: [],
    responses: [],
    summary: null
  };

  function currentLang() {
    return window.AskingLang?.getLang?.() || localStorage.getItem("asking_language") || "ru";
  }

  function untitledLabel() {
    return { en: "Untitled", kz: "Атаусыз", ru: "Без названия" }[currentLang()] || "Без названия";
  }

  function applySharedTranslations() {
    window.AskingLang?.applyTranslations?.();
  }

  async function apiRequest(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return null;
      }
      throw new Error(data.error || "Ошибка запроса");
    }
    return data;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatRelative(iso) {
    if (!iso) return "-";
    const date = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayDiff = Math.round((startOfToday - startOfDate) / 86400000);
    const diff = Math.max(0, now.getTime() - date.getTime());
    const minutes = Math.round(diff / 60000);
    if (minutes < 1) return "только что";
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.round(minutes / 60);
    if (hours < 24 && dayDiff === 0) return `${hours} ч назад`;
    if (dayDiff === 0) return "Сегодня";
    if (dayDiff === 1) return "Вчера";
    return `${dayDiff} ${pluralRu(dayDiff, ["день", "дня", "дней"])} назад`;
  }

  function formatDateTime(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
  }

  function formatDuration(seconds) {
    const value = Math.max(0, Number(seconds || 0));
    const mins = Math.floor(value / 60);
    const secs = Math.round(value % 60);
    if (mins <= 0) return `${secs} с`;
    return `${mins} мин ${String(secs).padStart(2, "0")} с`;
  }

  function pluralRu(count, forms) {
    const value = Math.abs(Number(count));
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
  }

  function normalizeQuestion(question) {
    const rawType = String(question?.type || "").toLowerCase();
    const options = Array.isArray(question?.options) ? question.options : [];
    const hasImages = options.some((option) => option?.imageUrl);
    return {
      ...question,
      id: Number(question.id),
      title: String(question.text || question.question_text || "Вопрос без названия"),
      helpText: String(question.helpText || question.help_text || ""),
      type: hasImages ? "image_choice" : rawType === "multi" ? "multi" : rawType === "select" ? "dropdown" : rawType || "text",
      options: options.map((option, index) => ({
        id: option?.id || `option_${index}`,
        label: String(option?.text || option?.label || untitledLabel()),
        image: String(option?.imageUrl || option?.image || "")
      }))
    };
  }

  function responseAnswerMap(response) {
    const map = new Map();
    (response.answers || []).forEach((answer) => {
      map.set(Number(answer.questionId), answer.value);
    });
    return map;
  }

  function answerValue(response, question) {
    return responseAnswerMap(response).get(Number(question.id));
  }

  function inferQuestionType(question) {
    if (question.type === "rating") {
      const source = `${question.title || ""} ${question.helpText || ""}`;
      const values = state.responses
        .map((response) => Number(answerValue(response, question)))
        .filter((value) => Number.isFinite(value));
      if (/nps|recommend|порекоменду|рекоменд|0\s*[-–—]\s*10|10/i.test(source) || values.some((value) => value > 5 || value === 0)) {
        return "nps";
      }
    }
    return question.type;
  }

  function formatAnswer(value) {
    if (Array.isArray(value)) return value.map(formatAnswer).join(", ");
    if (value && typeof value === "object") return value.label || value.text || JSON.stringify(value);
    return value === undefined || value === null || value === "" ? "-" : String(value);
  }

  function findQuestionByHint(hints) {
    const normalized = hints.map((hint) => String(hint).toLowerCase());
    return state.questions.find((question) => {
      const source = `${question.title} ${question.helpText}`.toLowerCase();
      return normalized.some((hint) => source.includes(hint));
    });
  }

  function respondentFor(response) {
    const storedName = String(response.respondentName || response.respondent_name || "").trim();
    const storedEmail = String(response.respondentEmail || response.respondent_email || "").trim();
    if (storedName || storedEmail) {
      return {
        name: storedName || `Участник #${response.id}`,
        email: storedEmail || "Email не указан"
      };
    }
    const map = responseAnswerMap(response);
    const nameQuestion = findQuestionByHint(["name", "имя", "как вас зовут"]);
    const emailQuestion = findQuestionByHint(["email", "e-mail", "почта"]);
    const name = nameQuestion ? formatAnswer(map.get(nameQuestion.id)) : "";
    const email = emailQuestion ? formatAnswer(map.get(emailQuestion.id)) : "";
    return {
      name: name && name !== "-" ? name : `Участник #${response.id}`,
      email: email && email !== "-" ? email : "Email не указан"
    };
  }

  function answerCount(response) {
    return (response.answers || []).filter((answer) => answer.value !== undefined && answer.value !== null && answer.value !== "").length;
  }

  function getSummary() {
    const total = state.responses.length;
    const completed = state.responses.filter((item) => item.status === "completed").length;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const avgTime = completed
      ? Math.round(state.responses.filter((item) => item.status === "completed").reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0) / completed)
      : 0;
    const last = state.responses[0]?.submittedAt || state.responses[0]?.completedAt || state.responses[0]?.createdAt || null;
    return { total, completed, completionRate, avgTime, last };
  }

  function render() {
    const summary = getSummary();
    if (els.loadingState) els.loadingState.hidden = true;
    els.builderLink.href = surveyId ? `/create-v2?surveyId=${encodeURIComponent(surveyId)}` : "/create-v2";
    els.openSurveyEmptyBtn.href = surveyId ? `/s/${encodeURIComponent(surveyId)}` : "#";
    if (state.survey?.title) {
      els.surveyTitle.setAttribute("data-no-i18n", "");
      els.surveyTitle.textContent = state.survey.title;
    } else {
      els.surveyTitle.removeAttribute("data-no-i18n");
      els.surveyTitle.textContent = "Результаты";
    }
    els.responseCount.textContent = String(summary.total);
    els.surveyMeta.textContent = summary.total
      ? `${summary.total} ${pluralRu(summary.total, ["ответ", "ответа", "ответов"])}. Последний ответ ${formatRelative(summary.last)}.`
      : "Ответов пока нет.";

    renderStats(summary);
    els.emptyState.hidden = summary.total > 0;
    els.resultsContent.hidden = summary.total === 0;
    if (!summary.total) return;

    els.responsesSummary.textContent = `${summary.total} ${pluralRu(summary.total, ["ответ", "ответа", "ответов"])}`;
    els.analyticsSummary.textContent = `${state.questions.length} ${pluralRu(state.questions.length, ["вопрос", "вопроса", "вопросов"])}`;
    renderResponses();
    renderAnalytics();
    applySharedTranslations();
  }

  function renderStats(summary) {
    const stats = [
      ["Всего ответов", summary.total, summary.total ? `${summary.completed} завершено` : "Ожидаем первые ответы"],
      ["Процент завершения", `${summary.completionRate}%`, `${summary.completed} завершено`],
      ["Среднее время", summary.avgTime ? formatDuration(summary.avgTime) : "0 с", "Среди завершённых ответов"],
      ["Последний ответ", summary.last ? formatRelative(summary.last) : "-", summary.last ? formatDateTime(summary.last) : "Активности пока нет"]
    ];
    els.statsGrid.innerHTML = stats.map(([label, value, detail]) => `
      <article class="rv2-stat">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <p>${escapeHtml(detail)}</p>
      </article>
    `).join("");
  }

  function renderResponses() {
    els.responsesList.innerHTML = state.responses.map((response) => {
      const respondent = respondentFor(response);
      const submittedAt = response.submittedAt || response.completedAt || response.createdAt;
      return `
        <article class="rv2-response-card" tabindex="0" role="button" data-response-id="${response.id}" aria-label="Открыть ответ ${response.id}">
          <div class="rv2-response-card__top">
            <h3>Ответ #${response.id}</h3>
            <span class="rv2-pill">${escapeHtml(response.status === "partial" ? "Частичный" : "Завершён")}</span>
          </div>
          <div class="rv2-respondent">
            <span class="rv2-avatar">${escapeHtml(respondent.name.slice(0, 1).toUpperCase())}</span>
            <div>
              <p><span>Участник:</span> <strong data-no-i18n>${escapeHtml(respondent.name)}</strong></p>
              <p><span>Email:</span> ${escapeHtml(respondent.email)}</p>
            </div>
          </div>
          <div class="rv2-response-card__meta">
            <span>${formatRelative(submittedAt)}</span>
            <span>${formatDuration(response.durationSeconds)}</span>
            <span>${answerCount(response)} ${pluralRu(answerCount(response), ["ответ", "ответа", "ответов"])}</span>
          </div>
          <div class="rv2-response-card__foot">
            <p>${escapeHtml(answerPreview(response))}</p>
            <span class="rv2-linklike">Открыть ответ</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function answerPreview(response) {
    const firstChoice = state.questions.find((question) => ["single", "multi", "dropdown", "image_choice"].includes(inferQuestionType(question)));
    const rating = state.questions.find((question) => inferQuestionType(question) === "rating");
    const choiceText = firstChoice ? formatAnswer(answerValue(response, firstChoice)) : "Ответ отправлен";
    const ratingText = rating && answerValue(response, rating) ? ` Оценка ${formatAnswer(answerValue(response, rating))}.` : "";
    return `${choiceText}.${ratingText}`;
  }

  function renderAnalytics() {
    els.analyticsList.innerHTML = state.questions.map((question) => renderQuestionAnalytics(question)).join("");
  }

  function renderQuestionAnalytics(question) {
    const answered = state.responses.filter((response) => {
      const value = answerValue(response, question);
      return !(value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length));
    });
    const type = inferQuestionType(question);
    return `
      <article class="rv2-analytics-card">
        <header class="rv2-analytics-card__head">
          <div>
            <h3 data-no-i18n>${escapeHtml(question.title)}</h3>
            <p>${escapeHtml(typeLabel(type))}</p>
          </div>
          <span class="rv2-pill">${answered.length} ${pluralRu(answered.length, ["ответ", "ответа", "ответов"])}</span>
        </header>
        ${renderVisualization(question, type, answered)}
      </article>
    `;
  }

  function typeLabel(type) {
    return {
      text: "Текст",
      participant_name: "Имя участника",
      participant_email: "Email участника",
      long_text: "Длинный текст",
      email: "Email",
      single: "Один выбор",
      multi: "Несколько вариантов",
      dropdown: "Выпадающий список",
      image_choice: "Выбор изображений",
      rating: "Рейтинг",
      nps: "NPS",
      info: "Информационный блок"
    }[type] || "Вопрос";
  }

  function renderVisualization(question, type, answered) {
    if (["single", "dropdown"].includes(type)) return renderBars(countOptions(answered, question), answered.length);
    if (type === "multi") return renderBars(countOptions(answered, question), answered.length, true);
    if (type === "rating") return renderRating(question, answered);
    if (type === "nps") return renderNps(question, answered);
    if (type === "text" || type === "email" || type === "long_text") return renderTextList(question, answered);
    if (type === "image_choice") return renderImageDistribution(question, answered);
    return `<p>Этот информационный блок не собирал ответы.</p>`;
  }

  function countOptions(answered, question) {
    const counts = new Map();
    question.options.forEach((option) => counts.set(option.label, 0));
    answered.forEach((response) => {
      const value = answerValue(response, question);
      const values = Array.isArray(value) ? value : [value];
      values.forEach((item) => {
        const label = formatAnswer(item);
        counts.set(label, (counts.get(label) || 0) + 1);
      });
    });
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }

  function renderBars(rows, total, allowMultiple = false) {
    const denominator = Math.max(1, total);
    return `<div class="rv2-bars">
      ${rows.map((row) => {
        const percent = Math.round((row.count / denominator) * 100);
        return `
          <div class="rv2-bar-row">
            <div class="rv2-bar-row__top"><span data-no-i18n>${escapeHtml(row.label)}</span><span>${percent}%</span></div>
            <div class="rv2-bar-row__track"><span style="width:${Math.max(2, percent)}%"></span></div>
          </div>
        `;
      }).join("")}
      ${allowMultiple ? `<p>Можно выбрать несколько вариантов, поэтому сумма может превышать 100%.</p>` : ""}
    </div>`;
  }

  function renderRating(question, answered) {
    const values = answered.map((response) => Number(answerValue(response, question))).filter((value) => Number.isFinite(value));
    const avg = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const max = Math.max(5, ...values, 1);
    const rows = Array.from({ length: max }, (_, index) => {
      const value = index + 1;
      return { label: `${value}`, count: values.filter((item) => item === value).length };
    }).reverse();
    return `
      <div class="rv2-rating-summary">
        <div class="rv2-score-card"><div><strong>${avg.toFixed(1)}</strong><span>Средняя оценка</span></div></div>
        ${renderBars(rows, Math.max(1, values.length))}
      </div>
    `;
  }

  function renderNps(question, answered) {
    const scores = answered.map((response) => Number(answerValue(response, question))).filter((value) => Number.isFinite(value));
    const promoters = scores.filter((value) => value >= 9).length;
    const passives = scores.filter((value) => value >= 7 && value <= 8).length;
    const detractors = scores.filter((value) => value <= 6).length;
    const nps = scores.length ? Math.round(((promoters - detractors) / scores.length) * 100) : 0;
    return `
      <div class="rv2-nps-summary">
        <div class="rv2-score-card"><div><strong>${nps}</strong><span>Индекс NPS</span></div></div>
        ${renderBars([
          { label: "Промоутеры", count: promoters },
          { label: "Нейтральные", count: passives },
          { label: "Критики", count: detractors }
        ], Math.max(1, scores.length))}
      </div>
    `;
  }

  function renderTextList(question, answered) {
    const samples = answered.slice(0, 8).map((response) => answerValue(response, question)).filter(Boolean);
    return `<div class="rv2-text-feed">
      ${samples.map((sample) => `<blockquote data-no-i18n>${escapeHtml(formatAnswer(sample))}</blockquote>`).join("") || "<p>Ответов пока нет.</p>"}
    </div>`;
  }

  function renderImageDistribution(question, answered) {
    const rows = countOptions(answered, question);
    const total = Math.max(1, answered.length);
    return `<div class="rv2-image-distribution">
      ${rows.map((row) => {
        const option = question.options.find((item) => item.label === row.label) || question.options[0] || {};
        const percent = Math.round((row.count / total) * 100);
        return `
          <div class="rv2-image-option">
            ${option.image ? `<img src="${escapeHtml(option.image)}" alt="" loading="lazy" />` : ""}
            <div>
              <span data-no-i18n>${escapeHtml(row.label)}</span>
              <div class="rv2-bar-row__track"><span style="width:${Math.max(2, percent)}%"></span></div>
              <small>${percent}%</small>
            </div>
          </div>
        `;
      }).join("")}
    </div>`;
  }

  function openDrawer(responseId) {
    const response = state.responses.find((item) => String(item.id) === String(responseId));
    if (!response) return;
    const respondent = respondentFor(response);
    els.drawerTitle.textContent = `Ответ #${response.id}`;
    els.drawerStatus.textContent = response.status === "partial" ? "Частичный" : "Завершён";
    els.drawerBody.innerHTML = `
      <div class="rv2-detail-grid">
        <div><span>Участник</span><strong data-no-i18n>${escapeHtml(respondent.name)}</strong></div>
        <div><span>Email</span><strong>${escapeHtml(respondent.email)}</strong></div>
        <div><span>Отправлено</span><strong>${escapeHtml(formatDateTime(response.submittedAt || response.completedAt || response.createdAt))}</strong></div>
        <div><span>Время прохождения</span><strong>${escapeHtml(formatDuration(response.durationSeconds))}</strong></div>
      </div>
      <div class="rv2-answer-list">
        ${state.questions.map((question) => `
          <article class="rv2-answer">
            <span>${escapeHtml(typeLabel(inferQuestionType(question)))}</span>
            <strong data-no-i18n>${escapeHtml(question.title)}</strong>
            <p data-no-i18n>${escapeHtml(formatAnswer(answerValue(response, question)))}</p>
          </article>
        `).join("")}
      </div>
    `;
    els.drawer.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    applySharedTranslations();
  }

  function closeDrawer() {
    els.drawer.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
  }

  function setActiveTab(tab) {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.getElementById("responsesPane").hidden = tab !== "responses";
    document.getElementById("analyticsPane").hidden = tab !== "analytics";
  }

  async function loadResults() {
    if (els.loadingState) els.loadingState.hidden = false;
    els.emptyState.hidden = true;
    els.resultsContent.hidden = true;
    if (!surveyId) {
      if (els.loadingState) els.loadingState.hidden = true;
      els.surveyTitle.textContent = "Не указан ID анкеты";
      els.surveyMeta.textContent = "Откройте результаты из кабинета или конструктора.";
      els.emptyState.hidden = false;
      els.resultsContent.hidden = true;
      applySharedTranslations();
      return;
    }
    const data = await apiRequest(`/api/surveys/${encodeURIComponent(surveyId)}/results-v2`);
    if (!data) return;
    state.survey = data.survey;
    state.questions = Array.isArray(data.questions) ? data.questions.map(normalizeQuestion) : [];
    state.responses = Array.isArray(data.responses) ? data.responses : [];
    state.summary = data.summary || null;
    render();
  }

  function bindEvents() {
    document.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => setActiveTab(button.dataset.tab));
    });
    els.responsesList.addEventListener("click", (event) => {
      const card = event.target.closest("[data-response-id]");
      if (card) openDrawer(card.dataset.responseId);
    });
    els.responsesList.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-response-id]");
      if (card) {
        event.preventDefault();
        openDrawer(card.dataset.responseId);
      }
    });
    els.closeDrawer.addEventListener("click", closeDrawer);
    els.drawer.addEventListener("click", (event) => {
      if (event.target === els.drawer) closeDrawer();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer();
    });
    els.exportCsv.addEventListener("click", () => {
      if (surveyId) window.location.href = `/api/surveys/${encodeURIComponent(surveyId)}/export.csv`;
    });
    els.exportExcel.addEventListener("click", () => {
      if (surveyId) window.location.href = `/api/surveys/${encodeURIComponent(surveyId)}/export.xlsx`;
    });
    els.refresh.addEventListener("click", loadResults);
  }

  bindEvents();
  loadResults().catch((error) => {
    if (els.loadingState) els.loadingState.hidden = true;
    els.surveyTitle.textContent = "Не удалось загрузить результаты";
    els.surveyMeta.textContent = error.message || "Неизвестная ошибка";
    els.emptyState.hidden = false;
    els.resultsContent.hidden = true;
    applySharedTranslations();
  });

  window.addEventListener("asking:languagechange", render);
})();
