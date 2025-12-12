export default async function handler(req, res) {
  const mask = v => Boolean(v && String(v).length > 5);
  res.status(200).json({
    CHATBASE_API_URL: mask(process.env.CHATBASE_API_URL),
    CHATBASE_API_KEY: mask(process.env.CHATBASE_API_KEY),
    CHATBASE_BOT_ID:  mask(process.env.CHATBASE_BOT_ID),
    HEYGEN_API_KEY:   mask(process.env.HEYGEN_API_KEY)
  });
}
