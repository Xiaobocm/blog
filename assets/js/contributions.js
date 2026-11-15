(function () {
  "use strict";

  const section = document.getElementById("github-contributions");
  if (!section) return;

  const calendar = document.getElementById("contribution-calendar");
  const totalEl = document.getElementById("contributions-total");
  const rangeEl = document.getElementById("contributions-range");
  const script = document.currentScript;
  const siteRoot = script
    ? new URL("../../", script.src)
    : new URL("./", window.location.href);
  const endpoint = new URL("content/contributions.json", siteRoot);
  const isChinese = document.documentElement.lang === "zh-Hans";
  const locale = isChinese ? "zh-Hans-CN" : "en";

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const monthFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  const parseDate = (iso) => {
    const [year, month, day] = String(iso).split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const countLabel = (count) => {
    if (isChinese) {
      return count === 0 ? "没有贡献" : `${count} 次贡献`;
    }
    return count === 0
      ? "No contributions"
      : `${count} contribution${count === 1 ? "" : "s"}`;
  };

  const makeCell = (level, title, count) => {
    const cell = document.createElement("span");
    cell.className = "contribution-cell";
    cell.dataset.level = String(level);
    if (count !== undefined) cell.dataset.count = String(count);
    if (title) cell.title = title;
    cell.setAttribute("aria-hidden", "true");
    return cell;
  };

  const render = (data) => {
    if (!calendar || !Array.isArray(data.days) || !data.days.length) return;

    const days = data.days;
    const total = Number.isFinite(data.total)
      ? data.total
      : days.reduce((sum, day) => sum + (Number(day.count) || 0), 0);

    calendar.replaceChildren();

    // GitHub's calendar starts on Sunday. Pad the first week if a different
    // date range is used later.
    const leading = parseDate(days[0].date).getUTCDay();
    for (let i = 0; i < leading; i += 1) {
      const blank = makeCell(0);
      blank.classList.add("is-empty");
      calendar.appendChild(blank);
    }

    for (const day of days) {
      const date = parseDate(day.date);
      const count = Number(day.count) || 0;
      const level = Math.max(0, Math.min(4, Number(day.level) || 0));
      const title = `${dateFormatter.format(date)} · ${countLabel(count)}`;
      calendar.appendChild(makeCell(level, title, count));
    }

    if (totalEl) {
      totalEl.textContent = isChinese
        ? `过去一年共 ${total} 次贡献`
        : `${total} contribution${total === 1 ? "" : "s"} in the last year`;
    }

    if (rangeEl) {
      rangeEl.textContent = `${monthFormatter.format(parseDate(data.start))} – ${monthFormatter.format(parseDate(data.end))}`;
    }

    calendar.setAttribute(
      "aria-label",
      isChinese
        ? `GitHub 贡献日历：${total} 次贡献，${dateFormatter.format(parseDate(data.start))} 至 ${dateFormatter.format(parseDate(data.end))}`
        : `GitHub contribution calendar: ${total} contributions from ${dateFormatter.format(parseDate(data.start))} to ${dateFormatter.format(parseDate(data.end))}`
    );

    section.hidden = false;
  };

  const load = async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      render(data);
    } catch (_) {
      // Keep the section hidden when the snapshot is unavailable.
    }
  };

  window.XiaobocmContributions = {
    endpoint: endpoint.href,
    reload: load,
  };

  load();
})();
