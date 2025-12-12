export default async function handler(req, res) {
  res.status(200).json({ ok: true, time: new Date().toISOString(), env: process.env.VERCEL_ENV || "unknown" });
}
