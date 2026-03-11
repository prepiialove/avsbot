/**
 * AVS Ultimate Chat Widget v4.25 - TELEGRAM BUTTON ADDED
 */
(function () {
  const SERVER = 'https://avsbot.onrender.com';
  const SID_KEY = 'avs_final_sid';
  const SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
  const TG_LINK = 'https://t.me/avswebbot'; // Correct Telegram bot
  const CALENDLY_LINK = 'https://calendly.com/prepiialove/30min?month=2026-03&date=2026-03-11';

  let sessionId = localStorage.getItem(SID_KEY);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem(SID_KEY, sessionId);
  }

  let isChatOpen = false;
  let aiChatMode = false;

  const style = document.createElement('style');
  style.textContent = `
    .avs-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; width: 60px; height: 60px; transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
    .avs-widget-container.open { width: 360px; height: 620px; }
    .avs-primary-btn { 
      position: fixed; right: 20px; 
      height: 60px; border-radius: 30px; 
      display: flex; align-items: center; justify-content: flex-end; 
      padding: 0 18px; color: white; border: none; cursor: pointer; 
      box-shadow: 0 10px 25px rgba(0,0,0,0.3); 
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
      z-index: 2147483647; text-decoration: none; overflow: hidden;
      width: 60px;
    }
    .avs-primary-btn:hover { width: auto; padding-left: 24px; min-width: 210px; transform: translateX(-5px); }
    .avs-primary-btn .avs-btn-label {
      white-space: nowrap; opacity: 0; transform: translateX(10px); 
      transition: all 0.3s ease; font-weight: 600; font-size: 15px; 
      margin-right: 14px; pointer-events: none;
    }
    .avs-primary-btn:hover .avs-btn-label { opacity: 1; transform: translateX(0); }
    
    .avs-manager-btn { background: linear-gradient(135deg, #2563eb, #1e40af); bottom: 20px; }
    .avs-ai-widget-btn { background: linear-gradient(135deg, #a855f7, #7e22ce); bottom: 95px; }
    
    .avs-floating-btn { 
      position: fixed; right: 26px; 
      height: 48px; border-radius: 24px; 
      display: flex; align-items: center; justify-content: flex-end; 
      padding: 0 14px; color: white; border: none; cursor: pointer; 
      box-shadow: 0 8px 20px rgba(0,0,0,0.2); 
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
      z-index: 2147483646; text-decoration: none; overflow: hidden;
      width: 48px;
    }
    .avs-floating-btn:hover { width: auto; padding-left: 20px; min-width: 170px; transform: translateX(-5px); }
    .avs-floating-btn .avs-btn-label { 
      white-space: nowrap; opacity: 0; transform: translateX(10px); 
      transition: all 0.3s ease; font-weight: 600; font-size: 13px; 
      margin-right: 12px; pointer-events: none;
    }
    .avs-floating-btn:hover .avs-btn-label { opacity: 1; transform: translateX(0); }

    .avs-cal-btn { background: linear-gradient(135deg, #f43f5e, #e11d48); bottom: 290px; box-shadow: 0 8px 20px rgba(244,63,94,0.3); }
    .avs-tg-btn { background: linear-gradient(135deg, #0088cc, #00a2ed); bottom: 230px; box-shadow: 0 8px 20px rgba(0,136,204,0.3); }
    .avs-call-btn { background: linear-gradient(135deg, #10b981, #059669); bottom: 170px; box-shadow: 0 8px 20px rgba(16,185,129,0.3); }

    .avs-popup { position: absolute; bottom: 0; right: 0; width: 100%; height: 100%; background: #fff; border-radius: 28px; border: 1px solid #e2e8f0; box-shadow: 0 30px 60px rgba(0,0,0,0.15); display: none; flex-direction: column; overflow: hidden; }
    .avs-header { background: #2563eb; color: white; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; }
    .avs-chat-area { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }
    .avs-input-group { padding: 15px; border-top: 1px solid #f1f5f9; display: flex; gap: 8px; background: #fff; align-items: center; }
    .avs-input { flex: 1; border: 1px solid #cbd5e1; background: #fff !important; color: #000 !important; padding: 12px 18px; border-radius: 24px; font-size: 14px; outline: none; }
    .avs-send-btn { background: #2563eb; border: none; width: 44px; height: 44px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .avs-msg { padding: 10px 16px; border-radius: 18px; max-width: 85%; font-size: 14px; line-height: 1.5; color: #1e293b; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .avs-msg.user { align-self: flex-end; background: #2563eb; color: white; border-bottom-right-radius: 4px; }
    .avs-msg.bot { align-self: flex-start; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
    .avs-header-btn { background:none; border:none; color:white; cursor:pointer; font-size: 18px; opacity:0.8; transition:0.2s; }
    .avs-header-btn:hover { opacity:1; transform: scale(1.1); }
    .avs-ai-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 8px 12px; border-radius: 12px; font-size: 12px; margin-bottom: 5px; display: none; align-items: center; gap: 8px; font-weight: 500; }
    .avs-quick-btn { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 6px 14px; font-size: 12px; cursor: pointer; color: #475569; transition: all 0.2s; }
    .avs-quick-btn:hover { border-color: #2563eb; color: #2563eb; }
    .avs-ai-mode-btn { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white !important; border: none; font-weight: bold; }
    .avs-ai-mode-btn.active { background: #ef4444 !important; }
    
    .avs-callback-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2147483648; display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .avs-callback-card { background: white; padding: 30px; border-radius: 24px; width: 90%; max-width: 340px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; }
    
    .avs-typing { font-style: italic; color: #94a3b8; font-size: 12px; margin-bottom: 5px; display: none; }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.className = 'avs-widget-container';
  container.innerHTML = `
    <a href="${CALENDLY_LINK}" target="_blank" class="avs-floating-btn avs-cal-btn" id="avs-fast-cal-btn"><span class="avs-btn-label">Зарезервувати місце</span><i class="fa-solid fa-calendar-days" style="font-size: 20px;"></i></a>
    <a href="${TG_LINK}" target="_blank" class="avs-floating-btn avs-tg-btn" id="avs-fast-tg-btn"><span class="avs-btn-label">Telegram Бот</span><i class="fa-brands fa-telegram" style="font-size: 24px;"></i></a>
    <button class="avs-floating-btn avs-call-btn" id="avs-fast-call-btn"><span class="avs-btn-label">Замовити дзвінок</span><i class="fa-solid fa-phone" style="font-size: 18px;"></i></button>
    <button class="avs-primary-btn avs-ai-widget-btn" id="avs-ai-toggle-btn"><span class="avs-btn-label">Запитати AI</span><i class="fa-solid fa-robot" style="font-size: 24px;"></i></button>
    <button class="avs-primary-btn avs-manager-btn" id="avs-toggle-btn"><span class="avs-btn-label">Написати Менеджеру</span><i class="fa-solid fa-comments" style="font-size: 24px;"></i></button>
    <div class="avs-popup" id="avs-popup-win">
      <div class="avs-header">
        <div><h4>Консультант AVS</h4><span style="font-size:10px; opacity:0.8;">🟢 Зараз у мережі</span></div>
        <div style="display:flex; gap:12px;">
          <button id="avs-logout-btn" class="avs-header-btn" title="Вийти"><i class="fa-solid fa-right-from-bracket"></i></button>
          <button id="avs-close-btn" class="avs-header-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
      <div class="avs-chat-area" id="avs-chat-box">
        <div class="avs-ai-banner" id="avs-ai-status-banner">🤖 Режим AI: Помічник відповідає на ваші питання</div>
        <div class="avs-typing" id="avs-typing-indicator">🤖 ШІ думає...</div>
      </div>
      <div id="avs-tools" style="padding:12px; background:#fff; display:none; gap:8px; flex-direction:column; border-top:1px solid #f1f5f9;">
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="avs-quick-btn" data-faq="📍 Де ви знаходитесь?">📍 Локація</button>
            <button class="avs-quick-btn" data-faq="💰 Яка вартість послуг?">💰 Ціни</button>
            <button class="avs-quick-btn avs-ai-mode-btn" id="avs-ai-start-btn">🤖 Запитати AI</button>
        </div>
      </div>
      <div class="avs-input-group" id="avs-input-container" style="display:none;">
        <input type="text" class="avs-input" id="avs-msg-input" placeholder="Напишіть нам..." autocomplete="off">
        <button class="avs-send-btn" id="avs-send-action"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>
    
    <div class="avs-callback-overlay" id="avs-call-overlay">
      <div class="avs-callback-card">
        <button id="avs-call-cancel" style="position:absolute; top:15px; right:15px; background:none; border:none; cursor:pointer; font-size:20px; color:#94a3b8;"><i class="fa-solid fa-xmark"></i></button>
        <div style="background:#ecfdf5; width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; color:#10b981;"><i class="fa-solid fa-phone-volume" style="font-size:24px;"></i></div>
        <h3 style="margin-bottom:10px;">Замовити дзвінок</h3>
        <p style="font-size:14px; color:#64748b; margin-bottom:20px;">Введіть номер телефону, і ми зателефонуємо вам протягом 5 хвилин.</p>
        <input type="text" id="avs-call-phone" placeholder="+380 / +48 ..." style="width:100%; padding:14px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:15px; outline:none; font-size:16px;">
        <button id="avs-call-submit" style="width:100%; background:#10b981; color:white; border:none; padding:15px; border-radius:12px; font-weight:bold; cursor:pointer; box-shadow:0 10px 20px rgba(16,185,129,0.2);">Чекаю на дзвінок</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  const toggleBtn = document.getElementById('avs-toggle-btn');
  const aiWidgetBtn = document.getElementById('avs-ai-toggle-btn');
  const calBtn = document.getElementById('avs-fast-cal-btn');
  const callBtn = document.getElementById('avs-fast-call-btn');
  const tgBtn = document.getElementById('avs-fast-tg-btn');
  const callOverlay = document.getElementById('avs-call-overlay');
  const popup = document.getElementById('avs-popup-win');
  const chatBox = document.getElementById('avs-chat-box');
  const typingInd = document.getElementById('avs-typing-indicator');
  const inputContainer = document.getElementById('avs-input-container');
  const toolsGroup = document.getElementById('avs-tools');
  const msgInput = document.getElementById('avs-msg-input');
  const sendBtn = document.getElementById('avs-send-action');
  const aiBanner = document.getElementById('avs-ai-status-banner');
  const aiBtn = document.getElementById('avs-ai-start-btn');

  function playAlert() { new Audio(SOUND_URL).play().catch(() => { }); }

  function updateAIModeUI() {
    aiBtn.classList.toggle('active', aiChatMode); 
    aiBtn.innerText = aiChatMode ? '🔙 Вимкнути AI' : '🤖 Запитати AI';
    aiBanner.style.display = aiChatMode ? 'flex' : 'none'; 
    msgInput.placeholder = aiChatMode ? 'Запитайте штучний інтелект...' : 'Напишіть нам...';
  }

  function openChat(startInAIMode = false) {
    aiChatMode = startInAIMode;
    updateAIModeUI();
    
    isChatOpen = true; 
    container.classList.add('open'); 
    popup.style.display = 'flex'; 
    toggleBtn.style.display = 'none'; 
    aiWidgetBtn.style.display = 'none';
    callBtn.style.display = 'none'; 
    tgBtn.style.display = 'none'; 
    calBtn.style.display = 'none';
    
    if (!localStorage.getItem('avs_name')) showRegForm();
    else { inputContainer.style.display = 'flex'; toolsGroup.style.display = 'flex'; loadHistory(); setTimeout(() => msgInput.focus(), 300); }
  }
  
  toggleBtn.onclick = () => openChat(false);
  aiWidgetBtn.onclick = () => openChat(true);
  
  document.getElementById('avs-close-btn').onclick = () => { 
    isChatOpen = false; 
    container.classList.remove('open'); 
    popup.style.display = 'none'; 
    toggleBtn.style.display = 'flex'; 
    aiWidgetBtn.style.display = 'flex';
    callBtn.style.display = 'flex'; 
    tgBtn.style.display = 'flex'; 
    calBtn.style.display = 'flex'; 
  };

  document.getElementById('avs-logout-btn').onclick = () => { if (confirm('Вийти з профілю?')) { localStorage.clear(); location.reload(); } };

  callBtn.onclick = () => { callOverlay.style.display = 'flex'; document.getElementById('avs-call-phone').value = localStorage.getItem('avs_phone') || ''; document.getElementById('avs-call-phone').focus(); };
  document.getElementById('avs-call-cancel').onclick = () => callOverlay.style.display = 'none';
  document.getElementById('avs-call-submit').onclick = async () => {
    const phone = document.getElementById('avs-call-phone').value.trim(); if (!phone) return alert('Будь ласка, вкажіть контактний телефон');
    localStorage.setItem('avs_phone', phone);
    await fetch(`${SERVER}/api/callback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, name: localStorage.getItem('avs_name') || 'Гість', phone }) });
    callOverlay.innerHTML = `<div class="avs-callback-card"><div style="color:#10b981; font-size:40px; margin-bottom:15px;"><i class="fa-solid fa-circle-check"></i></div><h3>Дякуємо!</h3><p>Менеджер зателефонує вам дуже скоро.</p><button onclick="location.reload();" style="margin-top:20px; background:#f1f5f9; border:none; padding:10px 20px; border-radius:10px; cursor:pointer;">Закрити</button></div>`;
  };

  function showRegForm() {
    inputContainer.style.display = 'none'; toolsGroup.style.display = 'none';
    chatBox.innerHTML = `<div style="padding:40px 20px; text-align:center; display:flex; flex-direction:column; gap:12px;"><h3>👋 Вітаємо!</h3><p>Для продовження вкажіть свої дані:</p><input type="text" id="r-name" placeholder="Ваше ім'я (обов'язково)" style="padding:14px; border:1px solid #cbd5e1; border-radius:14px; font-size:14px; outline:none;"><input type="text" id="r-phone" placeholder="Ваш телефон або Telegram (@...)" style="padding:14px; border:1px solid #cbd5e1; border-radius:14px; font-size:14px; outline:none;"><button id="r-submit" style="background:#2563eb; color:white; border:none; padding:14px; border-radius:14px; cursor:pointer; font-weight:bold; margin-top:10px; box-shadow: 0 4px 12px rgba(37,99,235,0.2);">Почати спілкування</button></div>`;
    document.getElementById('r-submit').onclick = async () => {
      const name = document.getElementById('r-name').value.trim(); if (!name) return alert('Будь ласка, вкажіть ім\'я');
      const phone = document.getElementById('r-phone').value.trim();
      localStorage.setItem('avs_name', name);
      localStorage.setItem('avs_phone', phone);

      try {
        await fetch(`${SERVER}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, name, phone })
        });
      } catch (e) { console.error('Register failed', e); }

      // Transition UI
      inputContainer.style.display = 'flex';
      toolsGroup.style.display = 'flex';
      chatBox.innerHTML = '';
      loadHistory();
    };
  }

  function addBubble(text, sender, playSound = true, isAI = false) {
    if (isAI) {
      const lbl = document.createElement('div'); lbl.style.textAlign = 'center'; lbl.style.fontSize = '9px'; lbl.style.color = '#94a3b8'; lbl.style.margin = '4px 0'; lbl.innerHTML = '🤖 Відповідь від AI'; chatBox.appendChild(lbl);
    }
    const d = document.createElement('div'); d.className = `avs-msg ${sender}`; d.innerText = text; chatBox.appendChild(d); chatBox.scrollTop = chatBox.scrollHeight;
    if (sender === 'bot' && playSound && isChatOpen) playAlert();
  }

  async function loadHistory() {
    try {
      const r = await fetch(`${SERVER}/api/history?session=${sessionId}`);
      const d = await r.json(); chatBox.innerHTML = ''; chatBox.appendChild(aiBanner); chatBox.appendChild(typingInd);
      if (d.messages?.length) d.messages.forEach(m => addBubble(m.text, m.from === 'admin' ? 'bot' : 'user', false, m.isAI));
      else addBubble('Чим ми можемо вам допомогти?', 'bot', false);
    } catch (e) { }
  }

  async function doSend() {
    const text = msgInput.value.trim(); if (!text) return;
    addBubble(text, 'user', false); msgInput.value = '';
    const ep = aiChatMode ? '/api/ai_chat' : '/api/send';

    if (aiChatMode) {
      typingInd.style.display = 'block';
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    try {
      const response = await fetch(`${SERVER}${ep}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text, name: localStorage.getItem('avs_name'), phone: localStorage.getItem('avs_phone') })
      });

      if (aiChatMode) {
        const data = await response.json();
        typingInd.style.display = 'none';
        if (data.reply) addBubble(data.reply, 'bot', true, true);
      }
    } catch (e) { typingInd.style.display = 'none'; }
  }

  aiBtn.onclick = () => {
    aiChatMode = !aiChatMode; 
    updateAIModeUI();
    if (aiChatMode) addBubble("Ви перейшли в режим AI. Запитайте!", "bot", false, true);
  };

  document.querySelectorAll('.avs-quick-btn[data-faq]').forEach(btn => { btn.onclick = () => { msgInput.value = btn.getAttribute('data-faq'); doSend(); }; });
  sendBtn.onclick = doSend; msgInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };

  setInterval(async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`${SERVER}/api/poll?session=${sessionId}`);
      const d = await r.json();
      if (d.messages?.length) {
        let hasAdminMsg = false;
        d.messages.forEach(m => {
          if (m.from === 'admin') hasAdminMsg = true;
          addBubble(m.text, 'bot', true, m.isAI);
        });
        if (hasAdminMsg && !isChatOpen) openChat();
      }
    } catch (e) { }
  }, 2500);

  if (localStorage.getItem('avs_name')) loadHistory();
})();
