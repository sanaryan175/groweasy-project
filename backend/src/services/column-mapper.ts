import OpenAI from 'openai';
import { CRM_FIELDS, CSV_FORMAT_EXAMPLES, type CSVAnalysis, type ColumnMapping } from '../types/column-mapping';

const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';

const FORMATS_JSON = JSON.stringify(CSV_FORMAT_EXAMPLES.map(f => ({ name: f.name, columns: f.columns })));
const CRM_FIELDS_JSON = JSON.stringify(CRM_FIELDS.map(f => ({ field: f.field, desc: f.description })));

const ANALYZE_PROMPT = `You are a CSV column mapping engine. Output ONLY valid JSON — no other text, no explanation, no markdown.
Map CSV columns to CRM fields. Known CSV formats: ${FORMATS_JSON}. Target CRM fields: ${CRM_FIELDS_JSON}.
Respond ONLY with this exact JSON structure: {"csvType":"","csvTypeDescription":"","mappings":[{"csvColumn":"","crmField":"","confidence":0}],"unmappedColumns":[],"missingRequiredFields":[]}`;

function buildAnalyzePrompt(headers: string[], sampleRows: Record<string, string>[]): string {
  return `Headers: ${JSON.stringify(headers)}\nSamples: ${JSON.stringify(sampleRows)}`;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function analyzeColumns(
  headers: string[],
  sampleRows: Record<string, string>[]
): Promise<CSVAnalysis> {
  const userPrompt = buildAnalyzePrompt(headers, sampleRows);
  const estimatedInput = estimateTokens(ANALYZE_PROMPT) + estimateTokens(userPrompt);
  const maxInputTokens = 8000;

  if (estimatedInput > maxInputTokens) {
    throw new Error(`Column analysis input too large (est. ${estimatedInput} tokens). Reduce sample rows.`);
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: ANALYZE_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 16384,
      });

      const choice = completion.choices?.[0];
      let content = choice?.message?.content;

      if (choice?.finish_reason === 'length' && !content) {
        console.warn(`[analyzeColumns] Response truncated (length). Try reducing sample rows.`);
        throw new Error('Response truncated (length). Try reducing sample rows.');
      }

      if (!content) {
        console.error(`[analyzeColumns] Empty response. finish_reason=${choice?.finish_reason}, refusal=${choice?.message?.refusal}, model=${completion.model}`);
        console.error(`[analyzeColumns] Full response:`, JSON.stringify(completion));
        throw new Error('Empty response from AI column analyzer');
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
      cleaned = cleaned.replace(/,\s*}/g, '}');
      cleaned = cleaned.replace(/,\s*]/g, ']');

      const parsed = JSON.parse(cleaned);

      return {
        csvType: parsed.csvType || 'Unknown',
        csvTypeDescription: parsed.csvTypeDescription || '',
        mappings: parsed.mappings || [],
        unmappedColumns: parsed.unmappedColumns || [],
        missingRequiredFields: parsed.missingRequiredFields || [],
      };
    } catch (err) {
      const msg = (err as Error).message;
      console.error(`[analyzeColumns] Attempt ${attempt + 1} failed:`, msg);
      if (msg.includes('413') || msg.includes('Request too large') || msg.includes('TPM')) {
        await new Promise((r) => setTimeout(r, 60000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Column analysis failed after 3 retries');
}

export function buildMappingPrompt(mappings: ColumnMapping[]): string {
  if (!mappings || mappings.length === 0) return '';
  const lines = mappings.map(m => `"${m.csvColumn}"→${m.crmField || '?'}`);
  return `Mapping: ${lines.join(', ')}.`;
}
