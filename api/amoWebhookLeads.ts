import { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { getAccessToken } from '../utils/AuthUtils';
import { fetchContact, fetchLead, fetchUser } from '../lib/amo';
import { parseAmoWebhook } from '../lib/parseAmoWebhook';
import { appendLeadToSheet } from '../lib/googleSheets';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    let parsed;
    try {
        parsed = await parseAmoWebhook(req);
    } catch (err) {
        console.error('Webhook parsing error:', err);
        return res.status(400).send('Invalid webhook payload');
    }

    const lead = parsed?.leads?.add?.[0];
    if (!lead) return res.status(400).send('No lead found');

    const {
        AMOCRM_SUBDOMAIN,
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI,
        GOOGLE_REFRESH_TOKEN,
        SPREADSHEET_ID,
    } = process.env;

    const accessToken = await getAccessToken();
    if (!accessToken) return res.status(500).send('No access token');

    const leadData = await fetchLead(AMOCRM_SUBDOMAIN!, lead.id, accessToken);
    const contactId = leadData._embedded?.contacts?.[0]?.id;

    let contactName = '';
    let phone = '';
    if (contactId) {
        const contact = await fetchContact(AMOCRM_SUBDOMAIN!, contactId, accessToken);
        contactName = contact.name || '';
        const phoneField = contact.custom_fields_values?.find((f: any) => f.field_code === 'PHONE');
        phone = phoneField?.values?.[0]?.value || '';
    }

    const responsibleId = lead.responsible_user_id;
    const user = await fetchUser(AMOCRM_SUBDOMAIN!, responsibleId, accessToken);
    const responsibleName = user.name || '';

    const createdAt = dayjs.unix(Number(lead.created_at)).format('YYYY-MM-DD HH:mm');

    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

    const success = await appendLeadToSheet(SPREADSHEET_ID!, oauth2Client, [
        lead.id, createdAt, phone, contactName, responsibleName, responsibleId
    ]);

    if (success) {
        console.log('Lead added:', lead.id);
        res.status(200).send('OK');
    } else {
        console.log('Lead already exists:', lead.id);
        res.status(200).send('Already exists');
    }
}
