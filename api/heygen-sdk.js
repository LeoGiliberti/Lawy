// api/heygen-sdk.js
// Proxy server-side che scarica la SDK dal CDN e la serve come JS ESM dal TUO dominio.
// Così l'import dinamico funziona senza CORS.

export default async function handler(req, res) {
  const cdnList = [
    "https://esm.sh/@heygen/streaming-avatar@4?bundle&target=es2020",
    "https://esm.run/@heygen/streaming-avatar@4",
    "https://ga.jspm.io/npm:@heygen/streaming-avatar@4/dist/index.js"
  ];

  for (const url of cdnList) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const js = await r.text();
      res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      // cache su edge (CDN Vercel) per 1 giorno
      res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=43200");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).send(js);
    } catch (_) {
      // prova il prossimo CDN
    }
  }
  res.status(502).send("/* sdk_load_failed_all_cdn */");
}
