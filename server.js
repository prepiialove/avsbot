require('dotenv').config();
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://avsbot.onrender.com';
const ALLOWED_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite-preview-02-05', 'gemini-2.0-flash-exp'];
// ============================
//  PROCESS SAFETY
// ============================
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Safety] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('[Safety] Uncaught Exception:', err);
});

// ============================
//  STATE & PERSISTENCE
// ============================
let adminChatId = 404389668;
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

let sessions = new Map();
let aiEnabled = false;
let adminReplyTarget = new Map();

function loadSessions() {
    if (fs.existsSync(SESSIONS_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
            sessions = new Map(Object.entries(data));
            console.log(`[Sessions] Loaded ${sessions.size} sessions.`);
        } catch (err) { console.error('[Error] Loading sessions:', err); }
    } else {
        sessions = new Map();
        console.log('[Sessions] New session storage initialized.');
    }
}
loadSessions();

function saveSessions() {
    try {
        const obj = Object.fromEntries(sessions);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2));
    } catch (err) { console.error('[Error] Saving sessions:', err); }
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
console.log('[Bot] Polling v4.43 (Admin Delete + AI Fix) started.');

async function safeSend(chatId, text, options = {}) {
    const MAX_LENGTH = 3800;
    let finalMsg = text;
    if (text.length > MAX_LENGTH) {
        finalMsg = text.substring(0, MAX_LENGTH) + '\n\n... (текст скорочено)';
    }

    try {
        await bot.sendMessage(chatId, finalMsg, { ...options, parse_mode: 'Markdown' });
    } catch (err) {
        let cleanOptions = { ...options };
        if (err.message && (err.message.includes('url') || err.message.includes('URL'))) {
            // Remove problematic URL buttons but keep others
            if (cleanOptions.reply_markup && cleanOptions.reply_markup.inline_keyboard) {
                cleanOptions.reply_markup.inline_keyboard = cleanOptions.reply_markup.inline_keyboard.map(row =>
                    row.filter(btn => !btn.url || btn.url.startsWith('https://t.me'))
                ).filter(row => row.length > 0);
            }
        }

        if (err.message && (err.message.includes('entities') || err.message.includes('parse'))) {
            const plainText = finalMsg.replace(/[*_`]/g, '');
            await bot.sendMessage(chatId, plainText, { ...cleanOptions, parse_mode: undefined }).catch(e => console.error('[SafeSend] Critical Error:', e.message));
        } else {
            console.error(`[SafeSend] Error for chat ${chatId}:`, err.message);
            await bot.sendMessage(chatId, finalMsg, { ...cleanOptions, parse_mode: undefined }).catch(e => { });
        }
    }
}

// ============================
//  KEYBOARDS
// ============================
function getAdminKeyboard() {
    return {
        keyboard: [
            [{ text: '🖥 Адмін-панель' }, { text: '👥 Активні чати' }],
            [{ text: '📞 Замовлені дзвінки' }, { text: '📊 Статистика' }],
            [{ text: aiEnabled ? '🔴 Вимкнути AI' : '🟢 Увімкнути AI' }, { text: '⚡️ Швидкі Скрипти' }]
        ],
        resize_keyboard: true
    };
}

const USER_KEYBOARD = {
    keyboard: [
        [{ text: '🙋 Задати питання' }, { text: '💼 Вакансія PM' }],
        [{ text: '🏢 Про компанію' }, { text: '📞 Замовити дзвінок' }],
        [{ text: '🌐 Наш сайт' }]
    ],
    resize_keyboard: true
};

const SCRIPTS_KEYBOARD = {
    keyboard: [
        [{ text: '💼 Про вакансію РМ' }, { text: '🏢 Про компанію AVS' }],
        [{ text: '📍 Етапи воронки' }, { text: '💰 ЗП та умови' }],
        [{ text: '📝 Анкетування' }, { text: '🔙 Назад' }]
    ],
    resize_keyboard: true
};

const SCRIPTS = {
    '💼 Вакансія PM': `💼 *Вакансія Project Manager (Польща)*\n\n- Завдання: Масштабування бізнес-моделі на ринку Польщі.\n- Перші 3-4 місяці: Операційне керування (спікери, листи, вебінари, лендінги).\n- Далі: Побудова власної команди.\n- Вимоги: Польська B2+ (оплачуємо репетитора), знання Digital Marketing, Win-Win комунікація.`,
    '💼 Про вакансію РМ': `💼 *Вакансія Project Manager (Польща)*\n\n- Завдання: Масштабування бізнес-моделі на ринку Польщі.\n- Перші 3-4 місяці: Операційне керування (спікери, листи, вебінари, лендінги).\n- Далі: Побудова власної команди.\n- Вимоги: Польська B2+ (оплачуємо репетитора), знання Digital Marketing, Win-Win комунікація.`,
    '🏢 Про компанію': `🏢 *AVS EdTech — міжнародна компанія*\n\n- 7+ років на ринку.\n- Працюємо в Україні, Казахстані, Польщі (Marszałkowska 102), запускаємо Бразилію.\n- 350,000+ учнів на безкоштовному навчанні.\n- NPS продуктів = 90%.\n- Більше 2 млн грн донатів на ЗСУ.`,
    '🏢 Про компанію AVS': `🏢 *AVS EdTech — міжнародна компанія*\n\n- 7+ років на ринку.\n- Працюємо в Україні, Казахстані, Польщі (Marszałkowska 102), запускаємо Бразилію.\n- 350,000+ учнів на безкоштовному навчанні.\n- NPS продуктів = 90%.\n- Більше 2 млн грн донатів на ЗСУ.`,
    '📍 Етапи воронки': `📍 *Етапи рекрутингу в AVS:*\n\n1. Google-форма (скрінінг).\n2. Знайомство з рекрутером (@Recruiter_2000).\n3. Soft Skills інтерв'ю.\n4. Hard Skills інтерв'ю.\n5. Offer! 🎉`,
    '💰 ЗП та умови': `💰 *Умови для PM:*\n\n- Дохід: $1500 - $3000 (Ставка + % від результату).\n- Формат: Віддалено.\n- Графік: Пн-Пт, 09:00 - 18:00.\n- Бонуси: Доступ до навчання, оплата репетитора з польської, ріст до COO/CEO.`,
    '📝 Анкетування': `📝 *Будь ласка, заповніть форму для першого етапу:*\n\nhttps://forms.gle/v123456789 (приклад)\nПісля заповнення наш рекрутер @Recruiter_2000 зв'яжеться з вами.`,
    '🙋 Задати питання': `🙋 *Напишіть ваше питання прямо тут!*\n\nЯ або наш менеджер відповімо вам найближчим часом. Також ви можете активувати AI-помічника в меню адміна.`,
    '📞 Замовити дзвінок': `📞 *Замовити дзвінок*\n\nНапишіть ваш номер телефону в чат, і наш менеджер зв'яжеться з вами протягом робочого дня.`,
    '🌐 Наш сайт': `🌐 *Наш офіційний сайт:*\n\nhttps://avsbot.onrender.com/`
};

// ============================
//  CORE SESSION ENGINE
// ============================
function getOrCreateSession(sid, msg = null) {
    if (sessions.has(sid)) return sessions.get(sid);
    const newSession = {
        name: msg?.from?.first_name || 'Кандидат',
        phone: msg?.from?.username ? `@${msg.from.username}` : (msg?.chat?.id ? '📟 TG' : '—'),
        messages: [],
        tgChatId: msg?.chat?.id || null,
        created: Date.now()
    };
    sessions.set(sid, newSession);
    saveSessions();
    return newSession;
}

// ============================
//  AI
// ============================
async function getAIResponse(userMessage, customKey = null, customModel = null) {
    let apiKey = customKey || GEMINI_API_KEY;

    // Safeguard: remove accidental whitespace only
    if (apiKey) apiKey = apiKey.trim();

    // If no key at all, we can't do anything
    if (!apiKey) return null;
    const instruction = `Ти - Експерт-консультант компанії AVS EdTech та AI помічник для кандидата на вакансію PM. 
Твоя мета - відповідати чітко, професійно та по суті на питання кандидатів про компанію та вакансію.

ОСНОВНІ ФАКТИ ПРО КОМПАНІЮ ТА ВАКАНСІЮ:
- Компанія: AVS EdTech (E-Tech компанія). Навчає бухгалтерів (курси, вебінари) в Україні, Казахстані, Польщі, запускає Бразилію.
- Вакансія: Project Manager (керівник проєкту) для ринку Польщі.
- Зарплата / ЗП: Ставка від 800$ + % від KPI. Загальний дохід (Target) 2000-3000$. ЗП напряму прив'язана до фінансового результату проєкту.
- Задачі: Масштабування готового проєкту, запуск вебінарних воронок, робота зі спікерами, аналітика конверсій, утримання дедлайнів, win-win комунікація.
- Контакти / Зв'язок: Якщо питають контакти, кому писати, або що робити далі - відповідай, що кандидат повинен перемкнутися на "Менеджера" (синя кнопка в чаті) і написати туди. Ніколи не давай вигаданих номерів чи пошт.

ПРАВИЛА ТВОЄЇ РОБОТИ:
1. Відповідай коротко (2-4 речення). 
2. Використовуй термінологію компанії: воронки, вебінари, ліди, win-win комунікація, утримання дедлайнів, конверсія.
3. ПИШИ ТІЛЬКИ ТЕКСТОМ без Markdown та без **жирного** тексту.
4. Якщо питають те, чого ти не знаєш (або не стосується AVS) - кажи: "Це питання найкраще обговорити з народи менеджером. Напишіть йому, перемкнувши режим чату."
5. Коли вітаєшся, кажи: "Вітаю! Я AI помічник AVS EdTech. Чим можу допомогти з вакансією PM?"`;

    const MODELS = customModel && ALLOWED_MODELS.includes(customModel) ? [customModel] : ALLOWED_MODELS;

    for (const modelId of MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: instruction }] },
                    contents: [{ parts: [{ text: userMessage }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });
            console.log(`[AI] ${modelId} status: ${response.status}`);
            const data = await response.json();
            if (data.error) {
                console.error(`[AI] Error ${modelId}:`, JSON.stringify(data.error));
                continue;
            }
            let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.replace(/[*_#`]/g, '').trim();
        } catch (e) { console.error(`[AI] Exception ${modelId}:`, e.message); }
    }
    return 'No valid model available.';
}

// ============================
//  NOTIFICATIONS
// ============================
async function notifyAdmin(session, sessionId, isNew = false, aiReply = null, isCallback = false, isAiMode = false) {
    if (!adminChatId) return;
    const platform = session.tgChatId ? '📟 TG' : '🌐 Web';
    const adminUrl = `${BASE_URL}/admin.html?session=${sessionId}`;

    const inline_keyboard = [
        [
            { text: '✏️ Відповісти', callback_data: `reply_${sessionId}` },
            { text: '📜 Історія', callback_data: `hist_${sessionId}` }
        ],
        [
            { text: '🖥 Відкрити в адмінці', url: adminUrl }
        ]
    ];

    if (isCallback) {
        return safeSend(adminChatId, `📞 *ЗАМОВЛЕННЯ ДЗВІНКА!* 📞\n👤: *${session.name}*\n📞: ${session.phone}\n🌍: ${platform}`, { reply_markup: { inline_keyboard } });
    }
    if (isNew) {
        return safeSend(adminChatId, `🆕 *НОВИЙ ЛІД!* 🆕\n👤: *${session.name}*\n🌍: ${platform}\n📞: ${session.phone || '—'}`, { reply_markup: { inline_keyboard } });
    }
    if (aiReply && aiEnabled) {
        return safeSend(adminChatId, `🤖 *AI ВІДПОВІВ* (*${session.name}*):\n\n${aiReply.substring(0, 1500)}`, { reply_markup: { inline_keyboard } });
    }

    const lastMsg = session.messages.filter(m => m.from === 'user').slice(-1)[0];
    if (lastMsg) {
        const modeTag = isAiMode ? '🤖 [Режим AI]' : '👨🏻‍💻 [Повідомлення Менеджеру]';
        return safeSend(adminChatId, `💬 *${session.name}* (${platform})\n${modeTag}\n\n${lastMsg.text}\n\n🔗 [Відкрити в адмінці](${adminUrl})\n_Натисніть "Відповісти" нижче, щоб написати сюди, або кнопку "Відкрити"_`, { reply_markup: { inline_keyboard } });
    }
}

// ============================
//  BOT HANDLERS
// ============================
bot.onText(/\/start/, async (msg) => {
    console.log(`[Debug] Incoming /start from ${msg.chat.id} (${msg.from.first_name})`);
    const isAdmin = String(msg.chat.id) === String(adminChatId);
    if (isAdmin) {
        const adminUrl = `${BASE_URL}/admin.html`;
        await safeSend(adminChatId, `👋 *Панель Адміна* (v4.43)\n\n🤖 Стан AI: ${aiEnabled ? '🟢 УВІМКНЕНО' : '🔴 ВИМКНЕНО'}`, { reply_markup: getAdminKeyboard() });
        return safeSend(adminChatId, `🚀 *Швидкий доступ:*`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🖥 Відкрити Адмін-Панель', url: adminUrl }],
                    [{ text: '🌐 Відвідати сайт AVS', url: 'https://avsbot.onrender.com/index.html' }]
                ]
            }
        });
    }
    const sid = String(msg.chat.id);
    const isFirstTime = !sessions.has(sid);
    const s = getOrCreateSession(sid, msg);
    await safeSend(msg.chat.id, `Вітаємо в AVS EdTech! 🚀\n\nЯ — ваш Інтелектуальний Помічник. Оберіть пункт меню або просто напишіть ваше запитання.\n\n🌐 Наш сайт: https://avsbot.onrender.com/`, { reply_markup: USER_KEYBOARD });
    if (isFirstTime) await notifyAdmin(s, sid, true);
});

bot.on('message', async (msg) => {
    if (!msg.text) return;
    console.log(`[Debug] Incoming message from ${msg.chat.id}: ${msg.text}`);
    if (msg.text.startsWith('/')) return;
    const cid = String(msg.chat.id);
    const isAdmin = cid === String(adminChatId);

    if (isAdmin) {
        if (msg.text === '🖥 Адмін-панель') return safeSend(adminChatId, `🚀 [ВІДКРИТИ АДМІН-ПАНЕЛЬ](${BASE_URL}/admin.html?token=auth_required)`);
        if (msg.text === '👥 Активні чати') {
            const btns = [];
            sessions.forEach((s, sid) => btns.push([{ text: `${s.tgChatId ? '📟' : '🌐'} ${s.name}`, callback_data: `reply_${sid}` }]));
            return safeSend(adminChatId, btns.length ? `Оберіть чат:` : `Немає активних чатів.`, { reply_markup: { inline_keyboard: btns } });
        }
        if (msg.text === '📞 Замовлені дзвінки') {
            const btns = [];
            sessions.forEach((s, sid) => { if (s.messages.some(m => m.text?.includes('📞'))) btns.push([{ text: `📞 ${s.name} (${s.phone})`, callback_data: `reply_${sid}` }]); });
            return safeSend(adminChatId, btns.length ? `Замовлені дзвінки:` : `Немає активних запитів.`, { reply_markup: { inline_keyboard: btns } });
        }
        if (msg.text === '📊 Статистика') {
            const sArr = Array.from(sessions.values());
            return safeSend(adminChatId, `📊 *Статистика:*\n\n👥 Лідів: ${sArr.length}\n📟 TG: ${sArr.filter(s => s.tgChatId).length}\n🌐 Web: ${sArr.filter(s => !s.tgChatId).length}`);
        }
        if (msg.text === '🟢 Увімкнути AI' || msg.text === '🔴 Вимкнути AI' || msg.text === '🤖 AI: Увімк/Вимк') {
            aiEnabled = !aiEnabled;
            return safeSend(adminChatId, `🤖 Стан AI змінено на: ${aiEnabled ? '🟢 УВІМКНЕНО' : '🔴 ВИМКНЕНО'}`, { reply_markup: getAdminKeyboard() });
        }
        if (msg.text === '⚡️ Швидкі Скрипти') return safeSend(adminChatId, 'Оберіть скрипт:', { reply_markup: SCRIPTS_KEYBOARD });
        if (msg.text === '🔙 Назад') { adminReplyTarget.delete(adminChatId); return safeSend(adminChatId, 'Головне меню:', { reply_markup: getAdminKeyboard() }); }

        const sid = adminReplyTarget.get(adminChatId);
        if (sid && sessions.has(sid)) {
            const s = sessions.get(sid);
            const rTxt = SCRIPTS[msg.text] || msg.text;
            s.messages.push({ from: 'admin', text: rTxt, ts: Date.now(), delivered: false });
            saveSessions();
            if (s.tgChatId) safeSend(s.tgChatId, rTxt, { reply_markup: USER_KEYBOARD });
            return safeSend(adminChatId, `✅ Надіслано *${s.name}*`);
        }
    } else {
        const sid = String(msg.chat.id);
        const s = getOrCreateSession(sid, msg);
        if (SCRIPTS[msg.text]) return safeSend(msg.chat.id, SCRIPTS[msg.text], { reply_markup: USER_KEYBOARD });

        s.messages.push({ from: 'user', text: msg.text, ts: Date.now() });
        saveSessions();
        await notifyAdmin(s, sid);

        if (aiEnabled && !msg.text.includes('+')) {
            const aiReply = await getAIResponse(msg.text);
            if (aiReply) {
                s.messages.push({ from: 'admin', text: aiReply, ts: Date.now(), isAI: true, delivered: true });
                saveSessions();
                await safeSend(msg.chat.id, `🤖 AI: ${aiReply}`, { reply_markup: USER_KEYBOARD });
                await notifyAdmin(s, sid, false, aiReply);
            }
        }
    }
});

bot.on('callback_query', async (q) => {
    const data = q.data;
    if (data.startsWith('reply_')) {
        const sid = data.replace('reply_', '');
        if (sessions.has(sid)) {
            adminReplyTarget.set(adminChatId, sid);
            const s = sessions.get(sid);
            const hist = s.messages.slice(-8).map(m => `*${m.from === 'user' ? '👤' : '🤖'}*: ${m.text.substring(0, 500)}`).join('\n\n');
            const adminUrl = `${BASE_URL}/admin.html?session=${sid}`;

            await safeSend(adminChatId, `📜 Історія (${s.name}):\n\n${hist || '_Порожньо_'}\n\n✏️ *ВИ ВІДПОВІДАЄТЕ:* ${s.name}\nВведіть ваше повідомлення:`, {
                reply_markup: {
                    inline_keyboard: [[{ text: '🖥 Відкрити в адмінці', url: adminUrl }]]
                }
            });
            // Also send the scripts keyboard if needed, but safeSend would overwrite the inline one if we send it together.
            // Better to just show it once.
        }
    } else if (data.startsWith('hist_')) {
        const sid = data.replace('hist_', '');
        if (sessions.has(sid)) {
            const s = sessions.get(sid);
            const hist = s.messages.slice(-15).map(m => `*${m.from === 'user' ? '👥' : '🤖'}*: ${m.text}`).join('\n\n');
            const adminUrl = `${BASE_URL}/admin.html?session=${sid}`;
            await safeSend(adminChatId, `📜 Історія діалогу (${s.name}):\n\n${hist || '_Порожньо_'}`, {
                reply_markup: {
                    inline_keyboard: [[{ text: '🖥 Відкрити в адмінці', url: adminUrl }]]
                }
            });
        }
    }
    bot.answerCallbackQuery(q.id).catch(() => { });
});

// ============================
//  API EXPOSURE
// ============================
app.use(cors()); app.use(express.json()); app.use(express.static('.'));

app.get('/api/admin/sessions', (req, res) => res.json(Object.fromEntries(sessions)));

app.delete('/api/admin/sessions/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    if (sessions.has(sessionId)) {
        sessions.delete(sessionId);
        saveSessions();
        res.json({ ok: true });
    } else {
        res.status(404).json({ ok: false });
    }
});

app.post('/api/admin/reply', async (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessions.has(sessionId)) return res.status(404).json({ ok: false });
    const s = sessions.get(sessionId);
    s.messages.push({ from: 'admin', text: message, ts: Date.now(), delivered: s.tgChatId ? true : false });
    saveSessions();
    if (s.tgChatId) await safeSend(s.tgChatId, message, { reply_markup: USER_KEYBOARD });
    res.json({ ok: true });
});

app.post('/api/register', async (req, res) => {
    const { sessionId, name, phone } = req.body;
    const s = getOrCreateSession(sessionId);
    s.name = name || s.name; s.phone = phone || s.phone;
    saveSessions(); await notifyAdmin(s, sessionId, true);
    res.json({ ok: true });
});

app.post('/api/send', async (req, res) => {
    const { sessionId, message } = req.body;
    const s = getOrCreateSession(sessionId);
    s.messages.push({ from: 'user', text: message, ts: Date.now() });
    saveSessions(); await notifyAdmin(s, sessionId, false, null, false, false);
    res.json({ ok: true });
});

app.post('/api/ai_chat', async (req, res) => {
    const { sessionId, message, customKey, model } = req.body;

    // For the public "cheat sheet" assistant, we don't necessarily need sessions,
    // but we'll try to use it if provided.
    const s = sessionId !== 'cheat_sheet_user' ? getOrCreateSession(sessionId) : null;
    if (s) {
        s.messages.push({ from: 'user', text: message, ts: Date.now() });
        await notifyAdmin(s, sessionId, false, null, false, true);
    }

    let replyTxt;
if (model && !ALLOWED_MODELS.includes(model)) {
  return res.json({ error: `Model ${model} is not supported. Use one of: ${ALLOWED_MODELS.join(', ')}` });
}
replyTxt = await getAIResponse(message, customKey, model);

    if (!replyTxt) {
        return res.json({ reply: "Вибачте, сталася помилка при генерації відповіді. Спробуйте пізніше." });
    }

    if (s) {
        s.messages.push({ from: 'admin', text: replyTxt, ts: Date.now(), isAI: true, delivered: true });
        saveSessions();
        await notifyAdmin(s, sessionId, false, replyTxt);
    }
    res.json({ reply: replyTxt });
});

app.get('/api/admin/debug-ai', async (req, res) => {
    const key = process.env.GEMINI_API_KEY;
    const info = {
        hasKey: !!key,
        keyLength: key ? key.length : 0,
        keyStart: key ? key.substring(0, 6) + '...' : 'none',
        allowedModels: ALLOWED_MODELS,
        envPort: process.env.PORT,
        nodeVersion: process.version
    };

    if (!key) return res.json({ ...info, error: "GEMINI_API_KEY is missing in process.env" });

    const results = [];
    for (const mId of ALLOWED_MODELS) {
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${mId}:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
            });
            const data = await resp.json();
            results.push({ model: mId, status: resp.status, ok: !data.error, error: data.error?.message });
        } catch (e) {
            results.push({ model: mId, ok: false, error: e.message });
        }
    }

    res.json({
        ...info,
        overallStatus: results.some(r => r.ok) ? "OK" : "NO_WORKING_MODELS",
        checks: results
    });
});
app.get('/api/history', (req, res) => res.json({ messages: sessions.get(req.query.session)?.messages || [] }));
app.get('/api/poll', (req, res) => {
    const s = sessions.get(req.query.session);
    if (!s) return res.json({ messages: [] });
    const pending = s.messages.filter(m => m.from === 'admin' && !m.delivered);
    pending.forEach(m => m.delivered = true);
    if (pending.length) saveSessions();
    res.json({ messages: pending });
});

app.post('/api/callback', async (req, res) => {
    const { sessionId, name, phone } = req.body;
    const s = getOrCreateSession(sessionId);
    s.name = name || s.name; s.phone = phone || s.phone;
    s.messages.push({ from: 'user', text: `📞 Клієнт замовив дзвінок: ${phone}`, ts: Date.now() });
    saveSessions(); await notifyAdmin(s, sessionId, false, null, true);
    res.json({ ok: true });
});

app.listen(PORT, () => console.log(`🚀 AI Rich Scripts v4.43: ${BASE_URL}`));
