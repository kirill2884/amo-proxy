import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = req.query.code as string;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('access_token:', tokens.access_token);
    console.log('refresh_token:', tokens.refresh_token);

    res.status(200).json({
      message: 'Succsefull',
      tokens,
    });
  } catch (error) {
    console.error('Ошибка при получении токенов:', error);
    res.status(500).send('Ошибка при обмене code на токен');
  }
}
