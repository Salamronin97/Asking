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
const accountEmail = document.getElementById("accountEmail");
const sessionsList = document.getElementById("sessionsList");
const logoutAllBtn = document.getElementById("logoutAllBtn");
const analysisModal = document.getElementById("analysisModal");
const analysisCloseBtn = document.getElementById("analysisCloseBtn");
const analysisTitle = document.getElementById("analysisTitle");
const analysisBody = document.getElementById("analysisBody");

const LANG_KEY = "asking-pro-lang";
let lang = ["en", "ru", "kz"].includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : "ru";

const i18n = {
  en: {
    newSurvey: "New Survey",
    guide: "Guide",
    author: "Author",
    logout: "Logout",
    mySurveys: "My surveys",
    mySurveysLead: "Create, publish, share, and analyze in one place.",
    profileTitle: "Profile",
    fullName: "Full name",
    accountEmail: "Email",
    company: "Company",
    position: "Position",
    profileLanguage: "Language",
    saveProfile: "Save profile",
    profileSaved: "Profile updated.",
    profileMeta: "Created: {createdAt}. Updated: {updatedAt}.",
    sessionsTitle: "Sessions",
    sessionsLead: "Close sessions you don't recognize.",
    logoutAll: "Logout all devices",
    openLink: "Open link",
    copyLink: "Copy link",
    copied: "Copied",
    analysisOneClick: "1-click analysis",
    exportCsv: "Export CSV",
    exportXlsx: "Export XLSX",
    archive: "Archive",
    del: "Delete",
    deleteSurveyConfirm: "Delete survey?",
    noSurveys: "No surveys yet.",
    statusPublished: "Published",
    statusArchived: "Archived",
    responses: "Responses",
    starts: "Starts",
    ends: "Ends",
    noDescription: "No description",
    unnamed: "Untitled",
    currentSession: "Current session",
    revoke: "Revoke",
    started: "Started",
    expires: "Expires",
    failedLoad: "Failed to load cabinet",
    analysisSummary: "Summary",
    analysisTrend: "Trend",
    analysisResults: "Question analytics",
    totalResponses: "Total responses",
    active: "Active",
    yes: "yes",
    no: "no",
    noData: "No data yet"
  },
  ru: {
    newSurvey: "Новая анкета",
    guide: "Гайд",
    author: "Автор",
    logout: "Выйти",
    mySurveys: "Мои анкеты",
    mySurveysLead: "Создание, публикация, рассылка и анализ в одном месте.",
    profileTitle: "Профиль",
    fullName: "Полное имя",
    accountEmail: "Email",
    company: "Организация",
    position: "Должность",
    profileLanguage: "Язык",
    saveProfile: "Сохранить профиль",
    profileSaved: "Профиль обновлен.",
    profileMeta: "Создан: {createdAt}. Обновлен: {updatedAt}.",
    sessionsTitle: "Сессии",
    sessionsLead: "Завершайте сессии, которые вам не знакомы.",
    logoutAll: "Выйти на всех устройствах",
    openLink: "Открыть ссылку",
    copyLink: "Копировать ссылку",
    publishToShare: "Опубликуйте анкету, чтобы открыть и отправить публичную ссылку.",
    copied: "Скопировано",
    analysisOneClick: "Анализ в 1 клик",
    exportCsv: "Экспорт CSV",
    exportXlsx: "Экспорт XLSX",
    publish: "Опубликовать",
    archive: "В архив",
    del: "Удалить",
    deleteSurveyConfirm: "Удалить анкету?",
    noSurveys: "Анкет пока нет.",
    statusDraft: "Черновик",
    statusPublished: "Опубликована",
    statusArchived: "Архив",
    responses: "Ответов",
    starts: "Начало",
    ends: "Окончание",
    noDescription: "Без описания",
    unnamed: "Без названия",
    currentSession: "Текущая сессия",
    revoke: "Завершить",
    started: "Начало",
    expires: "Истекает",
    failedLoad: "Не удалось загрузить кабинет",
    analysisSummary: "Сводка",
    analysisTrend: "Тренд",
    analysisResults: "Аналитика по вопросам",
    totalResponses: "Всего ответов",
    active: "Активна",
    yes: "да",
    no: "нет",
    noData: "Данных пока нет"
  },
  kz: {
    newSurvey: "Жаңа сауалнама",
    guide: "Нұсқаулық",
    author: "Автор",
    logout: "Шығу",
    mySurveys: "Менің сауалнамаларым",
    mySurveysLead: "Құру, жариялау, тарату және анализ бір жерде.",
    profileTitle: "Профиль",
    fullName: "Толық аты",
    accountEmail: "Email",
    company: "Ұйым",
    position: "Лауазым",
    profileLanguage: "Тіл",
    saveProfile: "Профильді сақтау",
    profileSaved: "Профиль жаңартылды.",
    profileMeta: "Құрылған: {createdAt}. Жаңартылған: {updatedAt}.",
    sessionsTitle: "Сессиялар",
    sessionsLead: "Танымайтын сессияларды жабыңыз.",
    logoutAll: "Барлық құрылғылардан шығу",
    openLink: "Сілтемені ашу",
    copyLink: "Сілтемені көшіру",
    copied: "Көшірілді",
    analysisOneClick: "1 рет басып анализ",
    exportCsv: "CSV жүктеу",
    exportXlsx: "XLSX жүктеу",
    publish: "Жариялау",
    archive: "Мұрағат",
    del: "Жою",
    deleteSurveyConfirm: "Сауалнаманы жою керек пе?",
    noSurveys: "Сауалнама жоқ.",
    statusDraft: "Жоба",
    statusPublished: "Жарияланған",
    statusArchived: "Мұрағат",
    responses: "Жауаптар",
    starts: "Басталуы",
    ends: "Аяқталуы",
    noDescription: "Сипаттама жоқ",
    unnamed: "Атаусыз",
    currentSession: "Ағымдағы сессия",
    revoke: "Жабу",
    started: "Басталуы",
    expires: "Аяқталуы",
    failedLoad: "Кабинет жүктелмеді",
    analysisSummary: "Жалпы",
    analysisTrend: "Тренд",
    analysisResults: "Сұрақтар аналитикасы",
    totalResponses: "Барлық жауап",
    active: "Белсенді",
    yes: "иә",
    no: "жоқ",
    noData: "Әзірге дерек жоқ"
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

function formatText(template, values) {
  return Object.keys(values).reduce((acc, key) => acc.replaceAll(`{${key}}`, values[key]), template);
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(lang === "en" ? "en-US" : lang === "kz" ? "kk-KZ" : "ru-RU");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function localizeStatus(status) {
  return status === "archived" ? t("statusArchived") : t("statusPublished");
}

async function copyLink(id) {
  await navigator.clipboard.writeText(`${window.location.origin}/survey/${id}`);
}

function renderAnalysis(result) {
  const trendRows = (result.trend || [])
    .map((item) => `<tr><td>${escapeHtml(item.day)}</td><td>${escapeHtml(item.count)}</td></tr>`)
    .join("");

  const questionRows = (result.results || [])
    .map((item) => {
      if (item.type === "rating") {
        return `<div class="card" style="margin-top:8px"><strong>${escapeHtml(item.text)}</strong><p>Avg: ${escapeHtml(
          item.average ?? 0
        )} | Total: ${escapeHtml(item.total)}</p></div>`;
      }
      if (item.type === "single" || item.type === "multi") {
        const stats = Object.entries(item.counts || {})
          .map(([option, count]) => `${escapeHtml(option)}: ${escapeHtml(count)}`)
          .join("<br/>");
        return `<div class="card" style="margin-top:8px"><strong>${escapeHtml(item.text)}</strong><p>${stats || t("noData")}</p></div>`;
      }
      const samples = (item.samples || []).slice(0, 5).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
      return `<div class="card" style="margin-top:8px"><strong>${escapeHtml(item.text)}</strong><ul>${samples || `<li>${t(
        "noData"
      )}</li>`}</ul></div>`;
    })
    .join("");

  analysisBody.innerHTML = `
    <div class="card">
      <h4>${t("analysisSummary")}</h4>
      <p>${t("totalResponses")}: ${escapeHtml(result.summary?.totalResponses ?? 0)}</p>
      <p>${t("active")}: ${result.summary?.active ? t("yes") : t("no")}</p>
    </div>
    <div class="card" style="margin-top:10px">
      <h4>${t("analysisTrend")}</h4>
      <div style="overflow:auto">
        <table>
          <thead><tr><th>Day</th><th>Count</th></tr></thead>
          <tbody>${trendRows || `<tr><td colspan="2">${t("noData")}</td></tr>`}</tbody>
        </table>
      </div>
    </div>
    <div style="margin-top:10px">
      <h4>${t("analysisResults")}</h4>
      ${questionRows || `<p>${t("noData")}</p>`}
    </div>
  `;
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
      <span class="${survey.status === "archived" ? "badge badge--archived" : "badge badge--published"}">
        ${escapeHtml(localizeStatus(survey.status))}
      </span>
    </div>
    <div class="meta">
      <span>${t("responses")}: ${Number(survey.responses_count || 0)}</span>
      <span>${t("starts")}: ${escapeHtml(formatDate(survey.starts_at))}</span>
      <span>${t("ends")}: ${escapeHtml(formatDate(survey.ends_at))}</span>
    </div>
    <div class="survey-card__actions"></div>
  `;
  const actions = node.querySelector(".survey-card__actions");

  if (survey.status === "published") {
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
  }

  const analysisBtn = document.createElement("button");
  analysisBtn.className = "btn";
  analysisBtn.textContent = t("analysisOneClick");
  analysisBtn.addEventListener("click", async () => {
    const result = await api.request(`/api/surveys/${survey.id}/results`);
    analysisTitle.textContent = `${survey.title} - ${t("analysisOneClick")}`;
    renderAnalysis(result);
    analysisModal.hidden = false;
  });
  actions.appendChild(analysisBtn);

  const csvBtn = document.createElement("a");
  csvBtn.className = "btn btn--ghost";
  csvBtn.href = `/api/surveys/${survey.id}/export.csv`;
  csvBtn.textContent = t("exportCsv");
  actions.appendChild(csvBtn);

  const xlsxBtn = document.createElement("a");
  xlsxBtn.className = "btn btn--ghost";
  xlsxBtn.href = `/api/surveys/${survey.id}/export.xlsx`;
  xlsxBtn.textContent = t("exportXlsx");
  actions.appendChild(xlsxBtn);

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

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn--danger";
  deleteBtn.textContent = t("del");
  deleteBtn.addEventListener("click", async () => {
    if (!window.confirm(t("deleteSurveyConfirm"))) return;
    await api.request(`/api/surveys/${survey.id}`, { method: "DELETE" });
    await loadSurveys();
  });
  actions.appendChild(deleteBtn);

  return node;
}

async function loadSurveys() {
  const data = await api.request("/api/surveys?mine=1");
  surveyList.innerHTML = "";
  const surveys = data.surveys || [];
  if (!surveys.length) {
    surveyList.innerHTML = `<div class="card">${t("noSurveys")}</div>`;
    return;
  }
  surveys.forEach((survey) => surveyList.appendChild(renderCard(survey)));
}

function renderSessions(sessions) {
  sessionsList.innerHTML = "";
  sessions.forEach((item) => {
    const row = document.createElement("div");
    row.className = "session-item";
    row.innerHTML = `
      <div>
        <div class="session-item__title">${item.isCurrent ? t("currentSession") : "#" + item.id}</div>
        <div class="session-item__meta">${t("started")}: ${escapeHtml(formatDate(item.createdAt))}</div>
        <div class="session-item__meta">${t("expires")}: ${escapeHtml(formatDate(item.expiresAt))}</div>
      </div>
      <button class="btn btn--outline" data-revoke="${item.id}" type="button">${t("revoke")}</button>
    `;
    sessionsList.appendChild(row);
  });

  sessionsList.querySelectorAll("[data-revoke]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number.parseInt(btn.getAttribute("data-revoke"), 10);
      await api.request(`/api/account/sessions/${id}`, { method: "DELETE" });
      const fresh = await api.request("/api/account/sessions");
      renderSessions(fresh.sessions || []);
    });
  });
}

async function loadProfile() {
  const profileData = await api.request("/api/account/profile");
  const sessionsData = await api.request("/api/account/sessions");
  const profile = profileData.profile;
  profileName.value = profile.name || "";
  profileCompany.value = profile.company || "";
  profilePosition.value = profile.position || "";
  accountEmail.value = profile.email || "";
  profileLocale.value = ["en", "ru", "kz"].includes(profile.locale) ? profile.locale : "ru";
  profileMeta.textContent = formatText(t("profileMeta"), {
    createdAt: formatDate(profile.createdAt),
    updatedAt: formatDate(profile.updatedAt || profile.createdAt)
  });
  renderSessions(sessionsData.sessions || []);
}

function wireActions() {
  languageSelect.addEventListener("change", async () => {
    lang = languageSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    applyI18n();
    await Promise.all([loadSurveys(), loadProfile()]);
  });

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });

  logoutAllBtn.addEventListener("click", async () => {
    await api.request("/api/account/logout-all", { method: "POST" });
    window.location.href = "/auth";
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: profileName.value.trim(),
      company: profileCompany.value.trim(),
      position: profilePosition.value.trim(),
      locale: profileLocale.value,
      website: ""
    };
    const data = await api.request("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    profileStatus.textContent = t("profileSaved");
    profileMeta.textContent = formatText(t("profileMeta"), {
      createdAt: formatDate(data.profile.createdAt),
      updatedAt: formatDate(data.profile.updatedAt || data.profile.createdAt)
    });
    if (payload.locale !== lang) {
      lang = payload.locale;
      localStorage.setItem(LANG_KEY, lang);
      languageSelect.value = lang;
      applyI18n();
      await loadSurveys();
    }
  });

  analysisCloseBtn.addEventListener("click", () => {
    analysisModal.hidden = true;
  });
}

async function bootstrap() {
  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }
  if (["en", "ru", "kz"].includes(me.user.locale) && !localStorage.getItem(LANG_KEY)) {
    lang = me.user.locale;
  }
  languageSelect.value = lang;
  applyI18n();
  wireActions();
  await Promise.all([loadSurveys(), loadProfile()]);
}

bootstrap().catch(() => {
  surveyList.innerHTML = `<div class="card">${t("failedLoad")}</div>`;
});
