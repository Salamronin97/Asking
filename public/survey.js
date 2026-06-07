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
  const THEME_STORAGE_KEY = "asking_theme";
  const WELCOME_DEFAULT_COVER =
    "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=78";
  const WELCOME_LAYOUTS = new Set(["image-right", "image-left", "image-top", "background", "typographic"]);

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
    logicNotice: "",
    accessPassword: ""
  };

  const PUBLIC_I18N = {
    ru: {
      invalidLink: "Некорректная ссылка на анкету",
      selectRating: "Выберите оценку",
      selectOption: "Выберите вариант",
      enterAccessPassword: "Введите пароль доступа",
      fillRequired: "Заполните обязательные поля на текущей странице.",
      sending: "Отправляем...",
      next: "Далее",
      back: "Назад",
      finish: "Отправить анкету",
      success: "Ответ успешно отправлен.",
      inactiveTitle: "Анкета сейчас недоступна",
      inactiveLead: "Форма временно не принимает ответы.",
      cannotOpen: "Не удалось открыть анкету",
      progress: "Страница {current} из {total}",
      logicJumpTo: "Переход по условию: {page}"
    }
  };

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

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("`", "&#96;");
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

  function getSurveyPathInfo() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;
    if (parts[0] !== "survey" && parts[0] !== "s") return null;
    const value = Number(parts[1]);
    if (!Number.isInteger(value) || value <= 0) return null;
    return { mode: parts[0] === "survey" ? "owner" : "public", surveyId: value };
  }

  function getPublicSurveyLink(id) {
    return `${window.location.origin}/s/${id}`;
  }

  async function initAuthButton() {
    try {
      const me = await api.request("/api/auth/me");
      if (me.user) {
        applyTheme(me.user.theme || "light");
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
    const questionText = String(question?.text || question?.question_text || "").trim();
    const helpText = String(question?.helpText || question?.help_text || question?.description || "").trim();
    return {
      ...question,
      text: questionText,
      helpText,
      type: normalizeType(question.type),
      panelOpacity: Number.isFinite(Number(question.panelOpacity || question.panel_opacity))
        ? Math.max(28, Math.min(100, Math.round(Number(question.panelOpacity || question.panel_opacity))))
        : 72,
      options: Array.isArray(question.options)
        ? question.options
            .map((item) => {
              if (typeof item === "string") return { text: item, imageUrl: "", jumpToPageIndex: null, jumpToPageId: "" };
              if (!item || typeof item !== "object") return null;
              const text = String(item.text || "").trim();
              const imageUrl = String(item.imageUrl || "");
              const jumpToPageIndexRaw = Number(item.jumpToPageIndex);
              const imageFitRaw = String(item.imageFit || "cover").trim().toLowerCase();
              const imageScaleRaw = Number(item.imageScale);
              if (!text && !imageUrl) return null;
              return {
                text: text || "Option",
                imageUrl,
                imageFit: imageFitRaw === "contain" ? "contain" : "cover",
                imageScale: Number.isFinite(imageScaleRaw) ? Math.max(60, Math.min(130, Math.round(imageScaleRaw))) : 100,
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
      orderIndex: Number.isFinite(Number(page?.order_index)) ? Number(page.order_index) : index,
      design: normalizePublicPageDesign(page?.design || {})
    };
  }

  function getQuestionValue(form, question) {
    const key = `q_${question.id}`;
    if (question.type === "multiple") {
      return Array.from(form.querySelectorAll(`input[name='${key}']:checked`)).map((node) => node.value);
    }
    if (question.type === "single" || question.type === "select" || question.type === "rating") {
      const checked = form.querySelector(`input[name='${key}']:checked`);
      if (checked) return String(checked.value || "").trim();
    }
    const input = form.querySelector(`[name='${key}']`);
    return String(input?.value || "").trim();
  }

  function isQuestionAnswered(form, question) {
    const value = getQuestionValue(form, question);
    return Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());
  }

  function normalizeWelcomeSettings(raw) {
    const value = raw && typeof raw === "object" ? raw : {};
    const layout = String(value.layout || "image-right");
    const opacity = Number(value.imageOpacity);
    const coverImage = String(value.coverImage || "").trim();
    const allowedImage =
      /^https?:\/\//i.test(coverImage) || coverImage.startsWith("/uploads/")
        ? coverImage
        : WELCOME_DEFAULT_COVER;
    return {
      coverImage: allowedImage,
      layout: WELCOME_LAYOUTS.has(layout) ? layout : "image-right",
      imageOpacity: Number.isFinite(opacity) ? Math.max(20, Math.min(100, Math.round(opacity))) : 86,
      imageEnabled: value.imageEnabled !== false
    };
  }

  function normalizePublicPageDesign(raw) {
    const value = raw && typeof raw === "object" ? raw : {};
    const bgImage = String(value.bgImage || "").trim();
    return {
      bgColor: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value.bgColor || "").trim()) ? String(value.bgColor).trim() : "#eaf3fb",
      bgImage: /^https?:\/\//i.test(bgImage) || bgImage.startsWith("/uploads/") ? bgImage : "",
      layout: ["full", "split-right-image", "split-left-image", "cover-top-image", "center-card"].includes(String(value.layout || "").trim())
        ? String(value.layout).trim()
        : "full",
      overlay: Number.isFinite(Number(value.overlay)) ? Math.max(0, Math.min(90, Math.round(Number(value.overlay)))) : 0,
      welcome: normalizeWelcomeSettings(value.welcome)
    };
  }

  function getRequiredValidationMessage(question) {
    const type = normalizeType(question?.type);
    if (type === "text") return "Пожалуйста, введите ответ";
    if (type === "rating") return "Пожалуйста, выберите оценку";
    if (type === "multiple") return "Пожалуйста, выберите один или несколько вариантов ответа";
    return "Пожалуйста, выберите один из вариантов ответа";
  }

  function setQuestionValidationError(row, question, isInvalid) {
    if (!row) return;
    if (isInvalid) {
      row.classList.add("is-invalid");
      row.classList.remove("animate-shake");
      void row.offsetWidth;
      row.classList.add("animate-shake");
    } else {
      row.classList.remove("is-invalid", "animate-shake");
    }
    const errorNode = row.querySelector(".public-question-row__error");
    if (!errorNode) return;
    if (isInvalid) {
      errorNode.textContent = getRequiredValidationMessage(question);
      errorNode.hidden = false;
      return;
    }
    errorNode.textContent = "";
    errorNode.hidden = true;
  }

  function clearAnsweredQuestionErrors(form, questions) {
    questions.forEach((question) => {
      const row = form.querySelector(`[data-question-id='${question.id}']`);
      if (!row || !row.classList.contains("is-invalid")) return;
      if (isQuestionAnswered(form, question)) {
        setQuestionValidationError(row, question, false);
      }
    });
  }

  function validateVisibleQuestions(form, pageQuestions) {
    let firstInvalid = null;

    pageQuestions.forEach((question) => {
      const row = form.querySelector(`[data-question-id='${question.id}']`);
      if (!row) return;
      setQuestionValidationError(row, question, false);
      if (!question.required) return;

      const valid = isQuestionAnswered(form, question);

      if (!valid) {
        setQuestionValidationError(row, question, true);
        if (!firstInvalid) firstInvalid = row;
      }
    });

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
      const focusTarget = firstInvalid.querySelector("input, textarea, select");
      focusTarget?.focus();
      return false;
    }
    return true;
  }

  function buildPublicPageBackgroundStyle(design) {
    const d = normalizePublicPageDesign(design);
    const overlayAlpha = Math.max(0.15, (d.overlay || 0) / 100);
    if (d.bgImage) {
      return `linear-gradient(rgba(15, 23, 42, ${overlayAlpha}), rgba(15, 23, 42, ${overlayAlpha})), url("${d.bgImage}") center / cover no-repeat, ${d.bgColor}`;
    }
    return `radial-gradient(circle at 12% 0%, rgba(59, 130, 246, 0.2), transparent 32%), linear-gradient(180deg, ${d.bgColor} 0%, #f8fbff 100%)`;
  }

  function isRenderablePublicPage(page) {
    return Boolean(page && Array.isArray(page.questions) && page.questions.length);
  }

  function parseLegacyPageIndex(value, pagesLength) {
    const raw = String(value || "").trim();
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) return null;
    if (parsed >= 0 && parsed < pagesLength) return parsed;
    if (parsed > 0 && parsed <= pagesLength) return parsed - 1;
    return null;
  }

  function findRenderablePageIndex(pages, startIndex, direction = 1) {
    if (!Array.isArray(pages) || !pages.length) return null;
    const step = direction < 0 ? -1 : 1;
    let index = Number.isInteger(startIndex) ? startIndex : step > 0 ? 0 : pages.length - 1;
    while (index >= 0 && index < pages.length) {
      if (isRenderablePublicPage(pages[index])) return index;
      index += step;
    }
    return null;
  }

  function normalizeRenderableTargetIndex(targetIndex, pages, currentIndex) {
    if (!Number.isInteger(targetIndex)) return currentIndex;
    const direction = targetIndex < currentIndex ? -1 : 1;
    const resolved = findRenderablePageIndex(pages, targetIndex, direction);
    return Number.isInteger(resolved) ? resolved : currentIndex;
  }

  function getRenderableProgress(pages, currentIndex) {
    const visibleIndexes = Array.isArray(pages)
      ? pages.reduce((list, page, index) => {
          if (isRenderablePublicPage(page)) list.push(index);
          return list;
        }, [])
      : [];
    if (!visibleIndexes.length) {
      return { current: 1, total: 1, firstIndex: 0, lastIndex: 0 };
    }
    const currentVisibleIndex = Math.max(0, visibleIndexes.findIndex((index) => index === currentIndex));
    return {
      current: currentVisibleIndex + 1,
      total: visibleIndexes.length,
      firstIndex: visibleIndexes[0],
      lastIndex: visibleIndexes[visibleIndexes.length - 1]
    };
  }

  function buildPublicPages(pagesRaw, questions) {
    const pages = Array.isArray(pagesRaw)
      ? pagesRaw
          .map((page, index) => ({
            id: String(page?.id || `page_${index}`),
            title: String(page?.title || `Страница ${index + 1}`),
            orderIndex: Number.isFinite(Number(page?.order_index)) ? Number(page.order_index) : index,
            design: normalizePublicPageDesign(page?.design || {}),
            questions: []
          }))
          .sort((a, b) => a.orderIndex - b.orderIndex)
      : [];

    const pageMap = new Map(pages.map((page) => [page.id, page]));
    const orphans = [];
    questions.forEach((question) => {
      const key = String(question.pageId || question.page_id || "").trim();
      if (pageMap.has(key)) {
        pageMap.get(key).questions.push(question);
        return;
      }
      const legacyIndex = parseLegacyPageIndex(key, pages.length);
      if (Number.isInteger(legacyIndex) && pages[legacyIndex]) {
        pages[legacyIndex].questions.push(question);
        return;
      }
      orphans.push(question);
    });

    if (!pages.length) {
      return [{ id: "page_1", title: "Страница 1", orderIndex: 0, design: normalizePublicPageDesign({}), questions: [...questions] }];
    }

    const assigned = pages.some((page) => isRenderablePublicPage(page));
    if (!assigned) {
      pages[0].questions = [...questions];
      return pages;
    }

    if (orphans.length) {
      const fallbackIndex = findRenderablePageIndex(pages, pages.length - 1, -1);
      const fallbackPage = Number.isInteger(fallbackIndex) ? pages[fallbackIndex] : pages[0];
      fallbackPage.questions.push(...orphans);
    }

    pages.forEach((page) => {
      page.questions.sort((a, b) => {
        const left = Number.isFinite(Number(a?.question_order)) ? Number(a.question_order) : 0;
        const right = Number.isFinite(Number(b?.question_order)) ? Number(b.question_order) : 0;
        return left - right;
      });
    });

    return pages;
  }

  function resolveJumpIndex(option, pages) {
    if (!option || typeof option !== "object") return null;
    if (Number.isInteger(option.jumpToPageIndex) && option.jumpToPageIndex >= 0 && option.jumpToPageIndex < pages.length) {
      return option.jumpToPageIndex;
    }
    const legacyIndex = parseLegacyPageIndex(option.jumpToPageIndex, pages.length);
    if (Number.isInteger(legacyIndex)) return legacyIndex;
    const byId = String(option.jumpToPageId || "").trim();
    if (!byId) return null;
    const index = pages.findIndex((page) => String(page.id) === byId);
    return index >= 0 ? index : null;
  }

  function isLegacyNoopJump(option, currentIndex) {
    if (!option || typeof option !== "object") return false;
    const hasTargetId = Boolean(String(option.jumpToPageId || option.targetPageId || "").trim());
    return !hasTargetId && Number(option.jumpToPageIndex) === 0 && currentIndex > 0;
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
          if (isLegacyNoopJump(option, currentIndex)) continue;
          const jumpIndex = resolveJumpIndex(option, pages);
          if (Number.isInteger(jumpIndex) && jumpIndex !== currentIndex) return jumpIndex;
        }
        continue;
      }

      const selected = options.find((option) => option.text === value);
      if (isLegacyNoopJump(selected, currentIndex)) {
        const linearNext = findRenderablePageIndex(pages, currentIndex + 1, 1);
        return Number.isInteger(linearNext) ? linearNext : currentIndex;
      }
      const jumpIndex = resolveJumpIndex(selected, pages);
      if (Number.isInteger(jumpIndex) && jumpIndex !== currentIndex) return jumpIndex;
    }

    const linearNext = findRenderablePageIndex(pages, currentIndex + 1, 1);
    return Number.isInteger(linearNext) ? linearNext : currentIndex;
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
    const totalResponses = Number(data.summary?.totalResponses || 0);
    const questionsCount = ownerState.questions.length;
    const activeLabel = data.summary?.active ? "Активна" : "Неактивна";
    const avgTime = data.summary?.averageTime || data.summary?.avgTime || "—";
    const trendChart = renderTrendChart(data.trend || []);
    summary.innerHTML = `
      <article class="results-metric-card">
        <span>Ответов</span>
        <strong>${totalResponses}</strong>
        <small>Всего отправок</small>
      </article>
      <article class="results-metric-card">
        <span>Вопросов</span>
        <strong>${questionsCount}</strong>
        <small>В анкете</small>
      </article>
      <article class="results-metric-card">
        <span>Статус</span>
        <strong>${activeLabel}</strong>
        <small>${activeLabel === "Активна" ? "Сбор идёт" : "Сбор остановлен"}</small>
      </article>
      <article class="results-metric-card">
        <span>Среднее время</span>
        <strong>${escapeHtml(String(avgTime))}</strong>
        <small>Пока без таймера</small>
      </article>
      <article class="results-metric-card results-metric-card--chart">
        <div class="result-chart-card__head">
          <span>Динамика</span>
          <small>${Array.isArray(data.trend) && data.trend.length ? "Ответы по дням" : "Появится после первых отправок"}</small>
        </div>
        ${trendChart}
      </article>
    `;
  }

  function resultTypeLabel(type) {
    const itemType = normalizeType(type);
    if (itemType === "multiple") return "Множественный выбор";
    if (itemType === "select") return "Выпадающий список";
    if (itemType === "rating") return "Рейтинг";
    if (itemType === "single") return "Один выбор";
    return "Свободный ответ";
  }

  const RESULT_PALETTE = ["#4F46E5", "#10B981", "#64748B", "#0EA5E9", "#8B5CF6", "#F59E0B"];

  function renderChoiceAnalytics(entries, total) {
    if (!entries.length) {
      return `
        <div class="results-choice-empty">
          <strong>Нет данных</strong>
          <span>Диаграмма появится после первых ответов.</span>
        </div>
      `;
    }

    const rows = entries
      .map(([label, value], index) => {
        const count = Number(value || 0);
        const percent = Math.max(0, Math.min(100, Math.round((count / Math.max(1, total)) * 100)));
        const color = RESULT_PALETTE[index % RESULT_PALETTE.length];
        return `
          <div class="results-bar-row">
            <div class="results-bar-row__top">
              <span>${escapeHtml(label)}</span>
              <strong>${count}</strong>
            </div>
            <div class="results-bar-row__track">
              <span style="width:${percent}%; background:${color}"></span>
            </div>
          </div>
        `;
      })
      .join("");

    const tableRows = entries
      .map(([label, value], index) => {
        const count = Number(value || 0);
        const percent = Math.max(0, Math.min(100, Math.round((count / Math.max(1, total)) * 100)));
        const color = RESULT_PALETTE[index % RESULT_PALETTE.length];
        return `
          <tr>
            <td><span class="results-option-dot" style="background:${color}"></span>${escapeHtml(label)}</td>
            <td>${count}</td>
            <td>${percent}%</td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="results-choice-layout">
        <div class="results-bar-chart">${rows}</div>
        <div class="results-data-grid">
          <table>
            <thead><tr><th>Вариант</th><th>Ответов</th><th>Доля</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderTextAnswerFeed(samples) {
    if (!samples.length) {
      return `<p class="result-card__subtle">Первые ответы появятся после новых отправок.</p>`;
    }
    return `
      <div class="results-answer-feed">
        ${samples.map((sample) => `<div class="results-answer-bubble">${escapeHtml(String(sample))}</div>`).join("")}
      </div>
    `;
  }

  function renderResultsCards(data) {
    const container = document.getElementById("resultsStats");
    const blocks = (data.results || [])
      .map((item) => {
        const itemType = normalizeType(item.type);

        if (itemType === "rating") {
          const votes = Number(item.total || item.count || 0);
          const average = Number(item.average || 0);
          return `
            <article class="results-dashboard-card">
              <div class="result-card__head">
                <div>
                  <div class="result-card__eyebrow">Рейтинг</div>
                  <h4>${escapeHtml(item.text)}</h4>
                </div>
                <span class="result-card__count">${votes}</span>
              </div>
              <div class="result-card__split result-card__split--rating">
                <div class="result-card__metric">
                  <strong>${average.toFixed(1)}</strong>
                  <span>средняя оценка</span>
                </div>
                ${renderDonutChart(Math.round((Math.max(0, Math.min(5, average)) / 5) * 100), `${average.toFixed(1)} / 5`, "Средняя оценка")}
              </div>
              <p class="result-card__subtle">Оценок получено: ${votes}</p>
            </article>
          `;
        }

        if (itemType === "single" || itemType === "multiple" || itemType === "select") {
          const entries = Object.entries(item.counts || {}).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
          const total = Math.max(1, Number(item.total || 0) || totalResponsesFromCounts(item.counts));
          return `
            <article class="results-dashboard-card">
              <div class="result-card__head">
                <div>
                  <div class="result-card__eyebrow">${resultTypeLabel(itemType)}</div>
                  <h4>${escapeHtml(item.text)}</h4>
                </div>
                <span class="result-card__count">${totalResponsesFromCounts(item.counts)}</span>
              </div>
              ${renderChoiceAnalytics(entries, total)}
            </article>
          `;
        }

        const textCount = Number(item.total || item.count || (Array.isArray(item.samples) ? item.samples.length : 0));
        const samples = Array.isArray(item.samples) ? item.samples.filter(Boolean) : [];
        return `
          <article class="results-dashboard-card">
            <div class="result-card__head">
              <div>
                <div class="result-card__eyebrow">Свободный ответ</div>
                <h4>${escapeHtml(item.text)}</h4>
              </div>
              <span class="result-card__count">${textCount}</span>
            </div>
            <div class="result-card__metric">
              <strong>${textCount}</strong>
              <span>текстовых ответов</span>
            </div>
            ${renderTextAnswerFeed(samples)}
          </article>
        `;
      })
      .join("");
    container.innerHTML = blocks || `
      <div class="card results-empty">
        <strong>Статистика появится после первых ответов</strong>
        <span>Опубликуйте анкету и поделитесь ссылкой, затем обновите этот раздел.</span>
      </div>
    `;
  }

  function renderResponsesTable(data) {
    const head = document.getElementById("responsesHead");
    const body = document.getElementById("responsesBody");
    const toggleBtn = document.getElementById("toggleResponsesBtn");
    const tableWrap = document.getElementById("responsesTableWrap");
    const columns = data.columns || [];
    const rows = data.rows || [];

    head.innerHTML = `<tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
    body.innerHTML = rows
      .map((row) => `<tr class="table-row">${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("");

    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="${Math.max(columns.length, 1)}"><div class="cabinet-empty">Пока нет детальных ответов.</div></td></tr>`;
      if (toggleBtn) toggleBtn.disabled = true;
      if (tableWrap) tableWrap.hidden = true;
      if (toggleBtn) toggleBtn.textContent = "Детальные ответы недоступны";
      return;
    }
    if (toggleBtn) toggleBtn.disabled = false;
    if (toggleBtn && tableWrap.hidden) toggleBtn.textContent = "Показать детальные ответы";
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
    const current = ownerState.survey || {};
    const passwordEnabled = document.getElementById("accessPasswordEnabled");
    const password = document.getElementById("accessPassword");
    const passwordWrap = document.getElementById("accessPasswordWrap");
    const responseLimit = document.getElementById("accessLimit");
    const saveBtn = document.getElementById("saveAccessBtn");

    passwordEnabled.checked = Boolean(current.has_access_password);
    password.value = "";
    responseLimit.value = Number.isInteger(Number(current.response_limit)) ? String(current.response_limit) : "";

    const syncPassword = () => {
      passwordWrap.hidden = !passwordEnabled.checked;
    };
    syncPassword();

    passwordEnabled.addEventListener("change", syncPassword);

    saveBtn.addEventListener("click", async () => {
      try {
        const payload = {
          passwordEnabled: passwordEnabled.checked,
          password: password.value.trim(),
          responseLimit: responseLimit.value
        };
        await api.request(`/api/surveys/${ownerState.surveyId}/access`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        ownerState.survey.has_access_password = Boolean(payload.passwordEnabled);
        ownerState.survey.response_limit = Number(payload.responseLimit || 0) || null;
        if (!payload.passwordEnabled) password.value = "";
        showToast("Параметры доступа сохранены");
      } catch (error) {
        showToast(error.message || "Не удалось сохранить доступ", true);
      }
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
      design: normalizePublicPageDesign(page.design || {}),
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

    const toggleResponsesBtn = document.getElementById("toggleResponsesBtn");
    const responsesTableWrap = document.getElementById("responsesTableWrap");
    if (toggleResponsesBtn && responsesTableWrap) {
      toggleResponsesBtn.addEventListener("click", () => {
        const nextHidden = !responsesTableWrap.hidden;
        responsesTableWrap.hidden = nextHidden;
        toggleResponsesBtn.textContent = nextHidden ? "Показать детальные ответы" : "Скрыть детальные ответы";
      });
    }
  }

  async function bootOwnerMode(surveyId) {
    document.body.classList.remove("survey-public-mode");
    document.body.classList.add("survey-owner-mode");
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
    const responsesTableWrap = document.getElementById("responsesTableWrap");
    const toggleResponsesBtn = document.getElementById("toggleResponsesBtn");
    if (responsesTableWrap) responsesTableWrap.hidden = true;
    if (toggleResponsesBtn) toggleResponsesBtn.textContent = "Показать детальные ответы";

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
    row.className = "public-question-card public-question-row";
    row.dataset.questionId = String(question.id);
    row.style.setProperty("--question-panel-alpha", (Math.max(28, Math.min(100, Number(question.panelOpacity || 72))) / 100).toFixed(2));

    const head = document.createElement("div");
    head.className = "public-question-card__head";

    const titleLine = document.createElement("div");
    titleLine.className = "public-question-card__title-line";

    const label = document.createElement("div");
    label.className = "public-question-row__label";
    label.textContent = question.text || "Вопрос";
    titleLine.appendChild(label);

    if (question.required) {
      const required = document.createElement("span");
      required.className = "public-question-row__required";
      required.textContent = "Обязательный вопрос";
      titleLine.appendChild(required);
    }
    head.appendChild(titleLine);
    if (question.helpText) {
      const hint = document.createElement("p");
      hint.className = "public-question-row__hint";
      hint.textContent = question.helpText;
      head.appendChild(hint);
    }
    const error = document.createElement("p");
    error.className = "public-question-row__error";
    error.hidden = true;
    head.appendChild(error);
    row.appendChild(head);

    const key = `q_${question.id}`;
    const options = Array.isArray(question.options) ? question.options : [];
    const field = document.createElement("div");
    field.className = "public-question-card__field";
    const hasImageChoices = options.some((option) => String(option?.imageUrl || "").trim());

    const buildChoice = (option, inputType, mediaMode) => {
      const optionLabel = document.createElement("label");
      optionLabel.className = mediaMode ? "public-choice public-choice--media" : "public-choice";

      const input = document.createElement("input");
      input.type = inputType;
      input.name = key;
      input.value = option.text;
      optionLabel.appendChild(input);

      const indicator = document.createElement("span");
      indicator.className = "public-choice__indicator";
      indicator.setAttribute("aria-hidden", "true");
      optionLabel.appendChild(indicator);

      if (mediaMode && option.imageUrl) {
        const imageWrap = document.createElement("span");
        imageWrap.className = "public-choice__image-wrap";
        imageWrap.style.setProperty("--choice-image-scale", String(Math.max(0.6, Math.min(1.3, Number(option.imageScale || 100) / 100))));
        const image = document.createElement("img");
        image.src = option.imageUrl;
        image.alt = option.text || "Вариант ответа";
        image.className = "option-image";
        image.style.objectFit = option.imageFit === "contain" ? "contain" : "cover";
        image.loading = "lazy";
        imageWrap.appendChild(image);
        optionLabel.appendChild(imageWrap);
      }

      const text = document.createElement("span");
      text.className = "public-choice__text";
      text.textContent = option.text;
      optionLabel.appendChild(text);
      return optionLabel;
    };

    if (question.type === "text") {
      const textarea = document.createElement("textarea");
      textarea.className = "public-textarea";
      textarea.name = key;
      textarea.placeholder = "Введите ответ";
      field.appendChild(textarea);
      row.appendChild(field);
      return row;
    }

    if (question.type === "rating") {
      const select = document.createElement("select");
      select.className = "public-select";
      select.name = key;
      select.appendChild(new Option(tPublic("selectRating"), ""));
      [1, 2, 3, 4, 5].forEach((value) => select.appendChild(new Option(String(value), String(value))));
      field.appendChild(select);
      row.appendChild(field);
      return row;
    }

    if (question.type === "single") {
      const optionsWrap = document.createElement("div");
      optionsWrap.className = hasImageChoices
        ? "options options--single options--media"
        : "options options--single options--cards";
      options.forEach((option) => {
        optionsWrap.appendChild(buildChoice(option, "radio", hasImageChoices));
      });
      field.appendChild(optionsWrap);
      row.appendChild(field);
      return row;
    }

    if (question.type === "select" && hasImageChoices) {
      const optionsWrap = document.createElement("div");
      optionsWrap.className = "options options--single options--media";
      options.forEach((option) => {
        optionsWrap.appendChild(buildChoice(option, "radio", true));
      });
      field.appendChild(optionsWrap);
      row.appendChild(field);
      return row;
    }

    if (question.type === "select") {
      const select = document.createElement("select");
      select.className = "public-select";
      select.name = key;
      select.appendChild(new Option(tPublic("selectOption"), ""));
      options.forEach((option) => {
        select.appendChild(new Option(option.text, option.text));
      });
      field.appendChild(select);
      row.appendChild(field);
      return row;
    }

    const optionsWrap = document.createElement("div");
    optionsWrap.className = hasImageChoices ? "options options--media" : "options options--cards";

    options.forEach((option) => {
      optionsWrap.appendChild(buildChoice(option, "checkbox", hasImageChoices && Boolean(option.imageUrl)));
    });

    field.appendChild(optionsWrap);
    row.appendChild(field);
    return row;
  }

  function totalResponsesFromCounts(counts) {
    return Object.values(counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function renderTrendChart(trend) {
    if (!Array.isArray(trend) || !trend.length) {
      return `<div class="result-chart result-chart--empty">Нет данных по динамике</div>`;
    }

    const values = trend.map((item) => Math.max(0, Number(item.count || 0)));
    const max = Math.max(1, ...values);
    const width = 320;
    const height = 112;
    const paddingX = 10;
    const paddingY = 10;
    const step = values.length > 1 ? (width - paddingX * 2) / (values.length - 1) : 0;
    const points = values
      .map((value, index) => {
        const x = paddingX + index * step;
        const y = height - paddingY - (value / max) * (height - paddingY * 2);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
    const areaPoints = `${paddingX},${height - paddingY} ${points} ${width - paddingX},${height - paddingY}`;
    const firstDay = trend[0]?.day;
    const lastDay = trend[trend.length - 1]?.day;
    return `
      <div class="result-chart-card">
        <div class="result-chart-card__meta">
          <strong>${values.reduce((sum, value) => sum + value, 0)}</strong>
          <span>${escapeHtml(formatTrendRange(firstDay, lastDay))}</span>
        </div>
        <svg class="result-chart result-chart--trend" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="resultsTrendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="rgba(79,110,247,0.42)"></stop>
              <stop offset="100%" stop-color="rgba(34,197,94,0.04)"></stop>
            </linearGradient>
            <linearGradient id="resultsTrendLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stop-color="#4f6ef7"></stop>
              <stop offset="100%" stop-color="#22c55e"></stop>
            </linearGradient>
          </defs>
          <polygon class="result-chart__area" points="${areaPoints}" fill="url(#resultsTrendFill)"></polygon>
          <polyline class="result-chart__line" points="${points}" stroke="url(#resultsTrendLine)"></polyline>
        </svg>
      </div>
    `;
  }

  function formatTrendRange(first, last) {
    if (!first && !last) return "Без периода";
    if (first && last && first !== last) return `${first} - ${last}`;
    return String(first || last || "");
  }

  function renderDonutChart(percent, centerLabel, caption) {
    const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const dash = (safePercent / 100) * circumference;
    renderDonutChart.nextId = (renderDonutChart.nextId || 0) + 1;
    const gradientId = `resultsDonutGradient${renderDonutChart.nextId}`;
    return `
      <div class="result-donut" aria-label="${escapeHtml(caption)}">
        <svg viewBox="0 0 72 72" aria-hidden="true">
          <defs>
            <linearGradient id="${gradientId}" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#4f6ef7"></stop>
              <stop offset="100%" stop-color="#22c55e"></stop>
            </linearGradient>
          </defs>
          <circle class="result-donut__track" cx="36" cy="36" r="${radius}"></circle>
          <circle
            class="result-donut__value"
            cx="36"
            cy="36"
            r="${radius}"
            stroke="url(#${gradientId})"
            stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}"
          ></circle>
        </svg>
        <div class="result-donut__center">${escapeHtml(centerLabel)}</div>
      </div>
    `;
  }

  function renderDistributionChart(entries, total) {
    if (!Array.isArray(entries) || !entries.length) {
      return `<div class="result-mini-chart result-mini-chart--empty">Диаграмма появится после первых ответов</div>`;
    }

    const top = entries.slice(0, 5);
    const max = Math.max(1, ...top.map(([, value]) => Number(value || 0)));
    const bars = top
      .map(([label, value]) => {
        const count = Math.max(0, Number(value || 0));
        const height = Math.max(10, Math.round((count / max) * 88));
        const percent = Math.max(0, Math.min(100, Math.round((count / Math.max(1, total)) * 100)));
        return `
          <div class="result-mini-chart__item">
            <div class="result-mini-chart__value">${percent}%</div>
            <div class="result-mini-chart__bar" style="height:${height}px"></div>
            <div class="result-mini-chart__label" title="${escapeHtml(label)}">${escapeHtml(trimLabel(label, 16))}</div>
          </div>
        `;
      })
      .join("");

    return `<div class="result-mini-chart">${bars}</div>`;
  }

  function trimLabel(value, maxLength) {
    const text = String(value || "");
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1)}…`;
  }

  function normalizeOptionForPublic(option, index = 0) {
    if (typeof option === "string") {
      const text = option.trim();
      return {
        id: `option_${index + 1}`,
        text,
        value: text || String(index + 1),
        imageUrl: "",
        imageFit: "cover",
        imageScale: 100,
        jumpToPageId: "",
        jumpToPageIndex: null
      };
    }
    const source = option && typeof option === "object" ? option : {};
    const text = String(source.text || "").trim();
    const imageUrl = String(source.imageUrl || source.image || "").trim();
    const imageFit = String(source.imageFit || "cover").toLowerCase() === "contain" ? "contain" : "cover";
    const scale = Number(source.imageScale);
    const jumpIndex = Number(source.jumpToPageIndex);
    return {
      id: String(source.id || `option_${index + 1}`),
      text,
      value: text || String(index + 1),
      imageUrl,
      imageFit,
      imageScale: Number.isFinite(scale) ? Math.max(60, Math.min(130, Math.round(scale))) : 100,
      jumpToPageId: String(source.jumpToPageId || source.targetPageId || ""),
      jumpToPageIndex: Number.isInteger(jumpIndex) ? jumpIndex : null
    };
  }

  function normalizeSurveyData(survey, pagesRaw, questionsRaw) {
    const questions = Array.isArray(questionsRaw) ? questionsRaw.map(normalizeQuestionFromApi) : [];
    const pages = buildPublicPages(pagesRaw, questions).map((page, pageIndex) => ({
      ...page,
      id: String(page.id || `page_${pageIndex + 1}`),
      title: String(page.title || `Страница ${pageIndex + 1}`),
      design: normalizePublicPageDesign(page.design || {}),
      questions: (Array.isArray(page.questions) ? page.questions : []).map((question) => ({
        ...question,
        id: String(question.id),
        pageId: String(page.id || `page_${pageIndex + 1}`),
        pageIndex,
        type: normalizeType(question.type),
        text: String(question.text || question.question_text || "Вопрос"),
        helpText: String(question.helpText || question.help_text || question.description || ""),
        required: Boolean(question.required),
        panelOpacity: Number.isFinite(Number(question.panelOpacity)) ? Number(question.panelOpacity) : 72,
        options: Array.isArray(question.options) ? question.options.map(normalizeOptionForPublic) : []
      }))
    }));
    const steps = pages.reduce((list, page, pageIndex) => {
      page.questions.forEach((question, questionIndex) => {
        list.push({ id: `${page.id}_${question.id}`, page, pageIndex, question, questionIndex });
      });
      return list;
    }, []);
    return { survey: survey || {}, pages, questions, steps };
  }

  function getPublicQuestionKind(question) {
    const type = normalizeType(question?.type);
    if ((type === "single" || type === "select" || type === "multiple") && (question.options || []).some((option) => option.imageUrl)) {
      return "image";
    }
    return type;
  }

  function getPublicAnswer(state, question) {
    return state.answers.get(String(question.id));
  }

  function setPublicAnswer(state, question, value) {
    const key = String(question.id);
    if (Array.isArray(value) ? value.length : String(value ?? "").trim()) {
      state.answers.set(key, value);
    } else {
      state.answers.delete(key);
    }
    state.errors.delete(key);
  }

  function isPublicQuestionAnswered(state, question) {
    const value = getPublicAnswer(state, question);
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? "").trim().length > 0;
  }

  function validateCurrentStep(state) {
    const step = state.steps[state.currentIndex];
    if (!step?.question) return true;
    if (!step.question.required || isPublicQuestionAnswered(state, step.question)) {
      state.errors.delete(String(step.question.id));
      return true;
    }
    state.errors.set(String(step.question.id), getRequiredValidationMessage(step.question));
    return false;
  }

  function collectAnswers(state) {
    return state.steps.map((step) => step.question)
      .filter((question) => state.answers.has(String(question.id)))
      .map((question) => ({
        questionId: question.id,
        value: state.answers.get(String(question.id))
      }));
  }

  function resolveOptionByAnswer(question, answer) {
    const values = Array.isArray(answer) ? answer : [answer];
    return (question.options || []).find((option, index) => {
      const candidates = [String(option.value || ""), String(option.text || ""), String(index + 1)].filter(Boolean);
      return values.some((value) => candidates.includes(String(value || "")));
    });
  }

  function resolveNextStep(state) {
    const current = state.steps[state.currentIndex];
    if (!current) return state.currentIndex + 1;
    const isLastQuestionOnPage = state.steps.findLastIndex
      ? state.steps.findLastIndex((step) => step.pageIndex === current.pageIndex) === state.currentIndex
      : state.steps.map((step, index) => (step.pageIndex === current.pageIndex ? index : -1)).filter((index) => index >= 0).pop() === state.currentIndex;
    if (!isLastQuestionOnPage) return state.currentIndex + 1;

    const answer = state.answers.get(String(current.question.id));
    const selected = resolveOptionByAnswer(current.question, answer);
    let targetPageIndex = null;
    if (selected) {
      if (selected.jumpToPageId) {
        const byId = state.pages.findIndex((page) => String(page.id) === String(selected.jumpToPageId));
        if (byId >= 0) targetPageIndex = byId;
      }
      if (!Number.isInteger(targetPageIndex) && Number.isInteger(selected.jumpToPageIndex)) {
        targetPageIndex = parseLegacyPageIndex(selected.jumpToPageIndex, state.pages.length);
      }
    }
    if (Number.isInteger(targetPageIndex) && targetPageIndex !== current.pageIndex && state.pages[targetPageIndex]) {
      const targetStep = state.steps.findIndex((step) => step.pageIndex === targetPageIndex);
      if (targetStep >= 0) return targetStep;
    }
    return state.currentIndex + 1;
  }

  function applyRunnerBackground(root, design, isIntro = false) {
    const d = normalizePublicPageDesign(design || {});
    const bg = root.querySelector(".asking-runner__bg");
    const wash = root.querySelector(".asking-runner__wash");
    if (!bg || !wash) return;
    const welcome = normalizeWelcomeSettings(d.welcome);
    const image = isIntro && welcome.imageEnabled ? welcome.coverImage : d.bgImage;
    const overlay = Math.max(0, Math.min(0.82, Number(d.overlay || 0) / 100));
    bg.style.backgroundColor = d.bgColor;
    bg.style.backgroundImage = image ? `url("${image}")` : "";
    bg.style.opacity = image ? String(isIntro ? welcome.imageOpacity / 100 : 1) : "1";
    wash.style.background = image
      ? `linear-gradient(135deg, rgba(15,23,42,${Math.max(0.32, overlay)}), rgba(15,23,42,${Math.max(0.18, overlay * 0.7)}))`
      : `radial-gradient(circle at 18% 0%, rgba(37,99,235,0.18), transparent 32%), linear-gradient(135deg, ${d.bgColor}, #f8fbff)`;
  }

  function createRunnerShell() {
    const root = document.createElement("div");
    root.className = "asking-runner";
    root.innerHTML = `
      <div class="asking-runner__bg" aria-hidden="true"></div>
      <div class="asking-runner__wash" aria-hidden="true"></div>
      <div class="asking-runner__progress" aria-hidden="true"><span></span></div>
      <main class="asking-runner__viewport"></main>
    `;
    return root;
  }

  function renderIntro(state) {
    const introDesign = state.pages[0]?.design || {};
    const welcome = normalizeWelcomeSettings(introDesign.welcome);
    const layout = welcome.imageEnabled ? welcome.layout : "typographic";
    const needsPassword = Boolean(state.survey?.has_access_password);
    applyRunnerBackground(state.root, introDesign, true);
    const viewport = state.root.querySelector(".asking-runner__viewport");
    viewport.innerHTML = `
      <section class="asking-intro asking-intro--${escapeAttr(layout)}">
        <div class="asking-intro__media" aria-hidden="true"></div>
        <div class="asking-intro__content">
          <span class="asking-kicker">Asking</span>
          <h1>${escapeHtml(state.survey.title || "Анкета")}</h1>
          <p>${escapeHtml(state.survey.description || "Ответьте на несколько вопросов. Это займет немного времени.")}</p>
          <div class="asking-intro__meta"><strong>${state.questions.length}</strong><span>${state.questions.length === 1 ? "вопрос" : "вопросов"}</span></div>
          ${needsPassword ? `
            <label class="asking-access">
              <span>Пароль доступа</span>
              <input type="password" name="surveyAccessPassword" value="${escapeAttr(state.accessPassword || "")}" placeholder="Введите пароль" autocomplete="current-password" />
            </label>
          ` : ""}
          <button class="asking-btn asking-btn--primary asking-intro__start" type="button">Начать</button>
        </div>
      </section>
    `;
    const media = viewport.querySelector(".asking-intro__media");
    if (media && welcome.imageEnabled && welcome.coverImage) {
      media.style.backgroundImage = `url("${welcome.coverImage}")`;
      media.style.opacity = String(welcome.imageOpacity / 100);
    }
    viewport.querySelector("[name='surveyAccessPassword']")?.addEventListener("input", (event) => {
      state.accessPassword = String(event.target.value || "");
    });
    viewport.querySelector(".asking-intro__start")?.addEventListener("click", () => {
      state.currentIndex = 0;
      state.history = [0];
      renderQuestionStep(state, "forward");
    });
    updateRunnerProgress(state, 0);
  }

  function renderQuestionStep(state, direction = "forward") {
    const step = state.steps[state.currentIndex];
    if (!step) {
      renderSuccess(state);
      return;
    }
    applyRunnerBackground(state.root, step.page.design, false);
    updateRunnerProgress(state);
    const viewport = state.root.querySelector(".asking-runner__viewport");
    const question = step.question;
    const error = state.errors.get(String(question.id)) || "";
    viewport.innerHTML = `
      <section class="asking-step asking-step--${direction}${error ? " is-invalid" : ""}" tabindex="-1">
        <div class="asking-step__head">
          <div>
            <span class="asking-step__eyebrow">${escapeHtml(step.page.title || `Страница ${step.pageIndex + 1}`)}</span>
            <h2>${escapeHtml(question.text || "Вопрос")}</h2>
          </div>
          ${question.required ? `<span class="asking-required">Обязательный</span>` : ""}
        </div>
        ${question.helpText ? `<p class="asking-step__hint">${escapeHtml(question.helpText)}</p>` : ""}
        <div class="asking-step__error" ${error ? "" : "hidden"}>${escapeHtml(error)}</div>
        <div class="asking-step__field"></div>
        <div class="asking-step__nav">
          <button class="asking-btn asking-btn--secondary" type="button" data-action="back" ${state.currentIndex === 0 ? "disabled" : ""}>Назад</button>
          <button class="asking-btn asking-btn--primary" type="button" data-action="next">${state.currentIndex >= state.steps.length - 1 ? "Отправить анкету" : "Далее"}</button>
        </div>
      </section>
    `;
    const card = viewport.querySelector(".asking-step");
    const field = viewport.querySelector(".asking-step__field");
    renderQuestionControl(state, question, field);
    viewport.querySelector("[data-action='back']")?.addEventListener("click", () => {
      if (state.isSubmitting) return;
      if (state.currentIndex === 0) return;
      if (state.history.length > 1) {
        state.history.pop();
        state.currentIndex = state.history[state.history.length - 1];
      } else {
        state.currentIndex = Math.max(0, state.currentIndex - 1);
      }
      renderQuestionStep(state, "back");
    });
    viewport.querySelector("[data-action='next']")?.addEventListener("click", () => {
      if (state.isSubmitting) return;
      if (!validateCurrentStep(state)) {
        renderQuestionStep(state, "forward");
        requestAnimationFrame(() => state.root.querySelector(".asking-step")?.focus());
        return;
      }
      const nextIndex = resolveNextStep(state);
      if (nextIndex >= state.steps.length) {
        submitSurvey(state);
        return;
      }
      state.currentIndex = nextIndex;
      state.history.push(nextIndex);
      renderQuestionStep(state, "forward");
    });
    requestAnimationFrame(() => card?.focus());
  }

  function renderQuestionControl(state, question, mount) {
    const kind = getPublicQuestionKind(question);
    if (kind === "image") return renderImageChoice(state, question, mount);
    if (kind === "text") return renderTextQuestion(state, question, mount);
    if (kind === "rating") return renderRatingQuestion(state, question, mount);
    if (kind === "select") return renderSelectQuestion(state, question, mount);
    return renderChoiceQuestion(state, question, mount, kind === "multiple");
  }

  function renderTextQuestion(state, question, mount) {
    const value = String(getPublicAnswer(state, question) || "");
    mount.innerHTML = `
      <textarea class="asking-textarea" name="q_${escapeAttr(question.id)}" rows="4" placeholder="Введите ответ">${escapeHtml(value)}</textarea>
    `;
    mount.querySelector("textarea")?.addEventListener("input", (event) => {
      setPublicAnswer(state, question, event.target.value);
      clearInlineError(state.root, question);
    });
  }

  function renderRatingQuestion(state, question, mount) {
    const current = String(getPublicAnswer(state, question) || "");
    mount.innerHTML = `
      <div class="asking-rating" role="radiogroup" aria-label="${escapeAttr(question.text || "Рейтинг")}">
        ${[1, 2, 3, 4, 5].map((value) => `
          <button class="asking-rating__item${current === String(value) ? " is-selected" : ""}" type="button" data-value="${value}" aria-pressed="${current === String(value) ? "true" : "false"}">
            <strong>${value}</strong>
            <span>${value === 1 ? "Плохо" : value === 5 ? "Отлично" : ""}</span>
          </button>
        `).join("")}
      </div>
    `;
    mount.querySelectorAll("[data-value]").forEach((button) => {
      button.addEventListener("click", () => {
        setPublicAnswer(state, question, String(button.dataset.value));
        renderRatingQuestion(state, question, mount);
        clearInlineError(state.root, question);
      });
    });
  }

  function renderSelectQuestion(state, question, mount) {
    const current = String(getPublicAnswer(state, question) || "");
    mount.innerHTML = `
      <label class="asking-select-wrap">
        <span>Выберите вариант</span>
        <select class="asking-select" name="q_${escapeAttr(question.id)}">
          <option value="">Не выбрано</option>
          ${(question.options || []).map((option, index) => {
            const value = option.value || option.text || String(index + 1);
            return `<option value="${escapeAttr(value)}" ${current === String(value) ? "selected" : ""}>${escapeHtml(option.text || `Вариант ${index + 1}`)}</option>`;
          }).join("")}
        </select>
      </label>
    `;
    mount.querySelector("select")?.addEventListener("change", (event) => {
      setPublicAnswer(state, question, event.target.value);
      clearInlineError(state.root, question);
    });
  }

  function renderChoiceQuestion(state, question, mount, multiple = false) {
    const currentRaw = getPublicAnswer(state, question);
    const current = multiple ? (Array.isArray(currentRaw) ? currentRaw : []) : String(currentRaw || "");
    mount.innerHTML = `
      <div class="asking-choice-list">
        ${(question.options || []).map((option, index) => {
          const value = String(option.value || option.text || index + 1);
          const selected = multiple ? current.includes(value) : current === value;
          return `
            <button class="asking-choice${selected ? " is-selected" : ""}" type="button" data-value="${escapeAttr(value)}">
              <span class="asking-choice__mark">${selected ? "✓" : ""}</span>
              <span>${escapeHtml(option.text || `Вариант ${index + 1}`)}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;
    mount.querySelectorAll("[data-value]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = String(button.dataset.value || "");
        if (multiple) {
          const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
          setPublicAnswer(state, question, next);
        } else {
          setPublicAnswer(state, question, value);
        }
        renderChoiceQuestion(state, question, mount, multiple);
        clearInlineError(state.root, question);
      });
    });
  }

  function renderImageChoice(state, question, mount) {
    const currentRaw = getPublicAnswer(state, question);
    const multiple = normalizeType(question.type) === "multiple";
    const current = multiple ? (Array.isArray(currentRaw) ? currentRaw : []) : String(currentRaw || "");
    mount.innerHTML = `
      <div class="asking-image-grid">
        ${(question.options || []).map((option, index) => {
          const value = String(option.value || option.text || index + 1);
          const selected = multiple ? current.includes(value) : current === value;
          const hasText = String(option.text || "").trim();
          return `
            <button class="asking-image-choice${selected ? " is-selected" : ""}" type="button" data-value="${escapeAttr(value)}">
              <span class="asking-image-choice__media" style="--image-scale:${(option.imageScale || 100) / 100}">
                ${option.imageUrl ? `<img src="${escapeAttr(option.imageUrl)}" alt="${escapeAttr(option.text || `Вариант ${index + 1}`)}" style="object-fit:${escapeAttr(option.imageFit || "cover")}" loading="lazy" />` : `<span class="asking-image-choice__fallback">Нет изображения</span>`}
                <span class="asking-image-choice__check">✓</span>
              </span>
              ${hasText ? `<span class="asking-image-choice__label">${escapeHtml(option.text)}</span>` : `<span class="asking-image-choice__label asking-image-choice__label--muted">Вариант ${index + 1}</span>`}
            </button>
          `;
        }).join("")}
      </div>
    `;
    mount.querySelectorAll(".asking-image-choice img").forEach((image) => {
      image.addEventListener("error", () => {
        const media = image.closest(".asking-image-choice__media");
        if (!media) return;
        media.innerHTML = `<span class="asking-image-choice__fallback">Изображение недоступно</span><span class="asking-image-choice__check">✓</span>`;
      }, { once: true });
    });
    mount.querySelectorAll("[data-value]").forEach((button) => {
      button.addEventListener("click", () => {
        const value = String(button.dataset.value || "");
        if (multiple) {
          const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
          setPublicAnswer(state, question, next);
        } else {
          setPublicAnswer(state, question, value);
        }
        renderImageChoice(state, question, mount);
        clearInlineError(state.root, question);
      });
    });
  }

  function clearInlineError(root, question) {
    const error = root.querySelector(".asking-step__error");
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
    root.querySelector(".asking-step")?.classList.remove("is-invalid");
  }

  function updateRunnerProgress(state, forced = null) {
    const bar = state.root.querySelector(".asking-runner__progress span");
    if (!bar) return;
    const value = forced == null ? Math.round(((state.currentIndex + 1) / Math.max(1, state.steps.length)) * 100) : forced;
    bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }

  async function submitSurvey(state) {
    if (state.isSubmitting) return;
    state.isSubmitting = true;
    const button = state.root.querySelector("[data-action='next']");
    if (button) {
      button.disabled = true;
      button.innerHTML = `<span class="asking-spinner"></span>Отправляем`;
    }
    try {
      const accessPassword = String(state.accessPassword || state.root.querySelector("[name='surveyAccessPassword']")?.value || "").trim();
      const submissionId = state.submissionId || `submit_${state.survey.id}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      state.submissionId = submissionId;
      await api.request(`/api/surveys/${state.survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: collectAnswers(state), password: accessPassword, submissionId })
      });
      renderSuccess(state);
    } catch (error) {
      state.isSubmitting = false;
      if (button) {
        button.disabled = false;
        button.textContent = "Отправить анкету";
      }
      const step = state.steps[state.currentIndex];
      if (step?.question) state.errors.set(String(step.question.id), error.message || "Не удалось отправить ответ");
      renderQuestionStep(state, "forward");
      showToast(error.message || "Не удалось отправить ответ", true);
    }
  }

  function renderSuccess(state) {
    updateRunnerProgress(state, 100);
    const viewport = state.root.querySelector(".asking-runner__viewport");
    viewport.innerHTML = `
      <section class="asking-success">
        <span class="asking-success__mark">✓</span>
        <h2>Спасибо за прохождение</h2>
        <p>Результаты отправлены на базу.</p>
      </section>
    `;
  }

  function createPublicSurveyApp(survey, pagesRaw, questionsRaw, isPreview = false) {
    const normalized = normalizeSurveyData(survey, pagesRaw, questionsRaw);
    const root = createRunnerShell();
    const state = {
      ...normalized,
      root,
      currentIndex: 0,
      history: [],
      answers: new Map(),
      errors: new Map(),
      isPreview: Boolean(isPreview),
      isSubmitting: false,
      submissionId: "",
      accessPassword: ""
    };
    if (!state.steps.length) {
      root.querySelector(".asking-runner__viewport").innerHTML = `
        <section class="asking-success">
          <h2>В анкете пока нет вопросов</h2>
          <p>Автор еще не добавил вопросы для прохождения.</p>
        </section>
      `;
      return root;
    }
    renderIntro(state);
    return root;
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

      if (question.type === "single" || question.type === "select" || question.type === "rating") {
        const checked = form.querySelector(`input[name='${key}']:checked`);
        if (checked) {
          answers.push({ questionId: question.id, value: String(checked.value || "").trim() });
          return;
        }
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
    return createPublicSurveyApp(survey, pagesRaw, questions, isPreview);
    const pages = buildPublicPages(pagesRaw, questions);
    const steps = pages.reduce((list, page, pageIndex) => {
      (page.questions || []).forEach((question, questionIndex) => {
        list.push({ page, pageIndex, question, questionIndex });
      });
      return list;
    }, []);
    const firstRenderablePage = findRenderablePageIndex(pages, 0, 1) ?? 0;
    const initialStep = Math.max(0, steps.findIndex((step) => step.pageIndex === firstRenderablePage));
    const introDesign = normalizePublicPageDesign(pages[0]?.design || {});
    const welcome = normalizeWelcomeSettings(introDesign.welcome);
    publicState.currentStep = initialStep;
    publicState.history = [initialStep];
    let currentIndex = initialStep;
    let isCompleted = false;

    const wrap = document.createElement("div");
    wrap.className = "public-survey-shell";
    wrap.innerHTML = `
      <div class="public-ambient public-ambient--image" aria-hidden="true"></div>
      <div class="public-ambient public-ambient--tint" aria-hidden="true"></div>
      <section class="public-survey-cover public-survey-cover--builder" data-layout="${welcome.imageEnabled ? welcome.layout : "typographic"}">
        <div class="public-survey-cover__media" style="--welcome-image-opacity:${(welcome.imageOpacity / 100).toFixed(2)}; background-image:url('${welcome.coverImage.replace(/'/g, "%27")}')" aria-hidden="true"></div>
        <div class="public-survey-cover__content">
          <div>
            <span class="public-survey-head__kicker">Asking</span>
            <h2>${escapeHtml(survey.title || "Анкета")}</h2>
            <p>${escapeHtml(survey.description || "Ответьте на несколько вопросов. Это займет немного времени.")}</p>
          </div>
          <div class="public-survey-head__meta">
            <strong>${questions.length}</strong>
            <span>${questions.length === 1 ? "вопрос" : "вопросов"}</span>
          </div>
          <button class="btn btn--primary public-survey-cover__start" type="button">Начать</button>
        </div>
      </section>
    `;

    const stage = document.createElement("section");
    stage.className = "public-survey-stage";
    stage.hidden = true;

    const progress = document.createElement("div");
    progress.className = "survey-progress public-survey-progress";
    const progressHead = document.createElement("div");
    progressHead.className = "public-survey-progress__head";
    const progressText = document.createElement("div");
    progressText.className = "survey-progress__text";
    const progressPercent = document.createElement("div");
    progressPercent.className = "public-survey-progress__percent";
    const progressTrack = document.createElement("div");
    progressTrack.className = "survey-progress__track";
    const progressBar = document.createElement("div");
    progressBar.className = "survey-progress__bar";
    progressTrack.appendChild(progressBar);
    progressHead.append(progressText, progressPercent);
    progress.append(progressHead, progressTrack);

    const form = document.createElement("form");
    form.className = "public-survey-card";

    const questionViewport = document.createElement("div");
    questionViewport.className = "public-question-viewport";

    if (survey?.has_access_password) {
      form.classList.add("has-access");
      const passwordRow = document.createElement("label");
      passwordRow.className = "public-access-card";
      passwordRow.innerHTML = `
        <span>${tPublic("enterAccessPassword")}</span>
        <input type="password" name="surveyAccessPassword" placeholder="Введите пароль" autocomplete="current-password" />
      `;
      const input = passwordRow.querySelector("input");
      if (input && publicState.accessPassword) input.value = publicState.accessPassword;
      form.appendChild(passwordRow);
    }

    const panes = steps.map((step, stepIndex) => {
      const pane = document.createElement("section");
      pane.className = "wizard-pane public-question-step";
      pane.dataset.stepIndex = String(stepIndex);
      if (pages.length > 1) {
        const pageTitle = document.createElement("div");
        pageTitle.className = "wizard-pane__head";
        pageTitle.innerHTML = `
          <span>Страница</span>
          <h3>${escapeHtml(step.page.title || "Страница")}</h3>
        `;
        pane.appendChild(pageTitle);
      }
      pane.appendChild(buildPublicQuestion(step.question));
      questionViewport.appendChild(pane);
      return pane;
    });
    form.appendChild(questionViewport);

    const actionRow = document.createElement("div");
    actionRow.className = "action-row public-survey-actions";

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn btn--outline public-nav-btn public-nav-btn--secondary";
    backBtn.textContent = tPublic("back");

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "btn btn--primary public-nav-btn public-nav-btn--primary";
    nextBtn.textContent = tPublic("next");

    const finishBtn = document.createElement("button");
    finishBtn.type = "submit";
    finishBtn.className = "btn btn--primary public-nav-btn public-nav-btn--primary";
    finishBtn.textContent = tPublic("finish");

    actionRow.append(backBtn, nextBtn, finishBtn);
    form.appendChild(actionRow);

    const status = document.createElement("p");
    status.className = "status";
    form.appendChild(status);
    stage.append(progress, form);
    wrap.appendChild(stage);

    const ambientImage = wrap.querySelector(".public-ambient--image");
    const ambientTint = wrap.querySelector(".public-ambient--tint");
    const cover = wrap.querySelector(".public-survey-cover");
    const startBtn = wrap.querySelector(".public-survey-cover__start");
    startBtn?.addEventListener("click", () => {
      cover?.classList.add("is-leaving");
      setTimeout(() => {
        if (cover) cover.hidden = true;
        stage.hidden = false;
        stage.classList.add("is-entering");
        setTimeout(() => stage.classList.remove("is-entering"), 360);
        renderStep();
      }, 220);
    });

    const updateRequiredFocus = () => {
      const currentStep = steps[currentIndex];
      if (!currentStep) return;
      panes.forEach((pane, paneIndex) => {
        const isCurrentPane = paneIndex === currentIndex;
        pane.querySelectorAll(".public-question-row").forEach((row) => {
          const question = steps[paneIndex]?.question;
          const answeredRequired = Boolean(question?.required && isQuestionAnswered(form, question));
          row.classList.remove("is-locked-by-required");
          row.classList.toggle("is-required-focus", isCurrentPane && Boolean(question?.required && !isQuestionAnswered(form, question)));
          row.classList.toggle("is-required-complete", isCurrentPane && answeredRequired);
        });
      });
    };

    const updateSelectedChoices = () => {
      form.querySelectorAll(".public-choice").forEach((choice) => {
        const input = choice.querySelector("input");
        choice.classList.toggle("is-selected", Boolean(input?.checked));
      });
    };

    const getStepByPageIndex = (pageIndex) => {
      const index = steps.findIndex((step) => step.pageIndex === pageIndex);
      return index >= 0 ? index : currentIndex;
    };

    const getNextLinearStep = () => Math.min(steps.length - 1, currentIndex + 1);

    const getLastStepIndexForPage = (pageIndex) => {
      for (let index = steps.length - 1; index >= 0; index -= 1) {
        if (steps[index]?.pageIndex === pageIndex) return index;
      }
      return currentIndex;
    };

    const applyAmbient = (design) => {
      const d = normalizePublicPageDesign(design || {});
      const hasImage = Boolean(d.bgImage);
      if (ambientImage) {
        ambientImage.style.backgroundImage = hasImage ? `url("${d.bgImage}")` : "";
        ambientImage.style.opacity = hasImage ? "0.68" : "0";
      }
      if (ambientTint) {
        ambientTint.style.background = hasImage
          ? "linear-gradient(35deg, rgba(2, 6, 23, 0.48), rgba(15, 23, 42, 0.28), rgba(2, 6, 23, 0.58))"
          : `radial-gradient(circle at 20% 0%, rgba(59, 130, 246, 0.24), transparent 34%), linear-gradient(135deg, ${d.bgColor}, #eef5ff)`;
      }
    };

    const renderStep = () => {
      panes.forEach((pane, index) => {
        pane.hidden = index !== currentIndex;
      });
      publicState.currentStep = currentIndex;
      const currentStep = steps[currentIndex] || steps[0];
      const currentPage = currentStep?.page;
      applyAmbient(currentPage?.design || {});
      if (surveyCard) surveyCard.style.removeProperty("background");
      if (surveyCard) surveyCard.style.borderColor = "transparent";
      stage.dataset.hasImage = currentPage?.design?.bgImage ? "true" : "false";

      progressText.textContent = `Вопрос ${Math.min(currentIndex + 1, steps.length)} из ${Math.max(1, steps.length)}`;

      const percent = Math.round(((currentIndex + 1) / Math.max(1, steps.length)) * 100);
      progressPercent.textContent = `${percent}%`;
      progressBar.style.width = `${percent}%`;
      backBtn.hidden = currentIndex === 0;
      nextBtn.hidden = false;
      nextBtn.textContent = currentIndex < steps.length - 1 ? tPublic("next") : tPublic("finish");
      finishBtn.hidden = true;
      status.textContent = publicState.logicNotice || "";
      status.style.color = publicState.logicNotice ? "#1d4ed8" : "";
      updateSelectedChoices();
      updateRequiredFocus();

    };

    form.addEventListener("input", () => {
      updateSelectedChoices();
      clearAnsweredQuestionErrors(form, [steps[currentIndex]?.question].filter(Boolean));
      updateRequiredFocus();
    });
    form.addEventListener("change", () => {
      updateSelectedChoices();
      clearAnsweredQuestionErrors(form, [steps[currentIndex]?.question].filter(Boolean));
      updateRequiredFocus();
    });

    backBtn.addEventListener("click", () => {
      if (isCompleted) return;
      publicState.logicNotice = "";
      if (publicState.history.length > 1) {
        publicState.history.pop();
        currentIndex = publicState.history[publicState.history.length - 1];
      } else {
        currentIndex = Math.max(0, currentIndex - 1);
      }
      form.classList.add("is-page-transition");
      setTimeout(() => form.classList.remove("is-page-transition"), 300);
      renderStep();
    });

    const showCompletion = () => {
      isCompleted = true;
      wrap.innerHTML = `
        <div class="public-ambient public-ambient--image" aria-hidden="true"></div>
        <div class="public-ambient public-ambient--tint" aria-hidden="true"></div>
        <section class="public-survey-success">
          <span class="public-survey-success__mark">OK</span>
          <h2>Спасибо за прохождение.</h2>
          <p>Результаты отправлены на базу.</p>
        </section>
      `;
      const successTint = wrap.querySelector(".public-ambient--tint");
      if (successTint) {
        successTint.style.background = "radial-gradient(circle at 20% 0%, rgba(34, 197, 94, 0.28), transparent 34%), linear-gradient(135deg, #052e16, #0f172a)";
      }
    };

    const submitSurveyResponse = async () => {
      if (isCompleted || nextBtn.disabled) return;
      try {
        nextBtn.disabled = true;
        finishBtn.disabled = true;
        nextBtn.textContent = tPublic("sending");
        const answers = collectPublicAnswers(form, questions);
        const accessPassword = String(form.querySelector("[name='surveyAccessPassword']")?.value || "").trim();
        const submissionId = submitSurveyResponse.submissionId || `submit_${survey.id}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        submitSurveyResponse.submissionId = submissionId;
        publicState.accessPassword = accessPassword;
        await api.request(`/api/surveys/${survey.id}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers, password: accessPassword, submissionId })
        });
        publicState.history = [];
        publicState.logicNotice = "";
        showCompletion();
        showToast(tPublic("success"));
      } catch (error) {
        status.textContent = error.message;
        status.style.color = "#b91c1c";
        showToast(error.message || "Не удалось отправить ответ", true);
        nextBtn.disabled = false;
        finishBtn.disabled = false;
        nextBtn.textContent = currentIndex < steps.length - 1 ? tPublic("next") : tPublic("finish");
      }
    };

    const handleNext = async () => {
      if (isCompleted) return;
      const totalQuestions = steps.length;
      const currentStep = steps[currentIndex];
      const currentQuestion = currentStep?.question;
      if (!validateVisibleQuestions(form, [currentQuestion].filter(Boolean))) {
        status.textContent = "";
        return;
      }

      if (currentIndex >= totalQuestions - 1) {
        await submitSurveyResponse();
        return;
      }

      let nextIndex = getNextLinearStep();
      publicState.logicNotice = "";
      if (currentStep && currentIndex === getLastStepIndexForPage(currentStep.pageIndex)) {
        const rawNextPageIndex = resolveNextPageIndex(currentStep.pageIndex, pages, form);
        const normalizedPageIndex = normalizeRenderableTargetIndex(rawNextPageIndex, pages, currentStep.pageIndex);
        const linearPageIndex = findRenderablePageIndex(pages, currentStep.pageIndex + 1, 1) ?? currentStep.pageIndex;
        if (normalizedPageIndex !== linearPageIndex) {
          const targetTitle = pages[normalizedPageIndex]?.title || `Страница ${normalizedPageIndex + 1}`;
          publicState.logicNotice = formatPublicText(tPublic("logicJumpTo"), { page: targetTitle });
        }
        nextIndex = getStepByPageIndex(normalizedPageIndex);
      }

      if (!Number.isInteger(nextIndex) || nextIndex <= currentIndex) {
        nextIndex = getNextLinearStep();
      }

      if (nextIndex >= totalQuestions) {
        await submitSurveyResponse();
        return;
      }

      currentIndex = nextIndex;
      publicState.currentStep = currentIndex;
      if (publicState.history[publicState.history.length - 1] !== currentIndex) {
        publicState.history.push(currentIndex);
      }
      form.classList.add("is-page-transition");
      setTimeout(() => form.classList.remove("is-page-transition"), 300);
      renderStep();
    };

    nextBtn.addEventListener("click", () => {
      handleNext();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      handleNext();
    });

    applyAmbient(steps[currentIndex]?.page?.design || {});
    renderStep();
    return wrap;
  }

  async function bootPublicMode(surveyId) {
    document.body.classList.remove("survey-owner-mode");
    document.body.classList.add("survey-public-mode");
    await initAuthButton();

    const cleanUrl = new URL(window.location.href);
    let changed = false;
    ["tab", "mode", "owner"].forEach((key) => {
      if (cleanUrl.searchParams.has(key)) {
        cleanUrl.searchParams.delete(key);
        changed = true;
      }
    });
    if (changed) {
      const next = `${cleanUrl.pathname}${cleanUrl.search ? `?${cleanUrl.searchParams.toString()}` : ""}${cleanUrl.hash}`;
      window.history.replaceState({}, "", next);
    }

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
    const pathInfo = getSurveyPathInfo();
    if (!pathInfo) {
      const queryId = getSurveyIdFromQuery();
      if (queryId) {
        await bootOwnerMode(queryId);
        return;
      }
      await bootPublicMode(null);
      return;
    }
    if (pathInfo.mode === "owner") {
      const params = new URLSearchParams(window.location.search);
      const explicitOwner = params.has("tab") || params.get("mode") === "owner" || params.get("owner") === "1";
      if (explicitOwner) {
        await bootOwnerMode(pathInfo.surveyId);
      } else {
        await bootPublicMode(pathInfo.surveyId);
      }
      return;
    }
    await bootPublicMode(pathInfo.surveyId);
  }

  bootstrap().catch((error) => {
    showToast(error.message || "Ошибка загрузки страницы", true);
  });
})();
