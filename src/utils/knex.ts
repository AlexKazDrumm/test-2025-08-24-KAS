import knexFactory from 'knex';
import { env } from '../config/env.js';

export const knex = knexFactory({
  client: 'pg',
  connection: {
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
  },
  pool: { min: 0, max: 10 },
});

export async function ensureDb() {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      await knex.raw('select 1');
      return;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('DB is not ready after retries');
}
