// src/lib/currency.ts
export const formatCurrency = (value: number, currency = 'DOP', locale = 'es-DO') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);

export const parseNumber = (s: string) => Number(s.replace(/[^\d.-]/g, ''));
