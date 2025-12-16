// /api/heygen-sdk.js
// Serve una versione ESM della SDK, adatta a `import()`
export default async function handler(req, res) {
  const v = "2.1.0";

  const cdnList = [
    // 1) jsDelivr ESM conversion (molto spesso risolve "exports is not defined")
    `https://cdn.jsdelivr.net/npm/@heygen/streaming-avatar@${v}/+esm`,
    // 2) esm.sh (altra fonte ESM)
    `https://esm.sh/@heygen/streaming-avatar@${v}?target=es2020`,
    // 3) esm.run (altra fonte ESM)
    `https://esm.run/@heygen/streaming-avatar@${v}`,
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
      // prova il prossimo CDN
    }
  }

  return res.status(502).send("/* sdk_load_failed_all_cdn */");
}
