// src/components/Card.jsx
import React from 'react';

export default function Card({ place, onOpenMap }) {
  return (
    // 🎯 เมื่อกดที่ตัวการ์ด (รูปภาพ หรือพื้นที่การ์ด) จะส่งข้อมูลสถานที่กลับไปให้ App.jsx เปิดกล่อง Pop-up [cite: 8]
    <div className="card" onClick={() => onOpenMap(place)} style={{ cursor: 'pointer' }}>
      
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