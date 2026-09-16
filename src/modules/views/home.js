import { hijaiyah } from '../../data/hijaiyah.js';
import { getKosakata, getKategori } from '../content.js';
import { getSummary } from '../progress.js';
import { getMyKelasInfo } from '../kelas.js';
import { icon } from '../icons.js';

const DAY_LABELS = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

export function renderHome() {
  const summary = getSummary();
  const kosakata = getKosakata();
  const kategori = getKategori();
  const totalWords = kosakata.length;
  const hijaiyahPct = Math.round((summary.learnedCount / hijaiyah.length) * 100);
  const wordsPct = Math.round((summary.learnedWordsCount / totalWords) * 100);
  const overallPct = Math.round((hijaiyahPct + wordsPct) / 2);

  const featuredLessons = kategori.filter(k => k.id !== 'semua').slice(0, 2);
  const lessonsHtml = featuredLessons.map((lesson, i) => `
    <a class="lesson-card" href="/mufrodat/${lesson.id}">
      <div class="lesson-illustration lesson-illustration--${lesson.theme}">
        <span class="lesson-illustration__badge">${icon(lesson.icon, { size: 26 })}</span>
        <span class="lesson-badge">BAB ${lesson.bab}</span>
      </div>
      <div class="lesson-body">
        <div class="lesson-arabic">${lesson.arabicTitle}</div>
        <div class="lesson-title">${lesson.subtitle}</div>
        <div class="lesson-desc">${lesson.desc}</div>
        <div class="lesson-footer">
          ${i === 0
            ? `<span>${icon('book', { size: 14 })} ${kosakata.filter(w => w.kategori === lesson.id).length} Mufrodat</span><span class="lesson-footer__play">${icon('play', { size: 14 })}</span>`
            : `<span class="lesson-footer__locked">${icon('lock', { size: 14 })} Terkunci</span>`}
        </div>
      </div>
    </a>
  `).join('');

  const activeDay = 3; // Kamis (contoh)
  const daysHtml = DAY_LABELS.map((d, i) => `
    <span class="streak-day ${i === activeDay ? 'is-active' : ''}">${d}</span>
  `).join('');

  const { kelasId } = getMyKelasInfo();
  const kelasBannerHtml = !kelasId ? `
    <div class="card" style="display:flex; justify-content:space-between; align-items:center; gap:var(--space-3); flex-wrap:wrap; background:var(--color-primary-50); border:1px solid var(--color-primary-100);">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="color:var(--color-primary-700);">${icon('users', { size: 20 })}</span>
        <div>
          <div style="font-size:var(--fs-sm); font-weight:var(--fw-semibold); color:var(--color-primary-800);">Kamu belum gabung kelas</div>
          <div style="font-size:var(--fs-xs); color:var(--color-ink-500);">Progres belajarmu belum bisa dipantau guru. Minta kode kelas, lalu gabung di halaman Profil.</div>
        </div>
      </div>
      <a class="btn btn--primary" href="/profil" style="width:auto; padding:0 16px; height:36px;">Gabung Kelas</a>
    </div>
  ` : '';

  return `
    <div class="home-grid animate-fade-in">
      <div class="home-main">
        ${kelasBannerHtml}
        <div class="hero-card">
          <span class="hero-card__greeting" style="text-transform:uppercase; letter-spacing:0.6px; font-weight:var(--fw-bold); display:inline-flex; align-items:center; gap:6px;">${icon('star', { size: 14 })} Selamat Datang</span>
          <h1 class="hero-card__title" style="font-size:var(--fs-2xl);">Pembelajaran Mufrodat &amp; Muhadatsah Interaktif</h1>
          <p style="color:rgba(255,255,255,0.85); font-size:var(--fs-sm); max-width:480px;">
            Tingkatkan kemampuan Bahasa Arab Anda dengan materi yang terstruktur dan menyenangkan.
          </p>
          <a class="hero-card__cta" href="/mufrodat">Mulai Belajar ${icon('arrowRight', { size: 16 })}</a>
        </div>

        <div class="section-header">
          <h2 class="section-title">Materi Pembelajaran</h2>
          <a class="section-link" href="/mufrodat">Lihat Semua ${icon('chevronRight', { size: 12 })}</a>
        </div>
        <div class="lesson-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
          ${lessonsHtml}
        </div>
      </div>

      <div class="home-aside">
        <div class="widget-card">
          <div class="widget-card__header">
            <span class="widget-card__icon">${icon('chart', { size: 20 })}</span>
            <div>
              <div class="widget-card__title">Progress Keseluruhan</div>
              <div class="widget-card__subtitle">${summary.levelInfo.name || 'Level Pemula'}</div>
            </div>
          </div>
          <div style="display:flex; align-items:baseline; justify-content:space-between;">
            <span class="widget-progress-value">${overallPct}%</span>
            <span class="widget-progress-tag">Tuntas</span>
          </div>
          <div class="widget-progress-track">
            <div class="widget-progress-fill" style="width:${overallPct}%;"></div>
          </div>
          <div class="widget-progress-row">
            <span><span class="widget-progress-dot" style="background:var(--color-primary-600);"></span>Mufrodat</span>
            <strong>${wordsPct}%</strong>
          </div>
          <div class="widget-progress-row">
            <span><span class="widget-progress-dot" style="background:var(--color-accent-600);"></span>Muhadatsah</span>
            <strong>${hijaiyahPct}%</strong>
          </div>
        </div>

        <div class="streak-widget">
          <div class="streak-widget__title">Streak Belajar</div>
          <div class="streak-widget__subtitle">Pertahankan semangatmu!</div>
          <div class="streak-widget__count">${summary.streak} <span style="font-size:var(--fs-sm); font-weight:var(--fw-medium);">Hari</span></div>
          <div class="streak-widget__days">${daysHtml}</div>
        </div>

        <a class="card" href="/rapor" style="display:flex; align-items:center; gap:10px; text-decoration:none;">
          <span style="color:var(--color-primary-600);">${icon('trophy', { size: 20 })}</span>
          <div style="flex:1;">
            <div style="font-size:var(--fs-sm); font-weight:var(--fw-semibold); color:var(--color-ink-900);">Rapor</div>
            <div style="font-size:var(--fs-2xs); color:var(--color-ink-500);">Riwayat kuis & catatan dari guru</div>
          </div>
          ${icon('chevronRight', { size: 16 })}
        </a>
      </div>
    </div>
  `;
}

export function bindHomeEvents() {}
