const https = require('https');
const fs = require('fs');
const path = require('path');

const outputDir = path.resolve('public/images/businesses');

const additionalBusinesses = [
  {
    id: 'BIZ-PGL-021',
    name: 'Kebab Turki Baba Rafi',
    url: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'BIZ-PGL-022',
    name: 'Warung Kopi & Gorengan Bapak Enjang',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'BIZ-PGL-027',
    name: 'SATE AYAM BANG UDIN',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'BIZ-PGL-028',
    name: 'Sate Ayam Madura',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'BIZ-PGL-029',
    name: 'Kebab Turki Syahla',
    url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'BIZ-PGL-030',
    name: 'Gorengan Sahara',
    url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'BIZ-PGL-101',
    name: 'Konveksi Ibu Ratu',
    url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'BIZ-PGL-102',
    name: 'Warung Sembako Barokah',
    url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'BIZ-PGL-103',
    name: 'Bengkel Orla Motor',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80'
  }
];

function download(item) {
  return new Promise((resolve) => {
    const dest = path.join(outputDir, `${item.id}.jpg`);
    https.get(item.url, (res) => {
      if (res.statusCode === 200) {
        const f = fs.createWriteStream(dest);
        res.pipe(f);
        f.on('finish', () => {
          f.close();
          console.log(`[OK] Downloaded ${item.id} (${item.name})`);
          resolve(true);
        });
      } else {
        console.error(`[ERR] Status ${res.statusCode} for ${item.id}`);
        resolve(false);
      }
    }).on('error', err => {
      console.error(`[ERR] ${err.message} for ${item.id}`);
      resolve(false);
    });
  });
}

(async () => {
  for (const item of additionalBusinesses) {
    await download(item);
  }
  console.log('All 30 businesses now have real photos downloaded!');
})();
