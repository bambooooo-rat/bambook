---
title: Markdown 語法測試
date: 2026-06-27
tags: Markdown, 測試, 語法展示
summary: 這是一篇用來測試 Bambook 文章系統的 Markdown 展示文，包含標題、段落、列表、表格、程式碼、註腳、數學式與常用擴充語法。
---

> 這份檔案放在 `templates/`，不會被 `tools/build-index.py` 掃進 `content/` 文章索引，也不會出現在網站的「文章」頁面上。需要時可以複製一段到瀏覽器裡的 Markdown 編輯器，或暫時放進 `content/` 底下實際預覽，確認完再移回來。

# Bambook Markdown 語法測試

這篇文章用來確認 Bambook 的 Markdown 文章系統是否能正常顯示各種常用語法。它不是正式教學文章，而是一份展示與檢查用的範例；如果這一頁看起來正常，代表日後撰寫課程補充、讀書筆記或網站公告時，大部分格式都可以安心使用。

Markdown 的好處是文字本身仍然很容易閱讀。即使不經過網頁渲染，你也能大致看懂原始檔；經過 Bambook 轉換後，標題、列表、表格、數學式和程式碼會被整理成比較適合閱讀的版面。

## 標題與段落

Markdown 使用井字號表示標題。`#` 是一級標題，`##` 是二級標題，最多可以到六級標題。實際寫文章時，我通常建議一篇文章只使用一個一級標題，其他段落再用二級或三級標題分段。

### 三級標題

這是一段普通段落。段落之間只要空一行，就會被視為不同段落。若想在同一段中強制換行，可以在行尾加上兩個空白再換行，或使用 HTML 的 `<br>`，但一般文章不太需要這麼做。

#### 四級標題

四級標題適合更細的小節。五級與六級標題也能顯示，不過在一般閱讀文章中不建議過度巢狀，因為層級太深會讓讀者迷路。

##### 五級標題

五級標題通常只用在很長的技術文章中。

###### 六級標題

六級標題是 Markdown 中最小的標題層級。

## 文字樣式

Markdown 支援常見的行內文字樣式，例如 *斜體*、**粗體**、***粗斜體***、~~刪除線~~、==標記文字==、++插入文字++、H~2~O 這樣的下標，以及 x^2^ 這樣的上標。

你也可以在段落裡放入 `inline code`，用來標示檔名、函式名稱或短指令。若需要表示鍵盤按鍵，可以直接使用 HTML，例如 <kbd>Ctrl</kbd> + <kbd>F5</kbd>，這在說明瀏覽器強制重新整理時很方便。

有時候文章會需要縮寫說明。像 HTML 這個詞可以搭配縮寫語法，讓滑鼠移上去時顯示完整意思。

*[HTML]: HyperText Markup Language

## 引用區塊

引用區塊可以用來放補充提醒、他人的說法，或是你想特別凸顯的一段文字。

> 這是一段引用。它會在左側顯示一條線，視覺上和一般段落分開。
>
> 引用中也可以有第二段文字。
>
> > 引用還可以巢狀，但平常不建議巢狀太多層。

## 清單

無序清單適合列出沒有先後順序的項目。例如 Bambook 目前主要整理：

- 教材與講義
- Markdown 文章
- 其他靜態工具
- PDF、連結與補充資源

有序清單適合描述步驟：

1. 在 `content/微積分乙/` 之類跟教材科目同名的主題資料夾中新增 Markdown 檔案。
2. 執行 `python tools/build-index.py` 更新網站索引。
3. 使用 GitHub Desktop commit 並 push。
4. 等 GitHub Pages 重新部署後檢查頁面。

清單也可以巢狀：

- 教材
  - 微積分乙
  - 工程數學
- 文章
  - 課程補充
  - 網站公告
  - 學習筆記

Task list 適合當作簡單待辦：

- [x] 建立 `welcome.md`
- [x] 讓首頁顯示網站介紹
- [ ] 撰寫更多月份文章
- [ ] 繼續整理課程資源

## 連結與圖片

一般連結可以直接寫成 [GitHub Pages](https://pages.github.com/)。若網址本身就是重點，也可以使用自動連結：<https://pages.github.com/>。Email 也能寫成自動連結：<bamboorat0528@gmail.com>。

參考式連結適合在同一篇文章中重複使用同一個網址，例如 [Markdown Guide][markdown-guide] 與 [GitHub Pages][github-pages]。這種寫法可以讓段落比較乾淨，把網址集中放在文章底部。

[markdown-guide]: https://www.markdownguide.org/
[github-pages]: https://pages.github.com/

圖片語法和連結很像，只是在前面多一個驚嘆號。下面是一張使用遠端圖片的範例：

![Markdown 標誌示意圖](https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg "Markdown")

Bambook 會在圖片載入後自動判斷方向。橫向圖片會固定高度，寬度依比例縮放；直向圖片會固定寬度，高度依比例縮放。下面先放一張橫向圖片：

![橫向圖片範例](https://picsum.photos/seed/bambook-landscape/900/420 "Landscape image")

接著是一張直向圖片：

![直向圖片範例](https://picsum.photos/seed/bambook-portrait/420/900 "Portrait image")

圖片也可以包在連結裡，點擊圖片後前往指定頁面：

[![GitHub Octocat](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png "GitHub")](https://github.com/)

## 程式碼

短程式碼可以寫在段落中，例如 `python build_manifest.py`。若是多行程式碼，使用三個反引號建立 fenced code block，並在第一行標註語言名稱：

```python
from pathlib import Path

root = Path("content")
articles = sorted(root.rglob("*.md"))

for article in articles:
    print(article.as_posix())
```

JavaScript 也可以正常顯示：

```js
const message = "Hello, Bambook!";
console.log(message);
```

如果程式碼本身包含 Markdown 符號，也可以放在程式碼區塊中，避免被解析：

```md
## 這行在程式碼區塊內，不會變成標題

- 這行也不會變成真正的清單
```

## 表格

表格很適合整理比較資料。冒號可以控制欄位對齊：左對齊、右對齊、置中對齊。

| 語法類型 | 寫法 | 顯示效果 |
| :-- | --: | :--: |
| 粗體 | `**文字**` | **文字** |
| 斜體 | `*文字*` | *文字* |
| 刪除線 | `~~文字~~` | ~~文字~~ |
| 行內程式碼 | `` `code` `` | `code` |

表格中也可以放數字：

| 項目 | 數量 | 備註 |
| :-- | --: | :-- |
| 講義 | 8 | 依課程進度調整 |
| 投影片 | 12 | 可連到 PDF |
| 工具頁 | 4 | 放在 `entries/tools/` 底下 |

## 數學式

Bambook 使用 KaTeX 顯示數學式。行內數學式可以寫成 $f(x)=x^2+1$，或是 $\int_0^1 x^2\,dx=\frac{1}{3}$。

獨立數學式適合比較長的推導：

$$
\frac{d}{dx}\left(\sin x\right)=\cos x
$$

也可以寫矩陣：

$$
A =
\begin{pmatrix}
1 & 2 \\
3 & 4
\end{pmatrix},
\qquad
\det(A)=1\cdot4-2\cdot3=-2
$$

工程數學常見的微分方程也能顯示：

$$
y'' + 3y' + 2y = 0
\quad\Longrightarrow\quad
y = C_1 e^{-x} + C_2 e^{-2x}
$$

## 定義列表

定義列表適合寫術語解釋。

Markdown
: 一種輕量標記語言，適合用純文字撰寫文章。

KaTeX
: 一個用來在網頁上快速顯示數學式的工具。

GitHub Pages
: GitHub 提供的靜態網站發布服務。

## 註腳

註腳適合補充來源或旁註，不想打斷正文時很好用。這裡是一個註腳範例[^note]，而這裡是另一個比較長的註腳[^long-note]。

[^note]: 這是一個簡短註腳。

[^long-note]: 這是一個比較長的註腳。註腳可以放更多說明，也可以包含 `inline code` 或連結，例如 <https://www.markdownguide.org/>。

## HTML 區塊

Bambook 允許安全範圍內的 HTML，因此可以使用像 `<details>` 這樣的摺疊區塊：

<details>
<summary>點我展開補充說明</summary>

這段文字藏在摺疊區塊中。它適合放答案、提示，或是不想讓頁面一開始太長的補充內容。

</details>

## 分隔線與跳脫字元

分隔線可以用三個以上的減號、星號或底線建立。下面是一條分隔線：

---

如果你想顯示 Markdown 符號本身，而不是讓它被解析，可以使用反斜線跳脫。例如 \*這段不會變成斜體\*，\# 這行不會變成標題。

## 小結

如果這篇文章中的標題、文字樣式、引用、清單、連結、圖片、程式碼、表格、數學式、定義列表、註腳與 HTML 摺疊區塊都能正常顯示，代表 Bambook 的 Markdown 文章功能已經足以支援一般課程文章與學習筆記。
