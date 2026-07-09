// src/pages/Accommodation.jsx
import React from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';

export default function Accommodation({ onOpenMap }) {
  // กรองเอาเฉพาะข้อมูลที่เป็นที่พักจากฐานข้อมูลกลาง
  const accommodations = placesDatabase.filter(place => place.type === 'accommodation');

  return (
    // เปลี่ยนมาใช้คลาสสำหรับหน้าเพจย่อยเพื่อจัดการ Padding และจัดตำแหน่ง
    <div className="page-container">
      {/* ใช้คลาสหัวข้อเพจย่อยที่กำหนดฟอนต์ Mitr และโทนสีที่สวยงามไว้แล้ว */}
      <h2 className="page-title">🏨 แนะนำที่พัก คลองไผ่</h2>
      
      {/* แสดงผลการ์ดที่พักในรูปแบบ Grid ตามที่กำหนดไว้ใน CSS */}
      <div className="results-grid">
        {accommodations.map(place => (
          <Card key={place.id} place={place} onOpenMap={onOpenMap} />
        ))}
      </div>
    </div>
  );
}