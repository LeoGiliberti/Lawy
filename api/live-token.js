// api/live-token.js
// LiveAvatar: crea il token di sessione lato server.
// Sostituisci l'URL con quello esatto indicato nella tua dashboard/docs LiveAvatar.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const r = await fetch("https://api.heygen.com/v1/streaming.create_token", { // TODO: conferma path esatto
      method: "POST",
      headers: {
        "x-api-key": process.env.HEYGEN_API_KEY,
        "Content-Type": "application/json"
      },
      // Se LiveAvatar accetta parametri iniziali (avatarId, language, ecc.)
      // puoi già passarli qui e poi riusarli lato client:
      body: JSON.stringify({})
    });
    const j = await r.json();
    if (!r.ok || !j?.data?.token) {
      return res.status(500).json({ error: "live_token_error", raw: j });
    }
    res.status(200).json({ token: j.data.token, _via: "live_avatar.create_token" });
  } catch (e) {
    res.status(500).json({ error: "live_token_error" });
  }
}
