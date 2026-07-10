// src/pages/Restaurant.jsx
import React, { useEffect } from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';

export default function Restaurant({ onOpenMap }) {
  // กรองเอาเฉพาะข้อมูลที่เป็นร้านอาหารจากฐานข้อมูลกลาง
  const restaurants = placesDatabase.filter(place => place.type === 'restaurant');

  // สั่งให้หน้าเว็บเลื่อนกลับไปบนสุดโดยอัตโนมัติเมื่อเปิดหน้าร้านอาหาร
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
        marginTop: '70px', /* หลบแนว Navbar */
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
      }}>
        {/* 1. ตัวรูปภาพพื้นหลังที่สั่งเบลอ */}
        <img 
          src="src/assets/cf.jpg" /* สามารถเปลี่ยน URL รูปฟิลเตอร์ร้านอาหารที่ชอบได้ตรงนี้ */
          alt="Restaurant Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'blur(8px)', /* ปรับระดับความเบลอตามใจชอบ */
            transform: 'scale(1.1)', /* ดัน scale ขึ้นเล็กน้อยเพื่อเก็บขอบที่เบลอไม่ให้เห็นขอบขาว */
            zIndex: 1
          }}
        />
        
        {/* 2. แผ่น Layer สีดำไล่เฉด เพื่อให้ตัวอักษรหัวข้ออ่านง่ายเด่นขึ้นมา */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(43, 43, 43, 0.9))',
          zIndex: 2
        }} />

        {/* 3. กล่องข้อความหัวข้อที่อยู่เหนือชั้น Layer บล็อกอื่นๆ */}
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px' }}>
          <h2 className="page-title" style={{ 
            fontSize: '2.5rem', 
            color: '#ffffff', 
            marginBottom: 0,
            textShadow: '2px 2px 10px rgba(0,0,0,0.6)' 
          }}>
            ร้านอาหาร
          </h2>
        </div>
      </div>

      {/* 🎯 ส่วนแสดงผลเนื้อหาการ์ดผลลัพธ์ด้านล่าง */}
      <div className="page-container" style={{ 
        width: '100%',
        maxWidth: '1126px',
        margin: '0 auto',
        padding: '30px 20px 60px 20px', /* ปรับ padding top ให้กระชับขึ้นเพราะมีส่วนหัวช่วยดันระยะแล้ว */
        minHeight: '50vh',
        height: 'auto' /* ปล่อยความสูงอิสระ เพื่อให้สกรอลล์เลื่อนหน้าจอหลักได้ตามปกติ */
      }}>
        {/* ระบบ Grid จัดเรียงการ์ดแสดงผลร้านอาหาร */}
        <div className="results-grid">
          {restaurants.length > 0 ? (
            restaurants.map(place => (
              <Card key={place.id} place={place} onOpenMap={onOpenMap} />
            ))
          ) : (
            <div className="no-result">ยังไม่มีข้อมูลร้านอาหารในขณะนี้</div>
          )}
        </div>
      </div>

    </div>
  );
}