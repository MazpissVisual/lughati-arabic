// Seed data dummy SEDERHANA untuk semua jenis konten (mufrodat, muhadatsah, materi, kuis x5 jenis)
// di ketiga tingkat (X/XI/XII) — dipakai untuk uji coba fitur setelah menambahkan kelas bertingkat.
//
// Tidak pakai firebase-admin (tidak ada service-account key di repo ini). Sebagai gantinya, script
// ini daftar akun guru "throwaway" lewat Firebase Auth client SDK (sama seperti alur signup guru
// biasa di app), lalu menulis lewat SDK yang sama — otomatis lolos Firestore rules (guru boleh nulis).
//
// Jalankan: node scripts/seed-fake-content.mjs
import { readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, writeBatch } from 'firebase/firestore';

// .env pakai format VITE_FIREBASE_*=... — baca manual (bukan import.meta.env, ini konteks Node biasa).
const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  })
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
});
const auth = getAuth(app);
const db = getFirestore(app);

const SEED_EMAIL = 'seed-script@lughati.local';
const SEED_PASSWORD = 'SeedScript123!';

async function ensureSeedGuru() {
  try {
    const cred = await signInWithEmailAndPassword(auth, SEED_EMAIL, SEED_PASSWORD);
    return cred.user;
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, SEED_EMAIL, SEED_PASSWORD);
    await setDoc(doc(db, 'guru', cred.user.uid), { nama: 'Seed Script (boleh dihapus)', email: SEED_EMAIL });
    return cred.user;
  }
}

async function seedMufrodat(tingkat) {
  const id = `seed-mufrodat-${tingkat.toLowerCase()}`;
  await setDoc(doc(db, 'mufrodat', id), {
    label: 'Anggota Keluarga', bab: 1, tingkat,
    arabicTitle: 'أفراد العائلة', subtitle: 'Afrad al-Usrah',
    desc: 'Kosakata dasar seputar anggota keluarga.', icon: 'users', theme: 'indigo'
  });
  const kata = [
    { glyph: 'أَب', latin: 'Ab', arti: 'Ayah' },
    { glyph: 'أُم', latin: 'Umm', arti: 'Ibu' },
    { glyph: 'أَخ', latin: 'Akh', arti: 'Saudara laki-laki' }
  ];
  const batch = writeBatch(db);
  kata.forEach((k, idx) => batch.set(doc(collection(db, 'mufrodat', id, 'kata')), { ...k, urutan: idx }));
  await batch.commit();
}

async function seedMuhadatsah(tingkat) {
  const id = `seed-muhadatsah-${tingkat.toLowerCase()}`;
  await setDoc(doc(db, 'muhadatsah', id), {
    title: 'Perkenalan Diri', arabicTitle: 'التعارف', level: 'Dasar', tingkat,
    unit: 'Unit 1: Perkenalan', icon: 'message', desc: 'Percakapan sederhana saat berkenalan.',
    dialog: [
      { speaker: 'Ali', side: 'left', arabic: 'السَّلَامُ عَلَيْكُمْ', translation: 'Assalamualaikum' },
      { speaker: 'Umar', side: 'right', arabic: 'وَعَلَيْكُمُ السَّلَامُ', translation: 'Waalaikumsalam' },
      { speaker: 'Ali', side: 'left', arabic: 'مَا اسْمُكَ؟', translation: 'Siapa namamu?' },
      { speaker: 'Umar', side: 'right', arabic: 'اسْمِي عُمَر', translation: 'Namaku Umar' }
    ]
  });
}

async function seedMateri(tingkat) {
  const id = `seed-materi-${tingkat.toLowerCase()}`;
  await setDoc(doc(db, 'materi', id), { judul: `Pengantar Bahasa Arab — Kelas ${tingkat}`, tingkat, urutan: 0 });
  const blok = [
    { tipe: 'text', isi: 'Bahasa Arab adalah bahasa Al-Qur\'an dan salah satu bahasa tertua di dunia. Materi ini membahas dasar-dasar mufrodat dan tata bahasa.' },
    { tipe: 'tabel', rows: [['Huruf', 'Nama', 'Contoh'], ['ا', 'Alif', 'أَب'], ['ب', 'Ba', 'بَيْت'], ['ت', 'Ta', 'تَمْر']].map(cells => ({ cells })) },
    { tipe: 'gambar', url: 'https://placehold.co/600x300?text=Ilustrasi+Materi', caption: 'Ilustrasi contoh (placeholder).' }
  ];
  const batch = writeBatch(db);
  blok.forEach((b, idx) => batch.set(doc(collection(db, 'materi', id, 'blok')), { ...b, urutan: idx }));
  await batch.commit();
}

async function seedKuisPilihanGanda(tingkat, jenis, id, nama, soalList) {
  await setDoc(doc(db, 'kuisSoal', id), { nama, jenis, tingkat, urutan: 0 });
  const batch = writeBatch(db);
  soalList.forEach((s, idx) => batch.set(doc(collection(db, 'kuisSoal', id, 'soal')), { ...s, urutan: idx }));
  await batch.commit();
}

async function seedKuisHuruf(tingkat) {
  await seedKuisPilihanGanda(tingkat, 'huruf', `seed-kuis-huruf-${tingkat.toLowerCase()}`, 'Huruf Dasar', [
    { glyph: 'ا', latin: 'Alif', makhraj: 'Tenggorokan bawah', desc: 'Huruf pertama hijaiyah.' },
    { glyph: 'ب', latin: 'Ba', makhraj: 'Dua bibir', desc: 'Huruf kedua hijaiyah.' },
    { glyph: 'ت', latin: 'Ta', makhraj: 'Ujung lidah', desc: 'Huruf ketiga hijaiyah.' }
  ]);
}

async function seedKuisSuara(tingkat) {
  await seedKuisPilihanGanda(tingkat, 'suara', `seed-kuis-suara-${tingkat.toLowerCase()}`, 'Listening Dasar', [
    { glyph: 'ث', latin: 'Tsa', makhraj: 'Ujung lidah & gigi', desc: 'Dengarkan dan pilih huruf yang sesuai.' },
    { glyph: 'ج', latin: 'Jim', makhraj: 'Tengah lidah', desc: 'Dengarkan dan pilih huruf yang sesuai.' },
    { glyph: 'ح', latin: 'Ha', makhraj: 'Tengah tenggorokan', desc: 'Dengarkan dan pilih huruf yang sesuai.' }
  ]);
}

async function seedKuisKosakata(tingkat) {
  await seedKuisPilihanGanda(tingkat, 'kosakata', `seed-kuis-kosakata-${tingkat.toLowerCase()}`, 'Kosakata Keluarga', [
    { glyph: 'أَب', latin: 'Ab', arti: 'Ayah', desc: 'هَذَا أَبِي (Ini ayahku)' },
    { glyph: 'أُم', latin: 'Umm', arti: 'Ibu', desc: 'هَذِهِ أُمِّي (Ini ibuku)' },
    { glyph: 'أَخ', latin: 'Akh', arti: 'Saudara laki-laki', desc: 'هَذَا أَخِي (Ini saudaraku)' }
  ]);
}

async function seedKuisSusun(tingkat) {
  const id = `seed-kuis-susun-${tingkat.toLowerCase()}`;
  await setDoc(doc(db, 'kuisSoal', id), { nama: 'Penyusunan Kalimat Dasar', jenis: 'susun', tingkat, urutan: 0 });
  const soal = [
    { kalimat: 'هَذَا كِتَابٌ جَدِيدٌ', arti: 'Ini buku baru' },
    { kalimat: 'أَنَا أَذْهَبُ إِلَى الْمَسْجِدِ', arti: 'Saya pergi ke masjid' },
    { kalimat: 'الْبَيْتُ كَبِيرٌ وَجَمِيلٌ', arti: 'Rumah itu besar dan indah' }
  ];
  const batch = writeBatch(db);
  soal.forEach((s, idx) => batch.set(doc(collection(db, 'kuisSoal', id, 'soal')), { ...s, urutan: idx }));
  await batch.commit();
}

async function seedKuisTts(tingkat) {
  const id = `seed-kuis-tts-${tingkat.toLowerCase()}`;
  await setDoc(doc(db, 'kuisSoal', id), { nama: 'TTS Kosakata Dasar', jenis: 'tts', tingkat, urutan: 0 });
  const soal = [
    { jawaban: 'KITAB', petunjuk: 'Buku' },
    { jawaban: 'BAB', petunjuk: 'Pintu' },
    { jawaban: 'MASJID', petunjuk: 'Tempat sholat' },
    { jawaban: 'AIR', petunjuk: 'Maa (terjemahan)' }
  ];
  const batch = writeBatch(db);
  soal.forEach((s, idx) => batch.set(doc(collection(db, 'kuisSoal', id, 'soal')), { ...s, urutan: idx }));
  await batch.commit();
}

await ensureSeedGuru();
console.log('Login guru seed berhasil, mulai menulis data...');

for (const tingkat of ['X', 'XI', 'XII']) {
  await seedMufrodat(tingkat);
  await seedMuhadatsah(tingkat);
  await seedMateri(tingkat);
  await seedKuisHuruf(tingkat);
  await seedKuisSuara(tingkat);
  await seedKuisKosakata(tingkat);
  await seedKuisSusun(tingkat);
  await seedKuisTts(tingkat);
  console.log(`Kelas ${tingkat}: selesai (mufrodat, muhadatsah, materi, 5 jenis kuis).`);
}

console.log('Selesai semua.');
process.exit(0);
