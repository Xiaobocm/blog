#!/usr/bin/env python3
"""Snapshot the public GitHub contribution calendar into JSON.

GitHub does not expose the profile calendar as a public, CORS-friendly JSON
API. This script reads the public contributions HTML (no token required) so a
GitHub Action can commit a same-origin snapshot that the static site can fetch.

Usage:
    python tools/fetch-contributions.py
    python tools/fetch-contributions.py --username xiaobocm --out content/contributions.json
"""

from __future__ import annotations

import argparse
import html
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_USER = "xiaobocm"
DEFAULT_OUT = ROOT / "content" / "contributions.json"


def fetch_html(username: str) -> str:
    url = f"https://github.com/users/{username}/contributions"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "xiaobocm-site-contribution-snapshot/1.0",
            "Accept": "text/html",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def attr(tag: str, name: str) -> str:
    match = re.search(rf'\b{re.escape(name)}="([^"]*)"', tag)
    return html.unescape(match.group(1)) if match else ""


def parse(html_text: str, username: str) -> dict:
    total_match = re.search(r">\s*([\d,]+)\s+contributions\s+in the last year", html_text)
    page_total = int(total_match.group(1).replace(",", "")) if total_match else None

    tips: dict[str, str] = {}
    for tip in re.finditer(r"<tool-tip\b[^>]*\bfor=\"([^\"]+)\"[^>]*>(.*?)</tool-tip>", html_text, re.S):
        text = re.sub(r"<[^>]+>", "", tip.group(2))
        tips[tip.group(1)] = " ".join(html.unescape(text).split())

    days: list[dict] = []
    for tag in re.findall(r"<td\b[^>]*>", html_text):
        date = attr(tag, "data-date")
        if not date:
            continue
        level = int(attr(tag, "data-level") or "0")
        tooltip = tips.get(attr(tag, "id"), "")
        count_match = re.match(r"(\d[\d,]*)\s+contributions?\b", tooltip)
        if count_match:
            count = int(count_match.group(1).replace(",", ""))
        elif tooltip.startswith("No contributions"):
            count = 0
        else:
            count = 0
        days.append({"date": date, "count": count, "level": max(0, min(4, level))})

    days.sort(key=lambda item: item["date"])
    if len(days) < 300:
        raise SystemExit(f"Only found {len(days)} contribution days; GitHub markup may have changed.")

    total = sum(item["count"] for item in days)
    if page_total is not None and page_total != total:
        print(f"Warning: page total {page_total} != parsed tooltip total {total}; using parsed total.")
        total = page_total

    return {
        "username": username,
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "start": days[0]["date"],
        "end": days[-1]["date"],
        "total": total,
        "days": days,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", default=DEFAULT_USER)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    data = parse(fetch_html(args.username), args.username)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"{args.username}: {data['total']} contributions, "
        f"{data['start']} to {data['end']}, {len(data['days'])} days -> {args.out}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
