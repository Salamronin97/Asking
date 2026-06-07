(function (root, factory) {
  const templates = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = templates;
  }
  root.ASKING_TEMPLATES = templates;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  function opt(text, extra = {}) {
    return { text, ...extra };
  }

  function q(type, title, required, options = [], description = "", extra = {}) {
    return { type, title, required, options, description, ...extra };
  }

  const photos = {
    event: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=78",
    product: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=78",
    team: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1600&q=78",
    education: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=78",
    clinic: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1600&q=78",
    restaurant: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=78",
    support: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1600&q=78",
    volunteer: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=78",
    sales: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=78",
    retail: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=78",
    hotel: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=78",
    city: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=78"
  };

  function design(bgImage, bgColor = "#eef6ff", layout = "full", overlay = 20, welcome = {}) {
    return {
      bgImage,
      bgColor,
      layout,
      overlay,
      welcome: {
        coverImage: welcome.coverImage || bgImage,
        layout: welcome.layout || "image-right",
        imageOpacity: welcome.imageOpacity || 86,
        imageEnabled: welcome.imageEnabled !== false
      }
    };
  }

  function imageOptions(items) {
    return items.map((item, index) =>
      opt(item.text, {
        imageUrl: item.imageUrl || `https://picsum.photos/seed/asking-template-${index + 1}/900/560`,
        imageFit: item.imageFit || "cover",
        imageScale: item.imageScale || 100
      })
    );
  }

  function attachWelcome(template) {
    const pages = Array.isArray(template.pages) ? template.pages : [];
    if (pages[0]) {
      pages[0].design = {
        ...design(photos.product),
        ...(pages[0].design || {}),
        welcome: {
          ...design(pages[0].design?.bgImage || photos.product).welcome,
          ...(pages[0].design?.welcome || {})
        }
      };
    }
    return template;
  }

  const fullTemplates = {
    product_beta_feedback: attachWelcome({
      title: "Beta feedback продукта",
      description: "Оценка первого опыта, ценности функций, барьеров и готовности продолжить использование.",
      audience: "beta_users",
      pages: [
        {
          title: "Первое впечатление",
          design: design(photos.product, "#eef2ff", "split-right-image", 18, {
            layout: "image-right",
            imageOpacity: 88
          }),
          questions: [
            q("rating", "Насколько понятен продукт после первого запуска?", true, [], "1 - совсем непонятно, 5 - всё ясно.", { panelOpacity: 88 }),
            q("single", "Что лучше всего описывает ваш первый опыт?", true, [
              opt("Быстро понял ценность"),
              opt("Понял после изучения"),
              opt("Пока не понял, зачем это нужно"),
              opt("Столкнулся с техническими проблемами")
            ]),
            q("text", "Что вызвало первое сомнение или вопрос?", false, [], "Коротко опишите момент, где пришлось остановиться.")
          ]
        },
        {
          title: "Функции",
          design: design(photos.product, "#f8fbff", "cover-top-image", 22),
          questions: [
            q("multiple", "Какие функции кажутся наиболее ценными?", true, [
              opt("Быстрый конструктор"),
              opt("Шаблоны"),
              opt("Аналитика"),
              opt("Брендирование"),
              opt("Логика переходов"),
              opt("Экспорт")
            ]),
            q("single", "Какой функции не хватает для регулярного использования?", true, [
              opt("Интеграции"),
              opt("Командная работа"),
              opt("Больше дизайнов"),
              opt("Автоматизация рассылок"),
              opt("Пока не знаю")
            ]),
            q("single", "Выберите визуальный стиль, который ближе продукту", false, imageOptions([
              { text: "Корпоративный", imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=76" },
              { text: "Продуктовый", imageUrl: photos.product },
              { text: "Минималистичный", imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=76" },
              { text: "Креативный", imageUrl: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=76" }
            ]), "Фото-вопрос проверяет, какой визуальный язык ближе аудитории.")
          ]
        },
        {
          title: "Готовность",
          design: design(photos.sales, "#eef6ff", "split-left-image", 18),
          questions: [
            q("single", "Готовы продолжить пользоваться продуктом в течение месяца?", true, [
              opt("Да, точно"),
              opt("Скорее да"),
              opt("Пока сомневаюсь"),
              opt("Нет")
            ]),
            q("select", "Какая цена кажется оправданной?", false, [
              opt("Бесплатно / trial"),
              opt("до 1 000 ₽ в месяц"),
              opt("1 000 - 5 000 ₽ в месяц"),
              opt("5 000+ ₽ в месяц"),
              opt("Нужен корпоративный тариф")
            ]),
            q("text", "Что нужно изменить, чтобы вы рекомендовали продукт?", false)
          ]
        }
      ]
    }),

    customer_satisfaction_pro: attachWelcome({
      title: "Customer Satisfaction Pro",
      description: "Профессиональная анкета для оценки сервиса, NPS, причин недовольства и точек роста.",
      audience: "customers",
      pages: [
        {
          title: "Общая оценка",
          design: design(photos.support, "#eef6ff", "split-right-image", 16, {
            layout: "background",
            imageOpacity: 72
          }),
          questions: [
            q("single", "Порекомендуете нас коллегам или знакомым?", true, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(opt), "0 - точно нет, 10 - точно да."),
            q("rating", "Оцените качество сервиса", true),
            q("single", "Ваша основная роль", false, [
              opt("Покупатель"),
              opt("Партнёр"),
              opt("Руководитель"),
              opt("Специалист"),
              opt("Другое")
            ])
          ]
        },
        {
          title: "Детали опыта",
          design: design(photos.support, "#f8fafc", "cover-top-image", 18),
          questions: [
            q("multiple", "Что сработало хорошо?", false, [
              opt("Скорость ответа"),
              opt("Понятное объяснение"),
              opt("Вежливость"),
              opt("Решение проблемы"),
              opt("Цена"),
              opt("Удобный интерфейс")
            ]),
            q("multiple", "Что требует улучшения?", false, [
              opt("Время ожидания"),
              opt("Качество консультации"),
              opt("Прозрачность условий"),
              opt("Функциональность"),
              opt("Документы"),
              opt("Коммуникация")
            ]),
            q("text", "Опишите ситуацию, если оценка ниже ожиданий", false)
          ]
        },
        {
          title: "Следующий шаг",
          design: design(photos.sales, "#eff6ff", "center-card", 20),
          questions: [
            q("single", "Хотите, чтобы мы связались с вами по результатам ответа?", false, [
              opt("Да"),
              opt("Нет"),
              opt("Только если нужен уточняющий вопрос")
            ]),
            q("text", "Контакт для связи", false, [], "Email, телефон или удобный канал."),
            q("text", "Что одно нам стоит исправить в первую очередь?", false)
          ]
        }
      ]
    }),

    event_registration_premium: attachWelcome({
      title: "Премиальная регистрация на мероприятие",
      description: "Регистрация с профилем участника, интересами, согласием и визуальной обложкой.",
      audience: "event_attendees",
      pages: [
        {
          title: "Контакты участника",
          design: design(photos.event, "#fff7ed", "split-right-image", 18, {
            layout: "image-right",
            imageOpacity: 90
          }),
          questions: [
            q("text", "Как к вам обращаться?", true, [], "Имя и фамилия для бейджа.", { panelOpacity: 90 }),
            q("text", "Рабочий email", true, [], "На него отправим подтверждение."),
            q("select", "Город участия", true, [
              opt("Москва"),
              opt("Санкт-Петербург"),
              opt("Екатеринбург"),
              opt("Казань"),
              opt("Онлайн")
            ])
          ]
        },
        {
          title: "Интересы",
          design: design(photos.event, "#eef6ff", "cover-top-image", 24),
          questions: [
            q("single", "Формат участия", true, [
              opt("Очно"),
              opt("Онлайн"),
              opt("Еще выбираю")
            ]),
            q("multiple", "Какие треки вам интересны?", true, [
              opt("Продукт"),
              opt("Маркетинг"),
              opt("Продажи"),
              opt("AI"),
              opt("Операции"),
              opt("HR")
            ]),
            q("single", "Выберите атмосферу, которую ждете", false, imageOptions([
              { text: "Нетворкинг", imageUrl: "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=900&q=76" },
              { text: "Сцена и доклады", imageUrl: photos.event },
              { text: "Практические воркшопы", imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=76" },
              { text: "Закрытая встреча", imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=76" }
            ]))
          ]
        },
        {
          title: "Подтверждение",
          design: design(photos.event, "#f8fbff", "center-card", 18),
          questions: [
            q("single", "Согласны с правилами участия?", true, [
              opt("Да, согласен"),
              opt("Нет")
            ]),
            q("text", "Комментарий организаторам", false, [], "Особые условия, питание, вопросы по доступности.")
          ]
        }
      ]
    })
  };

  const blueprintTemplates = [
    ["employee_engagement_pulse", "Пульс вовлеченности команды", "Короткая регулярная диагностика настроения, нагрузки и коммуникации.", "employees", photos.team, "#ecfdf5", ["Атмосфера", "Рабочий процесс", "Идеи улучшения"]],
    ["onboarding_30_60_90", "Onboarding 30-60-90", "Оценка адаптации сотрудника на ключевых этапах испытательного срока.", "employees", photos.team, "#f5f3ff", ["Первые недели", "Команда", "Следующий этап"]],
    ["course_evaluation_pro", "Оценка курса", "Понятность материала, преподаватель, практика и следующий шаг обучения.", "students", photos.education, "#f0f9ff", ["Учебный опыт", "Материалы", "Итог"]],
    ["clinic_patient_experience", "Опыт пациента в клинике", "Запись, ожидание, коммуникация врача и готовность вернуться.", "patients", photos.clinic, "#ecfeff", ["Визит", "Коммуникация", "Рекомендации"]],
    ["restaurant_guest_experience", "Опыт гостя ресторана", "Атмосфера, блюда, сервис, скорость и вероятность возвращения.", "guests", photos.restaurant, "#fff7ed", ["Визит", "Еда и сервис", "Комментарий"]],
    ["support_quality_audit", "Аудит качества поддержки", "Внутренняя проверка обращений: SLA, тон, полнота решения.", "support_operations", photos.support, "#f8fafc", ["Обращение", "Ответ", "Коучинг"]],
    ["lead_qualification", "Квалификация лида", "Потребность, бюджет, сроки, роль в решении и следующий контакт.", "leads", photos.sales, "#eef6ff", ["Профиль", "Потребность", "Контакт"]],
    ["market_segmentation", "Сегментация рынка", "Профиль аудитории, сценарии покупки, критерии выбора и каналы.", "market", photos.sales, "#f8fbff", ["Профиль", "Поведение", "Сегмент"]],
    ["brand_perception", "Восприятие бренда", "Ассоциации, доверие, визуальный стиль и позиционирование.", "customers", photos.retail, "#fff1f2", ["Знание", "Ассоциации", "Визуальный выбор"]],
    ["ecommerce_checkout_audit", "Аудит checkout e-commerce", "Барьеры покупки, доверие, оплата, доставка и причины отказа.", "customers", photos.retail, "#fff7ed", ["Покупка", "Барьеры", "Оплата"]],
    ["hotel_guest_stay", "Опыт гостя отеля", "Бронирование, заселение, номер, сервис и готовность вернуться.", "guests", photos.hotel, "#f8fafc", ["Бронирование", "Проживание", "Сервис"]],
    ["nonprofit_volunteer_feedback", "Фидбек волонтеров", "Мотивация, координация, задачи и готовность участвовать снова.", "volunteers", photos.volunteer, "#eff6ff", ["Участие", "Координация", "Идеи"]],
    ["public_service_feedback", "Оценка госуслуги", "Понятность процесса, скорость, доступность и качество коммуникации.", "citizens", photos.city, "#eef2ff", ["Процесс", "Сервис", "Итог"]],
    ["training_needs_assessment", "Оценка потребности в обучении", "Навыки, пробелы, формат обучения и приоритеты развития.", "employees", photos.education, "#f0f9ff", ["Навыки", "Формат", "Приоритет"]],
    ["internal_tools_audit", "Аудит внутренних инструментов", "Удобство, скорость, барьеры и востребованные улучшения.", "employees", photos.product, "#eef6ff", ["Использование", "Проблемы", "Улучшения"]],
    ["community_event_feedback", "Фидбек community event", "Контент, нетворкинг, атмосфера и темы будущих встреч.", "community", photos.event, "#fff7ed", ["Впечатление", "Темы", "Будущее"]],
    ["pricing_research", "Исследование цены", "Восприятие ценности, willingness to pay и тарифные ограничения.", "prospects", photos.sales, "#f8fbff", ["Ценность", "Цена", "Тариф"]]
  ];

  function makeBlueprintTemplate([key, title, description, audience, photo, color, pageTitles]) {
    return attachWelcome({
      id: key,
      title,
      description,
      audience,
      pages: [
        {
          title: pageTitles[0],
          design: design(photo, color, "split-right-image", 18),
          questions: [
            q("rating", "Оцените текущий опыт в целом", true, [], "1 - плохо, 5 - отлично.", { panelOpacity: 86 }),
            q("single", "Какое утверждение ближе всего?", true, [
              opt("Опыт полностью соответствует ожиданиям"),
              opt("В целом хорошо, есть небольшие проблемы"),
              opt("Есть заметные барьеры"),
              opt("Опыт требует серьезной доработки")
            ]),
            q("text", "Что больше всего повлияло на вашу оценку?", false)
          ]
        },
        {
          title: pageTitles[1],
          design: design(photo, color, "cover-top-image", 22),
          questions: [
            q("multiple", "Какие факторы важнее всего?", true, [
              opt("Скорость"),
              opt("Понятность"),
              opt("Цена"),
              opt("Качество"),
              opt("Коммуникация"),
              opt("Надежность")
            ]),
            q("single", "Где сейчас главный риск?", true, [
              opt("Процесс"),
              opt("Интерфейс"),
              opt("Команда"),
              opt("Стоимость"),
              opt("Нет критичного риска")
            ])
          ]
        },
        {
          title: pageTitles[2],
          design: design(photo, color, "center-card", 18),
          questions: [
            q("single", "Какой следующий шаг для вас наиболее уместен?", true, [
              opt("Продолжить как есть"),
              opt("Получить консультацию"),
              opt("Дождаться улучшений"),
              opt("Рассмотреть альтернативы")
            ]),
            q("text", "Какое одно улучшение даст максимальный эффект?", false)
          ]
        }
      ]
    });
  }

  const templates = {
    ...fullTemplates
  };

  blueprintTemplates.forEach((blueprint) => {
    templates[blueprint[0]] = makeBlueprintTemplate(blueprint);
  });

  templates.registration = fullTemplates.event_registration_premium;
  templates.event_feedback = templates.community_event_feedback;
  templates.product_discovery = fullTemplates.product_beta_feedback;
  templates.hr_pulse = templates.employee_engagement_pulse;
  templates.product_beta_feedback = fullTemplates.product_beta_feedback;
  templates.customer_satisfaction = fullTemplates.customer_satisfaction_pro;
  templates.customer_satisfaction_pro = fullTemplates.customer_satisfaction_pro;
  templates.event_registration_premium = fullTemplates.event_registration_premium;
  templates.education = templates.course_evaluation_pro;
  templates.hr = templates.employee_engagement_pulse;
  templates.marketing = templates.market_segmentation;
  templates.service = templates.customer_satisfaction_pro;
  templates.events = fullTemplates.event_registration_premium;
  templates.event = templates.community_event_feedback;
  templates.voting = templates.public_service_feedback;
  templates.vote = templates.public_service_feedback;
  templates.ecommerce = templates.ecommerce_checkout_audit;
  templates.healthcare = templates.clinic_patient_experience;
  templates.nps = templates.customer_satisfaction_pro;
  templates.onboarding = templates.onboarding_30_60_90;
  templates.conference = fullTemplates.event_registration_premium;
  templates.training = templates.training_needs_assessment;
  templates.course = templates.course_evaluation_pro;
  templates.support = templates.support_quality_audit;
  templates.government = templates.public_service_feedback;
  templates.nonprofit = templates.nonprofit_volunteer_feedback;
  templates.feedback = templates.customer_satisfaction_pro;

  return templates;
});
