const http = require('http');

const rows = [
  { "Full Name": "John Doe", "Email": "john@example.com", "Phone": "9876543210", "City": "Bangalore", "Company": "Acme Corp" },
  { "Full Name": "Jane Smith", "Email": "jane@test.com", "Phone": "8765432101", "City": "Mumbai", "Company": "Tech Corp" },
  { "Full Name": "Bob Wilson", "Email": "bob@email.com", "Phone": "7654321092", "City": "Delhi", "Company": "Big Corp" },
  { "Full Name": "Alice Brown", "Email": "", "Phone": "", "City": "Chennai", "Company": "Small Corp" },
  { "Full Name": "Charlie Davis", "Email": "charlie@test.com", "Phone": "5432109874", "City": "Pune", "Company": "Medium Corp" }
];

const mappings = [
  { csvColumn: "Full Name", crmField: "name", confidence: 1 },
  { csvColumn: "Email", crmField: "email", confidence: 1 },
  { csvColumn: "Phone", crmField: "mobile_without_country_code", confidence: 1 },
  { csvColumn: "City", crmField: "city", confidence: 1 },
  { csvColumn: "Company", crmField: "company", confidence: 1 }
];

const body = JSON.stringify({ rows, mappings });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/process',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Raw NDJSON:');
    const lines = data.trim().split('\n');
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'progress') {
          console.log('  [progress] imported:', parsed.imported, 'skipped:', parsed.skipped, 'total:', parsed.total);
        } else if (parsed.type === 'done') {
          console.log('  [done] imported:', parsed.imported.length, 'rows, skipped:', parsed.skipped.length, 'rows');
          console.log('  Imported records:', JSON.stringify(parsed.imported, null, 2));
          if (parsed.skipped.length > 0) {
            console.log('  Skipped records:', JSON.stringify(parsed.skipped, null, 2));
          }
        } else if (parsed.type === 'error') {
          console.log('  [error]', parsed.message);
        }
      } catch(e) {
        console.log('  [parse error]', line);
      }
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
