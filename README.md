# 字字群島 Zizi Islands

A bilingual Chinese-learning web game for a 9–10 year old heritage learner. Each island is a short lesson. Practice is pinyin typing, stroke order, character recognition, and speaking / listening in Taiwan Mandarin. Rewards are building the island and raising a pet.

The interface is Traditional Chinese and English together. Zhuyin and pinyin both start on, and each can be turned off.

It is a static PWA. Progress stays in this browser (IndexedDB, with a localStorage copy). There are no accounts, ads, or network calls during play except loading this site’s own files.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints. The app is served under `/zizi-islands/` (the GitHub Pages path). The original practice island, 小海獺的貝殼, plays with no password.

```bash
npm test
npm run build
npm run preview
```

## Family textbook

Lesson files from the copyrighted textbook are **not** in this public repository. `content/` is gitignored. The owner encrypts a folder of lesson JSON on their own machine. The password never leaves that machine and is not stored in the file.

Unzip the enriched lesson pack (English glosses and Taiwan readings) so the folder is `content/meizhou-g4/`, then run:

```bash
node tools/encrypt-content.mjs --in content/meizhou-g4 --out public/content.enc
```

You will be prompted for the family password. To pass it without a prompt:

```bash
ZIZI_PASSWORD='your-family-password' node tools/encrypt-content.mjs --in content/meizhou-g4 --out public/content.enc
```

That writes `public/content.enc` (AES-GCM, key from PBKDF2-SHA-256, 150,000 iterations, Web Crypto compatible). The first launch asks for the password, decrypts in the browser, and caches the lessons on the device. Commit `public/content.enc` only if you want GitHub Pages to serve it. Do not commit `content/`.

A wrong password is rejected. The same file imported twice is refused by its hash.

## Lesson JSON

A lesson file matches the practice island. Parents can upload one object, an array, or `{ "lessons": [ ... ] }` from the parent area (PIN).

```json
{
  "book": "字字群島原創",
  "lesson": 1,
  "title": { "zh": "小海獺的貝殼", "en": "The Little Otter’s Shell" },
  "characters": [
    { "char": "島", "pinyin": "dǎo", "zhuyin": "ㄉㄠˇ", "example_word": "小島", "en": "island" }
  ],
  "words": [
    { "word": "小島", "pinyin": "xiǎo dǎo", "zhuyin": "ㄒㄧㄠˇ ㄉㄠˇ", "en": "little island" }
  ],
  "supplementary_words": [],
  "sentence_patterns": [
    { "pattern": "在…上", "en": "on; on top of" }
  ],
  "example_sentences": [
    { "zh": "貝殼在沙上。", "en": "The shell is on the sand." }
  ],
  "text": {
    "zh_traditional": "貝貝住在一座小島上。",
    "sentences": [
      {
        "zh": "貝貝住在一座小島上。",
        "pinyin": "bèi bèi zhù zài yī zuò xiǎo dǎo shàng 。",
        "zhuyin": "ㄅㄟˋ ㄅㄟˋ ㄓㄨˋ ㄗㄞˋ ㄧ ㄗㄨㄛˋ ㄒㄧㄠˇ ㄉㄠˇ ㄕㄤˋ 。",
        "en": "Beibei lives on a little island."
      }
    ]
  }
}
```

Use Taiwan Mandarin readings. Neutral tone in this pack is a trailing dot in Zhuyin (`ㄉㄜ˙`). Pinyin typing accepts `ni3`, tone marks, `v` or `u:` for `ü`, and ignores case and extra spaces. Tone-only mistakes stay in the same review box.

Stroke animations use the open [hanzi-writer](https://hanziwriter.org/) data (Make Me a Hanzi / Arphic), copied for the practice characters into `public/strokes/`. If a character has no file, the child traces it by hand. If a stroke order differs from school, follow the teacher. Taiwan MOE stroke-order licensing is still to be confirmed, so the animation is a guide.

## Pages

GitHub Actions (`.github/workflows/pages.yml`) builds and deploys to GitHub Pages at `/zizi-islands/`. In the repo settings, set Pages to **GitHub Actions**.

## Privacy

No ads, no accounts, no chat. Progress export (`zizi-progress.json`) omits the decrypted textbook. Recordings stay in the page until you leave the question. “Delete all data” in the parent area clears IndexedDB and localStorage.
