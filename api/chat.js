export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { message = "", history = [] } = req.body || {};

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

  const url = process.env.CHATBASE_API_URL; // es. https://www.chatbase.co/api/v1/chat
  const headers = {
    "Authorization": `Bearer ${process.env.CHATBASE_API_KEY}`,
    "Content-Type": "application/json"
  };

  // formati alternativi (prova A, poi B se A fallisce)
  const payloadA = { botId: process.env.CHATBASE_BOT_ID, messages, temperature: 0.7, max_tokens: 180 };
  const payloadB = { botId: process.env.CHATBASE_BOT_ID, query: String(message), temperature: 0.7, max_tokens: 180 };

  try {
    let r = await fetch(url, { method: "POST", headers, body: JSON.stringify(payloadA) });
    if (!r.ok) r = await fetch(url, { method: "POST", headers, body: JSON.stringify(payloadB) });
    const data = await r.json();

    let answer = (
      data.answer || data.output || data.text || data.response ||
      (Array.isArray(data.messages) ? data.messages.at(-1)?.content : "") ||
      (data.message?.content) || ""
    )?.toString().trim();

    if (!answer) answer = "Al momento non ho una risposta. Prova a riformulare in modo più specifico.";
    answer = answer.replace(/[\*\_`\#]/g, "").replace(/\s{2,}/g, " ").trim();

    res.status(200).json({ answer });
  } catch (e) {
    res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
  }
}
