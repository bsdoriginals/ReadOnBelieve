# ReadOnBelieve 📖✝

A free, simple website to read the complete Bible online — book by book,
chapter by chapter. Built with plain HTML, CSS, and JavaScript, meant to be
hosted on GitHub Pages, and designed as a companion site to **PrayOnBelieve**.

## How the Bible text works

This site does **not** store Bible text inside its files. Instead, every time
someone opens a chapter, the site fetches the real, complete text live from
[bible-api.com](https://bible-api.com) — a free service that serves
public-domain translations:

- **King James Version (KJV)**
- **World English Bible (WEB)**

This means:
- The site's files stay small and easy to manage
- The text is always the real, full text — never shortened or summarized
- A working internet connection is needed to actually read a chapter (browsing
  the book list and using saved bookmarks/notes still works offline)

## Features

- **Full 66-book Bible** — every Old and New Testament book, all chapters
- **Two translations** — switch between KJV and WEB from the reader
- **Jump to any passage** — type "John 3:16" or "Genesis 1" and go straight there
- **Random chapter** — for when you don't know where to start
- **Continue Reading** — remembers your last chapter and picks up where you left off
- **Tap a verse** to bookmark it and add a private note
- **My Bookmarks** — saved only in your own browser via `localStorage`, never uploaded
- **Reading streak** and a running count of chapters opened
- **Adjustable text size** for easier reading
- **Vigil Mode** — a night/dark theme
- Fully responsive and keyboard-accessible

## How to publish this on GitHub Pages (step by step)

1. Go to [github.com](https://github.com) and create a **new repository**.
   - Name it something like `readonbelieve`.
   - Keep it **Public**.
2. Upload these files to the repository:
   - `index.html`
   - `style.css`
   - `script.js`
   - (Use "Add file" → "Upload files" on the repo page — works fine from your phone.)
3. Commit the files ("Commit changes").
4. Go to **Settings** → **Pages**.
5. Under "Build and deployment", set **Source** to `Deploy from a branch`.
6. Set **Branch** to `main`, folder to `/ (root)`, then **Save**.
7. Wait 1–2 minutes, refresh that Pages screen, and you'll see your live link:
   `https://yourusername.github.io/readonbelieve/`

## Making changes later

- To change the list of "Verse of the Day" references, open `script.js` and
  find `VERSE_OF_DAY_REFS` near the top.
- To change colors, open `style.css` and edit the values under `:root { ... }`.
- The book and chapter-count list lives in `script.js` under `const BOOKS`.

## A note on privacy

Bookmarks, notes, reading streaks, and your last-read chapter are stored using
the browser's `localStorage`. This means they stay on the visitor's own
device, are never sent to any server, and won't carry over if the visitor
opens the site on a different device or clears their browser data.
