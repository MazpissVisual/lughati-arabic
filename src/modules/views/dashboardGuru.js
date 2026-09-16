import {
  createKelas, getKelasByGuru, getCachedKelasList,
  getMuridByKelas, getProgresForMuridBatch, getProgresForMurid, renameKelas, deleteKelas
} from '../kelas.js';
import { getUserLevel } from '../progress.js';
import { promptDialog, confirmDialog, showToast } from '../ui.js';
import { icon } from '../icons.js';
import {
  getCatatanKelas, saveCatatanKelas, updateCatatanKelas, deleteCatatanKelas,
  getCatatanMurid, saveCatatanMurid, updateCatatanMurid, deleteCatatanMurid,
  getCatatanPengerjaan, saveCatatanPengerjaan, deleteCatatanPengerjaan
} from '../catatan.js';

let kelasList = [];
let selectedKelasId = null;
let muridRows = []; // { uid, nama, xp, streak, learnedWordsCount, learnedLettersCount, quizAvg, levelName }
let classAvg = null; // { xp, quizAvg, learnedWordsCount, learnedLettersCount }
let loadingKelas = false;
let loadingMurid = false;
let errorMurid = '';
let filterModul = 'semua'; // 'semua' | 'hijaiyah' | 'mufrodat' | 'kuis'
let searchMurid = ''; // filter nama murid, penting untuk kelas besar (60+ murid)
let lastGuruUid = null;
let muridLoadToken = 0; // dibatalkan (diabaikan hasilnya) kalau ganti kelas lagi sebelum fetch lama selesai
let catatanKelasList = []; // catatan broadcast untuk kelas yang lagi dipilih (fitur Rapor)

export function renderDashboardGuru() {
  const kelasOptionsHtml = kelasList.map(k => `
    <option value="${k.id}" ${k.id === selectedKelasId ? 'selected' : ''}>${k.nama}</option>
  `).join('');

  const q = searchMurid.trim().toLowerCase();
  const filteredRows = q ? muridRows.filter(m => m.nama.toLowerCase().includes(q)) : muridRows;

  const rowsHtml = filteredRows.map((m, idx) => `
    <tr class="dashboard-murid-row" data-open-murid="${m.uid}" style="cursor:pointer; ${idx % 2 === 1 ? 'background:var(--color-ink-50, #FAFAFA);' : ''}">
      <td style="padding:10px 12px; font-weight:var(--fw-semibold);">${m.nama} ${icon('chevronRight', { size: 12, className: 'dashboard-murid-row__chevron' })}</td>
      ${filterModul === 'semua' || filterModul === 'hijaiyah' ? `<td style="padding:10px 12px; text-align:center;">${m.learnedLettersCount}</td>` : ''}
      ${filterModul === 'semua' || filterModul === 'mufrodat' ? `<td style="padding:10px 12px; text-align:center;">${m.learnedWordsCount}</td>` : ''}
      ${filterModul === 'semua' || filterModul === 'kuis' ? `<td style="padding:10px 12px; text-align:center;">${m.quizAvg}%</td>` : ''}
      <td style="padding:10px 12px; text-align:center;">${m.xp}</td>
      <td style="padding:10px 12px; text-align:center;">${m.streak} hari</td>
      <td style="padding:10px 12px; text-align:center;">${m.levelName}</td>
    </tr>
  `).join('');

  const avgRowHtml = classAvg ? `
    <tr style="background:var(--color-primary-50); font-weight:var(--fw-bold);">
      <td style="padding:10px 12px;">Rata-rata Kelas</td>
      ${filterModul === 'semua' || filterModul === 'hijaiyah' ? `<td style="padding:10px 12px; text-align:center;">${classAvg.learnedLettersCount}</td>` : ''}
      ${filterModul === 'semua' || filterModul === 'mufrodat' ? `<td style="padding:10px 12px; text-align:center;">${classAvg.learnedWordsCount}</td>` : ''}
      ${filterModul === 'semua' || filterModul === 'kuis' ? `<td style="padding:10px 12px; text-align:center;">${classAvg.quizAvg}%</td>` : ''}
      <td style="padding:10px 12px; text-align:center;">${classAvg.xp}</td>
      <td colspan="2"></td>
    </tr>
  ` : '';

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <div class="card" style="display:flex; flex-wrap:wrap; gap:var(--space-3); align-items:flex-end; padding:var(--space-4);">
        <label style="display:flex; flex-direction:column; gap:4px; font-size:var(--fs-sm);">
          Kelas
          <select id="kelas-select" style="padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);" ${loadingKelas ? 'disabled' : ''}>
            ${kelasList.length ? kelasOptionsHtml : `<option value="">${loadingKelas ? 'Memuat...' : 'Belum ada kelas'}</option>`}
          </select>
        </label>
        <label style="display:flex; flex-direction:column; gap:4px; font-size:var(--fs-sm);">
          Filter Modul
          <select id="modul-select" style="padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);">
            <option value="semua" ${filterModul === 'semua' ? 'selected' : ''}>Semua Modul</option>
            <option value="hijaiyah" ${filterModul === 'hijaiyah' ? 'selected' : ''}>Hijaiyah</option>
            <option value="mufrodat" ${filterModul === 'mufrodat' ? 'selected' : ''}>Mufrodat</option>
            <option value="kuis" ${filterModul === 'kuis' ? 'selected' : ''}>Kuis</option>
          </select>
        </label>
        <button class="btn btn--secondary" style="width:auto;" id="new-kelas-btn" ${loadingKelas ? 'disabled' : ''}>+ Buat Kelas Baru</button>
        <button class="header-btn" id="refresh-btn" title="Muat ulang data" aria-label="Muat ulang data" style="width:auto; padding:0 10px; display:inline-flex; align-items:center; gap:6px; font-size:var(--fs-xs);" ${(loadingKelas || loadingMurid) ? 'disabled' : ''}>
          ${icon('refresh', { size: 14, className: (loadingKelas || loadingMurid) ? 'spin' : '' })} ${(loadingKelas || loadingMurid) ? 'Memperbarui...' : 'Refresh'}
        </button>
      </div>

      ${kelasList.length === 0 ? `
        <div class="card" style="text-align:center; padding:var(--space-8); color:var(--color-ink-500);">
          ${loadingKelas ? 'Memuat data kelas...' : 'Kamu belum punya kelas. Buat kelas baru, lalu bagikan <strong>kode kelas</strong> ke murid supaya mereka bisa gabung lewat halaman Profil.'}
        </div>
      ` : `
        <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <div class="section-title" style="font-size:var(--fs-sm);">${icon('message', { size: 15 })} Catatan untuk Kelas Ini</div>
            <button class="btn btn--secondary" id="add-catatan-kelas-btn" style="width:auto; height:30px; padding:0 12px; font-size:var(--fs-xs);">+ Tambah Catatan</button>
          </div>
          ${catatanKelasList.length ? catatanKelasList.map(c => `
            <div class="rapor-note">
              <div class="rapor-note__text">${escapeHtml(c.text)}</div>
              <button type="button" class="header-btn" data-edit-catatan-kelas="${c.id}" title="Edit catatan" aria-label="Edit catatan" style="flex-shrink:0; width:24px; height:24px;">${icon('settings', { size: 12 })}</button>
              <button type="button" class="header-btn" data-delete-catatan-kelas="${c.id}" title="Hapus catatan" aria-label="Hapus catatan" style="flex-shrink:0; width:24px; height:24px;">${icon('x', { size: 12 })}</button>
            </div>
          `).join('') : `<div style="font-size:var(--fs-xs); color:var(--color-ink-400);">Belum ada catatan untuk kelas ini.</div>`}
        </div>

        <div class="card" style="padding:var(--space-2);">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; gap:8px; flex-wrap:wrap;">
            <span style="font-size:var(--fs-xs); color:var(--color-ink-500);">
              Kode kelas untuk dibagikan ke murid: <strong id="kode-kelas-text">${selectedKelasId || '-'}</strong>
            </span>
            <div style="display:flex; gap:6px;">
              <button class="header-btn" id="copy-kode-btn" title="Salin kode kelas" aria-label="Salin kode kelas" style="display:inline-flex; align-items:center; gap:4px; font-size:var(--fs-2xs); width:auto; padding:4px 10px;">
                ${icon('clipboard', { size: 13 })} Salin
              </button>
              <button class="header-btn" id="rename-kelas-btn" title="Ubah nama kelas" aria-label="Ubah nama kelas" style="display:inline-flex; align-items:center; gap:4px; font-size:var(--fs-2xs); width:auto; padding:4px 10px;">
                ${icon('settings', { size: 13 })} Ubah Nama
              </button>
              <button class="header-btn" id="delete-kelas-btn" title="Hapus kelas" aria-label="Hapus kelas" style="display:inline-flex; align-items:center; gap:4px; font-size:var(--fs-2xs); width:auto; padding:4px 10px; color:var(--color-error);">
                ${icon('x', { size: 13 })} Hapus
              </button>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 12px 12px; gap:8px; flex-wrap:wrap;">
            <span style="font-size:var(--fs-xs); color:var(--color-ink-500);">${muridRows.length} murid${q ? ` · ${filteredRows.length} cocok dengan pencarian` : ''}</span>
            <div style="position:relative; flex:1; max-width:220px; min-width:140px;">
              <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--color-ink-400); display:flex;">${icon('search', { size: 13 })}</span>
              <input type="text" id="murid-search" value="${escapeAttr(searchMurid)}" placeholder="Cari nama murid..." style="width:100%; padding:6px 10px 6px 30px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200); font-size:var(--fs-xs);">
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:var(--fs-sm);">
              <thead>
                <tr style="border-bottom:1px solid var(--color-ink-200); color:var(--color-ink-500); font-size:var(--fs-xs); text-align:left;">
                  <th style="padding:8px 12px;">Nama Murid</th>
                  ${filterModul === 'semua' || filterModul === 'hijaiyah' ? '<th style="padding:8px 12px; text-align:center;">Huruf Dikuasai</th>' : ''}
                  ${filterModul === 'semua' || filterModul === 'mufrodat' ? '<th style="padding:8px 12px; text-align:center;">Kata Dipelajari</th>' : ''}
                  ${filterModul === 'semua' || filterModul === 'kuis' ? '<th style="padding:8px 12px; text-align:center;">Rata Kuis</th>' : ''}
                  <th style="padding:8px 12px; text-align:center;">XP</th>
                  <th style="padding:8px 12px; text-align:center;">Streak</th>
                  <th style="padding:8px 12px; text-align:center;">Level</th>
                </tr>
              </thead>
              <tbody>
                ${avgRowHtml}
                ${filteredRows.length
                  ? rowsHtml
                  : `<tr><td colspan="7" style="padding:20px; text-align:center; color:${errorMurid ? 'var(--color-error)' : 'var(--color-ink-400)'};">${
                      loadingMurid
                        ? `${icon('refresh', { size: 14, className: 'spin' })} Memuat data murid...`
                        : (errorMurid || (q ? `Tidak ada murid bernama "${searchMurid}".` : 'Belum ada murid di kelas ini.'))
                    }</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `}
    </div>
  `;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

// Beda dari escapeAttr (cuma aman untuk value atribut HTML): ini buat teks yang di-render sebagai
// KONTEN HTML (mis. isi catatan guru) — kalau cuma escapeAttr, karakter < atau & di teks bebas
// bikin browser salah parsing (dianggap awal tag) dan tampilannya rusak/hilang sebagian.
function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function computeClassAvg(rows) {
  if (rows.length === 0) return null;
  const sum = (key) => rows.reduce((acc, r) => acc + r[key], 0);
  return {
    xp: Math.round(sum('xp') / rows.length),
    quizAvg: Math.round(sum('quizAvg') / rows.length),
    learnedWordsCount: Math.round(sum('learnedWordsCount') / rows.length),
    learnedLettersCount: Math.round(sum('learnedLettersCount') / rows.length)
  };
}

// Ambil daftar murid + progres sekaligus lewat batch query (bukan satu-satu per murid) — penting untuk kelas besar.
// Dibungkus try/catch/finally supaya kalau ada error, "Memuat..." tidak nyangkut selamanya — langsung tampil pesan.
// `muridLoadToken` mencegah race condition: kalau guru ganti kelas lagi sebelum fetch kelas
// sebelumnya selesai, hasil yang telat itu diabaikan (bukan menimpa data kelas yang sedang aktif).
async function loadMuridRows(kelasId, rerender) {
  const myToken = ++muridLoadToken;
  loadingMurid = true;
  errorMurid = '';
  rerender();

  try {
    const [murid, kelasNotes] = await Promise.all([getMuridByKelas(kelasId), getCatatanKelas(kelasId)]);
    const progresMap = await getProgresForMuridBatch(murid.map(m => m.id));
    if (myToken !== muridLoadToken) return; // sudah ganti kelas lagi, buang hasil ini

    catatanKelasList = kelasNotes;

    const rows = murid.map((m) => {
      const progres = progresMap[m.id] || {};
      const quizScores = progres.quizScores || [];
      const validScores = quizScores.filter(q => q.total > 0);
      const quizAvg = validScores.length
        ? Math.round((validScores.reduce((acc, q) => acc + (q.score / q.total), 0) / validScores.length) * 100)
        : 0;
      return {
        uid: m.id,
        nama: m.nama || m.username || m.id,
        xp: progres.xp || 0,
        streak: progres.streak || 1,
        learnedWordsCount: (progres.learnedWords || []).length,
        learnedLettersCount: (progres.learnedLetters || []).length,
        quizAvg,
        levelName: getUserLevel(progres.xp || 0).name
      };
    });

    rows.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

    muridRows = rows;
    classAvg = computeClassAvg(rows);
  } catch (err) {
    if (myToken !== muridLoadToken) return;
    muridRows = [];
    classAvg = null;
    errorMurid = 'Gagal memuat data murid. Coba pilih ulang kelasnya atau refresh halaman.';
    console.error('loadMuridRows failed:', err);
  } finally {
    if (myToken === muridLoadToken) {
      loadingMurid = false;
      rerender();
    }
  }
}

// Selalu refresh saat halaman dibuka (stale-while-revalidate): kalau ada data cache/lama, tampilkan dulu,
// baru diam-diam diperbarui di background — supaya tidak pernah lihat data basi tapi juga tidak nunggu blank.
async function refreshDashboard(guruUid, rerender) {
  const cached = getCachedKelasList(guruUid);
  if (cached) kelasList = cached;

  loadingKelas = true;
  if (kelasList.length === 0) rerender();

  try {
    const freshKelasList = await getKelasByGuru(guruUid, { forceRefresh: true });
    kelasList = freshKelasList;
    if (!selectedKelasId || !kelasList.find(k => k.id === selectedKelasId)) {
      selectedKelasId = kelasList[0]?.id || null;
    }
  } catch (err) {
    console.error('refreshDashboard (kelas) failed:', err);
  } finally {
    loadingKelas = false;
    rerender();
  }

  if (selectedKelasId) await loadMuridRows(selectedKelasId, rerender);
}

// Dipanggil SEKALI saat halaman ini pertama kali dibuka (bukan setiap render) untuk memicu fetch data.
export function mountDashboardGuru(guruUid, rerender) {
  // Kalau guru yang login beda dari kunjungan sebelumnya (ganti akun di tab yang sama), jangan
  // sempat nampilin data kelas guru lama — reset dulu sebelum stale-while-revalidate jalan.
  if (guruUid !== lastGuruUid) {
    kelasList = [];
    selectedKelasId = null;
    muridRows = [];
    classAvg = null;
    errorMurid = '';
    catatanKelasList = [];
    lastGuruUid = guruUid;
  }
  refreshDashboard(guruUid, rerender);
}

export function bindDashboardGuruEvents(root, rerender, guruUid) {
  root.querySelector('#kelas-select')?.addEventListener('change', async (e) => {
    selectedKelasId = e.target.value;
    muridRows = [];
    classAvg = null;
    catatanKelasList = [];
    searchMurid = '';
    await loadMuridRows(selectedKelasId, rerender);
  });

  root.querySelector('#modul-select')?.addEventListener('change', (e) => {
    filterModul = e.target.value;
    rerender();
  });

  root.querySelector('#refresh-btn')?.addEventListener('click', () => {
    refreshDashboard(guruUid, rerender);
  });

  root.querySelector('#copy-kode-btn')?.addEventListener('click', async () => {
    if (!selectedKelasId) return;
    try {
      await navigator.clipboard.writeText(selectedKelasId);
      const btn = root.querySelector('#copy-kode-btn');
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = `${icon('check', { size: 13 })} Tersalin`;
        setTimeout(() => { btn.innerHTML = original; }, 1500);
      }
    } catch {
      // Clipboard API tidak tersedia (mis. konteks non-HTTPS) — biarkan user salin manual dari teks kode.
    }
  });

  root.querySelector('#rename-kelas-btn')?.addEventListener('click', async () => {
    if (!selectedKelasId) return;
    const currentNama = kelasList.find(k => k.id === selectedKelasId)?.nama || '';
    const nama = await promptDialog({
      title: 'Ubah Nama Kelas',
      label: 'Nama Kelas',
      defaultValue: currentNama,
      confirmLabel: 'Simpan'
    });
    if (!nama) return;

    try {
      await renameKelas(selectedKelasId, nama);
      kelasList = await getKelasByGuru(guruUid, { forceRefresh: true });
      rerender();
    } catch (err) {
      console.error('renameKelas failed:', err);
      showToast('Gagal mengubah nama kelas. Coba lagi.');
    }
  });

  root.querySelector('#delete-kelas-btn')?.addEventListener('click', async () => {
    if (!selectedKelasId) return;
    const kelasNama = kelasList.find(k => k.id === selectedKelasId)?.nama || selectedKelasId;
    const jumlahMurid = muridRows.length;
    const ok = await confirmDialog({
      title: 'Hapus Kelas',
      message: `Yakin mau hapus kelas "${kelasNama}"? ${jumlahMurid > 0 ? `${jumlahMurid} murid di kelas ini akan dilepas (progres belajar mereka tetap aman, tinggal join lagi pakai kode kelas lain).` : 'Kelas ini belum punya murid.'}`,
      confirmLabel: 'Ya, Hapus',
      danger: true
    });
    if (!ok) return;

    try {
      await deleteKelas(selectedKelasId);
      kelasList = await getKelasByGuru(guruUid, { forceRefresh: true });
      selectedKelasId = kelasList[0]?.id || null;
      muridRows = [];
      classAvg = null;
      catatanKelasList = [];
      searchMurid = '';
      rerender();
      if (selectedKelasId) await loadMuridRows(selectedKelasId, rerender);
    } catch (err) {
      console.error('deleteKelas failed:', err);
      showToast('Gagal menghapus kelas. Coba lagi.');
    }
  });

  root.querySelector('#new-kelas-btn')?.addEventListener('click', async () => {
    const nama = await promptDialog({
      title: 'Buat Kelas Baru',
      label: 'Nama Kelas',
      placeholder: 'contoh: Kelas 7A',
      confirmLabel: 'Buat Kelas'
    });
    if (!nama) return;

    loadingKelas = true;
    rerender();
    try {
      const id = await createKelas(nama, guruUid);
      kelasList = await getKelasByGuru(guruUid, { forceRefresh: true });
      selectedKelasId = id;
    } catch (err) {
      console.error('createKelas failed:', err);
      showToast('Gagal membuat kelas baru. Coba lagi.');
    } finally {
      loadingKelas = false;
      rerender();
    }
    if (selectedKelasId) await loadMuridRows(selectedKelasId, rerender);
  });

  root.querySelector('#murid-search')?.addEventListener('input', (e) => {
    searchMurid = e.target.value;
    const cursorPos = e.target.selectionStart;
    rerender();
    // rerender() mengganti innerHTML total (bukan diff), jadi elemen input-nya baru dan kehilangan
    // fokus/posisi kursor — kembalikan manual supaya guru tidak perlu klik ulang tiap ketik.
    const newInput = root.querySelector('#murid-search');
    if (newInput) {
      newInput.focus();
      newInput.setSelectionRange(cursorPos, cursorPos);
    }
  });

  root.querySelector('#add-catatan-kelas-btn')?.addEventListener('click', async () => {
    if (!selectedKelasId) return;
    const text = await promptDialog({
      title: 'Tambah Catatan untuk Kelas',
      label: 'Catatan (akan terlihat oleh semua murid di kelas ini)',
      placeholder: 'contoh: Ujian tengah semester minggu depan, tolong pelajari bab 1-3.',
      confirmLabel: 'Simpan',
      multiline: true
    });
    if (!text) return;
    try {
      await saveCatatanKelas(selectedKelasId, guruUid, text);
      catatanKelasList = await getCatatanKelas(selectedKelasId);
      rerender();
    } catch (err) {
      console.error('saveCatatanKelas failed:', err);
      showToast('Gagal menyimpan catatan. Coba lagi.');
    }
  });

  root.querySelectorAll('[data-edit-catatan-kelas]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const noteId = e.currentTarget.dataset.editCatatanKelas;
      const current = catatanKelasList.find(c => c.id === noteId);
      const text = await promptDialog({
        title: 'Edit Catatan Kelas',
        label: 'Catatan (akan terlihat oleh semua murid di kelas ini)',
        defaultValue: current?.text || '',
        confirmLabel: 'Simpan',
        multiline: true
      });
      if (!text) return;
      try {
        await updateCatatanKelas(noteId, text);
        catatanKelasList = await getCatatanKelas(selectedKelasId);
        rerender();
      } catch (err) {
        console.error('updateCatatanKelas failed:', err);
        showToast('Gagal menyimpan perubahan. Coba lagi.');
      }
    });
  });

  root.querySelectorAll('[data-delete-catatan-kelas]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const noteId = e.currentTarget.dataset.deleteCatatanKelas;
      const ok = await confirmDialog({ title: 'Hapus Catatan', message: 'Yakin mau hapus catatan ini?', confirmLabel: 'Ya, Hapus', danger: true });
      if (!ok) return;
      try {
        await deleteCatatanKelas(noteId);
        catatanKelasList = catatanKelasList.filter(c => c.id !== noteId);
        rerender();
      } catch (err) {
        console.error('deleteCatatanKelas failed:', err);
        showToast('Gagal menghapus catatan. Coba lagi.');
      }
    });
  });

  root.querySelectorAll('[data-open-murid]').forEach(el => {
    el.addEventListener('click', () => {
      const uid = el.dataset.openMurid;
      const murid = muridRows.find(m => m.uid === uid);
      if (murid) openMuridDetailModal(uid, murid.nama, guruUid, selectedKelasId);
    });
  });
}

// ---------- Modal Detail Murid: catatan individu + riwayat kuis + catatan per-pengerjaan ----------

async function openMuridDetailModal(muridUid, muridNama, guruUid, kelasId) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay" id="murid-detail-overlay">
      <div class="modal-content" style="max-width:520px;">
        <div class="modal-handle"></div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-primary-700);">${muridNama}</h3>
          <button id="murid-detail-close">${icon('x', { size: 18 })}</button>
        </div>
        <div style="text-align:center; padding:var(--space-6); color:var(--color-ink-400);">${icon('refresh', { size: 16, className: 'spin' })} Memuat...</div>
      </div>
    </div>
  `;
  const closeModal = () => { container.innerHTML = ''; };
  document.getElementById('murid-detail-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'murid-detail-overlay') closeModal();
  });
  document.getElementById('murid-detail-close')?.addEventListener('click', closeModal);

  // allSettled (bukan Promise.all) — kalau salah satu dari 3 fetch ini gagal (mis. rules belum
  // sinkron atau salah satu collection catatan kosong/error), bagian lain yang berhasil tetap
  // ditampilkan, bukan bikin seluruh modal gagal total cuma gara-gara 1 query bermasalah.
  const [progresResult, notesMuridResult, notesPengerjaanResult] = await Promise.allSettled([
    getProgresForMurid(muridUid),
    getCatatanMurid(muridUid, kelasId),
    getCatatanPengerjaan(muridUid, kelasId)
  ]);

  const failures = [progresResult, notesMuridResult, notesPengerjaanResult].filter(r => r.status === 'rejected');
  failures.forEach(r => console.error('openMuridDetailModal partial failure:', r.reason));

  if (failures.length === 3) {
    const body = container.querySelector('.modal-content');
    if (body) {
      const loadingEl = body.querySelector('div[style*="text-align:center"]');
      if (loadingEl) loadingEl.innerHTML = `<span style="color:var(--color-error);">Gagal memuat detail murid: ${escapeHtml(failures[0].reason?.message || 'Terjadi kesalahan.')}</span>`;
    }
    return;
  }

  const progres = progresResult.status === 'fulfilled' ? progresResult.value : null;
  const notesMurid = notesMuridResult.status === 'fulfilled' ? notesMuridResult.value : [];
  const notesPengerjaan = notesPengerjaanResult.status === 'fulfilled' ? notesPengerjaanResult.value : [];
  // Ditampilkan langsung di UI (bukan cuma console.error) supaya kegagalan sebagian query
  // kelihatan jelas — sebelumnya query yang gagal cuma diam-diam dianggap "kosong", jadi guru
  // lihat "Belum ada catatan" padahal query-nya beneran error, bukan datanya memang kosong.
  const notesMuridError = notesMuridResult.status === 'rejected' ? (notesMuridResult.reason?.message || 'Gagal memuat.') : null;

  const pengerjaanMap = {};
  notesPengerjaan.forEach(n => { pengerjaanMap[n.attemptId] = n; });
  const quizScores = [...(progres?.quizScores || [])].reverse();

  renderMuridDetailContent(container, {
    muridUid, muridNama, guruUid, kelasId, notesMurid, notesMuridError, quizScores, pengerjaanMap
  });
}

function renderMuridDetailContent(container, state) {
  const { muridUid, muridNama, guruUid, kelasId, notesMurid, notesMuridError, quizScores, pengerjaanMap } = state;

  const notesMuridHtml = notesMuridError
    ? `<div style="font-size:var(--fs-xs); color:var(--color-error);">Gagal memuat catatan: ${escapeHtml(notesMuridError)}</div>`
    : (notesMurid.length ? notesMurid.map(c => `
    <div class="rapor-note">
      <div class="rapor-note__text">${escapeHtml(c.text)}</div>
      <button type="button" class="header-btn" data-edit-catatan-murid="${c.id}" title="Edit" aria-label="Edit catatan" style="flex-shrink:0; width:24px; height:24px;">${icon('settings', { size: 12 })}</button>
      <button type="button" class="header-btn" data-delete-catatan-murid="${c.id}" title="Hapus" aria-label="Hapus catatan" style="flex-shrink:0; width:24px; height:24px;">${icon('x', { size: 12 })}</button>
    </div>
  `).join('') : `<div style="font-size:var(--fs-xs); color:var(--color-ink-400);">Belum ada catatan khusus.</div>`);

  const attemptsHtml = quizScores.length ? quizScores.map(s => {
    const note = s.id ? pengerjaanMap[s.id] : null;
    const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
    return `
      <div class="rapor-attempt">
        <div class="rapor-attempt__row">
          <div>
            <div class="rapor-attempt__type">${s.type || 'Kuis'}</div>
            <div class="rapor-attempt__date">${formatDate(s.date)}</div>
          </div>
          <div class="rapor-attempt__score ${pct >= 60 ? 'is-good' : 'is-bad'}">${s.score}/${s.total} <span>(${pct}%)</span></div>
        </div>
        ${note ? `
          <div class="rapor-note rapor-note--attempt">
            ${icon('message', { size: 12 })}
            <div class="rapor-note__text">${escapeHtml(note.text)}</div>
            ${s.id ? `<button type="button" class="header-btn" data-delete-catatan-attempt="${s.id}" title="Hapus" aria-label="Hapus catatan" style="flex-shrink:0; width:22px; height:22px;">${icon('x', { size: 11 })}</button>` : ''}
          </div>
        ` : ''}
        ${s.id ? `<button type="button" class="btn btn--outline" data-add-catatan-attempt="${s.id}" style="width:auto; align-self:flex-start; height:26px; padding:0 10px; font-size:var(--fs-2xs);">${note ? 'Edit Catatan' : '+ Catatan'}</button>` : ''}
      </div>
    `;
  }).join('') : `<div style="font-size:var(--fs-xs); color:var(--color-ink-400);">Belum ada riwayat pengerjaan kuis.</div>`;

  const body = container.querySelector('.modal-content');
  if (!body) return;
  body.innerHTML = `
    <div class="modal-handle"></div>
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h3 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-primary-700);">${muridNama}</h3>
      <button id="murid-detail-close">${icon('x', { size: 18 })}</button>
    </div>
    <div style="max-height:60vh; overflow-y:auto; display:flex; flex-direction:column; gap:var(--space-4);">
      <div style="display:flex; flex-direction:column; gap:var(--space-2);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="section-title" style="font-size:var(--fs-sm);">Catatan Khusus</div>
          <button class="btn btn--secondary" id="add-catatan-murid-btn" style="width:auto; height:28px; padding:0 10px; font-size:var(--fs-2xs);">+ Tambah</button>
        </div>
        ${notesMuridHtml}
      </div>
      <div style="display:flex; flex-direction:column; gap:var(--space-2);">
        <div class="section-title" style="font-size:var(--fs-sm);">Riwayat Pengerjaan Kuis</div>
        ${attemptsHtml}
      </div>
    </div>
  `;

  document.getElementById('murid-detail-close')?.addEventListener('click', () => { container.innerHTML = ''; });

  const refresh = () => openMuridDetailModal(muridUid, muridNama, guruUid, kelasId);

  document.getElementById('add-catatan-murid-btn')?.addEventListener('click', async () => {
    const text = await promptDialog({
      title: `Catatan untuk ${muridNama}`,
      label: 'Catatan (hanya terlihat oleh murid ini)',
      confirmLabel: 'Simpan',
      multiline: true
    });
    if (text) {
      try {
        await saveCatatanMurid(muridUid, kelasId, guruUid, text);
      } catch (err) {
        console.error('saveCatatanMurid failed:', err);
        showToast('Gagal menyimpan catatan. Coba lagi.');
      }
    }
    refresh();
  });

  body.querySelectorAll('[data-edit-catatan-murid]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const noteId = e.currentTarget.dataset.editCatatanMurid;
      const current = notesMurid.find(c => c.id === noteId);
      const text = await promptDialog({
        title: `Edit Catatan untuk ${muridNama}`,
        label: 'Catatan (hanya terlihat oleh murid ini)',
        defaultValue: current?.text || '',
        confirmLabel: 'Simpan',
        multiline: true
      });
      if (text) {
        try { await updateCatatanMurid(noteId, text); } catch (err) { console.error('updateCatatanMurid failed:', err); showToast('Gagal menyimpan perubahan.'); }
      }
      refresh();
    });
  });

  body.querySelectorAll('[data-delete-catatan-murid]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const noteId = e.currentTarget.dataset.deleteCatatanMurid;
      const ok = await confirmDialog({ title: 'Hapus Catatan', message: 'Yakin mau hapus catatan ini?', confirmLabel: 'Ya, Hapus', danger: true });
      if (ok) {
        try { await deleteCatatanMurid(noteId); } catch (err) { console.error('deleteCatatanMurid failed:', err); showToast('Gagal menghapus catatan.'); }
      }
      refresh();
    });
  });

  body.querySelectorAll('[data-add-catatan-attempt]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const attemptId = e.currentTarget.dataset.addCatatanAttempt;
      const existing = pengerjaanMap[attemptId];
      const text = await promptDialog({
        title: 'Catatan untuk Pengerjaan Ini',
        label: 'Catatan',
        defaultValue: existing?.text || '',
        confirmLabel: 'Simpan',
        multiline: true
      });
      if (text) {
        try {
          await saveCatatanPengerjaan(muridUid, kelasId, attemptId, guruUid, text);
        } catch (err) {
          console.error('saveCatatanPengerjaan failed:', err);
          showToast('Gagal menyimpan catatan. Coba lagi.');
        }
      }
      refresh();
    });
  });

  body.querySelectorAll('[data-delete-catatan-attempt]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const attemptId = e.currentTarget.dataset.deleteCatatanAttempt;
      const ok = await confirmDialog({ title: 'Hapus Catatan', message: 'Yakin mau hapus catatan ini?', confirmLabel: 'Ya, Hapus', danger: true });
      if (ok) {
        try { await deleteCatatanPengerjaan(muridUid, attemptId); } catch (err) { console.error('deleteCatatanPengerjaan failed:', err); showToast('Gagal menghapus catatan.'); }
      }
      refresh();
    });
  });
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}
