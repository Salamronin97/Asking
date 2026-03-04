(function (root, factory) {
  const templates = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = templates;
  }
  root.ASKING_TEMPLATES = templates;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const templates = {
    feedback: {
      title: "Оценка сервиса",
      description: "Быстрый шаблон для сбора отзывов о качестве обслуживания.",
      pages: [
        {
          title: "Оценка",
          questions: [
            {
              type: "rating",
              title: "Оцените качество обслуживания",
              required: true,
              options: []
            },
            {
              type: "text",
              title: "Комментарий",
              required: false,
              options: []
            }
          ]
        }
      ]
    },
    education: {
      title: "Обратная связь по обучению",
      description: "Шаблон для школ, колледжей и учебных курсов.",
      pages: [
        {
          title: "Качество обучения",
          questions: [
            {
              type: "rating",
              title: "Оцените качество учебной программы",
              required: true,
              options: []
            },
            {
              type: "single",
              title: "Насколько понятна подача материала?",
              required: true,
              options: [
                { text: "Полностью понятна" },
                { text: "В целом понятна" },
                { text: "Есть сложные темы" },
                { text: "Нужны доработки" }
              ]
            },
            {
              type: "text",
              title: "Что стоит улучшить в обучении?",
              required: false,
              options: []
            }
          ]
        }
      ]
    },
    hr: {
      title: "Вовлеченность команды",
      description: "Опрос сотрудников о процессах, атмосфере и мотивации.",
      pages: [
        {
          title: "Внутренние процессы",
          questions: [
            {
              type: "rating",
              title: "Оцените уровень взаимодействия в команде",
              required: true,
              options: []
            },
            {
              type: "multiple",
              title: "Что сильнее всего влияет на вашу мотивацию?",
              required: true,
              options: [
                { text: "Интересные задачи" },
                { text: "Условия работы" },
                { text: "Рост и обучение" },
                { text: "Командная культура" }
              ]
            },
            {
              type: "text",
              title: "Какие изменения вы предлагаете?",
              required: false,
              options: []
            }
          ]
        }
      ]
    },
    marketing: {
      title: "Маркетинговый опрос",
      description: "Шаблон для проверки каналов и интересов аудитории.",
      pages: [
        {
          title: "Клиентские инсайты",
          questions: [
            {
              type: "single",
              title: "Как вы узнали о нас?",
              required: true,
              options: [
                { text: "Поиск" },
                { text: "Соцсети" },
                { text: "Рекомендация" },
                { text: "Реклама" }
              ]
            },
            {
              type: "select",
              title: "Какая категория продукта вам интереснее?",
              required: true,
              options: [
                { text: "Базовый" },
                { text: "Профессиональный" },
                { text: "Корпоративный" }
              ]
            },
            {
              type: "text",
              title: "Чего вам не хватает в текущем решении?",
              required: false,
              options: []
            }
          ]
        }
      ]
    },
    service: {
      title: "Оценка клиентского сервиса",
      description: "Шаблон для анализа качества поддержки и обслуживания.",
      pages: [
        {
          title: "После обращения",
          questions: [
            {
              type: "rating",
              title: "Оцените скорость обработки обращения",
              required: true,
              options: []
            },
            {
              type: "single",
              title: "Решили ли вашу задачу?",
              required: true,
              options: [
                { text: "Да, полностью" },
                { text: "Частично" },
                { text: "Нет" }
              ]
            },
            {
              type: "text",
              title: "Что нам улучшить в сервисе?",
              required: false,
              options: []
            }
          ]
        }
      ]
    },
    events: {
      title: "Обратная связь по мероприятию",
      description: "Шаблон для оценки событий и активности участников.",
      pages: [
        {
          title: "После мероприятия",
          questions: [
            {
              type: "rating",
              title: "Как вы оцениваете мероприятие в целом?",
              required: true,
              options: []
            },
            {
              type: "multiple",
              title: "Что понравилось больше всего?",
              required: false,
              options: [
                { text: "Программа" },
                { text: "Спикеры" },
                { text: "Организация" },
                { text: "Нетворкинг" }
              ]
            },
            {
              type: "text",
              title: "Ваши пожелания к следующему событию",
              required: false,
              options: []
            }
          ]
        }
      ]
    },
    voting: {
      title: "Голосование по инициативам",
      description: "Шаблон для быстрого выбора приоритетного решения.",
      pages: [
        {
          title: "Голосование",
          questions: [
            {
              type: "single",
              title: "Выберите приоритетную инициативу",
              required: true,
              options: [
                { text: "Инициатива A" },
                { text: "Инициатива B" },
                { text: "Инициатива C" }
              ]
            },
            {
              type: "text",
              title: "Комментарий к вашему выбору",
              required: false,
              options: []
            }
          ]
        }
      ]
    }
  };

  // Алиасы для совместимости со старыми ссылками ?template=event / ?template=vote
  templates.event = templates.events;
  templates.vote = templates.voting;

  return templates;
});
