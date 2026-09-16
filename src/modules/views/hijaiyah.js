import { hijaiyah } from '../../data/hijaiyah.js';
import { isLetterLearned, markLetterLearned } from '../progress.js';
import { speakArabic } from '../speech.js';

let currentFilter = 'all'; // 'all' | 'learned' | 'unlearned'
let selectedHarakatIndex = 0;

export function renderHijaiyahList() {
  const learnedTotal = hijaiyah.filter(h => isLetterLearned(h.latin)).length;

  const filteredLetters = hijaiyah.filter(h => {
    const learned = isLetterLearned(h.latin);
    if (currentFilter === 'learned') return learned;
    if (currentFilter === 'unlearned') return !learned;
    return true;
  });

  const tiles = filteredLetters.map((h) => {
    const learned = isLetterLearned(h.latin);
    return `
      <a class="letter-tile ${learned ? 'is-learned' : ''}" href="/hijaiyah/${h.id}">
        ${learned ? `<span class="letter-tile__check">✓</span>` : ''}
        <span class="letter-tile__glyph">${h.glyph}</span>
        <span class="letter-tile__label">${h.latin}</span>
      </a>
    `;
  }).join('');

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 class="section-title"><span>🔤</span> Huruf Hijaiyah</h2>
          <p style="font-size:var(--fs-xs); color:var(--color-ink-500); margin-top:2px;">
            ${learnedTotal} dari 28 huruf telah dipelajari
          </p>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="segmented-control">
        <button class="segment-btn ${currentFilter === 'all' ? 'is-active' : ''}" data-filter="all">Semua (28)</button>
        <button class="segment-btn ${currentFilter === 'learned' ? 'is-active' : ''}" data-filter="learned">Dikuasai (${learnedTotal})</button>
        <button class="segment-btn ${currentFilter === 'unlearned' ? 'is-active' : ''}" data-filter="unlearned">Belum (${28 - learnedTotal})</button>
      </div>

      <!-- Letter Grid -->
      <div class="letter-grid">
        ${tiles.length > 0 ? tiles : '<div style="grid-column: 1 / -1; text-align:center; padding:32px; color:var(--color-ink-500);">Tidak ada huruf pada filter ini.</div>'}
      </div>
    </div>
  `;
}

export function bindHijaiyahListEvents(root, rerender) {
  root.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentFilter = e.currentTarget.dataset.filter;
      rerender();
    });
  });
}

export function renderHijaiyahDetail(index) {
  const h = hijaiyah[Number(index)];
  if (!h) {
    return `
      <div class="card" style="text-align:center; padding:var(--space-8);">
        <p>Huruf tidak ditemukan.</p>
        <a class="btn btn--primary" href="/hijaiyah" style="margin-top:var(--space-4);">Kembali ke Daftar</a>
      </div>
    `;
  }

  // Mark as learned & earn XP
  markLetterLearned(h.latin);

  const prevIdx = Number(index) - 1;
  const nextIdx = Number(index) + 1;
  const prevLetter = hijaiyah[prevIdx];
  const nextLetter = hijaiyah[nextIdx];

  const currentHarakat = h.harakat[selectedHarakatIndex] || h.harakat[0];

  const harakatTabsHtml = h.harakat.map((hk, idx) => `
    <button class="harakat-tab-btn ${idx === selectedHarakatIndex ? 'is-active' : ''}" data-harakat-idx="${idx}">
      <span class="harakat-tab-glyph">${hk.glyph}</span>
      <span class="harakat-tab-sound">${hk.sound}</span>
    </button>
  `).join('');

  const examplesHtml = (h.examples || []).map(ex => `
    <div class="card" style="display:flex; align-items:center; justify-content:space-between; padding:var(--space-3) var(--space-4);">
      <div style="display:flex; flex-direction:column; gap:2px;">
        <span class="arabic" style="font-size:1.5rem; color:var(--color-primary-700);">${ex.glyph}</span>
        <span style="font-size:var(--fs-xs); font-weight:var(--fw-bold);">${ex.latin} — <span style="font-weight:var(--fw-regular); color:var(--color-ink-600);">${ex.meaning}</span></span>
      </div>
      <button class="word-audio-btn" data-speak="${ex.sound}" title="Dengarkan Contoh">
        🔊
      </button>
    </div>
  `).join('');

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <!-- Top Navigation back -->
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <a class="btn btn--outline" href="/hijaiyah" style="width:auto; height:36px; padding:0 12px; font-size:var(--fs-xs);">
          ← Daftar Huruf
        </a>
        <span class="badge" style="background:var(--color-primary-50); color:var(--color-primary-700); font-size:var(--fs-xs); padding:4px 10px;">
          Huruf Ke-${h.id + 1} dari 28
        </span>
      </div>

      <!-- Main Letter Hero Card -->
      <div class="detail-hero-box">
        <div class="detail-hero-glyph" id="main-glyph">${currentHarakat.glyph}</div>
        <div class="detail-hero-latin" id="main-latin">${h.latin} (${currentHarakat.sound})</div>
        
        <button class="play-audio-btn" id="play-main-audio" data-speak="${currentHarakat.audio}" title="Putar Suara">
          🔊
        </button>
        <span style="font-size:var(--fs-2xs); color:var(--color-ink-500);">Ketuk tombol untuk mendengar pelafalan</span>

        <!-- Harakat Selector -->
        <div style="width:100%; margin-top:var(--space-2);">
          <div style="font-size:var(--fs-2xs); font-weight:var(--fw-bold); color:var(--color-ink-600); margin-bottom:6px; text-transform:uppercase;">
            Pilih Tanda Harakat:
          </div>
          <div class="harakat-tabs">
            ${harakatTabsHtml}
          </div>
        </div>
      </div>

      <!-- Makharijul Huruf Info -->
      <div class="makhraj-box">
        <div class="makhraj-title">📍 Makharijul Huruf (Tempat Keluar):</div>
        <div class="makhraj-desc"><strong>${h.makhraj}</strong></div>
        <div class="makhraj-desc" style="margin-top:4px;">${h.desc}</div>
      </div>

      <!-- Examples Section -->
      <div>
        <h3 class="section-title" style="font-size:var(--fs-md); margin-bottom:var(--space-2);">
          <span>💡</span> Contoh Kata
        </h3>
        <div style="display:flex; flex-direction:column; gap:var(--space-2);">
          ${examplesHtml}
        </div>
      </div>

      <!-- Next / Prev Letter Navigation -->
      <div style="display:flex; gap:var(--space-3); margin-top:var(--space-2);">
        ${prevLetter ? `
          <a class="btn btn--outline" href="/hijaiyah/${prevIdx}" style="flex:1;">
            ← ${prevLetter.latin}
          </a>
        ` : `<div style="flex:1;"></div>`}

        ${nextLetter ? `
          <a class="btn btn--primary" href="/hijaiyah/${nextIdx}" style="flex:1;">
            ${nextLetter.latin} →
          </a>
        ` : `<div style="flex:1;"></div>`}
      </div>
    </div>
  `;
}

export function bindHijaiyahDetailEvents(root, letterIndex, rerender) {
  const h = hijaiyah[Number(letterIndex)];
  if (!h) return;

  // Harakat tab switching
  root.querySelectorAll('[data-harakat-idx]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.currentTarget.dataset.harakatIdx);
      selectedHarakatIndex = idx;
      const curHarakat = h.harakat[idx];
      
      // Update UI elements directly without reloading whole view
      const glyphEl = root.querySelector('#main-glyph');
      const latinEl = root.querySelector('#main-latin');
      const playBtn = root.querySelector('#play-main-audio');
      
      if (glyphEl) glyphEl.textContent = curHarakat.glyph;
      if (latinEl) latinEl.textContent = `${h.latin} (${curHarakat.sound})`;
      if (playBtn) playBtn.dataset.speak = curHarakat.audio;

      root.querySelectorAll('[data-harakat-idx]').forEach(b => b.classList.remove('is-active'));
      e.currentTarget.classList.add('is-active');

      speakArabic(curHarakat.audio);
    });
  });

  // Main audio play
  root.querySelector('#play-main-audio')?.addEventListener('click', (e) => {
    speakArabic(e.currentTarget.dataset.speak);
  });

  // Example audios
  root.querySelectorAll('[data-speak]').forEach(btn => {
    if (btn.id !== 'play-main-audio') {
      btn.addEventListener('click', (e) => {
        speakArabic(e.currentTarget.dataset.speak);
      });
    }
  });
}
