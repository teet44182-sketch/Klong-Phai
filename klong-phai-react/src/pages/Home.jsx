// src/pages/Home.jsx
import React, { useState } from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';
import watKaoprickImg from '../assets/watkaoprick.jpg'; 

export default function Home({ onOpenMap }) {
  const [keyword, setKeyword] = useState('');

  const filteredPlaces = placesDatabase.filter(place => 
    place.title.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div className="home-page-wrapper">
      <div className="hero-section">
        <img 
          src={watKaoprickImg} 
          alt="วัดเขาพริก" 
          className="hero-bg-img"
        />

        <div className="search-container-inside">
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
      </div>

      {/* แผงแสดงผลลัพธ์การเสิร์ช (ควบคุมการสไลด์ขึ้นลงแบบนุ่มนวลผ่าน CSS) */}
      <div className={`search-panel-bottom ${keyword.trim() !== '' ? 'lift-up' : 'hidden-panel'}`}>
        <h2 className="panel-title">
          {keyword.trim() !== '' && `🔍 ผลการค้นหาสำหรับ "${keyword}" (${filteredPlaces.length} รายการ)`}
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
    </div>
  );
}