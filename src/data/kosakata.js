export const kategori = [
  { id: 'semua', label: 'Semua', icon: 'star' },
  {
    id: 'sapaan', label: 'Salam & Ungkapan', icon: 'message', bab: 1,
    arabicTitle: 'التَّحِيَّاتُ وَالتَّعَارُفُ', subtitle: "at-Tahiyyat wa at-Ta'aruf",
    desc: 'Pelajari kosakata dan percakapan dasar untuk sapaan dan perkenalan diri.',
    theme: 'indigo'
  },
  {
    id: 'keluarga', label: 'Keluarga', icon: 'users', bab: 2,
    arabicTitle: 'الأُسْرَةُ وَالْبَيْتُ', subtitle: 'al-Usrah wa al-Bait',
    desc: 'Mengenal kosakata anggota keluarga dan lingkungan rumah.',
    theme: 'peach'
  },
  {
    id: 'angka', label: 'Angka', icon: 'hash', bab: 3,
    arabicTitle: 'الأَرْقَامُ', subtitle: 'al-Arqaam',
    desc: 'Menghitung dan mengenal angka dasar dalam bahasa Arab.',
    theme: 'mint'
  },
  {
    id: 'benda', label: 'Benda & Kelas', icon: 'backpack', bab: 4,
    arabicTitle: 'أَدَوَاتُ الْمَدْرَسَةِ', subtitle: 'Adawaat al-Madrasah',
    desc: 'Mengenal nama-nama benda dan perlengkapan sekolah.',
    theme: 'indigo'
  },
  {
    id: 'hewan', label: 'Hewan', icon: 'paw', bab: 5,
    arabicTitle: 'الْحَيَوَانَاتُ', subtitle: 'al-Hayawaanaat',
    desc: 'Mengenal nama-nama hewan dalam bahasa Arab.',
    theme: 'peach'
  },
  {
    id: 'warna', label: 'Warna', icon: 'palette', bab: 6,
    arabicTitle: 'الأَلْوَانُ', subtitle: 'al-Alwaan',
    desc: 'Mengenal warna-warna dasar dalam bahasa Arab.',
    theme: 'mint'
  },
  {
    id: 'makanan', label: 'Makanan & Minuman', icon: 'utensils', bab: 7,
    arabicTitle: 'الطَّعَامُ وَالشَّرَابُ', subtitle: "ath-Tha'aam wasy-Syaraab",
    desc: 'Mengenal kosakata makanan dan minuman sehari-hari.',
    theme: 'indigo'
  }
];

export const kosakata = [
  // KELUARGA
  { id: 1, kategori: 'keluarga', glyph: 'أَبٌ', latin: 'Abun', arti: 'Ayah', contoh: 'أَبِي فِي الْبَيْتِ (Ayahku di rumah)' },
  { id: 2, kategori: 'keluarga', glyph: 'أُمٌّ', latin: 'Ummun', arti: 'Ibu', contoh: 'أُمِّي فِي الْمَطْبَخِ (Ibuku di dapur)' },
  { id: 3, kategori: 'keluarga', glyph: 'أَخٌ', latin: 'Akhun', arti: 'Saudara Laki-laki', contoh: 'هَذَا أَخِي (Ini saudaraku)' },
  { id: 4, kategori: 'keluarga', glyph: 'أُخْتٌ', latin: 'Ukhtun', arti: 'Saudara Perempuan', contoh: 'هَذِهِ أُخْتِي (Ini saudariku)' },
  { id: 5, kategori: 'keluarga', glyph: 'جَدٌّ', latin: 'Jaddun', arti: 'Kakek', contoh: 'جَدِّي طَيِّبٌ (Kakekku baik)' },
  { id: 6, kategori: 'keluarga', glyph: 'جَدَّةٌ', latin: 'Jaddatun', arti: 'Nenek', contoh: 'جَدَّتِي فِي الْغُرْفَةِ (Nenekku di kamar)' },
  { id: 7, kategori: 'keluarga', glyph: 'عَمٌّ', latin: "'Ammun", arti: 'Paman (dari Ayah)', contoh: 'عَمِّي مُدَرِّسٌ (Pamanku seorang guru)' },
  { id: 8, kategori: 'keluarga', glyph: 'عَمَّةٌ', latin: "'Ammatun", arti: 'Bibi (dari Ayah)', contoh: 'عَمَّتِي طَبِيبَةٌ (Bibiku seorang dokter)' },

  // ANGKA
  { id: 9,  kategori: 'angka', glyph: 'وَاحِدٌ', latin: 'Waahidun', arti: 'Satu (1)', contoh: 'كِتَابٌ وَاحِدٌ (Satu buku)' },
  { id: 10, kategori: 'angka', glyph: 'اِثْنَانِ', latin: 'Itsnaani', arti: 'Dua (2)', contoh: 'قَلَمَانِ اثْنَانِ (Dua pena)' },
  { id: 11, kategori: 'angka', glyph: 'ثَلَاثَةٌ', latin: 'Tsalaatsatun', arti: 'Tiga (3)', contoh: 'ثَلَاثَةُ كُتُبٍ (Tiga buku)' },
  { id: 12, kategori: 'angka', glyph: 'أَرْبَعَةٌ', latin: 'Arba\'atun', arti: 'Empat (4)', contoh: 'أَرْبَعَةُ أَيَّامٍ (Empat hari)' },
  { id: 13, kategori: 'angka', glyph: 'خَمْسَةٌ', latin: 'Khamsatun', arti: 'Lima (5)', contoh: 'خَمْسُ صَلَوَاتٍ (Lima waktu sholat)' },
  { id: 14, kategori: 'angka', glyph: 'سِتَّةٌ', latin: 'Sittatun', arti: 'Enam (6)', contoh: 'سِتَّةُ رِجَالٍ (Enam orang laki-laki)' },
  { id: 15, kategori: 'angka', glyph: 'سَبْعَةٌ', latin: 'Sab\'atun', arti: 'Tujuh (7)', contoh: 'سَبْعُ سَمَاوَاتٍ (Tujuh lapis langit)' },
  { id: 16, kategori: 'angka', glyph: 'ثَمَانِيَةٌ', latin: 'Tsamaaniyatun', arti: 'Delapan (8)', contoh: 'ثَمَانِيَةُ كَرَاسِيَّ (Delapan kursi)' },
  { id: 17, kategori: 'angka', glyph: 'تِسْعَةٌ', latin: 'Tis\'atun', arti: 'Sembilan (9)', contoh: 'تِسْعَةُ طُلَّابٍ (Sembilan siswa)' },
  { id: 18, kategori: 'angka', glyph: 'عَشَرَةٌ', latin: "'Asyaratun", arti: 'Sepuluh (10)', contoh: 'عَشَرَةُ دَرَاهِمَ (Sepuluh dirham)' },

  // BENDA & KELAS
  { id: 19, kategori: 'benda', glyph: 'كِتَابٌ', latin: 'Kitaabun', arti: 'Buku', contoh: 'الْكِتَابُ عَلَى الْمَكْتَبِ (Buku di atas meja)' },
  { id: 20, kategori: 'benda', glyph: 'قَلَمٌ', latin: 'Qalamun', arti: 'Pena', contoh: 'هَذَا قَلَمٌ جَدِيدٌ (Ini pena baru)' },
  { id: 21, kategori: 'benda', glyph: 'مَكْتَبٌ', latin: 'Maktabun', arti: 'Meja Tulis', contoh: 'الْمَكْتَبُ نَظِيفٌ (Meja itu bersih)' },
  { id: 22, kategori: 'benda', glyph: 'كُرْسِيٌّ', latin: 'Kursiyyun', arti: 'Kursi', contoh: 'أَجْلِسُ عَلَى الْكُرْسِيِّ (Aku duduk di kursi)' },
  { id: 23, kategori: 'benda', glyph: 'حَقِيبَةٌ', latin: 'Haqiibatun', arti: 'Tas Sekolah', contoh: 'حَقِيبَتِي جَمِيلَةٌ (Tasku indah)' },
  { id: 24, kategori: 'benda', glyph: 'سَبُّورَةٌ', latin: 'Sabbuuratun', arti: 'Papan Tulis', contoh: 'الْمُعَلِّمُ أَمَامَ السَّبُّورَةِ (Guru di depan papan tulis)' },
  { id: 25, kategori: 'benda', glyph: 'مِسْطَرَةٌ', latin: 'Mistharatun', arti: 'Penggaris', contoh: 'هَذِهِ مِسْطَرَةٌ طَوِيلَةٌ (Ini penggaris panjang)' },
  { id: 26, kategori: 'benda', glyph: 'مِمْسَحَةٌ', latin: 'Mimsahatun', arti: 'Penghapus', contoh: 'أَيْنَ الْمِمْسَحَةُ؟ (Di mana penghapus?)' },

  // HEWAN
  { id: 27, kategori: 'hewan', glyph: 'قِطٌّ', latin: 'Qiththun', arti: 'Kucing', contoh: 'الْقِطُّ لَطِيفٌ (Kucing itu lucu)' },
  { id: 28, kategori: 'hewan', glyph: 'أَسَدٌ', latin: 'Asadun', arti: 'Singa', contoh: 'الأَسَدُ مَلِكُ الْغَابَةِ (Singa raja hutan)' },
  { id: 29, kategori: 'hewan', glyph: 'جَمَلٌ', latin: 'Jamalun', arti: 'Unta', contoh: 'الْجَمَلُ فِي الصَّحْرَاءِ (Unta di padang pasir)' },
  { id: 30, kategori: 'hewan', glyph: 'طَائِرٌ', latin: 'Thoo-irun', arti: 'Burung', contoh: 'الطَّائِرُ يَطِيرُ فِي السَّمَاءِ (Burung terbang di langit)' },
  { id: 31, kategori: 'hewan', glyph: 'سَمَكٌ', latin: 'Samakun', arti: 'Ikan', contoh: 'السَّمَكُ فِي الْمَاءِ (Ikan di dalam air)' },
  { id: 32, kategori: 'hewan', glyph: 'خَيْلٌ', latin: 'Khailun', arti: 'Kuda', contoh: 'الْخَيْلُ سَرِيعٌ (Kuda itu cepat)' },

  // WARNA
  { id: 33, kategori: 'warna', glyph: 'أَحْمَرُ', latin: 'Ahmaru', arti: 'Merah', contoh: 'التُّفَّاحُ أَحْمَرُ (Apel itu merah)' },
  { id: 34, kategori: 'warna', glyph: 'أَخْضَرُ', latin: 'Akhdharu', arti: 'Hijau', contoh: 'الشَّجَرُ أَخْضَرُ (Pohon itu hijau)' },
  { id: 35, kategori: 'warna', glyph: 'أَزْرَقُ', latin: 'Azraqu', arti: 'Biru', contoh: 'السَّمَاءُ زَرْقَاءُ (Langit itu biru)' },
  { id: 36, kategori: 'warna', glyph: 'أَصْفَرُ', latin: 'Ashfaru', arti: 'Kuning', contoh: 'الْمَوْزُ أَصْفَرُ (Pisang itu kuning)' },
  { id: 37, kategori: 'warna', glyph: 'أَبْيَضُ', latin: 'Abyadhu', arti: 'Putih', contoh: 'اللَّبَنُ أَبْيَضُ (Susu itu putih)' },
  { id: 38, kategori: 'warna', glyph: 'أَسْوَدُ', latin: 'Aswadu', arti: 'Hitam', contoh: 'الشَّعْرُ أَسْوَدُ (Rambut itu hitam)' },

  // MAKANAN & MINUMAN
  { id: 39, kategori: 'makanan', glyph: 'مَاءٌ', latin: 'Maa-un', arti: 'Air', contoh: 'أَشْرَبُ الْمَاءَ (Aku minum air)' },
  { id: 40, kategori: 'makanan', glyph: 'خُبْزٌ', latin: 'Khubzun', arti: 'Roti', contoh: 'آكُلُ الْخُبْزَ (Aku makan roti)' },
  { id: 41, kategori: 'makanan', glyph: 'لَبَنٌ', latin: 'Labanun', arti: 'Susu', contoh: 'الْحَلِيبُ لَذِيذٌ (Susu itu lezat)' },
  { id: 42, kategori: 'makanan', glyph: 'شَايٌ', latin: 'Syaayun', arti: 'Teh', contoh: 'شَايٌ حَارٌّ (Teh hangat)' },
  { id: 43, kategori: 'makanan', glyph: 'أَرُزٌّ', latin: 'Aruzzun', arti: 'Nasi / Beras', contoh: 'أَرُزٌّ لَذِيذٌ (Nasi yang enak)' },
  { id: 44, kategori: 'makanan', glyph: 'فَاكِهَةٌ', latin: 'Faakihatun', arti: 'Buah-buahan', contoh: 'أُحِبُّ الْفَاكِهَةَ (Aku suka buah)' },

  // SALAM & UNGKAPAN
  { id: 45, kategori: 'sapaan', glyph: 'مَرْحَبًا', latin: 'Marhaban', arti: 'Halo / Selamat Datang', contoh: 'مَرْحَبًا بِكُمْ (Selamat datang semuanya)' },
  { id: 46, kategori: 'sapaan', glyph: 'صَبَاحَ الْخَيْرِ', latin: 'Shabaahal Khair', arti: 'Selamat Pagi', contoh: 'صَبَاحُ النُّورِ (Jawaban: Selamat Pagi)' },
  { id: 47, kategori: 'sapaan', glyph: 'مَسَاءَ الْخَيْرِ', latin: 'Masaa-al Khair', arti: 'Selamat Sore / Malam', contoh: 'مَسَاءُ النُّورِ (Jawaban: Selamat Sore)' },
  { id: 48, kategori: 'sapaan', glyph: 'شُكْرًا', latin: 'Syukran', arti: 'Terima Kasih', contoh: 'شُكْرًا جَزِيلًا (Terima kasih banyak)' },
  { id: 49, kategori: 'sapaan', glyph: 'عَفْوًا', latin: "'Afwan", arti: 'Sama-sama / Maaf', contoh: 'عَفْوًا يَا أَخِي (Sama-sama saudaraku)' },
  { id: 50, kategori: 'sapaan', glyph: 'إِلَى اللِّقَاءِ', latin: 'Ilan Liqaa\'', arti: 'Sampai Jumpa', contoh: 'مَعَ السَّلَامَةِ (Semoga selamat)' }
];
