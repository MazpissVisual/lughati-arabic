# Roadmap Pengembangan — Lughati Arabic

Dokumen ini merangkum rencana pengembangan lanjutan aplikasi setelah MVP awal (PWA sidebar layout: Home, Mufrodat, Muhadatsah, Kuis) selesai dibangun.

## Status saat ini

- Layout desktop sidebar + fallback bottom-nav mobile sudah jalan.
- Data konten (kosakata, muhadatsah, hijaiyah, achievements) masih **statis** di `src/data/*.js`.
- Progres belajar (XP, streak, badge, skor kuis) tersimpan di **localStorage** per-device (`src/modules/progress.js`), belum ada akun/login.
- Desain sudah direskin: icon SVG konsisten (`src/modules/icons.js`), ilustrasi placeholder dot-pattern, micro-interaction hover.

## Tujuan akhir

Aplikasi berkembang dari media belajar statis single-user menjadi platform belajar bahasa Arab dengan:
- Konten yang bisa dikelola guru/admin tanpa edit kode (CMS).
- Akun murid & guru dengan data yang benar-benar tersimpan per pengguna (bukan per-browser).
- Guru bisa memantau progres/nilai murid; murid bisa melihat perkembangan belajarnya sendiri.
- Backend nyata (Firebase) menggantikan localStorage.
- Visual yang terus disempurnakan (font, pattern ilustrasi, detail desain).

## Urutan eksekusi yang disarankan

Alasan urutan: CMS dan sistem login sama-sama butuh database nyata sebagai fondasi — mengerjakannya sebelum Firebase siap berarti membangun di atas sesuatu yang akan dibongkar ulang.

### 1. Firebase setup (fondasi)
- Setup project Firebase: Authentication + Firestore.
- Desain skema data awal, sekaligus relasi **Kelas ↔ Guru ↔ Murid** (lihat bagian "Tambahan" di bawah — ini sering terlewat kalau tidak dipikirkan sejak skema pertama dibuat).
- Petakan struktur `src/data/*.js` yang sudah ada (kosakata, muhadatsah, hijaiyah, achievements) menjadi koleksi Firestore — strukturnya sudah cukup dekat, jadi migrasi skema relatif ringan.
- Tulis **Firestore Security Rules** sejak awal (bukan "diamankan belakangan"): murid A tidak boleh baca/tulis data murid B; guru hanya boleh baca murid di kelas yang dia ajar.

### 2. Strategi migrasi progres lama
- Progres saat ini ada di localStorage per-device, akan terisolasi/hilang begitu pindah ke akun berbasis Firebase.
- Putuskan salah satu: (a) reset semua progres saat rilis versi akun, atau (b) sediakan alur "klaim progres lokal" saat murid login pertama kali (localStorage → Firestore, sekali jalan lalu localStorage dikosongkan).

### 3. Login & role-based access
- Firebase Auth untuk autentikasi (siapa yang login).
- Role `guru` / `murid` disimpan di Firestore, dipakai untuk *authorization* (apa yang boleh dilihat/diubah) — dikerjakan bersamaan dengan Security Rules, bukan setelahnya.
- Routing di app: murid diarahkan ke dashboard belajar, guru diarahkan ke dashboard pemantauan.

### 4. CMS untuk guru/admin
- Form untuk mengelola konten: mufrodat, topik muhadatsah, soal kuis.
- **Validasi input di sisi CMS**: field wajib, panjang teks, validitas karakter Arab — supaya konten yang salah format tidak bikin error di sisi tampilan murid.
- Menulis langsung ke koleksi Firestore yang sudah didesain di tahap 1.

### 5. Dashboard laporan guru
- Guru melihat progres/nilai murid di kelasnya: per-murid, per-kelas, dan per-modul.
- Desain query Firestore diselaraskan dengan bentuk laporan ini dari awal (memengaruhi struktur data, bukan detail belakangan) — juga relevan untuk menjaga jumlah read/write tetap efisien (lihat "Biaya Firebase" di bawah).
- Murid melihat progres pribadinya (XP, streak, riwayat kuis, lencana) — versi personal dari data yang sama.

### 6. Font, pattern, dan polish visual
- Tidak bergantung pada backend — bisa dikerjakan kapan saja, termasuk paralel dengan tahap-tahap di atas.
- Lanjutan dari sesi reskin sebelumnya (font pairing, pattern ilustrasi, detail komponen lain yang belum disentuh).

## Hal tambahan di luar catatan awal (perlu diputuskan sebelum mulai coding)

Poin-poin ini bukan fitur baru, tapi keputusan desain yang kalau tidak diambil di awal akan menyebabkan rework besar nanti.

- **Model relasi Kelas/Rombel** — "guru pantau nilai murid" perlu entitas Kelas yang menghubungkan satu guru ke sekumpulan murid tertentu. Tanpa ini, guru berisiko bisa melihat seluruh murid di sistem, bukan hanya kelasnya.
- **Firestore Security Rules eksplisit** — ditulis bersamaan dengan skema data di tahap 1, bukan ditambahkan belakangan setelah login jadi.
- **Mode offline (PWA)** — salah satu nilai jual PWA adalah bisa dipakai offline. Firestore punya offline persistence bawaan; perlu diputuskan: kuis/belajar tetap bisa jalan offline lalu sync ke server saat online lagi, atau aplikasi mewajibkan koneksi. Ini keputusan arsitektur, bukan detail implementasi kecil.
- **Biaya & limit Firebase (free tier / Spark plan)** — untuk skala tugas kuliah/prototipe kemungkinan aman, tapi kalau dipakai kelas sungguhan dengan banyak murid mengerjakan kuis (banyak write), desain query perlu sadar batas read/write sejak awal agar tidak boros.
- **Validasi konten dari CMS** — lihat tahap 4, dicatat ulang di sini karena ini pengaman terhadap kualitas data, bukan sekadar fitur form.

## Checklist eksekusi (urutan pasti, per langkah)

Setiap kotak adalah satu langkah kerja yang bisa dicentang. Urutan di dalam tiap fase juga berurutan — jangan loncat ke bawah sebelum yang di atasnya selesai, kecuali ditandai *(paralel)*.

### Fase 0 — Persiapan sebelum coding

**Status: keputusan diambil, siap lanjut ke Fase 1.**

- [x] Model relasi data:
  - `guru/{uid}` — `{ nama, email }`
  - `kelas/{kelasId}` — `{ nama, guruId }`
  - `murid/{uid}` — `{ nama, kelasId, email }`
  - Alasan: relasi guru↔kelas↔murid via ID referensi (bukan nested), supaya query "semua murid di kelas X" dan Security Rules (cek `kelasId` milik guru yang login) sama-sama sederhana.

- [x] Struktur koleksi konten (dipetakan dari `src/data/*.js` yang sudah ada):
  - `mufrodat/{kategoriId}` — field kategori (label, icon, bab, arabicTitle, subtitle, desc, theme, dari `kosakata.js`), dengan subkoleksi `kata/{wordId}` untuk tiap kosakata.
  - `muhadatsah/{topikId}` — dari `muhadatsah.js`.
  - `hijaiyah/{letterId}` — dari `hijaiyah.js` (selama ini belum disebut eksplisit di skema awal, ditambahkan di sini karena juga konten statis yang perlu jadi read-only collection).
  - `kuisSoal/{modeId}/soal/{soalId}` — soal kuis per mode.
  - Semua koleksi ini **read-only untuk role `murid`**, write hanya untuk `guru`/`admin` (ditegakkan di Security Rules Fase 1).

- [x] Struktur koleksi progres:
  - `progresMurid/{uid}` — `{ xp, streak, lastActiveDate, learnedLetters[], learnedWords[], bookmarks[], unlockedBadges[] }` — field ini identik dengan bentuk objek yang sudah dipakai `getDefaultData()` di `src/modules/progress.js`, jadi migrasi logikanya tinggal ganti sumber baca/tulis dari localStorage ke dokumen ini.
  - `kuisRiwayat/{uid}/attempt/{attemptId}` — `{ score, total, type, date }`, dipisah dari dokumen progres utama supaya riwayat kuis yang terus bertambah tidak membuat dokumen `progresMurid` membengkak (Firestore document lebih efisien dibaca kalau ukurannya stabil).

- [x] Strategi mode offline — **wajib online** (tidak mengaktifkan Firestore offline persistence di tahap awal).
  - Alasan: ini proyek tugas kuliah dengan skop terbatas; sinkronisasi offline→online menambah kompleksitas signifikan (conflict resolution, antrian write tertunda) yang tidak sepadan dengan manfaatnya untuk skala pemakaian saat ini. Bisa diaktifkan belakangan sebagai peningkatan (Firestore mendukungnya secara bawaan tanpa mengubah skema data).

- [x] Strategi migrasi progres lama — **klaim otomatis saat login pertama**.
  - Alasan: data di localStorage (`progress.js`) berisi progres belajar riil (XP, streak, kata/huruf yang sudah dipelajari) yang akan hilang kalau direset paksa, dan reset progres pengguna terasa buruk secara pengalaman. Alur: saat murid login pertama kali dan dokumen `progresMurid/{uid}` belum ada, baca `localStorage`, tulis sebagai dokumen awal ke Firestore, lalu kosongkan localStorage. Login berikutnya langsung pakai Firestore.

### Fase 1 — Firebase setup
- [x] Buat project Firebase (`arabic-mam`), aktifkan Authentication (Email/Password) dan Firestore (production mode, region Jakarta).
- [x] Install SDK (`firebase`), buat `src/modules/firebase.js` untuk inisialisasi app. Config disimpan di `.env` (gitignored), template di `.env.example`.
- [x] Buat koleksi Firestore sesuai skema Fase 0, isi data awal dari `src/data/*.js`. Dijalankan via `scripts/seed-firestore.mjs` (firebase-admin, sekali jalan pakai service account key yang dihapus setelah dipakai — dipertahankan sebagai script re-seed untuk masa depan, tinggal install ulang `firebase-admin` + generate key baru saat dipakai lagi). Hasil: `mufrodat` (7 kategori + 50 kata), `muhadatsah` (3 topik), `hijaiyah` (28 huruf). `kuisSoal` **belum diisi** — soal kuis saat ini digenerate on-the-fly dari `hijaiyah`/`kosakata` di `src/modules/views/kuis.js`, bukan dari bank soal statis; koleksi ini baru relevan kalau CMS (Fase 4) menambahkan bank soal sungguhan.
- [x] Tulis Firestore Security Rules dasar (`firestore.rules`, di-deploy via `firebase.json`/`.firebaserc`): konten read-only untuk user login, write hanya `guru`; progres/riwayat hanya bisa diakses pemiliknya sendiri atau guru dari kelas yang sama (`isGuruOfStudent`), bukan guru mana pun.
- [x] Uji rules. Emulator lokal tidak bisa jalan (perlu JDK 21+, sistem hanya punya Java 20) — atas keputusan user, diganti review manual baris-per-baris terhadap 8 skenario kunci (isolasi progres antar-murid, guru hanya baca murid di kelasnya, konten read-only untuk non-guru, dll), semua lolos. Skrip otomatis untuk pengujian ulang di masa depan (kalau JDK 21 sudah ada) tersimpan di `scripts/test-rules.mjs`, jalankan dengan `firebase emulators:exec --only firestore "node scripts/test-rules.mjs"`. Catatan tepi ditemukan: rule `kelas` write memakai `request.resource.data.guruId`, yang bernilai null saat delete — efeknya guru tidak bisa hapus kelas lewat rule ini sampai ditambahkan penanganan eksplisit (relevan saat CMS/Fase 4 butuh fitur hapus kelas).

### Fase 2 — Migrasi progres lama & Fase 3 — Login & role-based access

**Dikerjakan sekaligus** — alur klaim localStorage hanya bisa jalan setelah ada uid dari login, jadi kedua fase ini saling bergantung sejak awal (bukan urutan linear seperti draf awal).

- [x] `src/modules/auth.js` — wrapper Firebase Auth: `register({email,password,nama,role})` (menulis dokumen `guru/{uid}` atau `murid/{uid}` sesuai role), `login`, `logout`, `onAuthChange` (broadcast user + role terselesaikan dari Firestore).
- [x] `src/modules/views/login.js` — form login/register (toggle mode, pilihan role murid/guru saat daftar, pesan error B. Indonesia).
- [x] `src/modules/progress.js` — dirombak dari localStorage murni jadi **cache in-memory + Firestore di baliknya**: semua fungsi (`getProgress`, `addXP`, `markLetterLearned`, dst) tetap sinkron secara API (tidak perlu ubah 6 file view yang memanggilnya), tapi setiap perubahan otomatis nulis ke `progresMurid/{uid}` secara async.
- [x] `initProgress(uid)` — dipanggil sekali setelah login: kalau dokumen `progresMurid/{uid}` sudah ada, load dari situ; kalau belum ada, klaim data `localStorage` lama (kalau ada) → tulis ke Firestore → hapus localStorage. Sesuai keputusan Fase 0 (klaim otomatis, bukan reset).
- [x] Guard di `src/main.js`: state `authReady`/`authUser`/`progressReady` mengontrol router — belum ada session → render halaman login; ada session → tunggu `initProgress` selesai sebelum render halaman lain. Tombol logout ditambahkan di header (icon baru `logout` di `icons.js`).
- [x] Verifikasi: `npm run build` sukses, semua modul ter-transform tanpa error lewat `vite dev` (dicek via curl ke endpoint dev server, tidak ada browser tool tersedia untuk klik manual di sesi ini).
- [ ] **Perlu ditest manual oleh user di browser**: alur register (murid & guru), login, logout, dan redirect otomatis ke halaman login saat belum auth — belum pernah dicoba end-to-end di browser sungguhan.
- [ ] Security Rules Fase 1 sudah menegakkan role di sisi server (write konten hanya `isGuru()`), tapi UI belum ada routing terpisah guru vs murid (dashboard guru baru masuk di Fase 5) — untuk sekarang guru & murid melihat UI yang sama setelah login.

### Fase 4 — CMS guru/admin
- [x] **Prasyarat yang ternyata diperlukan lebih dulu**: view murid (`home.js`, `mufrodat.js`, `muhadatsah.js`, `kosakata.js`, `kuis.js`, `profil.js`) sebelumnya baca dari `src/data/kosakata.js` & `muhadatsah.js` (statis, hasil `import` langsung) — supaya CRUD guru bisa nampak ke murid, dibuat `src/modules/content.js` sebagai lapisan data baru: `loadContent()` sekali fetch dari Firestore (`mufrodat` + subkoleksi `kata`, `muhadatsah`) ke cache in-memory saat login, lalu getter sinkron (`getKategori`, `getKosakata`, `getTopikMuhadatsah`) dipakai di 6 view tsb (pola sama seperti `progress.js`). `src/data/kosakata.js`/`muhadatsah.js` tetap ada, sekarang cuma dipakai `scripts/seed-firestore.mjs` sebagai sumber data awal.
- [x] Buat halaman CMS (`src/modules/views/cms.js`), route `#/cms`, nav item muncul otomatis hanya untuk akun `guru` (dicek dari `authRole` di `main.js`; guard tambahan juga di router kalau URL diakses langsung). Tab Mufrodat: CRUD kategori + kata bersarang. Tab Muhadatsah: CRUD topik + dialog (input multi-baris format `Nama|left/right|arab|terjemahan`, di-parse ke array).
- [x] Validasi input sebelum tulis ke Firestore: field wajib (label, judul, arti, dsb), panjang teks minimum, karakter Arab tervalidasi pakai regex rentang Unicode Arab (`؀-ۿ`) untuk field yang wajib berisi teks Arab (judul, kata, dialog).
- [x] Build (`npm run build`) sukses, semua modul ter-resolve tanpa error.
- [ ] **kuisSoal belum ada CMS-nya** — soal kuis masih digenerate on-the-fly dari `hijaiyah`/`kosakata` ([kuis.js](src/modules/views/kuis.js)), bukan dari bank soal. Membangun bank soal sungguhan berarti mendesain ulang alur kuis (bukan cuma tambah form CMS) — sengaja ditunda, didiskusikan lagi kalau memang dibutuhkan.
- [ ] **Perlu ditest manual oleh user di browser**: login sebagai guru → buka menu "Kelola Konten" → tambah/edit/hapus kategori, kata, topik muhadatsah → cek muncul di sisi murid (mufrodat/muhadatsah/kuis). Belum pernah dicoba end-to-end di browser sungguhan.

### Fase 5 — Dashboard laporan guru & progres murid
- [x] **Prasyarat yang ternyata belum ada**: entitas Kelas dirancang sejak Fase 0 tapi belum pernah ada UI-nya — murid daftar selalu dengan `kelasId: null` (lihat `auth.js`), dan guru tidak punya cara membuat kelas. Dibuat `src/modules/kelas.js`: `createKelas`, `getKelasByGuru` (query `where guruId==uid`), `getMuridByKelas` (query `where kelasId==id`), `getProgresForMurid`, `joinKelas` (murid masukkan kode kelas, divalidasi ke Firestore dulu sebelum `murid/{uid}.kelasId` di-update).
- [x] Widget "Gabung Kelas" ditambahkan ke halaman Profil murid (`profil.js`) — hanya tampil untuk role `murid`, form kode kelas dengan pesan error kalau kode tidak ditemukan.
- [x] Dashboard guru baru (`src/modules/views/dashboardGuru.js`, route `#/dashboard`, nav item muncul otomatis untuk `guru`): pilih kelas (dropdown, guru bisa buat kelas baru langsung dari sini, kode kelas ditampilkan untuk dibagikan ke murid) → tabel progres semua murid di kelas itu (huruf dikuasai, kata dipelajari, rata-rata skor kuis, XP, streak, level) → filter per modul (Semua/Hijaiyah/Mufrodat/Kuis) menyembunyikan kolom yang tidak relevan.
- [x] Query Firestore diselaraskan dengan Security Rules Fase 1 (`isGuruOfStudent`): guru cuma bisa lihat progres murid di kelas yang dia buat sendiri — sudah divalidasi lewat rule, bukan cuma di sisi UI.
- [x] Halaman Profil murid **sudah** menarik data dari Firestore sejak Fase 2/3 (lewat cache `progress.js` yang di-backend Firestore) — item ini otomatis selesai saat progress.js dirombak, tidak perlu kerjaan tambahan di fase ini.
- [x] Build (`npm run build`) sukses.
- [ ] **Perlu ditest manual oleh user di browser**: guru buat kelas → bagikan kode → murid gabung lewat halaman Profil → guru cek dashboard menampilkan data murid tsb dengan benar. Belum pernah dicoba end-to-end.

### Fase 5.5 — Audit UX & perbaikan konsistensi

Dilakukan setelah Fase 5 selesai, atas permintaan user ("audit UX flow & standarisasi"). Temuan lengkap ada di riwayat percakapan; berikut yang sudah dieksekusi:

- [x] **Modal konsisten** — `confirm()`/`prompt()` bawaan browser (dipakai di reset progres, hapus kategori/kata/topik CMS, buat kelas baru) diganti `src/modules/ui.js` (`confirmDialog`, `promptDialog`) yang bergaya sama dengan modal info app (`.modal-overlay`/`.modal-content`).
- [x] **Token warna error diseragamkan** — `login.js` sebelumnya pakai `--color-danger-600` yang tidak ada di `tokens.css` (selalu jatuh ke fallback `#d33`); diganti `--color-error` (token asli).
- [x] **Sidebar role-aware** — label "· Siswa" dan CTA "Mulai Belajar Harian" sebelumnya statis untuk semua role; sekarang guru melihat CTA "Kelola Kelas" + label "Guru", murid tetap seperti semula.
- [x] **Landing page dipisah per role** — guru yang buka `/` sekarang di-redirect otomatis ke `#/dashboard` (sebelumnya guru mendarat di halaman Beranda versi murid, dengan progress bar 0% yang tidak relevan). Nav item guru juga dirombak: tidak ada "Beranda", diganti "Dashboard Kelas" + "Kelola Konten" di urutan atas, modul murid diberi label "Pratinjau" untuk guru.
- [x] **Loading state dashboard guru diseragamkan** — sebelumnya cuma teks kecil di dalam tabel; sekarang `rerender()` dipanggil segera saat `loading=true` (baris tabel dan dropdown ter-disable selama fetch), konsisten dengan pola `busy` di CMS/login.
- [x] **Banner "gabung kelas" dipindah ke Beranda** — sebelumnya cuma ada di bagian bawah halaman Profil (mudah tidak disadari); sekarang murid yang belum gabung kelas langsung lihat banner di atas halaman Beranda dengan tombol langsung ke Profil.
- [x] **Aksesibilitas kecil** — `aria-label` ditambahkan ke tombol icon-only (logout, info, edit/hapus kata di CMS) yang sebelumnya cuma mengandalkan `title`.
- [ ] **Belum dikerjakan** (di luar scope 4 prioritas yang diminta, dicatat untuk nanti): toggle login/register menghapus input yang sudah diisi; tidak ada field konfirmasi password saat daftar; guard CMS/Dashboard punya pesan generic "khusus guru" yang duplikat persis (bisa disatukan jadi 1 komponen); `summary.userName` di sidebar murid masih default `'Tholib'` dari `progress.js`, belum ditarik dari `nama` yang diisi saat registrasi.
- [x] Build (`npm run build`) sukses.
- [x] **Form edit CMS dipindah dari bottom-sheet modal jadi halaman penuh** — modal `.modal-content` awalnya tidak bisa di-scroll (bug CSS: tidak ada `max-height`/`overflow-y`, sudah diperbaiki juga di `components.css`), lalu atas permintaan user diubah total jadi halaman terpisah (`renderEditPage`) dengan tombol "Kembali ke daftar" — ruang menulis lebih lega, terutama untuk dialog muhadatsah yang bisa banyak baris.
- [x] **Editor dialog CMS dirombak dari textarea format-string ke form baris interaktif** — sebelumnya guru harus ngetik manual format `Nama|left/right|teks Arab|terjemahan` di satu textarea besar (rawan salah ketik separator, susah edit satu baris di tengah). Sekarang tiap baris dialog jadi card terpisah: input nama, dropdown Kiri/Kanan, textarea teks Arab (RTL) + terjemahan, tombol hapus per baris, dan "+ Tambah Baris Dialog". State baris disinkron dari DOM sebelum re-render supaya ketikan tidak hilang saat tambah/hapus baris. Validasi per baris (nama, teks Arab, terjemahan wajib diisi) dengan pesan error yang sebut nomor barisnya.
- [ ] **Perlu ditest manual oleh user di browser** — sama seperti fase-fase sebelumnya, perubahan ini belum pernah diklik langsung.

### Fase 5.6 — Audit & perbaikan halaman Profil per-role

User laporkan screenshot: akun guru buka `/profil` tapi kontennya 100% versi murid (nama "Tholib", Level XP, statistik hijaiyah/kosakata, badge, tombol reset progres) plus bug "NaN%" di kartu akurasi kuis. Root cause & perbaikan:

- [x] **Root cause data**: `initProgress(uid)` di `main.js` sebelumnya dipanggil untuk SEMUA user login tanpa cek role, jadi guru pun otomatis dapat dokumen `progresMurid/{guruUid}` — sesuatu yang secara skema harusnya cuma milik murid. Diperbaiki: `initProgress` sekarang hanya dipanggil kalau `role === 'murid'`; guru tidak pernah membuat/menyentuh dokumen progres.
- [x] **Root cause nama "Tholib"**: itu default hardcoded di `progress.js` `getDefaultData()`, bukan `nama` yang diisi user saat registrasi (tersimpan di `guru/{uid}`/`murid/{uid}`). Ditambahkan `getCurrentNama()` di `auth.js` (resolve dari dokumen Firestore saat login, plus di-set langsung saat `register()` untuk hindari race dengan `onAuthStateChanged`), dipakai di sidebar (`main.js`) dan halaman Profil murid — menggantikan fallback lama.
- [x] **Bug NaN% diperbaiki** di `progress.js` `getSummary()`: `avgAccuracy` sekarang difilter dari entri `quizScores` yang `total > 0` sebelum dibagi rata-rata (sebelumnya entri dengan `total: 0` bikin `0/0 = NaN` ikut ke perhitungan).
- [x] **`profil.js` dipecah total per role**: `renderProfilGuru()` (baru) — nama & email asli, badge "Guru", ringkasan jumlah kelas diampu & total murid (query `kelas.js`), daftar kelas dengan kode & jumlah murid per kelas, shortcut ke Dashboard Kelas/Kelola Konten, tetap ada "Uji Suara" (relevan untuk guru juga saat isi CMS) — TANPA Level/XP/badge/statistik belajar/tombol reset yang tidak relevan untuk guru. `renderProfilMurid()` — isi lama, ditambah pakai `getCurrentNama()`.
- [x] Judul halaman di header (`main.js`) juga dibedakan: "Profil Akun" untuk guru, "Profil & Progres" untuk murid.
- [x] Build (`npm run build`) sukses.
- [ ] **Perlu ditest manual oleh user di browser** — termasuk cek bahwa dokumen `progresMurid` lama milik akun guru test (kalau ada dari sebelum perbaikan ini) tidak lagi dipakai/ditampilkan; boleh dihapus manual dari Firestore Console kalau mau beres-beres data, tapi tidak wajib (aplikasi sudah tidak membacanya untuk guru).

### Fase 5.7 — Audit & optimasi Dashboard Kelas untuk skala 60+ pengguna

User berencana uji aplikasi dengan 60+ pengguna, jadi selain UX, performa query juga dibenahi (bukan cuma cepat terasa di 1 kelas kecil).

- [x] **Render progresif** — filter bar (dropdown Kelas, Filter Modul, tombol Buat Kelas) langsung tampil tanpa nunggu data murid; hanya tabel yang menunjukkan indikator memuat, itu pun dengan animasi spin (baru: keyframe `@keyframes spin` + class `.spin` ditambahkan ke `base.css`, project sebelumnya tidak punya animasi loading sama sekali).
- [x] **Stale-while-revalidate, bukan cache selamanya** — sebelumnya flag `loaded` di-set sekali per sesi browser dan tidak pernah refresh (data basi kalau ada perubahan dari tab/sesi lain). Sekarang setiap kali halaman Dashboard atau Profil (guru) dibuka, data di-refresh di background secara otomatis — kalau ada cache lama ditampilkan dulu instan, lalu diam-diam diperbarui begitu fetch selesai.
- [x] **Bug infinite-loop nyaris ke-ship**: pola "refresh saat render" tadinya ditaruh di `bindDashboardGuruEvents`/`bindProfilEvents` yang dipanggil ulang di SETIAP render — termasuk render yang dipicu oleh refresh itu sendiri, jadi berpotensi memicu fetch tanpa henti. Diperbaiki dengan memisahkan `mountDashboardGuru`/`mountProfil` (dipanggil sekali saat route pertama dibuka, dari `main.js`) dari `bindDashboardGuruEvents`/`bindProfilEvents` (dipanggil di setiap render, cuma pasang event listener, tidak memicu fetch).
- [x] **Query N+1 diganti batch read** — `kelas.js` punya `getProgresForMuridBatch(uids)` baru: baca progres banyak murid sekaligus lewat query `where(documentId(), 'in', chunk)`, di-chunk otomatis per 30 id (limit Firestore `in`). Dulu: 1 query per murid (untuk kelas 60 murid = 60 round-trip paralel). Sekarang: maksimal 2 query untuk 60 murid.
- [x] **Dedup fetch antara Profil & Dashboard** — `kelas.js` sekarang punya cache in-memory (`getKelasByGuru` dengan opsi `forceRefresh`, plus `getCachedKelasList` untuk baca cache tanpa fetch) supaya kalau guru buka Dashboard dulu baru Profil (atau sebaliknya), request kedua tidak fetch ulang dari nol.
- [x] **Tombol salin kode kelas** (`navigator.clipboard.writeText`) — sebelumnya guru harus select-manual teks kode buat dibagikan ke murid.
- [x] **Baris murid diurutkan alfabetis** (`localeCompare` dengan locale `id`) — sebelumnya urutan mentah dari Firestore, tidak terprediksi.
- [x] **Baris "Rata-rata Kelas"** ditambahkan di atas tabel (dihitung dari `muridRows` yang sudah di-fetch, tidak perlu query tambahan) — guru bisa lihat performa kelas sekilas tanpa itung manual.
- [x] Build (`npm run build`) sukses.
- [ ] **Catatan untuk skala lebih besar lagi (di luar scope sekarang)**: Security Rules `isGuruOfStudent` melakukan 2 `get()` tambahan di server per dokumen murid yang dibaca (cek kelasId lalu cek guruId pemilik kelas) — ini tetap berlaku sama banyaknya walau query-nya sudah di-batch, jadi untuk kelas yang sangat besar (ratusan murid) biaya read Firestore-nya tetap linear terhadap jumlah murid. Kalau nanti perlu dioptimasi lebih lanjut, opsinya: denormalisasi `guruId` langsung ke tiap dokumen `progresMurid` supaya rule-nya tidak perlu 2 `get()` berantai lagi.
- [ ] **Perlu ditest manual oleh user di browser**, idealnya dengan beberapa akun murid sungguhan di satu kelas untuk verifikasi urutan, rata-rata, dan kecepatan loading terasa bedanya.

### Fase 5.8 — Bug nyata: query murid guru gagal "Missing or insufficient permissions"

User lapor "data gurunya sama aja" setelah murid gabung kelas. Awalnya dikira soal cache/stale data (sudah ditambah tombol Refresh manual di Dashboard & Profil guru), tapi ternyata **bug rules sungguhan**.

- [x] **Root cause ditemukan lewat pengujian empiris** (bukan tebakan) — dibuat script sekali-pakai (`firebase-admin` + custom token, sign-in SUNGGUHAN sebagai akun guru via server asli, bukan admin bypass bukan emulator) yang menjalankan 6 query satu-satu. Hasilnya: `get()` satu dokumen `murid/{uid}` berhasil, tapi `list`/query `murid` dengan filter `where('kelasId','==',...)` gagal `permission-denied` — walau data & rule logic-nya sudah benar secara semantik.
- [x] **Penyebab**: fungsi `isGuruOfStudent` di `firestore.rules` melakukan `get(murid/{uid})` **dari dalam rule collection `murid` itu sendiri** — Firestore menolak self-referential `get()` semacam ini untuk operasi `list` (query), walau untuk `get()` satu dokumen sama sekali tidak masalah. Ini keterbatasan Firestore Rules yang tidak jelas terdokumentasi dan gampang tidak ketahuan sampai benar-benar dites dengan query nyata (Security Rules Playground/`allow read` yang "terlihat benar" tidak otomatis mengungkap ini).
- [x] **Perbaikan**: ditambah fungsi baru `isGuruOfKelas(kelasId)` khusus untuk rule collection `murid`, pakai `resource.data.kelasId` (data dokumen yang sedang dievaluasi, sudah tersedia gratis) alih-alih `get()` ulang ke dirinya sendiri. `isGuruOfStudent` (dipakai `progresMurid`/`kuisRiwayat`, lintas-collection, bukan self-referential) dibiarkan seperti semula karena terbukti tidak bermasalah di pengujian.
- [x] Rules di-deploy ulang, 6/6 skenario pengujian lolos (dicek ulang persis sama seperti sebelum fix, semua PASS).
- [x] Ditambah juga tombol **Refresh manual** di Dashboard Kelas & Profil guru (independen dari bug ini, tapi tetap berguna karena app tidak realtime — kalau murid gabung kelas saat tab guru sudah lama terbuka, guru tetap perlu refresh manual untuk lihat perubahan terbaru).
- [x] Script diagnostik & service account key sudah dihapus setelah dipakai (tidak disimpan di repo).
- [x] Build (`npm run build`) sukses.
- [ ] **Perlu ditest ulang oleh user di browser** — Dashboard Kelas dan Profil guru sekarang seharusnya benar-benar menampilkan murid yang sudah gabung, bukan cuma "Gagal memuat data murid" lagi.

### Fase 5.9 — Bug: halaman login kekedip sesaat saat refresh

User lapor: setelah login, refresh browser sempat balik ke halaman login dulu baru langsung masuk lagi ke dashboard (flash of unauthenticated content).

- [x] **Root cause**: `src/modules/auth.js` — `currentUser` diinisialisasi `null`, padahal `onAuthChange`'s guard (`if (currentUser !== undefined) callback(...)`) dimaksudkan buat bedakan "status login belum diketahui" (harus `undefined`) vs "sudah dipastikan belum login" (`null`). Karena nilai awalnya `null`, listener yang didaftarkan `main.js` langsung dipanggil dengan `(null, null)` SEBELUM Firebase Auth sempat mengecek sesi tersimpan di localStorage/IndexedDB — `main.js` pun langsung render halaman login duluan, baru begitu `onAuthStateChanged` asli selesai (sepersekian detik kemudian) redirect ke halaman yang benar.
- [x] **Fix**: `currentUser` sekarang mulai dari `undefined`, baru diisi `null`/user setelah `onAuthStateChanged` betulan resolve. `main.js` tidak perlu diubah — guard `authReady` di sana sudah benar dari awal, cuma nunggu sinyal yang salah dari `auth.js`.
- [x] Build (`npm run build`) sukses.
- [x] **Bug kedua ditemukan sekalian**: teks "Memuat..." nempel di pojok kiri-atas saat loading, bukan di tengah layar. Penyebab: `#app` di `base.css` itu `display:flex; flex-direction:row` (didesain untuk layout sidebar+konten utama). Waktu cuma diisi satu div loading, div itu jadi flex-item yang lebar-nya cuma sesuai teks (bukan penuh), jadi `justify-content:center` di dalam div itu sendiri tidak berefek karena kontainer luarnya (div itu sendiri) juga tidak melebar penuh. Fix: tambah `width:100%` ke div loading di `main.js` (2 tempat: "Memuat...", "Memuat progres...") dan `login.js`.
- [x] **2 catatan audit yang tadinya ditunda** (dari Fase 5.5) dikerjakan sekalian: toggle Login/Daftar sekarang **tidak lagi menghapus input** yang sudah diketik (state dipertahankan lintas toggle); ditambah field **Konfirmasi Password** saat daftar, dengan validasi cocok sebelum submit.
- [x] Build (`npm run build`) sukses.
- [ ] **Perlu ditest manual oleh user**: login → refresh browser (F5) → pastikan tidak ada kedipan ke halaman login lagi, dan teks loading sekarang di tengah layar (bukan pojok).

### Fase 5.10 — Drag-and-drop urutan Bab & Kata di CMS

User tanya soal tata letak judul (Indonesia besar + Arab subtitle di CMS) — dijawab: itu memang disengaja dan tepat untuk konteks CMS (audiens guru, butuh scan cepat B. Indonesia), beda dengan tampilan murid yang Arab-nya lebih menonjol karena itu materi belajarnya — tidak ada perubahan diperlukan di situ. Lanjut ke permintaan utama: drag-and-drop reorder.

- [x] **Kata (mufrodat) sebelumnya tidak punya field urutan sama sekali** — ditambah field `urutan` (integer) di dokumen `kata`, default ke posisi hasil query Firestore kalau dokumen lama belum punya field ini (supaya kata yang sudah ada tidak "hilang urutannya" pas fitur ini baru dipasang).
- [x] `content.js`: `reorderKategori(orderedIds)` menulis ulang field `bab` (1..N sesuai urutan baru) dan `reorderKata(kategoriId, orderedIds)` menulis ulang field `urutan` (0..N) — keduanya lewat `writeBatch` (satu commit atomik untuk semua dokumen, bukan tulis satu-satu).
- [x] Drag-and-drop native HTML5 (`draggable`, `dragstart`/`dragover`/`drop`) di `cms.js`, tanpa nambah library eksternal: kartu kategori (Bab) bisa diseret untuk urutkan antar-bab, dan tiap baris kata di dalam kategori bisa diseret urutkan antar-kata dalam kategori yang sama. Drag kata `stopPropagation()` supaya tidak ketangkap handler drag kategori yang membungkusnya (kata ada di dalam card kategori yang juga draggable).
- [x] Icon baru `grip` (titik enam, drag handle) ditambah di `icons.js`, dipasang di setiap kartu kategori & baris kata plus hint text kecil "Seret untuk urutkan bab & kata".
- [x] Build (`npm run build`) sukses.
- [ ] **Di luar scope** (tidak diminta user, dicatat kalau nanti mau diperluas): urutan topik Muhadatsah belum bisa di-drag (cuma mufrodat/bab & kata yang diminta).
- [ ] **Perlu ditest manual oleh user di browser** — drag-and-drop belum pernah dicoba langsung; perhatikan juga di perangkat sentuh (HTML5 drag-and-drop native **tidak bekerja di touchscreen/mobile** tanpa polyfill tambahan — kalau CMS ini juga dipakai dari HP/tablet, fitur ini perlu penyesuaian lebih lanjut).

### Fase 5.11 — Audit & perbaikan tampilan mobile/desktop

- [x] **Bug kritis diperbaiki: halaman Profil tidak bisa diakses sama sekali di mobile.** Satu-satunya pintu ke `#/profil` adalah blok `.sidebar__user`, dan sidebar disembunyikan total (`display:none`) di bawah 860px — bottom-nav pengganti tidak pernah punya item Profil. Diperbaiki dengan memisahkan `sidebarItems()` (lengkap, untuk desktop) dari `bottomNavItemsFor()` (ringkas, khusus mobile, **selalu menyertakan Profil**) di `main.js`.
- [x] **Bottom-nav guru dirampingkan** — sebelumnya 5 item dengan label panjang ("Dashboard Kelas", "Pratinjau Mufrodat", dst) bakal kepotong/tumpuk di layar HP. Bottom-nav guru sekarang cuma 3 item esensial (Dashboard, Konten, Profil) dengan label pendek; menu lengkap (termasuk 3 link pratinjau) tetap ada di sidebar desktop.
- [x] **Fallback tombol naik/turun untuk drag-and-drop CMS** — HTML5 drag-and-drop native tidak jalan di layar sentuh. Ditambah tombol chevron naik/turun (icon baru) di tiap kartu kategori & baris kata yang bekerja lewat klik biasa (tukar posisi dengan tetangga, commit ke `reorderKategori`/`reorderKata` yang sama), tidak butuh drag sama sekali. Ikon grip disembunyikan di bawah 860px (CSS `.drag-handle-desktop-only`) supaya tidak membingungkan karena tidak berfungsi di situ.
- [x] Baris input dialog Muhadatsah (nama + dropdown sisi + tombol hapus) ditambah `flex-wrap` dan `min-width` supaya melipat rapi alih-alih terjepit di layar sempit (<360px).
- [x] Judul halaman di header (`.app-header__title`) ditambah `text-overflow:ellipsis` + `min-width:0`, dan `.app-header__left`/`.app-header__actions` diberi `flex`/`flex-shrink` yang benar — judul panjang seperti "Kelola Konten (CMS)" sekarang terpotong rapi dengan "…" di layar sempit, bukan mendorong tombol logout/info keluar layar.
- [x] Filter bar Dashboard Kelas & tabel murid (sudah dari Fase 5.7/5.10) dicek ulang — sudah pakai `flex-wrap`/`overflow-x:auto` yang memadai, tidak perlu perubahan tambahan.
- [x] Build (`npm run build`) sukses, dicek juga transform via `vite dev` (tidak ada browser tool untuk klik manual di sesi ini).
- [ ] **Perlu ditest manual oleh user** — idealnya pakai DevTools device toolbar (F12 → toggle device toolbar) atau HP sungguhan: cek Profil bisa diakses dari bottom-nav (murid & guru), bottom-nav guru tidak lagi kepotong, tombol naik/turun CMS berfungsi di simulasi touch/HP, dan header tidak overflow di berbagai lebar layar.

### Fase 5.12 — Audit & perbaikan halaman Kuis (bug XP dobel & exploit XP gratis)

- [x] **Bug kritis: XP & riwayat kuis bisa dobel.** `renderQuiz()` (fungsi render) memanggil `saveQuizScore()` langsung tiap kali render mendeteksi "kuis selesai", tanpa penanda sudah-tersimpan. Skenario nyata: selesai kuis → balik ke daftar → klik "Mulai Kuis" mode YANG SAMA lagi → heuristik lama (`mode !== selectedQuizMode`) gagal mendeteksi ini butuh mulai ulang → quizState lama yang sudah selesai ke-render ulang sebagai "selesai" → `saveQuizScore` terpanggil lagi dengan skor sama → XP & entri riwayat dobel. Diperbaiki dua lapis: (1) `quizState.scoreSaved` guard — `saveQuizScore` cuma boleh sekali per sesi kuis; (2) root cause: `main.js` sekarang memanggil `startQuiz(seg3)` **eksplisit setiap kali route `#/kuis/main/:mode` dibuka** (bukan diputuskan lewat heuristik tebak-tebakan di dalam `renderQuiz()` lagi) — `renderQuiz()` sekarang murni fungsi render, tidak lagi punya wewenang memutuskan kapan mulai kuis baru.
- [x] **Bug kritis: kuis kosong = celah XP gratis.** Kalau kosakata di Firestore kosong/kurang (guru hapus semua, atau akun baru sebelum guru isi konten), `questions: []` bikin `0 >= 0` langsung dianggap "selesai skor sempurna" → dapat bonus +50 XP tanpa jawab apa pun (logika `score===total` di `progress.js` menganggap 0===0 sebagai perfect). Ini juga kemungkinan sumber entri `quizScores` dengan `total:0` yang bikin bug NaN% di Dashboard guru (Fase 5.6). Diperbaiki: `buildQuestions` return `[]` kalau pool < `MIN_POOL_SIZE` (2), dan `renderQuiz()` punya state terpisah "konten belum cukup" yang SAMA SEKALI TIDAK memanggil `saveQuizScore`.
- [x] **Guard jumlah minimum konten** — `hasEnoughContent(mode)` baru, dipakai di `renderKuisList()`: mode dengan kosakata kurang dari 2 kata ditampilkan "Konten belum cukup" (card pudar, tombol disabled), bukan tombol "Mulai Kuis" yang mengarah ke kuis rusak.
- [x] **Efek samping lain di fungsi render dirapikan** — autoplay audio mode Listening (`setTimeout(() => speakArabic(...))`) sebelumnya bisa retrigger tiap kali render dipanggil ulang untuk soal yang sama; ditambah guard `quizState.audioPlayedFor` (index soal terakhir yang sudah di-autoplay) supaya cuma sekali per soal.
- [x] **Kode render+bind dobel di `main.js` dirapikan** — sebelumnya route kuis nulis manual `view.innerHTML = renderQuiz(...); bindQuizEvents(...)` dua kali (sekali di luar closure `rerenderQuiz`, sekali lagi badan yang sama persis) — sekarang cukup `startQuiz(seg3)` lalu panggil `rerenderQuiz()` sekali.
- [x] Build (`npm run build`) sukses.
- [ ] **Perlu ditest manual oleh user di browser**: selesaikan kuis mode apa saja → balik ke daftar → klik mode yang SAMA lagi → pastikan mulai dari soal 1 (bukan langsung ke layar hasil) dan XP cuma nambah sekali. Kalau ada kelas tanpa kosakata sama sekali, cek juga card "Tebak Kosakata" di daftar kuis berubah jadi "Konten belum cukup" dan tidak bisa diklik.

### Fase 5.13 — Fitur baru: Ulasan Jawaban di layar hasil kuis

User minta feedback lebih lengkap dari sekadar skor angka setelah kuis selesai.

- [x] `quizState.history` baru — tiap jawaban (soal, pilihan yang diklik, benar/salah) direkam saat murid menjawab (`bindQuizEvents`), direset di `startQuiz()`.
- [x] Layar hasil kuis sekarang menampilkan section **"Ulasan Jawaban"**: satu baris per soal dengan nomor urut (hijau/merah sesuai benar-salah), glyph Arab soal, jawaban murid, dan jawaban yang benar (khusus ditampilkan untuk soal yang salah). Ada tombol putar ulang audio per soal supaya bisa dengar ulang huruf/kata yang salah dijawab.
- [x] Bekerja untuk ketiga mode (Huruf, Suara, Kosakata) — styling opsi menyesuaikan (huruf Arab untuk mode Suara, teks Latin/arti untuk mode lain).
- [x] Build (`npm run build`) sukses.
- [x] **Penjelasan tambahan untuk soal yang salah** — data `makhraj`/`desc` (huruf, sudah ada di `hijaiyah.js` tapi belum pernah dipakai di kuis) dan `contoh` kalimat (kosakata, dari CMS) sekarang ditampilkan di bawah "Jawaban benar", khusus untuk soal yang dijawab salah saja (biar ulasan tidak kepanjangan kalau semua benar).
- [ ] **Perlu ditest manual oleh user di browser** — selesaikan kuis lalu cek bagian Ulasan Jawaban muncul dengan benar untuk ketiga mode, termasuk tombol putar audio ulang dan penjelasan makhraj/contoh kalimat untuk soal yang salah.

### Fase 5.14 — Bank soal kuis berbasis bab (dulu direncanakan tapi ditunda di Fase 1, sekarang dikerjakan)

User minta: tiap jenis kuis (Huruf/Suara/Kosakata) punya bab-bab di dalamnya, plus halaman CMS buat kelola soalnya, plus data dummy. Ini fitur yang di Fase 1 sengaja ditunda ("kuisSoal belum ada CMS-nya, soal masih digenerate on-the-fly") — sekarang dibangun sungguhan, menggantikan cara lama.

- [x] **Perubahan fundamental**: dulu kuis generate soal otomatis dari SELURUH `hijaiyah`/`kosakata` (5 soal acak dari pool besar, tanpa kurasi). Sekarang guru mengelompokkan soal ke dalam bab-bab spesifik lewat CMS, dan soal kuis diambil dari bab yang murid pilih — bukan generate acak lagi.
- [x] Skema Firestore baru dipakai: `kuisSoal/{kategoriId}` (bab, field: `nama`, `jenis`, `urutan`) + subkoleksi `soal/{soalId}` (field: `glyph`, `latin`, `arti` [khusus kosakata], `makhraj`/`desc` [khusus huruf/suara, dipakai juga di fitur penjelasan Fase 5.13]). Rules-nya sudah ada dari Fase 1 (`kuisSoal/{modeId}/soal/{soalId}`), tidak perlu deploy ulang.
- [x] `content.js`: cache + CRUD + reorder (`getKuisKategori`, `getKuisSoal`, `saveKuisKategori`, `deleteKuisKategori`, `saveKuisSoalItem`, `deleteKuisSoalItem`, `reorderKuisKategori`, `reorderKuisSoalItems`) — pola identik dengan mufrodat kategori/kata.
- [x] **Alur kuis murid jadi 3 tingkat**: pilih jenis (`#/kuis`) → pilih bab (`#/kuis/kategori/:jenis`, halaman baru) → kerjakan kuis (`#/kuis/main/:kategoriId`). Segmented-control ganti-mode di dalam kuis (fitur lama) dihapus karena sudah tidak relevan — ganti jenis sekarang berarti ganti bab juga, jadi mesti balik ke halaman pilih bab.
- [x] **CMS dapat tab baru "Kuis"** — sub-filter jenis (Huruf/Suara/Kosakata), CRUD bab + soal bersarang, drag-and-drop DAN tombol naik/turun (parity penuh dengan tab Mufrodat, termasuk dukungan mobile dari Fase 5.11). Validasi: nama bab wajib, teks Arab soal wajib valid, arti wajib khusus kosakata.
- [x] **Data dummy di-seed**: 2 bab per jenis (6 total, 46 soal) diambil dari data statis `hijaiyah.js`/`kosakata.js` yang sudah ada (Huruf Bagian 1-2, Suara Dasar 1-2, Kosakata Keluarga & Angka) lewat script sekali-pakai (`scripts/seed-kuis-dummy.mjs`, firebase-admin + service account key sementara, sudah dihapus setelah dipakai).
- [x] `hasEnoughContent`/status "Ready" di daftar kuis & daftar bab dihitung ulang: jenis dianggap ready kalau minimal 1 babnya punya ≥2 soal; bab dianggap ready kalau punya ≥2 soal sendiri (mencegah celah XP-gratis dari Fase 5.12 tetap berlaku di skema baru).
- [x] Build (`npm run build`) sukses.
- [ ] **Perlu ditest manual oleh user di browser**: cek 3 kartu jenis kuis di `#/kuis` → klik salah satu → muncul 2 bab dummy → kerjakan kuis → cek Ulasan Jawaban & penjelasan makhraj/contoh tetap muncul. Lalu di CMS tab Kuis: coba tambah/edit/hapus bab dan soal, drag-and-drop reorder, dan tombol naik/turun.

### Fase 5.15 — CMS: baris/kartu jadi bisa diklik, ikon gir & hapus dihapus dari list

User kesel lihat ikon-ikon numpuk di baris CMS (naik/turun + gir + hapus + teks panjang berebut tempat di layar sempit).

- [x] Ikon gir (Edit) & silang (Hapus) dihapus dari SEMUA baris/kartu list (kategori mufrodat, kata, topik muhadatsah, bab kuis, soal kuis) — diganti jadi baris/kartu itu sendiri yang bisa diklik untuk buka halaman edit, dengan chevron `›` kecil di ujung kanan sebagai penanda "bisa diklik" (pola umum list mobile).
- [x] Tombol **Hapus** dipindah ke dalam halaman edit (di bawah form, warna merah) — cuma muncul kalau sedang edit item yang sudah ada (bukan saat tambah baru).
- [x] Tombol naik/turun **dipertahankan** (bukan dihapus) karena itu satu-satunya cara reorder di HP (drag-and-drop native tidak jalan di touchscreen) — tapi dibikin redup (opacity 0.4) secara default, baru jelas kelihatan saat disentuh/hover, supaya tidak mendominasi visual baris.
- [x] Klik pada baris mendeteksi apakah target klik ada di dalam `.cms-row__controls` (tombol naik/turun) — kalau iya, tidak buka halaman edit (supaya menekan tombol reorder tidak ke-trigger buka edit juga).
- [x] Build (`npm run build`) sukses.
- [ ] **Perlu ditest manual oleh user**: klik baris/kartu buka halaman edit dengan benar, tombol naik/turun tetap berfungsi tanpa ikut buka edit, tombol Hapus di dalam halaman edit berfungsi dan kembali ke daftar setelah hapus.

### Fase 5.16 — CMS: split-view "Kelola Kata"/"Kelola Soal" (terinspirasi dashboard admin lain milik user)

User tunjukkan screenshot dashboard admin proyek lain ("Arabiku Admin") yang punya pola split-view: form edit di kiri, daftar item di kanan, tanpa pindah halaman. Setelah dibandingkan (kritik juga bagian yang tidak perlu ditiru: gambar dekoratif trofi di header kartu yang cuma makan tempat), pola split-view-nya diadopsi untuk Kuis & Mufrodat.

- [x] **Perubahan struktur signifikan**: kartu kategori/bab di daftar (Mufrodat & Kuis) disederhanakan drastis — tidak lagi menampilkan daftar item bersarang + tombol "+Tambah" per kartu. Sekarang cuma nama bab + jumlah item ("X kata"/"X soal"), klik untuk buka halaman "Kelola Kata"/"Kelola Soal" split-view.
- [x] Halaman kelola baru (`renderManagePage` → `renderManageKata`/`renderManageKuisSoal`): **kolom kiri** form tambah/edit item (tetap di halaman yang sama setelah simpan, form otomatis kosong lagi siap isi item berikutnya — jadi isi banyak kata/soal berturut-turut tidak perlu bolak-balik halaman), **kolom kanan** daftar item dengan drag-handle + tombol naik/turun + delete, baris yang lagi diedit di-highlight (garis aksen ungu di kiri).
- [x] Layout `.cms-split` pakai CSS Grid (`360px 1fr` di desktop ≥861px, otomatis jadi 1 kolom di mobile lewat breakpoint yang sudah ada) — tidak perlu logic terpisah untuk mobile, grid alami melipat sendiri.
- [x] Edit **metadata bab itu sendiri** (nama, nomor bab, dst — bukan isi katanya) tetap pakai halaman penuh lama, diakses lewat tombol "Edit Bab" di header halaman kelola; kembali/simpan/batal dari situ otomatis balik ke halaman kelola (bukan ke daftar bab), kecuali bab-nya dihapus (baru balik ke daftar).
- [x] Kode lama untuk `editing.kind === 'kata'|'kuisSoal'` (form+validasi+simpan+hapus versi full-page) dihapus total, digantikan sepenuhnya oleh form di dalam split-view — tidak ada jalur ganda yang membingungkan.
- [x] Bug ditemukan & diperbaiki saat implementasi: menggabungkan class `.card` + `.cms-row` pada elemen yang sama membuat aturan `padding`/`border-bottom` dari `.cms-row` menimpa `.card` (urutan CSS di stylesheet), bikin kartu kategori kehilangan padding-nya — diperbaiki dengan inline style override.
- [x] Build (`npm run build`) sukses.
- [ ] **Perlu ditest manual oleh user di browser**: buka Mufrodat/Kuis → klik kartu bab → cek split-view muncul (kolom di desktop, tumpuk di mobile) → coba tambah beberapa kata/soal berturut-turut tanpa pindah halaman → coba klik item di kanan untuk edit → coba hapus item → coba "Edit Bab" lalu kembali (harus balik ke kelola, bukan ke daftar).

### Fase 5.17 — Kualitas audio pelafalan Arab

User keluhkan audio TTS terdengar kaku, terutama teks pendek (1 huruf/1 kata).

- [x] **Perbaikan gratis diterapkan** (`src/modules/speech.js`): pilih suara Arab TERBAIK yang tersedia di browser (prioritaskan suara cloud/remote seperti suara Google di Chrome, bukan asal ambil suara lokal OS pertama yang ketemu), rate bicara adaptif sesuai panjang teks (teks pendek lebih natural, kalimat panjang tetap pelan biar jelas), fix bug `getVoices()` yang sering return kosong di awal (di-cache + listen event `voiceschanged`).
- [x] **Opsi audio pra-rekam (Google Cloud TTS) disiapkan tapi TIDAK dijalankan** — kode lengkap sudah ada: `playAudioOrSpeak()` di `speech.js` (pakai audio pra-rekam kalau ada `audioUrl`, fallback otomatis ke browser TTS kalau tidak ada/gagal), sudah di-wire di `mufrodat.js`/`muhadatsah.js`/`kuis.js`, dan script `scripts/generate-audio.mjs` siap generate audio via Google Cloud TTS + upload ke Firebase Storage. **Diblokir** karena user tidak bisa menambahkan kartu billing ke Google Cloud (kartu debit Bank Jago ditolak, error `OR_CCREU_01` — kemungkinan besar karena Google Cloud Billing lebih kompatibel dengan kartu kredit/bank konvensional dibanding kartu debit bank digital).
- [x] **Keputusan user**: pakai perbaikan gratis dulu, opsi audio pra-rekam ditunda (bukan dibatalkan) — kode & script sudah siap dipakai kapan saja kalau nanti ada akses kartu kredit atau mau coba provider TTS lain (Azure, ElevenLabs, dll — tinggal ganti bagian `synthesize()` di script).
- [x] Semua wiring aman tanpa audio pra-rekam — `playAudioOrSpeak(audioUrl, text)` otomatis fallback ke `speakArabic(text)` kalau `audioUrl` kosong/undefined, jadi tidak ada regresi meski `audioUrl` belum pernah terisi di Firestore.
- [x] Build (`npm run build`) sukses.

### Fase 5.18 — Layout halaman Mufrodat (flashcard) dibikin lebih clean & muat 1 layar

User keluhkan halaman flashcard Mufrodat butuh scroll dan panel dekoratif (dot-pattern + badge ikon generik) di sisi kiri buang-buang ruang tanpa menambah informasi.

- [x] `src/modules/views/mufrodat.js` — `renderMufrodatLesson()`: hapus `.flashcard-split__media` (panel dekoratif dot-pattern + ikon besar) sepenuhnya, ikon lesson dipindah jadi bagian kecil dari tag kategori di atas glyph. Kartu jadi satu kolom penuh, konten (tag, glyph, fonetik, arti, tombol play) lebih padat.
- [x] `src/styles/components.css` — `.flashcard-split` tidak lagi punya varian `flex-direction:row` di desktop (media panel sudah dihapus, jadi tidak perlu split 2 kolom); padding `.flashcard-split__content` dan `.lesson-nav-bar` dikecilkan (`space-8`→`space-6`, `space-4`→`space-3`/`space-2`), tombol play dikecilkan (76px→60px), `margin-top` antar section dihapus (digantikan `gap` dari wrapper baru).
- [x] Wrapper baru `.lesson-page-compact` (flex column, `gap:var(--space-4)`, `height:100%`, `justify-content:center`) membungkus breadcrumb + card + nav-bar supaya kontennya vertically centered dan tidak menyisakan spasi kosong besar saat halaman pendek, sekaligus menyusut otomatis di layar rendah.
- [x] Build (`npm run build`) sukses.
- [x] **Follow-up**: user minta hapus label tag kategori di atas kartu, dan tambah interaksi flip-card (terinspirasi contoh dashboard lain) — kartu depan berisi ikon bab + glyph + fonetik + arti + tombol audio; klik kartu atau tombol "Balik Kartu" membalik ke sisi belakang yang menampilkan `contoh` kalimat (field yang sudah ada di data kosakata & sudah bisa diisi lewat CMS, sebelumnya tidak ditampilkan di flashcard). Diimplementasikan pakai CSS 3D transform (`perspective`/`rotateY`/`backface-visibility`), state flip di-toggle lewat class `is-flipped`, tidak perlu re-render.
- [x] **Follow-up 2**: dipecah jadi 2 kartu berdampingan (`.flashcard-duo`, side-by-side ≥720px, stack di mobile) meniru layout referensi — kartu kiri (`flip-card`) sekarang isinya cuma glyph besar (ikon bab dihapus total) yang bisa dibalik untuk lihat contoh kalimat, tombol "Balik Kartu" ditaruh di dalam masing-masing sisi kartu; kartu kanan (`flashcard-info`) statis berisi pil fonetik + arti, tombol audio dipindah ke pojok kanan-atas kartu (`flashcard-info__play`, posisi absolute) alih-alih di tengah bawah.
- [x] **Follow-up 3**: peran 2 kartu ditukar sesuai maksud asli user — kartu kiri (`flashcard-image`, statis, tidak flip) sekarang murni gambar ilustrasi kata, diambil dari field baru `gambarUrl` yang bisa diisi guru lewat CMS (`src/modules/views/cms.js` — form Kelola Kata dapat field baru "URL Gambar Ilustrasi (opsional)"), fallback ikon placeholder kalau kosong. Kartu kanan (`flip-card`) sekarang berisi kosakata (glyph + pil fonetik + arti) di depan, dan **contoh kalimat** di belakang; kedua sisi kartu kanan punya tombol audio sendiri di pojok kanan-atas — sisi depan memutar `audioUrl`/glyph kata, sisi belakang memutar (fallback browser-TTS) teks `contoh` kalimat.
- [x] **Follow-up 4**: kartu ditinggikan (`min-height` 260px→340px di `.flip-card__inner` & `.flashcard-image`) supaya ada ruang napas atas-bawah. Teks contoh kalimat di sisi belakang kartu kanan di-parse (regex pisahkan teks sebelum "(...)" sebagai kalimat Arab dan isi dalam kurung sebagai terjemahan Indonesia — format data `contoh` yang sudah ada, mis. `"...عَشَرَةُ دَرَاهِمَ (Sepuluh dirham)"`) dan dirender 2 baris terpisah: Arab (font arabic) di atas, terjemahan (italic, ink-500) di bawah — sebelumnya nyampur 1 baris pakai font Arab untuk semuanya sehingga teks Latin ikut kepengaruh style Arab.
- [x] **Follow-up 5**: field gambar di CMS diubah dari isi URL manual jadi **upload file langsung** (`<input type="file">`). Awalnya dicoba pakai Firebase Storage, tapi **diblokir lagi** — Firebase Storage sekarang wajib project di plan Blaze (kartu billing) untuk aktivasi pertama kali, dan gagal sama seperti kasus Cloud TTS sebelumnya (`OR_CCREU_01`). **Solusi**: pindah ke **ImgBB** (`api.imgbb.com`) — layanan hosting gambar gratis, tanpa kartu, cukup 1 API key publik. `uploadKataGambar()` di `content.js` sekarang POST file ke ImgBB API, dapat URL publik, lalu URL itu yang disimpan sebagai `gambarUrl` di Firestore (Firestore tetap dipakai seperti biasa, cuma file gambarnya numpang di ImgBB). Kode Firebase Storage yang sempat ditambahkan (`storage.rules`, import `firebase/storage`) sudah dihapus lagi karena tidak jadi dipakai.
- [ ] **Perlu diisi user**: daftar gratis di https://api.imgbb.com/ (tanpa kartu), ambil API key, isi ke `.env` di baris `VITE_IMGBB_API_KEY=` (sudah disiapkan kosong) — upload gambar tidak akan berfungsi sebelum key ini diisi.
- [ ] Perlu ditest manual oleh user di browser (termasuk coba upload gambar asli lewat CMS setelah API key diisi, cek layar pendek/laptop 720p apakah sudah beneran tidak perlu scroll, dan cek animasi flip + layout 2 kartu di mobile).

### Fase 5.19 — Audit UI/UX/state menyeluruh & perbaikan (menjelang testing 60+ user)

User minta audit menyeluruh dari sisi UI, UX, dan state management sebelum lanjut fitur baru. Ditemukan 9 isu, semua langsung diperbaiki:

**Bug (state/crash/hang):**
- [x] `main.js`: `loadContent()`/`loadMyKelasInfo()` di-await tanpa try/catch — kalau gagal (offline/rules error), app nyangkut selamanya di "Memuat progres...". Sekarang dibungkus `loadInitialData()` dengan try/catch + state `progressLoadError` + layar error dengan tombol "Coba Lagi" yang retry `loadInitialData` lagi.
- [x] `mufrodat.js`: `renderMufrodatLesson()` crash blank kalau bab punya 0 kata (guru baru bikin bab, belum isi kata) — `words[i]` jadi `undefined` lalu dipanggil `.match()`. Sekarang ada guard eksplisit, tampilkan pesan "Bab ini belum punya kata" + link kembali.
- [x] `dashboardGuru.js` & `profil.js`: state guru (`kelasList`, `muridRows`, `guruStats`, dst) tidak pernah direset saat re-entry — beda kelasnya dengan bug CMS yang sudah diperbaiki di Fase 5.x sebelumnya (state per-route yang nyangkut). Sekarang keduanya melacak `lastGuruUid`/`lastGuruStatsUid` dan reset state kalau UID guru yang login berubah (ganti akun di tab yang sama).

**UX/konsistensi:**
- [x] `progress.js`: `persist()` sebelumnya `setDoc(...).catch(() => {})` — gagal simpan XP/streak/skor kuis ke Firestore didiamkan total tanpa indikasi apapun. Sekarang retry sekali, kalau masih gagal: backup ke `localStorage` (`LOCAL_KEY`) + toast notifikasi ke user (`showToast()` baru di `ui.js`) + `console.error`.
- [x] `ui.js`: tambah `showToast(message, {danger})` — notifikasi kecil non-blocking di pojok bawah, auto-hilang 4 detik, dipakai untuk error yang tidak layak diinterupsi pakai modal konfirmasi.
- [x] CMS tab Muhadatsah sekarang punya reorder/drag+move-button yang sama dengan Mufrodat & Kuis (sebelumnya topik hanya bisa diurutkan lewat urutan dokumen Firestore apa adanya, tidak konsisten dengan 2 tab lain). Ditambahkan field `urutan` di skema `muhadatsah/{topikId}` (di-set otomatis dari posisi query kalau dokumen lama belum punya field ini, sama seperti pola `mufrodat`/`kuisSoal`), fungsi `reorderTopikMuhadatsah()` baru di `content.js`, dan `bindDragTopik`/`bindTopikMoveButtons` baru di `cms.js`.
- [x] Tombol "Buat Kelas Baru" (`dashboardGuru.js`) dan "Gabung" (`profil.js`, form join-kelas) sekarang di-disable selama proses async berjalan — sebelumnya rawan double-submit kalau diklik cepat.

**Polish:**
- [x] Tambah `aria-label` ke tombol ikon-only yang sebelumnya tidak ada: tombol play di flashcard Mufrodat (depan & belakang kartu), tombol prev/next kata, tombol play di chat bubble Muhadatsah.
- [x] Warna hex manual `#dc2626` di tombol "Hapus Gambar" (cms.js) diganti pakai token `var(--color-error)` yang sudah ada, konsisten dengan pemakaian warna danger di tempat lain.
- [x] Build (`npm run build`) sukses.
- [ ] Perlu ditest manual oleh user di browser (terutama: retry setelah simulasi offline, buka bab kosong, reorder topik Muhadatsah, dan toast saat progres gagal tersimpan).

### Fase 5.20 — Login murid pakai Nomor Siswa/Username (bukan email)

User bingung kenapa murid harus login pakai email — untuk anak sekolah, nomor siswa/username lebih masuk akal daripada wajib punya email. Diputuskan: berlaku untuk **murid saja**, guru tetap pakai email asli (supaya masih bisa reset password mandiri via Firebase & terlihat profesional).

- [x] `auth.js`: Firebase Auth cuma native support email/password, jadi ditambah `usernameToEmail()` — ubah username murid jadi email sintetis di domain palsu `@murid.lughati.local` (nggak pernah kekirim email beneran ke situ) sebelum dikirim ke `createUserWithEmailAndPassword`/`signInWithEmailAndPassword`. `register()`/`login()` sekarang terima `identifier` (bukan `email` mentah) + `role`, dan transform-nya kondisional: guru pakai identifier apa adanya sebagai email, murid di-transform. Keunikan username otomatis terjamin karena Firebase Auth sendiri yang menolak `email-already-in-use` di baliknya.
- [x] Dokumen `murid/{uid}` sekarang simpan field `username` (bukan `email`) — field email dihapus dari skema murid karena memang tidak pernah ada email asli.
- [x] `login.js`: form Login (sebelumnya cuma form Daftar yang punya pilihan role) sekarang juga punya toggle Murid/Guru, dan field identifier berubah label+tipe secara live saat role diganti ("Email" + `type=email` untuk guru, "Nomor Siswa / Username" + `type=text` untuk murid) — pakai event `change` pada radio, rerender langsung tanpa submit.
- [x] Pesan error disesuaikan per role (mis. "Nomor Siswa/Username sudah dipakai" vs "Email sudah terdaftar").
- [x] `dashboardGuru.js`: fallback nama murid yang belum diisi nama pakai `m.username` (bukan `m.email` yang sudah tidak ada lagi di skema).
- [x] Build (`npm run build`) sukses.
- [ ] Perlu ditest manual oleh user di browser (daftar akun murid baru pakai username, logout, login lagi pakai username yang sama — pastikan tidak ada sisa akun murid lama berbasis email yang jadi tidak bisa login lagi karena field `email` di dokumen `murid/{uid}` sudah tidak dibaca; akun lama tetap bisa login karena Firebase Auth-nya sendiri tidak berubah, cuma field Firestore-nya beda makna untuk akun baru).

### Fase 5.21 — Audit & perbaikan Dashboard Kelas (dashboardGuru.js)

User minta audit lanjutan khusus halaman Dashboard Kelas dari sisi UI/UX/state. Temuan & perbaikan:

- [x] **Race condition** di `loadMuridRows()`: kalau guru klik ganti kelas dua kali cepat-cepat, request pertama yang telat selesai bisa menimpa data kelas kedua yang sedang aktif dengan data kelas pertama yang sudah tidak relevan. Ditambah `muridLoadToken` — tiap panggilan dapat token unik, hasil fetch yang tokennya sudah tidak match token terbaru dibuang.
- [x] **`createKelas` gagal didiamkan tanpa feedback** — sebelumnya cuma `console.error`, guru tidak tahu kenapa kelas barunya tidak muncul. Sekarang pakai `showToast()` (dari perbaikan Fase 5.19) buat kasih tahu guru secara eksplisit.
- [x] **Tidak ada pencarian murid** — untuk kelas besar (disebutkan bakal dites 60+ user), scroll manual di tabel panjang tidak praktis. Ditambah input `#murid-search` yang filter baris tabel by nama secara live, plus counter "X murid · Y cocok dengan pencarian". Search input mempertahankan fokus & posisi kursor manual setelah tiap rerender (pola render app ini ganti innerHTML total tiap render, jadi elemen input-nya selalu baru dan biasanya kehilangan fokus di tengah ngetik kalau tidak ditangani).
- [x] Filter pencarian direset otomatis saat guru ganti kelas (supaya tidak nyisa filter nama dari kelas sebelumnya yang bisa bikin tabel kelas baru kelihatan kosong).
- [x] Tambah ikon `search` baru di `icons.js` (belum ada sebelumnya, dipakai di search box ini).
- [x] Baris tabel murid dikasih zebra-striping (selang-seling warna latar tipis) supaya lebih gampang dibaca pas barisnya banyak.
- [x] `#kelas-select` di-disable selama `loadingKelas` — sebelumnya bisa diklik ganti kelas di tengah proses load kelas lain.
- [x] Build (`npm run build`) sukses.
- [ ] Perlu ditest manual oleh user di browser — terutama: cari nama murid sambil ngetik cepat (pastikan fokus tidak lepas), ganti kelas cepat berkali-kali (pastikan data yang tampil selalu sesuai kelas yang terakhir dipilih), dan simulasi `createKelas` gagal (mis. matikan koneksi lalu coba buat kelas).

### Fase 5.22 — Dashboard Kelas: fitur Ubah Nama & Hapus Kelas

User sadar tidak ada cara edit/hapus kelas sama sekali (ada beberapa kelas duplikat nama dari testing sebelumnya, tidak bisa dibersihkan). Diputuskan fiturnya taruh langsung di Dashboard Kelas (bukan halaman Pengaturan terpisah) karena itu tempat guru sudah buka tiap kali kelola kelas.

- [x] `kelas.js`: tambah `renameKelas(kelasId, nama)` dan `deleteKelas(kelasId)`. Hapus kelas TIDAK ikut menghapus murid — murid yang tergabung cuma **dilepas** (`kelasId` di-set `null` lewat batch write), progres belajar (XP, streak, riwayat kuis) tetap aman dan bisa join lagi ke kelas lain pakai kode baru.
- [x] `firestore.rules`: sebelumnya guru cuma boleh **baca** dokumen `murid/{uid}`, tidak bisa tulis sama sekali — jadi `deleteKelas` bakal gagal karena rules nolak. Ditambah izin tulis terbatas: guru pemilik kelas (`isGuruOfKelas`) boleh update dokumen murid **hanya kalau field yang diubah cuma `kelasId`** (`request.resource.data.diff(resource.data).affectedKeys().hasOnly(['kelasId'])`) — guru tetap tidak bisa mengubah field lain punya murid. **Sudah di-deploy** ke project (`firebase deploy --only firestore:rules`).
- [x] `ui.js`: `promptDialog()` ditambah parameter `defaultValue` (sebelumnya cuma `placeholder`, jadi kalau dipakai buat "Ubah Nama" nama lama tidak prefill — user harus ngetik ulang dari nol). Input juga di-`select()` saat modal dibuka (bukan cuma `focus()`) supaya user bisa langsung timpa teksnya.
- [x] `dashboardGuru.js`: tombol "Ubah Nama" (pakai `promptDialog` dengan nama lama ter-prefill) dan "Hapus" (pakai `confirmDialog`, pesannya menyebutkan berapa murid yang akan dilepas kalau kelas tidak kosong) ditaruh di sebelah tombol "Salin" kode kelas. Setelah hapus, otomatis pindah ke kelas pertama yang tersisa (atau kosong kalau tidak ada kelas lain).
- [x] Build (`npm run build`) sukses, rules ter-deploy.
- [x] **Bug ditemukan user**: hapus kelas gagal terus dengan pesan "Gagal menghapus kelas". Root cause: rule `match /kelas/{kelasId} { allow write: if isGuru() && request.resource.data.guruId == ... }` — `request.resource` bernilai **null** untuk operasi `delete` (beda dari create/update), jadi `request.resource.data.guruId` selalu error dan otomatis ditolak. Diperbaiki dengan memisah `allow create, update` (pakai `request.resource.data`, data BARU) dari `allow delete` (pakai `resource.data`, data yang SUDAH ada sebelum dihapus). Rules sudah di-deploy ulang.
- [ ] Perlu ditest manual oleh user di browser — ubah nama kelas, hapus kelas yang ada muridnya (cek murid beneran cuma "kelasId": null bukan ikut kehapus datanya), dan hapus kelas terakhir (cek dashboard nampilin state "belum ada kelas" dengan benar).

### Fase 5.23 — Pilih suara TTS Arab secara manual (Profil → Pengaturan & Audio)

User tanya soal alur TTS (klarifikasi: yang dibaca itu teks Arab/`glyph`, bukan transliterasi Latin — sengaja begitu karena voice Arab tidak paham teks Latin) dan minta cara ganti-ganti voice buat cari yang paling jelas.

- [x] `speech.js`: tambah `getAvailableArabicVoices()` (list semua voice berlokal `ar*` yang browser/device punya saat itu), `getSelectedVoiceURI()`/`setSelectedVoiceURI()` (persist pilihan ke `localStorage`). `pickBestArabicVoice()` sekarang cek pilihan manual user dulu (kalau ada & masih tersedia), baru fallback ke algoritma auto-pick (`computeBestArabicVoice()`) yang sudah ada dari Fase 5.17.
- [x] `profil.js`: card "Pengaturan & Audio" (murid & guru, dua-duanya bisa akses) dapat dropdown baru "Suara Pelafalan Arab" — opsi "Otomatis (disarankan)" + semua voice Arab terdeteksi (nama + lang + tanda "cloud" kalau bukan suara lokal OS). Pilih voice baru langsung memutar contoh kalimat supaya user langsung dengar hasilnya tanpa perlu klik "Tes Audio" terpisah.
- [x] Build (`npm run build`) sukses.
- [ ] Perlu ditest manual oleh user di beberapa browser/device berbeda (availability voice Arab beda-beda tiap platform) — pastikan pilihan tersimpan setelah refresh/logout-login, dan fallback "Otomatis" tetap jalan kalau localStorage kosong/voice yang dipilih sudah tidak ada lagi.

### Fase 5.24 — Fitur baru: Rapor (riwayat kuis murid + catatan guru 3 level)

User minta fitur baru: halaman track record pengerjaan kuis (skor benar/salah tiap sesi) untuk murid, plus catatan dari guru yang bisa diatur di 3 level berbeda — broadcast ke semua murid di kelas, khusus 1 murid tertentu, atau nempel ke 1 pengerjaan kuis spesifik. Nama halaman dipilih user: **"Rapor"**.

**Data model (Firestore, 3 collection baru):**
- `catatanKelas/{noteId}` — {kelasId, guruId, text, createdAt}. Broadcast ke semua murid 1 kelas.
- `catatanMurid/{noteId}` — {muridUid, kelasId, guruId, text, createdAt}. Individual, bukan per-attempt.
- `catatanPengerjaan/{noteId}` — {muridUid, kelasId, attemptId, guruId, text, createdAt}, ID dokumen deterministik `${muridUid}_${attemptId}` (supaya edit = overwrite, bukan numpuk dokumen baru). Nempel ke 1 baris riwayat kuis spesifik.
- Sengaja dipisah 3 collection baru (bukan field tambahan di `progresMurid`) supaya guru bisa nulis catatan **tanpa butuh akses tulis ke dokumen progres murid sama sekali** — lebih aman & rules-nya lebih sederhana dibanding opsi nambah field ke array `quizScores` yang butuh guru punya akses tulis granular ke progres murid.
- [x] `progress.js`: `saveQuizScore()` sekarang kasih `id` (UUID) ke tiap entry `quizScores` — dibutuhkan supaya `catatanPengerjaan` bisa nempel ke attempt spesifik. Attempt lama (sebelum field ini ada) tetap tampil normal di Rapor, cuma tidak bisa dikasih catatan per-attempt. Tambah getter `getQuizScores()`.
- [x] `src/modules/catatan.js` (baru): CRUD lengkap untuk 3 collection di atas.
- [x] `firestore.rules`: tambah fungsi `isMemberOfKelas(kelasId)` (murid cek kelasId di dokumen `murid/{uid}` miliknya sendiri) untuk keperluan baca `catatanKelas`. Rules baru untuk 3 collection: murid read-only (data miliknya sendiri / kelasnya), guru pemilik kelas full read+write. **Sudah di-deploy**.

**Sisi murid:**
- [x] `src/modules/views/rapor.js` (baru) — halaman dengan 3 section terpisah (bukan 1 timeline campur, sesuai pilihan user): "Catatan untuk Kelas", "Catatan untuk Kamu", "Riwayat Pengerjaan Kuis" (tiap baris nampilin skor + catatan per-attempt kalau ada).
- [x] Ditambah sebagai menu baru di sidebar desktop murid (`/rapor`, ikon trofi). **Sengaja TIDAK ditambah ke bottom-nav mobile** (sudah 5 item, nambah lagi bikin sempit sesuai catatan desain sebelumnya) — mobile akses lewat kartu link baru "Rapor" di halaman Beranda (`home.js`).
- [x] Route `/rapor` di-guard: cuma role murid yang bisa akses (guru di-redirect ke pesan "khusus akun murid", pola yang sama dengan guard CMS/Dashboard).

**Sisi guru (di Dashboard Kelas, bukan halaman terpisah):**
- [x] Card baru "Catatan untuk Kelas Ini" di atas tabel murid — list catatan broadcast + tombol tambah/hapus.
- [x] Baris nama murid di tabel sekarang bisa diklik → buka modal detail murid: catatan individu (list + tambah/hapus) dan riwayat pengerjaan kuis (tiap baris ada tombol "+ Catatan"/"Edit Catatan" buat nempelin catatan ke attempt spesifik itu).
- [x] `ui.js`: `promptDialog()` ditambah opsi `multiline: true` (pakai `<textarea>` bukan `<input>`) — dipakai semua form catatan karena isinya biasanya lebih dari 1 baris.
- [x] Modal detail murid ditulis manual (bukan pakai state machine `manage`/`editing` cms.js) karena butuh nested dialog (klik "+ Catatan" di dalam modal detail membuka `promptDialog` lain, yang numpuk di `#modal-container` yang sama) — setelah dialog nested itu resolve (simpan atau batal), modal detail di-refresh ulang dari awal (`refresh()` helper) supaya datanya selalu fresh dan tidak nyangkut.
- [x] Build (`npm run build`) sukses.
- [x] **Audit langsung setelah implementasi**, ketemu & langsung diperbaiki 3 bug:
  - **[Kritis] `firestore.rules`**: fungsi `isMemberOfKelas()` manggil `get(murid/{uid}).data.kelasId` tanpa cek `exists()` dulu. Untuk akun **guru** (yang tidak punya dokumen di collection `murid`), `get()` itu throw NOT_FOUND — dan karena ini operand pertama di `allow read: if isMemberOfKelas(...) || isGuruOfKelas(...)`, exception-nya bikin SELURUH rule dianggap deny, bukan fallback ke `isGuruOfKelas`. Dampaknya: `getCatatanKelas()` gagal tiap dipanggil guru, dan karena dipanggil bareng `getMuridByKelas()` di `Promise.all` yang sama di `loadMuridRows()`, **seluruh tabel murid Dashboard Kelas ikut gagal dimuat**. Diperbaiki dengan tambah `exists()` sebagai guard `&&` di depan (pola resmi yang direkomendasikan Firestore untuk kasus ini). Rules sudah di-deploy ulang.
  - **`dashboardGuru.js`**: teks catatan guru di-render pakai `escapeAttr()` (cuma escape tanda kutip `"`, dibuat buat value atribut HTML) padahal dipakai untuk konten HTML biasa — kalau catatan mengandung karakter `<` atau `&` (mis. "Skor < 60 harus remedial"), tampilannya rusak karena browser salah parsing. Ditambah `escapeHtml()` yang benar dan dipakai di 3 tempat (catatan kelas, catatan individu murid, catatan per-attempt).
  - **`rapor.js`**: `mountRapor()` sebelumnya cuma fetch catatan SEKALI per sesi login (guard `if (uid === lastLoadedUid) return`) — murid yang buka Rapor, pindah halaman, lalu balik lagi tidak akan pernah lihat catatan baru dari guru sampai logout-login ulang. Diperbaiki jadi fetch ulang tiap halaman dibuka dengan pola stale-while-revalidate (data lama tetap tampil sambil di-refresh di background, bukan blank ke "Memuat..." tiap kali) — konsisten dengan pola yang sudah dipakai di `dashboardGuru.js`.
- [x] **Follow-up 1**: modal detail murid nempel bottom-sheet ala mobile bahkan di layar desktop lebar — kurang pas. Ditambah media query `@media (min-width:861px)` di `.modal-overlay`/`.modal-content`/`.modal-handle` supaya SEMUA modal (bukan cuma detail murid) jadi dialog biasa center di tengah layar dengan sudut membulat penuh di desktop, tetap bottom-sheet di mobile (breakpoint sama dengan konvensi sidebar/bottom-nav yang sudah ada).
- [x] **Follow-up 2**: `openMuridDetailModal` diganti dari `Promise.all` ke `Promise.allSettled` — sebelumnya kalau 1 dari 3 fetch (progres/catatan murid/catatan pengerjaan) gagal, seluruh modal gagal total dengan pesan generik "Gagal memuat detail murid. Coba lagi." tanpa detail. Sekarang bagian yang berhasil tetap tampil, dan pesan error (kalau semua gagal) sekarang nampilin alasan aslinya.
- [x] **Bug ditemukan user**: catatan yang baru ditambahkan guru langsung muncul di Rapor murid (baca dari sesi/tab lain), tapi TIDAK muncul lagi kalau guru buka ulang modal detail murid di tab yang sama. Root cause: Firestore Web SDK bisa nge-cache hasil query KOSONG ("negative cache") untuk collection yang baru pertama kali terisi, dan cache itu tidak selalu ter-invalidate otomatis walau ditulis dari client yang sama. Diperbaiki di `catatan.js` — semua fungsi baca (`getCatatanKelas`, `getCatatanMurid`, `getCatatanPengerjaan`) sekarang pakai `getDocsFromServer()` (bukan `getDocs()` biasa) supaya selalu ambil data langsung dari server, skip cache lokal yang berpotensi basi.
- [x] **Follow-up 3**: ditambah tombol **Edit** (selain Hapus yang sudah ada) untuk catatan kelas (broadcast) dan catatan individu murid — sebelumnya cuma bisa hapus-lalu-buat-baru kalau mau ubah teks. Catatan per-pengerjaan sudah punya edit dari awal (tombol "+ Catatan"/"Edit Catatan" yang sama, pre-fill teks lama). Ditambah `updateCatatanKelas()`/`updateCatatanMurid()` di `catatan.js` (pakai `setDoc` dengan `merge:true`, field `createdAt` asli tidak ikut ketimpa, cuma nambah `updatedAt`) — tidak perlu ubah `firestore.rules` karena izin `update` untuk guru pemilik kelas sudah ada dari awal implementasi fitur ini.
- [x] Build (`npm run build`) sukses.
- [x] **Follow-up 4 (bug beneran, ketemu lewat testing user — investigasi panjang)**: catatan individu yang guru tambahkan langsung muncul di Rapor murid, tapi TETAP tidak muncul lagi di modal guru sendiri — bahkan setelah cache browser dibersihkan total. Ditambah pesan error yang sebelumnya didiamkan (`Promise.allSettled` cuma nampilin "Belum ada catatan" kalau satu query gagal) supaya kelihatan pesan aslinya: **"Missing or insufficient permissions."**
  - Sempat dicurigai bug `isGuruOfKelas` sama seperti `isMemberOfKelas` (exception dari `get()` tanpa `exists()` guard) — sudah diperbaiki juga (rules jadi lebih aman secara umum), tapi ternyata BUKAN itu penyebab utamanya.
  - Root cause sebenarnya (diverifikasi langsung pakai script Admin SDK + custom token, sign-in sebagai akun guru yang bersangkutan, reproduksi query persis): ini **limitasi resmi Firestore** — query `list`/collection yang rule-nya bergantung pada `get()`/`exists()` ke dokumen lain (`isGuruOfKelas` butuh `get(kelas/{kelasId})`) WAJIB memfilter field yang SAMA dengan yang dicek di `get()` itu juga di `where()` query-nya, supaya Firestore bisa validasi rule tanpa perlu menjalankan query dulu. `getCatatanMurid()`/`getCatatanPengerjaan()` cuma filter `where('muridUid','==', uid)` — field `kelasId` (yang dicek `isGuruOfKelas`) tidak ikut difilter — jadi Firestore **selalu menolak SELURUH query itu untuk guru**, walau datanya sendiri valid dan `getDoc()` satu-satu (bukan query) terhadap dokumen yang sama terbukti berhasil. Murid tidak kena karena aksesnya lewat `isOwner()` yang tidak butuh `get()` sama sekali.
  - **Fix permanen**: `getCatatanMurid(muridUid, kelasId?)` dan `getCatatanPengerjaan(muridUid, kelasId?)` di `catatan.js` sekarang terima parameter `kelasId` opsional — kalau diisi (dipakai sisi guru di `dashboardGuru.js`), query ikut filter `where('kelasId','==', kelasId)` juga, sehingga cocok dengan yang dibutuhkan rules. Murid (di `rapor.js`) tidak perlu isi parameter ini karena jalur aksesnya (`isOwner`) tidak kena limitasi ini.
  - Sudah diverifikasi ulang lewat script isolasi (Admin SDK + custom token sebagai guru sungguhan): query TANPA filter kelasId → gagal persis "Missing or insufficient permissions"; query DENGAN filter kelasId → berhasil, dapat semua dokumennya. Fix ini terbukti langsung menyelesaikan masalah sebelum diterapkan ke kode.
- [x] Selain itu, sekarang kegagalan sebagian query di modal detail murid (bukan cuma waktu semuanya gagal) ditampilkan langsung sebagai pesan error di UI, bukan didiamkan jadi "Belum ada catatan" — supaya kasus serupa ke depannya kelihatan jelas errornya, bukan disangka data memang kosong.
- [x] `deleteKelas()` di `kelas.js` sekarang juga bersihin (`deleteAllCatatanForKelas`) semua catatan kelas/murid/pengerjaan yang nempel ke kelas yang dihapus — supaya tidak ada catatan "yatim" (kelasId nunjuk ke kelas yang sudah tidak ada) yang bikin catatan itu jadi tidak bisa diakses siapapun lagi ke depannya.
- [x] (Investigasi ini pakai service account key sementara + `firebase-admin` — sudah dihapus/uninstall lagi setelah selesai, sesuai pola aman yang dipakai di sesi-sesi sebelumnya.)
- [ ] Perlu ditest manual oleh user di browser — alur lengkap: guru tambah catatan kelas → cek muncul di Rapor semua murid kelas itu (dan langsung kelihatan lagi kalau guru buka ulang modal, bukan cuma di sisi murid); guru edit catatan yang sudah ada (kelas & individu) → cek teksnya beneran berubah; guru tambah catatan individu ke 1 murid → cek cuma murid itu yang lihat DAN guru sendiri bisa lihat lagi kalau buka ulang modal; murid kerjain kuis → guru buka detail murid → tambah catatan ke attempt yang baru itu → cek muncul di Rapor murid nempel ke baris yang benar; cek tampilan modal di desktop sekarang center (bukan nempel bawah lagi).

### Fase 6 — Polish visual *(paralel, kapan saja)*
- [ ] Finalisasi pemilihan font (pairing Latin + Arab) dan terapkan di `tokens.css`.
- [ ] Ganti/lengkapi pattern ilustrasi placeholder yang belum disentuh.
- [ ] Review ulang komponen yang belum kena reskin icon/pattern dari sesi sebelumnya.

## Referensi teknis di codebase

- `src/modules/progress.js` — logika progres yang akan dipindah dari localStorage ke Firestore.
- `src/data/kosakata.js`, `src/data/muhadatsah.js`, `src/data/hijaiyah.js`, `src/data/achievements.js` — struktur data statis yang jadi acuan skema Firestore.
- `src/modules/icons.js` — icon set SVG hasil reskin, dipakai konsisten di seluruh view.
- `src/main.js` — router hash-based, akan diperluas untuk routing berbasis role (guru vs murid) di tahap 3.
