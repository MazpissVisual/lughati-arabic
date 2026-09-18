import { getMateriKategori, getMateriBlok, getCpTp } from '../content.js';
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

function showCpTpModal(isGuru, tingkat) {
  const container = document.getElementById('modal-container') || document.body;

  let bodyHtml = '';
  if (!isGuru) {
    const data = getCpTp(tingkat);
    bodyHtml = `
      ${data.cp ? `
        <div style="background:var(--color-primary-50); padding:var(--space-4); border-radius:var(--radius-md); border-left:4px solid var(--color-primary-600);">
          <div style="font-size:var(--fs-xs); font-weight:var(--fw-bold); color:var(--color-primary-800); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Capaian Pembelajaran (CP)</div>
          <div style="font-size:var(--fs-sm); color:var(--color-ink-800); line-height:1.6; white-space:pre-wrap;">${data.cp}</div>
        </div>
      ` : ''}
      ${data.tp ? `
        <div style="background:var(--color-surface); border:1px solid var(--color-ink-200); padding:var(--space-4); border-radius:var(--radius-md);">
          <div style="font-size:var(--fs-xs); font-weight:var(--fw-bold); color:var(--color-primary-700); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Tujuan Pembelajaran (TP)</div>
          <div style="font-size:var(--fs-sm); color:var(--color-ink-700); line-height:1.6; white-space:pre-wrap;">${data.tp}</div>
        </div>
      ` : ''}
    `;
  } else {
    const levels = ['X', 'XI', 'XII'];
    const entries = levels.map(t => ({ tingkat: t, data: getCpTp(t) })).filter(e => e.data.cp || e.data.tp);
    if (entries.length === 0) {
      bodyHtml = `<div style="color:var(--color-ink-500); font-size:var(--fs-sm); text-align:center; padding:var(--space-4);">Belum ada Capaian & Tujuan Pembelajaran yang diisi di CMS.</div>`;
    } else {
      bodyHtml = entries.map(e => `
        <div style="display:flex; flex-direction:column; gap:var(--space-2); margin-bottom:var(--space-4);">
          <div style="font-size:var(--fs-xs); font-weight:var(--fw-bold); color:var(--color-primary-600); background:var(--color-primary-50); padding:4px 10px; border-radius:var(--radius-sm); width:fit-content;">Kelas ${e.tingkat}</div>
          ${e.data.cp ? `
            <div style="background:var(--color-primary-50); padding:var(--space-3) var(--space-4); border-radius:var(--radius-md); border-left:3px solid var(--color-primary-600);">
              <div style="font-size:var(--fs-xs); font-weight:var(--fw-bold); color:var(--color-primary-800); margin-bottom:2px;">Capaian Pembelajaran (CP)</div>
              <div style="font-size:var(--fs-sm); color:var(--color-ink-800); line-height:1.5; white-space:pre-wrap;">${e.data.cp}</div>
            </div>
          ` : ''}
          ${e.data.tp ? `
            <div style="background:var(--color-surface); border:1px solid var(--color-ink-200); padding:var(--space-3) var(--space-4); border-radius:var(--radius-md);">
              <div style="font-size:var(--fs-xs); font-weight:var(--fw-bold); color:var(--color-primary-700); margin-bottom:2px;">Tujuan Pembelajaran (TP)</div>
              <div style="font-size:var(--fs-sm); color:var(--color-ink-700); line-height:1.5; white-space:pre-wrap;">${e.data.tp}</div>
            </div>
          ` : ''}
        </div>
      `).join('');
    }
  }

  const modalDiv = document.createElement('div');
  modalDiv.id = 'cptp-modal-wrapper';
  modalDiv.innerHTML = `
    <div class="modal-overlay" id="cptp-modal-overlay">
      <div class="modal-content">
        <div class="modal-handle"></div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:var(--space-3); border-bottom:1px solid var(--color-ink-100);">
          <div>
            <h3 style="font-size:var(--fs-md); font-weight:var(--fw-bold); color:var(--color-primary-700); display:flex; align-items:center; gap:8px;">
              ${icon('bulb', { size: 18 })} Capaian & Tujuan Pembelajaran
            </h3>
            ${!isGuru && tingkat ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-500); margin-top:2px;">Kelas ${tingkat}</div>` : ''}
          </div>
          <button id="close-cptp-modal-btn" style="color:var(--color-ink-500); cursor:pointer; padding:4px;" aria-label="Tutup">${icon('x', { size: 18 })}</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:var(--space-3); margin:var(--space-2) 0; max-height:60vh; overflow-y:auto; padding-right:2px;">
          ${bodyHtml}
        </div>

        <button class="btn btn--primary" id="confirm-cptp-modal-btn">
          Tutup
        </button>
      </div>
    </div>
  `;

  const closeModal = () => modalDiv.remove();

  container.appendChild(modalDiv);

  modalDiv.querySelector('#cptp-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'cptp-modal-overlay') closeModal();
  });
  modalDiv.querySelector('#close-cptp-modal-btn')?.addEventListener('click', closeModal);
  modalDiv.querySelector('#confirm-cptp-modal-btn')?.addEventListener('click', closeModal);
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
      <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin:var(--space-1) 0 var(--space-4);">Bacaan dan materi interaktif dari gurumu.</p>
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
          <span class="lesson-badge">BAB ${k.bab}</span>
        </div>
        <div class="lesson-body">
          <div class="lesson-title">${k.judul} ${isGuru && k.tingkat ? `<span style="font-weight:var(--fw-regular); color:var(--color-ink-400); font-size:var(--fs-xs);">(Kelas ${k.tingkat})</span>` : ''}</div>
          <div class="lesson-desc">${jumlahBlok} bagian materi</div>
        </div>
      </a>
    `;
  }).join('');

  const cpTp = !isGuru ? getCpTp(tingkat) : null;
  const hasCpTp = !isGuru
    ? (cpTp && (cpTp.cp || cpTp.tp))
    : ['X', 'XI', 'XII'].some(t => { const data = getCpTp(t); return data.cp || data.tp; });

  const cptpBtnHtml = hasCpTp ? `
    <button class="btn btn--outline" id="btn-show-cptp" style="display:inline-flex; align-items:center; gap:6px; font-size:var(--fs-xs); width:auto; padding:6px 14px; border-color:var(--color-primary-200); color:var(--color-primary-700); background:var(--color-primary-50); border-radius:var(--radius-full); transition:all 0.2s ease;">
      ${icon('bulb', { size: 15 })} <span>Lihat Capaian & Tujuan Pembelajaran (CP/TP)</span>
    </button>
  ` : '';

  return `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--space-3); margin-bottom:var(--space-4);">
      <div>
        <h1 style="font-size:var(--fs-2xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">Materi${!isGuru ? ` — Kelas ${tingkat}` : ''}</h1>
        <p style="color:var(--color-ink-500); font-size:var(--fs-sm); margin-top:2px;">Bacaan dan materi interaktif dari gurumu.</p>
      </div>
      ${cptpBtnHtml}
    </div>
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
        <img src="${b.url}" alt="${b.caption || ''}" style="max-width:100%; width:auto; max-height:360px; border-radius:var(--radius-md); display:inline-block;">
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
      <a href="/materi" class="back-link">${icon('chevronLeft', { size: 13 })} Materi</a>
      <h1 style="font-size:var(--fs-xl); font-weight:var(--fw-bold); color:var(--color-ink-900);">Bab ${kategori.bab} — ${kategori.judul}</h1>
      ${blokList.length ? blokList.map(renderBlok).join('') : `<div class="card" style="text-align:center; padding:var(--space-6); color:var(--color-ink-400);">Materi ini belum berisi konten.</div>`}
    </div>
  `;
}

export function bindMateriListEvents(root) {
  const btn = root.querySelector('#btn-show-cptp');
  if (!btn) return;

  const isGuru = getCurrentRole() === 'guru';
  const { tingkat } = getMyKelasInfo();

  btn.addEventListener('click', () => {
    showCpTpModal(isGuru, tingkat);
  });
}

export function bindMateriDetailEvents() {}
