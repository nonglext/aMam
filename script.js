/* ============================================================
   Настройки приложения
   ============================================================ */
const APP_NAME = "Мой ИИ"; // Название вашего ИИ (показывается в панели и в экспорте)

const CHATS_KEY = "myai-v3";
const OLD_CHATS_KEY = "ai-chat-v2"; // Для переноса чатов из прошлой версии
const SETTINGS_KEY = "myai-settings";
const MAX_HISTORY_SENT = 20;
const MAX_CHATS = 100;

const $ = (id) => document.getElementById(id);

const root = document.documentElement;
const layoutEl = $("layout");
const sidebarEl = $("sidebar");
const overlayEl = $("overlay");
const mainEl = $("main");
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
const moreMenu = $("more-menu");

const ICONS = {
    send: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    stop: '<svg viewBox="0 0 24 24" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    redo: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
};

/* ============================================================
   Настройки пользователя
   ============================================================ */
const defaultSettings = {
    name: "",
    instructions: "",
    theme: "system",
    font: "serif",
    collapsed: false,
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
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0a0a0a" : "#ffffff");
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
   Чаты и хранилище
   ============================================================ */
function sanitizeChats(list) {
    if (!Array.isArray(list)) return [];
    const result = [];

    for (const chat of list) {
        if (!chat || typeof chat !== "object") continue;
        if (typeof chat.id !== "string" || !Array.isArray(chat.messages)) continue;

        const messages = chat.messages
            .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
            .map((m) => ({ role: m.role, content: m.content }));

        result.push({
            id: chat.id.slice(0, 40),
            title: typeof chat.title === "string" && chat.title.trim() ? chat.title.slice(0, 80) : "Новый чат",
            messages,
            updatedAt: Number.isFinite(chat.updatedAt) ? chat.updatedAt : Date.now(),
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

function saveState() {
    try {
        localStorage.setItem(CHATS_KEY, JSON.stringify(state));
    } catch {
        // Хранилище может быть недоступно
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
    };
    state.chats.push(chat);

    if (state.chats.length > MAX_CHATS) {
        state.chats.sort((a, b) => b.updatedAt - a.updatedAt);
        state.chats = state.chats.slice(0, MAX_CHATS);
    }
    return chat;
}

function makeTitle(text) {
    const clean = text.replace(/\s+/g, " ").trim();
    return clean.length > 48 ? clean.slice(0, 48).trim() + "…" : clean;
}

/* ============================================================
   Утилиты
   ============================================================ */
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

let toastTimer = null;
function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast("Скопировано");
    } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            showToast("Скопировано");
        } catch {
            showToast("Не удалось скопировать");
        }
        ta.remove();
    }
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

function isMobile() {
    return window.matchMedia("(max-width: 820px)").matches;
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
        }
    });
}

/* ============================================================
   Markdown
   ============================================================ */
function renderInline(text) {
    return text
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
        .replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
}

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_SEP = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

function splitCells(line) {
    return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function renderMarkdown(src) {
    const codeBlocks = [];
    const inlineCodes = [];

    // Блоки кода (в том числе ещё не закрытые во время стриминга)
    let text = src.replace(/```([\w+#.-]*)[^\S\n]*\n?([\s\S]*?)(```|$)/g, (m, lang, code) => {
        codeBlocks.push({ lang, code: code.replace(/\n$/, "") });
        return `\u0000${codeBlocks.length - 1}\u0000`;
    });

    text = escapeHtml(text);

    text = text.replace(/`([^`\n]+)`/g, (m, code) => {
        inlineCodes.push(code);
        return `\u0001${inlineCodes.length - 1}\u0001`;
    });

    const lines = text.split("\n");
    let html = "";
    let para = [];
    let listType = null;

    const flushPara = () => {
        if (para.length) {
            html += `<p>${renderInline(para.join("<br>"))}</p>`;
            para = [];
        }
    };
    const flushList = () => {
        if (listType) {
            html += `</${listType}>`;
            listType = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let m;

        if ((m = line.match(/^\u0000(\d+)\u0000$/))) {
            flushPara();
            flushList();
            html += `\u0000${m[1]}\u0000`;
        } else if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
            flushPara();
            flushList();

            const head = splitCells(line);
            i += 2;
            const rows = [];
            while (i < lines.length && TABLE_ROW.test(lines[i])) {
                rows.push(splitCells(lines[i]));
                i++;
            }
            i--;

            html += '<div class="table-wrap"><table><thead><tr>' +
                head.map((c) => `<th>${renderInline(c)}</th>`).join("") +
                "</tr></thead><tbody>" +
                rows.map((r) => "<tr>" + r.map((c) => `<td>${renderInline(c)}</td>`).join("") + "</tr>").join("") +
                "</tbody></table></div>";
        } else if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
            flushPara();
            flushList();
            html += `<h${m[1].length}>${renderInline(m[2])}</h${m[1].length}>`;
        } else if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
            flushPara();
            flushList();
            html += "<hr>";
        } else if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
            flushPara();
            if (listType !== "ul") {
                flushList();
                html += "<ul>";
                listType = "ul";
            }
            html += `<li>${renderInline(m[1])}</li>`;
        } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
            flushPara();
            if (listType !== "ol") {
                flushList();
                html += "<ol>";
                listType = "ol";
            }
            html += `<li>${renderInline(m[1])}</li>`;
        } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
            flushPara();
            flushList();
            html += `<blockquote>${renderInline(m[1])}</blockquote>`;
        } else if (line.trim() === "") {
            flushPara();
            flushList();
        } else {
            flushList();
            para.push(line);
        }
    }
    flushPara();
    flushList();

    html = html.replace(/\u0001(\d+)\u0001/g, (m, i) => `<code>${inlineCodes[i]}</code>`);

    html = html.replace(/\u0000(\d+)\u0000/g, (m, i) => {
        const block = codeBlocks[i];
        const label = escapeHtml(block.lang || "code");
        return (
            '<div class="code-block">' +
            `<div class="code-head"><span>${label}</span>` +
            '<button class="copy-code" type="button">Копировать</button></div>' +
            `<pre><code>${escapeHtml(block.code)}</code></pre></div>`
        );
    });

    return html;
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
    } else {
        sendBtn.innerHTML = ICONS.send;
        sendBtn.classList.remove("stop");
        sendBtn.disabled = input.value.trim().length === 0;
        sendBtn.setAttribute("aria-label", "Отправить");
    }
}

function groupLabel(ts) {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = 86400000;
    if (ts >= startToday) return "Сегодня";
    if (ts >= startToday - day) return "Вчера";
    if (ts >= startToday - 7 * day) return "Последние 7 дней";
    return "Ранее";
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
        empty.textContent = query ? "Ничего не найдено" : "Пока нет чатов";
        chatListEl.appendChild(empty);
        return;
    }

    let lastGroup = null;
    for (const chat of chats) {
        const group = groupLabel(chat.updatedAt);
        if (group !== lastGroup) {
            const label = document.createElement("div");
            label.className = "group-label";
            label.textContent = group;
            chatListEl.appendChild(label);
            lastGroup = group;
        }

        const item = document.createElement("div");
        item.className = "chat-item" + (chat.id === state.activeId ? " active" : "");

        const openBtn = document.createElement("button");
        openBtn.className = "chat-item-btn";
        openBtn.type = "button";
        openBtn.textContent = chat.title;
        openBtn.title = chat.title;
        openBtn.addEventListener("click", () => openChat(chat.id));

        const tools = document.createElement("div");
        tools.className = "chat-item-tools";

        const renameBtn = document.createElement("button");
        renameBtn.className = "tool-btn";
        renameBtn.type = "button";
        renameBtn.innerHTML = ICONS.edit;
        renameBtn.setAttribute("aria-label", "Переименовать чат");
        renameBtn.title = "Переименовать";
        renameBtn.addEventListener("click", () => renameChat(chat.id));

        const delBtn = document.createElement("button");
        delBtn.className = "tool-btn danger";
        delBtn.type = "button";
        delBtn.innerHTML = ICONS.trash;
        delBtn.setAttribute("aria-label", "Удалить чат");
        delBtn.title = "Удалить";
        delBtn.addEventListener("click", () => deleteChat(chat.id));

        tools.append(renameBtn, delBtn);
        item.append(openBtn, tools);
        chatListEl.appendChild(item);
    }
}

function buildActionButton(icon, label, handler) {
    const btn = document.createElement("button");
    btn.className = "act-btn";
    btn.type = "button";
    btn.innerHTML = icon + label;
    btn.addEventListener("click", handler);
    return btn;
}

function buildMessageRow(role, content, opts = {}) {
    const { index = -1, isLast = false, isError = false } = opts;

    const row = document.createElement("div");
    row.className = `message ${role}` + (isError ? " error" : "");
    row.dataset.index = String(index);

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    if (role === "user") {
        avatar.textContent = (settings.name.trim()[0] || "Я").toUpperCase();
    } else {
        avatar.innerHTML = '<svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><use href="#logo"/></svg>';
    }

    const body = document.createElement("div");
    body.className = "msg-body";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (role === "user" || isError) {
        bubble.textContent = content;
    } else {
        bubble.innerHTML = renderMarkdown(content);
    }
    body.appendChild(bubble);

    if (!isError && content) {
        const actions = document.createElement("div");
        actions.className = "msg-actions";
        actions.appendChild(buildActionButton(ICONS.copy, "Копировать", () => copyText(content)));

        if (role === "user" && index >= 0) {
            actions.appendChild(buildActionButton(ICONS.edit, "Изменить", () => startEdit(index)));
        }
        if (role === "assistant" && isLast) {
            actions.appendChild(buildActionButton(ICONS.redo, "Повторить", regenerate));
        }
        body.appendChild(actions);
    }

    row.append(avatar, body);
    return { row, bubble, body };
}

function renderMessages(forceScroll = true) {
    const chat = getActiveChat();
    const messages = chat ? chat.messages : [];

    threadEl.innerHTML = "";
    mainEl.classList.toggle("empty", messages.length === 0);
    chatTitleEl.textContent = chat && messages.length ? chat.title : "";
    moreBtn.hidden = !(chat && messages.length);
    moreMenu.hidden = true;
    greetingEl.textContent = greetingText();

    messages.forEach((msg, i) => {
        const isLast = i === messages.length - 1 && msg.role === "assistant";
        const { row } = buildMessageRow(msg.role, msg.content, { index: i, isLast });
        threadEl.appendChild(row);
    });

    if (forceScroll) scrollToBottom(true);
    updateScrollButton();
}

/* ============================================================
   Прокрутка
   ============================================================ */
function isNearBottom() {
    return chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight < 140;
}

function scrollToBottom(force = false) {
    if (force || isNearBottom()) chatEl.scrollTop = chatEl.scrollHeight;
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
    stopStreaming();
    state.activeId = id;
    saveState();
    renderSidebar();
    renderMessages();
    closeSidebar();
    input.focus();
}

function newChat() {
    stopStreaming();
    state.activeId = null;
    saveState();
    searchInput.value = "";
    renderSidebar();
    renderMessages();
    closeSidebar();
    input.focus();
}

async function renameChat(id) {
    const chat = state.chats.find((c) => c.id === id);
    if (!chat) return;

    const value = await askDialog({ title: "Переименовать чат", value: chat.title, okText: "Сохранить" });
    if (!value) return;

    chat.title = value.slice(0, 80);
    saveState();
    renderSidebar();
    if (state.activeId === id) chatTitleEl.textContent = chat.title;
}

async function deleteChat(id) {
    const chat = state.chats.find((c) => c.id === id);
    if (!chat) return;

    const ok = await askDialog({
        title: "Удалить чат?",
        text: `Чат «${chat.title}» будет удалён без возможности восстановления.`,
        okText: "Удалить",
        danger: true,
    });
    if (!ok) return;

    if (state.activeId === id) {
        stopStreaming();
        state.activeId = null;
    }
    state.chats = state.chats.filter((c) => c.id !== id);
    saveState();
    renderSidebar();
    renderMessages();
}

function chatToMarkdown(chat) {
    const lines = [`# ${chat.title}`, ""];
    for (const m of chat.messages) {
        lines.push(`**${m.role === "user" ? "Вы" : APP_NAME}:**`, "", m.content, "");
    }
    return lines.join("\n");
}

function exportChat(id) {
    const chat = state.chats.find((c) => c.id === id);
    if (!chat) return;
    downloadFile(`${safeName(chat.title)}.md`, chatToMarkdown(chat), "text/markdown;charset=utf-8");
}

/* ============================================================
   Отправка и стриминг
   ============================================================ */
async function streamReply(chat) {
    isStreaming = true;
    abortCtrl = new AbortController();
    setSendState();

    const { row, bubble } = buildMessageRow("assistant", "");
    bubble.innerHTML = '<span class="thinking"><span class="star"><svg class="logo" viewBox="0 0 24 24" aria-hidden="true"><use href="#logo"/></svg></span>Думаю…</span>';
    threadEl.appendChild(row);
    scrollToBottom(true);

    let fullReply = "";
    let gotFirstChunk = false;
    let errorMessage = null;

    const paint = () => {
        let html = renderMarkdown(fullReply);
        const tail = /<\/(p|li|h[1-4]|blockquote)>$/;
        html = tail.test(html)
            ? html.replace(tail, '<span class="caret"></span></$1>')
            : html + '<span class="caret"></span>';
        bubble.innerHTML = html;
        scrollToBottom();
    };

    try {
        const payload = { messages: chat.messages.slice(-MAX_HISTORY_SENT) };
        const instructions = settings.instructions.trim();
        if (instructions) payload.system = instructions;

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: abortCtrl.signal,
        });

        if (!response.ok) {
            let text = `Ошибка сервера (${response.status})`;
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
            gotFirstChunk = true;
            paint();
        }
        fullReply += decoder.decode();
    } catch (err) {
        if (err.name !== "AbortError") {
            errorMessage = err.message || "Неизвестная ошибка";
        }
    }

    // Сохраняем ответ (полный или остановленный на середине)
    if (fullReply.trim()) {
        chat.messages.push({ role: "assistant", content: fullReply });
        chat.updatedAt = Date.now();
        saveState();
    }

    isStreaming = false;
    abortCtrl = null;
    setSendState();
    renderSidebar();

    if (state.activeId !== chat.id) return;

    renderMessages(false);
    if (errorMessage && !gotFirstChunk) {
        showError(errorMessage, chat);
    } else if (errorMessage) {
        showToast("Соединение прервано, ответ сохранён частично");
    }
    scrollToBottom();
    input.focus();
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
        })
    );
    body.appendChild(actions);

    threadEl.appendChild(row);
    scrollToBottom(true);
}

function sendMessage(text) {
    if (isStreaming) return;

    let chat = getActiveChat();
    if (!chat) {
        chat = createChat();
        state.activeId = chat.id;
    }

    chat.messages.push({ role: "user", content: text });
    chat.updatedAt = Date.now();
    if (chat.messages.length === 1) chat.title = makeTitle(text);

    saveState();
    renderSidebar();
    renderMessages(true);
    streamReply(chat);
}

function regenerate() {
    if (isStreaming) return;
    const chat = getActiveChat();
    if (!chat || !chat.messages.length) return;

    if (chat.messages[chat.messages.length - 1].role === "assistant") {
        chat.messages.pop();
        saveState();
    }
    renderMessages(true);
    streamReply(chat);
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

    const box = document.createElement("div");
    box.className = "edit-box";

    const ta = document.createElement("textarea");
    ta.value = msg.content;
    ta.maxLength = 4000;
    ta.rows = 2;

    const resize = () => {
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 260) + "px";
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
        if (!text) return;

        chat.messages = chat.messages.slice(0, index);
        chat.messages.push({ role: "user", content: text });
        if (index === 0) chat.title = makeTitle(text);
        chat.updatedAt = Date.now();

        saveState();
        renderSidebar();
        renderMessages(true);
        streamReply(chat);
    };

    saveBtn.addEventListener("click", save);
    ta.addEventListener("input", resize);
    ta.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            save();
        } else if (e.key === "Escape") {
            renderMessages(false);
        }
    });

    actions.append(cancelBtn, saveBtn);
    box.append(ta, actions);
    body.appendChild(box);

    resize();
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
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

/* ============================================================
   Окно настроек
   ============================================================ */
const settingsDlg = $("settings-dialog");
const setName = $("set-name");
const setInstructions = $("set-instructions");
const setTheme = $("set-theme");
const setFont = $("set-font");
const importFile = $("import-file");

function openSettings() {
    setName.value = settings.name;
    setInstructions.value = settings.instructions;
    setTheme.value = settings.theme;
    setFont.value = settings.font;
    settingsDlg.showModal();
}

function exportAllChats() {
    if (!state.chats.length) {
        showToast("Нет чатов для экспорта");
        return;
    }
    const data = { app: APP_NAME, exportedAt: new Date().toISOString(), chats: state.chats };
    downloadFile("chats.json", JSON.stringify(data, null, 2), "application/json");
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
        showToast(added ? `Импортировано чатов: ${added}` : "Все чаты уже есть");
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
        text: "Вся история будет удалена без возможности восстановления.",
        okText: "Удалить всё",
        danger: true,
    });
    if (!ok) return;

    stopStreaming();
    state = { chats: [], activeId: null };
    saveState();
    renderSidebar();
    renderMessages();
    showToast("Все чаты удалены");
}

/* ============================================================
   Поле ввода
   ============================================================ */
function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 220) + "px";
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
    if (!text) return;

    input.value = "";
    autoResize();
    updateCounter();
    setSendState();
    sendMessage(text);
});

input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        if (!isStreaming) form.requestSubmit();
    }
});

input.addEventListener("input", () => {
    autoResize();
    updateCounter();
    setSendState();
});

$("starters").addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    input.value = chip.dataset.prompt;
    autoResize();
    updateCounter();
    setSendState();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
});

threadEl.addEventListener("click", (event) => {
    const btn = event.target.closest(".copy-code");
    if (!btn) return;

    copyText(btn.closest(".code-block").querySelector("pre code").textContent);
    btn.textContent = "Готово";
    setTimeout(() => (btn.textContent = "Копировать"), 1500);
});

chatEl.addEventListener("scroll", updateScrollButton, { passive: true });
scrollDownBtn.addEventListener("click", () => {
    chatEl.scrollTo({ top: chatEl.scrollHeight, behavior: "smooth" });
});

searchInput.addEventListener("input", renderSidebar);

$("new-chat-btn").addEventListener("click", newChat);
$("settings-btn").addEventListener("click", openSettings);
overlayEl.addEventListener("click", closeSidebar);

$("collapse-btn").addEventListener("click", () => {
    if (isMobile()) closeSidebar();
    else setCollapsed(true);
});

$("menu-btn").addEventListener("click", () => {
    if (isMobile()) openSidebar();
    else setCollapsed(false);
});

// Меню действий текущего чата
moreBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    moreMenu.hidden = !moreMenu.hidden;
});

moreMenu.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn || !state.activeId) return;
    moreMenu.hidden = true;

    const id = state.activeId;
    if (btn.dataset.action === "rename") renameChat(id);
    else if (btn.dataset.action === "export") exportChat(id);
    else if (btn.dataset.action === "delete") deleteChat(id);
});

document.addEventListener("click", (event) => {
    if (!moreMenu.hidden && !event.target.closest(".menu-wrap")) moreMenu.hidden = true;
});

// Настройки
$("settings-close").addEventListener("click", () => settingsDlg.close());
$("settings-done").addEventListener("click", () => settingsDlg.close());

settingsDlg.addEventListener("click", (event) => {
    if (event.target === settingsDlg) settingsDlg.close();
});

setName.addEventListener("input", () => {
    settings.name = setName.value;
    saveSettings();
    updateProfile();
});

setInstructions.addEventListener("input", () => {
    settings.instructions = setInstructions.value;
    saveSettings();
});

setTheme.addEventListener("change", () => {
    settings.theme = setTheme.value;
    saveSettings();
    applyAppearance();
});

setFont.addEventListener("change", () => {
    settings.font = setFont.value;
    saveSettings();
    applyAppearance();
});

$("export-all-btn").addEventListener("click", exportAllChats);
$("import-btn").addEventListener("click", () => importFile.click());
$("delete-all-btn").addEventListener("click", deleteAllChats);

importFile.addEventListener("change", () => {
    const file = importFile.files[0];
    if (file) importChats(file);
    importFile.value = "";
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeSidebar();
        moreMenu.hidden = true;
    }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        newChat();
    }
});

/* ============================================================
   Старт
   ============================================================ */
document.title = APP_NAME;
$("brand-name").textContent = APP_NAME;

applyAppearance();
applyCollapsed();
updateProfile();

if (state.activeId && !getActiveChat()) state.activeId = null;

renderSidebar();
renderMessages(true);
setSendState();
input.focus();