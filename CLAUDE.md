# CLAUDE.md

- 這是純粹的學習資料站（課輔社群的教材、研討時間表、數學筆記）。讀者是用手機的學生；工具主要是 SU 自己在用。
- **版面原則（SU 指定）**：不要過度使用卡片。資訊層級靠間距（組內 4–8px、組間 28–40px）、顏色（muted 說明文字、accent 標示「現在」）、字級與字重建立；只有在同一組內才用極淡分隔線。按鈕、連結以文字按鈕為主，點擊範圍靠 padding 撐到 40px 以上。
- 使用說明與內容規則：`README.md`。版面決定：`DESIGN.md`（原型選定後建立）。
- 改動流程：改程式前先寫測試（tdd skill），`python -m pytest tests` 全過才交付；介面改動用 Playwright 以 iPhone 尺寸、淺色與深色截圖自查。
- 雲端環境連不到 jsdelivr 與 Google Fonts 時，瀏覽器測試用 `BAMBOOK_TEST_MIRROR` 指向把 CDN 導到本機的腳本。
- 產生的檔案（`site-manifest.json`、`a/`、`c/`）不要手改，由 commit hook 產生。
- 教科書與簡報照放；權利人通知時再取下。解答只要網頁上時間到之前沒有按鈕即可，不做真正的鎖定。
- SU 用 GitHub Desktop commit／push；Claude 不能替他 commit。
- 每階段交付：改了什麼、測試結果、截圖、SU 的手機實測清單；結束後跑 retro，把 SU 的修改意見寫回本檔或 DESIGN.md。
