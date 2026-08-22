// src/pages/CheckInPoints.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import SwipeCard from '../components/SwipeCard';
import { bannedWords } from '../utils/wordlist';
import { useToast } from '../context/ToastContext';
import checkin from '../assets/checkin.jpg';

import { db } from '../firebase';
import { 
  collection,
  addDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export default function CheckInPoints({ 
  places = [],
  loading = false,
  onOpenMap, 
  likes = {}, 
  onLike,
  googleUser,          
  handleGoogleLogin,   
  handleGoogleLogout,  
  reviewsData = {},
  lang,
  isAdmin = false,     
  onEditPlace,         
  onDeletePlace,
  selectedPlaces = [],
  setSelectedPlaces,
  onAddToPlan,
  searchKeyword = '',
  onSearchChange
}) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  
  const [keyword, setKeyword] = useState(searchKeyword || '');
  const [isVisible, setIsVisible] = useState(false);

  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  const [inputText, setInputText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const COOLDOWN_MS = 5000;

  const pageId = 'checkin_page'; 
  const pageReviews = reviewsData[pageId] || [];

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(keyword);
    }
  }, [keyword, onSearchChange]);

  const sanitizeInput = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/[<>]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/`/g, '&#96;')
      .replace(/\\/g, '&#92;')
      .trim();
  };

  const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const detectScriptInjection = (text) => {
    const patterns = [
      /<script/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /onclick\s*=/i,
      /onmouseover\s*=/i,
      /onfocus\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i,
      /alert\s*\(/i,
      /confirm\s*\(/i,
      /prompt\s*\(/i,
    ];
    return patterns.some(pattern => pattern.test(text));
  };

  const handleSwipeRightAdd = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      setSelectedPlaces(prev => {
        const safePrev = prev || [];
        const exists = safePrev.some(p => (p.id || p.docId) === placeId);
        if (!exists) {
          if (onAddToPlan) onAddToPlan(place);
          return [...safePrev, place];
        }
        return safePrev;
      });
    }
  };

  const handleSwipeLeftRemove = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      setSelectedPlaces(prev => (prev || []).filter(p => (p.id || p.docId) !== placeId));
      if (onAddToPlan) onAddToPlan(place);
    }
  };

  const handleToggleAddToPlan = (place) => {
    const placeId = place.id || place.docId;
    const safeSelected = selectedPlaces || [];
    const exists = safeSelected.some(p => (p.id || p.docId) === placeId);

    if (exists) {
      handleSwipeLeftRemove(place);
    } else {
      handleSwipeRightAdd(place);
    }
  };

  const mapPlaceData = (p) => {
    if (!p) return null;

    let lat = p.lat || p.latitude;
    let lng = p.lng || p.longitude;

    if (Array.isArray(p.coords) && p.coords.length >= 2) {
      lat = p.coords[0];
      lng = p.coords[1];
    }

    return {
      ...p,
      id: p.id || p.docId,
      docId: p.docId || p.id,
      name: p.title || p.name || p.placeName || 'ไม่มีชื่อสถานที่',
      nameEn: p.title_en || p.titleEn || p.nameEn || p.title || p.name,
      description: p.description || p.detail || '',
      descriptionEn: p.description_en || p.descriptionEn || p.description || '',
      detail: p.detailDescription || p.detail || p.description || '',
      detailEn: p.detailDescription_en || p.detailDescriptionEn || p.detailEn || p.description_en || '',
      img: p.img || p.imageUrl || p.image || '',
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      mapUrl: p.mapUrl || p.googleMap || p.map || '',
      workingHours: p.workingHours || p.time || '',
      workingHoursEn: p.workingHours_en || p.workingHoursEn || p.workingHours || '',
      phone: p.phone || '-',
      category: p.category || p.type || 'travel',
      coords: p.coords || null,
      lat: lat || null,
      lng: lng || null
    };
  };

  // ✅ กรอง places ที่เกี่ยวข้องกับ check-in (หรือทั้งหมด) และ map ข้อมูล
  const filteredPlaces = (places || [])
    .filter(p => {
      if (!p) return false;
      const cat = (p.category || p.type || '').toString().toLowerCase().trim();
      // อนุญาตทุกหมวดหมู่ที่เกี่ยวข้องกับการท่องเที่ยวหรือเช็คอิน
      const validCategories = ['checkin', 'check_in', 'check-in', 'attraction', 'tourist', 'travel', 'top10', ''];
      if (!p.category) return true;
      return validCategories.includes(cat);
    })
    .map(mapPlaceData)
    .filter(Boolean);

  const finalPlaces = filteredPlaces.length > 0 
    ? filteredPlaces 
    : (places || []).map(mapPlaceData).filter(Boolean);

  // ✅ ค้นหาตาม keyword
  const searchFilteredPlaces = finalPlaces.filter(place => {
    const searchKey = keyword.trim().toLowerCase();
    if (!searchKey) return true;
    const name = (place.name || '').toLowerCase();
    const nameEn = (place.nameEn || '').toLowerCase();
    const desc = (place.description || '').toLowerCase();
    const descEn = (place.descriptionEn || '').toLowerCase();
    return name.includes(searchKey) || nameEn.includes(searchKey) || 
           desc.includes(searchKey) || descEn.includes(searchKey);
  });

  const validateReviewText = (text) => {
    const cleanText = sanitizeInput(text);
    
    if (cleanText.length < 2) {
      showToast(isEn ? " Review is too short (min 2 characters)" : "ข้อความสั้นเกินไป (ขั้นต่ำ 2 ตัวอักษร)");
      return false;
    }
    if (cleanText.length > 200) {
      showToast(isEn ? "Review is too long (max 200 characters)" : "ข้อความต้องไม่เกิน 200 ตัวอักษร");
      return false;
    }
    
    const textLower = cleanText.toLowerCase();
    const hasBannedWord = bannedWords.some(word => textLower.includes(word.toLowerCase()));
    if (hasBannedWord) {
      showToast(isEn ? "Inappropriate language detected" : "พบคำไม่เหมาะสม กรุณาแก้ไข");
      return false;
    }
    
    if (detectScriptInjection(cleanText)) {
      showToast(isEn ? "Invalid characters detected" : "พบอักขระที่ไม่ถูกต้อง");
      return false;
    }
    
    return cleanText;
  };

  // ✅ เรียงตามไลค์ (สำหรับ Top 10)
  const sortedPlaces = [...searchFilteredPlaces].sort((a, b) => {
    const scoreA = likes[a.id || a.docId] || 0;
    const scoreB = likes[b.id || b.docId] || 0;
    return scoreB - scoreA;
  });

  const getTranslatedPlace = (place) => {
    if (!isEn) return place;
    return {
      ...place,
      name: place.nameEn || place.name,
      description: place.descriptionEn || place.description,
      detail: place.detailEn || place.detail
    };
  };

  // ✅ แสดงผลลัพธ์การค้นหา
  const getResultText = () => {
    const count = sortedPlaces.length;
    if (keyword.trim() !== '') {
      return isEn 
        ? `Found ${count} results for "${keyword}"`
        : `พบ ${count} ผลลัพธ์สำหรับ "${keyword}"`;
    }
    return isEn 
      ? `Showing top ${count} check-in points`
      : `แสดงจุดเช็คอินทั้งหมด ${count} แห่ง`;
  };

  // เริ่ม Render
  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      
      <div style={{
        position: 'relative',
        width: '100%',
        height: '35vh', 
        marginTop: '70px', 
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
      }}>
        <img 
          src={checkin} 
          alt="Check-in Points Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'blur(8px)', 
            transform: 'scale(1.1)', 
            zIndex: 1
          }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200';
          }}
        />
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(43, 43, 43, 0.9))',
          zIndex: 2
        }} />

        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px', width: '100%' }}>
          <h1 className="gradient-text" style={{ 
            fontSize: '2.2rem', 
            marginBottom: '8px',
            textShadow: '2px 2px 10px rgba(0, 0, 0, 0.6)',
            fontFamily: 'Mitr, sans-serif',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease'
          }}>
            {isEn ? 'Top 10 Check-in Points in Khlong Phai Subdistrict Municipality' : 'จัดอันดับ 10 จุดเช็คอิน เทศบาลตำบลคลองไผ่'}
          </h1>
          
          <p style={{ 
            color: '#ccc', 
            margin: '0 0 16px 0', 
            fontFamily: 'Prompt, sans-serif', 
            fontSize: '0.95rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s'
          }}>
            {isEn 
              ? 'Rankings update in real-time based on heart votes' 
              : 'อันดับจะจัดเรียงและเปลี่ยนแปลงแบบเรียลไทม์ผ่านปุ่มโหวตหัวใจ'}
          </p>

          {/* ✅ Search Bar */}
          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s'
          }}>
            <div className="search-box" style={{ margin: 0 }}>
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                placeholder={isEn ? 'Search check-in points...' : 'ค้นหาจุดเช็คอิน...'} 
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '30px',
                  border: '2px solid rgba(255,255,255,0.25)',
                  outline: 'none',
                  fontSize: '16px',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#00a854';
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.boxShadow = '0 0 30px rgba(0,168,84,0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.25)';
                  e.target.style.background = 'rgba(255,255,255,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ 
        width: '100%',
        maxWidth: '1126px',
        margin: '0 auto',
        padding: '30px 20px 60px 20px', 
        minHeight: '50vh',
        height: 'auto' 
      }}>
        
        {/* ✅ Result count */}
        {!loading && (
          <div style={{
            marginBottom: '20px',
            color: '#888',
            fontSize: '0.9rem',
            fontFamily: 'Prompt, sans-serif',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.5s',
            textAlign: 'center'
          }}>
            {getResultText()}
          </div>
        )}
        
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
        ) : sortedPlaces.length === 0 ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>
            {keyword.trim() !== '' 
              ? (isEn ? `No results found for "${keyword}"` : `ไม่พบผลลัพธ์สำหรับ "${keyword}"`)
              : (isEn ? 'No check-in places found.' : 'ยังไม่มีข้อมูลจุดเช็คอินในขณะนี้')}
          </div>
        ) : (
          <div className="results-grid" style={{ marginBottom: '60px' }}>
            {sortedPlaces.slice(0, 10).map((place, index) => {
              const translatedPlace = getTranslatedPlace(place);
              const placeId = place.id || place.docId;
              const safeSelected = selectedPlaces || [];
              const isAdded = safeSelected.some(p => (p.id || p.docId) === placeId);

              return (
                <div 
                  key={placeId ? `checkin-${placeId}` : `checkin-idx-${index}`} 
                  style={{ 
                    position: 'relative',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: `opacity 0.6s ease ${0.05 + index * 0.04}s, transform 0.6s ease ${0.05 + index * 0.04}s`
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '-8px', left: '-8px',
                    background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#00a854',
                    color: index <= 2 ? '#000' : '#fff', fontWeight: 'bold', padding: '4px 12px', borderRadius: '6px', zIndex: 20, fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontFamily: 'Mitr, sans-serif'
                  }}>
                    {isEn ? `Rank ${index + 1}` : `อันดับ ${index + 1}`}
                  </div>

                  <SwipeCard
                    isAdded={isAdded}
                    onSwipeRight={() => handleSwipeRightAdd(place)}
                    onSwipeLeft={() => handleSwipeLeftRemove(place)}
                  >
                    <Card 
                      place={translatedPlace} 
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
                </div>
              );
            })}
          </div>
        )}

        {/* REVIEW SECTION (เหมือนเดิม) */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.04)', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255, 255, 255, 0.08)', 
          padding: '30px', 
          borderRadius: '16px', 
          color: '#eee', 
          maxWidth: '800px', 
          margin: '0 auto',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: `opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s`
        }}>
          {/* ... เนื้อหา review เหมือนเดิม ... */}
          {/* (ไม่ต้องเปลี่ยนแปลง) */}
        </div>
      </div>
    </div>
  );
}