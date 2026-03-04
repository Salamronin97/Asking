
const surveyRows = document.getElementById("surveyRows");
const logoutBtn = document.getElementById("logoutBtn");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortSelect = document.getElementById("sortSelect");
const tableWrap = document.getElementById("tableWrap");
const tableSkeleton = document.getElementById("tableSkeleton");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");

const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
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
  confirmAction: null
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
    setTimeout(() => (toast.hidden = true), 180);
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

function getWorkspaceLink(id, tab = "constructor") {
  return `/survey.html?id=${id}&tab=${encodeURIComponent(tab)}`;
}

function isCreatedSurvey(item) {
  if (!item || item.id == null) return false;
  const title = String(item.title || "").trim();
  if (!title) return false;
  return true;
}

function normalizeSurvey(item) {
  const statusRaw = String(item.status || "").trim().toLowerCase();
  const status = statusRaw === "archived" ? "archived" : statusRaw === "published" ? "published" : "created";
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
  const active = state.surveys.filter((x) => x.status === "published" || x.status === "created").length;
  const archived = state.surveys.filter((x) => x.status === "archived").length;
  const responses = state.surveys.reduce((sum, x) => sum + Number(x.responses_count || 0), 0);

  statTotal.textContent = String(total);
  statActive.textContent = String(active);
  statArchived.textContent = String(archived);
  statResponses.textContent = String(responses);
}

function statusBadge(status) {
  const archived = status === "archived";
  return `<span class="cabinet-status-pill${archived ? " is-archived" : ""}"><span class="cabinet-status-dot" aria-hidden="true"></span>${archived ? "Архив" : "Активная"}</span>`;
}

function getSorted(items) {
  const mode = sortSelect.value;
  const result = [...items];
  if (mode === "title") return result.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "ru"));
  if (mode === "responses") return result.sort((a, b) => Number(b.responses_count || 0) - Number(a.responses_count || 0));
  return result.sort((a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0));
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  let list = state.surveys.filter((item) => {
    if (status === "published" && item.status !== "published" && item.status !== "created") return false;
    if (status !== "all" && status !== "published" && item.status !== status) return false;
    if (!query) return true;
    return `${item.title || ""} ${item.description || ""}`.toLowerCase().includes(query);
  });

  state.filtered = getSorted(list);
  renderTable();
}

function actionMenu(survey) {
  const id = Number(survey.id);
  const isArchived = survey.status === "archived";
  return `
    <div class="actions-menu-wrap">
      <a class="btn btn--outline btn--xs" href="${getWorkspaceLink(id)}">Открыть</a>
      <button class="btn btn--ghost btn--xs actions-trigger" type="button" data-menu-trigger="${id}" aria-label="Меню действий">⋯</button>
      <div class="actions-menu" data-menu="${id}">
        <button class="actions-item" type="button" data-copy="${id}">Скопировать ссылку</button>
        <button class="actions-item" type="button" data-qr="${id}">QR-код</button>
        <a class="actions-item" href="${getWorkspaceLink(id, "results")}">Результаты</a>
        <a class="actions-item" href="/api/surveys/${id}/export.csv" target="_blank" rel="noopener">Экспорт CSV</a>
        <a class="actions-item" href="/api/surveys/${id}/export.xlsx" target="_blank" rel="noopener">Экспорт XLSX</a>
        <button class="actions-item" type="button" data-duplicate="${id}">Дублировать</button>
        <button class="actions-item" type="button" data-archive="${id}">${isArchived ? "Восстановить" : "Архивировать"}</button>
        <button class="actions-item actions-item--danger" type="button" data-delete="${id}">Удалить</button>
      </div>
    </div>
  `;
}

function renderTable() {
  closeMenus();

  if (!state.filtered.length) {
    surveyRows.innerHTML = "";
    tableWrap.hidden = true;
    emptyState.hidden = false;
    return;
  }

  tableWrap.hidden = false;
  emptyState.hidden = true;

  surveyRows.innerHTML = state.filtered.map((survey) => `
    <tr class="table-row">
      <td class="survey-col">
        <strong class="survey-name">${escapeHtml(survey.title || "Без названия")}</strong>
        <div class="meta-line">${escapeHtml(survey.description || "Описание не заполнено")}</div>
      </td>
      <td>${statusBadge(survey.status)}</td>
      <td><span class="badge">${Number(survey.responses_count || 0)}</span></td>
      <td class="date-col">${escapeHtml(formatDate(survey.starts_at))}</td>
      <td class="date-col">${escapeHtml(formatDate(survey.ends_at))}</td>
      <td>${actionMenu(survey)}</td>
    </tr>
  `).join("");
}

function closeMenus() {
  surveyRows.querySelectorAll(".actions-menu.is-open").forEach((menu) => menu.classList.remove("is-open"));
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
  tableSkeleton.hidden = false;
  tableWrap.hidden = true;
  emptyState.hidden = true;

  try {
    const payload = await api.request("/api/surveys");
    const list = Array.isArray(payload.surveys) ? payload.surveys : [];
    const base = list.filter(isCreatedSurvey).map(normalizeSurvey);
    const resolved = await Promise.all(
      base.map(async (survey) => {
        if (survey.status === "published") return survey;
        try {
          const details = await api.request(`/api/surveys/${survey.id}`);
          const questionCount = Array.isArray(details.questions) ? details.questions.length : 0;
          if (questionCount > 0) return survey;
          return null;
        } catch {
          return null;
        }
      })
    );
    state.surveys = resolved.filter(Boolean);
    updateStats();
    applyFilters();
  } finally {
    tableSkeleton.hidden = true;
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

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-menu-trigger]");
    if (trigger) {
      const id = trigger.dataset.menuTrigger;
      const menu = surveyRows.querySelector(`[data-menu="${id}"]`);
      const opened = menu?.classList.contains("is-open");
      closeMenus();
      if (menu && !opened) menu.classList.add("is-open");
      return;
    }

    if (!event.target.closest(".actions-menu-wrap")) closeMenus();

    const copyBtn = event.target.closest("[data-copy]");
    if (copyBtn) {
      const id = copyBtn.dataset.copy;
      navigator.clipboard.writeText(getPublicLink(id)).then(() => showToast("Ссылка скопирована"));
      closeMenus();
      return;
    }

    const qrBtn = event.target.closest("[data-qr]");
    if (qrBtn) {
      openQrModal(getPublicLink(qrBtn.dataset.qr));
      closeMenus();
      return;
    }

    const dupBtn = event.target.closest("[data-duplicate]");
    if (dupBtn) {
      const id = Number(dupBtn.dataset.duplicate);
      api.request(`/api/surveys/${id}/duplicate`, { method: "POST" })
        .then(() => loadSurveys())
        .then(() => showToast("Анкета продублирована"))
        .catch((e) => showToast(e.message || "Ошибка", true));
      closeMenus();
      return;
    }

    const arcBtn = event.target.closest("[data-archive]");
    if (arcBtn) {
      const id = Number(arcBtn.dataset.archive);
      const survey = state.surveys.find((x) => x.id === id);
      const actionTitle = survey?.status === "archived" ? "Восстановить анкету" : "Архивировать анкету";
      openConfirm({
        title: actionTitle,
        text: "Это действие можно отменить позже.",
        action: async () => {
          await api.request(`/api/surveys/${id}/archive`, { method: "POST" });
          await loadSurveys();
          showToast(survey?.status === "archived" ? "Анкета восстановлена" : "Анкета архивирована");
        }
      });
      closeMenus();
      return;
    }

    const delBtn = event.target.closest("[data-delete]");
    if (delBtn) {
      const id = Number(delBtn.dataset.delete);
      openConfirm({
        title: "Удалить анкету",
        text: "Анкета и ответы будут удалены без возможности восстановления.",
        danger: true,
        action: async () => {
          await api.request(`/api/surveys/${id}`, { method: "DELETE" });
          await loadSurveys();
          showToast("Анкета удалена");
        }
      });
      closeMenus();
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
    if (!me.user) return (location.href = "/auth?next=/cabinet");

    bindEvents();
    await loadSurveys();
  } catch (error) {
    showToast(error.message || "Не удалось загрузить кабинет", true);
  }
})();
