// 把網站對 jsdelivr 與 Google Fonts 的請求導到 vendor/ 裡的本機檔案，給連不到這兩個網站的雲端環境跑瀏覽器測試。
// 先執行一次 node tests/cdn-mirror/build.mjs，然後：
//   BAMBOOK_TEST_MIRROR=$PWD/tests/cdn-mirror/mirror.cjs node tests/test_site_routes.mjs <網址>
const fs = require("fs");
const path = require("path");
const VENDOR = path.join(__dirname, "vendor");
if (!fs.existsSync(path.join(VENDOR, "esm"))) throw new Error("先執行 node tests/cdn-mirror/build.mjs");

const TYPES = { ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
const file = f => ({ status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f) });

// 字型可有可無：vendor/fonts/ 有這三個檔，截圖的字型就跟線上一樣；沒有就用系統字型。
// 檔案來自 Google Fonts 下載的 Noto Sans、Noto Sans TC、Noto Sans Mono（zip 裡的 variable 字型）。
const FONTS = { "Noto Sans": "NotoSans-VariableFont_wdth,wght.ttf", "Noto Sans TC": "NotoSansTC-VariableFont_wght.ttf", "Noto Sans Mono": "NotoSansMono-VariableFont_wdth,wght.ttf" };
const fontPath = name => path.join(VENDOR, "fonts", FONTS[name]);
const fontCSS = Object.keys(FONTS).filter(name => fs.existsSync(fontPath(name)))
  .map(name => `@font-face { font-family: "${name}"; src: url("https://fonts.gstatic.com/local/${encodeURIComponent(name)}") format("truetype"); font-weight: 100 900; font-display: swap; }`)
  .join("\n");

module.exports = async function mirror(target) {
  await target.route("https://cdn.jsdelivr.net/**", route => {
    const m = new URL(route.request().url()).pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/(.*)$/);
    if (!m) return route.abort();
    const [, pkg, rest] = m;
    const f = rest === "+esm" ? path.join(VENDOR, "esm", pkg.replace("/", "__") + ".mjs")
      : pkg === "katex" && rest.startsWith("dist/") ? path.join(VENDOR, "katex-dist", rest.slice(5))
      : null;
    return f && fs.existsSync(f) ? route.fulfill(file(f)) : route.abort();
  });
  await target.route("https://fonts.googleapis.com/**", route => route.fulfill({ status: 200, contentType: "text/css", body: fontCSS }));
  await target.route("https://fonts.gstatic.com/**", route => {
    const name = decodeURIComponent(new URL(route.request().url()).pathname.split("/").pop());
    return FONTS[name] && fs.existsSync(fontPath(name)) ? route.fulfill(file(fontPath(name))) : route.abort();
  });
};
