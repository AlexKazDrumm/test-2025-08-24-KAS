const byId = (id) => document.getElementById(id);
const logEl = byId('log');
const healthEl = byId('health-pill');
const sumEl = byId('summary-pill');
const rangeEl = byId('range');
const sheetsCountEl = byId('sheets-count');
const latestDateEl = byId('latest-date');
const latestCountEl = byId('latest-count');
const pushEtaEl = byId('push-eta');
const pushAtEl = byId('push-at');
const fetchAtEl = byId('fetch-at');

const table = document.getElementById('preview');
const thead = table.querySelector('thead');
const tbody = table.querySelector('tbody');

let pushTimer = null;

async function request(path, opts = {}) {
  const r = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const t = await r.text();
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

function setPill(el, ok, text) {
  el.textContent = text;
  el.classList.remove('ok', 'bad');
  el.classList.add(ok ? 'ok' : 'bad');
}

function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return String(val);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function fmtTime(val) {
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function fmtDur(sec) {
  const s = Math.max(0, sec | 0);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return hh === '00' ? `${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

function renderPreview(data) {
  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (!data || !data.daily || !Array.isArray(data.warehouses)) {
    latestDateEl.textContent = '—';
    latestCountEl.textContent = '—';
    return;
  }

  latestDateEl.textContent = fmtDate(data.daily.date);
  latestCountEl.textContent = data.warehouses.length;

  const header = [
    'Дата',
    'Гео',
    'Склад',
    'Доставка (base)',
    'Коэф.',
    'Литр',
    'MP base',
    'MP коэф.',
    'MP литр',
    'Хранение base',
    'Хранение коэф.',
    'Хранение литр',
  ];
  const trh = document.createElement('tr');
  header.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);

  data.warehouses.slice(0, 20).forEach((w) => {
    const tr = document.createElement('tr');
    const row = [
      fmtDate(data.daily.date),
      w.geo_name,
      w.warehouse_name,
      w.box_delivery_base,
      w.box_delivery_coef_expr,
      w.box_delivery_liter,
      w.box_delivery_marketplace_base,
      w.box_delivery_marketplace_coef_expr,
      w.box_delivery_marketplace_liter,
      w.box_storage_base,
      w.box_storage_coef_expr,
      w.box_storage_liter,
    ];
    row.forEach((v) => {
      const td = document.createElement('td');
      td.textContent = v ?? '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function startPushCountdown(nextIso, seconds) {
  if (pushTimer) clearInterval(pushTimer);
  pushAtEl.textContent = fmtTime(nextIso);
  let remain = Number(seconds) || 0;

  const tick = () => {
    pushEtaEl.textContent = fmtDur(remain);
    if (remain <= 0) {
      clearInterval(pushTimer);
      loadSchedule().catch(() => {});
      return;
    }
    remain -= 1;
  };

  tick();
  pushTimer = setInterval(tick, 1000);
}

async function loadSchedule() {
  const sched = await request('/api/schedule');
  if (sched?.ok && sched.sheets?.next) {
    startPushCountdown(sched.sheets.next, sched.sheets.inSeconds);
  }
  if (sched?.ok && sched.fetch?.next) {
    fetchAtEl.textContent = fmtTime(sched.fetch.next);
  }
}

async function refresh() {
  logEl.textContent = 'Загрузка...';

  const health = await request('/api/health');
  setPill(healthEl, health?.ok, health?.ok ? 'health: OK' : 'health: FAIL');

  const summary = await request('/api/summary');
  if (summary?.ok) {
    const pretty = fmtDate(summary.latestDate);
    setPill(
      sumEl,
      true,
      `data: ${pretty} · warehouses: ${summary.warehouses} · sheets: ${summary.spreadsheets}`,
    );
    sheetsCountEl.textContent = summary.spreadsheets ?? 0;
    rangeEl.textContent = summary.writeRange || 'stocks_coefs!A1';
  } else {
    setPill(sumEl, false, 'data: —');
  }

  const latest = await request('/api/tariffs/latest');
  if (latest && latest.daily) renderPreview(latest);

  await loadSchedule();

  logEl.textContent = 'Готово.';
}

byId('btn-fetch').addEventListener('click', async () => {
  logEl.textContent = 'Fetch today...';
  const resp = await request('/api/tariffs/fetch-today', { method: 'POST' });
  logEl.textContent = JSON.stringify(resp, null, 2);
  await refresh();
});

byId('btn-push').addEventListener('click', async () => {
  logEl.textContent = 'Push to Sheets...';
  const resp = await request('/api/sheets/push', { method: 'POST' });
  logEl.textContent = JSON.stringify(resp, null, 2);
  await loadSchedule();
});

refresh().catch((e) => (logEl.textContent = String(e)));
