import { google } from 'googleapis';

export async function appendLeadToSheet(sheetId: string, auth: any, values: any[]) {
  
  const sheets = google.sheets({ version: 'v4', auth });

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'leads!A2:A',
  });

  const existingIds = (existing.data.values || []).flat().map(String);
  if (existingIds.includes(values[0].toString())) return false;

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'leads!A2',
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });

  return true;
}