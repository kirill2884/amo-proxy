import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.connect();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;

  const {
    CLIENT_AMO_ID,
    CLIENT_AMO_SECRET,
    REDIRECT_AMO_URI,
    AMOCRM_SUBDOMAIN
  } = process.env;

  if (!code || !CLIENT_AMO_ID || !CLIENT_AMO_SECRET || !REDIRECT_AMO_URI || !AMOCRM_SUBDOMAIN) {
    return res.status(400).send('Required parameters not found');
  }

  try {
    const response = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/oauth2/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_AMO_ID,
        client_secret: CLIENT_AMO_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_AMO_URI,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).send(`Error from amoCRM: ${errText}`);
    }

    const tokenData = await response.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    await redis.set('amo_tokens', JSON.stringify({
      access_token,
      refresh_token,
      expires_at: Date.now() + expires_in * 1000,
    }));

    res.send('Authorization successful, tokens saved in Redis.');
  } catch (err: any) {
    res.status(500).send('Error: ' + err.message);
  }
}
