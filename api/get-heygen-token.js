// /api/get-heygen-token.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const r = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: { "x-api-key": process.env.HEYGEN_API_KEY, "Content-Type": "application/json" },
      body: "{}"
    });
    const j = await r.json();
    if (!r.ok || !j?.data?.token) {
      return res.status(500).json({ error: "heygen_token_error", raw: j });
    }
    res.status(200).json({ token: j.data.token });
  } catch {
    res.status(500).json({ error: "heygen_token_error" });
  }
}
