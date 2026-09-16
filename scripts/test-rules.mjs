// Uji Firestore Security Rules pakai emulator lokal (tidak menyentuh project asli).
// Jalankan lewat: firebase emulators:exec --only firestore "node scripts/test-rules.mjs"
import { readFileSync } from 'fs';
import assert from 'assert';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';

const testEnv = await initializeTestEnvironment({
  projectId: 'arabic-mam-test',
  firestore: { rules: readFileSync('firestore.rules', 'utf8') }
});

let passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
}

// Seed data awal (bypass rules pakai security-rules-disabled context).
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await db.collection('kelas').doc('kelasA').set({ nama: 'Kelas A', guruId: 'guru1' });
  await db.collection('kelas').doc('kelasB').set({ nama: 'Kelas B', guruId: 'guru2' });
  await db.collection('guru').doc('guru1').set({ nama: 'Pak Guru 1' });
  await db.collection('guru').doc('guru2').set({ nama: 'Pak Guru 2' });
  await db.collection('murid').doc('murid1').set({ nama: 'Murid 1', kelasId: 'kelasA' });
  await db.collection('progresMurid').doc('murid1').set({ xp: 100 });
  await db.collection('mufrodat').doc('keluarga').set({ label: 'Keluarga' });
});

try {
  // 1. Konten: user login boleh baca, user anonim tidak boleh.
  await check('konten ditolak untuk user belum login', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.collection('mufrodat').doc('keluarga').get());
  });

  await check('konten boleh dibaca user yang sudah login (murid biasa)', async () => {
    const db = testEnv.authenticatedContext('murid1').firestore();
    await assertSucceeds(db.collection('mufrodat').doc('keluarga').get());
  });

  await check('konten tidak boleh ditulis murid biasa', async () => {
    const db = testEnv.authenticatedContext('murid1').firestore();
    await assertFails(db.collection('mufrodat').doc('baru').set({ label: 'x' }));
  });

  await check('konten boleh ditulis oleh guru', async () => {
    const db = testEnv.authenticatedContext('guru1').firestore();
    await assertSucceeds(db.collection('mufrodat').doc('baru').set({ label: 'x' }));
  });

  // 2. Progres murid: hanya pemilik yang boleh baca/tulis datanya sendiri.
  await check('murid boleh baca progres miliknya sendiri', async () => {
    const db = testEnv.authenticatedContext('murid1').firestore();
    await assertSucceeds(db.collection('progresMurid').doc('murid1').get());
  });

  await check('murid lain TIDAK boleh baca progres murid1', async () => {
    const db = testEnv.authenticatedContext('murid2').firestore();
    await assertFails(db.collection('progresMurid').doc('murid1').get());
  });

  await check('murid TIDAK boleh menulis progres murid lain', async () => {
    const db = testEnv.authenticatedContext('murid2').firestore();
    await assertFails(db.collection('progresMurid').doc('murid1').set({ xp: 999 }));
  });

  // 3. Guru hanya boleh melihat murid di kelas yang dia ajar (guru1 -> kelasA -> murid1).
  await check('guru pemilik kelas boleh baca progres muridnya', async () => {
    const db = testEnv.authenticatedContext('guru1').firestore();
    await assertSucceeds(db.collection('progresMurid').doc('murid1').get());
  });

  await check('guru DARI KELAS LAIN tidak boleh baca progres murid1', async () => {
    const db = testEnv.authenticatedContext('guru2').firestore();
    await assertFails(db.collection('progresMurid').doc('murid1').get());
  });

  console.log(`\n${passed} skenario lulus.`);
} finally {
  await testEnv.cleanup();
}
