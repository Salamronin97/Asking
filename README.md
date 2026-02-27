# Asking Pro

Профессиональная full-stack платформа для создания интерактивных анкет и голосований пользователей.

## Что реализовано

- Конструктор анкет с типами вопросов: `text`, `single`, `multi`, `rating`
- Управление жизненным циклом анкеты: `draft`, `published`, `archived`
- Ограничение повторных ответов (по умолчанию)
- Поиск и фильтрация анкет
- Дашборд KPI: количество анкет, активные кампании, ответы
- Аналитика по вопросам + динамика ответов
- Экспорт ответов в CSV
- Demo-анкета с предзаполненными ответами при первом запуске
- Отдельная страница авторизации: `/auth`
- Регистрация и вход с сохранением аккаунта в БД
- Google вход (через Google Account Chooser) при наличии `GOOGLE_CLIENT_ID`
- Создание/управление анкетами только для авторизованных пользователей

## Технологии

- Backend: Node.js + Express + SQLite
- Frontend: Vanilla JS + HTML + CSS
- Deploy: Docker + Railway

## Локальный запуск

```bash
npm install
npm run dev
```

Открой: `http://localhost:3000`

## Переменные окружения

- `GOOGLE_CLIENT_ID` — OAuth Client ID для входа через Google (опционально).

## Деплой на Railway

1. Залить репозиторий на GitHub
2. В Railway: `New Project` -> `Deploy from GitHub repo`
3. Выбрать репозиторий и подтвердить
4. Railway подхватит `railway.json` + `Dockerfile`

## Важные эндпоинты

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/surveys`
- `POST /api/surveys`
- `PUT /api/surveys/:id`
- `POST /api/surveys/:id/publish`
- `POST /api/surveys/:id/archive`
- `DELETE /api/surveys/:id`
- `POST /api/surveys/:id/respond`
- `GET /api/surveys/:id/results`
- `GET /api/surveys/:id/export.csv`
