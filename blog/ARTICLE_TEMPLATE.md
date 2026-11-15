# Article development template

This is the one-page authoring guide for the `blog/` folder. It is **not** rendered by the site and is not read by any script. Copy it, fill it in, and keep it with the article if that helps.

The blog index and the home-page “Selected notes” are generated from `content/posts.json`. You do not edit `blog/index.html` or `zh/blog/index.html` when adding a note.

---

## 1. Article worksheet

```yaml
slug: your-slug                  # lowercase letters, numbers, hyphens
date: 2026-11-15                 # YYYY-MM-DD
category: building               # models | machines | building | field
title_en: Your English title
title_zh: 你的中文标题
subtitle_en: One line for the index hover preview.
subtitle_zh: 索引悬停预览的一行中文。
description_en: One or two sentences for search/social metadata.
description_zh: 给搜寻与社群摘要的一两句中文。
```

This worksheet is for you; the actual source of truth is one object in `content/posts.json`.

## 2. Add the index entry

Append one object to `content/posts.json`:

```json
{
  "slug": "your-slug",
  "date": "2026-11-15",
  "category": "building",
  "title": {
    "en": "Your English title",
    "zh-Hans": "你的中文标题"
  },
  "subtitle": {
    "en": "One line for the index hover preview.",
    "zh-Hans": "索引悬停预览的一行中文。"
  },
  "draft": false
}
```

Use `"draft": true` while writing. Drafts are hidden from both indexes and the home page.

## 3. Create the two pages

```
blog/<slug>/index.html
zh/blog/<slug>/index.html
```

The easiest route is to copy the current post at `blog/seventy-days-third-rebuild/` and its Chinese mirror, then replace the title, metadata, date, category, body, and language links.

### English page: `/blog/<slug>/`

| Target | Relative path |
| --- | --- |
| site root / English home | `../../` |
| Chinese home | `../../zh/` |
| blog index | `../` |
| stylesheet / JS / fonts | `../../assets/...` |
| English RSS | `../../feed.xml` |
| Chinese post | `../../zh/blog/<slug>/` |
| this post | `./` |

### Chinese page: `/zh/blog/<slug>/`

| Target | Relative path |
| --- | --- |
| English home | `../../../` |
| Chinese home | `../../../zh/` |
| Chinese blog index | `../` |
| stylesheet / JS / fonts | `../../../assets/...` |
| Chinese RSS | `../../../zh/feed.xml` |
| English post | `../../../blog/<slug>/` |
| this post | `./` |

Keep every path relative. The site must work at a domain root, a GitHub project subpath, and from disk.

## 4. Article `<main>`

Replace the entire blog-index `<main>` with:

```html
<main id="main" class="post-content">
  <article>
    <header class="post-header">
      <p class="post-date">11-15-2026<span class="post-cat">Building</span></p>
      <h1 class="post-heading">Your English title</h1>
    </header>
    <div class="post-body">
      <p class="lead">Opening paragraph.</p>

      <h2>A section</h2>
      <p>Body copy.</p>

      <blockquote><p>A line worth pulling out.</p></blockquote>

      <ul>
        <li>A list item.</li>
      </ul>

      <pre><code>a code sample</code></pre>
    </div>
  </article>
  <p class="post-footer"><a href="../../">Home</a></p>
</main>
```

For the Chinese page, use the Chinese title and category label, and `首页` for the footer. The Chinese footer path is still `../../` because it points at `/zh/`.

## 5. Head metadata checklist

For each page, update:

- `<html lang="en">` or `<html lang="zh-Hans">`
- `<title>` — `Title — Jason Xi`
- `<meta name="description">`
- `<link rel="canonical">`
- the three `hreflang` links (`en`, `zh-Hans`, `x-default`)
- `og:type` → `article`
- `og:title`, `og:description`, `og:url`
- `twitter:title`, `twitter:description`
- `article:published_time` (`YYYY-MM-DDT09:00:00+08:00`)
- `article:section`
- the `BlogPosting` JSON-LD block
- the two language-switch links and the mobile language-switch links
- the RSS link (English feed on the English page, Chinese feed on the Chinese page)
- `data-build` and the `?v=` queries

`tools/bump-version.py` handles the last item.

## 6. Body HTML

The article styles support:

| Markdown | HTML |
| --- | --- |
| paragraph | `<p>` |
| lead paragraph | `<p class="lead">` |
| heading | `<h2>` or `<h3>` |
| quote | `<blockquote><p>…</p></blockquote>` |
| list | `<ul><li>…</li></ul>` or `<ol>` |
| code block | `<pre><code>…</code></pre>` |
| inline code | `<code>…</code>` |
| link | `<a href="…">…</a>` |
| divider | `<hr>` |

Put alt text on images and captions in a following `<p class="caption">` if needed.

## 7. Categories

| Key | English | Chinese |
| --- | --- | --- |
| `models` | Models | 模型 |
| `machines` | Machines | 机器 |
| `building` | Building | 建造 |
| `field` | Field | 随笔 |

## 8. Validate and publish

```powershell
python tools/validate-content.py
python tools/bump-version.py 2026.11.16.1
```

Then update:

- `sitemap.xml` — add `/blog/<slug>/` and `/zh/blog/<slug>/`
- `feed.xml` — add the English item
- `zh/feed.xml` — add the Chinese item

The blog index and home page update automatically from `content/posts.json`. If the JSON changes but the pages do not, check the browser console for a fetch error and confirm the `content/` folder is deployed next to `index.html`.

## 9. One-paragraph template

> Seventy days ago I published the last note. Today I am publishing another one. I want to remember what changed, what I removed, and what I am still learning. If you find a bug, tell me. If you have a better question, tell me that too.
