---
title: Bambook 使用說明
date: 2026-06-26
tags: 網站, 公告
summary: 教材、文章與工具現在都集中在 Bambook。
---

# 歡迎來到 Bambook

這裡集中管理課程教材、Markdown 文章與個人工具。上方的「教材」可以直接開啟微積分乙或工程數學的資源；「其他」則收納 CS2 指令、GeoMaster 與成績追蹤。

## 新增文章

文章是靜態 Markdown 檔案，適合筆記、公告與整理後的學習心得。新增文章時：

1. 在 `content/` 建立一個 `.md` 檔。
2. 執行 `python build_manifest.py` 更新網站索引。
3. 推送到 GitHub，GitHub Pages 就會顯示它。

可以使用標準 Markdown，也支援程式碼區塊與數學式，例如 $\int_0^1 x^2\,dx = \frac13$。

## 維護原則

- 教材檔案維持在 `materials/微積分乙/` 與 `materials/工程數學/`。
- `site-manifest.json` 是教材、文章與工具的清單；每次更新內容後以 `build_manifest.py` 重新產生即可。
- `other/` 放置可獨立開啟的靜態工具，不需要後端服務。
