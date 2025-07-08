import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // обязательно!
    prompt: 'consent', // обязательно для получения refresh_token
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  res.writeHead(302, { Location: url });
  res.end();
}
