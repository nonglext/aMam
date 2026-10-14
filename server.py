import os
import json
import time
import threading
from collections import defaultdict, deque

import requests
from flask import Flask, Response, jsonify, request, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_FILES = {"index.html", "style.css", "script.js"}

# Настройки подключения к модели (Ollama / любой OpenAI-совместимый API)
RUNPOD_API_URL = os.environ.get("RUNPOD_API_URL", "").rstrip("/")
RUNPOD_API_KEY = os.environ.get("RUNPOD_API_KEY", "ollama")
MODEL_NAME = os.environ.get("MODEL_NAME", "R4C3R/qwen2.5-coder-7b-instruct-heretic:q4_k_m")

# Дополнительные модели через запятую (необязательно): MODELS="model-a,model-b"
EXTRA_MODELS = [m.strip() for m in os.environ.get("MODELS", "").split(",") if m.strip()]
ALLOWED_MODELS = list(dict.fromkeys([MODEL_NAME, *EXTRA_MODELS]))

REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", 100))

app = Flask(__name__)

MAX_MESSAGE_LENGTH = 60000      # с учётом прикреплённых файлов
MAX_TOTAL_LENGTH = 200000
MAX_SYSTEM_LENGTH = 2000
MAX_MESSAGES = 90
VALID_ROLES = {"user", "assistant"}

# Ограничение частоты: не более RATE_LIMIT запросов за RATE_WINDOW секунд с одного IP
RATE_LIMIT = int(os.environ.get("RATE_LIMIT", 20))
RATE_WINDOW = 60
_requests = defaultdict(deque)
_rate_lock = threading.Lock()

# Одна сессия на всё приложение: переиспользует соединения с туннелем
http = requests.Session()

# Кэш статуса модели, чтобы не дёргать туннель на каждое открытие страницы
_status_cache = {"at": 0.0, "data": None}
_status_lock = threading.Lock()
STATUS_TTL = 20


def upstream_headers():
    headers = {"Content-Type": "application/json"}
    if RUNPOD_API_KEY:
        headers["Authorization"] = f"Bearer {RUNPOD_API_KEY}"
    return headers


def client_ip():
    # На Render реальный IP клиента приходит в X-Forwarded-For
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"


def is_rate_limited(ip):
    now = time.time()
    with _rate_lock:
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


@app.after_request
def security_headers(resp):
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    resp.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    return resp


@app.route("/")
def index():
    resp = send_from_directory(BASE_DIR, "index.html")
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.route("/<path:filename>")
def static_files(filename):
    if filename not in STATIC_FILES:
        return jsonify(error="Не найдено"), 404
    resp = send_from_directory(BASE_DIR, filename)
    resp.headers["Cache-Control"] = "no-cache"
    return resp


@app.route("/health")
def health():
    return jsonify(status="ok")


@app.route("/api/config")
def config():
    """Что нужно знать фронтенду: какие модели доступны и лимиты."""
    return jsonify(
        models=ALLOWED_MODELS,
        default_model=MODEL_NAME,
        max_message_length=MAX_MESSAGE_LENGTH,
        configured=bool(RUNPOD_API_URL),
    )


@app.route("/api/status")
def status():
    """Быстрая проверка, отвечает ли модель (с кэшем на STATUS_TTL секунд)."""
    if not RUNPOD_API_URL:
        return jsonify(online=False, reason="RUNPOD_API_URL не задан")

    with _status_lock:
        cached = _status_cache["data"]
        if cached and time.time() - _status_cache["at"] < STATUS_TTL:
            return jsonify(cached)

    started = time.time()
    try:
        r = http.get(f"{RUNPOD_API_URL}/models", headers=upstream_headers(), timeout=6)
        online = r.ok
        reason = None if r.ok else f"Модель ответила кодом {r.status_code}"
    except requests.exceptions.RequestException:
        online, reason = False, "Модель недоступна"

    data = {"online": online, "reason": reason, "latency_ms": int((time.time() - started) * 1000)}
    with _status_lock:
        _status_cache.update(at=time.time(), data=data)
    return jsonify(data)


def clamp(value, lo, hi, default):
    try:
        value = float(value)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, value))


def validate_request(data):
    """Проверяет тело запроса. Возвращает (params, error)."""
    messages = data.get("messages")
    system = data.get("system", "")

    if not isinstance(messages, list) or not messages:
        return None, "Пустой запрос"

    if len(messages) > MAX_MESSAGES:
        return None, "Слишком длинная история"

    total = 0
    clean = []
    for msg in messages:
        if not isinstance(msg, dict):
            return None, "Неверный формат сообщения"
        if msg.get("role") not in VALID_ROLES:
            return None, "Неверная роль сообщения"
        content = msg.get("content")
        if not isinstance(content, str) or not content.strip():
            return None, "Пустое сообщение"
        if len(content) > MAX_MESSAGE_LENGTH:
            return None, "Слишком длинное сообщение"
        total += len(content)
        clean.append({"role": msg["role"], "content": content})

    if total > MAX_TOTAL_LENGTH:
        return None, "Слишком большой объём истории"

    if clean[-1]["role"] != "user":
        return None, "Последнее сообщение должно быть от пользователя"

    if not isinstance(system, str) or len(system) > MAX_SYSTEM_LENGTH:
        return None, "Некорректные инструкции"

    model = data.get("model") or MODEL_NAME
    if model not in ALLOWED_MODELS:
        model = MODEL_NAME

    return {
        "messages": clean,
        "system": system.strip(),
        "model": model,
        "temperature": clamp(data.get("temperature"), 0.0, 2.0, 0.7),
        "max_tokens": int(clamp(data.get("max_tokens"), 64, 8192, 4096)),
    }, None


def build_messages(messages, system):
    api_messages = []
    if system:
        api_messages.append({"role": "system", "content": system})
    api_messages.extend(messages)
    return api_messages


def describe_http_error(err):
    resp = err.response
    if resp is None:
        return str(err)
    detail = ""
    try:
        body = resp.json()
        detail = body.get("error", {}).get("message") if isinstance(body.get("error"), dict) else body.get("error")
    except ValueError:
        detail = (resp.text or "")[:200]
    return f"модель ответила кодом {resp.status_code}" + (f": {detail}" if detail else "")


def generate_reply(params):
    """Стримит ответ модели через OpenAI-совместимый API."""
    if not RUNPOD_API_URL:
        yield "**Ошибка:** переменная окружения RUNPOD_API_URL не задана на сервере."
        return

    payload = {
        "model": params["model"],
        "messages": build_messages(params["messages"], params["system"]),
        "stream": True,
        "temperature": params["temperature"],
        "max_tokens": params["max_tokens"],
    }

    response = None
    in_think = False
    try:
        response = http.post(
            f"{RUNPOD_API_URL}/chat/completions",
            headers=upstream_headers(),
            json=payload,
            stream=True,
            timeout=(10, REQUEST_TIMEOUT),
        )
        response.raise_for_status()

        for line in response.iter_lines(decode_unicode=False):
            if not line:
                continue
            line_text = line.decode("utf-8", errors="replace")
            if not line_text.startswith("data:"):
                continue
            data_str = line_text[5:].strip()
            if data_str == "[DONE]":
                break
            try:
                data = json.loads(data_str)
                delta = data["choices"][0].get("delta") or {}
            except (json.JSONDecodeError, KeyError, IndexError, TypeError):
                continue

            # Модели с «размышлениями» присылают их отдельным полем: оборачиваем в <think>
            reasoning = delta.get("reasoning_content") or delta.get("reasoning")
            if reasoning:
                if not in_think:
                    in_think = True
                    yield "<think>"
                yield reasoning

            content = delta.get("content")
            if content:
                if in_think:
                    in_think = False
                    yield "</think>\n\n"
                yield content

        if in_think:
            yield "</think>"
    except requests.exceptions.Timeout:
        yield f"\n\n**Ошибка:** превышено время ожидания ответа от модели ({REQUEST_TIMEOUT} с)."
    except requests.exceptions.HTTPError as e:
        yield f"\n\n**Ошибка:** {describe_http_error(e)}."
    except requests.exceptions.RequestException:
        yield "\n\n**Ошибка соединения с моделью.** Проверьте, что туннель запущен."
    finally:
        # Если пользователь нажал «стоп», закрываем соединение с моделью сразу
        if response is not None:
            response.close()


@app.route("/api/chat", methods=["POST"])
def chat():
    if is_rate_limited(client_ip()):
        return jsonify(error="Слишком много запросов. Подождите минуту и попробуйте снова."), 429

    data = request.get_json(silent=True) or {}
    params, error = validate_request(data)
    if error:
        return jsonify(error=error), 400

    return Response(
        generate_reply(params),
        mimetype="text/plain; charset=utf-8",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )


@app.route("/api/title", methods=["POST"])
def title():
    """Короткое название чата по первому сообщению (без стриминга)."""
    if not RUNPOD_API_URL:
        return jsonify(error="Модель не настроена"), 503
    if is_rate_limited(client_ip()):
        return jsonify(error="Слишком много запросов"), 429

    data = request.get_json(silent=True) or {}
    text = data.get("text")
    if not isinstance(text, str) or not text.strip():
        return jsonify(error="Пустой текст"), 400

    model = data.get("model") if data.get("model") in ALLOWED_MODELS else MODEL_NAME
    prompt = [
        {"role": "system", "content": (
            "Придумай короткое название (2–5 слов) для диалога по первому сообщению пользователя. "
            "Пиши на языке сообщения. Без кавычек, без точки в конце, без пояснений. Только название."
        )},
        {"role": "user", "content": text[:1500]},
    ]
    try:
        r = http.post(
            f"{RUNPOD_API_URL}/chat/completions",
            headers=upstream_headers(),
            json={"model": model, "messages": prompt, "stream": False, "temperature": 0.3, "max_tokens": 24},
            timeout=(10, 30),
        )
        r.raise_for_status()
        raw = r.json()["choices"][0]["message"]["content"]
    except (requests.exceptions.RequestException, KeyError, IndexError, ValueError):
        return jsonify(error="Не удалось получить название"), 502

    # Убираем размышления, кавычки и лишнее
    if "</think>" in raw:
        raw = raw.split("</think>")[-1]
    clean = raw.strip().splitlines()[0] if raw.strip() else ""
    clean = clean.strip(" \"'«»“”.*#`").strip()[:60]
    if not clean:
        return jsonify(error="Пустое название"), 502
    return jsonify(title=clean)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
