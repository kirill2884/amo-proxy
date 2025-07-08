import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const {
    CLIENT_AMO_ID,
    REDIRECT_AMO_URI
  } = process.env;

  if (!CLIENT_AMO_ID || !REDIRECT_AMO_URI) {
    return res.status(500).send('Environment not fount');
  }

  const authUrl = `https://amocrm.ru/oauth?client_id=${CLIENT_AMO_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_AMO_URI
  )}&response_type=code`;

  res.redirect(authUrl);
}