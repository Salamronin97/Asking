const refs = {
  logoutBtn: document.getElementById("logoutBtn"),
  accountStatus: document.getElementById("accountStatus"),
  tabs: Array.from(document.querySelectorAll(".account-tab")),
  panes: Array.from(document.querySelectorAll(".account-pane")),
  toast: document.getElementById("toast"),

  displayNameInput: document.getElementById("displayNameInput"),
  emailInput: document.getElementById("emailInput"),
  companyInput: document.getElementById("companyInput"),
  positionInput: document.getElementById("positionInput"),
  profileInitials: document.getElementById("profileInitials"),
  profileSummaryName: document.getElementById("profileSummaryName"),
  profileSummaryEmail: document.getElementById("profileSummaryEmail"),
  profileSummaryVerified: document.getElementById("profileSummaryVerified"),
  profileSummaryPassword: document.getElementById("profileSummaryPassword"),
  profileCreatedAt: document.getElementById("profileCreatedAt"),
  profileUpdatedAt: document.getElementById("profileUpdatedAt"),
  profileSessionsCount: document.getElementById("profileSessionsCount"),
  profileCompleteness: document.getElementById("profileCompleteness"),
  profileCompletenessHint: document.getElementById("profileCompletenessHint"),
  profileCompanyPreview: document.getElementById("profileCompanyPreview"),
  profileRolePreview: document.getElementById("profileRolePreview"),
  profileThemePreview: document.getElementById("profileThemePreview"),
  profileLocalePreview: document.getElementById("profileLocalePreview"),

  localeSelect: document.getElementById("localeSelect"),
  themeSelect: document.getElementById("themeSelect"),
  prefsLocalePreview: document.getElementById("prefsLocalePreview"),
  prefsThemePreview: document.getElementById("prefsThemePreview"),

  saveProfileBtn: document.getElementById("saveProfileBtn"),
  savePrefsBtn: document.getElementById("savePrefsBtn"),

  currentPasswordInput: document.getElementById("currentPasswordInput"),
  newPasswordInput: document.getElementById("newPasswordInput"),
  repeatPasswordInput: document.getElementById("repeatPasswordInput"),
  changePasswordBtn: document.getElementById("changePasswordBtn"),
  logoutAllBtn: document.getElementById("logoutAllBtn"),
  passwordForm: document.getElementById("passwordForm"),
  passwordUnavailable: document.getElementById("passwordUnavailable"),
  refreshSessionsBtn: document.getElementById("refreshSessionsBtn"),
  sessionsList: document.getElementById("sessionsList"),
  deleteAccountPasswordInput: document.getElementById("deleteAccountPasswordInput"),
  deleteAccountBtn: document.getElementById("deleteAccountBtn"),
  deleteAccountHint: document.getElementById("deleteAccountHint"),
  securityPasswordState: document.getElementById("securityPasswordState"),
  securityPasswordHint: document.getElementById("securityPasswordHint"),
  securityCurrentDevice: document.getElementById("securityCurrentDevice"),
  securityCurrentHint: document.getElementById("securityCurrentHint"),
  securitySessionsCount: document.getElementById("securitySessionsCount"),

  supportGuideBtn: document.getElementById("supportGuideBtn"),
  supportAuthorBtn: document.getElementById("supportAuthorBtn"),

  confirmModal: document.getElementById("confirmModal"),
  confirmTitle: document.getElementById("confirmTitle"),
  confirmText: document.getElementById("confirmText"),
  confirmCancel: document.getElementById("confirmCancel"),
  confirmSubmit: document.getElementById("confirmSubmit"),

  passwordToggles: Array.from(document.querySelectorAll("[data-toggle-password]"))
};

const state = {
  profile: null,
  confirmAction: null,
  sessions: []
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
  const resolved =
    theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme || "light");
  } catch {}
  document.documentElement.setAttribute("data-theme", resolved);
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
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function shortUserAgent(value) {
  const source = String(value || "").trim();
  if (!source) return "Неизвестное устройство";
  const cleaned = source.replace(/\s+/g, " ");
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned;
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function userInitials(profile) {
  const source = String(profile?.displayName || profile?.name || profile?.email || "A").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function themeLabel(value) {
  if (value === "dark") return "Темная тема";
  if (value === "system") return "Системная тема";
  return "Светлая тема";
}

function localeLabel(value) {
  if (value === "en") return "English";
  if (value === "kz") return "Қазақша";
  return "Русский";
}

function updateProfilePanels(profile) {
  if (!profile) return;

  const name = profile.displayName || profile.name || "Пользователь Asking";
  const company = profile.company || "Личная рабочая область";
  const position = profile.position || "Роль не указана";
  const filledFields = [profile.displayName || profile.name, profile.company, profile.position].filter(Boolean).length;
  const completeness = filledFields >= 3 ? "Профиль заполнен" : filledFields === 2 ? "Почти готово" : "Заполняем профиль";

  if (refs.profileInitials) refs.profileInitials.textContent = userInitials(profile);
  if (refs.profileSummaryName) refs.profileSummaryName.textContent = name;
  if (refs.profileSummaryEmail) refs.profileSummaryEmail.textContent = profile.email || "Email не указан";
  if (refs.profileSummaryVerified) {
    refs.profileSummaryVerified.textContent = profile.emailVerified ? "Email подтвержден" : "Email не подтвержден";
    refs.profileSummaryVerified.className = `ui-badge ${profile.emailVerified ? "ui-badge--success" : "ui-badge--muted"}`;
  }
  if (refs.profileSummaryPassword) {
    refs.profileSummaryPassword.textContent = profile.hasPassword ? "Пароль включен" : "Вход без локального пароля";
    refs.profileSummaryPassword.className = `ui-badge ${profile.hasPassword ? "ui-badge--info" : "ui-badge--muted"}`;
  }
  if (refs.profileCreatedAt) refs.profileCreatedAt.textContent = formatShortDate(profile.createdAt);
  if (refs.profileUpdatedAt) refs.profileUpdatedAt.textContent = formatShortDate(profile.updatedAt);
  if (refs.profileCompleteness) refs.profileCompleteness.textContent = completeness;
  if (refs.profileCompletenessHint) {
    refs.profileCompletenessHint.textContent =
      filledFields >= 3
        ? "Основные поля заполнены. Профиль готов к работе и выглядит полноценно."
        : "Добавьте имя, компанию и должность, чтобы профиль выглядел завершенным.";
  }
  if (refs.profileCompanyPreview) refs.profileCompanyPreview.textContent = company;
  if (refs.profileRolePreview) refs.profileRolePreview.textContent = position;
  if (refs.profileThemePreview) refs.profileThemePreview.textContent = themeLabel(profile.theme);
  if (refs.profileLocalePreview) {
    refs.profileLocalePreview.textContent = localeLabel(profile.locale);
  }
  if (refs.prefsLocalePreview) refs.prefsLocalePreview.textContent = (profile.locale || "ru").toUpperCase();
  if (refs.prefsThemePreview) refs.prefsThemePreview.textContent = themeLabel(profile.theme);
  if (refs.securityPasswordState) {
    refs.securityPasswordState.textContent = profile.hasPassword ? "Пароль активен" : "Вход через внешний провайдер";
  }
  if (refs.securityPasswordHint) {
    refs.securityPasswordHint.textContent = profile.hasPassword
      ? "Можно сменить текущий пароль и завершить старые сессии."
      : "Смена пароля недоступна, потому что аккаунт вошел без локального пароля.";
  }
}

function updateSessionPanels() {
  const total = state.sessions.length;
  const current = state.sessions.find((item) => item.isCurrent);
  if (refs.profileSessionsCount) refs.profileSessionsCount.textContent = String(total);
  if (refs.securitySessionsCount) refs.securitySessionsCount.textContent = String(total);
  if (refs.securityCurrentDevice) {
    refs.securityCurrentDevice.textContent = current ? shortUserAgent(current.userAgent) : "Не определено";
  }
  if (refs.securityCurrentHint) {
    refs.securityCurrentHint.textContent = current
      ? `Текущая сессия активна до ${formatDate(current.expiresAt)}.`
      : "Текущая активная сессия не найдена.";
  }
}

function syncPreviewFromInputs() {
  const draftProfile = {
    ...(state.profile || {}),
    displayName: refs.displayNameInput?.value?.trim() || state.profile?.displayName || state.profile?.name || "",
    name: state.profile?.name || "",
    company: refs.companyInput?.value?.trim() || "",
    position: refs.positionInput?.value?.trim() || "",
    email: refs.emailInput?.value || state.profile?.email || "",
    locale: refs.localeSelect?.value || state.profile?.locale || "ru",
    theme: refs.themeSelect?.value || state.profile?.theme || "light"
  };
  updateProfilePanels(draftProfile);
}

function switchTab(tab, pushHistory = true) {
  const allowed = new Set(["profile", "security", "prefs"]);
  const target = allowed.has(tab) ? tab : "profile";
  refs.tabs.forEach((item) => item.classList.toggle("is-active", item.dataset.tab === target));
  refs.panes.forEach((item) => item.classList.toggle("is-active", item.dataset.pane === target));
  if (pushHistory) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", target);
    history.replaceState({}, "", url.toString());
  }
}

function fillProfile(profile) {
  refs.displayNameInput.value = profile.displayName || profile.name || "";
  refs.emailInput.value = profile.email || "";
  refs.companyInput.value = profile.company || "";
  refs.positionInput.value = profile.position || "";
  refs.localeSelect.value = profile.locale || "ru";
  refs.themeSelect.value = profile.theme || "light";

  const passwordEnabled = Boolean(profile.hasPassword);
  refs.passwordForm.hidden = !passwordEnabled;
  refs.passwordUnavailable.hidden = passwordEnabled;
  refs.currentPasswordInput.disabled = !passwordEnabled;
  refs.newPasswordInput.disabled = !passwordEnabled;
  refs.repeatPasswordInput.disabled = !passwordEnabled;
  refs.changePasswordBtn.disabled = !passwordEnabled;

  if (refs.deleteAccountHint) {
    refs.deleteAccountHint.textContent = passwordEnabled
      ? "Введите пароль для подтверждения удаления аккаунта."
      : "У аккаунта нет пароля. Аккаунт будет удален сразу после подтверждения.";
  }
  refs.deleteAccountPasswordInput.required = passwordEnabled;
  refs.deleteAccountPasswordInput.placeholder = passwordEnabled ? "Текущий пароль" : "Пароль не требуется";

  applyTheme(refs.themeSelect.value);
  updateProfilePanels(profile);
}

function renderSessions() {
  if (!refs.sessionsList) return;
  if (!state.sessions.length) {
    refs.sessionsList.innerHTML = "<div class='svacc-empty-row'>Сессии не найдены.</div>";
    return;
  }

  refs.sessionsList.innerHTML = state.sessions
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
  refs.confirmTitle.textContent = title;
  refs.confirmText.textContent = text;
  refs.confirmModal.hidden = false;
}

function closeConfirm() {
  state.confirmAction = null;
  refs.confirmModal.hidden = true;
}

function profilePayload() {
  return {
    displayName: refs.displayNameInput.value.trim(),
    company: refs.companyInput.value.trim(),
    position: refs.positionInput.value.trim(),
    locale: refs.localeSelect.value,
    theme: refs.themeSelect.value
  };
}

async function loadAccount() {
  const profile = await api.request("/api/account");
  state.profile = profile;
  fillProfile(profile);
}

async function loadSessions() {
  const payload = await api.request("/api/account/sessions");
  state.sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  renderSessions();
  updateSessionPanels();
}

async function saveProfile() {
  const payload = profilePayload();
  if (!payload.displayName || payload.displayName.length < 2) {
    setStatus("Имя должно быть не короче 2 символов.", true);
    return;
  }

  setStatus("Сохраняем профиль...");
  const profile = await api.request("/api/account", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  state.profile = profile;
  fillProfile(profile);
  setStatus("Профиль сохранен.");
  showToast("Профиль сохранен");
}

async function savePrefs() {
  const payload = profilePayload();
  setStatus("Сохраняем предпочтения...");
  const profile = await api.request("/api/account", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  state.profile = profile;
  fillProfile(profile);
  setStatus("Предпочтения сохранены.");
  showToast("Предпочтения сохранены");
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

function bindPasswordToggles() {
  refs.passwordToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const inputId = btn.getAttribute("data-toggle-password");
      const input = inputId ? document.getElementById(inputId) : null;
      if (!input) return;
      const nextType = input.type === "password" ? "text" : "password";
      input.type = nextType;
      btn.textContent = nextType === "password" ? "Показать" : "Скрыть";
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

  refs.savePrefsBtn.addEventListener("click", () => {
    savePrefs().catch((error) => {
      setStatus(error.message || "Не удалось сохранить предпочтения", true);
      showToast(error.message || "Ошибка", true);
    });
  });

  refs.themeSelect.addEventListener("change", () => applyTheme(refs.themeSelect.value));
  refs.themeSelect.addEventListener("change", syncPreviewFromInputs);
  refs.localeSelect.addEventListener("change", syncPreviewFromInputs);
  refs.displayNameInput.addEventListener("input", syncPreviewFromInputs);
  refs.companyInput.addEventListener("input", syncPreviewFromInputs);
  refs.positionInput.addEventListener("input", syncPreviewFromInputs);

  refs.changePasswordBtn.addEventListener("click", () => {
    changePassword().catch((error) => {
      setStatus(error.message || "Не удалось сменить пароль", true);
      showToast(error.message || "Ошибка", true);
    });
  });

  refs.logoutAllBtn.addEventListener("click", () => {
    openConfirm("Выйти со всех устройств", "Текущая сессия тоже будет завершена. Продолжить?", async () => {
      await api.request("/api/account/logout-all", { method: "POST" });
      showToast("Все устройства отключены");
      window.location.href = "/auth";
    });
  });

  refs.refreshSessionsBtn?.addEventListener("click", () => {
    loadSessions()
      .then(() => showToast("Сессии обновлены"))
      .catch((error) => showToast(error.message || "Не удалось обновить сессии", true));
  });

  refs.sessionsList?.addEventListener("click", (event) => {
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

  refs.deleteAccountBtn?.addEventListener("click", () => {
    const password = String(refs.deleteAccountPasswordInput?.value || "");
    const needPassword = Boolean(state.profile?.hasPassword);
    if (needPassword && !password) {
      setStatus("Введите пароль для удаления аккаунта.", true);
      return;
    }
    openConfirm("Удалить аккаунт", "Действие необратимо: будут удалены профиль и связанные данные.", async () => {
      await api.request("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      showToast("Аккаунт удален");
      window.location.href = "/auth";
    });
  });

  refs.supportGuideBtn?.addEventListener("click", () => {
    window.location.href = "/guide";
  });
  refs.supportAuthorBtn?.addEventListener("click", () => {
    window.location.href = "/author";
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
    setStatus("Профиль загружен.");
  } catch (error) {
    setStatus(error.message || "Не удалось загрузить аккаунт", true);
    showToast(error.message || "Ошибка", true);
  }
})();
