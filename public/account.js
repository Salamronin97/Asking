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

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmText = document.getElementById("confirmText");
const confirmCancel = document.getElementById("confirmCancel");
const confirmSubmit = document.getElementById("confirmSubmit");

const state = { profile: null, confirmAction: null };

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
        await api.request("/api/auth/logout_all", { method: "POST" });
        showToast("Все устройства отключены");
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
    const me = await api.request("/api/auth/me");
    if (!me.user) return (window.location.href = "/auth");

    bindEvents();
    await loadAccount();
    setStatus("Профиль загружен.");
  } catch (error) {
    setStatus(error.message || "Не удалось загрузить аккаунт", true);
    showToast(error.message || "Ошибка", true);
  }
})();
