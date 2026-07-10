// src/components/Card.jsx
import React from 'react';

export default function Card({ place, onOpenMap }) {
  return (
    /* 🎯 จุดตายสำคัญ: ต้องเปลี่ยนมาใช้คลาส "card card-interactive" เท่านั้น 
       เพื่อให้ CSS ใน App.css รู้จักและสั่งเด้งดึ๋งเวลา Hover และ ยุบตัวเวลาคลิก (Active) ได้อย่างสมบูรณ์ */
    <div 
      className="card card-interactive" 
      onClick={() => onOpenMap(place)}
    >
      
      {/* ส่วนแสดงรูปภาพสถานที่ */}
      <img className="card-img" src={place.img} alt={place.title} />
      
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