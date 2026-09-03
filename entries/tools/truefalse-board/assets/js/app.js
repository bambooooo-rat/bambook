// entries/tools/truefalse-board/assets/js/app.js
//
// 匿名是非題研討板。資料來源：
//   - sessions.json（老師手動編輯，git 版控）：每場研討的是非題題目。
//   - Firestore「responses」collection：學生匿名送出的「對/錯 + 理由」，
//     全部即時公開給所有人看（沒有收起來/公開的機制——如果有不合適的
//     留言，老師直接到 Firebase Console 的 Firestore Database 頁面刪掉
//     那筆文件即可）。
//
// 每則留言有一個「👍」讚數，同學看到已經有人寫過一樣的想法時可以直接按讚，
// 不用再打一次。同一支瀏覽器對同一則留言只能按一次讚（存在 localStorage
// 裡當作提醒用，不是強制的帳號機制）。
//
// 畫面分成「骨架」（題目、文字框，每次切換場次才重建一次）和「內容更新」
// （留言列表、讚數，隨 Firestore 即時資料更新）兩層，這樣其他同學送出
// 留言或按讚時，不會把正在輸入中的文字框內容洗掉。

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { FIREBASE_CONFIG } from "./firebase-config.js";

const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const MATH_DELIMITERS = [
  { left: "$$", right: "$$", display: true },
  { left: "$", right: "$", display: false },
  { left: "\\(", right: "\\)", display: false },
  { left: "\\[", right: "\\]", display: true },
];

const LIKED_STORAGE_KEY = "tfboard-liked";

const statusEl = document.getElementById("board-status");
const emptyEl = document.getElementById("empty-state");
const listEl = document.getElementById("question-list");
const selectEl = document.getElementById("session-select");

let sessions = [];
let currentSession = null;
let latestGrouped = {};
let unsubResponses = null;
let likedIds = loadLikedIds();

function loadLikedIds() {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (error) {
    return new Set();
  }
}

function saveLikedIds() {
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(Array.from(likedIds)));
  } catch (error) {
    // 私密瀏覽模式等情境可能無法寫入，忽略即可，只是每次重新整理都要重新
    // 記錄按過的讚，不影響核心功能。
  }
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickDefaultSession(list) {
  const today = todayStr();
  const past = list.filter((s) => s.id <= today).sort((a, b) => b.id.localeCompare(a.id));
  if (past.length) return past[0].id;
  const future = list.slice().sort((a, b) => a.id.localeCompare(b.id));
  return (future[0] || list[0]).id;
}

function updateURL(id) {
  const params = new URLSearchParams(location.search);
  params.set("session", id);
  history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
}

function renderMath(container) {
  if (window.renderMathInElement) {
    window.renderMathInElement(container, { delimiters: MATH_DELIMITERS, throwOnError: false });
  }
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.hidden = true;
    }, 200);
  }, 2200);
}

async function likeNote(noteId) {
  if (likedIds.has(noteId)) return;
  likedIds.add(noteId);
  saveLikedIds();
  renderStancePanels();
  try {
    await updateDoc(doc(db, "responses", noteId), { likes: increment(1) });
  } catch (error) {
    console.error(error);
    likedIds.delete(noteId);
    saveLikedIds();
    renderStancePanels();
    showToast("按讚失敗，請稍後再試。");
  }
}

function buildNoteRow(item) {
  const row = document.createElement("div");
  row.className = "stance-note";

  const text = document.createElement("span");
  text.className = "stance-note-text";
  text.textContent = item.text;

  const likeBtn = document.createElement("button");
  likeBtn.type = "button";
  likeBtn.className = "stance-like-btn";
  const already = likedIds.has(item.id);
  likeBtn.disabled = already;
  likeBtn.textContent = `👍 ${item.likes || 0}`;
  if (already) likeBtn.classList.add("is-liked");
  likeBtn.addEventListener("click", () => likeNote(item.id));

  row.appendChild(text);
  row.appendChild(likeBtn);
  return row;
}

function buildStancePanel(question, stance, label) {
  const panel = document.createElement("div");
  panel.className = `stance-panel ${stance}`;

  const labelRow = document.createElement("div");
  labelRow.className = "stance-label";
  const labelSpan = document.createElement("span");
  labelSpan.textContent = stance === "agree" ? "對" : "錯";
  const countSpan = document.createElement("span");
  countSpan.className = "stance-count";
  countSpan.id = `count-${question.id}-${stance}`;
  labelRow.appendChild(labelSpan);
  labelRow.appendChild(countSpan);
  panel.appendChild(labelRow);

  const notes = document.createElement("div");
  notes.className = "stance-notes";
  notes.id = `notes-${question.id}-${stance}`;
  panel.appendChild(notes);

  const form = document.createElement("form");
  form.className = "stance-form";

  const textarea = document.createElement("textarea");
  textarea.maxLength = 300;
  textarea.placeholder =
    stance === "agree" ? "為什麼你覺得這是對的？" : "為什麼你覺得這是錯的？可以舉個反例。";

  const row = document.createElement("div");
  row.className = "stance-form-row";
  const charCount = document.createElement("span");
  charCount.className = "stance-char-count";
  charCount.textContent = "0/300";
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "stance-submit";
  submit.textContent = "送出";

  textarea.addEventListener("input", () => {
    charCount.textContent = `${textarea.value.length}/300`;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = textarea.value.trim();
    if (!text || !currentSession) return;
    submit.disabled = true;
    try {
      await addDoc(collection(db, "responses"), {
        sessionId: currentSession.id,
        questionId: question.id,
        stance,
        text,
        likes: 0,
        createdAt: serverTimestamp(),
      });
      textarea.value = "";
      charCount.textContent = "0/300";
      showToast("已送出，謝謝你的想法！");
    } catch (error) {
      console.error(error);
      showToast("送出失敗，請檢查網路連線，或請老師確認 Firestore 設定。");
    } finally {
      submit.disabled = false;
    }
  });

  row.appendChild(charCount);
  row.appendChild(submit);
  form.appendChild(textarea);
  form.appendChild(row);
  panel.appendChild(form);

  return panel;
}

function renderSkeleton(session) {
  listEl.innerHTML = "";
  if (!session.questions.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  session.questions.forEach((q, idx) => {
    const row = document.createElement("article");
    row.className = "question-row";

    const badge = document.createElement("span");
    badge.className = "question-index";
    badge.textContent = `第 ${idx + 1} 題`;
    row.appendChild(badge);

    const prompt = document.createElement("p");
    prompt.className = "question-prompt";
    prompt.textContent = q.text;
    row.appendChild(prompt);

    const columns = document.createElement("div");
    columns.className = "question-columns";
    columns.appendChild(buildStancePanel(q, "agree", "對"));
    columns.appendChild(buildStancePanel(q, "disagree", "錯"));
    row.appendChild(columns);

    listEl.appendChild(row);
  });

  renderMath(listEl);
}

function renderStancePanels() {
  if (!currentSession) return;

  currentSession.questions.forEach((q) => {
    ["agree", "disagree"].forEach((stance) => {
      const items = (latestGrouped[q.id] && latestGrouped[q.id][stance]) || [];
      const countEl = document.getElementById(`count-${q.id}-${stance}`);
      if (countEl) countEl.textContent = items.length ? `${items.length} 則` : "";

      const notesEl = document.getElementById(`notes-${q.id}-${stance}`);
      if (!notesEl) return;
      notesEl.innerHTML = "";

      if (items.length === 0) {
        const p = document.createElement("p");
        p.className = "stance-empty";
        p.textContent = "目前還沒有人寫。";
        notesEl.appendChild(p);
      } else {
        items.forEach((item) => notesEl.appendChild(buildNoteRow(item)));
      }
    });
  });

  renderMath(listEl);
}

function switchSession(sessionId) {
  if (unsubResponses) unsubResponses();
  latestGrouped = {};

  currentSession = sessions.find((s) => s.id === sessionId) || sessions[0];
  selectEl.value = currentSession.id;
  renderSkeleton(currentSession);

  if (!currentSession.questions.length) return;

  unsubResponses = onSnapshot(
    query(collection(db, "responses"), where("sessionId", "==", currentSession.id)),
    (snap) => {
      const grouped = {};
      currentSession.questions.forEach((q) => {
        grouped[q.id] = { agree: [], disagree: [] };
      });
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (!grouped[d.questionId] || (d.stance !== "agree" && d.stance !== "disagree")) return;
        const millis =
          d.createdAt && typeof d.createdAt.toMillis === "function" ? d.createdAt.toMillis() : Date.now();
        grouped[d.questionId][d.stance].push({
          id: docSnap.id,
          text: d.text,
          likes: typeof d.likes === "number" ? d.likes : 0,
          millis,
        });
      });
      // 讚數高的排前面，方便同學先看到已經有人講過的想法再決定要不要按讚；
      // 讚數相同時新的留言排前面。
      Object.values(grouped).forEach((g) => {
        const byLikesThenTime = (a, b) => b.likes - a.likes || b.millis - a.millis;
        g.agree.sort(byLikesThenTime);
        g.disagree.sort(byLikesThenTime);
      });
      latestGrouped = grouped;
      renderStancePanels();
    },
    (error) => {
      console.error(error);
      showToast("讀取留言失敗，請檢查 Firestore 設定與網路連線。");
    },
  );
}

async function init() {
  statusEl.hidden = false;
  statusEl.textContent = "載入場次資料中…";

  try {
    const res = await fetch("sessions.json", { cache: "no-store" });
    sessions = await res.json();
  } catch (error) {
    console.error(error);
    statusEl.textContent = "無法載入 sessions.json，請確認檔案存在且格式正確。";
    return;
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    statusEl.textContent = "目前 sessions.json 是空的，老師可以先加入場次與是非題。";
    return;
  }
  statusEl.hidden = true;

  selectEl.innerHTML = "";
  sessions.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.title;
    selectEl.appendChild(opt);
  });

  const params = new URLSearchParams(location.search);
  let sessionId = params.get("session");
  if (!sessionId || !sessions.some((s) => s.id === sessionId)) {
    sessionId = pickDefaultSession(sessions);
  }

  selectEl.addEventListener("change", () => {
    updateURL(selectEl.value);
    switchSession(selectEl.value);
  });

  updateURL(sessionId);
  switchSession(sessionId);
}

init();
