export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { message = "", history = [] } = req.body || {};

  // 0) Controlli env + URL di default
  const URL = (process.env.CHATBASE_API_URL || "https://www.chatbase.co/api/v1/chat").trim();
  const BOT = process.env.CHATBASE_BOT_ID;
  const KEY = process.env.CHATBASE_API_KEY;
  if (!URL || !BOT || !KEY) {
    console.error("ENV MISSING", { URL: !!URL, BOT: !!BOT, KEY: !!KEY });
    return res.status(200).json({ answer: "Configurazione mancante. Verifica variabili Chatbase." });
  }

  // 1) Costruisci contesto leggero (ultimi 6 turni)
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

  const headers = {
    "Authorization": `Bearer ${KEY}`,
    "Content-Type": "application/json"
  };

  // 2) Prova formato "messages", poi fallback "query"
  const payloadA = { botId: BOT, messages, temperature: 0.7, max_tokens: 180 };
  const payloadB = { botId: BOT, query: String(message), temperature: 0.7, max_tokens: 180 };

  try {
    let r = await fetch(URL, { method: "POST", headers, body: JSON.stringify(payloadA) });
    let raw = await r.text();
    if (!r.ok) {
      // retry con "query"
      const r2 = await fetch(URL, { method: "POST", headers, body: JSON.stringify(payloadB) });
      const raw2 = await r2.text();
      if (!r2.ok) {
        console.error("CHATBASE HTTP ERROR", r.status, r.statusText, raw, "| RETRY:", r2.status, r2.statusText, raw2);
        return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
      }
      raw = raw2;
      r = r2;
    }

    // 3) Parse sicuro e estrazione flessibile del testo
    let data; try { data = JSON.parse(raw); } catch { data = { raw }; }
    let answer = (
      data.answer || data.output || data.text || data.response ||
      (Array.isArray(data.messages) ? data.messages.at(-1)?.content : "") ||
      (data.message?.content) || ""
    );
    if (typeof answer !== "string") answer = String(answer || "").trim();
    if (!answer) {
      console.error("CHATBASE EMPTY PAYLOAD", data);
      answer = "Al momento non ho una risposta. Prova a riformulare in modo più specifico.";
    }
    answer = answer.replace(/[\*\_`\#]/g, "").replace(/\s{2,}/g, " ").trim();
    return res.status(200).json({ answer });

  } catch (e) {
    console.error("CHATBASE EXCEPTION", e);
    return res.status(200).json({ answer: "Il servizio è momentaneamente non disponibile. Riprova tra poco." });
  }
}
