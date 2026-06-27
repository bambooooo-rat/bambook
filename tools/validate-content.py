"""Validate Bambook content boundaries.

This script checks the content contract without generating HTML:
- top-level content/*.md should contain only the single home intro;
- entries/<type>/<id>/ must contain index.html and meta.json;
- private entries should use visibility: private.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = ROOT / "content"
ENTRIES_DIR = ROOT / "entries"


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


def main() -> None:
    messages: list[str] = []
    validate_top_level_markdown(messages)
    validate_entries(messages)
    for message in messages:
        print(message)
    if any(message.startswith("ERROR:") for message in messages):
        sys.exit(1)
    print("Validation complete.")


if __name__ == "__main__":
    main()
