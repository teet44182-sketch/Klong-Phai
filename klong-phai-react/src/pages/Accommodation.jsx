// src/pages/Accommodation.jsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';

export default function Accommodation({ 
  places = [],        // รับ places จาก Props
  loading = false,    // รับ loading จาก Props
  onOpenMap, 
  likes = {}, 
  onLike, 
  lang,
  isAdmin = false,
  onEditPlace,
  onDeletePlace
}) {
  const { t, i18n } = useTranslation();

  // กำหนดภาษาปัจจุบัน (ถ้าไม่ส่ง lang ผ่าน prop ให้ถอยไปใช้ i18n.language)
  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  // 📌 กรองเอาเฉพาะข้อมูลที่เป็นที่พัก (ปรับปรุงให้ไม่สนตัวพิมพ์ใหญ่-เล็ก และรองรับภาษาไทย/คีย์เวิร์ดอื่นๆ)
  const accommodations = (places || [])
    .filter(place => {
      const cat = String(place.category || place.type || '').toLowerCase().trim();
      return (
        cat === 'accommodation' || 
        cat === 'hotel' || 
        cat === 'resort' || 
        cat === 'stay' || 
        cat === 'ที่พัก' || 
        cat === 'โรงแรม'
      );
    })
    .map(p => ({
      id: p.id || p.docId,
      name: p.title || p.name,
      nameEn: p.title_en || p.nameEn,
      description: p.description,
      descriptionEn: p.description_en || p.descriptionEn,
      detail: p.detailDescription || p.detail || p.description,
      detailEn: p.detailDescription_en || p.detailEn || p.description_en,
      img: p.img || p.imageUrl || p.image,
      mapUrl: p.mapUrl || p.googleMap || p.map,
      workingHours: p.workingHours,
      phone: p.phone,
      category: p.category || p.type
    }));

  // สั่งให้หน้าเว็บเลื่อนกลับไปบนสุดโดยอัตโนมัติเมื่อเปลี่ยนมาหน้านี้
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
        {/* รูปภาพพื้นหลังฝั่งที่พักที่สั่งเบลอ */}
        <img 
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200" 
          alt={t('nav_accommodation', isEn ? 'Accommodation' : 'ที่พัก')}
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
        
        {/* แผ่น Layer สีดำไล่เฉด เพื่อดันให้ตัวหนังสือหัวข้อเด่นขึ้นมา */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(43, 43, 43, 0.9))',
          zIndex: 2
        }} />

        {/* ข้อความหัวข้อ */}
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px' }}>
          <h2 className="page-title" style={{ 
            fontSize: '2.5rem', 
            color: '#ffffff', 
            marginBottom: 0,
            textShadow: '2px 2px 10px rgba(0,0,0,0.6)',
            fontFamily: 'Mitr, sans-serif'
          }}>
            {t('nav_accommodation', isEn ? 'Accommodation' : 'ที่พัก')}
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
            {isEn ? 'Loading accommodations...' : 'กำลังโหลดข้อมูลที่พัก...'}
          </div>
        ) : (
          /* แสดงผลการ์ดที่พักในรูปแบบ Grid ตามที่กำหนดไว้ใน CSS */
          <div className="results-grid">
            {accommodations.length > 0 ? (
              accommodations.map(place => (
                <Card 
                  key={place.id} 
                  place={place} 
                  onOpenMap={onOpenMap} 
                  likesCount={likes[place.id] || 0}
                  onLike={onLike}
                  lang={currentLang}
                  isAdmin={isAdmin}
                  onEdit={onEditPlace}
                  onDelete={onDeletePlace}
                />
              ))
            ) : (
              <div className="no-result" style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>
                {t('no_accommodation', isEn ? 'No accommodations available at the moment.' : 'ยังไม่มีข้อมูลที่พักในขณะนี้')}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}