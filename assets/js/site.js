import MarkdownIt from "https://cdn.jsdelivr.net/npm/markdown-it@14.2.0/+esm";
import markdownItCjkFriendly from "https://cdn.jsdelivr.net/npm/markdown-it-cjk-friendly@3.0.0/+esm";
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
  // CommonMark's emphasis rule looks at the character right outside a `**`
  // delimiter: if it's not whitespace and not punctuation, the delimiter run
  // doesn't count as "flanking" and `**text**` is left as literal asterisks
  // instead of becoming <strong>. That's invisible in English (spaces do the
  // job) but bites constantly in Chinese, where bold text sits directly
  // against surrounding characters with no space — e.g. 的**定義域（Domain）**是
  // fails right after the full-width "）" because the next character (是) is
  // neither whitespace nor punctuation. This plugin patches just that CJK
  // edge case so `**text**` always renders with no surrounding space needed;
  // it doesn't change behavior for any non-CJK content.
  .use(markdownItCjkFriendly)
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
  link: tablerIcon('<path d="M9 15l6 -6"/><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"/><path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"/>'),
  book: tablerIcon('<path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12"/><path d="M19 16h-12a2 2 0 0 0 -2 2"/><path d="M9 8h6"/>'),
  math: tablerIcon('<path d="M19 5h-7l-4 14l-3 -6h-2"/><path d="M14 13l6 6"/><path d="M14 19l6 -6"/>'),
  pdf: tablerIcon('<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"/><path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6"/><path d="M17 18h2"/><path d="M20 15h-3v6"/><path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1"/>'),
  presentation: tablerIcon('<path d="M3 4l18 0"/><path d="M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-10"/><path d="M12 16l0 4"/><path d="M9 20l6 0"/><path d="M8 12l3 -3l2 2l3 -3"/>'),
  chevron: tablerIcon('<path d="M9 6l6 6l-6 6"/>'),
  unfoldVertical: tablerIcon('<path d="M8 7l4 -4l4 4"/><path d="M16 17l-4 4l-4 -4"/><path d="M12 3l0 18"/>'),
  // 講義／小考的 PDF 圖示：沿用 pdf 圖示的上半部（折角的文件），下半部的「PDF」字樣換成
  // 填空線（題目、填空版）或打勾（解答），跟站上其他 PDF 連結同一家族。
  pdfBlank: tablerIcon('<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"/><path d="M5 19h3"/><path d="M10.5 19h3"/><path d="M16 19h3"/><path d="M5 15.5h8"/>'),
  pdfAnswer: tablerIcon('<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4"/><path d="M7.5 17.5l3 3l6 -6.5"/>'),
};

const SITE_BASE_URL = new URL("../../", import.meta.url);
const app = document.querySelector("#app");
const materialMenu = document.querySelector("[data-material-menu]");
const state = {
  courses: {},
  articles: [],
  tools: [],
  articleBodies: new Map(),
  tocScrollHandler: null,
  tocScrollRoot: null,
  forwardClickPending: false,
  forwardClickResetTimer: null,
  manifestError: "",
  articleOverviewObserver: null,
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
  // iOS Safari 預設不會在觸控時套用 :active（除非頁面上有 touchstart 監聽），
  // 按下去的回饋就只剩放開後才出現的點擊結果——加一個什麼都不做的 passive
  // 監聽，手指一碰到研討時間軸、檔案連結這些元素，:active 的按壓狀態就會
  // 立刻出現。passive 代表它不會延遲捲動。
  document.addEventListener("touchstart", () => {}, { passive: true });

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
      if (prefersReducedMotion()) {
        groups.forEach(group => { group.open = shouldOpen; });
      } else {
        groups.forEach(group => toggleAnimatedDetails(group, shouldOpen));
      }
      return;
    }

    const summary = target.closest("summary");
    const details = summary?.closest(".resource-details, .tl-fold");
    if (summary && details && !prefersReducedMotion()) {
      event.preventDefault();
      toggleAnimatedDetails(details);
      return;
    }
    // 文章索引（.sidebar-month-group）分類收合，跟上面的 .resource-details
    // 走同一套動畫函式——原本這裡完全沒有處理，點擊會落回瀏覽器原生的
    // <details> 開合，跟 ::details-content 的支援度一樣不穩定。
    const monthGroup = summary?.closest(".sidebar-month-group");
    if (summary && monthGroup && !prefersReducedMotion()) {
      event.preventDefault();
      toggleAnimatedDetails(monthGroup);
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

function toggleAnimatedDetails(details, forceOpen) {
  const currentlyOpen = detailsTargetState.has(details) ? detailsTargetState.get(details) : details.open;
  const opening = typeof forceOpen === "boolean" ? forceOpen : !currentlyOpen;
  // forceOpen lets a caller drive several <details> toward the same target
  // state at once (see [data-toggle-all-months] in bindEvents()) without
  // re-animating ones that are already there.
  if (opening === currentlyOpen) return;
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

function easeOutValue() {
  return getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "ease-out";
}

// Light is always the default (no OS-preference auto-detection). A saved
// choice is applied before first paint by the inline script in index.html's
// <head>; this wires up the button and keeps it in sync.
const THEME_STORAGE_KEY = "bambook-theme";

// 深色模式（第 2 階段）：沒有手動選過時跟隨系統，系統切換時即時跟著變；按過切換鈕就記住選擇。
// 第一次繪製前的判斷在 index.html 開頭的 inline script，這裡負責之後的變化。
function storedTheme() {
  try { return localStorage.getItem(THEME_STORAGE_KEY); } catch { return null; }
}

function applyTheme(dark) {
  if (dark) document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
}

function bindThemeToggle() {
  const button = document.querySelector("#theme-toggle");
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  media?.addEventListener?.("change", event => {
    if (storedTheme()) return;           // 手動選過就不跟系統
    applyTheme(event.matches);
    if (button) syncThemeToggle(button);
  });
  if (!button) return;
  syncThemeToggle(button);
  button.addEventListener("click", () => {
    const goingDark = document.documentElement.dataset.theme !== "dark";
    applyTheme(goingDark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, goingDark ? "dark" : "light");
    } catch (error) {
      // 無痕模式等不能存：這次照樣切換，下次開啟回到跟隨系統
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
// hub page once truncated). Long labels are clipped by CSS
// (.footer-sitemap-col a: text-overflow: ellipsis) at the column's actual
// width instead of a fixed character count — a count clipped short English
// names like "GeoMaster" even when the column had room for them. The full
// label stays in the title attribute.
const FOOTER_SITEMAP_ITEM_LIMIT = 4;

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
      items: state.articles.map(article => ({ label: article.title, href: articleHref(article) })),
    },
    {
      title: "其他工具",
      moreHref: "#tools",
      items: toolCards().map(tool => ({ label: tool.title, href: tool.href })),
    },
  ];
  sitemap.innerHTML = columns.map(column => footerSitemapColumn(column)).join("");
}

function footerSitemapColumn({ title, items, moreHref }) {
  const shown = items.slice(0, FOOTER_SITEMAP_ITEM_LIMIT);
  const rows = shown.length
    ? shown.map(item => `<li><a href="${safeURL(item.href)}" title="${escapeHTML(item.label)}">${escapeHTML(item.label)}</a></li>`).join("")
    : `<li class="menu-message">尚無資料</li>`;
  const more = items.length > FOOTER_SITEMAP_ITEM_LIMIT
    ? `<li><a class="footer-sitemap-more" href="${safeURL(moreHref)}">${ICONS.chevron}<span>查看全部</span></a></li>`
    : "";
  return `<div class="footer-sitemap-col"><h3>${escapeHTML(title)}</h3><ul>${rows}${more}</ul></div>`;
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
        slug: typeof item.slug === "string" && item.slug ? item.slug : "",
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

// 換頁（第 2 階段）：拿掉原本 0.48 秒的「布幕」。布幕是用來遮住換頁時畫面跳動的；
// 現在改成先把新頁面畫好再淡入——支援 View Transitions 的瀏覽器（iOS 18 以上的 Safari、Chrome）
// 由瀏覽器拍下前後兩張畫面做 0.12 秒交叉淡入；不支援時，新頁面以 0.12 秒淡入。
// 系統設了「減少動態效果」就直接換。上一頁／下一頁與 iOS 的滑動返回不加動畫（系統已有自己的轉場）。
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
  if (prefersReducedMotion()) {
    route();
    return;
  }
  if (document.startViewTransition) {
    document.startViewTransition(() => route());
    return;
  }
  route();
  app.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
}

function route() {
  clearArticleTocScroll();
  clearArticleOverviewPager();
  document.body.classList.remove("article-mode");
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const hash = decodedHash();
  const [name, value = ""] = hash.split(/=(.*)/s);

  if (name === "materials") { if (value) renderCourse(value); else renderMaterialsIndex(); }
  else if (name === "articles") {
    const tagMatch = /^tag:(.+)$/.exec(value || "");
    renderArticlesPage("", tagMatch ? tagMatch[1] : "");
  }
  else if (name === "article") {
    // #article=<短網址代號>&sec=<小節代號>；舊網址 #article=content 路徑 也接受（見 findArticle）
    const [key, section = ""] = value.split("&sec=");
    renderArticlesPage(key, "", section);
  }
  else if (name === "tools") renderTools();
  else renderHome();
}

function clearArticleTocScroll() {
  if (!state.tocScrollHandler) return;
  (state.tocScrollRoot || window).removeEventListener("scroll", state.tocScrollHandler);
  state.tocScrollHandler = null;
  state.tocScrollRoot = null;
}

function clearArticleOverviewPager() {
  state.articleOverviewObserver?.disconnect();
  state.articleOverviewObserver = null;
}

// 首頁（DESIGN.md「首頁」）：最上面是「焦點研討」（進行中或下一場，全站最大的字），
// 接著是其他近期研討 → 課程 → 最新文章。都沒有研討時，焦點改顯示網站名稱與介紹。
// 研討要讀各課程的 schedule.json，所以先畫骨架、讀完再填進 #hero-slot／#week-slot。
const HOME_ARTICLE_LIMIT = 4;
const SITE_INTRO = "微積分乙與工程數學課輔社群的講義、小考、課本與數學筆記。";

function renderHome() {
  setActiveNav("");
  document.title = "Bambook";
  const names = courseNames();
  const articles = state.manifestError
    ? emptyState(state.manifestError)
    : state.articles.length
      ? state.articles.slice(0, HOME_ARTICLE_LIMIT).map(article => plainRow({
          href: articleHref(article), title: article.title, desc: article.summary || article.excerpt || "",
        })).join("")
      : emptyState("尚未有文章。");

  app.innerHTML = `
    <div class="home-view">
      <section class="home-hero is-loading" id="hero-slot" aria-live="polite"></section>
      <section class="home-section" id="week-slot" aria-label="其他近期研討" hidden></section>
      <section class="home-section" aria-labelledby="home-courses-h">
        <div class="section-label"><h2 id="home-courses-h">課程</h2></div>
        <div class="plain-list" id="home-courses">${names.map(name => plainRow({
          href: `#materials=${encodeURIComponent(name)}`, title: name, desc: "　",
        })).join("") || emptyState("教材資料尚未載入。")}</div>
      </section>
      <section class="home-section" aria-labelledby="home-articles-h">
        <div class="section-label"><h2 id="home-articles-h">最新文章</h2><a href="#articles">全部文章 ›</a></div>
        <div class="plain-list">${articles}</div>
      </section>
    </div>`;
  fillHomeSchedules();
}

async function fillHomeSchedules() {
  const courses = await loadAllSchedules();
  const hero = document.querySelector("#hero-slot");
  const slot = document.querySelector("#week-slot");
  if (!hero || !slot) return;  // 使用者已經換頁
  const focus = focusSession(courses);
  hero.innerHTML = focus ? heroHTML(focus) : `<h1 class="hero-title">Bambook</h1><p class="hero-intro">${SITE_INTRO}</p>`;
  hero.classList.remove("is-loading");
  const others = weekActivities(courses).filter(session => session !== focus);
  if (others.length) {
    slot.hidden = false;
    slot.innerHTML = `<div class="section-label"><h2>其他近期研討</h2></div>
      <ol class="week-list">${others.map(weekItem).join("")}</ol>`;
  }
  const list = document.querySelector("#home-courses");
  if (list) {
    list.innerHTML = courses.map(course => {
      const next = course.sessions.find(session => !session.ended);
      return plainRow({
        href: `#materials=${encodeURIComponent(course.name)}`,
        title: course.name,
        desc: next ? `下次：${shortDate(next.start)} ${weekday(next.start)}・${next.topic}` : (course.sessions.length ? "本學期研討已結束" : ""),
      });
    }).join("");
  }
}

// 焦點研討：正在進行的；沒有的話是下一場還沒開始的（不限 7 天內）。
function focusSession(courses, current = now()) {
  const all = courses.flatMap(course => course.sessions).sort((a, b) => a.start - b.start);
  return all.find(session => session.start <= current && session.end >= current)
    || all.find(session => session.start > current) || null;
}

// 「進行中」「今天 18:30」「明天 18:30」「還有 6 天」
function relativeWhen(session) {
  if (session.started && !session.ended) return `進行中・到 ${clockTime(session.end)}`;
  const day = date => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((day(session.start) - day(session.now)) / DAY_MS);
  if (days === 0) return `今天 ${clockTime(session.start)}`;
  if (days === 1) return `明天 ${clockTime(session.start)}`;
  return `還有 ${days} 天`;
}

function heroHTML(session) {
  const live = session.started && !session.ended;
  return `
    <p class="hero-eyebrow${live ? " is-live" : ""}">${live ? "" : "下一場研討・"}${escapeHTML(relativeWhen(session))}</p>
    <h1 class="hero-topic">${escapeHTML(session.topic || "未命名研討")}</h1>
    <p class="hero-when">${shortDate(session.start)} ${weekday(session.start)}${session.time ? `・${escapeHTML(session.time)}` : ""}</p>
    <p class="hero-meta"><a href="#materials=${encodeURIComponent(session.course)}">${escapeHTML(session.course)}</a><span class="dot-sep"></span>${kindLabel(session)}${session.location ? `<span class="dot-sep"></span>${escapeHTML(session.location)}` : ""}</p>
    ${sessionFileLinks(session)}`;
}

function weekItem(session) {
  const state = session.ended ? "is-past" : (session.started ? "is-now" : "is-future");
  const status = session.started && !session.ended ? `<span class="dot-sep"></span><span class="kind-now">進行中</span>` : "";
  return `
    <li class="week-item ${state}">
      <div class="date-col"><b>${shortDate(session.start)}</b><span>${weekday(session.start)}</span></div>
      <div class="week-body">
        <p class="week-head"><a href="#materials=${encodeURIComponent(session.course)}">${escapeHTML(session.course)}</a><span class="dot-sep"></span>${kindLabel(session)}${status}</p>
        <p class="week-topic">${escapeHTML(session.topic || "未命名研討")}</p>
        <p class="week-where">${escapeHTML([session.time, session.location].filter(Boolean).join("・"))}</p>
        ${sessionFileLinks(session)}
      </div>
    </li>`;
}

// 沒有外框的清單列：標題＋一行說明。
function plainRow({ href, title, desc = "" }) {
  return `<a class="plain-row" href="${safeURL(href)}"><span class="plain-title">${escapeHTML(title)}</span>${desc ? `<span class="plain-desc">${escapeHTML(desc)}</span>` : ""}</a>`;
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
  const names = courseNames();
  const tabs = names.length > 1
    ? `<nav class="course-tabs" aria-label="切換教材">${names.map(courseName => `<a class="${courseName === name ? "is-active" : ""}" href="#materials=${encodeURIComponent(courseName)}"${courseName === name ? ' aria-current="page"' : ""}>${escapeHTML(courseName)}</a>`).join("")}</nav>`
    : "";

  app.innerHTML = `
    <div class="course-view">
      ${breadcrumb([{ label: "首頁", href: "#home" }, { label: "教材", href: "#materials" }, { label: name }])}
      <header class="course-heading"><h1>${escapeHTML(name)}</h1>${tabs}</header>
      <div id="schedule-slot"></div>
      <div id="syllabus-slot"></div>
      ${resourceSection("課本", textbookItems(course.textbooks), ICONS.book)}
      ${slidesSection(course.slides)}
      ${practiceSection(course.practice)}
      ${relatedArticlesSection(name)}
    </div>`;

  renderCourseTimeline(name);
  renderSyllabus(course.syllabus);
}

// 課程頁的研討（DESIGN.md「課程頁」）：時間軸，畫法見 timelineHTML()。
async function renderCourseTimeline(name) {
  const slot = document.querySelector("#schedule-slot");
  if (!slot || !state.courses[name]?.schedule) return;
  slot.innerHTML = `<section class="resource-section"><div class="section-label"><h2>研討與講義</h2></div><p class="notice">正在載入研討時間…</p></section>`;
  const course = (await loadAllSchedules()).find(item => item.name === name);
  if (document.querySelector("#schedule-slot") !== slot) return;
  if (!course || course.error) {
    slot.innerHTML = `<section class="resource-section"><div class="section-label"><h2>研討與講義</h2></div><p class="notice">研討時間檔暫時無法讀取。</p></section>`;
    return;
  }
  slot.innerHTML = `<section class="resource-section"><div class="section-label"><h2>研討與講義</h2></div>${timelineHTML(course.sessions)}</section>`;
}

// 時間軸（DESIGN.md「課程頁」2.3）：一次研討一個點，主題標在左側、跨它底下連續的研討。
// 平常只露出「目前」（進行中或下一場）與再下一次；之前的收在最上面「已結束」、之後的收在最下面「之後」，
// 各只有一層。整門課都結束時露出最後兩次。
function timelineHTML(sessions) {
  if (!sessions.length) return emptyState("尚無研討時間資料。");
  const next = sessions.find(session => !session.ended) || null;
  const from = next ? sessions.indexOf(next) : Math.max(0, sessions.length - 2);
  const to = Math.min(sessions.length, from + 2);
  const past = sessions.slice(0, from), shown = sessions.slice(from, to), later = sessions.slice(to);
  const currentTopic = next ? next.topicIndex : null;
  const list = items => `<ol class="tl">${groupRuns(items).map(run => topicRunHTML(run, run[0].topicIndex === currentTopic, next)).join("")}</ol>`;
  const fold = (name, items, extra = "") => `
    <details class="tl-fold ${extra}">
      <summary>
        <span class="tl-fold-name">${name}</span>
        <span class="tl-dot" aria-hidden="true"></span>
        <span class="tl-fold-label">${items.length} 次研討<small>${shortDate(items[0].start)}${items.length > 1 ? ` – ${shortDate(items.at(-1).start)}` : ""}</small></span>
        <span class="tl-fold-chevron" aria-hidden="true">${ICONS.chevron}</span>
      </summary>
      ${list(items)}
    </details>`;
  return `<div class="tl-wrap">
    ${past.length ? fold("已結束", past, "is-before") : ""}
    ${list(shown)}
    ${later.length ? fold("之後", later, "is-after") : ""}
  </div>`;
}

// 把連續、同一個主題的研討併成一段（左側的主題名稱只寫一次）。
function groupRuns(items) {
  const runs = [];
  items.forEach(session => {
    const last = runs.at(-1);
    if (last && last[0].topicIndex === session.topicIndex) last.push(session);
    else runs.push([session]);
  });
  return runs;
}

function topicRunHTML(run, isCurrent, next) {
  const state = isCurrent ? "is-current" : (run.every(session => session.ended) ? "is-past" : "is-future");
  return `
    <li class="tl-topic ${state}">
      <div class="tl-topic-name">${escapeHTML(run[0].topic || "未命名研討")}</div>
      <ol class="tl-sessions">${run.map(session => {
        const isNext = session === next;
        const live = session.started && !session.ended;
        const cls = session.ended ? "is-past" : (isNext ? "is-next" : "is-future");
        // 時段地點只在還沒結束的研討顯示；主題說明只在目前那一次顯示
        const where = session.ended ? "" : [session.time, session.location].filter(Boolean).join("・");
        return `
          <li class="tl-session ${cls}"${isNext ? ' aria-current="step"' : ""}>
            <span class="tl-dot" aria-hidden="true"></span>
            <div>
              <p class="tl-head"><b>${shortDate(session.start)} ${weekday(session.start)}</b>${kindLabel(session)}${live ? `<span class="kind-now">進行中</span>` : ""}</p>
              ${where ? `<p class="tl-where">${escapeHTML(where)}</p>` : ""}
              ${isNext && session.description ? `<p class="tl-desc">${escapeHTML(session.description)}</p>` : ""}
              ${sessionFileLinks(session)}
            </div>
          </li>`;
      }).join("")}</ol>
    </li>`;
}

// ---------------------------------------------------------------------------
// 研討資料（首頁本週活動與課程頁共用）
// ---------------------------------------------------------------------------
// 測試或預覽時可以在網址加 ?now=2026-12-09T19:00 模擬時間（放在 # 前面）。
function now() {
  const override = new URLSearchParams(location.search).get("now");
  const date = override ? new Date(override) : null;
  return date && !Number.isNaN(date.valueOf()) ? date : new Date();
}

const WEEKDAYS = "日一二三四五六";
const shortDate = date => `${date.getMonth() + 1}/${date.getDate()}`;
const weekday = date => `週${WEEKDAYS[date.getDay()]}`;
const clockTime = date => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

// 讀所有課程的 schedule.json（同一次瀏覽只讀一次），整理成每次研討一筆、依時間排序。
function loadAllSchedules() {
  if (!state.schedulesPromise) {
    state.schedulesPromise = Promise.all(courseNames().map(async name => {
      const course = state.courses[name] || {};
      if (!course.schedule) return { name, sessions: [] };
      try {
        const response = await fetch(assetURL(course.schedule), { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const items = await response.json();
        if (!Array.isArray(items)) throw new Error("資料格式不正確");
        return { name, sessions: normaliseSessions(name, items, course) };
      } catch (error) {
        return { name, sessions: [], error: String(error) };
      }
    }));
  }
  return state.schedulesPromise;
}

function normaliseSessions(courseName, items, course, current = now()) {
  const handouts = Array.isArray(course.handouts) ? course.handouts : [];
  const quizzes = Array.isArray(course.quizzes) ? course.quizzes : [];
  return items.flatMap((item, topicIndex) => scheduleTopicSessions(item).map(session => {
    const start = parseScheduleDate(session?.date);
    if (!start) return null;
    const end = scheduleSessionEndDate(start, session.time);
    const handout = session.handout ? handouts.find(h => String(h?.title || "").trim() === String(session.handout).trim()) : null;
    const quiz = session.quiz ? quizzes.find(q => String(q?.title || "").trim() === String(session.quiz).trim()) : null;
    const files = [];
    if (handout?.blank) files.push({ noun: "講義", label: "填空", answer: false, path: handout.blank });
    if (handout?.sol) files.push({ noun: "講義", label: "解答", answer: true, path: handout.sol });
    // 小考題目在研討開始後才出現、解答在時段結束後才出現（時間到之前網頁上沒有按鈕）
    if (quiz?.problem) files.push({ noun: "小考", label: "題目", answer: false, path: quiz.problem, opensAt: start });
    if (quiz?.solution) files.push({ noun: "小考", label: "解答", answer: true, path: quiz.solution, opensAt: end });
    return {
      course: courseName, topicIndex, topic: item.topic, description: item.description || "",
      time: session.time || "", location: session.location || "", kind: scheduleSessionKind(session),
      start, end, started: start <= current, ended: end < current,
      files, quizMissing: Boolean(session.quiz && !quiz), now: current,
    };
  })).filter(Boolean).sort((a, b) => a.start - b.start);
}

// 本週活動：7 天內要開始的，以及 3 天內剛結束的（方便學生拿解答）。
const DAY_MS = 86400000;
function weekActivities(courses, current = now()) {
  const from = current.getTime() - 3 * DAY_MS;
  const to = current.getTime() + 7 * DAY_MS;
  return courses.flatMap(course => course.sessions)
    .filter(session => session.end.getTime() >= from && session.start.getTime() <= to)
    .sort((a, b) => a.start - b.start);
}

function kindLabel(session) {
  return `<span class="kind">${escapeHTML(session.kind)}</span>`;
}

// 檔案連結（DESIGN.md「檔案連結」）：Handout、Quiz 各是一組，組名是淡色小標，
// 組內再分「填空」（講義）或「題目」（小考）與「解答」，跟課本同一種 PDF 連結（文字＋accent 圖示）。
// 還沒開放的顯示開放時間，不是按鈕；schedule 有寫小考但檔案還沒放上時顯示「尚未放上」。
const FILE_GROUPS = [{ noun: "講義", label: "Handout" }, { noun: "小考", label: "Quiz" }];

function sessionFileLinks(session) {
  const groups = FILE_GROUPS.map(({ noun, label }) => {
    const files = session.files.filter(file => file.noun === noun);
    const items = files.map(file => {
      const name = file.answer ? "解答" : (noun === "講義" ? "填空" : "題目");
      if (file.opensAt && file.opensAt > session.now) {
        const sameDay = file.opensAt.toDateString() === session.start.toDateString();
        const when = `${sameDay ? "" : shortDate(file.opensAt) + " "}${clockTime(file.opensAt)}`;
        // 還沒開放：淡色文字、不能點，旁邊小字是開放時間
        return `<span class="file-pending" role="note" aria-label="${label} ${name}：${when} 開放" title="${when} 開放">${name}<small>${when}後</small></span>`;
      }
      return `<a class="resource-document-link" href="${safeURL(file.path)}" target="_blank" rel="noopener" aria-label="開啟 PDF：${label} ${name}" title="${label} ${name}（PDF）">${name}${file.answer ? ICONS.pdfAnswer : ICONS.pdfBlank}</a>`;
    });
    if (noun === "小考" && session.quizMissing) items.push(`<span class="file-locked">尚未放上</span>`);
    return items.length ? `<div class="file-group"><span class="file-group-label">${label}</span>${items.join("")}</div>` : "";
  }).filter(Boolean);
  return groups.length ? `<div class="file-links">${groups.join("")}</div>` : "";
}

// Articles opt into a course page by adding a tag that matches the course
// name exactly (e.g. tag "微積分乙" shows the article on that course's page).
// Only the newest RELATED_ARTICLES_LIMIT are shown here (state.articles is
// already newest-first, see build-index.py) — with dozens of tagged articles
// the list used to take up more than half the course page and push the
// textbooks/slides out of view. The rest are one click away on the tag page
// (#articles=tag:<course>), which already lists every article with that tag.
const RELATED_ARTICLES_LIMIT = 6;

function relatedArticlesSection(courseName) {
  const related = state.articles.filter(article => article.tags.includes(courseName));
  if (!related.length) return "";
  const rows = related.slice(0, RELATED_ARTICLES_LIMIT).map(article => row({
    href: articleHref(article),
    title: article.title,
    desc: article.summary || "閱讀這篇文章。",
    meta: formatDate(article.date),
  })).join("");
  const more = related.length > RELATED_ARTICLES_LIMIT
    ? `<a class="section-more" href="#articles=tag:${encodeURIComponent(courseName)}">${ICONS.chevron}<span>查看全部 ${related.length} 篇延伸文章</span></a>`
    : "";
  return resourceSection("延伸文章", `<div class="row-list">${rows}</div>${more}`, ICONS.book);
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

// 課業輔導社群的研討時間表：materials/<course>/schedule.json（manifest 只存
// 路徑，實際內容在此以 fetch 惰性載入）。時間軸的每一站是一個「主題」，站內
// 依 sessions 列出這個主題實際的每一次研討——目前的步調是一個主題佔兩週：
// 一週「進度」（發講義）、下一週「測驗」（發 quiz），兩次研討共用同一個主題
// 與說明，合併成同一站，站內各自列出日期／時段／地點與對應的檔案。預設只
// 顯示目前的主題（本身即為 <summary>），點選後往上展開過去的主題、往下展開
// 未來的主題，過去／目前／未來以不同顏色的圓點與文字區分；若所有主題都已
// 結束，改以最近一個已結束的主題作為預設顯示的一站。
// 每次研討的 date 欄位為統一格式 "YYYY-MM-DD HH:MM"（用於排序與判斷是否已
// 結束），time 欄位則是給人看的顯示用時段（例如 "19:00–21:00"）。
function parseScheduleDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/.exec(String(value ?? "").trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

// 一次研討的下課時間：拆 time 欄位（例如 "18:30–20:30"）取結束那一半，跟 date 的日期組成 Date。
// 用在兩處：研討「結束」的判斷（研討進行中打開頁面仍算當次），以及小考解答的開放時間。
// time 缺漏或格式不對時退回當天 21:00，寧可晚一點開放，也不要因為格式問題提早露出解答。
function scheduleSessionEndDate(date, time) {
  const match = /^\s*\d{1,2}:\d{2}\s*[-–—~]\s*(\d{1,2}):(\d{2})\s*$/.exec(String(time ?? ""));
  if (match) {
    const [, hour, minute] = match;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(hour), Number(minute), 0, 0);
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 21, 0, 0, 0);
}

// schedule.json 每一筆是一個主題：
//   { "topic", "description", "sessions": [{ "date", "time", "location",
//     "handout" 或 "quiz", "label"（選填） }, ...] }
// 舊格式（沒有 sessions，date／time／location／handout／quiz 直接寫在主題
// 本身）視為只有一次研討的主題，照樣能顯示，不用回頭改舊檔案。
function scheduleTopicSessions(item) {
  if (Array.isArray(item?.sessions)) return item.sessions;
  return item?.date ? [item] : [];
}

// 每次研討前面的小標籤：有填 label 就照填的顯示，否則依這次發的檔案推斷——
// 發 quiz 的是「測驗」、發講義的是「進度」，兩者都沒有就單純標「研討」。
function scheduleSessionKind(session) {
  const custom = String(session?.label ?? "").trim();
  if (custom) return custom;
  if (session?.handout && session?.quiz) return "進度・測驗";
  if (session?.quiz) return "測驗";
  if (session?.handout) return "進度";
  return "研討";
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

function resourceSection(title, content) {
  return `<section class="resource-section"><div class="section-label"><h2>${escapeHTML(title)}</h2></div>${content}</section>`;
}


function documentResourceLink(path, label) {
  if (!path) return "";
  return `<a class="resource-document-link" href="${safeURL(path)}" target="_blank" rel="noopener" aria-label="開啟 PDF：${escapeHTML(label)}" title="開啟 PDF">${escapeHTML(label)}${ICONS.pdf}</a>`;
}

function externalResourceLink(url, label) {
  if (!url) return "";
  return `<a class="resource-document-link" href="${safeURL(url)}" target="_blank" rel="noopener" aria-label="開啟連結：${escapeHTML(label)}" title="開啟連結">${escapeHTML(label)}${ICONS.link}</a>`;
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
    href: articleHref(article),
    title: article.title,
    desc: article.summary || "閱讀這篇文章。",
    meta: formatDate(article.date),
  });
}

async function loadArticle(record, section = "") {
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
        <div class="tag-list">${article.tags.map(tag => `<a class="tag" href="#articles=tag:${encodeURIComponent(tag)}">${escapeHTML(tag)}</a>`).join("")}</div>
        ${record.slug ? `<button type="button" class="copy-link" data-copy-link>${ICONS.link || ""}複製這篇文章的連結</button>` : ""}
        ${article.summary ? `<p class="article-summary">${escapeHTML(article.summary)}</p>` : ""}
      </header>
      <div class="article-body">${DOMPurify.sanitize(dirtyHTML, markdownSanitizeOptions)}</div>`;
    hydrateMarkdownBody(view.querySelector(".article-body"), record.path);
    buildArticleTocForPage(view);
    bindShareLinks(view, record);
    document.querySelector("#content-scroll")?.scrollTo({ top: 0 });
    if (section) scrollToSection(section);
  } catch (error) {
    view.innerHTML = `<p class="error">文章無法載入：${escapeHTML(error.message)}</p>`;
  }
}

// 文章在網站內的網址：優先用短網址代號（build-index.py 產生的 slug），舊的 manifest 沒有 slug 時退回檔案路徑。
function articleHref(article) {
  return `#article=${encodeURIComponent(article.slug || article.path)}`;
}

// 對外分享的短網址：a/<slug>/（獨立頁面，帶連結預覽），小節接在 # 後面。
function articleShareURL(article, sectionId = "") {
  const base = new URL(`a/${encodeURIComponent(article.slug || "")}/`, SITE_BASE_URL).href;
  return sectionId ? `${base}#${encodeURIComponent(sectionId)}` : base;
}

function renderArticlesPage(requestedPath = "", tagFilter = "", section = "") {
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
    const matched = tagFilter ? state.articles.filter(article => article.tags.includes(tagFilter)) : state.articles;
    document.title = tagFilter ? `標籤：${tagFilter} | Bambook` : "文章 | Bambook";
    const crumbs = tagFilter
      ? [{ label: "首頁", href: "#home" }, { label: "文章", href: "#articles" }, { label: `標籤：${tagFilter}` }]
      : [{ label: "首頁", href: "#home" }, { label: "文章" }];
    const heading = tagFilter
      ? `<header class="page-heading"><p class="eyebrow">Tag</p><h1>${escapeHTML(tagFilter)}</h1><p>共 ${matched.length} 篇文章使用了這個標籤。</p></header>`
      : `<header class="page-heading"><p class="eyebrow">Articles</p><h1>文章</h1><p>筆記、故事與碎碎念。</p></header>`;
    app.innerHTML = `
      <section class="article-overview">
        ${breadcrumb(crumbs)}
        ${heading}
        ${matched.length
          ? `<div class="article-overview-list" data-article-overview-list></div>
             <div class="article-overview-sentinel" data-article-overview-sentinel aria-hidden="true"></div>`
          : `<p class="empty-state">沒有文章使用「${escapeHTML(tagFilter)}」這個標籤。</p>`}
      </section>`;
    if (matched.length) initArticleOverviewPager(matched);
    return;
  }

  const record = findArticle(requestedPath);
  if (record && record.slug && requestedPath !== record.slug) {
    // 舊網址（#article=content%2F…md）換成短網址，不留下多一筆瀏覽紀錄
    history.replaceState(null, "", `#article=${encodeURIComponent(record.slug)}${section ? `&sec=${encodeURIComponent(section)}` : ""}`);
  }
  if (!record) {
    renderNotFound("找不到文章", "這篇文章可能已被移動、重新命名，或尚未被 site-manifest.json 收錄。");
    return;
  }

  app.innerHTML = `
    <div class="article-reader">
      <div class="articles-layout">
        <aside class="article-list">${articleListGrouped(record.path)}</aside>
        <div id="content-scroll" class="article-scroll">
          <article id="article-view" class="article"><p class="notice">正在載入文章…</p></article>
        </div>
        <aside class="article-toc" data-article-toc><h2>文章目錄</h2><p class="toc-empty">正在建立目錄…</p></aside>
      </div>
    </div>`;
  document.body.classList.add("article-mode");
  normaliseArticleReaderShell();
  loadArticle(record, section);
}

function findArticle(key) {
  const wanted = String(key || "");
  return state.articles.find(article => article.slug && article.slug === wanted) || findArticleByPath(wanted);
}

function findArticleByPath(requestedPath) {
  const normalisedPath = String(requestedPath || "").replace(/^\/+/, "").replace(/\\/g, "/");
  const exact = state.articles.find(article => article.path === normalisedPath);
  if (exact) return exact;

  const filename = normalisedPath.split("/").pop();
  if (!filename) return null;
  return state.articles.find(article => String(article.path || "").split("/").pop() === filename) || null;
}
function articleMonthGroups(articles = state.articles) {
  const groups = new Map();
  articles.forEach(article => {
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
    return `<h2>文章索引</h2><p class="toc-empty">目前沒有文章。</p>`;
  }

  return `
    <div class="article-list-head">
      <h2>文章索引</h2>
      <button type="button" class="sidebar-index-toggle" data-toggle-all-months aria-label="展開或收合所有分類" title="展開或收合所有分類">${ICONS.unfoldVertical}</button>
    </div>

    <div class="sidebar-month-list">
      ${groupArticlesByMonth(articles).map(([month, monthArticles]) => `
        <details class="sidebar-month-group" open>
          <summary class="sidebar-month-label">
            <span>${escapeHTML(month)}</span>
            <small>${monthArticles.length}</small>
          </summary>

          <div class="sidebar-month-items">
            ${monthArticles.map(article => `
              <a class="sidebar-link ${article.path === activePath ? "is-active" : ""}" href="${articleHref(article)}" data-path="${escapeHTML(article.path)}">
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

// #articles used to render every month/article in one go via
// articleOverviewByMonth() — fine at a dozen articles, but it means the
// list page's DOM work (and the images/markup inside each row) grows
// without bound as the archive grows. This renders one batch at a time
// instead: an IntersectionObserver on a trailing sentinel appends the next
// ARTICLE_OVERVIEW_PAGE_SIZE articles (continuing mid-month-section where a
// batch boundary lands inside one) as the sentinel nears the viewport, and
// disconnects once everything is rendered. clearArticleOverviewPager()
// (called from route() on every navigation) disconnects a still-active
// observer so leaving the page before it finishes doesn't leak one.
const ARTICLE_OVERVIEW_PAGE_SIZE = 12;

function initArticleOverviewPager(articles = state.articles) {
  const listEl = document.querySelector("[data-article-overview-list]");
  const sentinel = document.querySelector("[data-article-overview-sentinel]");
  if (!listEl || !sentinel) return;

  const queue = [];
  articleMonthGroups(articles).forEach(([month, monthArticles]) => {
    monthArticles.forEach((article, index) => queue.push({ month, article, isFirstOfMonth: index === 0 }));
  });

  let cursor = 0;
  let currentMonthList = null;

  function renderNextBatch() {
    const end = Math.min(cursor + ARTICLE_OVERVIEW_PAGE_SIZE, queue.length);
    for (; cursor < end; cursor++) {
      const { month, article, isFirstOfMonth } = queue[cursor];
      if (isFirstOfMonth || !currentMonthList) {
        const section = document.createElement("section");
        section.className = "article-overview-month";
        section.innerHTML = `<h2>${escapeHTML(month)}</h2><div class="row-list"></div>`;
        listEl.appendChild(section);
        currentMonthList = section.querySelector(".row-list");
      }
      currentMonthList.insertAdjacentHTML("beforeend", articleOverviewItem(article));
    }
    if (cursor >= queue.length) {
      clearArticleOverviewPager();
    } else if (state.articleOverviewObserver) {
      // An IntersectionObserver only fires on a state *change* — with a
      // generous rootMargin (below) and short batches, the sentinel can
      // stay inside that margin (still "intersecting") across several
      // batches with no new transition to fire on, stalling the load.
      // Re-observing forces a fresh check/callback for wherever the
      // sentinel actually is now.
      state.articleOverviewObserver.unobserve(sentinel);
      state.articleOverviewObserver.observe(sentinel);
    }
  }

  renderNextBatch();
  if (cursor < queue.length) {
    state.articleOverviewObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) renderNextBatch();
    }, { rootMargin: "800px 0px" });
    state.articleOverviewObserver.observe(sentinel);
  }
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

  // 小節代號要穩定（分享出去的連結靠它）：用標題文字，不用第幾個標題。
  // 想固定一個短代號時，在 Markdown 標題後面寫 {#代號}，例如「## ε-δ 定義 {#def}」。
  const usedIds = new Set();
  headings.forEach((heading, index) => {
    let custom = "";
    heading.innerHTML = heading.innerHTML.replace(/\s*\{#([^{}\s]+)\}\s*$/u, (_, id) => { custom = id; return ""; });
    let id = custom || heading.id || slugifyHeading(heading.textContent || "", index);
    let n = 2;
    const baseId = id;
    while (usedIds.has(id)) id = `${baseId}-${n++}`;
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
  return slug || `sec-${index + 1}`;
}

// 文章頁的分享：標題下方「複製這篇文章的連結」，以及每個 h2／h3 旁的「#」複製該小節的連結。
function bindShareLinks(view, article) {
  if (!article.slug) return;
  view.querySelector("[data-copy-link]")?.addEventListener("click", () => copyText(articleShareURL(article), "已複製文章連結"));
  view.querySelectorAll(".article-body h2[id], .article-body h3[id]").forEach(heading => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "heading-link";
    button.textContent = "#";
    button.setAttribute("aria-label", `複製「${heading.textContent.trim()}」這一節的連結`);
    button.addEventListener("click", () => copyText(articleShareURL(article, heading.id), "已複製這一節的連結"));
    heading.append(button);
  });
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    window.prompt("複製這個連結：", text);
  }
}

function showToast(message) {
  let toast = document.querySelector(".copy-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "copy-toast";
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function scrollToSection(section) {
  let id = section;
  try { id = decodeURIComponent(section); } catch {}
  const target = document.getElementById(id);
  if (!target) return;
  const scrollRoot = document.querySelector("#content-scroll");
  requestAnimationFrame(() => {
    if (scrollRoot && scrollRoot.scrollHeight > scrollRoot.clientHeight) scrollTargetIntoContainer(scrollRoot, target);
    else target.scrollIntoView({ block: "start" });
  });
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
