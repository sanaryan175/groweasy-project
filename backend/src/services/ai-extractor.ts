import OpenAI from 'openai';
import pLimit from 'p-limit';
import { CRMRecord, ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES } from '../types/crm';
import type { ColumnMapping } from '../types/column-mapping';

const ALLOWED_CRM_STATUSES_SET = new Set<string>(ALLOWED_CRM_STATUSES);
const ALLOWED_DATA_SOURCES_SET = new Set<string>(ALLOWED_DATA_SOURCES);

const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
  timeout: parseInt(process.env.GROQ_TIMEOUT || '60000', 10),
  maxRetries: 0,
});

const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';

const CRM_FIELDS_STR = 'created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description';
const CRM_STATUSES_STR = ALLOWED_CRM_STATUSES.join('|');
const DATA_SOURCES_STR = ALLOWED_DATA_SOURCES.join('|');

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const MAX_INPUT_TOKENS = 16000;

export interface BatchResult {
  imported: CRMRecord[];
  skipped: { rowNumber: number; rawData: string; reason: string }[];
}

interface ProgressState {
  imported: number;
  skipped: number;
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

function autoDetectMappings(records: Record<string, string>[]): ColumnMapping[] {
  if (records.length === 0) return [];
  const headers = Object.keys(records[0]);
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

function applyMapping(record: Record<string, string>, mappings: ColumnMapping[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const m of mappings) {
    mapped[m.crmField] = record[m.csvColumn] ?? '';
  }
  return mapped;
}

function splitValue(value: string): { first: string; rest: string } {
  const trimmed = value.trim();
  if (!trimmed) return { first: '', rest: '' };
  const parts = trimmed.split(/[;,/\s]+/).filter(Boolean);
  return { first: parts[0] || '', rest: parts.slice(1).join(', ') };
}

function importFromRawData(
  records: Record<string, string>[],
  startIndex: number,
  mappedRecords?: Record<string, string>[],
  onProgress?: (imported: number, skipped: number, total: number) => void,
  onProgressTotal?: number,
  progressState?: ProgressState,
): BatchResult {
  const imported: CRMRecord[] = [];
  const skipped: { rowNumber: number; rawData: string; reason: string }[] = [];
  const total = onProgressTotal ?? records.length;

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

    if (progressState) {
      progressState.imported = imported.length;
      progressState.skipped = skipped.length;
    }
    onProgress?.(imported.length, skipped.length, total);
  }

  return { imported, skipped };
}

export async function extractInBatches(
  allRecords: Record<string, string>[],
  batchSize = 50,
  onProgress?: (imported: number, skipped: number, total: number) => void,
  concurrency = 5,
  mappings?: ColumnMapping[]
): Promise<{ imported: CRMRecord[]; skipped: { rowNumber: number; rawData: string; reason: string }[] }> {
  const effectiveMappings = mappings && mappings.length > 0 ? mappings : autoDetectMappings(allRecords);
  const hasAllMapped = effectiveMappings.length > 0 && effectiveMappings.every(m => m.crmField);

  const limit = pLimit(concurrency);
  const progressState: ProgressState = { imported: 0, skipped: 0 };
  const total = allRecords.length;

  if (hasAllMapped) {
    const mappedAll = allRecords.map(r => applyMapping(r, effectiveMappings));
    return importFromRawData(allRecords, 0, mappedAll, onProgress, total, progressState);
  }

  const allImported: CRMRecord[] = [];
  const allSkipped: { rowNumber: number; rawData: string; reason: string }[] = [];

  const batches: { records: Record<string, string>[]; startIndex: number }[] = [];
  for (let i = 0; i < total; i += batchSize) {
    batches.push({ records: allRecords.slice(i, i + batchSize), startIndex: i });
  }

  const emitProgress = () => onProgress?.(progressState.imported, progressState.skipped, total);

  const tasks = batches.map((batch) =>
    limit(async () => {
      try {
        const result = await extractBatch(batch.records, batch.startIndex, effectiveMappings, 2, onProgress, total, progressState);
        allImported.push(...result.imported);
        allSkipped.push(...result.skipped);
        progressState.imported = allImported.length;
        progressState.skipped = allSkipped.length;
        emitProgress();
      } catch (err) {
        console.error('[extractInBatches] batch error:', (err as Error).message);
      }
    })
  );

  await Promise.all(tasks);

  return { imported: allImported, skipped: allSkipped };
}

export async function extractBatch(
  records: Record<string, string>[],
  startIndex: number,
  mappings?: ColumnMapping[],
  retries = 2,
  onProgress?: (imported: number, skipped: number, total: number) => void,
  onProgressTotal?: number,
  progressState?: ProgressState,
): Promise<BatchResult> {
  const mappedRecords = mappings && mappings.length > 0 ? records.map(r => applyMapping(r, mappings)) : records;
  const batchPrompt = `Records:\n${JSON.stringify(mappedRecords)}`;

  const EXTRACT_PROMPT = `You are a data extraction engine. Output ONLY valid JSON — no other text, no explanation, no markdown.
Extract CRM data from each record into these fields: ${CRM_FIELDS_STR}.
Rules:
- crm_status must be one of: ${CRM_STATUSES_STR}. If you cannot confidently match, leave as empty string.
- data_source must be one of: ${DATA_SOURCES_STR}. If none matches confidently, leave as empty string.
- Extra emails/mobiles go into crm_note
- Every input record must appear in "imported" (with extracted fields)
- Records missing both email and mobile go into "skipped"
Respond ONLY with this exact JSON structure: {"imported":[...],"skipped":[...]}`;

  const estimatedInput = estimateTokens(EXTRACT_PROMPT) + estimateTokens(batchPrompt);

  if (estimatedInput > MAX_INPUT_TOKENS) {
    console.warn(`[extractBatch] Batch too large (est. ${estimatedInput} tokens). Splitting ${records.length} records.`);
    if (records.length <= 1) {
      return importFromRawData(records, startIndex, mappedRecords, onProgress, onProgressTotal, progressState);
    }
    const mid = Math.ceil(records.length / 2);
    const [left, right] = await Promise.all([
      extractBatch(records.slice(0, mid), startIndex, mappings, retries, onProgress, onProgressTotal, progressState),
      extractBatch(records.slice(mid), startIndex + mid, mappings, retries, onProgress, onProgressTotal, progressState),
    ]);
    return {
      imported: [...left.imported, ...right.imported],
      skipped: [...left.skipped, ...right.skipped],
    };
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: EXTRACT_PROMPT },
          { role: 'user', content: batchPrompt },
        ],
        temperature: 0.1,
        max_tokens: Math.min(4096 + records.length * 120, 16384),
      });

      const choice = completion.choices?.[0];
      const msg = choice?.message;
      let content = msg?.content;

      if (choice?.finish_reason === 'length') {
        console.warn(`[extractBatch] Response truncated (length). Splitting ${records.length} records.`);
        if (records.length <= 1) {
          return importFromRawData(records, startIndex, mappedRecords, onProgress, onProgressTotal, progressState);
        }
        const mid = Math.ceil(records.length / 2);
        const [left, right] = await Promise.all([
          extractBatch(records.slice(0, mid), startIndex, mappings, 1, onProgress, onProgressTotal, progressState),
          extractBatch(records.slice(mid), startIndex + mid, mappings, 1, onProgress, onProgressTotal, progressState),
        ]);
        return {
          imported: [...left.imported, ...right.imported],
          skipped: [...left.skipped, ...right.skipped],
        };
      }

      if (content === null || content === undefined) {
        throw new Error(`Empty response from AI (finish_reason: ${choice?.finish_reason || 'unknown'})`);
      }

      let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      cleaned = cleaned.replace(/<\/?think>/gi, '').trim();
      cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      cleaned = cleaned.replace(/^[^{]*?({)/, '$1');
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error(`AI did not return valid JSON. Response: ${content.slice(0, 200)}`);
      }
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      cleaned = cleaned.replace(/new Date\([^)]*\)/g, '""');
      cleaned = cleaned.replace(/,\s*}/g, '}');
      cleaned = cleaned.replace(/,\s*]/g, ']');

      const parsed = JSON.parse(cleaned);

      const aiImportedRaw = parsed.imported ?? [];
      const aiSkippedRaw = parsed.skipped ?? [];
      const totalAiRecords = aiImportedRaw.length + aiSkippedRaw.length;

      if (totalAiRecords !== records.length) {
        console.warn(`[extractBatch] AI returned ${totalAiRecords} records but batch has ${records.length}.`);
      }

      const normalizeToCRM = (r: Record<string, any>): CRMRecord => {
        const rawEmail = r.email || r.Email || r['E-mail'] || r['Email Address'] || '';
        const rawMobile = r.mobile_without_country_code || r.Mobile || r.Phone || r.phone || r.mobile ||
                          r['Mobile Number'] || r['Phone Number'] || '';
        const email = splitValue(rawEmail);
        const mobile = splitValue(rawMobile);
        const createdAt = r.created_at ? (() => { try { new Date(r.created_at); return r.created_at; } catch { return new Date().toISOString(); } })() : new Date().toISOString();
        return {
          created_at: createdAt,
          name: r.name || r.Name || r['Full Name'] || r['full_name'] || '',
          email: email.first,
          country_code: r.country_code || r.CountryCode || r['Country Code'] || '',
          mobile_without_country_code: mobile.first,
          company: r.company || r.Company || r['Company Name'] || '',
          city: r.city || r.City || '',
          state: r.state || r.State || '',
          country: r.country || r.Country || '',
          lead_owner: r.lead_owner || r.LeadOwner || r['Lead Owner'] || '',
          crm_status: ALLOWED_CRM_STATUSES_SET.has(r.crm_status)
            ? r.crm_status
            : '',
          crm_note: r.crm_note ? `${[r.crm_note, email.rest, mobile.rest].filter(Boolean).join('; ')}` : [email.rest, mobile.rest].filter(Boolean).join('; '),
          data_source: ALLOWED_DATA_SOURCES_SET.has(r.data_source)
            ? r.data_source
            : '',
          possession_time: r.possession_time || '',
          description: r.description || r.Description || '',
        };
      };

      const allAiRecords = [...aiImportedRaw, ...aiSkippedRaw].map(normalizeToCRM);

      const batchSkipped: { rowNumber: number; rawData: string; reason: string }[] = [];
      const validImported: CRMRecord[] = [];

      for (let i = 0; i < allAiRecords.length; i++) {
        const record = allAiRecords[i];
        if (!record.email && !record.mobile_without_country_code) {
          batchSkipped.push({
            rowNumber: startIndex + i + 1,
            rawData: JSON.stringify(record),
            reason: 'Missing both email and mobile number',
          });
        } else {
          validImported.push(record);
        }
        if (progressState) {
          progressState.imported = validImported.length;
          progressState.skipped = batchSkipped.length;
        }
        onProgress?.(validImported.length, batchSkipped.length, onProgressTotal ?? records.length);
      }

      if (totalAiRecords < records.length) {
        const remaining = importFromRawData(
          records.slice(totalAiRecords),
          startIndex + totalAiRecords,
          mappedRecords?.slice(totalAiRecords),
          onProgress,
          onProgressTotal,
          progressState,
        );
        validImported.push(...remaining.imported);
        batchSkipped.push(...remaining.skipped);
      }

      return { imported: validImported, skipped: batchSkipped };
    } catch (err) {
      console.error(`[extractBatch] Attempt ${attempt + 1} failed:`, (err as Error).message);
      const delay = parseRetryDelay(err);
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (attempt === retries - 1) {
        console.warn(`[extractBatch] AI extraction failed after ${retries} attempts. Falling back to raw data import.`);
        return importFromRawData(records, startIndex, mappedRecords, onProgress, onProgressTotal, progressState);
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { imported: [], skipped: [] };
}

function parseRetryDelay(err: unknown): number {
  const msg = (err as Error).message;
  const match = msg.match(/try again in (\d+)m/i);
  if (match) return (parseInt(match[1]) + 1) * 60 * 1000;
  if (msg.includes('429') || msg.includes('rate limit')) return 30000;
  return 0;
}
