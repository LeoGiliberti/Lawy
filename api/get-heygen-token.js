// /api/get-heygen-token.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const KEY = process.env.HEYGEN_API_KEY;
  if (!KEY) {
    // Nessuna key (ancora): consenti al front-end di restare in “solo testo”
    return res.status(503).json({ error: "missing_HEYGEN_API_KEY" });
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${KEY}`, // alcuni account richiedono Bearer
    "x-api-key": KEY                  // altri richiedono x-api-key
  };

  const urls = [
    "https://api.heygen.com/v1/streaming.create_token",
    "https://api.heygen.com/v1/streaming.createToken"
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
        signal: controller.signal
      });
      const data = await r.json().catch(() => ({}));
      const token = data?.data?.token || data?.token;

      if (r.ok && token) {
        clearTimeout(timeout);
        return res.status(200).json({ token, _via: url });
      }
      // prova la prossima variante
    } catch (_) {
      // continua con l’altra variante
    }
  }

  clearTimeout(timeout);
  return res.status(502).json({
    error: "unable_to_get_streaming_token",
    hint: "Controlla piano/permessi: serve Streaming Avatar API abilitata."
  });
}
