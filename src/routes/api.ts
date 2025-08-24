import { Router } from 'express';
import { CronExpressionParser } from 'cron-parser';

import { fetchBoxTariffs } from '../services/wb.js';
import { saveDailyBoxTariffs, getLatestDaily } from '../services/store.js';
import { pushCurrentToSheets } from '../services/sheets.js';
import { knex } from '../utils/knex.js';
import { env, getSpreadsheetIds } from '../config/env.js';

export const api = Router();

api.get('/health', (_req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

api.get('/tariffs/latest', async (_req, res) => {
  try {
    const data = await getLatestDaily();
    if (!data) return res.status(404).json({ error: 'No data' });
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
});

api.post('/tariffs/fetch-today', async (_req, res) => {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const resp = await fetchBoxTariffs(date);
    await saveDailyBoxTariffs(resp, date);
    res.json({ ok: true, date });
  } catch (e) {
    res.status(500).json({ error: 'Fetch failed', details: (e as Error).message });
  }
});

api.post('/sheets/push', async (_req, res) => {
  try {
    const result = await pushCurrentToSheets();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Sheets push failed', details: (e as Error).message });
  }
});

api.get('/summary', async (_req, res) => {
  try {
    const latest = await knex('tariffs_box_daily').orderBy('date', 'desc').first();
    let warehouses = 0;
    if (latest) {
      const row = await knex('tariffs_box_warehouses')
        .where({ tariffs_box_daily_id: (latest as any).id })
        .count<{ count: string }[]>('* as count')
        .first();
      warehouses = Number(row?.count ?? 0);
    }
    res.json({
      ok: true,
      latestDate: latest?.date ?? null,
      warehouses,
      spreadsheets: getSpreadsheetIds().length,
      writeRange: env.SHEETS_WRITE_RANGE,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

api.get('/schedule', (_req, res) => {
  try {
    const tz = process.env.TZ || 'Asia/Almaty';
    const now = new Date();

    const nextPush = CronExpressionParser.parse(env.CRON_SHEETS, { currentDate: now, tz }).next().toDate();
    const nextFetch = CronExpressionParser.parse(env.CRON_FETCH, { currentDate: now, tz }).next().toDate();

    res.json({
      ok: true,
      tz,
      now: now.toISOString(),
      sheets: {
        expr: env.CRON_SHEETS,
        next: nextPush.toISOString(),
        inSeconds: Math.max(0, Math.floor((+nextPush - +now) / 1000)),
      },
      fetch: {
        expr: env.CRON_FETCH,
        next: nextFetch.toISOString(),
        inSeconds: Math.max(0, Math.floor((+nextFetch - +now) / 1000)),
      },
    });
  } catch (e) {
    res.status(400).json({ ok: false, error: (e as Error).message });
  }
});
