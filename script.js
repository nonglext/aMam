/* ============================================================
   Настройки приложения
   ============================================================ */
const APP_NAME = "Мой ИИ"; // Название вашего ИИ (показывается в панели и в экспорте)

const CHATS_KEY = "myai-v3";
const OLD_CHATS_KEY = "ai-chat-v2"; // Для переноса чатов из прошлой версии
const SETTINGS_KEY = "myai-settings";
const DRAFTS_KEY = "myai-drafts";
const MAX_CHATS = 200;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 200 * 1024;      // 200 КБ на файл
const MAX_FILES_CHARS = 40000;         // суммарно текста из файлов в одном сообщении
const PASTE_TO_FILE = 4000;            // длинная вставка превращается во вложение
const MAX_PAYLOAD_CHARS = 180000;      // не отправляем на сервер больше этого

const $ = (id) => document.getElementById(id);

const root = document.documentElement;
const layoutEl = $("layout");
const sidebarEl = $("sidebar");
const overlayEl = $("overlay");
const mainEl = $("main");
const stageEl = $("stage");
const chatListEl = $("chat-list");
const searchInput = $("search-input");
const chatTitleEl = $("chat-title");
const greetingEl = $("greeting");
const chatEl = $("chat");
const threadEl = $("thread");
const scrollDownBtn = $("scroll-down");
const form = $("chat-form");
const input = $("message-input");
const sendBtn = $("send-btn");
const charCountEl = $("char-count");
const toastEl = $("toast");
const moreBtn = $("more-btn");
const popoverEl = $("popover");
const attachmentsEl = $("attachments");
const fileInput = $("file-input");
const micBtn = $("mic-btn");
const dropZone = $("drop-zone");
const statusDot = $("status-dot");
const modelNameEl = $("model-name");

const svg = (d, size = 16, extra = "") =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

const ICONS = {
    send: svg('<path d="M12 19V5M5 12l7-7 7 7"/>', 18, 'stroke-width="2.4"'),
    stop: '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor"/></svg>',
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
    check: svg('<path d="M5 12l5 5L20 7"/>'),
    redo: svg('<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/>'),
    edit: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
    pin: svg('<path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4z"/>'),
    unpin: svg('<path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4zM3 3l18 18"/>'),
    download: svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    wrap: svg('<path d="M3 6h18M3 12h15a3 3 0 0 1 0 6h-4M3 18h7M14 15l-3 3 3 3"/>'),
    speak: svg('<path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
    mute: svg('<path d="M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6"/>'),
    left: svg('<path d="M15 18l-6-6 6-6"/>'),
    right: svg('<path d="M9 18l6-6-6-6"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>', 12, 'stroke-width="2.6"'),
    print: svg('<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z"/>'),
    md: svg('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 13h6M9 17h4"/>'),
    dot: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>',
    refresh: svg('<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>'),
    // Иконки подсказок
    pen: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM20 17v4H6.5A2.5 2.5 0 0 1 4 18.5"/>'),
    code: svg('<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>'),
    bulb: svg('<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    list: svg('<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),
    mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    bug: svg('<path d="M8 8V6a4 4 0 0 1 8 0v2M5 13H2M22 13h-3M5 19l-2 2M19 19l2 2M5 8l-2-2M19 8l2-2"/><rect x="6" y="8" width="12" height="12" rx="6"/>'),
};

const STARTERS = [
    { icon: "pen", title: "Написать текст", sub: "письмо, пост или описание", prompt: "Помоги мне написать " },
    { icon: "book", title: "Объяснить тему", sub: "простыми словами, с примерами", prompt: "Объясни простыми словами, как работает " },
    { icon: "code", title: "Помочь с кодом", sub: "написать, разобрать, ускорить", prompt: "Помоги с кодом: " },
    { icon: "bulb", title: "Придумать идеи", sub: "мозговой штурм на любую тему", prompt: "Предложи 10 идей для " },
    { icon: "globe", title: "Перевести", sub: "с сохранением стиля", prompt: "Переведи на английский, сохранив стиль:\n\n" },
    { icon: "list", title: "Составить план", sub: "по шагам, с дедлайнами", prompt: "Составь пошаговый план, как " },
    { icon: "mail", title: "Ответить на сообщение", sub: "вежливо и по делу", prompt: "Помоги вежливо ответить на это сообщение:\n\n" },
    { icon: "bug", title: "Найти ошибку", sub: "в коде или логике", prompt: "Найди ошибку в этом коде и объясни, как исправить:\n\n```\n\n```" },
];

const PRESETS = [
    { label: "Кратко", text: "Отвечай кратко и по делу, без вступлений. Если можно ответить одним предложением, отвечай одним." },
    { label: "Подробно", text: "Отвечай подробно и структурированно: заголовки, списки, примеры. В конце дай краткий вывод." },
    { label: "Программист", text: "Ты опытный senior-разработчик. Пиши чистый, рабочий код с комментариями, объясняй решения и указывай на возможные ошибки." },
    { label: "Учитель", text: "Объясняй как терпеливый учитель: от простого к сложному, с аналогиями из жизни. Задавай уточняющие вопросы." },
    { label: "Редактор", text: "Ты строгий литературный редактор. Исправляй ошибки, улучшай стиль и объясняй правки." },
];

const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

/* ============================================================
   Настройки пользователя
   ============================================================ */
const defaultSettings = {
    name: "",
    instructions: "",
    theme: "system",
    font: "serif",
    accent: "emerald",
    size: "m",
    width: "normal",
    collapsed: false,
    enterToSend: !coarsePointer,
    autoTitle: true,
    model: "",
    temperature: 0.7,
    maxTokens: 4096,
    history: 20,
};

let settings = loadSettings();

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        if (saved && typeof saved === "object") return { ...defaultSettings, ...saved };
    } catch {
        // Повреждённые данные игнорируем
    }
    return { ...defaultSettings };
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        // Хранилище может быть недоступно
    }
}

const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function applyAppearance() {
    const dark = settings.theme === "dark" || (settings.theme === "system" && darkQuery.matches);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    root.setAttribute("data-font", settings.font);
    root.setAttribute("data-accent", settings.accent);
    root.setAttribute("data-size", settings.size);
    root.setAttribute("data-width", settings.width);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#111715" : "#f8fbfa");
}

darkQuery.addEventListener("change", () => {
    if (settings.theme === "system") applyAppearance();
});

function updateProfile() {
    const name = settings.name.trim();
    $("profile-name").textContent = name || "Гость";
    $("profile-avatar").textContent = name ? name[0].toUpperCase() : "Я";
    greetingEl.textContent = greetingText();
}

function greetingText() {
    const h = new Date().getHours();
    const part = h < 5 ? "Доброй ночи" : h < 12 ? "Доброе утро" : h < 18 ? "Добрый день" : "Добрый вечер";
    const name = settings.name.trim();
    return name ? `${part}, ${name}` : part;
}

/* ============================================================
   Конфигурация сервера и статус модели
   ============================================================ */
const serverConfig = { models: [], defaultModel: "", online: null, reason: "" };

function shortModelName(name) {
    if (!name) return "Модель";
    return name.split("/").pop().split(":")[0];
}

function currentModel() {
    if (settings.model && serverConfig.models.includes(settings.model)) return settings.model;
    return serverConfig.defaultModel || "";
}

function paintStatus() {
    const state = serverConfig.online === null ? "checking" : serverConfig.online ? "online" : "offline";
    statusDot.dataset.state = state;
    const name = shortModelName(currentModel());
    modelNameEl.textContent = serverConfig.online === null && !serverConfig.defaultModel ? "Подключение…" : name;
    $("model-pill").title =
        state === "online" ? "Модель на связи" :
        state === "offline" ? (serverConfig.reason || "Модель недоступна") : "Проверяю соединение…";
}

async function loadConfig() {
    try {
        const r = await fetch("/api/config", { cache: "no-store" });
        if (!r.ok) throw new Error();
        const data = await r.json();
        serverConfig.models = Array.isArray(data.models) ? data.models : [];
        serverConfig.defaultModel = data.default_model || serverConfig.models[0] || "";
    } catch {
        serverConfig.online = false;
        serverConfig.reason = "Сервер недоступен";
    }
    paintStatus();
    fillModelSelect();
    if (serverConfig.defaultModel) checkStatus();
}

let statusTimer = null;
async function checkStatus() {
    clearTimeout(statusTimer);
    try {
        const r = await fetch("/api/status", { cache: "no-store" });
        const data = await r.json();
        serverConfig.online = !!data.online;
        serverConfig.reason = data.reason || "";
    } catch {
        serverConfig.online = false;
        serverConfig.reason = "Сервер недоступен";
    }
    paintStatus();
    statusTimer = setTimeout(() => {
        if (document.visibilityState === "visible") checkStatus();
    }, serverConfig.online ? 90000 : 25000);
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && serverConfig.defaultModel) checkStatus();
});

/* ============================================================
   Чаты и хранилище
   ============================================================ */
function sanitizeFiles(files) {
    if (!Array.isArray(files)) return undefined;
    const clean = files
        .filter((f) => f && typeof f.name === "string" && typeof f.text === "string")
        .slice(0, MAX_FILES)
        .map((f) => ({ name: f.name.slice(0, 120), size: Number(f.size) || f.text.length, text: f.text.slice(0, MAX_FILES_CHARS) }));
    return clean.length ? clean : undefined;
}

function sanitizeMeta(meta) {
    if (!meta || typeof meta !== "object") return undefined;
    const out = {};
    if (Number.isFinite(meta.ms)) out.ms = meta.ms;
    if (typeof meta.model === "string") out.model = meta.model.slice(0, 120);
    if (meta.stopped) out.stopped = true;
    return Object.keys(out).length ? out : undefined;
}

function sanitizeMessage(m) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return null;
    const msg = { role: m.role, content: m.content };
    if (Number.isFinite(m.ts)) msg.ts = m.ts;

    if (m.role === "user") {
        const files = sanitizeFiles(m.files);
        if (files) msg.files = files;
        if (!msg.content.trim() && !files) return null;
    } else {
        const meta = sanitizeMeta(m.meta);
        if (meta) msg.meta = meta;
        if (Array.isArray(m.variants)) {
            const variants = m.variants
                .filter((v) => v && typeof v.content === "string")
                .slice(-10)
                .map((v) => ({ content: v.content, meta: sanitizeMeta(v.meta) }));
            if (variants.length > 1) {
                msg.variants = variants;
                msg.vi = Math.min(Math.max(0, Number(m.vi) || 0), variants.length - 1);
                msg.content = variants[msg.vi].content;
                msg.meta = variants[msg.vi].meta;
            }
        }
        if (!msg.content.trim()) return null;
    }
    return msg;
}

function sanitizeChats(list) {
    if (!Array.isArray(list)) return [];
    const result = [];

    for (const chat of list) {
        if (!chat || typeof chat !== "object") continue;
        if (typeof chat.id !== "string" || !Array.isArray(chat.messages)) continue;

        result.push({
            id: chat.id.slice(0, 40),
            title: typeof chat.title === "string" && chat.title.trim() ? chat.title.slice(0, 80) : "Новый чат",
            messages: chat.messages.map(sanitizeMessage).filter(Boolean),
            updatedAt: Number.isFinite(chat.updatedAt) ? chat.updatedAt : Date.now(),
            pinned: !!chat.pinned,
            customTitle: !!chat.customTitle,
        });
    }
    return result;
}

function loadState() {
    for (const key of [CHATS_KEY, OLD_CHATS_KEY]) {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && Array.isArray(data.chats)) {
                const chats = sanitizeChats(data.chats);
                return {
                    chats,
                    activeId: chats.some((c) => c.id === data.activeId) ? data.activeId : null,
                };
            }
        } catch {
            // Пробуем следующий ключ
        }
    }
    return { chats: [], activeId: null };
}

let state = loadState();
let isStreaming = false;
let abortCtrl = null;
let streamingChatId = null;

function saveState() {
    try {
        localStorage.setItem(CHATS_KEY, JSON.stringify(state));
    } catch {
        showToast("Не хватает места в хранилище браузера. Удалите старые чаты.");
    }
}

function getActiveChat() {
    return state.chats.find((c) => c.id === state.activeId) || null;
}

function createChat() {
    const chat = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title: "Новый чат",
        messages: [],
        updatedAt: Date.now(),
        pinned: false,
        customTitle: false,
    };
    state.chats.push(chat);

    if (state.chats.length > MAX_CHATS) {
        state.chats.sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
        state.chats = state.chats.slice(0, MAX_CHATS);
    }
    return chat;
}

function makeTitle(text, files) {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean && files && files.length) return files[0].name.slice(0, 48);
    return clean.length > 48 ? clean.slice(0, 48).trim() + "…" : clean || "Новый чат";
}

/* Черновики: незаконченный текст сохраняется для каждого чата */
let drafts = {};
try { drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY)) || {}; } catch { drafts = {}; }

let draftTimer = null;
function saveDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
        const key = state.activeId || "_new";
        const value = input.value;
        if (value.trim()) drafts[key] = value;
        else delete drafts[key];
        try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch { /* пусто */ }
    }, 300);
}

function restoreDraft() {
    input.value = drafts[state.activeId || "_new"] || "";
    autoResize();
    updateCounter();
    setSendState();
}

function clearDraft(key) {
    delete drafts[key];
    try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch { /* пусто */ }
}

/* ============================================================
   Утилиты
   ============================================================ */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

let toastTimer = null;
function showToast(text, { action = null, duration = 2200 } = {}) {
    toastEl.textContent = "";
    const span = document.createElement("span");
    span.textContent = text;
    toastEl.appendChild(span);
    if (action) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = action.label;
        btn.addEventListener("click", () => {
            toastEl.classList.remove("show");
            action.fn();
        });
        toastEl.appendChild(btn);
    }
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), action ? Math.max(duration, 6000) : duration);
}

async function copyText(text, silent = false) {
    try {
        await navigator.clipboard.writeText(text);
        if (!silent) showToast("Скопировано");
        return true;
    } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch { ok = false; }
        ta.remove();
        if (!silent) showToast(ok ? "Скопировано" : "Не удалось скопировать");
        return ok;
    }
}

function flashButton(btn, html, restore, ms = 1400) {
    btn.innerHTML = html;
    btn.classList.add("on");
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
        btn.innerHTML = restore;
        btn.classList.remove("on");
    }, ms);
}

function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName(str) {
    return str.replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60) || "chat";
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function formatDuration(ms) {
    if (ms < 1000) return `${ms} мс`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)} с`;
    return `${Math.floor(s / 60)} мин ${Math.round(s % 60)} с`;
}

function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
}

function isMobile() {
    return window.matchMedia("(max-width: 820px)").matches;
}

function fileExt(name) {
    const m = /\.([a-z0-9]+)$/i.exec(name);
    return m ? m[1].toLowerCase() : "txt";
}

/* ============================================================
   Диалоги
   ============================================================ */
const dlg = $("dialog");
const dlgForm = $("dialog-form");
const dlgTitle = $("dialog-title");
const dlgText = $("dialog-text");
const dlgInput = $("dialog-input");
const dlgOk = $("dialog-ok");
const dlgCancel = $("dialog-cancel");

/**
 * Показывает диалог. Если value === null, это подтверждение (вернёт true или null).
 * Если value — строка, это ввод текста (вернёт строку или null).
 */
function askDialog({ title, text = "", value = null, okText = "OK", danger = false }) {
    return new Promise((resolve) => {
        dlgTitle.textContent = title;
        dlgText.textContent = text;
        dlgText.hidden = !text;
        dlgInput.hidden = value === null;
        if (value !== null) dlgInput.value = value;
        dlgOk.textContent = okText;
        dlgOk.classList.toggle("danger", danger);

        let result = null;

        const onSubmit = (e) => {
            e.preventDefault();
            result = value === null ? true : dlgInput.value.trim() || null;
            dlg.close();
        };
        const onCancel = () => dlg.close();
        const onClose = () => {
            dlgForm.removeEventListener("submit", onSubmit);
            dlgCancel.removeEventListener("click", onCancel);
            dlg.removeEventListener("close", onClose);
            resolve(result);
        };

        dlgForm.addEventListener("submit", onSubmit);
        dlgCancel.addEventListener("click", onCancel);
        dlg.addEventListener("close", onClose);

        dlg.showModal();
        if (value !== null) {
            dlgInput.focus();
            dlgInput.select();
        } else {
            dlgOk.focus();
        }
    });
}

/* ============================================================
   Всплывающее меню
   ============================================================ */
let menuAnchor = null;

function closeMenu() {
    if (popoverEl.hidden) return;
    popoverEl.hidden = true;
    if (menuAnchor) menuAnchor.setAttribute("aria-expanded", "false");
    menuAnchor = null;
}

/** items: [{ label, icon, onClick, danger }] или "sep" */
function openMenu(anchor, items) {
    if (menuAnchor === anchor) {
        closeMenu();
        return;
    }
    closeMenu();
    popoverEl.innerHTML = "";

    for (const item of items) {
        if (item === "sep") {
            popoverEl.appendChild(document.createElement("hr"));
            continue;
        }
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("role", "menuitem");
        if (item.danger) btn.className = "danger";
        btn.innerHTML = (item.icon || "") + `<span>${escapeHtml(item.label)}</span>`;
        btn.addEventListener("click", () => {
            closeMenu();
            item.onClick();
        });
        popoverEl.appendChild(btn);
    }

    popoverEl.hidden = false;
    menuAnchor = anchor;
    anchor.setAttribute("aria-expanded", "true");

    const r = anchor.getBoundingClientRect();
    const w = popoverEl.offsetWidth;
    const h = popoverEl.offsetHeight;
    let left = r.right - w;
    if (left < 8) left = Math.min(r.left, window.innerWidth - w - 8);
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    popoverEl.style.left = `${Math.max(8, left)}px`;
    popoverEl.style.top = `${top}px`;

    const first = popoverEl.querySelector("button");
    if (first) first.focus({ preventScroll: true });
}

popoverEl.addEventListener("keydown", (e) => {
    const items = [...popoverEl.querySelectorAll("button")];
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(i + 1) % items.length].focus();
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(i - 1 + items.length) % items.length].focus();
    } else if (e.key === "Escape" || e.key === "Tab") {
        const anchor = menuAnchor;
        closeMenu();
        if (anchor) anchor.focus();
    }
});

/* ============================================================
   Подсветка синтаксиса (лёгкая, без внешних библиотек)
   ============================================================ */
const STR_DQ = String.raw`"(?:\\.|[^"\\\n])*"`;
const STR_SQ = String.raw`'(?:\\.|[^'\\\n])*'`;
const STR_BT = String.raw`\x60(?:\\[\s\S]|[^\x60\\])*\x60`;
const NUM = String.raw`\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)[a-zA-Z]*\b`;
const FN = String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()`;
const TYPE = String.raw`\b[A-Z][A-Za-z0-9_]*\b`;
const C_COM = String.raw`\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)`;
const HASH_COM = String.raw`#[^\n]*`;

const words = (s) => String.raw`\b(?:${s.trim().split(/\s+/).join("|")})\b`;

const JS_KW = "await break case catch class const continue debugger default delete do else export extends finally for from function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async get set";
const TS_KW = JS_KW + " interface type enum implements declare namespace abstract private public protected readonly as keyof infer is satisfies";
const LIT_COMMON = "true false null undefined NaN Infinity";

const LANG_RULES = {
    js: [["com", C_COM], ["str", `${STR_BT}|${STR_DQ}|${STR_SQ}`], ["num", NUM], ["kw", words(JS_KW)], ["lit", words(LIT_COMMON)], ["fn", FN], ["type", TYPE]],
    ts: [["com", C_COM], ["str", `${STR_BT}|${STR_DQ}|${STR_SQ}`], ["num", NUM], ["attr", String.raw`@[\w.]+`], ["kw", words(TS_KW)], ["lit", words(LIT_COMMON)], ["type", words("string number boolean any unknown never void object bigint symbol")], ["fn", FN], ["type", TYPE]],
    py: [["com", HASH_COM], ["str", String.raw`[rbfuRBFU]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|${STR_DQ}|${STR_SQ})`], ["attr", String.raw`@[\w.]+`], ["num", NUM],
        ["kw", words("and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case")],
        ["lit", words("True False None self cls")], ["type", words("int float str bool list dict set tuple bytes object type")], ["fn", FN], ["type", TYPE]],
    sh: [["com", HASH_COM], ["str", `${STR_DQ}|${STR_SQ}`], ["attr", String.raw`\$\{[^}\n]*\}|\$[\w@#?*!$-]+`],
        ["kw", words("if then else elif fi for in do done while until case esac function return local export source alias unset readonly select break continue exit")],
        ["fn", words("echo cd ls cat grep sed awk curl wget sudo apt npm npx pip python python3 node git docker chmod chown mkdir rm cp mv touch kill ps systemctl ollama")], ["num", NUM]],
    c: [["com", C_COM], ["attr", String.raw`#\s*\w+`], ["str", `${STR_DQ}|${STR_SQ}`], ["num", NUM],
        ["kw", words("auto break case catch class const constexpr continue default delete do else enum explicit extern for friend goto if inline namespace new noexcept operator private protected public register return sizeof static struct switch template this throw try typedef typename union using virtual volatile while")],
        ["type", words("int long short char float double void bool unsigned signed size_t uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t string vector map")], ["lit", words("true false NULL nullptr")], ["fn", FN], ["type", TYPE]],
    java: [["com", C_COM], ["str", `${STR_DQ}|${STR_SQ}`], ["attr", String.raw`@\w+`], ["num", NUM],
        ["kw", words("abstract assert break case catch class const continue default do else enum extends final finally for if implements import instanceof interface native new package private protected public return static super switch synchronized this throw throws transient try volatile while var record yield fun val when object companion data sealed override open internal lateinit by suspend is in out")],
        ["type", words("int long short byte char float double boolean void String")], ["lit", words("true false null")], ["fn", FN], ["type", TYPE]],
    cs: [["com", C_COM], ["str", `@?${STR_DQ}|\$${STR_DQ}|${STR_SQ}`], ["attr", String.raw`\[[A-Z]\w*(?=[\](])`], ["num", NUM],
        ["kw", words("abstract as async await base break case catch class const continue default delegate do else enum event explicit extern finally fixed for foreach get goto if implicit in interface internal is lock namespace new operator out override params private protected public readonly ref return sealed set sizeof static struct switch this throw try typeof unsafe using var virtual void volatile while yield record init")],
        ["type", words("int long short byte char float double decimal bool string object dynamic")], ["lit", words("true false null")], ["fn", FN], ["type", TYPE]],
    go: [["com", C_COM], ["str", `${STR_BT}|${STR_DQ}|${STR_SQ}`], ["num", NUM],
        ["kw", words("break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var")],
        ["type", words("int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 float32 float64 string bool byte rune error any")], ["lit", words("true false nil iota")], ["fn", FN], ["type", TYPE]],
    rust: [["com", C_COM], ["str", `${STR_DQ}|'(?:\\\\.|[^'\\\\])'`], ["attr", String.raw`#!?\[[^\]\n]*\]|\b\w+!`], ["num", NUM],
        ["kw", words("as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type unsafe use where while")],
        ["type", words("i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 bool char str String Vec Option Result Box")], ["lit", words("true false None Some Ok Err")], ["fn", FN], ["type", TYPE]],
    php: [["com", `${C_COM}|${HASH_COM}`], ["str", `${STR_DQ}|${STR_SQ}`], ["attr", String.raw`\$\w+`], ["num", NUM],
        ["kw", words("abstract and array as break case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile extends final finally fn for foreach function global goto if implements include include_once instanceof interface isset list match namespace new or print private protected public require require_once return static switch throw trait try unset use var while yield")],
        ["lit", words("true false null TRUE FALSE NULL")], ["fn", FN], ["type", TYPE]],
    rb: [["com", HASH_COM], ["str", `${STR_DQ}|${STR_SQ}`], ["attr", String.raw`:\w+|@\w+`], ["num", NUM],
        ["kw", words("alias and begin break case class def defined do else elsif end ensure for if in module next not or redo rescue retry return self super then undef unless until when while yield require attr_accessor puts")],
        ["lit", words("true false nil")], ["fn", FN], ["type", TYPE]],
    lua: [["com", String.raw`--\[\[[\s\S]*?(?:\]\]|$)|--[^\n]*`], ["str", `${STR_DQ}|${STR_SQ}`], ["num", NUM],
        ["kw", words("and break do else elseif end for function goto if in local not or repeat return then until while")], ["lit", words("true false nil")], ["fn", FN]],
    sql: [["com", String.raw`--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)`], ["str", `${STR_SQ}|${STR_DQ}`], ["num", NUM],
        ["kw", words("select from where and or not insert into values update set delete create table alter drop index view join left right inner outer full cross on group by order having limit offset as distinct union all exists in is like between case when then else end primary key foreign references default unique constraint returning with begin commit rollback transaction asc desc if")],
        ["type", words("int integer bigint smallint serial text varchar char boolean bool date timestamp timestamptz numeric decimal float real json jsonb uuid")], ["lit", words("null true false")], ["fn", FN]],
    css: [["com", String.raw`\/\*[\s\S]*?(?:\*\/|$)`], ["str", `${STR_DQ}|${STR_SQ}`], ["kw", String.raw`@[\w-]+|!important`], ["num", String.raw`#[\da-fA-F]{3,8}\b|-?\b\d*\.?\d+(?:px|em|rem|%|vh|vw|vmin|vmax|dvh|s|ms|deg|fr|ch|ex)?\b`],
        ["fn", String.raw`[\w-]+(?=\()`], ["attr", String.raw`--[\w-]+|[\w-]+(?=\s*:[^:{]*[;}\n])`], ["tag", String.raw`[.#][\w-]+`]],
    json: [["attr", String.raw`"(?:\\.|[^"\\])*"(?=\s*:)`], ["str", STR_DQ], ["num", String.raw`-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b`], ["lit", words("true false null")], ["com", C_COM]],
    yaml: [["com", HASH_COM], ["attr", String.raw`^[ \t-]*[\w.\/-]+(?=\s*:)`], ["str", `${STR_DQ}|${STR_SQ}`], ["num", NUM], ["lit", words("true false null yes no on off")], ["kw", String.raw`^---|^\.\.\.|[|>][-+]?$`]],
    markup: [["com", String.raw`<!--[\s\S]*?(?:-->|$)`], ["kw", String.raw`<!DOCTYPE[^>]*>|<\?[\s\S]*?\?>`], ["tag", String.raw`<\/?[A-Za-z][\w:.-]*|\/?>`], ["attr", String.raw`\b[\w:@.-]+(?==)`], ["str", String.raw`"[^"]*"|'[^']*'`], ["lit", String.raw`&[#\w]+;`]],
    diff: [["kw", String.raw`^@@[^\n]*`], ["str", String.raw`^\+[^\n]*`], ["tag", String.raw`^-[^\n]*`], ["com", String.raw`^(?:diff|index|\+\+\+|---)[^\n]*`]],
};
LANG_RULES.ini = [["com", String.raw`[#;][^\n]*`], ["tag", String.raw`^\s*\[[^\]\n]+\]`], ["attr", String.raw`^[\w.-]+(?=\s*=)`], ["str", `${STR_DQ}|${STR_SQ}`], ["num", NUM], ["lit", words("true false")]];

const LANG_ALIASES = {
    javascript: "js", jsx: "js", mjs: "js", cjs: "js", node: "js",
    typescript: "ts", tsx: "ts",
    python: "py", python3: "py", py3: "py",
    bash: "sh", shell: "sh", zsh: "sh", console: "sh", shellscript: "sh", powershell: "sh", ps1: "sh", dockerfile: "sh", docker: "sh", makefile: "sh", bat: "sh", cmd: "sh",
    cpp: "c", "c++": "c", cc: "c", h: "c", hpp: "c", objc: "c", arduino: "c",
    csharp: "cs", "c#": "cs",
    kotlin: "java", kt: "java", scala: "java", swift: "java", dart: "java", groovy: "java",
    golang: "go", rs: "rust", ruby: "rb",
    scss: "css", less: "css", sass: "css",
    jsonc: "json", json5: "json",
    yml: "yaml", toml: "ini", env: "ini", conf: "ini", properties: "ini",
    html: "markup", xml: "markup", svg: "markup", vue: "markup", svelte: "markup", xhtml: "markup",
    patch: "diff", mysql: "sql", postgres: "sql", postgresql: "sql", sqlite: "sql", plsql: "sql",
};

const compiledLangs = {};

function getHighlighter(lang) {
    const key = LANG_ALIASES[lang] || lang;
    if (!LANG_RULES[key]) return null;
    if (!compiledLangs[key]) {
        const rules = LANG_RULES[key];
        const flags = key === "sql" ? "gmi" : "gm";
        compiledLangs[key] = {
            re: new RegExp(rules.map(([, src]) => `(${src})`).join("|"), flags),
            classes: rules.map(([cls]) => cls),
        };
    }
    return compiledLangs[key];
}

function highlight(code, lang) {
    const hl = getHighlighter((lang || "").toLowerCase());
    if (!hl || code.length > 60000) return escapeHtml(code);

    const { re, classes } = hl;
    re.lastIndex = 0;
    let out = "";
    let last = 0;
    let m;
    while ((m = re.exec(code))) {
        if (m[0] === "") {
            re.lastIndex++;
            continue;
        }
        let group = 1;
        while (group < m.length && m[group] === undefined) group++;
        out += escapeHtml(code.slice(last, m.index));
        out += `<span class="tk-${classes[group - 1]}">${escapeHtml(m[0])}</span>`;
        last = m.index + m[0].length;
    }
    return out + escapeHtml(code.slice(last));
}

/* ============================================================
   Markdown
   ============================================================ */
const LINK_PH = "\u0003";

function renderInline(text) {
    const links = [];
    const keep = (html) => {
        links.push(html);
        return `${LINK_PH}${links.length - 1}${LINK_PH}`;
    };

    let out = text
        // [текст](https://...)
        .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, label, url) =>
            keep(`<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`))
        // Голые ссылки
        .replace(/\bhttps?:\/\/[^\s<]+/g, (url) => {
            const trail = /[.,;:!?)\]]+$/.exec(url);
            const clean = trail ? url.slice(0, -trail[0].length) : url;
            return keep(`<a href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>`) + (trail ? trail[0] : "");
        })
        .replace(/\*\*\*([^*\n]+)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^\w])__([^_\n]+)__(?!\w)/g, "$1<strong>$2</strong>")
        .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>")
        .replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

    return out.replace(new RegExp(`${LINK_PH}(\\d+)${LINK_PH}`, "g"), (m, i) => links[i]);
}

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_SEP = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const CODE_PH = /^\s*\u0004(\d+)\u0004\s*$/;
const THINK_PH = /^\s*\u0002(\d+)\u0002\s*$/;

function splitCells(line) {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function indentOf(str) {
    return str.replace(/\t/g, "    ").length;
}

/** Разбирает уже экранированные строки в HTML-блоки */
function renderBlocks(lines) {
    let html = "";
    let para = [];
    const listStack = []; // { type, indent }

    const flushPara = () => {
        if (para.length) {
            html += `<p>${renderInline(para.join("<br>"))}</p>`;
            para = [];
        }
    };
    const closeLists = (toIndent = -1) => {
        while (listStack.length && listStack[listStack.length - 1].indent > toIndent) {
            html += `</li></${listStack.pop().type}>`;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let m;

        if ((m = line.match(CODE_PH)) || (m = line.match(THINK_PH))) {
            flushPara();
            closeLists();
            html += line.trim();
        } else if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
            flushPara();
            closeLists();

            const head = splitCells(line);
            const align = splitCells(lines[i + 1]).map((c) =>
                c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "");
            const st = (j) => (align[j] ? ` style="text-align:${align[j]}"` : "");
            i += 2;
            const rows = [];
            while (i < lines.length && TABLE_ROW.test(lines[i])) {
                rows.push(splitCells(lines[i]));
                i++;
            }
            i--;

            html += '<div class="table-wrap"><table><thead><tr>' +
                head.map((c, j) => `<th${st(j)}>${renderInline(c)}</th>`).join("") +
                "</tr></thead><tbody>" +
                rows.map((r) => "<tr>" + head.map((_, j) => `<td${st(j)}>${renderInline(r[j] || "")}</td>`).join("") + "</tr>").join("") +
                "</tbody></table></div>";
        } else if ((m = line.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/))) {
            flushPara();
            closeLists();
            html += `<h${m[1].length}>${renderInline(m[2])}</h${m[1].length}>`;
        } else if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
            flushPara();
            closeLists();
            html += "<hr>";
        } else if ((m = line.match(LIST_ITEM))) {
            flushPara();
            const indent = indentOf(m[1]);
            const type = /\d/.test(m[2]) ? "ol" : "ul";

            closeLists(indent);
            const top = listStack[listStack.length - 1];

            if (top && top.indent === indent && top.type !== type) {
                html += `</li></${listStack.pop().type}>`;
            }

            const cur = listStack[listStack.length - 1];
            if (!cur || indent > cur.indent) {
                const start = type === "ol" && parseInt(m[2], 10) !== 1 ? ` start="${parseInt(m[2], 10)}"` : "";
                html += `<${type}${start}>`;
                listStack.push({ type, indent });
            } else {
                html += "</li>";
            }

            let content = m[3];
            const task = /^\[([ xX])\]\s+(.*)$/.exec(content);
            if (task) {
                const done = task[1] !== " ";
                html += `<li class="task${done ? " done" : ""}"><span class="box">${done ? ICONS.check.replace(/width="16" height="16"/, 'width="11" height="11"').replace('stroke-width="2"', 'stroke-width="3.5"') : ""}</span><span>${renderInline(task[2])}</span>`;
            } else {
                html += `<li>${renderInline(content)}`;
            }
        } else if (/^\s*&gt;/.test(line)) {
            flushPara();
            closeLists();
            const quote = [];
            while (i < lines.length && /^\s*&gt;/.test(lines[i])) {
                quote.push(lines[i].replace(/^\s*&gt;\s?/, ""));
                i++;
            }
            i--;
            html += `<blockquote>${renderBlocks(quote)}</blockquote>`;
        } else if (line.trim() === "") {
            flushPara();
            if (listStack.length) {
                // Пустая строка внутри списка: продолжаем, если дальше снова пункт или отступ
                let j = i + 1;
                while (j < lines.length && lines[j].trim() === "") j++;
                if (!(j < lines.length && (LIST_ITEM.test(lines[j]) || /^\s{2,}\S/.test(lines[j])))) closeLists();
            }
        } else if (listStack.length && /^\s+\S/.test(line)) {
            // Продолжение пункта списка
            html += `<br>${renderInline(line.trim())}`;
        } else {
            closeLists();
            para.push(line);
        }
    }
    flushPara();
    closeLists();
    return html;
}

function renderMarkdown(src, { streaming = false } = {}) {
    const codeBlocks = [];
    const inlineCodes = [];
    const thinks = [];

    // Размышления модели <think>…</think>
    let text = src.replace(/<think>([\s\S]*?)(<\/think>|$)/g, (m, body, closed) => {
        thinks.push({ body: body.trim(), open: !closed });
        return `\n\u0002${thinks.length - 1}\u0002\n`;
    });

    // Блоки кода (в том числе ещё не закрытые во время стриминга)
    text = text.replace(/(^|\n)([ \t]*)```([\w+#.-]*)[^\n]*\n([\s\S]*?)(?:\n[ \t]*```[ \t]*(?=\n|$)|$)/g, (m, pre, indent, lang, code) => {
        if (indent) code = code.split("\n").map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l)).join("\n");
        codeBlocks.push({ lang, code });
        return `${pre}\u0004${codeBlocks.length - 1}\u0004`;
    });

    text = escapeHtml(text);

    text = text.replace(/`([^`\n]+)`/g, (m, code) => {
        inlineCodes.push(code);
        return `\u0001${inlineCodes.length - 1}\u0001`;
    });

    let html = renderBlocks(text.split("\n"));

    html = html.replace(/\u0001(\d+)\u0001/g, (m, i) => `<code>${inlineCodes[i]}</code>`);

    html = html.replace(/\u0002(\d+)\u0002/g, (m, i) => {
        const t = thinks[i];
        if (!t.body && !t.open) return "";
        const label = t.open && streaming ? "Размышляю…" : "Ход рассуждений";
        return `<details class="think"${t.open && streaming ? " open" : ""}><summary>${label}</summary><div class="think-body">${escapeHtml(t.body)}</div></details>`;
    });

    html = html.replace(/\u0004(\d+)\u0004/g, (m, i) => {
        const block = codeBlocks[i];
        const lang = (block.lang || "").toLowerCase();
        const label = escapeHtml(block.lang || "код");
        const lineCount = block.code.split("\n").length;
        return (
            `<div class="code-block" data-lang="${escapeHtml(lang)}">` +
            `<div class="code-head"><span class="lang">${label}</span>` +
            (lineCount > 3 ? `<span class="lines">${lineCount} ${plural(lineCount, "строка", "строки", "строк")}</span>` : "") +
            `<button class="code-btn" type="button" data-code="wrap" title="Перенос строк">${ICONS.wrap}</button>` +
            `<button class="code-btn" type="button" data-code="download" title="Скачать файлом">${ICONS.download}</button>` +
            `<button class="code-btn" type="button" data-code="copy">${ICONS.copy}<span>Копировать</span></button></div>` +
            `<pre><code>${highlight(block.code, lang)}</code></pre></div>`
        );
    });

    return html;
}

/** Текст без разметки: для озвучки */
function plainText(md) {
    return md
        .replace(/<think>[\s\S]*?(<\/think>|$)/g, "")
        .replace(/```[\s\S]*?(```|$)/g, " (фрагмент кода) ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!?\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_~#>|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/* ============================================================
   Отрисовка
   ============================================================ */
function setSendState() {
    if (isStreaming) {
        sendBtn.innerHTML = ICONS.stop;
        sendBtn.classList.add("stop");
        sendBtn.disabled = false;
        sendBtn.setAttribute("aria-label", "Остановить генерацию");
        sendBtn.title = "Остановить (Esc)";
    } else {
        sendBtn.innerHTML = ICONS.send;
        sendBtn.classList.remove("stop");
        sendBtn.disabled = input.value.trim().length === 0 && pendingFiles.length === 0;
        sendBtn.setAttribute("aria-label", "Отправить");
        sendBtn.title = settings.enterToSend ? "Отправить (Enter)" : "Отправить (Ctrl+Enter)";
    }
}

function groupLabel(ts) {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = 86400000;
    if (ts >= startToday) return "Сегодня";
    if (ts >= startToday - day) return "Вчера";
    if (ts >= startToday - 7 * day) return "Последние 7 дней";
    if (ts >= startToday - 30 * day) return "Последние 30 дней";
    return "Ранее";
}

function highlightMatch(title, query) {
    const safe = escapeHtml(title);
    if (!query) return safe;
    const idx = title.toLowerCase().indexOf(query);
    if (idx < 0) return safe;
    return escapeHtml(title.slice(0, idx)) + "<mark>" + escapeHtml(title.slice(idx, idx + query.length)) + "</mark>" + escapeHtml(title.slice(idx + query.length));
}

function chatMenuItems(chat) {
    return [
        { label: chat.pinned ? "Открепить" : "Закрепить", icon: chat.pinned ? ICONS.unpin : ICONS.pin, onClick: () => togglePin(chat.id) },
        { label: "Переименовать", icon: ICONS.edit, onClick: () => renameChat(chat.id) },
        { label: "Экспорт в Markdown", icon: ICONS.md, onClick: () => exportChat(chat.id) },
        "sep",
        { label: "Удалить", icon: ICONS.trash, danger: true, onClick: () => deleteChat(chat.id) },
    ];
}

function renderSidebar() {
    const query = searchInput.value.trim().toLowerCase();
    let chats = [...state.chats].sort((a, b) => b.updatedAt - a.updatedAt);

    if (query) {
        chats = chats.filter(
            (c) =>
                c.title.toLowerCase().includes(query) ||
                c.messages.some((m) => m.content.toLowerCase().includes(query))
        );
    }

    chatListEl.innerHTML = "";

    if (!chats.length) {
        const empty = document.createElement("div");
        empty.className = "list-empty";
        empty.innerHTML = query ? "Ничего не найдено" : "Здесь появятся ваши чаты.<br>Начните с вопроса справа.";
        chatListEl.appendChild(empty);
        return;
    }

    const pinned = chats.filter((c) => c.pinned);
    const rest = chats.filter((c) => !c.pinned);

    const addLabel = (text, icon = "") => {
        const label = document.createElement("div");
        label.className = "group-label";
        label.innerHTML = icon + escapeHtml(text);
        chatListEl.appendChild(label);
    };

    const addItem = (chat) => {
        const item = document.createElement("div");
        item.className = "chat-item" + (chat.id === state.activeId ? " active" : "");

        const openBtn = document.createElement("button");
        openBtn.className = "chat-item-btn";
        openBtn.type = "button";
        openBtn.title = chat.title;
        openBtn.innerHTML = `<span class="t">${highlightMatch(chat.title, query)}</span>` +
            (chat.id === streamingChatId ? '<span class="live-dot" aria-label="Отвечает"></span>' : "");
        openBtn.addEventListener("click", () => openChat(chat.id));
        if (chat.id === state.activeId) openBtn.setAttribute("aria-current", "page");

        const more = document.createElement("button");
        more.className = "chat-item-more";
        more.type = "button";
        more.setAttribute("aria-label", "Действия с чатом");
        more.setAttribute("aria-haspopup", "menu");
        more.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
        more.addEventListener("click", (e) => {
            e.stopPropagation();
            openMenu(more, chatMenuItems(chat));
        });

        item.append(openBtn, more);
        chatListEl.appendChild(item);
    };

    if (pinned.length) {
        addLabel("Закреплённые");
        pinned.forEach(addItem);
    }

    let lastGroup = null;
    for (const chat of rest) {
        const group = groupLabel(chat.updatedAt);
        if (group !== lastGroup) {
            addLabel(group);
            lastGroup = group;
        }
        addItem(chat);
    }
}

function buildActionButton(icon, label, handler, { showLabel = false } = {}) {
    const btn = document.createElement("button");
    btn.className = "act-btn";
    btn.type = "button";
    btn.innerHTML = icon + (showLabel ? `<span>${escapeHtml(label)}</span>` : "");
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.addEventListener("click", () => handler(btn));
    return btn;
}

function buildFileChip(file, onRemove = null) {
    const chip = document.createElement("div");
    chip.className = "file-chip";
    chip.title = file.name;
    chip.innerHTML =
        `<span class="ext">${escapeHtml(fileExt(file.name).slice(0, 4))}</span>` +
        `<span class="meta"><b>${escapeHtml(file.name)}</b><small>${formatSize(file.size)}</small></span>`;
    if (onRemove) {
        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "remove";
        rm.innerHTML = ICONS.close;
        rm.setAttribute("aria-label", `Убрать ${file.name}`);
        rm.addEventListener("click", onRemove);
        chip.appendChild(rm);
    }
    return chip;
}

function buildMessageRow(role, content, opts = {}) {
    const { index = -1, isLast = false, isError = false, msg = null } = opts;

    const row = document.createElement("div");
    row.className = `message ${role}` + (isError ? " error" : "") + (isLast ? " last" : "");
    row.dataset.index = String(index);

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    if (role === "assistant") {
        avatar.innerHTML = isError
            ? svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>', 18)
            : '<svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><use href="#logo"/></svg>';
    }

    const body = document.createElement("div");
    body.className = "msg-body";

    if (msg && msg.files) {
        const chips = document.createElement("div");
        chips.className = "file-chips";
        msg.files.forEach((f) => chips.appendChild(buildFileChip(f)));
        body.appendChild(chips);
    }

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (role === "user" || isError) {
        bubble.textContent = content;
    } else {
        bubble.innerHTML = renderMarkdown(content);
    }
    if (content || role === "assistant") body.appendChild(bubble);

    if (!isError && msg) {
        const actions = document.createElement("div");
        actions.className = "msg-actions";

        if (role === "assistant" && msg.variants && msg.variants.length > 1) {
            const nav = document.createElement("span");
            nav.className = "variant-nav";
            const prev = buildActionButton(ICONS.left, "Предыдущий вариант", () => setVariant(index, msg.vi - 1));
            const next = buildActionButton(ICONS.right, "Следующий вариант", () => setVariant(index, msg.vi + 1));
            prev.disabled = msg.vi <= 0;
            next.disabled = msg.vi >= msg.variants.length - 1;
            const label = document.createElement("span");
            label.textContent = `${msg.vi + 1} / ${msg.variants.length}`;
            nav.append(prev, label, next);
            actions.appendChild(nav);
        }

        const copyBtn = buildActionButton(ICONS.copy, "Копировать", (btn) => {
            copyText(content, true).then((ok) => {
                if (ok) flashButton(btn, ICONS.check, ICONS.copy);
                else showToast("Не удалось скопировать");
            });
        });
        actions.appendChild(copyBtn);

        if (role === "user" && index >= 0) {
            actions.appendChild(buildActionButton(ICONS.edit, "Изменить", () => startEdit(index)));
        }
        if (role === "assistant") {
            if ("speechSynthesis" in window) {
                const speakBtn = buildActionButton(ICONS.speak, "Прочитать вслух", (btn) => toggleSpeak(content, btn));
                actions.appendChild(speakBtn);
            }
            if (isLast) actions.appendChild(buildActionButton(ICONS.redo, "Другой вариант ответа", regenerate));

            const metaParts = [];
            if (msg.meta && msg.meta.ms) metaParts.push(formatDuration(msg.meta.ms));
            if (msg.meta && msg.meta.stopped) metaParts.push("остановлено");
            if (msg.meta && msg.meta.model && serverConfig.models.length > 1) metaParts.push(shortModelName(msg.meta.model));
            if (metaParts.length) {
                const meta = document.createElement("span");
                meta.className = "msg-meta";
                meta.textContent = metaParts.join(" · ");
                actions.appendChild(meta);
            }
        }
        if (msg.ts) row.title = new Date(msg.ts).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
        body.appendChild(actions);
    }

    row.append(avatar, body);
    return { row, bubble, body };
}

function renderMessages(forceScroll = true) {
    const chat = getActiveChat();
    const messages = chat ? chat.messages : [];
    const prevScroll = chatEl.scrollTop;

    threadEl.innerHTML = "";
    mainEl.classList.toggle("empty", messages.length === 0);
    chatTitleEl.textContent = chat && messages.length ? chat.title : "";
    document.title = chat && messages.length ? `${chat.title} · ${APP_NAME}` : APP_NAME;
    moreBtn.hidden = !(chat && messages.length);
    input.placeholder = messages.length ? "Ответить…" : "Чем я могу помочь вам сегодня?";
    greetingEl.textContent = greetingText();

    messages.forEach((msg, i) => {
        const isLast = i === messages.length - 1 && msg.role === "assistant";
        const { row } = buildMessageRow(msg.role, msg.content, { index: i, isLast, msg });
        threadEl.appendChild(row);
    });

    if (forceScroll) scrollToBottom(true);
    else chatEl.scrollTop = prevScroll;
    updateScrollButton();
}

function renderStarters() {
    const box = $("starters");
    box.innerHTML = "";
    const pool = [...STARTERS].sort(() => Math.random() - 0.5).slice(0, 4);
    for (const s of pool) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "starter";
        btn.innerHTML = `<span class="ico">${ICONS[s.icon]}</span><span><b>${escapeHtml(s.title)}</b><small>${escapeHtml(s.sub)}</small></span>`;
        btn.addEventListener("click", () => {
            input.value = s.prompt;
            autoResize();
            updateCounter();
            setSendState();
            input.focus();
            // Для «Найти ошибку» ставим курсор внутрь блока кода
            const pos = s.prompt.includes("```\n\n```") ? s.prompt.indexOf("```\n\n```") + 4 : input.value.length;
            input.setSelectionRange(pos, pos);
        });
        box.appendChild(btn);
    }
}

/* ============================================================
   Прокрутка
   ============================================================ */
let stickToBottom = true;

function isNearBottom() {
    return chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 120;
}

function scrollToBottom(force = false) {
    if (force) stickToBottom = true;
    if (stickToBottom) chatEl.scrollTop = chatEl.scrollHeight;
}

function updateScrollButton() {
    scrollDownBtn.hidden = isNearBottom() || threadEl.children.length === 0;
}

/* ============================================================
   Действия с чатами
   ============================================================ */
function stopStreaming() {
    if (abortCtrl) abortCtrl.abort();
}

function openChat(id) {
    if (id === state.activeId) {
        closeSidebar();
        return;
    }
    stopStreaming();
    stopSpeaking();
    saveDraftNow();
    state.activeId = id;
    saveState();
    clearPendingFiles();
    renderSidebar();
    renderMessages();
    restoreDraft();
    closeSidebar();
    if (!coarsePointer) input.focus();
}

function newChat() {
    stopStreaming();
    stopSpeaking();
    saveDraftNow();
    state.activeId = null;
    saveState();
    searchInput.value = "";
    clearPendingFiles();
    renderSidebar();
    renderMessages();
    renderStarters();
    restoreDraft();
    closeSidebar();
    input.focus();
}

function saveDraftNow() {
    const key = state.activeId || "_new";
    if (input.value.trim()) drafts[key] = input.value;
    else delete drafts[key];
    try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch { /* пусто */ }
}

function togglePin(id) {
    const chat = state.chats.find((c) => c.id === id);
    if (!chat) return;
    chat.pinned = !chat.pinned;
    saveState();
    renderSidebar();
    showToast(chat.pinned ? "Чат закреплён" : "Чат откреплён");
}

async function renameChat(id) {
    const chat = state.chats.find((c) => c.id === id);
    if (!chat) return;

    const value = await askDialog({ title: "Переименовать чат", value: chat.title, okText: "Сохранить" });
    if (!value) return;

    chat.title = value.slice(0, 80);
    chat.customTitle = true;
    saveState();
    renderSidebar();
    if (state.activeId === id) {
        chatTitleEl.textContent = chat.title;
        document.title = `${chat.title} · ${APP_NAME}`;
    }
}

function deleteChat(id) {
    const index = state.chats.findIndex((c) => c.id === id);
    if (index < 0) return;
    const chat = state.chats[index];
    const wasActive = state.activeId === id;

    if (wasActive) {
        stopStreaming();
        stopSpeaking();
        state.activeId = null;
    }
    state.chats.splice(index, 1);
    saveState();
    renderSidebar();
    if (wasActive) {
        renderMessages();
        renderStarters();
    }

    showToast(`Чат «${chat.title.length > 28 ? chat.title.slice(0, 28) + "…" : chat.title}» удалён`, {
        action: {
            label: "Вернуть",
            fn: () => {
                state.chats.splice(Math.min(index, state.chats.length), 0, chat);
                if (wasActive) state.activeId = chat.id;
                saveState();
                renderSidebar();
                if (wasActive) renderMessages();
            },
        },
    });
}

function chatToMarkdown(chat) {
    const lines = [`# ${chat.title}`, ""];
    for (const m of chat.messages) {
        lines.push(`**${m.role === "user" ? "Вы" : APP_NAME}:**`, "");
        if (m.files) lines.push(m.files.map((f) => `📎 ${f.name}`).join("  "), "");
        lines.push(m.content, "");
    }
    return lines.join("\n");
}

function exportChat(id) {
    const chat = state.chats.find((c) => c.id === id);
    if (!chat) return;
    downloadFile(`${safeName(chat.title)}.md`, chatToMarkdown(chat), "text/markdown;charset=utf-8");
}

function setVariant(index, vi) {
    const chat = getActiveChat();
    const msg = chat && chat.messages[index];
    if (!msg || !msg.variants || isStreaming) return;
    const next = Math.min(Math.max(0, vi), msg.variants.length - 1);
    msg.vi = next;
    msg.content = msg.variants[next].content;
    msg.meta = msg.variants[next].meta;
    saveState();
    renderMessages(false);
}

/* ============================================================
   Отправка и стриминг
   ============================================================ */
function apiContent(msg) {
    if (msg.role !== "user" || !msg.files) return msg.content;
    const files = msg.files
        .map((f) => `Файл «${f.name}»:\n\`\`\`${fileExt(f.name)}\n${f.text}\n\`\`\``)
        .join("\n\n");
    return msg.content.trim() ? `${files}\n\n${msg.content}` : files;
}

function buildPayload(chat) {
    let history = chat.messages.slice(-Math.max(2, settings.history)).map((m) => ({ role: m.role, content: apiContent(m) }));
    // История должна начинаться с сообщения пользователя
    while (history.length > 1 && history[0].role !== "user") history.shift();
    // Не превышаем общий лимит сервера: отбрасываем самые старые
    let total = history.reduce((n, m) => n + m.content.length, 0);
    while (history.length > 1 && total > MAX_PAYLOAD_CHARS) {
        total -= history.shift().content.length;
    }

    const payload = {
        messages: history,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
    };
    const model = currentModel();
    if (model) payload.model = model;
    const instructions = settings.instructions.trim();
    if (instructions) payload.system = instructions;
    return payload;
}

function friendlyError(err) {
    if (err instanceof TypeError) return "сервер недоступен. Проверьте подключение к интернету.";
    return err.message || "неизвестная ошибка";
}

async function streamReply(chat, { previous = null } = {}) {
    isStreaming = true;
    streamingChatId = chat.id;
    abortCtrl = new AbortController();
    const ctrl = abortCtrl;
    setSendState();
    renderSidebar();

    const { row, bubble } = buildMessageRow("assistant", "");
    row.classList.add("streaming");
    bubble.innerHTML = '<span class="thinking"><span class="dots"><i></i><i></i><i></i></span>Думаю<span class="elapsed"></span></span>';
    threadEl.appendChild(row);
    scrollToBottom(true);

    const started = performance.now();
    const elapsedEl = bubble.querySelector(".elapsed");
    const tick = setInterval(() => {
        const s = (performance.now() - started) / 1000;
        if (s > 2 && elapsedEl.isConnected) elapsedEl.textContent = ` · ${Math.floor(s)} с`;
    }, 500);

    let fullReply = "";
    let gotFirstChunk = false;
    let errorMessage = null;
    let frame = 0;

    const paint = () => {
        frame = 0;
        let html = renderMarkdown(fullReply, { streaming: true });
        const tail = /<\/(p|li|h[1-6]|blockquote)>((?:<\/(?:ul|ol|li|blockquote)>)*)$/;
        html = tail.test(html)
            ? html.replace(tail, '<span class="caret"></span></$1>$2')
            : html + '<span class="caret"></span>';
        bubble.innerHTML = html;
        scrollToBottom();
    };

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload(chat)),
            signal: ctrl.signal,
        });

        if (!response.ok) {
            let text = `ошибка сервера (${response.status})`;
            try {
                const data = await response.json();
                if (data.error) text = data.error;
            } catch {
                // Ответ не в JSON, оставляем стандартный текст
            }
            throw new Error(text);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fullReply += decoder.decode(value, { stream: true });
            if (!gotFirstChunk && fullReply.trim()) {
                gotFirstChunk = true;
                clearInterval(tick);
            }
            if (gotFirstChunk && !frame) frame = requestAnimationFrame(paint);
        }
        fullReply += decoder.decode();
    } catch (err) {
        if (err.name !== "AbortError") errorMessage = friendlyError(err);
    }

    clearInterval(tick);
    if (frame) cancelAnimationFrame(frame);
    const stopped = ctrl.signal.aborted;

    // Сервер сообщает об ошибке модели текстом: не сохраняем её как ответ
    const serverError = /^\s*\*\*Ошибка[^*]*\*\*/.test(fullReply) ? fullReply.replace(/\*\*/g, "").replace(/^\s*Ошибка:?\s*/, "").trim() : null;
    if (serverError) {
        errorMessage = serverError;
        fullReply = "";
        gotFirstChunk = false;
    }

    const meta = { ms: Math.round(performance.now() - started) };
    const model = currentModel();
    if (model) meta.model = model;
    if (stopped) meta.stopped = true;

    if (fullReply.trim()) {
        const msg = { role: "assistant", content: fullReply, meta, ts: Date.now() };
        if (previous) {
            msg.variants = [...previous, { content: fullReply, meta }].slice(-10);
            msg.vi = msg.variants.length - 1;
        }
        chat.messages.push(msg);
        chat.updatedAt = Date.now();
        saveState();
    } else if (previous) {
        // Перегенерация не удалась: возвращаем прежний ответ
        const last = previous[previous.length - 1];
        const msg = { role: "assistant", content: last.content, meta: last.meta };
        if (previous.length > 1) {
            msg.variants = previous;
            msg.vi = previous.length - 1;
        }
        chat.messages.push(msg);
        saveState();
    }

    isStreaming = false;
    streamingChatId = null;
    abortCtrl = null;
    setSendState();
    renderSidebar();

    if (state.activeId !== chat.id) return;

    renderMessages(false);
    if (errorMessage && !gotFirstChunk) {
        if (previous) showToast(`Не удалось получить ответ: ${errorMessage}`);
        else showError(errorMessage, chat);
        serverConfig.online = false;
        serverConfig.reason = errorMessage;
        paintStatus();
        checkStatus();
    } else if (errorMessage) {
        showToast("Соединение прервано, ответ сохранён частично");
    } else if (fullReply.trim()) {
        if (serverConfig.online !== true) {
            serverConfig.online = true;
            paintStatus();
        }
        maybeAutoTitle(chat);
    }
    scrollToBottom();
    if (!coarsePointer) input.focus();
}

function showError(message, chat) {
    const { row, body } = buildMessageRow("assistant", `Не удалось получить ответ: ${message}`, { isError: true });

    const actions = document.createElement("div");
    actions.className = "msg-actions";
    actions.appendChild(
        buildActionButton(ICONS.redo, "Повторить", () => {
            if (isStreaming) return;
            row.remove();
            streamReply(chat);
        }, { showLabel: true })
    );
    body.appendChild(actions);

    threadEl.appendChild(row);
    scrollToBottom(true);
}

async function maybeAutoTitle(chat) {
    if (!settings.autoTitle || chat.customTitle || chat.autoTitled) return;
    const firstUser = chat.messages.find((m) => m.role === "user");
    if (!firstUser || chat.messages.length > 2) return;
    chat.autoTitled = true;

    try {
        const text = (firstUser.files ? firstUser.files.map((f) => f.name).join(", ") + "\n" : "") + firstUser.content;
        const r = await fetch("/api/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, model: currentModel() || undefined }),
        });
        if (!r.ok) return;
        const data = await r.json();
        if (!data.title || chat.customTitle) return;
        chat.title = data.title.slice(0, 80);
        saveState();
        renderSidebar();
        if (state.activeId === chat.id) {
            chatTitleEl.textContent = chat.title;
            document.title = `${chat.title} · ${APP_NAME}`;
        }
    } catch {
        // Название останется по первому сообщению
    }
}

function sendMessage(text) {
    if (isStreaming) return;

    let chat = getActiveChat();
    if (!chat) {
        chat = createChat();
        state.activeId = chat.id;
    }

    const msg = { role: "user", content: text, ts: Date.now() };
    if (pendingFiles.length) msg.files = pendingFiles.map((f) => ({ ...f }));

    chat.messages.push(msg);
    chat.updatedAt = Date.now();
    if (chat.messages.length === 1) chat.title = makeTitle(text, msg.files);

    clearDraft(chat.id);
    clearDraft("_new");
    clearPendingFiles();
    saveState();
    renderSidebar();
    renderMessages(true);
    streamReply(chat);
}

function regenerate() {
    if (isStreaming) return;
    const chat = getActiveChat();
    if (!chat || !chat.messages.length) return;

    const last = chat.messages[chat.messages.length - 1];
    let previous = null;
    if (last.role === "assistant") {
        previous = last.variants ? last.variants.map((v) => ({ ...v })) : [{ content: last.content, meta: last.meta }];
        chat.messages.pop();
        saveState();
    }
    stopSpeaking();
    renderMessages(true);
    streamReply(chat, { previous });
}

function startEdit(index) {
    if (isStreaming) return;
    const chat = getActiveChat();
    if (!chat) return;

    const msg = chat.messages[index];
    if (!msg || msg.role !== "user") return;

    const row = threadEl.querySelector(`.message[data-index="${index}"]`);
    if (!row) return;

    const body = row.querySelector(".msg-body");
    body.innerHTML = "";
    body.style.flex = "1";
    body.style.maxWidth = "100%";

    if (msg.files) {
        const chips = document.createElement("div");
        chips.className = "file-chips";
        msg.files.forEach((f) => chips.appendChild(buildFileChip(f)));
        body.appendChild(chips);
    }

    const box = document.createElement("div");
    box.className = "edit-box";

    const ta = document.createElement("textarea");
    ta.value = msg.content;
    ta.maxLength = input.maxLength;
    ta.rows = 2;

    const resize = () => {
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 320) + "px";
    };

    const actions = document.createElement("div");
    actions.className = "edit-actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn";
    cancelBtn.textContent = "Отмена";
    cancelBtn.addEventListener("click", () => renderMessages(false));

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn primary";
    saveBtn.textContent = "Отправить";

    const save = () => {
        const text = ta.value.trim();
        if (!text && !msg.files) return;

        chat.messages = chat.messages.slice(0, index);
        const edited = { role: "user", content: text, ts: Date.now() };
        if (msg.files) edited.files = msg.files;
        chat.messages.push(edited);
        if (index === 0 && !chat.customTitle) {
            chat.title = makeTitle(text, msg.files);
            chat.autoTitled = false;
        }
        chat.updatedAt = Date.now();

        saveState();
        renderSidebar();
        renderMessages(true);
        streamReply(chat);
    };

    saveBtn.addEventListener("click", save);
    ta.addEventListener("input", resize);
    ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.isComposing && (settings.enterToSend || e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            save();
        } else if (e.key === "Escape") {
            e.stopPropagation();
            renderMessages(false);
        }
    });

    actions.append(cancelBtn, saveBtn);
    box.append(ta, actions);
    body.appendChild(box);

    resize();
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    row.scrollIntoView({ block: "nearest" });
}

/* ============================================================
   Вложения: текстовые файлы и код
   ============================================================ */
let pendingFiles = [];

const TEXT_EXT = new Set(("txt md markdown csv tsv json jsonc yaml yml toml ini env conf cfg log xml html htm css scss less sass " +
    "js mjs cjs jsx ts tsx vue svelte py rb php java kt kts swift go rs c h cpp hpp cc cs m sql sh bash zsh ps1 bat cmd " +
    "lua r dart scala pl ex exs erl hs clj gradle properties dockerfile makefile gitignore editorconfig tex srt vtt rst adoc").split(" "));

function looksLikeText(file) {
    if (file.type.startsWith("text/")) return true;
    if (/json|xml|javascript|typescript|yaml|x-sh|x-python|sql|csv/.test(file.type)) return true;
    const name = file.name.toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop() : name;
    return TEXT_EXT.has(ext);
}

function filesCharCount() {
    return pendingFiles.reduce((n, f) => n + f.text.length, 0);
}

function renderAttachments() {
    attachmentsEl.innerHTML = "";
    attachmentsEl.hidden = pendingFiles.length === 0;
    pendingFiles.forEach((f, i) => {
        attachmentsEl.appendChild(buildFileChip(f, () => {
            pendingFiles.splice(i, 1);
            renderAttachments();
            setSendState();
            input.focus();
        }));
    });
}

function clearPendingFiles() {
    pendingFiles = [];
    renderAttachments();
}

async function addFiles(fileList) {
    const files = [...fileList];
    let skipped = 0;
    for (const file of files) {
        if (pendingFiles.length >= MAX_FILES) {
            showToast(`Можно прикрепить не больше ${MAX_FILES} файлов`);
            break;
        }
        if (!looksLikeText(file)) {
            skipped++;
            continue;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast(`«${file.name}» больше ${formatSize(MAX_FILE_SIZE)}`);
            continue;
        }
        let text;
        try {
            text = await file.text();
        } catch {
            showToast(`Не удалось прочитать «${file.name}»`);
            continue;
        }
        if (text.includes("")) {
            skipped++;
            continue;
        }
        const room = MAX_FILES_CHARS - filesCharCount();
        if (room <= 0) {
            showToast("Достигнут лимит текста во вложениях");
            break;
        }
        if (text.length > room) {
            text = text.slice(0, room) + "\n…[файл обрезан]";
            showToast(`«${file.name}» обрезан, чтобы поместиться в контекст модели`);
        }
        pendingFiles.push({ name: file.name, size: file.size, text });
    }
    if (skipped) showToast("Модель понимает только текстовые файлы и код");
    renderAttachments();
    setSendState();
    input.focus();
}

/* ---------- Перетаскивание ---------- */
let dragDepth = 0;
const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes("Files");

stageEl.addEventListener("dragenter", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    dropZone.hidden = false;
});
stageEl.addEventListener("dragover", (e) => {
    if (hasFiles(e)) e.preventDefault();
});
stageEl.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) dropZone.hidden = true;
});
stageEl.addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    dropZone.hidden = true;
    addFiles(e.dataTransfer.files);
});

/* ============================================================
   Голосовой ввод и озвучка
   ============================================================ */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;

if (SpeechRec) {
    micBtn.hidden = false;
    micBtn.addEventListener("click", toggleDictation);
}

function toggleDictation() {
    if (recognizer) {
        recognizer.stop();
        return;
    }
    recognizer = new SpeechRec();
    recognizer.lang = navigator.language && navigator.language.startsWith("en") ? "en-US" : "ru-RU";
    recognizer.interimResults = true;
    recognizer.continuous = true;

    const base = input.value ? input.value.replace(/\s*$/, " ") : "";
    let finalText = "";

    recognizer.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const t = e.results[i][0].transcript;
            if (e.results[i].isFinal) finalText += t;
            else interim += t;
        }
        input.value = base + finalText + interim;
        autoResize();
        updateCounter();
        setSendState();
    };
    recognizer.onerror = (e) => {
        if (e.error === "not-allowed") showToast("Нет доступа к микрофону");
        else if (e.error !== "aborted" && e.error !== "no-speech") showToast("Голосовой ввод недоступен");
    };
    recognizer.onend = () => {
        recognizer = null;
        micBtn.classList.remove("recording");
        micBtn.setAttribute("aria-label", "Голосовой ввод");
        saveDraft();
    };

    try {
        recognizer.start();
        micBtn.classList.add("recording");
        micBtn.setAttribute("aria-label", "Остановить запись");
    } catch {
        recognizer = null;
        showToast("Не удалось включить микрофон");
    }
}

let speakingBtn = null;

function stopSpeaking() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (speakingBtn) {
        speakingBtn.innerHTML = ICONS.speak;
        speakingBtn.classList.remove("on");
        speakingBtn = null;
    }
}

function toggleSpeak(text, btn) {
    if (speakingBtn === btn) {
        stopSpeaking();
        return;
    }
    stopSpeaking();
    const utter = new SpeechSynthesisUtterance(plainText(text));
    const lang = /[а-яё]/i.test(text) ? "ru" : "en";
    const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) utter.voice = voice;
    utter.lang = lang === "ru" ? "ru-RU" : "en-US";
    utter.rate = 1.03;
    utter.onend = utter.onerror = () => {
        if (speakingBtn === btn) stopSpeaking();
    };
    speakingBtn = btn;
    btn.innerHTML = ICONS.mute;
    btn.classList.add("on");
    speechSynthesis.speak(utter);
}

/* ============================================================
   Боковая панель
   ============================================================ */
function openSidebar() {
    sidebarEl.classList.add("open");
    overlayEl.classList.add("show");
}

function closeSidebar() {
    sidebarEl.classList.remove("open");
    overlayEl.classList.remove("show");
}

function applyCollapsed() {
    layoutEl.classList.toggle("collapsed", settings.collapsed);
}

function setCollapsed(value) {
    settings.collapsed = value;
    saveSettings();
    applyCollapsed();
}

function toggleSidebar() {
    if (isMobile()) {
        if (sidebarEl.classList.contains("open")) closeSidebar();
        else openSidebar();
    } else {
        setCollapsed(!settings.collapsed);
    }
}

/* ============================================================
   Окно настроек
   ============================================================ */
const settingsDlg = $("settings-dialog");
const setName = $("set-name");
const setInstructions = $("set-instructions");
const setEnter = $("set-enter");
const setAutoTitle = $("set-autotitle");
const setModel = $("set-model");
const setTemp = $("set-temp");
const setMaxTokens = $("set-maxtokens");
const setHistory = $("set-history");
const importFile = $("import-file");

function tempLabel(t) {
    return t <= 0.3 ? "точно" : t <= 0.9 ? "сбалансированно" : "смело";
}

function syncSettingsUI() {
    setName.value = settings.name;
    setInstructions.value = settings.instructions;
    setEnter.checked = settings.enterToSend;
    setAutoTitle.checked = settings.autoTitle;
    setTemp.value = settings.temperature;
    setMaxTokens.value = settings.maxTokens;
    setHistory.value = settings.history;
    $("temp-out").textContent = `${Number(settings.temperature).toFixed(2)} · ${tempLabel(settings.temperature)}`;
    $("tokens-out").textContent = `${settings.maxTokens} токенов`;
    $("history-out").textContent = `${settings.history}`;

    document.querySelectorAll("[data-setting]").forEach((group) => {
        const key = group.dataset.setting;
        group.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.value === settings[key]));
    });
    fillModelSelect();
    renderDataStats();
}

function fillModelSelect() {
    const group = $("model-group");
    group.hidden = serverConfig.models.length < 2;
    setModel.innerHTML = serverConfig.models
        .map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(shortModelName(m))}</option>`)
        .join("");
    setModel.value = currentModel();
}

function renderDataStats() {
    const chats = state.chats.length;
    const messages = state.chats.reduce((n, c) => n + c.messages.length, 0);
    let bytes = 0;
    try { bytes = (localStorage.getItem(CHATS_KEY) || "").length * 2; } catch { bytes = 0; }
    $("data-stats").innerHTML =
        `<div class="stat"><b>${chats}</b><small>${plural(chats, "чат", "чата", "чатов")}</small></div>` +
        `<div class="stat"><b>${messages}</b><small>${plural(messages, "сообщение", "сообщения", "сообщений")}</small></div>` +
        `<div class="stat"><b>${formatSize(bytes)}</b><small>в браузере</small></div>`;
}

function openSettings(tab = "general") {
    syncSettingsUI();
    switchTab(tab);
    settingsDlg.showModal();
    closeSidebar();
}

function switchTab(tab) {
    document.querySelectorAll(".tab").forEach((t) => {
        const on = t.dataset.tab === tab;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
}

function renderPresets() {
    const box = $("presets");
    box.innerHTML = "";
    for (const p of PRESETS) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "preset";
        b.textContent = p.label;
        b.title = p.text;
        b.addEventListener("click", () => {
            setInstructions.value = p.text;
            settings.instructions = p.text;
            saveSettings();
            showToast(`Инструкция «${p.label}» применена`);
        });
        box.appendChild(b);
    }
}

function exportAllChats() {
    if (!state.chats.length) {
        showToast("Нет чатов для экспорта");
        return;
    }
    const data = { app: APP_NAME, exportedAt: new Date().toISOString(), chats: state.chats };
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(`chats-${date}.json`, JSON.stringify(data, null, 2), "application/json");
}

async function importChats(file) {
    try {
        const data = JSON.parse(await file.text());
        const incoming = sanitizeChats(Array.isArray(data) ? data : data.chats);
        if (!incoming.length) {
            showToast("В файле нет чатов");
            return;
        }

        const existing = new Set(state.chats.map((c) => c.id));
        let added = 0;
        for (const chat of incoming) {
            if (existing.has(chat.id)) continue;
            state.chats.push(chat);
            added++;
        }

        saveState();
        renderSidebar();
        renderDataStats();
        showToast(added ? `Импортировано: ${added} ${plural(added, "чат", "чата", "чатов")}` : "Все чаты уже есть");
    } catch {
        showToast("Не удалось прочитать файл");
    }
}

async function deleteAllChats() {
    if (!state.chats.length) {
        showToast("Чатов нет");
        return;
    }
    const ok = await askDialog({
        title: "Удалить все чаты?",
        text: "Вся история будет удалена без возможности восстановления. Закреплённые тоже.",
        okText: "Удалить всё",
        danger: true,
    });
    if (!ok) return;

    stopStreaming();
    state = { chats: [], activeId: null };
    drafts = {};
    try { localStorage.removeItem(DRAFTS_KEY); } catch { /* пусто */ }
    saveState();
    renderSidebar();
    renderMessages();
    renderStarters();
    renderDataStats();
    showToast("Все чаты удалены");
}

/* ============================================================
   Поле ввода
   ============================================================ */
function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 240) + "px";
}

function updateCounter() {
    const len = input.value.length;
    const max = input.maxLength;
    if (len > max * 0.8) {
        charCountEl.textContent = `${len} / ${max}`;
        charCountEl.classList.toggle("warn", len > max * 0.95);
    } else {
        charCountEl.textContent = "";
    }
}

function lastUserIndex() {
    const chat = getActiveChat();
    if (!chat) return -1;
    for (let i = chat.messages.length - 1; i >= 0; i--) if (chat.messages[i].role === "user") return i;
    return -1;
}

/* ============================================================
   События
   ============================================================ */
form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isStreaming) {
        stopStreaming();
        return;
    }

    const text = input.value.trim();
    if (!text && !pendingFiles.length) return;
    if (recognizer) recognizer.stop();

    input.value = "";
    autoResize();
    updateCounter();
    setSendState();
    sendMessage(text);
});

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        const send = settings.enterToSend || event.ctrlKey || event.metaKey;
        if (send) {
            event.preventDefault();
            if (!isStreaming) form.requestSubmit();
        }
    } else if (event.key === "ArrowUp" && !input.value && !isStreaming) {
        const idx = lastUserIndex();
        if (idx >= 0) {
            event.preventDefault();
            startEdit(idx);
        }
    }
});

input.addEventListener("input", () => {
    autoResize();
    updateCounter();
    setSendState();
    saveDraft();
});

input.addEventListener("paste", (event) => {
    const data = event.clipboardData;
    if (!data) return;
    if (data.files && data.files.length) {
        event.preventDefault();
        addFiles(data.files);
        return;
    }
    // Очень длинный текст удобнее прикрепить файлом, чтобы не засорять поле ввода
    const text = data.getData("text/plain");
    if (text && text.length > PASTE_TO_FILE && pendingFiles.length < MAX_FILES) {
        event.preventDefault();
        const looksLikeCode = /[{};]\s*$|^\s*(import|def|class|function|const|#include)\b/m.test(text);
        const name = `Вставленный текст ${pendingFiles.length + 1}.${looksLikeCode ? "code" : "txt"}`;
        const file = new File([text], name, { type: "text/plain" });
        addFiles([file]);
        showToast("Длинный текст прикреплён как файл");
    }
});

$("attach-btn").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
    if (fileInput.files.length) addFiles(fileInput.files);
    fileInput.value = "";
});

// Кнопки внутри блоков кода
threadEl.addEventListener("click", (event) => {
    const btn = event.target.closest(".code-btn");
    if (!btn) return;
    const block = btn.closest(".code-block");
    const code = block.querySelector("pre code").textContent;
    const action = btn.dataset.code;

    if (action === "copy") {
        copyText(code, true).then((ok) => {
            if (ok) flashButton(btn, `${ICONS.check}<span>Скопировано</span>`, `${ICONS.copy}<span>Копировать</span>`);
        });
    } else if (action === "wrap") {
        block.classList.toggle("wrap");
        btn.classList.toggle("on", block.classList.contains("wrap"));
    } else if (action === "download") {
        const EXT = { js: "js", javascript: "js", ts: "ts", typescript: "ts", python: "py", py: "py", bash: "sh", sh: "sh", shell: "sh",
            html: "html", css: "css", json: "json", sql: "sql", go: "go", rust: "rs", java: "java", cpp: "cpp", c: "c", csharp: "cs", cs: "cs",
            php: "php", ruby: "rb", yaml: "yml", yml: "yml", xml: "xml", markdown: "md", md: "md", tsx: "tsx", jsx: "jsx", kotlin: "kt", swift: "swift" };
        const lang = block.dataset.lang;
        downloadFile(`code.${EXT[lang] || lang || "txt"}`, code, "text/plain;charset=utf-8");
    }
});

chatEl.addEventListener("scroll", () => {
    stickToBottom = isNearBottom();
    updateScrollButton();
}, { passive: true });

scrollDownBtn.addEventListener("click", () => {
    stickToBottom = true;
    chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: "smooth" });
});

searchInput.addEventListener("input", renderSidebar);
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        e.stopPropagation();
        searchInput.value = "";
        renderSidebar();
        input.focus();
    } else if (e.key === "Enter") {
        const first = chatListEl.querySelector(".chat-item-btn");
        if (first) first.click();
    }
});

$("new-chat-btn").addEventListener("click", newChat);
$("top-new-btn").addEventListener("click", newChat);
$("settings-btn").addEventListener("click", () => openSettings());
overlayEl.addEventListener("click", closeSidebar);
$("collapse-btn").addEventListener("click", () => (isMobile() ? closeSidebar() : setCollapsed(true)));
$("menu-btn").addEventListener("click", () => (isMobile() ? openSidebar() : setCollapsed(false)));

// Меню действий текущего чата
moreBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const chat = getActiveChat();
    if (!chat) return;
    openMenu(moreBtn, [
        { label: chat.pinned ? "Открепить" : "Закрепить", icon: chat.pinned ? ICONS.unpin : ICONS.pin, onClick: () => togglePin(chat.id) },
        { label: "Переименовать", icon: ICONS.edit, onClick: () => renameChat(chat.id) },
        { label: "Копировать весь чат", icon: ICONS.copy, onClick: () => copyText(chatToMarkdown(chat)) },
        { label: "Экспорт в Markdown", icon: ICONS.md, onClick: () => exportChat(chat.id) },
        { label: "Печать / PDF", icon: ICONS.print, onClick: () => window.print() },
        "sep",
        { label: "Удалить", icon: ICONS.trash, danger: true, onClick: () => deleteChat(chat.id) },
    ]);
});

// Меню модели в верхней панели
$("model-pill").addEventListener("click", (event) => {
    event.stopPropagation();
    const pill = event.currentTarget;
    const items = serverConfig.models.map((m) => ({
        label: shortModelName(m),
        icon: m === currentModel() ? ICONS.check : '<svg width="16" height="16"></svg>',
        onClick: () => {
            settings.model = m;
            saveSettings();
            paintStatus();
            showToast(`Модель: ${shortModelName(m)}`);
        },
    }));
    if (items.length) items.push("sep");
    items.push({
        label: serverConfig.online ? "На связи · проверить ещё раз" : serverConfig.online === false ? `${serverConfig.reason || "Недоступна"} · проверить` : "Проверить соединение",
        icon: ICONS.refresh,
        onClick: () => {
            serverConfig.online = null;
            paintStatus();
            checkStatus().then(() => showToast(serverConfig.online ? "Модель на связи" : serverConfig.reason || "Модель недоступна"));
        },
    });
    items.push({ label: "Настройки модели", icon: ICONS.list, onClick: () => openSettings("model") });
    openMenu(pill, items);
});

document.addEventListener("click", (event) => {
    if (!popoverEl.hidden && !popoverEl.contains(event.target)) closeMenu();
});
window.addEventListener("resize", closeMenu);
chatListEl.addEventListener("scroll", closeMenu, { passive: true });

// Настройки
$("settings-close").addEventListener("click", () => settingsDlg.close());
$("settings-done").addEventListener("click", () => settingsDlg.close());
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

[settingsDlg, $("keys-dialog"), dlg].forEach((d) => {
    d.addEventListener("click", (event) => {
        if (event.target === d) d.close();
    });
});
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));

setName.addEventListener("input", () => {
    settings.name = setName.value;
    saveSettings();
    updateProfile();
});

setInstructions.addEventListener("input", () => {
    settings.instructions = setInstructions.value;
    saveSettings();
});

setEnter.addEventListener("change", () => {
    settings.enterToSend = setEnter.checked;
    saveSettings();
    setSendState();
});

setAutoTitle.addEventListener("change", () => {
    settings.autoTitle = setAutoTitle.checked;
    saveSettings();
});

setModel.addEventListener("change", () => {
    settings.model = setModel.value;
    saveSettings();
    paintStatus();
});

setTemp.addEventListener("input", () => {
    settings.temperature = Number(setTemp.value);
    $("temp-out").textContent = `${settings.temperature.toFixed(2)} · ${tempLabel(settings.temperature)}`;
    saveSettings();
});

setMaxTokens.addEventListener("input", () => {
    settings.maxTokens = Number(setMaxTokens.value);
    $("tokens-out").textContent = `${settings.maxTokens} токенов`;
    saveSettings();
});

setHistory.addEventListener("input", () => {
    settings.history = Number(setHistory.value);
    $("history-out").textContent = `${settings.history}`;
    saveSettings();
});

document.querySelectorAll("[data-setting]").forEach((group) => {
    group.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-value]");
        if (!btn) return;
        settings[group.dataset.setting] = btn.dataset.value;
        saveSettings();
        applyAppearance();
        group.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
    });
});

$("export-all-btn").addEventListener("click", exportAllChats);
$("import-btn").addEventListener("click", () => importFile.click());
$("delete-all-btn").addEventListener("click", deleteAllChats);
$("show-keys").addEventListener("click", () => {
    settingsDlg.close();
    $("keys-dialog").showModal();
});

importFile.addEventListener("change", () => {
    const file = importFile.files[0];
    if (file) importChats(file);
    importFile.value = "";
});

// Горячие клавиши
document.addEventListener("keydown", (event) => {
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if (event.key === "Escape") {
        if (document.querySelector("dialog[open]")) return;
        if (!popoverEl.hidden) return closeMenu();
        if (isStreaming) {
            event.preventDefault();
            stopStreaming();
            return;
        }
        closeSidebar();
        return;
    }
    if (mod && event.shiftKey && key === "o") {
        event.preventDefault();
        newChat();
    } else if (mod && key === "k") {
        event.preventDefault();
        if (isMobile()) openSidebar();
        else if (settings.collapsed) setCollapsed(false);
        searchInput.focus();
        searchInput.select();
    } else if (mod && key === "b") {
        event.preventDefault();
        toggleSidebar();
    } else if (mod && (key === "/" || event.code === "Slash")) {
        event.preventDefault();
        $("keys-dialog").showModal();
    } else if (key === "/" && !typing && !mod && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        input.focus();
    }
});

window.addEventListener("beforeunload", saveDraftNow);

/* ============================================================
   Старт
   ============================================================ */
document.title = APP_NAME;
$("brand-name").textContent = APP_NAME;
input.maxLength = 16000;

applyAppearance();
applyCollapsed();
updateProfile();
renderPresets();
renderStarters();

if (state.activeId && !getActiveChat()) state.activeId = null;

renderSidebar();
renderMessages(true);
restoreDraft();
setSendState();
paintStatus();
loadConfig();
if (!coarsePointer) input.focus();
