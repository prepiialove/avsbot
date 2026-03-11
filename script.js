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
const DEFAULT_MODEL = "gemini-2.5-flash";
const SITE_PIN = "0205";

// --- Settings Modal Logic ---
function openSettingsModal() {
    if (!settingsModal) return;

    const pin = prompt("Введіть пін-код для доступу до налаштувань:");
    if (pin !== SITE_PIN) {
        alert("❌ Невірний пін-код!");
        return;
    }

    const currentKey = localStorage.getItem(GEMINI_API_KEY_STORAGE) || "";
    const currentModel = localStorage.getItem(GEMINI_MODEL_STORAGE) || DEFAULT_MODEL;
    if (modalApiKey) {
        modalApiKey.value = currentKey;
        modalApiKey.placeholder = "Активно за замовчуванням (System Key)";
    }
    if (modalModel) {
        modalModel.value = currentModel;
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
        if (modalApiKey) modalApiKey.value = "";
        if (modalModel) modalModel.value = DEFAULT_MODEL;
        if (modalStatus) modalStatus.textContent = '🔄 Скинуто до налаштувань за замовчуванням.';
    });
}

// --- AI Chat Logic ---
if (aiChatBox && aiInput && aiSendBtn) {

    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${sender}`;
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        if (text.includes("Система:")) {
            msgDiv.innerHTML += "<br><br><b>✅ AI Ключ встановлено за замовчуванням.</b>";
        }
        aiChatBox.appendChild(msgDiv);
        aiChatBox.scrollTop = aiChatBox.scrollHeight;
    }

    async function fetchAIResponse(userMessage) {
        const customKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
        const model = localStorage.getItem(GEMINI_MODEL_STORAGE) || DEFAULT_MODEL;

        try {
            // If user has a custom key, they might still want to use it directly, 
            // but for security and using the "hidden" key, we should route through our server.
            // We'll modify the backend to accept a model parameter.

            const response = await fetch('/api/ai_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId: 'cheat_sheet_user', // Dummy session ID for the widget
                    customKey: customKey || null,
                    model: model
                })
            });

            const data = await response.json();

            document.querySelector('.ai-message.system.loading')?.remove();

            if (data.reply) {
                addMessage(data.reply, "bot");
            } else if (data.error) {
                addMessage("Помилка: " + data.error, "system");
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

