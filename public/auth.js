const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authLead = document.getElementById("authLead");
const toLogin = document.getElementById("toLogin");
const toRegister = document.getElementById("toRegister");
const submitBtn = document.getElementById("submitBtn");
const identifierRow = document.getElementById("identifierRow");
const identifierInput = document.getElementById("identifier");
const usernameRow = document.getElementById("usernameRow");
const usernameInput = document.getElementById("username");
const nameRow = document.getElementById("nameRow");
const nameInput = document.getElementById("name");
const emailRow = document.getElementById("emailRow");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordHint = document.getElementById("passwordHint");
const resetTokenRow = document.getElementById("resetTokenRow");
const resetTokenInput = document.getElementById("resetToken");
const forgotBtn = document.getElementById("forgotBtn");
const resendBtn = document.getElementById("resendBtn");
const authAux = document.getElementById("authAux");
const forgotPanel = document.getElementById("forgotPanel");
const forgotEmail = document.getElementById("forgotEmail");
const forgotSendBtn = document.getElementById("forgotSendBtn");
const websiteInput = document.getElementById("website");
const authStartedAt = document.getElementById("authStartedAt");
const errorBox = document.getElementById("errorBox");
const okBox = document.getElementById("okBox");
const googleWrap = document.getElementById("googleWrap");
const googleTitle = document.getElementById("googleTitle");
const googleLead = document.getElementById("googleLead");
const googleState = document.getElementById("googleState");

const params = new URLSearchParams(window.location.search);
const verifyTokenFromUrl = params.get("verify") || "";
const resetTokenFromUrl = params.get("reset") || "";

let mode = "login";

function cleanUrlParams() {
  const clean = new URL(window.location.href);
  clean.searchParams.delete("verify");
  clean.searchParams.delete("reset");
  window.history.replaceState({}, "", clean.toString());
}

function antiBotMeta() {
  return {
    website: websiteInput.value || "",
    authStartedAt: Number(authStartedAt.value || Date.now())
  };
}

function setMode(nextMode) {
  mode = nextMode;
  const isRegister = mode === "register";
  const isReset = mode === "reset";

  authTitle.textContent = isRegister ? "Create Account" : isReset ? "Reset Password" : "Sign In";
  authLead.textContent = isRegister
    ? "Create your account and confirm your email to start building surveys."
    : isReset
      ? "Set a new password for your account."
      : "Use your email or nickname and password.";

  googleTitle.textContent = isRegister ? "Register with Google" : "Google Sign-In";
  googleLead.textContent = isRegister
    ? "Create an account instantly using your Google profile."
    : "One-click sign in with your Google account.";

  submitBtn.textContent = isRegister ? "Register" : isReset ? "Save new password" : "Login";
  submitBtn.classList.toggle("btn--outline", isReset);

  identifierRow.hidden = isRegister || isReset;
  identifierInput.required = mode === "login";
  usernameRow.hidden = !isRegister;
  usernameInput.required = isRegister;
  nameRow.hidden = !isRegister;
  emailRow.hidden = !isRegister;
  emailInput.required = isRegister;
  resetTokenRow.hidden = !isReset;
  resetTokenInput.required = isReset;
  passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
  passwordHint.hidden = !isRegister;
  authAux.hidden = isRegister || isReset;
  forgotPanel.hidden = true;
  googleWrap.parentElement.hidden = isReset;

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

function setGoogleState(message, kind = "muted") {
  googleState.textContent = message;
  if (kind === "error") {
    googleState.style.color = "#b91c1c";
  } else if (kind === "ok") {
    googleState.style.color = "#166534";
  } else {
    googleState.style.color = "";
  }
}

async function submitAuth(event) {
  event.preventDefault();
  try {
    let url = "/api/auth/login";
    let payload = {
      identifier: identifierInput.value.trim(),
      password: passwordInput.value,
      ...antiBotMeta()
    };

    if (mode === "register") {
      url = "/api/auth/register";
      payload = {
        username: usernameInput.value.trim(),
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        ...antiBotMeta()
      };
    }

    if (mode === "reset") {
      url = "/api/auth/reset-password";
      payload = {
        token: resetTokenInput.value.trim(),
        password: passwordInput.value,
        ...antiBotMeta()
      };
    }

    const data = await request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (mode === "register") {
      showOk("Account created. Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 700);
      return;
    }

    showOk(mode === "reset" ? "Password updated. Redirecting..." : "Success. Redirecting...");
    if (data?.user?.emailVerified === false) {
      showOk("Signed in, but email verification is still required.");
      return;
    }
    setTimeout(() => {
      window.location.href = "/";
    }, 700);
  } catch (error) {
    showError(error.message);
  }
}

function initGoogle(clientId) {
  if (!window.google || !clientId) return;
  googleWrap.innerHTML = "";
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: async (response) => {
      try {
        await request("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential })
        });
        showOk("Google sign-in successful. Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 600);
      } catch (error) {
        showError(error.message);
        setGoogleState("Google auth failed. Try again.", "error");
      }
    }
  });
  window.google.accounts.id.renderButton(googleWrap, {
    type: "standard",
    size: "large",
    text: "continue_with",
    theme: "filled_black",
    shape: "pill",
    width: 320
  });
  setGoogleState("Google OAuth is enabled.", "ok");
  window.google.accounts.id.prompt();
}

function renderGoogleFallback() {
  googleWrap.innerHTML = '<button type="button" class="google-fallback" disabled>Google Sign-In unavailable</button>';
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

async function resendVerification() {
  try {
    const candidate = (emailInput.value || forgotEmail.value || "").trim();
    await request("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: candidate, ...antiBotMeta() })
    });
    showOk("If your account exists and is unverified, verification email was resent.");
  } catch (error) {
    showError(error.message);
  }
}

async function consumeVerifyToken(token) {
  try {
    await request("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    showOk("Email verified. Redirecting...");
    cleanUrlParams();
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  } catch (error) {
    showError(error.message);
    cleanUrlParams();
    setMode("login");
  }
}

async function bootstrap() {
  authStartedAt.value = String(Date.now());
  setMode("login");

  toLogin.addEventListener("click", () => setMode("login"));
  toRegister.addEventListener("click", () => setMode("register"));
  forgotBtn.addEventListener("click", () => {
    forgotPanel.hidden = !forgotPanel.hidden;
  });
  resendBtn.addEventListener("click", resendVerification);
  forgotSendBtn.addEventListener("click", sendForgotPassword);
  authForm.addEventListener("submit", submitAuth);

  if (resetTokenFromUrl) {
    setMode("reset");
    resetTokenInput.value = resetTokenFromUrl;
    cleanUrlParams();
  }

  if (verifyTokenFromUrl) {
    await consumeVerifyToken(verifyTokenFromUrl);
    return;
  }

  try {
    const me = await request("/api/auth/me");
    if (me.user && !resetTokenFromUrl) {
      window.location.href = "/";
      return;
    }
  } catch {
    // ignore
  }

  try {
    const cfg = await request("/api/auth/google-config");
    if (cfg.enabled && cfg.clientId) {
      initGoogle(cfg.clientId);
      return;
    }
    renderGoogleFallback();
    setGoogleState("Google sign-in is currently unavailable on this deployment.", "error");
  } catch {
    renderGoogleFallback();
    setGoogleState("Could not load Google auth configuration.", "error");
  }
}

bootstrap();
