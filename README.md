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

在 `materials/<科目資料夾>/` 底下新增 `schedule.json`，內容是一個陣列，**每筆是一個主題**，主題底下的 `sessions` 列出這個主題實際的每一次研討（目前的步調是一個主題佔兩週：一週進度、一週測驗），可從 `templates/schedule.template.json` 複製：

```json
[
  {
    "topic": "一階常微分方程總複習",
    "description": "複習可分離、線性、正合方程的判別與解法，並帶大家過一遍上學期段考常考的題型。",
    "sessions": [
      { "date": "2026-09-05 19:00", "time": "19:00–21:00", "location": "師大博愛樓 301 教室", "handout": "handout1" },
      { "date": "2026-09-12 19:00", "time": "19:00–21:00", "location": "師大博愛樓 301 教室", "quiz": "quiz1" }
    ]
  }
]
```

主題本身的欄位：

- `topic`：主題（短標題）。
- `description`：研討內容說明（選填），顯示在主題標題正下方。
- `sessions`：這個主題的每一次研討，順序不拘（會自動依日期排序）。只有一次研討的主題就只放一筆。

`sessions` 裡每一次研討的欄位：

- `date`：一律使用 `YYYY-MM-DD HH:MM` 這種固定格式，用來排序、判斷這次研討是否已結束。
- `time`：給人看的顯示用時段字串（例如 `19:00–21:00`），**格式必須是 `HH:MM` + 分隔符號（`-`／`–`／`—`／`~`）+ `HH:MM`**——quiz 解答要等這個時段的結束時間過後才會開放下載，格式不對會直接退回當天 21:00 當作保底的結束時間。
- `location`：地點。
- `handout`：這次發的講義（選填）。填入該講義檔名去掉「_填空」「_解答」後的字串（例如 `handout/handout1_填空.pdf` 對應 `"handout1"`），這一列就會顯示講義的填空／解答下載連結。
- `quiz`：這次的小考（選填）。填入該小考檔名去掉「_題目」「_解答」後的字串（例如 `handout/quiz1_題目.pdf` 對應 `"quiz1"`）。小考題目／解答檔案跟講義放在同一個 `handout/` 資料夾裡即可，檔名開頭要是 `quiz`（例如 `quiz1_題目.pdf`、`quiz1_解答.pdf`）。題目只要檔案存在就會顯示下載連結；**解答則要等這次研討的 `time` 結束時間過後才會顯示**，就算檔案已經放在資料夾裡，時間到之前網頁上也不會出現解答連結，避免學生在研討當場就先把答案抄走。
- `label`：這次研討前面的小標籤（選填）。不填時自動判斷：有 `quiz` 標「測驗」、有 `handout` 標「進度」、都沒有標「研討」。

檔案都只在實際存在時才會出現連結，還沒放上來的（例如之後才會有的 quiz）先寫進 `schedule.json` 也沒關係，檔案放進資料夾、重新執行 `python tools/build-index.py` 後就會自動出現。

教材頁預設只顯示目前的主題這一站，看起來就是地鐵路線圖式完整期程（一直線搭配圓點）目前露出的一小段；點選它，過去的主題會向上展開、未來的主題會向下展開，成為完整期程的時間軸，過去、目前、未來的主題以不同顏色的圓點與文字區分，主題裡最近的下一次研討也會另外標亮。主題要等裡面每一次研討都結束才算結束（例如進度週過了、測驗週還沒到，仍然算進行中）；若所有主題都已結束，預設改顯示最近一個已結束的主題。

舊格式（沒有 `sessions`、把 `date`／`time`／`location`／`handout`／`quiz` 直接寫在主題本身）仍然可以用，會被當成只有一次研討的主題顯示。

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
