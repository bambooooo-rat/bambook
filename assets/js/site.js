import MarkdownIt from "https://cdn.jsdelivr.net/npm/markdown-it@14.2.0/+esm";
import markdownItAbbr from "https://cdn.jsdelivr.net/npm/markdown-it-abbr@2.0.0/+esm";
import markdownItDeflist from "https://cdn.jsdelivr.net/npm/markdown-it-deflist@3.0.0/+esm";
import markdownItFootnote from "https://cdn.jsdelivr.net/npm/markdown-it-footnote@4.0.0/+esm";
import markdownItIns from "https://cdn.jsdelivr.net/npm/markdown-it-ins@4.0.0/+esm";
import markdownItMark from "https://cdn.jsdelivr.net/npm/markdown-it-mark@4.0.0/+esm";
import markdownItSub from "https://cdn.jsdelivr.net/npm/markdown-it-sub@2.0.0/+esm";
import markdownItSup from "https://cdn.jsdelivr.net/npm/markdown-it-sup@2.0.0/+esm";
import markdownItTaskLists from "https://cdn.jsdelivr.net/npm/markdown-it-task-lists@2.1.1/+esm";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.4.11/+esm";
import renderMathInElement from "https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/contrib/auto-render.mjs";

const markdown = new MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(markdownItAbbr)
  .use(markdownItDeflist)
  .use(markdownItFootnote)
  .use(markdownItIns)
  .use(markdownItMark)
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItTaskLists, { enabled: true, label: true });

const markdownSanitizeOptions = {
  USE_PROFILES: { html: true, svg: true, mathMl: true },
  ADD_TAGS: ["input"],
  ADD_ATTR: ["checked", "disabled", "type", "class", "id", "for", "aria-hidden", "aria-label"],
};

// Inline Tabler Icons (outline set) keep the public site independent of icon CDNs.
const tablerIcon = paths => `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ICONS = {
  book: tablerIcon('<path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12"/><path d="M19 16h-12a2 2 0 0 0 -2 2"/><path d="M9 8h6"/>'),
  math: tablerIcon('<path d="M19 5h-7l-4 14l-3 -6h-2"/><path d="M14 13l6 6"/><path d="M14 19l6 -6"/>'),
  pdf: tablerIcon('<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"/><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6"/><path d="M17 18h2"/><path d="M20 15h-3v6"/><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1"/>'),
  link: tablerIcon('<path d="M9 15l6 -6"/><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"/><path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"/>'),
  presentation: tablerIcon('<path d="M3 4l18 0"/><path d="M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-10"/><path d="M12 16l0 4"/><path d="M9 20l6 0"/><path d="M8 12l3 -3l2 2l3 -3"/>'),
  article: tablerIcon('<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/><path d="M9 9l1 0"/><path d="M9 13l6 0"/><path d="M9 17l6 0"/>'),
  tool: tablerIcon('<path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5"/>'),
  chevron: tablerIcon('<path d="M9 6l6 6l-6 6"/>'),
  // Added for the course-page schedule section (research/study-group session times).
  calendar: tablerIcon('<path d="M4 5m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M4 11h16"/><path d="M11 15h1"/><path d="M12 15v3"/>'),
  // 講義連結專用：填空版是「空白待寫」的版本，用單純的文件外框（沒有內文）；
  // 解答版是「已經寫好內容」的版本，用外框＋內文橫線，兩者互為對照，光看
  // 圖示就能分辨，不用在文字裡重複寫「講義」。
  fileOutline: tablerIcon('<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11"/>'),
  fileText: tablerIcon('<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/><path d="M9 9l1 0"/><path d="M9 13l6 0"/><path d="M9 17l6 0"/>'),
};

const SITE_BASE_URL = new URL("../../", import.meta.url);
const app = document.querySelector("#app");
const materialMenu = document.querySelector("[data-material-menu]");
const pageTransition = document.querySelector("#page-transition");
const state = {
  courses: {},
  articles: [],
  tools: [],
  articleBodies: new Map(),
  tocScrollHandler: null,
  tocScrollRoot: null,
  pageTransitionTimer: null,
  forwardClickPending: false,
  forwardClickResetTimer: null,
  manifestError: "",
};

document.addEventListener("DOMContentLoaded", initialise);

async function initialise() {
  bindEvents();
  await loadSiteManifest();
  buildMaterialMenu();
  buildFooterSitemap();
  route();
}

function bindEvents() {
  window.addEventListener("hashchange", handleHashChange);
  bindThemeToggle();

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!target) return;

    // Marks the hashchange this click is about to cause (if any) as
    // link-driven forward navigation, so handleHashChange() knows to play
    // the curtain for it — see markForwardClick() below for why hashchange
    // alone can't tell a link click apart from back/forward navigation.
    if (target.closest("a[href^='#']")) markForwardClick();

    if (target.closest("[data-toggle-all-months]")) {
      const groups = Array.from(document.querySelectorAll(".sidebar-month-group"));
      const shouldOpen = groups.some(group => !group.open);
      groups.forEach(group => {
        group.open = shouldOpen;
      });
      return;
    }

    const summary = target.closest("summary");
    // 研討時間這個 details/summary 不像其他 .resource-details 可以在
    // prefers-reduced-motion 時整個放手交給瀏覽器原生開合：過去場次的軌道是
    // 外層 .schedule-timeline 的另一個子元素、不受 <details> 原生開合影響
    // （見 toggleSchedulePanel() 的說明），一定要交給它自己同步狀態，動畫與
    // 否則由它內部依 prefersReducedMotion() 判斷。
    const scheduleDetails = summary?.closest(".schedule-panel");
    if (summary && scheduleDetails) {
      event.preventDefault();
      toggleSchedulePanel(scheduleDetails);
      return;
    }
    const details = summary?.closest(".resource-details");
    if (summary && details && !prefersReducedMotion()) {
      event.preventDefault();
      toggleAnimatedDetails(details);
      return;
    }
  });
  // The 教材 dropdown opens on hover/focus via pure CSS (see
  // .nav-menu:hover/:focus-within in site.css); Escape just blurs it for
  // keyboard users.
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.activeElement?.closest(".nav-menu")) {
      document.activeElement.blur();
    }
  });
}

// Drives .resource-details' (投影片/練習與資源 on course pages) open/close
// via WAAPI instead of the browser's instant native <details> toggle —
// ::details-content would do this in pure CSS, but its browser support is
// still too thin to rely on alone. Measures the collapsed height from the
// <summary> and the expanded height from the details element itself, then
// animates block-size between them; native <details> semantics (the "open"
// attribute, keyboard toggling) still drive the actual state.
const detailsAnimations = new WeakMap();
// While closing, details.open only flips to false once the animation
// finishes (so the content stays visible while it collapses) — this tracks
// the in-flight target state separately, so a rapid second click during a
// close reads the pending direction instead of the still-stale attribute.
const detailsTargetState = new WeakMap();
const DETAILS_ANIMATION_MS = 180;

function toggleAnimatedDetails(details) {
  const currentlyOpen = detailsTargetState.has(details) ? detailsTargetState.get(details) : details.open;
  const opening = !currentlyOpen;
  detailsTargetState.set(details, opening);
  detailsAnimations.get(details)?.cancel();

  const summary = details.querySelector(":scope > summary");
  const closedSize = summary ? summary.getBoundingClientRect().height : 0;
  if (opening) details.open = true;
  const openSize = details.getBoundingClientRect().height;
  const keyframes = opening
    ? [{ blockSize: `${closedSize}px` }, { blockSize: `${openSize}px` }]
    : [{ blockSize: `${openSize}px` }, { blockSize: `${closedSize}px` }];

  details.style.overflow = "hidden";
  const animation = details.animate(keyframes, { duration: DETAILS_ANIMATION_MS, easing: easeOutValue() });
  detailsAnimations.set(details, animation);
  animation.finished
    .then(() => { details.open = opening; })
    .catch(() => {})
    .finally(() => {
      details.style.overflow = "";
      detailsAnimations.delete(details);
      detailsTargetState.delete(details);
    });
}

// 研討時間時間軸（.schedule-panel）的開合走的是自己的動畫，跟上面的
// toggleAnimatedDetails() 不一樣：那個是「summary 本身高度不變、下方長出
// 一段新內容」的單向 accordion；這裡「下一次研討」那一站固定在中間，過去
// 場次的軌道（.schedule-track--past）要往上展開、未來場次（--future）要往
// 下展開，等於同時有兩段各自獨立的 0↔auto 高度動畫，因此不能只對整個
// <details> 的 blockSize 做單一動畫（那樣會把中間固定不動的那一站也一起
// 拉伸/裁切掉）。這裡分別對兩段軌道各自的 blockSize 做動畫，讓「收合」讀起
// 來像是把原本就存在的線段重新蓋上遮罩、「展開」則是把遮罩往外移除。
const scheduleTrackAnimations = new WeakMap();
const scheduleTargetState = new WeakMap();

function toggleSchedulePanel(details) {
  // 過去場次的軌道刻意放在 <details> 外面（見 scheduleContent()／site.css
  // 的說明），所以兩段軌道要從共同的外層 wrapper（.schedule-timeline）找，
  // 不能只在 details 底下找。
  const wrapper = details.closest(".schedule-timeline") || details;
  const currentlyOpen = scheduleTargetState.has(details) ? scheduleTargetState.get(details) : details.open;
  const opening = !currentlyOpen;
  scheduleTargetState.set(details, opening);
  scheduleTrackAnimations.get(details)?.forEach(animation => animation.cancel());

  // 過去場次軌道能不能展開完全是靠 .schedule-timeline 的 is-open class（見
  // site.css），這個 class 只有這個函式會動它——不像其他 .resource-details
  // 那樣，reduced-motion 時可以整個放手交給瀏覽器原生的 <details> 開合，這裡
  // 就算不做動畫，也一定要親自把 is-open 跟 details.open 同步設好，不然過去
  // 場次的軌道會永遠展不開。
  if (prefersReducedMotion()) {
    details.open = opening;
    wrapper.classList.toggle("is-open", opening);
    scheduleTrackAnimations.delete(details);
    scheduleTargetState.delete(details);
    return;
  }

  // is-open 跟 details.open 一起在「開始展開」的當下就打開：兩段軌道展開
  // 後的 block-size: auto 都是靠 .schedule-timeline.is-open 這個 class 生效
  // （見 site.css），要先打開才能量到過去場次軌道展開後的真實高度
  // （scrollHeight），也才能在動畫結束、WAAPI 交還控制權的瞬間讓 CSS 已經
  // 是正確的最終值，不會又彈回 0 高度。
  if (opening) {
    details.open = true;
    wrapper.classList.add("is-open");
  }

  const tracks = Array.from(wrapper.querySelectorAll(".schedule-track--past, .schedule-track--future"));
  const animations = tracks.map(track => {
    const openSize = track.scrollHeight;
    const keyframes = opening
      ? [{ blockSize: "0px" }, { blockSize: `${openSize}px` }]
      : [{ blockSize: `${openSize}px` }, { blockSize: "0px" }];
    return track.animate(keyframes, { duration: DETAILS_ANIMATION_MS, easing: easeOutValue() });
  });
  scheduleTrackAnimations.set(details, animations);

  Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
    // 如果動畫進行到一半又被下一次點擊打斷，取消（cancel）會讓這裡的
    // Promise 稍後才 settle；這時 scheduleTrackAnimations 已經被新的一次
    // toggleSchedulePanel() 呼叫覆寫成新的動畫陣列，用參照比對確認自己還是
    // 最新的一次，不是的話就不要動 details.open/is-open，讓新的那次自己
    // 收尾。
    if (scheduleTrackAnimations.get(details) !== animations) return;
    details.open = opening;
    if (!opening) wrapper.classList.remove("is-open");
    scheduleTrackAnimations.delete(details);
    scheduleTargetState.delete(details);
  });
}

function easeOutValue() {
  return getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "ease-out";
}

// Light is always the default (no OS-preference auto-detection). A saved
// choice is applied before first paint by the inline script in index.html's
// <head>; this wires up the button and keeps it in sync.
const THEME_STORAGE_KEY = "bambook-theme";

function bindThemeToggle() {
  const button = document.querySelector("#theme-toggle");
  if (!button) return;
  syncThemeToggle(button);
  button.addEventListener("click", () => {
    const goingDark = document.documentElement.dataset.theme !== "dark";
    if (goingDark) document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, goingDark ? "dark" : "light");
    } catch (error) {
      // Private browsing / storage disabled — the toggle still works for
      // this page load, it just won't be remembered next visit.
    }
    syncThemeToggle(button);
  });
}

function syncThemeToggle(button) {
  const isDark = document.documentElement.dataset.theme === "dark";
  button.setAttribute("aria-pressed", String(isDark));
  button.setAttribute("aria-label", isDark ? "切換為亮色模式" : "切換為深色模式");
}

function buildMaterialMenu() {
  const names = courseNames();
  materialMenu.innerHTML = names.length
    ? names.map(name => `<a href="#materials=${encodeURIComponent(name)}">${escapeHTML(name)}</a>`).join("")
    : `<span class="menu-message">教材資料尚未載入</span>`;
}

// Each footer column is capped at 4 items (with a "查看全部" link to the
// hub page once truncated) and each label is clipped to 6 characters so a
// long title can't blow out the column width.
const FOOTER_SITEMAP_ITEM_LIMIT = 4;
const FOOTER_SITEMAP_LABEL_LIMIT = 6;

function buildFooterSitemap() {
  const sitemap = document.querySelector("[data-footer-sitemap]");
  if (!sitemap) return;
  const columns = [
    {
      title: "教材",
      moreHref: "#materials",
      items: courseNames().map(name => ({ label: name, href: `#materials=${encodeURIComponent(name)}` })),
    },
    {
      title: "文章",
      moreHref: "#articles",
      items: state.articles.map(article => ({ label: article.title, href: `#article=${encodeURIComponent(article.path)}` })),
    },
    {
      title: "其他",
      moreHref: "#tools",
      items: toolCards().map(tool => ({ label: tool.title, href: tool.href })),
    },
  ];
  sitemap.innerHTML = columns.map(column => footerSitemapColumn(column)).join("");
}

function footerSitemapColumn({ title, items, moreHref }) {
  const shown = items.slice(0, FOOTER_SITEMAP_ITEM_LIMIT);
  const rows = shown.length
    ? shown.map(item => `<li><a href="${safeURL(item.href)}" title="${escapeHTML(item.label)}">${escapeHTML(truncateLabel(item.label))}</a></li>`).join("")
    : `<li class="menu-message">尚無資料</li>`;
  const more = items.length > FOOTER_SITEMAP_ITEM_LIMIT
    ? `<li><a class="footer-sitemap-more" href="${safeURL(moreHref)}">${ICONS.chevron}<span>查看全部</span></a></li>`
    : "";
  return `<div class="footer-sitemap-col"><h3>${escapeHTML(title)}</h3><ul>${rows}${more}</ul></div>`;
}

// Truncates by Unicode code point so multi-byte CJK characters each count
// as one character.
function truncateLabel(label, limit = FOOTER_SITEMAP_LABEL_LIMIT) {
  const characters = Array.from(String(label || ""));
  return characters.length > limit ? `${characters.slice(0, limit).join("")}...` : characters.join("");
}

async function loadSiteManifest() {
  try {
    const response = await fetch(assetURL("site-manifest.json"), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    if (!manifest || typeof manifest !== "object") throw new Error("site-manifest.json 格式不正確");
    state.courses = manifest.materials && typeof manifest.materials === "object" ? manifest.materials : {};
    state.tools = (Array.isArray(manifest.entries) ? manifest.entries : []).map(normaliseEntryCard);
    state.articles = (Array.isArray(manifest.articles) ? manifest.articles : [])
      .filter(item => item && typeof item.path === "string")
      .map(item => ({
        path: item.path.replace(/^\/+/, ""),
        title: item.title || fileTitle(item.path),
        date: item.date || "",
        status: item.status || "",
        tags: Array.isArray(item.tags) ? item.tags : [],
        summary: item.summary || "",
      }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } catch (error) {
    state.manifestError = `網站索引無法載入：${error.message}`;
  }
}

// .page-transition's keyframes cover the screen by 45% of .48s (216ms);
// this fires just after, once the curtain is certainly fully closed.
const PAGE_TRANSITION_COVER_DELAY = 230;

// Browsers fire "popstate" for every fragment navigation — a plain forward
// link click included, not just back/forward — so it can't tell the two
// apart. Only clicking one of our own href="#..." links can, so bindEvents()
// marks that directly; this fires just before the hashchange it causes (if
// any — a click that doesn't actually change the hash never gets one, which
// is what the reset timer cleans up). Anything else that changes the hash
// (the browser's back/forward button, iOS Safari's edge-swipe-back gesture)
// arrives with no click to mark, so it skips the curtain — those already
// play their own transition, and stacking ours on top reads as double
// motion.
function markForwardClick() {
  state.forwardClickPending = true;
  clearTimeout(state.forwardClickResetTimer);
  state.forwardClickResetTimer = setTimeout(() => {
    state.forwardClickPending = false;
  }, 50);
}

function handleHashChange() {
  if (!state.forwardClickPending) {
    route();
    return;
  }
  state.forwardClickPending = false;
  clearTimeout(state.forwardClickResetTimer);
  navigate();
}

function navigate() {
  if (!pageTransition || prefersReducedMotion()) {
    route();
    return;
  }
  if (state.pageTransitionTimer) clearTimeout(state.pageTransitionTimer);
  pageTransition.classList.remove("is-active");
  void pageTransition.offsetWidth; // force reflow so the animation restarts
  pageTransition.classList.add("is-active");
  state.pageTransitionTimer = setTimeout(() => {
    state.pageTransitionTimer = null;
    route();
  }, PAGE_TRANSITION_COVER_DELAY);
}

// Route changes triggered by hashchange play the page-transition curtain
// (navigate() above) and defer this call until the curtain fully covers the
// screen, so neither the DOM swap nor the scroll reset below is ever
// visible. The initial page load calls route() directly, unanimated.
function route() {
  clearArticleTocScroll();
  document.body.classList.remove("article-mode");
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const hash = decodedHash();
  const [name, value = ""] = hash.split(/=(.*)/s);

  if (name === "materials") { if (value) renderCourse(value); else renderMaterialsIndex(); }
  else if (name === "articles") renderArticlesPage();
  else if (name === "article") renderArticlesPage(value);
  else if (name === "tools") renderTools();
  else renderHome();
}

function clearArticleTocScroll() {
  if (!state.tocScrollHandler) return;
  (state.tocScrollRoot || window).removeEventListener("scroll", state.tocScrollHandler);
  state.tocScrollHandler = null;
  state.tocScrollRoot = null;
}

function renderHome() {
  setActiveNav("");
  document.title = "Bambook";
  const names = courseNames();
  const materialRows = names.length
    ? names.map(name => row({
        href: `#materials=${encodeURIComponent(name)}`,
        title: name,
        desc: `${name}的課本、講義、投影片與練習資源。`,
        meta: materialMeta(state.courses[name]),
      })).join("")
    : emptyState("教材資料尚未載入。請先執行 tools/build-index.py。");
  const articleRows = state.manifestError
    ? emptyState(state.manifestError)
    : state.articles.length
      ? state.articles.slice(0, 3).map(article => row({
          href: `#article=${encodeURIComponent(article.path)}`,
          title: article.title,
          desc: article.summary || "閱讀這篇文章。",
          meta: formatDate(article.date),
        })).join("")
      : emptyState("尚未有文章。");
  const toolRows = toolCards().slice(0, 3).map(tool => row({
    href: tool.href,
    title: tool.title,
    desc: tool.description,
    tags: tool.tags,
  })).join("") || emptyState("尚未找到工具資料夾。");

  app.innerHTML = `
    <div class="home-view">
      ${homeIntroShell()}
      <section class="block" id="home-materials">
        ${blockHead(ICONS.book, "教材", "#materials", "全部教材")}
        <div class="row-list">${materialRows}</div>
      </section>
      <section class="block" id="home-articles">
        ${blockHead(ICONS.article, "文章", "#articles", "全部文章")}
        <div class="row-list">${articleRows}</div>
      </section>
      <section class="block" id="home-tools">
        ${blockHead(ICONS.tool, "其他工具", "#tools", "全部工具")}
        <div class="row-list">${toolRows}</div>
      </section>
    </div>`;
}

function blockHead(icon, title, href, linkLabel) {
  return `<div class="block-head">
    <div class="block-head-title"><span class="block-head-icon">${icon}</span><h2>${escapeHTML(title)}</h2></div>
    <a class="all-link" href="${safeURL(href)}">${ICONS.chevron}<span>${escapeHTML(linkLabel)}</span></a>
  </div>`;
}

// Row-count summary shown next to a course's row-desc (e.g. "3 課本 · 6
// 講義"); empty categories are omitted.
function materialMeta(course = {}) {
  const parts = [];
  if (Array.isArray(course.textbooks) && course.textbooks.length) parts.push(`${course.textbooks.length} 課本`);
  if (Array.isArray(course.handouts) && course.handouts.length) parts.push(`${course.handouts.length} 講義`);
  return parts.join(" · ");
}

// Chevron and title are explicit siblings sharing the same grid row (see
// .row in site.css) so align-items: center lines the icon up with the
// title's line box; desc/meta/tags live in their own row-body block below.
function row({ href, title, desc = "", meta = "", tags = [] }) {
  const hasBody = desc || meta || tags.length;
  return `<a class="row" href="${safeURL(href)}">
    <span class="row-chevron" aria-hidden="true">${ICONS.chevron}</span>
    <div class="row-title">${escapeHTML(title)}</div>
    ${hasBody ? `<div class="row-body">
      ${desc ? `<div class="row-desc">${escapeHTML(desc)}</div>` : ""}
      ${meta ? `<div class="row-meta">${escapeHTML(meta)}</div>` : ""}
      ${tags.length ? `<div class="row-tags">${tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join("")}</div>` : ""}
    </div>` : ""}
  </a>`;
}

// Static, hand-written hero — deliberately not sourced from a Markdown
// file, since the home page's job is to hand people off to real content
// fast rather than explain itself.
function homeIntroShell() {
  return `
    <section class="hero" aria-label="網站首頁">
      <p class="eyebrow">Bambook</p>
      <h1>放教材的地方</h1>
      <p>涵蓋教材、文章與幾個小工具。</p>
      <div class="hero-features">
        <a class="hero-feature" href="#materials">
          <span class="hero-feature-icon">${ICONS.book}</span>
          <span class="hero-feature-title">教材</span>
          <span class="hero-feature-desc">課本、講義與練習整理</span>
          <span class="hero-feature-more">${ICONS.chevron}<span>全部教材</span></span>
        </a>
        <a class="hero-feature" href="#articles">
          <span class="hero-feature-icon">${ICONS.article}</span>
          <span class="hero-feature-title">文章</span>
          <span class="hero-feature-desc">數學筆記與說明</span>
          <span class="hero-feature-more">${ICONS.chevron}<span>全部文章</span></span>
        </a>
        <a class="hero-feature" href="#tools">
          <span class="hero-feature-icon">${ICONS.tool}</span>
          <span class="hero-feature-title">其他工具</span>
          <span class="hero-feature-desc">獨立的小工具</span>
          <span class="hero-feature-more">${ICONS.chevron}<span>全部工具</span></span>
        </a>
      </div>
    </section>`;
}

// items: [{ label, href? }]. Items without an `href`, or the last item,
// render as plain text; only real destination pages become links.
function breadcrumb(items) {
  return `<nav class="breadcrumb" aria-label="麵包屑導覽">${items.map((item, index) => {
    const isLast = index === items.length - 1;
    const sep = index === 0 ? "" : `<span class="breadcrumb-sep" aria-hidden="true">›</span>`;
    const segment = (item.href && !isLast)
      ? `<a href="${safeURL(item.href)}">${escapeHTML(item.label)}</a>`
      : `<span${isLast ? ' aria-current="page"' : ""}>${escapeHTML(item.label)}</span>`;
    return sep + segment;
  }).join("")}</nav>`;
}

// "#materials" with no course name — the hub page the home page's 教材 tile
// and breadcrumbs land on.
function renderMaterialsIndex() {
  setActiveNav("materials");
  document.title = "教材 | Bambook";
  const names = courseNames();
  const rows = names.length
    ? names.map(name => row({
        href: `#materials=${encodeURIComponent(name)}`,
        title: name,
        desc: `${name}的課本、講義、投影片與練習資源。`,
        meta: materialMeta(state.courses[name]),
      })).join("")
    : emptyState("教材資料尚未載入。請先執行 tools/build-index.py。");

  app.innerHTML = `
    ${breadcrumb([{ label: "首頁", href: "#home" }, { label: "教材" }])}
    <header class="page-heading"><p class="eyebrow">Materials</p><h1>教材</h1><p>依科目整理的課本、講義、投影片與練習資源。</p></header>
    <div class="row-list">${rows}</div>`;
}

function renderCourse(name) {
  const course = state.courses[name];
  if (!course) {
    renderNotFound("找不到這份教材", "請從上方的「教材」選單重新選擇課程。");
    return;
  }

  setActiveNav("materials");
  document.title = `${name} | Bambook`;
  const courseLinks = courseNames().map(courseName => `<a class="${courseName === name ? "is-active" : ""}" href="#materials=${encodeURIComponent(courseName)}">${escapeHTML(courseName)}</a>`).join("");

  app.innerHTML = `
    <div class="course-layout">
      <div class="course-content">
        ${breadcrumb([{ label: "首頁", href: "#home" }, { label: "教材", href: "#materials" }, { label: name }])}
        <header class="page-heading">
          <p class="eyebrow">Course materials</p>
          <h1>${escapeHTML(name)}</h1>
          <p>課本、講義、投影片及歷屆練習均由此頁統一整理；點選檔案即可在新分頁開啟。</p>
        </header>
        <div id="schedule-slot"></div>
        <div id="syllabus-slot"></div>
        ${resourceSection("課本", textbookItems(course.textbooks), ICONS.book)}
        ${slidesSection(course.slides)}
        ${practiceSection(course.practice)}
        ${relatedArticlesSection(name)}
      </div>
      <aside class="course-sidebar"><h2>教材</h2>${courseLinks}</aside>
    </div>`;

  renderSchedule(course.schedule, course.handouts);
  renderSyllabus(course.syllabus);
}

// Articles opt into a course page by adding a tag that matches the course
// name exactly (e.g. tag "微積分乙" shows the article on that course's page).
function relatedArticlesSection(courseName) {
  const related = state.articles.filter(article => article.tags.includes(courseName));
  if (!related.length) return "";
  const content = `<div class="row-list">${related.map(article => row({
    href: `#article=${encodeURIComponent(article.path)}`,
    title: article.title,
    desc: article.summary || "閱讀這篇文章。",
    meta: formatDate(article.date),
  })).join("")}</div>`;
  return resourceSection("延伸文章", content, ICONS.book);
}

function renderSyllabus(path) {
  const slot = document.querySelector("#syllabus-slot");
  if (!slot || !path) return;
  slot.innerHTML = resourceSection("課程進度", `<p class="notice">正在載入課程進度…</p>`, ICONS.book);
  fetch(assetURL(path), { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(items => {
      if (!Array.isArray(items)) throw new Error("資料格式不正確");
      slot.innerHTML = resourceSection("課程進度", syllabusItems(items), ICONS.book);
    })
    .catch(() => {
      slot.innerHTML = resourceSection("課程進度", `<p class="notice">課程進度檔暫時無法讀取。</p>`, ICONS.book);
    });
}

// 課業輔導社群的研討時間表：materials/<course>/schedule.json，格式與
// syllabus.json 相同（manifest 只存路徑，實際內容在此以 fetch 惰性載入）。
// 預設只顯示「下一次最近的研討」卡片本身即為 <summary>，點選它會沿用既有的
// details/summary 收合元件展開成地鐵路線圖式的完整期程（一直線搭配圓點），
// 過去／下一次／未來的研討以不同顏色的圓點與文字區分；若所有場次都已結束，
// 改以「最近一次已結束的場次」作為預設顯示的卡片。時間軸每一站若在
// schedule.json 標註了對應的 handout（與講義檔名去掉填空版／解答版後的
// 標題相同，例如 "handout1"），會直接顯示該講義的下載連結。
function renderSchedule(path, handouts = []) {
  const slot = document.querySelector("#schedule-slot");
  if (!slot || !path) return;
  slot.innerHTML = resourceSection("研討時間", `<p class="notice">正在載入研討時間…</p>`, ICONS.calendar);
  fetch(assetURL(path), { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(items => {
      if (!Array.isArray(items)) throw new Error("資料格式不正確");
      slot.innerHTML = resourceSection("研討時間", scheduleContent(items, handouts), ICONS.calendar);
    })
    .catch(() => {
      slot.innerHTML = resourceSection("研討時間", `<p class="notice">研討時間檔暫時無法讀取。</p>`, ICONS.calendar);
    });
}

// schedule.json 每筆的 date 欄位為統一格式 "YYYY-MM-DD HH:MM"（用於排序與
// 判斷是否已結束），time 欄位則是給人看的顯示用時段（例如 "19:00–21:00"）。
function parseScheduleDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function formatScheduleDate(date) {
  return date.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function scheduleContent(rawItems, handouts = []) {
  const now = new Date();
  const parsed = rawItems
    .map(item => {
      const date = parseScheduleDate(item?.date);
      return date ? { ...item, parsedDate: date, displayDate: formatScheduleDate(date), isPast: date < now } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  if (!parsed.length) return emptyState("尚無研討時間資料。");

  const hasUpcoming = parsed.some(item => !item.isPast);
  const upcomingIndex = parsed.findIndex(item => !item.isPast);
  const featuredIndex = upcomingIndex === -1 ? parsed.length - 1 : upcomingIndex;
  const featured = parsed[featuredIndex];
  // 過去場次留在上面（往上展開）、未來場次留在下面（往下展開），兩段都不
  // 含 featured 自己，才不會跟固定顯示的那一站重複出現。兩段本來就已經是
  // 由舊到新排序，直接切片就是各自要的上下順序，不用再反轉。
  const pastItems = parsed.slice(0, featuredIndex);
  const futureItems = parsed.slice(featuredIndex + 1);

  // 只有一場研討時，沒有其餘期程可展開，直接顯示這一站即可，不需要
  // details/summary 的收合外殼、也不需要展開圖示。
  if (parsed.length < 2) {
    return `<ol class="schedule-track schedule-track--solo">${scheduleStop(featured, handouts, { featured: true, hasUpcoming })}</ol>`;
  }

  const pastTrack = pastItems.length
    ? `<ol class="schedule-track schedule-track--past">${pastItems.map(item => scheduleStop(item, handouts)).join("")}</ol>`
    : "";
  const futureTrack = futureItems.length
    ? `<ol class="schedule-track schedule-track--future">${futureItems.map(item => scheduleStop(item, handouts)).join("")}</ol>`
    : "";

  // 展開圖示不再是貼右側的單一箭頭（那樣會讓 summary 多一段右側留白，跟其他
  // 站的 .schedule-stop-body 對不齊，講義連結也就跟著沒對齊）：改成貼在線上、
  // 圓點正上方／正下方各一個小箭頭，收合時分別指向上／下（呼應「往上/往下
  // 展開」的方向），展開後轉個方向指向圓點（呼應「收回這一點」）。哪一段有
  // 內容才畫哪個箭頭，全部都是過去或全部都是未來場次時不會出現多餘的方向。
  const upArrow = pastItems.length ? `<span class="schedule-expand-arrow schedule-expand-arrow--up" aria-hidden="true">${ICONS.chevron}</span>` : "";
  const downArrow = futureItems.length ? `<span class="schedule-expand-arrow schedule-expand-arrow--down" aria-hidden="true">${ICONS.chevron}</span>` : "";

  // 過去場次刻意放在 <details> 之外（見 site.css 的說明：<details> 內建的
  // ::details-content 匿名容器會讓 summary 以外的子元素全部併成同一個 flex
  // item，CSS order 排不到 summary 上面），交給 .schedule-timeline 這個
  // wrapper 統一排出「過去在上、summary 固定在中間、未來在下」的視覺順序。
  return `
    <div class="schedule-timeline">
      ${pastTrack}
      <details class="schedule-panel">
        <summary class="schedule-summary ${scheduleStopClasses(featured, { featured: true, hasUpcoming }).join(" ")}">
          ${scheduleStopInner(featured, handouts, { featured: true })}
          ${upArrow}${downArrow}
        </summary>
        ${futureTrack}
      </details>
    </div>`;
}

// schedule.json 的 handout 欄位對照 course.handouts 裡的 title（講義檔名
// 去掉「_填空版」「_解答版」後的字串，例如 "handout1"），找到就直接輸出
// 講義的下載連結（沿用 handoutLink()，跟課本／投影片／練習與資源同一套安靜
// 的檔名＋圖示樣式）。
function scheduleHandoutLinks(handouts, handoutTitle) {
  if (!handoutTitle) return "";
  const match = (Array.isArray(handouts) ? handouts : []).find(item => item && String(item.title || "").trim() === String(handoutTitle).trim());
  if (!match) return "";
  const links = `${handoutLink(match.blank, "填空", ICONS.fileOutline)}${handoutLink(match.sol, "解答", ICONS.fileText)}`;
  if (!links) return "";
  return `
    <div class="schedule-stop-handouts">
      <p class="schedule-stop-handouts-label">Handout</p>
      <div class="schedule-stop-handouts-links">${links}</div>
    </div>`;
}

// 每一站（過去／下一次／未來）共用同一套結構與樣式，差別只在 state 決定的
// 顏色與 featured 決定的放大強調——收合時只露出 featured 那一站，看起來就
// 只是同一條時間軸的一小段，而不是另一種獨立的卡片元件。
function scheduleStopClasses(item, { featured = false, hasUpcoming = true } = {}) {
  const state = featured ? (hasUpcoming ? "is-next" : "is-past") : (item.isPast ? "is-past" : "is-future");
  const classes = ["schedule-stop", state];
  if (featured) classes.push("schedule-stop--featured");
  return classes;
}

// 圓點＋內文（標題／日期地點／說明＋講義連結）；featured 時額外加上
// 「下一次研討」／「最近一次研討（已結束）」的小標籤。
function scheduleStopInner(item, handouts, { featured = false } = {}) {
  const metaParts = [item.displayDate, item.time, item.location].filter(Boolean);
  const description = item.description ? `<p class="schedule-stop-description">${escapeHTML(item.description)}</p>` : "";
  const label = featured
    ? `<p class="schedule-stop-label">${escapeHTML(item.isPast ? "最近一次研討（已結束）" : "下一次研討")}</p>`
    : "";
  return `
    <div class="schedule-stop-body">
      <div class="schedule-stop-text">
        ${label}
        <div class="schedule-stop-topic-row">
          <p class="schedule-stop-topic"><span class="schedule-dot" aria-hidden="true"></span>${escapeHTML(item.topic || "未命名研討")}</p>
          <span class="schedule-stop-leader" aria-hidden="true"></span>
          ${scheduleHandoutLinks(handouts, item.handout)}
        </div>
        <p class="schedule-stop-meta">${escapeHTML(metaParts.join(" · "))}</p>
      </div>
      ${description}
    </div>`;
}

function scheduleStop(item, handouts, options = {}) {
  return `<li class="${scheduleStopClasses(item, options).join(" ")}">${scheduleStopInner(item, handouts, options)}</li>`;
}

function textbookItems(items = []) {
  if (!items.length) return emptyState("尚無課本資料。");
  return `<div class="resource-grid">${items.map(item => `
    <article class="resource-item">
      <div><div class="resource-name">${documentResourceLink(item.path, item.title || "未命名課本")}</div><div class="resource-meta">${escapeHTML([item.author, item.version].filter(Boolean).join(" · "))}</div></div>
    </article>`).join("")}</div>`;
}

function slidesSection(slides = []) {
  if (!slides.length) return resourceSection("投影片", emptyState("尚無投影片資料。"), ICONS.presentation);
  const content = slides.map(group => `
    <details class="resource-details">
      <summary>${escapeHTML(group.category || "未分類")}</summary>
      <div class="resource-grid">${(group.files || []).map(item => `
        <article class="resource-item"><div class="resource-name">${documentResourceLink(item.path, item.name || "未命名投影片")}</div></article>`).join("")}</div>
    </details>`).join("");
  return resourceSection("投影片", content, ICONS.presentation);
}

function practiceSection(practice = {}) {
  const groups = [
    ["試題", practice.exams],
    ["期中詳解", practice.midterm_answers],
    ["期末詳解", practice.final_answers],
    ["其他詳解", practice.other_answers || practice.answers],
  ].filter(([, items]) => Array.isArray(items) && items.length);
  const links = Array.isArray(practice.links) ? practice.links : [];
  if (!groups.length && !links.length) return resourceSection("練習與資源", emptyState("尚無練習資料。"), ICONS.math);

  const external = links.length ? `<div class="resource-grid">${links.map(item => `
    <article class="resource-item"><div class="resource-name">${externalResourceLink(item.url, item.title || item.url)}</div></article>`).join("")}</div>` : "";
  const detail = groups.map(([title, items]) => `
    <details class="resource-details"><summary>${escapeHTML(title)}</summary>
    <div class="resource-grid">${items.map(item => `<article class="resource-item"><div class="resource-name">${documentResourceLink(item.path, item.name || "未命名檔案")}</div></article>`).join("")}</div></details>`).join("");
  return resourceSection("練習與資源", external + detail, ICONS.math);
}

function syllabusItems(items) {
  return `<ol class="syllabus-list">${items.map(item => {
    const text = [item.date, item.title, ...(item.items || [])].filter(Boolean).join(" · ");
    return `<li>${escapeHTML(text)}</li>`;
  }).join("")}</ol>`;
}

function resourceSection(title, content, icon = ICONS.book) {
  return `<section class="resource-section"><h2>${icon}<span>${escapeHTML(title)}</span></h2>${content}</section>`;
}


function documentResourceLink(path, label) {
  if (!path) return "";
  return `<a class="resource-document-link" href="${safeURL(path)}" target="_blank" rel="noopener" aria-label="開啟 PDF：${escapeHTML(label)}" title="開啟 PDF">${escapeHTML(label)}${ICONS.pdf}</a>`;
}

function externalResourceLink(url, label) {
  if (!url) return "";
  return `<a class="resource-document-link" href="${safeURL(url)}" target="_blank" rel="noopener" aria-label="開啟連結：${escapeHTML(label)}" title="開啟連結">${escapeHTML(label)}${ICONS.link}</a>`;
}

// 沿用課本／投影片／練習與資源同一套安靜的「檔名＋圖示」樣式
// （.resource-document-link），跟其他文件連結的資訊分級一致，不再用突兀的
// 填色按鈕；圖示改用 icon 參數傳入的填空／解答專用圖示（見 ICONS.fileOutline／
// ICONS.fileText），讓「這是講義」這件事光看圖示就認得出來，不用在文字裡
// 重複寫一次「講義」。onclick="event.stopPropagation()"：研討時間「下一次
// 研討」那一站本身是可點展開的 <summary>，若不擋住冒泡，點講義連結會被
// document 上收合 details 的委派事件攔截、變成只是展開/收合而不會真的開啟
// PDF。時間軸裡的講義連結不在 summary 內、不受影響，但一併加上這個保險不
// 影響行為。
function handoutLink(path, label, icon) {
  if (!path) return "";
  return `<a class="resource-document-link" href="${safeURL(path)}" target="_blank" rel="noopener" aria-label="開啟 PDF：${escapeHTML(label)}講義" title="開啟 PDF" onclick="event.stopPropagation()">${escapeHTML(label)}${icon}</a>`;
}

function normaliseArticleReaderShell() {
  document.querySelector(".article-reader > .back-link")?.remove();
  const articleView = document.querySelector("#article-view");
  if (articleView && !document.querySelector("#content-scroll")) {
    const wrapper = document.createElement("div");
    wrapper.id = "content-scroll";
    wrapper.className = "article-scroll";
    articleView.replaceWith(wrapper);
    wrapper.appendChild(articleView);
  }
  const listTitle = document.querySelector(".article-list h2");
  if (listTitle) listTitle.textContent = "文章索引";
  const tocTitle = document.querySelector(".article-toc h2");
  if (tocTitle) tocTitle.textContent = "文章目錄";
  const tocEmpty = document.querySelector(".article-toc .toc-empty");
  if (tocEmpty) tocEmpty.textContent = "正在建立目錄…";
}

function articleOverviewItem(article) {
  return row({
    href: `#article=${encodeURIComponent(article.path)}`,
    title: article.title,
    desc: article.summary || "閱讀這篇文章。",
    meta: formatDate(article.date),
  });
}

async function loadArticle(record) {
  const view = document.querySelector("#article-view");
  if (!view) return;
  try {
    let parsed = state.articleBodies.get(record.path);
    if (!parsed) {
      const response = await fetch(assetURL(`content/${record.path}`), { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      parsed = parseFrontMatter(await response.text());
      state.articleBodies.set(record.path, parsed);
    }
    const article = { ...record, ...parsed.info, tags: normaliseTags(parsed.info.tags || record.tags) };
    document.title = `${article.title} | Bambook`;
    const dirtyHTML = renderMarkdown(parsed.body);
    view.innerHTML = `
      ${breadcrumb([{ label: "首頁", href: "#home" }, { label: "文章", href: "#articles" }, { label: article.title }])}
      <header class="article-header">
        <div class="article-date">${escapeHTML(formatDate(article.date))}</div>
        <h1>${escapeHTML(article.title)}</h1>
        <div class="tag-list">${article.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div>
        ${article.summary ? `<p class="article-summary">${escapeHTML(article.summary)}</p>` : ""}
      </header>
      <div class="article-body">${DOMPurify.sanitize(dirtyHTML, markdownSanitizeOptions)}</div>`;
    hydrateMarkdownBody(view.querySelector(".article-body"), record.path);
    buildArticleTocForPage(view);
    document.querySelector("#content-scroll")?.scrollTo({ top: 0 });
  } catch (error) {
    view.innerHTML = `<p class="error">文章無法載入：${escapeHTML(error.message)}</p>`;
  }
}

function renderArticlesPage(requestedPath = "") {
  setActiveNav("articles");
  if (state.manifestError) {
    renderNotFound("文章資料無法載入", state.manifestError);
    return;
  }
  if (!state.articles.length) {
    renderNotFound("尚未有文章", "在 content/月份資料夾 中建立 Markdown 檔後，執行 build_manifest.py 重新建立網站索引即可。");
    return;
  }
  if (!requestedPath) {
    document.title = "文章 | Bambook";
    app.innerHTML = `
      <section class="article-overview">
        ${breadcrumb([{ label: "首頁", href: "#home" }, { label: "文章" }])}
        <header class="page-heading"><p class="eyebrow">Articles</p><h1>文章</h1><p>筆記、故事與碎碎念。</p></header>
        ${articleOverviewByMonth()}
      </section>`;
    return;
  }

  const record = findArticleByPath(requestedPath);
  if (!record) {
    renderNotFound("找不到文章", "這篇文章可能已被移動、重新命名，或尚未被 site-manifest.json 收錄。");
    return;
  }

  app.innerHTML = `
    <div class="article-reader">
      <div class="articles-layout">
        <aside class="article-list"><h2>文章索引</h2>${articleListGrouped(record.path)}</aside>
        <div id="content-scroll" class="article-scroll">
          <article id="article-view" class="article"><p class="notice">正在載入文章…</p></article>
        </div>
        <aside class="article-toc" data-article-toc><h2>文章目錄</h2><p class="toc-empty">正在建立目錄…</p></aside>
      </div>
    </div>`;
  document.body.classList.add("article-mode");
  normaliseArticleReaderShell();
  loadArticle(record);
}

function findArticleByPath(requestedPath) {
  const normalisedPath = String(requestedPath || "").replace(/^\/+/, "").replace(/\\/g, "/");
  const exact = state.articles.find(article => article.path === normalisedPath);
  if (exact) return exact;

  const filename = normalisedPath.split("/").pop();
  if (!filename) return null;
  return state.articles.find(article => String(article.path || "").split("/").pop() === filename) || null;
}
function articleMonthGroups() {
  const groups = new Map();
  state.articles.forEach(article => {
    const key = articleFolderLabel(article);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(article);
  });
  return sortArticleGroups(groups);
}

function articleListGrouped(activePath) {
  const articles = state.articles
    .filter(article => !isWelcomeArticle(article))
    .slice()
    .sort(compareArticlesForIndex);

  if (!articles.length) {
    return `<p class="toc-empty">目前沒有文章。</p>`;
  }

  return `
    <button type="button" class="sidebar-index-toggle" data-toggle-all-months>
      展開 / 收合所有分類
    </button>

    <div class="sidebar-month-list">
      ${groupArticlesByMonth(articles).map(([month, monthArticles]) => `
        <details class="sidebar-month-group" open>
          <summary class="sidebar-month-label">
            <span>${escapeHTML(month)}</span>
            <small>${monthArticles.length}</small>
          </summary>

          <div class="sidebar-month-items">
            ${monthArticles.map(article => `
              <a class="sidebar-link ${article.path === activePath ? "is-active" : ""}" href="#article=${encodeURIComponent(article.path)}" data-path="${escapeHTML(article.path)}">
                <span>${escapeHTML(article.title || "(無標題)")}</span>
                ${article.status === "draft" ? `<small>draft</small>` : ""}
              </a>
            `).join("")}
          </div>
        </details>
      `).join("")}
    </div>
  `;
}

function isWelcomeArticle(article) {
  const path = String(article?.path || "").replace(/\\/g, "/").toLowerCase();
  return path === "welcome.md" || path.endsWith("/welcome.md");
}

function groupArticlesByMonth(articles) {
  const groups = new Map();

  articles.forEach(article => {
    const month = articleFolderLabel(article);

    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(article);
  });

  return sortArticleGroups(groups);
}

function sortArticleGroups(groups) {
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === "未分類") return 1;
    if (b === "未分類") return -1;
    return String(b).localeCompare(String(a), "zh-Hant", { numeric: true });
  });
}

function articleFolderLabel(article) {
  const path = String(article?.path || "").replace(/\\/g, "/");
  const folder = path.split("/").filter(Boolean)[0];
  if (folder && !folder.toLowerCase().endsWith(".md")) return folder;
  return "未分類";
}
function compareArticlesForIndex(a, b) {
  const aDate = String(a.date || "");
  const bDate = String(b.date || "");

  if (aDate && bDate && aDate !== bDate) {
    return bDate.localeCompare(aDate);
  }

  const aPath = String(a.path || "");
  const bPath = String(b.path || "");

  return bPath.localeCompare(aPath);
}

function articleOverviewByMonth() {
  return `<div class="article-overview-list">${articleMonthGroups().map(([month, articles]) => `
    <section class="article-overview-month">
      <h2>${escapeHTML(month)}</h2>
      <div class="row-list">${articles.map(articleOverviewItem).join("")}</div>
    </section>`).join("")}</div>`;
}

// scrollRoot (#content-scroll) has no positioned ancestor of its own, so a
// heading's .offsetTop resolves against <body> instead — silently including
// the sticky header's height — and overshoots the scroll, landing the
// heading behind the header. Comparing current getBoundingClientRect()
// positions is immune to that: it reflects each element's real on-screen
// position under whatever scroll state already applies.
function scrollTargetIntoContainer(scrollRoot, target, padding = 24) {
  const delta = target.getBoundingClientRect().top - scrollRoot.getBoundingClientRect().top;
  scrollRoot.scrollTo({ top: Math.max(scrollRoot.scrollTop + delta - padding, 0), behavior: scrollBehavior() });
}

function buildArticleTocForPage(view) {
  const toc = document.querySelector("[data-article-toc]");
  const body = view?.querySelector(".article-body");
  if (!toc || !body) return;

  if (state.tocScrollHandler) {
    (state.tocScrollRoot || window).removeEventListener("scroll", state.tocScrollHandler);
    state.tocScrollHandler = null;
    state.tocScrollRoot = null;
  }

  const headings = [...body.querySelectorAll("h1, h2, h3, h4, h5, h6")];
  if (!headings.length) {
    toc.innerHTML = `<h2>文章目錄</h2><p class="toc-empty">此文章沒有標題層級，因此沒有可跳轉的文章目錄。</p>`;
    return;
  }

  const usedIds = new Set();
  headings.forEach((heading, index) => {
    let id = heading.id || slugifyHeading(heading.textContent || "", index);
    while (usedIds.has(id)) id = `${id}-${index + 1}`;
    heading.id = id;
    usedIds.add(id);
  });

  toc.innerHTML = `
    <h2>文章目錄</h2>
    <nav class="toc-nav" aria-label="文章目錄">
      ${headings.map((heading, index) => `
        <button class="toc-link toc-link--${heading.tagName.toLowerCase()}" type="button" data-toc-target="${escapeHTML(heading.id)}">
          ${escapeHTML(heading.textContent || `段落 ${index + 1}`)}
        </button>`).join("")}
    </nav>`;

  const links = [...toc.querySelectorAll("[data-toc-target]")];
  const scrollRoot = document.querySelector("#content-scroll") || window;
  const setActive = activeId => {
    links.forEach(link => link.classList.toggle("is-active", link.dataset.tocTarget === activeId));
  };
  const updateActive = () => {
    let current = headings[0];
    const anchorLine = scrollRoot === window ? 110 : scrollRoot.getBoundingClientRect().top + 36;
    headings.forEach(heading => {
      if (heading.getBoundingClientRect().top <= anchorLine) current = heading;
    });
    setActive(current.id);
  };

  links.forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.tocTarget);
      if (!target) return;
      if (scrollRoot === window) target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      else scrollTargetIntoContainer(scrollRoot, target);
      setActive(target.id);
    });
  });

  let ticking = false;
  state.tocScrollHandler = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateActive();
      ticking = false;
    });
  };
  state.tocScrollRoot = scrollRoot;
  scrollRoot.addEventListener("scroll", state.tocScrollHandler, { passive: true });
  updateActive();
}

function renderTools() {
  setActiveNav("tools");
  document.title = "其他工具 | Bambook";
  const rows = toolCards().map(tool => row({
    href: tool.href,
    title: tool.title,
    desc: tool.description,
    tags: tool.tags,
  })).join("") || emptyState("尚未找到工具資料夾。");
  app.innerHTML = `
    ${breadcrumb([{ label: "首頁", href: "#home" }, { label: "其他工具" }])}
    <header class="page-heading"><p class="eyebrow">Other tools</p><h1>其他工具</h1><p>這些工具都保留為可單獨開啟的靜態頁面，資料與功能已整合進 Bambook。</p></header>
    <div class="row-list">${rows}</div>`;
}

function toolCards() {
  return state.tools.map(tool => {
    const id = tool.id || String(tool.path || "").split("/").filter(Boolean).pop() || "";
    return {
    href: tool.path || "#tools",
    title: tool.title || id || "未命名項目",
    description: tool.description || "開啟這個工具。",
    tags: Array.isArray(tool.tags) ? tool.tags : [],
    };
  });
}

function normaliseEntryCard(item) {
  const path = String(item?.path || item?.url || "");
  const id = String(item?.id || path.split("/").filter(Boolean).pop() || "");
  return {
    ...item,
    id,
    path,
    title: item?.title || id,
    description: item?.description || item?.summary || "",
    tags: Array.isArray(item?.tags) ? item.tags : [],
  };
}

function renderNotFound(title, detail) {
  setActiveNav("");
  document.title = `${title} | Bambook`;
  app.innerHTML = `<a class="back-link" href="#home">← 回到首頁</a><section class="page-heading"><h1>${escapeHTML(title)}</h1><p>${escapeHTML(detail)}</p></section>`;
}

function setActiveNav(name) {
  document.querySelectorAll("[data-nav]").forEach(link => link.classList.toggle("is-active", link.dataset.nav === name));
}

function courseNames() {
  return Object.keys(state.courses).sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

function decodedHash() {
  try { return decodeURIComponent(location.hash.slice(1)); }
  catch { return location.hash.slice(1); }
}

function assetURL(path) {
  return new URL(String(path || "").replace(/^\/+/, ""), SITE_BASE_URL).href;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Respect the OS-level reduced-motion setting for JS-driven scrolling. CSS
// smooth scrolling is handled separately in site.css.
function scrollBehavior() {
  return prefersReducedMotion() ? "auto" : "smooth";
}

function slugifyHeading(text, index) {
  const slug = String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `heading-${index + 1}${slug ? `-${slug}` : ""}`;
}

function renderMarkdown(source) {
  const mathSegments = [];
  const stash = (value, display = false) => {
    const token = `@@BAMBOOK_MATH_${mathSegments.length}@@`;
    mathSegments.push({ token, value, display });
    return token;
  };

  let protectedSource = String(source || "")
    .replace(/\$\$[\s\S]+?\$\$/g, match => stash(match, true))
    .replace(/\\\[[\s\S]+?\\\]/g, match => stash(match, true))
    .replace(/\\\([\s\S]+?\\\)/g, match => stash(match))
    .replace(/(^|[^$])\$(?!\$)((?:\\.|[^\n$\\])+)\$(?!\$)/g, (_, prefix, body) => `${prefix}${stash(`$${body}$`)}`);

  let html = markdown.render(protectedSource);
  mathSegments.forEach(({ token, value, display }) => {
    const replacement = display
      ? `<div class="math-block">${escapeHTML(value)}</div>`
      : escapeHTML(value);
    if (display) {
      html = html.replace(new RegExp(`<p>\\s*${escapeRegExp(token)}\\s*</p>`, "g"), replacement);
    }
    html = html.replaceAll(token, replacement);
  });
  return html;
}

function hydrateMarkdownBody(root, markdownPath = "") {
  if (!root) return;
  resolveMarkdownAssetURLs(root, markdownPath);
  renderMathInElement(root, {
    delimiters: [
      { left: "$$", right: "$$", display: true }, { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false }, { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
  });
  normaliseDisplayMathBlocks(root);
  classifyMarkdownImages(root);
  bindMarkdownFootnotes(root);
}

function resolveMarkdownAssetURLs(root, markdownPath) {
  const basePath = markdownAssetBasePath(markdownPath);
  root.querySelectorAll("[src]").forEach(element => {
    rewriteMarkdownAssetAttribute(element, "src", basePath);
  });
  root.querySelectorAll("a[href]").forEach(element => {
    rewriteMarkdownAssetAttribute(element, "href", basePath);
  });
}

function rewriteMarkdownAssetAttribute(element, attribute, basePath) {
  const value = element.getAttribute(attribute);
  if (!value || !shouldRewriteMarkdownURL(value)) return;
  const normalised = value.replace(/\\/g, "/").replace(/^\/+/, "");
  const target = isSiteRootRelativePath(normalised)
    ? normalised.replace(/^\.?\//, "")
    : `${basePath}${normalised}`.replace(/\/\.\//g, "/");
  element.setAttribute(attribute, assetURL(target));
}

function shouldRewriteMarkdownURL(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(trimmed)) return false;
  return true;
}

function isSiteRootRelativePath(value) {
  return /^(?:assets|content|entries|materials|media|other|data)\//i.test(value) || value.startsWith("./media/");
}

function markdownAssetBasePath(markdownPath) {
  const parts = String(markdownPath || "").replace(/\\/g, "/").split("/").filter(Boolean);
  if (!parts.length || !parts.at(-1).toLowerCase().endsWith(".md")) return "content/";
  parts.pop();
  return parts.length ? `content/${parts.join("/")}/` : "content/";
}

function normaliseDisplayMathBlocks(root) {
  root.querySelectorAll("p").forEach(paragraph => {
    const katexNodes = paragraph.querySelectorAll(".katex");
    if (katexNodes.length !== 1) return;
    const hasNonWhitespaceText = [...paragraph.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (hasNonWhitespaceText) return;
    const children = [...paragraph.children];
    if (children.length !== 1 || !(children[0].classList.contains("katex") || children[0].querySelector(".katex"))) return;
    paragraph.classList.add("math-block", "math-block--paragraph");
  });
}

function classifyMarkdownImages(root) {
  root.querySelectorAll("img").forEach(image => {
    const applyOrientation = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const ratio = image.naturalWidth / image.naturalHeight;
      image.dataset.orientation = ratio > 1.08 ? "landscape" : ratio < .92 ? "portrait" : "square";
    };

    if (image.complete) applyOrientation();
    else image.addEventListener("load", applyOrientation, { once: true });
  });
}

function bindMarkdownFootnotes(root) {
  root.addEventListener("click", event => {
    const link = event.target.closest?.("a[href]");
    if (!link || !root.contains(link)) return;
    const href = link.getAttribute("href") || "";
    if (!/^#fn(?:ref)?\d+/i.test(href)) return;

    const id = decodeURIComponent(href.slice(1));
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    const scrollRoot = document.querySelector("#content-scroll");
    if (scrollRoot) {
      scrollTargetIntoContainer(scrollRoot, target);
    } else {
      target.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    }
  });
}

function parseFrontMatter(source) {
  const text = source.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return { info: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { info: {}, body: text };
  const info = {};
  text.slice(4, end).trim().split("\n").forEach(line => {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    const value = match[2].replace(/^["']|["']$/g, "").trim();
    info[key] = key === "tags" ? normaliseTags(value) : value;
  });
  return { info, body: text.slice(end + 4).replace(/^\n+/, "") };
}

function normaliseTags(tags) {
  if (Array.isArray(tags)) return tags.map(String).map(tag => tag.trim()).filter(Boolean);
  return String(tags || "").split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
}

function fileTitle(path) {
  return decodeURIComponent(path.split("/").pop() || path).replace(/\.md$/i, "");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDate(value) {
  if (!value) return "未標示日期";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
}

function emptyState(message) { return `<p class="empty-state">${escapeHTML(message)}</p>`; }
function safeURL(value) { return escapeHTML(String(value || "#")); }
function escapeHTML(value) { return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]); }
