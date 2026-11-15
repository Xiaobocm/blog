#!/usr/bin/env python3
"""Validate the blog index contract and the pages it points at.

Usage:
    python tools/validate-content.py
"""

from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS = ROOT / "content" / "posts.json"
SCHEMA = ROOT / "content" / "posts.schema.json"
BASE = "https://blog.xiaobocm.com"
SLUG = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
CATEGORIES = {"models", "machines", "building", "field"}
LANGS = {"en", "zh-Hans"}

errors: list[str] = []
warnings: list[str] = []


def localized(value, field: str, slug: str) -> None:
    if not isinstance(value, dict):
        errors.append(f"{slug}: {field} must be an object")
        return
    for lang in LANGS:
        text = value.get(lang)
        if not isinstance(text, str) or not text.strip():
            errors.append(f"{slug}: {field}.{lang} must be a non-empty string")
    extra = set(value) - LANGS
    if extra:
        warnings.append(f"{slug}: {field} has unknown language keys: {', '.join(sorted(extra))}")


def main() -> int:
    if not POSTS.exists():
        print("Missing content/posts.json")
        return 1
    if not SCHEMA.exists():
        errors.append("Missing content/posts.schema.json")

    try:
        data = json.loads(POSTS.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON: {exc}")
        return 1

    if not isinstance(data, dict) or not isinstance(data.get("posts"), list):
        print("content/posts.json must contain { \"posts\": [] }")
        return 1

    seen: set[str] = set()
    published: list[dict] = []

    for index, post in enumerate(data["posts"]):
        if not isinstance(post, dict):
            errors.append(f"post #{index}: must be an object")
            continue

        slug = post.get("slug")
        if not isinstance(slug, str) or not SLUG.fullmatch(slug):
            errors.append(f"post #{index}: invalid slug")
            continue
        if slug in seen:
            errors.append(f"{slug}: duplicate slug")
        seen.add(slug)

        date = post.get("date")
        if not isinstance(date, str) or not DATE.fullmatch(date):
            errors.append(f"{slug}: date must be YYYY-MM-DD")
        else:
            try:
                year, month, day = (int(part) for part in date.split("-"))
                import datetime

                datetime.date(year, month, day)
            except ValueError:
                errors.append(f"{slug}: date is not a real calendar date")

        category = post.get("category")
        if category not in CATEGORIES:
            errors.append(f"{slug}: category must be one of {', '.join(sorted(CATEGORIES))}")

        localized(post.get("title"), "title", slug)
        localized(post.get("subtitle"), "subtitle", slug)

        draft = post.get("draft", False)
        if not isinstance(draft, bool):
            errors.append(f"{slug}: draft must be true or false")

        allowed = {"slug", "date", "category", "title", "subtitle", "draft"}
        extra = set(post) - allowed
        if extra:
            warnings.append(f"{slug}: unknown keys ignored: {', '.join(sorted(extra))}")

        if not draft:
            published.append(post)
            for page in (ROOT / "blog" / slug / "index.html", ROOT / "zh" / "blog" / slug / "index.html"):
                if not page.exists():
                    errors.append(f"{slug}: missing {page.relative_to(ROOT)}")

    # Helpful feed/sitemap checks. They are warnings because a draft or a
    # deliberately excluded note can be valid.
    try:
        sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
        locs = {node.text for node in sitemap.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
        for post in published:
            for path in (f"/blog/{post['slug']}/", f"/zh/blog/{post['slug']}/"):
                if f"{BASE}{path}" not in locs:
                    warnings.append(f"{post['slug']}: {path} is not in sitemap.xml")
    except Exception as exc:
        warnings.append(f"Could not check sitemap.xml: {exc}")

    print(f"posts: {len(data['posts'])} · published: {len(published)} · drafts: {len(data['posts']) - len(published)}")
    for warning in warnings:
        print(f"WARN  {warning}")
    for error in errors:
        print(f"ERROR {error}")

    if errors:
        print(f"\n{len(errors)} error(s).")
        return 1

    print("Content contract OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
