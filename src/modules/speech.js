// Audio Speech & Web Audio Sound Effects System

// 1. Audio Sound Effects Synthesizer (Zero External Dependencies)
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a pleasant melodic chime when correct
  playCorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Notes: E5 -> G#5 -> B5 (Majestic Major Chime)
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.setValueAtTime(830.61, now + 0.1);
      osc1.frequency.setValueAtTime(987.77, now + 0.2);

      osc2.frequency.setValueAtTime(329.63, now);
      osc2.frequency.setValueAtTime(415.30, now + 0.1);
      osc2.frequency.setValueAtTime(493.88, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // AudioContext fallback
    }
  }

  // Play a soft low error tone
  playWrong() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // Play subtle tap sound
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  // Play celebratory fanfare on quiz finish
  playFanfare() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
      });
    } catch {}
  }
}

export const sfx = new SoundFX();

// 2. Arabic Speech Synthesis with Visual Wave Feedback

// Cari suara Arab TERBAIK yang tersedia, bukan asal ambil yang pertama ketemu:
// - Suara "cloud"/remote (localService: false) — biasanya jauh lebih natural (mis. suara Google
//   di Chrome) dibanding mesin TTS lokal OS (biasanya eSpeak-based, kaku).
// - Prioritaskan exact match locale (ar-SA/ar-EG dst.) di atas 'ar' generik.
let cachedBestArabicVoice = null;

function computeBestArabicVoice() {
  const voices = window.speechSynthesis.getVoices();
  const arabicVoices = voices.filter(v => v.lang.toLowerCase().startsWith('ar'));
  if (arabicVoices.length === 0) return null;

  const score = (v) => {
    let s = 0;
    if (!v.localService) s += 10; // suara cloud/remote biasanya lebih natural
    if (/^ar-(sa|eg)/i.test(v.lang)) s += 2; // dialek yang paling umum dipakai TTS berkualitas
    return s;
  };

  return arabicVoices.sort((a, b) => score(b) - score(a))[0];
}

// Daftar semua voice Arab yang tersedia di browser/device ini — dipakai untuk dropdown pilihan
// manual di halaman Profil (availability beda-beda tiap browser/OS, jadi harus dicek runtime).
export function getAvailableArabicVoices() {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('ar'));
}

const SELECTED_VOICE_KEY = 'arabic_learning_selected_voice_uri';

export function getSelectedVoiceURI() {
  try { return localStorage.getItem(SELECTED_VOICE_KEY) || ''; } catch { return ''; }
}

export function setSelectedVoiceURI(uri) {
  try {
    if (uri) localStorage.setItem(SELECTED_VOICE_KEY, uri);
    else localStorage.removeItem(SELECTED_VOICE_KEY);
  } catch {}
}

// getVoices() di banyak browser me-return array kosong sebelum daftar suara selesai dimuat
// (async) — tanpa ini, pemanggilan speakArabic() pertama kali sering gagal dapat suara terbaik.
// Kalau user sudah pilih voice manual (lewat Profil), pakai itu duluan selama masih tersedia;
// kalau belum pilih atau pilihannya sudah tidak ada lagi, jatuh ke algoritma auto-pick.
function pickBestArabicVoice() {
  const selectedUri = getSelectedVoiceURI();
  if (selectedUri) {
    const match = getAvailableArabicVoices().find(v => v.voiceURI === selectedUri);
    if (match) return match;
  }
  if (!cachedBestArabicVoice) cachedBestArabicVoice = computeBestArabicVoice();
  return cachedBestArabicVoice;
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    cachedBestArabicVoice = computeBestArabicVoice();
  });
}

// Rate lebih natural untuk teks pendek (1 huruf/1 kata) — dipaksa pelan malah kedengaran
// dipaksakan/kaku. Kalimat panjang (muhadatsah) tetap dibikin agak pelan biar jelas didengar.
function rateForText(text) {
  const len = text.trim().length;
  if (len <= 3) return 0.95;   // satu huruf/harakat
  if (len <= 12) return 0.85;  // satu kata
  return 0.75;                 // kalimat/dialog
}

export function speakArabic(text, onStart = null, onEnd = null) {
  sfx.playClick();
  if (!('speechSynthesis' in window)) {
    alert('Fitur suara tidak didukung pada peramban ini.');
    return;
  }

  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ar-SA';
  utter.rate = rateForText(text);
  utter.pitch = 1.0;

  const arVoice = pickBestArabicVoice();
  if (arVoice) {
    utter.voice = arVoice;
    utter.lang = arVoice.lang; // ikuti locale suara yang dipilih, bukan dipaksa ar-SA
  }

  if (onStart) utter.onstart = onStart;
  if (onEnd) {
    utter.onend = onEnd;
    utter.onerror = onEnd;
  }

  window.speechSynthesis.speak(utter);
}

// 3. Audio pra-rekam (hasil generate TTS berkualitas tinggi via scripts/generate-audio.mjs),
// dengan fallback otomatis ke speakArabic() (Web Speech API) kalau item itu belum punya audioUrl
// atau filenya gagal diputar (mis. jaringan lambat/terputus).
export function playAudioOrSpeak(audioUrl, fallbackText, onStart = null, onEnd = null) {
  if (!audioUrl) {
    speakArabic(fallbackText, onStart, onEnd);
    return;
  }

  sfx.playClick();
  const audio = new Audio(audioUrl);
  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    speakArabic(fallbackText, onStart, onEnd);
  };

  if (onStart) audio.addEventListener('play', onStart);
  if (onEnd) audio.addEventListener('ended', onEnd);
  audio.addEventListener('error', fallback);
  audio.play().catch(fallback);
}
