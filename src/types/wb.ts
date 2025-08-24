export interface WBBoxTariffsResponse {
  response: {
    data: {
      dtNextBox: string;
      dtTillMax: string;
      warehouseList: Array<{
        boxDeliveryBase: string;
        boxDeliveryCoefExpr: string;
        boxDeliveryLiter: string;
        boxDeliveryMarketplaceBase: string;
        boxDeliveryMarketplaceCoefExpr: string;
        boxDeliveryMarketplaceLiter: string;
        boxStorageBase: string;
        boxStorageCoefExpr: string;
        boxStorageLiter: string;
        geoName: string;
        warehouseName: string;
      }>;
    };
  };
}

export interface BoxWarehouseRow {
  id?: number;
  tariffs_box_daily_id?: number;
  warehouse_name: string;
  geo_name: string;
  box_delivery_base: number;
  box_delivery_coef_expr: number;
  box_delivery_liter: number;
  box_delivery_marketplace_base: number;
  box_delivery_marketplace_coef_expr: number;
  box_delivery_marketplace_liter: number;
  box_storage_base: number;
  box_storage_coef_expr: number;
  box_storage_liter: number;
}
