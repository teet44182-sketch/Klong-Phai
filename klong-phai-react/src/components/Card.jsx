// src/components/Card.jsx
import React from 'react';

export default function Card({ place, onOpenMap }) {
  return (
    <div className="card">
      <img className="card-img" src={place.img} alt={place.title} />
      <div className="card-content">
        <div className="card-title">{place.title}</div>
        <div className="card-meta">
          {/* เมื่อคลิกปุ่มจะส่งลิงก์แผนที่กลับไปให้ Modal เปิดแสดงผล */}
          <span className="map-btn" onClick={() => onOpenMap(place.mapUrl)}>
            📍 ดูแผนที่
          </span>
        </div>
      </div>
    </div>
  );
}