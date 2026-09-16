# BAB III – DEVELOPMENT

Bab ini menjelaskan proses pengembangan rancangan menjadi produk multimedia yang dapat digunakan.

## 3.1 Proses Pengembangan Produk

### Tahapan Pengembangan

Produk "Lughati Arabic" dikembangkan secara iteratif (build–test–refine berulang), bukan waterfall satu arah:

1. **Perancangan struktur dasar** — kerangka aplikasi (routing, autentikasi, skema data) untuk tiga modul inti: Mufrodat (kosakata), Muhadatsah (percakapan), dan Kuis (evaluasi).
2. **Migrasi data statis ke basis data** — konten yang awalnya hardcoded di kode dipindah ke Cloud Firestore, supaya guru dapat mengelola materi tanpa mengubah kode program.
3. **Pengembangan fitur bertahap** — setiap fitur (CMS, dashboard guru, sistem lencana, kuis multi-jenis, sistem Rapor) dibangun, diuji langsung, lalu diperbaiki berdasarkan hasil pengujian sebelum berlanjut ke fitur berikutnya.
4. **Audit berkala** — pada beberapa titik pengembangan dilakukan audit menyeluruh dari sisi antarmuka (UI/UX) dan pengelolaan status aplikasi untuk menemukan kesalahan tersembunyi sebelum tahap uji coba pengguna.
5. **Persiapan uji coba lapangan** — penyempurnaan akses murid (login berbasis nomor siswa), penyesuaian struktur alamat halaman, dan persiapan penerbitan (deployment) ke layanan hosting publik (Vercel).

### Prosedur Produksi

Produksi produk mengikuti alur kerja berikut untuk setiap unit fitur/konten:
1. Penentuan kebutuhan fitur/konten berdasarkan tujuan pembelajaran.
2. Perancangan struktur data (skema) di basis data.
3. Implementasi antarmuka (tampilan) dan logika fungsional.
4. Pengujian mandiri di peramban (browser) pada berbagai ukuran layar (desktop & mobile).
5. Perbaikan berdasarkan temuan pengujian, sebelum fitur dianggap selesai dan dilanjutkan ke fitur berikutnya.

### Integrasi Komponen Multimedia

Komponen multimedia (teks Arab berharakat, audio pelafalan, ilustrasi gambar, animasi kartu, ikon) diintegrasikan langsung ke dalam alur belajar-mengajar melalui tiga modul utama (Mufrodat, Muhadatsah, Kuis), bukan ditempatkan sebagai elemen terpisah. Integrasi dilakukan melalui:
- **Lapisan data terpusat**: setiap unit konten (kata, dialog, soal) menyimpan referensi ke semua komponen multimedianya sekaligus (teks, audio, gambar) dalam satu struktur data, sehingga tampil sinkron saat dirender.
- **Komponen pemutar audio universal**: satu fungsi pemutar suara dipakai ulang di seluruh modul (Mufrodat, Muhadatsah, Kuis) dengan mekanisme fallback otomatis (dari audio pra-rekam ke sintesis suara peramban).
- **Sistem ikon terpusat**: ikon SVG dikelola dalam satu berkas referensi supaya konsisten secara visual di seluruh aplikasi.

## 3.2 Software dan Platform yang Digunakan

### Software Desain
- Tidak menggunakan software desain grafis terpisah (mis. Figma) — desain antarmuka dirancang langsung melalui kode (*design-in-code*) menggunakan sistem token desain (warna, tipografi, spasi) yang terpusat di dalam berkas CSS, sehingga konsisten di seluruh halaman.

### Software Authoring
- **Vite** — build tool/authoring environment utama untuk merakit aplikasi web dari berkas JavaScript, HTML, dan CSS menjadi aplikasi siap pakai.
- **JavaScript (ES Modules), HTML5, CSS3** — bahasa dan struktur inti pengembangan, tanpa framework tambahan (vanilla JS).

### Software Editing
- **Visual Studio Code** — editor kode sumber.
- **Web Speech API** (bawaan peramban) — untuk sintesis suara (Text-to-Speech) pelafalan Arab, digunakan sebagai pengganti proses rekam-edit audio manual.
- Layanan hosting gambar eksternal — untuk mengunggah dan mengelola gambar ilustrasi kosakata dari CMS.

### LMS/Platform Distribusi
- **Firebase Firestore** — basis data (backend) yang menyimpan seluruh materi, progres, dan data pengguna secara real-time.
- **Firebase Authentication** — sistem otentikasi akun guru dan murid.
- **Vercel** — platform hosting untuk penerbitan/distribusi aplikasi ke pengguna akhir.
- Aplikasi berjalan sebagai **Progressive Web App (PWA)**, sehingga dapat diakses layaknya aplikasi native melalui peramban tanpa memerlukan LMS pihak ketiga terpisah.

### Tools Pendukung Lainnya
- **Git** — pengelolaan versi kode sumber.
- **Firebase CLI** — pengelolaan aturan keamanan basis data (security rules) dan proses deployment backend.
- **Claude Code (Anthropic)** — asisten AI pair-programming yang digunakan sepanjang proses pengembangan untuk implementasi kode, audit kualitas, dan penelusuran kesalahan (debugging).

## 3.3 Pengembangan Materi

### Produksi Konten

Materi pembelajaran mencakup tiga kategori utama:
- **Mufrodat (Kosakata)**: dikelompokkan per bab/kategori (mis. Keluarga, Angka, Perlengkapan Sekolah, Hewan, Warna, Makanan-Minuman).
- **Muhadatsah (Percakapan)**: topik dialog sehari-hari (perkenalan, di sekolah, hobi, dst.) dengan tingkat kesulitan berjenjang (Dasar/Menengah).
- **Kuis**: tiga jenis evaluasi berbasis bab — Tebak Huruf, Listening Challenge (mendengar lalu memilih huruf yang sesuai), dan Tebak Kosakata.

Seluruh konten diproduksi dan dikelola melalui **CMS (Content Management System)** yang dibangun khusus di dalam aplikasi, sehingga guru dapat menambah, mengubah, menghapus, dan mengurutkan materi secara mandiri tanpa keterlibatan pengembang maupun perubahan kode program.

### Penyusunan Teks

Setiap unit kosakata/dialog/soal disusun dengan struktur teks yang konsisten:
- Teks Arab lengkap dengan harakat (tanda baca vokal) untuk ketepatan pelafalan.
- Transliterasi Latin untuk memudahkan pembacaan bagi pemula.
- Terjemahan/arti dalam Bahasa Indonesia.
- Contoh kalimat penggunaan (khusus modul Mufrodat), dipisahkan otomatis oleh sistem menjadi bagian kalimat Arab dan terjemahannya untuk ditampilkan secara terpisah.

### Penyusunan Materi Visual

- Ilustrasi ikon kategori/bab menggunakan sistem ikon SVG konsisten.
- Gambar ilustrasi kosakata (opsional, dapat diunggah guru melalui CMS) untuk memperkuat asosiasi visual kata dengan maknanya.
- Tata letak kartu (flashcard) dirancang dengan hierarki visual yang jelas: teks Arab sebagai elemen paling menonjol, diikuti transliterasi dan arti.

### Integrasi Materi dengan Tujuan Pembelajaran

- Materi Mufrodat disusun berjenjang per bab agar murid membangun kosakata secara bertahap sebelum masuk ke Muhadatsah.
- Materi Muhadatsah mengaplikasikan kosakata yang telah dipelajari ke dalam konteks percakapan nyata.
- Kuis disusun berbasis bab yang sudah dipelajari (bukan bank soal acak keseluruhan), sehingga evaluasi selaras langsung dengan capaian belajar pada bab tersebut.
- Sistem Rapor menghubungkan hasil evaluasi kembali ke proses belajar, memungkinkan guru memberi umpan balik yang kontekstual per bab/pengerjaan.

## 3.4 Pengembangan Elemen Multimedia

### Teks
Teks Arab berharakat, transliterasi Latin, dan terjemahan Indonesia ditampilkan dengan tipografi yang membedakan ukuran/berat huruf sesuai hierarki informasi (kata utama vs keterangan pendukung).

### Gambar
Ilustrasi kosakata yang dapat diunggah guru melalui CMS, ditampilkan berdampingan dengan kartu informasi kata pada tampilan flashcard.

### Audio
Audio pelafalan menggunakan **Web Speech API** dengan:
- Pemilihan suara Arab dengan kualitas terbaik yang tersedia di perangkat pengguna secara otomatis (prioritas suara "cloud" dibanding suara lokal sistem operasi).
- Kecepatan bicara adaptif menyesuaikan panjang teks (teks pendek dibaca lebih natural, kalimat panjang dibaca lebih pelan agar jelas).
- Opsi bagi pengguna memilih suara secara manual melalui halaman Pengaturan, sebagai alternatif dari pemilihan otomatis.
- Arsitektur yang dirancang mendukung audio pra-rekam berkualitas tinggi sebagai peningkatan di masa depan, dengan mekanisme *fallback* otomatis ke sintesis suara peramban apabila audio pra-rekam tidak tersedia.

### Video
Tidak digunakan pada versi produk saat ini — modul Muhadatsah disampaikan dalam format dialog teks bersuara (audio per baris), bukan video.

### Animasi
- Animasi transisi antar tampilan (*fade-in*, *pop-in*) untuk memberi kesan responsif pada aplikasi.
- Animasi balik kartu (*flip card*) tiga dimensi berbasis CSS pada flashcard kosakata — sisi depan menampilkan kata, sisi belakang menampilkan contoh kalimat.
- Animasi umpan balik jawaban kuis (benar/salah) dan efek visual saat lencana prestasi terbuka (gradasi warna, efek cahaya).

### Grafik/Ilustrasi
Sistem ikon SVG kustom (bukan emoji) digunakan secara konsisten di seluruh aplikasi untuk navigasi, kategori materi, dan indikator status/pencapaian.

*(Catatan: lampirkan tangkapan layar tiap elemen multimedia di atas sebagai bukti visual pada laporan akhir.)*

## 3.5 Pengembangan Interaktivitas

### Tombol Navigasi
Navigasi utama berupa sidebar (tampilan desktop) dan bilah navigasi bawah/*bottom navigation* (tampilan mobile), disesuaikan dengan peran pengguna (guru/murid) agar hanya menampilkan menu yang relevan.

### Menu Interaktif
- Menu tab tersegmentasi (*segmented control*) untuk berpindah antar jenis konten dalam CMS dan antar jenis kuis.
- Menu dropdown untuk memilih kelas dan filter modul pada Dashboard Kelas.

### Quiz
Kuis interaktif dengan tiga jenis soal (Tebak Huruf, Listening Challenge, Tebak Kosakata), dilengkapi:
- Progress bar per sesi pengerjaan.
- Umpan balik langsung benar/salah pada tiap jawaban.
- Halaman **Ulasan Jawaban** pasca-kuis yang menampilkan perbandingan jawaban dipilih vs jawaban benar, lengkap dengan penjelasan tambahan (makhraj huruf/contoh kalimat) khusus untuk soal yang dijawab salah.

### Simulasi
Modul Muhadatsah mensimulasikan alur percakapan nyata dalam bentuk gelembung obrolan (*chat bubble*) dua arah antar pembicara, lengkap dengan opsi memutar audio pelafalan tiap baris dialog.

### Drag and Drop
Digunakan pada sisi CMS (bukan sisi murid) sebagai alat bantu **guru** mengatur ulang urutan bab/kategori/kata/soal secara visual (*drag handle*), dengan alternatif tombol naik/turun untuk perangkat sentuh yang tidak mendukung *drag-and-drop* asli.

### Hyperlink
Tautan navigasi antar halaman (mis. dari daftar bab ke detail bab, dari kartu materi ke halaman kuis terkait) menggunakan struktur alamat (URL) bersih tanpa simbol pagar (#), sehingga dapat dibagikan atau di-bookmark langsung ke halaman tertentu.

### Interactive Feedback
- Notifikasi kecil (*toast*) untuk memberi tahu keberhasilan/kegagalan suatu aksi (mis. gagal menyimpan progres, gagal memuat data).
- Efek suara pendek (*sound effect*) untuk jawaban benar, jawaban salah, klik tombol, dan penyelesaian kuis.
- Indikator status memuat (*loading*) dan status kosong (*empty state*) yang informatif di setiap bagian aplikasi yang memuat data.

## 3.6 Prototype Produk

### Prototype Awal
Prototype dikembangkan langsung sebagai aplikasi web fungsional (bukan purwarupa statis/mockup), dengan pendekatan *build–test–iterate*: versi awal (MVP) mencakup modul Mufrodat, Muhadatsah, dan Kuis dasar dengan data statis, sebelum berkembang menjadi aplikasi berbasis basis data dengan sistem akun.

### Tampilan Produk
Tampilan mengikuti gaya visual modern dengan skema warna ungu-emas, tipografi yang membedakan teks Arab dan Latin secara jelas, serta tata letak responsif yang menyesuaikan antara mode desktop (sidebar) dan mode mobile (navigasi bawah).

*(Catatan: lampirkan tangkapan layar tampilan produk — halaman Beranda, Mufrodat, Muhadatsah, Kuis, Rapor, CMS, dan Dashboard Kelas — sebagai bukti visual.)*

### Fitur yang Dikembangkan
- Modul belajar Mufrodat (flashcard interaktif) dan Muhadatsah (dialog interaktif).
- Modul evaluasi Kuis tiga jenis dengan Ulasan Jawaban.
- Sistem akun dua peran (guru dan murid) dengan login murid berbasis nomor siswa/username.
- CMS pengelolaan konten oleh guru.
- Dashboard Kelas untuk pemantauan progres murid oleh guru.
- Sistem gamifikasi: XP, level, lencana prestasi, dan streak harian.
- Sistem Rapor: riwayat pengerjaan kuis dan catatan guru tiga tingkat (kelas, individu, per-pengerjaan).

### Hasil Uji Coba Awal
Pengujian mandiri (oleh pengembang) pada tahap prototype menemukan dan memperbaiki beberapa kendala fungsional, di antaranya: duplikasi perhitungan skor pada kuis, potensi eksploitasi poin pada bab dengan bank soal terlalu sedikit, serta beberapa kendala kegunaan (*usability*) pada tata letak flashcard dan navigasi CMS — rincian lebih lanjut pada bagian 3.8 (Revisi Awal).

## 3.7 Review dan Validasi

> **⚠️ Bagian ini perlu diisi berdasarkan data asli** dari proses validasi yang dilaksanakan (belum tersedia dari histori pengembangan teknis). Kerangka yang dapat digunakan:

### Validasi Ahli Materi
- Validator: (nama/kualifikasi ahli materi bahasa Arab)
- Aspek yang dinilai: kesesuaian dan kebenaran materi Mufrodat & Muhadatsah, ketepatan harakat, ketepatan terjemahan, kesesuaian dengan tujuan pembelajaran.
- Instrumen: (mis. lembar validasi ahli materi skala Likert)
- Hasil: (skor/persentase kelayakan, catatan kualitatif)

### Validasi Ahli Media
- Validator: (nama/kualifikasi ahli media pembelajaran)
- Aspek yang dinilai: kualitas tampilan visual, kejelasan audio, kemudahan navigasi, konsistensi desain, performa aplikasi.
- Instrumen: (mis. lembar validasi ahli media skala Likert)
- Hasil: (skor/persentase kelayakan, catatan kualitatif)

### Validasi Ahli Pembelajaran (jika diperlukan)
- Validator: (nama/kualifikasi ahli pembelajaran/pedagogi)
- Aspek yang dinilai: kesesuaian skenario pembelajaran, efektivitas gamifikasi terhadap motivasi belajar, kesesuaian dengan karakteristik peserta didik.
- Hasil: (skor/persentase kelayakan, catatan kualitatif)

### Hasil Review
(Rangkuman keseluruhan skor/persentase dari ketiga validasi di atas, disajikan dalam tabel rekapitulasi.)

### Masukan dan Rekomendasi
(Daftar masukan kualitatif dari masing-masing validator yang menjadi dasar revisi pada bagian 3.8.)

## 3.8 Revisi Awal

### Identifikasi Bagian yang Perlu Diperbaiki
Berdasarkan pengujian mandiri dan audit internal selama pengembangan (serta masukan validator ahli pada bagian 3.7 setelah tersedia), teridentifikasi beberapa bagian yang memerlukan perbaikan pada aspek konten, desain, interaktivitas, dan navigasi.

### Perbaikan Konten
- Penambahan penjelasan kontekstual (makhraj huruf, contoh kalimat) pada ulasan jawaban kuis yang sebelumnya belum memanfaatkan data yang sudah tersedia.
- Penyusunan ulang sistem bab/kategori kuis agar soal dikelompokkan per bab (bukan diambil acak dari seluruh bank soal), agar evaluasi lebih relevan dengan materi yang baru dipelajari.

### Perbaikan Desain
- Perombakan tata letak flashcard Mufrodat dari satu kolom dengan elemen dekoratif yang tidak informatif menjadi dua kartu (gambar ilustrasi + informasi kata) yang lebih ringkas dan fungsional.
- Penyesuaian tampilan modal/dialog agar tidak menyerupai *bottom-sheet* ala aplikasi mobile ketika diakses dari layar desktop.
- Penyempurnaan hierarki tipografi (ukuran dan jarak antar elemen teks) pada kartu kosakata dan kartu pencapaian (lencana).

### Perbaikan Interaktivitas
- Perbaikan duplikasi perhitungan skor/XP yang sempat tersimpan dua kali pada satu sesi kuis.
- Penambahan validasi agar kuis dengan jumlah bank soal terlalu sedikit tidak dapat dimulai (mencegah perolehan skor sempurna tanpa benar-benar menjawab soal).
- Perbaikan audio pelafalan pada flashcard yang sebelumnya ikut membacakan teks terjemahan Indonesia, seharusnya hanya membacakan teks Arab.
- Penambahan opsi pengeditan dan penghapusan pada seluruh jenis catatan guru (kelas, individu, per-pengerjaan) di sistem Rapor.

### Perbaikan Navigasi
- Perubahan metode login murid dari alamat surel (email) menjadi nomor siswa/username, mengakomodasi murid yang belum memiliki alamat surel pribadi.
- Migrasi struktur alamat halaman dari format berbasis tanda pagar (`#/halaman`) ke format bersih (`/halaman`) agar lebih mudah dibagikan dan sesuai standar aplikasi web modern.
- Perbaikan agar halaman Kelola Konten (CMS) dan Dashboard Kelas selalu kembali ke tampilan awal setiap kali diakses ulang, tidak tersangkut pada tampilan form terakhir yang sempat dibuka.

---

# BAB IV – IMPLEMENTATION

## 4.1 Tujuan Implementasi

> **⚠️ Perlu disesuaikan dengan konteks penelitian.** Contoh kerangka:

Implementasi produk bertujuan untuk mengetahui:
1. Kelayakan dan kebermanfaatan aplikasi "Lughati Arabic" sebagai media pembelajaran mufrodat dan muhadatsah bahasa Arab.
2. Respons dan tingkat keterlibatan (engagement) siswa terhadap pembelajaran berbasis multimedia interaktif dibanding metode konvensional.
3. Efektivitas fitur gamifikasi (XP, lencana, streak) dalam mendorong motivasi belajar mandiri siswa.

## 4.2 Karakteristik Pengguna

Pengguna aplikasi terbagi menjadi dua peran:
- **Guru**: mengelola konten pembelajaran (CMS), memantau progres kelas (Dashboard Kelas), dan memberikan catatan/umpan balik ke siswa (Rapor).
- **Murid/Siswa**: mengakses materi Mufrodat dan Muhadatsah, mengerjakan Kuis, memantau progres belajar pribadi (XP, streak, lencana), dan melihat Rapor beserta catatan dari guru.

> **⚠️ Lengkapi dengan profil spesifik**: jenjang pendidikan, usia rata-rata, latar belakang kemampuan bahasa Arab siswa yang menjadi subjek uji coba.

## 4.3 Jumlah Peserta

> **⚠️ Isi sesuai data lapangan** — disebutkan dalam percakapan pengembangan bahwa target uji coba melibatkan **60+ pengguna**. Cantumkan jumlah pasti, terbagi ke dalam:
> - Jumlah guru yang terlibat: ...
> - Jumlah murid yang terlibat: ...
> - Jumlah kelas (jika lebih dari satu): ...

## 4.4 Tempat / Platform

- **Platform akses**: aplikasi web (PWA) yang dapat diakses melalui browser di perangkat desktop maupun mobile, dideploy melalui Vercel.
- **Tempat pelaksanaan uji coba**: (isi nama sekolah/instansi/lokasi pelaksanaan)

## 4.5 Waktu dan Durasi

> **⚠️ Isi sesuai jadwal pelaksanaan uji coba**, misalnya:
> - Tanggal pelaksanaan: ...
> - Durasi per sesi: ...
> - Total durasi uji coba (mis. 1 minggu, 2 minggu): ...

## 4.6 Prosedur Implementasi

Kerangka prosedur yang dapat diadaptasi:
1. **Persiapan**: guru membuat akun, membuat kelas, membagikan kode kelas ke murid.
2. **Onboarding murid**: murid mendaftar akun (menggunakan username/nomor siswa) dan bergabung ke kelas menggunakan kode yang dibagikan.
3. **Sesi pembelajaran**: murid mengakses modul Mufrodat dan Muhadatsah secara mandiri atau terbimbing.
4. **Evaluasi**: murid mengerjakan Kuis pada tiap bab yang telah dipelajari.
5. **Pemantauan**: guru memantau progres melalui Dashboard Kelas dan memberikan catatan melalui fitur Rapor.
6. **Evaluasi akhir**: pengumpulan data penggunaan dan umpan balik dari pengguna (kuesioner/wawancara).

## 4.7 Skenario Pembelajaran

> **⚠️ Sesuaikan dengan rancangan pembelajaran riil.** Contoh kerangka skenario per sesi:

| Tahap | Aktivitas | Media/Fitur yang Digunakan |
|---|---|---|
| Pembukaan | Guru menjelaskan tujuan pembelajaran bab | - |
| Eksplorasi | Murid mempelajari kosakata baru melalui flashcard interaktif | Modul Mufrodat |
| Latihan Percakapan | Murid menyimak dan berlatih dialog | Modul Muhadatsah |
| Evaluasi | Murid mengerjakan kuis sesuai bab yang dipelajari | Modul Kuis |
| Refleksi | Murid & guru meninjau hasil kuis dan catatan | Fitur Rapor |

## 4.8 Dokumentasi

> **⚠️ Lampirkan bukti fisik pelaksanaan**, misalnya:
> - Tangkapan layar aktivitas siswa menggunakan aplikasi.
> - Foto kegiatan uji coba (jika dilaksanakan tatap muka).
> - Statistik penggunaan (jumlah sesi, jumlah kuis dikerjakan) dari Dashboard Kelas.

## 4.9 Hasil Penggunaan Produk

> **⚠️ Bagian ini diisi setelah uji coba benar-benar dilaksanakan.** Kerangka yang dapat digunakan:

- **Data kuantitatif**: jumlah murid yang menyelesaikan modul, rata-rata skor kuis, rata-rata XP/level yang dicapai, tingkat penyelesaian (completion rate).
- **Data kualitatif**: hasil kuesioner kepuasan pengguna (murid & guru), kendala teknis yang ditemukan selama pemakaian, saran perbaikan dari pengguna.
- **Analisis**: keterkaitan antara penggunaan fitur gamifikasi dengan motivasi/konsistensi belajar (mis. korelasi streak harian dengan progres belajar).

---

> **Catatan umum**: Dokumen ini adalah kerangka awal berdasarkan fitur-fitur yang telah dikembangkan dalam proyek "Lughati Arabic". Bagian yang ditandai ⚠️ membutuhkan data asli dari pelaksanaan (hasil validasi ahli, data peserta, hasil uji coba) yang belum tersedia dari histori pengembangan teknis — silakan lengkapi berdasarkan pelaksanaan riil di lapangan.
