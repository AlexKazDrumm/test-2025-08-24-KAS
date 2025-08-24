import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  POSTGRES_HOST: z.string().default('db'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),
  POSTGRES_DB: z.string().default('postgres'),

  WB_API_TOKEN: z.string().min(10, 'WB token is required'),

  GOOGLE_CREDENTIALS_JSON: z.string().default('{}'),
  GOOGLE_SERVICE_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  SHEETS_SPREADSHEET_IDS: z.string().default(''),
  SHEETS_WRITE_RANGE: z.string().default('stocks_coefs!A1'),

  CRON_FETCH: z.string().default('5 * * * *'),
  CRON_SHEETS: z.string().default('10 * * * *'),
  PORT: z.coerce.number().default(3000),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export const env: AppEnv = EnvSchema.parse(process.env);

export function getSpreadsheetIds(): string[] {
  return env.SHEETS_SPREADSHEET_IDS
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
