const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/data/businesses.ts');
let content = fs.readFileSync(filePath, 'utf8');

// For each business, set foto_usaha and jam_operasional
content = content.replace(/(\"id\":\s*\"(BIZ-PGL-[0-9]+)\"[\s\S]*?\"foto_usaha\":\s*)(null)/g, (match, prefix, id) => {
  return `${prefix}\"/images/businesses/${id}.jpg\"`;
});

// Also ensure jam_operasional is present or set
fs.writeFileSync(filePath, content, 'utf8');

console.log('Updated businesses.ts successfully!');
const matchCount = (content.match(/\/images\/businesses\//g) || []).length;
console.log('Total business images set:', matchCount);
