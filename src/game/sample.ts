import type { LessonFile } from './types'

/** Original practice lessons. Not from any textbook. */
export const SAMPLE_LESSONS: LessonFile[] = [
  {
    book: '字字群島原創',
    lesson: 1,
    islandId: 'builtin-1',
    original: true,
    theme: 'sea',
    title: { zh: '小海獺的貝殼', en: 'The Little Otter’s Shell' },
    story: { title_zh: '貝貝和星星', title_en: 'Beibei and the Star', text: null },
    characters: [
      { char: '島', pinyin: 'dǎo', zhuyin: 'ㄉㄠˇ', example_word: '小島', en: 'island' },
      { char: '貝', pinyin: 'bèi', zhuyin: 'ㄅㄟˋ', example_word: '貝殼', en: 'shell' },
      { char: '海', pinyin: 'hǎi', zhuyin: 'ㄏㄞˇ', example_word: '海獺', en: 'sea' },
      { char: '星', pinyin: 'xīng', zhuyin: 'ㄒㄧㄥ', example_word: '星星', en: 'star' },
      { char: '寵', pinyin: 'chǒng', zhuyin: 'ㄔㄨㄥˇ', example_word: '寵物', en: 'pet; to love' },
      { char: '橋', pinyin: 'qiáo', zhuyin: 'ㄑㄧㄠˊ', example_word: '小橋', en: 'bridge' },
      { char: '燈', pinyin: 'dēng', zhuyin: 'ㄉㄥ', example_word: '路燈', en: 'lamp' },
      { char: '游', pinyin: 'yóu', zhuyin: 'ㄧㄡˊ', example_word: '游泳', en: 'to swim' },
    ],
    words: [
      { word: '小島', pinyin: 'xiǎo dǎo', zhuyin: 'ㄒㄧㄠˇ ㄉㄠˇ', en: 'little island' },
      { word: '海獺', pinyin: 'hǎi tǎ', zhuyin: 'ㄏㄞˇ ㄊㄚˇ', en: 'sea otter' },
      { word: '貝殼', pinyin: 'bèi ké', zhuyin: 'ㄅㄟˋ ㄎㄜˊ', en: 'seashell' },
      { word: '星星', pinyin: 'xīng xing', zhuyin: 'ㄒㄧㄥ ㄒㄧㄥ˙', en: 'star' },
      { word: '寵物', pinyin: 'chǒng wù', zhuyin: 'ㄔㄨㄥˇ ㄨˋ', en: 'pet' },
      { word: '小橋', pinyin: 'xiǎo qiáo', zhuyin: 'ㄒㄧㄠˇ ㄑㄧㄠˊ', en: 'little bridge' },
      { word: '路燈', pinyin: 'lù dēng', zhuyin: 'ㄌㄨˋ ㄉㄥ', en: 'streetlamp' },
      { word: '游泳', pinyin: 'yóu yǒng', zhuyin: 'ㄧㄡˊ ㄩㄥˇ', en: 'to swim' },
    ],
    supplementary_words: [
      { word: '沙灘', pinyin: 'shā tān', zhuyin: 'ㄕㄚ ㄊㄢ', en: 'beach' },
      { word: '晚上', pinyin: 'wǎn shang', zhuyin: 'ㄨㄢˇ ㄕㄤ˙', en: 'evening' },
    ],
    sentence_patterns: [
      { pattern: '在…上', en: 'on; on top of. 貝殼在沙上 means “the shell is on the sand.”' },
      { pattern: '又…又…', en: 'both… and…. 又亮又暖 means “both bright and warm.”' },
    ],
    example_sentences: [
      { zh: '貝殼在沙上，路燈在橋邊。', en: 'The shell is on the sand, and the streetlamp is by the bridge.' },
    ],
    text: {
      zh_traditional:
        '貝貝住在一座小島上。她每天游泳，把漂亮的貝殼排在沙上。晚上，路燈亮了，星星也出來了。貝貝說：「我的寵物是一顆會發光的小星星。」星星笑了，跳上小橋，陪貝貝一起看海。',
      sentences: [
        { zh: '貝貝住在一座小島上。', pinyin: 'bèi bèi zhù zài yī zuò xiǎo dǎo shàng 。', zhuyin: 'ㄅㄟˋ ㄅㄟˋ ㄓㄨˋ ㄗㄞˋ ㄧ ㄗㄨㄛˋ ㄒㄧㄠˇ ㄉㄠˇ ㄕㄤˋ 。', en: 'Beibei lives on a little island.' },
        { zh: '她每天游泳，把漂亮的貝殼排在沙上。', pinyin: 'tā měi tiān yóu yǒng ， bǎ piào liang de bèi ké pái zài shā shàng 。', zhuyin: 'ㄊㄚ ㄇㄟˇ ㄊㄧㄢ ㄧㄡˊ ㄩㄥˇ ， ㄅㄚˇ ㄆㄧㄠˋ ㄌㄧㄤ˙ ㄉㄜ˙ ㄅㄟˋ ㄎㄜˊ ㄆㄞˊ ㄗㄞˋ ㄕㄚ ㄕㄤˋ 。', en: 'Every day she swims and lines pretty shells up on the sand.' },
        { zh: '晚上，路燈亮了，星星也出來了。', pinyin: 'wǎn shang ， lù dēng liàng le ， xīng xing yě chū lái le 。', zhuyin: 'ㄨㄢˇ ㄕㄤ˙ ， ㄌㄨˋ ㄉㄥ ㄌㄧㄤˋ ㄌㄜ˙ ， ㄒㄧㄥ ㄒㄧㄥ˙ ㄧㄝˇ ㄔㄨ ㄌㄞˊ ㄌㄜ˙ 。', en: 'At night the streetlamp turns on, and the stars come out too.' },
        { zh: '貝貝說：「我的寵物是一顆會發光的小星星。」', pinyin: 'bèi bèi shuō ：「 wǒ de chǒng wù shì yī kē huì fā guāng de xiǎo xīng xing 。」', zhuyin: 'ㄅㄟˋ ㄅㄟˋ ㄕㄨㄛ ：「 ㄨㄛˇ ㄉㄜ˙ ㄔㄨㄥˇ ㄨˋ ㄕˋ ㄧ ㄎㄜ ㄏㄨㄟˋ ㄈㄚ ㄍㄨㄤ ㄉㄜ˙ ㄒㄧㄠˇ ㄒㄧㄥ ㄒㄧㄥ˙ 。」', en: 'Beibei says, “My pet is a little star that glows.”' },
        { zh: '星星笑了，跳上小橋，陪貝貝一起看海。', pinyin: 'xīng xing xiào le ， tiào shàng xiǎo qiáo ， péi bèi bèi yī qǐ kàn hǎi 。', zhuyin: 'ㄒㄧㄥ ㄒㄧㄥ˙ ㄒㄧㄠˋ ㄌㄜ˙ ， ㄊㄧㄠˋ ㄕㄤˋ ㄒㄧㄠˇ ㄑㄧㄠˊ ， ㄆㄟˊ ㄅㄟˋ ㄅㄟˋ ㄧ ㄑㄧˇ ㄎㄢˋ ㄏㄞˇ 。', en: 'The star laughs, hops onto the little bridge, and watches the sea with Beibei.' },
      ],
    },
  },
  {
    book: '字字群島原創',
    lesson: 2,
    islandId: 'builtin-2',
    original: true,
    theme: 'night',
    title: { zh: '星光小橋', en: 'The Starlit Little Bridge' },
    story: { title_zh: '小船的歌', title_en: 'The Little Boat’s Song', text: null },
    characters: [
      { char: '光', pinyin: 'guāng', zhuyin: 'ㄍㄨㄤ', example_word: '星光', en: 'light' },
      { char: '沙', pinyin: 'shā', zhuyin: 'ㄕㄚ', example_word: '沙灘', en: 'sand' },
      { char: '船', pinyin: 'chuán', zhuyin: 'ㄔㄨㄢˊ', example_word: '小船', en: 'boat' },
      { char: '歌', pinyin: 'gē', zhuyin: 'ㄍㄜ', example_word: '唱歌', en: 'song' },
    ],
    words: [
      { word: '星光', pinyin: 'xīng guāng', zhuyin: 'ㄒㄧㄥ ㄍㄨㄤ', en: 'starlight' },
      { word: '沙灘', pinyin: 'shā tān', zhuyin: 'ㄕㄚ ㄊㄢ', en: 'beach' },
      { word: '小船', pinyin: 'xiǎo chuán', zhuyin: 'ㄒㄧㄠˇ ㄔㄨㄢˊ', en: 'little boat' },
      { word: '唱歌', pinyin: 'chàng gē', zhuyin: 'ㄔㄤˋ ㄍㄜ', en: 'to sing' },
    ],
    sentence_patterns: [
      { pattern: '旁邊', en: 'beside; next to. 沙灘旁邊 means “beside the beach.”' },
    ],
    example_sentences: [
      { zh: '星光落在小橋上，小船輕輕搖。', en: 'Starlight falls on the little bridge, and the boat rocks gently.' },
    ],
    text: {
      sentences: [
        { zh: '星光落在小橋上。', pinyin: 'xīng guāng luò zài xiǎo qiáo shàng 。', zhuyin: 'ㄒㄧㄥ ㄍㄨㄤ ㄌㄨㄛˋ ㄗㄞˋ ㄒㄧㄠˇ ㄑㄧㄠˊ ㄕㄤˋ 。', en: 'Starlight falls on the little bridge.' },
        { zh: '沙灘旁邊有一艘小船。', pinyin: 'shā tān páng biān yǒu yī sōu xiǎo chuán 。', zhuyin: 'ㄕㄚ ㄊㄢ ㄆㄤˊ ㄅㄧㄢ ㄧㄡˇ ㄧ ㄙㄡ ㄒㄧㄠˇ ㄔㄨㄢˊ 。', en: 'There is a little boat beside the beach.' },
        { zh: '貝貝唱歌，船也輕輕搖。', pinyin: 'bèi bèi chàng gē ， chuán yě qīng qīng yáo 。', zhuyin: 'ㄅㄟˋ ㄅㄟˋ ㄔㄤˋ ㄍㄜ ， ㄔㄨㄢˊ ㄧㄝˇ ㄑㄧㄥ ㄑㄧㄥ ㄧㄠˊ 。', en: 'Beibei sings, and the boat rocks gently too.' },
      ],
    },
  },
]

export const THEME_COLORS: Record<string, { land: string; roof: string; accent: string }> = {
  sea: { land: '#8DB07A', roof: '#E8643C', accent: '#3FA7B5' },
  night: { land: '#6E8CA8', roof: '#F2C14E', accent: '#1E3A6E' },
  school: { land: '#B9CFA0', roof: '#E07A3D', accent: '#3FA7B5' },
  food: { land: '#E0B56A', roof: '#C4483A', accent: '#E8643C' },
  festival: { land: '#D98A7A', roof: '#C23B22', accent: '#E8643C' },
  story: { land: '#A9B48A', roof: '#8C5A3C', accent: '#5BAA6A' },
  sky: { land: '#9BB7D4', roof: '#F4E3C1', accent: '#3FA7B5' },
  sport: { land: '#7DAA6A', roof: '#2E6B4F', accent: '#E8643C' },
  home: { land: '#C8B48A', roof: '#A85A3A', accent: '#E9DCC0' },
  spring: { land: '#A8C97A', roof: '#F2A3B3', accent: '#5BAA6A' },
  animal: { land: '#8FBF7A', roof: '#6B4A2A', accent: '#5BAA6A' },
  market: { land: '#E2C48A', roof: '#D85A3A', accent: '#E8643C' },
}
