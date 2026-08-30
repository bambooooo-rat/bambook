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
- `entries/`：工具、作品、展示頁等獨立靜態頁面（唯一的工具/作品入口，取代舊的 `other/`）。
- `templates/`：新增內容時可複製的模板，也包含一份 `markdown-showcase.md` 語法展示（不會被索引）。
- `tools/`：產生索引與驗證內容的腳本。

## 新增文章

文章主標題以檔名為準，front matter 只描述文章。

建議依主題／科目分類，資料夾名稱盡量跟 `materials/` 底下的科目名稱一致，例如：

```text
content/
  微積分乙/
    2026-07-19-函數與公式.md
  工程數學/
    2026-08-01-拉普拉斯轉換筆記.md
  預備知識/
    ...
  其他/
    ...
```

可從 `templates/article.template.md` 複製。

`content/` 根目錄下只保留一個 Markdown 檔，作為首頁說明文字。

### 讓文章出現在教材頁的「延伸文章」區塊

在文章的 front matter `tags` 裡加上一個跟科目資料夾（`materials/` 底下的名稱）完全相同的標籤，例如 `tags: 函數, 公式, 微積分乙`，這篇文章就會自動出現在「微積分乙」教材頁的延伸文章區塊。一篇文章可以同時掛多個科目 tag，不用擔心只能歸類到一個地方。

### 新增課業輔導社群的研討時間表

在 `materials/<科目資料夾>/` 底下新增 `schedule.json`，內容是一個陣列，每筆記錄一次研討的時間、地點與內容，可從 `templates/schedule.template.json` 複製：

```json
[
  {
    "date": "2026-09-05 19:00",
    "time": "19:00–21:00",
    "location": "師大博愛樓 301 教室",
    "topic": "一階常微分方程總複習",
    "description": "複習可分離、線性、正合方程的判別與解法，並帶大家過一遍上學期段考常考的題型。",
    "handout": "handout1"
  }
]
```

- `date`：一律使用 `YYYY-MM-DD HH:MM` 這種固定格式，用來排序、判斷場次是否已結束。
- `time`：給人看的顯示用時段字串（例如 `19:00–21:00`）。
- `location`：地點。
- `topic`：這次研討的主題（短標題）。
- `description`：主題以外的詳細說明（選填）。
- `handout`：對應的講義（選填）。填入該講義檔名去掉「_填空版」「_解答版」後的字串（例如 `handout/handout1_填空版.pdf` 對應 `"handout1"`），研討時間軸上就會直接顯示該講義的填空版／解答版下載連結。

教材頁會自動只顯示「下一次最近的研討」這一站，看起來就是地鐵路線圖式完整期程（一直線搭配圓點）目前露出的一小段；點選它，過去場次會向上展開、未來場次會向下展開，成為完整期程的時間軸，過去、下一次、未來的場次以不同顏色的圓點與文字區分。若所有場次都已結束，預設改顯示最近一次已結束的場次。

## 新增工具或作品

統一使用 `entries/`：

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

## 產生公開索引

GitHub Pages 不能讓瀏覽器即時掃描資料夾，因此新增文章、教材、工具或作品後，需要執行：

```powershell
python tools/build-index.py
```

它會產生 `site-manifest.json`——網站唯一會讀取的主索引。

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
