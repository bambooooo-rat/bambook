"""Build Bambook static indexes.

Canonical workflow:
  python tools/build-index.py

This keeps GitHub Pages compatible: the browser reads generated JSON files,
not directory listings.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from build_manifest import build_manifest  # noqa: E402


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temporary, path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Bambook JSON indexes.")
    parser.add_argument("--manifest", type=Path, default=ROOT / "site-manifest.json", help="Main manifest output path.")
    parser.add_argument("--data-dir", type=Path, default=ROOT / "data", help="Split data output directory.")
    args = parser.parse_args()

    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    data_dir = args.data_dir if args.data_dir.is_absolute() else ROOT / args.data_dir

    manifest = build_manifest()
    write_json(manifest_path, manifest)
    write_json(data_dir / "articles.json", manifest.get("articles", []))
    write_json(data_dir / "entries.json", manifest.get("entries", []))
    write_json(data_dir / "site.json", {
        "schema": manifest.get("schema", 1),
        "home_intro": manifest.get("home_intro"),
        "materials_count": len(manifest.get("materials", {})),
        "articles_count": len(manifest.get("articles", [])),
        "entries_count": len(manifest.get("entries", [])),
        "tools_count": len(manifest.get("tools", [])),
    })

    display = manifest_path.relative_to(ROOT) if manifest_path.is_relative_to(ROOT) else manifest_path
    print(f"Built {display} and split data indexes in {data_dir.relative_to(ROOT) if data_dir.is_relative_to(ROOT) else data_dir}")


if __name__ == "__main__":
    main()
