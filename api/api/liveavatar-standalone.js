export default async function handler(req, res) {
  // Consiglio: consenti GET per test veloce da browser
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Leggiamo parametri da querystring per test facile:
  // /api/liveavatar-standalone?mode=FULL&language=it
  const mode = (req.query.mode || "FULL").toString();
  const language = (req.query.language || "it").toString();

  // Questi devono esistere come Env Vars in Vercel
  const apiKey = process.env.LIVEAVATAR_API_KEY || process.env.HEYGEN_API_KEY; // fallback se l’hai nominata così
  const avatarId = process.env.LIVEAVATAR_AVATAR_ID;
  const voiceId = process.env.LIVEAVATAR_VOICE_ID;
  const contextId = process.env.LIVEAVATAR_CONTEXT_ID;

  if (!apiKey) {
    return res.status(500).json({ error: "missing_env", field: "LIVEAVATAR_API_KEY (or HEYGEN_API_KEY)" });
  }
  if (!avatarId) return res.status(500).json({ error: "missing_env", field: "LIVEAVATAR_AVATAR_ID" });
  if (!voiceId) return res.status(500).json({ error: "missing_env", field: "LIVEAVATAR_VOICE_ID" });
  if (!contextId) return res.status(500).json({ error: "missing_env", field: "LIVEAVATAR_CONTEXT_ID" });

  try {
    // 1) Create Session Token (backend)
    const tokenPayload = {
      mode,
      avatar_id: avatarId,
      avatar_persona: {
        voice_id: voiceId,
        context_id: contextId,
        language
      }
    };

    const r1 = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "accept": "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(tokenPayload)
    });

    const t1 = await r1.text();
    let j1;
    try { j1 = JSON.parse(t1); } catch { j1 = { raw: t1 }; }

    if (!r1.ok) {
      return res.status(r1.status).json({
        error: "create_session_token_failed",
        sent: tokenPayload,
        upstream: j1
      });
    }

    const sessionToken =
      j1?.data?.session_token ||
      j1?.data?.sessionToken ||
      j1?.session_token ||
      j1?.sessionToken;

    if (!sessionToken) {
      return res.status(500).json({
        error: "no_session_token_in_response",
        upstream: j1
      });
    }

    // 2) Start Session (Bearer session token)
    const r2 = await fetch("https://api.liveavatar.com/v1/sessions/start", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${sessionToken}`
      }
    });

    const t2 = await r2.text();
    let j2;
    try { j2 = JSON.parse(t2); } catch { j2 = { raw: t2 }; }

    if (!r2.ok) {
      return res.status(r2.status).json({
        error: "start_session_failed",
        upstream: j2
      });
    }

    const livekitUrl = j2?.data?.livekit_url || j2?.livekit_url;
    const livekitClientToken = j2?.data?.livekit_client_token || j2?.livekit_client_token;

    if (!livekitUrl || !livekitClientToken) {
      return res.status(500).json({
        error: "missing_livekit_fields",
        upstream: j2
      });
    }

    // 3) Build a one-click LiveKit test URL (from docs)
    const livekitTestUrl =
      `https://meet.livekit.io/custom?liveKitUrl=${encodeURIComponent(livekitUrl)}` +
      `&token=${encodeURIComponent(livekitClientToken)}`;

    return res.status(200).json({
      ok: true,
      mode,
      language,
      livekit_url: livekitUrl,
      livekit_client_token_present: true,
      livekit_test_url: livekitTestUrl
    });
  } catch (e) {
    return res.status(500).json({
      error: "function_exception",
      detail: String(e)
    });
  }
}
