export default async function handler(req, res) {
  if (req.method !== "OPTIONS" && req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  try {
    const session_token = req.body?.session_token;
    if (!session_token) {
      return res.status(400).json({ error: "missing_session_token" });
    }

    const r = await fetch("https://api.liveavatar.com/v1/sessions/stop", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${session_token}`
      }
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(r.status).json({ ok: r.ok, upstream: data });
  } catch (e) {
    return res.status(500).json({ error: "function_exception", detail: String(e) });
  }
}
