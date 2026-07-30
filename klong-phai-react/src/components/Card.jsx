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
  onDelete,
  onAddToPlan,          // ยังรับไว้ แต่ไม่เรียกใช้
  isAddedToPlan = false
}) {
  const { t, i18n } = useTranslation();

  const activeLang = lang || i18n.language || 'th';
  const isEn = String(activeLang).startsWith('en');

  const titleTh = place.title || place.name || '';
  const titleEn = place.title_en || place.nameEn || titleTh;
  const displayTitle = isEn ? titleEn : titleTh;

  const descTh = place.description || place.detailDescription || place.detail || '';
  const descEn = place.description_en || place.descriptionEn || place.detailDescription_en || place.detailEn || descTh;
  const displayDesc = isEn ? descEn : descTh;

  const imageSrc = place.img || 'https://via.placeholder.com/400x250?text=No+Image';

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify(place));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div 
      className="card card-interactive" 
      onClick={() => onOpenMap && onOpenMap(place)}
      draggable={true}
      onDragStart={handleDragStart}
      style={{ position: 'relative', cursor: 'grab' }}
    >
      {/* ปุ่ม Action สำหรับ Admin */}
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
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px 10px',
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
              แก้ไข
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
              ลบ
            </button>
          )}
        </div>
      )}

      <img 
        className="card-img" 
        src={imageSrc} 
        alt={displayTitle} 
        onError={(e) => {
          e.target.onerror = null; 
          e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Found';
        }}
      />
      
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
            background: 'rgba(0, 0, 0, 0.65)',
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
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
           ❤️ {likesCount}
        </button>
      )}
      
      <div className="card-content">
        <div className="card-title" style={{ fontFamily: 'Mitr, sans-serif' }}>
          {displayTitle}
        </div>

        {displayDesc && (
          <p 
            className="card-desc" 
            style={{ 
              fontSize: '0.85rem', 
              color: '#bbb', 
              marginTop: '6px', 
              marginBottom: '8px', 
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {displayDesc}
          </p>
        )}
        
        <div className="card-meta" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="map-btn" style={{ fontSize: '0.85rem', color: '#00a854', fontWeight: 'bold' }}>
             {t('btn_map_view', 'ดูรายละเอียดและแผนที่')}
          </span>

          {/* ปุ่มเพิ่มลงทริป — แสดง UI แต่กดไม่ได้ */}
          {onAddToPlan && (
            <button
              disabled
              style={{
                background: isAddedToPlan ? '#333' : '#00a854',
                color: isAddedToPlan ? '#aaa' : '#fff',
                border: isAddedToPlan ? '1px solid rgba(255,255,255,0.2)' : 'none',
                padding: '5px 12px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                cursor: 'not-allowed',
                opacity: 0.75,
                transition: 'all 0.2s ease'
              }}
            >
              {isAddedToPlan ? (isEn ? 'Added' : 'เพิ่มแล้ว') : (isEn ? 'Add to Trip' : 'เพิ่มลงทริป')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}