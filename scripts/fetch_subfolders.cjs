const https = require('https');
const fs = require('fs');

const subfolders = [
  { name: 'Ayam Bakar Solo', id: '1BTwkV1cMGzBpzr536rhCkFoBU1DOpTRG' },
  { name: 'Es Teler Creamy', id: '1wq4EC27CUzRfcBeXgAbiwbCUiHE7WBN7' },
  { name: 'Pak Fahri (Rujak Jambu Kristal)', id: '1WIZbvK7UP3m1SdRtXQzvk8hPSQVK6dW7' },
  { name: 'Pak Fajar', id: '1zA7-wHfXvq08I4KEU0qoA6AZmLeA8t6N' },
  { name: 'Pak Yono (Ayam Bakar Pak Yono PIK)', id: '1Y2Ijsssl3CkeRT1T4s600dDsFVNL_y5R' },
  { name: 'Potato Curly (Potato Curly Crunch)', id: '1skXWJL1JJqbUj7iGj9B6U6mYkmN9Hn-P' },
  { name: 'Yo Londre', id: '11eBqCHgfgqjjJwY1L0XkuA7ru-rPQADi' }
];

async function fetchFolder(f) {
  const url = `https://drive.google.com/drive/folders/${f.id}`;
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const regex = /aria-label="([^"]+Image Shared)"[^>]*ssk='5:auSv138:([a-zA-Z0-9_-]+)-0-16'/g;
        let m;
        const images = [];
        while ((m = regex.exec(data)) !== null) {
          images.push({ title: m[1], id: m[2] });
        }
        resolve({ folder: f.name, folderId: f.id, images });
      });
    }).on('error', err => resolve({ folder: f.name, error: err }));
  });
}

(async () => {
  const results = [];
  for (const sf of subfolders) {
    const res = await fetchFolder(sf);
    results.push(res);
    console.log(`Folder: ${res.folder} -> Found ${res.images ? res.images.length : 0} images`);
    if (res.images) {
      res.images.forEach(img => console.log(`   - ${img.title} (ID: ${img.id})`));
    }
  }
  fs.writeFileSync('drive_subfolders.json', JSON.stringify(results, null, 2));
})();
