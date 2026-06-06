module.exports = async (req, res) => {
    // Включаем CORS заголовки для предотвращения блокировок браузера
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Обработка предварительного запроса браузера (Preflight OPTIONS request)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, phone, role, company } = req.body;

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        // Если ключи не прописаны в Vercel, мягко сообщаем фронтенду
        if (!botToken || !chatId || botToken.includes("ТВОЙ_API_ТОКЕН")) {
            return res.status(200).json({ success: true, mode: "test_placeholder" });
        }

        const textMessage = `🔔 Заявка на пилот Braint.ai\n\n` +
                            `• Компания: ${company}\n` +
                            `• Должность: ${role}\n` +
                            `• Email: ${email}\n` +
                            `• Телефон: ${phone}`;

        // Выполняем нативный запрос к Telegram API
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: textMessage,
                parse_mode: "HTML"
            })
        });

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errorText = await response.text();
            console.error("Telegram API Error Log:", errorText);
            return res.status(401).json({ error: "Unauthorized Bot Token" });
        }

    } catch (error) {
        console.error("Vercel Core Function Crash:", error);
        return res.status(500).json({ error: error.message });
    }
};
