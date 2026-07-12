/* =========================================================
   ReadOnBelieve — script.js
   Plain JavaScript, no build step, no frameworks.

   IMPORTANT: This site does not store Bible text in these files.
   Instead, it fetches the real chapter text at read-time from
   bible-api.com — a free API serving public-domain translations
   (King James Version and World English Bible). This keeps the
   site lightweight and the text always complete and accurate.
   You will need an internet connection to actually read a chapter.
   ========================================================= */

const API_BASE = "https://bible-api.com/";

/* ---------- Audio Bible (api.bible) ----------
   Powers the "Listen to this chapter" player, using the official
   Audio Bibles endpoints under rest.api.bible. Audio Bibles are
   queried separately from text Bibles and use their own book/chapter
   IDs, so we fetch the book/chapter ID map once, cache it in memory
   for the session, then ask for the one chapter's audio link. */
const AUDIO_API_KEY = "aLfXVz00z2JK6ilKGIIa3";
const AUDIO_BIBLE_ID = "105a06b6146d11e7-01";
const AUDIO_API_ROOT = "https://rest.api.bible/v1/audio-bibles/";

/* Normalizes a book name for loose matching ("1 Samuel" / "1Samuel" /
   "I Samuel" style differences between our list and api.bible's). */
function normalizeBookName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

let audioBooksCache = null;   // Map: normalized book name -> { chapters: [{id, number}] }
let audioBooksPromise = null; // in-flight fetch, so simultaneous calls share one request

async function getAudioBooks() {
  if (audioBooksCache) return audioBooksCache;
  if (audioBooksPromise) return audioBooksPromise;

  audioBooksPromise = (async () => {
    const res = await fetch(
      `${AUDIO_API_ROOT}${AUDIO_BIBLE_ID}/books?include-chapters=true`,
      { headers: { "api-key": AUDIO_API_KEY } }
    );
    if (!res.ok) throw new Error(`Audio books request failed (${res.status})`);
    const json = await res.json();
    const map = new Map();
    (json.data || []).forEach(book => {
      map.set(normalizeBookName(book.name || book.nameLong || book.id), book.chapters || []);
    });
    audioBooksCache = map;
    return map;
  })();

  try {
    return await audioBooksPromise;
  } finally {
    audioBooksPromise = null;
  }
}

/* Returns the playable audio URL for one chapter, or throws with a
   reason so the UI can show something meaningful. */
async function fetchChapterAudioUrl(bookName, chapter) {
  const books = await getAudioBooks();
  const chapters = books.get(normalizeBookName(bookName));
  if (!chapters) throw new Error("book-not-found");

  const chapterEntry = chapters.find(c => String(c.number) === String(chapter));
  if (!chapterEntry) throw new Error("chapter-not-found");

  const res = await fetch(
    `${AUDIO_API_ROOT}${AUDIO_BIBLE_ID}/chapters/${chapterEntry.id}`,
    { headers: { "api-key": AUDIO_API_KEY } }
  );
  if (!res.ok) throw new Error(`chapter-audio-failed-${res.status}`);
  const json = await res.json();
  const url = json && json.data ? json.data.resourceUrl : null;
  if (!url) throw new Error("no-resource-url");
  return url;
}

/* ---------- Safe localStorage wrapper ---------- */
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
};

/* ---------- The 66 books, in order, with chapter counts ----------
   This is just a table of contents (public factual information),
   not the Bible text itself. */
const BOOKS = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "OT" },
  { name: "Exodus", chapters: 40, testament: "OT" },
  { name: "Leviticus", chapters: 27, testament: "OT" },
  { name: "Numbers", chapters: 36, testament: "OT" },
  { name: "Deuteronomy", chapters: 34, testament: "OT" },
  { name: "Joshua", chapters: 24, testament: "OT" },
  { name: "Judges", chapters: 21, testament: "OT" },
  { name: "Ruth", chapters: 4, testament: "OT" },
  { name: "1 Samuel", chapters: 31, testament: "OT" },
  { name: "2 Samuel", chapters: 24, testament: "OT" },
  { name: "1 Kings", chapters: 22, testament: "OT" },
  { name: "2 Kings", chapters: 25, testament: "OT" },
  { name: "1 Chronicles", chapters: 29, testament: "OT" },
  { name: "2 Chronicles", chapters: 36, testament: "OT" },
  { name: "Ezra", chapters: 10, testament: "OT" },
  { name: "Nehemiah", chapters: 13, testament: "OT" },
  { name: "Esther", chapters: 10, testament: "OT" },
  { name: "Job", chapters: 42, testament: "OT" },
  { name: "Psalms", chapters: 150, testament: "OT" },
  { name: "Proverbs", chapters: 31, testament: "OT" },
  { name: "Ecclesiastes", chapters: 12, testament: "OT" },
  { name: "Song of Solomon", chapters: 8, testament: "OT" },
  { name: "Isaiah", chapters: 66, testament: "OT" },
  { name: "Jeremiah", chapters: 52, testament: "OT" },
  { name: "Lamentations", chapters: 5, testament: "OT" },
  { name: "Ezekiel", chapters: 48, testament: "OT" },
  { name: "Daniel", chapters: 12, testament: "OT" },
  { name: "Hosea", chapters: 14, testament: "OT" },
  { name: "Joel", chapters: 3, testament: "OT" },
  { name: "Amos", chapters: 9, testament: "OT" },
  { name: "Obadiah", chapters: 1, testament: "OT" },
  { name: "Jonah", chapters: 4, testament: "OT" },
  { name: "Micah", chapters: 7, testament: "OT" },
  { name: "Nahum", chapters: 3, testament: "OT" },
  { name: "Habakkuk", chapters: 3, testament: "OT" },
  { name: "Zephaniah", chapters: 3, testament: "OT" },
  { name: "Haggai", chapters: 2, testament: "OT" },
  { name: "Zechariah", chapters: 14, testament: "OT" },
  { name: "Malachi", chapters: 4, testament: "OT" },
  // New Testament
  { name: "Matthew", chapters: 28, testament: "NT" },
  { name: "Mark", chapters: 16, testament: "NT" },
  { name: "Luke", chapters: 24, testament: "NT" },
  { name: "John", chapters: 21, testament: "NT" },
  { name: "Acts", chapters: 28, testament: "NT" },
  { name: "Romans", chapters: 16, testament: "NT" },
  { name: "1 Corinthians", chapters: 16, testament: "NT" },
  { name: "2 Corinthians", chapters: 13, testament: "NT" },
  { name: "Galatians", chapters: 6, testament: "NT" },
  { name: "Ephesians", chapters: 6, testament: "NT" },
  { name: "Philippians", chapters: 4, testament: "NT" },
  { name: "Colossians", chapters: 4, testament: "NT" },
  { name: "1 Thessalonians", chapters: 5, testament: "NT" },
  { name: "2 Thessalonians", chapters: 3, testament: "NT" },
  { name: "1 Timothy", chapters: 6, testament: "NT" },
  { name: "2 Timothy", chapters: 4, testament: "NT" },
  { name: "Titus", chapters: 3, testament: "NT" },
  { name: "Philemon", chapters: 1, testament: "NT" },
  { name: "Hebrews", chapters: 13, testament: "NT" },
  { name: "James", chapters: 5, testament: "NT" },
  { name: "1 Peter", chapters: 5, testament: "NT" },
  { name: "2 Peter", chapters: 3, testament: "NT" },
  { name: "1 John", chapters: 5, testament: "NT" },
  { name: "2 John", chapters: 1, testament: "NT" },
  { name: "3 John", chapters: 1, testament: "NT" },
  { name: "Jude", chapters: 1, testament: "NT" },
  { name: "Revelation", chapters: 22, testament: "NT" }
];

/* ---------- A short list of well-known references for "Verse of the Day".
   These are just citations (like a table of contents entry) — the actual
   text is always fetched live from the API, never stored here. ---------- */
const VERSE_OF_DAY_REFS = [
  "john 3:16", "psalm 23:1", "philippians 4:13", "romans 8:28", "jeremiah 29:11",
  "proverbs 3:5-6", "isaiah 41:10", "psalm 46:1", "matthew 11:28", "1 peter 5:7",
  "joshua 1:9", "psalm 118:24", "2 corinthians 5:17", "galatians 5:22-23",
  "psalm 34:18", "matthew 6:33", "romans 12:2", "psalm 119:105", "john 14:27",
  "1 corinthians 13:4-7"
];

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

function slugify(bookName) {
  return bookName.toLowerCase().replace(/\s+/g, "+");
}

/* ================= FETCH HELPERS ================= */
async function fetchPassage(reference, translation) {
  const url = `${API_BASE}${encodeURIComponent(reference).replace(/%20/g, "+")}?translation=${translation}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load that passage.");
  return res.json();
}

/* ================= RENDER BOOK GRID ================= */
const otGrid = document.getElementById("otGrid");
const ntGrid = document.getElementById("ntGrid");

BOOKS.forEach(book => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "book-btn";
  btn.textContent = book.name;
  btn.addEventListener("click", () => openChapterPicker(book));
  (book.testament === "OT" ? otGrid : ntGrid).appendChild(btn);
});

/* ================= CHAPTER PICKER ================= */
const chapterPicker = document.getElementById("chapterPicker");
const chapterGrid = document.getElementById("chapterGrid");
const chapterBookLabel = document.getElementById("chapterBookLabel");

function openChapterPicker(book) {
  chapterBookLabel.textContent = book.name;
  chapterGrid.innerHTML = "";
  for (let c = 1; c <= book.chapters; c++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter-btn";
    btn.textContent = c;
    btn.addEventListener("click", () => loadChapter(book.name, c));
    chapterGrid.appendChild(btn);
  }
  chapterPicker.hidden = false;
  chapterPicker.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ================= READER ================= */
const readerSection = document.getElementById("reader");
const readerTitle = document.getElementById("readerTitle");
const readerText = document.getElementById("readerText");
const readerStatus = document.getElementById("readerStatus");
const translationSelect = document.getElementById("translationSelect");
const prevChapterBtn = document.getElementById("prevChapterBtn");
const nextChapterBtn = document.getElementById("nextChapterBtn");

let currentBookName = null;
let currentChapter = null;

translationSelect.value = store.get("rob_translation", "kjv");

/* ---------- Audio player elements ---------- */
const listenBtn = document.getElementById("listenBtn");
const audioPlayerWrap = document.getElementById("audioPlayerWrap");
const chapterAudio = document.getElementById("chapterAudio");
const audioStatus = document.getElementById("audioStatus");

function resetAudioPlayer() {
  chapterAudio.pause();
  chapterAudio.removeAttribute("src");
  chapterAudio.load();
  audioPlayerWrap.hidden = true;
  audioStatus.textContent = "";
  listenBtn.hidden = false;
  listenBtn.disabled = false;
  listenBtn.textContent = "🔊 Listen to this chapter";
}

listenBtn.addEventListener("click", async () => {
  if (!currentBookName || !currentChapter) return;
  listenBtn.disabled = true;
  listenBtn.textContent = "Loading audio…";
  audioStatus.textContent = "";
  try {
    const url = await fetchChapterAudioUrl(currentBookName, currentChapter);
    chapterAudio.src = url;
    audioPlayerWrap.hidden = false;
    listenBtn.hidden = true;
    await chapterAudio.play().catch(() => { /* wait for a manual tap on mobile */ });
  } catch (e) {
    const msg = String(e && e.message || "");
    if (msg.includes("401") || msg.includes("403")) {
      audioStatus.textContent = "This API key isn't licensed for audio Bible access.";
    } else if (msg === "book-not-found" || msg === "chapter-not-found") {
      audioStatus.textContent = "Audio isn't available for this chapter.";
    } else {
      audioStatus.textContent = "Couldn't load audio. Check your connection and try again.";
    }
    listenBtn.disabled = false;
    listenBtn.textContent = "🔊 Listen to this chapter";
  }
});

async function loadChapter(bookName, chapter) {
  currentBookName = bookName;
  currentChapter = chapter;
  const book = BOOKS.find(b => b.name === bookName);

  readerSection.hidden = false;
  readerTitle.textContent = `${bookName} ${chapter}`;
  readerText.innerHTML = "";
  readerStatus.textContent = "Loading chapter…";
  resetAudioPlayer();
  readerSection.scrollIntoView({ behavior: "smooth", block: "start" });

  prevChapterBtn.disabled = chapter <= 1;
  nextChapterBtn.disabled = book ? chapter >= book.chapters : false;

  try {
    const data = await fetchPassage(`${slugify(bookName)}+${chapter}`, translationSelect.value);
    readerStatus.textContent = "";
    renderVerses(data.verses || []);
    store.set("rob_last_position", { book: bookName, chapter });
    incrementChaptersRead();
    registerVisitForStreak();
  } catch (err) {
    readerStatus.textContent = "Couldn't load this chapter. Check your internet connection and try again.";
  }
}

function renderVerses(verses) {
  const bookmarks = store.get("rob_bookmarks", []);
  readerText.innerHTML = "";
  verses.forEach(v => {
    const ref = `${v.book_name || currentBookName} ${v.chapter}:${v.verse}`;
    const span = document.createElement("span");
    span.className = "verse";
    span.dataset.ref = ref;
    span.dataset.text = v.text.trim();
    if (bookmarks.some(b => b.ref === ref)) span.classList.add("bookmarked");
    span.innerHTML = `<span class="vnum">${v.verse}</span>${v.text.trim()} `;
    span.addEventListener("click", () => openVerseDialog(ref, v.text.trim()));
    readerText.appendChild(span);
  });
}

prevChapterBtn.addEventListener("click", () => {
  if (currentChapter > 1) loadChapter(currentBookName, currentChapter - 1);
});
nextChapterBtn.addEventListener("click", () => {
  const book = BOOKS.find(b => b.name === currentBookName);
  if (book && currentChapter < book.chapters) loadChapter(currentBookName, currentChapter + 1);
});
translationSelect.addEventListener("change", () => {
  store.set("rob_translation", translationSelect.value);
  if (currentBookName) loadChapter(currentBookName, currentChapter);
});

/* ---------- Font size controls ---------- */
const root = document.documentElement;
function setFontSize(px) {
  root.style.setProperty("--reader-font-size", `${px}px`);
  store.set("rob_font_size", px);
}
setFontSize(store.get("rob_font_size", 18.4));
document.getElementById("fontSmaller").addEventListener("click", () => {
  const current = parseFloat(getComputedStyle(root).getPropertyValue("--reader-font-size"));
  setFontSize(Math.max(14, current - 2));
});
document.getElementById("fontLarger").addEventListener("click", () => {
  const current = parseFloat(getComputedStyle(root).getPropertyValue("--reader-font-size"));
  setFontSize(Math.min(30, current + 2));
});

/* ================= VERSE DIALOG (bookmark + note + share) ================= */
const verseDialog = document.getElementById("verseDialog");
const verseDialogRef = document.getElementById("verseDialogRef");
const verseDialogText = document.getElementById("verseDialogText");
const verseNoteInput = document.getElementById("verseNoteInput");
const verseDialogConfirm = document.getElementById("verseDialogConfirm");
let activeVerse = null;

function openVerseDialog(ref, text) {
  activeVerse = { ref, text };
  verseDialogRef.textContent = ref;
  verseDialogText.textContent = text;
  const existing = store.get("rob_bookmarks", []).find(b => b.ref === ref);
  verseNoteInput.value = existing ? existing.note || "" : "";
  verseDialogConfirm.textContent = "";
  verseDialog.showModal();
}

document.getElementById("bookmarkBtn").addEventListener("click", () => {
  if (!activeVerse) return;
  let bookmarks = store.get("rob_bookmarks", []);
  const note = verseNoteInput.value.trim();
  const idx = bookmarks.findIndex(b => b.ref === activeVerse.ref);
  const entry = { ref: activeVerse.ref, text: activeVerse.text, note, date: new Date().toLocaleDateString() };
  if (idx >= 0) bookmarks[idx] = entry; else bookmarks.push(entry);
  store.set("rob_bookmarks", bookmarks);
  renderBookmarks();
  const span = readerText.querySelector(`.verse[data-ref="${CSS.escape(activeVerse.ref)}"]`);
  if (span) span.classList.add("bookmarked");
  verseDialogConfirm.textContent = "Saved to your bookmarks.";
});

document.getElementById("copyVerseBtn").addEventListener("click", async () => {
  if (!activeVerse) return;
  const shareText = `${activeVerse.text}\n— ${activeVerse.ref}`;
  try {
    if (navigator.share) {
      await navigator.share({ text: shareText, title: activeVerse.ref });
      verseDialogConfirm.textContent = "Shared.";
    } else {
      await navigator.clipboard.writeText(shareText);
      verseDialogConfirm.textContent = "Copied to your clipboard.";
    }
  } catch (e) {
    verseDialogConfirm.textContent = "Couldn't share — try copying manually.";
  }
});

/* ================= BOOKMARKS LIST ================= */
const bookmarkList = document.getElementById("bookmarkList");
const bookmarkEmpty = document.getElementById("bookmarkEmpty");

function renderBookmarks() {
  const bookmarks = store.get("rob_bookmarks", []);
  bookmarkList.innerHTML = "";
  bookmarkEmpty.style.display = bookmarks.length ? "none" : "block";
  bookmarks.slice().reverse().forEach(b => {
    const row = document.createElement("div");
    row.className = "bookmark-entry";
    row.innerHTML = `
      <div>
        <span class="entry-ref">${escapeHtml(b.ref)}</span>
        <div>${escapeHtml(b.text)}</div>
        ${b.note ? `<div class="entry-note">"${escapeHtml(b.note)}"</div>` : ""}
      </div>
      <div class="entry-actions">
        <button data-action="open" data-ref="${escapeHtml(b.ref)}">Read again</button>
        <button data-action="delete" data-ref="${escapeHtml(b.ref)}">Delete</button>
      </div>
    `;
    bookmarkList.appendChild(row);
  });
}

bookmarkList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const ref = btn.dataset.ref;
  if (btn.dataset.action === "delete") {
    const bookmarks = store.get("rob_bookmarks", []).filter(b => b.ref !== ref);
    store.set("rob_bookmarks", bookmarks);
    renderBookmarks();
  } else if (btn.dataset.action === "open") {
    jumpToReference(ref);
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
renderBookmarks();

/* ================= JUMP TO A PASSAGE ================= */
document.getElementById("jumpForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = document.getElementById("jumpInput").value.trim();
  if (val) jumpToReference(val);
});

function jumpToReference(text) {
  // Match a leading book name (allowing "1 John" style numbers) plus a chapter number
  const match = text.match(/^((?:[1-3]\s)?[A-Za-z ]+?)\s+(\d+)/);
  if (!match) {
    document.getElementById("readerStatus").textContent = "Try a format like: John 3 or Genesis 1";
    readerSection.hidden = false;
    readerSection.scrollIntoView({ behavior: "smooth" });
    return;
  }
  const typedName = match[1].trim().toLowerCase();
  const chapter = parseInt(match[2], 10);
  const book = BOOKS.find(b => b.name.toLowerCase() === typedName);
  if (!book) {
    document.getElementById("readerStatus").textContent = `Couldn't find a book called "${match[1].trim()}".`;
    readerSection.hidden = false;
    readerSection.scrollIntoView({ behavior: "smooth" });
    return;
  }
  loadChapter(book.name, Math.min(chapter, book.chapters));
}

/* ================= RANDOM CHAPTER ================= */
document.getElementById("randomBtn").addEventListener("click", () => {
  const book = BOOKS[Math.floor(Math.random() * BOOKS.length)];
  const chapter = Math.floor(Math.random() * book.chapters) + 1;
  loadChapter(book.name, chapter);
});

/* ================= CONTINUE READING ================= */
document.getElementById("continueBtn").addEventListener("click", () => {
  const last = store.get("rob_last_position", null);
  if (last) {
    loadChapter(last.book, last.chapter);
  } else {
    loadChapter("John", 1);
  }
});

/* ================= VERSE OF THE DAY ================= */
async function loadVerseOfDay() {
  const el = document.getElementById("verseOfDay");
  const ref = VERSE_OF_DAY_REFS[dayOfYear(new Date()) % VERSE_OF_DAY_REFS.length];
  try {
    const data = await fetchPassage(ref, "kjv");
    el.textContent = `"${data.text.trim().replace(/\s+/g, " ")}" — ${data.reference}`;
  } catch (e) {
    el.textContent = "Open a book below and start reading today.";
  }
}
loadVerseOfDay();

/* ================= VIGIL (NIGHT) MODE ================= */
const vigilToggle = document.getElementById("vigilToggle");
function applyVigil(on) {
  document.body.classList.toggle("vigil", on);
  vigilToggle.setAttribute("aria-pressed", String(on));
  vigilToggle.querySelector(".vigil-icon").textContent = on ? "☀" : "☾";
  vigilToggle.querySelector(".vigil-label").textContent = on ? "Day Mode" : "Vigil Mode";
}
applyVigil(store.get("rob_vigil", false));
vigilToggle.addEventListener("click", () => {
  const now = !document.body.classList.contains("vigil");
  applyVigil(now);
  store.set("rob_vigil", now);
});

/* ================= STREAK + CHAPTERS READ COUNT ================= */
const streakDaysEl = document.getElementById("streakDays");
const chaptersReadCountEl = document.getElementById("chaptersReadCount");

function registerVisitForStreak() {
  const today = new Date().toDateString();
  const data = store.get("rob_streak", { lastVisit: null, count: 0 });
  if (data.lastVisit !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    data.count = (data.lastVisit === yesterday) ? data.count + 1 : 1;
    data.lastVisit = today;
    store.set("rob_streak", data);
  }
  streakDaysEl.textContent = store.get("rob_streak", { count: 0 }).count;
}

function incrementChaptersRead() {
  const total = store.get("rob_chapters_read", 0) + 1;
  store.set("rob_chapters_read", total);
  chaptersReadCountEl.textContent = total;
}

(function initOnLoad() {
  streakDaysEl.textContent = store.get("rob_streak", { count: 0 }).count;
  chaptersReadCountEl.textContent = store.get("rob_chapters_read", 0);
})();
