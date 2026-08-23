// src/pages/Home.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
import natureIcon from '../assets/location.png';
import localHistoryIcon from '../assets/local-history.png';
import foodIcon from '../assets/destination.png';
import activitiesIcon from '../assets/jogging.png';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop';

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
  const currentLang = lang || (i18n.language || 'th').startsWith('th') ? 'th' : 'en';
  const isEn = currentLang === 'en';

  const [slider1, setSlider1] = useState(0);
  const [slider2, setSlider2] = useState(0);
  const [slider3, setSlider3] = useState(0);

  useEffect(() => {
    const intervals = [
      setInterval(() => setSlider1(prev => (prev + 1) % 3), 5000),
      setInterval(() => setSlider2(prev => (prev + 1) % 3), 5000),
      setInterval(() => setSlider3(prev => (prev + 1) % 3), 5000),
    ];
    return () => intervals.forEach(clearInterval);
  }, []);

  useEffect(() => {
    const rows = document.querySelectorAll('.info-row');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('visible', entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  // Feature data
  const features = [
    { id: 1, icon: natureIcon, alt: 'ธรรมชาติ', title: t('feature_1_title', 'แนะนำสถานที่'), desc: t('feature_1_desc', 'รวมจุดน่าเที่ยวและสถานที่น่าสนใจในคลองไผ่'), link: '/attractions' },
    { id: 2, icon: localHistoryIcon, alt: 'วัฒนธรรม', title: t('feature_2_title', 'แผนที่ชุมชน'), desc: t('feature_2_desc', 'สำรวจสถานที่น่าสนใจรอบคลองไผ่ พร้อมข้อมูลการเดินทาง'), link: '/map' },
    { id: 3, icon: foodIcon, alt: 'อาหาร', title: t('feature_3_title', 'วางแผนการเดินทาง'), desc: t('feature_3_desc', 'เลือกสถานที่ที่สนใจ จัดแผนการเดินทางได้ง่าย ๆ'), link: '/planner' },
    { id: 4, icon: activitiesIcon, alt: 'กิจกรรม', title: t('feature_4_title', 'กิจกรรมน่าสนใจ'), desc: t('feature_4_desc', 'หลากหลายกิจกรรม ทั้งเดินเขา ล่องเรือ SUP และเรียนรู้ภูมิปัญญาท้องถิ่น'), link: '/checkin' }
  ];

  // Slider images
  const sliderImages = [
    { id: 1, images: [Rpsg_Sut, cook_and_cof, kpick], alts: ['alt_attractions_1', 'alt_attractions_2', 'alt_attractions_3'], active: slider2 },
    { id: 2, images: [cook_n_coff, cook_n_coff_view, cook_n_coff_view2], alts: ['alt_about_1', 'alt_about_2', 'alt_about_3'], active: slider1 },
    { id: 3, images: [kat, char, ggk], alts: ['alt_activities_1', 'alt_activities_2', 'alt_activities_3'], active: slider3 }
  ];

  const getSlider = (slider) => {
    const { images, alts, active } = slider;
    return (
      <div className="image-slider">
        {images.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={t(alts[idx])}
            className={`slide-image ${active === idx ? 'active' : ''}`}
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          />
        ))}
        <div className="slider-dots">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${active === idx ? 'active' : ''}`}
              onClick={() => {
                if (slider.id === 1) setSlider2(idx);
                else if (slider.id === 2) setSlider1(idx);
                else setSlider3(idx);
              }}
            />
          ))}
        </div>
      </div>
    );
  };

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
        backgroundColor: '#1a1a1a',
      }}>
        <img
          src={watKaoprickImg}
          alt={t('hero_alt', 'วัดเขาพริก')}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(1.2)',
            transform: 'scale(1.05)',
            zIndex: 1,
          }}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&fit=crop'; }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0) 100%)',
          zIndex: 2,
        }} />
        <div style={{
          position: 'relative',
          zIndex: 3,
          padding: '80px 60px 100px 60px',
          maxWidth: '720px',
          width: '100%',
          textAlign: 'left',
        }}>
          <h1 style={{
            fontSize: isEn ? '4.5rem' : '4rem',
            fontWeight: '700',
            color: '#ffffff',
            marginBottom: '8px',
            fontFamily: 'Mitr, sans-serif',
            textShadow: '0 4px 30px rgba(0,0,0,0.5)',
            lineHeight: '1.1',
          }}>
            {t('hero_title', 'เที่ยวคลองไผ่')}
          </h1>
          <p style={{
            fontSize: isEn ? '1.6rem' : '1.5rem',
            color: '#00e87a',
            fontWeight: '500',
            marginBottom: '12px',
            fontFamily: 'Mitr, sans-serif',
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            {t('hero_subtitle', 'ชวนมาเที่ยว มาพัก มาสัมผัสธรรมชาติ')}
          </p>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: '40px',
            fontFamily: 'Prompt, sans-serif',
            maxWidth: '500px',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            lineHeight: '1.7',
          }}>
            {t('hero_description', 'ออกเดินทางมาสัมผัสธรรมชาติ สนุกกับกิจกรรม และพักผ่อนท่ามกลางบรรยากาศดี ๆ ที่คลองไผ่')}
          </p>
          <Link
            to="/attractions"
            className="explore-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 40px',
              background: 'linear-gradient(135deg, #00a854, #008743)',
              color: '#fff',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: '600',
              fontFamily: 'Mitr, sans-serif',
              textDecoration: 'none',
              boxShadow: '0 8px 30px rgba(0,168,84,0.4)',
              transition: 'all 0.3s ease',
              border: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            {t('hero_button', 'สำรวจคลองไผ่')} →
          </Link>
        </div>
        {/* Scroll indicator */}
        <div
          style={{
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
            opacity: 0.7,
          }}
          onClick={() => {
            document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span style={{ color: '#fff', fontSize: '0.85rem', fontFamily: 'Prompt, sans-serif', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {t('hero_more_info', 'ข้อมูลเพิ่มเติม')}
          </span>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5" />
            <path d="M7 7l5 5 5-5" />
          </svg>
        </div>
      </div>

      {/* ===== FEATURE CARDS SECTION ===== */}
      <section className="features-section" style={{ padding: '70px 20px 50px' }}>
        <div className="features-container" style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="features-title" style={{ fontFamily: 'Mitr, sans-serif', fontSize: '2.2rem', color: '#fff', marginBottom: '8px' }}>
            {t('features_title', 'ค้นพบคลองไผ่')}
          </h2>
          <p className="features-subtitle" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '48px' }}>
            {t('features_subtitle', 'ทุกสิ่งที่คุณต้องรู้ก่อนไปเที่ยวคลองไผ่')}
          </p>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {features.map((feature) => (
              <Link key={feature.id} to={feature.link} style={{ textDecoration: 'none' }}>
                <div className="feature-card" style={{
                  background: 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '100%',
                }}>
                  <img src={feature.icon} alt={feature.alt} className="feature-icon-img" style={{ width: '56px', height: '56px', marginBottom: '16px', filter: 'brightness(0) invert(1)' }} />
                  <h3 className="feature-card-title" style={{ fontFamily: 'Mitr, sans-serif', color: '#00e87a', fontSize: '1.1rem', marginBottom: '10px' }}>
                    {feature.title}
                  </h3>
                  <p className="feature-card-desc" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    {feature.desc}
                  </p>
                  <div style={{ marginTop: '16px', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontFamily: 'Prompt, sans-serif' }}>
                    {isEn ? 'Explore →' : 'สำรวจ →'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INFO SECTIONS ===== */}
      <section className="info-sections" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 60px' }}>
        {/* Section 1: สถานที่น่าสนใจ */}
        <div className="info-row reverse" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '40px', padding: '50px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="info-img">{getSlider(sliderImages[0])}</div>
          <div className="info-text">
            <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#fff', fontSize: '1.6rem', marginBottom: '16px' }}>
              {t('attractions_section_title', 'สถานที่น่าสนใจ')}
            </h2>
            <p style={{ color: '#bbb', lineHeight: '1.8', fontSize: '0.95rem', textIndent: '1.5em' }}>
              {t('attractions_section_desc')}
            </p>
          </div>
        </div>

        {/* Section 2: ชุมชนคลองไผ่ */}
        <div className="info-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '40px', padding: '50px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="info-img">{getSlider(sliderImages[1])}</div>
          <div className="info-text">
            <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#fff', fontSize: '1.6rem', marginBottom: '16px' }}>
              {t('about_title', 'ชุมชนคลองไผ่คืออะไร?')}
            </h2>
            <p style={{ color: '#bbb', lineHeight: '1.8', fontSize: '0.95rem', textIndent: '1.5em' }}>
              {t('about_desc')}
            </p>
          </div>
        </div>

        {/* Section 3: กิจกรรมท่องเที่ยว */}
        <div className="info-row reverse" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '40px', padding: '50px 0' }}>
          <div className="info-img">{getSlider(sliderImages[2])}</div>
          <div className="info-text">
            <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#fff', fontSize: '1.6rem', marginBottom: '16px' }}>
              {t('activities_section_title', 'กิจกรรมท่องเที่ยว')}
            </h2>
            <p style={{ color: '#bbb', lineHeight: '1.8', fontSize: '0.95rem', textIndent: '1.5em' }}>
              {t('activities_section_desc')}
            </p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }
        .feature-card:hover {
          transform: translateY(-6px);
          background: rgba(255,255,255,0.15);
          border-color: rgba(0,168,84,0.3);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
        .feature-card:active {
          transform: scale(0.97);
        }
        .image-slider {
          position: relative;
          width: 100%;
          min-height: 280px;
          border-radius: 12px;
          overflow: hidden;
          background: #1a1a1a;
        }
        .slide-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.8s ease-in-out, transform 0.8s ease-in-out;
          transform: scale(1.05);
        }
        .slide-image.active {
          opacity: 1;
          transform: scale(1);
        }
        .slider-dots {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          z-index: 10;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid rgba(255,255,255,0.2);
        }
        .dot.active {
          background: #00a854;
          border-color: #00a854;
          box-shadow: 0 0 12px rgba(0,168,84,0.5);
          transform: scale(1.2);
        }
        @media (max-width: 768px) {
          .info-row, .info-row.reverse {
            grid-template-columns: 1fr !important;
            direction: ltr !important;
          }
          .info-img { padding: 0; }
          .info-text { padding: 0; border-left: none !important; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-section h1 { font-size: 2.8rem !important; }
          .hero-section p { font-size: 1.2rem !important; }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-section { padding: 40px 20px !important; }
        }
      `}</style>
    </div>
  );
}