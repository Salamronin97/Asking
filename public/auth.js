const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authLead = document.getElementById("authLead");
const toLogin = document.getElementById("toLogin");
const toRegister = document.getElementById("toRegister");
const submitBtn = document.getElementById("submitBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const resetTokenRow = document.getElementById("resetTokenRow");
const resetTokenInput = document.getElementById("resetToken");
const forgotBtn = document.getElementById("forgotBtn");
const authAux = document.getElementById("authAux");
const forgotPanel = document.getElementById("forgotPanel");
const forgotEmail = document.getElementById("forgotEmail");
const forgotSendBtn = document.getElementById("forgotSendBtn");
const websiteInput = document.getElementById("website");
const errorBox = document.getElementById("errorBox");
const okBox = document.getElementById("okBox");
const languageSelect = document.getElementById("languageSelect");

const LANG_KEY = "asking-pro-lang";
let lang = ["en", "ru", "kz"].includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : "ru";
const params = new URLSearchParams(window.location.search);
const resetTokenFromUrl = params.get("reset") || "";
let mode = "login";

const i18n = {
  en: {
    signIn: "Sign In",
    createAccount: "Create Account",
    resetPassword: "Reset Password",
    back: "Back",
    email: "Email",
    emailPlaceholder: "you@mail.com",
    password: "Password",
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
    accountCreated: "Account created. Redirecting...",
    successRedirect: "Success. Redirecting...",
    forgotSent: "If the email exists, reset instructions were sent."
  },
  ru: {
    signIn: "Вход",
    createAccount: "Регистрация",
    resetPassword: "Сброс пароля",
    back: "Назад",
    email: "Email",
    emailPlaceholder: "you@mail.com",
    password: "Пароль",
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
    accountCreated: "Аккаунт создан. Перенаправление...",
    successRedirect: "Успешно. Перенаправление...",
    forgotSent: "Если email существует, инструкция по сбросу отправлена."
  },
  kz: {
    signIn: "Кіру",
    createAccount: "Тіркелу",
    resetPassword: "Құпиясөзді қалпына келтіру",
    back: "Артқа",
    email: "Email",
    emailPlaceholder: "you@mail.com",
    password: "Құпиясөз",
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
    accountCreated: "Аккаунт жасалды. Бағытталуда...",
    successRedirect: "Сәтті. Бағытталуда...",
    forgotSent: "Егер email бар болса, қалпына келтіру нұсқауы жіберілді."
  }
};

function t(key) {
  return i18n[lang]?.[key] || i18n.en[key] || key;
}

function cleanUrlParams() {
  const clean = new URL(window.location.href);
  clean.searchParams.delete("reset");
  window.history.replaceState({}, "", clean.toString());
}

function antiBotMeta() {
  return { website: websiteInput.value || "" };
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    node.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    node.setAttribute("placeholder", t(key));
  });
}

function setMode(nextMode) {
  mode = nextMode;
  const isRegister = mode === "register";
  const isReset = mode === "reset";

  authTitle.textContent = isRegister ? t("createAccount") : isReset ? t("resetPassword") : t("signIn");
  authLead.textContent = isRegister ? t("authLeadRegister") : isReset ? t("authLeadReset") : t("authLead");
  submitBtn.textContent = isRegister ? t("register") : isReset ? t("saveNewPassword") : t("login");

  emailInput.required = !isReset;
  emailInput.disabled = isReset;
  resetTokenRow.hidden = !isReset;
  resetTokenInput.required = isReset;
  authAux.hidden = isRegister || isReset;
  forgotPanel.hidden = true;
  passwordInput.autocomplete = isRegister || isReset ? "new-password" : "current-password";

  toLogin.classList.toggle("is-active", mode === "login");
  toRegister.classList.toggle("is-active", mode === "register");

  errorBox.textContent = "";
  okBox.textContent = "";
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function showError(message) {
  errorBox.textContent = message;
  okBox.textContent = "";
}

function showOk(message) {
  okBox.textContent = message;
  errorBox.textContent = "";
}

async function submitAuth(event) {
  event.preventDefault();
  try {
    let url = "/api/auth/login";
    let payload = {
      email: emailInput.value.trim(),
      password: passwordInput.value,
      ...antiBotMeta()
    };

    if (mode === "register") {
      url = "/api/auth/register";
    }

    if (mode === "reset") {
      url = "/api/auth/reset-password";
      payload = {
        token: resetTokenInput.value.trim(),
        password: passwordInput.value,
        ...antiBotMeta()
      };
    }

    await request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    showOk(mode === "register" ? t("accountCreated") : t("successRedirect"));
    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  } catch (error) {
    showError(error.message);
  }
}

async function sendForgotPassword() {
  try {
    await request("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: forgotEmail.value.trim(),
        ...antiBotMeta()
      })
    });
    showOk(t("forgotSent"));
  } catch (error) {
    showError(error.message);
  }
}

async function bootstrap() {
  languageSelect.value = lang;
  applyI18n();
  languageSelect.addEventListener("change", () => {
    lang = languageSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    applyI18n();
    setMode(mode);
  });

  setMode("login");
  toLogin.addEventListener("click", () => setMode("login"));
  toRegister.addEventListener("click", () => setMode("register"));
  forgotBtn.addEventListener("click", () => {
    forgotPanel.hidden = !forgotPanel.hidden;
  });
  forgotSendBtn.addEventListener("click", sendForgotPassword);
  authForm.addEventListener("submit", submitAuth);

  if (resetTokenFromUrl) {
    setMode("reset");
    resetTokenInput.value = resetTokenFromUrl;
    cleanUrlParams();
    return;
  }

  try {
    const me = await request("/api/auth/me");
    if (me.user) window.location.href = "/";
  } catch {
    // ignore
  }
}

bootstrap();
