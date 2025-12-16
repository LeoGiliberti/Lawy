// /api/heygen-sdk.js
// Proxy ESM dal tuo dominio (utile per import dinamico senza CORS strani)
export default async function handler(req, res) {
  // Versione stabile nota (puoi aggiornarla in futuro)
  const v = "2.1.0";

  const cdnList = [
    // jsDelivr (spesso il più affidabile)
    `https://cdn.jsdelivr.net/npm/@heygen/streaming-avatar@${v}/dist/index.js`,
    // unpkg (fallback)
    `https://unpkg.com/@heygen/streaming-avatar@${v}/dist/index.js`,
    // senza pin (ultima) come ulteriore fallback
    `https://cdn.jsdelivr.net/npm/@heygen/streaming-avatar/dist/index.js`,
    `https://unpkg.com/@heygen/streaming-avatar/dist/index.js`,
  ];

  for (const url of cdnList) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Vercel-Function" } });
      if (!r.ok) continue;
      const js = await r.text();

      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
      // per import() da stessa origin non serve CORS, ma non fa danno
      res.setHeader("Access-Control-Allow-Origin", "*");

      return res.status(200).send(js);
    } catch {
      // prova il prossimo CDN
    }
  }

  return res.status(502).send("/* sdk_load_failed_all_cdn */");
}
