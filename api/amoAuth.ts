import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const {
    CLIENT_ID,
    REDIRECT_URI,
    AMOCRM_SUBDOMAIN
  } = process.env;

  if (!CLIENT_ID || !REDIRECT_URI || !AMOCRM_SUBDOMAIN) {
    return res.status(500).send('Environment not fount');
  }

  const authUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/oauth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code`;

  res.redirect(authUrl);
}