export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

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

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: textMessage,
                parse_mode: "HTML"
            })
        });

        // Если Telegram API принял токен и ответил 200 OK
        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            // Если токен невалиден (как сейчас — 401), мы ловим этот статус
            const errorText = await response.text();
            console.error("Telegram API Rejected Request:", errorText);
            
            // Отдаем фронтенду ошибку, чтобы он вывел модалку "Ошибка подключения"
            return res.status(401).json({ error: "Unauthorized Bot Token" });
        }

    } catch (error) {
        console.error("Vercel Function Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
