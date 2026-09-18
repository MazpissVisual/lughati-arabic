import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';

import { renderHome, bindHomeEvents } from './modules/views/home.js';
import { renderMufrodatList, renderMufrodatLesson, bindMufrodatListEvents, bindMufrodatLessonEvents } from './modules/views/mufrodat.js';
import { renderMuhadatsahList, renderMuhadatsahDetail, bindMuhadatsahListEvents, bindMuhadatsahDetailEvents } from './modules/views/muhadatsah.js';
import { renderMateriList, renderMateriDetail, bindMateriListEvents, bindMateriDetailEvents } from './modules/views/materi.js';
import { renderKuisList, bindKuisListEvents, renderKuisKategoriList, bindKuisKategoriListEvents, renderQuiz, bindQuizEvents, startQuiz } from './modules/views/kuis.js';
import { renderProfil, bindProfilEvents, mountProfil } from './modules/views/profil.js';
import { renderRapor, bindRaporEvents, mountRapor } from './modules/views/rapor.js';
import { renderLogin, bindLoginEvents } from './modules/views/login.js';
import { updateStreak, getSummary, initProgress, clearProgressCache } from './modules/progress.js';
import { loadContent } from './modules/content.js';
import { renderCms, bindCmsEvents, resetCmsState } from './modules/views/cms.js';
import { renderDashboardGuru, bindDashboardGuruEvents, mountDashboardGuru } from './modules/views/dashboardGuru.js';
import { loadMyKelasInfo } from './modules/kelas.js';
import { onAuthChange, logout, getCurrentNama } from './modules/auth.js';
import { icon } from './modules/icons.js';
import { setRouter, navigate, bindLinkInterceptor } from './modules/router.js';

const app = document.getElementById('app');

let authUser = null;
let authRole = null;
let authReady = false;
let progressReady = false;
let progressLoadError = false;

async function loadInitialData(user, role) {
  progressReady = false;
  progressLoadError = false;
  router();

  try {
    if (user) {
      const tasks = [loadContent(), loadMyKelasInfo(user.uid, role)];
      if (role === 'murid') tasks.push(initProgress(user.uid));
      else clearProgressCache();
      await Promise.all(tasks);
      if (role === 'murid') updateStreak();
    } else {
      clearProgressCache();
    }
  } catch (err) {
    progressLoadError = true;
  }
  progressReady = true;
  router();
}

onAuthChange((user, role) => {
  authUser = user;
  authRole = role;
  authReady = true;
  loadInitialData(user, role);
});

// Menu sidebar (desktop) — lengkap, karena ruangnya cukup untuk label panjang.
function sidebarItems() {
  if (authRole === 'guru') {
    return [
      { path: '/dashboard', icon: 'chart', label: 'Dashboard Kelas' },
      { path: '/cms', icon: 'settings', label: 'Kelola Konten' },
      { path: '/materi', icon: 'backpack', label: 'Pratinjau Materi' },
      { path: '/mufrodat', icon: 'book', label: 'Pratinjau Mufrodat' },
      { path: '/muhadatsah', icon: 'message', label: 'Pratinjau Muhadatsah' },
      { path: '/kuis', icon: 'clipboard', label: 'Pratinjau Kuis' },
    ];
  }
  return [
    { path: '/', icon: 'home', label: 'Beranda' },
    { path: '/materi', icon: 'backpack', label: 'Materi' },
    { path: '/mufrodat', icon: 'book', label: 'Mufrodat' },
    { path: '/muhadatsah', icon: 'message', label: 'Muhadatsah' },
    { path: '/kuis', icon: 'clipboard', label: 'Kuis' },
    { path: '/rapor', icon: 'trophy', label: 'Rapor' },
  ];
}

// Menu bottom-nav (mobile) — sengaja beda dari sidebar: lebih ringkas (max ~5 item pendek) supaya
// tidak sempit/kepotong di layar HP, dan WAJIB menyertakan Profil karena di mobile sidebar
// disembunyikan sama sekali — tanpa ini, halaman Profil tidak bisa diakses sama sekali di HP.
function bottomNavItemsFor() {
  if (authRole === 'guru') {
    return [
      { path: '/dashboard', icon: 'chart', label: 'Dashboard' },
      { path: '/cms', icon: 'settings', label: 'Konten' },
      { path: '/profil', icon: 'user', label: 'Profil' },
    ];
  }
  return [
    { path: '/', icon: 'home', label: 'Beranda' },
    { path: '/materi', icon: 'backpack', label: 'Materi' },
    { path: '/mufrodat', icon: 'book', label: 'Mufrodat' },
    { path: '/kuis', icon: 'clipboard', label: 'Kuis' },
    { path: '/profil', icon: 'user', label: 'Profil' },
  ];
}

function titleFor(seg1) {
  if (seg1 === 'mufrodat') return 'Modul Mufrodat';
  if (seg1 === 'muhadatsah') return 'Muhadatsah';
  if (seg1 === 'materi') return 'Materi';
  if (seg1 === 'kuis') return 'Knowledge Checks';
  if (seg1 === 'rapor') return 'Rapor';
  if (seg1 === 'profil') return authRole === 'guru' ? 'Profil Akun' : 'Profil & Progres';
  if (seg1 === 'cms') return 'Kelola Konten (CMS)';
  if (seg1 === 'dashboard') return 'Dashboard Kelas';
  return 'Lughati Arabic';
}

function activeNavPath(seg1) {
  if (seg1 === 'mufrodat') return '/mufrodat';
  if (seg1 === 'muhadatsah') return '/muhadatsah';
  if (seg1 === 'materi') return '/materi';
  if (seg1 === 'kuis') return '/kuis';
  if (seg1 === 'rapor') return '/rapor';
  if (seg1 === 'cms') return '/cms';
  if (seg1 === 'dashboard') return '/dashboard';
  if (seg1 === 'profil') return '/profil';
  return '/';
}

function shell(seg1) {
  const active = activeNavPath(seg1);
  const summary = getSummary();

  const sidebarLinksHtml = sidebarItems().map(item => `
    <a class="sidebar__link ${item.path === active ? 'is-active' : ''}" href="${item.path}">
      <span class="nav-icon">${icon(item.icon, { size: 18 })}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  const bottomNavHtml = bottomNavItemsFor().map(item => `
    <a class="bottom-nav__item ${item.path === active ? 'is-active' : ''}" href="${item.path}">
      <span class="nav-icon">${icon(item.icon, { size: 20 })}</span>
      <span>${item.label}</span>
    </a>
  `).join('');

  return `
    <aside class="sidebar">
      <div class="sidebar__brand">Lughati Arabic</div>
      <nav class="sidebar__nav">
        ${sidebarLinksHtml}
      </nav>
      <div class="sidebar__footer">
        ${authRole === 'guru' ? `
          <a class="sidebar__cta" href="/dashboard">
            <span class="nav-icon">${icon('chart', { size: 15 })}</span>
            <span>Kelola Kelas</span>
          </a>
          <a class="sidebar__user" href="/profil">
            <span class="sidebar__user-avatar">${icon('user', { size: 18 })}</span>
            <div>
              <div class="sidebar__user-name" title="${authUser?.email || 'Guru'}">${authUser?.email || 'Guru'}</div>
              <div class="sidebar__user-meta">Guru</div>
            </div>
          </a>
        ` : `
          <a class="sidebar__cta" href="/mufrodat">
            <span class="nav-icon">${icon('play', { size: 15 })}</span>
            <span>Mulai Belajar Harian</span>
          </a>
          <a class="sidebar__user" href="/profil">
            <span class="sidebar__user-avatar">${icon('user', { size: 18 })}</span>
            <div>
              <div class="sidebar__user-name" title="${getCurrentNama() || 'Murid'}">${getCurrentNama() || 'Murid'}</div>
              <div class="sidebar__user-meta">Level ${summary.levelInfo.level} · Siswa</div>
            </div>
          </a>
        `}
      </div>
    </aside>

    <div class="content-area">
      <header class="app-header">
        <div class="app-header__left">
          <div class="app-header__logo">ع</div>
          <span class="app-header__title">${titleFor(seg1)}</span>
        </div>
        <div class="app-header__actions">
          <button class="header-btn header-btn--accent" id="info-btn" title="Tentang Aplikasi" aria-label="Tentang Aplikasi">
            ${icon('bulb', { size: 17 })}
          </button>
          <button class="header-btn header-btn--danger" id="logout-btn" title="Keluar" aria-label="Keluar dari akun">
            ${icon('logout', { size: 17 })}
          </button>
        </div>
      </header>

      <main class="app-main" id="view"></main>
    </div>

    <nav class="bottom-nav">
      ${bottomNavHtml}
    </nav>

    <!-- Info Modal Container -->
    <div id="modal-container"></div>
  `;
}

function showInfoModal() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  container.innerHTML = `
    <div class="modal-overlay" id="info-modal-overlay">
      <div class="modal-content">
        <div class="modal-handle"></div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-primary-700); display:flex; align-items:center; gap:8px;">
            ${icon('star', { size: 18 })} Lughati Arabic
          </h3>
          <button id="close-modal-btn" style="color:var(--color-ink-500);">${icon('x', { size: 18 })}</button>
        </div>
        <p style="font-size:var(--fs-sm); color:var(--color-ink-700); line-height:1.6;">
          Media pembelajaran multimedia interaktif untuk mempelajari mufrodat (kosakata), muhadatsah (percakapan), serta kuis gamifikasi dengan audio pelafalan.
        </p>
        <div style="background:var(--color-primary-50); padding:12px; border-radius:var(--radius-md); font-size:var(--fs-xs); color:var(--color-primary-800); display:flex; gap:8px; align-items:flex-start;">
          ${icon('bulb', { size: 16 })} <span><strong>Tips Belajar:</strong> Dengarkan pelafalan berulang kali, latih percakapan di modul Muhadatsah, lalu kerjakan Knowledge Checks untuk mendapatkan XP!</span>
        </div>
        <button class="btn btn--primary" id="confirm-modal-btn">
          Mulai Belajar
        </button>
      </div>
    </div>
  `;

  const closeModal = () => { container.innerHTML = ''; };
  document.getElementById('info-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'info-modal-overlay') closeModal();
  });
  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('confirm-modal-btn')?.addEventListener('click', closeModal);
}

function router() {
  if (!authReady) {
    app.innerHTML = `<div style="width:100%; min-height:100vh; display:flex; align-items:center; justify-content:center; color:var(--color-ink-500);">Memuat...</div>`;
    return;
  }

  if (!authUser) {
    app.innerHTML = renderLogin();
    bindLoginEvents(app, { rerender: router });
    return;
  }

  if (!progressReady) {
    app.innerHTML = `<div style="width:100%; min-height:100vh; display:flex; align-items:center; justify-content:center; color:var(--color-ink-500);">Memuat progres...</div>`;
    return;
  }

  if (progressLoadError) {
    app.innerHTML = `
      <div style="width:100%; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:var(--space-4); color:var(--color-ink-500); text-align:center; padding:var(--space-4);">
        <p>Gagal memuat data. Periksa koneksi internet Anda.</p>
        <button class="btn btn--primary" style="width:auto;" id="retry-load-btn">Coba Lagi</button>
      </div>
    `;
    document.getElementById('retry-load-btn')?.addEventListener('click', () => loadInitialData(authUser, authRole));
    return;
  }

  const pathname = window.location.pathname || '/';

  // Guru tidak punya progres belajar sendiri — arahkan ke Dashboard Kelas, bukan Beranda versi murid.
  if (authRole === 'guru' && pathname === '/') {
    navigate('/dashboard');
    return;
  }

  const segments = pathname.split('/').filter(Boolean);
  const seg1 = segments[0] || '';
  const seg2 = segments[1] || '';
  const seg3 = segments[2] || '';

  app.innerHTML = shell(seg1);
  const view = document.getElementById('view');

  document.getElementById('info-btn')?.addEventListener('click', showInfoModal);
  document.getElementById('logout-btn')?.addEventListener('click', () => logout());

  if (!seg1) {
    view.innerHTML = renderHome();
    bindHomeEvents(view);
  } else if (seg1 === 'mufrodat') {
    if (seg2) {
      view.innerHTML = renderMufrodatLesson(seg2, seg3 || 0);
      bindMufrodatLessonEvents(view, seg2, seg3 || 0, router);
    } else {
      view.innerHTML = renderMufrodatList();
      bindMufrodatListEvents(view);
    }
  } else if (seg1 === 'muhadatsah') {
    if (seg2) {
      view.innerHTML = renderMuhadatsahDetail(seg2);
      bindMuhadatsahDetailEvents(view);
    } else {
      view.innerHTML = renderMuhadatsahList();
      bindMuhadatsahListEvents(view);
    }
  } else if (seg1 === 'materi') {
    if (seg2) {
      view.innerHTML = renderMateriDetail(seg2);
      bindMateriDetailEvents(view);
    } else {
      view.innerHTML = renderMateriList();
      bindMateriListEvents(view);
    }
  } else if (seg1 === 'kuis') {
    if (seg2 === 'main') {
      // startQuiz() SELALU dipanggil di sini (mulai sesi baru) tiap kali route ini dibuka —
      // bukan diputuskan lewat heuristik di dalam renderQuiz() lagi. Rerender internal (jawab
      // soal, coba lagi) tidak lewat sini, jadi tidak pernah memicu mulai ulang tak sengaja.
      startQuiz(seg3);
      const rerenderQuiz = () => {
        view.innerHTML = renderQuiz();
        bindQuizEvents(view, rerenderQuiz);
      };
      rerenderQuiz();
    } else if (seg2 === 'kategori') {
      view.innerHTML = renderKuisKategoriList(seg3);
      bindKuisKategoriListEvents(view);
    } else {
      view.innerHTML = renderKuisList();
      bindKuisListEvents(view);
    }
  } else if (seg1 === 'rapor') {
    if (authRole !== 'murid') {
      view.innerHTML = `
        <div class="card" style="text-align:center; padding:var(--space-8);">
          <p style="color:var(--color-ink-500);">Halaman ini khusus untuk akun murid.</p>
          <a class="btn btn--primary" href="/" style="margin-top:var(--space-4);">Ke Beranda</a>
        </div>
      `;
    } else {
      const rerenderRapor = () => {
        view.innerHTML = renderRapor();
        bindRaporEvents(view, rerenderRapor);
      };
      rerenderRapor();
      mountRapor(rerenderRapor);
    }
  } else if (seg1 === 'profil') {
    const rerenderProfil = () => {
      view.innerHTML = renderProfil();
      bindProfilEvents(view, rerenderProfil);
    };
    rerenderProfil();
    mountProfil(rerenderProfil);
  } else if (seg1 === 'cms') {
    if (authRole !== 'guru') {
      view.innerHTML = `
        <div class="card" style="text-align:center; padding:var(--space-8);">
          <p style="color:var(--color-ink-500);">Halaman ini khusus untuk akun guru.</p>
          <a class="btn btn--primary" href="/" style="margin-top:var(--space-4);">Ke Beranda</a>
        </div>
      `;
    } else {
      resetCmsState();
      const rerenderCms = () => {
        view.innerHTML = renderCms();
        bindCmsEvents(view, rerenderCms);
      };
      rerenderCms();
    }
  } else if (seg1 === 'dashboard') {
    if (authRole !== 'guru') {
      view.innerHTML = `
        <div class="card" style="text-align:center; padding:var(--space-8);">
          <p style="color:var(--color-ink-500);">Halaman ini khusus untuk akun guru.</p>
          <a class="btn btn--primary" href="/" style="margin-top:var(--space-4);">Ke Beranda</a>
        </div>
      `;
    } else {
      const rerenderDashboard = () => {
        view.innerHTML = renderDashboardGuru();
        bindDashboardGuruEvents(view, rerenderDashboard, authUser.uid);
      };
      rerenderDashboard();
      mountDashboardGuru(authUser.uid, rerenderDashboard);
    }
  } else {
    view.innerHTML = `
      <div class="card" style="text-align:center; padding:var(--space-8);">
        <p style="color:var(--color-ink-500);">Halaman tidak ditemukan.</p>
        <a class="btn btn--primary" href="/" style="margin-top:var(--space-4);">Ke Beranda</a>
      </div>
    `;
  }

  // Setiap kali pindah halaman/route, scroll halaman kembali ke paling atas (top: 0).
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

setRouter(router);
bindLinkInterceptor();
window.addEventListener('DOMContentLoaded', router);
router();

// PWA service worker registration — HANYA di production build. Kalau ini didaftarkan juga pas
// dev server (npm run dev), sw.js akan nge-cache bundle JS dan menyajikannya dari cache di reload
// berikutnya walau kode sumbernya sudah diubah & disimpan — perubahan kelihatan "tidak kepakai"
// padahal cuma browser masih jalanin JS versi lama dari cache SW, bukan bug di kodenya.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Self-heal: kalau tab ini sebelumnya pernah kebuka saat SW masih didaftarkan di dev (sebelum
  // perbaikan ini ada), lepas semua registrasi SW + hapus cache-nya supaya dev server balik jalan
  // "bersih" tanpa layer cache tambahan yang bikin perubahan kode terasa "tidak kepakai".
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  if ('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
}
