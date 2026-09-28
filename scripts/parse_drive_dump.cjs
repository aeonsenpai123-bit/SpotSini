const fs = require('fs');

const html = fs.readFileSync('drive_dump.html', 'utf-8');

// Search for all aria-label="..."
const folderMatches = [];
const regex = /aria-label="([^"]+)"[^>]*ssk='([^']+)'/g;
let m;
while ((m = regex.exec(html)) !== null) {
  folderMatches.push({ label: m[1], ssk: m[2] });
}

console.log('Found folders/items with ssk:', folderMatches.length);
folderMatches.forEach(item => {
  console.log('-', item.label, '-->', item.ssk);
});

// Also search for any aria-label with "Shared folder" or file
const generalLabels = [];
const regex2 = /aria-label="([^"]*(?:Shared folder|JPG|PNG|JPEG|jpg|png|jpeg)[^"]*)"/g;
while ((m = regex2.exec(html)) !== null) {
  generalLabels.push(m[1]);
}
console.log('\nGeneral labels:', Array.from(new Set(generalLabels)));
