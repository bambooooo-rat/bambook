"""Validate Bambook content boundaries.

This script checks the content contract without generating HTML:
- top-level content/*.md should contain only the single home intro;
- entries/<type>/<id>/ must contain index.html and meta.json;
- private entries should use visibility: private;
- 檔案大小：單檔超過 90MB 警告、超過 100MB 是錯誤（GitHub 會拒收）；網站總量超過 850MB 警告（Pages 上限 1GB）；
- schedule.json：日期與時段格式、引用的講義／小考檔案是否存在；
- 文章短網址撞名（build-index.py 會自動改名，這裡提醒你可以自己指定 slug）。

commit 時由 scripts/hooks/pre-commit 自動執行；有 ERROR 時擋下這次 commit。
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content"
ENTRIES_DIR = ROOT / "entries"
MATERIALS_DIR = ROOT / "materials"

FILE_WARN_BYTES = 90 * 1024 * 1024
FILE_ERROR_BYTES = 100 * 1024 * 1024
SITE_WARN_BYTES = 850 * 1024 * 1024
SKIP_DIRS = {".git", "__pycache__", ".pytest_cache", "node_modules", "scratch"}
DATE_FORMAT = "%Y-%m-%d %H:%M"
TIME_RANGE = re.compile(r"^\s*\d{1,2}:\d{2}\s*[-–—~]\s*\d{1,2}:\d{2}\s*$")


def configure(root: Path) -> None:
    """測試用：把所有路徑指到另一個網站根目錄。"""
    global ROOT, CONTENT_DIR, ENTRIES_DIR, MATERIALS_DIR
    ROOT = Path(root).resolve()
    CONTENT_DIR = ROOT / "content"
    ENTRIES_DIR = ROOT / "entries"
    MATERIALS_DIR = ROOT / "materials"


def error(messages: list[str], text: str) -> None:
    messages.append(f"ERROR: {text}")


def warn(messages: list[str], text: str) -> None:
    messages.append(f"WARN: {text}")


def validate_top_level_markdown(messages: list[str]) -> None:
    files = sorted(CONTENT_DIR.glob("*.md")) if CONTENT_DIR.is_dir() else []
    if len(files) > 1:
        warn(messages, "content/ should have only one top-level Markdown file for the home intro: " + ", ".join(file.name for file in files))


def validate_entries(messages: list[str]) -> None:
    if not ENTRIES_DIR.is_dir():
        return
    for type_dir in sorted(item for item in ENTRIES_DIR.iterdir() if item.is_dir()):
        for entry_dir in sorted(item for item in type_dir.iterdir() if item.is_dir()):
            meta = entry_dir / "meta.json"
            index = entry_dir / "index.html"
            if not meta.is_file():
                error(messages, f"{entry_dir.relative_to(ROOT)} is missing meta.json")
                continue
            if not index.is_file():
                error(messages, f"{entry_dir.relative_to(ROOT)} is missing index.html")
            try:
                data = json.loads(meta.read_text(encoding="utf-8-sig"))
            except json.JSONDecodeError as exc:
                error(messages, f"{meta.relative_to(ROOT)} is invalid JSON: {exc}")
                continue
            for field in ("title", "summary"):
                if not str(data.get(field, "")).strip():
                    warn(messages, f"{meta.relative_to(ROOT)} is missing recommended field: {field}")
            if str(data.get("visibility", "public")).lower() == "private":
                warn(messages, f"{entry_dir.relative_to(ROOT)} is private and will not be indexed")


def _size_text(n: int) -> str:
    return f"{n / 1024 / 1024:.1f}MB"


def validate_sizes(messages: list[str]) -> None:
    total = 0
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            continue
        size = path.stat().st_size
        total += size
        rel = path.relative_to(ROOT).as_posix()
        if size > FILE_ERROR_BYTES:
            error(messages, f"{rel} 有 {_size_text(size)}，超過 GitHub 單檔 100MB 的上限，push 會被拒絕")
        elif size > FILE_WARN_BYTES:
            warn(messages, f"{rel} 有 {_size_text(size)}，接近 GitHub 單檔 100MB 的上限")
    if total > SITE_WARN_BYTES:
        warn(messages, f"網站總共 {_size_text(total)}，接近 GitHub Pages 1GB 的上限")


def _handout_names(handout_dir: Path) -> tuple[set[str], set[str]]:
    handouts, quizzes = set(), set()
    if handout_dir.is_dir():
        for f in handout_dir.iterdir():
            if f.is_file() and f.suffix.lower() == ".pdf":
                stem = f.stem
                if stem.lower().startswith("quiz"):
                    quizzes.add(re.sub(r"[_\- ]?(題目|解答)$", "", stem).strip())
                else:
                    handouts.add(re.sub(r"[_\- ]?(填空|解答)$", "", stem).strip())
    return handouts, quizzes


def validate_schedules(messages: list[str]) -> None:
    if not MATERIALS_DIR.is_dir():
        return
    for course_dir in sorted(p for p in MATERIALS_DIR.iterdir() if p.is_dir()):
        schedule = course_dir / "schedule.json"
        if not schedule.is_file():
            continue
        rel = schedule.relative_to(ROOT).as_posix()
        try:
            topics = json.loads(schedule.read_text(encoding="utf-8-sig"))
        except json.JSONDecodeError as exc:
            error(messages, f"{rel} 不是正確的 JSON：{exc}")
            continue
        if not isinstance(topics, list):
            error(messages, f"{rel} 最外層必須是陣列（每筆是一個主題）")
            continue
        handouts, quizzes = _handout_names(course_dir / "handout")
        for i, topic in enumerate(topics, 1):
            if not isinstance(topic, dict):
                error(messages, f"{rel} 第 {i} 個主題不是物件")
                continue
            label = topic.get("topic") or f"第 {i} 個主題"
            sessions = topic.get("sessions") if isinstance(topic.get("sessions"), list) else [topic]
            for session in sessions:
                if not isinstance(session, dict):
                    continue
                date = str(session.get("date", ""))
                try:
                    datetime.strptime(date, DATE_FORMAT)
                except ValueError:
                    error(messages, f"{rel}〈{label}〉的 date「{date}」格式不對，要寫成 YYYY-MM-DD HH:MM")
                time_range = str(session.get("time", ""))
                if time_range and not TIME_RANGE.match(time_range):
                    warn(messages, f"{rel}〈{label}〉的 time「{time_range}」格式不對（例：18:30–20:30），小考解答會改在當天 21:00 開放")
                h = session.get("handout")
                if h and h not in handouts:
                    warn(messages, f"{rel}〈{label}〉引用的講義「{h}」在 handout/ 裡找不到（還沒放上來的話可以忽略）")
                q = session.get("quiz")
                if q and q not in quizzes:
                    warn(messages, f"{rel}〈{label}〉引用的小考「{q}」在 handout/ 裡找不到（還沒放上來的話可以忽略）")


def validate_slugs(messages: list[str]) -> None:
    spec = importlib.util.spec_from_file_location("bambook_build_index", Path(__file__).with_name("build-index.py"))
    build = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(build)
    build.configure(ROOT)
    if not CONTENT_DIR.is_dir():
        return
    records = [build.markdown_record(p) for p in sorted(CONTENT_DIR.rglob("*.md")) if p.parent != CONTENT_DIR]
    for note in build.resolve_slug_collisions(records):
        warn(messages, note)


def main() -> None:
    messages: list[str] = []
    validate_top_level_markdown(messages)
    validate_entries(messages)
    validate_sizes(messages)
    validate_schedules(messages)
    validate_slugs(messages)
    for message in messages:
        print(message)
    if any(message.startswith("ERROR:") for message in messages):
        sys.exit(1)
    print("Validation complete.")


if __name__ == "__main__":
    main()
