export default function handler(req, res) {
  const mask = (v) => (v ? `${String(v).slice(0, 3)}…${String(v).slice(-3)}` : null);

  res.status(200).json({
    vercelEnv: process.env.VERCEL_ENV || null,
    has: {
      CHATBASE_API_KEY: !!process.env.CHATBASE_API_KEY,
      CHATBASE_BOT_ID: !!process.env.CHATBASE_BOT_ID,
      CHATBASE_API_URL: !!process.env.CHATBASE_API_URL,
      HEYGEN_API_KEY: !!process.env.HEYGEN_API_KEY,
    },
    masked: {
      CHATBASE_API_KEY: mask(process.env.CHATBASE_API_KEY),
      HEYGEN_API_KEY: mask(process.env.HEYGEN_API_KEY),
    },
  });
}
