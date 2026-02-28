const surveyList = document.getElementById("surveyList");
const logoutBtn = document.getElementById("logoutBtn");
const languageSelect = document.getElementById("languageSelect");
const profileForm = document.getElementById("profileForm");
const profileName = document.getElementById("profileName");
const profileCompany = document.getElementById("profileCompany");
const profilePosition = document.getElementById("profilePosition");
const profileLocale = document.getElementById("profileLocale");
const profileMeta = document.getElementById("profileMeta");
const profileStatus = document.getElementById("profileStatus");
const accountPasswordForm = document.getElementById("accountPasswordForm");
const accountEmail = document.getElementById("accountEmail");
const accountStatus = document.getElementById("accountStatus");
const sessionsList = document.getElementById("sessionsList");
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
    profileSettings: "Profile settings",
    profileLead: "Manage your account identity and workspace language.",
    fullName: "Full name",
    accountEmail: "Account email",
    company: "Company",
    position: "Position",
    profileLanguage: "Profile language",
    saveProfile: "Save profile",
    profileSaved: "Profile updated.",
    profileMeta: "Created: {createdAt}. Last update: {updatedAt}.",
    securityTitle: "Security",
    securityLead: "Update password and control active sessions.",
    currentPassword: "Current password",
    newPassword: "New password",
    changePassword: "Change password",
    passwordUpdated: "Password updated.",
    logoutAll: "Logout all devices",
    sessionsTitle: "Active sessions",
    sessionsLead: "Revoke old sessions if you do not recognize a login.",
    currentSession: "Current session",
    revoke: "Revoke",
    noSessions: "No active sessions.",
    started: "Started",
    expires: "Expires",
    dangerZone: "Danger zone",
    dangerLead: "Delete account permanently.",
    confirmPassword: "Confirm password",
    deleteAccount: "Delete account",
    deleteAccountConfirm: "Delete account permanently?",
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
    statusDraft: "Draft",
    statusPublished: "Published",
    statusArchived: "Archived",
    noDescription: "No description",
    unnamed: "Unnamed"
  },
  ru: {
    newSurvey: "Новая анкета",
    logout: "Выйти",
    mySurveys: "Мои анкеты",
    mySurveysLead: "Черновики, публикация, шаринг и контроль ответов.",
    profileSettings: "Профиль",
    profileLead: "Управляйте данными аккаунта и языком кабинета.",
    fullName: "Полное имя",
    accountEmail: "Email аккаунта",
    company: "Организация",
    position: "Должность",
    profileLanguage: "Язык интерфейса",
    saveProfile: "Сохранить профиль",
    profileSaved: "Профиль обновлен.",
    profileMeta: "Создан: {createdAt}. Обновлен: {updatedAt}.",
    securityTitle: "Безопасность",
    securityLead: "Смена пароля и контроль активных сессий.",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    changePassword: "Сменить пароль",
    passwordUpdated: "Пароль обновлен.",
    logoutAll: "Выйти на всех устройствах",
    sessionsTitle: "Активные сессии",
    sessionsLead: "Завершайте сессии, которые вы не узнаете.",
    currentSession: "Текущая сессия",
    revoke: "Завершить",
    noSessions: "Активных сессий нет.",
    started: "Начало",
    expires: "Истекает",
    dangerZone: "Опасная зона",
    dangerLead: "Удаление аккаунта без возможности восстановления.",
    confirmPassword: "Подтвердите пароль",
    deleteAccount: "Удалить аккаунт",
    deleteAccountConfirm: "Удалить аккаунт без возможности восстановления?",
    noSurveys: "Анкет пока нет. Создайте первую.",
    failedLoad: "Не удалось загрузить кабинет",
    responses: "Ответов",
    starts: "Начало",
    ends: "Окончание",
    openLink: "Открыть ссылку",
    copyLink: "Копировать ссылку",
    copied: "Скопировано",
    resultsTable: "Таблица ответов",
    exportCsv: "Экспорт CSV",
    exportXlsx: "Экспорт XLSX",
    publish: "Опубликовать",
    archive: "В архив",
    del: "Удалить",
    deleteSurveyConfirm: "Удалить анкету?",
    noResponses: "Ответов пока нет.",
    statusDraft: "Черновик",
    statusPublished: "Опубликована",
    statusArchived: "Архив",
    noDescription: "Без описания",
    unnamed: "Без названия"
  },
  kz: {
    newSurvey: "Жаңа сауалнама",
    logout: "Шығу",
    mySurveys: "Менің сауалнамаларым",
    mySurveysLead: "Жоба, жариялау, сілтеме жіберу және жауаптарды бақылау.",
    profileSettings: "Профиль",
    profileLead: "Аккаунт деректері мен кабинет тілін басқарыңыз.",
    fullName: "Толық аты",
    accountEmail: "Аккаунт email-ы",
    company: "Ұйым",
    position: "Лауазым",
    profileLanguage: "Интерфейс тілі",
    saveProfile: "Профильді сақтау",
    profileSaved: "Профиль жаңартылды.",
    profileMeta: "Құрылған: {createdAt}. Жаңартылған: {updatedAt}.",
    securityTitle: "Қауіпсіздік",
    securityLead: "Құпиясөзді жаңарту және сессияларды басқару.",
    currentPassword: "Ағымдағы құпиясөз",
    newPassword: "Жаңа құпиясөз",
    changePassword: "Құпиясөзді өзгерту",
    passwordUpdated: "Құпиясөз жаңартылды.",
    logoutAll: "Барлық құрылғылардан шығу",
    sessionsTitle: "Белсенді сессиялар",
    sessionsLead: "Танымайтын сессияларды тоқтатыңыз.",
    currentSession: "Ағымдағы сессия",
    revoke: "Тоқтату",
    noSessions: "Белсенді сессия жоқ.",
    started: "Басталуы",
    expires: "Аяқталуы",
    dangerZone: "Қауіпті аймақ",
    dangerLead: "Аккаунт біржола жойылады.",
    confirmPassword: "Құпиясөзді растаңыз",
    deleteAccount: "Аккаунтты жою",
    deleteAccountConfirm: "Аккаунтты біржола жою керек пе?",
    noSurveys: "Сауалнама әлі жоқ. Біріншісін жасаңыз.",
    failedLoad: "Кабинетті жүктеу сәтсіз",
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
    archive: "Мұрағаттау",
    del: "Жою",
    deleteSurveyConfirm: "Сауалнаманы жою керек пе?",
    noResponses: "Жауаптар жоқ.",
    statusDraft: "Жоба",
    statusPublished: "Жарияланған",
    statusArchived: "Мұрағат",
    noDescription: "Сипаттама жоқ",
    unnamed: "Атаусыз"
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

function formatText(template, values = {}) {
  return Object.keys(values).reduce((acc, key) => acc.replaceAll(`{${key}}`, values[key] ?? ""), template);
}

function userLocale() {
  if (lang === "ru") return "ru-RU";
  if (lang === "kz") return "kk-KZ";
  return "en-US";
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
  return new Intl.DateTimeFormat(userLocale(), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function localizeSurveyStatus(status) {
  if (status === "published") return t("statusPublished");
  if (status === "archived") return t("statusArchived");
  return t("statusDraft");
}

async function copyLink(id) {
  const link = `${window.location.origin}/survey/${id}`;
  await navigator.clipboard.writeText(link);
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
        <h3>${escapeHtml(survey.title || t("unnamed"))}</h3>
        <p>${escapeHtml(survey.description || t("noDescription"))}</p>
      </div>
      <span class="${survey.status === "published" ? "badge badge--published" : survey.status === "archived" ? "badge badge--archived" : "badge badge--draft"}">
        ${escapeHtml(localizeSurveyStatus(survey.status))}
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
    window.setTimeout(() => {
      copyBtn.textContent = t("copyLink");
    }, 1200);
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

function renderProfileMeta(profile) {
  profileMeta.textContent = formatText(t("profileMeta"), {
    createdAt: formatDate(profile.createdAt),
    updatedAt: formatDate(profile.updatedAt || profile.createdAt)
  });
}

function renderSessions(items) {
  sessionsList.innerHTML = "";
  if (!items.length) {
    sessionsList.innerHTML = `<div class="session-item"><span>${escapeHtml(t("noSessions"))}</span></div>`;
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "session-item";
    row.innerHTML = `
      <div>
        <div class="session-item__title">${item.isCurrent ? escapeHtml(t("currentSession")) : `#${item.id}`}</div>
        <div class="session-item__meta">${escapeHtml(t("started"))}: ${escapeHtml(formatDate(item.createdAt))}</div>
        <div class="session-item__meta">${escapeHtml(t("expires"))}: ${escapeHtml(formatDate(item.expiresAt))}</div>
      </div>
      <div>
        <button class="btn btn--outline" type="button" data-revoke="${item.id}">${escapeHtml(t("revoke"))}</button>
      </div>
    `;
    sessionsList.appendChild(row);
  });

  sessionsList.querySelectorAll("[data-revoke]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sessionId = Number.parseInt(btn.getAttribute("data-revoke"), 10);
      if (!sessionId) return;
      btn.disabled = true;
      try {
        await api.request(`/api/account/sessions/${sessionId}`, { method: "DELETE" });
        const data = await api.request("/api/account/sessions");
        const stillCurrent = (data.sessions || []).some((item) => item.isCurrent);
        renderSessions(data.sessions || []);
        if (!stillCurrent) {
          window.location.href = "/auth";
        }
      } catch (error) {
        btn.disabled = false;
        accountStatus.textContent = error.message;
      }
    });
  });
}

async function loadSurveys() {
  const data = await api.request("/api/surveys?mine=1");
  surveyList.innerHTML = "";
  const surveys = data.surveys || [];
  if (!surveys.length) {
    surveyList.innerHTML = `<div class="card">${escapeHtml(t("noSurveys"))}</div>`;
    return;
  }
  surveys.forEach((survey) => surveyList.appendChild(renderCard(survey)));
}

async function loadProfileAndSessions() {
  const [profileData, sessionsData] = await Promise.all([
    api.request("/api/account/profile"),
    api.request("/api/account/sessions")
  ]);
  const profile = profileData.profile;
  if (!profile) throw new Error("Profile not found");

  currentUser = { ...(currentUser || {}), ...profile };
  accountEmail.value = profile.email || "";
  profileName.value = profile.name || "";
  profileCompany.value = profile.company || "";
  profilePosition.value = profile.position || "";
  profileLocale.value = ["en", "ru", "kz"].includes(profile.locale) ? profile.locale : "ru";
  renderProfileMeta(profile);
  renderSessions(sessionsData.sessions || []);
}

function wireActions() {
  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    profileStatus.textContent = "";
    const payload = {
      name: String(profileName.value || "").trim(),
      company: String(profileCompany.value || "").trim(),
      position: String(profilePosition.value || "").trim(),
      locale: String(profileLocale.value || "ru"),
      website: ""
    };
    try {
      const data = await api.request("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      renderProfileMeta(data.profile);
      profileStatus.textContent = t("profileSaved");

      if (payload.locale !== lang) {
        lang = payload.locale;
        localStorage.setItem(LANG_KEY, lang);
        languageSelect.value = lang;
        applyI18n();
        await Promise.all([loadSurveys(), loadProfileAndSessions()]);
      }
    } catch (error) {
      profileStatus.textContent = error.message;
    }
  });

  accountPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    accountStatus.textContent = "";
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

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });

  languageSelect.addEventListener("change", async () => {
    lang = languageSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    applyI18n();
    await Promise.all([loadSurveys(), loadProfileAndSessions()]);
  });
}

async function bootstrap() {
  languageSelect.value = lang;
  applyI18n();

  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }
  currentUser = me.user;

  if (["en", "ru", "kz"].includes(currentUser.locale) && currentUser.locale !== lang) {
    lang = currentUser.locale;
    localStorage.setItem(LANG_KEY, lang);
    languageSelect.value = lang;
    applyI18n();
  }

  wireActions();
  await Promise.all([loadSurveys(), loadProfileAndSessions()]);
}

bootstrap().catch(() => {
  surveyList.innerHTML = `<div class="card">${escapeHtml(t("failedLoad"))}</div>`;
});
