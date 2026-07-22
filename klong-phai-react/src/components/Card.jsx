// src/components/Card.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Card({ place, onOpenMap, likesCount = 0, onLike, lang }) {
  const { t, i18n } = useTranslation();

  // 1. แก้การเช็กภาษาให้ถูกต้องตามลำดับวงเล็บ
  const effectiveLang = lang ? lang : (i18n.language || 'th');
  const isEn = effectiveLang.startsWith('en');

  // 2. ดึงค่าภาษาอังกฤษแบบ fallback รองรับชื่อ Key หลายรูปแบบ (nameEn, name_en, title_en ฯลฯ)
  const displayTitle = isEn 
    ? (place.nameEn || place.name_en || place.title_en || place.name || place.title) 
    : (place.name || place.title);

  const displayDesc = isEn 
    ? (place.descriptionEn || place.description_en || place.descEn || place.description) 
    : place.description;

  return (
    <div 
      className="card card-interactive" 
      onClick={() => onOpenMap(place)}
    >
      {/* ส่วนแสดงรูปภาพสถานที่ */}
      <img className="card-img" src={place.img || place.image} alt={displayTitle} />
      
      {/* ปุ่มกดไลก์หัวใจ (มุมขวาบนของการ์ด) */}
      {onLike && (
        <button 
          className="card-like-btn"
          onClick={(e) => {
            e.stopPropagation(); // กันไม่ให้กดโดนเปิดหน้าต่างรายละเอียดสถานที่
            onLike(place.id);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ff4b4b',
            padding: '6px 12px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            zIndex: 15,
            transition: 'transform 0.1s ease',
            outline: 'none'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
           ❤️ {likesCount}
        </button>
      )}
      
      <div className="card-content">
        {/* ส่วนแสดงชื่อสถานที่ */}
        <div className="card-title" style={{ fontFamily: 'Mitr, sans-serif' }}>
          {displayTitle}
        </div>

        {/* ส่วนแสดงคำอธิบายสั้นๆ (ถ้ามี) */}
        {displayDesc && (
          <p className="card-desc" style={{ fontSize: '0.85rem', color: '#bbb', marginTop: '6px', marginBottom: '8px', lineHeight: '1.4' }}>
            {displayDesc}
          </p>
        )}
        
        {/* บล็อกข้อมูลเพิ่มเติมสั้นๆ ด้านล่างการ์ด */}
        <div className="card-meta" style={{ marginTop: '10px' }}>
          <span className="map-btn" style={{ fontSize: '0.85rem', color: '#00a854' }}>
             {t('btn_map_view', isEn ? 'Details & Map' : 'ดูรายละเอียดและแผนที่')}
          </span>
        </div>
      </div>
    </div>
  );
}