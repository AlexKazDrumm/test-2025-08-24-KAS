export function toNumberWB(value: string): number {
  if (!value) return 0;
  const s = value.replace(/\s+/g, '').replace(',', '.');
  const n = Number(s);
  if (Number.isNaN(n)) return 0;
  return n;
}
