require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';

async function main() {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'Extract CRM data. Fields: created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description. Rules: - crm_status: GOOD_LEAD_FOLLOW_UP|DID_NOT_CONNECT|BAD_LEAD|SALE_DONE - data_source: leads_on_demand|meridian_tower|eden_park|varah_swamy|sarjapur_plots or blank - created_at: valid Date string - Extra emails/mobiles -> crm_note - Put ALL rows in "imported", system skips invalid ones Respond ONLY raw JSON: {"imported":[...],"skipped":[...]}' },
      { role: 'user', content: 'Records:\n[{"Full Name":"John Doe","Email":"john@example.com","Phone":"9876543210","City":"Bangalore","Company":"Acme Corp"}]' }
    ],
    temperature: 0.1,
    max_tokens: 4096,
  });

  const content = completion.choices[0]?.message?.content;
  console.log('=== FULL RESPONSE ===');
  console.log(content);
  console.log('=== END ===');
  console.log('Length:', content?.length || 0);
  console.log('Usage:', JSON.stringify(completion.usage));
}

main().catch(console.error);
