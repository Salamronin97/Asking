const refs = {
  logoutBtn: document.getElementById("logoutBtn"),
  accountStatus: document.getElementById("accountStatus"),
  tabs: Array.from(document.querySelectorAll(".account-tab")),
  panes: Array.from(document.querySelectorAll(".account-pane")),
  toast: document.getElementById("toast"),

  displayNameInput: document.getElementById("displayNameInput"),
  emailInput: document.getElementById("emailInput"),
  localeSelect: document.getElementById("localeSelect"),
  profileInitials: document.getElementById("profileInitials"),
  profileSummaryName: document.getElementById("profileSummaryName"),
  profileSummaryEmail: document.getElementById("profileSummaryEmail"),
  profileCreatedAt: document.getElementById("profileCreatedAt"),
  profileUpdatedAt: document.getElementById("profileUpdatedAt"),
  profileSessionsCount: document.getElementById("profileSessionsCount"),

  saveProfileBtn: document.getElementById("saveProfileBtn"),
  currentPasswordInput: document.getElementById("currentPasswordInput"),
  newPasswordInput: document.getElementById("newPasswordInput"),
  repeatPasswordInput: document.getElementById("repeatPasswordInput"),
  changePasswordBtn: document.getElementById("changePasswordBtn"),
  logoutAllBtn: document.getElementById("logoutAllBtn"),
  passwordForm: document.getElementById("passwordForm"),
  passwordUnavailable: document.getElementById("passwordUnavailable"),
  refreshSessionsBtn: document.getElementById("refreshSessionsBtn"),
  sessionsList: document.getElementById("sessionsList"),
  securityPasswordHint: document.getElementById("securityPasswordHint"),
  securitySessionsCount: document.getElementById("securitySessionsCount"),

  confirmModal: document.getElementById("confirmModal"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmText: document.getElementById("confirmText"),
  confirmCancel: document.getElementById("confirmCancel"),
  confirmSubmit: document.getElementById("confirmSubmit"),

  passwordToggles: Array.from(document.querySelectorAll("[data-toggle-password]"))
};

const state = {
  profile: null,
  sessions: [],
  confirmAction: null
};

const THEME_STORAGE_KEY = "asking_theme";

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Ошибка запроса");
    return data;
  }
};

function showToast(message, isError = false) {
  if (!refs.toast) return;
  refs.toast.textContent = message;
  refs.toast.hidden = false;
  refs.toast.classList.toggle("is-error", isError);
  refs.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    refs.toast.classList.remove("is-visible");
    setTimeout(() => {
      refs.toast.hidden = true;
    }, 180);
  }, 2200);
}

function setStatus(message, isError = false) {
  if (!refs.accountStatus) return;
  refs.accountStatus.textContent = message || "";
  refs.accountStatus.style.color = isError ? "#b91c1c" : "#334155";
}

function applyTheme(theme) {
  const preferred = theme || "light";
  const resolved = preferred === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preferred;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preferred);
  } catch {}
  document.documentElement.setAttribute("data-theme", resolved === "dark" ? "dark" : "light");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value, withTime = true) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return withTime
    ? date.toLocaleString("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("ru-RU", { year: "numeric", month: "short", day: "numeric" });
}

function shortUserAgent(value) {
  const source = String(value || "").trim();
  if (!source) return "Неизвестное устройство";
  const cleaned = source.replace(/\s+/g, " ");
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

function userInitials(profile) {
  const source = String(profile?.displayName || profile?.name || profile?.email || "A").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function updateProfile(profile) {
  if (!profile) return;
  const name = profile.displayName || profile.name || "Пользователь Asking";
  const email = profile.email || "-";

  refs.displayNameInput.value = profile.displayName || profile.name || "";
  refs.emailInput.value = email;
  refs.localeSelect.value = window.AskingLang?.getLang?.() || profile.locale || "ru";
  refs.profileInitials.textContent = userInitials(profile);
  refs.profileSummaryName?.setAttribute("data-no-i18n", "");
  refs.profileSummaryEmail?.setAttribute("data-no-i18n", "");
  refs.profileSummaryName.textContent = name;
  refs.profileSummaryEmail.textContent = email;
  refs.profileCreatedAt.textContent = formatDate(profile.createdAt, false);
  refs.profileUpdatedAt.textContent = formatDate(profile.updatedAt, false);

  const passwordEnabled = Boolean(profile.hasPassword);
  refs.passwordForm.hidden = !passwordEnabled;
  refs.passwordUnavailable.hidden = passwordEnabled;
  refs.currentPasswordInput.disabled = !passwordEnabled;
  refs.newPasswordInput.disabled = !passwordEnabled;
  refs.repeatPasswordInput.disabled = !passwordEnabled;
  refs.changePasswordBtn.disabled = !passwordEnabled;
  refs.securityPasswordHint.textContent = passwordEnabled
    ? "Введите текущий пароль и новый пароль."
    : "Смена пароля недоступна для текущего способа входа.";

  applyTheme(profile.theme || "light");
}

function updateSessionSummary() {
  const total = state.sessions.length;
  refs.profileSessionsCount.textContent = String(total);
  refs.securitySessionsCount.textContent = String(total);
}

function renderSessions() {
  if (!refs.sessionsList) return;
  if (!state.sessions.length) {
    refs.sessionsList.innerHTML = "<div class='svacc-empty-row'>Сессии не найдены.</div>";
    updateSessionSummary();
    return;
  }

  refs.sessionsList.innerHTML = state.sessions
    .map((session) => {
      const badge = session.isCurrent
        ? "<span class='svacc-session__badge is-current'>Текущая</span>"
        : "<span class='svacc-session__badge'>Активна</span>";
      const action = session.isCurrent
        ? ""
        : `<div class="svacc-session__actions"><button class="btn btn--ghost btn--xs" type="button" data-kill-session="${Number(session.id)}">Завершить</button></div>`;
      return `
        <article class="svacc-session" data-session-id="${Number(session.id)}">
          <div class="svacc-session__top">
            <strong>${escapeHtml(shortUserAgent(session.userAgent))}</strong>
            ${badge}
          </div>
          <div class="svacc-session__meta">
            <span>IP: ${escapeHtml(session.ip || "-")}</span>
            <span>Вход: ${escapeHtml(formatDate(session.createdAt))}</span>
            <span>Истекает: ${escapeHtml(formatDate(session.expiresAt))}</span>
          </div>
          ${action}
        </article>
      `;
    })
    .join("");
  updateSessionSummary();
}

function switchTab(tab, pushHistory = true) {
  const allowed = new Set(["profile", "security", "info"]);
  const target = allowed.has(tab) ? tab : "profile";
  refs.tabs.forEach((item) => item.classList.toggle("is-active", item.dataset.tab === target));
  refs.panes.forEach((item) => item.classList.toggle("is-active", item.dataset.pane === target));
  if (pushHistory) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", target);
    history.replaceState({}, "", url.toString());
  }
}

function profilePayload() {
  const locale = window.AskingLang?.getLang?.() || refs.localeSelect.value || "ru";
  return {
    displayName: refs.displayNameInput.value.trim(),
    company: state.profile?.company || "",
    position: state.profile?.position || "",
    locale,
    theme: state.profile?.theme || "light"
  };
}

async function loadAccount() {
  const profile = await api.request("/api/account");
  state.profile = profile;
  updateProfile(profile);
}

async function loadSessions() {
  const payload = await api.request("/api/account/sessions");
  state.sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  renderSessions();
}

async function saveProfile() {
  const payload = profilePayload();
  if (!payload.displayName || payload.displayName.length < 2) {
    setStatus("Имя должно быть не короче 2 символов.", true);
    return;
  }

  setStatus("Сохраняем...");
  const profile = await api.request("/api/account", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  window.AskingLang?.setLang?.(payload.locale, { manual: false });
  state.profile = profile;
  updateProfile(profile);
  setStatus("Изменения сохранены.");
  showToast("Изменения сохранены");
}

async function changePassword() {
  const currentPassword = refs.currentPasswordInput.value;
  const newPassword = refs.newPasswordInput.value;
  const repeatPassword = refs.repeatPasswordInput.value;

  if (refs.changePasswordBtn.disabled) return;
  if (!currentPassword || !newPassword || !repeatPassword) {
    setStatus("Заполните все поля пароля.", true);
    return;
  }
  if (newPassword.length < 8) {
    setStatus("Новый пароль должен содержать минимум 8 символов.", true);
    return;
  }
  if (newPassword !== repeatPassword) {
    setStatus("Новый пароль и повтор не совпадают.", true);
    return;
  }

  setStatus("Меняем пароль...");
  await api.request("/api/account/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  refs.currentPasswordInput.value = "";
  refs.newPasswordInput.value = "";
  refs.repeatPasswordInput.value = "";
  setStatus("Пароль изменен.");
  showToast("Пароль изменен");
}

function openConfirm(title, text, action) {
  state.confirmAction = action;
  refs.confirmTitle.textContent = title;
  refs.confirmText.textContent = text;
  refs.confirmModal.hidden = false;
}

function closeConfirm() {
  state.confirmAction = null;
  refs.confirmModal.hidden = true;
}

function bindPasswordToggles() {
  refs.passwordToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.getAttribute("data-toggle-password") || "");
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "Показать" : "Скрыть";
    });
  });
}

function bindEvents() {
  refs.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab || "profile"));
  });

  refs.logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/auth";
  });

  refs.saveProfileBtn.addEventListener("click", () => {
    saveProfile().catch((error) => {
      setStatus(error.message || "Не удалось сохранить профиль", true);
      showToast(error.message || "Ошибка", true);
    });
  });

  refs.changePasswordBtn.addEventListener("click", () => {
    changePassword().catch((error) => {
      setStatus(error.message || "Не удалось сменить пароль", true);
      showToast(error.message || "Ошибка", true);
    });
  });

  refs.logoutAllBtn.addEventListener("click", () => {
    openConfirm("Выйти на всех устройствах", "Текущая сессия тоже будет завершена. Продолжить?", async () => {
      await api.request("/api/account/logout-all", { method: "POST" });
      window.location.href = "/auth";
    });
  });

  refs.refreshSessionsBtn.addEventListener("click", () => {
    loadSessions()
      .then(() => showToast("Сессии обновлены"))
      .catch((error) => showToast(error.message || "Не удалось обновить сессии", true));
  });

  refs.sessionsList.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-kill-session]") : null;
    if (!target) return;
    const sessionId = Number(target.getAttribute("data-kill-session"));
    if (!Number.isInteger(sessionId) || sessionId <= 0) return;
    openConfirm("Завершить сессию", "Это устройство будет разлогинено.", async () => {
      await api.request(`/api/account/sessions/${sessionId}`, { method: "DELETE" });
      await loadSessions();
      showToast("Сессия завершена");
    });
  });

  refs.confirmCancel.addEventListener("click", closeConfirm);
  refs.confirmModal.addEventListener("click", (event) => {
    if (event.target === refs.confirmModal) closeConfirm();
  });
  refs.confirmSubmit.addEventListener("click", async () => {
    if (!state.confirmAction) return;
    try {
      refs.confirmSubmit.disabled = true;
      await state.confirmAction();
      closeConfirm();
    } catch (error) {
      showToast(error.message || "Ошибка действия", true);
    } finally {
      refs.confirmSubmit.disabled = false;
    }
  });

  bindPasswordToggles();
}

(async function bootstrap() {
  try {
    const me = await api.request("/api/auth/me");
    if (!me.user) {
      window.location.href = "/auth";
      return;
    }

    bindEvents();
    await loadAccount();
    await loadSessions();

    const initialTab = new URL(window.location.href).searchParams.get("tab") || "profile";
    switchTab(initialTab, false);
    setStatus("Аккаунт загружен.");
  } catch (error) {
    setStatus(error.message || "Не удалось загрузить аккаунт", true);
    showToast(error.message || "Ошибка", true);
  }
})();
