import os
import json
import time
import requests
from collections import defaultdict, deque

from flask import Flask, Response, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_FILES = {"index.html", "style.css", "script.js"}

# Настройки для подключения к локальной модели (Ollama)
RUNPOD_API_URL = os.environ.get("RUNPOD_API_URL", "").rstrip("/")
RUNPOD_API_KEY = os.environ.get("RUNPOD_API_KEY", "ollama")
MODEL_NAME = os.environ.get("MODEL_NAME", "R4C3R/qwen2.5-coder-7b-instruct-heretic:q4_k_m")

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
    Отправляет запрос к локальной модели через Ollama (OpenAI API) и стримит ответ.
    """
    if not RUNPOD_API_URL:
        yield "**Ошибка:** Переменная окружения RUNPOD_API_URL не задана на Render."
        return

    # Формируем сообщения в формате OpenAI API
    api_messages = []
    if system:
        api_messages.append({"role": "system", "content": system})
    api_messages.extend(messages)

    headers = {
        "Content-Type": "application/json",
    }
    if RUNPOD_API_KEY:
        headers["Authorization"] = f"Bearer {RUNPOD_API_KEY}"

    payload = {
        "model": MODEL_NAME,
        "messages": api_messages,
        "stream": True,
        "temperature": 0.7,
        "max_tokens": 4096,
    }

    try:
        # Отправляем запрос на туннель (Pinggy / Cloudflare)
        # Таймаут 100 секунд, так как у бесплатных туннелей есть ограничения
        response = requests.post(
            f"{RUNPOD_API_URL}/chat/completions",
            headers=headers,
            json=payload,
            stream=True,
            timeout=100
        )
        response.raise_for_status()

        # Читаем поток данных от Ollama
        for line in response.iter_lines():
            if line:
                line_text = line.decode("utf-8")
                if line_text.startswith("data: "):
                    data_str = line_text[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data["choices"][0]["delta"]
                        if "content" in delta:
                            yield delta["content"]
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
    except requests.exceptions.Timeout:
        yield "\n\n**Ошибка:** Превышено время ожидания ответа от модели (100 секунд)."
    except requests.exceptions.RequestException as e:
        yield f"\n\n**Ошибка соединения с моделью:** {str(e)}"


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