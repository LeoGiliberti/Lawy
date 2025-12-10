export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { message = "", history = [] } = req.body || {};

  const url = (process.env.CHATBASE_API_URL || "https://www.chatbase.co/api/v1/chat").trim();
  const headers = {
    "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
    "Content-Type": "application/json"
  };

  // Contesto breve dai turni recenti + system prompt in testa
  const turns = (history || []).slice(-6);
  const system_prompt =
    "Sei un tutor su [TEMA]. Rispondi SEMPRE in ITALIANO, chiaro, 2–3 frasi, SOLO TESTO. " +
    "Resta nel perimetro dei materiali forniti; se mancano dati usa: " +
    "“Non trovo riferimenti nei materiali disponibili. Puoi riformulare?”";

  const messages = [
    { role: "system", content: system_prompt },
    ...turns.map(t => ({ role: t.role === "user" ? "user" : "assistant", content: t.content })),
    { role: "user", content: String(message) }
  ];

  try {
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chatbotId: process.env.CHATBASE_BOT_ID, // <— campo corretto
        messages,
        temperature: 0.7,
        stream: false
      })
    });

    const data = await r.json().catch(() => ({}));

    // Chatbase risponde in `text`
    let answer = (data.text || data.answer || data.output || data.response || "").toString().trim();
    if (!answer) answer = "Al momento non ho una risposta. Prova a riformulare in modo più specifico.";
    answer = answer.replace(/[\*\_`\#]/g, "").replace(/\s{2,}/g, " ").trim();

    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
  }
}
