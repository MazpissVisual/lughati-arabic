// Seed data dummy untuk bank soal kuis (kuisSoal/{kategoriId}/soal/{soalId}) — 2 bab per jenis
// (huruf, suara, kosakata), diambil dari data statis src/data/hijaiyah.js & kosakata.js yang sudah ada.
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { hijaiyah } from '../src/data/hijaiyah.js';
import { kosakata } from '../src/data/kosakata.js';

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Usage: node scripts/seed-kuis-dummy.mjs <path-ke-service-account.json>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seedKategori(id, nama, jenis, urutan, soalList) {
  await db.collection('kuisSoal').doc(id).set({ nama, jenis, urutan });
  const batch = db.batch();
  soalList.forEach((s, idx) => {
    const ref = db.collection('kuisSoal').doc(id).collection('soal').doc();
    batch.set(ref, { ...s, urutan: idx });
  });
  await batch.commit();
  console.log(`${id} (${jenis}): "${nama}" — ${soalList.length} soal`);
}

const hurufSoal = (list) => list.map(h => ({ glyph: h.glyph, latin: h.latin, makhraj: h.makhraj, desc: h.desc }));
const kosakataSoal = (list) => list.map(w => ({ glyph: w.glyph, latin: w.latin, arti: w.arti, desc: w.contoh || '' }));

await seedKategori('huruf-bag-1', 'Huruf Bagian 1', 'huruf', 0, hurufSoal(hijaiyah.slice(0, 7)));
await seedKategori('huruf-bag-2', 'Huruf Bagian 2', 'huruf', 1, hurufSoal(hijaiyah.slice(7, 14)));

await seedKategori('suara-dasar-1', 'Suara Dasar 1', 'suara', 0, hurufSoal(hijaiyah.slice(14, 21)));
await seedKategori('suara-dasar-2', 'Suara Dasar 2', 'suara', 1, hurufSoal(hijaiyah.slice(21, 28)));

await seedKategori('kosakata-keluarga', 'Kosakata Keluarga', 'kosakata', 0, kosakataSoal(kosakata.filter(w => w.kategori === 'keluarga')));
await seedKategori('kosakata-angka', 'Kosakata Angka', 'kosakata', 1, kosakataSoal(kosakata.filter(w => w.kategori === 'angka')));

console.log('Selesai.');
process.exit(0);
