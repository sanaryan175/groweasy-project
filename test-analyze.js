const http = require('http');

const body = JSON.stringify({
  headers: ["Full Name", "Email", "Phone", "City", "Company"],
  sampleRows: [
    { "Full Name": "John Doe", "Email": "john@example.com", "Phone": "9876543210", "City": "Bangalore", "Company": "Acme Corp" },
    { "Full Name": "Jane Smith", "Email": "jane@test.com", "Phone": "8765432101", "City": "Mumbai", "Company": "Tech Corp" }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/analyze',
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
    try {
      console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
    } catch(e) {
      console.log('Raw response:', data);
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
