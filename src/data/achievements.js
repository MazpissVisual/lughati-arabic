// Data Gamifikasi: Level, Lencana (Badges), dan Mahfudzot

export const levels = [
  { level: 1, name: 'Tholib Pemula (طَالِب مُبْتَدِئ)', minXp: 0, icon: 'sprout' },
  { level: 2, name: 'Pembelajar Rajin (مُجْتَهِد)', minXp: 100, icon: 'book' },
  { level: 3, name: 'Penuntut Ilmu (طَالِب الْعِلْم)', minXp: 300, icon: 'star' },
  { level: 4, name: 'Fasih Berbahasa (فَصِيح)', minXp: 600, icon: 'trophy' },
  { level: 5, name: 'Ustadz Muda (أُسْتَاذ)', minXp: 1000, icon: 'crown' },
];

export const badges = [
  {
    id: 'first_step',
    title: 'Langkah Pertama',
    arabic: 'الْخُطْوَةُ الأُولَى',
    desc: 'Mempelajari huruf hijaiyah pertama kali.',
    icon: 'target',
    condition: (data) => data.learnedLetters.length >= 1
  },
  {
    id: 'hijaiyah_half',
    title: 'Setengah Jalan',
    arabic: 'نِصْفُ الطَّرِيقِ',
    desc: 'Menguasai 14 huruf hijaiyah.',
    icon: 'star',
    condition: (data) => data.learnedLetters.length >= 14
  },
  {
    id: 'hijaiyah_master',
    title: 'Khatam Hijaiyah',
    arabic: 'خَتْمُ الْحُرُوفِ',
    desc: 'Menguasai seluruh 28 huruf hijaiyah.',
    icon: 'crown',
    condition: (data) => data.learnedLetters.length >= 28
  },
  {
    id: 'vocab_starter',
    title: 'Kolektor Kata',
    arabic: 'جَامِعُ الْكَلِمَاتِ',
    desc: 'Membuka dan mempelajari minimal 10 kosakata.',
    icon: 'book',
    condition: (data) => (data.learnedWords || []).length >= 10
  },
  {
    id: 'quiz_pro',
    title: 'Bintang Kuis',
    arabic: 'نَجْمُ الاِخْتِبَارِ',
    desc: 'Meraih skor sempurna 100% pada kuis.',
    icon: 'award',
    condition: (data) => (data.quizScores || []).some(q => q.score === q.total && q.total >= 5)
  },
  {
    id: 'streak_3',
    title: 'Disiplin Belajar',
    arabic: 'الْمُدَاوَمَةُ',
    desc: 'Belajar 3 hari berturut-turut.',
    icon: 'flame',
    condition: (data) => (data.streak || 1) >= 3
  }
];

export const mahfudzotList = [
  {
    arabic: 'مَنْ جَدَّ وَجَدَ',
    latin: 'Man jadda wajada',
    meaning: 'Barangsiapa bersungguh-sungguh, maka ia akan berhasil.'
  },
  {
    arabic: 'مَنْ صَبَرَ ظَفِرَ',
    latin: 'Man shabara zhafira',
    meaning: 'Barangsiapa bersabar, maka ia akan beruntung.'
  },
  {
    arabic: 'الْعِلْمُ نُورٌ وَالْجَهْلُ ظَلَامٌ',
    latin: 'Al-\'ilmu nuurun wal jahlu zhalaamun',
    meaning: 'Ilmu itu cahaya dan kebodohan itu kegelapan.'
  },
  {
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    latin: 'Tholabul \'ilmi fariidhatun \'ala kulli muslim',
    meaning: 'Menuntut ilmu adalah kewajiban bagi setiap muslim.'
  },
  {
    arabic: 'الْوَقْتُ أَثْمَنُ مِنَ الذَّهَبِ',
    latin: 'Al-waqtu atsmanu minadz-dzahabi',
    meaning: 'Waktu itu lebih berharga daripada emas.'
  }
];
