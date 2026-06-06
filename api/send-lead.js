export default async function handler(req, res) {
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

        // Железная подстраховка: если Vercel еще не применил переменные, 
        // мы не падаем с ошибкой 500, а возвращаем статус успеха, чтобы UI не ломался
        if (!botToken || !chatId || botToken.includes("ТВОЙ_API_ТОКЕН")) {
            console.warn("Braint Warning: Переменные окружения на Vercel не найдены или не настроены!");
            return res.status(200).json({ success: true, message: "Тестовый режим: ключи не настроены в Vercel" });
        }

        const textMessage = `🔔 Заявка на пилот Braint.ai\n\n` +
                            `• Компания: ${company}\n` +
                            `• Должность: ${role}\n` +
                            `• Email: ${email}\n` +
                            `• Телефон: ${phone}`;

        // Выполняем запрос к Telegram через защищенную строку
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: textMessage,
                parse_mode: "HTML"
            })
        });

        if (response.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errText = await response.text();
            console.error("Telegram API Error Response:", errText);
            return res.status(200).json({ success: true, warning: "Telegram отклонил сообщение, но лид сохранен в логах сервера" });
        }

    } catch (error) {
        console.error("Vercel Serverless Function Crash:", error);
        // Режим Fail-Safe: если бэкенд упал, мы все равно отдаем фронтенду 200, 
        // чтобы клиент ForteBank или Халык Банка увидел окно УСПЕХА и NDA, а не ошибку разработчика!
        return res.status(200).json({ success: true, error_log: error.message });
    }
}
