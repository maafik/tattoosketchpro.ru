// Vercel Serverless Function
// Принимает заявку с формы и отправляет её в Telegram через Bot API.
// Требует переменные окружения в проекте Vercel:
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_CHAT_ID

export default async function handler(req, res) {
  // Разрешаем CORS на всякий случай (форма и функция на одном домене,
  // но на препрод-доменах Vercel могут отличаться)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const idea = String(body.idea || '').trim();

    if (!name || !idea) {
      return res.status(400).json({ ok: false, error: 'Заполните имя и идею' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы в переменных окружения Vercel');
      return res.status(500).json({ ok: false, error: 'Сервер не настроен' });
    }

    // Простой текст без parse_mode — чтобы не ловить ошибки Telegram
    // из-за спецсимволов, которые может ввести пользователь.
    const text =
      'Новая заявка на эскиз тату\n\n' +
      'Имя: ' + name + '\n' +
      'Идея: ' + idea;

    const tgRes = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.error('Telegram API error:', tgData);
      return res.status(502).json({ ok: false, error: 'Ошибка Telegram API' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-telegram handler error:', err);
    return res.status(500).json({ ok: false, error: 'Внутренняя ошибка сервера' });
  }
}
