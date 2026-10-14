import os
import time
from collections import defaultdict, deque

from flask import Flask, Response, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_FILES = {"index.html", "style.css", "script.js"}

app = Flask(__name__)

MAX_MESSAGE_LENGTH = 4000
MAX_SYSTEM_LENGTH = 2000
MAX_MESSAGES = 40
VALID_ROLES = {"user", "assistant"}

# Ограничение частоты запросов: не более RATE_LIMIT запросов за RATE_WINDOW секунд с одного IP
RATE_LIMIT = int(os.environ.get("RATE_LIMIT", 20))
RATE_WINDOW = 60
_requests = defaultdict(deque)


def client_ip():
    # На Render реальный IP клиента приходит в X-Forwarded-For
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def is_rate_limited(ip):
    now = time.time()
    bucket = _requests[ip]

    while bucket and now - bucket[0] > RATE_WINDOW:
        bucket.popleft()

    if len(bucket) >= RATE_LIMIT:
        return True

    bucket.append(now)

    # Чистим пустые записи, чтобы словарь не рос бесконечно
    if len(_requests) > 5000:
        for key in [k for k, v in _requests.items() if not v]:
            _requests.pop(key, None)

    return False


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    if filename not in STATIC_FILES:
        return jsonify(error="Не найдено"), 404
    return send_from_directory(BASE_DIR, filename)


@app.route("/health")
def health():
    return jsonify(status="ok")


def validate_request(data):
    """Проверяет тело запроса. Возвращает (messages, system, error)."""
    messages = data.get("messages")
    system = data.get("system", "")

    if not isinstance(messages, list) or not messages:
        return None, None, "Пустой запрос"

    if len(messages) > MAX_MESSAGES:
        return None, None, "Слишком длинная история"

    for msg in messages:
        if not isinstance(msg, dict):
            return None, None, "Неверный формат сообщения"
        if msg.get("role") not in VALID_ROLES:
            return None, None, "Неверная роль сообщения"
        content = msg.get("content")
        if not isinstance(content, str) or not content.strip():
            return None, None, "Пустое сообщение"
        if len(content) > MAX_MESSAGE_LENGTH:
            return None, None, "Слишком длинное сообщение"

    if messages[-1]["role"] != "user":
        return None, None, "Последнее сообщение должно быть от пользователя"

    if not isinstance(system, str) or len(system) > MAX_SYSTEM_LENGTH:
        return None, None, "Некорректные инструкции"

    return messages, system.strip(), None


def generate_reply(messages, system):
    """
    Заглушка ответа. Пока модель не подключена, возвращает тестовый Markdown по частям.
    Позже заменить содержимое этой функции на запрос к вашему серверу с моделью,
    сохранив yield для потоковой передачи. Параметр system содержит инструкции
    пользователя (может быть пустой строкой).
    """
    last_text = messages[-1]["content"]
    instructions_note = "Инструкции для ИИ получены." if system else "Инструкции для ИИ не заданы."

    reply = (
        "## Тестовый ответ\n\n"
        f"Вы написали: **{last_text}**\n\n"
        "Модель пока не подключена, но интерфейс уже умеет:\n\n"
        "- выводить ответ потоком, по частям\n"
        "- форматировать *Markdown* и `inline-код`\n"
        "- показывать блоки кода и таблицы\n\n"
        "| Функция | Статус |\n"
        "|---|---|\n"
        "| Чаты и история | готово |\n"
        "| Подключение модели | следующий шаг |\n\n"
        "Пример кода:\n\n"
        "```python\n"
        "def hello(name):\n"
        "    return f\"Привет, {name}!\"\n"
        "```\n\n"
        f"> {instructions_note}"
    )

    chunk = ""
    for char in reply:
        chunk += char
        if len(chunk) >= 3:
            yield chunk
            chunk = ""
            time.sleep(0.02)
    if chunk:
        yield chunk


@app.route("/api/chat", methods=["POST"])
def chat():
    if is_rate_limited(client_ip()):
        return jsonify(error="Слишком много запросов. Подождите минуту и попробуйте снова."), 429

    data = request.get_json(silent=True) or {}
    messages, system, error = validate_request(data)
    if error:
        return jsonify(error=error), 400

    return Response(
        generate_reply(messages, system),
        mimetype="text/plain; charset=utf-8",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)