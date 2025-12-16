export default async function handler(req, res) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "missing_env", missing: ["HEYGEN_API_KEY"] });

  try {
    const r = await fetch("https://api.liveavatar.com/v1/contexts", {
      method: "GET",
      headers: { "X-API-KEY": apiKey, "accept": "application/json" },
    });

    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok) return res.status(r.status).json({ error: "liveavatar_upstream_error", upstream: data });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "function_exception", detail: String(e?.stack || e?.message || e) });
  }
}
