/**
 * AVS Cookie Consent v1.0
 */
(function () {
    if (localStorage.getItem('avs_cookies_accepted')) return;

    const style = document.createElement('style');
    style.textContent = `
        .avs-cookie-banner {
            position: fixed;
            bottom: 30px;
            left: 30px;
            right: 30px;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 20px 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 2000000000;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
            animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            max-width: 1200px;
            margin: 0 auto;
        }
        @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .avs-cookie-text {
            color: #f8fafc;
            font-size: 14px;
            line-height: 1.5;
            margin-right: 20px;
        }
        .avs-cookie-btn {
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s;
            white-space: nowrap;
        }
        .avs-cookie-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);
        }
        @media (max-width: 768px) {
            .avs-cookie-banner { flex-direction: column; text-align: center; gap: 15px; bottom: 20px; left: 20px; right: 20px; padding: 20px; }
            .avs-cookie-text { margin-right: 0; }
        }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.className = 'avs-cookie-banner';
    banner.innerHTML = `
        <div class="avs-cookie-text">
            🍪 Ми використовуємо файли cookie для покращення вашої взаємодії з нашим сайтом та для персоналізації контенту. Продовжуючи використовувати цей сайт, ви погоджуєтеся на використання нами файлів cookie.
        </div>
        <button class="avs-cookie-btn" id="avs-accept-cookies">Зрозуміло</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('avs-accept-cookies').onclick = () => {
        localStorage.setItem('avs_cookies_accepted', 'true');
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(20px)';
        banner.style.transition = '0.3s';
        setTimeout(() => banner.remove(), 300);
    };
})();
