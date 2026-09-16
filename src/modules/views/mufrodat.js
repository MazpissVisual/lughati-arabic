import { getKategori, getKosakata } from '../content.js';
import { markWordLearned, isWordLearned } from '../progress.js';
import { playAudioOrSpeak } from '../speech.js';
import { icon } from '../icons.js';
import { navigate } from '../router.js';

export function renderMufrodatList() {
  const kategori = getKategori();
  const kosakata = getKosakata();
  const lessons = kategori.filter(k => k.id !== 'semua');
  const cards = lessons.map(lesson => {
    const words = kosakata.filter(w => w.kategori === lesson.id);
    const learnedCount = words.filter(w => isWordLearned(w.id)).length;
    const isDone = learnedCount === words.length;
    return `
      <a class="lesson-card" href="/mufrodat/${lesson.id}">
        <div class="lesson-illustration lesson-illustration--${lesson.theme}">
          <span class="lesson-illustration__badge">${icon(lesson.icon, { size: 26 })}</span>
          <span class="lesson-badge">BAB ${lesson.bab}</span>
        </div>
        <div class="lesson-body">
          <div class="lesson-arabic">${lesson.arabicTitle}</div>
          <div class="lesson-title">${lesson.subtitle}</div>
          <div class="lesson-desc">${lesson.desc}</div>
          <div class="lesson-footer">
            <span>${learnedCount}/${words.length}</span>
            ${isDone
              ? `<span class="lesson-footer__done">${icon('checkCircle', { size: 16 })}</span>`
              : `<span class="lesson-footer__play">${icon('play', { size: 13 })}</span>`}
          </div>
        </div>
      </a>
    `;
  }).join('');

  return `
    <h1 style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">Modul Mufrodat</h1>
    <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin:var(--space-2) 0 var(--space-6);">
      Kuasai kosakata baru melalui flashcard interaktif dan audio pelafalan asli.
    </p>
    <div class="lesson-grid">${cards}</div>
  `;
}

export function renderMufrodatLesson(lessonId, index = 0) {
  const lesson = getKategori().find(k => k.id === lessonId);
  if (!lesson) return `<div class="card">Modul tidak ditemukan. <a href="/mufrodat">Kembali</a></div>`;

  const words = getKosakata().filter(w => w.kategori === lessonId);
  if (words.length === 0) {
    return `<div class="card">Bab ini belum punya kata. <a href="/mufrodat">Kembali</a></div>`;
  }

  const i = Math.min(Math.max(Number(index) || 0, 0), words.length - 1);
  const word = words[i];
  markWordLearned(word.id);

  const pct = Math.round(((i + 1) / words.length) * 100);
  const isLast = i === words.length - 1;

  const contohMatch = word.contoh?.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const contohArabic = contohMatch ? contohMatch[1].trim() : word.contoh;
  const contohTranslation = contohMatch ? contohMatch[2].trim() : '';

  return `
    <div class="lesson-page-compact">
      <a href="/mufrodat" style="font-size:var(--fs-xs); color:var(--color-ink-500); display:inline-flex; align-items:center; gap:4px;">${icon('chevronLeft', { size: 13 })} ${lesson.subtitle}</a>

      <div class="flashcard-duo">
        <div class="flashcard-split flashcard-image">
          ${word.gambarUrl
            ? `<img src="${word.gambarUrl}" alt="${word.arti}" class="flashcard-image__img">`
            : `<div class="flashcard-image__placeholder">${icon('palette', { size: 36 })}</div>`}
        </div>

        <div class="flip-card" id="flip-card">
          <div class="flip-card__inner">
            <div class="flashcard-split flip-card__face flip-card__face--front">
              <button class="flashcard-info__play" data-speak="${word.glyph}" data-audio-url="${word.audioUrl || ''}" aria-label="Dengarkan pelafalan ${word.arti}">${icon('volume', { size: 20 })}</button>
              <div class="flashcard-split__content">
                <div class="flashcard-split__glyph arabic">${word.glyph}</div>
                <div class="flashcard-split__phonetic-pill">${word.latin.toLowerCase()}</div>
                <div class="flashcard-split__title">${word.arti}</div>
              </div>
              <button class="flip-card__toggle" id="flip-toggle" type="button">${icon('refresh', { size: 13 })} Balik Kartu</button>
            </div>
            <div class="flashcard-split flip-card__face flip-card__face--back">
              <button class="flashcard-info__play" data-speak="${contohArabic || word.glyph}" data-audio-url="" aria-label="Dengarkan contoh kalimat">${icon('volume', { size: 20 })}</button>
              <div class="flashcard-split__content">
                ${word.contoh
                  ? `<div class="flashcard-split__example arabic">${contohArabic}</div>
                     ${contohTranslation ? `<div class="flashcard-split__example-translation">${contohTranslation}</div>` : ''}`
                  : `<div class="flashcard-split__example flashcard-split__example--empty">Belum ada contoh kalimat.</div>`}
              </div>
              <button class="flip-card__toggle" id="flip-toggle-back" type="button">${icon('refresh', { size: 13 })} Balik Kartu</button>
            </div>
          </div>
        </div>
      </div>

      <div class="lesson-nav-bar">
        <div class="lesson-nav-bar__pagination">
          <button class="lesson-nav-bar__btn" id="prev-word" aria-label="Kata sebelumnya" ${i === 0 ? 'disabled' : ''}>${icon('chevronLeft', { size: 16 })}</button>
          <div class="lesson-nav-bar__track"><div class="lesson-nav-bar__fill" style="width:${pct}%"></div></div>
          <span class="lesson-nav-bar__label">${i + 1} / ${words.length}</span>
          <button class="lesson-nav-bar__btn" id="next-word" aria-label="Kata berikutnya" ${isLast ? 'disabled' : ''}>${icon('chevronRight', { size: 16 })}</button>
        </div>
        <a class="btn btn--gold" style="width:auto; display:inline-flex; align-items:center; gap:6px;" href="/kuis">
          ${isLast ? 'Selesai — Lanjut ke Kuis' : 'Lanjut ke Latihan'} ${icon('arrowRight', { size: 15 })}
        </a>
      </div>
    </div>
  `;
}

export function bindMufrodatListEvents() {}

export function bindMufrodatLessonEvents(root, lessonId, index, router) {
  root.querySelectorAll('[data-speak]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playAudioOrSpeak(e.currentTarget.dataset.audioUrl, e.currentTarget.dataset.speak);
    });
  });
  const toggleFlip = (e) => {
    e.stopPropagation();
    root.querySelector('#flip-card')?.classList.toggle('is-flipped');
  };
  root.querySelector('#flip-toggle')?.addEventListener('click', toggleFlip);
  root.querySelector('#flip-toggle-back')?.addEventListener('click', toggleFlip);
  root.querySelector('#flip-card')?.addEventListener('click', () => {
    root.querySelector('#flip-card')?.classList.toggle('is-flipped');
  });
  root.querySelector('#prev-word')?.addEventListener('click', () => {
    navigate(`/mufrodat/${lessonId}/${Math.max(0, Number(index) - 1)}`);
  });
  root.querySelector('#next-word')?.addEventListener('click', () => {
    navigate(`/mufrodat/${lessonId}/${Number(index) + 1}`);
  });
}
