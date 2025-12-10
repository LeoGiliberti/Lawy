export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { message = "", history = [] } = req.body || {};

  const url = (process.env.CHATBASE_API_URL || "https://www.chatbase.co/api/v1/chat").trim();
  const chatbotId = process.env.CHATBASE_BOT_ID;
  const key = process.env.CHATBASE_API_KEY;

  if (!url || !chatbotId || !key) {
    return res.status(200).json({ answer: "Config mancante (env). Controlla URL/KEY/BOT_ID." });
  }

  // Filtra la history: solo ruoli ammessi e content non vuoto
  const cleanTurns = (history || [])
    .slice(-6)
    .map(t => ({ role: t.role === "assistant" ? "assistant" : "user", content: String(t.content || "").trim() }))
    .filter(t => t.content.length > 0);

  // Messaggio UTENTE minimale (niente "system": Chatbase non lo supporta)
  const userMsg = `Rispondi in ITALIANO, 2–3 frasi, solo testo. Se i materiali non coprono la domanda, dì: «Non trovo riferimenti nei materiali disponibili. Puoi riformulare?». Domanda: ${String(message)}`.trim();

  const messages = [...cleanTurns, { role: "user", content: userMsg }];

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ chatbotId, messages, temperature: 0.5, stream: false })
    });

    const raw = await r.text();
    if (!r.ok) {
      // Log sintetico lato server, risposta neutra lato client
      console.error("CHATBASE HTTP ERROR", r.status, r.statusText, raw);
      return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
    }
    let data; try { data = JSON.parse(raw); } catch { data = { text: raw }; }
    let answer = (data.text || "").toString().trim();
    if (!answer) answer = "Al momento non ho una risposta. Prova a riformulare in modo più specifico.";
    answer = answer.replace(/[\*\_`\#]/g, "").replace(/\s{2,}/g, " ").trim();

    return res.status(200).json({ answer });
  } catch (e) {
    console.error("CHATBASE EXCEPTION", e);
    return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
  }
}
