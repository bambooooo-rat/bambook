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
// 不用再打一次；按下去之後在離開這一頁之前都還可以再按一次取消，每一次
// 按下／取消都會即時寫回 Firestore（不是只在自己瀏覽器裡假裝改變，其他
// 人也會馬上看到數字變化）。同一支瀏覽器記得自己按過哪些讚（存在
// localStorage 裡當作提醒用，不是強制的帳號機制），重新整理頁面後這個
// 記憶還在，但那之後就只能再按一次「取消」，沒辦法無限次切換。
//
// 長按（手機長按）或按滑鼠右鍵（電腦，比長按更符合桌機使用者習慣）任何
// 一則留言，會出現「編輯」「刪除」，因為完全匿名沒有帳號系統，所以任何
// 人都可以編輯或刪除任何一則留言——這是刻意的設計，不是漏洞。刪除前一定
// 會先跳出確認提示；編輯會把新的文字跟「已編輯」標記一起即時寫回
// Firestore，其他人也會馬上看到。
//
// 畫面分成「骨架」（題目、文字框，每次切換場次才重建一次）和「內容更新」
// （留言列表、讚數，隨 Firestore 即時資料更新）兩層，這樣其他同學送出
// 留言或按讚時，不會把正在輸入中的文字框內容洗掉；正在編輯中的留言也會
// 在重繪後把游標位置還原回去，不會打字打到一半游標就跳走。

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
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

// 長按留言後的小選單狀態。同一時間只會有一則留言處於「展開選單／編輯中／
// 刪除確認中」，用留言 id 記錄，畫面重繪時照這個狀態決定要畫哪一種樣子。
let activeNoteId = null;
let editingNoteId = null;
let confirmDeleteId = null;
const editDrafts = new Map(); // noteId -> 編輯中尚未送出的草稿文字
const pendingNoteActions = new Set(); // 正在送出中的編輯／刪除（noteId）

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

// 正在送出中的讚／取消讚（noteId 的集合），送出期間鎖住那顆按鈕，避免
// 連續點擊在請求還沒回來前就把本機狀態跟資料庫寫壞。
const pendingLikes = new Set();

async function toggleLike(noteId) {
  if (pendingLikes.has(noteId)) return;
  const wasLiked = likedIds.has(noteId);
  pendingLikes.add(noteId);

  if (wasLiked) likedIds.delete(noteId);
  else likedIds.add(noteId);
  saveLikedIds();
  renderStancePanels();

  try {
    await updateDoc(doc(db, "responses", noteId), { likes: increment(wasLiked ? -1 : 1) });
  } catch (error) {
    console.error(error);
    // 失敗就把本機狀態退回去，畫面跟資料庫才不會兜不起來。
    if (wasLiked) likedIds.add(noteId);
    else likedIds.delete(noteId);
    saveLikedIds();
    showToast(wasLiked ? "取消讚失敗，請稍後再試。" : "按讚失敗，請稍後再試。");
  } finally {
    pendingLikes.delete(noteId);
    renderStancePanels();
  }
}

// 開啟「編輯／刪除」選單的手勢：手機／觸控用長按（按住超過 LONG_PRESS_MS
// 沒有明顯移動），電腦用滑鼠右鍵（更符合桌機使用者的習慣，右鍵選單本來
// 就是「針對這個東西的動作」）。兩種手勢共用同一個 onTrigger callback。
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10;

function attachLongPress(el, onTrigger) {
  let timer = null;
  let startX = 0;
  let startY = 0;

  const clear = () => {
    clearTimeout(timer);
    timer = null;
  };

  el.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startX = event.clientX;
    startY = event.clientY;
    clear();
    timer = setTimeout(onTrigger, LONG_PRESS_MS);
  });

  el.addEventListener("pointermove", (event) => {
    if (!timer) return;
    if (
      Math.abs(event.clientX - startX) > LONG_PRESS_MOVE_TOLERANCE ||
      Math.abs(event.clientY - startY) > LONG_PRESS_MOVE_TOLERANCE
    ) {
      clear();
    }
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach((type) => el.addEventListener(type, clear));

  // 右鍵／觸控長按有時候跳出的瀏覽器原生選單一律擋掉，改成觸發我們自己
  // 畫的「編輯／刪除」選單（部分觸控瀏覽器長按放開時也會補發一次
  // contextmenu，這裡也一併處理，重複觸發 onTrigger 沒有副作用）。
  el.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    onTrigger();
  });
}

function closeAllNoteMenus() {
  activeNoteId = null;
  editingNoteId = null;
  confirmDeleteId = null;
}

function buildNoteActionBar(item) {
  const bar = document.createElement("div");
  bar.className = "stance-note-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "stance-note-action-btn";
  editBtn.textContent = "編輯";
  editBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    editingNoteId = item.id;
    if (!editDrafts.has(item.id)) editDrafts.set(item.id, item.text);
    renderStancePanels();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "stance-note-action-btn danger";
  deleteBtn.textContent = "刪除";
  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    confirmDeleteId = item.id;
    renderStancePanels();
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "stance-note-action-btn";
  closeBtn.textContent = "關閉";
  closeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAllNoteMenus();
    renderStancePanels();
  });

  bar.appendChild(editBtn);
  bar.appendChild(deleteBtn);
  bar.appendChild(closeBtn);
  return bar;
}

function buildNoteDeleteConfirm(item) {
  const bar = document.createElement("div");
  bar.className = "stance-note-confirm";
  const pending = pendingNoteActions.has(item.id);

  const msg = document.createElement("span");
  msg.className = "stance-note-confirm-text";
  msg.textContent = "確定要刪除這則留言嗎？刪除後無法復原，任何人的留言都可以互相刪除。";
  bar.appendChild(msg);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "stance-note-action-btn danger";
  confirmBtn.textContent = "確定刪除";
  confirmBtn.disabled = pending;
  confirmBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    if (pendingNoteActions.has(item.id)) return;
    pendingNoteActions.add(item.id);
    renderStancePanels();
    try {
      await deleteDoc(doc(db, "responses", item.id));
      closeAllNoteMenus();
      showToast("留言已刪除。");
    } catch (error) {
      console.error(error);
      showToast("刪除失敗，請稍後再試。");
    } finally {
      pendingNoteActions.delete(item.id);
      renderStancePanels();
    }
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "stance-note-action-btn";
  cancelBtn.textContent = "取消";
  cancelBtn.disabled = pending;
  cancelBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    confirmDeleteId = null;
    renderStancePanels();
  });

  bar.appendChild(confirmBtn);
  bar.appendChild(cancelBtn);
  return bar;
}

function buildNoteEditForm(item) {
  const form = document.createElement("form");
  form.className = "stance-note-edit";
  const pending = pendingNoteActions.has(item.id);

  const textarea = document.createElement("textarea");
  textarea.maxLength = 300;
  textarea.rows = 1;
  textarea.dataset.noteId = item.id;
  textarea.value = editDrafts.has(item.id) ? editDrafts.get(item.id) : item.text;
  textarea.disabled = pending;
  // 點擊／按住輸入框本身不該被當成又一次「長按這則留言」。
  textarea.addEventListener("pointerdown", (event) => event.stopPropagation());
  textarea.addEventListener("click", (event) => event.stopPropagation());

  const row = document.createElement("div");
  row.className = "stance-note-edit-row";

  const charCount = document.createElement("span");
  charCount.className = "stance-char-count";
  charCount.textContent = `${textarea.value.length}/300`;

  textarea.addEventListener("input", () => {
    charCount.textContent = `${textarea.value.length}/300`;
    editDrafts.set(item.id, textarea.value);
  });

  const actions = document.createElement("div");
  actions.className = "stance-note-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "stance-note-action-btn";
  saveBtn.textContent = "儲存";
  saveBtn.disabled = pending;

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "stance-note-action-btn";
  cancelBtn.textContent = "取消";
  cancelBtn.disabled = pending;
  cancelBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeAllNoteMenus();
    editDrafts.delete(item.id);
    renderStancePanels();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (pendingNoteActions.has(item.id)) return;
    const newText = textarea.value.trim();
    if (!newText) return;
    if (newText === item.text) {
      closeAllNoteMenus();
      editDrafts.delete(item.id);
      renderStancePanels();
      return;
    }
    pendingNoteActions.add(item.id);
    renderStancePanels();
    try {
      await updateDoc(doc(db, "responses", item.id), {
        text: newText,
        editedAt: serverTimestamp(),
      });
      closeAllNoteMenus();
      editDrafts.delete(item.id);
      showToast("留言已更新。");
    } catch (error) {
      console.error(error);
      showToast("更新失敗，請稍後再試。");
    } finally {
      pendingNoteActions.delete(item.id);
      renderStancePanels();
    }
  });

  actions.appendChild(saveBtn);
  actions.appendChild(cancelBtn);
  row.appendChild(charCount);
  row.appendChild(actions);
  form.appendChild(textarea);
  form.appendChild(row);
  return form;
}

function buildNoteRow(item) {
  const row = document.createElement("div");
  row.className = "stance-note";
  row.title = "長按（或按右鍵）可編輯或刪除這則留言";

  const isEditing = editingNoteId === item.id;

  // 編輯中就不重複顯示原本那行靜態文字了（下面的輸入框本身已經預填同樣
  // 內容），避免同一句話在畫面上出現兩次。
  if (!isEditing) {
    const main = document.createElement("div");
    main.className = "stance-note-main";

    const text = document.createElement("span");
    text.className = "stance-note-text";
    text.textContent = item.text;

    const meta = document.createElement("span");
    meta.className = "stance-note-meta";

    if (item.edited) {
      const editedTag = document.createElement("span");
      editedTag.className = "stance-note-edited";
      editedTag.textContent = "已編輯";
      meta.appendChild(editedTag);
    }

    const likeBtn = document.createElement("button");
    likeBtn.type = "button";
    likeBtn.className = "stance-like-btn";
    const liked = likedIds.has(item.id);
    likeBtn.disabled = pendingLikes.has(item.id);
    likeBtn.setAttribute("aria-pressed", String(liked));
    likeBtn.title = liked ? "再按一次取消讚" : "覺得這則想法也是你要說的，按讚就好，不用重打一次";
    likeBtn.textContent = `👍 ${item.likes || 0}`;
    if (liked) likeBtn.classList.add("is-liked");
    likeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLike(item.id);
    });
    meta.appendChild(likeBtn);

    main.appendChild(text);
    main.appendChild(meta);
    row.appendChild(main);
  }

  if (isEditing) {
    row.appendChild(buildNoteEditForm(item));
  } else if (confirmDeleteId === item.id) {
    row.appendChild(buildNoteDeleteConfirm(item));
  } else if (activeNoteId === item.id) {
    row.appendChild(buildNoteActionBar(item));
  }

  attachLongPress(row, () => {
    if (pendingNoteActions.has(item.id) || editingNoteId === item.id || confirmDeleteId === item.id) return;
    activeNoteId = item.id;
    renderStancePanels();
  });

  return row;
}

function buildStancePanel(question, stance) {
  const panel = document.createElement("div");
  panel.className = `stance-panel ${stance}`;

  const heading = document.createElement("p");
  heading.className = "stance-heading";
  heading.textContent =
    stance === "agree" ? "我認為該敘述是對的，因為……" : "我認為該敘述是錯的，因為……";
  panel.appendChild(heading);

  const countSpan = document.createElement("p");
  countSpan.className = "stance-count";
  countSpan.id = `count-${question.id}-${stance}`;
  panel.appendChild(countSpan);

  const notes = document.createElement("div");
  notes.className = "stance-notes";
  notes.id = `notes-${question.id}-${stance}`;
  panel.appendChild(notes);

  const form = document.createElement("form");
  form.className = "stance-form";

  const textarea = document.createElement("textarea");
  textarea.maxLength = 300;
  textarea.rows = 1;
  textarea.placeholder = stance === "agree" ? "請說明你的理由……" : "請說明你的理由，或舉個反例……";

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
    columns.appendChild(buildStancePanel(q, "agree"));
    columns.appendChild(buildStancePanel(q, "disagree"));
    row.appendChild(columns);

    listEl.appendChild(row);
  });

  renderMath(listEl);
}

function renderStancePanels() {
  if (!currentSession) return;

  // 如果使用者正在編輯某則留言、游標目前就在那個輸入框裡，先記住游標
  // 位置——即時資料更新（別人送出新留言、按讚等）觸發的重繪才不會把
  // 正在打的字或游標弄丟。
  const activeEl = document.activeElement;
  const hadEditFocus =
    editingNoteId &&
    activeEl instanceof HTMLTextAreaElement &&
    activeEl.dataset.noteId === editingNoteId;
  const editCaret = hadEditFocus ? { start: activeEl.selectionStart, end: activeEl.selectionEnd } : null;

  currentSession.questions.forEach((q) => {
    ["agree", "disagree"].forEach((stance) => {
      const items = (latestGrouped[q.id] && latestGrouped[q.id][stance]) || [];
      const countEl = document.getElementById(`count-${q.id}-${stance}`);
      if (countEl) countEl.textContent = items.length ? `目前有 ${items.length} 則想法` : "";

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

  if (hadEditFocus) {
    const restored = listEl.querySelector(`textarea[data-note-id="${CSS.escape(editingNoteId)}"]`);
    if (restored) {
      restored.focus();
      try {
        restored.setSelectionRange(editCaret.start, editCaret.end);
      } catch (error) {
        // 部分瀏覽器在特定狀態下可能丟例外，忽略即可，不影響其他功能。
      }
    }
  }
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
          edited: !!d.editedAt,
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
