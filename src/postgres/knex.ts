import knexFactory from 'knex';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const knex = knexFactory({
  client: 'pg',
  connection: {
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
  },
  pool: { min: 0, max: 10 },

  migrations: {
    directory: path.join(__dirname, 'migrations'),
    loadExtensions: ['.cjs'],
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
    loadExtensions: ['.cjs'],
  },
});

export default knex;


function logMigrationResults(action: string, result: any) {
  const [batch, files] = result;
  if (!files || files.length === 0) {
    console.log(["latest", "up"].includes(action) ? "All migrations are up to date" : "All migrations have been rolled back");
    return;
    }
  console.log(`Batch ${batch} ${["latest", "up"].includes(action) ? "ran" : "rolled back"} the following migrations:`);
  for (const m of files) console.log("- " + m);
}

function logMigrationList(list: any) {
  const [done, pending] = list;
  console.log(`Found ${done.length} Completed Migration file/files.`);
  for (const m of done) console.log("- " + (m.name ?? m));
  console.log(`Found ${pending.length} Pending Migration file/files.`);
  for (const m of pending) console.log("- " + (m.file ?? m));
}

function logSeedRun(result: any) {
  const [files] = result;
  if (!files || files.length === 0) {
    console.log("No seeds to run");
    return;
  }
  console.log(`Ran ${files.length} seed files`);
  for (const s of files) console.log("- " + String(s).split(/\/|\\/).pop());
}

function logSeedMake(name: string) {
  console.log(`Created seed: ${name.split(/\/|\\/).pop()}`);
}

export const migrate = {
  latest: async () => logMigrationResults("latest", await knex.migrate.latest()),
  rollback: async () => logMigrationResults("rollback", await knex.migrate.rollback()),
  down: async (name?: string) => logMigrationResults("down", await knex.migrate.down({ name })),
  up: async (name?: string) => logMigrationResults("up", await knex.migrate.up({ name })),
  list: async () => logMigrationList(await knex.migrate.list()),
  make: async (name: string) => {
    if (!name) throw new Error("Please provide a migration name");
    console.log(await knex.migrate.make(name, { extension: "js" }));
  },
};

export const seed = {
  run: async () => logSeedRun(await knex.seed.run()),
  make: async (name: string) => {
    if (!name) throw new Error("Please provide a seed name");
    logSeedMake(await knex.seed.make(name));
  },
};
