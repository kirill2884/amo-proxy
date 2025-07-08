import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import qs from 'qs';
import getRawBody from 'raw-body';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let parsed: any;

    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
        const raw = await getRawBody(req);
        parsed = qs.parse(raw.toString());
    } else {
        parsed = req.body;
    }

  console.log("Получен Webhook от amoCRM:", JSON.stringify(parsed, null, 2));
  const body = req.body;

  // Безопасная проверка тела запроса
  const lead = body?.leads?.add?.[0];
  const contact = lead?.contacts?.[0];
  const phoneField = contact?.custom_fields_values?.find((f: any) => f.field_code === 'PHONE');
  const phone = phoneField?.values?.[0]?.value || '';

  const dealId = lead?.id;
  const createdAt = lead?.created_at;
  const contactName = contact?.name || '';
  const responsible = lead?.responsible_user_name || '';
  const responsibleId = lead?.responsible_user_id || '';

  // ⚙️ Google OAuth 2.0
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
    SPREADSHEET_ID,
  } = process.env;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID!,
      range: 'leads!A2',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          dealId,
          createdAt,
          phone,
          contactName,
          responsible,
          responsibleId
        ]],
      },
    });

    console.log('Сделка добавлена:', dealId);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка при добавлении в таблицу:', error);
    res.status(500).send('Ошибка записи в Google Таблицу');
  }
}
