// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import SwipeCard from '../components/SwipeCard'; // 👈 นำเข้าคอมโพเนนต์ SwipeCard
import watKaoprickImg from '../assets/watkaoprick.jpg'; 

export default function Home({ 
  places = [],        // รับ places จาก Props
  loading = false,    // รับ loading จาก Props
  onOpenMap, 
  likes = {}, 
  onLike, 
  lang,
  isAdmin = false,
  onEditPlace,
  onDeletePlace,
  selectedPlaces = [],          // เพิ่ม Props สำหรับ Trip Planner
  setSelectedPlaces,            // ฟังก์ชันอัปเดตรายการในทริป
  onAddToPlan                   // หรือรับ handler มาโดยตรง
}) {
  const { t, i18n } = useTranslation();
  const [keyword, setKeyword] = useState('');

  // ภาษาปัจจุบัน ('th' หรือ 'en')
  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

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

 // 🟢 ปัดขวา = เพิ่มเข้าแผนทริป (เช็ค ID ให้ครอบคลุมทั้ง id และ docId)
  const handleSwipeRightAdd = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      const exists = selectedPlaces.some(p => {
        const pId = p.id || p.docId;
        return pId === placeId;
      });
      
      if (!exists) {
        setSelectedPlaces([...selectedPlaces, place]);
      }
    }
  };

  // 🔴 ปัดซ้าย = ลบออกจากแผนทริป
  const handleSwipeLeftRemove = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      setSelectedPlaces(selectedPlaces.filter(p => {
        const pId = p.id || p.docId;
        return pId !== placeId;
      }));
    }
  };

  const handleToggleAddToPlan = (place) => {
    const placeId = place.id || place.docId;
    const exists = selectedPlaces.some(p => {
      const pId = p.id || p.docId;
      return pId === placeId;
    });

    if (exists) {
      handleSwipeLeftRemove(place);
    } else {
      handleSwipeRightAdd(place);
    }
  };
  
  // แปลงโครงสร้างสถานที่จาก Firestore/Props ให้พร้อมสำหรับการค้นหาและการ์ดแสดงผล
  const formattedPlaces = (places || []).map(p => ({
    id: p.id || p.docId,
    docId: p.docId || p.id,
    name: p.title || p.name,
    nameEn: p.title_en || p.nameEn,
    description: p.description,
    descriptionEn: p.description_en || p.descriptionEn,
    detail: p.detailDescription || p.detail || p.description,
    detailEn: p.detailDescription_en || p.detailEn || p.description_en,
    img: p.img,
    mapUrl: p.mapUrl,
    workingHours: p.workingHours,
    phone: p.phone,
    category: p.category,
    coords: p.coords,
    lat: p.lat,
    lng: p.lng
  }));

  // ระบบค้นหา: ค้นหาได้ทั้งภาษาไทยและอังกฤษ
  const filteredPlaces = formattedPlaces.filter(place => {
    const thName = place.name || '';
    const enName = place.nameEn || '';
    const searchKey = keyword.toLowerCase();

    return thName.toLowerCase().includes(searchKey) ||
           enName.toLowerCase().includes(searchKey);
  });

  return (
    <div className="home-page-wrapper">
      <div className="hero-section">
        <img 
          src={watKaoprickImg} 
          alt={t('hero_alt', 'วัดเขาพริก')} 
          className="hero-bg-img"
        />

        <div className="search-container-inside">
          <h1>{t('hero_title', 'เที่ยวในเทศบาลตำบล คลองไผ่')}</h1><br />
          
          {/* ปรับกล่องเสิร์ชให้มีโครงสร้างสวยงามและจัดกึ่งกลาง */}
          <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div className="search-box" style={{ margin: 0 }}>
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t('search_placeholder', 'ค้นหาสถานที่ท่องเที่ยว...')} 
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* แผงแสดงผลลัพธ์การเสิร์ช */}
      <div className={`search-panel-bottom ${keyword.trim() !== '' ? 'lift-up' : 'hidden-panel'}`}>
        <h2 className="panel-title">
          {keyword.trim() !== '' && (
            isEn 
              ? `Search results for "${keyword}" (${filteredPlaces.length} items)`
              : `ผลการค้นหาสำหรับ "${keyword}" (${filteredPlaces.length} รายการ)`
          )}
        </h2>
        
        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '30px', fontFamily: 'Prompt, sans-serif' }}>
            {isEn ? 'Searching...' : 'กำลังค้นหาข้อมูล...'}
          </div>
        ) : (
          <div className="results-grid">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map(place => {
                const placeId = place.id || place.docId;
                // เช็คสถานะว่าสถานที่นี้ถูกเลือกไว้ในทริปหรือยัง
                const isAdded = selectedPlaces.some(p => (p.id || p.docId) === placeId);

                return (
                  // 🎴 ครอบด้วย SwipeCard เพื่อให้ปัดซ้าย-ขวาได้ทั้งคอมและมือถือ
                  <SwipeCard
                    key={placeId}
                    isAdded={isAdded}
                    onSwipeRight={() => handleSwipeRightAdd(place)}
                    onSwipeLeft={() => handleSwipeLeftRemove(place)}
                  >
                    <Card 
                      place={place} 
                      onOpenMap={onOpenMap} 
                      likesCount={likes[placeId] || 0}
                      onLike={onLike}
                      lang={currentLang}
                      isAdmin={isAdmin}
                      onEdit={onEditPlace}
                      onDelete={onDeletePlace}
                      onAddToPlan={handleToggleAddToPlan}
                      isAddedToPlan={isAdded}
                    />
                  </SwipeCard>
                );
              })
            ) : (
              <div className="no-result">
                <h3>{t('no_search_title', 'ไม่พบชื่อสถานที่ที่คุณค้นหา')}</h3>
                <p style={{ marginTop: '5px' }}>{t('no_search_desc', 'ลองพิมพ์ค้นหาด้วยชื่ออื่น')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ส่วนเนื้อหาสลับซ้ายขวา */}
      <section className="info-sections">
        <div className="info-row">
          <div className="info-img">
            <div className="placeholder-img"></div>
          </div>
          <div className="info-text">
            <h2>{t('about_title', 'ชุมชนคลองไผ่คืออะไร?')}</h2>  
            <p>
              {t('about_desc', 'ชุมชนคลองไผ่เป็นชุมชนท่องเที่ยวเชิงนิเวศที่มีความโดดเด่นด้านวัฒนธรรมท้องถิ่น ธรรมชาติที่สวยงาม และการต้อนรับที่อบอุ่น ตั้งอยู่ในพื้นที่อำเภอสีคิ้ว จังหวัดนครราชสีมา เป็นแหล่งท่องเที่ยวที่เหมาะสำหรับผู้ที่ต้องการพักผ่อนหย่อนใจ เรียนรู้วิถีชีวิตท้องถิ่น และสัมผัสกับธรรมชาติที่บริสุทธิ์')}
            </p>
          </div>
        </div>

        <div className="info-row reverse">
          <div className="info-img">
            <div className="placeholder-img"></div>
          </div>
          <div className="info-text">
            <h2>{t('attractions_title', 'สถานที่น่าสนใจ')}</h2>
            <p>
              {t('attractions_desc', 'ภายในชุมชนคลองไผ่มีสถานที่ท่องเที่ยวที่น่าสนใจมากมาย ทั้งวัดเขาพริก จุดชมวิวเขื่อนลำตะคอง ศูนย์อนุรักษ์พันธุกรรมพืช และกิจกรรม SUP Board ล่องแม่น้ำบรรพกาล (ลำตะคอง) นอกจากนี้ยังมีร้านอาหารและที่พักที่พร้อมให้บริการนักท่องเที่ยวอย่างเต็มรูปแบบ')}
            </p>
          </div>
        </div>

        <div className="info-row">
          <div className="info-img">
            <div className="placeholder-img"></div>
          </div>
          <div className="info-text">
            <h2>{t('activities_title', 'กิจกรรมท่องเที่ยว')}</h2>
            <p>
              {t('activities_desc', 'เที่ยวชมวัดวาอาราม ชมธรรมชาติ เดินป่าพิชิตยอดเขา ล่องแพ SUP Board ถ่ายรูปจุดชมวิว ชิมอาหารท้องถิ่น และพักผ่อนในโฮมสเตย์ที่อบอุ่น ทุกกิจกรรมได้รับการออกแบบให้เหมาะสมกับนักท่องเที่ยวทุกวัย พร้อมมัคคุเทศก์ท้องถิ่นที่มีประสบการณ์คอยอำนวยความสะดวก')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}