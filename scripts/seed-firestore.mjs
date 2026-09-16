// Migrasi satu-kali: src/data/*.js (statis) -> Firestore.
// Jalankan: node scripts/seed-firestore.mjs <path-ke-service-account.json>
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { kategori, kosakata } from '../src/data/kosakata.js';
import { topikMuhadatsah } from '../src/data/muhadatsah.js';
import { hijaiyah } from '../src/data/hijaiyah.js';

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Usage: node scripts/seed-firestore.mjs <path-ke-service-account.json>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function seedMufrodat() {
  const batch = db.batch();
  for (const kat of kategori) {
    if (kat.id === 'semua') continue; // filter UI, bukan kategori konten sungguhan
    const { id, ...fields } = kat;
    batch.set(db.collection('mufrodat').doc(id), fields);
  }
  for (const kata of kosakata) {
    const { id, kategori: kategoriId, ...fields } = kata;
    batch.set(
      db.collection('mufrodat').doc(kategoriId).collection('kata').doc(String(id)),
      fields
    );
  }
  await batch.commit();
  console.log(`mufrodat: ${kategori.length - 1} kategori, ${kosakata.length} kata`);
}

async function seedMuhadatsah() {
  const batch = db.batch();
  for (const topik of topikMuhadatsah) {
    const { id, ...fields } = topik;
    batch.set(db.collection('muhadatsah').doc(id), fields);
  }
  await batch.commit();
  console.log(`muhadatsah: ${topikMuhadatsah.length} topik`);
}

async function seedHijaiyah() {
  const batch = db.batch();
  for (const huruf of hijaiyah) {
    const { id, ...fields } = huruf;
    batch.set(db.collection('hijaiyah').doc(String(id)), fields);
  }
  await batch.commit();
  console.log(`hijaiyah: ${hijaiyah.length} huruf`);
}

await seedMufrodat();
await seedMuhadatsah();
await seedHijaiyah();
console.log('Selesai.');
process.exit(0);
