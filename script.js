// Intersection Observer for Scroll Animations
document.addEventListener("DOMContentLoaded", () => {

    const reveals = document.querySelectorAll(".reveal");

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, {
        root: null,
        rootMargin: "0px",
        threshold: 0.15
    });

    reveals.forEach(reveal => {
        revealObserver.observe(reveal);
    });

    setTimeout(() => {
        const topHero = document.getElementById('hero');
        if (topHero) {
            topHero.classList.add('active');
        }
    }, 100);

    // Smooth Scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// AI Assistant Logic (Only runs if elements exist)
const aiChatBox = document.getElementById('ai-chat-box');
const aiInput = document.getElementById('ai-input');
const aiSendBtn = document.getElementById('ai-send-btn');
const aiSettingsBtn = document.getElementById('ai-settings-btn');

// Settings Modal Elements
const settingsModal = document.getElementById('settings-modal');
const modalApiKey = document.getElementById('modal-api-key');
const modalModel = document.getElementById('modal-model');
const modalSaveBtn = document.getElementById('modal-save-btn');
const modalResetBtn = document.getElementById('modal-reset-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalStatus = document.getElementById('modal-status');
const showKeyToggle = document.getElementById('show-key-toggle');

const GEMINI_API_KEY_STORAGE = 'gemini_api_key';
const GEMINI_MODEL_STORAGE = 'gemini_model';
const DEFAULT_KEY = "AIzaSyDQdkIn4Kz39Mrq3epbbCXcyRWRKan1Tdc";
const DEFAULT_MODEL = "gemini-2.5-flash";

// --- Settings Modal Logic ---
function openSettingsModal() {
    if (!settingsModal) return;
    const currentKey = localStorage.getItem(GEMINI_API_KEY_STORAGE) || DEFAULT_KEY;
    const currentModel = localStorage.getItem(GEMINI_MODEL_STORAGE) || DEFAULT_MODEL;
    if (modalApiKey) modalApiKey.value = currentKey;
    if (modalModel) {
        modalModel.value = currentModel;
        // If the stored model isn't in the list, default to first option
        if (!modalModel.value) modalModel.value = DEFAULT_MODEL;
    }
    if (modalStatus) modalStatus.textContent = '';
    settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
    if (settingsModal) settingsModal.style.display = 'none';
}

if (aiSettingsBtn) {
    aiSettingsBtn.addEventListener('click', openSettingsModal);
}

if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeSettingsModal);
}

if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });
}

if (showKeyToggle && modalApiKey) {
    showKeyToggle.addEventListener('change', () => {
        modalApiKey.type = showKeyToggle.checked ? 'text' : 'password';
    });
}

if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', () => {
        const newKey = modalApiKey ? modalApiKey.value.trim() : '';
        const newModel = modalModel ? modalModel.value : DEFAULT_MODEL;
        if (!newKey) {
            if (modalStatus) modalStatus.textContent = '⚠️ API Key не може бути порожнім.';
            return;
        }
        localStorage.setItem(GEMINI_API_KEY_STORAGE, newKey);
        localStorage.setItem(GEMINI_MODEL_STORAGE, newModel);
        if (modalStatus) modalStatus.textContent = '✅ Збережено успішно!';
        setTimeout(closeSettingsModal, 1200);
    });
}

if (modalResetBtn) {
    modalResetBtn.addEventListener('click', () => {
        localStorage.removeItem(GEMINI_API_KEY_STORAGE);
        localStorage.removeItem(GEMINI_MODEL_STORAGE);
        if (modalApiKey) modalApiKey.value = DEFAULT_KEY;
        if (modalModel) modalModel.value = DEFAULT_MODEL;
        if (modalStatus) modalStatus.textContent = '🔄 Скинуто до стандартних налаштувань.';
    });
}

// --- AI Chat Logic ---
if (aiChatBox && aiInput && aiSendBtn) {

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${sender}`;
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        aiChatBox.appendChild(msgDiv);
        aiChatBox.scrollTop = aiChatBox.scrollHeight;
    }

    async function fetchAIResponse(userMessage) {
        const apiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE) || DEFAULT_KEY;
        const model = localStorage.getItem(GEMINI_MODEL_STORAGE) || DEFAULT_MODEL;

        const systemInstruction = `Ти - AI помічник-шпаргалка, який допомагає кандидату на співбесіді на посаду Project Manager в EdTech компанію AVS (масштабування у Польщі). 
Відповідай коротко (1-3 речення), професійно, впевнено. 
Використовуй термінологію, яку використовує компанія: воронки, вебінари, ліди, win-win комунікація, утримання дедлайнів, конверсія.
Допомагай кандидату виглядати експертом з глибоким розумінням процесів.
Твоє завдання: швидко дати ідеальну відповідь на питання рекрутера. Відповідай українською мовою.`;

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: [{ parts: [{ text: userMessage }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });

            const data = await response.json();

            if (data.error) {
                if (data.error.code === 400 && data.error.message.includes("API key not valid")) {
                    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
                    addMessage("Помилка: Невірний API ключ. Натисніть на шестірню ⚙️ та введіть правильний ключ.", "system");
                } else {
                    addMessage("Помилка AI: " + data.error.message + " | Натисніть ⚙️ та перевірте налаштування.", "system");
                }
                document.querySelector('.ai-message.system.loading')?.remove();
                return;
            }

            document.querySelector('.ai-message.system.loading')?.remove();

            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const replyText = data.candidates[0].content.parts[0].text;
                addMessage(replyText, "bot");
            } else {
                addMessage("Відбулася невідома помилка при обробці.", "system");
            }

        } catch (error) {
            document.querySelector('.ai-message.system.loading')?.remove();
            addMessage("Помилка з'єднання: " + error.message, "system");
        }
    }

    function handleSend() {
        const text = aiInput.value.trim();
        if (!text) return;

        addMessage(text, "user");
        aiInput.value = "";

        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'ai-message system loading';
        loadingMsg.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Аналізую...';
        aiChatBox.appendChild(loadingMsg);
        aiChatBox.scrollTop = aiChatBox.scrollHeight;

        fetchAIResponse(text);
    }

    aiSendBtn.addEventListener('click', handleSend);
    aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

