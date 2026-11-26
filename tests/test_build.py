"""build-index.py 與 validate-content.py 的測試。執行：python -m pytest tests"""
import importlib.util
import json
from pathlib import Path

import pytest

TOOLS = Path(__file__).resolve().parents[1] / "tools"


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, TOOLS / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture
def site(tmp_path):
    build = load("build_index", "build-index.py")
    validate = load("validate_content", "validate-content.py")
    build.configure(tmp_path)
    validate.configure(tmp_path)
    (tmp_path / "content" / "微積分").mkdir(parents=True)
    (tmp_path / "content" / "預備知識").mkdir(parents=True)
    (tmp_path / "materials" / "微積分乙" / "handout").mkdir(parents=True)
    return build, validate, tmp_path


def write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


# ---------------------------------------------------------------------------
# 短網址
# ---------------------------------------------------------------------------
class TestSlug:
    def test_strip_date_prefix(self, site):
        build, _, root = site
        p = root / "content" / "微積分" / "2026-09-26-epsilon-delta-definition.md"
        write(p, "# ε-δ極限定義\n\n本文。")
        assert build.markdown_record(p)["slug"] == "epsilon-delta-definition"

    def test_front_matter_slug_wins(self, site):
        build, _, root = site
        p = root / "content" / "微積分" / "2026-09-26-long-name.md"
        write(p, "---\nslug: Delta Def\n---\n# 標題")
        assert build.markdown_record(p)["slug"] == "delta-def"

    def test_chinese_filename_kept(self, site):
        build, _, root = site
        p = root / "content" / "微積分" / "2026-09-26-夾擠定理.md"
        write(p, "# 夾擠定理")
        assert build.markdown_record(p)["slug"] == "夾擠定理"

    def test_collision_gets_folder_prefix(self, site):
        build, _, root = site
        write(root / "content" / "微積分" / "2026-01-01-functions.md", "# A")
        write(root / "content" / "預備知識" / "2026-01-02-functions.md", "# B")
        slugs = sorted(a["slug"] for a in build.build_public_articles())
        assert slugs == ["微積分-functions", "預備知識-functions"]
        assert len(set(slugs)) == 2


# ---------------------------------------------------------------------------
# 預覽摘要
# ---------------------------------------------------------------------------
class TestExcerpt:
    def test_first_paragraph_without_markdown(self, site):
        build, _, _ = site
        body = "# 標題\n\n![圖](a.png)\n\n**夾擠定理**提供了[一個方法](x.md)。\n\n第二段"
        assert build.plain_summary(body) == "夾擠定理提供了一個方法。"

    def test_long_text_truncated(self, site):
        build, _, _ = site
        assert build.plain_summary("字" * 300, limit=20).endswith("…")
        assert len(build.plain_summary("字" * 300, limit=20)) == 20

    def test_summary_front_matter_preferred(self, site):
        build, _, root = site
        p = root / "content" / "微積分" / "2026-01-01-a.md"
        write(p, "---\nsummary: 自訂摘要\n---\n# A\n\n本文第一段")
        assert build.markdown_record(p)["excerpt"] == "自訂摘要"


# ---------------------------------------------------------------------------
# 短網址頁面
# ---------------------------------------------------------------------------
class TestShortPages:
    def test_pages_written_and_escaped(self, site):
        build, _, root = site
        write(root / "content" / "微積分" / "2026-01-01-quote.md", '# 引號 "與" <角括號>\n\n摘要 & 內容')
        manifest = build.build_manifest()
        build.build_short_pages(manifest)
        page = (root / "a" / "quote" / "index.html").read_text(encoding="utf-8")
        assert '<meta property="og:title" content="引號 &quot;與&quot; &lt;角括號&gt;">' in page
        assert "摘要 &amp; 內容" in page
        assert 'location.replace("../../#article=quote"' in page
        assert (root / "c" / "微積分乙" / "index.html").exists()
        assert "#materials=%E5%BE%AE%E7%A9%8D%E5%88%86%E4%B9%99" in (root / "c" / "微積分乙" / "index.html").read_text(encoding="utf-8")

    def test_preview_has_no_dates(self, site):
        """預覽在 commit 時產生，不能放會過期的研討日期。"""
        build, _, root = site
        write(root / "materials" / "微積分乙" / "schedule.json",
              json.dumps([{"topic": "極限", "sessions": [{"date": "2026-12-09 18:30"}]}]))
        build.build_short_pages(build.build_manifest())
        assert "2026-12-09" not in (root / "c" / "微積分乙" / "index.html").read_text(encoding="utf-8")

    def test_stale_generated_pages_removed_but_manual_kept(self, site):
        build, _, root = site
        p = root / "content" / "微積分" / "2026-01-01-old.md"
        write(p, "# old")
        build.build_short_pages(build.build_manifest())
        manual = root / "a" / "手動放的"
        manual.mkdir()
        (manual / "index.html").write_text("keep", encoding="utf-8")
        p.unlink()
        build.build_short_pages(build.build_manifest())
        assert not (root / "a" / "old").exists()
        assert (manual / "index.html").exists()

    def test_unchanged_page_not_rewritten(self, site):
        build, _, root = site
        write(root / "content" / "微積分" / "2026-01-01-same.md", "# same")
        build.build_short_pages(build.build_manifest())
        f = root / "a" / "same" / "index.html"
        before = f.stat().st_mtime_ns
        build.build_short_pages(build.build_manifest())
        assert f.stat().st_mtime_ns == before


# ---------------------------------------------------------------------------
# 驗證
# ---------------------------------------------------------------------------
class TestValidate:
    def run(self, validate, fn):
        msgs = []
        fn(msgs)
        return msgs

    def test_bad_schedule_date_is_error(self, site):
        _, validate, root = site
        write(root / "materials" / "微積分乙" / "schedule.json",
              json.dumps([{"topic": "極限", "sessions": [{"date": "12/9 18:30", "time": "18:30–20:30"}]}]))
        msgs = self.run(validate, validate.validate_schedules)
        assert any(m.startswith("ERROR") and "12/9 18:30" in m for m in msgs)

    def test_bad_time_range_warns(self, site):
        _, validate, root = site
        write(root / "materials" / "微積分乙" / "schedule.json",
              json.dumps([{"topic": "極限", "sessions": [{"date": "2026-12-09 18:30", "time": "晚上"}]}]))
        msgs = self.run(validate, validate.validate_schedules)
        assert any(m.startswith("WARN") and "晚上" in m for m in msgs)

    def test_missing_handout_warns_existing_ok(self, site):
        _, validate, root = site
        (root / "materials" / "微積分乙" / "handout" / "handout1_填空.pdf").write_bytes(b"%PDF")
        (root / "materials" / "微積分乙" / "handout" / "quiz1_題目.pdf").write_bytes(b"%PDF")
        write(root / "materials" / "微積分乙" / "schedule.json", json.dumps([
            {"topic": "A", "sessions": [{"date": "2026-12-09 18:30", "handout": "handout1"},
                                        {"date": "2026-12-16 18:30", "quiz": "quiz1"},
                                        {"date": "2026-12-23 18:30", "handout": "handout9"}]}]))
        msgs = self.run(validate, validate.validate_schedules)
        assert len(msgs) == 1 and "handout9" in msgs[0]

    def test_old_schedule_format_accepted(self, site):
        _, validate, root = site
        write(root / "materials" / "微積分乙" / "schedule.json",
              json.dumps([{"topic": "A", "date": "2026-12-09 18:30", "time": "18:30-20:30"}]))
        assert self.run(validate, validate.validate_schedules) == []

    def test_file_size_limits(self, site, monkeypatch):
        _, validate, root = site
        monkeypatch.setattr(validate, "FILE_WARN_BYTES", 10)
        monkeypatch.setattr(validate, "FILE_ERROR_BYTES", 20)
        monkeypatch.setattr(validate, "SITE_WARN_BYTES", 25)
        (root / "materials" / "微積分乙" / "big.pdf").write_bytes(b"x" * 15)
        (root / "materials" / "微積分乙" / "huge.pdf").write_bytes(b"x" * 25)
        msgs = self.run(validate, validate.validate_sizes)
        assert any(m.startswith("WARN") and "big.pdf" in m for m in msgs)
        assert any(m.startswith("ERROR") and "huge.pdf" in m for m in msgs)
        assert any("網站總共" in m for m in msgs)

    def test_slug_collision_warns(self, site):
        _, validate, root = site
        write(root / "content" / "微積分" / "2026-01-01-sets.md", "# A")
        write(root / "content" / "預備知識" / "2026-01-02-sets.md", "# B")
        msgs = self.run(validate, validate.validate_slugs)
        assert len(msgs) == 2 and all("短網址撞名" in m for m in msgs)
