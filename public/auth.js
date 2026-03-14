const refs = {
  form: document.getElementById("authForm"),
  title: document.getElementById("authTitle"),
  lead: document.getElementById("authLead"),
  toLogin: document.getElementById("toLogin"),
  toRegister: document.getElementById("toRegister"),
  submitBtn: document.getElementById("submitBtn"),
  emailRow: document.getElementById("emailRow"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  confirmPasswordRow: document.getElementById("confirmPasswordRow"),
  confirmPassword: document.getElementById("confirmPassword"),
  resetTokenRow: document.getElementById("resetTokenRow"),
  resetToken: document.getElementById("resetToken"),
  forgotBtn: document.getElementById("forgotBtn"),
  authAux: document.getElementById("authAux"),
  forgotPanel: document.getElementById("forgotPanel"),
  forgotEmail: document.getElementById("forgotEmail"),
  forgotSendBtn: document.getElementById("forgotSendBtn"),
  website: document.getElementById("website"),
  errorBox: document.getElementById("errorBox"),
  okBox: document.getElementById("okBox"),
  languageSelect: document.getElementById("languageSelect"),
  togglePasswordBtn: document.getElementById("togglePasswordBtn"),
  toggleConfirmPasswordBtn: document.getElementById("toggleConfirmPasswordBtn")
};

const LANG_KEY = "asking-pro-lang";
const SUPPORTED_LANGS = ["ru", "en", "kz"];
const params = new URLSearchParams(window.location.search);
const resetTokenFromUrl = String(params.get("reset") || "").trim();
const nextUrl = String(params.get("next") || "/");

const state = {
  mode: "login",
  submitting: false,
  lang: SUPPORTED_LANGS.includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : "ru"
};

const i18n = {
  ru: {
    signIn: "Вход",
    createAccount: "Регистрация",
    resetPassword: "Сброс пароля",
    back: "Назад",
    email: "Email",
    emailPlaceholder: "you@mail.com",
    password: "Пароль",
    confirmPassword: "Повторите пароль",
    resetToken: "Токен сброса",
    forgotPassword: "Забыли пароль?",
    passwordRecovery: "Восстановление пароля",
    accountEmail: "Email аккаунта",
    sendResetLink: "Отправить ссылку для сброса",
    authLead: "Используйте email и пароль.",
    authLeadRegister: "Создайте аккаунт по email и паролю.",
    authLeadReset: "Задайте новый пароль для аккаунта.",
    login: "Войти",
    register: "Регистрация",
    saveNewPassword: "Сохранить новый пароль",
    show: "Показать",
    hide: "Скрыть",
    submitLoading: "Подождите...",
    accountCreated: "Аккаунт создан. Перенаправление...",
    successRedirect: "Успешно. Перенаправление...",
    forgotSent: "Если email существует, инструкция по сбросу отправлена.",
    invalidEmail: "Введите корректный email.",
    passwordTooShort: "Пароль должен быть не короче 8 символов.",
    passwordMismatch: "Пароли не совпадают.",
    resetTokenRequired: "Введите токен сброса.",
    unknownError: "Не удалось выполнить запрос. Попробуйте еще раз."
  },
  en: {
    signIn: "Sign In",
    createAccount: "Create Account",
    resetPassword: "Reset Password",
    back: "Back",
    email: "Email",
    emailPlaceholder: "you@mail.com",
    password: "Password",
    confirmPassword: "Confirm password",
    resetToken: "Reset token",
    forgotPassword: "Forgot password?",
    passwordRecovery: "Password recovery",
    accountEmail: "Account email",
    sendResetLink: "Send reset link",
    authLead: "Use your email and password.",
    authLeadRegister: "Create your account with email and password.",
    authLeadReset: "Set a new password for your account.",
    login: "Login",
    register: "Register",
    saveNewPassword: "Save new password",
    show: "Show",
    hide: "Hide",
    submitLoading: "Please wait...",
    accountCreated: "Account created. Redirecting...",
    successRedirect: "Success. Redirecting...",
    forgotSent: "If the email exists, reset instructions were sent.",
    invalidEmail: "Enter a valid email.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordMismatch: "Passwords do not match.",
    resetTokenRequired: "Enter reset token.",
    unknownError: "Request failed. Please try again."
  },
  kz: {
    signIn: "Кіру",
    createAccount: "Тіркелу",
    resetPassword: "Құпиясөзді қалпына келтіру",
    back: "Артқа",
    email: "Email",
    emailPlaceholder: "you@mail.com",
    password: "Құпиясөз",
    confirmPassword: "Құпиясөзді қайталаңыз",
    resetToken: "Қалпына келтіру токені",
    forgotPassword: "Құпиясөзді ұмыттыңыз ба?",
    passwordRecovery: "Құпиясөзді қалпына келтіру",
    accountEmail: "Аккаунт email-ы",
    sendResetLink: "Қалпына келтіру сілтемесін жіберу",
    authLead: "Email мен құпиясөзді қолданыңыз.",
    authLeadRegister: "Email және құпиясөз арқылы аккаунт жасаңыз.",
    authLeadReset: "Аккаунт үшін жаңа құпиясөз орнатыңыз.",
    login: "Кіру",
    register: "Тіркелу",
    saveNewPassword: "Жаңа құпиясөзді сақтау",
    show: "Көрсету",
    hide: "Жасыру",
    submitLoading: "Күтіңіз...",
    accountCreated: "Аккаунт жасалды. Бағытталуда...",
    successRedirect: "Сәтті. Бағытталуда...",
    forgotSent: "Егер email бар болса, қалпына келтіру нұсқауы жіберілді.",
    invalidEmail: "Дұрыс email енгізіңіз.",
    passwordTooShort: "Құпиясөз кемінде 8 таңбадан тұруы керек.",
    passwordMismatch: "Құпиясөздер сәйкес емес.",
    resetTokenRequired: "Қалпына келтіру токенін енгізіңіз.",
    unknownError: "Сұраныс сәтсіз аяқталды. Қайталап көріңіз."
  }
};

function t(key) {
  return i18n[state.lang]?.[key] || i18n.ru[key] || key;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function cleanResetParamInUrl() {
  const clean = new URL(window.location.href);
  clean.searchParams.delete("reset");
  window.history.replaceState({}, "", clean.toString());
}

function antiBotPayload() {
  return { website: String(refs.website?.value || "") };
}

function mapApiError(message) {
  const source = String(message || "").toLowerCase();
  if (!source) return t("unknownError");
  if (source.includes("invalid email") || source.includes("email")) return t("invalidEmail");
  if (source.includes("at least 8") || source.includes("password")) return t("passwordTooShort");
  return message;
}

function setSubmitState(on) {
  state.submitting = Boolean(on);
  if (!refs.submitBtn) return;
  refs.submitBtn.disabled = state.submitting;
  refs.submitBtn.textContent = state.submitting
    ? t("submitLoading")
    : state.mode === "register"
      ? t("register")
      : state.mode === "reset"
        ? t("saveNewPassword")
        : t("login");
}

function clearStatus() {
  if (refs.errorBox) refs.errorBox.textContent = "";
  if (refs.okBox) refs.okBox.textContent = "";
}

function showError(message) {
  if (refs.errorBox) refs.errorBox.textContent = String(message || t("unknownError"));
  if (refs.okBox) refs.okBox.textContent = "";
}

function showOk(message) {
  if (refs.okBox) refs.okBox.textContent = String(message || "");
  if (refs.errorBox) refs.errorBox.textContent = "";
}

function togglePasswordVisibility(input, button) {
  if (!input || !button) return;
  const hidden = input.type === "password";
  input.type = hidden ? "text" : "password";
  button.textContent = hidden ? t("hide") : t("show");
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.title = `Asking | ${t("signIn")}`;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = String(node.getAttribute("data-i18n") || "");
    node.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = String(node.getAttribute("data-i18n-placeholder") || "");
    node.setAttribute("placeholder", t(key));
  });
}

function setMode(nextMode) {
  state.mode = nextMode;
  const isRegister = state.mode === "register";
  const isReset = state.mode === "reset";

  if (refs.title) refs.title.textContent = isRegister ? t("createAccount") : isReset ? t("resetPassword") : t("signIn");
  if (refs.lead) refs.lead.textContent = isRegister ? t("authLeadRegister") : isReset ? t("authLeadReset") : t("authLead");

  if (refs.emailRow) refs.emailRow.hidden = isReset;
  if (refs.email) {
    refs.email.required = !isReset;
    refs.email.disabled = isReset;
  }

  if (refs.confirmPasswordRow) refs.confirmPasswordRow.hidden = !(isRegister || isReset);
  if (refs.confirmPassword) {
    refs.confirmPassword.required = isRegister || isReset;
    if (!(isRegister || isReset)) refs.confirmPassword.value = "";
  }

  if (refs.resetTokenRow) refs.resetTokenRow.hidden = !isReset;
  if (refs.resetToken) refs.resetToken.required = isReset;

  if (refs.authAux) refs.authAux.hidden = isRegister || isReset;
  if (refs.forgotPanel) refs.forgotPanel.hidden = true;

  if (refs.password) refs.password.autocomplete = isRegister || isReset ? "new-password" : "current-password";

  if (refs.toLogin) refs.toLogin.classList.toggle("is-active", state.mode === "login");
  if (refs.toRegister) refs.toRegister.classList.toggle("is-active", state.mode === "register");

  if (refs.togglePasswordBtn) refs.togglePasswordBtn.textContent = t("show");
  if (refs.toggleConfirmPasswordBtn) refs.toggleConfirmPasswordBtn.textContent = t("show");
  if (refs.password) refs.password.type = "password";
  if (refs.confirmPassword) refs.confirmPassword.type = "password";

  clearStatus();
  setSubmitState(false);
}

function validateBeforeSubmit() {
  const email = String(refs.email?.value || "").trim();
  const password = String(refs.password?.value || "");
  const confirmPassword = String(refs.confirmPassword?.value || "");
  const token = String(refs.resetToken?.value || "").trim();

  if (state.mode !== "reset" && !isValidEmail(email)) return t("invalidEmail");

  if (password.length < 8) return t("passwordTooShort");

  if ((state.mode === "register" || state.mode === "reset") && password !== confirmPassword) {
    return t("passwordMismatch");
  }

  if (state.mode === "reset" && token.length < 8) return t("resetTokenRequired");

  return "";
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || t("unknownError"));
  return data;
}

async function submitAuth(event) {
  event.preventDefault();
  if (state.submitting) return;

  const validationError = validateBeforeSubmit();
  if (validationError) {
    showError(validationError);
    return;
  }

  setSubmitState(true);
  clearStatus();

  try {
    let url = "/api/auth/login";
    let payload = {
      email: String(refs.email?.value || "").trim(),
      password: String(refs.password?.value || ""),
      ...antiBotPayload()
    };

    if (state.mode === "register") {
      url = "/api/auth/register";
    }

    if (state.mode === "reset") {
      url = "/api/auth/reset-password";
      payload = {
        token: String(refs.resetToken?.value || "").trim(),
        password: String(refs.password?.value || ""),
        ...antiBotPayload()
      };
    }

    await request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    showOk(state.mode === "register" ? t("accountCreated") : t("successRedirect"));
    setTimeout(() => {
      window.location.href = nextUrl || "/";
    }, 700);
  } catch (error) {
    showError(mapApiError(error.message));
  } finally {
    setSubmitState(false);
  }
}

async function sendForgotPassword() {
  const email = String(refs.forgotEmail?.value || "").trim();
  if (!isValidEmail(email)) {
    showError(t("invalidEmail"));
    return;
  }

  refs.forgotSendBtn.disabled = true;
  clearStatus();

  try {
    await request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...antiBotPayload() })
    });
    showOk(t("forgotSent"));
  } catch (error) {
    showError(mapApiError(error.message));
  } finally {
    refs.forgotSendBtn.disabled = false;
  }
}

async function bootstrap() {
  refs.languageSelect.value = state.lang;
  applyI18n();
  setMode("login");

  refs.languageSelect.addEventListener("change", () => {
    state.lang = refs.languageSelect.value;
    localStorage.setItem(LANG_KEY, state.lang);
    applyI18n();
    setMode(state.mode);
  });

  refs.toLogin.addEventListener("click", () => setMode("login"));
  refs.toRegister.addEventListener("click", () => setMode("register"));
  refs.togglePasswordBtn?.addEventListener("click", () => togglePasswordVisibility(refs.password, refs.togglePasswordBtn));
  refs.toggleConfirmPasswordBtn?.addEventListener("click", () => togglePasswordVisibility(refs.confirmPassword, refs.toggleConfirmPasswordBtn));

  refs.forgotBtn.addEventListener("click", () => {
    refs.forgotPanel.hidden = !refs.forgotPanel.hidden;
  });

  refs.forgotSendBtn.addEventListener("click", sendForgotPassword);
  refs.form.addEventListener("submit", submitAuth);

  if (resetTokenFromUrl) {
    setMode("reset");
    refs.resetToken.value = resetTokenFromUrl;
    cleanResetParamInUrl();
    return;
  }

  try {
    const me = await request("/api/auth/me");
    if (me.user) window.location.href = nextUrl || "/";
  } catch {
    // ignore
  }
}

bootstrap();
