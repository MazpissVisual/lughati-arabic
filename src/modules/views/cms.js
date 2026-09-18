import {
  getKategori, getKosakata, getTopikMuhadatsah,
  saveKategori, deleteKategori, saveKata, deleteKata, uploadKataGambar,
  saveTopikMuhadatsah, deleteTopikMuhadatsah, reorderTopikMuhadatsah,
  reorderKategori, reorderKata,
  getKuisKategori, getKuisSoal,
  saveKuisKategori, deleteKuisKategori, saveKuisSoalItem, deleteKuisSoalItem,
  reorderKuisKategori, reorderKuisSoalItems,
  getMateriKategori, getMateriBlok,
  saveMateriKategori, deleteMateriKategori, saveMateriBlok, deleteMateriBlok,
  reorderMateriKategori, reorderMateriBlok,
  countMissingTingkat, migrateMissingTingkat,
  getCpTp, saveCpTp
} from '../content.js';
import { icon } from '../icons.js';
import { confirmDialog } from '../ui.js';
import { buildCrossword, validateCrossword } from './kuis.js';

const ARABIC_RE = /[؀-ۿ]/;

const KUIS_JENIS_LABEL = { suara: 'Listening Challenge', kosakata: 'Tebak Kosakata', susun: 'Penyusunan Kata', tts: 'Teka-Teki Silang' };
const TINGKAT_LIST = ['X', 'XI', 'XII'];

let tab = 'mufrodat'; // 'mufrodat' | 'muhadatsah' | 'kuis' | 'materi'
let tingkatFilter = 'X'; // 'X' | 'XI' | 'XII' — tingkat kelas yang lagi dikelola, dipakai di semua tab
let kuisJenisFilter = 'suara'; // 'suara' | 'kosakata' | 'susun' | 'tts' — jenis kuis yang lagi dikelola
let editing = null; // { kind: 'kategori'|'kata'|'topik'|'kuisKategori'|'kuisSoal'|'materiKategori', id, kategoriId } | null
let formError = '';
let busy = false;
let dialogRows = []; // [{ speaker, side, arabic, translation }] — dipakai saat editing.kind === 'topik'
let tabelRows = []; // string[][] — dipakai saat manage.kind === 'materiBlok' & tipe === 'tabel'
let materiBlokTipeDraft = 'text'; // 'text' | 'tabel' | 'gambar' — tipe blok yang lagi diisi di form kiri

// Split-view "Kelola Kata"/"Kelola Soal": form tambah/edit item di kiri, daftar item di kanan,
// tanpa pindah halaman tiap kali tambah satu item baru (dipakai untuk isi banyak kata/soal berturut-turut).
let manage = null; // { kind: 'kata'|'kuisSoal', kategoriId } | null
let manageItemId = null; // id item yang sedang dimuat ke form kiri; null = mode tambah baru
let manageFormError = '';
let manageBusy = false;

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// --- Validasi ---
function validateKategori(fields) {
  if (!fields.label || fields.label.trim().length < 2) return 'Label kategori wajib diisi (minimal 2 karakter).';
  if (!fields.arabicTitle || !ARABIC_RE.test(fields.arabicTitle)) return 'Judul Arab wajib diisi dengan karakter Arab yang valid.';
  if (!fields.subtitle || fields.subtitle.trim().length < 2) return 'Subtitle (latin) wajib diisi.';
  if (!fields.desc || fields.desc.trim().length < 5) return 'Deskripsi minimal 5 karakter.';
  if (!fields.bab || Number(fields.bab) <= 0) return 'Nomor bab harus berupa angka lebih dari 0.';
  return null;
}

function validateKata(fields) {
  if (!fields.glyph || !ARABIC_RE.test(fields.glyph)) return 'Kata Arab (glyph) wajib diisi dengan karakter Arab yang valid.';
  if (!fields.latin || fields.latin.trim().length < 1) return 'Latin/transliterasi wajib diisi.';
  if (!fields.arti || fields.arti.trim().length < 1) return 'Arti wajib diisi.';
  return null;
}

function validateTopik(fields, rows) {
  if (!fields.title || fields.title.trim().length < 2) return 'Judul topik wajib diisi.';
  if (!fields.arabicTitle || !ARABIC_RE.test(fields.arabicTitle)) return 'Judul Arab wajib diisi dengan karakter Arab yang valid.';
  if (!fields.desc || fields.desc.trim().length < 5) return 'Deskripsi minimal 5 karakter.';
  if (!rows || rows.length === 0) return 'Dialog minimal harus ada 1 baris.';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.speaker || !r.speaker.trim()) return `Baris dialog ke-${i + 1}: nama pembicara wajib diisi.`;
    if (!r.arabic || !ARABIC_RE.test(r.arabic)) return `Baris dialog ke-${i + 1}: teks Arab wajib diisi dengan karakter Arab yang valid.`;
    if (!r.translation || !r.translation.trim()) return `Baris dialog ke-${i + 1}: terjemahan wajib diisi.`;
  }
  return null;
}

function validateKuisKategori(fields) {
  if (!fields.nama || fields.nama.trim().length < 2) return 'Nama bab wajib diisi (minimal 2 karakter).';
  return null;
}

function validateKuisSoal(fields, jenis) {
  if (jenis === 'susun') {
    if (!fields.kalimat || fields.kalimat.trim().split(/\s+/).filter(Boolean).length < 2) return 'Kalimat wajib diisi, minimal 2 kata dipisah spasi.';
    return null;
  }
  if (jenis === 'tts') {
    if (!fields.jawaban || fields.jawaban.trim().replace(/[^a-zA-Z]/g, '').length < 2) return 'Jawaban wajib diisi (huruf latin, minimal 2 huruf).';
    if (!fields.petunjuk || fields.petunjuk.trim().length < 2) return 'Petunjuk/clue wajib diisi.';
    return null;
  }
  if (!fields.glyph || !ARABIC_RE.test(fields.glyph)) return 'Teks Arab wajib diisi dengan karakter Arab yang valid.';
  if (!fields.latin || fields.latin.trim().length < 1) return 'Latin/transliterasi wajib diisi.';
  if (jenis === 'kosakata' && (!fields.arti || !fields.arti.trim())) return 'Arti wajib diisi untuk soal kosakata.';
  return null;
}

function validateMateriKategori(fields) {
  if (!fields.judul || fields.judul.trim().length < 2) return 'Judul materi wajib diisi (minimal 2 karakter).';
  if (!fields.bab || Number(fields.bab) <= 0) return 'Nomor bab harus berupa angka lebih dari 0.';
  return null;
}

function validateMateriBlok(fields, tipe) {
  if (tipe === 'text') {
    if (!fields.isi || fields.isi.trim().length < 2) return 'Isi teks wajib diisi.';
  } else if (tipe === 'gambar') {
    if (!fields.caption) fields.caption = '';
  } else if (tipe === 'tabel') {
    if (tabelRows.length === 0 || tabelRows.every(r => r.every(c => !c.trim()))) return 'Tabel minimal harus punya 1 baris berisi.';
  }
  return null;
}

function emptyDialogRow() {
  return { speaker: '', side: 'left', arabic: '', translation: '' };
}

// Baca ulang isi setiap baris dialog langsung dari DOM ke `dialogRows`, dipanggil sebelum
// tambah/hapus baris atau submit — supaya perubahan yang baru diketik tidak hilang saat re-render.
function syncDialogRowsFromDom(root) {
  const rowEls = root.querySelectorAll('[data-dialog-row]');
  dialogRows = Array.from(rowEls).map(rowEl => ({
    speaker: rowEl.querySelector('.dialog-speaker').value,
    side: rowEl.querySelector('.dialog-side').value,
    arabic: rowEl.querySelector('.dialog-arabic').value,
    translation: rowEl.querySelector('.dialog-translation').value
  }));
}

// Dipanggil dari main.js setiap kali route /cms dimasuki dari luar (bukan navigasi internal
// CMS sendiri) — supaya guru selalu balik ke daftar bab, bukan nyangkut di form/manage terakhir.
export function resetCmsState() {
  editing = null;
  manage = null;
  manageItemId = null;
  manageFormError = '';
  formError = '';
  materiBlokTipeDraft = 'text';
  tabelRows = [];
}

function renderTingkatFilter() {
  const html = TINGKAT_LIST.map(t => `
    <button class="segment-btn ${tingkatFilter === t ? 'is-active' : ''}" data-tingkat="${t}">Kelas ${t}</button>
  `).join('');

  const missing = countMissingTingkat();
  const totalMissing = missing.mufrodat + missing.muhadatsah + missing.kuis + missing.materi;
  const migrateNoticeHtml = totalMissing > 0 ? `
    <div class="card" style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); flex-wrap:wrap; padding:var(--space-3) var(--space-4); background:var(--color-accent-50, #FFFBEB);">
      <span style="font-size:var(--fs-xs); color:var(--color-ink-600);">
        ${icon('info', { size: 13 })} Ada ${totalMissing} konten lama (dibuat sebelum fitur tingkat kelas ada) yang belum ditandai tingkat, jadi tidak muncul di filter manapun.
      </span>
      <button class="btn btn--secondary" id="migrate-tingkat-btn" style="width:auto; height:30px; padding:0 12px; font-size:var(--fs-xs);">Tandai semua sebagai Kelas ${tingkatFilter}</button>
    </div>
  ` : '';

  return `<div class="segmented-control">${html}</div>${migrateNoticeHtml}`;
}

export function renderCms() {
  const kategori = getKategori(tingkatFilter);

  if (editing) {
    return renderEditPage(kategori);
  }

  if (manage) {
    return renderManagePage();
  }

  const kosakata = getKosakata();
  const topikList = getTopikMuhadatsah(tingkatFilter);
  const materiKategoriList = getMateriKategori(tingkatFilter);

  let tabContent;
  if (tab === 'mufrodat') tabContent = renderMufrodatTab(kategori, kosakata);
  else if (tab === 'muhadatsah') tabContent = renderMuhadatsahTab(topikList);
  else if (tab === 'materi') tabContent = renderMateriTab(materiKategoriList);
  else tabContent = renderKuisTab();

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <div class="segmented-control">
        <button class="segment-btn ${tab === 'mufrodat' ? 'is-active' : ''}" data-tab="mufrodat">Mufrodat</button>
        <button class="segment-btn ${tab === 'muhadatsah' ? 'is-active' : ''}" data-tab="muhadatsah">Muhadatsah</button>
        <button class="segment-btn ${tab === 'materi' ? 'is-active' : ''}" data-tab="materi">Materi</button>
        <button class="segment-btn ${tab === 'kuis' ? 'is-active' : ''}" data-tab="kuis">Kuis</button>
      </div>
      ${renderTingkatFilter()}

      ${tabContent}
    </div>
  `;
}

function moveButtons({ upAttr, downAttr, isFirst, isLast, size = 13 }) {
  return `
    <span class="cms-move-buttons">
      <button class="header-btn" ${upAttr} title="Naikkan" aria-label="Naikkan urutan" style="width:24px; height:24px;" ${isFirst ? 'disabled' : ''}>${icon('chevronUp', { size })}</button>
      <button class="header-btn" ${downAttr} title="Turunkan" aria-label="Turunkan urutan" style="width:24px; height:24px;" ${isLast ? 'disabled' : ''}>${icon('chevronDown', { size })}</button>
    </span>
  `;
}

function renderMufrodatTab(kategori, kosakata) {
  const cards = kategori.map((k, kIdx) => {
    const jumlahKata = kosakata.filter(w => w.kategori === k.id).length;

    return `
      <div class="card cms-row--clickable" draggable="true" data-kategori-drag="${k.id}" data-open-kategori="${k.id}" style="cursor:pointer; padding:var(--space-4); border-bottom:none; display:flex; align-items:flex-start; gap:8px;">
        <span class="cms-row__controls">
          <span style="color:var(--color-ink-300); display:flex;" class="drag-handle-desktop-only">${icon('grip', { size: 16 })}</span>
          ${moveButtons({
            upAttr: `data-move-kategori-up="${k.id}"`,
            downAttr: `data-move-kategori-down="${k.id}"`,
            isFirst: kIdx === 0,
            isLast: kIdx === kategori.length - 1
          })}
        </span>
        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:var(--fw-bold); flex:1; min-width:0;">Bab ${k.bab} — ${k.label}</span>
            <span class="arabic" style="font-size:var(--fs-sm); color:var(--color-ink-500); flex-shrink:0;">${k.arabicTitle}</span>
            <span class="cms-row__chevron" style="margin-left:0;">${icon('chevronRight', { size: 16 })}</span>
          </div>
          <div style="font-size:var(--fs-xs); color:var(--color-ink-400);">${jumlahKata} kata</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); flex-wrap:wrap;">
      <button class="btn btn--primary" style="width:auto;" id="add-kategori-btn">+ Tambah Kategori</button>
      <span style="font-size:var(--fs-2xs); color:var(--color-ink-400); display:inline-flex; align-items:center; gap:4px;">${icon('grip', { size: 12 })} Seret untuk urutkan bab · klik untuk kelola kata</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:var(--space-3);">${cards}</div>
  `;
}

function renderKuisTab() {
  const kategoriList = getKuisKategori(kuisJenisFilter, tingkatFilter);

  const jenisTabsHtml = Object.keys(KUIS_JENIS_LABEL).map(j => `
    <button class="segment-btn ${kuisJenisFilter === j ? 'is-active' : ''}" data-kuis-jenis="${j}">${KUIS_JENIS_LABEL[j]}</button>
  `).join('');

  const cards = kategoriList.map((k, kIdx) => {
    const jumlahSoal = getKuisSoal(k.id).length;

    return `
      <div class="card cms-row--clickable" draggable="true" data-kuiskategori-drag="${k.id}" data-open-kuiskategori="${k.id}" style="cursor:pointer; padding:var(--space-4); border-bottom:none; display:flex; align-items:flex-start; gap:8px;">
        <span class="cms-row__controls">
          <span style="color:var(--color-ink-300); display:flex;" class="drag-handle-desktop-only">${icon('grip', { size: 16 })}</span>
          ${moveButtons({
            upAttr: `data-move-kuiskategori-up="${k.id}"`,
            downAttr: `data-move-kuiskategori-down="${k.id}"`,
            isFirst: kIdx === 0,
            isLast: kIdx === kategoriList.length - 1
          })}
        </span>
        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:var(--fw-bold); flex:1; min-width:0;">${k.nama}</span>
            <span class="cms-row__chevron" style="margin-left:0;">${icon('chevronRight', { size: 16 })}</span>
          </div>
          <div style="font-size:var(--fs-xs); color:var(--color-ink-400);">${jumlahSoal} soal</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="segmented-control">${jenisTabsHtml}</div>
    <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); flex-wrap:wrap; margin-top:var(--space-3);">
      <button class="btn btn--primary" style="width:auto;" id="add-kuiskategori-btn">+ Tambah Bab</button>
      <span style="font-size:var(--fs-2xs); color:var(--color-ink-400); display:inline-flex; align-items:center; gap:4px;">${icon('grip', { size: 12 })} Seret untuk urutkan bab · klik untuk kelola soal</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:var(--space-3); margin-top:var(--space-3);">
      ${kategoriList.length ? cards : `<div class="card" style="text-align:center; padding:var(--space-6); color:var(--color-ink-400); font-size:var(--fs-sm);">Belum ada bab untuk ${KUIS_JENIS_LABEL[kuisJenisFilter]}.</div>`}
    </div>
  `;
}

function renderMateriTab(materiKategoriList) {
  const cards = materiKategoriList.map((k, kIdx) => {
    const jumlahBlok = getMateriBlok(k.id).length;
    return `
      <div class="card cms-row--clickable" draggable="true" data-materikategori-drag="${k.id}" data-open-materikategori="${k.id}" style="cursor:pointer; padding:var(--space-4); border-bottom:none; display:flex; align-items:flex-start; gap:8px;">
        <span class="cms-row__controls">
          <span style="color:var(--color-ink-300); display:flex;" class="drag-handle-desktop-only">${icon('grip', { size: 16 })}</span>
          ${moveButtons({
            upAttr: `data-move-materikategori-up="${k.id}"`,
            downAttr: `data-move-materikategori-down="${k.id}"`,
            isFirst: kIdx === 0,
            isLast: kIdx === materiKategoriList.length - 1
          })}
        </span>
        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:var(--fw-bold); flex:1; min-width:0;">Bab ${k.bab} — ${k.judul}</span>
            <span class="cms-row__chevron" style="margin-left:0;">${icon('chevronRight', { size: 16 })}</span>
          </div>
          <div style="font-size:var(--fs-xs); color:var(--color-ink-400);">${jumlahBlok} blok konten</div>
        </div>
      </div>
    `;
  }).join('');

  const cpTp = getCpTp(tingkatFilter);
  const hasCpTp = cpTp.cp || cpTp.tp;

  return `
    <div class="card" style="display:flex; flex-direction:column; gap:var(--space-2); padding:var(--space-4);">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); flex-wrap:wrap;">
        <div style="font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--color-ink-900);">CP & TP — Kelas ${tingkatFilter}</div>
        <button type="button" class="btn btn--outline" id="edit-cptp-btn" style="width:auto; height:30px; padding:0 12px; font-size:var(--fs-xs);">${hasCpTp ? 'Edit' : '+ Isi CP & TP'}</button>
      </div>
      ${hasCpTp ? `
        ${cpTp.cp ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-600); white-space:pre-wrap;"><strong>CP:</strong> ${cpTp.cp}</div>` : ''}
        ${cpTp.tp ? `<div style="font-size:var(--fs-xs); color:var(--color-ink-600); white-space:pre-wrap;"><strong>TP:</strong> ${cpTp.tp}</div>` : ''}
      ` : `<div style="font-size:var(--fs-xs); color:var(--color-ink-400);">Belum diisi untuk Kelas ${tingkatFilter}.</div>`}
    </div>

    <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); flex-wrap:wrap;">
      <button class="btn btn--primary" style="width:auto;" id="add-materikategori-btn">+ Tambah Materi</button>
      <span style="font-size:var(--fs-2xs); color:var(--color-ink-400); display:inline-flex; align-items:center; gap:4px;">${icon('grip', { size: 12 })} Seret untuk urutkan · klik untuk kelola isi</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:var(--space-3);">
      ${materiKategoriList.length ? cards : `<div class="card" style="text-align:center; padding:var(--space-6); color:var(--color-ink-400); font-size:var(--fs-sm);">Belum ada materi untuk Kelas ${tingkatFilter}.</div>`}
    </div>
  `;
}

// ---------- Split-view "Kelola Kata" / "Kelola Soal" ----------

function renderManagePage() {
  if (manage.kind === 'kata') return renderManageKata();
  if (manage.kind === 'materiBlok') return renderManageMateriBlok();
  return renderManageKuisSoal();
}

function manageRowHtml({ id, kategoriId, idx, total, glyph, latin, extra, isActive }) {
  return `
    <li class="cms-row cms-row--clickable ${isActive ? 'is-active' : ''}" draggable="true" data-manage-item-drag="${id}" data-open-manage-item="${id}" style="cursor:pointer;">
      <span class="cms-row__controls">
        <span style="color:var(--color-ink-300); display:flex;" class="drag-handle-desktop-only">${icon('grip', { size: 14 })}</span>
        ${moveButtons({
          upAttr: `data-move-manage-item-up="${id}"`,
          downAttr: `data-move-manage-item-down="${id}"`,
          isFirst: idx === 0,
          isLast: idx === total - 1
        })}
      </span>
      <span class="cms-row__text"><span class="arabic">${glyph}</span>${latin ? ` — ${latin}` : ''}${extra ? ` : ${extra}` : ''}</span>
      <button type="button" class="header-btn" data-delete-manage-item="${id}" title="Hapus" aria-label="Hapus item" style="flex-shrink:0;">${icon('x', { size: 14 })}</button>
    </li>
  `;
}

function renderManageKata() {
  const kategori = getKategori().find(k => k.id === manage.kategoriId);
  const words = getKosakata().filter(w => w.kategori === manage.kategoriId);
  const current = manageItemId ? words.find(w => w.id === manageItemId) : {};

  const rowsHtml = words.map((w, idx) => manageRowHtml({
    id: w.id, idx, total: words.length, glyph: w.glyph, latin: w.latin, extra: w.arti, isActive: w.id === manageItemId
  })).join('');

  const formHtml = `
    ${field('glyph', 'Kata Arab', current.glyph)}
    ${field('latin', 'Latin/Transliterasi', current.latin)}
    ${field('arti', 'Arti (Bahasa Indonesia)', current.arti)}
    ${fieldTextarea('contoh', 'Contoh kalimat (opsional)', current.contoh)}
    <label style="display:flex; flex-direction:column; gap:4px; font-size:var(--fs-xs); color:var(--color-ink-500);">
      Gambar Ilustrasi (opsional)
      ${current.gambarUrl ? `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
          <img src="${current.gambarUrl}" alt="" style="width:56px; height:56px; object-fit:cover; border-radius:var(--radius-md); flex-shrink:0;">
          <button type="button" id="manage-remove-gambar-btn" style="display:inline-flex; align-items:center; gap:4px; white-space:nowrap; background:none; border:none; padding:4px 0; font-size:var(--fs-xs); color:var(--color-error); cursor:pointer;">${icon('x', { size: 12 })} Hapus Gambar</button>
        </div>
      ` : ''}
      <input type="file" name="gambarFile" id="manage-gambar-file" accept="image/*" class="input" style="padding:8px;">
      <input type="hidden" name="removeGambar" id="manage-remove-gambar-flag" value="">
    </label>
  `;

  return renderManageLayout({
    backHref: null,
    title: kategori ? `Bab ${kategori.bab} — ${kategori.label}` : 'Kelola Kata',
    editKategoriBtn: true,
    formTitle: manageItemId ? 'Edit Kata' : 'Tambah Kata',
    formHtml,
    listTitle: `Daftar Kata (${words.length})`,
    rowsHtml,
    emptyText: 'Belum ada kata di bab ini. Isi form di kiri untuk menambahkan.'
  });
}

function renderManageKuisSoal() {
  const kategori = getKuisKategori().find(k => k.id === manage.kategoriId);
  const jenis = kategori?.jenis;
  const soalList = getKuisSoal(manage.kategoriId);
  const current = manageItemId ? soalList.find(s => s.id === manageItemId) : {};

  const rowsHtml = soalList.map((s, idx) => {
    let glyph, latin, extra;
    if (jenis === 'susun') {
      glyph = s.kalimat; latin = ''; extra = s.arti;
    } else if (jenis === 'tts') {
      glyph = s.jawaban; latin = ''; extra = s.petunjuk;
    } else {
      glyph = s.glyph; latin = s.latin; extra = s.arti;
    }
    return manageRowHtml({ id: s.id, idx, total: soalList.length, glyph, latin, extra, isActive: s.id === manageItemId });
  }).join('');

  let formHtml;
  if (jenis === 'susun') {
    formHtml = `
      ${fieldTextarea('kalimat', 'Kalimat Arab (kata dipisah spasi, ini jawaban benar)', current.kalimat)}
      ${field('arti', 'Arti/petunjuk (opsional)', current.arti)}
    `;
  } else if (jenis === 'tts') {
    formHtml = `
      ${field('jawaban', 'Jawaban (huruf latin, tanpa spasi)', current.jawaban)}
      ${fieldTextarea('petunjuk', 'Petunjuk/Clue', current.petunjuk)}
    `;
  } else {
    formHtml = `
      ${field('glyph', 'Teks Arab', current.glyph)}
      ${field('latin', 'Latin/Transliterasi', current.latin)}
      ${jenis === 'kosakata' ? field('arti', 'Arti (Bahasa Indonesia)', current.arti) : ''}
      ${jenis !== 'kosakata' ? field('makhraj', 'Makhraj (opsional)', current.makhraj) : ''}
      ${fieldTextarea('desc', jenis === 'kosakata' ? 'Contoh kalimat (opsional)' : 'Deskripsi cara pengucapan (opsional)', current.desc)}
    `;
  }

  return renderManageLayout({
    backHref: null,
    title: kategori ? `${kategori.nama} (${KUIS_JENIS_LABEL[jenis] || jenis})` : 'Kelola Soal',
    editKategoriBtn: true,
    formTitle: manageItemId ? 'Edit Soal' : 'Tambah Soal',
    formHtml,
    listTitle: `Daftar Soal (${soalList.length})`,
    rowsHtml,
    emptyText: 'Belum ada soal di bab ini. Isi form di kiri untuk menambahkan.',
    extraHtml: jenis === 'tts' ? renderTtsPreview(soalList) : ''
  });
}

// ---------- Preview grid TTS (khusus jenis kuis 'tts') ----------
// Statis (bukan input) — cuma untuk guru cek hasil generate sebelum dipakai murid. Dipanggil ulang
// tiap render() biasa, jadi tombol "Generate Ulang" cukup memicu rerender untuk dapat tata letak baru
// (buildCrossword mengacak tie-break antar kandidat sama-bagus tiap dipanggil, lihat kuis.js).
function renderTtsPreview(soalList) {
  if (soalList.length < 2) {
    return `<div class="card" style="padding:var(--space-4); color:var(--color-ink-500); font-size:var(--fs-xs);">Tambah minimal 2 soal untuk melihat preview grid TTS.</div>`;
  }

  const puzzle = buildCrossword(soalList);
  if (!puzzle) return '';
  const { warnings } = validateCrossword(puzzle);

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

  let gridHtml = `<div class="tts-grid" style="display:inline-grid; gap:2px; --cols:${puzzle.cols};">`;
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const cell = cellMap.get(`${r},${c}`);
      if (!cell) { gridHtml += `<div class="tts-cell tts-cell--blank"></div>`; continue; }
      gridHtml += `
        <div class="tts-cell" style="position:relative;">
          ${cell.number ? `<span class="tts-cell__number">${cell.number}</span>` : ''}
          <span style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-weight:var(--fw-bold); font-size:var(--fs-sm);">${cell.char}</span>
        </div>
      `;
    }
  }
  gridHtml += '</div>';

  const warningsHtml = warnings.length ? `
    <div style="display:flex; flex-direction:column; gap:4px;">
      ${warnings.map(w => `<div style="font-size:var(--fs-2xs); color:var(--color-error); display:flex; align-items:flex-start; gap:4px;">${icon('info', { size: 12 })} ${w}</div>`).join('')}
    </div>
  ` : `<div style="font-size:var(--fs-2xs); color:var(--color-primary-700); display:flex; align-items:center; gap:4px;">${icon('check', { size: 12 })} Grid valid, semua kata tersambung.</div>`;

  return `
    <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3); padding:var(--space-4);">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); flex-wrap:wrap;">
        <div style="font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--color-ink-900);">Preview Grid TTS</div>
        <button type="button" class="btn btn--outline" id="tts-regenerate-btn" style="width:auto; height:30px; padding:0 12px; font-size:var(--fs-xs); display:inline-flex; align-items:center; gap:6px;">${icon('refresh', { size: 13 })} Generate Ulang</button>
      </div>
      <div style="overflow-x:auto;">${gridHtml}</div>
      ${warningsHtml}
    </div>
  `;
}

function emptyTabelRow(cols) {
  return new Array(cols || (tabelRows[0]?.length || 2)).fill('');
}

function renderTabelEditor() {
  if (tabelRows.length === 0) tabelRows = [emptyTabelRow(2), emptyTabelRow(2)];
  const cols = tabelRows[0].length;

  const rowsHtml = tabelRows.map((row, rIdx) => `
    <div data-tabel-row="${rIdx}" style="display:flex; gap:4px;">
      ${row.map((cell, cIdx) => `
        <input type="text" class="tabel-cell" data-row="${rIdx}" data-col="${cIdx}" value="${(cell || '').replace(/"/g, '&quot;')}" placeholder="${rIdx === 0 ? `Header ${cIdx + 1}` : '-'}" style="flex:1; min-width:0; padding:6px 8px; border-radius:var(--radius-sm); border:1px solid var(--color-ink-200); font-size:var(--fs-xs); ${rIdx === 0 ? 'font-weight:var(--fw-bold);' : ''}">
      `).join('')}
      <button type="button" class="header-btn" data-remove-tabel-row="${rIdx}" title="Hapus baris" style="flex-shrink:0;" ${tabelRows.length <= 1 ? 'disabled' : ''}>${icon('x', { size: 12 })}</button>
    </div>
  `).join('');

  return `
    <div style="display:flex; flex-direction:column; gap:6px;">
      <span style="font-size:var(--fs-xs); color:var(--color-ink-500);">Tabel (baris pertama = header)</span>
      <div style="display:flex; flex-direction:column; gap:4px;">${rowsHtml}</div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn btn--secondary" id="add-tabel-row-btn" style="width:auto; height:28px; padding:0 10px; font-size:var(--fs-2xs);">+ Baris</button>
        <button type="button" class="btn btn--secondary" id="add-tabel-col-btn" style="width:auto; height:28px; padding:0 10px; font-size:var(--fs-2xs);">+ Kolom (${cols})</button>
      </div>
    </div>
  `;
}

function renderManageMateriBlok() {
  const kategori = getMateriKategori().find(k => k.id === manage.kategoriId);
  const blokList = getMateriBlok(manage.kategoriId);
  const current = manageItemId ? blokList.find(b => b.id === manageItemId) : null;
  const tipe = current ? current.tipe : materiBlokTipeDraft;

  const rowsHtml = blokList.map((b, idx) => {
    const label = b.tipe === 'text' ? (b.isi || '').slice(0, 40) : b.tipe === 'tabel' ? `Tabel (${(b.rows || []).length} baris)` : `Gambar${b.caption ? `: ${b.caption}` : ''}`;
    return `
      <li class="cms-row cms-row--clickable ${b.id === manageItemId ? 'is-active' : ''}" draggable="true" data-manage-item-drag="${b.id}" data-open-manage-item="${b.id}" style="cursor:pointer;">
        <span class="cms-row__controls">
          <span style="color:var(--color-ink-300); display:flex;" class="drag-handle-desktop-only">${icon('grip', { size: 14 })}</span>
          ${moveButtons({
            upAttr: `data-move-manage-item-up="${b.id}"`,
            downAttr: `data-move-manage-item-down="${b.id}"`,
            isFirst: idx === 0,
            isLast: idx === blokList.length - 1
          })}
        </span>
        <span class="cms-row__text">[${b.tipe}] ${label}</span>
        <button type="button" class="header-btn" data-delete-manage-item="${b.id}" title="Hapus" aria-label="Hapus item" style="flex-shrink:0;">${icon('x', { size: 14 })}</button>
      </li>
    `;
  }).join('');

  let tipeFieldsHtml;
  if (tipe === 'tabel') {
    if (current) tabelRows = current.rows && current.rows.length ? current.rows.map(r => [...(r.cells || [])]) : tabelRows;
    tipeFieldsHtml = renderTabelEditor();
  } else if (tipe === 'gambar') {
    tipeFieldsHtml = `
      ${current?.url ? `<img src="${current.url}" alt="" style="width:100%; max-width:180px; border-radius:var(--radius-md);">` : ''}
      <label style="display:flex; flex-direction:column; gap:4px; font-size:var(--fs-xs); color:var(--color-ink-500);">
        File Gambar ${current?.url ? '(kosongkan kalau tidak ganti)' : ''}
        <input type="file" name="gambarFile" accept="image/*" class="input" style="padding:8px;">
      </label>
      ${field('caption', 'Caption (opsional)', current?.caption)}
    `;
  } else {
    tipeFieldsHtml = fieldTextarea('isi', 'Isi Teks', current?.isi);
  }

  const formHtml = `
    <label style="display:flex; flex-direction:column; gap:4px; font-size:var(--fs-sm); color:var(--color-ink-700);">
      Tipe Blok
      <select name="tipe" id="materi-tipe-select" ${manageItemId ? 'disabled' : ''} style="padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);">
        <option value="text" ${tipe === 'text' ? 'selected' : ''}>Teks</option>
        <option value="tabel" ${tipe === 'tabel' ? 'selected' : ''}>Tabel</option>
        <option value="gambar" ${tipe === 'gambar' ? 'selected' : ''}>Gambar</option>
      </select>
    </label>
    ${tipeFieldsHtml}
  `;

  return renderManageLayout({
    backHref: null,
    title: kategori ? kategori.judul : 'Kelola Materi',
    editKategoriBtn: true,
    formTitle: manageItemId ? 'Edit Blok' : 'Tambah Blok',
    formHtml,
    listTitle: `Daftar Blok (${blokList.length})`,
    rowsHtml,
    emptyText: 'Belum ada blok konten. Isi form di kiri untuk menambahkan.'
  });
}

function renderManageLayout({ title, editKategoriBtn, formTitle, formHtml, listTitle, rowsHtml, emptyText, extraHtml }) {
  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <button id="manage-back-btn" class="back-link">
        ${icon('chevronLeft', { size: 13 })} Kembali ke Daftar Bab
      </button>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); flex-wrap:wrap;">
        <h2 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-ink-900);">${title}</h2>
        ${editKategoriBtn ? `
          <button id="manage-edit-kategori-btn" class="btn btn--outline" style="width:auto; height:32px; padding:0 12px; font-size:var(--fs-xs); display:inline-flex; align-items:center; gap:6px;">
            ${icon('settings', { size: 13 })} Edit Bab
          </button>
        ` : ''}
      </div>

      <div class="cms-split">
        <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3); padding:var(--space-4);">
          <div style="font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--color-primary-700);">${formTitle}</div>
          <form id="manage-form" style="display:flex; flex-direction:column; gap:var(--space-3);">
            ${formHtml}
            ${manageFormError ? `<div style="color:var(--color-error); font-size:var(--fs-xs);">${manageFormError}</div>` : ''}
            <div style="display:flex; gap:var(--space-2);">
              ${manageItemId ? `<button type="button" id="manage-form-cancel-btn" class="btn btn--outline" style="flex:1;">Batal</button>` : ''}
              <button type="submit" class="btn btn--primary" style="flex:2;" ${manageBusy ? 'disabled' : ''}>${manageBusy ? 'Menyimpan...' : (manageItemId ? 'Simpan Perubahan' : '+ Tambah')}</button>
            </div>
          </form>
        </div>

        <div class="card" style="padding:var(--space-3);">
          <div style="font-size:var(--fs-xs); font-weight:var(--fw-bold); color:var(--color-ink-500); padding:6px 8px;">${listTitle}</div>
          <ul style="list-style:none; padding:0; margin:0;">
            ${rowsHtml || `<li style="padding:var(--space-4); text-align:center; color:var(--color-ink-400); font-size:var(--fs-xs);">${emptyText}</li>`}
          </ul>
        </div>
      </div>

      ${extraHtml || ''}
    </div>
  `;
}

function renderMuhadatsahTab(topikList) {
  const cards = topikList.map((t, tIdx) => `
    <div class="card cms-row--clickable" draggable="true" data-topik-drag="${t.id}" data-open-topik="${t.id}" style="cursor:pointer; padding:var(--space-4); border-bottom:none; display:flex; align-items:flex-start; gap:8px;">
      <span class="cms-row__controls">
        <span style="color:var(--color-ink-300); display:flex;" class="drag-handle-desktop-only">${icon('grip', { size: 16 })}</span>
        ${moveButtons({
          upAttr: `data-move-topik-up="${t.id}"`,
          downAttr: `data-move-topik-down="${t.id}"`,
          isFirst: tIdx === 0,
          isLast: tIdx === topikList.length - 1
        })}
      </span>
      <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:var(--fw-bold); flex:1; min-width:0;">${t.title} <span style="color:var(--color-ink-400); font-weight:var(--fw-regular); font-size:var(--fs-xs);">(${t.level || '-'})</span></span>
          <span class="arabic" style="font-size:var(--fs-sm); color:var(--color-ink-500); flex-shrink:0;">${t.arabicTitle}</span>
          <span class="cms-row__chevron" style="margin-left:0;">${icon('chevronRight', { size: 16 })}</span>
        </div>
        <div style="font-size:var(--fs-xs); color:var(--color-ink-400);">${(t.dialog || []).length} baris dialog</div>
      </div>
    </div>
  `).join('');

  return `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:var(--space-3); flex-wrap:wrap;">
      <button class="btn btn--primary" style="width:auto;" id="add-topik-btn">+ Tambah Topik</button>
      <span style="font-size:var(--fs-2xs); color:var(--color-ink-400); display:inline-flex; align-items:center; gap:4px;">${icon('grip', { size: 12 })} Seret untuk urutkan topik · klik untuk kelola dialog</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:var(--space-3);">${cards}</div>
  `;
}

function renderEditPage(kategori) {
  let title = '';
  let bodyHtml = '';

  if (editing.kind === 'kategori') {
    const data = editing.id ? kategori.find(k => k.id === editing.id) : {};
    title = editing.id ? 'Edit Kategori' : 'Tambah Kategori';
    bodyHtml = `
      ${!editing.id ? field('id', 'ID unik (huruf kecil, tanpa spasi)', data.id, true) : ''}
      ${field('label', 'Label', data.label)}
      ${field('bab', 'Nomor Bab', data.bab, false, 'number')}
      ${field('arabicTitle', 'Judul Arab', data.arabicTitle)}
      ${field('subtitle', 'Subtitle (latin)', data.subtitle)}
      ${fieldTextarea('desc', 'Deskripsi', data.desc)}
      ${field('icon', 'Nama Icon (contoh: book, star)', data.icon || 'book')}
      ${field('theme', 'Tema warna (indigo/peach/mint)', data.theme || 'indigo')}
    `;
  } else if (editing.kind === 'kuisKategori') {
    const list = getKuisKategori();
    const data = editing.id ? list.find(k => k.id === editing.id) : {};
    const jenis = editing.id ? data.jenis : kuisJenisFilter;
    title = editing.id ? 'Edit Bab Kuis' : 'Tambah Bab Kuis';
    bodyHtml = `
      <div style="font-size:var(--fs-xs); color:var(--color-ink-500);">Jenis: <strong>${KUIS_JENIS_LABEL[jenis] || jenis}</strong></div>
      ${field('nama', 'Nama Bab (contoh: Huruf Bagian 1)', data.nama)}
    `;
  } else if (editing.kind === 'topik') {
    const list = getTopikMuhadatsah();
    const data = editing.id ? list.find(t => t.id === editing.id) : {};
    title = editing.id ? 'Edit Topik Muhadatsah' : 'Tambah Topik Muhadatsah';
    bodyHtml = `
      ${!editing.id ? field('id', 'ID unik (huruf kecil, tanpa spasi)', data.id, true) : ''}
      ${field('title', 'Judul', data.title)}
      ${field('arabicTitle', 'Judul Arab', data.arabicTitle)}
      ${field('level', 'Level (Dasar/Menengah)', data.level || 'Dasar')}
      ${field('unit', 'Label Unit (contoh: Unit 1: Introductions)', data.unit)}
      ${field('icon', 'Nama Icon', data.icon || 'message')}
      ${fieldTextarea('desc', 'Deskripsi', data.desc)}
      ${renderDialogRows()}
    `;
  } else if (editing.kind === 'materiKategori') {
    const list = getMateriKategori();
    const data = editing.id ? list.find(k => k.id === editing.id) : {};
    title = editing.id ? 'Edit Materi' : 'Tambah Materi';
    bodyHtml = `
      <div style="font-size:var(--fs-xs); color:var(--color-ink-500);">Kelas: <strong>${tingkatFilter}</strong></div>
      ${field('bab', 'Nomor Bab', data.bab, false, 'number')}
      ${field('judul', 'Judul Materi', data.judul)}
    `;
  } else if (editing.kind === 'cpTp') {
    const data = getCpTp(tingkatFilter);
    title = `CP & TP — Kelas ${tingkatFilter}`;
    bodyHtml = `
      ${fieldTextarea('cp', 'Capaian Pembelajaran (CP)', data.cp)}
      ${fieldTextarea('tp', 'Tujuan Pembelajaran (TP)', data.tp)}
    `;
  }

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4); max-width:640px;">
      <button id="cms-back-btn" class="back-link">
        ${icon('chevronLeft', { size: 13 })} Kembali ke daftar
      </button>
      <div class="card" style="padding:var(--space-6); display:flex; flex-direction:column; gap:var(--space-4);">
        <h2 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-primary-700);">${title}</h2>
        <form id="cms-form" style="display:flex; flex-direction:column; gap:var(--space-3);">
          ${bodyHtml}
          ${formError ? `<div style="color:var(--color-error); font-size:var(--fs-xs);">${formError}</div>` : ''}
          <div style="display:flex; gap:var(--space-3);">
            <button type="button" id="cms-cancel-btn" class="btn btn--outline" style="flex:1;">Batal</button>
            <button type="submit" class="btn btn--primary" style="flex:2;" ${busy ? 'disabled' : ''}>${busy ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
        ${editing.id ? `
          <button type="button" id="cms-delete-btn" class="btn btn--outline" style="color:var(--color-error); border-color:var(--color-error);">
            ${icon('x', { size: 14 })} Hapus
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderDialogRows() {
  const rowsHtml = dialogRows.map((row, i) => `
    <div data-dialog-row data-index="${i}" style="padding:var(--space-3); border:1px solid var(--color-ink-100); border-radius:var(--radius-md); display:flex; flex-direction:column; gap:8px; background:var(--color-primary-50);">
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <span style="font-size:var(--fs-xs); color:var(--color-ink-400); font-weight:var(--fw-bold); min-width:16px;">${i + 1}.</span>
        <input type="text" class="dialog-speaker" placeholder="Nama pembicara" value="${(row.speaker || '').replace(/"/g, '&quot;')}" style="flex:1; min-width:120px; padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);">
        <select class="dialog-side" style="flex-shrink:0; padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);">
          <option value="left" ${row.side !== 'right' ? 'selected' : ''}>Kiri</option>
          <option value="right" ${row.side === 'right' ? 'selected' : ''}>Kanan</option>
        </select>
        <button type="button" class="header-btn" data-remove-row="${i}" title="Hapus baris" aria-label="Hapus baris dialog ke-${i + 1}" style="flex-shrink:0;" ${dialogRows.length <= 1 ? 'disabled' : ''}>${icon('x', { size: 14 })}</button>
      </div>
      <textarea class="dialog-arabic arabic" rows="2" placeholder="Teks Arab" dir="rtl" style="padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200); resize:vertical;">${row.arabic || ''}</textarea>
      <textarea class="dialog-translation" rows="2" placeholder="Terjemahan Bahasa Indonesia" style="padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200); resize:vertical;">${row.translation || ''}</textarea>
    </div>
  `).join('');

  return `
    <div style="display:flex; flex-direction:column; gap:6px;">
      <span style="font-size:var(--fs-sm); color:var(--color-ink-700);">Dialog (giliran bicara, sesuai urutan)</span>
      <div style="display:flex; flex-direction:column; gap:8px;">${rowsHtml}</div>
      <button type="button" class="btn btn--secondary" id="add-dialog-row-btn" style="width:auto; align-self:flex-start; height:32px; padding:0 12px; font-size:var(--fs-xs);">+ Tambah Baris Dialog</button>
    </div>
  `;
}

function field(name, label, value = '', required = false, type = 'text') {
  return `
    <label style="display:flex; flex-direction:column; gap:4px; font-size:var(--fs-sm); color:var(--color-ink-700);">
      ${label}
      <input type="${type}" name="${name}" value="${value ? String(value).replace(/"/g, '&quot;') : ''}" ${required ? 'required' : ''} style="padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);">
    </label>
  `;
}

function fieldTextarea(name, label, value = '') {
  return `
    <label style="display:flex; flex-direction:column; gap:4px; font-size:var(--fs-sm); color:var(--color-ink-700);">
      ${label}
      <textarea name="${name}" rows="2" style="padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);">${value || ''}</textarea>
    </label>
  `;
}

let draggedKategoriId = null;

function bindDragKategori(root, rerender) {
  root.querySelectorAll('[data-kategori-drag]').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      draggedKategoriId = el.dataset.kategoriDrag;
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      const targetId = el.dataset.kategoriDrag;
      if (!draggedKategoriId || draggedKategoriId === targetId) { draggedKategoriId = null; return; }

      const ids = getKategori(tingkatFilter).map(k => k.id);
      const from = ids.indexOf(draggedKategoriId);
      const to = ids.indexOf(targetId);
      if (from === -1 || to === -1) { draggedKategoriId = null; return; }
      ids.splice(from, 1);
      ids.splice(to, 0, draggedKategoriId);
      draggedKategoriId = null;

      await reorderKategori(ids);
      rerender();
    });
  });
}

// Item di dalam split-view "Kelola Kata"/"Kelola Soal" — satu fungsi generik untuk keduanya,
// karena selalu dalam konteks satu kategori (manage.kategoriId), beda cuma reorder function-nya.
let draggedManageItemId = null;

function getManageItemIds() {
  return manage.kind === 'kata'
    ? getKosakata().filter(w => w.kategori === manage.kategoriId).map(w => w.id)
    : getKuisSoal(manage.kategoriId).map(s => s.id);
}

function reorderManageItems(ids) {
  return manage.kind === 'kata' ? reorderKata(manage.kategoriId, ids) : reorderKuisSoalItems(manage.kategoriId, ids);
}

function bindDragManageItem(root, rerender) {
  root.querySelectorAll('[data-manage-item-drag]').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      draggedManageItemId = el.dataset.manageItemDrag;
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      const targetId = el.dataset.manageItemDrag;
      if (!draggedManageItemId || draggedManageItemId === targetId) { draggedManageItemId = null; return; }

      const ids = getManageItemIds();
      const from = ids.indexOf(draggedManageItemId);
      const to = ids.indexOf(targetId);
      draggedManageItemId = null;
      if (from === -1 || to === -1) return;
      ids.splice(from, 1);
      ids.splice(to, 0, draggedManageItemId);

      await reorderManageItems(ids);
      rerender();
    });
  });
}

function bindManageMoveButtons(root, rerender) {
  root.querySelectorAll('[data-move-manage-item-up]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.moveManageItemUp;
      const ids = getManageItemIds();
      const from = ids.indexOf(id);
      if (from <= 0) return;
      [ids[from], ids[from - 1]] = [ids[from - 1], ids[from]];
      reorderManageItems(ids).then(rerender);
    });
  });
  root.querySelectorAll('[data-move-manage-item-down]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.moveManageItemDown;
      const ids = getManageItemIds();
      const from = ids.indexOf(id);
      if (from === -1 || from >= ids.length - 1) return;
      [ids[from], ids[from + 1]] = [ids[from + 1], ids[from]];
      reorderManageItems(ids).then(rerender);
    });
  });
}

let draggedKuisKategoriId = null;

function bindDragKuisKategori(root, rerender) {
  root.querySelectorAll('[data-kuiskategori-drag]').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      draggedKuisKategoriId = el.dataset.kuiskategoriDrag;
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      const targetId = el.dataset.kuiskategoriDrag;
      if (!draggedKuisKategoriId || draggedKuisKategoriId === targetId) { draggedKuisKategoriId = null; return; }

      const ids = getKuisKategori(kuisJenisFilter, tingkatFilter).map(k => k.id);
      const from = ids.indexOf(draggedKuisKategoriId);
      const to = ids.indexOf(targetId);
      if (from === -1 || to === -1) { draggedKuisKategoriId = null; return; }
      ids.splice(from, 1);
      ids.splice(to, 0, draggedKuisKategoriId);
      draggedKuisKategoriId = null;

      await reorderKuisKategori(kuisJenisFilter, ids);
      rerender();
    });
  });
}

function swapAndReorderKuisKategori(id, direction, rerender) {
  const ids = getKuisKategori(kuisJenisFilter, tingkatFilter).map(k => k.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  reorderKuisKategori(kuisJenisFilter, ids).then(rerender);
}

function bindKuisMoveButtons(root, rerender) {
  root.querySelectorAll('[data-move-kuiskategori-up]').forEach(btn => {
    btn.addEventListener('click', (e) => swapAndReorderKuisKategori(e.currentTarget.dataset.moveKuiskategoriUp, -1, rerender));
  });
  root.querySelectorAll('[data-move-kuiskategori-down]').forEach(btn => {
    btn.addEventListener('click', (e) => swapAndReorderKuisKategori(e.currentTarget.dataset.moveKuiskategoriDown, 1, rerender));
  });
}

function swapAndReorderKategori(id, direction, rerender) {
  const ids = getKategori(tingkatFilter).map(k => k.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  reorderKategori(ids).then(rerender);
}

function bindMoveButtons(root, rerender) {
  root.querySelectorAll('[data-move-kategori-up]').forEach(btn => {
    btn.addEventListener('click', (e) => swapAndReorderKategori(e.currentTarget.dataset.moveKategoriUp, -1, rerender));
  });
  root.querySelectorAll('[data-move-kategori-down]').forEach(btn => {
    btn.addEventListener('click', (e) => swapAndReorderKategori(e.currentTarget.dataset.moveKategoriDown, 1, rerender));
  });
}

let draggedTopikId = null;

function bindDragTopik(root, rerender) {
  root.querySelectorAll('[data-topik-drag]').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      draggedTopikId = el.dataset.topikDrag;
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      const targetId = el.dataset.topikDrag;
      if (!draggedTopikId || draggedTopikId === targetId) { draggedTopikId = null; return; }

      const ids = getTopikMuhadatsah(tingkatFilter).map(t => t.id);
      const from = ids.indexOf(draggedTopikId);
      const to = ids.indexOf(targetId);
      if (from === -1 || to === -1) { draggedTopikId = null; return; }
      ids.splice(from, 1);
      ids.splice(to, 0, draggedTopikId);
      draggedTopikId = null;

      await reorderTopikMuhadatsah(ids);
      rerender();
    });
  });
}

function swapAndReorderTopik(id, direction, rerender) {
  const ids = getTopikMuhadatsah(tingkatFilter).map(t => t.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  reorderTopikMuhadatsah(ids).then(rerender);
}

function bindTopikMoveButtons(root, rerender) {
  root.querySelectorAll('[data-move-topik-up]').forEach(btn => {
    btn.addEventListener('click', (e) => swapAndReorderTopik(e.currentTarget.dataset.moveTopikUp, -1, rerender));
  });
  root.querySelectorAll('[data-move-topik-down]').forEach(btn => {
    btn.addEventListener('click', (e) => swapAndReorderTopik(e.currentTarget.dataset.moveTopikDown, 1, rerender));
  });
}

export function bindCmsEvents(root, rerender) {
  bindDragKategori(root, rerender);
  bindMoveButtons(root, rerender);
  bindDragKuisKategori(root, rerender);
  bindKuisMoveButtons(root, rerender);
  bindDragTopik(root, rerender);
  bindTopikMoveButtons(root, rerender);
  bindDragManageItem(root, rerender);
  bindManageMoveButtons(root, rerender);

  root.querySelectorAll('[data-kuis-jenis]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      kuisJenisFilter = e.currentTarget.dataset.kuisJenis;
      rerender();
    });
  });

  root.querySelector('#add-kuiskategori-btn')?.addEventListener('click', () => {
    editing = { kind: 'kuisKategori', id: null };
    formError = '';
    rerender();
  });
  root.querySelectorAll('[data-open-kuiskategori]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.cms-row__controls')) return; // klik tombol naik/turun, bukan buka kelola
      manage = { kind: 'kuisSoal', kategoriId: el.dataset.openKuiskategori };
      manageItemId = null;
      manageFormError = '';
      rerender();
    });
  });

  root.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      tab = e.currentTarget.dataset.tab;
      rerender();
    });
  });

  root.querySelector('#add-kategori-btn')?.addEventListener('click', () => {
    editing = { kind: 'kategori', id: null };
    formError = '';
    rerender();
  });
  root.querySelectorAll('[data-open-kategori]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.cms-row__controls')) return;
      manage = { kind: 'kata', kategoriId: el.dataset.openKategori };
      manageItemId = null;
      manageFormError = '';
      rerender();
    });
  });

  root.querySelector('#add-topik-btn')?.addEventListener('click', () => {
    editing = { kind: 'topik', id: null };
    dialogRows = [emptyDialogRow()];
    formError = '';
    rerender();
  });
  root.querySelectorAll('[data-open-topik]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.cms-row__controls')) return;
      const id = el.dataset.openTopik;
      editing = { kind: 'topik', id };
      const topik = getTopikMuhadatsah().find(t => t.id === id);
      dialogRows = (topik?.dialog || []).map(d => ({ ...d }));
      if (dialogRows.length === 0) dialogRows = [emptyDialogRow()];
      formError = '';
      rerender();
    });
  });

  root.querySelector('#add-dialog-row-btn')?.addEventListener('click', () => {
    syncDialogRowsFromDom(root);
    dialogRows.push(emptyDialogRow());
    rerender();
  });
  root.querySelectorAll('[data-remove-row]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      syncDialogRowsFromDom(root);
      const idx = Number(e.currentTarget.dataset.removeRow);
      if (dialogRows.length <= 1) return;
      dialogRows.splice(idx, 1);
      rerender();
    });
  });

  // Kalau lagi buka form edit kategori/bab DARI DALAM halaman kelola (manage), balik ke
  // halaman kelola itu lagi setelah batal/simpan — bukan ke daftar bab paling luar.
  root.querySelector('#cms-back-btn')?.addEventListener('click', () => {
    editing = null;
    rerender();
  });
  root.querySelector('#cms-cancel-btn')?.addEventListener('click', () => {
    editing = null;
    rerender();
  });

  root.querySelector('#cms-delete-btn')?.addEventListener('click', async () => {
    const DELETE_CONFIG = {
      kategori: { title: 'Hapus Kategori', message: 'Hapus kategori ini beserta seluruh kata di dalamnya? Tindakan ini tidak dapat dibatalkan.', run: () => deleteKategori(editing.id) },
      topik: { title: 'Hapus Topik Muhadatsah', message: 'Hapus topik muhadatsah ini beserta seluruh dialognya?', run: () => deleteTopikMuhadatsah(editing.id) },
      kuisKategori: { title: 'Hapus Bab Kuis', message: 'Hapus bab ini beserta seluruh soal di dalamnya? Tindakan ini tidak dapat dibatalkan.', run: () => deleteKuisKategori(editing.id) },
      materiKategori: { title: 'Hapus Materi', message: 'Hapus materi ini beserta seluruh blok kontennya? Tindakan ini tidak dapat dibatalkan.', run: () => deleteMateriKategori(editing.id) }
    };
    const config = DELETE_CONFIG[editing.kind];
    if (!config) return;

    const ok = await confirmDialog({ title: config.title, message: config.message, confirmLabel: 'Ya, Hapus', danger: true });
    if (!ok) return;

    await config.run();
    // Bab/kategori yang lagi dikelola baru saja dihapus — keluar dari mode kelola juga.
    if (manage && manage.kategoriId === editing.id) manage = null;
    editing = null;
    rerender();
  });

  root.querySelector('#cms-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target).entries());
    if (editing.kind === 'topik') syncDialogRowsFromDom(root);

    let error = null;
    if (editing.kind === 'kategori') error = validateKategori(form);
    else if (editing.kind === 'topik') error = validateTopik(form, dialogRows);
    else if (editing.kind === 'kuisKategori') error = validateKuisKategori(form);
    else if (editing.kind === 'materiKategori') error = validateMateriKategori(form);

    if (error) {
      formError = error;
      rerender();
      return;
    }

    busy = true;
    formError = '';
    rerender();

    try {
      if (editing.kind === 'kategori') {
        const id = editing.id || slugify(form.id || form.label);
        if (!id) throw new Error('ID kategori tidak valid.');
        const { id: _drop, ...fields } = form;
        fields.bab = Number(fields.bab);
        fields.tingkat = tingkatFilter;
        await saveKategori(id, fields);
      } else if (editing.kind === 'kuisKategori') {
        const fields = editing.id ? { ...form, tingkat: tingkatFilter } : { ...form, jenis: kuisJenisFilter, tingkat: tingkatFilter };
        await saveKuisKategori(editing.id, fields);
      } else if (editing.kind === 'topik') {
        const id = editing.id || slugify(form.id || form.title);
        if (!id) throw new Error('ID topik tidak valid.');
        const { id: _drop, ...fields } = form;
        fields.tingkat = tingkatFilter;
        if (!editing.id) fields.urutan = getTopikMuhadatsah(tingkatFilter).length;
        fields.dialog = dialogRows.map(r => ({
          speaker: r.speaker.trim(),
          side: r.side === 'right' ? 'right' : 'left',
          arabic: r.arabic.trim(),
          translation: r.translation.trim()
        }));
        await saveTopikMuhadatsah(id, fields);
      } else if (editing.kind === 'materiKategori') {
        const fields = { ...form, tingkat: tingkatFilter, bab: Number(form.bab) };
        await saveMateriKategori(editing.id, fields);
      } else if (editing.kind === 'cpTp') {
        await saveCpTp(tingkatFilter, { cp: form.cp || '', tp: form.tp || '' });
      }
      editing = null;
      busy = false;
      rerender();
    } catch (err) {
      formError = err.message || 'Gagal menyimpan. Coba lagi.';
      busy = false;
      rerender();
    }
  });

  // ---------- Split-view "Kelola Kata"/"Kelola Soal" ----------

  root.querySelector('#manage-back-btn')?.addEventListener('click', () => {
    manage = null;
    rerender();
  });

  root.querySelector('#manage-edit-kategori-btn')?.addEventListener('click', () => {
    editing = manage.kind === 'kata' ? { kind: 'kategori', id: manage.kategoriId }
      : manage.kind === 'materiBlok' ? { kind: 'materiKategori', id: manage.kategoriId }
      : { kind: 'kuisKategori', id: manage.kategoriId };
    formError = '';
    rerender();
  });

  root.querySelectorAll('[data-open-manage-item]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.cms-row__controls') || e.target.closest('[data-delete-manage-item]')) return;
      manageItemId = el.dataset.openManageItem;
      manageFormError = '';
      tabelRows = [];
      rerender();
    });
  });

  root.querySelectorAll('[data-delete-manage-item]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = e.currentTarget.dataset.deleteManageItem;
      const label = manage.kind === 'kata' ? 'Kata' : manage.kind === 'materiBlok' ? 'Blok' : 'Soal';
      const ok = await confirmDialog({
        title: `Hapus ${label}`,
        message: `Hapus ${label.toLowerCase()} ini?`,
        confirmLabel: 'Ya, Hapus',
        danger: true
      });
      if (!ok) return;

      if (manage.kind === 'kata') await deleteKata(manage.kategoriId, id);
      else if (manage.kind === 'materiBlok') await deleteMateriBlok(manage.kategoriId, id);
      else await deleteKuisSoalItem(manage.kategoriId, id);

      if (manageItemId === id) manageItemId = null;
      rerender();
    });
  });

  root.querySelector('#manage-form-cancel-btn')?.addEventListener('click', () => {
    manageItemId = null;
    manageFormError = '';
    tabelRows = [];
    rerender();
  });

  root.querySelector('#tts-regenerate-btn')?.addEventListener('click', () => {
    rerender();
  });

  root.querySelector('#manage-remove-gambar-btn')?.addEventListener('click', (e) => {
    root.querySelector('#manage-remove-gambar-flag').value = '1';
    e.currentTarget.closest('div').remove();
  });

  // ---------- Materi: pilih tipe blok & editor tabel ----------

  root.querySelector('#materi-tipe-select')?.addEventListener('change', (e) => {
    materiBlokTipeDraft = e.target.value;
    if (materiBlokTipeDraft === 'tabel') tabelRows = [];
    rerender();
  });

  function syncTabelRowsFromDom() {
    const rowEls = root.querySelectorAll('[data-tabel-row]');
    tabelRows = Array.from(rowEls).map(rowEl =>
      Array.from(rowEl.querySelectorAll('.tabel-cell')).map(input => input.value)
    );
  }

  root.querySelector('#add-tabel-row-btn')?.addEventListener('click', () => {
    syncTabelRowsFromDom();
    tabelRows.push(emptyTabelRow());
    rerender();
  });

  root.querySelector('#add-tabel-col-btn')?.addEventListener('click', () => {
    syncTabelRowsFromDom();
    tabelRows.forEach(r => r.push(''));
    rerender();
  });

  root.querySelectorAll('[data-remove-tabel-row]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      syncTabelRowsFromDom();
      const idx = Number(e.currentTarget.dataset.removeTabelRow);
      if (tabelRows.length <= 1) return;
      tabelRows.splice(idx, 1);
      rerender();
    });
  });

  root.querySelector('#manage-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const gambarFile = formData.get('gambarFile');
    const removeGambar = formData.get('removeGambar') === '1';
    formData.delete('gambarFile');
    formData.delete('removeGambar');
    const form = Object.fromEntries(formData.entries());

    if (manage.kind === 'materiBlok') syncTabelRowsFromDom();

    let error;
    if (manage.kind === 'kata') {
      error = validateKata(form);
    } else if (manage.kind === 'materiBlok') {
      const existing = manageItemId ? getMateriBlok(manage.kategoriId).find(b => b.id === manageItemId) : null;
      const tipe = existing ? existing.tipe : materiBlokTipeDraft;
      error = validateMateriBlok(form, tipe);
    } else {
      const jenis = getKuisKategori().find(k => k.id === manage.kategoriId)?.jenis;
      error = validateKuisSoal(form, jenis);
    }

    if (error) {
      manageFormError = error;
      rerender();
      return;
    }

    manageBusy = true;
    manageFormError = '';
    rerender();

    try {
      if (manage.kind === 'kata') {
        if (gambarFile && gambarFile.size > 0) {
          form.gambarUrl = await uploadKataGambar(manage.kategoriId, manageItemId, gambarFile);
        } else if (!removeGambar && manageItemId) {
          const current = getKosakata().find(w => w.id === manageItemId);
          if (current?.gambarUrl) form.gambarUrl = current.gambarUrl;
        }
        await saveKata(manage.kategoriId, manageItemId, form);
      } else if (manage.kind === 'materiBlok') {
        const existing = manageItemId ? getMateriBlok(manage.kategoriId).find(b => b.id === manageItemId) : null;
        const tipe = existing ? existing.tipe : materiBlokTipeDraft;
        const fields = { tipe };
        if (tipe === 'text') {
          fields.isi = form.isi.trim();
        } else if (tipe === 'tabel') {
          // Firestore tidak dukung array-of-array langsung — tiap baris dibungkus objek { cells: [...] }.
          fields.rows = tabelRows.map(r => ({ cells: r.map(c => (c || '').trim()) }));
        } else if (tipe === 'gambar') {
          fields.caption = (form.caption || '').trim();
          if (gambarFile && gambarFile.size > 0) {
            fields.url = await uploadKataGambar(manage.kategoriId, manageItemId, gambarFile);
          } else if (existing?.url) {
            fields.url = existing.url;
          } else {
            throw new Error('Pilih file gambar untuk diunggah.');
          }
        }
        await saveMateriBlok(manage.kategoriId, manageItemId, fields);
        materiBlokTipeDraft = 'text';
        tabelRows = [];
      } else {
        await saveKuisSoalItem(manage.kategoriId, manageItemId, form);
      }
      manageItemId = null;
      manageBusy = false;
      rerender();
    } catch (err) {
      manageFormError = err.message || 'Gagal menyimpan. Coba lagi.';
      manageBusy = false;
      rerender();
    }
  });

  // ---------- Tab Materi: daftar kategori, drag/reorder ----------

  root.querySelector('#edit-cptp-btn')?.addEventListener('click', () => {
    editing = { kind: 'cpTp', id: null };
    formError = '';
    rerender();
  });

  root.querySelector('#add-materikategori-btn')?.addEventListener('click', () => {
    editing = { kind: 'materiKategori', id: null };
    formError = '';
    rerender();
  });

  root.querySelectorAll('[data-open-materikategori]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.cms-row__controls')) return;
      manage = { kind: 'materiBlok', kategoriId: el.dataset.openMaterikategori };
      manageItemId = null;
      manageFormError = '';
      materiBlokTipeDraft = 'text';
      tabelRows = [];
      rerender();
    });
  });

  bindDragMateriKategori(root, rerender);
  bindMateriKategoriMoveButtons(root, rerender);

  root.querySelectorAll('[data-tingkat]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      tingkatFilter = e.currentTarget.dataset.tingkat;
      rerender();
    });
  });

  root.querySelector('#migrate-tingkat-btn')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Migrasi Konten Lama',
      message: `Semua mufrodat, muhadatsah, kuis, dan materi lama yang belum punya tingkat akan ditandai sebagai <strong>Kelas ${tingkatFilter}</strong>. Lanjutkan?`,
      confirmLabel: 'Ya, Tandai',
      danger: false
    });
    if (!ok) return;

    const btn = root.querySelector('#migrate-tingkat-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Memproses...'; }
    try {
      await migrateMissingTingkat(tingkatFilter);
      rerender();
    } catch (err) {
      console.error('migrateMissingTingkat failed:', err);
      if (btn) { btn.disabled = false; btn.textContent = `Tandai semua sebagai Kelas ${tingkatFilter}`; }
    }
  });
}

let draggedMateriKategoriId = null;

function bindDragMateriKategori(root, rerender) {
  root.querySelectorAll('[data-materikategori-drag]').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      draggedMateriKategoriId = el.dataset.materikategoriDrag;
      e.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      const targetId = el.dataset.materikategoriDrag;
      if (!draggedMateriKategoriId || draggedMateriKategoriId === targetId) { draggedMateriKategoriId = null; return; }

      const ids = getMateriKategori(tingkatFilter).map(k => k.id);
      const from = ids.indexOf(draggedMateriKategoriId);
      const to = ids.indexOf(targetId);
      if (from === -1 || to === -1) { draggedMateriKategoriId = null; return; }
      ids.splice(from, 1);
      ids.splice(to, 0, draggedMateriKategoriId);
      draggedMateriKategoriId = null;

      await reorderMateriKategori(ids);
      rerender();
    });
  });
}

function swapAndReorderMateriKategori(id, direction, rerender) {
  const ids = getMateriKategori(tingkatFilter).map(k => k.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  reorderMateriKategori(ids).then(rerender);
}

function bindMateriKategoriMoveButtons(root, rerender) {
  root.querySelectorAll('[data-move-materikategori-up]').forEach(btn => {
    btn.addEventListener('click', (e) => swapAndReorderMateriKategori(e.currentTarget.dataset.moveMaterikategoriUp, -1, rerender));
  });
  root.querySelectorAll('[data-move-materikategori-down]').forEach(btn => {
    btn.addEventListener('click', (e) => swapAndReorderMateriKategori(e.currentTarget.dataset.moveMaterikategoriDown, 1, rerender));
  });
}
