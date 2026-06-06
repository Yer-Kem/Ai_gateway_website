const https = require('https');

module.exports = async (req, res) => {
    // CORS Настройки
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Собираем сырые данные из потока (Stream), так как req.body на кастомном домене может быть пустым
    let bodyBuffers = [];
    for await (const chunk of req) {
        bodyBuffers.push(chunk);
    }
    const rawBody = Buffer.concat(bodyBuffers).toString();

    try {
        // Парсим JSON вручную, чтобы избежать undefined crash
        let parsedData = {};
        if (rawBody) {
            parsedData = JSON.parse(rawBody);
        } else if (req.body) {
            parsedData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        }

        const { email, phone, role, company } = parsedData;

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        // Если ключи не настроены — мягко прерываем
        if (!botToken || !chatId) {
            return res.status(200).json({ success: true, warning: "Env variables missing" });
        }

        const textMessage = `🔔 Заявка на пилот Braint.ai\n\n` +
                            `• Компания: ${company || 'Не указано'}\n` +
                            `• Должность: ${role || 'Не указано'}\n` +
                            `• Email: ${email || 'Не указано'}\n` +
                            `• Телефон: ${phone || 'Не указано'}`;

        const postData = JSON.stringify({
            chat_id: chatId,
            text: textMessage,
            parse_mode: "HTML"
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${botToken}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        // Отправка в Telegram через нативный поток
        const tgRequest = new Promise((resolve, reject) => {
            const request = https.request(options, (response) => {
                let data = '';
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        resolve(true);
                    } else {
                        reject(new Error(`Telegram HTTP Error: ${response.statusCode}`));
                    }
                });
            });
            request.on('error', (err) => { reject(err); });
            request.write(postData);
            request.end();
        });

        await tgRequest;
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Intercepted Engine Error:", error.message);
        // Fail-Safe: отдаем фронтенду 200 в любом случае, конверсия — главный приоритет
        return res.status(200).json({ success: true, failover: true, log: error.message });
    }
};
