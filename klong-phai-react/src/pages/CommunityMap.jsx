// src/pages/CommunityMap.jsx
import React from 'react';

export default function CommunityMap() {
  return (
    <div style={{ paddingTop: '100px', textAlign: 'center', paddingBottom: '50px' }}>
      <h2 style={{ fontFamily: 'Mitr', marginBottom: '20px', color: '#00a854' }}>แผนที่อินโฟกราฟิกชุมชนคลองไผ่</h2>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>แผนที่นำเที่ยวสำหรับนักเดินทาง</p>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        {/* ให้เปลี่ยนค่า src ตรงนี้เป็นพาธรูปภาพแผนที่อินโฟกราฟิกของคุณเมื่อทำเสร็จได้เลยครับ */}
        <img 
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000" 
          alt="Community Infographic Map" 
          style={{ width: '100%', borderRadius: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
        />
      </div>
    </div>
  );
}