// src/pages/Home.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom'; // ✅ เพิ่ม import Link
import Card from '../components/Card';
import SwipeCard from '../components/SwipeCard';
import watKaoprickImg from '../assets/watkaoprick.jpg';
import cook_n_coff from '../assets/cook_n_coff.jpg';
import cook_n_coff_view from '../assets/cook_n_coff_view.jpg';
import cook_n_coff_view2 from '../assets/cook_n_coff_view2.jpg';
import Rpsg_Sut from '../assets/Rpsg_Sut.jpg';
import cook_and_cof from '../assets/cook_and_cof.jpg';
import kpick from '../assets/kpick.jpg';
import char from '../assets/char.jpg';
import kat from '../assets/kat.jpg';
import ggk from '../assets/ggk.jpg';

// ✅ Import รูปภาพจาก assets
import natureIcon from '../assets/location.png';
import localHistoryIcon from '../assets/local-history.png';
import foodIcon from '../assets/destination.png';
import activitiesIcon from '../assets/jogging.png';

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

  const [slider1, setSlider1] = useState(0);
  const [slider2, setSlider2] = useState(0);
  const [slider3, setSlider3] = useState(0);

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

  // ✅ Feature data - เพิ่มลิงก์สำหรับแต่ละการ์ด
  const features = [
    {
      id: 1,
      icon: natureIcon,
      iconAlt: 'ธรรมชาติ',
      title: 'แนะนำสถานที่',
      desc: 'รวมจุดน่าเที่ยวและสถานที่น่าสนใจในคลองไผ่ ที่อยากชวนให้คุณออกไปสัมผัสด้วยตัวเอง',
      link: '/attractions'  // ✅ ลิงก์ไปหน้าสถานที่ท่องเที่ยว
    },
    {
      id: 2,
      icon: localHistoryIcon,
      iconAlt: 'วัฒนธรรม',
      title: 'แผนที่ชุมชน',
      desc: 'สำรวจสถานที่น่าสนใจรอบคลองไผ่ พร้อมข้อมูลสำหรับการเดินทาง',
      link: '/map'  // ✅ ลิงก์ไปแผนที่ชุมชน
    },
    {
      id: 3,
      icon: foodIcon,
      iconAlt: 'อาหาร',
      title: 'วางแผนการเดินทาง',
      desc: 'เลือกสถานที่ที่สนใจ แล้วจัดแผนการเดินทางของคุณได้ง่าย ๆ ในที่เดียว',
      link: '/planner'  // ✅ ลิงก์ไปวางแผนการเดินทาง
    },
    {
      id: 4,
      icon: activitiesIcon,
      iconAlt: 'กิจกรรม',
      title: 'กิจกรรมน่าสนใจ',
      desc: 'หลากหลายกิจกรรม ทั้งเดินเขา ล่องเรือ SUP และเรียนรู้ภูมิปัญญาท้องถิ่น',
      link: '/checkin'  // ✅ ลิงก์ไปหน้าสถานที่ท่องเที่ยว (หรือหน้าอื่น)
    }
  ];

  return (
    <div className="home-page-wrapper">

      {/* ===== HERO SECTION ===== */}
      <div className="hero-section" style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        marginTop: '0',
        backgroundColor: '#2b2b2b',
      }}>
        <img 
          src={watKaoprickImg} 
          alt={t('hero_alt')} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(0px) brightness(1.3)',
            transform: 'scale(1.05)',
            zIndex: 1,
          }}
        />

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 100%)',
          zIndex: 2,
        }} />

        <div style={{
          position: 'relative',
          zIndex: 3,
          padding: '100px 100px 120px 100px',
          maxWidth: '850px',
          width: '100%',
          textAlign: 'left',
        }}>
          <h1 style={{
            fontSize: isEn ? '5rem' : '4.5rem',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '10px',
            fontFamily: 'Mitr, sans-serif',
            textShadow: '0 4px 30px rgba(0,0,0,0.35)',
            lineHeight: '1.1',
            letterSpacing: '2px',
          }}>
            {t('hero_title')}
          </h1>

          <p style={{
            fontSize: isEn ? '1.8rem' : '1.7rem',
            color: '#00e87a',
            fontWeight: '500',
            marginBottom: '12px',
            fontFamily: 'Mitr, sans-serif',
            textShadow: '0 4px 30px rgba(0,0,0,0.25)',
            letterSpacing: '1px',
          }}>
            {t('hero_subtitle')}
          </p>

          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255,255,255,0.92)',
            marginBottom: '40px',
            fontFamily: 'Prompt, sans-serif',
            maxWidth: '580px',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            lineHeight: '1.7',
            letterSpacing: '0.5px',
          }}>
            {t('hero_description')}
          </p>

          <a 
            href="/attractions" 
            className="explore-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #00a854, #008743)',
              color: '#fff',
              borderRadius: '50px',
              fontSize: '1.2rem',
              fontWeight: '600',
              fontFamily: 'Mitr, sans-serif',
              textDecoration: 'none',
              boxShadow: '0 8px 30px rgba(0, 168, 84, 0.4)',
              transition: 'all 0.3s ease',
              border: '2px solid rgba(255,255,255,0.1)',
              letterSpacing: '1px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 45px rgba(0, 168, 84, 0.55)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #00c45e, #00a854)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 168, 84, 0.4)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #00a854, #008743)';
            }}
          >
            {t('hero_button')}
            <span style={{ fontSize: '1.6rem', lineHeight: '1' }}>→</span>
          </a>
        </div>

        {/* ลูกศรชี้ลง */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          animation: 'bounce 2s infinite',
          opacity: 0.8,
          transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onClick={() => {
          const nextSection = document.querySelector('.features-section');
          if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}>
          <span style={{
            color: 'rgba(255,255,255,1)',
            fontSize: '0.85rem',
            fontFamily: 'Prompt, sans-serif',
            letterSpacing: '1px',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}>
            {t('hero_more_info')}
          </span>
          
          <svg 
            width="30" 
            height="30" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="rgba(255,255,255,0.7)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
            }}
          >
            <path d="M7 13l5 5 5-5" />
            <path d="M7 7l5 5 5-5" />
          </svg>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateX(-50%) translateY(0);
            }
            40% {
              transform: translateX(-50%) translateY(-10px);
            }
            60% {
              transform: translateX(-50%) translateY(-5px);
            }
          }
        `}</style>
      </div>

      {/* ===== FEATURE CARDS SECTION ===== */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">
            {t('features_title')}
          </h2>
          <p className="features-subtitle">
            {t('features_subtitle')}
          </p>

          <div className="features-grid">
            {features.map((feature) => (
              <Link 
                key={feature.id} 
                to={feature.link} 
                style={{ textDecoration: 'none' }}
              >
                <div className="feature-card" style={{ cursor: 'pointer' }}>
                  <img 
                    src={feature.icon} 
                    alt={feature.iconAlt}
                    className="feature-icon-img"
                  />
                  <h3 className="feature-card-title">
                    {feature.title}
                  </h3>
                  <p className="feature-card-desc">
                    {feature.desc}
                  </p>
                  {/* ✅ เพิ่มลูกศรเล็กๆ บอกว่าคลิกได้ */}
                  <div style={{
                    marginTop: '16px',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.8rem',
                    fontFamily: 'Prompt, sans-serif',
                    transition: 'color 0.3s ease',
                  }}
                  className="feature-card-link-hint"
                  >
                    {isEn ? 'Explore →' : 'สำรวจ →'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INFO SECTIONS ===== */}
      <section className="info-sections">
        
        {/* ลำดับที่ 1: สถานที่น่าสนใจ */}
        <div className="info-row reverse">
          <div className="info-img">
            <div className="image-slider">
              <img 
                src={Rpsg_Sut} 
                alt={t('alt_attractions_1')}
                className={`slide-image ${slider2 === 0 ? 'active' : ''}`}
              />
              <img 
                src={cook_and_cof}
                alt={t('alt_attractions_2')}
                className={`slide-image ${slider2 === 1 ? 'active' : ''}`}
              />
              <img 
                src={kpick} 
                alt={t('alt_attractions_3')}
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
            <h2>{t('attractions_section_title')}</h2>
            <p>{t('attractions_section_desc')}</p>
          </div>
        </div>

        {/* ลำดับที่ 2: ชุมชนคลองไผ่คืออะไร? */}
        <div className="info-row">
          <div className="info-img">
            <div className="image-slider">
              <img 
                src={cook_n_coff} 
                alt={t('alt_about_1')}
                className={`slide-image ${slider1 === 0 ? 'active' : ''}`}
              />
              <img 
                src={cook_n_coff_view} 
                alt={t('alt_about_2')}
                className={`slide-image ${slider1 === 1 ? 'active' : ''}`}
              />
              <img 
                src={cook_n_coff_view2} 
                alt={t('alt_about_3')}
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
            <h2>{t('about_title')}</h2>  
            <p>{t('about_desc')}</p>
          </div>
        </div>

        {/* ลำดับที่ 3: กิจกรรมท่องเที่ยว */}
        <div className="info-row reverse">
          <div className="info-img">
            <div className="image-slider">
              <img 
                src={kat}
                alt={t('alt_activities_1')}
                className={`slide-image ${slider3 === 0 ? 'active' : ''}`}
              />
              <img 
                src={char} 
                alt={t('alt_activities_2')}
                className={`slide-image ${slider3 === 1 ? 'active' : ''}`}
              />
              <img 
                src={ggk} 
                alt={t('alt_activities_3')}
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
            <h2>{t('activities_section_title')}</h2>
            <p>{t('activities_section_desc')}</p>
          </div>
        </div>

      </section>  
    </div>
  );
}