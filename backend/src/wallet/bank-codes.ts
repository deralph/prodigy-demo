export const BANK_NAME_CODE_MAP: Record<string, string> = {
  'access bank': '044',
  'gtbank': '058',
  'guaranty trust bank': '058',
  'first bank': '011',
  'firstbank': '011',
  'zenith bank': '057',
  'zenith': '057',
  'uba': '033',
  'united bank for africa': '033',
  'fcmb': '214',
  'fidelity bank': '070',
  'sterling bank': '232',
  'ecobank': '050',
  'union bank': '032',
  'polaris bank': '076',
  'naira bank': '000',
};

export function lookupBankCodeByName(name?: string) {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  for (const key of Object.keys(BANK_NAME_CODE_MAP)) {
    if (lower.includes(key)) return BANK_NAME_CODE_MAP[key];
  }
  return undefined;
}
