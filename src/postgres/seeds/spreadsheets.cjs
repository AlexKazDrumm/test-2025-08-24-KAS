/**
 * @param {import("knex").Knex} knex
 */
exports.seed = async function (knex) {
  await knex('spreadsheets')
    .insert([{ spreadsheet_id: 'some_spreadsheet' }])
    .onConflict(['spreadsheet_id'])
    .ignore();
};
