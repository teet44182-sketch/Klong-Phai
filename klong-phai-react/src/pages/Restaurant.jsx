// src/pages/Restaurant.jsx
import React, { useEffect } from 'react';
import Card from '../components/Card';

export default function Restaurant({ 
  places = [],        // รับ places จาก Props
  loading = false,    // รับ loading จาก Props
  onOpenMap, 
  likes = {}, 
  onLike, 
  lang = 'th',
  isAdmin = false,
  onEditPlace,
  onDeletePlace
}) {
  const isEn = lang === 'en';

  // กรองเอาเฉพาะข้อมูลที่เป็นร้านอาหารจาก Props places (รองรับทั้ง field category และ type)
  const restaurants = (places || [])
    .filter(place => place.category === 'restaurant' || place.type === 'restaurant')
    .map(p => ({
      id: p.id,
      name: p.title || p.name,
      nameEn: p.title_en || p.nameEn,
      description: p.description,
      descriptionEn: p.description_en || p.descriptionEn,
      detail: p.detailDescription || p.detail || p.description,
      detailEn: p.detailDescription_en || p.detailEn || p.description_en,
      img: p.img,
      mapUrl: p.mapUrl,
      workingHours: p.workingHours,
      phone: p.phone,
      category: p.category || p.type
    }));

  // สั่งให้หน้าเว็บเลื่อนกลับไปบนสุดโดยอัตโนมัติเมื่อเปิดหน้าร้านอาหาร
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      
      {/* ส่วนหัวภาพพื้นหลังแบบเบลอ (Hero BG Blur) */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '35vh', 
        marginTop: '70px', 
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
      }}>
        {/* ตัวรูปภาพพื้นหลังที่สั่งเบลอ */}
        <img 
          src="src/assets/cf.jpg" 
          alt="Restaurant Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'blur(8px)', 
            transform: 'scale(1.1)', 
            zIndex: 1
          }}
        />
        
        {/* แผ่น Layer สีดำไล่เฉด เพื่อให้ตัวอักษรหัวข้ออ่านง่ายเด่นขึ้นมา */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(43, 43, 43, 0.9))',
          zIndex: 2
        }} />

        {/* กล่องข้อความหัวข้อที่อยู่เหนือชั้น Layer บล็อกอื่นๆ */}
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px' }}>
          <h2 className="page-title" style={{ 
            fontSize: '2.5rem', 
            color: '#ffffff', 
            marginBottom: 0,
            textShadow: '2px 2px 10px rgba(0,0,0,0.6)',
            fontFamily: 'Mitr, sans-serif'
          }}>
            {isEn ? 'Restaurants' : 'ร้านอาหาร'}
          </h2>
        </div>
      </div>

      {/* ส่วนแสดงผลเนื้อหาการ์ดผลลัพธ์ด้านล่าง */}
      <div className="page-container" style={{ 
        width: '100%',
        maxWidth: '1126px',
        margin: '0 auto',
        padding: '30px 20px 60px 20px', 
        minHeight: '50vh',
        height: 'auto' 
      }}>
        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '40px', fontFamily: 'Prompt, sans-serif' }}>
            {isEn ? 'Loading restaurants...' : 'กำลังโหลดข้อมูลร้านอาหาร...'}
          </div>
        ) : (
          /* ระบบ Grid จัดเรียงการ์ดแสดงผลร้านอาหาร */
          <div className="results-grid">
            {restaurants.length > 0 ? (
              restaurants.map(place => (
                <Card 
                  key={place.id} 
                  place={place} 
                  onOpenMap={onOpenMap} 
                  likesCount={likes[place.id] || 0}
                  onLike={onLike}
                  lang={lang}
                  isAdmin={isAdmin}
                  onEdit={onEditPlace}
                  onDelete={onDeletePlace}
                />
              ))
            ) : (
              <div className="no-result" style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>
                {isEn ? 'No restaurants available at the moment.' : 'ยังไม่มีข้อมูลร้านอาหารในขณะนี้'}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}