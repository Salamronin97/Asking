const surveyCard = document.getElementById("surveyCard");
const languageSelect = document.getElementById("languageSelect");
const surveyId = Number(window.location.pathname.split("/").pop() || 0);

const LANG_KEY = "asking-pro-lang";
let lang = ["en", "ru", "kz"].includes(localStorage.getItem(LANG_KEY)) ? localStorage.getItem(LANG_KEY) : "ru";

const i18n = {
  en: {
    invalidLink: "Invalid survey link",
    selectRating: "Select rating",
    selectOption: "Select option",
    next: "Next",
    back: "Back",
    finish: "Submit",
    success: "Response submitted successfully.",
    inactiveTitle: "Survey is currently inactive",
    inactiveLead: "This form is not accepting responses now.",
    cannotOpen: "Cannot open survey",
    progress: "Question {current} of {total}",
    previewMode: "Preview mode: this survey is not published yet."
  },
  ru: {
    invalidLink: "Некорректная ссылка на анкету",
    selectRating: "Выберите оценку",
    selectOption: "Выберите вариант",
    next: "Далее",
    back: "Назад",
    finish: "Отправить",
    success: "Ответ успешно отправлен.",
    inactiveTitle: "Анкета сейчас недоступна",
    inactiveLead: "Форма временно не принимает ответы.",
    cannotOpen: "Не удалось открыть анкету",
    progress: "Вопрос {current} из {total}",
    previewMode: "Режим предпросмотра: анкета пока не опубликована."
  },
  kz: {
    invalidLink: "Сауалнама сілтемесі қате",
    selectRating: "Бағаны таңдаңыз",
    selectOption: "Нұсқаны таңдаңыз",
    next: "Келесі",
    back: "Артқа",
    finish: "Жіберу",
    success: "Жауап сәтті жіберілді.",
    inactiveTitle: "Сауалнама қазір белсенді емес",
    inactiveLead: "Форма қазір жауап қабылдамайды.",
    cannotOpen: "Сауалнаманы ашу мүмкін болмады",
    progress: "{total} ішінен {current}-сұрақ",
    previewMode: "Алдын ала көру режимі: сауалнама әлі жарияланбаған."
  }
};

let current = 0;

function t(key) {
  return i18n[lang]?.[key] || i18n.en[key] || key;
}

function formatText(template, values) {
  return Object.keys(values).reduce((acc, key) => acc.replaceAll(`{${key}}`, values[key]), template);
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildQuestion(question) {
  const row = document.createElement("div");
  row.className = "form-row";
  row.dataset.questionId = String(question.id);
  row.innerHTML = `<label>${escapeHtml(question.text)}${question.required ? " *" : ""}</label>`;
  const key = `q_${question.id}`;

  if (question.type === "text") {
    const textarea = document.createElement("textarea");
    textarea.name = key;
    row.appendChild(textarea);
  } else if (question.type === "rating") {
    const select = document.createElement("select");
    select.name = key;
    select.appendChild(new Option(t("selectRating"), ""));
    [1, 2, 3, 4, 5].forEach((value) => select.appendChild(new Option(String(value), String(value))));
    row.appendChild(select);
  } else if (question.type === "single") {
    const select = document.createElement("select");
    select.name = key;
    select.appendChild(new Option(t("selectOption"), ""));
    (question.options || []).forEach((option) => select.appendChild(new Option(option, option)));
    row.appendChild(select);
  } else {
    const optionsWrap = document.createElement("div");
    optionsWrap.className = "options";
    (question.options || []).forEach((option) => {
      const label = document.createElement("label");
      label.className = "inline-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = key;
      input.value = option;
      label.appendChild(input);
      label.appendChild(document.createTextNode(option));
      optionsWrap.appendChild(label);
    });
    row.appendChild(optionsWrap);
  }

  return row;
}

function collectAnswers(form, questions) {
  const answers = [];
  questions.forEach((question) => {
    const key = `q_${question.id}`;
    if (question.type === "multi") {
      const values = Array.from(form.querySelectorAll(`input[name='${key}']:checked`)).map((node) => node.value);
      if (values.length) answers.push({ questionId: question.id, value: values });
    } else {
      const input = form.querySelector(`[name='${key}']`);
      const value = String(input?.value || "").trim();
      if (value) answers.push({ questionId: question.id, value });
    }
  });
  return answers;
}

function renderPagedForm(survey, questions, isPreview = false) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<h2>${escapeHtml(survey.title)}</h2><p>${escapeHtml(survey.description || "")}</p>`;

  if (isPreview) {
    const previewNote = document.createElement("p");
    previewNote.className = "status";
    previewNote.style.color = "#0f766e";
    previewNote.textContent = t("previewMode");
    wrap.appendChild(previewNote);
  }

  const progress = document.createElement("p");
  progress.className = "meta-line";
  wrap.appendChild(progress);

  const form = document.createElement("form");
  form.className = "card";
  form.style.marginTop = "12px";

  const panes = questions.map((question) => {
    const pane = document.createElement("section");
    pane.className = "wizard-pane";
    pane.appendChild(buildQuestion(question));
    form.appendChild(pane);
    return pane;
  });

  const actionRow = document.createElement("div");
  actionRow.className = "action-row";
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "btn btn--outline";
  backBtn.textContent = t("back");
  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "btn";
  nextBtn.textContent = t("next");
  const finishBtn = document.createElement("button");
  finishBtn.type = "submit";
  finishBtn.className = "btn";
  finishBtn.textContent = t("finish");
  actionRow.append(backBtn, nextBtn, finishBtn);
  form.appendChild(actionRow);

  const status = document.createElement("p");
  status.className = "status";
  form.appendChild(status);

  const renderStep = () => {
    panes.forEach((pane, index) => {
      pane.hidden = index !== current;
    });
    progress.textContent = formatText(t("progress"), {
      current: String(current + 1),
      total: String(questions.length)
    });
    backBtn.hidden = current === 0;
    nextBtn.hidden = current === questions.length - 1;
    finishBtn.hidden = current !== questions.length - 1;
  };

  backBtn.addEventListener("click", () => {
    current = Math.max(0, current - 1);
    renderStep();
  });
  nextBtn.addEventListener("click", () => {
    current = Math.min(questions.length - 1, current + 1);
    renderStep();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const answers = collectAnswers(form, questions);
      await request(`/api/surveys/${survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      status.textContent = t("success");
      status.style.color = "#166534";
      finishBtn.disabled = true;
      nextBtn.disabled = true;
      backBtn.disabled = true;
    } catch (error) {
      status.textContent = error.message;
      status.style.color = "#b91c1c";
    }
  });

  renderStep();
  wrap.appendChild(form);
  return wrap;
}

async function bootstrap() {
  languageSelect.value = lang;
  document.documentElement.lang = lang;
  languageSelect.addEventListener("change", () => {
    lang = languageSelect.value;
    localStorage.setItem(LANG_KEY, lang);
    window.location.reload();
  });

  if (!Number.isInteger(surveyId) || surveyId <= 0) {
    surveyCard.innerHTML = `<h2>${t("invalidLink")}</h2>`;
    return;
  }

  try {
    const data = await request(`/api/public/surveys/${surveyId}`);
    if (!data.active && !data.preview) {
      surveyCard.innerHTML = `<h2>${t("inactiveTitle")}</h2><p>${t("inactiveLead")}</p>`;
      return;
    }
    surveyCard.innerHTML = "";
    surveyCard.appendChild(renderPagedForm(data.survey, data.questions || [], Boolean(data.preview)));
  } catch (error) {
    surveyCard.innerHTML = `<h2>${t("cannotOpen")}</h2><p>${escapeHtml(error.message)}</p>`;
  }
}

bootstrap();
