const api = {
  async getSurveys(status) {
    const url = status ? `/api/surveys?status=${encodeURIComponent(status)}` : "/api/surveys";
    const res = await fetch(url);
    return res.json();
  },
  async createSurvey(payload) {
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async publishSurvey(id) {
    const res = await fetch(`/api/surveys/${id}/publish`, { method: "POST" });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getSurvey(id) {
    const res = await fetch(`/api/surveys/${id}`);
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async respond(id, payload) {
    const res = await fetch(`/api/surveys/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getResults(id) {
    const res = await fetch(`/api/surveys/${id}/results`);
    if (!res.ok) throw await res.json();
    return res.json();
  }
};

const questionTypes = [
  { value: "text", label: "Текстовый ответ" },
  { value: "single", label: "Одиночный выбор" },
  { value: "multi", label: "Множественный выбор" },
  { value: "rating", label: "Рейтинг (1-5)" }
];

const surveyForm = document.getElementById("surveyForm");
const questionsWrap = document.getElementById("questions");
const addQuestionBtn = document.getElementById("addQuestion");
const surveyList = document.getElementById("surveyList");
const resultsWrap = document.getElementById("results");
const builderStatus = document.getElementById("builderStatus");

let questionCounter = 0;

function createQuestionBlock() {
  const id = questionCounter++;
  const block = document.createElement("div");
  block.className = "card";
  block.dataset.questionId = id;
  block.innerHTML = `
    <div class="form-row">
      <label>Вопрос</label>
      <input type="text" name="questionText" placeholder="Введите формулировку" required />
    </div>
    <div class="form-row">
      <label>Тип вопроса</label>
      <select name="questionType">
        ${questionTypes.map((t) => `<option value="${t.value}">${t.label}</option>`).join("")}
      </select>
    </div>
    <div class="form-row options-row" style="display:none;">
      <label>Варианты ответа</label>
      <div class="options"></div>
      <button type="button" class="btn btn--ghost add-option">+ Добавить вариант</button>
    </div>
    <div class="form-row">
      <label><input type="checkbox" name="required" checked /> Обязательный</label>
    </div>
    <button type="button" class="btn btn--outline remove-question">Удалить вопрос</button>
  `;

  const typeSelect = block.querySelector("select[name='questionType']");
  const optionsRow = block.querySelector(".options-row");
  const addOptionBtn = block.querySelector(".add-option");
  const optionsWrap = block.querySelector(".options");

  function syncOptionsVisibility() {
    const value = typeSelect.value;
    optionsRow.style.display = value === "single" || value === "multi" ? "grid" : "none";
  }

  typeSelect.addEventListener("change", syncOptionsVisibility);
  addOptionBtn.addEventListener("click", () => {
    const option = document.createElement("input");
    option.type = "text";
    option.placeholder = "Вариант ответа";
    optionsWrap.appendChild(option);
  });

  block.querySelector(".remove-question").addEventListener("click", () => {
    block.remove();
  });

  syncOptionsVisibility();
  return block;
}

function collectSurveyPayload() {
  const data = new FormData(surveyForm);
  const title = data.get("title");
  const description = data.get("description");

  const questions = Array.from(questionsWrap.children).map((block, idx) => {
    const text = block.querySelector("input[name='questionText']").value.trim();
    const type = block.querySelector("select[name='questionType']").value;
    const required = block.querySelector("input[name='required']").checked;
    const optionsInputs = Array.from(block.querySelectorAll(".options input")).map((i) => i.value.trim()).filter(Boolean);

    return {
      text,
      type,
      required,
      options: optionsInputs,
      order: idx
    };
  });

  return { title, description, questions };
}

async function handleCreateSurvey(evt) {
  evt.preventDefault();
  try {
    const payload = collectSurveyPayload();
    const result = await api.createSurvey(payload);
    builderStatus.textContent = `Анкета сохранена. ID: ${result.id}. Опубликуйте для запуска.`;
    surveyForm.reset();
    questionsWrap.innerHTML = "";
    addQuestion();
    await loadSurveys();
  } catch (err) {
    builderStatus.textContent = `Ошибка: ${err.error || "Не удалось создать анкету"}`;
  }
}

function addQuestion() {
  const block = createQuestionBlock();
  questionsWrap.appendChild(block);
}

function renderSurveyCard(survey) {
  const card = document.createElement("div");
  card.className = "survey-card";
  card.innerHTML = `
    <div>
      <h3>${survey.title}</h3>
      <p>${survey.description || "Без описания"}</p>
    </div>
    <div class="survey-card__actions"></div>
    <div class="survey-card__form" style="display:none;"></div>
  `;

  const actions = card.querySelector(".survey-card__actions");
  const formWrap = card.querySelector(".survey-card__form");

  const openBtn = document.createElement("button");
  openBtn.className = "btn btn--ghost";
  openBtn.textContent = "Открыть";
  openBtn.addEventListener("click", async () => {
    const { questions } = await api.getSurvey(survey.id);
    formWrap.innerHTML = "";
    formWrap.style.display = "block";
    formWrap.appendChild(buildResponseForm(survey, questions));
  });
  actions.appendChild(openBtn);

  if (survey.status === "draft") {
    const publishBtn = document.createElement("button");
    publishBtn.className = "btn";
    publishBtn.textContent = "Опубликовать";
    publishBtn.addEventListener("click", async () => {
      await api.publishSurvey(survey.id);
      await loadSurveys();
    });
    actions.appendChild(publishBtn);
  } else {
    const resultsBtn = document.createElement("button");
    resultsBtn.className = "btn btn--outline";
    resultsBtn.textContent = "Показать результаты";
    resultsBtn.addEventListener("click", async () => {
      await loadResults(survey.id);
      document.getElementById("analytics").scrollIntoView({ behavior: "smooth" });
    });
    actions.appendChild(resultsBtn);
  }

  return card;
}

function buildResponseForm(survey, questions) {
  const form = document.createElement("form");
  form.className = "card";
  form.innerHTML = `
    <h4>Ответы: ${survey.title}</h4>
    <div class="form-questions"></div>
    <button class="btn" type="submit">Отправить ответ</button>
  `;

  const questionsWrap = form.querySelector(".form-questions");

  questions.forEach((q) => {
    const block = document.createElement("div");
    block.className = "form-row";
    block.innerHTML = `<label>${q.text}${q.required ? " *" : ""}</label>`;

    if (q.type === "text") {
      const input = document.createElement("textarea");
      input.name = `q_${q.id}`;
      block.appendChild(input);
    }

    if (q.type === "rating") {
      const select = document.createElement("select");
      select.name = `q_${q.id}`;
      [1, 2, 3, 4, 5].forEach((v) => {
        const option = document.createElement("option");
        option.value = v;
        option.textContent = `${v}`;
        select.appendChild(option);
      });
      block.appendChild(select);
    }

    if (q.type === "single") {
      const select = document.createElement("select");
      select.name = `q_${q.id}`;
      q.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
      block.appendChild(select);
    }

    if (q.type === "multi") {
      const wrap = document.createElement("div");
      wrap.className = "multi-options";
      q.options.forEach((opt) => {
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.gap = "8px";
        label.style.alignItems = "center";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = `q_${q.id}`;
        input.value = opt;
        label.appendChild(input);
        label.appendChild(document.createTextNode(opt));
        wrap.appendChild(label);
      });
      block.appendChild(wrap);
    }

    questionsWrap.appendChild(block);
  });

  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    const payload = { answers: [] };
    questions.forEach((q) => {
      const key = `q_${q.id}`;
      if (q.type === "multi") {
        const checked = Array.from(form.querySelectorAll(`input[name='${key}']:checked`)).map((el) => el.value);
        if (checked.length) {
          payload.answers.push({ questionId: q.id, value: checked });
        }
      } else {
        const field = form.querySelector(`[name='${key}']`);
        const value = field ? field.value : "";
        if (value !== "") {
          payload.answers.push({ questionId: q.id, value });
        }
      }
    });

    try {
      await api.respond(survey.id, payload);
      form.querySelector("button[type='submit']").textContent = "Ответ получен";
      await loadResults(survey.id);
    } catch (err) {
      alert("Ошибка отправки ответа");
    }
  });

  return form;
}

async function loadSurveys() {
  const { surveys } = await api.getSurveys();
  surveyList.innerHTML = "";
  surveys.forEach((survey) => {
    surveyList.appendChild(renderSurveyCard(survey));
  });
}

async function loadResults(id) {
  const { survey, results } = await api.getResults(id);
  resultsWrap.innerHTML = "";

  results.forEach((q) => {
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `<h4>${q.text}</h4><div class="result-bar"></div>`;
    const bar = card.querySelector(".result-bar");

    if (q.type === "rating") {
      bar.innerHTML = `<div class="result-row"><span>Средний рейтинг</span><strong>${q.average || 0}</strong></div>`;
    } else if (q.type === "text") {
      const samples = q.samples.slice(0, 4);
      if (samples.length === 0) {
        bar.innerHTML = `<span class="muted">Ответов пока нет</span>`;
      } else {
        bar.innerHTML = samples.map((s) => `<div class="result-row"><span>${s}</span></div>`).join("");
      }
    } else {
      const entries = Object.entries(q.counts || {});
      if (entries.length === 0) {
        bar.innerHTML = `<span class="muted">Ответов пока нет</span>`;
      } else {
        entries.forEach(([label, count]) => {
          const pct = q.total ? Math.round((count / q.total) * 100) : 0;
          const row = document.createElement("div");
          row.className = "result-row";
          row.innerHTML = `
            <span>${label}</span>
            <strong>${pct}%</strong>
            <div class="result-line"><div style="width:${pct}%"></div></div>
          `;
          bar.appendChild(row);
        });
      }
    }

    resultsWrap.appendChild(card);
  });

  resultsWrap.insertAdjacentHTML(
    "afterbegin",
    `<div class="card"><h3>${survey.title}</h3><p>${survey.description || ""}</p></div>`
  );
}

function wireHeroButtons() {
  document.getElementById("heroStart").addEventListener("click", () => {
    document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("heroDemo").addEventListener("click", async () => {
    const { surveys } = await api.getSurveys("published");
    if (surveys.length) {
      await loadResults(surveys[0].id);
      document.getElementById("analytics").scrollIntoView({ behavior: "smooth" });
    } else {
      builderStatus.textContent = "Создайте и опубликуйте анкету, чтобы увидеть демо.";
      document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
    }
  });
  document.getElementById("scrollCreate").addEventListener("click", () => {
    document.getElementById("builder").scrollIntoView({ behavior: "smooth" });
  });
}

addQuestionBtn.addEventListener("click", addQuestion);

surveyForm.addEventListener("submit", handleCreateSurvey);

addQuestion();
wireHeroButtons();
loadSurveys();
