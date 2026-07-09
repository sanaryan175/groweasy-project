require('dotenv').config({ path: require('path').join(__dirname, 'backend', '.env') });
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';

const records = [];
for (let i = 0; i < 25; i++) {
  records.push({
    "Full Name": `Person ${i}`,
    "Email": `person${i}@example.com`,
    "Phone": `9876543${i.toString().padStart(4, '0')}`,
    "City": "Bangalore",
    "Company": `Company ${i}`
  });
}

async function main() {
  console.log('Sending 25 records...');
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a data extraction engine. Output ONLY valid JSON. Extract CRM data from each record into these fields: created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description. Respond ONLY with: {"imported":[...],"skipped":[...]}' },
      { role: 'user', content: `Records:\n${JSON.stringify(records)}` }
    ],
    temperature: 0.1,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const choice = completion.choices?.[0];
  const msg = choice?.message;
  console.log('=== finish_reason:', choice?.finish_reason);
  console.log('=== content ===');
  console.log(msg?.content || '(null)');
  console.log('=== content length:', msg?.content?.length || 0);
  console.log('=== usage:', JSON.stringify(completion.usage));
}

main().catch(console.error);
