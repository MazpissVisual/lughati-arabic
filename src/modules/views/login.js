import { login, register } from '../auth.js';
import { icon } from '../icons.js';

let mode = 'login'; // 'login' | 'register'
let errorMsg = '';
let loading = false;
let showPassword = false;
let showConfirmPassword = false;
let spotlightIndex = 0;

// Nilai form dipertahankan lintas toggle Login/Daftar supaya user tidak perlu ngetik ulang.
let fieldValues = { nama: '', identifier: '', password: '', confirmPassword: '', role: 'murid' };

const FEATURES = [
  { icon: 'book', title: 'Modul Mufrodat & Muhadatsah', desc: 'Belajar kosakata dan percakapan bahasa Arab secara interaktif.' },
  { icon: 'clipboard', title: 'Kuis & Evaluasi', desc: 'Uji pemahaman lewat kuis bergamifikasi dengan XP dan lencana.' },
  { icon: 'chart', title: 'Rapor & Statistik Real-time', desc: 'Pantau progres belajar dan catatan dari guru kapan saja.' }
];

export function renderLogin() {
  const isRegister = mode === 'register';
  const isGuru = fieldValues.role === 'guru';
  const v = fieldValues;

  return `
    <div class="animate-fade-in login-page">
      <div class="login-card">
        <div class="login-panel">
          <div class="login-panel__inner">
            <div class="login-brand">
              <span class="login-brand__badge">${icon('star', { size: 16 })}</span>
              <span class="login-brand__name">Lughati Arabic</span>
            </div>

            <h2 class="login-panel__title">${isRegister ? 'Buat akun baru' : 'Masuk ke akun Anda'}</h2>
            <p class="login-panel__subtitle">${isRegister ? 'Isi data di bawah untuk mendaftar.' : 'Selamat datang kembali! Masukkan kredensial Anda.'}</p>

            <form id="auth-form" class="login-form">
              <div class="segmented-control">
                <label class="segment-btn ${!isGuru ? 'is-active' : ''}" id="role-label-murid" style="cursor:pointer; position:relative;">
                  <input type="radio" name="role" value="murid" ${!isGuru ? 'checked' : ''} style="position:absolute; opacity:0; pointer-events:none;"> Murid
                </label>
                <label class="segment-btn ${isGuru ? 'is-active' : ''}" id="role-label-guru" style="cursor:pointer; position:relative;">
                  <input type="radio" name="role" value="guru" ${isGuru ? 'checked' : ''} style="position:absolute; opacity:0; pointer-events:none;"> Guru
                </label>
              </div>

              ${isRegister ? `
                <label class="login-field">
                  <span class="login-field__label">Nama</span>
                  <span class="login-field__control">
                    <input type="text" name="nama" placeholder="Masukkan nama Anda" required value="${escapeAttr(v.nama)}">
                  </span>
                </label>
              ` : ''}

              <label class="login-field">
                <span class="login-field__label" id="identifier-label">${isGuru ? 'Email' : 'Nomor Siswa / Username'}</span>
                <span class="login-field__control">
                  <input type="${isGuru ? 'email' : 'text'}" name="identifier" id="identifier-input" placeholder="${isGuru ? 'Masukkan email Anda' : 'Masukkan nomor siswa/username'}" required value="${escapeAttr(v.identifier)}">
                </span>
              </label>

              <label class="login-field">
                <span class="login-field__label">Password</span>
                <span class="login-field__control">
                  <input type="${showPassword ? 'text' : 'password'}" name="password" placeholder="Masukkan password" required minlength="6" value="${escapeAttr(v.password)}">
                  <button type="button" class="login-field__toggle-visibility" id="toggle-password-visibility" aria-label="${showPassword ? 'Sembunyikan password' : 'Tampilkan password'}">
                    ${icon(showPassword ? 'eyeOff' : 'eye', { size: 16 })}
                  </button>
                </span>
                ${isRegister ? `<span class="login-field__hint">Minimal 6 karakter.</span>` : ''}
              </label>

              ${isRegister ? `
                <label class="login-field">
                  <span class="login-field__label">Konfirmasi Password</span>
                  <span class="login-field__control">
                    <input type="${showConfirmPassword ? 'text' : 'password'}" name="confirmPassword" placeholder="Ulangi password" required minlength="6" value="${escapeAttr(v.confirmPassword)}">
                    <button type="button" class="login-field__toggle-visibility" id="toggle-confirm-password-visibility" aria-label="${showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}">
                      ${icon(showConfirmPassword ? 'eyeOff' : 'eye', { size: 16 })}
                    </button>
                  </span>
                </label>
              ` : ''}

              ${errorMsg ? `<div class="login-error">${errorMsg}</div>` : ''}

              <button type="submit" class="login-submit-btn" ${loading ? 'disabled' : ''}>
                ${loading ? 'Memproses...' : (isRegister ? 'Daftar' : 'Masuk')}
              </button>
            </form>

            <div class="login-toggle-mode-btn-wrap">
              ${isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}
              <button id="toggle-mode-btn" class="login-toggle-mode-btn">${isRegister ? 'Masuk' : 'Daftar'}</button>
            </div>
          </div>
        </div>

        <div class="login-hero">
          <div class="login-hero__shape login-hero__shape--1"></div>
          <div class="login-hero__shape login-hero__shape--2"></div>
          <div class="login-hero__intro">
            <h1 class="login-hero__title">Belajar Bahasa Arab<br>Jadi Lebih Mudah</h1>
            <p class="login-hero__subtitle">Kuasai mufrodat dan muhadatsah lewat pengalaman belajar yang interaktif dan menyenangkan.</p>
          </div>

          <div class="login-hero__spotlight" id="login-spotlight">${renderSpotlightInner()}</div>
        </div>
      </div>
    </div>
  `;
}

function renderSpotlightInner() {
  const f = FEATURES[spotlightIndex];
  return `
    <div class="login-hero__spotlight-icon">${icon(f.icon, { size: 18 })}</div>
    <div class="login-hero__spotlight-title">${f.title}</div>
    <div class="login-hero__spotlight-desc">${f.desc}</div>
    <div class="login-hero__spotlight-footer">
      <div class="login-hero__spotlight-dots">
        ${FEATURES.map((_, i) => `<span class="login-hero__dot ${i === spotlightIndex ? 'is-active' : ''}"></span>`).join('')}
      </div>
      <div class="login-hero__spotlight-nav">
        <button type="button" id="spotlight-prev" aria-label="Sebelumnya">${icon('chevronLeft', { size: 14 })}</button>
        <button type="button" id="spotlight-next" aria-label="Berikutnya">${icon('chevronRight', { size: 14 })}</button>
      </div>
    </div>
  `;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

function readFormIntoState(form) {
  fieldValues = {
    nama: form.get('nama') || '',
    identifier: form.get('identifier') || '',
    password: form.get('password') || '',
    confirmPassword: form.get('confirmPassword') || '',
    role: form.get('role') || 'murid'
  };
}

export function bindLoginEvents(view, onSuccess) {
  const formEl = view.querySelector('#auth-form');

  view.querySelector('#toggle-mode-btn')?.addEventListener('click', () => {
    if (formEl) readFormIntoState(new FormData(formEl));
    mode = mode === 'login' ? 'register' : 'login';
    errorMsg = '';
    onSuccess.rerender();
  });

  // Ganti role (Murid/Guru) mengubah label & tipe field identifier (email vs username). Sengaja
  // TIDAK lewat rerender halaman penuh (sama alasannya dengan spotlight) — cukup patch elemen yang
  // benar-benar berubah (kelas aktif toggle + label/tipe field), supaya terasa instan, bukan kayak
  // pindah halaman.
  formEl?.querySelectorAll('input[name="role"]').forEach(radio => {
    radio.addEventListener('change', () => {
      readFormIntoState(new FormData(formEl));
      const isGuru = fieldValues.role === 'guru';

      view.querySelector('#role-label-murid')?.classList.toggle('is-active', !isGuru);
      view.querySelector('#role-label-guru')?.classList.toggle('is-active', isGuru);

      const label = view.querySelector('#identifier-label');
      const input = view.querySelector('#identifier-input');
      if (label) label.textContent = isGuru ? 'Email' : 'Nomor Siswa / Username';
      if (input) {
        input.type = isGuru ? 'email' : 'text';
        input.placeholder = isGuru ? 'Masukkan email Anda' : 'Masukkan nomor siswa/username';
      }
    });
  });

  view.querySelector('#toggle-password-visibility')?.addEventListener('click', () => {
    if (formEl) readFormIntoState(new FormData(formEl));
    showPassword = !showPassword;
    onSuccess.rerender();
  });

  view.querySelector('#toggle-confirm-password-visibility')?.addEventListener('click', () => {
    if (formEl) readFormIntoState(new FormData(formEl));
    showConfirmPassword = !showConfirmPassword;
    onSuccess.rerender();
  });

  // Sengaja TIDAK memicu rerender halaman penuh (onSuccess.rerender()) — spotlight cuma elemen
  // dekoratif kecil, kalau lewat rerender penuh, seluruh kartu login (termasuk isi form yang lagi
  // diketik) ikut dibongkar-pasang ulang dan animasi fade-in-nya replay, terasa seperti "pindah
  // halaman" padahal cuma geser 1 kartu kecil. Update DOM-nya sendiri saja, lalu pasang ulang
  // listener tombol prev/next yang baru (karena innerHTML diganti, listener lama ikut hilang).
  bindSpotlightNav(view);
  function bindSpotlightNav(root) {
    const spotlightEl = root.querySelector('#login-spotlight');
    const go = (delta) => {
      spotlightIndex = (spotlightIndex + delta + FEATURES.length) % FEATURES.length;
      if (spotlightEl) {
        spotlightEl.innerHTML = renderSpotlightInner();
        bindSpotlightNav(root);
      }
    };
    spotlightEl?.querySelector('#spotlight-prev')?.addEventListener('click', () => go(-1));
    spotlightEl?.querySelector('#spotlight-next')?.addEventListener('click', () => go(1));
  }

  formEl?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    readFormIntoState(form);

    if (mode === 'register' && fieldValues.password !== fieldValues.confirmPassword) {
      errorMsg = 'Konfirmasi password tidak cocok.';
      onSuccess.rerender();
      return;
    }

    loading = true;
    errorMsg = '';
    onSuccess.rerender();

    try {
      if (mode === 'register') {
        await register({
          identifier: fieldValues.identifier,
          password: fieldValues.password,
          nama: fieldValues.nama,
          role: fieldValues.role
        });
      } else {
        await login(fieldValues.identifier, fieldValues.password, fieldValues.role);
      }
      // Login/daftar sukses: halaman ini akan segera diganti (router pindah ke halaman lain lewat
      // listener auth), jadi tidak perlu rerender di sini. TAPI `loading` tetap harus direset ke
      // false — kalau tidak, waktu user logout lalu balik lagi ke halaman login, module state ini
      // masih nyangkut `true` dari sesi sebelumnya dan tombol "Masuk" kejebak "Memproses..." selamanya.
      loading = false;
    } catch (err) {
      errorMsg = friendlyError(err.code, fieldValues.role);
      loading = false;
      onSuccess.rerender();
    }
  });
}

function friendlyError(code, role) {
  const idLabel = role === 'guru' ? 'Email' : 'Nomor Siswa/Username';
  switch (code) {
    case 'auth/email-already-in-use': return role === 'guru' ? 'Email sudah terdaftar.' : 'Nomor Siswa/Username sudah dipakai.';
    case 'auth/invalid-email': return role === 'guru' ? 'Format email tidak valid.' : 'Nomor Siswa/Username tidak valid.';
    case 'auth/weak-password': return 'Password minimal 6 karakter.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return `${idLabel} atau password salah.`;
    default: return 'Terjadi kesalahan. Coba lagi.';
  }
}
