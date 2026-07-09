require('dotenv').config();
const OpenAI = require('openai');
const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

const records = [
  {"Full Name":"John Doe","Email":"john@example.com","Phone":"9876543210","City":"Bangalore","Company":"Acme Corp"},
  {"Full Name":"Jane Smith","Email":"jane@test.com","Phone":"8765432101","City":"Mumbai","Company":"Tech Corp"},
  {"Full Name":"Bob Wilson","Email":"bob@email.com","Phone":"7654321092","City":"Delhi","Company":"Big Corp"},
  {"Full Name":"Alice Brown","Email":"","Phone":"","City":"Chennai","Company":"Small Corp"},
  {"Full Name":"Charlie Davis","Email":"charlie@test.com","Phone":"5432109874","City":"Pune","Company":"Medium Corp"}
];

const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';

async function test(maxTokens) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'Extract CRM data. Fields: created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description. Rules: - crm_status: GOOD_LEAD_FOLLOW_UP|DID_NOT_CONNECT|BAD_LEAD|SALE_DONE - data_source: leads_on_demand|meridian_tower|eden_park|varah_swamy|sarjapur_plots or blank - created_at: valid Date string - Extra emails/mobiles -> crm_note - Put ALL rows in "imported", system skips invalid ones Respond ONLY raw JSON: {"imported":[...],"skipped":[...]}' },
      { role: 'user', content: 'Records:\n' + JSON.stringify(records) }
    ],
    temperature: 0.1,
    max_tokens: maxTokens,
  });

  const content = completion.choices[0]?.message?.content;
  console.log('=== max_tokens:', maxTokens, '===');
  console.log('FINISH_REASON:', completion.choices[0]?.finish_reason);
  console.log('LENGTH:', content?.length);
  console.log('USAGE:', JSON.stringify(completion.usage));
  
  const hasThink = content?.includes('<think>');
  const hasEndThink = content?.includes('</think>');
  const hasBrace = content?.includes('{');
  console.log('Has <think>:', hasThink);
  console.log('Has </think>:', hasEndThink);
  console.log('Has {:', hasBrace);

  if (content) {
    const closeThinkIdx = content.indexOf('</think>');
    if (closeThinkIdx !== -1) {
      const afterThink = content.substring(closeThinkIdx + 8).trim();
      console.log('After </think> (first 100 chars):', JSON.stringify(afterThink.substring(0, 100)));
    } else {
      const openThinkIdx = content.indexOf('<think>');
      if (openThinkIdx !== -1) {
        const rest = content.substring(openThinkIdx + 7, 500);
        console.log('After <think> (no close, first 500):', JSON.stringify(rest));
      }
    }
  }
  console.log('');
}

async function main() {
  await test(512);
  await test(1024);
  await test(2048);
}
main().catch(console.error);
