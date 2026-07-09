require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const OpenAI = require('openai');
const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});
const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';

const EXTRACT_PROMPT = `You are a data extraction engine. Output ONLY valid JSON — no other text, no explanation, no markdown.
Extract CRM data from each record into these fields: created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description.
Rules:
- crm_status must be one of: GOOD_LEAD_FOLLOW_UP|DID_NOT_CONNECT|BAD_LEAD|SALE_DONE
- data_source must be one of: leads_on_demand|meridian_tower|eden_park|varah_swamy|sarjapur_plots or blank
- Extra emails/mobiles go into crm_note
- Every input record must appear in "imported" (with extracted fields)
- Records missing both email and mobile go into "skipped"
Respond ONLY with this exact JSON structure: {"imported":[...],"skipped":[...]}`;

async function test(size, useJsonMode, maxTokens, prompt) {
  const records = [];
  for (let i = 0; i < size; i++) {
    records.push({
      "Full Name": `Person ${i}`,
      "Email": i % 3 === 0 ? '' : `person${i}@test.com`,
      "Phone": i % 3 === 0 ? '' : `${9876543200 + i}`,
      "City": ["Bangalore", "Mumbai", "Delhi", "Chennai", "Pune"][i % 5],
      "Company": `Company ${i}`
    });
  }
  const opts = {
    model: MODEL,
    messages: [
      { role: 'system', content: prompt || EXTRACT_PROMPT },
      { role: 'user', content: `Records:\n${JSON.stringify(records)}` }
    ],
    temperature: 0.1,
    max_tokens: maxTokens || 4096,
  };
  if (useJsonMode) opts.response_format = { type: "json_object" };

  const completion = await client.chat.completions.create(opts);
  const choice = completion.choices?.[0];
  const content = choice?.message?.content;
  const u = completion.usage;
  const label = `size=${size} json=${useJsonMode} max_tok=${maxTokens||4096}`;
  console.log(`${label} finish=${choice?.finish_reason} prompt=${u?.prompt_tokens} comp=${u?.completion_tokens} reasoning=${u?.completion_tokens_details?.reasoning_tokens} content=${content?.length||0}chars`);
  if (content) {
    try {
      const parsed = JSON.parse(content);
      console.log(`  => imported=${parsed.imported?.length||0} skipped=${parsed.skipped?.length||0}`);
    } catch(e) {
      console.log(`  => PARSE ERROR: ${e.message.slice(0,100)}`);
    }
  }
  return !!content;
}

async function main() {
  console.log('--- Test 5 records with both modes ---');
  await test(5, true, 4096);   // json_mode, 4096
  await test(5, false, 4096);  // no json_mode, 4096
  await test(5, false, 8192);  // no json_mode, 8192

  console.log('\n--- Test 10 records ---');
  await test(10, false, 4096);
  await test(10, false, 8192);

  console.log('\n--- Test 20 records ---');
  await test(20, false, 4096);
  await test(20, false, 8192);
}
main().catch(console.error);
