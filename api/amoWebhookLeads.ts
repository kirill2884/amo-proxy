import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import qs from 'qs';
import getRawBody from 'raw-body';
import dayjs from 'dayjs'
import { getAccessToken } from '../utils/AuthUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {

    const {
    AMOCRM_SUBDOMAIN,
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

  const lead = parsed?.leads?.add?.[0];

    if (!lead) {
        console.warn("Сделка не найдена в Webhook:", JSON.stringify(parsed, null, 2));
        return res.status(400).send("Invalid lead data");
    }

  const dealId = lead?.id;
  const createdAt = dayjs.unix(Number(lead.created_at)).format('YYYY-MM-DD HH:mm');
  const responsibleId = lead?.responsible_user_id || '';

  const accessToken = await getAccessToken();
    if (!accessToken) {
        return res.status(500).send('No access token');
    }

  const leadRes = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/leads/${dealId}?with=contacts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

    const leadData = await leadRes.json();
    const contactId = leadData._embedded?.contacts?.[0]?.id;

    let contactName = '';
    let phone = '';

    if (contactId) {
        const contactRes = await fetch(`https://${AMOCRM_SUBDOMAIN}.amocrm.ru/api/v4/contacts/${contactId}?with=custom_fields`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
        });

        const contactData = await contactRes.json();
        contactName = contactData.name;

        const phoneField = contactData.custom_fields_values?.find((f: any) => f.field_code === 'PHONE');
        phone = phoneField?.values?.[0]?.value || '';
    }

  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  try {

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID!,
      range: 'leads!A2:A',
    });

    const existingIds = (existing.data.values || []).flat().map(String);

    if (existingIds.includes(dealId)) {
      console.log(`Leads ${dealId} already exists`);
      return res.status(200).send('Already exists');
    }

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
          '',
          responsibleId
        ]],
      },
    });

    console.log('Lead added succsefull:', dealId);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error process add:', error);
    res.status(500).send('Error writing to Google sheet');
  }
}
