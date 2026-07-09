require('dotenv').config();
const OpenAI = require('openai');
const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

const records = [
  {"Full Name":"John Doe","Email":"john@example.com","Phone":"9876543210","City":"Bangalore","Company":"Acme Corp"},
  {"Full Name":"Jane Smith","Email":"jane@test.com","Phone":"8765432101","City":"Mumbai","Company":"Tech Corp"}
];

const MODEL = process.env.GROQ_MODEL || 'qwen3.5:latest';

async function test(model) {
  console.log('=== Model:', model, '===');
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Extract CRM data. Transform each record using the field mapping. Every record goes in "imported" with CRM fields. Respond ONLY raw JSON: {"imported":[...],"skipped":[...]}' },
        { role: 'user', content: 'Records:\n' + JSON.stringify(records) + '\n\nMapping: "Full Name"→name, "Email"→email, "Phone"→mobile_without_country_code, "City"→city, "Company"→company' }
      ],
      temperature: 0.1,
      max_tokens: 2048,
    });

    const content = completion.choices[0]?.message?.content;
    console.log('Has <think>:', content?.includes('<think>'));
    console.log('Has </think>:', content?.includes('</think>'));
    console.log('Usage:', JSON.stringify(completion.usage));
    
    const cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<\/?think>/gi, '').trim();
    const braceIdx = cleaned.indexOf('{');
    if (braceIdx !== -1) {
      const json = cleaned.substring(braceIdx, cleaned.lastIndexOf('}') + 1);
      const parsed = JSON.parse(json);
      console.log('Imported:', parsed.imported?.length);
      console.log('Skipped:', parsed.skipped?.length);
    } else {
      console.log('No JSON found');
    }
  } catch(e) {
    console.error('ERROR:', e.message);
  }
  console.log('');
}

async function main() {
  await test(MODEL);
}
main().catch(console.error);
