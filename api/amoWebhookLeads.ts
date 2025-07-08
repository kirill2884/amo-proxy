import { NowRequest, NowResponse } from '@vercel/node';
import { google } from 'googleapis';

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_REDIRECT_URI,
} = process.env;

export default async function handler(req: NowRequest, res: NowResponse) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: GOOGLE_REFRESH_TOKEN,
    });

    const { token } = await oauth2Client.getAccessToken();

    if (!token) {
      console.error('Не удалось получить access_token');
      return res.status(500).send('Token not received');
    }

    console.log('Получен access_token:', token);
    return res.status(200).json({ access_token: token });
  } catch (err) {
    console.error('Ошибка при получении токена:', err);
    return res.status(500).send('Error getting token');
  }
}
