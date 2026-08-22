// src/components/Card.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const getCategoryColor = (category, subCategory) => {
  const cat = (category || '').toString().toLowerCase().trim();
  const subCat = (subCategory || '').toString().toLowerCase().trim() || 'other';

  if (cat === 'restaurant' || cat === 'accommodation') {
    return 'transparent';
  }

  if (cat === 'travel') {
    const colorMap = {
      travel: '#00a854',
      cafe: '#8B5CF6',
      temple: '#F59E0B',
      nature_activity: '#00a854',
      government_training: '#F97316',
      conservation: '#3B82F6',
      transport: '#06B6D4',
      new_attraction: '#EC4899',
      other: '#6B7280'
    };
    return colorMap[subCat] || colorMap['travel'];
  }

  return '#6B7280';
};

export default function Card({ 
  place = {}, 
  onOpenMap, 
  likesCount = 0, 
  onLike, 
  lang,
  isAdmin = false,
  onEdit,
  onDelete,
  onAddToPlan,
  isAddedToPlan = false
}) {
  const { t, i18n } = useTranslation();
  const activeLang = lang || i18n.language || 'th';
  const isEn = String(activeLang).startsWith('en');

  const sanitizeText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/[<>]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  const titleTh = place.title || place.name || '';
  const titleEn = place.title_en || place.nameEn || titleTh;
  const displayTitle = sanitizeText(isEn ? titleEn : titleTh);

  const descTh = place.description || place.detailDescription || place.detail || '';
  const descEn = place.description_en || place.descriptionEn || place.detailDescription_en || place.detailEn || descTh;
  const displayDesc = sanitizeText(isEn ? descEn : descTh);

  const imageSrc = place.img || 'https://via.placeholder.com/400x250?text=No+Image';

  const category = place.category || place.type || 'travel';
  const subCategory = place.subCategory || 'other';

  const borderColor = getCategoryColor(category, subCategory);

  const handleLikeClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onLike) {
      const placeId = place.id || place.docId;
      if (placeId) onLike(placeId);
    }
  };

  const handleCardClick = () => {
    if (onOpenMap) {
      onOpenMap(place);
    }
  };

  return (
    <div 
      className="card card-interactive" 
      onClick={handleCardClick}
      style={{ 
        position: 'relative', 
        cursor: 'pointer',
        borderLeft: borderColor === 'transparent' ? 'none' : `6px solid ${borderColor}`,
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      {isAdmin && (
        <div className="admin-actions" style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 20, display: 'flex', gap: '6px', background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '4px 10px', borderRadius: '20px' }}>
          {onEdit && (
            <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(place); }} style={{ background: 'none', border: 'none', color: '#ffca28', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px' }}>
              {isEn ? 'Edit' : 'แก้ไข'}
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(place); }} style={{ background: 'none', border: 'none', color: '#ff4b4b', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', padding: '2px 4px' }}>
              {isEn ? 'Delete' : 'ลบ'}
            </button>
          )}
        </div>
      )}

      <img className="card-img" src={imageSrc} alt={displayTitle || 'Place image'} onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x250?text=Image+Not+Found'; }} loading="lazy" />
      
      {onLike && (
        <button type="button" className="card-like-btn" onClick={handleLikeClick} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#ff4b4b', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 15, transition: 'transform 0.1s ease', outline: 'none' }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>
           ❤️ {likesCount || 0}
        </button>
      )}
      
      <div className="card-content">
        <div className="card-title" style={{ fontFamily: 'Mitr, sans-serif' }}>
          {displayTitle || 'ไม่มีชื่อสถานที่'}
        </div>

        {displayDesc && (
          <p className="card-desc" style={{ fontSize: '0.85rem', color: '#555', marginTop: '6px', marginBottom: '8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {displayDesc}
          </p>
        )}
        
        <div className="card-meta" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="map-btn" style={{ fontSize: '0.85rem', color: '#00a854', fontWeight: 'bold', cursor: 'pointer' }}>
            {t('btn_map_view', isEn ? 'Details & Map' : 'ดูรายละเอียดและแผนที่')}
          </span>

          <span style={{ background: isAddedToPlan ? '#ff6b6b' : '#00a854', color: '#fff', padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold', opacity: 0.8, display: 'inline-flex', alignItems: 'center', gap: '4px', pointerEvents: 'none', userSelect: 'none', boxShadow: isAddedToPlan ? 'none' : '0 2px 10px rgba(0,168,84,0.3)' }}>
            {isAddedToPlan ? (isEn ? 'Added' : 'เพิ่มแล้ว') : (isEn ? 'Add' : 'เพิ่ม')}
          </span>
        </div>
      </div>
    </div>
  );
}