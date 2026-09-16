// Catatan guru untuk fitur Rapor — 3 level terpisah (bukan 1 array tercampur):
// - catatanKelas: broadcast ke SEMUA murid di satu kelas.
// - catatanMurid: khusus 1 murid tertentu (bukan attempt spesifik).
// - catatanPengerjaan: nempel ke 1 baris riwayat kuis (attempt) spesifik.
// Dipisah collection (bukan ditumpuk field di progresMurid) supaya guru bisa nulis catatan tanpa
// butuh akses tulis ke dokumen progres murid sama sekali — lebih aman & rules-nya lebih sederhana.
import {
  collection, doc, getDocsFromServer, setDoc, deleteDoc, writeBatch, query, where
} from 'firebase/firestore';
import { db } from './firebase.js';

// Pakai getDocsFromServer (bukan getDocs biasa) — Firestore Web SDK kadang nge-cache hasil
// query KOSONG ("negative cache") untuk collection yang baru pertama kali ada isinya, dan cache
// itu tidak selalu ter-invalidate langsung begitu dokumen pertama ditulis dari client yang sama.
// Simtomnya persis: guru simpan catatan → murid (sesi/tab lain) langsung lihat, tapi guru sendiri
// baca ulang di tab yang sama malah masih dapat hasil kosong. Baca langsung dari server hindarin itu.
const getDocs = getDocsFromServer;

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// --- Catatan Kelas (broadcast) ---

export async function getCatatanKelas(kelasId) {
  const snap = await getDocs(query(collection(db, 'catatanKelas'), where('kelasId', '==', kelasId)));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return rows;
}

export async function saveCatatanKelas(kelasId, guruId, text) {
  const id = newId();
  await setDoc(doc(db, 'catatanKelas', id), { kelasId, guruId, text, createdAt: new Date().toISOString() });
  return id;
}

export async function updateCatatanKelas(noteId, text) {
  await setDoc(doc(db, 'catatanKelas', noteId), { text, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteCatatanKelas(noteId) {
  await deleteDoc(doc(db, 'catatanKelas', noteId));
}

// --- Catatan Murid (individual, bukan per-attempt) ---

// `kelasId` OPSIONAL tapi PENTING kalau dipanggil dari sisi GURU: rules baca dokumen ini butuh
// get() ke `kelas/{kelasId}` (lihat isGuruOfKelas di firestore.rules) — dan Firestore MEWAJIBKAN
// query yang rule-nya bergantung pada get() atas field X untuk ikut MEMFILTER field X itu juga di
// query-nya sendiri, supaya Firestore bisa memvalidasi rule tanpa harus menjalankan query dulu.
// Query yang cuma filter `muridUid` (field lain dari yang dicek get()) langsung DITOLAK dengan
// "Missing or insufficient permissions" walau datanya sendiri sebenarnya valid dan bisa dibaca
// satu-satu (`getDoc` per dokumen tidak kena batasan ini, cuma `list`/query yang kena). Murid baca
// catatannya sendiri lewat `isOwner` (tidak butuh get()), jadi mereka aman tanpa `kelasId` ini.
export async function getCatatanMurid(muridUid, kelasId = null) {
  const filters = [where('muridUid', '==', muridUid)];
  if (kelasId) filters.push(where('kelasId', '==', kelasId));
  const snap = await getDocs(query(collection(db, 'catatanMurid'), ...filters));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return rows;
}

export async function saveCatatanMurid(muridUid, kelasId, guruId, text) {
  const id = newId();
  await setDoc(doc(db, 'catatanMurid', id), { muridUid, kelasId, guruId, text, createdAt: new Date().toISOString() });
  return id;
}

export async function updateCatatanMurid(noteId, text) {
  await setDoc(doc(db, 'catatanMurid', noteId), { text, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteCatatanMurid(noteId) {
  await deleteDoc(doc(db, 'catatanMurid', noteId));
}

// --- Catatan Pengerjaan (nempel ke 1 attempt kuis spesifik) ---

// Sama seperti getCatatanMurid — `kelasId` wajib diisi kalau dipanggil dari sisi guru, karena
// alasan yang sama (lihat komentar di getCatatanMurid).
export async function getCatatanPengerjaan(muridUid, kelasId = null) {
  const filters = [where('muridUid', '==', muridUid)];
  if (kelasId) filters.push(where('kelasId', '==', kelasId));
  const snap = await getDocs(query(collection(db, 'catatanPengerjaan'), ...filters));
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return rows;
}

// Satu attempt cuma boleh punya 1 catatan — kalau sudah ada punya attemptId yang sama, dipakai
// ID dokumen yang deterministik (`${muridUid}_${attemptId}`) supaya save berikutnya jadi "edit"
// (overwrite), bukan numpuk dokumen baru tiap kali guru ubah catatannya.
function pengerjaanDocId(muridUid, attemptId) {
  return `${muridUid}_${attemptId}`;
}

export async function saveCatatanPengerjaan(muridUid, kelasId, attemptId, guruId, text) {
  const id = pengerjaanDocId(muridUid, attemptId);
  await setDoc(doc(db, 'catatanPengerjaan', id), { muridUid, kelasId, attemptId, guruId, text, createdAt: new Date().toISOString() });
  return id;
}

export async function deleteCatatanPengerjaan(muridUid, attemptId) {
  await deleteDoc(doc(db, 'catatanPengerjaan', pengerjaanDocId(muridUid, attemptId)));
}

// Dipanggil dari deleteKelas() SEBELUM dokumen kelasnya beneran dihapus — kalau tidak, catatan
// yang masih nyimpen kelasId ke kelas itu jadi "yatim" (kelasId nunjuk ke dokumen yang sudah tidak
// ada), dan begitu kelasnya beneran hilang, isGuruOfKelas jadi selalu false untuk catatan itu —
// artinya tidak ada guru manapun (bahkan yang aslinya bikin) yang bisa baca/hapus catatan itu lagi
// lewat rules normal. Lebih aman bersihkan semua catatan terkait kelas sebelum kelasnya dihapus.
export async function deleteAllCatatanForKelas(kelasId) {
  const [kelasSnap, muridSnap, pengerjaanSnap] = await Promise.all([
    getDocs(query(collection(db, 'catatanKelas'), where('kelasId', '==', kelasId))),
    getDocs(query(collection(db, 'catatanMurid'), where('kelasId', '==', kelasId))),
    getDocs(query(collection(db, 'catatanPengerjaan'), where('kelasId', '==', kelasId)))
  ]);
  const allDocs = [...kelasSnap.docs, ...muridSnap.docs, ...pengerjaanSnap.docs];
  if (allDocs.length === 0) return;

  // writeBatch maks 500 operasi — di-chunk biar aman kalau suatu saat catatannya banyak sekali.
  for (let i = 0; i < allDocs.length; i += 450) {
    const batch = writeBatch(db);
    allDocs.slice(i, i + 450).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}
