# 是非題研討板

研討課用的匿名是非題討論板。每次上課列出這次的是非題，每題各自有「對」「錯」兩個區域，
學生自己想寫哪題就寫哪題，不用每題都填；送出後全班（含老師的投影畫面）即時同步看到，
一律直接公開，沒有收起來、審核之類的機制。如果有不合適的內容，老師直接到 Firebase
Console 的 Firestore Database 頁面手動刪掉那筆文件即可。

每則留言旁邊有一個「👍」，同學看到已經有人寫過類似的想法時可以直接按讚，不用再打一次；
留言預設依讚數排序，讚多的排前面。

網頁本身放在 GitHub Pages 上，但留言需要跨裝置即時同步，靜態網頁本身做不到，
所以額外接了 Google 的 Firebase（Firestore）當資料庫。這份文件就是帶你一步步接好它，
只需要做一次，之後每週只要編輯 `sessions.json` 就好。

## 一、建立 Firebase 專案（只需做一次）

1. 到 <https://console.firebase.google.com>，用你的 Google 帳號登入，建立新專案。
   免費的 Spark 方案就夠用（不用綁信用卡），專案名稱隨意。
2. 進入專案，左側選單找「**資料庫和儲存空間**」（點開這個分類），裡面選
   「**Firestore Database**」，按「建立資料庫」。

   > ⚠️ **注意**：這個分類底下通常還會看到「Realtime Database」，那是
   > **另一個完全不同的產品**，介面長得有點像，但資料格式跟安全規則的
   > 語法完全不一樣（Realtime Database 用純 JSON 規則，Firestore 用
   > `service cloud.firestore { ... }` 這種語法）。這份工具用的是
   > **Firestore Database**，如果你不小心點進了 Realtime Database、
   > 把下面的規則貼過去，會出現類似「Parse error」的錯誤——代表貼錯地方
   > 了，回頭找「Firestore Database」重新開一個就好，Realtime Database
   > 那個放著不管、不用刪也不會有費用。

3. 位置可以選 `asia-east1`（台灣）或離台灣近的區域，起始規則模式選哪個
   都可以，下一步會整個覆蓋掉。
4. 回到專案總覽頁，點網頁圖示（`</>`）新增一個「網頁應用程式」，名稱隨意，
   不用勾選 Firebase Hosting。建立後畫面會出現一段
   `const firebaseConfig = { apiKey: ..., ... }`，先別關掉這個畫面。

## 二、把設定貼進程式

打開 `assets/js/firebase-config.js`，把上一步拿到的整包 `firebaseConfig` 物件內容
貼進 `FIREBASE_CONFIG`（欄位一一對應貼上即可）。

## 三、貼上安全規則

回到 Firebase Console，確認自己在「**Firestore Database**」（不是 Realtime
Database）→「規則」分頁。把 `firestore.rules` 這個檔案的完整內容貼上
（取代原本內容），按「發布」。

這份規則允許：任何人可以讀取留言、可以新增一則新留言（會檢查欄位格式與
長度上限），已存在的留言只允許「把讚數剛好加 1」這一種修改，不能改留言
內容、不能刪除別人的留言。

## 四、加入這次研討的是非題

打開 `sessions.json`，裡面是一個陣列，每個物件代表一次研討場次：

```json
{
  "id": "2026-09-09",
  "title": "9/9（三）預備微積分（Handout0）",
  "handout": "handout0",
  "questions": [
    { "id": "h0-q1", "text": "給定 $f(x)=\\dfrac{x^2-1}{x-1}$、$g(x)=x+1$，則 $f(x)$ 與 $g(x)$ 是完全相同的函數。" }
  ]
}
```

- `id`：用 `YYYY-MM-DD`，建議跟 `materials/微積分乙/schedule.json` 裡那場研討的日期
  對齊，網頁會自動選出「今天或最近一次已開始」的場次當預設值，也可以用網址
  `?session=2026-09-16` 直接指定某一場。
- `title`：下拉選單看到的文字。
- `questions`：這場的是非題列表，每題一個 `id`（同一場內不能重複）跟 `text`。
  題目文字支援 KaTeX 數學語法，行內用 `$...$`、獨立一行用 `$$...$$`
  （JSON 字串裡的反斜線要打兩個，例如 `\\dfrac`、`\\varepsilon`）。

目前檔案裡已經照 `schedule.json` 的七次研討各建了一個場次，只有第一場
（9/9 Handout0）先幫你放了六題範例——是從 Handout0 裡「判斷真偽」跟
ε-δ 定義那幾題直接搬過來的，可以直接用，也可以刪掉換成你想要的題目。
其餘場次的 `questions` 目前是空陣列，跟往例一樣，研討前找出這份講義裡
適合拿來討論的是非題填進去即可。

## 五、讓工具出現在網站上

在 repo 根目錄執行一次：

```powershell
python tools/build-index.py
```

它會重新產生 `site-manifest.json`，這個資料夾就會出現在網站的「其他」頁面。
之後每週只改 `sessions.json` 不需要重跑這個指令；但如果之後改了 `meta.json`
（例如標題、摘要）才需要重跑。

跟平常一樣，改完後 commit、push 到 GitHub 就會反映到 GitHub Pages 上。

## 六、上課時怎麼用

把這頁的網址（`entries/tools/truefalse-board/`，或直接帶
`?session=2026-09-09` 指定場次）丟到班上的群組或投影在螢幕上，學生用手機
或筆電打開即可，不用登入、不用留名字。每題「對」「錯」兩邊各自獨立，
想寫哪題就寫哪題；看到已經有人寫過類似的理由，按旁邊的「👍」就好，
不用重打一次。

## 七、已知限制

- 完全匿名、沒有登入機制，也沒有審核機制，一律即時公開，所以如果網址被
  班級以外的人拿到亂寫，目前只能到 Firebase Console 的 Firestore Database
  頁面手動刪除該筆文件。用量極小（一學期幾百則留言）完全在免費 Spark 方案
  額度內（每天 5 萬次讀取、2 萬次寫入、1GiB 儲存空間），不會有費用問題。
- 「👍」的防重複只靠瀏覽器自己的 localStorage 記住按過哪些留言，換一台
  裝置、清瀏覽器資料或用無痕模式都可以重新按，這是刻意的取捨（沒有帳號
  系統的情況下沒有更好的辦法），不影響核心功能，只是沒辦法完全防呆。
- 如果之後想要更強的防灌爆機制，可以研究 Firebase App Check，但這份
  設定沒有內建，需要另外申請。
