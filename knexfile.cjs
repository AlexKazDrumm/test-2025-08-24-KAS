require('dotenv').config();

/** @type {import('knex').Knex.Config} */
module.exports = {
  client: 'pg',
  connection: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: +(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'postgres',
  },
  pool: { min: 0, max: 10, idleTimeoutMillis: 30000 },
  migrations: {
    directory: './src/postgres/migrations',
    loadExtensions: ['.cjs'],
  },
  seeds: {
    directory: './src/postgres/seeds',
    loadExtensions: ['.cjs'],
  },
};
