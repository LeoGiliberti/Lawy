export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const sessionToken = req.body?.session_token;
  if (!sessionToken) return res.status(400).json({ error: "missing_session_token" });

  try {
    const r = await fetch("https://api.liveavatar.com/v1/sessions/stop", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${sessionToken}`
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
