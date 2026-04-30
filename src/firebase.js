import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore } from "firebase/firestore";

// 請將下方內容替換成你剛剛在 Firebase Console 看到的 config 內容
const firebaseConfig = {
  apiKey: "AIzaSyBql2vQ1A9O6DJl5Rpf5-J2aCb9I2LSa2Y",
  authDomain: "community-inspection.firebaseapp.com",
  projectId: "community-inspection",
  storageBucket: "community-inspection.firebasestorage.app",
  messagingSenderId: "829688760728",
  appId: "1:829688760728:web:a48ec044d19e1d8ff9c3ed"
};

const app = initializeApp(firebaseConfig);

// 建立一個次要的 App 實例，專門用來讓管理員建立新帳號
const secondaryApp = initializeApp(firebaseConfig, "Secondary");

export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp); // 匯出這個
export const storage = getStorage(app);