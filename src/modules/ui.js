// Modal konfirmasi & prompt yang konsisten dengan desain app — pengganti confirm()/prompt() bawaan browser.
import { icon } from './icons.js';

function getContainer() {
  return document.getElementById('modal-container');
}

let toastTimer = null;

// Notifikasi kecil sekali muncul di pojok bawah, dipakai untuk error non-blocking (mis. gagal
// menyimpan progres ke server) yang tidak layak diinterupsi pakai modal konfirmasi.
export function showToast(message, { danger = true } = {}) {
  const container = getContainer();
  if (!container) return;

  clearTimeout(toastTimer);
  container.innerHTML = `
    <div id="ui-toast" style="position:fixed; bottom:var(--space-6); left:50%; transform:translateX(-50%); z-index:200; background:${danger ? 'var(--color-error)' : 'var(--color-ink-900)'}; color:#fff; padding:12px 20px; border-radius:var(--radius-full); box-shadow:var(--shadow-lg); font-size:var(--fs-sm); max-width:90vw; text-align:center;">
      ${message}
    </div>
  `;
  toastTimer = setTimeout(() => { container.innerHTML = ''; }, 4000);
}

export function confirmDialog({ title = 'Konfirmasi', message, confirmLabel = 'Ya, Lanjutkan', danger = false }) {
  return new Promise((resolve) => {
    const container = getContainer();
    if (!container) { resolve(false); return; }

    container.innerHTML = `
      <div class="modal-overlay" id="ui-confirm-overlay">
        <div class="modal-content">
          <div class="modal-handle"></div>
          <h3 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-primary-700);">${title}</h3>
          <p style="font-size:var(--fs-sm); color:var(--color-ink-700); line-height:1.6;">${message}</p>
          <div style="display:flex; gap:var(--space-3);">
            <button class="btn btn--outline" id="ui-confirm-cancel" style="flex:1;">Batal</button>
            <button class="btn ${danger ? 'btn--outline' : 'btn--primary'}" id="ui-confirm-ok" style="flex:1; ${danger ? 'color:var(--color-error); border-color:var(--color-error);' : ''}">${confirmLabel}</button>
          </div>
        </div>
      </div>
    `;

    const close = (result) => { container.innerHTML = ''; resolve(result); };
    document.getElementById('ui-confirm-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'ui-confirm-overlay') close(false);
    });
    document.getElementById('ui-confirm-cancel').addEventListener('click', () => close(false));
    document.getElementById('ui-confirm-ok').addEventListener('click', () => close(true));
  });
}

export function promptDialog({ title = 'Masukkan Nilai', label, placeholder = '', defaultValue = '', confirmLabel = 'Simpan', multiline = false }) {
  return new Promise((resolve) => {
    const container = getContainer();
    if (!container) { resolve(null); return; }

    const escapedValue = (defaultValue || '').replace(/"/g, '&quot;');
    const fieldHtml = multiline
      ? `<textarea name="value" placeholder="${placeholder}" required autofocus rows="4" style="padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200); resize:vertical; font-family:inherit;">${defaultValue || ''}</textarea>`
      : `<input type="text" name="value" placeholder="${placeholder}" value="${escapedValue}" required autofocus style="padding:10px 12px; border-radius:var(--radius-md); border:1px solid var(--color-ink-200);">`;

    container.innerHTML = `
      <div class="modal-overlay" id="ui-prompt-overlay">
        <div class="modal-content">
          <div class="modal-handle"></div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="font-size:var(--fs-lg); font-weight:var(--fw-bold); color:var(--color-primary-700);">${title}</h3>
            <button id="ui-prompt-close">${icon('x', { size: 18 })}</button>
          </div>
          <form id="ui-prompt-form" style="display:flex; flex-direction:column; gap:var(--space-3);">
            <label style="display:flex; flex-direction:column; gap:4px; font-size:var(--fs-sm); color:var(--color-ink-700);">
              ${label}
              ${fieldHtml}
            </label>
            <button type="submit" class="btn btn--primary">${confirmLabel}</button>
          </form>
        </div>
      </div>
    `;

    const close = (result) => { container.innerHTML = ''; resolve(result); };
    document.getElementById('ui-prompt-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'ui-prompt-overlay') close(null);
    });
    document.getElementById('ui-prompt-close').addEventListener('click', () => close(null));
    document.getElementById('ui-prompt-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const value = new FormData(e.target).get('value')?.trim();
      close(value || null);
    });
    document.getElementById('ui-prompt-form').querySelector('input, textarea')?.select();
  });
}
