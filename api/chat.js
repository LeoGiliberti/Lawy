export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { message = "", history = [] } = req.body || {};

  const system_prompt =
    "Sei un tutor sul TEMA. Rispondi SEMPRE in ITALIANO, chiaro, 2–3 frasi, SOLO TESTO. " +
    "Resta nel perimetro dei materiali forniti; se mancano dati usa: " +
    "“Non trovo riferimenti nei materiali disponibili. Puoi riformulare?”";

  const turns = (history || []).slice(-6);
  const messages = [
    { role: "system", content: system_prompt },
    ...turns.map(t => ({ role: t.role === "user" ? "user" : "assistant", content: t.content })),
    { role: "user", content: String(message) }
  ];

  const urlDefault = process.env.CHATBASE_API_URL || "https://www.chatbase.co/api/v1/chat";
  const headers = {
    "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
    "Content-Type": "application/json"
  };
  const tries = [
    { url: urlDefault, body: { chatbotId: process.env.CHATBASE_BOT_ID, messages, stream: false } },
    { url: urlDefault, body: { chatbotId: process.env.CHATBASE_BOT_ID, query: String(message) } },
    { url: "https://www.chatbase.co/api/v1/agent/chat", body: { botId: process.env.CHATBASE_BOT_ID, messages } },
    { url: "https://www.chatbase.co/api/v1/agent/chat", body: { botId: process.env.CHATBASE_BOT_ID, query: String(message) } }
  ];

  let data = null, lastStatus = 0, lastText = "";
  for (const t of tries) {
    try {
      const r = await fetch(t.url, { method: "POST", headers, body: JSON.stringify(t.body) });
      lastStatus = r.status;
      lastText   = await r.text();
      try { data = JSON.parse(lastText); } catch { data = null; }
      if (r.ok && data) break;
    } catch (e) {
      lastStatus = 0;
      lastText = (e && e.message) || String(e);
    }
  }

  let answer = "";
  if (data) {
    answer =
      data.answer || data.response || data.output || data.text ||
      (Array.isArray(data.messages) ? data.messages.at(-1)?.content : "") ||
      (data.message?.content) || "";
  }

  if (!answer) {
    console.error("CHATBASE error", { lastStatus, lastText });
    answer = "Non trovo riferimenti nei materiali disponibili. Prova a chiedere in modo più specifico.";
  }

  answer = answer.toString().replace(/[\*\_`\#]/g, "").replace(/\s{2,}/g, " ").trim();
  res.status(200).json({ answer });
}
