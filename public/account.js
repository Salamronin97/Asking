const logoutBtn = document.getElementById("logoutBtn");
const accountStatus = document.getElementById("accountStatus");
const tabs = Array.from(document.querySelectorAll(".account-tab"));
const panes = Array.from(document.querySelectorAll(".account-pane"));
const toast = document.getElementById("toast");

const displayNameInput = document.getElementById("displayNameInput");
const emailInput = document.getElementById("emailInput");
const localeSelect = document.getElementById("localeSelect");
const themeSelect = document.getElementById("themeSelect");
const dateFormatSelect = document.getElementById("dateFormatSelect");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const savePrefsBtn = document.getElementById("savePrefsBtn");

const currentPasswordInput = document.getElementById("currentPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const repeatPasswordInput = document.getElementById("repeatPasswordInput");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const logoutAllBtn = document.getElementById("logoutAllBtn");
const passwordForm = document.getElementById("passwordForm");
const passwordUnavailable = document.getElementById("passwordUnavailable");
const refreshSessionsBtn = document.getElementById("refreshSessionsBtn");
const sessionsList = document.getElementById("sessionsList");
const deleteAccountPasswordInput = document.getElementById("deleteAccountPasswordInput");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmText = document.getElementById("confirmText");
const confirmCancel = document.getElementById("confirmCancel");
const confirmSubmit = document.getElementById("confirmSubmit");

const state = { profile: null, confirmAction: null, sessions: [] };

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Ошибка запроса");
    return data;
  }
};

function applyStaticAccountTextFixes() {
  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  const setAttr = (selector, attr, value) => {
    const node = document.querySelector(selector);
    if (node) node.setAttribute(attr, value);
  };

  document.title = "Аккаунт | Asking";

  setText(".topbar__actions a[href='/guide']", "Инструкция");
  setText(".topbar__actions a[href='/create']", "Создать");
  setText(".topbar__actions a[href='/cabinet']", "Кабинет");
  setText(".topbar__actions a[href='/account']", "Аккаунт");
  setText("#logoutBtn", "Выйти");

  setText(".svacc-side h1", "Аккаунт");
  setText(".svacc-side p", "Настройки профиля и безопасности");
  setAttr(".svacc-nav", "aria-label", "Разделы аккаунта");
  setText(".account-tab[data-tab='profile']", "Профиль");
  setText(".account-tab[data-tab='security']", "Безопасность");
  setText(".account-tab[data-tab='prefs']", "Предпочтения");

  setText("[data-pane='profile'] .svacc-pane__head h2", "Профиль");
  setText("[data-pane='profile'] .svacc-pane__head p", "Базовая информация вашей учетной записи.");
  setText("#saveProfileBtn", "Сохранить профиль");

  const displayNameLabel = displayNameInput?.closest(".form-row")?.querySelector("span");
  if (displayNameLabel) displayNameLabel.textContent = "Имя";
  const emailLabel = emailInput?.closest(".form-row")?.querySelector("span");
  if (emailLabel) emailLabel.textContent = "Email";

  setText("[data-pane='security'] .svacc-pane__head h2", "Безопасность");
  setText("[data-pane='security'] .svacc-pane__head p", "Смена пароля и завершение других сессий.");
  setText("#passwordUnavailable p", "Смена пароля недоступна в текущем режиме авторизации.");
  setText("#changePasswordBtn", "Сменить пароль");
  setText("#logoutAllBtn", "Выйти со всех устройств");
  setText("#refreshSessionsBtn", "Обновить");
  setText(".svacc-section__head h3", "Активные сессии");
  setText(".svacc-danger__head h3", "Опасная зона");
  setText(".svacc-danger__head p", "Удаление аккаунта необратимо.");
  setText("#deleteAccountBtn", "Удалить аккаунт");

  const currentPwdLabel = currentPasswordInput?.closest(".form-row")?.querySelector("span");
  if (currentPwdLabel) currentPwdLabel.textContent = "Текущий пароль";
  const newPwdLabel = newPasswordInput?.closest(".form-row")?.querySelector("span");
  if (newPwdLabel) newPwdLabel.textContent = "Новый пароль";
  const repeatPwdLabel = repeatPasswordInput?.closest(".form-row")?.querySelector("span");
  if (repeatPwdLabel) repeatPwdLabel.textContent = "Повторите новый пароль";
  const deletePwdLabel = deleteAccountPasswordInput?.closest(".form-row")?.querySelector("span");
  if (deletePwdLabel) deletePwdLabel.textContent = "Введите пароль для удаления аккаунта";

  setText("[data-pane='prefs'] .svacc-pane__head h2", "Предпочтения");
  setText("[data-pane='prefs'] .svacc-pane__head p", "Язык интерфейса, тема и формат даты.");
  setText("#savePrefsBtn", "Сохранить предпочтения");

  const localeLabel = localeSelect?.closest(".form-row")?.querySelector("span");
  if (localeLabel) localeLabel.textContent = "Язык";
  const themeLabel = themeSelect?.closest(".form-row")?.querySelector("span");
  if (themeLabel) themeLabel.textContent = "Тема";
  const dateFormatLabel = dateFormatSelect?.closest(".form-row")?.querySelector("span");
  if (dateFormatLabel) dateFormatLabel.textContent = "Формат даты";
  const themeOptions = { light: "Светлая", dark: "Тёмная", system: "Системная" };
  Array.from(themeSelect?.options || []).forEach((opt) => {
    if (themeOptions[opt.value]) opt.textContent = themeOptions[opt.value];
  });

  setText("#confirmTitle", "Подтвердите действие");
  setText("#confirmCancel", "Отмена");
  setText("#confirmSubmit", "Подтвердить");
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
    setTimeout(() => (toast.hidden = true), 180);
  }, 2200);
}

function setStatus(message, isError = false) {
  accountStatus.textContent = message || "";
  accountStatus.style.color = isError ? "#b91c1c" : "#334155";
}

function switchTab(tab) {
  tabs.forEach((item) => item.classList.toggle("is-active", item.dataset.tab === tab));
  panes.forEach((item) => item.classList.toggle("is-active", item.dataset.pane === tab));
}

function applyTheme(theme) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

function fillProfile(profile) {
  displayNameInput.value = profile.displayName || profile.name || "";
  emailInput.value = profile.email || "";
  localeSelect.value = profile.locale || "ru";
  themeSelect.value = profile.theme || "light";
  dateFormatSelect.value = profile.dateFormat || "dd.mm.yyyy";

  const passwordEnabled = Boolean(profile.hasPassword !== false);
  passwordForm.hidden = !passwordEnabled;
  passwordUnavailable.hidden = passwordEnabled;

  applyTheme(themeSelect.value);
}

async function loadAccount() {
  const profile = await api.request("/api/account");
  state.profile = profile;
  fillProfile(profile);
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

function shortUserAgent(value) {
  const source = String(value || "").trim();
  if (!source) return "Неизвестное устройство";
  const cleaned = source.replace(/\s+/g, " ");
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

async function loadSessions() {
  const payload = await api.request("/api/account/sessions");
  state.sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  renderSessions();
}

function renderSessions() {
  if (!sessionsList) return;
  if (!state.sessions.length) {
    sessionsList.innerHTML = "<div class='svacc-empty-row'>Сессии не найдены.</div>";
    return;
  }

  sessionsList.innerHTML = state.sessions
    .map((session) => {
      const badge = session.isCurrent
        ? "<span class='svacc-session__badge is-current'>Текущая</span>"
        : "<span class='svacc-session__badge'>Активна</span>";
      return `
        <article class="svacc-session" data-session-id="${Number(session.id)}">
          <div class="svacc-session__top">
            <strong>${escapeHtml(shortUserAgent(session.userAgent))}</strong>
            ${badge}
          </div>
          <div class="svacc-session__meta">
            <span>IP: ${escapeHtml(session.ip || "—")}</span>
            <span>Вход: ${escapeHtml(formatDate(session.createdAt))}</span>
            <span>Истекает: ${escapeHtml(formatDate(session.expiresAt))}</span>
          </div>
          ${
            session.isCurrent
              ? ""
              : `<div class="svacc-session__actions"><button class="btn btn--ghost btn--xs" type="button" data-kill-session="${Number(session.id)}">Завершить</button></div>`
          }
        </article>
      `;
    })
    .join("");
}

function openConfirm(title, text, action) {
  state.confirmAction = action;
  confirmTitle.textContent = title;
  confirmText.textContent = text;
  confirmModal.hidden = false;
}

function closeConfirm() {
  state.confirmAction = null;
  confirmModal.hidden = true;
}

function accountPayload() {
  return {
    displayName: displayNameInput.value.trim(),
    locale: localeSelect.value,
    theme: themeSelect.value,
    dateFormat: dateFormatSelect.value
  };
}

async function saveProfile() {
  const payload = accountPayload();
  if (!payload.displayName || payload.displayName.length < 2) {
    setStatus("Имя не может быть пустым.", true);
    return;
  }

  setStatus("Сохранение...");
  const profile = await api.request("/api/account", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  state.profile = profile;
  fillProfile(profile);
  setStatus("Сохранено");
  showToast("Профиль сохранён");
}

async function changePassword() {
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  const repeatPassword = repeatPasswordInput.value;

  if (!currentPassword || !newPassword || !repeatPassword) {
    setStatus("Заполните все поля пароля.", true);
    return;
  }
  if (newPassword !== repeatPassword) {
    setStatus("Новый пароль и повтор не совпадают.", true);
    return;
  }

  setStatus("Смена пароля...");
  await api.request("/api/account/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  repeatPasswordInput.value = "";
  setStatus("Пароль изменён.");
  showToast("Пароль изменён");
}

function bindEvents() {
  tabs.forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/auth";
  });

  saveProfileBtn.addEventListener("click", () => saveProfile().catch((error) => {
    setStatus(error.message || "Не удалось сохранить профиль", true);
    showToast(error.message || "Ошибка", true);
  }));

  savePrefsBtn.addEventListener("click", () => saveProfile().catch((error) => {
    setStatus(error.message || "Не удалось сохранить предпочтения", true);
    showToast(error.message || "Ошибка", true);
  }));

  themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));

  changePasswordBtn.addEventListener("click", () => changePassword().catch((error) => {
    setStatus(error.message || "Не удалось сменить пароль", true);
    showToast(error.message || "Ошибка", true);
  }));

  logoutAllBtn.addEventListener("click", () => {
    openConfirm(
      "Выйти со всех устройств",
      "Текущая сессия тоже будет завершена. Продолжить?",
      async () => {
        await api.request("/api/account/logout-all", { method: "POST" });
        showToast("Все устройства отключены");
        window.location.href = "/auth";
      }
    );
  });

  refreshSessionsBtn?.addEventListener("click", () => {
    loadSessions()
      .then(() => showToast("Сессии обновлены"))
      .catch((error) => showToast(error.message || "Не удалось обновить сессии", true));
  });

  sessionsList?.addEventListener("click", (event) => {
    const killBtn = event.target.closest("[data-kill-session]");
    if (!killBtn) return;
    const sessionId = Number(killBtn.dataset.killSession);
    if (!Number.isInteger(sessionId) || sessionId <= 0) return;
    openConfirm(
      "Завершить сессию",
      "Это устройство будет разлогинено.",
      async () => {
        await api.request(`/api/account/sessions/${sessionId}`, { method: "DELETE" });
        await loadSessions();
        showToast("Сессия завершена");
      }
    );
  });

  deleteAccountBtn?.addEventListener("click", () => {
    const password = String(deleteAccountPasswordInput?.value || "");
    if (!password) {
      setStatus("Введите пароль для удаления аккаунта.", true);
      return;
    }
    openConfirm(
      "Удалить аккаунт",
      "Действие необратимо: будут удалены профиль и связанные данные.",
      async () => {
        await api.request("/api/account", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        });
        showToast("Аккаунт удалён");
        window.location.href = "/auth";
      }
    );
  });

  confirmCancel.addEventListener("click", closeConfirm);
  confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal) closeConfirm();
  });

  confirmSubmit.addEventListener("click", async () => {
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
    applyStaticAccountTextFixes();
    const me = await api.request("/api/auth/me");
    if (!me.user) return (window.location.href = "/auth");

    bindEvents();
    await loadAccount();
    await loadSessions();
    setStatus("Профиль загружен.");
  } catch (error) {
    setStatus(error.message || "Не удалось загрузить аккаунт", true);
    showToast(error.message || "Ошибка", true);
  }
})();
