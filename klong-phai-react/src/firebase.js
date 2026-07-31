// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

// ✅ ใช้ env พร้อม fallback
const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyD9-7W4KE18wAaLIE2CAN5oJWP1Oz3w4EM",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "klong-phai.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "klong-phai",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "klong-phai.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "1099143524818",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:1099143524818:web:4a1be68d6cd0b7cf35980b",
  measurementId: import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-37JR86V3T8"
};

console.log("🔥 Firebase Config:", {
  ...firebaseConfig,
  apiKey: "***HIDDEN***" // ไม่แสดง apiKey ใน console
});

// เริ่มต้นเปิดระบบ Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);

// ประกาศตัวแปรและส่งออก (export)
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// ฟังก์ชัน Login / Logout ให้ App.jsx เรียกใช้
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);