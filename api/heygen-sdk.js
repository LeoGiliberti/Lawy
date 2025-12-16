// /api/heygen-sdk.js
// Serve un bundle ESM (un singolo file) del LiveAvatar Web SDK
export default async function handler(req, res) {
  const v = "0.0.10";

  const cdnList = [
    // bundle = include dipendenze; target=es2020 per browser moderni
    `https://esm.sh/@heygen/liveavatar-web-sdk@${v}?bundle&target=es2020`,
    // fallback senza pin
    `https://esm.sh/@heygen/liveavatar-web-sdk?bundle&target=es2020`,
  ];

  for (const url of cdnList) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Vercel-Function" } });
      if (!r.ok) continue;

      const js = await r.text();
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
      return res.status(200).send(js);
    } catch {
      // prova il prossimo
    }
  }

  return res.status(502).send("/* sdk_load_failed_all_cdn */");
}
