// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';
import watKaoprickImg from '../assets/watkaoprick.jpg'; 

// เพิ่ม props likes และ onLike เข้ามาเพื่อให้ระบบทำงานร่วมกับ App.jsx ได้สมบูรณ์
export default function Home({ onOpenMap, likes = {}, onLike }) {
  const [keyword, setKeyword] = useState('');

  // Fade-up on scroll using IntersectionObserver 
  useEffect(() => {
    const rows = document.querySelectorAll('.info-row');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

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
          <h1>เที่ยวชุมชน คลองไผ่</h1><br></br>
          
          {/* ปรับกล่องเสิร์ชให้มีโครงสร้างสวยงามและจัดกึ่งกลาง */}
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
      
      {/* แผงแสดงผลลัพธ์การเสิร์ช (ควบคุมการสไลด์ขึ้นลงแบบนุ่มนวลผ่าน CSS) */}
      <div className={`search-panel-bottom ${keyword.trim() !== '' ? 'lift-up' : 'hidden-panel'}`}>
        <h2 className="panel-title">
          {keyword.trim() !== '' && ` ผลการค้นหาสำหรับ "${keyword}" (${filteredPlaces.length} รายการ)`}
        </h2>
        
        <div className="results-grid">
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map(place => (
              <Card 
                key={place.id} 
                place={place} 
                onOpenMap={onOpenMap} 
                likesCount={likes[place.id] || 0}
                onLike={onLike}
              />
            ))
          ) : (
            <div className="no-result">
              <h3> ไม่พบชื่อสถานที่ที่คุณค้นหา</h3>
              <p style={{ marginTop: '5px' }}>ลองพิมพ์ค้นหาด้วยชื่ออื่น</p>
            </div>
          )}
        </div>
      </div>

      {/* ส่วนเนื้อหาสลับซ้ายขวา */}
      <section className="info-sections">
        <div className="info-row">
          <div className="info-img">
            <div className="placeholder-img"></div>
          </div>
          <div className="info-text">
            <h2>ชุมชนคลองไผ่คืออะไร?</h2>  
            <p>
              ชุมชนคลองไผ่เป็นชุมชนท่องเที่ยวเชิงนิเวศที่มีความโดดเด่นด้านวัฒนธรรมท้องถิ่น 
              ธรรมชาติที่สวยงาม และการต้อนรับที่อบอุ่น ตั้งอยู่ในพื้นที่อำเภอสีคิ้ว จังหวัดนครราชสีมา 
              เป็นแหล่งท่องเที่ยวที่เหมาะสำหรับผู้ที่ต้องการพักผ่อนหย่อนใจ เรียนรู้วิถีชีวิตท้องถิ่น 
              และสัมผัสกับธรรมชาติที่บริสุทธิ์
            </p>
          </div>
        </div>

        <div className="info-row reverse">
          <div className="info-img">
            <div className="placeholder-img"></div>
          </div>
          <div className="info-text">
            <h2>สถานที่น่าสนใจ</h2>
            <p>
              ภายในชุมชนคลองไผ่มีสถานที่ท่องเที่ยวที่น่าสนใจมากมาย ทั้งวัดเขาพริก จุดชมวิวเขื่อนลั่น 
              ศูนย์อนุรักษ์พันธุกรรมพืช และกิจกรรม SUP Board ล่องแม่น้ำบรรพกาล (ลำตะคอง) 
              นอกจากนี้ยังมีร้านอาหารและที่พักที่พร้อมให้บริการนักท่องเที่ยวอย่างเต็มรูปแบบ
            </p>
          </div>
        </div>

        <div className="info-row">
          <div className="info-img">
            <div className="placeholder-img"></div>
          </div>
          <div className="info-text">
            <h2>กิจกรรมท่องเที่ยว</h2>
            <p>
              เที่ยวชมวัดวาอาราม ชมธรรมชาติ เดินป่าพิชิตยอดเขา ล่องแพ SUP Board 
              ถ่ายรูปจุดชมวิว ชิมอาหารท้องถิ่น และพักผ่อนในโฮมสเตย์ที่อบอุ่น 
              ทุกกิจกรรมได้รับการออกแบบให้เหมาะสมกับนักท่องเที่ยวทุกวัย 
              พร้อมมัคคุเทศก์ท้องถิ่นที่มีประสบการณ์คอยอำนวยความสะดวก
            </p>
          </div>
        </div>
      </section>

      
    </div>
  );
}