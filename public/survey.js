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
    submit: "Submit response",
    success: "Response submitted successfully.",
    inactiveTitle: "Survey is currently inactive",
    inactiveLead: "This form is not accepting responses now.",
    cannotOpen: "Cannot open survey"
  },
  ru: {
    invalidLink: "Некорректная ссылка анкеты",
    selectRating: "Выберите оценку",
    selectOption: "Выберите вариант",
    submit: "Отправить ответ",
    success: "Ответ успешно отправлен.",
    inactiveTitle: "Анкета сейчас неактивна",
    inactiveLead: "Сейчас форма не принимает ответы.",
    cannotOpen: "Невозможно открыть анкету"
  },
  kz: {
    invalidLink: "Сауалнама сілтемесі жарамсыз",
    selectRating: "Бағаны таңдаңыз",
    selectOption: "Нұсқаны таңдаңыз",
    submit: "Жауап жіберу",
    success: "Жауап сәтті жіберілді.",
    inactiveTitle: "Сауалнама қазір белсенді емес",
    inactiveLead: "Бұл форма қазір жауап қабылдамайды.",
    cannotOpen: "Сауалнаманы ашу мүмкін емес"
  }
};

function t(key) {
  return i18n[lang]?.[key] || i18n.en[key] || key;
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

function buildForm(survey, questions) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<h2>${escapeHtml(survey.title)}</h2><p>${escapeHtml(survey.description || "")}</p>`;
  const form = document.createElement("form");
  form.className = "card";
  form.style.marginTop = "14px";

  questions.forEach((question) => {
    const row = document.createElement("div");
    row.className = "form-row";
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
      [1, 2, 3, 4, 5].forEach((v) => select.appendChild(new Option(String(v), String(v))));
      row.appendChild(select);
    } else if (question.type === "single") {
      const select = document.createElement("select");
      select.name = key;
      select.appendChild(new Option(t("selectOption"), ""));
      (question.options || []).forEach((option) => select.appendChild(new Option(option, option)));
      row.appendChild(select);
    } else {
      const optWrap = document.createElement("div");
      optWrap.className = "options";
      (question.options || []).forEach((option) => {
        const label = document.createElement("label");
        label.className = "inline-check";
        const check = document.createElement("input");
        check.type = "checkbox";
        check.name = key;
        check.value = option;
        label.appendChild(check);
        label.appendChild(document.createTextNode(option));
        optWrap.appendChild(label);
      });
      row.appendChild(optWrap);
    }
    form.appendChild(row);
  });

  const submit = document.createElement("button");
  submit.className = "btn";
  submit.type = "submit";
  submit.textContent = t("submit");
  form.appendChild(submit);

  const status = document.createElement("p");
  status.className = "status";
  form.appendChild(status);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
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

    try {
      await request(`/api/surveys/${survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });
      status.textContent = t("success");
      status.style.color = "#166534";
      submit.disabled = true;
    } catch (error) {
      status.textContent = error.message;
      status.style.color = "#b91c1c";
    }
  });

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
    if (!data.active) {
      surveyCard.innerHTML = `<h2>${t("inactiveTitle")}</h2><p>${t("inactiveLead")}</p>`;
      return;
    }
    surveyCard.innerHTML = "";
    surveyCard.appendChild(buildForm(data.survey, data.questions || []));
  } catch (error) {
    surveyCard.innerHTML = `<h2>${t("cannotOpen")}</h2><p>${escapeHtml(error.message)}</p>`;
  }
}

bootstrap();
