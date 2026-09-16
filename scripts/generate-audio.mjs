// Generate audio pra-rekam (Google Cloud Text-to-Speech) untuk semua kata/soal/dialog yang
// BELUM punya `audioUrl` — aman dijalankan berkali-kali (idempotent), cuma proses yang baru.
// Usage: node scripts/generate-audio.mjs <path-ke-service-account.json> <google-tts-api-key>
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const [keyPath, ttsApiKey] = process.argv.slice(2);
if (!keyPath || !ttsApiKey) {
  console.error('Usage: node scripts/generate-audio.mjs <path-ke-service-account.json> <google-tts-api-key>');
  process.exit(1);
}

const env = Object.fromEntries(readFileSync('.env', 'utf8').trim().split('\n').map(l => l.split('=')));
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount), storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET });
const db = getFirestore();
const bucket = getStorage().bucket();

// ar-XA-Wavenet-C: suara pria, salah satu suara Neural/WaveNet Arab yang paling natural di Google TTS.
const VOICE = { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-C' };

let generated = 0;
let skipped = 0;
let failed = 0;

async function synthesize(text) {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${ttsApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: VOICE,
      audioConfig: { audioEncoding: 'MP3', speakingRate: 0.92 }
    })
  });
  const data = await res.json();
  if (!data.audioContent) throw new Error(data.error?.message || 'Respons TTS tidak berisi audio.');
  return Buffer.from(data.audioContent, 'base64');
}

async function uploadAndGetUrl(path, buffer) {
  const file = bucket.file(path);
  await file.save(buffer, { metadata: { contentType: 'audio/mpeg' } });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

async function processSimpleDoc(ref, data, text, storagePath) {
  if (data.audioUrl) { skipped++; return; }
  try {
    const buffer = await synthesize(text);
    const url = await uploadAndGetUrl(storagePath, buffer);
    await ref.update({ audioUrl: url });
    generated++;
    console.log(`OK    ${storagePath}`);
  } catch (err) {
    failed++;
    console.log(`GAGAL ${storagePath} — ${err.message}`);
  }
}

// --- Mufrodat: kata di setiap kategori ---
const mufrodatSnap = await db.collection('mufrodat').get();
for (const kategoriDoc of mufrodatSnap.docs) {
  const kataSnap = await db.collection('mufrodat').doc(kategoriDoc.id).collection('kata').get();
  for (const kataDoc of kataSnap.docs) {
    const d = kataDoc.data();
    await processSimpleDoc(kataDoc.ref, d, d.glyph, `audio/mufrodat/${kategoriDoc.id}/${kataDoc.id}.mp3`);
  }
}

// --- Kuis: soal di setiap bab ---
const kuisSnap = await db.collection('kuisSoal').get();
for (const kategoriDoc of kuisSnap.docs) {
  const soalSnap = await db.collection('kuisSoal').doc(kategoriDoc.id).collection('soal').get();
  for (const soalDoc of soalSnap.docs) {
    const d = soalDoc.data();
    await processSimpleDoc(soalDoc.ref, d, d.glyph, `audio/kuisSoal/${kategoriDoc.id}/${soalDoc.id}.mp3`);
  }
}

// --- Muhadatsah: tiap baris dialog (field array, jadi ditulis ulang sekaligus per topik) ---
const muhadatsahSnap = await db.collection('muhadatsah').get();
for (const topikDoc of muhadatsahSnap.docs) {
  const data = topikDoc.data();
  const dialog = data.dialog || [];
  let changed = false;

  for (let i = 0; i < dialog.length; i++) {
    if (dialog[i].audioUrl) { skipped++; continue; }
    const path = `audio/muhadatsah/${topikDoc.id}/${i}.mp3`;
    try {
      const buffer = await synthesize(dialog[i].arabic);
      const url = await uploadAndGetUrl(path, buffer);
      dialog[i] = { ...dialog[i], audioUrl: url };
      changed = true;
      generated++;
      console.log(`OK    ${path}`);
    } catch (err) {
      failed++;
      console.log(`GAGAL ${path} — ${err.message}`);
    }
  }

  if (changed) await topikDoc.ref.update({ dialog });
}

console.log(`\nSelesai. ${generated} audio baru dibuat, ${skipped} dilewati (sudah ada), ${failed} gagal.`);
process.exit(0);
