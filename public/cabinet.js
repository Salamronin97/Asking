const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortSelect = document.getElementById("sortSelect");
const surveysGrid = document.getElementById("surveysGrid");
const cardsSkeleton = document.getElementById("cardsSkeleton");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");

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

const state = {
  surveys: [],
  filtered: [],
  confirmAction: null,
  trends: new Map()
};

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Ошибка запроса");
    return data;
  }
};

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
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

function updateStats() {
  const total = state.surveys.length;
  const published = state.surveys.filter((item) => item.status === "published").length;
  const draft = state.surveys.filter((item) => item.status === "draft").length;
  const archived = state.surveys.filter((item) => item.status === "archived").length;
  const responses = state.surveys.reduce((sum, item) => sum + Number(item.responses_count || 0), 0);

  statTotal.textContent = String(total);
  statActive.textContent = String(published);
  statDraft.textContent = String(draft);
  statArchived.textContent = String(archived);
  statResponses.textContent = String(responses);
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

function getSorted(items) {
  const mode = sortSelect.value;
  const result = [...items];
  if (mode === "title") {
    return result.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "ru"));
  }
  if (mode === "responses") {
    return result.sort((a, b) => Number(b.responses_count || 0) - Number(a.responses_count || 0));
  }
  return result.sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  let list = state.surveys.filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (!query) return true;
    return `${item.title || ""} ${item.description || ""}`.toLowerCase().includes(query);
  });

  state.filtered = getSorted(list);
  renderCards();
}

function renderCards() {
  if (!state.filtered.length) {
    surveysGrid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  const maxResponses = Math.max(1, ...state.filtered.map((s) => Number(s.responses_count || 0)));
  surveysGrid.innerHTML = state.filtered
    .map((survey) => {
      const archiveLabel = survey.status === "archived" ? "Восстановить" : "Архивировать";
      const windowState = getWindowState(survey);
      const responsePercent = Math.max(2, Math.round((Number(survey.responses_count || 0) / maxResponses) * 100));
      return `
        <article class="svdash-card">
          <header class="svdash-card__head">
            <h3>${escapeHtml(survey.title || "Без названия")}</h3>
            <span class="svdash-pill ${statusClass(survey.status)}">${statusLabel(survey.status)}</span>
          </header>
          <div class="svdash-card__window">
            <span class="svdash-window ${windowState.className}">${windowState.label}</span>
          </div>
          <p class="svdash-card__desc">${escapeHtml(survey.description || "Описание не заполнено")}</p>
          <div class="svdash-card__meta">
            <span>Ответов: <strong>${Number(survey.responses_count || 0)}</strong></span>
            <span>Старт: ${escapeHtml(formatDate(survey.starts_at))}</span>
            <span>Финиш: ${escapeHtml(formatDate(survey.ends_at))}</span>
          </div>
          <div class="svdash-response-bar">
            <span style="width:${responsePercent}%"></span>
          </div>
          <div class="svdash-card__trend">
            ${renderTrendSparkline(survey.id)}
          </div>
          <div class="svdash-card__actions">
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

function renderTrendSparkline(surveyId) {
  const trend = state.trends.get(Number(surveyId));
  if (!Array.isArray(trend) || !trend.length) {
    return `<div class="svdash-trend-empty">Динамика ответов появится после первых ответов</div>`;
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

async function loadTrendsForSurveys(surveys) {
  const ids = surveys
    .map((survey) => Number(survey.id))
    .filter((id) => Number.isInteger(id) && id > 0);
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
  const encoded = encodeURIComponent(link);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}`;
  qrImage.src = qrSrc;
  qrLinkText.textContent = link;
  qrOpenLink.href = link;
  qrDownloadLink.href = qrSrc;
  qrModal.hidden = false;
}

function closeQrModal() {
  qrModal.hidden = true;
}

function openConfirm({ title, text, action, danger = false }) {
  if (typeof window !== "undefined" && typeof window.confirm === "function") {
    const accepted = window.confirm(`${title}\n\n${text}`);
    if (!accepted) return;
    Promise.resolve(action()).catch((error) => {
      showToast(error.message || "Ошибка действия", true);
    });
    return;
  }
  state.confirmAction = action;
  confirmTitle.textContent = title;
  confirmText.textContent = text;
  confirmSubmit.classList.toggle("btn--danger", danger);
  confirmSubmit.classList.toggle("btn--primary", !danger);
  confirmModal.hidden = false;
}

function closeConfirm() {
  state.confirmAction = null;
  confirmModal.hidden = true;
}

async function loadSurveys() {
  cardsSkeleton.hidden = false;
  surveysGrid.innerHTML = "";
  emptyState.hidden = true;

  try {
    const payload = await api.request("/api/surveys?mine=1");
    const list = Array.isArray(payload.surveys) ? payload.surveys : [];
    state.surveys = list
      .map(normalizeSurvey)
      .filter((item) => Number.isInteger(item.id) && item.id > 0 && String(item.title || "").trim().length > 0);
    updateStats();
    applyFilters();
    loadTrendsForSurveys(state.surveys).catch(() => {});
  } finally {
    cardsSkeleton.hidden = true;
  }
}

function bindEvents() {
  logoutBtn?.addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    location.href = "/auth";
  });

  searchInput?.addEventListener("input", applyFilters);
  statusFilter?.addEventListener("change", applyFilters);
  sortSelect?.addEventListener("change", applyFilters);

  surveysGrid?.addEventListener("click", (event) => {
    const copyBtn = event.target.closest("[data-copy]");
    if (copyBtn) {
      const id = Number(copyBtn.dataset.copy);
      navigator.clipboard.writeText(getPublicLink(id)).then(() => showToast("Ссылка скопирована"));
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
        danger: true,
        action: async () => {
          await api.request(`/api/surveys/${id}`, { method: "DELETE" });
          await loadSurveys();
          showToast("Опрос удалён");
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
}

(async function bootstrap() {
  try {
    const me = await api.request("/api/auth/me");
    if (!me.user) {
      location.href = "/auth?next=/cabinet";
      return;
    }
    bindEvents();
    await loadSurveys();
  } catch (error) {
    showToast(error.message || "Не удалось загрузить кабинет", true);
  }
})();
