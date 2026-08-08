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
};

const SITE_BASE_URL = new URL("../../", import.meta.url);
const app = document.querySelector("#app");
const materialMenu = document.querySelector("[data-material-menu]");
const state = {
  courses: {},
  articles: [],
  entries: [],
  tools: [],
  articleBodies: new Map(),
  tocScrollHandler: null,
  tocScrollRoot: null,
  manifestError: "",
};

document.addEventListener("DOMContentLoaded", initialise);

async function initialise() {
  bindEvents();
  await loadSiteManifest();
  buildMaterialMenu();
  route();
}

function bindEvents() {
  window.addEventListener("hashchange", route);
  bindThemeToggle();

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (!target) return;

    if (target.closest("[data-toggle-all-months]")) {
      const groups = Array.from(document.querySelectorAll(".sidebar-month-group"));
      const shouldOpen = groups.some(group => !group.open);
      groups.forEach(group => {
        group.open = shouldOpen;
      });
      return;
    }
  });
  // "教材" now opens its course dropdown on hover/focus (pure CSS — see
  // .nav-menu:hover/:focus-within in site.css) instead of a click-toggled
  // .is-open class, so Escape's only job left is to blur out of it if a
  // keyboard user tabbed in and wants the panel gone.
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.activeElement?.closest(".nav-menu")) {
      document.activeElement.blur();
    }
  });
}

// Light is the only default — there's no OS-preference auto-detection (see
// site.css). A saved choice is applied before first paint by the inline
// script in index.html's <head>; this just wires up the button and keeps it
// in sync with whichever theme ends up active.
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

async function loadSiteManifest() {
  try {
    const response = await fetch(assetURL("site-manifest.json"), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = await response.json();
    if (!manifest || typeof manifest !== "object") throw new Error("site-manifest.json 格式不正確");
    state.courses = manifest.materials && typeof manifest.materials === "object" ? manifest.materials : {};
    state.entries = (Array.isArray(manifest.entries) ? manifest.entries : []).map(normaliseEntryCard);
    state.tools = state.entries;
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

function route() {
  clearArticleTocScroll();
  document.body.classList.remove("article-mode");
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
        <div class="block-head"><h2>教材</h2><a class="all-link" href="#materials">全部教材 →</a></div>
        <div class="row-list">${materialRows}</div>
      </section>
      <section class="block" id="home-articles">
        <div class="block-head"><h2>文章</h2><a class="all-link" href="#articles">全部文章 →</a></div>
        <div class="row-list">${articleRows}</div>
      </section>
      <section class="block" id="home-tools">
        <div class="block-head"><h2>其他工具</h2><a class="all-link" href="#tools">全部工具 →</a></div>
        <div class="row-list">${toolRows}</div>
      </section>
    </div>`;
}

// Row-count summary shown next to a course's row-desc (e.g. "3 課本 · 6
// 講義"). Only counts the two resource kinds every course is likely to have;
// empty categories are omitted rather than shown as "0 ...".
function materialMeta(course = {}) {
  const parts = [];
  if (Array.isArray(course.textbooks) && course.textbooks.length) parts.push(`${course.textbooks.length} 課本`);
  if (Array.isArray(course.handouts) && course.handouts.length) parts.push(`${course.handouts.length} 講義`);
  return parts.join(" · ");
}

// Replaces the old card-grid on the home page. Row-meta and row-tags are
// deliberately nested INSIDE the row's first <div> alongside row-title/
// row-desc — .row is a 2-column CSS grid (content, arrow), so a 3rd direct
// child here would shove row-arrow onto its own line and break the layout.
function row({ href, title, desc = "", meta = "", tags = [] }) {
  return `<a class="row" href="${safeURL(href)}">
    <div>
      <div class="row-title">${escapeHTML(title)}</div>
      ${desc ? `<div class="row-desc">${escapeHTML(desc)}</div>` : ""}
      ${meta ? `<div class="row-meta">${escapeHTML(meta)}</div>` : ""}
      ${tags.length ? `<div class="row-tags">${tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join("")}</div>` : ""}
    </div>
    <span class="row-arrow" aria-hidden="true">→</span>
  </a>`;
}

// Static, hand-written hero — deliberately NOT sourced from a Markdown file.
// The home page's job is to hand people off to real content fast (usa.gov /
// gov.uk / government.nl all do this: a short heading, then straight into a
// plain grid of the site's actual sections), so there's no fetch, no
// markdown-render pipeline, and no long explanatory paragraph here — that
// belongs on the pages themselves, not the front door.
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
        </a>
        <a class="hero-feature" href="#articles">
          <span class="hero-feature-icon">${ICONS.article}</span>
          <span class="hero-feature-title">文章</span>
          <span class="hero-feature-desc">數學筆記與說明</span>
        </a>
        <a class="hero-feature" href="#tools">
          <span class="hero-feature-icon">${ICONS.tool}</span>
          <span class="hero-feature-title">其他工具</span>
          <span class="hero-feature-desc">獨立的小工具</span>
        </a>
      </div>
    </section>`;
}

// Breadcrumb path shown at the top of every page below home (usa.gov / gov.uk
// / government.nl all surface a path once you're inside a section). Items
// without an `href` — or the last item — render as plain text; only real
// destination pages become links. items: [{ label, href? }].
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
// and breadcrumbs actually land on. Mirrors renderArticlesPage()'s overview
// and renderTools(): breadcrumb, page-heading, one flat row-list.
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
        <div id="syllabus-slot"></div>
        ${resourceSection("課本", textbookItems(course.textbooks), ICONS.book)}
        ${resourceSection("講義", handoutItems(course.handouts), ICONS.pdf)}
        ${slidesSection(course.slides)}
        ${practiceSection(course.practice)}
        ${relatedArticlesSection(name)}
      </div>
      <aside class="course-sidebar"><h2>教材</h2>${courseLinks}</aside>
    </div>`;

  renderSyllabus(course.syllabus);
}

// Articles opt into a course page by adding a tag that matches the course
// name exactly (e.g. tag "微積分乙" on an article shows it on that course's
// page). This keeps content/ and materials/ independent while still letting
// one article surface under multiple courses.
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

function textbookItems(items = []) {
  if (!items.length) return emptyState("尚無課本資料。");
  return `<div class="resource-grid">${items.map(item => `
    <article class="resource-item">
      <div><div class="resource-name">${documentResourceLink(item.path, item.title || "未命名課本")}</div><div class="resource-meta">${escapeHTML([item.author, item.version].filter(Boolean).join(" · "))}</div></div>
    </article>`).join("")}</div>`;
}

function handoutItems(items = []) {
  if (!items.length) return emptyState("尚無講義資料。");
  return `<div class="resource-grid">${items.map(item => `
    <article class="resource-item">
      <div class="resource-name">${escapeHTML(item.title || "未命名講義")}</div>
      <div class="resource-actions">${handoutLink(item.blank, "填空", "blank")}${handoutLink(item.sol, "解答", "sol")}</div>
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

function handoutLink(path, label, variant) {
  if (!path) return "";
  return `<a class="resource-link resource-link--handout resource-link--${variant}" href="${safeURL(path)}" target="_blank" rel="noopener" aria-label="${escapeHTML(label)}講義" title="${escapeHTML(label)}講義"><span>${escapeHTML(label)}</span>${ICONS.pdf}</a>`;
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
    if (scrollRoot === window) {
      headings.forEach(heading => {
        if (heading.getBoundingClientRect().top <= 110) current = heading;
      });
    } else {
      const anchorLine = scrollRoot.scrollTop + 36;
      headings.forEach(heading => {
        if (heading.offsetTop <= anchorLine) current = heading;
      });
    }
    setActive(current.id);
  };

  links.forEach(link => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.dataset.tocTarget);
      if (!target) return;
      if (scrollRoot === window) target.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      else scrollRoot.scrollTo({ top: Math.max(target.offsetTop - 24, 0), behavior: scrollBehavior() });
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

// Respect the OS-level reduced-motion setting for JS-driven scrolling. CSS
// smooth scrolling is handled separately in site.css.
function scrollBehavior() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
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
      scrollRoot.scrollTo({ top: Math.max(target.offsetTop - 24, 0), behavior: scrollBehavior() });
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
