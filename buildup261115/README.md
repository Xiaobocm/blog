# Jason Xi — minimal edition

A quiet, bilingual personal site for **Jason Xi (Xiaobocm)**.

- 650px serif reading column with a small portrait at the top
- a sea-blue particle field
- **Now**, **Working principles**, **Selected notes**, and **Off the clock** sections
- centred `About` / `Blog` navigation with X, GitHub, SinoFlare, and RSS
- English / 简体中文 switching
- light / dark theme toggle, defaulting to the system preference
- a GitHub contribution heatmap, snapshotted daily by a GitHub Action
- build-version checking and a network-first service worker

Personal motto: **一跃苍穹 破晓而生** — *Leap to sky, born of dawn.*

The blog currently has two published notes. `content/posts.json` drives the index and the home-page preview; see [DEVELOPMENT.md](DEVELOPMENT.md).

## Pages

| Path | What it is |
| --- | --- |
| `/` | English home. |
| `/blog/` | English blog index, populated from `content/posts.json`. |
| `/zh/` | Simplified Chinese home. |
| `/zh/blog/` | Chinese blog index, populated from the same data. |
| `/blog/seventy-days-third-rebuild/` | “Seventy Days, a Third Rebuild.” |
| `/zh/blog/seventy-days-third-rebuild/` | Chinese mirror of the same note. |
| `/blog/research-together/` | “What Co-Founding SinoFlare Taught Me About Research.” |
| `/zh/blog/research-together/` | Chinese mirror of the SinoFlare note. |
| `/about/` | Redirects to `/`. |
| `/zh/about/` | Redirects to `/zh/`. |
| `/404.html`, `/zh/404.html` | Not-found pages. |
| `/offline.html`, `/zh/offline.html` | Offline fallbacks, chosen by the service worker. |
| `/feed.xml`, `/zh/feed.xml` | English and Chinese RSS for published notes. |

## Content interface

`content/posts.json` drives both the blog index and the three “Selected notes” on the home page. An empty array is valid:

```json
{
  "posts": []
}
```

The renderer is `assets/js/site.js`; it exposes:

```js
window.XiaobocmContent = {
  endpoint: ".../content/posts.json",
  posts: [],
  reload: async () => {}
};
```

The schema is `content/posts.schema.json`. Validate content and page pairs with:

```powershell
python tools/validate-content.py
```

Full authoring instructions, the post-page skeleton, categories, and the theme/language hooks are in [DEVELOPMENT.md](DEVELOPMENT.md). The copy/paste worksheet is [blog/ARTICLE_TEMPLATE.md](blog/ARTICLE_TEMPLATE.md).

## GitHub heatmap

GitHub does not provide a public, CORS-friendly contribution-calendar API. The site therefore uses:

- `.github/workflows/refresh-contributions.yml` — runs daily and on demand
- `tools/fetch-contributions.py` — snapshots the public contribution calendar
- `content/contributions.json` — same-origin data fetched by `assets/js/contributions.js`

No token is exposed to the browser. Refresh manually with:

```powershell
python tools/fetch-contributions.py
```

The GitHub section is hidden automatically if the snapshot is unavailable.

## Language switching

The `EN / 简` control switches between static English and Chinese pages:

- `/` ↔ `/zh/`
- `/blog/` ↔ `/zh/blog/`
- future notes: `/blog/<slug>/` ↔ `/zh/blog/<slug>/`

Each page has matching `lang` and `hreflang` metadata.

## Theme switching

The moon/sun button switches light and dark mode.

- Default: the system `prefers-color-scheme`
- Stored choice: `localStorage` key `xb-theme`
- Applied before paint by an inline script in each `<head>`
- Without JavaScript, the CSS media query still applies

## Preview locally

All internal links and asset paths are relative, so the site works at a custom-domain root, a GitHub project subpath, and when opening `index.html` from disk.

```powershell
python -m http.server 8000
```

Open <http://127.0.0.1:8000/> or <http://127.0.0.1:8000/zh/>.

The empty states at `/blog/` and `/zh/blog/` appear only if `content/posts.json` has no published notes.

## Deploy to GitHub Pages

1. Create a repository. For clean root paths, use `Xiaobocm.github.io`. A repo called `blog` also works with the custom domain.
2. Put the **contents of this folder** at the repository root.
3. Push to `main`.
4. **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
5. `CNAME` already contains `blog.xiaobocm.com`.
6. DNS: add a `CNAME` record for `blog` pointing to `Xiaobocm.github.io`. Use DNS-only mode first (not proxied).
7. In Pages, set the custom domain to `blog.xiaobocm.com` and enable **Enforce HTTPS**.

`.nojekyll` is included.

## Fresh HTML

1. `no-cache` meta tags in every page.
2. A `build.json` version check reloads once when the deployed build changes.
3. `sw.js` serves navigations network-first.

Before publishing:

```powershell
python tools/bump-version.py 2026.12.01.1
```

## Type and colour

- **English body:** Spectral, 17px on home / 12.5pt in notes.
- **Chinese body:** system Simplified Chinese serif stack.
- **Code and labels:** Space Mono.
- **Light:** warm paper `#fbfaf6`, ink `#162126`, sea-blue accents.
- **Dark:** deep sea `#0d151a`, soft text `#dfe9ed`.

## Credits

- Layout starting point: [nathanchen.me](https://nathanchen.me/).
- Avatar: supplied by Jason Xi.
- Spectral and Space Mono: SIL Open Font License, files in `assets/fonts/`.
- Writing and images: © Jason Xi.
