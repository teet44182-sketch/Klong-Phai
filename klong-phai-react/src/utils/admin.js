// src/utils/admin.js

// 🛑 ใส่ รายชื่อ Admin Email ให้ตรงกับใน Firebase Rules
export const ADMIN_EMAILS = [
  "Teet44182@gmail.com","เทศบาล@gmail.com"
];

export const checkIsAdmin = (user) => {
  return user && user.email && ADMIN_EMAILS.includes(user.email);
};

import React from 'react';
// Import ฟังก์ชัน uploadPlacesToFirestore จากไฟล์ firebase.js ของเรา
import { uploadPlacesToFirestore } from './firebase'; 

export default function AdminSeedPage() {
  return (
    <div style={{ padding: '30px', textAlign: 'center' }}>
      <h2>ระบบจัดการหลังบ้าน</h2>
      <button 
        onClick={uploadPlacesToFirestore}
        style={{ 
          padding: '12px 24px', 
          fontSize: '16px', 
          backgroundColor: '#ff9800', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🔥 อัปโหลดข้อมูล Hardcode ขึ้น Firebase (กดครั้งเดียว)
      </button>
    </div>
  );
}