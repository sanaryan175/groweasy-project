require('dotenv').config();
const OpenAI = require('openai');
const client = new OpenAI({
  baseURL: process.env.GROQ_API_URL || 'http://localhost:11434/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});
async function main() {
  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || 'qwen3.5:latest',
    messages: [
      { role: 'system', content: 'Extract CRM data. Respond ONLY raw JSON: {"imported":[...],"skipped":[...]}' },
      { role: 'user', content: 'Records: [{"name":"John","email":"john@test.com"}]' }
    ],
    temperature: 0.1,
    max_tokens: 4096,
  });
  const content = completion.choices[0]?.message?.content;
  console.log('CONTENT:', JSON.stringify(content));
  console.log('USAGE:', JSON.stringify(completion.usage));
  console.log('FINISH_REASON:', completion.choices[0]?.finish_reason);
}
main().catch(e => console.error('ERROR:', e.message));
