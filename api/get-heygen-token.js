// /api/get-heygen-token.js
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const r = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.HEYGEN_API_KEY,       // <-- deve esistere in Vercel
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})                         // POST JSON, anche vuoto
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // Se l'upstream non è OK, propaga lo status e il corpo per capire l'errore
    if (!r.ok) {
      return res.status(r.status).json({
        error: "heygen_upstream_error",
        upstream: data
      });
    }

    // Normalizza: token può stare in data.data.token oppure data.token
    const token = data?.data?.token || data?.token;
    if (!token) {
      return res.status(500).json({
        error: "no_token_in_response",
        upstream: data
      });
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ token });
  } catch (e) {
    return res.status(500).json({
      error: "function_exception",
      detail: String(e)
    });
  }
}
