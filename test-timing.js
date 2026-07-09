const http = require('http');

const rows = [];
for (let i = 1; i <= 5; i++) {
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

console.log('Sending', rows.length, 'records...');
const start = Date.now();

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
    console.log('Chunk at', Date.now()-start, 'ms:', chunk.toString().substring(0, 100));
  });
  res.on('end', () => {
    console.log('Finished at', Date.now()-start, 'ms');
    console.log('Full response:', data);
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();
