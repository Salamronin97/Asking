const surveyList = document.getElementById("surveyList");
const logoutBtn = document.getElementById("logoutBtn");
const languageSelect = document.getElementById("languageSelect");
const accountPasswordForm = document.getElementById("accountPasswordForm");
const accountEmail = document.getElementById("accountEmail");
const accountStatus = document.getElementById("accountStatus");
const logoutAllBtn = document.getElementById("logoutAllBtn");
const deletePassword = document.getElementById("deletePassword");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

const LANG_KEY = "asking-pro-lang";
let lang = ["en", "ru", "kz"].includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : "ru";
let currentUser = null;

const i18n = {
  en: {
    newSurvey: "New Survey",
    logout: "Logout",
    mySurveys: "My surveys",
    mySurveysLead: "Draft, publish, share and monitor response tables.",
    accountSettings: "Account settings",
    accountEmail: "Account email",
    currentPassword: "Current password",
    newPassword: "New password",
    changePassword: "Change password",
    logoutAll: "Logout all devices",
    dangerZone: "Danger zone",
    dangerLead: "Delete account permanently.",
    confirmPassword: "Confirm password",
    deleteAccount: "Delete account",
    noSurveys: "No surveys yet. Create your first one.",
    failedLoad: "Failed to load cabinet",
    responses: "Responses",
    starts: "Starts",
    ends: "Ends",
    openLink: "Open link",
    copyLink: "Copy link",
    copied: "Copied",
    resultsTable: "Results table",
    exportCsv: "Export CSV",
    exportXlsx: "Export XLSX",
    publish: "Publish",
    archive: "Archive",
    del: "Delete",
    deleteSurveyConfirm: "Delete survey?",
    noResponses: "No responses yet.",
    passwordUpdated: "Password updated.",
    deleteAccountConfirm: "Delete account permanently?"
  },
  ru: {
    newSurvey: "Новая анкета",
    logout: "Выйти",
    mySurveys: "Мои анкеты",
    mySurveysLead: "Черновики, публикация, ссылки и таблицы ответов.",
    accountSettings: "Настройки аккаунта",
    accountEmail: "Email аккаунта",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    changePassword: "Сменить пароль",
    logoutAll: "Выйти на всех устройствах",
    dangerZone: "Опасная зона",
    dangerLead: "Удаление аккаунта без возможности восстановления.",
    confirmPassword: "Подтвердите пароль",
    deleteAccount: "Удалить аккаунт",
    noSurveys: "Анкет пока нет. Создайте первую.",
    failedLoad: "Не удалось загрузить кабинет",
    responses: "Ответы",
    starts: "Начало",
    ends: "Окончание",
    openLink: "Открыть ссылку",
    copyLink: "Копировать ссылку",
    copied: "Скопировано",
    resultsTable: "Таблица ответов",
    exportCsv: "Экспорт CSV",
    exportXlsx: "Экспорт XLSX",
    publish: "Опубликовать",
    archive: "Архив",
    del: "Удалить",
    deleteSurveyConfirm: "Удалить анкету?",
    noResponses: "Ответов пока нет.",
    passwordUpdated: "Пароль обновлен.",
    deleteAccountConfirm: "Удалить аккаунт без возможности восстановления?"
  },
  kz: {
    newSurvey: "Жаңа сауалнама",
    logout: "Шығу",
    mySurveys: "Менің сауалнамаларым",
    mySurveysLead: "Жоба, жариялау, сілтеме және жауап кестелері.",
    accountSettings: "Аккаунт баптаулары",
    accountEmail: "Аккаунт email-ы",
    currentPassword: "Ағымдағы құпиясөз",
    newPassword: "Жаңа құпиясөз",
    changePassword: "Құпиясөзді ауыстыру",
    logoutAll: "Барлық құрылғыдан шығу",
    dangerZone: "Қауіпті аймақ",
    dangerLead: "Аккаунтты біржола жою.",
    confirmPassword: "Құпиясөзді растау",
    deleteAccount: "Аккаунтты жою",
    noSurveys: "Сауалнама әлі жоқ. Алғашқысын жасаңыз.",
    failedLoad: "Кабинет жүктелмеді",
    responses: "Жауаптар",
    starts: "Басталуы",
    ends: "Аяқталуы",
    openLink: "Сілтемені ашу",
    copyLink: "Сілтемені көшіру",
    copied: "Көшірілді",
    resultsTable: "Жауап кестесі",
    exportCsv: "CSV жүктеу",
    exportXlsx: "XLSX жүктеу",
    publish: "Жариялау",
    archive: "Мұрағат",
    del: "Жою",
    deleteSurveyConfirm: "Сауалнаманы жою керек пе?",
    noResponses: "Әзірге жауап жоқ.",
    passwordUpdated: "Құпиясөз жаңартылды.",
    deleteAccountConfirm: "Аккаунтты біржола жоясыз ба?"
  }
};

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }
};

function t(key) {
  return i18n[lang]?.[key] || i18n.en[key] || key;
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
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
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

async function copyLink(id) {
  await navigator.clipboard.writeText(`${window.location.origin}/survey/${id}`);
}

function buildTable(columns, rows) {
  if (!rows.length) return `<p>${t("noResponses")}</p>`;
  const head = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<div style="overflow:auto"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderCard(survey) {
  const node = document.createElement("article");
  node.className = "survey-card";
  node.innerHTML = `
    <div class="survey-card__top">
      <div>
        <h3>${escapeHtml(survey.title)}</h3>
        <p>${escapeHtml(survey.description || "No description")}</p>
      </div>
      <span class="${survey.status === "published" ? "badge badge--published" : survey.status === "archived" ? "badge badge--archived" : "badge badge--draft"}">
        ${escapeHtml(survey.status)}
      </span>
    </div>
    <div class="meta">
      <span>${t("responses")}: ${Number(survey.responses_count || 0)}</span>
      <span>${t("starts")}: ${escapeHtml(formatDate(survey.starts_at))}</span>
      <span>${t("ends")}: ${escapeHtml(formatDate(survey.ends_at))}</span>
    </div>
    <div class="survey-card__actions"></div>
    <div class="card" style="margin-top:10px; display:none;" data-table></div>
  `;

  const actions = node.querySelector(".survey-card__actions");
  const tableWrap = node.querySelector("[data-table]");

  const openBtn = document.createElement("a");
  openBtn.className = "btn btn--ghost";
  openBtn.href = `/survey/${survey.id}`;
  openBtn.target = "_blank";
  openBtn.textContent = t("openLink");
  actions.appendChild(openBtn);

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn btn--ghost";
  copyBtn.textContent = t("copyLink");
  copyBtn.addEventListener("click", async () => {
    await copyLink(survey.id);
    copyBtn.textContent = t("copied");
    setTimeout(() => (copyBtn.textContent = t("copyLink")), 1000);
  });
  actions.appendChild(copyBtn);

  const tableBtn = document.createElement("button");
  tableBtn.className = "btn btn--outline";
  tableBtn.textContent = t("resultsTable");
  tableBtn.addEventListener("click", async () => {
    if (tableWrap.style.display === "block") {
      tableWrap.style.display = "none";
      return;
    }
    const data = await api.request(`/api/surveys/${survey.id}/responses-table`);
    tableWrap.innerHTML = buildTable(data.columns || [], data.rows || []);
    tableWrap.style.display = "block";
  });
  actions.appendChild(tableBtn);

  const exportBtn = document.createElement("a");
  exportBtn.className = "btn btn--ghost";
  exportBtn.href = `/api/surveys/${survey.id}/export.csv`;
  exportBtn.textContent = t("exportCsv");
  actions.appendChild(exportBtn);

  const exportXlsxBtn = document.createElement("a");
  exportXlsxBtn.className = "btn btn--ghost";
  exportXlsxBtn.href = `/api/surveys/${survey.id}/export.xlsx`;
  exportXlsxBtn.textContent = t("exportXlsx");
  actions.appendChild(exportXlsxBtn);

  if (survey.status === "draft") {
    const publishBtn = document.createElement("button");
    publishBtn.className = "btn";
    publishBtn.textContent = t("publish");
    publishBtn.addEventListener("click", async () => {
      await api.request(`/api/surveys/${survey.id}/publish`, { method: "POST" });
      await loadSurveys();
    });
    actions.appendChild(publishBtn);
  }

  if (survey.status === "published") {
    const archiveBtn = document.createElement("button");
    archiveBtn.className = "btn btn--outline";
    archiveBtn.textContent = t("archive");
    archiveBtn.addEventListener("click", async () => {
      await api.request(`/api/surveys/${survey.id}/archive`, { method: "POST" });
      await loadSurveys();
    });
    actions.appendChild(archiveBtn);
  }

  const delBtn = document.createElement("button");
  delBtn.className = "btn btn--danger";
  delBtn.textContent = t("del");
  delBtn.addEventListener("click", async () => {
    if (!window.confirm(t("deleteSurveyConfirm"))) return;
    await api.request(`/api/surveys/${survey.id}`, { method: "DELETE" });
    await loadSurveys();
  });
  actions.appendChild(delBtn);

  return node;
}

async function loadSurveys() {
  const data = await api.request("/api/surveys?mine=1");
  surveyList.innerHTML = "";
  const surveys = data.surveys || [];
  if (!surveys.length) {
    surveyList.innerHTML = `<div class='card'>${t("noSurveys")}</div>`;
    return;
  }
  surveys.forEach((survey) => surveyList.appendChild(renderCard(survey)));
}

function wireAccountActions() {
  accountEmail.value = currentUser.email || "";
  accountPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(accountPasswordForm);
    try {
      await api.request("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(formData.get("currentPassword") || ""),
          newPassword: String(formData.get("newPassword") || ""),
          website: ""
        })
      });
      accountStatus.textContent = t("passwordUpdated");
      accountPasswordForm.reset();
      accountEmail.value = currentUser.email || "";
    } catch (error) {
      accountStatus.textContent = error.message;
    }
  });

  logoutAllBtn.addEventListener("click", async () => {
    await api.request("/api/account/logout-all", { method: "POST" });
    window.location.href = "/auth";
  });

  deleteAccountBtn.addEventListener("click", async () => {
    const password = String(deletePassword.value || "");
    if (!password) return;
    if (!window.confirm(t("deleteAccountConfirm"))) return;
    await api.request("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, website: "" })
    });
    window.location.href = "/auth";
  });
}

async function bootstrap() {
  languageSelect.value = lang;
  applyI18n();
  languageSelect.addEventListener("change", async () => {
    lang = languageSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    applyI18n();
    await loadSurveys();
  });

  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }
  currentUser = me.user;

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });

  wireAccountActions();
  await loadSurveys();
}

bootstrap().catch(() => {
  surveyList.innerHTML = `<div class='card'>${t("failedLoad")}</div>`;
});
