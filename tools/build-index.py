"""Build Bambook static indexes.

平常不用手動執行：commit 時 scripts/hooks/pre-commit 會自動跑（設定方式見 README）。

Canonical workflow:
  python tools/build-index.py

This keeps GitHub Pages compatible: the browser reads generated JSON files,
not directory listings. Run this after adding course files, Markdown
articles, or an entry (tool/work) under entries/.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import shutil
import unicodedata
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
MATERIALS_DIR = ROOT / "materials"
CONTENT_DIR = ROOT / "content"
ENTRIES_DIR = ROOT / "entries"

# 網站公開網址：連結預覽（og:url、og:image）必須是完整網址。換網域時改這裡。
SITE_URL = os.environ.get("BAMBOOK_SITE_URL", "https://bambooooo-rat.github.io/bambook/")

# 產生的短網址頁面：a/<slug>/index.html（文章）、c/<課程>/index.html（課程）。
# 每頁放一個標記檔，重建時只清掉帶標記的舊頁面，不會誤刪手動放的東西。
SHORT_DIRS = {"article": "a", "course": "c"}
GENERATED_MARK = ".generated"


def configure(root: Path) -> None:
    """測試用：把所有路徑指到另一個網站根目錄。"""
    global ROOT, MATERIALS_DIR, CONTENT_DIR, ENTRIES_DIR
    ROOT = Path(root).resolve()
    MATERIALS_DIR = ROOT / "materials"
    CONTENT_DIR = ROOT / "content"
    ENTRIES_DIR = ROOT / "entries"


def web_path(path: Path) -> str:
    """Return a URL-safe, forward-slash path relative to the site root."""
    return path.relative_to(ROOT).as_posix()


def pdf_files(directory: Path) -> list[Path]:
    if not directory.is_dir():
        return []
    return sorted((item for item in directory.iterdir() if item.is_file() and item.suffix.lower() == ".pdf"), key=lambda item: item.name.casefold())


def find_named_file(directory: Path, filename: str) -> Path | None:
    if not directory.is_dir():
        return None
    return next((item for item in directory.iterdir() if item.is_file() and item.name.casefold() == filename.casefold()), None)


def parse_textbook(file_path: Path) -> dict[str, str]:
    parts = file_path.stem.split(" - ")
    return {
        "title": parts[0].strip(),
        "author": parts[1].strip() if len(parts) > 1 else "",
        "version": " - ".join(parts[2:]).strip() if len(parts) > 2 else "",
        "path": web_path(file_path),
    }


# "quiz" 開頭的檔名（quiz4_題目.pdf／quiz4_解答.pdf）是小考題目／解答，跟
# 講義放在同一個 handout/ 資料夾裡，但走獨立的 parse_quizzes() 處理、有自己
# 的檔名後綴（題目／解答，不是填空／解答）——這裡要先排除，不然會被誤判
# 成一份「填空」版本缺失的講義。
QUIZ_FILENAME_PREFIX = re.compile(r"(?i)^quiz")


def parse_handouts(directory: Path) -> list[dict[str, str | None]]:
    grouped: dict[str, dict[str, str | None]] = {}
    for file_path in pdf_files(directory):
        stem = file_path.stem
        if QUIZ_FILENAME_PREFIX.match(stem):
            continue
        kind = "blank"
        if "解答" in stem:
            kind = "sol"
        title = re.sub(r"[_\- ]?(填空|解答)$", "", stem).strip() or stem
        item = grouped.setdefault(title, {"title": title, "blank": None, "sol": None})
        item[kind] = web_path(file_path)
    return [grouped[key] for key in sorted(grouped, key=str.casefold)]


# 小考題目／解答跟講義放在同一個 handout/ 資料夾裡，檔名慣例是
# "quiz<編號>_題目.pdf"／"quiz<編號>_解答.pdf"（例如 quiz4_題目.pdf、
# quiz4_解答.pdf），去掉後綴、以 "quiz4" 這個字串分組、歸成同一筆資料，
# 跟 parse_handouts() 的講義分組邏輯是同一套做法。題目／解答兩個檔案可以
# 只存在一個——缺的那一半就留 None，網頁那邊本來就只在有檔案時才顯示按鈕。
def parse_quizzes(directory: Path) -> list[dict[str, str | None]]:
    grouped: dict[str, dict[str, str | None]] = {}
    for file_path in pdf_files(directory):
        stem = file_path.stem
        if not QUIZ_FILENAME_PREFIX.match(stem):
            continue
        if "題目" in stem:
            kind = "problem"
        elif "解答" in stem:
            kind = "solution"
        else:
            continue
        title = re.sub(r"[_\- ]?(題目|解答)$", "", stem).strip() or stem
        item = grouped.setdefault(title, {"title": title, "problem": None, "solution": None})
        item[kind] = web_path(file_path)
    return [grouped[key] for key in sorted(grouped, key=str.casefold)]


def parse_slides(directory: Path) -> list[dict[str, Any]]:
    if not directory.is_dir():
        return []
    groups = []
    for category in sorted((item for item in directory.iterdir() if item.is_dir()), key=lambda item: item.name.casefold()):
        files = [{"name": file_path.stem, "path": web_path(file_path)} for file_path in pdf_files(category)]
        if files:
            groups.append({"category": category.name, "files": files})
    return groups


def parse_links(file_path: Path | None) -> list[dict[str, str]]:
    if not file_path:
        return []
    links = []
    for raw_line in file_path.read_text(encoding="utf-8-sig").splitlines():
        title, separator, url = raw_line.partition("|")
        if separator and title.strip() and url.strip():
            links.append({"title": title.strip(), "url": url.strip()})
    return links


def read_json_object(file_path: Path) -> dict[str, Any]:
    try:
        value = json.loads(file_path.read_text(encoding="utf-8-sig"))
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError as error:
        print(f"Warning: ignored invalid JSON in {file_path.relative_to(ROOT)}: {error}")
        return {}


def normalise_tag_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(tag).strip() for tag in value if str(tag).strip()]
    return [tag.strip() for tag in re.split(r"[,，、]+", str(value or "")) if tag.strip()]


def parse_practice(directory: Path) -> dict[str, list[dict[str, str]]]:
    result: dict[str, list[dict[str, str]]] = {
        "links": parse_links(find_named_file(directory, "links.txt")),
        "exams": [],
        "midterm_answers": [],
        "final_answers": [],
        "other_answers": [],
    }
    if not directory.is_dir():
        return result

    result["exams"] = [{"name": file_path.stem, "path": web_path(file_path)} for file_path in pdf_files(directory)]
    answer_dir = directory / "answer"
    for file_path in pdf_files(answer_dir):
        item = {"name": file_path.stem, "path": web_path(file_path)}
        if "期中" in file_path.stem:
            result["midterm_answers"].append(item)
        elif "期末" in file_path.stem:
            result["final_answers"].append(item)
        else:
            result["other_answers"].append(item)
    return result


def build_materials() -> dict[str, Any]:
    materials: dict[str, Any] = {}
    if not MATERIALS_DIR.is_dir():
        return materials

    for course_dir in sorted((item for item in MATERIALS_DIR.iterdir() if item.is_dir()), key=lambda item: item.name.casefold()):
        syllabus = find_named_file(course_dir, "syllabus.json")
        schedule = find_named_file(course_dir, "schedule.json")
        materials[course_dir.name] = {
            "syllabus": web_path(syllabus) if syllabus else None,
            "schedule": web_path(schedule) if schedule else None,
            "textbooks": [parse_textbook(file_path) for file_path in pdf_files(course_dir / "textbook")],
            "handouts": parse_handouts(course_dir / "handout"),
            "quizzes": parse_quizzes(course_dir / "handout"),
            "slides": parse_slides(course_dir / "slide"),
            "practice": parse_practice(course_dir / "practice"),
        }
    return materials


def parse_front_matter(source: str) -> tuple[dict[str, str], str]:
    source = source.replace("\r\n", "\n")
    if not source.startswith("---\n"):
        return {}, source
    closing = source.find("\n---", 4)
    if closing == -1:
        return {}, source
    metadata: dict[str, str] = {}
    for line in source[4:closing].strip().splitlines():
        key, separator, value = line.partition(":")
        if separator:
            metadata[key.strip()] = value.strip().strip("\"'")
    return metadata, source[closing + 4 :].lstrip("\n")


def first_heading(source: str, fallback: str) -> str:
    match = re.search(r"^#\s+(.+?)\s*$", source, flags=re.MULTILINE)
    return match.group(1).strip() if match else fallback


DATE_PREFIX = re.compile(r"^\d{4}-\d{2}-\d{2}[-_ ]*")


def slugify(text: str) -> str:
    """短網址用：小寫、保留字母數字（含中文），其他字元換成「-」。"""
    text = unicodedata.normalize("NFKC", str(text or "")).strip().lower()
    text = re.sub(r"[^\w]+", "-", text, flags=re.UNICODE).replace("_", "-")
    return re.sub(r"-{2,}", "-", text).strip("-")


def article_slug(file_path: Path, metadata: dict[str, str]) -> str:
    """front matter 的 slug 優先；否則用檔名去掉開頭的日期。"""
    return slugify(metadata.get("slug") or DATE_PREFIX.sub("", file_path.stem)) or slugify(file_path.stem) or "article"


def plain_summary(body: str, limit: int = 110) -> str:
    """連結預覽用的摘要：第一段正文（跳過標題、圖片、程式碼），去掉 Markdown 記號。"""
    body = re.sub(r"```.*?```", " ", body, flags=re.DOTALL)
    for block in re.split(r"\n\s*\n", body):
        block = block.strip()
        if not block or block.startswith(("#", "!", "|", ">", "<", "---", "$$")):
            continue
        text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", block)
        text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
        text = re.sub(r"[*_`~=>]+", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"
    return ""


def markdown_record(file_path: Path) -> dict[str, Any]:
    metadata, body = parse_front_matter(file_path.read_text(encoding="utf-8-sig"))
    fallback_title = file_path.stem.replace("-", " ")
    tags = normalise_tag_list(metadata.get("tags", ""))
    return {
        "path": file_path.relative_to(CONTENT_DIR).as_posix(),
        "slug": article_slug(file_path, metadata),
        "title": metadata.get("title") or first_heading(body, fallback_title),
        "date": metadata.get("date", ""),
        "tags": tags,
        "summary": metadata.get("summary", ""),
        "excerpt": metadata.get("summary", "") or plain_summary(body),
    }


def build_home_intro() -> dict[str, Any] | None:
    if not CONTENT_DIR.is_dir():
        return None
    direct_articles = sorted((item for item in CONTENT_DIR.glob("*.md") if item.is_file()), key=lambda item: item.name.casefold())
    if not direct_articles:
        return None
    if len(direct_articles) > 1:
        names = ", ".join(item.name for item in direct_articles)
        print(f"Warning: expected one top-level Markdown file in content/, found {len(direct_articles)}: {names}. Using {direct_articles[0].name}.")
    return markdown_record(direct_articles[0])


def build_public_articles() -> list[dict[str, Any]]:
    if not CONTENT_DIR.is_dir():
        return []
    articles = []
    for file_path in sorted(CONTENT_DIR.rglob("*.md"), key=lambda item: item.as_posix().casefold()):
        if file_path.parent == CONTENT_DIR:
            continue
        articles.append(markdown_record(file_path))
    resolve_slug_collisions(articles)
    return sorted(articles, key=lambda item: (item["date"], item["path"]), reverse=True)


def resolve_slug_collisions(articles: list[dict[str, Any]]) -> list[str]:
    """短網址撞名時，在前面加上科目資料夾名稱；還是撞就再加流水號。回傳處理過的說明（給驗證腳本顯示）。"""
    notes = []
    groups: dict[str, list[dict[str, Any]]] = {}
    for item in articles:
        groups.setdefault(item["slug"], []).append(item)
    used = {slug for slug, items in groups.items() if len(items) == 1}
    for slug, items in sorted(groups.items()):
        if len(items) == 1:
            continue
        for item in sorted(items, key=lambda x: x["path"]):
            folder = slugify(item["path"].split("/")[0]) if "/" in item["path"] else ""
            candidate = f"{folder}-{slug}" if folder else slug
            n = 2
            while candidate in used:
                candidate = f"{folder}-{slug}-{n}" if folder else f"{slug}-{n}"
                n += 1
            used.add(candidate)
            notes.append(f"短網址撞名：{item['path']} 改用 {candidate}（可在 front matter 寫 slug: 指定）")
            item["slug"] = candidate
    return notes


def html_title(index_file: Path) -> str:
    source = index_file.read_text(encoding="utf-8-sig", errors="replace")
    match = re.search(r"<title[^>]*>(.*?)</title>", source, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return index_file.parent.name
    title = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", match.group(1)))).strip()
    return title or index_file.parent.name


# Two metadata filenames are recognised inside entries/<type>/<id>/, checked
# in this order — "meta.json" is the current convention; "tool.json" is an
# older convention some tool folders still use. A folder with neither is
# skipped.
ENTRY_METADATA_FILENAMES = ("meta.json", "tool.json")


def build_entries() -> list[dict[str, Any]]:
    """Build public entry cards from entries/<type>/<id>/(meta.json|tool.json).

    Entries are self-contained pages such as tools, works, demos, or other
    independent static pages. The main site only reads their metadata. Any
    new entry folder just needs an index.html (or index.htm) plus one of the
    metadata filenames above — rerunning this script picks it up
    automatically, no other wiring required.
    """
    if not ENTRIES_DIR.is_dir():
        return []

    entries: list[dict[str, Any]] = []
    for type_dir in sorted((item for item in ENTRIES_DIR.iterdir() if item.is_dir()), key=lambda item: item.name.casefold()):
        for entry_dir in sorted((item for item in type_dir.iterdir() if item.is_dir()), key=lambda item: item.name.casefold()):
            metadata_file = next((entry_dir / name for name in ENTRY_METADATA_FILENAMES if (entry_dir / name).is_file()), None)
            index_file = next((entry_dir / name for name in ("index.html", "index.htm") if (entry_dir / name).is_file()), None)
            if not metadata_file or not index_file:
                continue
            metadata = read_json_object(metadata_file)
            visibility = str(metadata.get("visibility") or "public").strip().lower()
            if visibility == "private":
                continue
            entry_type = str(metadata.get("type") or type_dir.name.rstrip("s") or "entry")
            path = f"{web_path(entry_dir)}/"
            title = str(metadata.get("title") or html_title(index_file))
            # "order" is a tool.json-only field for hand-curated positioning.
            order = metadata.get("order")
            entries.append({
                "id": entry_dir.name,
                "type": entry_type,
                "path": str(metadata.get("url") or path),
                "title": title,
                "date": str(metadata.get("date") or ""),
                "status": str(metadata.get("status") or ""),
                "visibility": visibility,
                "description": str(metadata.get("summary") or metadata.get("description") or f"開啟「{title}」。"),
                "summary": str(metadata.get("summary") or metadata.get("description") or ""),
                "tags": normalise_tag_list(metadata.get("tags", [])),
                "thumbnail": str(metadata.get("thumbnail") or metadata.get("cover") or ""),
                "action": str(metadata.get("action") or "開啟頁面 →"),
                "icon": str(metadata.get("icon") or "↗"),
                "order": order if isinstance(order, (int, float)) else None,
            })

    # Entries with an explicit "order" are hand-curated and sort by that
    # number ascending; everything else sorts newest-first (falling back to
    # title).
    ordered = sorted((item for item in entries if item["order"] is not None), key=lambda item: item["order"])
    unordered = sorted(
        (item for item in entries if item["order"] is None),
        key=lambda item: (item.get("date") or "", item["title"].casefold()),
        reverse=True,
    )
    return ordered + unordered


# ---------------------------------------------------------------------------
# 短網址頁面：a/<slug>/、c/<課程>/
# ---------------------------------------------------------------------------
# 每頁只做兩件事：帶連結預覽資訊（LINE、IG、Messenger 會讀 og:*），以及把瀏覽器轉進網站裡對應的頁面。
# 文章的小節：a/<slug>/#<標題代號> 會轉成 #article=<slug>&sec=<標題代號>。
# 預覽只放不會過期的內容（標題、摘要），不放研討日期——頁面在 commit 時產生，日期會過期。
SHORT_PAGE = """<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Bambook</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Bambook">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="1; url={fallback}">
<script>
  (function () {{
    var sec = location.hash.replace(/^#/, "");
    location.replace("{target}" + (sec ? "&sec=" + sec : ""));
  }})();
</script>
<style>body{{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.6 system-ui,"Microsoft JhengHei",sans-serif;color:#2b2b2e;background:#f6f6f6}}a{{color:#1c86d9}}</style>
</head>
<body>
<p>正在開啟〈<a href="{fallback}">{title}</a>〉…</p>
</body>
</html>
"""

OG_IMAGE = "assets/og/bambook.png"


def short_page(kind: str, key: str, title: str, desc: str, target: str) -> str:
    folder = SHORT_DIRS[kind]
    url = SITE_URL + f"{folder}/{key}/"
    return SHORT_PAGE.format(
        title=html.escape(title, quote=True),
        desc=html.escape(desc, quote=True),
        url=html.escape(url, quote=True),
        image=html.escape(SITE_URL + OG_IMAGE, quote=True),
        og_type="article" if kind == "article" else "website",
        # target 只含 ASCII（slug、%XX）：JS 字串與網址都不需要再跳脫
        target="../../" + target,
        fallback=html.escape("../../" + target, quote=True),
    )


def course_description(name: str) -> str:
    return f"{name}的課本、講義、研討時間表與歷屆練習，都整理在這一頁。"


def build_short_pages(manifest: dict[str, Any]) -> dict[str, list[str]]:
    """寫出 a/<slug>/index.html 與 c/<課程>/index.html，並清掉已經不存在的舊頁面。回傳寫出的資料夾名稱。"""
    from urllib.parse import quote

    wanted: dict[str, dict[str, str]] = {"article": {}, "course": {}}
    for item in manifest.get("articles", []):
        wanted["article"][item["slug"]] = short_page(
            "article", item["slug"], item["title"], item.get("excerpt") or item["title"],
            "#article=" + quote(item["slug"], safe=""))
    for name in manifest.get("materials", {}):
        key = slugify(name) or name
        wanted["course"][key] = short_page(
            "course", key, name, course_description(name), "#materials=" + quote(name, safe=""))

    written: dict[str, list[str]] = {}
    for kind, pages in wanted.items():
        base = ROOT / SHORT_DIRS[kind]
        base.mkdir(exist_ok=True)
        for old in base.iterdir():
            if old.is_dir() and (old / GENERATED_MARK).exists() and old.name not in pages:
                shutil.rmtree(old)
        for key, page in pages.items():
            folder = base / key
            folder.mkdir(exist_ok=True)
            target = folder / "index.html"
            if not target.exists() or target.read_text(encoding="utf-8") != page:
                target.write_text(page, encoding="utf-8", newline="\n")
            mark = folder / GENERATED_MARK
            if not mark.exists():
                mark.write_text("由 tools/build-index.py 產生，請勿手動修改。\n", encoding="utf-8")
        written[kind] = sorted(pages)
    return written


def build_manifest() -> dict[str, Any]:
    return {
        "schema": 1,
        "home_intro": build_home_intro(),
        "materials": build_materials(),
        "articles": build_public_articles(),
        "entries": build_entries(),
    }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Bambook's site-manifest.json.")
    parser.add_argument("--manifest", type=Path, default=ROOT / "site-manifest.json", help="Main manifest output path.")
    args = parser.parse_args()

    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest

    manifest = build_manifest()
    write_json(manifest_path, manifest)
    pages = build_short_pages(manifest)

    display = manifest_path.relative_to(ROOT) if manifest_path.is_relative_to(ROOT) else manifest_path
    print(f"Built {display}；短網址頁面：文章 {len(pages['article'])} 篇、課程 {len(pages['course'])} 門")


if __name__ == "__main__":
    main()
