const searchInput = document.getElementById("guideSearchInput");
const faqList = document.getElementById("guideFaqList");
const emptyNode = document.getElementById("guideFaqEmpty");

const LANG_KEY = "asking-pro-lang";
const SUPPORTED_LANGS = new Set(["ru", "en", "kz"]);

const guideI18n = {
  ru: {
    title: "Инструкция | Asking",
    nav: ["Инструкция", "Создать", "Кабинет", "Аккаунт"],
    heroTitle: "Инструкция по Asking",
    heroLead: "Практичный маршрут от идеи до готового отчёта: шаблон, конструктор, публикация, сбор ответов, аналитика и экспорт.",
    quickStart: "Быстрый старт",
    quickSteps: [
      "<strong>Выберите сценарий.</strong> Начните с шаблона или создайте пустую анкету.",
      "<strong>Соберите структуру.</strong> Разбейте вопросы на страницы и добавьте подсказки.",
      "<strong>Настройте запуск.</strong> Укажите пароль, лимит ответов и даты активности.",
      "<strong>Опубликуйте ссылку.</strong> Отправьте участникам или откройте QR-код из кабинета.",
      "<strong>Проверьте результат.</strong> Смотрите диаграммы, ответы и выгружайте отчёт."
    ],
    faqTitle: "FAQ",
    faqLead: "Найдите нужный раздел по ключевому слову.",
    faqSearch: "Поиск по FAQ",
    faqPlaceholder: "Экспорт, пароль, картинки, шаблоны",
    faqEmpty: "По запросу ничего не найдено. Попробуйте другое слово.",
    faq: [
      ["Как создать анкету", "Перейдите в раздел «Создать», выберите шаблон или пустой опрос, задайте название и добавьте нужные типы вопросов."],
      ["Типы вопросов", "Доступны текст, одиночный выбор, множественный выбор, рейтинг, выпадающий список и карточки с изображениями."],
      ["Публикация и доступ", "Перед публикацией проверьте название, вопросы и при необходимости включите пароль доступа, лимит ответов или даты активности."],
      ["Ссылка и сбор ответов", "Скопируйте публичную ссылку из кабинета или карточки анкеты. Ответы появляются в статистике сразу после отправки формы."],
      ["Результаты и экспорт", "В разделе результатов доступны сводка по вопросам, детальные ответы и выгрузка CSV/XLSX, в том числе для Excel."],
      ["Изображения", "Картинки можно загрузить с устройства прямо в конструкторе. На Railway они сохраняются в persistent volume, если он подключён."],
      ["Шаблоны", "Используйте готовые сценарии для образования, HR, маркетинга, сервиса, событий, здравоохранения, NPS и голосований."]
    ]
  },
  en: {
    title: "Guide | Asking",
    nav: ["Guide", "Create", "Dashboard", "Account"],
    heroTitle: "Asking Guide",
    heroLead: "A practical route from an idea to a finished report: template, builder, publishing, response collection, analytics, and export.",
    quickStart: "Quick start",
    quickSteps: [
      "<strong>Choose a scenario.</strong> Start from a template or create a blank survey.",
      "<strong>Build the structure.</strong> Split questions into pages and add helpful descriptions.",
      "<strong>Configure launch.</strong> Set a password, response limit, and active dates.",
      "<strong>Publish the link.</strong> Send it to participants or open a QR code from the dashboard.",
      "<strong>Review results.</strong> Use charts, detailed responses, and report export."
    ],
    faqTitle: "FAQ",
    faqLead: "Find the right section by keyword.",
    faqSearch: "Search FAQ",
    faqPlaceholder: "Export, password, images, templates",
    faqEmpty: "Nothing was found. Try another word.",
    faq: [
      ["How to create a survey", "Open Create, choose a template or a blank survey, set the title, and add the required question types."],
      ["Question types", "Asking supports text, single choice, multiple choice, rating, dropdown, and image-card questions."],
      ["Publishing and access", "Before publishing, check the title and questions, then enable a password, response limit, or active dates if needed."],
      ["Link and response collection", "Copy the public link from the dashboard or survey card. Responses appear in analytics immediately after submission."],
      ["Results and export", "The results section includes per-question summaries, detailed responses, and CSV/XLSX export."],
      ["Images", "Images can be uploaded from the builder. On Railway they are stored in a persistent volume when one is attached."],
      ["Templates", "Use ready-made scenarios for education, HR, marketing, service, events, healthcare, NPS, and voting."]
    ]
  },
  kz: {
    title: "Нұсқаулық | Asking",
    nav: ["Нұсқаулық", "Құру", "Кабинет", "Аккаунт"],
    heroTitle: "Asking нұсқаулығы",
    heroLead: "Идеядан дайын есепке дейінгі қысқа жол: үлгі, конструктор, жариялау, жауап жинау, аналитика және экспорт.",
    quickStart: "Жылдам бастау",
    quickSteps: [
      "<strong>Сценарий таңдаңыз.</strong> Үлгіден бастаңыз немесе бос сауалнама құрыңыз.",
      "<strong>Құрылымды жинаңыз.</strong> Сұрақтарды беттерге бөліп, түсіндірме қосыңыз.",
      "<strong>Іске қосуды баптаңыз.</strong> Құпиясөз, жауап шегі және белсенді күндерді көрсетіңіз.",
      "<strong>Сілтемені жариялаңыз.</strong> Оны қатысушыларға жіберіңіз немесе кабинеттен QR-код ашыңыз.",
      "<strong>Нәтижені тексеріңіз.</strong> Диаграммалар, жауаптар және экспортты пайдаланыңыз."
    ],
    faqTitle: "FAQ",
    faqLead: "Керек бөлімді кілт сөз арқылы табыңыз.",
    faqSearch: "FAQ іздеу",
    faqPlaceholder: "Экспорт, құпиясөз, суреттер, үлгілер",
    faqEmpty: "Сұрау бойынша ештеңе табылмады. Басқа сөзді қолданып көріңіз.",
    faq: [
      ["Сауалнаманы қалай құруға болады", "Құру бөліміне өтіп, үлгіні немесе бос сауалнаманы таңдаңыз, атауын енгізіп, сұрақ түрлерін қосыңыз."],
      ["Сұрақ түрлері", "Мәтін, бір таңдау, бірнеше таңдау, рейтинг, ашылмалы тізім және суретті карточкалар қолжетімді."],
      ["Жариялау және қолжетімділік", "Жарияламас бұрын атау мен сұрақтарды тексеріп, қажет болса құпиясөз, жауап шегі немесе күндерді қосыңыз."],
      ["Сілтеме және жауап жинау", "Жария сілтемені кабинеттен немесе сауалнама карточкасынан көшіріңіз. Жауаптар бірден статистикада көрінеді."],
      ["Нәтижелер және экспорт", "Нәтижелер бөлімінде сұрақтар бойынша қорытынды, толық жауаптар және CSV/XLSX экспорты бар."],
      ["Суреттер", "Суреттерді конструкторда құрылғыдан жүктеуге болады. Railway-де volume қосылса, олар persistent volume ішінде сақталады."],
      ["Үлгілер", "Білім, HR, маркетинг, сервис, іс-шара, медицина, NPS және дауыс беру үшін дайын үлгілерді пайдаланыңыз."]
    ]
  }
};

function getLang() {
  const value = String(localStorage.getItem(LANG_KEY) || "ru").trim().toLowerCase();
  return SUPPORTED_LANGS.has(value) ? value : "ru";
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function renderGuide() {
  const lang = getLang();
  const copy = guideI18n[lang] || guideI18n.ru;
  const navLinks = [
    document.querySelector(".topbar__actions a[href='/guide']"),
    document.querySelector(".topbar__actions a[href='/create']"),
    document.querySelector(".topbar__actions a[href='/cabinet']"),
    document.querySelector(".topbar__actions a[href='/account']")
  ];

  document.documentElement.lang = lang;
  document.title = copy.title;
  navLinks.forEach((node, index) => {
    if (node) node.textContent = copy.nav[index];
  });

  const heroTitle = document.querySelector(".guide-hero h1");
  const heroLead = document.querySelector(".guide-hero p");
  const stepsTitle = document.querySelector(".guide-steps h2");
  const stepsList = document.querySelector(".guide-steps ol");
  const faqTitle = document.querySelector(".guide-faq-head h2");
  const faqLead = document.querySelector(".guide-faq-head .lead");
  const searchLabel = document.querySelector(".guide-search span");

  if (heroTitle) heroTitle.textContent = copy.heroTitle;
  if (heroLead) heroLead.textContent = copy.heroLead;
  if (stepsTitle) stepsTitle.textContent = copy.quickStart;
  if (stepsList) stepsList.innerHTML = copy.quickSteps.map((item) => `<li>${item}</li>`).join("");
  if (faqTitle) faqTitle.textContent = copy.faqTitle;
  if (faqLead) faqLead.textContent = copy.faqLead;
  if (searchLabel) searchLabel.textContent = copy.faqSearch;
  if (searchInput) searchInput.placeholder = copy.faqPlaceholder;
  if (emptyNode) emptyNode.textContent = copy.faqEmpty;
  if (faqList) {
    faqList.innerHTML = copy.faq
      .map(([q, a], index) => `
        <details class="card guide-faq-item"${index === 0 ? " open" : ""}>
          <summary>${q}</summary>
          <p>${a}</p>
        </details>
      `)
      .join("");
  }

  applyFaqFilter();
}

function applyFaqFilter() {
  if (!faqList) return;
  const query = normalizeText(searchInput?.value || "");
  let visibleCount = 0;

  faqList.querySelectorAll(".guide-faq-item").forEach((item) => {
    const visible = !query || normalizeText(item.textContent).includes(query);
    item.hidden = !visible;
    if (query && visible) item.open = true;
    if (visible) visibleCount += 1;
  });

  if (emptyNode) emptyNode.hidden = visibleCount > 0;
}

searchInput?.addEventListener("input", applyFaqFilter);
window.addEventListener("asking:languagechange", renderGuide);
window.addEventListener("storage", (event) => {
  if (event.key === LANG_KEY) renderGuide();
});

renderGuide();
