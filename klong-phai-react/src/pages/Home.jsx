// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import SwipeCard from '../components/SwipeCard';
import MarqueeBanner from '../components/MarqueeBanner';
import watKaoprickImg from '../assets/watkaoprick.jpg';
import cook_n_coff from '../assets/cook_n_coff.jpg';
import cook_n_coff_view from '../assets/cook_n_coff_view.jpg';
import cook_n_coff_view2 from '../assets/cook_n_coff_view2.jpg';
import Rpsg_Sut from '../assets/Rpsg_Sut.jpg';
export default function Home({ 
  places = [],        
  loading = false,    
  onOpenMap, 
  likes = {}, 
  onLike, 
  lang,
  isAdmin = false,
  onEditPlace,
  onDeletePlace,
  selectedPlaces = [],          
  setSelectedPlaces,            
  onAddToPlan                   
}) {
  const { t, i18n } = useTranslation();
  const [keyword, setKeyword] = useState('');

  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  // ===== State สำหรับ Slider แต่ละอัน =====
  const [slider1, setSlider1] = useState(0);
  const [slider2, setSlider2] = useState(0);
  const [slider3, setSlider3] = useState(0);

  // ===== Auto-Slide แต่ละอันแยกกัน =====
  useEffect(() => {
    const interval1 = setInterval(() => {
      setSlider1(prev => (prev + 1) % 3);
    }, 5000);

    const interval2 = setInterval(() => {
      setSlider2(prev => (prev + 1) % 3);
    }, 5000);

    const interval3 = setInterval(() => {
      setSlider3(prev => (prev + 1) % 3);
    }, 5000);

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
      clearInterval(interval3);
    };
  }, []);

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

  // ===== Swipe Functions =====
  const handleSwipeRightAdd = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      setSelectedPlaces(prev => {
        const exists = prev.some(p => (p.id || p.docId) === placeId);
        if (!exists) {
          if (onAddToPlan) onAddToPlan(place);
          return [...prev, place];
        }
        return prev;
      });
    }
  };

  const handleSwipeLeftRemove = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      setSelectedPlaces(prev => prev.filter(p => (p.id || p.docId) !== placeId));
      if (onAddToPlan) onAddToPlan(place);
    }
  };

  const handleToggleAddToPlan = (place) => {
    const placeId = place.id || place.docId;
    const exists = selectedPlaces.some(p => (p.id || p.docId) === placeId);

    if (exists) {
      handleSwipeLeftRemove(place);
    } else {
      handleSwipeRightAdd(place);
    }
  };
  
  const formattedPlaces = (places || []).map(p => {
    const id = p.id || p.docId;
    return {
      id: id,
      docId: p.docId || p.id,
      name: p.title || p.name || '',
      nameEn: p.title_en || p.nameEn || '',
      description: p.description || '',
      descriptionEn: p.description_en || p.descriptionEn || '',
      detail: p.detailDescription || p.detail || p.description || '',
      detailEn: p.detailDescription_en || p.detailEn || p.description_en || '',
      img: p.img,
      mapUrl: p.mapUrl,
      workingHours: p.workingHours,
      phone: p.phone,
      category: p.category,
      coords: p.coords,
      lat: p.lat,
      lng: p.lng
    };
  });

  const filteredPlaces = formattedPlaces.filter(place => {
    const searchKey = keyword.trim().toLowerCase();
    if (!searchKey) return true;
    const thName = (place.name || '').toLowerCase();
    const enName = (place.nameEn || '').toLowerCase();
    return thName.includes(searchKey) || enName.includes(searchKey);
  });

  return (
    <div className="home-page-wrapper">
      {/* ===== HERO SECTION ===== */}
      <div className="hero-section">
        <img 
          src={watKaoprickImg} 
          alt={t('hero_alt', 'วัดเขาพริก')} 
          className="hero-bg-img"
        />

        <div className="search-container-inside">
          <h1 className="gradient-text">
            {t('hero_title', 'เที่ยวในเทศบาลตำบล คลองไผ่')}
          </h1>
          <br />
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

      {/* ===== MARQUEE BANNER ===== */}
      <MarqueeBanner />

      {/* ===== SEARCH RESULTS PANEL ===== */}
      <div className={`search-panel-bottom ${keyword.trim() !== '' ? 'lift-up' : 'hidden-panel'}`}>
        <h2 className="panel-title">
          {keyword.trim() !== '' && (
            isEn 
              ? `Search results for "${keyword}" (${filteredPlaces.length} items)`
              : `ผลการค้นหาสำหรับ "${keyword}" (${filteredPlaces.length} รายการ)`
          )}
        </h2>
        
        {loading ? (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '25px'
          }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ 
                background: '#1e1e1e', 
                borderRadius: '12px', 
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div className="skeleton skeleton-image" />
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" style={{ width: '90%' }} />
                <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="results-grid">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map(place => {
                const placeId = place.id || place.docId;
                const isAdded = selectedPlaces.some(p => (p.id || p.docId) === placeId);

                return (
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
                      onAddToPlan={() => handleToggleAddToPlan(place)}
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

      {/* ===== INFO SECTIONS ===== */}
      <section className="info-sections">
        {/* Slider 1 */}
        <div className="info-row">
          <div className="info-img">
            <div className="image-slider">
              <img 
                src={cook_n_coff} 
                alt="ชุมชนคลองไผ่"
                className={`slide-image ${slider1 === 0 ? 'active' : ''}`}
              />
              <img 
                src={cook_n_coff_view} 
                alt="ธรรมชาติคลองไผ่"
                className={`slide-image ${slider1 === 1 ? 'active' : ''}`}
              />
              <img 
                src={cook_n_coff_view2} 
                alt="วิวคลองไผ่"
                className={`slide-image ${slider1 === 2 ? 'active' : ''}`}
              />
              <div className="slider-dots">
                <span className={`dot ${slider1 === 0 ? 'active' : ''}`} onClick={() => setSlider1(0)}></span>
                <span className={`dot ${slider1 === 1 ? 'active' : ''}`} onClick={() => setSlider1(1)}></span>
                <span className={`dot ${slider1 === 2 ? 'active' : ''}`} onClick={() => setSlider1(2)}></span>
              </div>
            </div>
          </div>
          <div className="info-text">
            <h2>ชุมชนคลองไผ่คืออะไร?</h2>  
            <p>
              ชุมชนคลองไผ่เป็นชุมชนท่องเที่ยวเชิงนิเวศที่มีความโดดเด่นด้านวัฒนธรรมท้องถิ่น ธรรมชาติที่สวยงาม และการต้อนรับที่อบอุ่น ตั้งอยู่ในพื้นที่อำเภอสีคิ้ว จังหวัดนครราชสีมา เป็นแหล่งท่องเที่ยวที่เหมาะสำหรับผู้ที่ต้องการพักผ่อนหย่อนใจ เรียนรู้วิถีชีวิตท้องถิ่น และสัมผัสกับธรรมชาติที่บริสุทธิ์
            </p>
          </div>
        </div>

        {/* Slider 2 */}
        <div className="info-row reverse">
          <div className="info-img">
            <div className="image-slider">
              <img 
                src={Rpsg_Sut} 
                alt="สถานที่น่าสนใจ"
                className={`slide-image ${slider2 === 0 ? 'active' : ''}`}
              />
              <img 
                src="https://images.unsplash.com/photo-1470071459604-7b8ec44ffd1b?w=600&h=400&fit=crop" 
                alt="ธรรมชาติ"
                className={`slide-image ${slider2 === 1 ? 'active' : ''}`}
              />
              <img 
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop" 
                alt="วิวเขา"
                className={`slide-image ${slider2 === 2 ? 'active' : ''}`}
              />
              <div className="slider-dots">
                <span className={`dot ${slider2 === 0 ? 'active' : ''}`} onClick={() => setSlider2(0)}></span>
                <span className={`dot ${slider2 === 1 ? 'active' : ''}`} onClick={() => setSlider2(1)}></span>
                <span className={`dot ${slider2 === 2 ? 'active' : ''}`} onClick={() => setSlider2(2)}></span>
              </div>
            </div>
          </div>
          <div className="info-text">
            <h2>สถานที่น่าสนใจ</h2>
            <p>
              ภายในชุมชนคลองไผ่มีสถานที่ท่องเที่ยวที่น่าสนใจมากมาย ทั้งวัดเขาพริก จุดชมวิวเขื่อนลำตะคอง ศูนย์อนุรักษ์พันธุกรรมพืช และกิจกรรม SUP Board ล่องแม่น้ำบรรพกาล (ลำตะคอง) นอกจากนี้ยังมีร้านอาหารและที่พักที่พร้อมให้บริการนักท่องเที่ยวอย่างเต็มรูปแบบ
            </p>
          </div>
        </div>

        {/* Slider 3 */}
        <div className="info-row">
          <div className="info-img">
            <div className="image-slider">
              <img 
                src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop" 
                alt="กิจกรรมท่องเที่ยว"
                className={`slide-image ${slider3 === 0 ? 'active' : ''}`}
              />
              <img 
                src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop" 
                alt="กิจกรรมกลางแจ้ง"
                className={`slide-image ${slider3 === 1 ? 'active' : ''}`}
              />
              <img 
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop" 
                alt="วิวทะเล"
                className={`slide-image ${slider3 === 2 ? 'active' : ''}`}
              />
              <div className="slider-dots">
                <span className={`dot ${slider3 === 0 ? 'active' : ''}`} onClick={() => setSlider3(0)}></span>
                <span className={`dot ${slider3 === 1 ? 'active' : ''}`} onClick={() => setSlider3(1)}></span>
                <span className={`dot ${slider3 === 2 ? 'active' : ''}`} onClick={() => setSlider3(2)}></span>
              </div>
            </div>
          </div>
          <div className="info-text">
            <h2>กิจกรรมท่องเที่ยว</h2>
            <p>
              เที่ยวชมวัดวาอาราม ชมธรรมชาติ เดินป่าพิชิตยอดเขา ล่องแพ SUP Board ถ่ายรูปจุดชมวิว ชิมอาหารท้องถิ่น และพักผ่อนในโฮมสเตย์ที่อบอุ่น ทุกกิจกรรมได้รับการออกแบบให้เหมาะสมกับนักท่องเที่ยวทุกวัย พร้อมมัคคุเทศก์ท้องถิ่นที่มีประสบการณ์คอยอำนวยความสะดวก
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}