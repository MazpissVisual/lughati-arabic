import { collection, doc, documentId, getDoc, getDocs, setDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { db } from './firebase.js';
import { deleteAllCatatanForKelas } from './catatan.js';

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createKelas(nama, tingkat, guruUid) {
  const id = `${slugify(nama)}-${Math.random().toString(36).slice(2, 6)}`;
  await setDoc(doc(db, 'kelas', id), { nama, tingkat, guruId: guruUid });
  invalidateKelasCache();
  return id;
}

export async function renameKelas(kelasId, nama, tingkat) {
  const fields = tingkat ? { nama, tingkat } : { nama };
  await setDoc(doc(db, 'kelas', kelasId), fields, { merge: true });
  invalidateKelasCache();
}

// Hapus kelas: murid yang tergabung cuma DILEPAS (kelasId di-set null), bukan ikut dihapus —
// progres belajar mereka (XP, streak, riwayat kuis) tetap aman, tinggal join lagi ke kelas lain.
// Catatan guru (fitur Rapor) yang nempel ke kelas ini IKUT DIHAPUS — kalau tidak, dokumennya jadi
// "yatim" (kelasId nunjuk ke kelas yang sudah tidak ada) dan Firestore list-query rules bakal
// nolak SELURUH query begitu ada 1 saja dokumen yatim di hasilnya (bukan cuma dokumen itu yang
// gagal), jadi guru bisa kehilangan akses baca catatan murid lain yang sebenarnya valid.
export async function deleteKelas(kelasId) {
  const murid = await getMuridByKelas(kelasId);
  const batch = writeBatch(db);
  murid.forEach(m => batch.update(doc(db, 'murid', m.id), { kelasId: null }));
  await batch.commit();
  await deleteAllCatatanForKelas(kelasId);
  await deleteDoc(doc(db, 'kelas', kelasId));
  invalidateKelasCache();
}

// Cache in-memory per guru yang sedang login — dipakai bersama oleh halaman Profil & Dashboard Kelas
// supaya tidak dobel query untuk data yang sama (penting untuk skala banyak pengguna).
let cachedKelasList = null;
let cachedGuruUid = null;

export function invalidateKelasCache() {
  cachedKelasList = null;
  cachedGuruUid = null;
}

export async function getKelasByGuru(guruUid, { forceRefresh = false } = {}) {
  if (!forceRefresh && cachedGuruUid === guruUid && cachedKelasList) {
    return cachedKelasList;
  }
  const snap = await getDocs(query(collection(db, 'kelas'), where('guruId', '==', guruUid)));
  cachedKelasList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  cachedGuruUid = guruUid;
  return cachedKelasList;
}

// Kembalikan data cache tanpa memicu fetch — dipakai untuk render instan sebelum refresh selesai.
export function getCachedKelasList(guruUid) {
  return cachedGuruUid === guruUid ? cachedKelasList : null;
}

export async function getKelasById(kelasId) {
  const snap = await getDoc(doc(db, 'kelas', kelasId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMuridByKelas(kelasId) {
  const snap = await getDocs(query(collection(db, 'murid'), where('kelasId', '==', kelasId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getProgresForMurid(uid) {
  const snap = await getDoc(doc(db, 'progresMurid', uid));
  return snap.exists() ? snap.data() : null;
}

// Baca progres banyak murid sekaligus lewat query `in` (maks 30 id per query, di-chunk otomatis)
// — jauh lebih sedikit round-trip dibanding getDoc satu-satu per murid, penting untuk kelas besar.
export async function getProgresForMuridBatch(uids) {
  const result = {};
  if (uids.length === 0) return result;

  const chunks = [];
  for (let i = 0; i < uids.length; i += 30) chunks.push(uids.slice(i, i + 30));

  await Promise.all(chunks.map(async (chunk) => {
    const snap = await getDocs(query(collection(db, 'progresMurid'), where(documentId(), 'in', chunk)));
    snap.docs.forEach(d => { result[d.id] = d.data(); });
  }));

  return result;
}

export async function joinKelas(muridUid, kelasId) {
  const kelas = await getKelasById(kelasId);
  if (!kelas) throw new Error('Kode kelas tidak ditemukan.');
  await setDoc(doc(db, 'murid', muridUid), { kelasId }, { merge: true });
  await loadMyKelasInfo(muridUid, 'murid');
  return kelas;
}

// Dipakai murid untuk keluar dari kelas saat ini (mis. salah gabung) — progres belajarnya tidak
// ikut terhapus, cuma lepas dari kelas, sama seperti saat guru menghapus kelas.
export async function leaveKelas(muridUid) {
  await setDoc(doc(db, 'murid', muridUid), { kelasId: null }, { merge: true });
  await loadMyKelasInfo(muridUid, 'murid');
}

// Cache in-memory untuk murid yang sedang login: dipakai profil.js secara sinkron.
let myKelasInfo = { kelasId: null, kelasNama: null, tingkat: null };

export async function loadMyKelasInfo(uid, role) {
  if (role !== 'murid') {
    myKelasInfo = { kelasId: null, kelasNama: null, tingkat: null };
    return;
  }
  const snap = await getDoc(doc(db, 'murid', uid));
  const kelasId = snap.exists() ? snap.data().kelasId : null;
  if (!kelasId) {
    myKelasInfo = { kelasId: null, kelasNama: null, tingkat: null };
    return;
  }
  const kelas = await getKelasById(kelasId);
  myKelasInfo = { kelasId, kelasNama: kelas?.nama || kelasId, tingkat: kelas?.tingkat || null };
}

export function getMyKelasInfo() {
  return myKelasInfo;
}
