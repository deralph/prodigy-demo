export interface Pagination {
  page: number;
  limit: number;
}

function toPosInt(value: string | number | undefined, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return n;
}

/**
 * Parse and clamp pagination query params. Malformed input (NaN, zero,
 * negative, garbage strings) falls back to the supplied default so a bad
 * query string can never crash a query or return an unexpected page. The
 * page size is hard-capped so a client can never force a full-table scan.
 */
export function parsePagination(
  query: { page?: string | number; limit?: string | number },
  defaults: { page?: number; limit?: number } = {},
): Pagination {
  const page = toPosInt(query.page, defaults.page ?? 1);
  const limit = Math.min(toPosInt(query.limit, defaults.limit ?? 50), 200);
  return { page, limit };
}