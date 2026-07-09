require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';

// Simulate the EXACT prompt from the code
const CRM_FIELDS_STR = 'created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description';
const EXTRACT_PROMPT = `You are a data extraction engine. Output ONLY valid JSON — no other text, no explanation, no markdown.
Extract CRM data from each record into these fields: ${CRM_FIELDS_STR}.
Rules:
- crm_status must be one of: GOOD_LEAD_FOLLOW_UP|DID_NOT_CONNECT|BAD_LEAD|SALE_DONE
- data_source must be one of: leads_on_demand|meridian_tower|eden_park|varah_swamy|sarjapur_plots or blank
- Extra emails/mobiles go into crm_note
- Every input record must appear in "imported" (with extracted fields)
- Records missing both email and mobile go into "skipped"
Respond ONLY with this exact JSON structure: {"imported":[...],"skipped":[...]}`;

const records = [];
for (let i = 0; i < 20; i++) {
  records.push({
    "Full Name": `Person ${i}`,
    "Email": i % 3 === 0 ? '' : `person${i}@test.com`,
    "Phone": i % 3 === 0 ? '' : `${9876543200 + i}`,
    "City": ["Bangalore", "Mumbai", "Delhi", "Chennai", "Pune"][i % 5],
    "Company": `Company ${i}`
  });
}

async function main() {
  console.log(`Sending ${records.length} records...`);
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: EXTRACT_PROMPT },
      { role: 'user', content: `Records:\n${JSON.stringify(records)}` }
    ],
    temperature: 0.1,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const choice = completion.choices?.[0];
  console.log('\n=== finish_reason:', choice?.finish_reason);
  console.log('=== usage:', JSON.stringify(completion.usage, null, 2));
  
  const content = choice?.message?.content;
  if (content) {
    try {
      const parsed = JSON.parse(content);
      const imported = parsed.imported?.length || 0;
      const skipped = parsed.skipped?.length || 0;
      console.log(`\n=== AI returned: ${imported} imported, ${skipped} skipped`);
      if (imported + skipped !== records.length) {
        console.log(`*** MISMATCH: ${records.length} sent, ${imported + skipped} returned (${records.length - imported - skipped} missing)`);
      }
      if (imported > 0) {
        console.log('\n=== First imported record keys with null values:');
        const first = parsed.imported[0];
        for (const [k, v] of Object.entries(first)) {
          if (v === null) console.log(`  ${k}: null`);
        }
      }
      if (skipped > 0) {
        console.log('\n=== Skipped reasons:', parsed.skipped.map(s => s.reason).slice(0, 3));
      }
    } catch(e) {
      console.log('\n=== JSON PARSE ERROR:', e.message);
      console.log('Raw content (first 500):', content.slice(0, 500));
    }
  } else {
    console.log('\n=== Content is null/undefined');
  }
}

main().catch(console.error);
