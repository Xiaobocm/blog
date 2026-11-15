/* ==========================================================================
   Navigation, blog interactions, and the small freshness check.
   ========================================================================== */

(() => {
  "use strict";

  const doc = document.documentElement;
  const body = document.body;
  const script = document.currentScript;
  const siteRoot = script
    ? new URL("../../", script.src)
    : new URL("./", window.location.href);
  const contentEndpoint = new URL("content/posts.json", siteRoot);
  const pageLang = doc.lang === "zh-Hans" ? "zh-Hans" : "en";

  /* ------------------------------------------------------------------------
     Light / dark theme
     ------------------------------------------------------------------------ */

  const themeToggle = document.querySelector(".theme-toggle");
  const themeKey = "xb-theme";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  const readTheme = () => {
    try {
      const value = window.localStorage.getItem(themeKey);
      return value === "light" || value === "dark" ? value : null;
    } catch (_) {
      return null;
    }
  };

  const applyTheme = (theme, persist) => {
    doc.dataset.theme = theme;

    if (themeToggle) {
      const isDark = theme === "dark";
      const label = isDark
        ? themeToggle.dataset.lightLabel || "Switch to light theme"
        : themeToggle.dataset.darkLabel || "Switch to dark theme";
      themeToggle.setAttribute("aria-label", label);
      themeToggle.setAttribute("title", label);
    }

    if (persist) {
      try {
        window.localStorage.setItem(themeKey, theme);
      } catch (_) {
        // Private mode can block storage. The current page still switches.
      }
    }

    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = theme === "dark" ? "#0d151a" : "#fbfaf6";
    document.head.appendChild(meta);
  };

  let currentTheme =
    doc.dataset.theme || readTheme() || (systemTheme.matches ? "dark" : "light");
  applyTheme(currentTheme, false);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(currentTheme, true);
    });
  }

  if (systemTheme.addEventListener) {
    systemTheme.addEventListener("change", (event) => {
      if (readTheme()) return;
      currentTheme = event.matches ? "dark" : "light";
      applyTheme(currentTheme, false);
    });
  }

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */

  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".site-nav");

  if (hamburger && nav) {
    const label = hamburger.querySelector(".sr-only");

    const setMenu = (open) => {
      nav.classList.toggle("active", open);
      body.classList.toggle("menu-open", open);
      hamburger.setAttribute("aria-expanded", String(open));
      if (label) {
        const nextLabel = open
          ? hamburger.dataset.closeLabel || "Close menu"
          : hamburger.dataset.openLabel || "Open menu";
        label.textContent = nextLabel;
      }
    };

    hamburger.addEventListener("click", () => {
      setMenu(!nav.classList.contains("active"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("active")) {
        setMenu(false);
        hamburger.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("active")) return;
      if (nav.contains(event.target) || hamburger.contains(event.target)) return;
      setMenu(false);
    });

    const desktop = window.matchMedia("(min-width: 769px)");
    if (desktop.addEventListener) {
      desktop.addEventListener("change", (event) => {
        if (event.matches) setMenu(false);
      });
    }
  }

  /* ------------------------------------------------------------------------
     Content: content/posts.json
     The blog index and the "Selected notes" list are rendered from one JSON
     file. An empty array is a valid, intentional state.
     ------------------------------------------------------------------------ */

  const blogList = document.getElementById("blog-list");
  const latestNotes = document.getElementById("latest-notes");
  const preview = document.querySelector(".hover-preview");
  const subtitle = document.querySelector(".preview-subtitle");
  const branchSvg = document.querySelector(".branch-svg");
  const branchPath = document.querySelector(".branch-path");
  const legend = document.querySelector(".category-legend");

  let contentPosts = [];

  const localize = (value) => {
    if (value && typeof value === "object") {
      return value[pageLang] || value.en || value["zh-Hans"] || "";
    }
    return value || "";
  };

  const formatDate = (iso) => {
    const [year, month, day] = String(iso).split("-");
    if (!year || !month || !day) return iso;
    return `${Number(month)}-${Number(day)}-${year}`;
  };

  const formatShortDate = (iso) => {
    const [, month, day] = String(iso).split("-");
    if (!month || !day) return iso;
    return `${Number(month)}.${Number(day)}`;
  };

  const postHref = (slug, context) => {
    if (context === "blog") return `./${encodeURIComponent(slug)}/`;
    return pageLang === "zh-Hans"
      ? `./zh/blog/${encodeURIComponent(slug)}/`
      : `./blog/${encodeURIComponent(slug)}/`;
  };

  const renderEmpty = (container, text) => {
    container.replaceChildren();
    if (!text) return;

    if (container.id === "latest-notes") {
      const empty = document.createElement("p");
      empty.className = "notes-empty";
      empty.textContent = text;
      container.appendChild(empty);
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "blog-empty";

    const label = document.createElement("p");
    label.className = "eyebrow";
    label.textContent = container.dataset.emptyLabel || "Notes";

    const body = document.createElement("p");
    body.textContent = text;

    wrapper.append(label, body);
    container.appendChild(wrapper);
  };

  const renderBlog = (posts) => {
    if (!blogList) return;

    if (!posts.length) {
      if (legend) legend.hidden = true;
      renderEmpty(blogList, blogList.dataset.empty || "No notes yet.");
      return;
    }

    if (legend) legend.hidden = false;
    blogList.replaceChildren();

    for (const post of posts) {
      const category = ["models", "machines", "building", "field"].includes(post.category)
        ? post.category
        : "field";
      const link = document.createElement("a");
      link.className = `blog-entry ${category}`;
      link.href = postHref(post.slug, "blog");
      link.dataset.subtitle = localize(post.subtitle);

      const date = document.createElement("span");
      date.className = "blog-date";
      date.textContent = formatDate(post.date);

      const title = document.createElement("span");
      title.className = "blog-title";
      title.textContent = localize(post.title);

      link.append(date, title);
      blogList.appendChild(link);
    }
  };

  const renderLatestNotes = (posts) => {
    if (!latestNotes) return;

    if (!posts.length) {
      renderEmpty(latestNotes, latestNotes.dataset.empty || "No notes yet.");
      return;
    }

    latestNotes.replaceChildren();

    for (const post of posts.slice(0, 3)) {
      const link = document.createElement("a");
      link.className = "note-row";
      link.href = postHref(post.slug, "home");

      const date = document.createElement("span");
      date.className = "note-date";
      date.textContent = formatShortDate(post.date);

      const title = document.createElement("span");
      title.className = "note-title";
      title.textContent = localize(post.title);

      const arrow = document.createElement("span");
      arrow.className = "note-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";

      link.append(date, title, arrow);
      latestNotes.appendChild(link);
    }
  };

  const placePreview = () => {
    if (!blogList || !preview) return false;
    const viewportWidth = window.innerWidth;
    const listRight = blogList.getBoundingClientRect().right;
    const left = Math.max(
      viewportWidth / 2 + (viewportWidth >= 1400 ? 220 : 120),
      listRight + 40
    );
    const width = Math.min(viewportWidth >= 1400 ? 360 : 320, viewportWidth - 32 - left);
    if (width < 200) return false;

    preview.style.left = `${left}px`;
    preview.style.width = `${width}px`;
    return true;
  };

  const drawBranch = (entry) => {
    if (!branchSvg || !branchPath || !preview) return;
    const title = entry.querySelector(".blog-title");
    if (!title) return;

    const from = title.getBoundingClientRect();
    const to = preview.getBoundingClientRect();
    const sx = from.right + 12;
    const sy = from.top + from.height / 2;
    const ex = to.left - 16;
    const ey = to.top + to.height / 2;
    const bend = (ex - sx) * 0.45;

    branchPath.setAttribute(
      "d",
      `M ${sx} ${sy} C ${sx + bend} ${sy}, ${ex - bend} ${ey}, ${ex} ${ey}`
    );

    const length = branchPath.getTotalLength();
    branchPath.style.transition = "none";
    branchPath.style.strokeDasharray = String(length);
    branchPath.style.strokeDashoffset = String(length);
    branchPath.getBoundingClientRect();
    branchPath.style.transition = "";
    branchPath.style.strokeDashoffset = "0";
  };

  const hidePreview = () => {
    if (preview) preview.classList.remove("visible");
    if (branchSvg) branchSvg.classList.remove("visible");
  };

  if (blogList && preview && subtitle) {
    blogList.addEventListener("mouseover", (event) => {
      const entry = event.target.closest(".blog-entry");
      if (!entry || entry.contains(event.relatedTarget)) return;
      if (window.innerWidth <= 768 || !placePreview()) return;

      subtitle.textContent = entry.dataset.subtitle || "";
      preview.classList.add("visible");
      drawBranch(entry);
      if (branchSvg) branchSvg.classList.add("visible");
    });

    blogList.addEventListener("mouseout", (event) => {
      const entry = event.target.closest(".blog-entry");
      if (!entry || entry.contains(event.relatedTarget)) return;
      hidePreview();
    });
  }

  if (legend) {
    let activeFilter = null;

    const applyFilter = (category) => {
      if (!blogList) return;
      activeFilter = category;
      legend.querySelectorAll(".legend-item").forEach((item) => {
        const active = item.dataset.category === category;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      blogList.querySelectorAll(".blog-entry").forEach((entry) => {
        entry.classList.toggle("hidden", !entry.classList.contains(category));
      });
    };

    legend.addEventListener("click", (event) => {
      const item = event.target.closest(".legend-item");
      if (!item) return;
      const category = item.dataset.category;

      if (activeFilter === category) {
        activeFilter = null;
        legend.querySelectorAll(".legend-item").forEach((legendItem) => {
          legendItem.classList.remove("active");
          legendItem.setAttribute("aria-pressed", "false");
        });
        blogList.querySelectorAll(".blog-entry").forEach((entry) => {
          entry.classList.remove("hidden");
        });
        return;
      }

      applyFilter(category);
    });
  }

  const loadContent = async () => {
    if (!blogList && !latestNotes) return;
    try {
      const response = await fetch(contentEndpoint, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const posts = Array.isArray(data.posts)
        ? data.posts
            .filter((post) => post && !post.draft && post.slug && post.date)
            .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        : [];
      contentPosts = posts;
      renderBlog(posts);
      renderLatestNotes(posts);
    } catch (_) {
      // Leave the static empty state in place if the JSON is unavailable.
    }
  };

  window.XiaobocmContent = {
    endpoint: contentEndpoint.href,
    reload: loadContent,
    get posts() {
      return contentPosts;
    },
  };

  loadContent();

  /* ------------------------------------------------------------------------
     Fresh HTML
     GitHub Pages does not let us set Cache-Control. So:
       1. every page asks for build.json with cache: "no-store";
       2. if the deployed build is newer, it reloads once;
       3. the service worker serves navigations network-first.
     ------------------------------------------------------------------------ */

  if (script) {
    fetch(new URL("build.json", siteRoot), { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !data.version) return;

        const current = doc.dataset.build;
        if (!current || current === data.version) return;

        const guard = `xb:reload:${data.version}`;
        try {
          if (sessionStorage.getItem(guard)) return;
          sessionStorage.setItem(guard, "1");
        } catch (_) {
          return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set("v", data.version);
        window.location.replace(url.href);
      })
      .catch(() => {
        // Offline or blocked: the page already works.
      });

    if ("serviceWorker" in navigator) {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "[::1]";

      if (window.location.protocol === "https:" || isLocal) {
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register(new URL("sw.js", siteRoot), { scope: siteRoot.pathname })
            .catch(() => {
              // A page should never depend on a service worker.
            });
        });
      }
    }
  }
})();
