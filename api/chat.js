export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { message = "", history = [] } = req.body || {};

  // URL + credenziali da ENV
  const url = (process.env.CHATBASE_API_URL || "https://www.chatbase.co/api/v1/chat").trim();
  const headers = {
    "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
    "Content-Type": "application/json"
  };
  const chatbotId = process.env.CHATBASE_BOT_ID;

  // Linee guida incorporate nel prompt UTENTE (niente ruolo "system")
  const guidelines =
    "Rispondi in ITALIANO, 2–3 frasi, solo testo. " +
    "Resta nel perimetro dei materiali caricati; se mancano dati usa: " +
    "«Non trovo riferimenti nei materiali disponibili. Puoi riformulare?»";

  // Storico (solo ruoli ammessi da Chatbase: user|assistant)
  const turns = (history || []).slice(-6).map(t => ({
    role: t.role === "assistant" ? "assistant" : "user",
    content: String(t.content || "")
  }));

  // Ultimo messaggio utente con le linee guida incluse
  const messages = [
    ...turns,
    { role: "user", content: `${guidelines}\n\nDomanda: ${String(message)}` }
  ];

  try {
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chatbotId,
        messages,
        temperature: 0.5,
        stream: false
      })
    });

    const raw = await r.text();
    if (!r.ok) {
      console.error("CHATBASE HTTP ERROR", r.status, r.statusText, raw);
      return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
    }

    // Chatbase risponde in `text`
    let data; try { data = JSON.parse(raw); } catch { data = { text: raw }; }
    let answer = (data.text || data.answer || data.output || data.response || "").toString().trim();
    if (!answer) {
      console.error("CHATBASE EMPTY PAYLOAD", data);
      answer = "Al momento non ho una risposta. Prova a riformulare in modo più specifico.";
    }
    // pulizia minima
    answer = answer.replace(/[\*\_`\#]/g, "").replace(/\s{2,}/g, " ").trim();

    return res.status(200).json({ answer });
  } catch (e) {
    console.error("CHATBASE EXCEPTION", e);
    return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
  }
}
