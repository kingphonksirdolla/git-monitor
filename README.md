# Git Monitor

Веб-приложение для мониторинга статуса веток в твоих GitHub-репозиториях. Помогает быстро понять, где идёт активная работа, а где всё стабильно.

## Что показывает

Приложение сканирует отслеживаемые репозитории и выводит статус:

🟢 **Stable** — ветки `main` и `develop` в одном состоянии, всё выкачено на прод.

🟡 **Development** — в `develop` есть изменения, которых нет в `main`, есть что выкатывать.

Ты сам выбираешь какие репозитории отслеживать — через модальное окно в интерфейсе. Выбор сохраняется в базе данных.

**Backend:** Python (FastAPI + PyGithub + SQLAlchemy)

**Frontend:** HTML, CSS, JavaScript

---

## Как запустить

### 1. Клонирование проекта

```bash
git clone https://github.com/kingphonksirdolla/git-monitor.git
cd git-monitor
```

### 2. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 3. Настройка переменных окружения

В корне проекта создай файл `.env`:

```
DATABASE_URL=sqlite:///./git_monitor.db
```

Для PostgreSQL:

```
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/git_monitor
```

### 4. Применение миграций

```bash
alembic upgrade head
```

Это создаст таблицы `users` и `tracked_repos` в базе данных.

### 5. Запуск сервера

```bash
uvicorn backend.main:app --reload
```

API будет доступно по адресу `http://127.0.0.1:8000`

Документация API (Swagger): `http://127.0.0.1:8000/docs`

### 6. Открыть фронтенд

Открой файл `frontend/index.html` в браузере.

---

## Как получить GitHub токен

1. Перейди в **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Нажми **Generate new token**
3. Выбери права: `repo`, `read:user`
4. Скопируй токен — он вводится через интерфейс при входе

Токен хранится только в памяти сессии браузера и никуда не сохраняется.

---

## API эндпоинты

| Метод | Путь                     | Описание                                                                            |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| `GET`    | `/user`                    | Информация о текущем пользователе                             |
| `GET`    | `/repos/available`         | Все доступные репозитории GitHub-аккаунта                    |
| `GET`    | `/repos/tracked`           | Отслеживаемые репозитории из БД                                 |
| `PUT`    | `/repos/tracked/{repo_id}` | Добавить репозиторий в отслеживание                         |
| `DELETE` | `/repos/tracked/{repo_id}` | Убрать репозиторий из отслеживания                           |
| `GET`    | `/repos/status`            | Статус веток для всех отслеживаемых репозиториев |

Все запросы требуют заголовок `token: <github_token>`.
