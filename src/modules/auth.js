import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

// currentUser sengaja diawali `undefined` (BUKAN null) — beda makna: `undefined` = status
// login belum diketahui (Firebase belum sempat cek sesi tersimpan), `null` = sudah dipastikan belum login.
// Kalau ini pakai `null` di awal, onAuthChange di bawah langsung nganggap "belum login" sebelum
// Firebase sempat mengecek localStorage/IndexedDB — efeknya halaman login sempat kekedip sesaat
// sebelum balik ke halaman yang benar begitu sesi tersimpan ketemu (flash of unauthenticated content).
let currentUser = undefined;
let currentRole = null;
let currentNama = null;
const listeners = [];

export function onAuthChange(callback) {
  listeners.push(callback);
  if (currentUser !== undefined) callback(currentUser, currentRole);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// Menentukan role dari keberadaan dokumen guru/{uid}, sekaligus tarik nama asli
// yang diisi saat registrasi (bukan default hardcoded di progress.js).
async function resolveProfile(uid) {
  const guruDoc = await getDoc(doc(db, 'guru', uid));
  if (guruDoc.exists()) return { role: 'guru', nama: guruDoc.data().nama || null };
  const muridDoc = await getDoc(doc(db, 'murid', uid));
  return { role: 'murid', nama: muridDoc.exists() ? (muridDoc.data().nama || null) : null };
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    const profile = await resolveProfile(user.uid);
    currentRole = profile.role;
    currentNama = profile.nama;
  } else {
    currentRole = null;
    currentNama = null;
  }
  listeners.forEach(cb => cb(currentUser, currentRole));
});

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentRole() {
  return currentRole;
}

export function getCurrentNama() {
  return currentNama;
}

// Firebase Auth cuma punya email/password secara native — murid login pakai "Nomor Siswa/Username"
// yang di belakang layar diubah jadi email sintetis di domain ini (nggak pernah dikirim email
// beneran ke sana). Guru tetap pakai email asli supaya bisa reset password mandiri via Firebase.
const MURID_EMAIL_DOMAIN = 'murid.lughati.local';

export function usernameToEmail(username) {
  const clean = (username || '').trim().toLowerCase().replace(/\s+/g, '');
  return `${clean}@${MURID_EMAIL_DOMAIN}`;
}

export async function register({ identifier, password, nama, role }) {
  const email = role === 'guru' ? identifier : usernameToEmail(identifier);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  if (role === 'guru') {
    await setDoc(doc(db, 'guru', uid), { nama, email });
  } else {
    await setDoc(doc(db, 'murid', uid), { nama, username: identifier.trim(), kelasId: null });
  }
  currentRole = role;
  currentNama = nama;
  return cred.user;
}

export async function login(identifier, password, role) {
  const email = role === 'guru' ? identifier : usernameToEmail(identifier);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await firebaseSignOut(auth);
}
