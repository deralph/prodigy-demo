export const KYC_REQUIREMENTS: Record<string, { key: string; label: string; required: boolean }[]> = {
  corporate: [
    { key: 'cac_cert',         label: 'CAC Certificate',                        required: true },
    { key: 'memart',           label: 'MEMART & Status of Directors',           required: true },
    { key: 'scuml_tax',        label: 'SCUML & Tax ID',                        required: true },
    { key: 'directors_id',     label: "Directors' Valid ID",                   required: true },
    { key: 'sig_mandate',      label: 'Signature Mandate',                     required: true },
  ],
  individual: [
    { key: 'valid_id',         label: "Client's Valid ID",                     required: true },
    { key: 'nin',              label: 'NIN',                                    required: true },
    { key: 'passport_photo',   label: 'Passport Photo',                        required: true },
    { key: 'sig_sample',       label: 'Signature Sample',                      required: true },
    { key: 'utility_bill',     label: 'Utility Bill',                          required: true },
  ],
  joint: [
    { key: 'valid_id_p1',      label: "Primary Holder's Valid ID",             required: true },
    { key: 'nin_p1',           label: 'Primary Holder NIN',                    required: true },
    { key: 'passport_p1',      label: 'Primary Holder Passport Photo',         required: true },
    { key: 'sig_p1',           label: 'Primary Holder Signature',              required: true },
    { key: 'utility_p1',       label: 'Primary Holder Utility Bill',           required: true },
    { key: 'valid_id_p2',      label: "Secondary Holder's Valid ID",           required: true },
    { key: 'nin_p2',           label: 'Secondary Holder NIN',                  required: true },
    { key: 'passport_p2',      label: 'Secondary Holder Passport Photo',       required: true },
    { key: 'sig_p2',           label: 'Secondary Holder Signature',            required: true },
    { key: 'utility_p2',       label: 'Secondary Holder Utility Bill',         required: true },
  ],
};
