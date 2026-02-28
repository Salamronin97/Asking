const surveyForm = document.getElementById("surveyForm");
const questionsWrap = document.getElementById("questions");
const addQuestionBtn = document.getElementById("addQuestion");
const templateSelect = document.getElementById("templateSelect");
const statusNode = document.getElementById("status");
const logoutBtn = document.getElementById("logoutBtn");
const prevStepBtn = document.getElementById("prevStepBtn");
const nextStepBtn = document.getElementById("nextStepBtn");
const createBtn = document.getElementById("createBtn");
const wizardPanes = Array.from(document.querySelectorAll(".wizard-pane"));
const wizardStepButtons = Array.from(document.querySelectorAll("[data-step-btn]"));

let questionCounter = 0;
let templates = [];
let step = 1;

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }
};

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.style.color = isError ? "#b6201f" : "#c33f17";
}

function setStep(nextStep) {
  step = Math.max(1, Math.min(3, Number(nextStep)));
  wizardPanes.forEach((pane) => {
    pane.hidden = Number(pane.dataset.step) !== step;
  });
  wizardStepButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.stepBtn) === step);
  });
  prevStepBtn.disabled = step === 1;
  nextStepBtn.hidden = step === 3;
  createBtn.hidden = step !== 3;
}

function validateStep() {
  if (step === 1) {
    const title = String(new FormData(surveyForm).get("title") || "").trim();
    if (title.length < 3) {
      setStatus("Title must be at least 3 characters.", true);
      return false;
    }
  }
  if (step === 2) {
    const count = questionsWrap.querySelectorAll(".question").length;
    if (count < 1) {
      setStatus("Add at least one question.", true);
      return false;
    }
  }
  setStatus("");
  return true;
}

function addOptionInput(wrap, value = "") {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Option";
  input.value = value;
  wrap.appendChild(input);
}

function addQuestion(question = null) {
  const node = document.createElement("div");
  node.className = "question";
  node.dataset.id = String(questionCounter++);
  node.innerHTML = `
    <div class="row">
      <div class="form-row">
        <label>Question text</label>
        <input name="q_text" required />
      </div>
      <div class="form-row">
        <label>Type</label>
        <select name="q_type">
          <option value="text">Text</option>
          <option value="single">Single choice</option>
          <option value="multi">Multiple choice</option>
          <option value="rating">Rating 1-5</option>
        </select>
      </div>
      <div class="form-row options-box" style="display:none;">
        <label>Options</label>
        <div class="options"></div>
        <button type="button" class="btn btn--ghost add-option">+ Add option</button>
      </div>
      <label class="inline-check">
        <input type="checkbox" name="q_required" checked />
        Required question
      </label>
      <button type="button" class="btn btn--outline remove-question">Remove question</button>
    </div>
  `;

  const text = node.querySelector("input[name='q_text']");
  const type = node.querySelector("select[name='q_type']");
  const required = node.querySelector("input[name='q_required']");
  const optionsBox = node.querySelector(".options-box");
  const options = node.querySelector(".options");
  const addOption = node.querySelector(".add-option");

  const sync = () => {
    const isChoice = type.value === "single" || type.value === "multi";
    optionsBox.style.display = isChoice ? "block" : "none";
    if (isChoice && options.children.length < 2) {
      if (!options.children.length) {
        addOptionInput(options, "Option 1");
        addOptionInput(options, "Option 2");
      } else {
        addOptionInput(options, "Option 2");
      }
    }
  };

  type.addEventListener("change", sync);
  addOption.addEventListener("click", () => addOptionInput(options));
  node.querySelector(".remove-question").addEventListener("click", () => node.remove());

  if (question) {
    text.value = question.text || "";
    type.value = question.type || "text";
    required.checked = question.required !== false;
    if (Array.isArray(question.options) && question.options.length) {
      options.innerHTML = "";
      question.options.forEach((value) => addOptionInput(options, value));
    }
  }
  sync();
  questionsWrap.appendChild(node);
}

function collectPayload() {
  const formData = new FormData(surveyForm);
  const questions = Array.from(questionsWrap.querySelectorAll(".question")).map((q, idx) => ({
    text: q.querySelector("input[name='q_text']").value.trim(),
    type: q.querySelector("select[name='q_type']").value,
    required: q.querySelector("input[name='q_required']").checked,
    options: Array.from(q.querySelectorAll(".options input"))
      .map((n) => n.value.trim())
      .filter(Boolean),
    order: idx
  }));

  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    audience: String(formData.get("audience") || "").trim(),
    startsAt: formData.get("startsAt") ? new Date(String(formData.get("startsAt"))).toISOString() : null,
    endsAt: formData.get("endsAt") ? new Date(String(formData.get("endsAt"))).toISOString() : null,
    allowMultipleResponses: formData.get("allowMultipleResponses") === "on",
    questions
  };
}

function fillTemplateSelect() {
  templateSelect.innerHTML = "<option value=''>Select template</option>";
  templates.forEach((tpl) => {
    const option = document.createElement("option");
    option.value = tpl.key;
    option.textContent = tpl.title;
    templateSelect.appendChild(option);
  });
}

async function bootstrap() {
  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }

  addQuestion();
  setStep(1);

  addQuestionBtn.addEventListener("click", () => addQuestion());
  prevStepBtn.addEventListener("click", () => setStep(step - 1));
  nextStepBtn.addEventListener("click", () => {
    if (!validateStep()) return;
    setStep(step + 1);
  });
  wizardStepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.stepBtn);
      if (target <= step || validateStep()) setStep(target);
    });
  });

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });

  surveyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    try {
      const created = await api.request("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collectPayload())
      });
      setStatus(`Draft #${created.id} created. Publish and share from cabinet.`);
      surveyForm.reset();
      questionsWrap.innerHTML = "";
      addQuestion();
      setStep(1);
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  const tplData = await api.request("/api/templates");
  templates = tplData.templates || [];
  fillTemplateSelect();

  templateSelect.addEventListener("change", () => {
    const selected = templates.find((t) => t.key === templateSelect.value);
    if (!selected) return;
    surveyForm.title.value = selected.title || "";
    surveyForm.description.value = selected.description || "";
    surveyForm.audience.value = selected.audience || "";
    questionsWrap.innerHTML = "";
    (selected.questions || []).forEach((q) => addQuestion(q));
  });
}

bootstrap().catch(() => {
  setStatus("Failed to load create page", true);
});
