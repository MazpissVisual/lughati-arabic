import { getMateriKategori, getMateriBlok } from '../content.js';
import { getMyKelasInfo } from '../kelas.js';
import { getCurrentRole } from '../auth.js';
import { icon } from '../icons.js';

function renderNoKelasNotice() {
  return `
    <div class="card" style="text-align:center; padding:var(--space-8); color:var(--color-ink-500);">
      <div style="margin-bottom:var(--space-2);">${icon('info', { size: 24 })}</div>
      Gabung kelas dulu (lewat halaman Profil) supaya materi untuk tingkatmu bisa ditampilkan.
    </div>
  `;
}

// Guru tidak punya kelas/tingkat sendiri — "Pratinjau Materi" di sidebar guru menampilkan SEMUA
// tingkat sekaligus (label tingkat ditempel di tiap kartu), sama seperti pola Pratinjau
// Mufrodat/Muhadatsah yang sudah ada. Murid tetap difilter ketat sesuai tingkat kelasnya.
export function renderMateriList() {
  const isGuru = getCurrentRole() === 'guru';
  const { tingkat } = getMyKelasInfo();

  if (!isGuru && !tingkat) {
    return `
      <h1 style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">Materi</h1>
      <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin:var(--space-2) 0 var(--space-6);">Bacaan dan materi interaktif dari gurumu.</p>
      ${renderNoKelasNotice()}
    `;
  }

  const kategoriList = isGuru ? getMateriKategori() : getMateriKategori(tingkat);

  const cards = kategoriList.map(k => {
    const jumlahBlok = getMateriBlok(k.id).length;
    return `
      <a class="lesson-card" href="/materi/${k.id}">
        <div class="lesson-illustration lesson-illustration--indigo">
          <span class="lesson-illustration__badge">${icon('book', { size: 26 })}</span>
        </div>
        <div class="lesson-body">
          <div class="lesson-title">${k.judul} ${isGuru && k.tingkat ? `<span style="font-weight:var(--fw-regular); color:var(--color-ink-400); font-size:var(--fs-xs);">(Kelas ${k.tingkat})</span>` : ''}</div>
          <div class="lesson-desc">${jumlahBlok} bagian materi</div>
        </div>
      </a>
    `;
  }).join('');

  return `
    <h1 style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">Materi${!isGuru ? ` — Kelas ${tingkat}` : ''}</h1>
    <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin:var(--space-2) 0 var(--space-6);">Bacaan dan materi interaktif dari gurumu.</p>
    ${kategoriList.length
      ? `<div class="lesson-grid">${cards}</div>`
      : `<div class="card" style="text-align:center; padding:var(--space-8); color:var(--color-ink-500);">Belum ada materi${!isGuru ? ` untuk Kelas ${tingkat}` : ''}.</div>`}
  `;
}

function renderBlok(b) {
  if (b.tipe === 'text') {
    return `<div class="card" style="white-space:pre-wrap; line-height:1.7; font-size:var(--fs-sm); color:var(--color-ink-800);">${b.isi}</div>`;
  }
  if (b.tipe === 'tabel') {
    const rows = (b.rows || []).map(r => r.cells || []);
    const [header, ...body] = rows;
    return `
      <div class="card" style="overflow-x:auto; padding:var(--space-3);">
        <table style="width:100%; border-collapse:collapse; font-size:var(--fs-sm);">
          ${header ? `
            <thead>
              <tr style="border-bottom:2px solid var(--color-ink-200); text-align:left;">
                ${header.map(h => `<th style="padding:8px 12px;">${h}</th>`).join('')}
              </tr>
            </thead>
          ` : ''}
          <tbody>
            ${body.map(r => `
              <tr style="border-bottom:1px solid var(--color-ink-100);">
                ${r.map(c => `<td style="padding:8px 12px;">${c}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  if (b.tipe === 'gambar') {
    return `
      <div class="card" style="padding:var(--space-3); text-align:center;">
        <img src="${b.url}" alt="${b.caption || ''}" style="max-width:100%; border-radius:var(--radius-md);">
        ${b.caption ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-500); margin-top:6px;">${b.caption}</div>` : ''}
      </div>
    `;
  }
  return '';
}

export function renderMateriDetail(kategoriId) {
  const isGuru = getCurrentRole() === 'guru';
  const { tingkat } = getMyKelasInfo();
  if (!isGuru && !tingkat) return renderNoKelasNotice();

  const kategori = (isGuru ? getMateriKategori() : getMateriKategori(tingkat)).find(k => k.id === kategoriId);
  if (!kategori) return `<div class="card">Materi tidak ditemukan. <a href="/materi">Kembali</a></div>`;

  const blokList = getMateriBlok(kategoriId);

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <a href="/materi" style="font-size:var(--fs-xs); color:var(--color-ink-500); display:inline-flex; align-items:center; gap:4px;">${icon('chevronLeft', { size: 13 })} Materi</a>
      <h1 style="font-size:var(--fs-xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">${kategori.judul}</h1>
      ${blokList.length ? blokList.map(renderBlok).join('') : `<div class="card" style="text-align:center; padding:var(--space-6); color:var(--color-ink-400);">Materi ini belum berisi konten.</div>`}
    </div>
  `;
}

export function bindMateriListEvents() {}
export function bindMateriDetailEvents() {}
