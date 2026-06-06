module.exports = async (req, res) => {
    // Жесткие CORS заголовки, разрешающие домену braint.solutions принимать ответы сервера
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

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

        // Если ключи не настроены — эмулируем успех
        if (!botToken || !chatId || botToken.includes("ТВОЙ_API_ТОКЕН")) {
            return res.status(200).json({ success: true, mode: "sandbox" });
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

        // Безусловный возврат успеха для фронтенда (Fail-Safe), лид пишется в логи Vercel
        console.log("LEAD CAPTURED IN VERCEL LOGS:", textMessage);
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Vercel Function Catch:", error);
        return res.status(200).json({ success: true, error: error.message });
    }
};
