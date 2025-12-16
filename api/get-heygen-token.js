// /api/get-heygen-token.js  (ora: LiveAvatar session token)
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

  const apiKey = process.env.HEYGEN_API_KEY; // qui ci metti la LiveAvatar API key (come già fai)
  if (!apiKey) {
    return res.status(500).json({ error: "missing_env", missing: ["HEYGEN_API_KEY"] });
  }

  try {
    // IMPORTANTISSIMO: endpoint LiveAvatar, non api.heygen.com
    const r = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "accept": "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        // minimo indispensabile; poi lo rendiamo parametrico se vuoi
      const payload = {
  mode: "FULL",
  avatar_id: req.body?.avatar_id ?? null,
  avatar_persona: {
    voice_id: req.body?.voice_id ?? null,
    context_id: req.body?.context_id ?? null,
    language: req.body?.language ?? "it",
  },
};

// ...fetch...

if (!r.ok) {
  return res.status(r.status).json({
    error: "liveavatar_upstream_error",
    sent: payload,
    upstream: data
  });
}


    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok) {
      return res.status(r.status).json({ error: "liveavatar_upstream_error", upstream: data });
    }

    // LiveAvatar: session_id + session_token
    const session_token = data?.session_token;
    const session_id = data?.session_id;

    if (!session_token || !session_id) {
      return res.status(500).json({ error: "missing_session_fields", upstream: data });
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ session_id, session_token });
  } catch (e) {
    return res.status(500).json({ error: "function_exception", detail: String(e?.message || e) });
  }
}
