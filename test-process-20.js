const http = require('http');

const rows = [];
for (let i = 1; i <= 20; i++) {
  rows.push({
    "Full Name": `Person ${i}`,
    "Email": i % 3 === 0 ? '' : `person${i}@test.com`,
    "Phone": i % 3 === 0 ? '' : `${9876543200 + i}`,
    "City": ["Bangalore", "Mumbai", "Delhi", "Chennai", "Pune"][i % 5],
    "Company": `Company ${i}`
  });
}

const body = JSON.stringify({ rows });

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
    const lines = data.trim().split('\n');
    let lastProgress = null;
    for (const line of lines) {
      const parsed = JSON.parse(line);
      if (parsed.type === 'progress') {
        lastProgress = parsed;
      } else if (parsed.type === 'done') {
        console.log(`Imported: ${parsed.imported.length}, Skipped: ${parsed.skipped.length}`);
        if (lastProgress) {
          console.log(`Progress: ${lastProgress.imported} imported, ${lastProgress.skipped} skipped of ${lastProgress.total}`);
        }
        if (parsed.skipped.length > 0) {
          console.log('Skipped reasons:', parsed.skipped.map(s => s.reason));
        }
        console.log('First imported:', JSON.stringify(parsed.imported[0]));
      } else if (parsed.type === 'error') {
        console.log('ERROR:', parsed.message);
      }
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
