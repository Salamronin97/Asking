const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authLead = document.getElementById("authLead");
const toLogin = document.getElementById("toLogin");
const toRegister = document.getElementById("toRegister");
const submitBtn = document.getElementById("submitBtn");
const nameRow = document.getElementById("nameRow");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordHint = document.getElementById("passwordHint");
const errorBox = document.getElementById("errorBox");
const okBox = document.getElementById("okBox");
const googleWrap = document.getElementById("googleWrap");
const googleTitle = document.getElementById("googleTitle");
const googleLead = document.getElementById("googleLead");
const googleState = document.getElementById("googleState");

let mode = "login";

function setMode(nextMode) {
  mode = nextMode;
  const isRegister = mode === "register";
  authTitle.textContent = isRegister ? "Create Account" : "Sign In";
  authLead.textContent = isRegister
    ? "Create your account to build and manage surveys."
    : "Use your email and password, or continue with Google.";
  googleTitle.textContent = isRegister ? "Register with Google" : "Google Sign-In";
  googleLead.textContent = isRegister
    ? "Create an account instantly using your Google profile."
    : "One-click sign in with your Google account.";
  submitBtn.textContent = isRegister ? "Register" : "Login";
  nameRow.hidden = !isRegister;
  nameInput.required = isRegister;
  passwordInput.autocomplete = isRegister ? "new-password" : "current-password";
  passwordHint.hidden = !isRegister;
  toLogin.classList.toggle("is-active", !isRegister);
  toRegister.classList.toggle("is-active", isRegister);
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
    const payload =
      mode === "register"
        ? {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value
          }
        : {
            email: emailInput.value.trim(),
            password: passwordInput.value
          };
    const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    await request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showOk("Success. Redirecting...");
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  } catch (error) {
    showError(error.message);
  }
}

function initGoogle(clientId) {
  if (!window.google || !clientId) return;
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
        }, 500);
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
    theme: "outline",
    shape: "rectangular"
  });
  setGoogleState("Google OAuth is enabled.", "ok");
  window.google.accounts.id.prompt();
}

async function bootstrap() {
  setMode("login");
  toLogin.addEventListener("click", () => setMode("login"));
  toRegister.addEventListener("click", () => setMode("register"));
  authForm.addEventListener("submit", submitAuth);

  try {
    const me = await request("/api/auth/me");
    if (me.user) {
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
    setGoogleState("Google sign-in is currently unavailable on this deployment.", "error");
  } catch (error) {
    setGoogleState("Could not load Google auth configuration.", "error");
  }
}

bootstrap();
