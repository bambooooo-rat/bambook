from __future__ import annotations

import fnmatch
import json
import os
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "reports"

BEGIN = "# === BEGIN AUTO STATIC SITE IGNORE ==="
END = "# === END AUTO STATIC SITE IGNORE ==="

MANAGED_GITIGNORE_BLOCK = f"""{BEGIN}

# Python / local server
__pycache__/
*.py[cod]
.pytest_cache/
.mypy_cache/
.ruff_cache/

# Node / frontend tooling
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Virtual environments
.venv/
venv/
env/

# Local OS/editor files
.DS_Store
Thumbs.db
*.swp
*.swo
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json

# Generated reports and temporary files
repomix-output.xml
tmp/
temp/
.cache/
reports/

# Build outputs
dist/
build/
out/
public/

# Large editable source files not needed by static site
*.psd
*.aep
*.prproj
*.kra
*.clip
*.xcf
*.sketch
*.fig
*.figma

# Archives and backups
*.zip
*.7z
*.rar
*.tar
*.gz
*.bak
*.tmp
*.log

{END}
"""

PRESERVE_FILES = {
    "README.md",
    "LICENSE",
    "CNAME",
    ".nojekyll",
    "tool.json",
    "samples.json",
    "program.json",
    "courses.json",
    "manifest.json",
    "robots.txt",
    "sitemap.xml",
    "favicon.ico",
    "site-manifest.json",
}

TEXT_SUFFIXES = {".html", ".css", ".js", ".json", ".md", ".txt", ".svg", ".xml", ".webmanifest"}
ENTRY_SUFFIXES = {".html", ".css", ".js", ".json", ".md"}
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico"}
AUDIO_SUFFIXES = {".mp3", ".ogg", ".m4a", ".wav", ".flac", ".aiff"}
LARGE_REVIEW_SUFFIXES = {".mp4", ".mov", ".mkv", ".avi", ".wav", ".flac", ".aiff", ".psd", ".ai", ".pdf"}
PATH_PREFIXES = (
    "./",
    "../",
    "/",
    "content/",
    "assets/",
    "materials/",
    "other/",
    "data/",
    "entries/",
    "tools/",
    "templates/",
    "sample/",
    "static/",
)
PATH_SUFFIXES = TEXT_SUFFIXES | IMAGE_SUFFIXES | AUDIO_SUFFIXES | LARGE_REVIEW_SUFFIXES | {
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
    ".m3u",
}

SAFE_DIRS = {
    "node_modules",
    ".venv",
    "venv",
    "env",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".cache",
    ".dist",
    "build",
    "dist",
    "out",
    "tmp",
    "temp",
    "reports",
}

SAFE_FILE_PATTERNS = {
    ".DS_Store",
    "Thumbs.db",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    "*.log",
    "*.tmp",
    "*.bak",
    "*.zip",
    "*.7z",
    "*.rar",
    "*.tar",
    "*.gz",
    "repomix-output.xml",
    "*.psd",
    "*.ai",
    "*.aep",
    "*.prproj",
    "*.blend1",
    "*.kra",
    "*.clip",
    "*.xcf",
    "*.sketch",
    "*.fig",
    "*.figma",
}

EXTERNAL_PREFIXES = ("http://", "https://", "mailto:", "tel:", "data:", "#", "javascript:")

HTML_ATTR_RE = re.compile(r"""(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']""", re.I)
CSS_URL_RE = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", re.I)
JS_FETCH_RE = re.compile(r"""fetch\(\s*["']([^"']+)["']""")
JS_IMPORT_RE = re.compile(r"""(?:import\s*(?:[^"'()]*?\s+from\s*)?|import\()\s*["']([^"']+)["']""")
JS_ASSET_LITERAL_RE = re.compile(r"""["']((?:content|assets|materials|other|data|entries|tools|templates)/[^"']+)["']""")
MD_LINK_RE = re.compile(r"""!?\[[^\]]*]\(([^)]+)\)""")
MD_HTML_MEDIA_RE = re.compile(r"""<(?:img|audio|video|source)\b[^>]*(?:src|poster)\s*=\s*["']([^"']+)["']""", re.I)


def rel(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def iter_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if ".git" in path.parts:
            continue
        if path.is_file():
            files.append(path)
    return sorted(files, key=lambda item: rel(item).lower())


def is_external(value: str) -> bool:
    value = value.strip()
    return not value or value.startswith(EXTERNAL_PREFIXES) or bool(urlsplit(value).scheme and not value.startswith("/"))


def normalize_ref(value: str, base_file: Path) -> str | None:
    raw = unquote(value.strip()).split("#", 1)[0].split("?", 1)[0].strip()
    if is_external(raw):
        return None
    if raw.startswith("//"):
        return None
    if raw.startswith("/"):
        raw = raw.lstrip("/")
        parts = raw.split("/", 1)
        if parts and parts[0].lower() == ROOT.name.lower() and len(parts) == 2:
            raw = parts[1]
    candidate = (ROOT / raw) if raw.startswith((
        "content/",
        "assets/",
        "materials/",
        "other/",
        "data/",
        "entries/",
        "tools/",
        "templates/",
    )) else (base_file.parent / raw)
    try:
        resolved = candidate.resolve()
        resolved.relative_to(ROOT)
    except ValueError:
        return None
    if resolved.is_dir():
        for index_name in ("index.html", "index.htm"):
            index_file = resolved / index_name
            if index_file.exists():
                resolved = index_file.resolve()
                break
        else:
            return None
    return resolved.relative_to(ROOT).as_posix()


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            return ""
    except OSError:
        return ""


def extract_json_string_refs(text: str) -> list[str]:
    refs: list[str] = []
    try:
        parsed = json.loads(text)
    except Exception:
        parsed = None

    def walk(value: object) -> None:
        if isinstance(value, str):
            stripped = value.strip()
            if stripped.startswith(PATH_PREFIXES):
                refs.append(value)
        elif isinstance(value, list):
            for item in value:
                walk(item)
        elif isinstance(value, dict):
            for item in value.values():
                walk(item)

    if parsed is not None:
        walk(parsed)
    return refs


def extract_refs(path: Path) -> set[str]:
    suffix = path.suffix.lower()
    text = read_text(path)
    refs: set[str] = set()

    def add_many(values: list[str]) -> None:
        for value in values:
            normalized = normalize_ref(value, path)
            if normalized:
                refs.add(normalized)

    if suffix in {".html", ".svg", ".xml"}:
        add_many(HTML_ATTR_RE.findall(text))
    if suffix == ".css":
        add_many(CSS_URL_RE.findall(text))
    if suffix == ".js":
        add_many(JS_FETCH_RE.findall(text))
        add_many(JS_IMPORT_RE.findall(text))
        add_many(JS_ASSET_LITERAL_RE.findall(text))
    if suffix == ".md":
        add_many(MD_LINK_RE.findall(text))
        add_many(MD_HTML_MEDIA_RE.findall(text))
    if suffix == ".json":
        add_many(extract_json_string_refs(text))

    return refs


def is_safe_pattern(path: Path) -> bool:
    name = path.name
    relpath = rel(path)
    if any(part in SAFE_DIRS for part in path.relative_to(ROOT).parts[:-1]):
        return True
    return any(fnmatch.fnmatch(name, pattern) or fnmatch.fnmatch(relpath, pattern) for pattern in SAFE_FILE_PATTERNS)


def should_seed_required(path: Path) -> bool:
    relpath = rel(path)
    if path.name in PRESERVE_FILES:
        return True
    if relpath in {"index.html", "404.html"}:
        return True
    if path.suffix.lower() in ENTRY_SUFFIXES:
        return True
    if path.suffix.lower() in {".css", ".js"}:
        return True
    return False


def format_size(size: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.1f} {unit}" if unit != "B" else f"{int(value)} B"
        value /= 1024
    return f"{size} B"


def update_gitignore() -> None:
    target = ROOT / ".gitignore"
    existing = target.read_text(encoding="utf-8") if target.exists() else ""
    pattern = re.compile(rf"{re.escape(BEGIN)}[\s\S]*?{re.escape(END)}\n?", re.M)
    if pattern.search(existing):
        updated = pattern.sub(MANAGED_GITIGNORE_BLOCK, existing)
    else:
        updated = (existing.rstrip() + "\n\n" if existing.strip() else "") + MANAGED_GITIGNORE_BLOCK
    target.write_text(updated, encoding="utf-8")


def write_list(path: Path, items: list[Path]) -> None:
    path.write_text("\n".join(rel(item) for item in items) + ("\n" if items else ""), encoding="utf-8")


def make_report(
    files: list[Path],
    required: set[str],
    safe: list[Path],
    review: list[Path],
    missing: set[str],
) -> str:
    def total(items: list[Path]) -> int:
        return sum(item.stat().st_size for item in items if item.exists())

    required_files = [ROOT / item for item in sorted(required) if (ROOT / item).exists()]
    largest = sorted(files, key=lambda item: item.stat().st_size, reverse=True)[:50]
    largest_safe = sorted(safe, key=lambda item: item.stat().st_size, reverse=True)[:50]
    largest_review = sorted(review, key=lambda item: item.stat().st_size, reverse=True)[:50]

    def table(items: list[Path]) -> str:
        if not items:
            return "_None._\n"
        lines = ["| Size | File |", "| ---: | --- |"]
        for item in items:
            lines.append(f"| {format_size(item.stat().st_size)} | `{rel(item)}` |")
        return "\n".join(lines) + "\n"

    report = [
        "# Static site audit",
        "",
        f"- Total repo size: **{format_size(total(files))}**",
        f"- Required files size: **{format_size(total(required_files))}**",
        f"- Safe ignore candidates size: **{format_size(total(safe))}**",
        f"- Manual review candidates size: **{format_size(total(review))}**",
        f"- Required file count: **{len(required_files)}**",
        f"- Safe ignore candidate count: **{len(safe)}**",
        f"- Manual review candidate count: **{len(review)}**",
        "",
        "## Top 50 largest files",
        table(largest),
        "## Top 50 largest safe ignore candidates",
        table(largest_safe),
        "## Top 50 largest manual review candidates",
        table(largest_review),
        "## Files referenced but missing",
        "\n".join(f"- `{item}`" for item in sorted(missing)) or "_None._",
        "",
    ]
    return "\n".join(report)


def main() -> None:
    files = iter_files()
    by_rel = {rel(path): path for path in files}
    required: set[str] = {rel(path) for path in files if should_seed_required(path)}
    missing: set[str] = set()

    queue = list(required)
    seen: set[str] = set()
    while queue:
        current = queue.pop(0)
        if current in seen:
            continue
        seen.add(current)
        path = by_rel.get(current)
        if not path or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        for found in extract_refs(path):
            if found in by_rel:
                if found not in required:
                    required.add(found)
                    queue.append(found)
            else:
                missing.add(found)

    safe: list[Path] = []
    review: list[Path] = []
    for path in files:
        relpath = rel(path)
        if relpath in required:
            continue
        suffix = path.suffix.lower()
        if is_safe_pattern(path):
            safe.append(path)
        elif suffix in LARGE_REVIEW_SUFFIXES or suffix in IMAGE_SUFFIXES or suffix in AUDIO_SUFFIXES:
            review.append(path)

    REPORT_DIR.mkdir(exist_ok=True)
    write_list(REPORT_DIR / "static-site-required-files.txt", [ROOT / item for item in sorted(required) if (ROOT / item).exists()])
    write_list(REPORT_DIR / "static-site-ignore-candidates.txt", safe)
    write_list(REPORT_DIR / "static-site-review-manually.txt", review)
    (REPORT_DIR / "static-site-audit.md").write_text(make_report(files, required, safe, review, missing), encoding="utf-8")
    update_gitignore()

    print(f"Required files: {len(required)}")
    print(f"Safe ignore candidates: {len(safe)}")
    print(f"Manual review candidates: {len(review)}")
    print(f"Missing references: {len(missing)}")
    print(f"Report: {REPORT_DIR / 'static-site-audit.md'}")


if __name__ == "__main__":
    main()
