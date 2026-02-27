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

const params = new URLSearchParams(window.location.search);
const resetTokenFromUrl = params.get("reset") || "";

let mode = "login";

function cleanUrlParams() {
  const clean = new URL(window.location.href);
  clean.searchParams.delete("reset");
  window.history.replaceState({}, "", clean.toString());
}

function antiBotMeta() {
  return {
    website: websiteInput.value || ""
  };
}

function setMode(nextMode) {
  mode = nextMode;
  const isRegister = mode === "register";
  const isReset = mode === "reset";

  authTitle.textContent = isRegister ? "Create Account" : isReset ? "Reset Password" : "Sign In";
  authLead.textContent = isRegister
    ? "Create your account with email and password."
    : isReset
      ? "Set a new password for your account."
      : "Use your email and password.";
  submitBtn.textContent = isRegister ? "Register" : isReset ? "Save new password" : "Login";

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

    showOk(mode === "register" ? "Account created. Redirecting..." : "Success. Redirecting...");
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
    showOk("If the email exists, reset instructions were sent.");
  } catch (error) {
    showError(error.message);
  }
}

async function bootstrap() {
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
    if (me.user) {
      window.location.href = "/";
    }
  } catch {
    // ignore
  }
}

bootstrap();
