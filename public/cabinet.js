const surveyList = document.getElementById("surveyList");
const logoutBtn = document.getElementById("logoutBtn");
const accountPasswordForm = document.getElementById("accountPasswordForm");
const accountEmail = document.getElementById("accountEmail");
const accountStatus = document.getElementById("accountStatus");
const logoutAllBtn = document.getElementById("logoutAllBtn");
const deletePassword = document.getElementById("deletePassword");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

let currentUser = null;

const api = {
  async request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

async function copyLink(id) {
  await navigator.clipboard.writeText(`${window.location.origin}/survey/${id}`);
}

function buildTable(columns, rows) {
  if (!rows.length) return "<p>No responses yet.</p>";
  const head = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<div style="overflow:auto"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderCard(survey) {
  const node = document.createElement("article");
  node.className = "survey-card";
  node.innerHTML = `
    <div class="survey-card__top">
      <div>
        <h3>${escapeHtml(survey.title)}</h3>
        <p>${escapeHtml(survey.description || "No description")}</p>
      </div>
      <span class="${survey.status === "published" ? "badge badge--published" : survey.status === "archived" ? "badge badge--archived" : "badge badge--draft"}">
        ${escapeHtml(survey.status)}
      </span>
    </div>
    <div class="meta">
      <span>Responses: ${Number(survey.responses_count || 0)}</span>
      <span>Starts: ${escapeHtml(formatDate(survey.starts_at))}</span>
      <span>Ends: ${escapeHtml(formatDate(survey.ends_at))}</span>
    </div>
    <div class="survey-card__actions"></div>
    <div class="card" style="margin-top:10px; display:none;" data-table></div>
  `;

  const actions = node.querySelector(".survey-card__actions");
  const tableWrap = node.querySelector("[data-table]");

  const openBtn = document.createElement("a");
  openBtn.className = "btn btn--ghost";
  openBtn.href = `/survey/${survey.id}`;
  openBtn.target = "_blank";
  openBtn.textContent = "Open link";
  actions.appendChild(openBtn);

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn btn--ghost";
  copyBtn.textContent = "Copy link";
  copyBtn.addEventListener("click", async () => {
    await copyLink(survey.id);
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = "Copy link"), 1000);
  });
  actions.appendChild(copyBtn);

  const tableBtn = document.createElement("button");
  tableBtn.className = "btn btn--outline";
  tableBtn.textContent = "Results table";
  tableBtn.addEventListener("click", async () => {
    if (tableWrap.style.display === "block") {
      tableWrap.style.display = "none";
      return;
    }
    const data = await api.request(`/api/surveys/${survey.id}/responses-table`);
    tableWrap.innerHTML = buildTable(data.columns || [], data.rows || []);
    tableWrap.style.display = "block";
  });
  actions.appendChild(tableBtn);

  const exportBtn = document.createElement("a");
  exportBtn.className = "btn btn--ghost";
  exportBtn.href = `/api/surveys/${survey.id}/export.csv`;
  exportBtn.textContent = "Export CSV";
  actions.appendChild(exportBtn);

  if (survey.status === "draft") {
    const publishBtn = document.createElement("button");
    publishBtn.className = "btn";
    publishBtn.textContent = "Publish";
    publishBtn.addEventListener("click", async () => {
      await api.request(`/api/surveys/${survey.id}/publish`, { method: "POST" });
      await loadSurveys();
    });
    actions.appendChild(publishBtn);
  }

  if (survey.status === "published") {
    const archiveBtn = document.createElement("button");
    archiveBtn.className = "btn btn--outline";
    archiveBtn.textContent = "Archive";
    archiveBtn.addEventListener("click", async () => {
      await api.request(`/api/surveys/${survey.id}/archive`, { method: "POST" });
      await loadSurveys();
    });
    actions.appendChild(archiveBtn);
  }

  const delBtn = document.createElement("button");
  delBtn.className = "btn btn--danger";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", async () => {
    if (!window.confirm("Delete survey?")) return;
    await api.request(`/api/surveys/${survey.id}`, { method: "DELETE" });
    await loadSurveys();
  });
  actions.appendChild(delBtn);

  return node;
}

async function loadSurveys() {
  const data = await api.request("/api/surveys?mine=1");
  surveyList.innerHTML = "";
  const surveys = data.surveys || [];
  if (!surveys.length) {
    surveyList.innerHTML = "<div class='card'>No surveys yet. Create your first one.</div>";
    return;
  }
  surveys.forEach((survey) => surveyList.appendChild(renderCard(survey)));
}

function wireAccountActions() {
  accountEmail.value = currentUser.email || "";
  accountPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(accountPasswordForm);
    try {
      await api.request("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(formData.get("currentPassword") || ""),
          newPassword: String(formData.get("newPassword") || ""),
          website: ""
        })
      });
      accountStatus.textContent = "Password updated.";
      accountPasswordForm.reset();
      accountEmail.value = currentUser.email || "";
    } catch (error) {
      accountStatus.textContent = error.message;
    }
  });

  logoutAllBtn.addEventListener("click", async () => {
    await api.request("/api/account/logout-all", { method: "POST" });
    window.location.href = "/auth";
  });

  deleteAccountBtn.addEventListener("click", async () => {
    const password = String(deletePassword.value || "");
    if (!password) return;
    if (!window.confirm("Delete account permanently?")) return;
    await api.request("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, website: "" })
    });
    window.location.href = "/auth";
  });
}

async function bootstrap() {
  const me = await api.request("/api/auth/me");
  if (!me.user) {
    window.location.href = "/auth";
    return;
  }
  currentUser = me.user;

  logoutBtn.addEventListener("click", async () => {
    await api.request("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  });

  wireAccountActions();
  await loadSurveys();
}

bootstrap().catch(() => {
  surveyList.innerHTML = "<div class='card'>Failed to load cabinet</div>";
});
