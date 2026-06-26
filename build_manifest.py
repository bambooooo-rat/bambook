"""Build the static Bambook site index.

Run this file after adding course files, Markdown articles, or a tool folder.
The browser reads only site-manifest.json, which keeps the public site compatible
with GitHub Pages and other static hosts.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent
MATERIALS_DIR = ROOT / "materials"
CONTENT_DIR = ROOT / "content"
OTHER_DIR = ROOT / "other"


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


def parse_handouts(directory: Path) -> list[dict[str, str | None]]:
    grouped: dict[str, dict[str, str | None]] = {}
    for file_path in pdf_files(directory):
        stem = file_path.stem
        kind = "blank"
        if "解答" in stem:
            kind = "sol"
        title = re.sub(r"[_\- ]?(填空版|解答版)$", "", stem).strip() or stem
        item = grouped.setdefault(title, {"title": title, "blank": None, "sol": None})
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
        materials[course_dir.name] = {
            "syllabus": web_path(syllabus) if syllabus else None,
            "textbooks": [parse_textbook(file_path) for file_path in pdf_files(course_dir / "textbook")],
            "handouts": parse_handouts(course_dir / "handout"),
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


def build_articles() -> list[dict[str, Any]]:
    if not CONTENT_DIR.is_dir():
        return []
    articles = []
    for file_path in sorted(CONTENT_DIR.rglob("*.md"), key=lambda item: item.as_posix().casefold()):
        metadata, body = parse_front_matter(file_path.read_text(encoding="utf-8-sig"))
        fallback_title = file_path.stem.replace("-", " ")
        tags = [tag.strip() for tag in metadata.get("tags", "").replace("，", ",").split(",") if tag.strip()]
        articles.append({
            "path": file_path.relative_to(CONTENT_DIR).as_posix(),
            "title": metadata.get("title") or first_heading(body, fallback_title),
            "date": metadata.get("date", ""),
            "tags": tags,
            "summary": metadata.get("summary", ""),
        })
    return sorted(articles, key=lambda item: (item["date"], item["path"]), reverse=True)


def html_title(index_file: Path) -> str:
    source = index_file.read_text(encoding="utf-8-sig", errors="replace")
    match = re.search(r"<title[^>]*>(.*?)</title>", source, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return index_file.parent.name
    title = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", match.group(1)))).strip()
    return title or index_file.parent.name


def read_tool_metadata(tool_dir: Path) -> dict[str, Any]:
    metadata_file = tool_dir / "tool.json"
    if not metadata_file.is_file():
        return {}
    try:
        value = json.loads(metadata_file.read_text(encoding="utf-8-sig"))
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError as error:
        print(f"Warning: ignored invalid JSON in {metadata_file.name}: {error}")
        return {}


def build_tools() -> list[dict[str, Any]]:
    if not OTHER_DIR.is_dir():
        return []
    tools = []
    for tool_dir in sorted((item for item in OTHER_DIR.iterdir() if item.is_dir() and item.name.casefold() != "private"), key=lambda item: item.name.casefold()):
        index_file = next((tool_dir / name for name in ("index.html", "index.htm") if (tool_dir / name).is_file()), None)
        if not index_file:
            continue
        metadata = read_tool_metadata(tool_dir)
        title = tool_dir.name
        raw_tags = metadata.get("tags", [])
        tags = [str(tag).strip() for tag in raw_tags] if isinstance(raw_tags, list) else []
        try:
            order = int(metadata.get("order", 999))
        except (TypeError, ValueError):
            order = 999
        tools.append({
            "order": order,
            "id": tool_dir.name,
            "path": f"other/{tool_dir.name}/",
            "title": title,
            "description": str(metadata.get("description") or f"開啟「{title}」。"),
            "icon": str(metadata.get("icon") or "↗"),
            "tags": tags,
            "action": str(metadata.get("action") or "開啟工具 →"),
        })
    tools.sort(key=lambda item: (item.pop("order"), item["title"].casefold()))
    return tools


def build_manifest() -> dict[str, Any]:
    return {
        "schema": 1,
        "materials": build_materials(),
        "articles": build_articles(),
        "tools": build_tools(),
    }


def write_manifest(output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.write_text(json.dumps(build_manifest(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, output)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Bambook's static site-manifest.json.")
    parser.add_argument("-o", "--output", type=Path, default=ROOT / "site-manifest.json", help="Output path (default: site-manifest.json)")
    args = parser.parse_args()
    output = args.output if args.output.is_absolute() else ROOT / args.output
    write_manifest(output)
    print(f"Built {output.relative_to(ROOT) if output.is_relative_to(ROOT) else output}")


if __name__ == "__main__":
    main()
