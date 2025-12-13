// /api/get-heygen-token.js
export default async function handler(req, res) {
  // (Opzionale) CORS stretto: imposta ALLOW_ORIGIN in Vercel se chiami da un dominio esterno
  const ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN; // es. https://tuo-sito.it
  if (ALLOW_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "missing_api_key" });

  try {
    const r = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      },
      // alcuni proxy richiedono il body esplicito anche se vuoto
      body: "{}"
    });

    const raw = await r.text();
    let j; try { j = JSON.parse(raw); } catch { j = null; }

    if (!r.ok) {
      return res.status(r.status).json({
        error: "heygen_http_error",
        status: r.status,
        statusText: r.statusText,
        raw: j || raw
      });
    }

    const token = j?.data?.token;
    if (!token) {
      return res.status(502).json({ error: "missing_token", raw: j });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ token });
  } catch (e) {
    return res.status(500).json({ error: "heygen_token_error", message: e?.message || String(e) });
  }
}
