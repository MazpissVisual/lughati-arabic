// Lapisan data konten: dulunya src/data/kosakata.js & muhadatsah.js (statis),
// sekarang dibaca dari Firestore supaya konten yang ditambah guru lewat CMS langsung muncul.
// Pola cache sama seperti progress.js: load sekali (async), lalu getter dipakai sinkron oleh semua view.
import {
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import { db } from './firebase.js';

let kategoriCache = [];
let kosakataCache = [];
let topikMuhadatsahCache = [];
let kuisKategoriCache = []; // [{id, jenis, nama, urutan, tingkat}] — jenis: 'huruf' | 'suara' | 'kosakata' | 'susun' | 'tts'
let kuisSoalCache = []; // [{id, kategoriId, glyph, latin, arti, makhraj, desc, urutan}]
let materiKategoriCache = []; // [{id, judul, tingkat, urutan}]
let materiBlokCache = []; // [{id, kategoriId, tipe, urutan, ...}]
let loaded = false;

export async function loadContent() {
  const mufrodatSnap = await getDocs(collection(db, 'mufrodat'));

  const kategoriList = [];
  const kataList = [];
  await Promise.all(mufrodatSnap.docs.map(async (kategoriDoc) => {
    kategoriList.push({ id: kategoriDoc.id, ...kategoriDoc.data() });
    const kataSnap = await getDocs(collection(db, 'mufrodat', kategoriDoc.id, 'kata'));
    // `urutan` default ke posisi query kalau dokumen lama belum punya field ini (belum pernah di-drag).
    kataSnap.docs.forEach((kataDoc, idx) => {
      kataList.push({ id: kataDoc.id, kategori: kategoriDoc.id, urutan: idx, ...kataDoc.data() });
    });
  }));
  kategoriList.sort((a, b) => (a.bab || 0) - (b.bab || 0));
  kataList.sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
  kategoriCache = kategoriList;
  kosakataCache = kataList;

  const muhadatsahSnap = await getDocs(collection(db, 'muhadatsah'));
  const topikList = muhadatsahSnap.docs.map((d, idx) => ({ id: d.id, urutan: idx, ...d.data() }));
  topikList.sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
  topikMuhadatsahCache = topikList;

  const kuisSoalSnap = await getDocs(collection(db, 'kuisSoal'));
  const kuisKategoriList = [];
  const kuisSoalList = [];
  await Promise.all(kuisSoalSnap.docs.map(async (kategoriDoc) => {
    kuisKategoriList.push({ id: kategoriDoc.id, ...kategoriDoc.data() });
    const soalSnap = await getDocs(collection(db, 'kuisSoal', kategoriDoc.id, 'soal'));
    soalSnap.docs.forEach((soalDoc, idx) => {
      kuisSoalList.push({ id: soalDoc.id, kategoriId: kategoriDoc.id, urutan: idx, ...soalDoc.data() });
    });
  }));
  kuisKategoriList.sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
  kuisSoalList.sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
  kuisKategoriCache = kuisKategoriList;
  kuisSoalCache = kuisSoalList;

  const materiSnap = await getDocs(collection(db, 'materi'));
  const materiKategoriList = [];
  const materiBlokList = [];
  await Promise.all(materiSnap.docs.map(async (kategoriDoc) => {
    materiKategoriList.push({ id: kategoriDoc.id, ...kategoriDoc.data() });
    const blokSnap = await getDocs(collection(db, 'materi', kategoriDoc.id, 'blok'));
    blokSnap.docs.forEach((blokDoc, idx) => {
      materiBlokList.push({ id: blokDoc.id, kategoriId: kategoriDoc.id, urutan: idx, ...blokDoc.data() });
    });
  }));
  materiKategoriList.sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
  materiBlokList.sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
  materiKategoriCache = materiKategoriList;
  materiBlokCache = materiBlokList;

  loaded = true;
}

export function getKategori(tingkat) {
  return tingkat ? kategoriCache.filter(k => k.tingkat === tingkat) : kategoriCache;
}

export function getKosakata() {
  return kosakataCache;
}

export function getTopikMuhadatsah(tingkat) {
  return tingkat ? topikMuhadatsahCache.filter(t => t.tingkat === tingkat) : topikMuhadatsahCache;
}

export function isContentLoaded() {
  return loaded;
}

export function getKuisKategori(jenis, tingkat) {
  let list = jenis ? kuisKategoriCache.filter(k => k.jenis === jenis) : kuisKategoriCache;
  if (tingkat) list = list.filter(k => k.tingkat === tingkat);
  return list;
}

export function getMateriKategori(tingkat) {
  return tingkat ? materiKategoriCache.filter(k => k.tingkat === tingkat) : materiKategoriCache;
}

export function getMateriBlok(kategoriId) {
  return materiBlokCache.filter(b => b.kategoriId === kategoriId);
}

// Migrasi satu-kali untuk konten yang dibuat sebelum fitur tingkat kelas ada (belum punya field
// `tingkat` sama sekali) — kelompokkan semuanya ke satu tingkat yang dipilih guru lewat tombol CMS,
// supaya tidak "hilang" dari filter Kelas X/XI/XII manapun. Item yang SUDAH punya tingkat dilewati.
export function countMissingTingkat() {
  return {
    mufrodat: kategoriCache.filter(k => !k.tingkat).length,
    muhadatsah: topikMuhadatsahCache.filter(t => !t.tingkat).length,
    kuis: kuisKategoriCache.filter(k => !k.tingkat).length,
    materi: materiKategoriCache.filter(k => !k.tingkat).length
  };
}

export async function migrateMissingTingkat(tingkat) {
  const batch = writeBatch(db);
  let count = 0;
  kategoriCache.filter(k => !k.tingkat).forEach(k => { batch.update(doc(db, 'mufrodat', k.id), { tingkat }); count++; });
  topikMuhadatsahCache.filter(t => !t.tingkat).forEach(t => { batch.update(doc(db, 'muhadatsah', t.id), { tingkat }); count++; });
  kuisKategoriCache.filter(k => !k.tingkat).forEach(k => { batch.update(doc(db, 'kuisSoal', k.id), { tingkat }); count++; });
  materiKategoriCache.filter(k => !k.tingkat).forEach(k => { batch.update(doc(db, 'materi', k.id), { tingkat }); count++; });
  if (count > 0) await batch.commit();
  await loadContent();
  return count;
}

export function getKuisSoal(kategoriId) {
  return kuisSoalCache.filter(s => s.kategoriId === kategoriId);
}

// --- CMS: tulis ke Firestore lalu refresh cache ---

export async function saveKategori(kategoriId, fields) {
  await setDoc(doc(db, 'mufrodat', kategoriId), fields);
  await loadContent();
}

export async function deleteKategori(kategoriId) {
  const kataSnap = await getDocs(collection(db, 'mufrodat', kategoriId, 'kata'));
  await Promise.all(kataSnap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'mufrodat', kategoriId));
  await loadContent();
}

// Gambar ilustrasi kata di-upload ke ImgBB (bukan Firebase Storage) karena Firebase Storage
// di project ini butuh upgrade plan Blaze (kartu billing) yang terganjal — lihat ROADMAP.md.
// ImgBB gratis, tanpa kartu, cukup 1 API key publik dari https://api.imgbb.com/.
export async function uploadKataGambar(kategoriId, kataId, file) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error('VITE_IMGBB_API_KEY belum diisi di .env — daftar gratis di api.imgbb.com untuk dapat API key.');

  const body = new FormData();
  body.append('image', file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: 'POST', body });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message || 'Gagal upload gambar ke ImgBB.');
  return data.data.url;
}

export async function saveKata(kategoriId, kataId, fields) {
  const ref = kataId
    ? doc(db, 'mufrodat', kategoriId, 'kata', kataId)
    : doc(collection(db, 'mufrodat', kategoriId, 'kata'));
  // Item baru wajib dapat `urutan` eksplisit (append di akhir) — kalau tidak, item ini akan
  // fallback ke urutan berbasis posisi query Firestore (lihat loadContent), yang bisa TABRAKAN
  // dengan urutan eksplisit item lain (mis. keduanya "0"), bikin urutan akhir acak/salah setelah sort.
  if (!kataId) fields.urutan = getKosakata().filter(w => w.kategori === kategoriId).length;
  await setDoc(ref, fields);
  await loadContent();
}

export async function deleteKata(kategoriId, kataId) {
  await deleteDoc(doc(db, 'mufrodat', kategoriId, 'kata', kataId));
  await loadContent();
}

export async function saveTopikMuhadatsah(topikId, fields) {
  await setDoc(doc(db, 'muhadatsah', topikId), fields);
  await loadContent();
}

export async function deleteTopikMuhadatsah(topikId) {
  await deleteDoc(doc(db, 'muhadatsah', topikId));
  await loadContent();
}

export async function reorderTopikMuhadatsah(orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'muhadatsah', id), { urutan: idx });
  });
  await batch.commit();
  await loadContent();
}

// Drag-and-drop reorder: tulis ulang field urutan (bab / urutan) untuk semua item sekaligus lewat batch write.
export async function reorderKategori(orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'mufrodat', id), { bab: idx + 1 });
  });
  await batch.commit();
  await loadContent();
}

export async function reorderKata(kategoriId, orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'mufrodat', kategoriId, 'kata', id), { urutan: idx });
  });
  await batch.commit();
  await loadContent();
}

// --- CMS: Bank Soal Kuis (kuisSoal/{kategoriId} + subkoleksi soal/{soalId}) ---

export async function saveKuisKategori(kategoriId, fields) {
  const ref = kategoriId ? doc(db, 'kuisSoal', kategoriId) : doc(collection(db, 'kuisSoal'));
  if (!kategoriId) fields.urutan = getKuisKategori(fields.jenis).length;
  await setDoc(ref, fields, { merge: true });
  await loadContent();
}

export async function deleteKuisKategori(kategoriId) {
  const soalSnap = await getDocs(collection(db, 'kuisSoal', kategoriId, 'soal'));
  await Promise.all(soalSnap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'kuisSoal', kategoriId));
  await loadContent();
}

export async function saveKuisSoalItem(kategoriId, soalId, fields) {
  const ref = soalId
    ? doc(db, 'kuisSoal', kategoriId, 'soal', soalId)
    : doc(collection(db, 'kuisSoal', kategoriId, 'soal'));
  if (!soalId) fields.urutan = getKuisSoal(kategoriId).length;
  await setDoc(ref, fields);
  await loadContent();
}

export async function deleteKuisSoalItem(kategoriId, soalId) {
  await deleteDoc(doc(db, 'kuisSoal', kategoriId, 'soal', soalId));
  await loadContent();
}

export async function reorderKuisKategori(jenis, orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'kuisSoal', id), { urutan: idx });
  });
  await batch.commit();
  await loadContent();
}

export async function reorderKuisSoalItems(kategoriId, orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'kuisSoal', kategoriId, 'soal', id), { urutan: idx });
  });
  await batch.commit();
  await loadContent();
}

// --- CMS: Materi Interaktif (materi/{kategoriId} + subkoleksi blok/{blokId}) ---

export async function saveMateriKategori(kategoriId, fields) {
  const ref = kategoriId ? doc(db, 'materi', kategoriId) : doc(collection(db, 'materi'));
  if (!kategoriId) fields.urutan = getMateriKategori(fields.tingkat).length;
  await setDoc(ref, fields, { merge: true });
  await loadContent();
}

export async function deleteMateriKategori(kategoriId) {
  const blokSnap = await getDocs(collection(db, 'materi', kategoriId, 'blok'));
  await Promise.all(blokSnap.docs.map(d => deleteDoc(d.ref)));
  await deleteDoc(doc(db, 'materi', kategoriId));
  await loadContent();
}

export async function saveMateriBlok(kategoriId, blokId, fields) {
  const ref = blokId
    ? doc(db, 'materi', kategoriId, 'blok', blokId)
    : doc(collection(db, 'materi', kategoriId, 'blok'));
  if (!blokId) fields.urutan = getMateriBlok(kategoriId).length;
  await setDoc(ref, fields);
  await loadContent();
}

export async function deleteMateriBlok(kategoriId, blokId) {
  await deleteDoc(doc(db, 'materi', kategoriId, 'blok', blokId));
  await loadContent();
}

export async function reorderMateriKategori(orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'materi', id), { urutan: idx });
  });
  await batch.commit();
  await loadContent();
}

export async function reorderMateriBlok(kategoriId, orderedIds) {
  const batch = writeBatch(db);
  orderedIds.forEach((id, idx) => {
    batch.update(doc(db, 'materi', kategoriId, 'blok', id), { urutan: idx });
  });
  await batch.commit();
  await loadContent();
}
