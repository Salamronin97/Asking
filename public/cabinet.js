const surveyRows = document.getElementById("surveyRows");
const logoutBtn = document.getElementById("logoutBtn");
const languageSelect = document.getElementById("languageSelect");
const newSurveyBtn = document.getElementById("newSurveyBtn");
const createModal = document.getElementById("createModal");
const createModalCloseBtn = document.getElementById("createModalCloseBtn");
const analysisModal = document.getElementById("analysisModal");
const analysisCloseBtn = document.getElementById("analysisCloseBtn");
const analysisTitle = document.getElementById("analysisTitle");
const analysisBody = document.getElementById("analysisBody");

const LANG_KEY = "asking-pro-lang";

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ru-RU");
}

function statusLabel(status) {
  return status === "archived" ? "Архив" : "Активный";
}

function openCreateModal() {
  createModal.hidden = false;
}

function closeCreateModal() {
  createModal.hidden = true;
}

async function renderAnalysis(id, title) {
  const data = await api.request(`/api/surveys/${id}/results`);
  const trendRows = (data.trend || [])
    .map((row) => `<tr><td>${escapeHtml(row.day)}</td><td>${escapeHtml(row.count)}</td></tr>`)
    .join("");
  const blocks = (data.results || [])
    .map((item) => {
      if (item.type === "rating") {
        return `<div class="card"><strong>${escapeHtml(item.text)}</strong><p>Средняя оценка: ${escapeHtml(item.average ?? 0)}</p></div>`;
      }
      if (item.type === "single" || item.type === "multi") {
        const counts = Object.entries(item.counts || {})
          .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
          .join("<br/>");
        return `<div class="card"><strong>${escapeHtml(item.text)}</strong><p>${counts || "-"}</p></div>`;
      }
      return `<div class="card"><strong>${escapeHtml(item.text)}</strong></div>`;
    })
    .join("");

  analysisTitle.textContent = `Аналитика: ${title}`;
  analysisBody.innerHTML = `
    <div class="card"><strong>Всего ответов:</strong> ${escapeHtml(data.summary?.totalResponses ?? 0)}</div>
    <div class="card" style="margin-top:10px;">
      <strong>Тренд</strong>
      <table><thead><tr><th>Дата</th><th>Ответов</th></tr></thead><tbody>${trendRows || "<tr><td colspan='2'>Нет данных</td></tr>"}</tbody></table>
    </div>
    <div style="margin-top:10px;display:grid;gap:8px;">${blocks || "<div class='card'>Нет данных</div>"}</div>
  `;
  analysisModal.hidden = false;
}

function rowActions(survey) {
  const canOpen = survey.status === "published";
  const openUrl = `/survey/${survey.id}`;
  return `
    <div class="table-actions">
      ${canOpen ? `<a class="btn btn--ghost" href="${openUrl}" target="_blank">Открыть</a>` : ""}
      ${canOpen ? `<button class="btn btn--ghost" data-copy="${survey.id}" type="button">Ссылка</button>` : ""}
      <button class="btn btn--ghost" data-analysis="${survey.id}" data-title="${escapeHtml(survey.title || "Без названия")}" type="button">Результаты</button>
      <a class="btn btn--ghost" href="/api/surveys/${survey.id}/export.csv">CSV</a>
      <a class="btn btn--ghost" href="/api/surveys/${survey.id}/export.xlsx">XLSX</a>
      ${survey.status === "published" ? `<button class="btn btn--outline" data-archive="${survey.id}" type="button">Архив</button>` : ""}
      <button class="btn btn--danger" data-delete="${survey.id}" type="button">Удалить</button>
    </div>
  `;
}

function attachRowHandlers() {
  surveyRows.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-copy");
      await navigator.clipboard.writeText(`${window.location.origin}/survey/${id}`);
      btn.textContent = "Скопировано";
      setTimeout(() => (btn.textContent = "Ссылка"), 1000);
    });
  });

  surveyRows.querySelectorAll("[data-analysis]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await renderAnalysis(Number(btn.getAttribute("data-analysis")), btn.getAttribute("data-title"));
    });
  });

  surveyRows.querySelectorAll("[data-archive]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await api.request(`/api/surveys/${btn.getAttribute("data-archive")}/archive`, { method: "POST" });
      await loadSurveys();
    });
  });

  surveyRows.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!window.confirm("Удалить анкету?")) return;
      await api.request(`/api/surveys/${btn.getAttribute("data-delete")}`, { method: "DELETE" });
      await loadSurveys();
    });
  });
}

async function loadSurveys() {
  const data = await api.request("/api/surveys?mine=1");
  const surveys = data.surveys || [];
  if (!surveys.length) {
    surveyRows.innerHTML = `<tr><td colspan="6">Анкет пока нет.</td></tr>`;
    return;
  }

  surveyRows.innerHTML = surveys
    .map(
      (survey) => `
        <tr>
          <td>
            <strong>${escapeHtml(survey.title || "Без названия")}</strong>
            <div class="meta-line">${escapeHtml(survey.description || "Без описания")}</div>
          </td>
          <td>${statusLabel(survey.status)}</td>
          <td>${escapeHtml(Number(survey.responses_count || 0))}</td>
          <td>${escapeHtml(formatDate(survey.starts_at))}</td>
          <td>${escapeHtml(formatDate(survey.ends_at))}</td>
          <td>${rowActions(survey)}</td>
        </tr>
      `
    )
    .join("");
  attachRowHandlers();
}

function wireCreateModes() {
  document.querySelectorAll(".create-mode").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-mode");
      if (mode === "custom") window.location.href = "/create?mode=custom";
      if (mode === "template") window.location.href = "/create?mode=template";
      if (mode === "ai") window.location.href = "/create?mode=ai";
    });
  });
}

async function bootstrap() {
  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }

  const lang = ["en", "ru", "kz"].includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : "ru";
  languageSelect.value = lang;
  languageSelect.addEventListener("change", () => localStorage.setItem(LANG_KEY, languageSelect.value));

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });

  newSurveyBtn.addEventListener("click", openCreateModal);
  createModalCloseBtn.addEventListener("click", closeCreateModal);
  createModal.addEventListener("click", (event) => {
    if (event.target === createModal) closeCreateModal();
  });
  analysisCloseBtn.addEventListener("click", () => {
    analysisModal.hidden = true;
  });

  wireCreateModes();
  await loadSurveys();
}

bootstrap().catch(() => {
  surveyRows.innerHTML = `<tr><td colspan="6">Не удалось загрузить данные.</td></tr>`;
});
