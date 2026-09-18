import { getTopikMuhadatsah } from '../content.js';
import { getMyKelasInfo } from '../kelas.js';
import { getCurrentRole } from '../auth.js';
import { playAudioOrSpeak } from '../speech.js';
import { icon } from '../icons.js';

// Guru (Pratinjau Muhadatsah di sidebar) tetap lihat semua tingkat sekaligus; murid difilter
// sesuai tingkat kelasnya (murid yang belum join kelas tetap lihat semua, biar tidak "nyangkut").
function myTopikList() {
  const tingkat = getCurrentRole() === 'murid' ? getMyKelasInfo().tingkat : null;
  return getTopikMuhadatsah(tingkat);
}

export function renderMuhadatsahList() {
  const cards = myTopikList().map(topik => `
    <a class="lesson-card" href="/muhadatsah/${topik.id}">
      <div class="lesson-illustration lesson-illustration--indigo">
        <span class="lesson-illustration__badge">${icon(topik.icon, { size: 26 })}</span>
        <span class="lesson-badge lesson-badge--level">${icon(topik.level === 'Dasar' ? 'check' : 'signal', { size: 11 })} ${topik.level}</span>
      </div>
      <div class="lesson-body">
        <div class="lesson-arabic">${topik.arabicTitle}</div>
        <div class="lesson-title">${topik.title}</div>
        <div class="lesson-desc">${topik.desc}</div>
        <div class="lesson-footer">
          <span>${icon('message', { size: 14 })} ${topik.dialog.length} Percakapan</span>
          <span class="lesson-footer__play">${icon('play', { size: 13 })}</span>
        </div>
      </div>
    </a>
  `).join('');

  return `
    <h1 style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">Muhadatsah</h1>
    <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin:var(--space-1) 0 var(--space-4); max-width:640px;">
      Latih kemampuan berbicara bahasa Arab Anda melalui percakapan sehari-hari. Pilih topik di bawah ini untuk memulai latihan.
    </p>
    <div class="lesson-grid">${cards}</div>
  `;
}

export function renderMuhadatsahDetail(topikId) {
  const topik = myTopikList().find(t => t.id === topikId);
  if (!topik) return `<div class="card">Topik tidak ditemukan. <a href="/muhadatsah">Kembali</a></div>`;

  const rows = topik.dialog.map(line => `
    <div class="chat-row ${line.side === 'right' ? 'chat-row--right' : ''}">
      <span class="chat-avatar">${line.speaker[0]}</span>
      <div class="chat-bubble">
        <span class="chat-bubble__speaker">${line.speaker}</span>
        <div class="chat-bubble__arabic arabic">${line.arabic}</div>
        <div class="chat-bubble__translation">${line.translation}</div>
        <button class="chat-bubble__play" data-speak="${line.arabic}" data-audio-url="${line.audioUrl || ''}" aria-label="Dengarkan ucapan ${line.speaker}">${icon('play', { size: 13 })}</button>
      </div>
    </div>
  `).join('');

  return `
    <div class="chat-header">
      <div>
        <a href="/muhadatsah" class="chat-header__back" style="display:inline-flex; align-items:center; gap:4px;">${icon('chevronLeft', { size: 14 })} Kembali</a>
        <h1 class="chat-header__title">${topik.title}</h1>
      </div>
      <span class="chat-toggle">Tampilkan Terjemahan <span class="chat-toggle__switch"></span></span>
    </div>
    <div class="card" style="padding: var(--space-6);">
      <div class="chat-list">${rows}</div>
    </div>
  `;
}

export function bindMuhadatsahListEvents() {}

export function bindMuhadatsahDetailEvents(root) {
  root.querySelectorAll('[data-speak]').forEach(btn => {
    btn.addEventListener('click', (e) => playAudioOrSpeak(e.currentTarget.dataset.audioUrl, e.currentTarget.dataset.speak));
  });
}
