import axios from 'axios';
import { env } from '../config/env.js';
import { WBBoxTariffsResponse } from '../types/wb.js';

const BASE = 'https://common-api.wildberries.ru/api/v1/tariffs/box';

export async function fetchBoxTariffs(date: string): Promise<WBBoxTariffsResponse> {
  const token = env.WB_API_TOKEN;
  const { data } = await axios.get<WBBoxTariffsResponse>(BASE, {
    params: { date },
    headers: {
      'Authorization': token,
    },
    timeout: 20000,
  });
  return data;
}
