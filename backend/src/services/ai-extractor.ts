import OpenAI from 'openai';
import pLimit from 'p-limit';
import { CRMRecord, ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES } from '../types/crm';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are a CRM data extraction assistant. Extract as many of the following fields as possible from each CSV record and map them into GrowEasy CRM format.

CRM Fields:
Field              | Description
created_at         | Lead creation date (must be parsable by new Date())
name               | Lead name
email              | Primary email
country_code       | Country code (e.g., +91)
mobile_without_country_code | Mobile number without country code
company            | Company name
city               | City
state              | State
country            | Country
lead_owner         | Lead owner
crm_status         | Lead status (see allowed values below)
crm_note           | Notes/remarks (see rule 4)
data_source        | Source (see allowed values below)
possession_time    | Property possession time
description        | Additional description

Follow these rules:

1. Allowed CRM Status Values — only use one of: ${ALLOWED_CRM_STATUSES.join(', ')}

2. Allowed Data Source Values — only use one of: ${ALLOWED_DATA_SOURCES.join(', ')}. If none match confidently, leave it blank.

3. Date Format — created_at must be convertible using JavaScript: new Date(created_at)

4. CRM Notes — Use crm_note for: remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, and any useful information that doesn't fit another field.

5. Multiple Emails or Mobile Numbers — If multiple email addresses exist: use the first email, append remaining emails into crm_note. If multiple mobile numbers exist: use the first mobile, append remaining numbers into crm_note.

6. CSV Compatibility — Each record must remain a single CSV row. Avoid introducing unintended line breaks. If line breaks are necessary, escape them as \\n so the CSV remains valid.

7. Skip Invalid Records — If a record contains neither email nor mobile number, skip that record.

8. Intelligent Mapping — Source column names may not match CRM field names exactly. Infer the correct mapping based on context (e.g., "Phone" → mobile_without_country_code, "Full Name" → name, "Organization" → company).

Return a JSON object with two arrays: "imported" (array of successfully mapped CRM records with all 15 fields) and "skipped" (array of objects with "rowNumber", "rawData", and "reason" for records that could not be processed).`;

function buildBatchPrompt(records: Record<string, string>[]): string {
  return `Extract CRM data from the following ${records.length} CSV record(s). Return ONLY a valid JSON object with "imported" (array of CRM records with all 15 fields) and "skipped" (array of objects with "rowNumber", "rawData", and "reason"). Do not include any text outside the JSON.

Records:
${JSON.stringify(records, null, 2)}`;
}

export interface BatchResult {
  imported: CRMRecord[];
  skipped: { rowNumber: number; rawData: string; reason: string }[];
}

export async function extractBatch(
  records: Record<string, string>[],
  startIndex: number,
  retries = 3
): Promise<BatchResult> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildBatchPrompt(records) },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      const parsed = JSON.parse(content);
      return {
        imported: (parsed.imported ?? []).map((r: CRMRecord) => ({
          ...r,
          created_at: r.created_at || new Date().toISOString(),
          crm_status: ALLOWED_CRM_STATUSES.includes(r.crm_status as any)
            ? r.crm_status
            : 'GOOD_LEAD_FOLLOW_UP',
          data_source: ALLOWED_DATA_SOURCES.includes(r.data_source as any)
            ? r.data_source
            : '',
        })),
        skipped: parsed.skipped ?? [],
      };
    } catch (err) {
      if (attempt === retries - 1) {
        return {
          imported: [],
          skipped: records.map((_, i) => ({
            rowNumber: startIndex + i + 1,
            rawData: JSON.stringify(records[i]),
            reason: `AI extraction failed after ${retries} attempts: ${(err as Error).message}`,
          })),
        };
      }
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  return { imported: [], skipped: [] };
}

export async function extractInBatches(
  allRecords: Record<string, string>[],
  batchSize = 10,
  onProgress?: (imported: number, skipped: number, total: number) => void,
  concurrency = 3
): Promise<{ imported: CRMRecord[]; skipped: { rowNumber: number; rawData: string; reason: string }[] }> {
  const allImported: CRMRecord[] = [];
  const allSkipped: { rowNumber: number; rawData: string; reason: string }[] = [];
  const total = allRecords.length;
  const limit = pLimit(concurrency);

  const batches: { records: Record<string, string>[]; startIndex: number }[] = [];
  for (let i = 0; i < total; i += batchSize) {
    batches.push({ records: allRecords.slice(i, i + batchSize), startIndex: i });
  }

  const tasks = batches.map((batch) =>
    limit(async () => {
      const result = await extractBatch(batch.records, batch.startIndex);
      allImported.push(...result.imported);
      allSkipped.push(...result.skipped);
      onProgress?.(allImported.length, allSkipped.length, total);
    })
  );

  await Promise.all(tasks);

  return { imported: allImported, skipped: allSkipped };
}
