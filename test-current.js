const http = require('http');
const rows = [];
for (let i = 1; i <= 5; i++) {
  rows.push({
    "Full Name": `Person ${i}`,
    "Email": i % 3 === 0 ? '' : `person${i}@test.com`,
    "Phone": i % 3 === 0 ? '' : `${9876543200 + i}`,
    "City": ["Bangalore","Mumbai","Delhi","Chennai","Pune"][i % 5],
    "Company": `Company ${i}`
  });
}
const mappings = [
  { csvColumn: "Full Name", crmField: "name", confidence: 1 },
  { csvColumn: "Email", crmField: "email", confidence: 1 },
  { csvColumn: "Phone", crmField: "mobile_without_country_code", confidence: 1 },
  { csvColumn: "City", crmField: "city", confidence: 1 },
  { csvColumn: "Company", crmField: "company", confidence: 1 }
];
const body = JSON.stringify({ rows, mappings });
const start = Date.now();
const req = http.request({hostname:'localhost',port:3001,path:'/api/process',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, r => {
  let d=''; r.on('data',c=>d+=c); r.on('end',() => {
    const lines = d.trim().split('\n');
    for (const l of lines) { const p=JSON.parse(l); if(p.type==='done') { console.log('Time:', Date.now()-start, 'ms'); console.log('Imported:', p.imported.length, 'Skipped:', p.skipped.length); if(p.imported[0]) console.log('Sample:', JSON.stringify(p.imported[0])); } }
  });
});
req.on('error',e=>console.error(e.message));
req.write(body); req.end();
