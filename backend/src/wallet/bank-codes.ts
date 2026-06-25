/**
 * Nigerian bank name → Paystack bank code fallback mapping.
 *
 * Paystack's transfer-recipient API requires a `bank_code`, not a bank name.
 * Clients type their bank name freely in the withdrawal form (e.g. "gtbank",
 * "GTB", "Guaranty Trust"), so an exact match against Paystack's live
 * `/bank` list frequently fails on punctuation/abbreviation differences.
 * This table normalizes common name variants for the most-used Nigerian
 * banks to their NIP bank codes, used as a fallback when an exact lookup
 * against the live bank list (see WalletService.resolveBankCode) misses.
 *
 * Codes are the standard NIBSS/Paystack bank codes as of this writing.
 * Not exhaustive — if a bank isn't in this table and isn't found via the
 * live Paystack lookup either, the withdrawal approval will surface a
 * clear "could not resolve bank code" error rather than silently failing.
 */
export const NIGERIAN_BANK_CODES: Record<string, string> = {
  'access bank': '044',
  'access': '044',
  'access bank diamond': '063',
  'citibank': '023',
  'citibank nigeria': '023',
  'ecobank': '050',
  'ecobank nigeria': '050',
  'fidelity bank': '070',
  'fidelity': '070',
  'first bank': '011',
  'first bank of nigeria': '011',
  'firstbank': '011',
  'fbn': '011',
  'first city monument bank': '214',
  'fcmb': '214',
  'globus bank': '00103',
  'guaranty trust bank': '058',
  'guaranty trust': '058',
  'gtbank': '058',
  'gtb': '058',
  'gt bank': '058',
  'heritage bank': '030',
  'heritage': '030',
  'jaiz bank': '301',
  'jaiz': '301',
  'keystone bank': '082',
  'keystone': '082',
  'kuda bank': '50211',
  'kuda': '50211',
  'moniepoint': '50515',
  'moniepoint mfb': '50515',
  'opay': '999992',
  'palmpay': '999991',
  'parallex bank': '104',
  'polaris bank': '076',
  'polaris': '076',
  'premium trust bank': '105',
  'providus bank': '101',
  'providus': '101',
  'stanbic ibtc': '221',
  'stanbic ibtc bank': '221',
  'stanbic': '221',
  'standard chartered': '068',
  'standard chartered bank': '068',
  'sterling bank': '232',
  'sterling': '232',
  'suntrust bank': '100',
  'taj bank': '302',
  'titan trust bank': '102',
  'union bank': '032',
  'union bank of nigeria': '032',
  'unity bank': '215',
  'united bank for africa': '033',
  'uba': '033',
  'wema bank': '035',
  'wema': '035',
  'alat by wema': '035',
  'zenith bank': '057',
  'zenith': '057',
};

/** Normalize a free-typed bank name for fallback table lookup. */
export function normalizeBankName(name: string): string {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/\bplc\b|\blimited\b|\bltd\b|\bnigeria\b|\(nig\)/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Look up a bank code from the static fallback table. Returns null if not found. */
export function lookupBankCodeFallback(bankName: string): string | null {
  const normalized = normalizeBankName(bankName);
  if (NIGERIAN_BANK_CODES[normalized]) return NIGERIAN_BANK_CODES[normalized];
  // Loose contains-match as a last resort (e.g. "GTBank Plc Lagos" → "gtbank")
  const hit = Object.keys(NIGERIAN_BANK_CODES).find(
    (key) => normalized.includes(key) || key.includes(normalized),
  );
  return hit ? NIGERIAN_BANK_CODES[hit] : null;
}
