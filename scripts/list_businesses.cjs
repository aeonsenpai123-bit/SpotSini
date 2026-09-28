const fs = require('fs');

const businessesTs = fs.readFileSync('src/data/businesses.ts', 'utf-8');
const regex = /"id":\s*"([^"]+)",[\s\S]*?"nama_usaha":\s*"([^"]+)",[\s\S]*?"nama_pemilik":\s*"([^"]+)",[\s\S]*?"sektor_usaha":\s*"([^"]+)"/g;

let m;
const list = [];
while ((m = regex.exec(businessesTs)) !== null) {
  list.push({ id: m[1], nama: m[2], pemilik: m[3], sektor: m[4] });
}

console.log('Total businesses:', list.length);
list.forEach((b, idx) => {
  console.log(`${idx + 1}. [${b.id}] ${b.nama} (${b.pemilik}) - ${b.sektor}`);
});
