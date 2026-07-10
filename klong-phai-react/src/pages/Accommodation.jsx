// src/pages/Accommodation.jsx
import React, { useEffect } from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';

export default function Accommodation({ onOpenMap }) {
  // กรองเอาเฉพาะข้อมูลที่เป็นที่พักจากฐานข้อมูลกลาง
  const accommodations = placesDatabase.filter(place => place.type === 'accommodation');

  // สั่งให้หน้าเว็บเลื่อนกลับไปบนสุดโดยอัตโนมัติเมื่อเปลี่ยนมาหน้านี้
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      
      {/* 🎯 ส่วนหัวภาพพื้นหลังแบบเบลอ (Hero BG Blur) */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '35vh', /* ความสูงของแผงรูปภาพด้านบน */
        marginTop: '70px', /* หลบแนว Navbar 70px */
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
      }}>
        {/* 1. รูปภาพพื้นหลังฝั่งที่พักที่สั่งเบลอ */}
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200" /* สามารถเปลี่ยน URL รูปโรงแรม/ที่พักที่ต้องการได้ตรงนี้ */
          alt="Accommodation Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'blur(8px)', /* ระดับความเบลอ */
            transform: 'scale(1.1)', /* ขยายเล็กน้อยเพื่อเก็บขอบขาวจากการเบลอ */
            zIndex: 1
          }}
        />
        
        {/* 2. แผ่น Layer สีดำไล่เฉด เพื่อดันให้ตัวหนังสือหัวข้อเด่นขึ้นมา */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(43, 43, 43, 0.9))',
          zIndex: 2
        }} />

        {/* 3. ข้อความหัวข้อ */}
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px' }}>
          <h2 className="page-title" style={{ 
            fontSize: '2.5rem', 
            color: '#ffffff', 
            marginBottom: 0,
            textShadow: '2px 2px 10px rgba(0,0,0,0.6)' 
          }}>
            🏨 แนะนำที่พัก คลองไผ่
          </h2>
        </div>
      </div>

      {/* 🎯 ส่วนแสดงผลเนื้อหาการ์ดผลลัพธ์ด้านล่าง */}
      <div className="page-container" style={{ 
        width: '100%',
        maxWidth: '1126px',
        margin: '0 auto',
        padding: '30px 20px 60px 20px', /* ปรับระยะให้กระชับพอดีกับส่วนหัว */
        minHeight: '50vh',
        height: 'auto' /* ปล่อยอิสระเพื่อให้สกรอลล์เลื่อนหน้าจอหลักลงไปดูได้ปกติ */
      }}>
        {/* แสดงผลการ์ดที่พักในรูปแบบ Grid ตามที่กำหนดไว้ใน CSS */}
        <div className="results-grid">
          {accommodations.length > 0 ? (
            accommodations.map(place => (
              <Card key={place.id} place={place} onOpenMap={onOpenMap} />
            ))
          ) : (
            <div className="no-result">ยังไม่มีข้อมูลที่พักในขณะนี้</div>
          )}
        </div>
      </div>

    </div>
  );
}