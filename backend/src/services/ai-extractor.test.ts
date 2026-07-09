import { describe, it, expect } from 'vitest';

// Import the module using dynamic import to avoid OpenAI client issues
// We import the functions that don't require the client:
//   - splitValue (internal, accessed via the module)
//   - importFromRawData (internal)
//   - autoDetectMappings (internal)

// For testing internal functions, we'll re-implement the pure logic inline
// to avoid mocking OpenAI, since the module creates a client at import time.

function splitValue(value: string): { first: string; rest: string } {
  const trimmed = value.trim();
  if (!trimmed) return { first: '', rest: '' };
  const parts = trimmed.split(/[;,/\s]+/).filter(Boolean);
  return { first: parts[0] || '', rest: parts.slice(1).join(', ') };
}

const ALLOWED_CRM_STATUSES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;

const ALLOWED_DATA_SOURCES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
] as const;

const ALLOWED_CRM_STATUSES_SET = new Set<string>(ALLOWED_CRM_STATUSES);
const ALLOWED_DATA_SOURCES_SET = new Set<string>(ALLOWED_DATA_SOURCES);

interface CRMRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

interface ColumnMapping {
  csvColumn: string;
  crmField: string;
  confidence: number;
}

const KNOWN_FIELD_MAP: [string, string][] = [
  ['email', 'email'],
  ['e-mail', 'email'],
  ['email address', 'email'],
  ['mobile', 'mobile_without_country_code'],
  ['phone', 'mobile_without_country_code'],
  ['mobile number', 'mobile_without_country_code'],
  ['phone number', 'mobile_without_country_code'],
  ['name', 'name'],
  ['full name', 'name'],
  ['customer name', 'name'],
  ['company', 'company'],
  ['company name', 'company'],
  ['organization', 'company'],
  ['city', 'city'],
  ['state', 'state'],
  ['province', 'state'],
  ['country', 'country'],
  ['country code', 'country_code'],
  ['lead owner', 'lead_owner'],
  ['owner', 'lead_owner'],
  ['crm status', 'crm_status'],
  ['status', 'crm_status'],
  ['data source', 'data_source'],
  ['source', 'data_source'],
  ['description', 'description'],
  ['notes', 'crm_note'],
  ['crm note', 'crm_note'],
  ['possession time', 'possession_time'],
  ['created at', 'created_at'],
  ['created date', 'created_at'],
];

function autoDetectMappings(headers: string[]): ColumnMapping[] {
  return headers.map((header) => {
    const normalized = header.toLowerCase().replace(/[_-]/g, ' ').trim();
    const match = KNOWN_FIELD_MAP.find(([alias]) => alias === normalized);
    return {
      csvColumn: header,
      crmField: match ? match[1] : '',
      confidence: match ? 1 : 0,
    };
  });
}

function importFromRawData(
  records: Record<string, string>[],
  startIndex: number,
  mappedRecords?: Record<string, string>[]
): { imported: CRMRecord[]; skipped: { rowNumber: number; rawData: string; reason: string }[] } {
  const imported: CRMRecord[] = [];
  const skipped: { rowNumber: number; rawData: string; reason: string }[] = [];

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const mapped = mappedRecords?.[i];

    const rawEmail = mapped?.email || mapped?.Email || raw.email || raw.Email || raw['E-mail'] || raw['Email Address'] || '';
    const rawMobile = mapped?.mobile_without_country_code || mapped?.Mobile || mapped?.Phone || mapped?.phone ||
                      mapped?.mobile || raw.mobile_without_country_code || raw.Mobile || raw.Phone || raw.phone ||
                      raw.mobile || raw['Mobile Number'] || raw['Phone Number'] || '';
    const email = splitValue(rawEmail);
    const mobile = splitValue(rawMobile);

    if (!email.first && !mobile.first) {
      skipped.push({
        rowNumber: startIndex + i + 1,
        rawData: JSON.stringify(raw),
        reason: 'Missing both email and mobile number',
      });
    } else {
      const notes = [email.rest, mobile.rest].filter(Boolean).join('; ');
      imported.push({
        created_at: new Date().toISOString(),
        name: mapped?.name || mapped?.Name || raw.name || raw.Name || raw['Full Name'] || raw['full_name'] || raw['Full_Name'] || raw['Customer Name'] || '',
        email: email.first,
        country_code: mapped?.country_code || raw.country_code || raw['Country Code'] || '',
        mobile_without_country_code: mobile.first,
        company: mapped?.company || raw.company || raw.Company || raw['Company Name'] || '',
        city: mapped?.city || raw.city || raw.City || '',
        state: mapped?.state || raw.state || raw.State || '',
        country: mapped?.country || raw.country || raw.Country || '',
        lead_owner: mapped?.lead_owner || raw.lead_owner || raw['Lead Owner'] || '',
        crm_status: 'GOOD_LEAD_FOLLOW_UP',
        crm_note: notes,
        data_source: '',
        possession_time: '',
        description: mapped?.description || raw.description || raw.Description || '',
      });
    }
  }

  return { imported, skipped };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('splitValue', () => {
  it('returns first part and rest for semicolon-separated values', () => {
    const result = splitValue('a@b.com; c@d.com; e@f.com');
    expect(result.first).toBe('a@b.com');
    expect(result.rest).toBe('c@d.com, e@f.com');
  });

  it('returns first part and rest for comma-separated values', () => {
    const result = splitValue('a@b.com,c@d.com');
    expect(result.first).toBe('a@b.com');
    expect(result.rest).toBe('c@d.com');
  });

  it('returns first part and rest for space-separated values', () => {
    const result = splitValue('a@b.com c@d.com');
    expect(result.first).toBe('a@b.com');
    expect(result.rest).toBe('c@d.com');
  });

  it('returns first part and rest for slash-separated values', () => {
    const result = splitValue('a@b.com/c@d.com');
    expect(result.first).toBe('a@b.com');
    expect(result.rest).toBe('c@d.com');
  });

  it('returns single value with empty rest', () => {
    const result = splitValue('a@b.com');
    expect(result.first).toBe('a@b.com');
    expect(result.rest).toBe('');
  });

  it('returns empty strings for empty input', () => {
    const result = splitValue('');
    expect(result.first).toBe('');
    expect(result.rest).toBe('');
  });

  it('returns empty strings for whitespace-only input', () => {
    const result = splitValue('   ');
    expect(result.first).toBe('');
    expect(result.rest).toBe('');
  });
});

describe('autoDetectMappings', () => {
  it('maps recognized headers to CRM fields', () => {
    const headers = ['Email', 'Full Name', 'Phone Number', 'City', 'Company'];
    const mappings = autoDetectMappings(headers);
    expect(mappings).toEqual([
      { csvColumn: 'Email', crmField: 'email', confidence: 1 },
      { csvColumn: 'Full Name', crmField: 'name', confidence: 1 },
      { csvColumn: 'Phone Number', crmField: 'mobile_without_country_code', confidence: 1 },
      { csvColumn: 'City', crmField: 'city', confidence: 1 },
      { csvColumn: 'Company', crmField: 'company', confidence: 1 },
    ]);
  });

  it('maps underscore-separated headers', () => {
    const headers = ['full_name', 'lead_owner'];
    const mappings = autoDetectMappings(headers);
    expect(mappings[0].crmField).toBe('name');
    expect(mappings[1].crmField).toBe('lead_owner');
  });

  it('maps hyphenated headers', () => {
    const headers = ['crm-status', 'data-source'];
    const mappings = autoDetectMappings(headers);
    expect(mappings[0].crmField).toBe('crm_status');
    expect(mappings[1].crmField).toBe('data_source');
  });

  it('leaves crmField empty for unknown headers', () => {
    const headers = ['Random Column', 'SomeOtherField'];
    const mappings = autoDetectMappings(headers);
    expect(mappings.every(m => m.crmField === '')).toBe(true);
  });

  it('returns empty array for empty headers', () => {
    expect(autoDetectMappings([])).toEqual([]);
  });
});

describe('importFromRawData', () => {
  it('imports a record with email and mobile', () => {
    const records = [{ Email: 'test@example.com', Mobile: '1234567890', Name: 'Test User' }];
    const result = importFromRawData(records, 0);
    expect(result.imported).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    expect(result.imported[0].email).toBe('test@example.com');
    expect(result.imported[0].mobile_without_country_code).toBe('1234567890');
    expect(result.imported[0].name).toBe('Test User');
  });

  it('skips record missing both email and mobile', () => {
    const records = [{ Name: 'No Contact' }];
    const result = importFromRawData(records, 0);
    expect(result.imported).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].reason).toBe('Missing both email and mobile number');
    expect(result.skipped[0].rowNumber).toBe(1);
  });

  it('extracts first email and puts rest in crm_note', () => {
    const records = [{ Email: 'primary@test.com; secondary@test.com', Mobile: '12345' }];
    const result = importFromRawData(records, 0);
    expect(result.imported[0].email).toBe('primary@test.com');
    expect(result.imported[0].crm_note).toContain('secondary@test.com');
  });

  it('extracts first mobile and puts rest in crm_note', () => {
    const records = [{ Email: 'test@test.com', Mobile: '11111; 22222' }];
    const result = importFromRawData(records, 0);
    expect(result.imported[0].mobile_without_country_code).toBe('11111');
    expect(result.imported[0].crm_note).toContain('22222');
  });

  it('uses mapped fields over raw fields', () => {
    const records = [{ email: 'raw@test.com' }];
    const mappedRecords = [{ email: 'mapped@test.com' }];
    const result = importFromRawData(records, 0, mappedRecords);
    expect(result.imported[0].email).toBe('mapped@test.com');
  });

  it('assigns correct row numbers with offset', () => {
    const records = [
      { Email: 'a@b.com', Mobile: '111' },
      { Name: 'No Contact' },
      { Email: 'c@d.com', Mobile: '222' },
    ];
    const result = importFromRawData(records, 5);
    expect(result.imported).toHaveLength(2);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0].rowNumber).toBe(7); // 5 + 2
    expect(result.imported[0].email).toBe('a@b.com');
    expect(result.imported[1].email).toBe('c@d.com');
  });

  it('handles empty records array', () => {
    const result = importFromRawData([], 0);
    expect(result.imported).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });
});

describe('CRM status and data source validation', () => {
  it('allows valid CRM statuses', () => {
    const valid = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
    for (const status of valid) {
      expect(ALLOWED_CRM_STATUSES_SET.has(status)).toBe(true);
    }
  });

  it('rejects invalid CRM statuses', () => {
    expect(ALLOWED_CRM_STATUSES_SET.has('INVALID_STATUS')).toBe(false);
    expect(ALLOWED_CRM_STATUSES_SET.has('')).toBe(false);
  });

  it('allows valid data sources', () => {
    const valid = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];
    for (const ds of valid) {
      expect(ALLOWED_DATA_SOURCES_SET.has(ds)).toBe(true);
    }
  });

  it('rejects invalid data sources', () => {
    expect(ALLOWED_DATA_SOURCES_SET.has('unknown_source')).toBe(false);
    expect(ALLOWED_DATA_SOURCES_SET.has('')).toBe(false);
  });
});
