const http = require('http');
const body = JSON.stringify({
  rows: [
    {"Full Name":"John Doe","Email":"john@example.com","Phone":"9876543210","City":"Bangalore","Company":"Acme Corp"},
    {"Full Name":"Jane Smith","Email":"jane@test.com","Phone":"8765432101","City":"Mumbai","Company":"Tech Corp"}
  ]
  // no mappings!
});
const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/process',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, r => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    console.log('Status:', r.statusCode);
    console.log(d);
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
