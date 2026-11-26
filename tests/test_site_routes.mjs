// 瀏覽器端的路由與分享連結測試（Playwright，在雲端或本機都可以跑）：
//   node tests/test_site_routes.mjs <網站根目錄網址>
// 例：先在 bambook 資料夾執行 python -m http.server 8001，再 node tests/test_site_routes.mjs http://127.0.0.1:8001/
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] || "http://127.0.0.1:8001/";
const browser = await chromium.launch();
const page = await browser.newPage();
// 連不到 CDN 的環境（例如 Claude 的雲端工作區）可以指定一個把 CDN 導到本機檔案的腳本
if (process.env.BAMBOOK_TEST_MIRROR) await require(process.env.BAMBOOK_TEST_MIRROR)(page);
let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + detail}`);
  if (!ok) failed++;
};

// 1. 舊網址自動換成短網址
await page.goto(base + "#article=" + encodeURIComponent("微積分/2026-09-26-epsilon-delta-definition.md"));
await page.waitForSelector(".article-body h2");
check("舊網址換成短網址", decodeURIComponent(page.url()).endsWith("#article=epsilon-delta-definition"), page.url());

// 2. 小節代號用標題文字（不含第幾個）
const ids = await page.$$eval(".article-body h2[id]", hs => hs.map(h => h.id));
check("小節代號不含流水號", ids.length > 0 && ids.every(id => !/^heading-\d/.test(id)), ids.join(","));

// 3. 每個 h2 都有 # 分享按鈕，文章有複製連結按鈕
check("h2 有分享按鈕", await page.$$eval(".article-body h2 .heading-link", b => b.length) === ids.length);
check("文章有複製連結按鈕", !!(await page.$("[data-copy-link]")));

// 4. 短網址頁面轉進文章，並帶著小節
await page.goto(base + "a/epsilon-delta-definition/#" + encodeURIComponent(ids[1] || ids[0]));
await page.waitForSelector(".article-body h2");
check("短網址頁面轉進文章並帶小節", decodeURIComponent(page.url()).includes("#article=epsilon-delta-definition&sec=" + (ids[1] || ids[0])), page.url());

// 5. 課程短網址
await page.goto(base + "c/" + encodeURIComponent("微積分乙") + "/");
await page.waitForSelector(".course-view");
check("課程短網址轉進課程頁", decodeURIComponent(page.url()).endsWith("#materials=微積分乙"), page.url());

// 6. 站內文章連結都用短網址
await page.goto(base + "#articles");
await page.waitForSelector("a.row");
const hrefs = await page.$$eval("a[href^='#article=']", as => as.map(a => a.getAttribute("href")));
check("站內文章連結都是短網址", hrefs.length > 0 && hrefs.every(h => !h.includes("%2F") && !h.endsWith(".md")), hrefs.slice(0, 3).join(" "));

// ---- 第 2 階段：首頁本週活動、課程時間表、小考開放時間、主題跟隨系統 ----
const at = (when, hash = "") => base.replace(/\/?$/, "/") + "?now=" + encodeURIComponent(when) + hash;
const course = "#materials=" + encodeURIComponent("微積分乙");

// 7. 首頁焦點：進行中的研討放最上面（最大的字），其他近期研討列在下面
await page.goto(at("2026-11-25T19:00"));
await page.waitForSelector("#hero-slot:not(.is-loading)");
const hero = await page.$eval("#hero-slot", h => ({ eyebrow: h.querySelector(".hero-eyebrow")?.textContent || "", topic: h.querySelector(".hero-topic")?.textContent || "" }));
check("焦點是進行中的研討", hero.eyebrow.startsWith("進行中") && hero.topic === "積分技巧", JSON.stringify(hero));
const others = await page.$$eval("#week-slot .week-item .date-col b", bs => bs.map(b => b.textContent));
check("其他近期研討不重複焦點", JSON.stringify(others) === JSON.stringify(["12/2"]), JSON.stringify(others));

// 8. 研討剛結束：焦點換成下一場，剛結束的（拿解答用）留在下面
await page.goto(at("2026-11-26T12:00"));
await page.waitForSelector("#hero-slot:not(.is-loading)");
const next = await page.$eval("#hero-slot", h => h.querySelector(".hero-eyebrow").textContent + "|" + h.querySelector(".hero-topic").textContent);
check("焦點換成下一場", next === "下一場研討・還有 6 天|積分應用", next);
check("剛結束的留在下面", (await page.$$eval("#week-slot .week-item.is-past", x => x.length)) === 1);

// 9. 完全沒有研討時：焦點顯示網站名稱，其他近期研討隱藏
await page.goto(at("2027-03-01T12:00"));
await page.waitForSelector("#hero-slot:not(.is-loading)");
check("沒有研討時顯示網站名稱", await page.$eval("#hero-slot", h => !!h.querySelector(".hero-title")));
check("沒有研討時隱藏其他近期研討", await page.$eval("#week-slot", el => el.hidden));

// 10. 課程頁時間軸：只露出目前與下一次；之前的收在「已結束」、之後的收在「之後」
await page.goto(at("2026-11-26T12:00", course));
await page.waitForSelector(".tl-session.is-next");
const shown = await page.$$eval(".tl-wrap > .tl .tl-session .tl-head b", bs => bs.map(b => b.textContent));
check("只露出目前與下一次", JSON.stringify(shown) === JSON.stringify(["12/2 週三", "12/9 週三"]), JSON.stringify(shown));
check("之前的收在「已結束」", (await page.$eval(".tl-fold.is-before .tl-fold-label", t => t.firstChild.textContent)) === "8 次研討");
check("左側主題不寫「目前」", !(await page.$eval(".tl-wrap > .tl", el => el.querySelector(".tl-topic-name").textContent.includes("目前"))));
check("同主題連續的研討只寫一次主題", (await page.$$eval(".tl-wrap > .tl .tl-topic", t => t.length)) === 1);
check("講義用 PDF 連結樣式", (await page.$$eval(".tl-wrap > .tl .file-links a.resource-document-link svg", a => a.length)) >= 2);
const groups = await page.$$eval(".tl-session.is-next .file-group", gs => gs.map(g => g.querySelector(".file-group-label").textContent + ":" + [...g.querySelectorAll("a")].map(a => a.textContent).join("/")));
check("Handout 成一組、分填空與解答", JSON.stringify(groups) === JSON.stringify(["Handout:填空/解答"]), JSON.stringify(groups));

// 11. 研討當晚：目前那次與下一次露出，之後的收在「之後」；小考解答在時段結束後才出現
const quizRow = () => page.$$eval(".tl-session", rows => { const r = rows.find(x => x.querySelector(".tl-head b").textContent.startsWith("11/25")); return { links: r.querySelectorAll(".file-links a").length, locked: !!r.querySelector(".file-pending") }; });
await page.goto(at("2026-11-25T19:00", course));
await page.waitForSelector(".tl-session.is-next");
const shownLive = await page.$$eval(".tl-wrap > .tl .tl-session .tl-head b", bs => bs.map(b => b.textContent));
check("進行中那次與下一次露出", JSON.stringify(shownLive) === JSON.stringify(["11/25 週三", "12/2 週三"]), JSON.stringify(shownLive));
check("之後的收在「之後」", (await page.$eval(".tl-fold.is-after .tl-fold-label", t => t.firstChild.textContent)) === "1 次研討");
const before = await quizRow();
await page.goto(at("2026-11-25T20:31", course));
await page.waitForSelector(".tl-session.is-next");
const after = await quizRow();
check("小考解答時間到前是灰字", before.links === 1 && before.locked, JSON.stringify(before));
check("小考解答時間到後可下載", after.links === 2, JSON.stringify(after));

// 12. 點「已結束」會展開；整門課都結束時只露出最後兩次
await page.goto(at("2026-11-26T12:00", course));
await page.waitForSelector(".tl-fold summary");
await page.click(".tl-fold.is-before summary");
await page.waitForTimeout(400);
check("點「已結束」會列出之前的研討", await page.$eval(".tl-fold.is-before", d => d.open && d.querySelectorAll(".tl-session").length === 8));
await page.goto(at("2026-11-26T12:00", "#materials=" + encodeURIComponent("工程數學")));
await page.waitForSelector(".tl-wrap");
check("整門課都結束時只露出最後兩次", (await page.$$eval(".tl-wrap > .tl .tl-session", r => r.length)) === 2 && !!(await page.$(".tl-fold.is-before")));

// 13. 沒手動選過時，深淺色跟隨系統
const darkPage = await browser.newPage({ colorScheme: "dark" });
if (process.env.BAMBOOK_TEST_MIRROR) await require(process.env.BAMBOOK_TEST_MIRROR)(darkPage);
await darkPage.goto(base);
check("深色跟隨系統", await darkPage.evaluate(() => document.documentElement.dataset.theme) === "dark");
await darkPage.close();

await browser.close();
process.exit(failed ? 1 : 0);
