import { knex } from '../utils/knex.js';
import { WBBoxTariffsResponse } from '../types/wb.js';
import { toNumberWB } from './parse.js';

export async function saveDailyBoxTariffs(resp: WBBoxTariffsResponse, date: string) {

  const [{ id }] = await knex('tariffs_box_daily')
    .insert({
      date,
      dt_next_box: resp.response.data.dtNextBox,
      dt_till_max: resp.response.data.dtTillMax,
    })
    .onConflict('date')
    .merge()
    .returning<{ id: number }[]>('id');

  await knex('tariffs_box_warehouses').where({ tariffs_box_daily_id: id }).del();

  const rows = resp.response.data.warehouseList.map((w) => ({
    tariffs_box_daily_id: id,
    warehouse_name: w.warehouseName,
    geo_name: w.geoName,
    box_delivery_base: toNumberWB(w.boxDeliveryBase),
    box_delivery_coef_expr: toNumberWB(w.boxDeliveryCoefExpr),
    box_delivery_liter: toNumberWB(w.boxDeliveryLiter),
    box_delivery_marketplace_base: toNumberWB(w.boxDeliveryMarketplaceBase),
    box_delivery_marketplace_coef_expr: toNumberWB(w.boxDeliveryMarketplaceCoefExpr),
    box_delivery_marketplace_liter: toNumberWB(w.boxDeliveryMarketplaceLiter),
    box_storage_base: toNumberWB(w.boxStorageBase),
    box_storage_coef_expr: toNumberWB(w.boxStorageCoefExpr),
    box_storage_liter: toNumberWB(w.boxStorageLiter),
  }));

  if (rows.length) {
    await knex.batchInsert('tariffs_box_warehouses', rows, 100);
  }
}

export async function getLatestDaily() {
  const row = await knex('tariffs_box_daily').orderBy('date', 'desc').first();
  if (!row) return null;
  const items = await knex('tariffs_box_warehouses')
    .where({ tariffs_box_daily_id: row.id })
    .orderBy(['geo_name', 'warehouse_name']);
  return { daily: row, warehouses: items };
}
