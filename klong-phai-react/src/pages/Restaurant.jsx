// src/pages/Restaurant.jsx
import React from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';

export default function Restaurant({ onOpenMap }) {
  // กรองเอาเฉพาะข้อมูลที่เป็นร้านอาหารจากฐานข้อมูลกลาง[cite: 1]
  const restaurants = placesDatabase.filter(place => place.type === 'restaurant');

  return (
    // เปลี่ยนไปใช้คลาสระบบเพจย่อยที่ออกแบบไว้ใน CSS
    <div className="page-container">
      {/* ใช้คลาสหัวข้อเพจย่อยที่ตั้งฟอนต์ Mitr และสีเขียวไว้แล้ว */}
      <h2 className="page-title">🍴 แนะนำร้านอาหาร คลองไผ่</h2>
      
      {/* ใช้ระบบ Grid ในการจัดเรียงการ์ดสถานที่ */}
      <div className="results-grid">
        {restaurants.map(place => (
          <Card key={place.id} place={place} onOpenMap={onOpenMap} />
        ))}
      </div>
    </div>
  );
}