# Bambook

GitHub Pages 用的純靜態教材、文章、工具與作品索引網站。目標是讓網站核心穩定，日後主要只新增內容檔案，而不修改主程式。

## 邊界規則

通常不需要修改：

- `index.html`
- `assets/css/`
- `assets/js/`

日常新增或整理內容時，主要修改：

- `content/`：Markdown 文章與首頁說明。
- `materials/`：教材 PDF、講義、投影片與練習資源。
- `entries/`：工具、作品、展示頁等獨立靜態頁面。
- `other/`：舊版工具資料夾；目前仍保留相容。
- `templates/`：新增內容時可複製的模板。
- `tools/`：產生索引與驗證內容的腳本。

## 新增文章

文章主標題以檔名為準，front matter 只描述文章。

建議放在月份資料夾，例如：

```text
content/
  202606/
    2026-06-27-微積分學習地圖.md
```

可從 `templates/article.template.md` 複製。

`content/` 根目錄下只保留一個 Markdown 檔，作為首頁說明文字。

## 新增工具或作品

新規格建議使用 `entries/`：

```text
entries/
  tools/
    markdown-preview/
      index.html
      meta.json
      thumbnail.jpg
  works/
    example-work/
      index.html
      meta.json
      thumbnail.jpg
```

每個 entry 至少需要：

- `index.html`
- `meta.json`

可從 `templates/entry.meta.template.json` 複製。

`other/<工具名稱>/` 是舊工具位置，仍然會被掃描；若要新增大型獨立頁面，優先使用 `entries/`。

## 產生公開索引

GitHub Pages 不能讓瀏覽器即時掃描資料夾，因此新增文章、教材、工具或作品後，需要執行：

```powershell
python tools/build-index.py
```

它會產生：

- `site-manifest.json`：網站實際讀取的主索引。
- `data/articles.json`：文章索引。
- `data/entries.json`：工具與作品入口索引。
- `data/site.json`：站點摘要。

若只想使用舊指令，仍可執行：

```powershell
python build_manifest.py
```

## 驗證內容

```powershell
python tools/validate-content.py
```

## 本機預覽

雙擊：

```text
server.bat
```

或執行：

```powershell
python -m http.server 8001
```

再開啟 `http://localhost:8001/`。
