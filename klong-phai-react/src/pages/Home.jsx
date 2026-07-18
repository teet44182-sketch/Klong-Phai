// src/pages/Home.jsx
import React, { useState } from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';
import watKaoprickImg from '../assets/watkaoprick.jpg'; 

export default function Home({ onOpenMap, likes = {}, onLike }) {
  const [keyword, setKeyword] = useState('');

  return (
    <div className="home-page-wrapper">
      <div className="hero-section">
        <img src={watKaoprickImg} alt="วัดเขาพริก" className="hero-bg-img" />

        <div className="search-container-inside">
          <h1>เที่ยวชุมชน คลองไผ่</h1>
          
          {/* ปรับเหลือเฉพาะกล่องเสิร์ชอันเดียวตรงกลาง */}
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div className="search-box" style={{ margin: 0 }}>
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="ค้นหาสถานที่ท่องเที่ยว..." 
              />
            </div>
          </div>
        </div>
      </div>

      {/* แผงแสดงผลลัพธ์การเสิร์ชเฉพาะตามคีย์เวิร์ด (หากพิมพ์ค้นหาในหน้าแรก) */}
      {keyword.trim() !== '' && (
        <div className="search-panel-bottom lift-up">
          <h2 className="panel-title">🔍 ผลการค้นหาสำหรับ "{keyword}"</h2>
          <div className="results-grid">
            {placesDatabase
              .filter(p => p.title.toLowerCase().includes(keyword.toLowerCase()))
              .map(place => (
                <Card 
                  key={place.id} 
                  place={place} 
                  onOpenMap={onOpenMap} 
                  likesCount={likes[place.id] || 0}
                  onLike={onLike}
                />
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}