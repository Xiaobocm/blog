# Development notes

This site is deliberately plain: HTML, CSS, and a small amount of vanilla JavaScript. There is no build step and no runtime dependency.

The blog currently starts with two notes. Everything needed to add the next one is described below.

## Directory map

```
.
├── index.html / zh/index.html          English / Chinese home
├── blog/index.html / zh/blog/index.html
├── assets/
│   ├── css/site.css                    Global type, header, home, controls
│   ├── css/blog.css                    Blog index
│   ├── css/post.css                    Article reader
│   └── js/site.js                      Menu, theme, content loader, freshness
├── content/
│   ├── posts.json                      Blog index data — the main interface
│   ├── posts.schema.json               JSON Schema for editors / CI
│   └── contributions.json              Snapshot used by the GitHub heatmap
├── assets/
│   ├── css/contributions.css           Heatmap grid and theme colours
│   └── js/contributions.js             Heatmap renderer
├── tools/
│   ├── validate-content.py             Validate posts + pages
│   ├── fetch-contributions.py          Refresh the GitHub calendar snapshot
│   └── bump-version.py                 Update the build id
├── .github/workflows/
│   └── refresh-contributions.yml       Daily contribution snapshot
├── sw.js                               Network-first HTML + offline pages
└── CNAME                               blog.xiaobocm.com
```

## Blog data interface

`content/posts.json` is the single source of truth for:

- the blog index at `/blog/` and `/zh/blog/`
- the “Selected notes” list on the two home pages

The browser fetches it with `cache: "no-store"` and renders the HTML. No blog-index HTML edit is needed when a note is added.

Empty file:

```json
{
  "posts": []
}
```

One entry:

```json
{
  "slug": "a-note-about-routing",
  "date": "2026-12-01",
  "category": "models",
  "title": {
    "en": "A Note About Routing",
    "zh-Hans": "关于路由的一则笔记"
  },
  "subtitle": {
    "en": "What the router is actually deciding.",
    "zh-Hans": "Router 真正在决定什么。"
  },
  "draft": false
}
```

### Fields

| Field | Required | Meaning |
| --- | --- | --- |
| `slug` | yes | Directory name under `blog/` and `zh/blog/`. Lowercase letters, numbers, hyphens. |
| `date` | yes | ISO `YYYY-MM-DD`. Used for sorting and display. |
| `category` | yes | `models`, `machines`, `building`, or `field`. |
| `title.en` / `title.zh-Hans` | yes | Display title for each language. |
| `subtitle.en` / `subtitle.zh-Hans` | yes | Hover-preview text for each language. |
| `draft` | no | `true` hides the note from the index and home page. Default `false`. |

The JSON Schema is `content/posts.schema.json`. Editors such as VS Code can use it for completion and validation.

### Runtime interface

`assets/js/site.js` exposes:

```js
window.XiaobocmContent = {
  endpoint: "https://blog.xiaobocm.com/content/posts.json",
  posts: [ /* current, filtered and sorted posts */ ],
  reload: async () => { /* fetch and re-render */ }
};
```

This is intentionally small. A future CMS, Git hook, or command palette can call `window.XiaobocmContent.reload()` after changing `content/posts.json`.

The renderer targets:

- `#blog-list` — blog index rows
- `#latest-notes` — three latest notes on the home page

If the array is empty, the static empty states remain visible:

- blog: “No notes yet. The first one is being written.”
- Chinese: “还没有文章。第一篇正在写。”

## GitHub contributions

### Why it is a snapshot

There is no public, CORS-friendly JSON endpoint for the contribution calendar:

- the REST API does not expose the calendar;
- GraphQL exposes it, but requires a token — never put a token in a static page;
- `github.com/users/<username>/contributions` is public HTML, but the browser cannot reliably fetch it cross-origin.

So a GitHub Action reads the public HTML once a day and commits a same-origin snapshot. The static page fetches that snapshot; there is no token in the browser.

### Files

- `content/contributions.json` — generated snapshot
- `assets/js/contributions.js` — renders the 7 × 53 grid
- `assets/css/contributions.css` — colours, legend, responsive sizing
- `tools/fetch-contributions.py` — parser and snapshot writer
- `.github/workflows/refresh-contributions.yml` — daily at 01:17 UTC / 09:17 Asia/Shanghai, plus manual dispatch

The JSON shape is:

```json
{
  "username": "xiaobocm",
  "generatedAt": "2026-11-15T12:00:00Z",
  "start": "2025-11-16",
  "end": "2026-11-15",
  "total": 74,
  "days": [
    { "date": "2025-11-16", "count": 0, "level": 0 }
  ]
}
```

`level` is GitHub's 0–4 intensity bucket. The renderer pads the first week to Sunday and derives the accessible summary from `total` and the date range.

### Refresh manually

```powershell
python tools/fetch-contributions.py
```

The script needs no token. It uses the public profile HTML. If GitHub changes that markup, update the parser in `tools/fetch-contributions.py`; the workflow will fail loudly rather than silently writing an empty calendar.

The workflow needs **Settings → Actions → General → Workflow permissions → Read and write permissions** so its `GITHUB_TOKEN` can commit the snapshot. If `main` is protected against bot pushes, allow the Action or switch the commit step to open a pull request.

The section exposes:

```js
window.XiaobocmContributions = {
  endpoint: ".../content/contributions.json",
  reload: async () => {}
};
```

Refreshing the JSON does **not** require a build bump: the page fetches it with `cache: "no-store"`. If the snapshot is unavailable, `#github-contributions` stays hidden.

## Adding a note

A single-file worksheet and path cheat sheet lives at [`blog/ARTICLE_TEMPLATE.md`](blog/ARTICLE_TEMPLATE.md). Copy it, fill it in, and use the steps below.

### 1. Create the English page

Copy `blog/index.html` to `blog/<slug>/index.html`. Then:

- Add one `../` to every relative asset/nav path, because the new page is one directory deeper.
- Replace `blog.css` with `post.css`.
- Update `<title>`, `<meta name="description">`, canonical, `og:*`, `twitter:*`, and the `article:published_time` metadata.
- Update the two `hreflang` URLs and the language-switch links.
- Replace the entire `<main>` with:

```html
<main id="main" class="post-content">
  <article>
    <header class="post-header">
      <p class="post-date">12-01-2026<span class="post-cat">Models</span></p>
      <h1 class="post-heading">Your title</h1>
    </header>
    <div class="post-body">
      <p class="lead">Opening paragraph.</p>
      <h2>A section</h2>
      <p>Body copy.</p>
    </div>
  </article>
  <p class="post-footer"><a href="../../">Home</a></p>
</main>
```

The article styles support `p`, `h2`, `h3`, `blockquote`, `ul`, `ol`, `pre > code`, inline `code`, links, and `hr`.

### 2. Create the Chinese page

Copy `zh/blog/index.html` to `zh/blog/<slug>/index.html` and repeat the same process. Use the Chinese title, description, and body; change the footer link to `../../` and the category label to `模型` / `机器` / `建造` / `随笔`.

### 3. Add the index entry

Add one object to `content/posts.json`. Do not edit `blog/index.html` or `zh/blog/index.html` — the list is generated from the JSON.

### 4. Validate

```powershell
python tools/validate-content.py
```

It checks required fields, categories, dates, duplicate slugs, localized titles, and that both post pages exist for every published note.

### 5. Publish

- Add the two URLs to `sitemap.xml`.
- Add the Chinese/English items to `feed.xml` and `zh/feed.xml` if you want RSS readers to see them.
- Run:

```powershell
python tools/bump-version.py 2026.12.02.1
```

The version bump updates `data-build` and `?v=` in every HTML file, `build.json`, and `sw.js`.

## Categories

| Key | English label | Chinese label | Accent |
| --- | --- | --- | --- |
| `models` | Models | 模型 | blue |
| `machines` | Machines | 机器 | sea green |
| `building` | Building | 建造 | violet |
| `field` | Field | 随笔 | amber |

## Theme and language

- Language is encoded in the URL (`/zh/...`) and in `<html lang>`. There is no runtime string table.
- Theme is stored in `localStorage` under `xb-theme` (`light` or `dark`).
- The theme is applied before paint by the inline script in every `<head>`.
- `window.matchMedia("(prefers-color-scheme: dark)")` is the default when no explicit choice exists.
- The language switch uses static `<a>` links, so it works without JavaScript.

## Fresh HTML

- GitHub Pages cannot set custom cache headers.
- Each page requests `build.json` with `cache: "no-store"` and reloads once when the version differs.
- `sw.js` serves navigations network-first and caches `offline.html` / `zh/offline.html`.
- Bump the version after any content, CSS, or JS change.

## Design rules

- Keep the main prose column quiet and narrow.
- Do not add a second font family without a reason; English body is Spectral, metadata is Space Mono.
- Chinese body uses a system Simplified Chinese serif stack; labels use a system sans stack.
- The particle field is decorative; it is `aria-hidden` and disabled for reduced motion.
- All internal paths are relative so the site works at a domain root, a GitHub project subpath, or from disk.
