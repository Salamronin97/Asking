const state = {
  editingSurveyId: null,
  filters: {
    status: "",
    q: ""
  }
};

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "Request failed");
      error.payload = data;
      throw error;
    }
    return data;
  },
  getDashboard() {
    return this.request("/api/dashboard");
  },
  getSurveys(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.q) query.set("q", params.q);
    return this.request(`/api/surveys${query.toString() ? `?${query.toString()}` : ""}`);
  },
  getSurvey(id) {
    return this.request(`/api/surveys/${id}`);
  },
  createSurvey(payload) {
    return this.request("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  updateSurvey(id, payload) {
    return this.request(`/api/surveys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  publishSurvey(id) {
    return this.request(`/api/surveys/${id}/publish`, { method: "POST" });
  },
  archiveSurvey(id) {
    return this.request(`/api/surveys/${id}/archive`, { method: "POST" });
  },
  deleteSurvey(id) {
    return this.request(`/api/surveys/${id}`, { method: "DELETE" });
  },
  respond(id, payload) {
    return this.request(`/api/surveys/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },
  getResults(id) {
    return this.request(`/api/surveys/${id}/results`);
  }
};

const questionTypes = [
  { value: "text", label: "Текст" },
  { value: "single", label: "Одиночный выбор" },
  { value: "multi", label: "Мультивыбор" },
  { value: "rating", label: "Рейтинг 1-5" }
];

const surveyForm = document.getElementById("surveyForm");
const questionsWrap = document.getElementById("questions");
const addQuestionBtn = document.getElementById("addQuestion");
const builderStatus = document.getElementById("builderStatus");
const metricsWrap = document.getElementById("metrics");
const recentSurveysWrap = document.getElementById("recentSurveys");
const surveyList = document.getElementById("surveyList");
const resultsWrap = document.getElementById("results");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalClose = document.getElementById("modalClose");

let questionCounter = 0;

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ru-RU");
}

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function toIsoFromLocal(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function badgeClass(status) {
  if (status === "published") return "badge badge--published";
  if (status === "archived") return "badge badge--archived";
  return "badge badge--draft";
}

function statusLabel(status) {
  if (status === "published") return "published";
  if (status === "archived") return "archived";
  return "draft";
}

function setStatus(message, isError = false) {
  builderStatus.textContent = message;
  builderStatus.style.color = isError ? "#b6201f" : "#c33f17";
}

function createOptionInput(value = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Вариант ответа";
  input.value = value;
  return input;
}

function createQuestionBlock(question = null) {
  const questionId = questionCounter++;
  const block = document.createElement("div");
  block.className = "question";
  block.dataset.questionId = String(questionId);

  block.innerHTML = `
    <div class="row">
      <div class="form-row">
        <label>Текст вопроса</label>
        <input name="questionText" type="text" required />
      </div>
      <div class="form-row">
        <label>Тип</label>
        <select name="questionType">
          ${questionTypes.map((type) => `<option value="${type.value}">${type.label}</option>`).join("")}
        </select>
      </div>
      <div class="form-row options-box" style="display:none;">
        <label>Варианты</label>
        <div class="options"></div>
        <button type="button" class="btn btn--ghost add-option">+ Добавить вариант</button>
      </div>
      <label class="inline-check">
        <input type="checkbox" name="required" checked />
        Обязательный вопрос
      </label>
      <button type="button" class="btn btn--outline remove-question">Удалить вопрос</button>
    </div>
  `;

  const textInput = block.querySelector("input[name='questionText']");
  const typeSelect = block.querySelector("select[name='questionType']");
  const requiredInput = block.querySelector("input[name='required']");
  const optionsBox = block.querySelector(".options-box");
  const optionsWrap = block.querySelector(".options");
  const addOptionButton = block.querySelector(".add-option");

  function syncOptionsVisibility() {
    const isChoice = typeSelect.value === "single" || typeSelect.value === "multi";
    optionsBox.style.display = isChoice ? "block" : "none";
  }

  function addOption(value = "") {
    optionsWrap.appendChild(createOptionInput(value));
  }

  typeSelect.addEventListener("change", syncOptionsVisibility);
  addOptionButton.addEventListener("click", () => addOption(""));
  block.querySelector(".remove-question").addEventListener("click", () => block.remove());

  if (question) {
    textInput.value = question.text || "";
    typeSelect.value = question.type || "text";
    requiredInput.checked = !!question.required;
    if (Array.isArray(question.options)) {
      question.options.forEach((option) => addOption(option));
    }
  }

  syncOptionsVisibility();
  return block;
}

function addQuestion(question = null) {
  questionsWrap.appendChild(createQuestionBlock(question));
}

function resetBuilder() {
  state.editingSurveyId = null;
  surveyForm.reset();
  questionsWrap.innerHTML = "";
  addQuestion();
}

function collectSurveyPayload() {
  const formData = new FormData(surveyForm);
  const questions = Array.from(questionsWrap.querySelectorAll(".question")).map((block, index) => {
    const options = Array.from(block.querySelectorAll(".options input"))
      .map((input) => input.value.trim())
      .filter(Boolean);

    return {
      text: block.querySelector("input[name='questionText']").value.trim(),
      type: block.querySelector("select[name='questionType']").value,
      required: block.querySelector("input[name='required']").checked,
      options,
      order: index
    };
  });

  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    audience: String(formData.get("audience") || "").trim(),
    startsAt: toIsoFromLocal(String(formData.get("startsAt") || "")),
    endsAt: toIsoFromLocal(String(formData.get("endsAt") || "")),
    allowMultipleResponses: formData.get("allowMultipleResponses") === "on",
    questions
  };
}

function openModal(contentNode) {
  modalBody.innerHTML = "";
  modalBody.appendChild(contentNode);
  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  modalBody.innerHTML = "";
}

function renderMetrics(metrics) {
  metricsWrap.innerHTML = "";
  const cards = [
    ["Всего анкет", metrics.totalSurveys],
    ["Опубликованных", metrics.publishedSurveys],
    ["Активных", metrics.activeSurveys],
    ["Всего ответов", metrics.totalResponses]
  ];

  cards.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "metric";
    card.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    metricsWrap.appendChild(card);
  });
}

function renderRecentSurveys(items) {
  recentSurveysWrap.innerHTML = "";
  if (!items.length) {
    recentSurveysWrap.innerHTML = "<div class='recent-item'>Анкет пока нет</div>";
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "recent-item";
    row.innerHTML = `
      <strong>${item.title}</strong>
      <span>${statusLabel(item.status)}</span>
    `;
    recentSurveysWrap.appendChild(row);
  });
}

async function loadDashboard() {
  const data = await api.getDashboard();
  renderMetrics(data.metrics);
  renderRecentSurveys(data.recentSurveys || []);
}

function buildResponseForm(survey, questions) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <h3>${survey.title}</h3>
    <p>${survey.description || ""}</p>
  `;

  const form = document.createElement("form");
  form.className = "card";
  form.style.marginTop = "10px";

  questions.forEach((question) => {
    const block = document.createElement("div");
    block.className = "form-row";
    block.innerHTML = `<label>${question.text}${question.required ? " *" : ""}</label>`;

    if (question.type === "text") {
      const input = document.createElement("textarea");
      input.name = `q_${question.id}`;
      block.appendChild(input);
    } else if (question.type === "rating") {
      const select = document.createElement("select");
      select.name = `q_${question.id}`;
      select.appendChild(new Option("Выберите оценку", ""));
      [1, 2, 3, 4, 5].forEach((value) => select.appendChild(new Option(String(value), String(value))));
      block.appendChild(select);
    } else if (question.type === "single") {
      const select = document.createElement("select");
      select.name = `q_${question.id}`;
      select.appendChild(new Option("Выберите вариант", ""));
      question.options.forEach((value) => select.appendChild(new Option(value, value)));
      block.appendChild(select);
    } else if (question.type === "multi") {
      const multiWrap = document.createElement("div");
      multiWrap.className = "options";
      question.options.forEach((value) => {
        const label = document.createElement("label");
        label.className = "inline-check";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = `q_${question.id}`;
        checkbox.value = value;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(value));
        multiWrap.appendChild(label);
      });
      block.appendChild(multiWrap);
    }

    form.appendChild(block);
  });

  const submit = document.createElement("button");
  submit.className = "btn";
  submit.type = "submit";
  submit.textContent = "Отправить ответ";
  form.appendChild(submit);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = { answers: [] };

    questions.forEach((question) => {
      const key = `q_${question.id}`;
      if (question.type === "multi") {
        const values = Array.from(form.querySelectorAll(`input[name='${key}']:checked`)).map((node) => node.value);
        if (values.length) payload.answers.push({ questionId: question.id, value: values });
      } else {
        const field = form.querySelector(`[name='${key}']`);
        const value = field ? String(field.value || "").trim() : "";
        if (value) payload.answers.push({ questionId: question.id, value });
      }
    });

    try {
      await api.respond(survey.id, payload);
      submit.textContent = "Ответ сохранен";
      submit.disabled = true;
      await loadDashboard();
      await loadResults(survey.id);
      await loadSurveys();
    } catch (error) {
      alert(error.message || "Ошибка при отправке ответа");
    }
  });

  wrapper.appendChild(form);
  return wrapper;
}

function fillBuilderForEdit(survey, questions) {
  state.editingSurveyId = survey.id;
  surveyForm.title.value = survey.title || "";
  surveyForm.description.value = survey.description || "";
  surveyForm.audience.value = survey.audience || "";
  surveyForm.startsAt.value = toDateTimeLocalValue(survey.starts_at);
  surveyForm.endsAt.value = toDateTimeLocalValue(survey.ends_at);
  surveyForm.allowMultipleResponses.checked = survey.allow_multiple_responses === 1;

  questionsWrap.innerHTML = "";
  questions.forEach((question) => addQuestion(question));
  setStatus(`Режим редактирования: #${survey.id}`);
  document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
}

function renderSurveyCard(survey) {
  const card = document.createElement("article");
  card.className = "survey-card";
  card.innerHTML = `
    <div class="survey-card__top">
      <div>
        <h3>${survey.title}</h3>
        <p>${survey.description || "Без описания"}</p>
      </div>
      <span class="${badgeClass(survey.status)}">${statusLabel(survey.status)}</span>
    </div>
    <div class="meta">
      <span>Аудитория: ${survey.audience || "не указана"}</span>
      <span>Старт: ${formatDateTime(survey.starts_at)}</span>
      <span>Финиш: ${formatDateTime(survey.ends_at)}</span>
      <span>Повторные ответы: ${survey.allow_multiple_responses ? "да" : "нет"}</span>
    </div>
    <div class="survey-card__actions"></div>
  `;

  const actions = card.querySelector(".survey-card__actions");

  const openButton = document.createElement("button");
  openButton.className = "btn btn--ghost";
  openButton.textContent = "Открыть анкету";
  openButton.addEventListener("click", async () => {
    const details = await api.getSurvey(survey.id);
    openModal(buildResponseForm(details.survey, details.questions));
  });
  actions.appendChild(openButton);

  const resultsButton = document.createElement("button");
  resultsButton.className = "btn btn--outline";
  resultsButton.textContent = "Результаты";
  resultsButton.addEventListener("click", async () => {
    await loadResults(survey.id);
    document.getElementById("analytics").scrollIntoView({ behavior: "smooth" });
  });
  actions.appendChild(resultsButton);

  const exportButton = document.createElement("a");
  exportButton.className = "btn btn--ghost";
  exportButton.href = `/api/surveys/${survey.id}/export.csv`;
  exportButton.textContent = "Экспорт CSV";
  actions.appendChild(exportButton);

  if (survey.status === "draft") {
    const editButton = document.createElement("button");
    editButton.className = "btn btn--ghost";
    editButton.textContent = "Редактировать";
    editButton.addEventListener("click", async () => {
      const details = await api.getSurvey(survey.id);
      fillBuilderForEdit(details.survey, details.questions);
    });
    actions.appendChild(editButton);

    const publishButton = document.createElement("button");
    publishButton.className = "btn";
    publishButton.textContent = "Опубликовать";
    publishButton.addEventListener("click", async () => {
      await api.publishSurvey(survey.id);
      await refreshAll();
    });
    actions.appendChild(publishButton);
  }

  if (survey.status === "published") {
    const archiveButton = document.createElement("button");
    archiveButton.className = "btn btn--outline";
    archiveButton.textContent = "В архив";
    archiveButton.addEventListener("click", async () => {
      await api.archiveSurvey(survey.id);
      await refreshAll();
    });
    actions.appendChild(archiveButton);
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn--danger";
  deleteButton.textContent = "Удалить";
  deleteButton.addEventListener("click", async () => {
    const confirmed = window.confirm(`Удалить анкету "${survey.title}"?`);
    if (!confirmed) return;
    await api.deleteSurvey(survey.id);
    await refreshAll();
  });
  actions.appendChild(deleteButton);

  return card;
}

async function loadSurveys() {
  const data = await api.getSurveys(state.filters);
  surveyList.innerHTML = "";

  if (!data.surveys.length) {
    surveyList.innerHTML = "<div class='card'>Анкеты не найдены.</div>";
    return;
  }

  data.surveys.forEach((survey) => surveyList.appendChild(renderSurveyCard(survey)));
}

function renderTrend(trend) {
  if (!trend.length) return "<p>Ответов пока нет.</p>";

  const max = Math.max(...trend.map((item) => Number(item.count || 0)), 1);

  return trend
    .map((item) => {
      const count = Number(item.count || 0);
      const percent = Math.round((count / max) * 100);
      return `
        <div class="result-row">
          <div class="result-head"><span>${item.day}</span><strong>${count}</strong></div>
          <div class="track"><div style="width:${percent}%"></div></div>
        </div>
      `;
    })
    .join("");
}

function renderQuestionResult(result) {
  if (result.type === "rating") {
    return `
      <p>Средний рейтинг: <strong>${result.average || 0}</strong> / 5</p>
      <p>Ответов: ${result.total}</p>
    `;
  }

  if (result.type === "text") {
    if (!result.samples.length) return "<p>Текстовых ответов пока нет.</p>";
    return `<div>${result.samples.slice(0, 8).map((item) => `<div class='result-row'><div class='card'>${item}</div></div>`).join("")}</div>`;
  }

  const entries = Object.entries(result.counts || {});
  if (!entries.length) return "<p>Ответов пока нет.</p>";

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => {
      const percent = result.total ? Math.round((count / result.total) * 100) : 0;
      return `
        <div class="result-row">
          <div class="result-head"><span>${label}</span><strong>${count} (${percent}%)</strong></div>
          <div class="track"><div style="width:${percent}%"></div></div>
        </div>
      `;
    })
    .join("");
}

async function loadResults(surveyId) {
  const data = await api.getResults(surveyId);
  resultsWrap.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "result-card";
  summary.innerHTML = `
    <h3>${data.survey.title}</h3>
    <p>${data.survey.description || ""}</p>
    <p>Всего ответов: <strong>${data.summary.totalResponses}</strong></p>
    <p>Статус: <strong>${data.summary.active ? "активна" : "не активна"}</strong></p>
  `;
  resultsWrap.appendChild(summary);

  const trendCard = document.createElement("div");
  trendCard.className = "result-card";
  trendCard.innerHTML = `<h3>Динамика ответов</h3>${renderTrend(data.trend || [])}`;
  resultsWrap.appendChild(trendCard);

  data.results.forEach((result) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `<h3>${result.text}</h3>${renderQuestionResult(result)}`;
    resultsWrap.appendChild(card);
  });
}

async function submitSurvey(event) {
  event.preventDefault();
  const payload = collectSurveyPayload();

  try {
    if (state.editingSurveyId) {
      await api.updateSurvey(state.editingSurveyId, payload);
      setStatus(`Анкета #${state.editingSurveyId} обновлена.`);
    } else {
      const created = await api.createSurvey(payload);
      setStatus(`Анкета #${created.id} сохранена как draft.`);
    }

    resetBuilder();
    await refreshAll();
  } catch (error) {
    const fields = error.payload?.fields?.join(", ");
    setStatus(`Ошибка: ${error.message}${fields ? ` (${fields})` : ""}`, true);
  }
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadSurveys()]);
}

function wireEvents() {
  addQuestionBtn.addEventListener("click", () => addQuestion());
  surveyForm.addEventListener("submit", submitSurvey);

  statusFilter.addEventListener("change", async () => {
    state.filters.status = statusFilter.value;
    await loadSurveys();
  });

  searchInput.addEventListener("input", async () => {
    state.filters.q = searchInput.value.trim();
    await loadSurveys();
  });

  document.getElementById("startNow").addEventListener("click", () => {
    document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("quickCreate").addEventListener("click", () => {
    resetBuilder();
    document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
  });

  document.getElementById("openDemo").addEventListener("click", async () => {
    const surveys = await api.getSurveys({ status: "published" });
    if (!surveys.surveys.length) {
      alert("Нет опубликованных анкет.");
      return;
    }
    await loadResults(surveys.surveys[0].id);
    document.getElementById("analytics").scrollIntoView({ behavior: "smooth" });
  });

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
}

async function bootstrap() {
  addQuestion();
  wireEvents();
  await refreshAll();
}

bootstrap().catch((error) => {
  console.error(error);
  setStatus("Не удалось загрузить приложение", true);
});
