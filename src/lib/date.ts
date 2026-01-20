// src/lib/date.ts
export const toISODate = (d: Date) => d.toISOString();
export const startOfMonthISO = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
export const isoNow = () => new Date().toISOString();
