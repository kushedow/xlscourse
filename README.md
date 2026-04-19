# XLS Course

Одностраничное учебное приложение по Excel с тремя типами шагов:
- `theory` — теория (Markdown)
- `quiz` — тест с проверкой ответов
- `practice` — практика в таблице (Handsontable + HyperFormula)

## Запуск

Приложение статическое, сборка не нужна.

1. Откройте [index.html](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/index.html) в браузере.
2. Дождитесь загрузки шагов курса с сервера.

## Архитектура

### Структура проекта

- [index.html](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/index.html) — точка входа, инициализация Vue/Pinia/Router, рендер layout
- [api.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/api.js) — слой API и эндпоинты (`API_ENDPOINTS`)
- [store.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/store.js) — store-слой

`components/`:
- [loader-state.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/components/loader-state.js)
- [error-state.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/components/error-state.js)
- [navigation.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/components/navigation.js)
- [hamburger-menu.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/components/hamburger-menu.js)

`steps/`:
- [StepTheory.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/steps/StepTheory.js)
- [StepQuiz.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/steps/StepQuiz.js)
- [StepPractice.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/steps/StepPractice.js)

### Store

Используются два Pinia store:
- `useCourseStore` — шаги, текущий шаг, главы, проверка quiz/practice, runtime-данные таблиц
- `useUiStore` — UI-состояния (`isLoading`, `error`, `isMenuOpen`)

### Роутинг

Используется `Vue Router` в hash-режиме (`createWebHashHistory`).
Маршрут шага: `/#/:stepId` (например, `/#/3`).

## Запросы к серверу

В приложении используется один backend-запрос:

### Получение шагов курса

- Метод: `GET`
- URL: `https://n.kushedow.tech/webhook/xls/steps`
- Константа эндпоинта: `API_ENDPOINTS.STEPS` в [api.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/api.js)
- Вызов: `courseApi.fetchSteps()` из [store.js](/C:/Users/g.homutov/WebstormProjects/xlscourse/xlscourse/store.js)
- Тело запроса: отсутствует

Пример запроса:

```http
GET /webhook/xls/steps HTTP/1.1
Host: n.kushedow.tech
Accept: application/json
```

Пример ответа (`200 OK`):

```json
[
  {
    "id": 1,
    "chapter": "Основы",
    "type": "theory",
    "title": "Введение",
    "instruction": "Прочитайте материал",
    "content": "## Что такое Excel..."
  },
  {
    "id": 2,
    "chapter": "Основы",
    "type": "quiz",
    "title": "Проверка знаний",
    "instruction": "Выберите правильные ответы",
    "quiz": [
      {
        "question": "Что такое формула?",
        "options": ["Текст", "Выражение", "Картинка"],
        "answer": "Выражение"
      }
    ]
  },
  {
    "id": 3,
    "chapter": "Формулы",
    "type": "practice",
    "title": "Практика SUM",
    "instruction": "Заполните ячейки",
    "theory": "Используйте функцию `SUM`...",
    "sheets": {
      "Лист1": [
        ["Товар", "Кол-во", "Цена", "Сумма"],
        ["A", 2, 10, ""]
      ]
    },
    "solutions": {
      "D2": "20"
    }
  }
]
```

Обработка ошибок:
- Если ответ не `2xx`, запрос считается неуспешным.
- При ошибке сети/парсинга показывается: `Ошибка при загрузке курса.`

## Стек

- Vue 3 (CDN)
- Vue Router 4 (CDN)
- Pinia (CDN)
- Handsontable (CDN)
- HyperFormula (CDN)
- Tailwind CSS (CDN)
- Marked (CDN)
