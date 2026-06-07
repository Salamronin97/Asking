const refs = {
  form: document.getElementById("contactAuthorForm"),
  nameInput: document.getElementById("contactNameInput"),
  emailInput: document.getElementById("contactEmailInput"),
  topicInput: document.getElementById("contactTopicInput"),
  typeInput: document.getElementById("contactTypeInput"),
  messageInput: document.getElementById("contactMessageInput"),
  messageCounter: document.getElementById("contactMessageCounter"),
  pageUrlCheck: document.getElementById("contactPageUrlCheck"),
  websiteTrap: document.getElementById("contactWebsiteTrap"),
  submitBtn: document.getElementById("contactSubmitBtn"),
  mailtoBtn: document.getElementById("contactMailtoBtn"),
  status: document.getElementById("contactStatus"),
  topicButtons: Array.from(document.querySelectorAll("[data-topic-preset]"))
};

async function apiRequest(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

function setStatus(message, isError = false) {
  if (!refs.status) return;
  refs.status.textContent = message || "";
  refs.status.style.color = isError ? "#b91c1c" : "#0f766e";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function typeLabel(value) {
  const labels = {
    bug: "Ошибка",
    idea: "Предложение",
    question: "Вопрос",
    account: "Доступ или аккаунт",
    other: "Другое"
  };
  return labels[value] || labels.other;
}

function buildMailtoLink() {
  const subject = refs.topicInput.value.trim() || "Asking: вопрос по проекту";
  const lines = [];
  if (refs.nameInput.value.trim()) lines.push(`Имя: ${refs.nameInput.value.trim()}`);
  if (refs.emailInput.value.trim()) lines.push(`Email: ${refs.emailInput.value.trim()}`);
  lines.push(`Тип: ${typeLabel(refs.typeInput?.value || "other")}`);
  if (refs.pageUrlCheck.checked) lines.push(`Страница: ${window.location.href}`);
  if (refs.messageInput.value.trim()) {
    lines.push("");
    lines.push(refs.messageInput.value.trim());
  } else {
    lines.push("");
    lines.push("Опишите ваш вопрос");
  }
  const body = lines.join("\n");
  const params = new URLSearchParams({ subject, body });
  return `mailto:arabragduani@gmail.com?${params.toString()}`;
}

function syncMailtoLink() {
  if (!refs.mailtoBtn) return;
  refs.mailtoBtn.setAttribute("href", buildMailtoLink());
}

function updateMessageCounter() {
  if (!refs.messageCounter || !refs.messageInput) return;
  const length = refs.messageInput.value.length;
  refs.messageCounter.textContent = `${length} / 5000`;
  refs.messageCounter.classList.toggle("is-warning", length > 4400);
}

function applyTopicPreset(topic) {
  refs.topicInput.value = topic;
  if (refs.typeInput) {
    const normalized = topic.toLowerCase();
    if (normalized.includes("проблем")) refs.typeInput.value = "bug";
    else if (normalized.includes("иде")) refs.typeInput.value = "idea";
    else refs.typeInput.value = "question";
  }
  if (!refs.messageInput.value.trim()) {
    if (topic.toLowerCase().includes("проблем")) {
      refs.messageInput.value = "Что произошло:\n\nКак повторить:\n\nОжидаемый результат:";
    } else if (topic.toLowerCase().includes("иде")) {
      refs.messageInput.value = "Что хочется улучшить:\n\nЗачем это нужно:\n\nКак это должно работать:";
    } else {
      refs.messageInput.value = "Вопрос:\n\nЧто уже пробовали:";
    }
  }
  updateMessageCounter();
  syncMailtoLink();
  refs.messageInput.focus();
}

async function submitForm(event) {
  event.preventDefault();
  const name = refs.nameInput.value.trim();
  const email = refs.emailInput.value.trim().toLowerCase();
  const topic = refs.topicInput.value.trim();
  const type = refs.typeInput?.value || "other";
  const message = refs.messageInput.value.trim();
  const pageUrl = refs.pageUrlCheck.checked ? window.location.href : "";
  const website = refs.websiteTrap.value.trim();

  if (!name || name.length < 2) {
    setStatus("Введите имя минимум из 2 символов.", true);
    return;
  }
  if (!isValidEmail(email)) {
    setStatus("Проверьте email.", true);
    return;
  }
  if (!message || message.length < 10) {
    setStatus("Сообщение должно содержать минимум 10 символов.", true);
    return;
  }

  const enrichedMessage = [
    `Тип обращения: ${typeLabel(type)}`,
    "",
    message
  ].filter(Boolean).join("\n");

  try {
    refs.submitBtn.disabled = true;
    setStatus("Отправляем сообщение...");
    await apiRequest("/api/support/contact-author", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, topic, message: enrichedMessage, pageUrl, website })
    });
    setStatus("Сообщение отправлено. Спасибо, скоро вернемся с ответом.");
    refs.form.reset();
    refs.pageUrlCheck.checked = true;
    updateMessageCounter();
    syncMailtoLink();
  } catch (error) {
    setStatus(error.message || "Не удалось отправить сообщение.", true);
  } finally {
    refs.submitBtn.disabled = false;
  }
}

function bindEvents() {
  refs.form?.addEventListener("submit", submitForm);
  [refs.nameInput, refs.emailInput, refs.topicInput, refs.typeInput, refs.messageInput, refs.pageUrlCheck].forEach((node) => {
    node?.addEventListener("input", () => {
      updateMessageCounter();
      syncMailtoLink();
    });
    node?.addEventListener("change", syncMailtoLink);
  });
  refs.topicButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTopicPreset(String(button.dataset.topicPreset || ""));
    });
  });
  refs.mailtoBtn?.addEventListener("click", (event) => {
    const href = buildMailtoLink();
    refs.mailtoBtn.setAttribute("href", href);
    try {
      window.location.assign(href);
    } catch {
      // Anchor navigation remains as a fallback.
    }
  });
  updateMessageCounter();
  syncMailtoLink();
}

(async function bootstrap() {
  const url = new URL(window.location.href);
  const topicFromQuery = url.searchParams.get("topic");
  const messageFromQuery = url.searchParams.get("message");
  if (topicFromQuery) refs.topicInput.value = topicFromQuery.slice(0, 120);
  if (messageFromQuery) refs.messageInput.value = messageFromQuery.slice(0, 5000);

  try {
    const me = await apiRequest("/api/auth/me");
    if (me.user) {
      refs.nameInput.value = me.user.name || "";
      refs.emailInput.value = me.user.email || "";
    }
  } catch {
    // ignore
  } finally {
    bindEvents();
  }
})();
