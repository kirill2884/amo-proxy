import { VercelRequest } from '@vercel/node';
import getRawBody from 'raw-body';
import qs from 'qs';

export async function parseAmoWebhook(req: VercelRequest): Promise<any> {
  let parsed: any;

  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const raw = await getRawBody(req);
    parsed = qs.parse(raw.toString());
  } else if (contentType.includes('application/json')) {
    parsed = req.body;
  } else {
    throw new Error('Unsupported content type: ' + contentType);
  }

  return parsed;
}