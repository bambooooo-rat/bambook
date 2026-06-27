# Bambook entries

`entries/` 用來放工具、作品、展示頁等「獨立靜態頁面」。

建議結構：

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

主站只讀每個資料夾的 `meta.json`，不理解工具或作品頁內部的 HTML/CSS/JS。

新增或修改後執行：

```powershell
python tools/build-index.py
```
