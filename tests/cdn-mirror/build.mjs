// 把 site.js 與 index.html 從 jsdelivr 載入的套件，照同樣的版本裝到 vendor/，給 mirror.cjs 用。
// 版本直接從網站的 import 網址讀，改版本後重跑一次就好。執行：node tests/cdn-mirror/build.mjs
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const VENDOR = join(HERE, "vendor");
const WORK = join(VENDOR, "work");

const sources = ["assets/js/site.js", "index.html"].map(f => readFileSync(join(ROOT, f), "utf8")).join("\n");
const versions = {};
for (const [, pkg, version] of sources.matchAll(/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/"']+)\//g)) {
  if (versions[pkg] && versions[pkg] !== version) throw new Error(`${pkg} 有兩個版本：${versions[pkg]}、${version}`);
  versions[pkg] = version;
}
const esm = [...sources.matchAll(/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/\+esm/g)].map(m => m[1]);

rmSync(join(VENDOR, "esm"), { recursive: true, force: true });
rmSync(join(VENDOR, "katex-dist"), { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
writeFileSync(join(WORK, "package.json"), JSON.stringify({ private: true, dependencies: { ...versions, esbuild: "0.28.2" } }, null, 2));
execFileSync("npm", ["install", "--no-audit", "--no-fund", "--save-exact"], { cwd: WORK, stdio: "inherit" });

const esbuild = join(WORK, "node_modules", ".bin", "esbuild");
mkdirSync(join(VENDOR, "esm"), { recursive: true });
for (const pkg of new Set(esm)) {
  const entry = join(WORK, `entry-${pkg.replace("/", "__")}.mjs`);
  writeFileSync(entry, `export { default } from "${pkg}";\n`);
  execFileSync(esbuild, [entry, "--bundle", "--format=esm", `--outfile=${join(VENDOR, "esm", pkg.replace("/", "__") + ".mjs")}`], { cwd: WORK, stdio: "inherit" });
}
if (versions.katex) cpSync(join(WORK, "node_modules", "katex", "dist"), join(VENDOR, "katex-dist"), { recursive: true });

console.log("完成：", Object.entries(versions).map(([p, v]) => `${p}@${v}`).join("、"));
if (!existsSync(join(VENDOR, "fonts"))) console.log("（沒有 vendor/fonts/：截圖會用系統字型，測試照樣能跑。見 mirror.cjs）");
