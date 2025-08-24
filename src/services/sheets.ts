import { sheets_v4 } from '@googleapis/sheets';
import { JWT } from 'google-auth-library';
import { env, getSpreadsheetIds } from '../config/env.js';
import { knex } from '../utils/knex.js';

function normalizeKey(k?: string) {
  if (!k) return k;
  let s = k.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1);
  }
  return s.replace(/\\n/g, '\n');
}

function buildAuthClient(): JWT {
  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

  if (env.GOOGLE_CREDENTIALS_JSON && env.GOOGLE_CREDENTIALS_JSON.trim() !== '{}') {
    const { client_email, private_key } = JSON.parse(env.GOOGLE_CREDENTIALS_JSON);
    return new JWT({
      email: client_email,
      key: normalizeKey(private_key)!,
      scopes,
    });
  }

  return new JWT({
    email: env.GOOGLE_SERVICE_EMAIL!,
    key: normalizeKey(env.GOOGLE_PRIVATE_KEY)!,
    scopes,
  });
}

export async function pushCurrentToSheets() {
  const ids = getSpreadsheetIds();
  if (!ids.length) return { updated: 0, message: 'No spreadsheet IDs configured' };

  const latest = await knex('tariffs_box_daily').orderBy('date', 'desc').first();
  if (!latest) return { updated: 0, message: 'No tariffs in DB' };

  const warehouses = await knex('tariffs_box_warehouses')
    .where({ tariffs_box_daily_id: latest.id })
    .orderBy('box_delivery_coef_expr', 'asc');

  const header = [
    'Date','Geo name','Warehouse name',
    'Delivery base','Delivery coef expr','Delivery liter',
    'Marketplace delivery base','Marketplace delivery coef expr','Marketplace delivery liter',
    'Storage base','Storage coef expr','Storage liter',
  ];
  const values: (string | number)[][] = [header];
  for (const w of warehouses) {
    values.push([
      latest.date, w.geo_name, w.warehouse_name,
      w.box_delivery_base, w.box_delivery_coef_expr, w.box_delivery_liter,
      w.box_delivery_marketplace_base, w.box_delivery_marketplace_coef_expr, w.box_delivery_marketplace_liter,
      w.box_storage_base, w.box_storage_coef_expr, w.box_storage_liter,
    ]);
  }

  const authClient = buildAuthClient();
  await authClient.authorize();

  const sheets = new sheets_v4.Sheets({ auth: authClient });

  let updated = 0;
  for (const spreadsheetId of ids) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: env.SHEETS_WRITE_RANGE,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    updated++;
  }
  return { updated, message: 'OK' };
}
