/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.createTable('tariffs_box_daily', (t) => {
    t.bigIncrements('id').primary();
    t.date('date').notNullable().unique();
    t.date('dt_next_box');
    t.date('dt_till_max');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('tariffs_box_warehouses', (t) => {
    t.bigIncrements('id').primary();
    t.bigInteger('tariffs_box_daily_id')
      .notNullable()
      .references('id')
      .inTable('tariffs_box_daily')
      .onDelete('CASCADE');

    t.text('warehouse_name').notNullable();
    t.text('geo_name').notNullable();

    t.decimal('box_delivery_base', 12, 2).notNullable().defaultTo(0);
    t.decimal('box_delivery_coef_expr', 12, 2).notNullable().defaultTo(0);
    t.decimal('box_delivery_liter', 12, 2).notNullable().defaultTo(0);

    t.decimal('box_delivery_marketplace_base', 12, 2)
      .notNullable()
      .defaultTo(0);
    t.decimal('box_delivery_marketplace_coef_expr', 12, 2)
      .notNullable()
      .defaultTo(0);
    t.decimal('box_delivery_marketplace_liter', 12, 2)
      .notNullable()
      .defaultTo(0);

    t.decimal('box_storage_base', 12, 2).notNullable().defaultTo(0);
    t.decimal('box_storage_coef_expr', 12, 2).notNullable().defaultTo(0);
    t.decimal('box_storage_liter', 12, 2).notNullable().defaultTo(0);

    t.index(['tariffs_box_daily_id']);
    t.index(['geo_name', 'warehouse_name']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('tariffs_box_warehouses');
  await knex.schema.dropTableIfExists('tariffs_box_daily');
};
