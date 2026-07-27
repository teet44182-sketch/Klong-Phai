// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";


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

// 🚀 ฟังก์ชันสำหรับอัปโหลดข้อมูล Hardcode ขึ้น Firestore (รันครั้งเดียวจบ)
export const uploadPlacesToFirestore = async () => {
  try {
    const placesRef = collection(db, 'places');
    
    // 1. เช็คก่อนว่าใน Firestore มีข้อมูลอยู่แล้วหรือยัง เพื่อป้องกันการลงข้อมูลซ้ำ
    const snapshot = await getDocs(placesRef);
    if (!snapshot.empty) {
      console.log('⚠️ มีข้อมูลสถานที่ใน Firestore อยู่แล้ว ยกเลิกการอัปโหลดเพื่อป้องกันข้อมูลซ้ำ');
      alert('มีข้อมูลอยู่ใน Firestore อยู่แล้วครับ');
      return;
    }

    console.log('🚀 กำลังเริ่มอัปโหลดข้อมูลเข้า Firestore...');

    // 2. ลูปนำข้อมูลจาก placesDatabase ยัดเข้า Firestore
    for (const place of placesDatabase) {
      const { id, ...dataToUpload } = place; // ตัด id เดิมออก ให้ Firestore สร้างให้อัตโนมัติ

      await addDoc(placesRef, {
        ...dataToUpload,
        category: dataToUpload.category || dataToUpload.type || 'checkin',
        createdAt: new Date()
      });
      console.log(`✅ อัปโหลดเรียบร้อย: ${place.title}`);
    }

    console.log('🎉 อัปโหลดข้อมูลสถานที่ทั้งหมดขึ้น Firestore สำเร็จ!');
    alert('อัปโหลดข้อมูลสถานที่ขึ้น Firestore สำเร็จเรียบร้อย!');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการอัปโหลดข้อมูล:', error);
  }
};