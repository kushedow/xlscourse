# XLS Course

Одностраничное учебное приложение по Excel с тремя типами шагов:
- `theory` - теория (Markdown)
- `quiz` - тест с проверкой ответов
- `practice` - практика в таблице (Handsontable + HyperFormula)

## Запуск

Приложение статическое, сборка не нужна.

1. Откройте [index.html](C:\Users\g.homutov\WebstormProjects\xlscourse\xlscourse\index.html) в браузере.
2. Дождитесь загрузки шагов курса с сервера.

## Стек

- Vue 3 (CDN)
- Pinia (CDN)
- Handsontable (CDN)
- HyperFormula (CDN)
- Tailwind CSS (CDN)
- Marked (CDN)

## Запросы к серверу

В приложении используется **один** HTTP-запрос к backend.

### 1) Получение шагов курса

- Метод: `GET`
- URL: `https://n.kushedow.tech/webhook/xls/steps`
- Где вызывается: [index.html](C:\Users\g.homutov\WebstormProjects\xlscourse\xlscourse\index.html):201, [index.html](C:\Users\g.homutov\WebstormProjects\xlscourse\xlscourse\index.html):203, [index.html](C:\Users\g.homutov\WebstormProjects\xlscourse\xlscourse\index.html):245
- Тело запроса: отсутствует

Пример запроса:

```http
GET /webhook/xls/steps HTTP/1.1
Host: n.kushedow.tech
Accept: application/json
```

Пример успешного ответа (`200 OK`, JSON-массив шагов):

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

Поведение при ошибке:
- Если сервер вернул не `2xx`, клиент считает загрузку неуспешной.
- Если запрос завершился ошибкой сети/парсинга, клиент показывает сообщение: `Ошибка при загрузке курса.`

## Важные детали

- Переходы между шагами, проверка тестов и практики выполняются на клиенте.
- Дополнительных запросов на сохранение прогресса или отправку ответов нет.
