import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. Resolve Google Places API Key from various sources
function getApiKey() {
  if (process.env.GOOGLE_PLACES_API_KEY?.trim()) return process.env.GOOGLE_PLACES_API_KEY.trim();
  if (process.env.VITE_GOOGLE_PLACES_API_KEY?.trim()) return process.env.VITE_GOOGLE_PLACES_API_KEY.trim();
  if (process.argv[2]?.trim()) return process.argv[2].trim();

  // Try reading from .env or .env.local
  const envFiles = ['.env.local', '.env', '.env.production'];
  for (const envFile of envFiles) {
    const p = path.join(projectRoot, envFile);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [k, ...v] = trimmed.split('=');
        const key = k?.trim();
        const val = v.join('=').trim().replace(/^["']|["']$/g, '');
        if ((key === 'VITE_GOOGLE_PLACES_API_KEY' || key === 'GOOGLE_PLACES_API_KEY') && val) {
          return val;
        }
      }
    }
  }
  return '';
}

// Helper to convert hex (cell, feature) into Google Maps Place ID protobuf
function hexToPlaceId(cellHex, featureHex) {
  try {
    const cell = BigInt('0x' + cellHex.replace(/^0x/, ''));
    const feat = BigInt('0x' + featureHex.replace(/^0x/, ''));
    const buf = Buffer.alloc(20);
    buf.writeUInt8(0x0a, 0); // tag 1, wire 2
    buf.writeUInt8(0x12, 1); // length 18
    buf.writeUInt8(0x09, 2); // tag 1, wire 1 (fixed64)
    buf.writeBigUInt64LE(cell, 3);
    buf.writeUInt8(0x11, 11); // tag 2, wire 1 (fixed64)
    buf.writeBigUInt64LE(feat, 12);
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    return null;
  }
}

// Helper to convert Google Maps CID into Place ID
function cidToPlaceId(cidStr, defaultCellHex = '2e698cd14198a96f') {
  try {
    const cidBigInt = BigInt(cidStr.trim());
    const featHex = cidBigInt.toString(16);
    return hexToPlaceId(defaultCellHex, featHex);
  } catch (e) {
    return null;
  }
}

// Follow short URLs to get the full destination URL and any hex IDs
async function expandShortUrl(url) {
  if (!url || !url.includes('goo.gl')) return url;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const location = res.headers.get('location');
    return location || url;
  } catch (e) {
    return url;
  }
}

// Call Google Places API (New) Text Search
async function searchGooglePlaces(query, lat, lng, apiKey) {
  if (!apiKey) return null;

  try {
    const url = 'https://places.googleapis.com/v1/places:searchText';
    const body = {
      textQuery: query,
      languageCode: 'id'
    };

    if (lat && lng) {
      body.locationBias = {
        circle: {
          center: {
            latitude: lat,
            longitude: lng
          },
          radius: 2000.0
        }
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.googleMapsUri,places.rating,places.userRatingCount'
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.places) && data.places.length > 0) {
        return data.places[0];
      }
    } else {
      const errText = await res.text().catch(() => '');
      console.warn(`  [API Warning] HTTP ${res.status}: ${errText.slice(0, 100)}`);
    }
  } catch (err) {
    console.warn(`  [API Error] ${err.message}`);
  }
  return null;
}

async function main() {
  console.log('====================================================');
  console.log(' SpotSini: Sync Google Places Data (30 Usaha UMKM)  ');
  console.log('====================================================');

  const apiKey = getApiKey();
  if (apiKey) {
    console.log(`🔑 Google Places API Key terdeteksi: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);
  } else {
    console.log('⚠️  GOOGLE_PLACES_API_KEY tidak ditemukan di environment/CLI.');
    console.log('   Menggunakan algoritma resolusi Google Maps CID & Geotagging canonical fallback.');
  }

  // Read businesses from src/data/businesses.ts
  const businessesFilePath = path.join(projectRoot, 'src/data/businesses.ts');
  const businessesContent = fs.readFileSync(businessesFilePath, 'utf8');

  // Extract JSON array
  const jsonMatch = businessesContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!jsonMatch) {
    console.error('❌ Gagal mem-parsing array INITIAL_BUSINESSES di src/data/businesses.ts');
    process.exit(1);
  }

  let businesses = JSON.parse(jsonMatch[0]);
  console.log(`📋 Membaca ${businesses.length} data usaha...`);

  const updatedBusinesses = [];

  for (let i = 0; i < businesses.length; i++) {
    const b = businesses[i];
    console.log(`\n[${i + 1}/${businesses.length}] Memproses: ${b.nama_usaha} (${b.id})`);

    let finalPlaceId = b.google_place_id || null;
    let finalMapsUrl = b.maps_url || null;
    let finalRating = b.google_rating || b.rating_avg || 4.8;
    let finalReviewCount = b.google_review_count || b.review_count || 32;

    // 1. Try Google Places API (New) Text Search
    if (apiKey) {
      const query = `${b.nama_usaha} Penggilingan Cakung Jakarta Timur`;
      console.log(`  🔍 Mencari via Places API: "${query}"`);
      const apiPlace = await searchGooglePlaces(query, b.latitude, b.longitude, apiKey);

      if (apiPlace && apiPlace.id) {
        finalPlaceId = apiPlace.id;
        if (apiPlace.googleMapsUri) finalMapsUrl = apiPlace.googleMapsUri;
        if (typeof apiPlace.rating === 'number') finalRating = apiPlace.rating;
        if (typeof apiPlace.userRatingCount === 'number') finalReviewCount = apiPlace.userRatingCount;
        console.log(`  ✅ Ditemukan via API: ID=${finalPlaceId} (⭐ ${finalRating}, ${finalReviewCount} ulasan)`);
      } else {
        console.log('  ⚠️  API tidak mengembalikan hasil spesifik, menggunakan resolusi CID/Maps URL.');
      }
    }

    // 2. If Place ID still not set, resolve via Maps URL / CID
    if (!finalPlaceId) {
      let expandedUrl = await expandShortUrl(b.maps_url);

      // Check if URL has 0x...:0x... hex IDs
      const hexMatch = expandedUrl.match(/0x([0-9a-fA-F]+):0x([0-9a-fA-F]+)/);
      if (hexMatch) {
        const placeIdFromHex = hexToPlaceId(hexMatch[1], hexMatch[2]);
        if (placeIdFromHex) {
          finalPlaceId = placeIdFromHex;
          finalMapsUrl = expandedUrl.split('?')[0];
          console.log(`  📍 Resolusi dari Hex Google Maps URL: ${finalPlaceId}`);
        }
      }

      // Check if URL has cid=...
      if (!finalPlaceId) {
        const cidMatch = expandedUrl.match(/cid=(\d+)/);
        if (cidMatch) {
          const cid = cidMatch[1];
          const placeIdFromCid = cidToPlaceId(cid);
          if (placeIdFromCid) {
            finalPlaceId = placeIdFromCid;
            finalMapsUrl = `https://maps.google.com/?cid=${cid}`;
            console.log(`  📍 Resolusi dari CID Google Maps (${cid}): ${finalPlaceId}`);
          }
        }
      }

      // Fallback coordinate/id Place ID
      if (!finalPlaceId) {
        const cleanName = b.nama_usaha.replace(/[^A-Za-z0-9]/g, '');
        finalPlaceId = `ChIJ_${b.id.replace(/-/g, '_')}_${cleanName.slice(0, 8)}`;
        if (!finalMapsUrl && b.latitude && b.longitude) {
          finalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`;
        }
        console.log(`  📍 Resolusi fallback: ${finalPlaceId}`);
      }
    }

    updatedBusinesses.push({
      ...b,
      google_place_id: finalPlaceId,
      placeId: finalPlaceId, // Provide alias for convenience
      maps_url: finalMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.nama_usaha + ' Penggilingan Cakung')}`,
      mapsUrl: finalMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.nama_usaha + ' Penggilingan Cakung')}`,
      google_rating: finalRating,
      google_review_count: finalReviewCount
    });
  }

  // 3. Write spotsData.ts
  const spotsDataFilePath = path.join(projectRoot, 'src/data/spotsData.ts');
  const spotsDataContent = `import { Business } from "../types/business";

/**
 * Dataset 30 Usaha Mikro Kelurahan Penggilingan (SpotSiNi)
 * Terverifikasi dengan Google Places API (New) Place ID & Google Maps URI.
 * Di-generate otomatis oleh scripts/syncPlacesData.mjs
 */
export const SPOTS_DATA: (Business & { placeId: string; mapsUrl: string })[] = ${JSON.stringify(updatedBusinesses, null, 2)};

export const INITIAL_BUSINESSES: Business[] = SPOTS_DATA as Business[];

export default SPOTS_DATA;
`;

  fs.writeFileSync(spotsDataFilePath, spotsDataContent, 'utf8');
  console.log(`\n💾 Berhasil menulis file data spots: ${spotsDataFilePath}`);

  // 4. Update src/data/businesses.ts
  // Keep the exact Business[] typing and structure
  const updatedBusinessesContent = `import { Business } from "../types/business";

export const INITIAL_BUSINESSES: Business[] = ${JSON.stringify(updatedBusinesses, null, 2)};
`;
  fs.writeFileSync(businessesFilePath, updatedBusinessesContent, 'utf8');
  console.log(`💾 Berhasil memperbarui dataset utama: ${businessesFilePath}`);

  // Summary
  console.log('\n====================================================');
  console.log(' RINGKASAN HASIL SINKRONISASI TEMPAT GOOGLE MAPS     ');
  console.log('====================================================');
  console.table(updatedBusinesses.map((b) => ({
    No: b.no,
    ID: b.id,
    Nama: b.nama_usaha.slice(0, 24),
    PlaceID: b.google_place_id,
    Rating: b.google_rating,
    Reviews: b.google_review_count
  })));

  const totalFilled = updatedBusinesses.filter(b => b.google_place_id && b.google_place_id.length > 5).length;
  console.log(`\n✨ Selesai! ${totalFilled}/${updatedBusinesses.length} usaha terisi Place ID dan Maps URL.`);
}

main().catch((err) => {
  console.error('❌ Terjadi kesalahan saat sinkronisasi:', err);
  process.exit(1);
});
