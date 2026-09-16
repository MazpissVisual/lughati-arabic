// Data 28 Huruf Hijaiyah lengkap dengan Harakat, Makhraj, dan Contoh Kata
export const hijaiyah = [
  {
    id: 0,
    glyph: 'ا',
    latin: 'Alif',
    sound: 'a',
    makhraj: 'Al-Jauf (Rongga mulut & tenggorokan)',
    desc: 'Huruf mad yang keluar dari rongga mulut dan tenggorokan dengan suara terbuka.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'أَ', sound: 'A', audio: 'أَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'إِ', sound: 'I', audio: 'إِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'أُ', sound: 'U', audio: 'أُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'أً', sound: 'An', audio: 'أً' }
    ],
    examples: [
      { glyph: 'أَرْنَبٌ', latin: 'Arnabun', meaning: 'Kelinci', sound: 'أَرْنَب' },
      { glyph: 'أُسْرَةٌ', latin: 'Usratun', meaning: 'Keluarga', sound: 'أُسْرَة' }
    ]
  },
  {
    id: 1,
    glyph: 'ب',
    latin: 'Ba',
    sound: 'b',
    makhraj: 'Asy-Syafatain (Dua bibir dirapatkan)',
    desc: 'Keluar dari pertemuan kedua bibir bagian dalam dengan tekanan yang jelas.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'بَ', sound: 'Ba', audio: 'بَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'بِ', sound: 'Bi', audio: 'بِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'بُ', sound: 'Bu', audio: 'بُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'بًا', sound: 'Ban', audio: 'بًا' }
    ],
    examples: [
      { glyph: 'بَيْتٌ', latin: 'Baitun', meaning: 'Rumah', sound: 'بَيْت' },
      { glyph: 'بَابٌ', latin: 'Baabun', meaning: 'Pintu', sound: 'بَاب' }
    ]
  },
  {
    id: 2,
    glyph: 'ت',
    latin: 'Ta',
    sound: 't',
    makhraj: 'Ujung lidah bertemu pangkal gigi seri atas',
    desc: 'Keluar dari ujung lidah menyentuh pangkal dua gigi seri atas disertai hembusan nafas halus (Hams).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'تَ', sound: 'Ta', audio: 'تَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'تِ', sound: 'Ti', audio: 'تِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'تُ', sound: 'Tu', audio: 'تُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'تًا', sound: 'Tan', audio: 'تًا' }
    ],
    examples: [
      { glyph: 'تُفَّاحٌ', latin: 'Tuffaahun', meaning: 'Apel', sound: 'تُفَّاح' },
      { glyph: 'تِمْسَاحٌ', latin: 'Timsaahun', meaning: 'Buaya', sound: 'تِمْسَاح' }
    ]
  },
  {
    id: 3,
    glyph: 'ث',
    latin: 'Tsa',
    sound: 'ts',
    makhraj: 'Ujung lidah keluar sedikit di antara gigi seri',
    desc: 'Ujung lidah ditempelkan di antara ujung gigi seri atas dan bawah.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'ثَ', sound: 'Tsa', audio: 'ثَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'ثِ', sound: 'Tsi', audio: 'ثِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'ثُ', sound: 'Tsu', audio: 'ثُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'ثًا', sound: 'Tsan', audio: 'ثًا' }
    ],
    examples: [
      { glyph: 'ثَوْبٌ', latin: 'Tsaubun', meaning: 'Baju', sound: 'ثَوْب' },
      { glyph: 'ثِمَارٌ', latin: 'Tsimaarun', meaning: 'Buah-buahan', sound: 'ثِمَار' }
    ]
  },
  {
    id: 4,
    glyph: 'ج',
    latin: 'Jim',
    sound: 'j',
    makhraj: 'Tengah lidah bertemu langit-langit atas',
    desc: 'Tengah permukaan lidah menempel kuat pada langit-langit rongga mulut.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'جَ', sound: 'Ja', audio: 'جَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'جِ', sound: 'Ji', audio: 'جِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'جُ', sound: 'Ju', audio: 'جُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'جًا', sound: 'Jan', audio: 'جًا' }
    ],
    examples: [
      { glyph: 'جَمَلٌ', latin: 'Jamalun', meaning: 'Unta', sound: 'جَمَل' },
      { glyph: 'جَبَلٌ', latin: 'Jabalun', meaning: 'Gunung', sound: 'جَبَل' }
    ]
  },
  {
    id: 5,
    glyph: 'ح',
    latin: 'Ha',
    sound: 'h',
    makhraj: 'Wasathul Halq (Tengah tenggorokan)',
    desc: 'Keluar dari pertengahan tenggorokan dengan suara bersih dan nafas terhembus lembut.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'حَ', sound: 'Ha', audio: 'حَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'حِ', sound: 'Hi', audio: 'حِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'حُ', sound: 'Hu', audio: 'حُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'حًا', sound: 'Han', audio: 'حًا' }
    ],
    examples: [
      { glyph: 'حَقِيبَةٌ', latin: 'Haqiibatun', meaning: 'Tas', sound: 'حَقِيبَة' },
      { glyph: 'حَدِيقَةٌ', latin: 'Hadiiqatun', meaning: 'Taman', sound: 'حَدِيقَة' }
    ]
  },
  {
    id: 6,
    glyph: 'خ',
    latin: 'Kha',
    sound: 'kh',
    makhraj: 'Adnal Halq (Ujung tenggorokan atas)',
    desc: 'Keluar dari tenggorokan bagian atas mendekati pangkal lidah dengan sedikit desisan.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'خَ', sound: 'Kha', audio: 'خَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'خِ', sound: 'Khi', audio: 'خِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'خُ', sound: 'Khu', audio: 'خُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'خًا', sound: 'Khan', audio: 'خًا' }
    ],
    examples: [
      { glyph: 'خُبْزٌ', latin: 'Khubzun', meaning: 'Roti', sound: 'خُبْز' },
      { glyph: 'خَاتَمٌ', latin: 'Khaatamun', meaning: 'Cincin', sound: 'خَاتَم' }
    ]
  },
  {
    id: 7,
    glyph: 'د',
    latin: 'Dal',
    sound: 'd',
    makhraj: 'Ujung lidah menyentuh pangkal gigi seri atas',
    desc: 'Suara tertahan kuat dan jelas saat dilafalkan.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'دَ', sound: 'Da', audio: 'دَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'دِ', sound: 'Di', audio: 'دِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'دُ', sound: 'Du', audio: 'دُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'دًا', sound: 'Dan', audio: 'دًا' }
    ],
    examples: [
      { glyph: 'دَفْتَرٌ', latin: 'Daftarun', meaning: 'Buku Tulis', sound: 'دَفْتَر' },
      { glyph: 'دَرَّاجَةٌ', latin: 'Darraajatun', meaning: 'Sepeda', sound: 'دَرَّاجَة' }
    ]
  },
  {
    id: 8,
    glyph: 'ذ',
    latin: 'Dzal',
    sound: 'dz',
    makhraj: 'Ujung lidah menempel di ujung gigi seri atas',
    desc: 'Lidah sedikit dijulurkan keluar menyentuh gigi seri atas.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'ذَ', sound: 'Dza', audio: 'ذَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'ذِ', sound: 'Dzi', audio: 'ذِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'ذُ', sound: 'Dzu', audio: 'ذُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'ذًا', sound: 'Dzan', audio: 'ذًا' }
    ],
    examples: [
      { glyph: 'ذَهَبٌ', latin: 'Dzahabun', meaning: 'Emas', sound: 'ذَهَب' },
      { glyph: 'ذُبَابٌ', latin: 'Dzubaabun', meaning: 'Lalat', sound: 'ذُبَاب' }
    ]
  },
  {
    id: 9,
    glyph: 'ر',
    latin: 'Ra',
    sound: 'r',
    makhraj: 'Ujung lidah dekat langit-langit atas',
    desc: 'Ujung lidah digetarkan secara ringan (Takrir).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'رَ', sound: 'Ra', audio: 'رَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'رِ', sound: 'Ri', audio: 'رِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'رُ', sound: 'Ru', audio: 'رُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'رًا', sound: 'Ran', audio: 'رًا' }
    ],
    examples: [
      { glyph: 'رَجُلٌ', latin: 'Rajulun', meaning: 'Laki-laki', sound: 'رَجُل' },
      { glyph: 'رُمَّانٌ', latin: 'Rummaanun', meaning: 'Delima', sound: 'رُمَّان' }
    ]
  },
  {
    id: 10,
    glyph: 'ز',
    latin: 'Zai',
    sound: 'z',
    makhraj: 'Ujung lidah di atas gigi seri bawah',
    desc: 'Memiliki suara desis tajam seperti lebah (Shafir).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'زَ', sound: 'Za', audio: 'زَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'زِ', sound: 'Zi', audio: 'زِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'زُ', sound: 'Zu', audio: 'زُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'زًا', sound: 'Zan', audio: 'زًا' }
    ],
    examples: [
      { glyph: 'زَهْرَةٌ', latin: 'Zahratun', meaning: 'Bunga', sound: 'زَهْرَة' },
      { glyph: 'زَيْتُونٌ', latin: 'Zaituunun', meaning: 'Zaitun', sound: 'زَيْتُون' }
    ]
  },
  {
    id: 11,
    glyph: 'س',
    latin: 'Sin',
    sound: 's',
    makhraj: 'Ujung lidah di atas gigi seri bawah',
    desc: 'Desisan halus terhembus tanpa getaran tebal.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'سَ', sound: 'Sa', audio: 'سَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'سِ', sound: 'Si', audio: 'سِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'سُ', sound: 'Su', audio: 'سُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'سًا', sound: 'San', audio: 'سًا' }
    ],
    examples: [
      { glyph: 'سَيَّارَةٌ', latin: 'Sayyaaroh', meaning: 'Mobil', sound: 'سَيَّارَة' },
      { glyph: 'سَمَكٌ', latin: 'Samakun', meaning: 'Ikan', sound: 'سَمَك' }
    ]
  },
  {
    id: 12,
    glyph: 'ش',
    latin: 'Syin',
    sound: 'sy',
    makhraj: 'Tengah lidah terangkat ke langit-langit',
    desc: 'Angin menyebar luas di dalam rongga mulut (Tafasy-syi).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'شَ', sound: 'Sya', audio: 'شَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'شِ', sound: 'Syi', audio: 'شِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'شُ', sound: 'Syu', audio: 'شُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'شًا', sound: 'Syan', audio: 'شًا' }
    ],
    examples: [
      { glyph: 'شَمْسٌ', latin: 'Syamsun', meaning: 'Matahari', sound: 'شَمْس' },
      { glyph: 'شَجَرَةٌ', latin: 'Syajarotun', meaning: 'Pohon', sound: 'شَجَرَة' }
    ]
  },
  {
    id: 13,
    glyph: 'ص',
    latin: 'Shad',
    sound: 'sh',
    makhraj: 'Ujung lidah di antara gigi seri dengan lidah terangkat tebal',
    desc: 'Sifat tebal (Istila & Ithbaq) dengan desis kuat.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'صَ', sound: 'Sho', audio: 'صَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'صِ', sound: 'Shi', audio: 'صِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'صُ', sound: 'Shu', audio: 'صُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'صًا', sound: 'Shon', audio: 'صًا' }
    ],
    examples: [
      { glyph: 'صَابُونٌ', latin: 'Shaabuunun', meaning: 'Sabun', sound: 'صَابُون' },
      { glyph: 'صُنْدُوقٌ', latin: 'Shunduuqun', meaning: 'Kotak', sound: 'صُنْدُوق' }
    ]
  },
  {
    id: 14,
    glyph: 'ض',
    latin: 'Dhad',
    sound: 'dh',
    makhraj: 'Sisi lidah menyentuh gigi geraham atas',
    desc: 'Huruf paling istimewa dalam bahasa Arab (Lughat adh-Dhad).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'ضَ', sound: 'Dho', audio: 'ضَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'ضِ', sound: 'Dhi', audio: 'ضِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'ضُ', sound: 'Dhu', audio: 'ضُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'ضًا', sound: 'Dhon', audio: 'ضًا' }
    ],
    examples: [
      { glyph: 'ضَوْءٌ', latin: 'Dhou-un', meaning: 'Cahaya', sound: 'ضَوْء' },
      { glyph: 'ضِفْدَعٌ', latin: 'Dhifda\'un', meaning: 'Katak', sound: 'ضِفْدَع' }
    ]
  },
  {
    id: 15,
    glyph: 'ط',
    latin: 'Tha',
    sound: 'th',
    makhraj: 'Ujung lidah menyentuh pangkal gigi seri atas dengan lidah terangkat',
    desc: 'Tebal dan memantul kuat saat sukun (Qalqalah).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'طَ', sound: 'Tho', audio: 'طَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'طِ', sound: 'Thi', audio: 'طِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'طُ', sound: 'Thu', audio: 'طُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'طًا', sound: 'Thon', audio: 'طًا' }
    ],
    examples: [
      { glyph: 'طَالِبٌ', latin: 'Thoolibun', meaning: 'Siswa / Murid', sound: 'طَالِب' },
      { glyph: 'طَائِرَةٌ', latin: 'Thoo-irotun', meaning: 'Pesawat', sound: 'طَائِرَة' }
    ]
  },
  {
    id: 16,
    glyph: 'ظ',
    latin: 'Zha',
    sound: 'zh',
    makhraj: 'Ujung lidah menyentuh ujung gigi seri atas dengan posisi tebal',
    desc: 'Huruf tebal dengan sifat Ithbaq.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'ظَ', sound: 'Zho', audio: 'ظَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'ظِ', sound: 'Zhi', audio: 'ظِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'ظُ', sound: 'Zhu', audio: 'ظُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'ظًا', sound: 'Zhon', audio: 'ظًا' }
    ],
    examples: [
      { glyph: 'ظَرْفٌ', latin: 'Zhorfun', meaning: 'Amplop', sound: 'ظَرْف' },
      { glyph: 'ظِلٌّ', latin: 'Zhillun', meaning: 'Bayangan', sound: 'ظِلّ' }
    ]
  },
  {
    id: 17,
    glyph: 'ع',
    latin: "'Ain",
    sound: "'",
    makhraj: 'Wasathul Halq (Pertengahan tenggorokan)',
    desc: 'Suara jernih dan sedikit tertahan dari tengah tenggorokan.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'عَ', sound: "'A", audio: 'عَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'عِ', sound: "'I", audio: 'عِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'عُ', sound: "'U", audio: 'عُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'عًا', sound: "'An", audio: 'عًا' }
    ],
    examples: [
      { glyph: 'عَيْنٌ', latin: "'Ainun", meaning: 'Mata', sound: 'عَيْن' },
      { glyph: 'عِنَبٌ', latin: "'Inabun", meaning: 'Anggur', sound: 'عِنَب' }
    ]
  },
  {
    id: 18,
    glyph: 'غ',
    latin: 'Ghain',
    sound: 'gh',
    makhraj: 'Adnal Halq (Ujung tenggorokan atas)',
    desc: 'Suara tebal bergetar lembut seperti berkumur.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'غَ', sound: 'Gho', audio: 'غَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'غِ', sound: 'Ghi', audio: 'غِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'غُ', sound: 'Ghu', audio: 'غُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'غًا', sound: 'Ghon', audio: 'غًا' }
    ],
    examples: [
      { glyph: 'غُرْفَةٌ', latin: 'Ghurfatun', meaning: 'Kamar / Ruangan', sound: 'غُرْفَة' },
      { glyph: 'غَابَةٌ', latin: 'Ghaabatun', meaning: 'Hutan', sound: 'غَابَة' }
    ]
  },
  {
    id: 19,
    glyph: 'ف',
    latin: 'Fa',
    sound: 'f',
    makhraj: 'Bibir bawah bagian dalam bertemu ujung gigi seri atas',
    desc: 'Hembusan udara halus saat gigi atas menyentuh bibir bawah.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'فَ', sound: 'Fa', audio: 'فَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'فِ', sound: 'Fi', audio: 'فِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'فُ', sound: 'Fu', audio: 'فُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'فًا', sound: 'Fan', audio: 'فًا' }
    ],
    examples: [
      { glyph: 'فَمٌ', latin: 'Famun', meaning: 'Mulut', sound: 'فَم' },
      { glyph: 'فِيلٌ', latin: 'Fiilun', meaning: 'Gajah', sound: 'فِيل' }
    ]
  },
  {
    id: 20,
    glyph: 'ق',
    latin: 'Qaf',
    sound: 'q',
    makhraj: 'Aqshal Lisan (Pangkal lidah paling belakang)',
    desc: 'Pangkal lidah menempel ke langit-langit lunak bagian belakang (Qalqalah kuat).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'قَ', sound: 'Qo', audio: 'قَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'قِ', sound: 'Qi', audio: 'قِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'قُ', sound: 'Qu', audio: 'قُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'قًا', sound: 'Qon', audio: 'قًا' }
    ],
    examples: [
      { glyph: 'قَلَمٌ', latin: 'Qalamun', meaning: 'Pena', sound: 'قَلَم' },
      { glyph: 'قَمَرٌ', latin: 'Qamarun', meaning: 'Bulan', sound: 'قَمَر' }
    ]
  },
  {
    id: 21,
    glyph: 'ك',
    latin: 'Kaf',
    sound: 'k',
    makhraj: 'Pangkal lidah ke depan sedikit setelah huruf Qaf',
    desc: 'Keluar dengan desisan nafas halus (Hams) saat sukun.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'كَ', sound: 'Ka', audio: 'كَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'كِ', sound: 'Ki', audio: 'كِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'كُ', sound: 'Ku', audio: 'كُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'كًا', sound: 'Kan', audio: 'كًا' }
    ],
    examples: [
      { glyph: 'كِتَابٌ', latin: 'Kitaabun', meaning: 'Buku', sound: 'كِتَاب' },
      { glyph: 'كُرْسِيٌّ', latin: 'Kursiyyun', meaning: 'Kursi', sound: 'كُرْسِيّ' }
    ]
  },
  {
    id: 22,
    glyph: 'ل',
    latin: 'Lam',
    sound: 'l',
    makhraj: 'Ujung tepi lidah ke langit-langit atas',
    desc: 'Lancar dan lembut saat diucapkan.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'لَ', sound: 'La', audio: 'لَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'لِ', sound: 'Li', audio: 'لِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'لُ', sound: 'Lu', audio: 'لُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'لًا', sound: 'Lan', audio: 'لًا' }
    ],
    examples: [
      { glyph: 'لَبَنٌ', latin: 'Labanun', meaning: 'Susu', sound: 'لَبَن' },
      { glyph: 'لَيْلٌ', latin: 'Lailun', meaning: 'Malam', sound: 'لَيْل' }
    ]
  },
  {
    id: 23,
    glyph: 'م',
    latin: 'Mim',
    sound: 'm',
    makhraj: 'Asy-Syafatain (Dua bibir tertutup rapat)',
    desc: 'Dua bibir dirapatkan disertai dengung dari rongga hidung (Ghunnah).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'مَ', sound: 'Ma', audio: 'مَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'مِ', sound: 'Mi', audio: 'مِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'مُ', sound: 'Mu', audio: 'مُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'مًا', sound: 'Man', audio: 'مًا' }
    ],
    examples: [
      { glyph: 'مَسْجِدٌ', latin: 'Masjidun', meaning: 'Masjid', sound: 'مَسْجِد' },
      { glyph: 'مَاءٌ', latin: 'Maa-un', meaning: 'Air', sound: 'مَاء' }
    ]
  },
  {
    id: 24,
    glyph: 'ن',
    latin: 'Nun',
    sound: 'n',
    makhraj: 'Tharaful Lisan (Ujung lidah di bawah makhraj Lam)',
    desc: 'Disertai suara dengung murni (Ghunnah).',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'نَ', sound: 'Na', audio: 'نَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'نِ', sound: 'Ni', audio: 'نِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'نُ', sound: 'Nu', audio: 'نُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'نًا', sound: 'Nan', audio: 'نًا' }
    ],
    examples: [
      { glyph: 'نَجْمٌ', latin: 'Najmun', meaning: 'Bintang', sound: 'نَجْم' },
      { glyph: 'نَهْرٌ', latin: 'Nahrun', meaning: 'Sungai', sound: 'نَهْر' }
    ]
  },
  {
    id: 25,
    glyph: 'و',
    latin: 'Wau',
    sound: 'w',
    makhraj: 'Kedua bibir membulat (Moncong)',
    desc: 'Membulatkan kedua bibir dengan sedikit celah udara.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'وَ', sound: 'Wa', audio: 'وَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'وِ', sound: 'Wi', audio: 'وِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'وُ', sound: 'Wu', audio: 'وُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'وًا', sound: 'Wan', audio: 'وًا' }
    ],
    examples: [
      { glyph: 'وَلَدٌ', latin: 'Waladun', meaning: 'Anak laki-laki', sound: 'وَلَد' },
      { glyph: 'وَجْهٌ', latin: 'Wajhun', meaning: 'Wajah', sound: 'وَجْه' }
    ]
  },
  {
    id: 26,
    glyph: 'هـ',
    latin: 'Ha',
    sound: 'h',
    makhraj: 'Aqshal Halq (Pangkal tenggorokan paling dalam)',
    desc: 'Keluar dari dasar tenggorokan dengan hembusan nafas yang dalam.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'هَ', sound: 'Ha', audio: 'هَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'هِ', sound: 'Hi', audio: 'هِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'هُ', sound: 'Hu', audio: 'هُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'هً', sound: 'Han', audio: 'هً' }
    ],
    examples: [
      { glyph: 'هِلَالٌ', latin: 'Hilaalun', meaning: 'Bulan Sabit', sound: 'هِلَال' },
      { glyph: 'هَاتِفٌ', latin: 'Haatifun', meaning: 'Telepon', sound: 'هَاتِف' }
    ]
  },
  {
    id: 27,
    glyph: 'ي',
    latin: 'Ya',
    sound: 'y',
    makhraj: 'Tengah lidah terangkat ke langit-langit rongga mulut',
    desc: 'Lancar dan lembut seperti huruf vokal.',
    harakat: [
      { sign: 'َ', name: 'Fathah', glyph: 'يَ', sound: 'Ya', audio: 'يَ' },
      { sign: 'ِ', name: 'Kasrah', glyph: 'يِ', sound: 'Yi', audio: 'يِ' },
      { sign: 'ُ', name: 'Dhammah', glyph: 'يُ', sound: 'Yu', audio: 'يُ' },
      { sign: 'ً', name: 'Tanwin', glyph: 'يً', sound: 'Yan', audio: 'يً' }
    ],
    examples: [
      { glyph: 'يَدٌ', latin: 'Yadun', meaning: 'Tangan', sound: 'يَد' },
      { glyph: 'يَوْمٌ', latin: 'Yaumun', meaning: 'Hari', sound: 'يَوْم' }
    ]
  }
];
