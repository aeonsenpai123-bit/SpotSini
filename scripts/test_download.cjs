const https = require('https');
const fs = require('fs');
const path = require('path');

const fileId = '1xtJVdWlyVeIYc9L8DATLMZdhSP_yb1j9'; // Rujak Jambu Pak Fahri
const testUrl = `https://lh3.googleusercontent.com/d/${fileId}=w800`;

https.get(testUrl, (res) => {
  console.log('Status code for lh3 CDN:', res.statusCode);
  if (res.statusCode === 200) {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      console.log('Downloaded bytes:', buffer.length);
      fs.writeFileSync('test_rujak.jpg', buffer);
      console.log('Saved test_rujak.jpg successfully!');
    });
  } else if (res.statusCode === 302 || res.statusCode === 303) {
    console.log('Redirect location:', res.headers.location);
  }
});
