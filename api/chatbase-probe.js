export default async function handler(req, res) {
  const urlDefault = process.env.CHATBASE_API_URL || "https://www.chatbase.co/api/v1/chat";
  const headers = {
    "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
    "Content-Type": "application/json"
  };
  const tries = [
    { url: urlDefault, body: { chatbotId: process.env.CHATBASE_BOT_ID, messages: [{role:"user", content:"ping"}], stream:false } },
    { url: urlDefault, body: { chatbotId: process.env.CHATBASE_BOT_ID, query: "ping" } },
    { url: "https://www.chatbase.co/api/v1/agent/chat", body: { botId: process.env.CHATBASE_BOT_ID, messages: [{role:"user",content:"ping"}] } },
    { url: "https://www.chatbase.co/api/v1/agent/chat", body: { botId: process.env.CHATBASE_BOT_ID, query: "ping" } }
  ];

  const results = [];
  for (const t of tries) {
    try {
      const r = await fetch(t.url, { method:"POST", headers, body: JSON.stringify(t.body) });
      const txt = await r.text();
      results.push({ url: t.url, status: r.status, ok: r.ok, bodySample: txt.slice(0, 600) });
      if (r.ok) break;
    } catch (e) {
      results.push({ url: t.url, status: 0, ok: false, error: (e && e.message) || String(e) });
    }
  }
  res.status(200).json({ probe: results });
}
