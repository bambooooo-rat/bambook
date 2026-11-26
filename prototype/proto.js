// 【原型，用完即丟】首頁與課程頁的版面原型共用的資料與小工具。
// 讀網站真實的 site-manifest.json 與各課程的 schedule.json。網址加 ?now=2026-12-09T19:00 可以模擬任意時間。
export const SITE = new URL("../", import.meta.url);
const params = new URLSearchParams(location.search);
export const NOW = params.get("now") ? new Date(params.get("now")) : new Date();
const DAY = 86400000;

export function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
export const url = p => new URL(String(p).replace(/^\/+/, ""), SITE).href;

function parseDate(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(v || ""));
  return m ? new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) : null;
}
function endOf(date, time) {
  const m = /(\d{1,2}):(\d{2})\s*[-–—~]\s*(\d{1,2}):(\d{2})/.exec(time || "");
  const d = new Date(date);
  if (m) d.setHours(+m[3], +m[4], 0, 0); else d.setHours(21, 0, 0, 0);
  return d;
}

export async function loadAll() {
  const manifest = await fetch(url("site-manifest.json"), { cache: "no-store" }).then(r => r.json());
  const courses = [];
  for (const [name, course] of Object.entries(manifest.materials || {})) {
    let topics = [];
    if (course.schedule) {
      try { topics = await fetch(url(course.schedule), { cache: "no-store" }).then(r => r.json()); } catch {}
    }
    const handouts = Object.fromEntries((course.handouts || []).map(h => [h.title, h]));
    const quizzes = Object.fromEntries((course.quizzes || []).map(q => [q.title, q]));
    const sessions = [];
    topics.forEach((t, ti) => {
      const list = Array.isArray(t.sessions) ? t.sessions : [t];
      list.forEach(s => {
        const start = parseDate(s.date);
        if (!start) return;
        const end = endOf(start, s.time);
        const kind = s.label || (s.quiz ? "測驗" : s.handout ? "進度" : "研討");
        const files = [];
        const h = s.handout && handouts[s.handout];
        if (h?.blank) files.push({ label: "講義", sub: "填空", href: url(h.blank) });
        if (h?.sol) files.push({ label: "講義", sub: "解答", href: url(h.sol) });
        const q = s.quiz && quizzes[s.quiz];
        if (q?.problem) files.push({ label: "小考", sub: "題目", href: url(q.problem), opensAt: start });
        if (q?.solution) files.push({ label: "小考", sub: "解答", href: url(q.solution), opensAt: end });
        sessions.push({ course: name, topic: t.topic, description: t.description || "", topicIndex: ti,
                        start, end, time: s.time || "", location: s.location || "", kind, files,
                        quizPending: s.quiz && !q });
      });
    });
    sessions.sort((a, b) => a.start - b.start);
    courses.push({ name, course, topics, sessions });
  }
  const articles = (manifest.articles || []).slice(0, 4);
  return { manifest, courses, articles };
}

export function visibleFiles(session) {
  return session.files.filter(f => !f.opensAt || NOW >= f.opensAt);
}
export function lockedFiles(session) {
  return session.files.filter(f => f.opensAt && NOW < f.opensAt);
}
export function status(session) {
  if (NOW > session.end) return "past";
  if (NOW >= session.start) return "now";
  return "future";
}
// 本週活動：7 天內要開始的，以及 3 天內剛結束的
export function thisWeek(courses) {
  const from = NOW.getTime() - 3 * DAY, to = NOW.getTime() + 7 * DAY;
  return courses.flatMap(c => c.sessions).filter(s => s.end.getTime() >= from && s.start.getTime() <= to)
    .sort((a, b) => a.start - b.start);
}

const WEEK = "日一二三四五六";
export const md = d => `${d.getMonth() + 1}/${d.getDate()}`;
export const wd = d => `週${WEEK[d.getDay()]}`;
export const hm = d => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
export function relative(s) {
  const st = status(s);
  if (st === "now") return "進行中";
  if (st === "past") return "已結束";
  const days = Math.round((new Date(s.start).setHours(0, 0, 0, 0) - new Date(NOW).setHours(0, 0, 0, 0)) / DAY);
  return days === 0 ? "今天" : days === 1 ? "明天" : `${days} 天後`;
}
export function opensText(f) {
  const d = f.opensAt;
  return `${md(d)} ${hm(d)} 開放`;
}

// 共用外框：頁首、主題切換、原型切換列
export function chrome(variants, render) {
  try { const t = localStorage.getItem("bambook-theme"); if (t) document.documentElement.dataset.theme = t; } catch {}
  const bar = document.querySelector(".proto");
  let cur = Math.max(0, variants.findIndex(v => v[0] === (params.get("variant") || variants[0][0]).toUpperCase()));
  const show = i => {
    cur = (i + variants.length) % variants.length;
    const [key, label] = variants[cur];
    bar.querySelector("span").textContent = `${key}・${label}`;
    const u = new URL(location.href); u.searchParams.set("variant", key); history.replaceState(null, "", u);
    render(key);
  };
  bar.querySelector("[data-prev]").onclick = () => show(cur - 1);
  bar.querySelector("[data-next]").onclick = () => show(cur + 1);
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  document.querySelector("[data-theme-toggle]").onclick = () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("bambook-theme", document.documentElement.dataset.theme); } catch {}
  };
  document.querySelector("[data-now]").textContent = params.get("now") ? `模擬時間：${md(NOW)} ${hm(NOW)}` : "";
  show(cur);
}
