// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // เพิ่มเติมสำหรับระบบ Login
import { getFirestore } from "firebase/firestore";         // เพิ่มเติมสำหรับระบบฐานข้อมูลรีวิว

const firebaseConfig = {
  apiKey: "AIzaSyD9-7W4KE18wAaLIE2CAN5oJWP1Oz3w4EM",
  authDomain: "klong-phai.firebaseapp.com",
  projectId: "klong-phai",
  storageBucket: "klong-phai.firebasestorage.app",
  messagingSenderId: "1099143524818",
  appId: "1:1099143524818:web:4a1be68d6cd0b7cf35980b",
  measurementId: "G-37JR86V3T8"
};

// เริ่มต้นเปิดระบบ Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ประกาศตัวแปรและส่งออก (export) ไปให้หน้า App.jsx ดึงไปใช้งาน
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);