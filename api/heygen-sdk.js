// /api/heygen-sdk.js
// Proxy ESM per LiveAvatar Web SDK (adatto a import() nel browser)
export default async function handler(req, res) {
  const v = "0.0.10"; // versione nota del pacchetto LiveAvatar Web SDK

  const cdnList = [
    `https://esm.sh/@heygen/liveavatar-web-sdk@${v}?target=es2020`,
    `https://esm.run/@heygen/liveavatar-web-sdk@${v}`,
    // fallback senza pin (ultima)
    `https://esm.sh/@heygen/liveavatar-web-sdk?target=es2020`,
  ];

  for (const url of cdnList) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Vercel-Function" } });
      if (!r.ok) continue;

      const js = await r.text();
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).send(js);
    } catch {
      // prova il prossimo
    }
  }

  return res.status(502).send("/* sdk_load_failed_all_cdn */");
}
