import { getKuisKategori, getKuisSoal } from '../content.js';
import { saveQuizScore } from '../progress.js';
import { playAudioOrSpeak, sfx } from '../speech.js';
import { icon } from '../icons.js';

const QUIZ_LENGTH = 5;
// Jumlah minimum soal dalam satu kategori/bab supaya tiap pertanyaan punya pilihan jawaban yang wajar.
const MIN_POOL_SIZE = 2;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

const JENIS_META = {
  huruf: { icon: 'puzzle', title: 'Tebak Huruf', desc: 'Cocokkan huruf hijaiyah dengan nama latinnya yang benar.' },
  suara: { icon: 'headphones', title: 'Listening Challenge', desc: 'Dengarkan pelafalan lalu pilih huruf yang sesuai dengan suara tersebut.' },
  kosakata: { icon: 'book', title: 'Tebak Kosakata', desc: 'Uji pemahamanmu terhadap arti kosakata bahasa Arab yang telah dipelajari.' }
};

function kategoriIsReady(kategoriId) {
  return getKuisSoal(kategoriId).length >= MIN_POOL_SIZE;
}

function jenisIsReady(jenis) {
  return getKuisKategori(jenis).some(k => kategoriIsReady(k.id));
}

function buildQuestions(kategoriId) {
  const kategori = getKuisKategori().find(k => k.id === kategoriId);
  if (!kategori) return [];
  const jenis = kategori.jenis;
  const pool = getKuisSoal(kategoriId);
  if (pool.length < MIN_POOL_SIZE) return [];

  const picked = shuffle(pool).slice(0, QUIZ_LENGTH);

  return picked.map((correct) => {
    const distractors = shuffle(pool.filter(s => s.id !== correct.id)).slice(0, 3);
    const options = shuffle([correct, ...distractors]);

    if (jenis === 'huruf') {
      return {
        prompt: 'Huruf apakah ini?',
        subtext: 'Pilihlah nama latin yang tepat untuk huruf di bawah ini:',
        glyph: correct.glyph,
        audioText: correct.glyph,
        audioUrl: correct.audioUrl,
        answer: correct.latin,
        options: options.map(o => o.latin),
        mode: 'huruf',
        explanation: { makhraj: correct.makhraj, desc: correct.desc }
      };
    }
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

export const quizState = {
  kategoriId: null,
  questions: [],
  current: 0,
  score: 0,
  answered: false,
  xpEarned: 0,
  scoreSaved: false, // guard supaya saveQuizScore() tidak pernah kepanggil dobel untuk sesi kuis yang sama
  audioPlayedFor: -1, // index soal terakhir yang audionya sudah di-autoplay
  history: [] // [{ question, chosen, isCorrect }] — dipakai buat ulasan jawaban di layar hasil
};

export function startQuiz(kategoriId) {
  quizState.kategoriId = kategoriId;
  quizState.questions = buildQuestions(kategoriId);
  quizState.current = 0;
  quizState.score = 0;
  quizState.answered = false;
  quizState.xpEarned = 0;
  quizState.scoreSaved = false;
  quizState.audioPlayedFor = -1;
  quizState.history = [];
}

// ---------- Halaman 1: pilih jenis kuis ----------

export function renderKuisList() {
  const cards = Object.entries(JENIS_META).map(([jenisId, m]) => {
    const kategoriList = getKuisKategori(jenisId);
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
  const kategoriList = getKuisKategori(jenis);

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

  if (q.mode === 'huruf' || q.mode === 'suara') {
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
    const displayGlyph = q.isAudioPrompt ? q.audioText : q.glyph;
    const useArabicOptionStyle = q.mode === 'suara'; // opsinya berupa glyph Arab, bukan teks latin/arti

    return `
      <div style="display:flex; gap:var(--space-3); padding:var(--space-3); border-radius:var(--radius-md); background:${isCorrect ? 'var(--color-primary-50)' : 'rgba(239, 68, 68, 0.06)'};">
        <span style="flex-shrink:0; width:22px; height:22px; border-radius:50%; display:grid; place-items:center; font-size:var(--fs-2xs); font-weight:var(--fw-bold); color:#fff; background:${isCorrect ? 'var(--color-primary-500)' : 'var(--color-error)'};">${i + 1}</span>
        <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="arabic" style="font-size:1.3rem;">${displayGlyph}</span>
            <button type="button" class="header-btn" data-replay="${displayGlyph}" data-audio-url="${q.audioUrl || ''}" title="Dengarkan" aria-label="Dengarkan ulang soal ke-${i + 1}" style="width:26px; height:26px;">${icon('volume', { size: 12 })}</button>
          </div>
          <div style="font-size:var(--fs-xs); color:var(--color-ink-600);">
            Jawabanmu: <strong class="${useArabicOptionStyle ? 'arabic' : ''}" style="color:${isCorrect ? 'var(--color-primary-700)' : 'var(--color-error)'};">${chosen}</strong>
            ${isCorrect ? icon('checkCircle', { size: 12 }) : icon('xCircle', { size: 12 })}
          </div>
          ${!isCorrect ? `
            <div style="font-size:var(--fs-xs); color:var(--color-ink-600);">
              Jawaban benar: <strong class="${useArabicOptionStyle ? 'arabic' : ''}" style="color:var(--color-primary-700);">${q.answer}</strong>
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
      const result = saveQuizScore(quizState.score, quizState.questions.length, kategori?.jenis || 'kuis');
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

  const optionsHtml = q.options.map(opt => `
    <button class="quiz-option-btn" data-answer="${opt}">
      <span class="${q.mode === 'suara' ? 'arabic' : ''}" style="${q.mode === 'suara' ? 'font-size:1.8rem;' : ''}">${opt}</span>
      <span class="indicator"></span>
    </button>
  `).join('');

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

        <!-- Answer Options -->
        <div class="quiz-options">
          ${optionsHtml}
        </div>
      </div>
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
}
