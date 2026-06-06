export default async function handler(req, res) {
    // Разрешаем только POST запросы для ИБ-безопасности
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, phone, role, company } = req.body;

        // Извлекаем ключи из защищенных переменных сервера Vercel
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        const textMessage = `🔔 Заявка на пилот Braint.ai\n\n` +
                            `• Компания: ${company}\n` +
                            `• Должность: ${role}\n` +
                            `• Email: ${email}\n` +
                            `• Телефон: ${phone}`;

        // Выполняем защищенный серверный fetch к Telegram
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: textMessage,
                parse_mode: "HTML"
            })
        });

        if (telegramResponse.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'Telegram API execution failed' });
        }

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
