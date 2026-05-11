### Git-monitor

Веб-приложение для мониторинга статуса веток в твоих GitHub-репозиториях. Помогает быстро понять, где идет активная работа, а где всё стабильно.

## Что он показывает

Приложение сканирует репозитории и выводит статус:

🟢 **Stable** — есть только ветка `main`, всё спокойно.

🟡 **Development** — есть ветка `develop` с незамёрженными изменениями.

🟠 **Active Work** — есть активные ветки `feature/` или `bugfix/`.

**Backend:** Python (FastAPI + PyGithub)

**Frontend:** HTML, CSS, JavaScript

## Как запустить

### 1. Клонирование проекта

```bash
git clone [https://github.com/kingphonksirdolla/git-monitor.git](https://github.com/kingphonksirdolla/git-monitor.git)
cd git-monitor
```

### 2. Настройка бэкенда

Установи необходимые библиотеки:

```
pip install -r requirements.txt
```

В папке `backend` создай файл `.env` и добавь туда свой GitHub токен (можно ввести через UI):

**Фрагмент кода**

```
GITHUB_TOKEN=ваш_токен_здесь
```

### 3. Запуск приложения

1. **Запусти сервер** из папки `backend`

   ```
   uvicorn backend.main:app --reload
   ```

   *API будет доступно по адресу http://127.0.0.1:8000*
2. **Открой фронтенд** : Просто запусти файл `frontend/index.html` в браузере.

## Как получить токен персонального доступа

1. Перейди в **Settings** → **Developer settings** → **Personal access tokens** →  **Tokens (classic)** .
2. Нажми  **Generate new token** .
3. Выбери fine-grained token.
4. Скопируй полученный токен в файл `.env`.
