const http = require('http');
const fs = require('fs');
const path = require('path');

const boundary = '----TestBoundary' + Date.now();
const filePath = 'E:/Downloads/groweasy-project/test.csv';
const content = fs.readFileSync(filePath);
const fileName = path.basename(filePath);

let header = '';
header += '--' + boundary + '\r\n';
header += 'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n';
header += 'Content-Type: text/csv\r\n\r\n';

const bodyBuffer = Buffer.concat([
  Buffer.from(header, 'utf-8'),
  content,
  Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8')
]);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(bodyBuffer);
req.end();
