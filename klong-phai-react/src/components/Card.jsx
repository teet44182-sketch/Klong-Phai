// src/components/Card.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Card({ 
  place = {}, 
  onOpenMap, 
  likesCount = 0, 
  onLike, 
  lang,
  isAdmin = false,
  onEdit,
  onDelete
}) {
  const { t, i18n } = useTranslation();

  // Fix: แก้ไขการวงเล็บ Logic เช็คภาษาให้ถูกต้อง
  const activeLang = lang || i18n.language || 'th';
  const isEn = activeLang.startsWith('en');

  // ดึงชื่อสถานที่ รองรับทั้ง title, title_en, name, nameEn
  const titleTh = place.title || place.name || '';
  const titleEn = place.title_en || place.nameEn || titleTh;
  const displayTitle = isEn ? titleEn : titleTh;

  // ดึงคำอธิบายสถานที่ รองรับทั้ง description, description_en, descriptionEn
  const descTh = place.description || place.detailDescription || place.detail || '';
  const descEn = place.description_en || place.descriptionEn || place.detailDescription_en || place.detailEn || descTh;
  const displayDesc = isEn ? descEn : descTh;

  return (
    <div 
      className="card card-interactive" 
      onClick={() => onOpenMap && onOpenMap(place)}
      style={{ position: 'relative' }}
    >
      {/* ปุ่ม Action เฉพาะ Admin */}
      {isAdmin && (
        <div 
          className="admin-actions"
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 20,
            display: 'flex',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px 8px',
            borderRadius: '20px'
          }}
        >
          {onEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(place);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffca28',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              ✏️ แก้ไข
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(place);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff4b4b',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              🗑️ ลบ
            </button>
          )}
        </div>
      )}

      {/* ส่วนแสดงรูปภาพสถานที่ */}
      <img className="card-img" src={place.img} alt={displayTitle} />
      
      {/* ปุ่มกดไลก์หัวใจ */}
      {onLike && (
        <button 
          className="card-like-btn"
          onClick={(e) => {
            e.stopPropagation();
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

        {/* ส่วนแสดงคำอธิบายสั้นๆ */}
        {displayDesc && (
          <p className="card-desc" style={{ fontSize: '0.85rem', color: '#bbb', marginTop: '6px', marginBottom: '8px', lineHeight: '1.4' }}>
            {displayDesc}
          </p>
        )}
        
        {/* บล็อกข้อมูลเพิ่มเติมสั้นๆ ด้านล่างการ์ด */}
        <div className="card-meta" style={{ marginTop: '10px' }}>
          <span className="map-btn" style={{ fontSize: '0.85rem', color: '#00a854' }}>
             {t('btn_map_view', 'ดูรายละเอียดและแผนที่')}
          </span>
        </div>
      </div>
    </div>
  );
}