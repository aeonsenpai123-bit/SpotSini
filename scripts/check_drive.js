const https = require('https');
const fs = require('fs');

const url = 'https://drive.google.com/drive/folders/1Sxk_3lHtP_OatkQBROXqfPTcsRov-rQv';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('HTML length:', data.length);
    fs.writeFileSync('drive_dump.html', data, 'utf-8');

    // Look for image extensions
    const matches = data.match(/([a-zA-Z0-9_\-\.\s]+\.(?:jpg|jpeg|png|webp|JPG|JPEG|PNG))/g) || [];
    console.log('Image pattern matches:', matches.length);
    console.log('Sample matches:', Array.from(new Set(matches)).slice(0, 30));

    // Look for Drive file IDs or objects
    const idMatches = data.match(/\["([a-zA-Z0-9_-]{28,35})"/g) || [];
    console.log('ID matches:', idMatches.length, idMatches.slice(0, 10));

    // Search for keywords
    const keywords = ['Rujak', 'Ayam', 'Konveksi', 'Potato', 'Usaha', 'Penggilingan'];
    keywords.forEach(kw => {
      const idx = data.indexOf(kw);
      if (idx !== -1) {
        console.log(`Found "${kw}" at index ${idx}:`, data.substring(idx - 50, idx + 150));
      }
    });
  });
}).on('error', err => {
  console.error('Error fetching drive:', err);
});
