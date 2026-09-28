const https = require('https');
const fs = require('fs');
const path = require('path');

const outputDir = path.resolve('public/images/businesses');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const driveImages = [
  { id: 'BIZ-PGL-001', name: 'Rujak Jambu Kristal', fileId: '1xtJVdWlyVeIYc9L8DATLMZdhSP_yb1j9' },
  { id: 'BIZ-PGL-002', name: 'Ayam Bakar Pak Yono PIK', fileId: '1Grkucc1fnsb5KCAYmKVQ_q-NYoD-fE09' },
  { id: 'BIZ-PGL-003', name: 'Potato Curly Crunch', fileId: '1Bl16lbTl0hPgWB2b_Zz39VkJl41Cv6-2' },
  { id: 'BIZ-PGL-004', name: 'YO LONDRE', fileId: '1qd-Wxh71eKN8dZj2U5rVtzTu0DD0a59a' },
  { id: 'BIZ-PGL-005', name: 'Cireng', fileId: '1E3ZIqfwTxUwgWeBXZnLiGzdDNyOSH21I' },
  { id: 'BIZ-PGL-006', name: 'Es Teler Creamy', fileId: '1rPZm9Pm0txg7yGHRTXpF4fMhRmMhsAbt' },
  { id: 'BIZ-PGL-007', name: 'Ayam Bakar Solo Pak Agus', fileId: '1ZMLP4ToqQJ35va2C3141zisBKhuqUypl' },
  { id: 'BIZ-PGL-008', name: 'Ayam Bakar Sukarti', fileId: '1CEtN4poRMv2lszePdpY3-oEhok8pxCLO' },
  { id: 'BIZ-PGL-009', name: 'Seblak Cadas & Seafood Tumpah', fileId: '1jiGdiXDnhEaLc9EBT-QZbQH_5OcROpVq' },
  { id: 'BIZ-PGL-010', name: 'O’Coin Laundry', fileId: '1bG6l8WXXWZDMPVnayqSi2c2_5hVsQvuJ' },
  { id: 'BIZ-PGL-012', name: 'Mie Ayam Pak Robet', fileId: '1gFMY65DVB2ezKMcY5Rh_0cYz_w-rayjA' },
  { id: 'BIZ-PGL-013', name: 'Sambara Pedas Membara', fileId: '1Bbk_Y8PnyualiTiuHixHc1ASUdQV3IW1' },
  { id: 'BIZ-PGL-014', name: 'Bakso Mas Memble', fileId: '1FlY8i0lwnZBoipbAzu5PXg3JyzjJx_tg' },
  { id: 'BIZ-PGL-016', name: 'Seblak Prasmanan Teh Yani', fileId: '1vVccQVU8IGmZgyMCfsOIMcuqYEVQtH1y' },
  { id: 'BIZ-PGL-018', name: 'Mie Ayam Gajah Mungkur Pakde Warno', fileId: '1EEGzizaNNAun0LCjtxbddlJQbTpjshbc' },
  { id: 'BIZ-PGL-019', name: 'Martabak Madura mama Aira', fileId: '1XRvAeEKNvrvXzOfsLxNlIqEY4CuuWjcV' },
  { id: 'BIZ-PGL-020', name: 'Martabak Pizza Orins Penggilingan', fileId: '19cKNx6HT4EVFMAgN3uG4nV8whSD6GB33' },
  { id: 'BIZ-PGL-023', name: 'Martabak Legit Group Penggilingan', fileId: '1dS-nKGFX5rHX2jxPczbQZtJ9n6Q0xH6D' },
  { id: 'BIZ-PGL-024', name: 'Nasi goreng Kosim Pik', fileId: '199abvmoeuPvBH77j1akWidZg0BbrUXhy' },
  { id: 'BIZ-PGL-025', name: 'Nasgor Gila 921 Keyla', fileId: '1A0u2Og8niex3kUCchHDZ-A5yNE3Il_Ah' },
  { id: 'BIZ-PGL-026', name: 'Gultik masbow penggilingan', fileId: '1Fl69l31xPBT_QoWfWEdQgyhXIEgqQdKX' }
];

function downloadImage(item) {
  return new Promise((resolve) => {
    const url = `https://lh3.googleusercontent.com/d/${item.fileId}=w800`;
    const destPath = path.join(outputDir, `${item.id}.jpg`);

    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          const stats = fs.statSync(destPath);
          console.log(`[OK] Downloaded ${item.id} (${item.name}): ${stats.size} bytes`);
          resolve({ id: item.id, path: `/images/businesses/${item.id}.jpg`, success: true });
        });
      } else {
        console.error(`[ERR] Status ${res.statusCode} for ${item.id}`);
        resolve({ id: item.id, success: false });
      }
    }).on('error', (err) => {
      console.error(`[ERR] ${err.message} for ${item.id}`);
      resolve({ id: item.id, success: false });
    });
  });
}

(async () => {
  console.log(`Starting download of ${driveImages.length} images...`);
  for (const img of driveImages) {
    await downloadImage(img);
  }
  console.log('Download complete!');
})();
