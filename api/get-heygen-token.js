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

  const apiKey = process.env.HEYGEN_API_KEY; // la tua LiveAvatar API key
  if (!apiKey) return res.status(500).json({ error: "missing_env", missing: ["HEYGEN_API_KEY"] });

  try {
    // 1) Body parsing robusto
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    } catch {
      body = {};
    }

    // 2) Payload (qui NON deve mai crashare)
    const payload = {
      mode: "FULL",
      avatar_id: body.avatar_id ?? null,
      avatar_persona: {
        voice_id: body.voice_id ?? null,
        context_id: body.context_id ?? null,
        language: body.language ?? "it",
      },
    };

    // 3) Chiamata LiveAvatar corretta
    const r = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "accept": "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok) {
      // ritorna SEMPRE JSON (niente crash silenziosi)
      return res.status(r.status).json({ error: "liveavatar_upstream_error", sent: payload, upstream: data });
    }

    const session_id = data?.session_id;
    const session_token = data?.session_token;

    if (!session_id || !session_token) {
      return res.status(500).json({ error: "missing_session_fields", upstream: data });
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ session_id, session_token });
  } catch (e) {
    return res.status(500).json({ error: "function_exception", detail: String(e?.stack || e?.message || e) });
  }
}
