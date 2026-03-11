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
        try {
            const response = await fetch('/api/ai_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId: 'cheat_sheet_user'
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

