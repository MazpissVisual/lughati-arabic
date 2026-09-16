import { getKategori, getKosakata } from '../content.js';
import { speakArabic } from '../speech.js';
import { markWordLearned, isWordLearned } from '../progress.js';

let activeCategory = 'semua';
let searchQuery = '';
let viewMode = 'list'; // 'list' | 'flashcard'
let flashcardIndex = 0;
let isFlipped = false;

export function renderKosakataList(catParam = null) {
  if (catParam) activeCategory = catParam;

  const kategori = getKategori();
  const kosakata = getKosakata();

  // Filter items
  let filtered = kosakata;
  if (activeCategory !== 'semua') {
    filtered = filtered.filter(w => w.kategori === activeCategory);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(w => 
      w.latin.toLowerCase().includes(q) ||
      w.arti.toLowerCase().includes(q) ||
      w.glyph.includes(q)
    );
  }

  // Categories chips
  const categoryChipsHtml = kategori.map(k => `
    <button class="category-chip ${k.id === activeCategory ? 'is-active' : ''}" data-cat="${k.id}">
      <span>${k.icon}</span> ${k.label}
    </button>
  `).join('');

  // List view HTML
  const listItemsHtml = filtered.map(w => {
    const learned = isWordLearned(w.id);
    return `
      <li class="word-row">
        <span class="word-row__glyph arabic">${w.glyph}</span>
        <div class="word-row__body">
          <div class="word-row__latin">${w.latin}</div>
          <div class="word-row__meaning">${w.arti}</div>
          ${w.contoh ? `<div class="word-row__example">${w.contoh}</div>` : ''}
        </div>
        <button class="word-audio-btn" data-speak="${w.glyph}" title="Putar Suara">
          🔊
        </button>
      </li>
    `;
  }).join('');

  // Flashcard view HTML
  let flashcardHtml = '';
  if (filtered.length > 0) {
    if (flashcardIndex >= filtered.length) flashcardIndex = 0;
    const currentWord = filtered[flashcardIndex];
    markWordLearned(currentWord.id);

    flashcardHtml = `
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="display:flex; justify-content:space-between; width:100%; font-size:var(--fs-xs); color:var(--color-ink-500); margin-bottom:var(--space-2);">
          <span>Kartu <strong>${flashcardIndex + 1}</strong> dari ${filtered.length}</span>
          <span>Ketuk kartu untuk membalik 🔄</span>
        </div>

        <div class="flashcard-wrapper" id="flashcard-card">
          <div class="flashcard-inner ${isFlipped ? 'is-flipped' : ''}" id="flashcard-inner">
            <!-- Front of Card -->
            <div class="flashcard-front">
              <span class="flashcard-hint">Bahasa Arab</span>
              <div class="flashcard-arabic">${currentWord.glyph}</div>
              <button class="play-audio-btn" data-speak="${currentWord.glyph}" style="width:48px; height:48px; font-size:1.2rem;" title="Putar Suara">
                🔊
              </button>
              <span class="flashcard-hint" style="font-size:var(--fs-2xs);">Sentuh untuk melihat arti</span>
            </div>

            <!-- Back of Card -->
            <div class="flashcard-back">
              <span class="flashcard-hint">Terjemahan & Contoh</span>
              <div>
                <div class="flashcard-latin">${currentWord.latin}</div>
                <div class="flashcard-meaning">${currentWord.arti}</div>
              </div>
              ${currentWord.contoh ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-600); background:var(--color-surface); padding:8px 14px; border-radius:var(--radius-md);">${currentWord.contoh}</div>` : ''}
              <button class="play-audio-btn" data-speak="${currentWord.glyph}" style="width:44px; height:44px; font-size:1.1rem;">
                🔊
              </button>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div style="display:flex; gap:var(--space-3); width:100%; margin-top:var(--space-2);">
          <button class="btn btn--outline" id="prev-card" style="flex:1;" ${flashcardIndex === 0 ? 'disabled' : ''}>
            ← Sebelumnya
          </button>
          <button class="btn btn--primary" id="next-card" style="flex:1;">
            ${flashcardIndex === filtered.length - 1 ? 'Ulangi ↺' : 'Berikutnya →'}
          </button>
        </div>
      </div>
    `;
  } else {
    flashcardHtml = `<div class="card" style="text-align:center; padding:32px; color:var(--color-ink-500);">Kosakata tidak ditemukan.</div>`;
  }

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 class="section-title"><span>📚</span> Kosakata Bahasa Arab</h2>
          <p style="font-size:var(--fs-xs); color:var(--color-ink-500); margin-top:2px;">
            ${filtered.length} kosakata tersedia
          </p>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-bar">
        <span>🔍</span>
        <input type="text" id="search-input" placeholder="Cari kata (contoh: Ayah, Kitab, قَلَم)..." value="${searchQuery}" />
        ${searchQuery ? `<button id="clear-search" style="color:var(--color-ink-400); font-size:1.1rem;">✕</button>` : ''}
      </div>

      <!-- View Mode Switcher (List vs Flashcards) -->
      <div class="segmented-control">
        <button class="segment-btn ${viewMode === 'list' ? 'is-active' : ''}" data-view="list">
          📋 Mode Daftar
        </button>
        <button class="segment-btn ${viewMode === 'flashcard' ? 'is-active' : ''}" data-view="flashcard">
          🎴 Mode Flashcard 3D
        </button>
      </div>

      <!-- Categories Scrollable Chips -->
      <div class="category-scroll">
        ${categoryChipsHtml}
      </div>

      <!-- Main Content Area -->
      ${viewMode === 'list' ? `
        <ul style="display:flex; flex-direction:column; gap:var(--space-2);">
          ${filtered.length > 0 ? listItemsHtml : '<div class="card" style="text-align:center; padding:32px; color:var(--color-ink-500);">Tidak ada kosakata yang cocok.</div>'}
        </ul>
      ` : flashcardHtml}
    </div>
  `;
}

export function bindKosakataEvents(root, rerender) {
  // Category switching
  root.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeCategory = e.currentTarget.dataset.cat;
      flashcardIndex = 0;
      isFlipped = false;
      rerender();
    });
  });

  // View mode switching
  root.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      viewMode = e.currentTarget.dataset.view;
      isFlipped = false;
      rerender();
    });
  });

  // Search input
  const searchInput = root.querySelector('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      flashcardIndex = 0;
      rerender();
      // Keep focus on input after rerender
      const newSearch = root.querySelector('#search-input');
      if (newSearch) {
        newSearch.focus();
        newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
      }
    });
  }

  // Clear search
  root.querySelector('#clear-search')?.addEventListener('click', () => {
    searchQuery = '';
    rerender();
  });

  // Audio buttons
  root.querySelectorAll('[data-speak]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      speakArabic(e.currentTarget.dataset.speak);
    });
  });

  // Flashcard Flip
  const flashcardInner = root.querySelector('#flashcard-inner');
  if (flashcardInner) {
    flashcardInner.addEventListener('click', () => {
      isFlipped = !isFlipped;
      flashcardInner.classList.toggle('is-flipped', isFlipped);
    });
  }

  // Flashcard Prev / Next
  root.querySelector('#prev-card')?.addEventListener('click', () => {
    if (flashcardIndex > 0) {
      flashcardIndex--;
      isFlipped = false;
      rerender();
    }
  });

  root.querySelector('#next-card')?.addEventListener('click', () => {
    isFlipped = false;
    flashcardIndex++;
    rerender();
  });
}
