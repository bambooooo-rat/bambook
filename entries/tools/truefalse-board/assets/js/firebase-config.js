// entries/tools/truefalse-board/assets/js/firebase-config.js
//
// 這是唯一需要您填入自己資料的檔案。步驟請見同資料夾的 README.md。
//
// 1. 到 https://console.firebase.google.com 建立一個新專案（免費 Spark 方案即可）。
// 2. 在專案設定裡「新增應用程式」→ 網頁應用程式，複製它給你的 firebaseConfig 物件，
//    貼到下面取代整個 FIREBASE_CONFIG。
// 3. 到左側選單「資料庫和儲存空間」→「Firestore Database」→ 建立資料庫
//    （注意不是「Realtime Database」，這是兩個不同產品，介面長得有點像，
//    但資料格式跟規則語法完全不一樣）。規則內容用 firestore.rules 覆蓋。

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDngLEqhDA26qFwrSPIOnjNnSHHzaf0_VA",
  authDomain: "bambook-tfboard.firebaseapp.com",
  projectId: "bambook-tfboard",
  storageBucket: "bambook-tfboard.firebasestorage.app",
  messagingSenderId: "14051310507",
  appId: "1:14051310507:web:a37bf5b429bbe609e570ee",
  measurementId: "G-XZE8F14JH0"
};
