// src/pages/Home.jsx
import React, { useState } from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';

export default function Home({ onOpenMap }) {
  const [keyword, setKeyword] = useState('');

  // กรองข้อมูล: ถ้าไม่มีคำค้นหาให้โชว์แค่ 3 แถวแรกเป็นคำแนะนำเริ่มต้น แต่ถ้าพิมพ์เสิร์ชให้ฟิลเตอร์หาชื่อที่ตรงกัน
  const filteredPlaces = keyword.trim() === '' 
    ? placesDatabase.slice(0, 3) 
    : placesDatabase.filter(place => place.title.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <>
      <div className="hero-section"></div>

      <div className="search-container-fixed">
        <h1>เที่ยวชุมชน คลองไผ่</h1>
        <div className="search-box">
          <input 
            type="text" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาสถานที่ท่องเที่ยว..." 
          />
        </div>
      </div>

      {/* แถบแผงรายการด้านล่าง จะยกตัวขึ้น (lift-up) อัตโนมัติเมื่อมีการพิมพ์เสิร์ช */}
      <div className={`search-panel-bottom ${keyword.trim() !== '' ? 'lift-up' : ''}`}>
        <h2 className="panel-title">
          {keyword.trim() === '' ? 'แนะนำสถานที่ท่องเที่ยว ✨' : `🔍 ผลการค้นหาสำหรับ "${keyword}" (${filteredPlaces.length} รายการ)`}
        </h2>
        
        <div className="results-grid">
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map(place => (
              <Card key={place.id} place={place} onOpenMap={onOpenMap} />
            ))
          ) : (
            <div className="no-result">
              <h3>❌ ไม่พบชื่อสถานที่ที่คุณค้นหา</h3>
              <p style={{ marginTop: '5px' }}>ลองพิมพ์ค้นหาด้วยชื่ออื่น</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}