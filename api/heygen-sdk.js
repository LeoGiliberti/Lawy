// api/heygen-sdk.js
// Serve la SDK ESM di HeyGen dal TUO dominio (niente CORS sui moduli).
export default async function handler(req, res) {
  const cdnList = [
    "https://unpkg.com/@heygen/streaming-avatar@4/dist/index.js",
    "https://unpkg.com/@heygen/streaming-avatar/dist/index.js",
    "https://esm.sh/@heygen/streaming-avatar@4?target=es2020",
    "https://esm.run/@heygen/streaming-avatar@4"
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
      // passa al prossimo CDN
    }
  }
  return res.status(502).send("/* sdk_load_failed_all_cdn */");
}
