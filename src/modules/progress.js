import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import { badges, levels } from '../data/achievements.js';
import { showToast } from './ui.js';

const LOCAL_KEY = 'arabic_learning_app_v2';

function getDefaultData() {
  return {
    userName: 'Tholib',
    learnedLetters: [],
    learnedWords: [],
    bookmarks: [],
    quizScores: [],
    xp: 0,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    unlockedBadges: []
  };
}

// Cache in-memory: dibaca sinkron oleh semua view, ditulis ke Firestore secara async di belakang layar.
let cache = getDefaultData();
let uid = null;

function progressRef() {
  return doc(db, 'progresMurid', uid);
}

let persistFailedOnce = false;

// Nulis ke Firestore secara optimistic (cache in-memory sudah ter-update duluan di caller).
// Kalau gagal, coba sekali lagi; kalau masih gagal, backup ke localStorage (supaya progres
// tidak hilang total kalau tab ditutup) dan kasih tahu user lewat toast — sebelumnya kegagalan
// ini didiamkan total tanpa indikasi apapun ke user.
function persist() {
  if (!uid) return;
  setDoc(progressRef(), cache).then(() => {
    persistFailedOnce = false;
  }).catch(() => {
    setDoc(progressRef(), cache).catch((err) => {
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(cache)); } catch {}
      console.error('Gagal menyimpan progres ke server:', err);
      if (!persistFailedOnce) {
        persistFailedOnce = true;
        showToast('Progresmu gagal tersimpan ke server. Periksa koneksi internetmu.');
      }
    });
  });
}

function readLocalLegacy() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    return { ...getDefaultData(), ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

// Dipanggil sekali setelah login berhasil (lihat auth.js -> main.js).
// Kalau dokumen progresMurid/{uid} belum ada: klaim data localStorage lama (jika ada) lalu kosongkan localStorage.
export async function initProgress(userUid) {
  uid = userUid;
  const snap = await getDoc(progressRef());

  if (snap.exists()) {
    cache = { ...getDefaultData(), ...snap.data() };
    return;
  }

  const legacy = readLocalLegacy();
  cache = legacy || getDefaultData();
  await setDoc(progressRef(), cache);
  if (legacy) localStorage.removeItem(LOCAL_KEY);
}

export function clearProgressCache() {
  uid = null;
  cache = getDefaultData();
}

export function getProgress() {
  return cache;
}

export function saveProgress(data) {
  cache = data;
  persist();
}

export function addXP(amount) {
  const data = getProgress();
  data.xp = (data.xp || 0) + amount;
  checkAndUnlockBadges(data);
  saveProgress(data);
  return data.xp;
}

export function markLetterLearned(latin) {
  const data = getProgress();
  if (!data.learnedLetters.includes(latin)) {
    data.learnedLetters.push(latin);
    data.xp = (data.xp || 0) + 15; // 15 XP per letter
    checkAndUnlockBadges(data);
    saveProgress(data);
  }
}

export function isLetterLearned(latin) {
  return getProgress().learnedLetters.includes(latin);
}

export function markWordLearned(wordId) {
  const data = getProgress();
  if (!data.learnedWords) data.learnedWords = [];
  if (!data.learnedWords.includes(wordId)) {
    data.learnedWords.push(wordId);
    data.xp = (data.xp || 0) + 10; // 10 XP per word
    checkAndUnlockBadges(data);
    saveProgress(data);
  }
}

export function isWordLearned(wordId) {
  const data = getProgress();
  return (data.learnedWords || []).includes(wordId);
}

export function toggleBookmark(type, id) {
  const data = getProgress();
  if (!data.bookmarks) data.bookmarks = [];
  const key = `${type}:${id}`;
  const idx = data.bookmarks.indexOf(key);
  if (idx >= 0) {
    data.bookmarks.splice(idx, 1);
  } else {
    data.bookmarks.push(key);
  }
  saveProgress(data);
  return idx < 0; // return true if now bookmarked
}

export function isBookmarked(type, id) {
  const data = getProgress();
  return (data.bookmarks || []).includes(`${type}:${id}`);
}

export function saveQuizScore(score, total, quizType = 'Huruf') {
  const data = getProgress();
  const xpEarned = score * 20 + (score === total ? 50 : 0); // Bonus 50 for 100%
  data.xp = (data.xp || 0) + xpEarned;
  if (!data.quizScores) data.quizScores = [];
  // `id` dipakai buat nempelin catatan guru ke pengerjaan spesifik (fitur Rapor) — attempt lama
  // (sebelum field ini ada) tetap aman ditampilkan, cuma tidak bisa dikasih catatan per-attempt.
  const id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  data.quizScores.push({
    id,
    score,
    total,
    type: quizType,
    date: new Date().toISOString()
  });
  checkAndUnlockBadges(data);
  saveProgress(data);
  return { xpEarned };
}

export function getQuizScores() {
  return getProgress().quizScores || [];
}

export function updateStreak() {
  const data = getProgress();
  const today = new Date().toISOString().split('T')[0];
  if (!data.lastActiveDate) {
    data.lastActiveDate = today;
    data.streak = 1;
  } else if (data.lastActiveDate !== today) {
    const last = new Date(data.lastActiveDate);
    const curr = new Date(today);
    const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      data.streak = (data.streak || 1) + 1;
    } else if (diffDays > 1) {
      data.streak = 1;
    }
    data.lastActiveDate = today;
    checkAndUnlockBadges(data);
    saveProgress(data);
  }
}

function checkAndUnlockBadges(data) {
  if (!data.unlockedBadges) data.unlockedBadges = [];
  badges.forEach(b => {
    if (!data.unlockedBadges.includes(b.id) && b.condition(data)) {
      data.unlockedBadges.push(b.id);
    }
  });
}

export function getUserLevel(xp = 0) {
  let currentLevel = levels[0];
  let nextLevel = levels[1] || null;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXp) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
      break;
    }
  }

  const currentLevelMin = currentLevel.minXp;
  const nextLevelMin = nextLevel ? nextLevel.minXp : currentLevel.minXp + 500;
  const progressPercent = Math.min(100, Math.round(((xp - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100));

  return {
    ...currentLevel,
    nextLevel,
    progressPercent,
    xpToNext: nextLevel ? Math.max(0, nextLevel.minXp - xp) : 0
  };
}

export function getSummary() {
  const data = getProgress();
  const lastScore = (data.quizScores || []).at(-1);
  const totalQuizzes = (data.quizScores || []).length;
  const validScores = (data.quizScores || []).filter(q => q.total > 0);
  const avgAccuracy = validScores.length
    ? Math.round((validScores.reduce((acc, q) => acc + (q.score / q.total), 0) / validScores.length) * 100)
    : 0;

  return {
    userName: data.userName || 'Tholib',
    learnedCount: data.learnedLetters.length,
    learnedWordsCount: (data.learnedWords || []).length,
    totalQuizzes,
    avgAccuracy,
    lastScore,
    xp: data.xp || 0,
    streak: data.streak || 1,
    levelInfo: getUserLevel(data.xp || 0),
    unlockedBadges: data.unlockedBadges || []
  };
}

export function resetProgress() {
  cache = getDefaultData();
  persist();
}
