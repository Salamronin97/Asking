const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");
const viewToggleBtn = document.getElementById("viewToggleBtn");
const statusLine = document.getElementById("cabinetStatusLine");
const selectAllFilteredBtn = document.getElementById("selectAllFilteredBtn");
const clearBulkSelectionBtn = document.getElementById("clearBulkSelectionBtn") || document.getElementById("clearSelectionBtn");
const bulkSelectionCount = document.getElementById("bulkSelectionCount") || document.getElementById("bulkCount");
const bulkPublishBtn = document.getElementById("bulkPublishBtn");
const bulkArchiveBtn = document.getElementById("bulkArchiveBtn");
const bulkDeleteBtn = document.getElementById("bulkDeleteBtn");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortSelect = document.getElementById("sortSelect");
const surveysGrid = document.getElementById("surveysGrid");
const cardsSkeleton = document.getElementById("cardsSkeleton");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");
const resultsCount = document.getElementById("resultsCount");

const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statDraft = document.getElementById("statDraft");
const statArchived = document.getElementById("statArchived");
const statResponses = document.getElementById("statResponses");

const qrModal = document.getElementById("qrModal");
const qrModalClose = document.getElementById("qrModalClose");
const qrImage = document.getElementById("qrImage");
const qrLinkText = document.getElementById("qrLinkText");
const qrOpenLink = document.getElementById("qrOpenLink");
const qrDownloadLink = document.getElementById("qrDownloadLink");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmText = document.getElementById("confirmText");
const confirmCancel = document.getElementById("confirmCancel");
const confirmSubmit = document.getElementById("confirmSubmit");

const VALID_STATUS = new Set(["all", "published", "draft", "archived"]);
const VIEW_KEY = "asking_cabinet_view";
const STATUS_TIMEOUT_MS = 3200;

const state = {
  surveys: [],
  filtered: [],
  trends: new Map(),
  loading: false,
  selectedSurveyIds: [],
  viewMode: localStorage.getItem(VIEW_KEY) === "compact" ? "compact" : "grid"
};

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Ошибка запроса");
    return data;
  }
};

function applyStaticCabinetTextFixes() {
  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  setText("#refreshBtn", "Обновить");
  setText("#viewToggleBtn", "Компактный вид");
  setText("#bulkCount", "0 выбрано");
  setText("#selectAllFilteredBtn", "Выбрать все");
  setText("#clearSelectionBtn", "Снять выделение");
  setText("#bulkPublishBtn", "Опубликовать");
  setText("#bulkArchiveBtn", "Архивировать");
  setText("#bulkDeleteBtn", "Удалить");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message, isError = false) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => {
      toast.hidden = true;
    }, 180);
  }, 2200);
}

function setStatusLine(message, isError = false) {
  if (!statusLine) return;
  statusLine.textContent = String(message || "");
  statusLine.classList.toggle("is-error", isError);
  clearTimeout(setStatusLine.timer);
  if (!message) return;
  setStatusLine.timer = setTimeout(() => {
    if (statusLine.textContent === message) {
      statusLine.textContent = "";
      statusLine.classList.remove("is-error");
    }
  }, STATUS_TIMEOUT_MS);
}

function copyText(text) {
  const value = String(text || "");
  if (!value) return Promise.reject(new Error("Пустой текст"));
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);

  return new Promise((resolve, reject) => {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "readonly");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.focus();
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      if (!ok) throw new Error("copy failed");
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getPublicLink(id) {
  return `${window.location.origin}/survey/${id}`;
}

function getBuilderLink(id) {
  return `/create?surveyId=${encodeURIComponent(id)}`;
}

function getResultsLink(id) {
  return `/survey.html?id=${encodeURIComponent(id)}&tab=results`;
}

function highlightMatch(text, query) {
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

function statusLabel(status) {
  if (status === "published") return "Опубликован";
  if (status === "archived") return "Архив";
  return "Черновик";
}

function statusClass(status) {
  if (status === "published") return "is-published";
  if (status === "archived") return "is-archived";
  return "is-draft";
}

function getWindowState(survey) {
  const now = Date.now();
  const starts = survey.starts_at ? Date.parse(survey.starts_at) : null;
  const ends = survey.ends_at ? Date.parse(survey.ends_at) : null;
  if (survey.status !== "published") return { label: "Неактивен", className: "is-muted" };
  if (starts && starts > now) return { label: "Ожидает старта", className: "is-pending" };
  if (ends && ends < now) return { label: "Завершен", className: "is-ended" };
  return { label: "Идет сбор", className: "is-live" };
}

function normalizeSurvey(item) {
  const statusRaw = String(item.status || "").trim().toLowerCase();
  const status = statusRaw === "published" || statusRaw === "archived" ? statusRaw : "draft";
  return {
    ...item,
    id: Number(item.id),
    title: String(item.title || "").trim(),
    description: String(item.description || "").trim(),
    status,
    responses_count: Number(item.responses_count || 0)
  };
}

function getStatusFromUrl() {
  const status = String(new URLSearchParams(window.location.search).get("status") || "").trim().toLowerCase();
  return VALID_STATUS.has(status) ? status : "all";
}

function applyInitialFiltersFromUrl() {
  if (statusFilter) statusFilter.value = getStatusFromUrl();
  if (searchInput) searchInput.value = String(new URLSearchParams(window.location.search).get("q") || "").trim();
}

function syncUrlWithFilters() {
  const params = new URLSearchParams(window.location.search);
  const status = String(statusFilter?.value || "all");
  const q = String(searchInput?.value || "").trim();

  if (status !== "all") params.set("status", status);
  else params.delete("status");

  if (q) params.set("q", q);
  else params.delete("q");

  const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  window.history.replaceState({}, "", next);
}

function updateFolderChips() {
  const current = String(statusFilter?.value || "all");
  document.querySelectorAll("[data-status-chip]").forEach((node) => {
    node.classList.toggle("is-active", node.getAttribute("data-status-chip") === current);
  });
}

function updateStats() {
  const total = state.surveys.length;
  const published = state.surveys.filter((item) => item.status === "published").length;
  const draft = state.surveys.filter((item) => item.status === "draft").length;
  const archived = state.surveys.filter((item) => item.status === "archived").length;
  const responses = state.surveys.reduce((sum, item) => sum + Number(item.responses_count || 0), 0);

  if (statTotal) statTotal.textContent = String(total);
  if (statActive) statActive.textContent = String(published);
  if (statDraft) statDraft.textContent = String(draft);
  if (statArchived) statArchived.textContent = String(archived);
  if (statResponses) statResponses.textContent = String(responses);
}

function updateResultsCount() {
  if (!resultsCount) return;
  const modeLabel = state.viewMode === "compact" ? "компакт" : "карточки";
  resultsCount.textContent = `Показано ${state.filtered.length} из ${state.surveys.length} • Вид: ${modeLabel}`;
}

function getSorted(items) {
  const mode = String(sortSelect?.value || "date");
  const result = [...items];
  if (mode === "title") {
    return result.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "ru"));
  }
  if (mode === "responses") {
    return result.sort((a, b) => Number(b.responses_count || 0) - Number(a.responses_count || 0));
  }
  return result.sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
}

function getSelectedSurveyIds() {
  const existing = new Set(state.surveys.map((item) => Number(item.id)));
  const normalized = (Array.isArray(state.selectedSurveyIds) ? state.selectedSurveyIds : [])
    .map((id) => Number(id))
    .filter((id, index, list) => Number.isInteger(id) && existing.has(id) && list.indexOf(id) === index);
  state.selectedSurveyIds = normalized;
  return normalized;
}

function isSurveySelected(surveyId) {
  return getSelectedSurveyIds().includes(Number(surveyId));
}

function setSelectedSurveyIds(ids) {
  state.selectedSurveyIds = Array.isArray(ids) ? ids.map((id) => Number(id)).filter((id) => Number.isInteger(id)) : [];
  updateBulkControls();
}

function toggleSurveySelection(surveyId) {
  const id = Number(surveyId);
  if (!Number.isInteger(id)) return;
  const selected = getSelectedSurveyIds();
  if (selected.includes(id)) {
    setSelectedSurveyIds(selected.filter((item) => item !== id));
  } else {
    setSelectedSurveyIds([...selected, id]);
  }
}

function clearSurveySelection() {
  setSelectedSurveyIds([]);
  renderCards();
  setStatusLine("Выделение очищено");
}

function selectAllFilteredSurveys() {
  const ids = state.filtered.map((item) => Number(item.id)).filter((id) => Number.isInteger(id));
  setSelectedSurveyIds(ids);
  renderCards();
  setStatusLine(`Выбрано опросов: ${ids.length}`);
}

function updateBulkControls() {
  const selectedCount = getSelectedSurveyIds().length;
  const shouldShow = selectedCount > 0;

  if (bulkSelectionCount) bulkSelectionCount.textContent = `${selectedCount} выбрано`;
  if (clearBulkSelectionBtn) clearBulkSelectionBtn.disabled = selectedCount === 0;
  if (bulkPublishBtn) bulkPublishBtn.disabled = selectedCount === 0;
  if (bulkArchiveBtn) bulkArchiveBtn.disabled = selectedCount === 0;
  if (bulkDeleteBtn) bulkDeleteBtn.disabled = selectedCount === 0;
  if (selectAllFilteredBtn) selectAllFilteredBtn.disabled = state.filtered.length === 0;

  const bar = document.getElementById("bulkBar");
  if (bar) bar.hidden = !shouldShow;
}

function setViewMode(mode, notify = false) {
  state.viewMode = mode === "compact" ? "compact" : "grid";
  localStorage.setItem(VIEW_KEY, state.viewMode);

  if (surveysGrid) surveysGrid.classList.toggle("is-compact", state.viewMode === "compact");
  if (viewToggleBtn) {
    const compact = state.viewMode === "compact";
    viewToggleBtn.textContent = compact ? "Вид: карточки" : "Компактный вид";
    viewToggleBtn.setAttribute("aria-pressed", compact ? "true" : "false");
  }

  updateResultsCount();
  if (notify) {
    setStatusLine(state.viewMode === "compact" ? "Включен компактный режим" : "Включен карточный режим");
  }
}

function applyFilters() {
  const query = String(searchInput?.value || "").trim().toLowerCase();
  const status = String(statusFilter?.value || "all");

  const list = state.surveys.filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (!query) return true;
    return `${item.title || ""} ${item.description || ""}`.toLowerCase().includes(query);
  });

  state.filtered = getSorted(list);
  syncUrlWithFilters();
  updateFolderChips();
  updateResultsCount();
  renderCards();
}

function renderTrendSparkline(surveyId) {
  const trend = state.trends.get(Number(surveyId));
  if (!Array.isArray(trend) || !trend.length) {
    return `<div class="svdash-trend-empty">Динамика появится после первых ответов</div>`;
  }

  const values = trend.map((item) => Math.max(0, Number(item.count || 0)));
  const max = Math.max(1, ...values);
  const width = 240;
  const height = 52;
  const padding = 4;
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  const points = values
    .map((value, index) => {
      const x = padding + index * step;
      const y = height - padding - (value / max) * (height - padding * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const areaPoints = `0,${height - padding} ${points} ${width},${height - padding}`;
  const total = values.reduce((sum, value) => sum + value, 0);

  return `
    <div class="svdash-trend">
      <div class="svdash-trend__head">
        <span>Динамика ответов</span>
        <strong>${total}</strong>
      </div>
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
        <polygon class="svdash-trend__area" points="${areaPoints}" />
        <polyline class="svdash-trend__line" points="${points}" />
      </svg>
    </div>
  `;
}

function renderCards() {
  const query = String(searchInput?.value || "").trim();

  if (!state.filtered.length) {
    if (surveysGrid) surveysGrid.innerHTML = "";
    if (emptyState) emptyState.hidden = false;
    updateBulkControls();
    return;
  }

  if (emptyState) emptyState.hidden = true;
  const maxResponses = Math.max(1, ...state.filtered.map((s) => Number(s.responses_count || 0)));

  if (surveysGrid) {
    surveysGrid.innerHTML = state.filtered
      .map((survey, index) => {
        const selected = isSurveySelected(survey.id);
        const archiveLabel = survey.status === "archived" ? "Восстановить" : "Архивировать";
        const windowState = getWindowState(survey);
        const responsePercent = Math.max(2, Math.round((Number(survey.responses_count || 0) / maxResponses) * 100));
        const titleHtml = highlightMatch(survey.title || "Без названия", query);
        const descHtml = highlightMatch(survey.description || "Описание не заполнено", query);
        return `
          <article class="svdash-card${selected ? " is-selected" : ""}" style="--card-delay:${Math.min(index, 10) * 35}ms" data-survey-card="${survey.id}">
            <header class="svdash-card__head">
              <h3>${titleHtml}</h3>
              <span class="svdash-pill ${statusClass(survey.status)}">${statusLabel(survey.status)}</span>
            </header>
            <div class="svdash-card__window">
              <span class="svdash-window ${windowState.className}">${windowState.label}</span>
            </div>
            <p class="svdash-card__desc">${descHtml}</p>
            <div class="svdash-card__meta">
              <span>Ответов: <strong>${Number(survey.responses_count || 0)}</strong></span>
              <span>Старт: ${escapeHtml(formatDate(survey.starts_at))}</span>
              <span>Финиш: ${escapeHtml(formatDate(survey.ends_at))}</span>
            </div>
            <div class="svdash-response-bar">
              <span style="width:${responsePercent}%"></span>
            </div>
            <div class="svdash-card__trend">${renderTrendSparkline(survey.id)}</div>
            <div class="svdash-card__actions">
              <button class="btn btn--ghost btn--xs" type="button" data-select="${survey.id}" aria-pressed="${selected ? "true" : "false"}">${selected ? "Выбрано" : "Выбрать"}</button>
              <a class="btn btn--outline btn--xs" href="${getBuilderLink(survey.id)}">Открыть</a>
              <a class="btn btn--ghost btn--xs" href="${getResultsLink(survey.id)}">Результаты</a>
              <button class="btn btn--ghost btn--xs" type="button" data-copy="${survey.id}">Ссылка</button>
              <button class="btn btn--ghost btn--xs" type="button" data-qr="${survey.id}">QR</button>
              <button class="btn btn--ghost btn--xs" type="button" data-duplicate="${survey.id}">Дублировать</button>
              <button class="btn btn--ghost btn--xs" type="button" data-archive="${survey.id}">${archiveLabel}</button>
              <button class="btn btn--danger btn--xs" type="button" data-delete="${survey.id}">Удалить</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  updateBulkControls();
}

async function loadTrendsForSurveys(surveys) {
  const ids = surveys
    .map((survey) => Number(survey.id))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 12);

  if (!ids.length) return;

  const requests = ids.map(async (surveyId) => {
    try {
      const payload = await api.request(`/api/surveys/${surveyId}/results`);
      state.trends.set(surveyId, Array.isArray(payload.trend) ? payload.trend : []);
    } catch {
      state.trends.set(surveyId, []);
    }
  });

  await Promise.allSettled(requests);
  renderCards();
}

function openQrModal(link) {
  if (!qrModal || !qrImage || !qrLinkText || !qrOpenLink || !qrDownloadLink) return;
  const encoded = encodeURIComponent(link);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}`;
  qrImage.src = qrSrc;
  qrLinkText.textContent = link;
  qrOpenLink.href = link;
  qrDownloadLink.href = qrSrc;
  qrModal.hidden = false;
}

function closeQrModal() {
  if (qrModal) qrModal.hidden = true;
}

function openConfirm({ title, text, action }) {
  if (typeof window !== "undefined" && typeof window.confirm === "function") {
    const accepted = window.confirm(`${title}\n\n${text}`);
    if (!accepted) return;
    Promise.resolve(action()).catch((error) => {
      showToast(error.message || "Ошибка действия", true);
    });
    return;
  }

  if (!confirmModal || !confirmTitle || !confirmText || !confirmSubmit) return;
  state.confirmAction = action;
  confirmTitle.textContent = title;
  confirmText.textContent = text;
  confirmModal.hidden = false;
}

function closeConfirm() {
  state.confirmAction = null;
  if (confirmModal) confirmModal.hidden = true;
}

async function runBulkAction({ title, text, action, successLabel }) {
  const ids = getSelectedSurveyIds();
  if (!ids.length) {
    setStatusLine("Нет выбранных опросов");
    return;
  }

  openConfirm({
    title,
    text,
    action: async () => {
      let okCount = 0;
      const errors = [];

      for (const id of ids) {
        try {
          await action(id);
          okCount += 1;
        } catch (error) {
          errors.push(error?.message || `Ошибка для опроса ${id}`);
        }
      }

      await loadSurveys();
      setSelectedSurveyIds([]);
      renderCards();

      if (okCount) showToast(`${successLabel}: ${okCount}`);
      if (errors.length) showToast(`Ошибок: ${errors.length}`, true);
    }
  });
}

async function loadSurveys({ silent = false } = {}) {
  if (!silent) {
    state.loading = true;
    if (cardsSkeleton) cardsSkeleton.hidden = false;
    if (surveysGrid) surveysGrid.innerHTML = "";
    if (emptyState) emptyState.hidden = true;
    if (refreshBtn) refreshBtn.disabled = true;
    setStatusLine("Обновляем список опросов...");
  }

  try {
    const status = String(statusFilter?.value || "all");
    const endpoint = status !== "all" ? `/api/surveys?mine=1&status=${encodeURIComponent(status)}` : "/api/surveys?mine=1";
    const payload = await api.request(endpoint);
    const list = Array.isArray(payload.surveys) ? payload.surveys : [];
    state.surveys = list
      .map(normalizeSurvey)
      .filter((item) => Number.isInteger(item.id) && item.id > 0 && String(item.title || "").trim().length > 0);

    updateStats();
    applyFilters();
    loadTrendsForSurveys(state.surveys).catch(() => {});
    setStatusLine(`Синхронизировано: ${new Date().toLocaleTimeString("ru-RU")}`);
  } catch (error) {
    const message = error.message || "Ошибка загрузки";
    showToast(message, true);
    setStatusLine(message, true);
  } finally {
    state.loading = false;
    if (cardsSkeleton) cardsSkeleton.hidden = true;
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

function bindEvents() {
  logoutBtn?.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    location.href = "/auth";
  });

  refreshBtn?.addEventListener("click", () => {
    loadSurveys().catch(() => {});
  });

  viewToggleBtn?.addEventListener("click", () => {
    setViewMode(state.viewMode === "compact" ? "grid" : "compact", true);
    renderCards();
  });

  selectAllFilteredBtn?.addEventListener("click", selectAllFilteredSurveys);
  clearBulkSelectionBtn?.addEventListener("click", clearSurveySelection);

  bulkPublishBtn?.addEventListener("click", () => {
    runBulkAction({
      title: "Опубликовать выбранные",
      text: "Выбранные опросы будут опубликованы.",
      successLabel: "Опубликовано",
      action: (id) => api.request(`/api/surveys/${id}/publish`, { method: "POST" })
    });
  });

  bulkArchiveBtn?.addEventListener("click", () => {
    runBulkAction({
      title: "Архивировать выбранные",
      text: "Выбранные опросы будут перемещены в архив.",
      successLabel: "Архивировано",
      action: (id) => api.request(`/api/surveys/${id}/archive`, { method: "POST" })
    });
  });

  bulkDeleteBtn?.addEventListener("click", () => {
    runBulkAction({
      title: "Удалить выбранные",
      text: "Это действие нельзя отменить.",
      successLabel: "Удалено",
      action: (id) => api.request(`/api/surveys/${id}`, { method: "DELETE" })
    });
  });

  searchInput?.addEventListener("input", applyFilters);
  statusFilter?.addEventListener("change", () => {
    applyFilters();
    loadSurveys().catch(() => {});
  });
  sortSelect?.addEventListener("change", applyFilters);

  document.querySelectorAll("[data-status-chip]").forEach((node) => {
    node.addEventListener("click", (event) => {
      event.preventDefault();
      const status = String(node.getAttribute("data-status-chip") || "all");
      if (!VALID_STATUS.has(status) || !statusFilter) return;
      statusFilter.value = status;
      applyFilters();
      loadSurveys().catch(() => {});
    });
  });

  surveysGrid?.addEventListener("click", (event) => {
    const selectBtn = event.target.closest("[data-select]");
    if (selectBtn) {
      const id = Number(selectBtn.dataset.select);
      toggleSurveySelection(id);
      renderCards();
      return;
    }

    const copyBtn = event.target.closest("[data-copy]");
    if (copyBtn) {
      const id = Number(copyBtn.dataset.copy);
      copyText(getPublicLink(id))
        .then(() => showToast("Ссылка скопирована"))
        .catch(() => showToast("Не удалось скопировать ссылку", true));
      return;
    }

    const qrBtn = event.target.closest("[data-qr]");
    if (qrBtn) {
      const id = Number(qrBtn.dataset.qr);
      openQrModal(getPublicLink(id));
      return;
    }

    const dupBtn = event.target.closest("[data-duplicate]");
    if (dupBtn) {
      const id = Number(dupBtn.dataset.duplicate);
      api.request(`/api/surveys/${id}/duplicate`, { method: "POST" })
        .then(() => loadSurveys())
        .then(() => showToast("Опрос продублирован"))
        .catch((error) => showToast(error.message || "Ошибка", true));
      return;
    }

    const arcBtn = event.target.closest("[data-archive]");
    if (arcBtn) {
      const id = Number(arcBtn.dataset.archive);
      const survey = state.surveys.find((item) => item.id === id);
      const isArchived = survey?.status === "archived";
      openConfirm({
        title: isArchived ? "Восстановить опрос" : "Архивировать опрос",
        text: isArchived ? "Опрос снова станет доступен в списке активных." : "Опрос будет скрыт в архив.",
        action: async () => {
          if (isArchived) {
            await api.request(`/api/surveys/${id}/unarchive`, { method: "POST" });
          } else {
            await api.request(`/api/surveys/${id}/archive`, { method: "POST" });
          }
          await loadSurveys();
          showToast(isArchived ? "Опрос восстановлен" : "Опрос архивирован");
        }
      });
      return;
    }

    const delBtn = event.target.closest("[data-delete]");
    if (delBtn) {
      const id = Number(delBtn.dataset.delete);
      openConfirm({
        title: "Удалить опрос",
        text: "Действие необратимо: будут удалены анкета и ответы.",
        action: async () => {
          await api.request(`/api/surveys/${id}`, { method: "DELETE" });
          await loadSurveys();
          showToast("Опрос удален");
        }
      });
    }
  });

  qrModalClose?.addEventListener("click", closeQrModal);
  qrModal?.addEventListener("click", (event) => {
    if (event.target === qrModal) closeQrModal();
  });

  confirmCancel?.addEventListener("click", closeConfirm);
  confirmModal?.addEventListener("click", (event) => {
    if (event.target === confirmModal) closeConfirm();
  });

  confirmSubmit?.addEventListener("click", async () => {
    if (!state.confirmAction) return;
    try {
      confirmSubmit.disabled = true;
      await state.confirmAction();
      closeConfirm();
    } catch (error) {
      showToast(error.message || "Ошибка действия", true);
    } finally {
      confirmSubmit.disabled = false;
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (qrModal && !qrModal.hidden) closeQrModal();
      if (confirmModal && !confirmModal.hidden) closeConfirm();
      return;
    }

    const inInput = event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']");
    if (inInput) return;

    if (event.key === "/") {
      event.preventDefault();
      searchInput?.focus();
      searchInput?.select();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput?.focus();
      searchInput?.select();
      return;
    }

    if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      window.location.href = "/create";
      return;
    }

    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      loadSurveys().catch(() => {});
      return;
    }

    if (event.key.toLowerCase() === "v") {
      event.preventDefault();
      setViewMode(state.viewMode === "compact" ? "grid" : "compact", true);
      renderCards();
    }
  });
}

(async function bootstrap() {
  try {
    applyStaticCabinetTextFixes();
    const me = await api.request("/api/auth/me");
    if (!me.user) {
      location.href = "/auth?next=/cabinet";
      return;
    }
    applyInitialFiltersFromUrl();
    updateFolderChips();
    setViewMode(state.viewMode, false);
    bindEvents();
    updateBulkControls();
    await loadSurveys();
  } catch (error) {
    showToast(error.message || "Не удалось загрузить кабинет", true);
  }
})();
