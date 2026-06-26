# Bambook

GitHub Pages 用的純靜態教材、文章與工具網站。

## 維護流程

每次新增教材、Markdown 文章或工具資料夾後，在此資料夾執行：

```powershell
python build_manifest.py
```

它會產生 `site-manifest.json`。公開網站只讀取這份檔案，不需要也不會嘗試掃描 GitHub Pages 的資料夾。

## 結構

- `materials/微積分乙`、`materials/工程數學`：教材 PDF 與相關資源。
- `content/`：Markdown 文章；可使用 front matter 寫入 `title`、`date`、`tags`、`summary`。
- `other/<工具名稱>/`：一個可獨立開啟的工具。只要資料夾內有 `index.html`，產生器就會把它加到「其他工具總覽」。
- `other/<工具名稱>/tool.json`：選用。可自訂工具卡片的 `title`、`description`、`icon`、`tags`、`order`、`action`。
- `build_manifest.py`：掃描上述內容並產生 `site-manifest.json`。

本機預覽可雙擊 `server.bat`，或執行 `python -m http.server 8001` 後開啟 `http://localhost:8001/`。
