import { getRedisClient } from "./Redis";

export async function getAccessToken(): Promise<string | null> {
    
  const redis = await getRedisClient();  
  const tokensRaw = await redis.get('amo_tokens');
  if (!tokensRaw) {
    console.error('Tokens not found in Redis. Get Authorization');
    return null;
  }

  const tokens = JSON.parse(tokensRaw);
  const { access_token, refresh_token, expires_at } = tokens;

  if (Date.now() < expires_at - 60 * 1000) {
    return access_token;
  }

  const {
    CLIENT_AMO_ID,
    CLIENT_AMO_SECRET,
    REDIRECT_AMO_URI,
    AMOCRM_SUBDOMAIN,
  } = process.env;

  const refreshUrl = `https://${AMOCRM_SUBDOMAIN}.amocrm.ru/oauth2/access_token`;

  try {
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_AMO_ID,
        client_secret: CLIENT_AMO_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        redirect_uri: REDIRECT_AMO_URI,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Error refresh token:', text);
      return null;
    }

    const tokenData = await response.json();

    const newTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
    };

    await redis.set('amo_tokens', JSON.stringify(newTokens));
    console.log('Refresh token sucseful');
    return newTokens.access_token;
  } catch (err: any) {
    console.error('Error:', err.message);
    return null;
  }
}
