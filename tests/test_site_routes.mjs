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
await page.waitForSelector(".course-layout");
check("課程短網址轉進課程頁", decodeURIComponent(page.url()).endsWith("#materials=微積分乙"), page.url());

// 6. 站內文章連結都用短網址
await page.goto(base + "#articles");
await page.waitForSelector("a.row");
const hrefs = await page.$$eval("a[href^='#article=']", as => as.map(a => a.getAttribute("href")));
check("站內文章連結都是短網址", hrefs.length > 0 && hrefs.every(h => !h.includes("%2F") && !h.endsWith(".md")), hrefs.slice(0, 3).join(" "));

await browser.close();
process.exit(failed ? 1 : 0);
