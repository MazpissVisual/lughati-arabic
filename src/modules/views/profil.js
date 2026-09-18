import { hijaiyah } from '../../data/hijaiyah.js';
import { getKosakata } from '../content.js';
import { badges } from '../../data/achievements.js';
import { getSummary, resetProgress } from '../progress.js';
import { getMyKelasInfo, joinKelas, leaveKelas, getKelasByGuru, getCachedKelasList, getMuridByKelas } from '../kelas.js';
import { getCurrentRole, getCurrentUser, getCurrentNama } from '../auth.js';
import { speakArabic, getAvailableArabicVoices, getSelectedVoiceURI, setSelectedVoiceURI } from '../speech.js';
import { icon } from '../icons.js';
import { confirmDialog } from '../ui.js';

let guruStats = null; // { kelasList: [{id,nama,jumlahMurid}], totalMurid }
let guruStatsError = '';
let guruStatsLoading = false;
let lastGuruStatsUid = null;

export function renderProfil() {
  return getCurrentRole() === 'guru' ? renderProfilGuru() : renderProfilMurid();
}

// ---------- Profil Guru ----------

function renderProfilGuru() {
  const nama = getCurrentNama() || 'Guru';
  const email = getCurrentUser()?.email || '';

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <div class="profile-hero">
        <div class="profile-avatar">${icon('user', { size: 34 })}</div>
        <div class="profile-name">${nama}</div>
        <div class="level-tag">${icon('users', { size: 14 })} Guru</div>
        <div style="font-size:var(--fs-xs); color:rgba(255,255,255,0.85); margin-top:8px;">${email}</div>
      </div>

      <div style="display:flex; gap:var(--space-3);">
        <a class="btn btn--primary" href="/dashboard" style="flex:1;">${icon('chart', { size: 14 })} Dashboard Kelas</a>
        <a class="btn btn--secondary" href="/cms" style="flex:1;">${icon('settings', { size: 14 })} Kelola Konten</a>
      </div>

      <div class="section-header">
        <h3 class="section-title">${icon('chart', { size: 18 })} Ringkasan Mengajar</h3>
        <button class="header-btn" id="refresh-guru-stats-btn" title="Muat ulang" aria-label="Muat ulang ringkasan mengajar" ${guruStatsLoading ? 'disabled' : ''}>
          ${icon('refresh', { size: 15, className: guruStatsLoading ? 'spin' : '' })}
        </button>
      </div>
      ${renderGuruStatsSection()}

      ${renderSoundSettingsCard(false)}
    </div>
  `;
}

function renderGuruStatsSection() {
  if (guruStatsError) {
    return `<div class="card" style="text-align:center; padding:var(--space-4); color:var(--color-error); font-size:var(--fs-sm);">${guruStatsError}</div>`;
  }

  if (!guruStats) {
    return `
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-number">…</div><div class="stat-label">Kelas Diampu</div></div>
        <div class="stat-card"><div class="stat-number">…</div><div class="stat-label">Total Murid</div></div>
      </div>
    `;
  }

  const kelasRowsHtml = guruStats.kelasList.map(k => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--color-ink-100);">
      <div>
        <div style="font-size:var(--fs-sm); font-weight:var(--fw-semibold);">${k.nama}${k.tingkat ? ` <span style="font-weight:var(--fw-regular); color:var(--color-ink-400);">(${k.tingkat})</span>` : ''}</div>
        <div style="font-size:var(--fs-2xs); color:var(--color-ink-400);">Kode kelas: ${k.id}</div>
      </div>
      <span style="font-size:var(--fs-xs); color:var(--color-ink-500);">${k.jumlahMurid} murid</span>
    </div>
  `).join('');

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${guruStats.kelasList.length}</div>
        <div class="stat-label">Kelas Diampu</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${guruStats.totalMurid}</div>
        <div class="stat-label">Total Murid</div>
      </div>
    </div>

    <div class="card" style="display:flex; flex-direction:column; gap:4px;">
      <div style="font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--color-ink-900); margin-bottom:4px;">Kelas yang Diampu</div>
      ${guruStats.kelasList.length ? kelasRowsHtml : `<div style="font-size:var(--fs-xs); color:var(--color-ink-400);">Belum punya kelas. Buat kelas baru di Dashboard Kelas.</div>`}
    </div>
  `;
}

// Pakai cache kelas.js kalau ada (mis. sudah dibuka lewat Dashboard Kelas sebelumnya) untuk render instan,
// lalu selalu refresh di background supaya datanya tidak basi (stale-while-revalidate).
async function loadGuruStats(guruUid, rerender) {
  guruStatsError = '';
  guruStatsLoading = true;

  const cached = getCachedKelasList(guruUid);
  if (cached && !guruStats) {
    try {
      const withCachedCounts = await Promise.all(cached.map(async (k) => {
        const murid = await getMuridByKelas(k.id);
        return { ...k, jumlahMurid: murid.length };
      }));
      guruStats = {
        kelasList: withCachedCounts,
        totalMurid: withCachedCounts.reduce((acc, k) => acc + k.jumlahMurid, 0)
      };
      rerender();
    } catch (err) {
      console.error('loadGuruStats (cache) failed:', err);
    }
  }

  try {
    const kelasList = await getKelasByGuru(guruUid, { forceRefresh: true });
    const withCounts = await Promise.all(kelasList.map(async (k) => {
      const murid = await getMuridByKelas(k.id);
      return { ...k, jumlahMurid: murid.length };
    }));
    guruStats = {
      kelasList: withCounts,
      totalMurid: withCounts.reduce((acc, k) => acc + k.jumlahMurid, 0)
    };
  } catch (err) {
    if (!guruStats) guruStatsError = 'Gagal memuat ringkasan mengajar. Coba refresh halaman.';
    console.error('loadGuruStats failed:', err);
  } finally {
    guruStatsLoading = false;
    rerender();
  }
}

// ---------- Profil Murid ----------

function renderProfilMurid() {
  const summary = getSummary();
  const kosakata = getKosakata();
  const { levelInfo } = summary;
  const nama = getCurrentNama() || summary.userName || 'Murid';

  const badgesHtml = badges.map(b => {
    const isUnlocked = summary.unlockedBadges.includes(b.id);
    return `
      <div class="badge-item ${isUnlocked ? 'is-unlocked' : ''}" title="${b.desc}">
        <div class="badge-icon">${icon(b.icon, { size: 22 })}</div>
        <div class="badge-title">${b.title}</div>
        <div style="font-size:9px; color:${isUnlocked ? 'rgba(255,255,255,0.9)' : 'var(--color-ink-500)'}; display:flex; align-items:center; justify-content:center; gap:2px; position:relative;">
          ${isUnlocked ? icon('check', { size: 10 }) + ' Terbuka' : 'Terkunci'}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-4);">
      <!-- Profile Hero -->
      <div class="profile-hero">
        <div class="profile-avatar">${icon('user', { size: 34 })}</div>
        <div class="profile-name">${nama}</div>

        <div class="level-tag">
          ${icon(levelInfo.icon, { size: 14 })} Level ${levelInfo.level}: ${levelInfo.name}
        </div>

        <!-- Level XP Progress -->
        <div style="width:100%; max-width:320px; margin-top:var(--space-2);">
          <div style="display:flex; justify-content:space-between; font-size:var(--fs-2xs); color:rgba(255,255,255,0.9); margin-bottom:4px;">
            <span>${summary.xp} XP</span>
            <span>${levelInfo.nextLevel ? `${levelInfo.nextLevel.minXp} XP` : 'Max Level'}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${levelInfo.progressPercent}%;"></div>
          </div>
          ${levelInfo.nextLevel ? `
            <div style="font-size:9px; color:rgba(255,255,255,0.8); margin-top:4px;">
              Butuh ${levelInfo.xpToNext} XP lagi untuk naik ke Level ${levelInfo.nextLevel.level}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Learning Analytics Stats Grid -->
      <div class="section-header">
        <h3 class="section-title">${icon('chart', { size: 18 })} Statistik Belajar</h3>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${summary.learnedCount} / ${hijaiyah.length}</div>
          <div class="stat-label">Huruf Hijaiyah Dikuasai</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${summary.learnedWordsCount} / ${kosakata.length}</div>
          <div class="stat-label">Kosakata Dipelajari</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${summary.streak} Hari</div>
          <div class="stat-label">Streak Disiplin Belajar</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${summary.avgAccuracy}%</div>
          <div class="stat-label">Rata-rata Akurasi Kuis</div>
        </div>
      </div>

      <!-- Badges / Achievements Section -->
      <div class="section-header">
        <h3 class="section-title">${icon('award', { size: 18 })} Lencana Prestasi (${summary.unlockedBadges.length}/${badges.length})</h3>
      </div>

      <div class="badges-grid">
        ${badgesHtml}
      </div>

      ${renderSoundSettingsCard(true)}
      ${renderKelasWidget()}
    </div>
  `;
}

function renderSoundSettingsCard(showReset) {
  const voices = getAvailableArabicVoices();
  const selectedUri = getSelectedVoiceURI();
  const voiceOptionsHtml = voices.map(v => `
    <option value="${v.voiceURI}" ${v.voiceURI === selectedUri ? 'selected' : ''}>${v.name} (${v.lang}${v.localService ? '' : ' · cloud'})</option>
  `).join('');

  return `
    <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3); margin-top:var(--space-2);">
      <div style="font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--color-ink-900); display:flex; align-items:center; gap:8px;">
        ${icon('settings', { size: 16 })} Pengaturan & Audio
      </div>

      <div style="display:flex; flex-direction:column; gap:4px;">
        <div style="font-size:var(--fs-xs); font-weight:var(--fw-semibold);">Suara Pelafalan Arab</div>
        ${voices.length ? `
          <select id="voice-select" style="padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200); font-size:var(--fs-xs);">
            <option value="">Otomatis (disarankan)</option>
            ${voiceOptionsHtml}
          </select>
          <div style="font-size:var(--fs-2xs); color:var(--color-ink-500);">Pilihan suara tergantung browser/perangkat — coba beberapa untuk cari yang paling jelas.</div>
        ` : `<div style="font-size:var(--fs-2xs); color:var(--color-ink-500);">Belum ada suara Arab terdeteksi di perangkat ini.</div>`}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:var(--fs-xs); font-weight:var(--fw-semibold);">Uji Suara Bahasa Arab</div>
          <div style="font-size:var(--fs-2xs); color:var(--color-ink-500);">Tes audio pelafalan pada perangkat Anda</div>
        </div>
        <button class="btn btn--secondary" id="test-speech-btn" style="width:auto; height:34px; padding:0 14px; font-size:var(--fs-xs); display:inline-flex; align-items:center; gap:6px;">
          ${icon('volume', { size: 14 })} Tes Audio
        </button>
      </div>

      ${showReset ? `
        <div style="border-top:1px solid var(--color-ink-100); padding-top:var(--space-2); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:var(--fs-xs); font-weight:var(--fw-semibold); color:var(--color-error);">Reset Progres Belajar</div>
            <div style="font-size:var(--fs-2xs); color:var(--color-ink-500);">Hapus semua data XP, huruf, dan skor kuis</div>
          </div>
          <button class="btn btn--outline" id="reset-data-btn" style="width:auto; height:34px; padding:0 14px; font-size:var(--fs-xs); color:var(--color-error); border-color:var(--color-error);">
            Reset Data
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

let showChangeKelasForm = false;

function renderKelasWidget() {
  const { kelasId, kelasNama, tingkat } = getMyKelasInfo();

  if (kelasId && !showChangeKelasForm) {
    return `
      <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3);">
        <div style="font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--color-ink-900); display:flex; align-items:center; gap:8px;">
          ${icon('users', { size: 16 })} Kelas
        </div>
        <div style="font-size:var(--fs-sm); color:var(--color-ink-700);">
          Kamu tergabung di kelas <strong>${kelasNama}</strong>${tingkat ? ` <span style="color:var(--color-ink-400); font-weight:var(--fw-regular);">(Kelas ${tingkat})</span>` : ''}.
        </div>
        ${!tingkat ? `<div style="font-size:var(--fs-2xs); color:var(--color-error);">Kelas ini belum ditandai tingkatnya oleh guru, jadi materi/kuis belum bisa tampil. Minta guru mengisi tingkat kelas ini.</div>` : ''}
        <div style="display:flex; gap:8px;">
          <button type="button" class="btn btn--outline" id="change-kelas-btn" style="flex:1;">Ganti Kelas</button>
          <button type="button" class="btn btn--outline" id="leave-kelas-btn" style="flex:1; color:var(--color-error); border-color:var(--color-error);">Keluar Kelas</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="card" style="display:flex; flex-direction:column; gap:var(--space-3);">
      <div style="font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--color-ink-900); display:flex; align-items:center; gap:8px;">
        ${icon('users', { size: 16 })} Kelas
      </div>
      <div style="font-size:var(--fs-xs); color:var(--color-ink-500);">Minta kode kelas dari gurumu, lalu masukkan di sini supaya progresmu bisa dipantau.</div>
      <form id="join-kelas-form" style="display:flex; gap:8px;">
        <input type="text" name="kodeKelas" placeholder="Kode kelas" required style="flex:1; padding:8px 10px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);">
        <button type="submit" class="btn btn--secondary" style="width:auto; padding:0 16px;">Gabung</button>
      </form>
      <div id="join-kelas-error" style="font-size:var(--fs-2xs); color:var(--color-error);"></div>
      ${kelasId ? `<button type="button" class="btn btn--outline" id="cancel-change-kelas-btn">Batal</button>` : ''}
    </div>
  `;
}

// Dipanggil SEKALI saat halaman ini pertama kali dibuka (bukan setiap render) untuk memicu fetch data guru.
export function mountProfil(rerender) {
  if (getCurrentRole() === 'guru') {
    const uid = getCurrentUser().uid;
    if (uid !== lastGuruStatsUid) {
      guruStats = null;
      guruStatsError = '';
      lastGuruStatsUid = uid;
    }
    loadGuruStats(uid, rerender);
  }
}

function bindVoiceSelectEvent(root) {
  root.querySelector('#voice-select')?.addEventListener('change', (e) => {
    setSelectedVoiceURI(e.target.value);
    speakArabic('أَهْلًا وَسَهْلًا بِكُمْ فِي تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ');
  });
}

export function bindProfilEvents(root, rerender) {
  if (getCurrentRole() === 'guru') {
    root.querySelector('#test-speech-btn')?.addEventListener('click', () => {
      speakArabic('أَهْلًا وَسَهْلًا بِكُمْ فِي تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ');
    });
    root.querySelector('#refresh-guru-stats-btn')?.addEventListener('click', () => {
      loadGuruStats(getCurrentUser().uid, rerender);
    });
    bindVoiceSelectEvent(root);
    return;
  }

  // Test speech
  root.querySelector('#test-speech-btn')?.addEventListener('click', () => {
    speakArabic('أَهْلًا وَسَهْلًا بِكُمْ فِي تَعَلُّمِ اللُّغَةِ الْعَرَبِيَّةِ');
  });
  bindVoiceSelectEvent(root);

  // Reset data
  root.querySelector('#reset-data-btn')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Reset Progres Belajar',
      message: 'Apakah Anda yakin ingin mereset seluruh progres belajar? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Ya, Reset',
      danger: true
    });
    if (ok) {
      resetProgress();
      rerender();
    }
  });

  // Gabung/ganti kelas
  root.querySelector('#join-kelas-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const kode = new FormData(e.target).get('kodeKelas').trim();
    const errorEl = root.querySelector('#join-kelas-error');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    try {
      await joinKelas(getCurrentUser().uid, kode);
      showChangeKelasForm = false;
      rerender();
    } catch (err) {
      if (errorEl) errorEl.textContent = err.message || 'Gagal gabung kelas.';
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  root.querySelector('#change-kelas-btn')?.addEventListener('click', () => {
    showChangeKelasForm = true;
    rerender();
  });

  root.querySelector('#cancel-change-kelas-btn')?.addEventListener('click', () => {
    showChangeKelasForm = false;
    rerender();
  });

  root.querySelector('#leave-kelas-btn')?.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Keluar dari Kelas',
      message: 'Yakin mau keluar dari kelas ini? Progres belajarmu tetap aman, kamu bisa gabung lagi kapan saja pakai kode kelas.',
      confirmLabel: 'Ya, Keluar',
      danger: true
    });
    if (!ok) return;
    await leaveKelas(getCurrentUser().uid);
    rerender();
  });
}
