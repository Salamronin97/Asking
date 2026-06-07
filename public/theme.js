(() => {
  "use strict";

  const THEME_STORAGE_KEY = "asking_theme";

  function resolveTheme(theme) {
    const preferred = String(theme || localStorage.getItem(THEME_STORAGE_KEY) || "light").trim().toLowerCase();
    if (preferred === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return preferred === "dark" ? "dark" : "light";
  }

  function applyTheme(theme, persist = true) {
    const preferred = String(theme || localStorage.getItem(THEME_STORAGE_KEY) || "light").trim().toLowerCase();
    const resolved = resolveTheme(preferred);
    document.documentElement.setAttribute("data-theme", resolved);
    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, preferred);
      } catch {}
    }
  }

  applyTheme(null, false);

  if (window.matchMedia) {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const preferred = String(localStorage.getItem(THEME_STORAGE_KEY) || "light").trim().toLowerCase();
      if (preferred === "system") applyTheme("system", false);
    };
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(handleChange);
    }
  }

  window.AskingTheme = {
    applyTheme
  };

  fetch("/api/auth/me")
    .then((response) => response.json())
    .then((data) => {
      const theme = data?.user?.theme;
      if (!theme) return;
      applyTheme(theme, true);
    })
    .catch(() => {});
})();
