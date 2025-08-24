import express from 'express';
import cron from 'node-cron';
import path from 'node:path';
import { env } from './config/env.js';
import { ensureDb } from './utils/knex.js';
import { api } from './routes/api.js';
import { fetchBoxTariffs } from './services/wb.js';
import { saveDailyBoxTariffs } from './services/store.js';
import { pushCurrentToSheets } from './services/sheets.js';
import { fileURLToPath } from 'node:url';

async function boot() {
  await ensureDb();

  cron.schedule(env.CRON_FETCH, async () => {
    const date = new Date().toISOString().slice(0, 10);
    try {
      const resp = await fetchBoxTariffs(date);
      await saveDailyBoxTariffs(resp, date);
      console.log(`[cron fetch] saved tariffs for ${date}`);
    } catch (e) {
      console.error('[cron fetch] failed', (e as Error).message);
    }
  });

  cron.schedule(env.CRON_SHEETS, async () => {
    try {
      const res = await pushCurrentToSheets();
      console.log(`[cron sheets] ${res.message}; updated=${res.updated}`);
    } catch (e) {
      console.error('[cron sheets] failed', (e as Error).message);
    }
  });

  const app = express();
  app.use(express.json());
  app.use('/api', api);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.join(__dirname, 'web')));
  app.listen(env.PORT, () => {
    console.log(`Server listening on :${env.PORT}`);
  });
}

boot().catch((e) => {
  console.error('Fatal boot error', e);
  process.exit(1);
});
