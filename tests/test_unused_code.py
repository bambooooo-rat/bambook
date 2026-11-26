"""沒人用的樣式與程式：site.css 的 class、site.js 的函式與圖示，都要有地方用到。執行：python -m pytest tests

改版時新樣式寫在後面、舊的留著「無害」，久了 site.css 就一層層堆積（第 2 階段結束時有 51 個 class 沒人用）。
這個測試讓沒人用的東西一出現就失敗：刪掉它，或者它確實是在執行時才產生的，就加進下面的白名單並寫明來源。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "assets" / "css" / "site.css"
JS = ROOT / "assets" / "js" / "site.js"
# 會輸出 HTML 的檔案：網頁本身、前端程式、產生短網址頁面的 build-index.py
EMITTERS = [ROOT / "index.html", JS, ROOT / "tools" / "build-index.py"]

# 不在上面這些檔案裡、而是執行時才出現的 class
RUNTIME_CLASSES = {
    # KaTeX 排出來的數學式
    "katex", "katex-display", "katex-html", "katex-mathml",
    # markdown-it-footnote
    "footnotes", "footnote-ref", "footnote-backref", "footnote-item", "footnotes-sep",
    # markdown-it-task-lists
    "task-list-item", "task-list-item-checkbox", "contains-task-list",
}
# site.js 用樣板字串組出來的 class：`toc-link--${h2…h6}`
RUNTIME_PATTERNS = [re.compile(r"toc-link--h[1-6]")]


def strip_comments(text, pattern):
    return re.sub(pattern, "", text, flags=re.S)


def css_classes():
    css = strip_comments(CSS.read_text(encoding="utf-8"), r"/\*.*?\*/")
    selectors = re.sub(r"\{[^{}]*\}", "{}", css)  # 只留選擇器，丟掉宣告（避免把 .5rem 之類當成 class）
    return set(re.findall(r"\.(-?[a-zA-Z_][\w-]*)", selectors))


# 字串常數（"…"、'…'、`…`）：class 名稱只會出現在這裡面
STRING = re.compile(r'"(?:[^"\\\n]|\\.)*"|\'(?:[^\'\\\n]|\\.)*\'|`(?:[^`\\]|\\.)*`', re.S)


def emitted_text():
    # 只在註解裡被提到不算「有用到」：HTML 拿掉註解；JS 與 Python 只看字串常數，
    # 這樣變數名稱（例如 site.js 的 const hero）不會讓同名的 .hero 看起來有人用
    parts = []
    for path in EMITTERS:
        text = path.read_text(encoding="utf-8")
        if path.suffix == ".js":
            text = "\n".join(STRING.findall(js_code()))
        elif path.suffix == ".py":
            text = "\n".join(STRING.findall(text))
        elif path.suffix == ".html":
            text = strip_comments(text, r"<!--.*?-->")
        parts.append(text)
    return "\n".join(parts)


def test_every_css_class_is_used():
    text = emitted_text()
    unused = sorted(
        name for name in css_classes()
        if name not in RUNTIME_CLASSES
        and not any(p.fullmatch(name) for p in RUNTIME_PATTERNS)
        and not re.search(r"(?<![\w-])" + re.escape(name) + r"(?![\w-])", text)
    )
    assert not unused, f"site.css 有 {len(unused)} 個 class 沒有任何地方用到：{' '.join(unused)}"


def js_code():
    return strip_comments(JS.read_text(encoding="utf-8"), r"/\*.*?\*/|(?<![:\"'`])//[^\n]*")


def test_every_top_level_function_and_const_is_used():
    code = js_code()
    names = re.findall(r"^(?:async\s+)?function\s+(\w+)", code, flags=re.M)
    names += re.findall(r"^const\s+(\w+)\s*=", code, flags=re.M)
    unused = sorted(n for n in names if len(re.findall(r"\b" + n + r"\b", code)) == 1)
    assert not unused, f"site.js 有定義了卻沒人用的：{' '.join(unused)}"


def test_every_icon_is_used():
    code = js_code()
    start = code.index("const ICONS")
    block = code[start:code.index("\n};", start)]
    keys = re.findall(r"^\s+(\w+):", block, flags=re.M)
    unused = sorted(k for k in keys if not re.search(r"ICONS\." + k + r"\b", code))
    assert not unused, f"ICONS 裡沒人用的圖示：{' '.join(unused)}"
