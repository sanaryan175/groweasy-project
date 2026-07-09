require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const OpenAI = require('openai');
const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});
const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';
const EXTRACT_PROMPT = `You are a data extraction engine. Output ONLY valid JSON.
Extract CRM data from each record into fields: created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description.
crm_status: GOOD_LEAD_FOLLOW_UP|DID_NOT_CONNECT|BAD_LEAD|SALE_DONE.
data_source: leads_on_demand|meridian_tower|eden_park|varah_swamy|sarjapur_plots or blank.
Respond ONLY: {"imported":[...],"skipped":[...]}`;

async function test(size) {
  const records = [];
  for (let i = 0; i < size; i++) {
    records.push({
      "Full Name": `Person ${i}`, "Email": `person${i}@test.com`,
      "Phone": `${9876543200 + i}`, "City": "Bangalore", "Company": `Company ${i}`
    });
  }
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
  const content = choice?.message?.content;
  const u = completion.usage;
  console.log(`size=${size} finish=${choice?.finish_reason} prompt_tok=${u?.prompt_tokens} comp_tok=${u?.completion_tokens} reasoning=${u?.completion_tokens_details?.reasoning_tokens} content=${content?.length||0}chars`);
  if (choice?.finish_reason === 'length' && !content) {
    console.log(`  => CONTEXT OVERFLOW at size ${size}`);
    return false;
  }
  return true;
}

async function main() {
  for (const size of [1, 2, 3, 5, 8, 10, 15, 20]) {
    try {
      const ok = await test(size);
      if (!ok) break;
    } catch(e) {
      console.log(`size=${size} ERROR: ${e.message}`);
      break;
    }
  }
}
main().catch(console.error);
