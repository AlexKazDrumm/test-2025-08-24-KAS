# WB Tariffs Box Service

Сервис по расписанию получает тарифы Wildberries для коробов (`/api/v1/tariffs/box`), сохраняет их в PostgreSQL **дневными снимками** и обновляет актуальные тарифы в **нескольких Google Sheets** (по ID таблиц).

## Стек
Node.js (TypeScript), PostgreSQL, Knex, Google Sheets API, Docker/Compose, node-cron, Express.

## Архитектура
- `src/services/wb.ts` — запрос к WB API `https://common-api.wildberries.ru/api/v1/tariffs/box`
- `src/services/store.ts` — upsert дневной записи и перезапись строк складов за день
- `src/services/sheets.ts` — экспорт в N таблиц (IDs из `SHEETS_SPREADSHEET_IDS`), сортировка по `box_delivery_coef_expr` (возрастание)  
- `src/postgres/migrations/*` — схема `tariffs_box_daily` + `tariffs_box_warehouses`  
- `src/routes/api.ts` — служебные эндпоинты (`/api/health`, `/api/tariffs/latest`, POST `/api/tariffs/fetch-today`, POST `/api/sheets/push`)  
- `Dockerfile`, `compose.yaml` — контейнеризация и автозапуск миграций

## Быстрый старт (Docker)
1. Скопируйте `example.env` → `.env` и заполните:
   - `WB_API_TOKEN` — токен WB (HeaderApiKey)
   - **Google**: либо `GOOGLE_CREDENTIALS_JSON` (одной строкой), либо `GOOGLE_SERVICE_EMAIL` + `GOOGLE_PRIVATE_KEY`
   - `SHEETS_SPREADSHEET_IDS` — ID таблиц через запятую
   - `SHEETS_WRITE_RANGE=stocks_coefs!A1` — лист по ТЗ
2. Запуск:
   ```bash
   docker compose up --build
````

3. Проверка:

   * `GET http://localhost:3000/api/health` — `{"ok":true,...}`
   * `POST http://localhost:3000/api/tariffs/fetch-today` — сохранить снапшот дня
   * `POST http://localhost:3000/api/sheets/push` — выгрузить в Sheets

> Контейнер сам дождётся БД и прогонит миграции перед стартом приложения.

## Локальная разработка (без Docker)

```bash
cp example.env .env
# в .env укажите локальные параметры БД и ключи
npm i
npm run migrate
npm run dev
```

## Права и безопасность

* Сервис-аккаунту Google дайте **Editor** доступ на целевые таблицы (по email из JSON).

## Детали реализации

* Снапшот хранится по полю `date` (уникально). Повторные чтения в течение суток перезаписывают строки складов за этот день.
* Экспорт в Sheets отсортирован по коэффициенту (возрастание).