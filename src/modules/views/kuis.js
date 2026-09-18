import { getKuisKategori, getKuisSoal } from '../content.js';
import { getMyKelasInfo } from '../kelas.js';
import { getCurrentRole } from '../auth.js';
import { saveQuizScore, formatDuration } from '../progress.js';
import { playAudioOrSpeak, sfx } from '../speech.js';
import { icon } from '../icons.js';

const QUIZ_LENGTH = 5;
// Jumlah minimum soal dalam satu kategori/bab supaya tiap pertanyaan punya pilihan jawaban yang wajar.
const MIN_POOL_SIZE = 2;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Guru (Pratinjau Kuis) tetap lihat semua tingkat; murid difilter sesuai tingkat kelasnya (murid
// yang belum join kelas tetap lihat semua, biar tidak "nyangkut" tanpa bab kuis sama sekali).
function myTingkat() {
  return getCurrentRole() === 'murid' ? getMyKelasInfo().tingkat : null;
}

const JENIS_META = {
  suara: { icon: 'headphones', title: 'Listening Challenge', desc: 'Dengarkan pelafalan lalu pilih huruf yang sesuai dengan suara tersebut.' },
  kosakata: { icon: 'book', title: 'Tebak Kosakata', desc: 'Uji pemahamanmu terhadap arti kosakata bahasa Arab yang telah dipelajari.' },
  susun: { icon: 'spellcheck', title: 'Penyusunan Kata', desc: 'Susun kata-kata acak menjadi kalimat bahasa Arab yang benar.' },
  tts: { icon: 'hash', title: 'Teka-Teki Silang', desc: 'Isi teka-teki silang menggunakan kosakata bahasa Arab yang telah dipelajari.' }
};

function kategoriIsReady(kategoriId) {
  return getKuisSoal(kategoriId).length >= MIN_POOL_SIZE;
}

function jenisIsReady(jenis) {
  return getKuisKategori(jenis, myTingkat()).some(k => kategoriIsReady(k.id));
}

function buildQuestions(kategoriId) {
  const kategori = getKuisKategori().find(k => k.id === kategoriId);
  if (!kategori) return [];
  const jenis = kategori.jenis;
  const pool = getKuisSoal(kategoriId);
  if (pool.length < MIN_POOL_SIZE) return [];

  const picked = shuffle(pool).slice(0, QUIZ_LENGTH);

  if (jenis === 'susun') {
    return picked.map((correct) => {
      const answerWords = (correct.kalimat || '').trim().split(/\s+/).filter(Boolean);
      return {
        prompt: 'Susun kata-kata berikut menjadi kalimat yang benar:',
        subtext: correct.arti ? `Petunjuk arti: ${correct.arti}` : '',
        answer: answerWords.join(' '),
        wordBank: shuffle(answerWords.map((w, idx) => ({ word: w, key: `${idx}-${w}` }))),
        mode: 'susun'
      };
    });
  }

  return picked.map((correct) => {
    const distractors = shuffle(pool.filter(s => s.id !== correct.id)).slice(0, 3);
    const options = shuffle([correct, ...distractors]);

    if (jenis === 'suara') {
      return {
        prompt: 'Dengarkan suara berikut:',
        subtext: 'Huruf manakah yang sesuai dengan suara yang Anda dengar?',
        audioText: correct.glyph,
        audioUrl: correct.audioUrl,
        isAudioPrompt: true,
        answer: correct.glyph,
        options: options.map(o => o.glyph),
        mode: 'suara',
        explanation: { makhraj: correct.makhraj, desc: correct.desc }
      };
    }
    // kosakata
    return {
      prompt: 'Apakah arti dari kosakata ini?',
      subtext: correct.latin ? `(${correct.latin})` : '',
      glyph: correct.glyph,
      audioText: correct.glyph,
      audioUrl: correct.audioUrl,
      answer: correct.arti,
      options: options.map(o => o.arti),
      mode: 'kosakata',
      explanation: { contoh: correct.desc }
    };
  });
}

// ---------- Crossword (TTS) builder ----------
// Bukan solver sempurna: taruh kata pertama horizontal, lalu tiap kata berikutnya dicoba
// disilangkan (tegak lurus) dengan kata yang sudah ditaruh lewat huruf yang sama. Kalau tidak ada
// irisan yang muat tanpa tabrakan, taruh terpisah di baris baru — tetap 1 puzzle utuh, cukup fungsional.
function cellsOfWord(w) {
  const cells = [];
  for (let i = 0; i < w.jawaban.length; i++) {
    cells.push({ row: w.dir === 'v' ? w.row + i : w.row, col: w.dir === 'h' ? w.col + i : w.col, char: w.jawaban[i] });
  }
  return cells;
}

function collides(candidate, placed) {
  const candCells = cellsOfWord(candidate);
  for (const p of placed) {
    for (const c of candCells) {
      for (const pc of cellsOfWord(p)) {
        if (c.row === pc.row && c.col === pc.col && c.char !== pc.char) return true;
      }
    }
  }
  return false;
}

// Luas kotak pembungkus (bounding box) dari kumpulan kata — dipakai untuk membandingkan seberapa
// "padat" sebuah pilihan penempatan, bukan sekadar ambil persilangan pertama yang valid.
function bboxArea(words) {
  let minRow = Infinity, minCol = Infinity, maxRow = -Infinity, maxCol = -Infinity;
  words.forEach(w => cellsOfWord(w).forEach(c => {
    minRow = Math.min(minRow, c.row); maxRow = Math.max(maxRow, c.row);
    minCol = Math.min(minCol, c.col); maxCol = Math.max(maxCol, c.col);
  }));
  return (maxRow - minRow + 1) * (maxCol - minCol + 1);
}

function shuffleArr(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Bukan solver sempurna (tidak backtrack: kalau kata ke-N susah nyambung, kata sebelumnya tidak
// diubah lagi) — tapi diurutkan terpanjang dulu (kata panjang lebih sulit dicarikan tempat kalau
// dipasang belakangan) dan greedy pilih persilangan paling padat di tiap langkah, cukup untuk bab
// berisi puluhan soal. Tiap panggilan bisa menghasilkan tata letak sedikit berbeda (dipakai untuk
// tombol "Generate Ulang" di CMS) karena tie-break antar kandidat sama-bagus diacak.
export function buildCrossword(soalList) {
  const words = soalList
    .map(s => ({ id: s.id, petunjuk: s.petunjuk || '', jawaban: (s.jawaban || '').toUpperCase().replace(/[^A-Z]/g, '') }))
    .filter(w => w.jawaban.length > 0)
    .sort((a, b) => b.jawaban.length - a.jawaban.length);
  if (words.length === 0) return null;

  const placed = [{ ...words[0], row: 0, col: 0, dir: 'h' }];

  for (let i = 1; i < words.length; i++) {
    const w = words[i];

    // Kumpulkan SEMUA persilangan yang valid (bukan cuma yang pertama ketemu), lalu pilih yang
    // bikin bounding box gabungan paling kecil — supaya grid akhir sepadat mungkin, tidak melebar
    // ke posisi persilangan yang jauh dari gugusan kata yang sudah ada.
    const candidates = [];
    for (const p of placed) {
      for (let a = 0; a < w.jawaban.length; a++) {
        for (let b = 0; b < p.jawaban.length; b++) {
          if (w.jawaban[a] !== p.jawaban[b]) continue;
          const dir = p.dir === 'h' ? 'v' : 'h';
          const row = p.dir === 'h' ? p.row - a : p.row + b;
          const col = p.dir === 'h' ? p.col + b : p.col - a;
          const candidate = { ...w, row, col, dir };
          if (!collides(candidate, placed)) candidates.push(candidate);
        }
      }
    }

    let placement = null;
    if (candidates.length > 0) {
      // Acak dulu urutannya supaya tie antar kandidat sama-padat tidak selalu jatuh ke yang sama
      // (biar tombol "Generate Ulang" di CMS beneran menghasilkan variasi tata letak).
      placement = shuffleArr(candidates).reduce((best, c) =>
        bboxArea([...placed, c]) < bboxArea([...placed, best]) ? c : best
      );
    } else {
      const maxRow = Math.max(...placed.map(p => (p.dir === 'v' ? p.row + p.jawaban.length - 1 : p.row)));
      placement = { ...w, row: maxRow + 2, col: 0, dir: 'h' };
    }
    placed.push(placement);
  }

  let minRow = 0, minCol = 0, maxRow = 0, maxCol = 0;
  placed.forEach(p => cellsOfWord(p).forEach(c => {
    minRow = Math.min(minRow, c.row); maxRow = Math.max(maxRow, c.row);
    minCol = Math.min(minCol, c.col); maxCol = Math.max(maxCol, c.col);
  }));

  const shifted = placed.map(p => ({ ...p, row: p.row - minRow, col: p.col - minCol }));

  // Padatkan baris/kolom yang sama sekali tidak dilewati kata manapun (bisa muncul kalau kata-kata
  // tersambung lewat titik silang yang jauh dari satu sama lain) — tanpa ini grid jadi kotak besar
  // dengan banyak sel gelap kosong tak berguna di antara gugusan kata yang saling berjauhan.
  const usedRows = [...new Set(shifted.flatMap(p => cellsOfWord(p).map(c => c.row)))].sort((a, b) => a - b);
  const usedCols = [...new Set(shifted.flatMap(p => cellsOfWord(p).map(c => c.col)))].sort((a, b) => a - b);
  const rowMap = new Map(usedRows.map((r, i) => [r, i]));
  const colMap = new Map(usedCols.map((c, i) => [c, i]));
  const compacted = shifted.map(p => ({ ...p, row: rowMap.get(p.row), col: colMap.get(p.col) }));
  const rows = usedRows.length;
  const cols = usedCols.length;

  // Auto-numbering: scan kiri-atas ke kanan-bawah berdasar sel awal tiap kata. Kalau 2 kata
  // (across & down) sama-sama mulai di sel yang persis sama, mereka BERBAGI satu nomor yang sama
  // (bukan dapat nomor sendiri-sendiri) — sesuai konvensi TTS standar.
  const sorted = [...compacted].sort((a, b) => (a.row - b.row) || (a.col - b.col));
  let num = 0;
  let lastPos = null;
  sorted.forEach((w) => {
    const pos = `${w.row},${w.col}`;
    if (pos !== lastPos) { num++; lastPos = pos; }
    w.number = num;
  });

  return { rows, cols, words: sorted };
}

// Validator pra-tampil: dipakai CMS (preview) untuk kasih peringatan ke guru sebelum soal
// dipakai murid. Karena grid selalu diturunkan langsung dari `words` (bukan struktur terpisah
// yang bisa telat sinkron), orphan-cell/nomor-tanpa-kata pada dasarnya mustahil terjadi lewat
// alur normal — jadi checknya sebagian besar untuk jaga-jaga (regresi di masa depan), sementara
// cek koneksi antar-kata adalah satu-satunya yang beneran bisa gagal dari kombinasi soal guru.
export function validateCrossword(puzzle) {
  const warnings = [];
  if (!puzzle || puzzle.words.length === 0) return { valid: true, warnings };

  // Grup kata yang saling bersambung (union-find sederhana lewat BFS di graf "berbagi sel").
  const n = puzzle.words.length;
  const visited = new Array(n).fill(false);
  const cellsPerWord = puzzle.words.map(w => cellsOfWord(w).map(c => `${c.row},${c.col}`));
  const shareCell = (i, j) => cellsPerWord[i].some(k => cellsPerWord[j].includes(k));

  let clusters = 0;
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    clusters++;
    const queue = [i];
    visited[i] = true;
    while (queue.length) {
      const cur = queue.pop();
      for (let j = 0; j < n; j++) {
        if (!visited[j] && shareCell(cur, j)) { visited[j] = true; queue.push(j); }
      }
    }
  }
  if (clusters > 1) {
    warnings.push(`Ada ${clusters} gugus kata yang tidak saling tersambung — TTS akan terlihat terpisah-pisah. Tambah kata dengan huruf yang mirip supaya lebih nyambung.`);
  }

  // Sanity check struktural (harusnya selalu lolos lewat alur normal, jaga-jaga saja).
  const cellMap = new Map();
  puzzle.words.forEach(w => cellsOfWord(w).forEach(c => {
    const key = `${c.row},${c.col}`;
    const existing = cellMap.get(key);
    if (existing && existing !== c.char) warnings.push(`Tabrakan huruf berbeda di sel (${c.row},${c.col}).`);
    cellMap.set(key, c.char);
  }));

  return { valid: warnings.length === 0, warnings };
}

export const quizState = {
  kategoriId: null,
  questions: [],
  current: 0,
  score: 0,
  answered: false,
  xpEarned: 0,
  scoreSaved: false, // guard supaya saveQuizScore() tidak pernah kepanggil dobel untuk sesi kuis yang sama
  audioPlayedFor: -1, // index soal terakhir yang audionya sudah di-autoplay
  history: [], // [{ question, chosen, isCorrect }] — dipakai buat ulasan jawaban di layar hasil
  susunSelected: [], // key kata (dari wordBank) yang sudah disusun murid, urut sesuai tap
  ttsPuzzle: null, // { rows, cols, words } — hasil buildCrossword(), null kalau bukan kuis jenis 'tts'
  ttsAnswers: {}, // "row,col" -> huruf yang diketik murid
  ttsChecked: false,
  ttsScore: 0,
  startedAt: null, // timestamp (ms) saat sesi kuis ini dimulai — dipakai hitung durasi pengerjaan
  durationSec: null // durasi pengerjaan (detik), diisi sekali saat skor disimpan
};

export function startQuiz(kategoriId) {
  const kategori = getKuisKategori().find(k => k.id === kategoriId);
  quizState.kategoriId = kategoriId;
  quizState.current = 0;
  quizState.score = 0;
  quizState.answered = false;
  quizState.xpEarned = 0;
  quizState.scoreSaved = false;
  quizState.audioPlayedFor = -1;
  quizState.history = [];
  quizState.susunSelected = [];
  quizState.ttsAnswers = {};
  quizState.ttsChecked = false;
  quizState.ttsScore = 0;
  quizState.startedAt = Date.now();

  if (kategori?.jenis === 'tts') {
    quizState.questions = [];
    quizState.ttsPuzzle = buildCrossword(getKuisSoal(kategoriId));
  } else {
    quizState.ttsPuzzle = null;
    quizState.questions = buildQuestions(kategoriId);
  }
}

// ---------- Halaman 1: pilih jenis kuis ----------

export function renderKuisList() {
  const cards = Object.entries(JENIS_META).map(([jenisId, m]) => {
    const kategoriList = getKuisKategori(jenisId, myTingkat());
    const ready = jenisIsReady(jenisId);
    return `
    <div class="check-card" style="${ready ? '' : 'opacity:0.6;'}">
      <div class="check-card__top">
        <span class="check-card__icon">${icon(m.icon, { size: 22 })}</span>
        <span class="check-card__status ${ready ? 'check-card__status--ready' : ''}" style="${ready ? '' : 'color:var(--color-ink-400);'}">${ready ? `${icon('check', { size: 11 })} Ready` : 'Belum ada bab'}</span>
      </div>
      <div class="check-card__title">${m.title}</div>
      <div class="check-card__desc">${m.desc}</div>
      <div class="check-card__meta"><span>${kategoriList.length} Bab</span></div>
      ${ready
        ? `<a class="btn btn--primary" href="/kuis/kategori/${jenisId}" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">Pilih Bab ${icon('arrowRight', { size: 15 })}</a>`
        : `<button class="btn btn--outline" disabled title="Belum ada bab dengan soal cukup">Belum Tersedia</button>`}
    </div>
  `;
  }).join('');

  return `
    <div class="section-header" style="margin-top:0;">
      <div>
        <h1 style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">Knowledge Checks</h1>
        <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin-top:var(--space-2);">
          Uji pemahamanmu dari modul-modul terbaru. Kumpulkan XP dengan menyelesaikan tantangan harian.
        </p>
      </div>
    </div>
    <div class="check-grid" style="margin-top:var(--space-6);">${cards}</div>
  `;
}

export function bindKuisListEvents() {}

// ---------- Halaman 2: pilih kategori/bab dalam satu jenis ----------

export function renderKuisKategoriList(jenis) {
  const m = JENIS_META[jenis];
  const kategoriList = getKuisKategori(jenis, myTingkat());

  const cards = kategoriList.map(k => {
    const jumlahSoal = getKuisSoal(k.id).length;
    const ready = jumlahSoal >= MIN_POOL_SIZE;
    return `
      <div class="check-card" style="${ready ? '' : 'opacity:0.6;'}">
        <div class="check-card__top">
          <span class="check-card__icon">${icon(m ? m.icon : 'book', { size: 22 })}</span>
          <span class="check-card__status ${ready ? 'check-card__status--ready' : ''}" style="${ready ? '' : 'color:var(--color-ink-400);'}">${ready ? `${icon('check', { size: 11 })} Ready` : 'Soal belum cukup'}</span>
        </div>
        <div class="check-card__title">${k.nama}</div>
        <div class="check-card__meta"><span>${jumlahSoal} Soal Tersedia</span></div>
        ${ready
          ? `<a class="btn btn--primary" href="/kuis/main/${k.id}" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">Mulai Kuis ${icon('arrowRight', { size: 15 })}</a>`
          : `<button class="btn btn--outline" disabled title="Minimal ${MIN_POOL_SIZE} soal dibutuhkan">Belum Tersedia</button>`}
      </div>
    `;
  }).join('');

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <a href="/kuis" style="font-size:var(--fs-xs); color:var(--color-ink-500); display:inline-flex; align-items:center; gap:4px;">${icon('chevronLeft', { size: 12 })} Knowledge Checks</a>
      <div>
        <h1 style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">${m ? m.title : 'Pilih Bab'}</h1>
        <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin-top:var(--space-2);">Pilih bab yang ingin kamu uji.</p>
      </div>
      ${kategoriList.length
        ? `<div class="check-grid">${cards}</div>`
        : `<div class="card" style="text-align:center; padding:var(--space-8); color:var(--color-ink-500);">Belum ada bab untuk jenis kuis ini. Tunggu guru menambah materi.</div>`}
    </div>
  `;
}

export function bindKuisKategoriListEvents() {}

// ---------- Halaman 3: mengerjakan kuis ----------

function renderExplanation(q) {
  const e = q.explanation;
  if (!e) return '';

  if (q.mode === 'suara') {
    if (!e.makhraj && !e.desc) return '';
    return `
      <div style="font-size:var(--fs-2xs); color:var(--color-ink-500); background:var(--color-surface); border-radius:var(--radius-sm); padding:8px 10px; margin-top:2px;">
        ${e.makhraj ? `<div><strong>Makhraj:</strong> ${e.makhraj}</div>` : ''}
        ${e.desc ? `<div style="margin-top:2px;">${e.desc}</div>` : ''}
      </div>
    `;
  }

  if (q.mode === 'kosakata') {
    if (!e.contoh) return '';
    return `
      <div style="font-size:var(--fs-2xs); color:var(--color-ink-500); background:var(--color-surface); border-radius:var(--radius-sm); padding:8px 10px; margin-top:2px;">
        <strong>Contoh:</strong> <span class="arabic" style="font-size:var(--fs-xs);">${e.contoh}</span>
      </div>
    `;
  }

  return '';
}

function renderReview() {
  if (quizState.history.length === 0) return '';

  const rowsHtml = quizState.history.map((h, i) => {
    const { question: q, chosen, isCorrect } = h;
    const isSusun = q.mode === 'susun';
    const displayGlyph = isSusun ? q.answer : (q.isAudioPrompt ? q.audioText : q.glyph);
    const useArabicOptionStyle = q.mode === 'suara' || isSusun; // opsinya berupa teks Arab, bukan latin/arti

    return `
      <div style="display:flex; gap:var(--space-3); padding:var(--space-3); border-radius:var(--radius-md); background:${isCorrect ? 'var(--color-primary-50)' : 'rgba(239, 68, 68, 0.06)'};">
        <span style="flex-shrink:0; width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:var(--fs-2xs); font-weight:var(--fw-bold); color:#fff; background:${isCorrect ? 'var(--color-primary-500)' : 'var(--color-error)'};">${i + 1}</span>
        <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
          ${isSusun ? '' : `
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="arabic" style="font-size:1.3rem;">${displayGlyph}</span>
              <button type="button" class="header-btn" data-replay="${displayGlyph}" data-audio-url="${q.audioUrl || ''}" title="Dengarkan" aria-label="Dengarkan ulang soal ke-${i + 1}" style="width:26px; height:26px;">${icon('volume', { size: 12 })}</button>
            </div>
          `}
          <div style="font-size:var(--fs-xs); color:var(--color-ink-600);">
            Jawabanmu: <strong class="${useArabicOptionStyle ? 'arabic' : ''}" dir="${isSusun ? 'rtl' : 'ltr'}" style="color:${isCorrect ? 'var(--color-primary-700)' : 'var(--color-error)'};">${chosen}</strong>
            ${isCorrect ? icon('checkCircle', { size: 12 }) : icon('xCircle', { size: 12 })}
          </div>
          ${!isCorrect ? `
            <div style="font-size:var(--fs-xs); color:var(--color-ink-600);">
              Jawaban benar: <strong class="${useArabicOptionStyle ? 'arabic' : ''}" dir="${isSusun ? 'rtl' : 'ltr'}" style="color:var(--color-primary-700);">${q.answer}</strong>
            </div>
            ${renderExplanation(q)}
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3);">
      <div style="font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--color-ink-900);">Ulasan Jawaban</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-2);">${rowsHtml}</div>
    </div>
  `;
}

// Catatan: renderQuiz() TIDAK memutuskan sendiri kapan harus mulai kuis baru — itu tanggung jawab
// pemanggil (lihat main.js: startQuiz() selalu dipanggil eksplisit setiap route /kuis/main/:kategoriId
// dibuka). Rerender internal (jawab soal, coba lagi) tidak lewat sana, jadi tidak pernah memicu mulai
// ulang atau simpan skor dobel secara tak sengaja.
export function renderQuiz() {
  const kategori = getKuisKategori().find(k => k.id === quizState.kategoriId);
  const backHref = kategori ? `/kuis/kategori/${kategori.jenis}` : '/kuis';
  const backLabel = kategori ? (JENIS_META[kategori.jenis]?.title || 'Kembali') : 'Knowledge Checks';

  if (kategori?.jenis === 'tts') {
    return renderTtsQuiz(kategori, backHref, backLabel);
  }

  // Konten belum cukup (mis. guru belum isi soal untuk bab ini) — jangan pernah anggap ini
  // "kuis selesai dengan skor sempurna", karena itu celah XP gratis tanpa menjawab apa pun.
  if (quizState.questions.length === 0) {
    return `
      <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
        <a href="${backHref}" style="font-size:var(--fs-xs); color:var(--color-ink-500); display:inline-flex; align-items:center; gap:4px;">${icon('chevronLeft', { size: 12 })} ${backLabel}</a>
        <div class="card" style="text-align:center; padding:var(--space-8); color:var(--color-ink-500);">
          <div style="margin-bottom:var(--space-2);">${icon('info', { size: 24 })}</div>
          Soal untuk bab ini belum cukup (minimal ${MIN_POOL_SIZE} item). Coba bab lain atau tunggu guru menambah materi.
        </div>
      </div>
    `;
  }

  // Quiz Finished State
  if (quizState.current >= quizState.questions.length) {
    if (!quizState.scoreSaved) {
      quizState.durationSec = quizState.startedAt ? (Date.now() - quizState.startedAt) / 1000 : null;
      const result = saveQuizScore(quizState.score, quizState.questions.length, kategori?.jenis || 'kuis', quizState.durationSec);
      quizState.xpEarned = result.xpEarned;
      quizState.scoreSaved = true;
      sfx.playFanfare();
    }

    const perfect = quizState.score === quizState.questions.length;
    const good = quizState.score >= Math.ceil(quizState.questions.length * 0.6);

    const starCount = perfect ? 3 : good ? 2 : 1;
    const starsHtml = [0, 1, 2].map(i => `
      <span style="color:${i < starCount ? 'var(--color-accent-500)' : 'var(--color-ink-200)'};">${icon('star', { size: 30 })}</span>
    `).join('');

    let feedbackTitle = 'Mumtaz! Sempurna!';
    let feedbackSub = 'Luar biasa! Kamu menguasai semua pertanyaan dengan sempurna.';
    if (!perfect && good) {
      feedbackTitle = 'Jayyid Jiddan! Bagus Sekali!';
      feedbackSub = 'Hasil yang sangat memuaskan, terus tingkatkan lagi belajarmu!';
    } else if (!good) {
      feedbackTitle = 'Terus Semangat Berlatih!';
      feedbackSub = 'Jangan menyerah! Ulangi materi dan coba lagi kuis ini.';
    }

    return `
      <div class="animate-pop-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
        <div class="result-card">
          <div class="result-stars">${starsHtml}</div>
          <div class="result-score">${quizState.score} / ${quizState.questions.length}</div>
          ${formatDuration(quizState.durationSec) ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-500);">Waktu pengerjaan: <strong>${formatDuration(quizState.durationSec)}</strong></div>` : ''}

          <div class="xp-badge">
            ${icon('star', { size: 14 })} +${quizState.xpEarned} XP Didapatkan!
          </div>

          <h2 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-ink-950); margin-top:var(--space-2);">
            ${feedbackTitle}
          </h2>
          <p style="font-size:var(--fs-xs); color:var(--color-ink-600); max-width:320px;">
            ${feedbackSub}
          </p>

          <div style="display:flex; flex-direction:column; gap:var(--space-2); width:100%; margin-top:var(--space-4);">
            <button class="btn btn--primary" id="retry-btn" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">
              ${icon('refresh', { size: 16 })} Coba Kuis Lagi
            </button>
            <a class="btn btn--outline" href="${backHref}" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">
              ${icon('chevronLeft', { size: 16 })} Pilih Bab Lain
            </a>
          </div>
        </div>

        ${renderReview()}
      </div>
    `;
  }

  // Active Quiz Question State
  const q = quizState.questions[quizState.current];

  // Auto-play audio for listening quiz — dijaga `audioPlayedFor` supaya tidak nge-trigger lagi
  // kalau render() kepanggil ulang untuk soal yang sama (mis. rerender tak terkait lainnya).
  if (q.isAudioPrompt && !quizState.answered && quizState.audioPlayedFor !== quizState.current) {
    quizState.audioPlayedFor = quizState.current;
    setTimeout(() => {
      playAudioOrSpeak(q.audioUrl, q.audioText);
    }, 300);
  }

  const progressSegmentsHtml = quizState.questions.map((_, i) => `
    <div class="quiz-progress-seg ${i <= quizState.current ? 'is-done' : ''}"></div>
  `).join('');

  const bodyHtml = q.mode === 'susun' ? renderSusunBody(q) : renderPilihanGandaBody(q);

  return `
    <div class="lesson-page-compact animate-fade-in">
      <a href="${backHref}" style="font-size:var(--fs-xs); color:var(--color-ink-500); display:inline-flex; align-items:center; gap:4px;">${icon('chevronLeft', { size: 12 })} ${backLabel}</a>
      <div>
        <h1 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-ink-900);">${kategori?.nama || ''}</h1>
      </div>

      <!-- Question Progress Bar -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; justify-content:space-between; font-size:var(--fs-xs); color:var(--color-ink-500); font-weight:var(--fw-semibold);">
          <span>Soal <strong>${quizState.current + 1}</strong> dari ${quizState.questions.length}</span>
          <span>Skor: <strong>${quizState.score}</strong></span>
        </div>
        <div class="quiz-progress-bar">
          ${progressSegmentsHtml}
        </div>
      </div>

      <!-- Quiz Card -->
      <div class="quiz-card">
        <div class="quiz-prompt">${q.prompt}</div>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function renderPilihanGandaBody(q) {
  const optionsHtml = q.options.map(opt => `
    <button class="quiz-option-btn" data-answer="${opt}">
      <span class="${q.mode === 'suara' ? 'arabic' : ''}" style="${q.mode === 'suara' ? 'font-size:1.8rem;' : ''}">${opt}</span>
      <span class="indicator"></span>
    </button>
  `).join('');

  return `
    ${q.isAudioPrompt ? `
      <div style="display:flex; flex-direction:column; align-items:center; gap:var(--space-2);">
        <button class="play-audio-btn is-playing" id="replay-audio" title="Dengarkan Ulang Suara">
          ${icon('volume', { size: 24 })}
        </button>
        <span style="font-size:var(--fs-2xs); color:var(--color-ink-500);">Ketuk untuk memutar ulang audio</span>
      </div>
    ` : `
      <div class="quiz-glyph">${q.glyph}</div>
    `}

    ${q.subtext ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-600);">${q.subtext}</div>` : ''}

    <div class="quiz-options">
      ${optionsHtml}
    </div>
  `;
}

// ---------- Body: Penyusunan Kata ----------

function renderSusunBody(q) {
  const selectedKeys = quizState.susunSelected;
  const remaining = q.wordBank.filter(w => !selectedKeys.includes(w.key));

  const selectedHtml = selectedKeys.map((key, idx) => {
    const w = q.wordBank.find(b => b.key === key);
    return `<button type="button" class="quiz-option-btn susun-chip susun-chip--selected" data-susun-remove="${idx}"><span class="arabic">${w?.word || ''}</span></button>`;
  }).join('') || `<span style="font-size:var(--fs-xs); color:var(--color-ink-400);">Ketuk kata di bawah untuk mulai menyusun.</span>`;

  const bankHtml = remaining.map(w => `
    <button type="button" class="quiz-option-btn susun-chip" data-susun-pick="${w.key}"><span class="arabic">${w.word}</span></button>
  `).join('');

  const allUsed = remaining.length === 0;

  return `
    ${q.subtext ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-600);">${q.subtext}</div>` : ''}

    <div class="susun-answer-strip" dir="rtl" style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; min-height:44px; padding:10px; border:2px dashed var(--color-ink-200); border-radius:var(--radius-md); align-items:center;">
      ${selectedHtml}
    </div>

    <div class="quiz-options" dir="rtl" style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px;">
      ${bankHtml}
    </div>

    <button type="button" class="btn btn--primary" id="susun-check-btn" ${(!allUsed || quizState.answered) ? 'disabled' : ''}>
      Cek Jawaban
    </button>
  `;
}

// ---------- Halaman TTS: Teka-Teki Silang (1 kategori = 1 puzzle, bukan per-soal) ----------

function renderTtsQuiz(kategori, backHref, backLabel) {
  const puzzle = quizState.ttsPuzzle;

  if (!puzzle) {
    return `
      <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
        <a href="${backHref}" style="font-size:var(--fs-xs); color:var(--color-ink-500); display:inline-flex; align-items:center; gap:4px;">${icon('chevronLeft', { size: 12 })} ${backLabel}</a>
        <div class="card" style="text-align:center; padding:var(--space-8); color:var(--color-ink-500);">
          <div style="margin-bottom:var(--space-2);">${icon('info', { size: 24 })}</div>
          Soal untuk bab ini belum cukup. Coba bab lain atau tunggu guru menambah materi.
        </div>
      </div>
    `;
  }

  // Peta sel: "row,col" -> { char, number (kalau sel awal kata) }
  const cellMap = new Map();
  puzzle.words.forEach(w => {
    for (let i = 0; i < w.jawaban.length; i++) {
      const row = w.dir === 'v' ? w.row + i : w.row;
      const col = w.dir === 'h' ? w.col + i : w.col;
      const key = `${row},${col}`;
      const existing = cellMap.get(key) || {};
      cellMap.set(key, { char: w.jawaban[i], number: i === 0 ? w.number : existing.number });
    }
  });

  if (quizState.ttsChecked && !quizState.scoreSaved) {
    quizState.durationSec = quizState.startedAt ? (Date.now() - quizState.startedAt) / 1000 : null;
    const result = saveQuizScore(quizState.ttsScore, puzzle.words.length, kategori?.jenis || 'kuis', quizState.durationSec);
    quizState.xpEarned = result.xpEarned;
    quizState.scoreSaved = true;
    sfx.playFanfare();
  }

  let gridHtml = '<div class="tts-grid" style="display:inline-grid; gap:2px; --cols:' + puzzle.cols + ';">';
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const key = `${r},${c}`;
      const cell = cellMap.get(key);
      if (!cell) {
        gridHtml += `<div class="tts-cell tts-cell--blank"></div>`;
        continue;
      }
      const userChar = (quizState.ttsAnswers[key] || '').toUpperCase();
      const isCorrect = quizState.ttsChecked && userChar === cell.char;
      const isWrong = quizState.ttsChecked && userChar && userChar !== cell.char;
      gridHtml += `
        <div class="tts-cell ${isCorrect ? 'is-correct' : ''} ${isWrong ? 'is-wrong' : ''}" style="position:relative;">
          ${cell.number ? `<span class="tts-cell__number">${cell.number}</span>` : ''}
          <input type="text" maxlength="1" class="tts-cell__input" data-tts-cell="${key}" value="${userChar}" ${quizState.ttsChecked ? 'disabled' : ''}>
        </div>
      `;
    }
  }
  gridHtml += '</div>';

  const clueItem = (w, idx) => `
    <li class="tts-clue" data-clue-word-idx="${idx}" tabindex="0" role="button">
      <span class="tts-clue__number">${w.number}</span>
      <span class="tts-clue__text">${w.petunjuk || w.jawaban}</span>
    </li>
  `;
  const indexed = puzzle.words.map((w, idx) => ({ w, idx }));
  const mendatarHtml = indexed.filter(({ w }) => w.dir === 'h').map(({ w, idx }) => clueItem(w, idx)).join('');
  const menurunHtml = indexed.filter(({ w }) => w.dir === 'v').map(({ w, idx }) => clueItem(w, idx)).join('');

  const finishedHtml = quizState.ttsChecked ? `
    <div class="result-card">
      <div class="result-score">${quizState.ttsScore} / ${puzzle.words.length}</div>
      ${formatDuration(quizState.durationSec) ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-500);">Waktu pengerjaan: <strong>${formatDuration(quizState.durationSec)}</strong></div>` : ''}
      <div class="xp-badge">${icon('star', { size: 14 })} +${quizState.xpEarned} XP Didapatkan!</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-2); width:100%; margin-top:var(--space-4);">
        <button class="btn btn--primary" id="retry-btn" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">${icon('refresh', { size: 16 })} Coba Lagi</button>
        <a class="btn btn--outline" href="${backHref}" style="display:inline-flex; align-items:center; justify-content:center; gap:6px;">${icon('chevronLeft', { size: 16 })} Pilih Bab Lain</a>
      </div>
    </div>
  ` : `
    <button type="button" class="btn btn--primary" id="tts-check-btn" style="max-width:320px; margin:0 auto;">Cek Jawaban</button>
  `;

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <a href="${backHref}" style="font-size:var(--fs-xs); color:var(--color-ink-500); display:inline-flex; align-items:center; gap:4px;">${icon('chevronLeft', { size: 12 })} ${backLabel}</a>
      <div>
        <h1 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-ink-900);">${kategori?.nama || ''}</h1>
      </div>
      <div class="tts-layout">
        <div class="quiz-card tts-layout__grid">
          <div style="overflow-x:auto; width:100%; display:flex; justify-content:center;">${gridHtml}</div>
        </div>
        <div class="card tts-layout__clues">
          ${mendatarHtml ? `
            <div class="tts-clue-group__title">${icon('arrowRight', { size: 13 })} Mendatar</div>
            <ul class="tts-clue-list">${mendatarHtml}</ul>
          ` : ''}
          ${menurunHtml ? `
            <div class="tts-clue-group__title" style="margin-top:var(--space-3);">${icon('chevronDown', { size: 13 })} Menurun</div>
            <ul class="tts-clue-list">${menurunHtml}</ul>
          ` : ''}
        </div>
      </div>
      ${finishedHtml}
    </div>
  `;
}

export function bindQuizEvents(root, rerender) {
  // Replay audio di Ulasan Jawaban (layar hasil)
  root.querySelectorAll('[data-replay]').forEach(btn => {
    btn.addEventListener('click', (e) => playAudioOrSpeak(e.currentTarget.dataset.audioUrl, e.currentTarget.dataset.replay));
  });

  // Replay Audio in Listening Mode
  root.querySelector('#replay-audio')?.addEventListener('click', () => {
    const q = quizState.questions[quizState.current];
    if (q) playAudioOrSpeak(q.audioUrl, q.audioText);
  });

  // Answer Option Click
  root.querySelectorAll('[data-answer]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (quizState.answered) return;
      quizState.answered = true;

      const chosen = e.currentTarget.dataset.answer;
      const q = quizState.questions[quizState.current];
      const isCorrect = chosen === q.answer;

      if (isCorrect) {
        quizState.score++;
        sfx.playCorrect();
      } else {
        sfx.playWrong();
      }

      quizState.history.push({ question: q, chosen, isCorrect });

      root.querySelectorAll('[data-answer]').forEach(b => {
        b.disabled = true;
        const ind = b.querySelector('.indicator');
        if (b.dataset.answer === q.answer) {
          b.classList.add('is-correct');
          if (ind) ind.innerHTML = icon('checkCircle', { size: 18 });
        } else if (b === e.currentTarget && !isCorrect) {
          b.classList.add('is-wrong');
          if (ind) ind.innerHTML = icon('xCircle', { size: 18 });
        }
      });

      // Advance to next question
      setTimeout(() => {
        quizState.current++;
        quizState.answered = false;
        rerender();
      }, 950);
    });
  });

  // Retry Button
  root.querySelector('#retry-btn')?.addEventListener('click', () => {
    startQuiz(quizState.kategoriId);
    rerender();
  });

  // ---------- Penyusunan Kata ----------

  root.querySelectorAll('[data-susun-pick]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      quizState.susunSelected.push(e.currentTarget.dataset.susunPick);
      rerender();
    });
  });

  root.querySelectorAll('[data-susun-remove]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      quizState.susunSelected.splice(Number(e.currentTarget.dataset.susunRemove), 1);
      rerender();
    });
  });

  root.querySelector('#susun-check-btn')?.addEventListener('click', () => {
    if (quizState.answered) return;
    quizState.answered = true;

    const q = quizState.questions[quizState.current];
    const chosen = quizState.susunSelected.map(key => q.wordBank.find(w => w.key === key)?.word).join(' ');
    const isCorrect = chosen.trim() === q.answer.trim();

    if (isCorrect) { quizState.score++; sfx.playCorrect(); } else { sfx.playWrong(); }
    quizState.history.push({ question: q, chosen, isCorrect });

    setTimeout(() => {
      quizState.current++;
      quizState.answered = false;
      quizState.susunSelected = [];
      rerender();
    }, 950);
  });

  // ---------- Teka-Teki Silang ----------
  // Sel persilangan itu bagian dari 2 kata (mendatar & menurun) sekaligus, jadi arah "lanjut" tidak
  // bisa ditebak dari ada-tidaknya sel tetangga (sel di kanan bisa saja cuma milik kata lain yang
  // menyilang, bukan kata yang sedang diisi). Makanya arah harus dihitung dari kata aslinya (puzzle.words).
  const puzzle = quizState.ttsPuzzle;
  // "arah aktif" ikut cursor: diset saat fokus/panah, dipertahankan selama masih nyambung ke kata yang sama.
  let ttsDir = 'h';

  function ttsCellInput(row, col) {
    return root.querySelector(`[data-tts-cell="${row},${col}"]`);
  }

  // Kata mana saja (dgn arah masing-masing) yang mencakup sel ini — dipakai untuk tahu arah mana yang valid di sel itu.
  function wordsAtCell(row, col) {
    if (!puzzle) return [];
    return puzzle.words.filter(w => {
      for (let i = 0; i < w.jawaban.length; i++) {
        const r = w.dir === 'v' ? w.row + i : w.row;
        const c = w.dir === 'h' ? w.col + i : w.col;
        if (r === row && c === col) return true;
      }
      return false;
    });
  }

  // Highlight kata yang sedang aktif (semua selnya) di grid + clue terkait di panel kanan.
  let highlightedCellEls = [];
  let highlightedClueEl = null;
  let lastClickedKey = null;

  function activeWordFor(row, col) {
    const words = wordsAtCell(row, col);
    return words.find(w => w.dir === ttsDir) || words[0] || null;
  }

  function highlightActiveWord(row, col) {
    highlightedCellEls.forEach(el => el.classList.remove('is-active-word'));
    highlightedCellEls = [];
    highlightedClueEl?.classList.remove('is-active');
    highlightedClueEl = null;

    const word = activeWordFor(row, col);
    if (!word || !puzzle) return;

    cellsOfWord(word).forEach(c => {
      const el = ttsCellInput(c.row, c.col)?.closest('.tts-cell');
      if (el) { el.classList.add('is-active-word'); highlightedCellEls.push(el); }
    });

    const wordIdx = puzzle.words.indexOf(word);
    highlightedClueEl = root.querySelector(`[data-clue-word-idx="${wordIdx}"]`);
    highlightedClueEl?.classList.add('is-active');
  }

  root.querySelectorAll('[data-tts-cell]').forEach(input => {
    const [row, col] = input.dataset.ttsCell.split(',').map(Number);

    input.addEventListener('focus', (e) => {
      e.currentTarget.select();
      const dirs = wordsAtCell(row, col).map(w => w.dir);
      // Kalau sel ini cuma bagian dari 1 kata, arahnya pasti — pakai itu. Kalau persilangan (2 kata),
      // pertahankan arah terakhir asal masih valid di sel ini (biar tidak "lompat" arah tanpa diminta).
      if (dirs.length === 1) ttsDir = dirs[0];
      else if (!dirs.includes(ttsDir)) ttsDir = dirs[0] || ttsDir;
      highlightActiveWord(row, col);
    });

    input.addEventListener('click', () => {
      // Klik ulang sel yang sama yang jadi persilangan 2 kata → tukar arah aktif (across <-> down),
      // sama seperti UX TTS pada umumnya.
      const key = `${row},${col}`;
      const dirs = wordsAtCell(row, col).map(w => w.dir);
      if (dirs.length === 2 && key === lastClickedKey) ttsDir = ttsDir === 'h' ? 'v' : 'h';
      lastClickedKey = key;
      highlightActiveWord(row, col);
    });

    input.addEventListener('input', (e) => {
      const key = e.currentTarget.dataset.ttsCell;
      quizState.ttsAnswers[key] = e.currentTarget.value.slice(-1);
      if (!e.currentTarget.value) return;
      const next = ttsDir === 'h' ? ttsCellInput(row, col + 1) : ttsCellInput(row + 1, col);
      next?.focus();
    });

    input.addEventListener('keydown', (e) => {
      const moves = {
        ArrowRight: ['h', row, col + 1], ArrowLeft: ['h', row, col - 1],
        ArrowDown: ['v', row + 1, col], ArrowUp: ['v', row - 1, col]
      };
      if (moves[e.key]) {
        e.preventDefault();
        const [dir, r, c] = moves[e.key];
        const target = ttsCellInput(r, c);
        if (target) { ttsDir = dir; target.focus(); }
        return;
      }
      if (e.key === 'Backspace' && !e.currentTarget.value) {
        // Sel ini sudah kosong — mundur satu sel searah arah aktif dan hapus isinya juga.
        e.preventDefault();
        const prev = ttsDir === 'h' ? ttsCellInput(row, col - 1) : ttsCellInput(row - 1, col);
        if (prev) {
          prev.value = '';
          quizState.ttsAnswers[prev.dataset.ttsCell] = '';
          prev.focus();
        }
      }
    });
  });

  root.querySelectorAll('[data-clue-word-idx]').forEach(li => {
    li.addEventListener('click', () => {
      const word = puzzle?.words[Number(li.dataset.clueWordIdx)];
      if (!word) return;
      ttsDir = word.dir;
      lastClickedKey = `${word.row},${word.col}`;
      ttsCellInput(word.row, word.col)?.focus();
    });
  });

  root.querySelector('#tts-check-btn')?.addEventListener('click', () => {
    const puzzle = quizState.ttsPuzzle;
    if (!puzzle) return;

    let correctCount = 0;
    puzzle.words.forEach(w => {
      let wordOk = true;
      for (let i = 0; i < w.jawaban.length; i++) {
        const row = w.dir === 'v' ? w.row + i : w.row;
        const col = w.dir === 'h' ? w.col + i : w.col;
        const userChar = (quizState.ttsAnswers[`${row},${col}`] || '').toUpperCase();
        if (userChar !== w.jawaban[i]) wordOk = false;
      }
      if (wordOk) correctCount++;
    });

    quizState.ttsScore = correctCount;
    quizState.ttsChecked = true;
    sfx.playFanfare();
    rerender();
  });
}
