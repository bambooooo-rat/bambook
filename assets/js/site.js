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
  download: tablerIcon('<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/><path d="M7 11l5 5l5 -5"/><path d="M12 4l0 12"/>'),
  external: tablerIcon('<path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6"/><path d="M11 13l9 -9"/><path d="M15 4h5v5"/>'),
  link: tablerIcon('<path d="M9 15l6 -6"/><path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464"/><path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463"/>'),
  presentation: tablerIcon('<path d="M3 4l18 0"/><path d="M4 4v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-10"/><path d="M12 16l0 4"/><path d="M9 20l6 0"/><path d="M8 12l3 -3l2 2l3 -3"/>'),
  terminal: tablerIcon('<path d="M8 9l3 3l-3 3"/><path d="M13 15l3 0"/><path d="M3 6a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -12"/>'),
  world: tablerIcon('<path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M3.6 9h16.8"/><path d="M3.6 15h16.8"/><path d="M11.5 3a17 17 0 0 0 0 18"/><path d="M12.5 3a17 17 0 0 1 0 18"/>'),
  chart: tablerIcon('<path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -6"/><path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -10"/><path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1l0 -14"/><path d="M4 20h14"/>'),
  wave: tablerIcon('<path d="M21 12h-2c-.894 0 -1.662 -.857 -1.761 -2c-.296 -3.45 -.749 -6 -2.749 -6s-2.5 3.582 -2.5 8s-.5 8 -2.5 8s-2.452 -2.547 -2.749 -6c-.1 -1.147 -.867 -2 -1.763 -2h-2"/>'),
  camera: tablerIcon('<path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/>'),
};

const app = document.querySelector("#app");
const materialMenu = document.querySelector("[data-material-menu]");
const state = {
  courses: {},
  homeIntro: null,
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

  document.querySelectorAll(".nav-menu > button").forEach(button => {
    button.addEventListener("click", () => {
      const menu = button.closest(".nav-menu");
      const willOpen = !menu.classList.contains("is-open");
      closeMenus();
      if (willOpen) {
        menu.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
      }
    });
  });

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

    if (!target.closest(".nav-menu")) closeMenus();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenus();
  });
}

function closeMenus() {
  document.querySelectorAll(".nav-menu.is-open").forEach(menu => {
    menu.classList.remove("is-open");
    menu.querySelector("button")?.setAttribute("aria-expanded", "false");
  });
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
    const legacyTools = Array.isArray(manifest.tools) ? manifest.tools : [];
    state.entries = (Array.isArray(manifest.entries) ? manifest.entries : []).map(normaliseEntryCard);
    state.tools = [...legacyTools.map(normaliseEntryCard), ...state.entries];
    const homeIntro = manifest.home_intro && typeof manifest.home_intro === "object" ? manifest.home_intro : null;
    state.homeIntro = homeIntro && typeof homeIntro.path === "string"
      ? {
        path: homeIntro.path.replace(/^\/+/, ""),
        title: homeIntro.title || fileTitle(homeIntro.path),
        date: homeIntro.date || "",
        tags: Array.isArray(homeIntro.tags) ? homeIntro.tags : [],
        summary: homeIntro.summary || "",
      }
      : null;
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
  closeMenus();
  clearArticleTocScroll();
  document.body.classList.remove("article-mode");
  const hash = decodedHash();
  const [name, value = ""] = hash.split(/=(.*)/s);

  if (name === "materials") renderCourse(value);
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
  const materialCards = names.map((name, index) => card({
    href: `#materials=${encodeURIComponent(name)}`,
    icon: courseIcon(name),
    title: name,
    description: `${name}的課本、講義、投影片與練習資源。`,
    action: "開啟教材 →",
  })).join("") || emptyState("教材資料尚未載入。請先執行 build_manifest.py。");

  app.innerHTML = `
    ${homeIntroShell()}
    <section>
      <div class="section-heading"><h2>教材</h2><a href="#materials=${encodeURIComponent(names[0] || "")}">全部教材 →</a></div>
      <div class="card-grid">${materialCards}</div>
    </section>
    <section>
      <div class="section-heading"><h2>文章</h2><a href="#articles">全部文章 →</a></div>
      <div class="card-grid">${articlePreviewCards()}</div>
    </section>
    <section>
      <div class="section-heading"><h2>其他工具</h2><a href="#tools">全部工具 →</a></div>
      <div class="card-grid">${toolCards().slice(0, 3).map(card).join("")}</div>
    </section>`;
  loadHomeIntro();
}

function homeIntroShell() {
  if (!state.homeIntro) return "";
  return `
    <section class="home-intro" aria-label="網站首頁使用說明">
      <div class="home-intro-label">
        <span>網站首頁</span>
        <span>使用說明</span>
      </div>
      <div class="home-intro-content" data-home-intro>
        <p class="notice">正在載入網站說明…</p>
      </div>
    </section>`;
}

async function loadHomeIntro() {
  const target = document.querySelector("[data-home-intro]");
  if (!target || !state.homeIntro) return;
  try {
    const cacheKey = `home:${state.homeIntro.path}`;
    let parsed = state.articleBodies.get(cacheKey);
    if (!parsed) {
      const response = await fetch(assetURL(`content/${state.homeIntro.path}`), { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      parsed = parseFrontMatter(await response.text());
      state.articleBodies.set(cacheKey, parsed);
    }
    const dirtyHTML = renderMarkdown(parsed.body);
    target.innerHTML = `<div class="home-intro-body">${DOMPurify.sanitize(dirtyHTML, markdownSanitizeOptions)}</div>`;
    const body = target.querySelector(".home-intro-body");
    hydrateMarkdownBody(body);
  } catch (error) {
    target.innerHTML = `<p class="error">網站說明無法載入：${escapeHTML(error.message)}</p>`;
  }
}

function renderCourse(name) {
  const course = state.courses[name];
  if (!course) {
    renderNotFound("找不到這份教材", "請從上方的「教材」選單重新選擇課程。");
    return;
  }

  setActiveNav("");
  document.title = `${name} | Bambook`;
  const courseLinks = courseNames().map(courseName => `<a class="${courseName === name ? "is-active" : ""}" href="#materials=${encodeURIComponent(courseName)}">${escapeHTML(courseName)}</a>`).join("");

  app.innerHTML = `
    <div class="course-layout">
      <div class="course-content">
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
      </div>
      <aside class="course-sidebar"><h2>教材</h2>${courseLinks}</aside>
    </div>`;

  renderSyllabus(course.syllabus);
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
  return `<a class="article-overview-item" href="#article=${encodeURIComponent(article.path)}">
    <time>${escapeHTML(formatDate(article.date))}</time>
    <div><h2>${escapeHTML(article.title)}</h2><p>${escapeHTML(article.summary || "閱讀這篇文章。")}</p></div>
  </a>`;
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
      <header class="article-header">
        <div class="article-date">${escapeHTML(formatDate(article.date))}</div>
        <h1>${escapeHTML(article.title)}</h1>
        <div class="tag-list">${article.tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div>
        ${article.summary ? `<p class="article-summary">${escapeHTML(article.summary)}</p>` : ""}
      </header>
      <div class="article-body">${DOMPurify.sanitize(dirtyHTML, markdownSanitizeOptions)}</div>`;
    hydrateMarkdownBody(view.querySelector(".article-body"));
    buildArticleTocForPage(view);
    document.querySelector("#content-scroll")?.scrollTo({ top: 0 });
  } catch (error) {
    view.innerHTML = `<p class="error">文章無法載入：${escapeHTML(error.message)}</p>`;
  }
}

function articlePreviewCards() {
  if (state.manifestError) return emptyState(state.manifestError);
  if (!state.articles.length) return emptyState("尚未有文章。");
  return state.articles.slice(0, 3).map(article => card({
    href: `#article=${encodeURIComponent(article.path)}`,
    icon: ICONS.book,
    title: article.title,
    description: article.summary || "閱讀這篇 Markdown 文章。",
    action: formatDate(article.date),
  })).join("");
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
        <header class="page-heading"><p class="eyebrow">Articles</p><h1>文章</h1><p>筆記、故事與碎碎念。</p></header>
        ${articleOverviewByMonth()}
      </section>`;
    return;
  }

  const record = state.articles.find(article => article.path === requestedPath);
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

function articleMonthGroups() {
  const groups = new Map();
  state.articles.forEach(article => {
    const key = monthKey(article.date, article.path);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(article);
  });
  return [...groups.entries()];
}

function monthKey(dateValue, fallback = "") {
  const match = String(dateValue || "").match(/^(\d{4})-(\d{2})/);
  if (match) return `${match[1]} 年 ${Number(match[2])} 月`;
  const folder = String(fallback || "").match(/^(\d{4})(\d{2})\//);
  if (folder) return `${folder[1]} 年 ${Number(folder[2])} 月`;
  return "未分類";
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
      展開 / 收合所有月份
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
    const month = getArticleMonthLabel(article);

    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(article);
  });

  return [...groups.entries()].sort(([a], [b]) => {
    if (a === "無日期") return 1;
    if (b === "無日期") return -1;
    return getMonthSortKey(b).localeCompare(getMonthSortKey(a));
  });
}

function getArticleMonthLabel(article) {
  const path = String(article?.path || "").replace(/\\/g, "/");

  const compactFolder = path.match(/^(\d{4})(\d{2})\//);
  if (compactFolder) {
    return `${compactFolder[1]} 年 ${Number(compactFolder[2])} 月`;
  }

  const dashedFolder = path.match(/^(\d{4})-(\d{2})\//);
  if (dashedFolder) {
    return `${dashedFolder[1]} 年 ${Number(dashedFolder[2])} 月`;
  }

  const date = String(article?.date || "").trim();
  const dateMatch = date.match(/^(\d{4})-(\d{2})/);
  if (dateMatch) {
    return `${dateMatch[1]} 年 ${Number(dateMatch[2])} 月`;
  }

  return "無日期";
}

function getMonthSortKey(label) {
  const match = String(label || "").match(/^(\d{4}) 年 (\d{1,2}) 月$/);
  if (!match) return label === "無日期" ? "0000-00" : String(label || "");
  return `${match[1]}-${String(match[2]).padStart(2, "0")}`;
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
      ${articles.map(articleOverviewItem).join("")}
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
      if (scrollRoot === window) target.scrollIntoView({ behavior: "smooth", block: "start" });
      else scrollRoot.scrollTo({ top: Math.max(target.offsetTop - 24, 0), behavior: "smooth" });
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
  setActiveNav("");
  document.title = "其他工具 | Bambook";
  app.innerHTML = `
    <header class="page-heading"><p class="eyebrow">Other tools</p><h1>其他工具</h1><p>這些工具都保留為可單獨開啟的靜態頁面，資料與功能已整合進 Bambook。</p></header>
    <div class="card-grid">${toolCards().map(card).join("") || emptyState("尚未找到工具資料夾。")}</div>`;
}

function toolCards() {
  return state.tools.map(tool => {
    const id = tool.id || String(tool.path || "").split("/").filter(Boolean).pop() || "";
    return {
    href: tool.path || "#tools",
    icon: toolIcon(id),
    title: tool.title || id || "未命名項目",
    description: tool.description || "開啟這個工具。",
    action: tool.action || "開啟工具 →",
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
    action: item?.action || "開啟頁面 →",
  };
}

function card({ href, icon, title, description, action, tags = [] }) {
  return `<a class="card ${tags.length ? "tool-card" : ""}" href="${safeURL(href)}">
    <span class="card-icon" aria-hidden="true">${icon}</span>
    <h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p>
    ${tags.length ? `<span class="tag-list">${tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</span>` : ""}
    <span class="card-action">${escapeHTML(action)}</span>
  </a>`;
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

function courseIcon(name) {
  return name.includes("微積") ? ICONS.math : ICONS.book;
}

function toolIcon(id) {
  return ({
    cs2commands: ICONS.terminal,
    geomaster: ICONS.world,
    grades: ICONS.chart,
    spectrumAnalysis: ICONS.wave,
    topo: ICONS.math,
    kaohsiung: ICONS.camera,
  })[id] || ICONS.book;
}

function decodedHash() {
  try { return decodeURIComponent(location.hash.slice(1)); }
  catch { return location.hash.slice(1); }
}

function assetURL(path) {
  return new URL(path, new URL("./", window.location.href)).href;
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

function hydrateMarkdownBody(root) {
  if (!root) return;
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
      scrollRoot.scrollTo({ top: Math.max(target.offsetTop - 24, 0), behavior: "smooth" });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
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
