function withCORS(handler) {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // ok: niente cookie
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(204).end();
    return handler(req, res);
  };
}

async function chatHandler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { message = "", history = [] } = req.body || {};

  const url = (process.env.CHATBASE_API_URL || "https://www.chatbase.co/api/v1/chat").trim();
  const chatbotId = process.env.CHATBASE_BOT_ID;
  const key = process.env.CHATBASE_API_KEY;

  if (!url || !chatbotId || !key) {
    return res.status(200).json({ answer: "Config mancante (env). Controlla URL/KEY/BOT_ID." });
  }

  // History “pulita”: solo user/assistant con contenuto non vuoto
  const cleanTurns = (history || [])
    .slice(-6)
    .map(t => ({ role: t.role === "assistant" ? "assistant" : "user", content: String(t.content || "").trim() }))
    .filter(t => t.content.length > 0);

  const guidelines =
    "Rispondi in ITALIANO, 2–3 frasi, solo testo. " +
    "Se i materiali non coprono la domanda, dì: «Non trovo riferimenti nei materiali disponibili. Puoi riformulare?»";

  const messages = [
    ...cleanTurns,
    { role: "user", content: `${guidelines}\n\nDomanda: ${String(message)}` }
  ];

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ chatbotId, messages, temperature: 0.5, stream: false })
    });
    const raw = await r.text();
    if (!r.ok) return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });

    let data; try { data = JSON.parse(raw); } catch { data = { text: raw }; }
    let answer = (data.text || "").toString().trim();
    if (!answer) answer = "Al momento non ho una risposta. Prova a riformulare in modo più specifico.";
    answer = answer.replace(/[\*\_`\#]/g, "").replace(/\s{2,}/g, " ").trim();

    return res.status(200).json({ answer });
  } catch {
    return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
  }
}

export default withCORS(chatHandler);
