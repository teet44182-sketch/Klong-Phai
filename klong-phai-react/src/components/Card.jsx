// src/components/Card.jsx
import React from 'react';

export default function Card({ place, onOpenMap, likesCount = 0, onLike }) {
  return (
    <div 
      className="card card-interactive" 
      onClick={() => onOpenMap(place)}
    >
      {/* ส่วนแสดงรูปภาพสถานที่ */}
      <img className="card-img" src={place.img} alt={place.title} />
      
      {/* 🎯 ปุ่มกดไลก์หัวใจ (มุมขวาบนของการ์ด) */}
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
          {place.title}
        </div>
        
        {/* บล็อกข้อมูลเพิ่มเติมสั้นๆ ด้านล่างการ์ด */}
        <div className="card-meta" style={{ marginTop: '10px' }}>
          <span className="map-btn" style={{ fontSize: '0.85rem', color: '#00a854' }}>
            🔍 ดูรายละเอียดและแผนที่
          </span>
        </div>
      </div>
    </div>
  );
}