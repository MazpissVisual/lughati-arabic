// Halaman "Rapor" (murid): track record pengerjaan kuis (benar/salah tiap sesi) + catatan guru
// dalam 3 level terpisah — catatan kelas (broadcast), catatan khusus murid ini, dan catatan yang
// nempel di satu baris riwayat pengerjaan tertentu.
import { getQuizScores, formatDuration } from '../progress.js';
import { getMyKelasInfo } from '../kelas.js';
import { getCatatanKelas, getCatatanMurid, getCatatanPengerjaan } from '../catatan.js';
import { getCurrentUser } from '../auth.js';
import { icon } from '../icons.js';

let catatanKelas = [];
let catatanMurid = [];
let catatanPengerjaanMap = {}; // attemptId -> { text, createdAt }
let loading = true;
let loadError = '';
let hasLoadedOnce = false; // dipakai buat nentuin tampilan loading penuh vs stale-while-revalidate

export function renderRapor() {
  const scores = [...getQuizScores()].reverse(); // terbaru dulu

  const catatanKelasHtml = catatanKelas.length ? catatanKelas.map(c => `
    <div class="rapor-note">
      <div class="rapor-note__text">${escapeHtml(c.text)}</div>
      <div class="rapor-note__date">${formatDate(c.createdAt)}</div>
    </div>
  `).join('') : `<div class="rapor-empty">Belum ada catatan untuk kelas ini.</div>`;

  const catatanMuridHtml = catatanMurid.length ? catatanMurid.map(c => `
    <div class="rapor-note">
      <div class="rapor-note__text">${escapeHtml(c.text)}</div>
      <div class="rapor-note__date">${formatDate(c.createdAt)}</div>
    </div>
  `).join('') : `<div class="rapor-empty">Belum ada catatan khusus untukmu.</div>`;

  const riwayatHtml = scores.length ? scores.map(s => {
    const note = s.id ? catatanPengerjaanMap[s.id] : null;
    const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
    const isGood = pct >= 60;
    return `
      <div class="rapor-attempt">
        <div class="rapor-attempt__row">
          <div>
            <div class="rapor-attempt__type">${s.type || 'Kuis'}</div>
            <div class="rapor-attempt__date">${formatDate(s.date)}</div>
            <div class="rapor-attempt__date">Waktu pengerjaan = ${formatDuration(s.durationSec) || '----'}</div>
          </div>
          <div class="rapor-attempt__score ${isGood ? 'is-good' : 'is-bad'}">${s.score}/${s.total} <span>(${pct}%)</span></div>
        </div>
        ${note ? `
          <div class="rapor-note rapor-note--attempt">
            ${icon('message', { size: 12 })}
            <div class="rapor-note__text">${escapeHtml(note.text)}</div>
          </div>
        ` : ''}
      </div>
    `;
  }).join('') : `<div class="rapor-empty">Belum ada riwayat pengerjaan kuis.</div>`;

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <h1 style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">Rapor</h1>
      <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin-top:-8px;">Riwayat pengerjaan kuis dan catatan dari gurumu.</p>

      ${loadError ? `<div class="card" style="text-align:center; padding:var(--space-6); color:var(--color-error);">${loadError}</div>` : ''}

      <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3);">
        <div class="section-title" style="font-size:var(--fs-sm);">${icon('users', { size: 16 })} Catatan untuk Kelas</div>
        ${loading ? `<div class="rapor-empty">Memuat...</div>` : catatanKelasHtml}
      </div>

      <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3);">
        <div class="section-title" style="font-size:var(--fs-sm);">${icon('user', { size: 16 })} Catatan untuk Kamu</div>
        ${loading ? `<div class="rapor-empty">Memuat...</div>` : catatanMuridHtml}
      </div>

      <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3);">
        <div class="section-title" style="font-size:var(--fs-sm);">${icon('clipboard', { size: 16 })} Riwayat Pengerjaan Kuis</div>
        ${loading ? `<div class="rapor-empty">Memuat...</div>` : riwayatHtml}
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// Dipanggil TIAP KALI halaman Rapor dibuka (bukan cuma sekali per sesi) — supaya catatan baru dari
// guru selalu ketarik ulang. Stale-while-revalidate: kalau sudah pernah load sebelumnya, data lama
// tetap tampil (loading=false) sambil diam-diam di-refresh di background, bukan blank ke "Memuat...".
let lastUid = null;

export function mountRapor(rerender) {
  const uid = getCurrentUser()?.uid;
  if (!uid) return;

  // Ganti akun (logout lalu login user lain) di tab yang sama — jangan sempat nampilin catatan
  // milik user sebelumnya sebagai "data lama" saat stale-while-revalidate.
  if (uid !== lastUid) {
    lastUid = uid;
    hasLoadedOnce = false;
    catatanKelas = [];
    catatanMurid = [];
    catatanPengerjaanMap = {};
  }

  loading = !hasLoadedOnce;
  loadError = '';
  rerender();

  const { kelasId } = getMyKelasInfo();

  Promise.all([
    kelasId ? getCatatanKelas(kelasId) : Promise.resolve([]),
    getCatatanMurid(uid),
    getCatatanPengerjaan(uid)
  ]).then(([kelasNotes, muridNotes, pengerjaanNotes]) => {
    catatanKelas = kelasNotes;
    catatanMurid = muridNotes;
    catatanPengerjaanMap = {};
    pengerjaanNotes.forEach(n => { catatanPengerjaanMap[n.attemptId] = n; });
    hasLoadedOnce = true;
  }).catch((err) => {
    console.error('mountRapor failed:', err);
    loadError = 'Gagal memuat catatan dari server. Coba refresh halaman.';
  }).finally(() => {
    loading = false;
    rerender();
  });
}

export function bindRaporEvents() {}
