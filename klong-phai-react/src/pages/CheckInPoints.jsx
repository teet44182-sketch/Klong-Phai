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

  // ❌ ลบ useEffect ที่เกี่ยวกับ search
  // useEffect(() => {
  //   if (onSearchChange) {
  //     onSearchChange(keyword);
  //   }
  // }, [keyword, onSearchChange]);

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
      category: p.category || p.type || 'checkin',
      coords: p.coords || null,
      lat: lat || null,
      lng: lng || null
    };
  };

  const filteredPlaces = (places || [])
    .filter(p => {
      if (!p) return false;
      const cat = (p.category || p.type || '').toString().toLowerCase().trim();
      const validCategories = ['checkin', 'check_in', 'check-in', 'attraction', 'tourist', 'travel', 'top10', ''];
      if (!p.category) return true;
      return validCategories.includes(cat);
    })
    .map(mapPlaceData)
    .filter(Boolean);

  const finalPlaces = filteredPlaces.length > 0 
    ? filteredPlaces 
    : (places || []).map(mapPlaceData).filter(Boolean);

  // ❌ ลบ filter การค้นหา
  // const searchFilteredPlaces = finalPlaces.filter(place => {
  //   const searchKey = keyword.trim().toLowerCase();
  //   if (!searchKey) return true;
  //   const name = (place.name || '').toLowerCase();
  //   const nameEn = (place.nameEn || '').toLowerCase();
  //   const desc = (place.description || '').toLowerCase();
  //   const descEn = (place.descriptionEn || '').toLowerCase();
  //   return name.includes(searchKey) || nameEn.includes(searchKey) || 
  //          desc.includes(searchKey) || descEn.includes(searchKey);
  // });

  // ✅ ใช้ finalPlaces โดยตรง (ไม่ต้อง filter)
  const searchFilteredPlaces = finalPlaces;

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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastSubmitTime < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
      showToast(isEn ? `Please wait ${waitSeconds}s` : `กรุณารอ ${waitSeconds} วินาที`);
      return;
    }
    
    if (!inputText.trim()) {
      showToast(isEn ? "Please write a review" : "กรุณาเขียนรีวิวก่อนส่ง");
      return;
    }
    
    if (!googleUser) {
      showToast(isEn ? "Please sign in first" : "กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    if (isSubmitting) {
      showToast(isEn ? "Please wait..." : "กรุณารอสักครู่...");
      return;
    }

    const validatedText = validateReviewText(inputText);
    if (!validatedText) return;

    setIsSubmitting(true);

    try {
      const reviewsRef = collection(db, "reviews");
      
      await addDoc(reviewsRef, {
        placeId: pageId,
        name: sanitizeInput(googleUser.displayName || 'Anonymous'),
        userPhoto: googleUser.photoURL || '',
        text: validatedText,
        userId: googleUser.uid,
        createdAt: serverTimestamp()
      });
      
      setInputText('');
      setLastSubmitTime(now);
      showToast(isEn ? "Review submitted!" : "ส่งรีวิวเรียบร้อย!");
      
    } catch (error) {
      console.error("Error saving review:", error);
      showToast(isEn ? " Failed to submit: " + error.message : " ไม่สามารถส่งรีวิวได้: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReview = async (review) => {
    const targetId = review.id || review.docId;
    if (!targetId) {
      showToast(isEn ? " Document ID not found" : " ไม่พบ ID");
      return;
    }
    if (!editText.trim()) {
      showToast(isEn ? "Please write something" : "กรุณาเขียนข้อความ");
      return;
    }

    if (googleUser && review.userId !== googleUser.uid) {
      showToast(isEn ? " You can only edit your own reviews" : " คุณสามารถแก้ไขได้เฉพาะรีวิวของคุณ");
      return;
    }

    const validatedText = validateReviewText(editText);
    if (!validatedText) return;

    try {
      await updateDoc(doc(db, "reviews", targetId), {
        text: validatedText,
        updatedAt: serverTimestamp()
      });
      setEditingReviewId(null);
      setEditText('');
      showToast(isEn ? "Review updated!" : "แก้ไขรีวิวเรียบร้อย!");
    } catch (error) {
      console.error("Error updating review:", error);
      showToast(isEn ? " Failed to update: " + error.message : " ไม่สามารถแก้ไขได้: " + error.message);
    }
  };

  const handleDeleteReview = async (review) => {
    const targetId = review.id || review.docId || review._id;
    
    if (!targetId) {
      showToast(isEn ? " Comment ID not found" : " ไม่พบ ID");
      return;
    }
    
    if (googleUser && review.userId !== googleUser.uid) {
      showToast(isEn ? " You can only delete your own reviews" : " คุณสามารถลบได้เฉพาะรีวิวของคุณ");
      return;
    }
    
    if (!window.confirm(isEn ? "Delete this comment?" : "ลบคอมเมนต์นี้?")) return;
    
    try {
      await deleteDoc(doc(db, "reviews", targetId));
      showToast(isEn ? "Review deleted!" : "ลบรีวิวเรียบร้อย!");
    } catch (error) {
      console.error("Error deleting review:", error);
      showToast(isEn ? "Failed to delete" : "ไม่สามารถลบได้");
    }
  };

  const renderReviewText = (text) => {
    if (!text) return '';
    return escapeHtml(text);
  };

  // ✅ แสดงผลลัพธ์
  const getResultText = () => {
    return isEn 
      ? `Showing top ${sortedPlaces.length} check-in points`
      : `แสดงจุดเช็คอินทั้งหมด ${sortedPlaces.length} แห่ง`;
  };

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
          {/* ✅ เปลี่ยนเป็นสีขาว */}
          <h1 className="page-title" style={{ 
            fontSize: '2.2rem', 
            marginBottom: '8px',
            textShadow: '2px 2px 10px rgba(0, 0, 0, 0.6)',
            fontFamily: 'Mitr, sans-serif',
            color: '#ffffff',  // ✅ เปลี่ยนเป็นสีขาว
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

          {/* ❌ ลบ Search Bar */}
          {/* <div style={{
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
          </div> */}
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
        
        {/* ✅ แสดงจำนวนผลลัพธ์ (ไม่แสดงคำค้นหา) */}
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
            {isEn ? 'No check-in places found.' : 'ยังไม่มีข้อมูลจุดเช็คอินในขณะนี้'}
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

        {/* REVIEW SECTION - ส่วนนี้คงเดิม */}
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', margin: 0, fontSize: '1.3rem' }}>
              {isEn ? 'Discuss these 10 Check-in Points' : 'พูดคุยเกี่ยวกับ 10 จุดเช็คอินนี้'}
            </h3>
            {googleUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#aaa' }}>
                  {googleUser.photoURL && <img src={googleUser.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                  <span>{escapeHtml(googleUser.displayName)}</span>
                </div>
                <button type="button" onClick={handleGoogleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'Prompt, sans-serif' }}>
                  {isEn ? 'Sign out' : 'ออกจากระบบ'}
                </button>
              </div>
            )}
          </div>

          {googleUser ? (
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              <textarea 
                placeholder={isEn ? "Write a review about these check-in points... (2-200 chars)" : "เขียนรีวิวเกี่ยวกับ 10 จุดเช็คอินนี้... (2-200 ตัวอักษร)"} 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                required 
                maxLength={200} 
                rows="3" 
                disabled={isSubmitting}
                style={{ 
                  padding: '14px 16px', 
                  background: 'rgba(255, 255, 255, 0.06)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '8px', 
                  color: '#fff', 
                  fontSize: '0.95rem', 
                  outline: 'none', 
                  resize: 'none', 
                  lineHeight: '1.5', 
                  fontFamily: 'Prompt, sans-serif',
                  opacity: isSubmitting ? 0.5 : 1
                }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  {inputText.length}/200 {isEn ? 'chars' : 'ตัวอักษร'}
                </span>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ 
                    background: isSubmitting ? '#666' : '#00a854', 
                    color: '#fff', 
                    padding: '10px 28px', 
                    border: 'none', 
                    borderRadius: '50px', 
                    fontFamily: 'Mitr, sans-serif', 
                    fontSize: '0.95rem', 
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  {isSubmitting ? (isEn ? 'Sending...' : 'กำลังส่ง...') : (isEn ? 'Submit' : 'ส่งความเห็น')}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '30px' }}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
                {isEn ? 'Please sign in to join the discussion.' : 'กรุณาเข้าสู่ระบบเพื่อร่วมแสดงความคิดเห็น'}
              </p>
              <button type="button" onClick={handleGoogleLogin} style={{ background: '#fff', color: '#222', padding: '10px 20px', border: 'none', borderRadius: '6px', fontFamily: 'Mitr, sans-serif', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'block' }}>
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-1.14 2.76-2.4 3.61v3h3.86c2.26-2.08 3.67-5.14 3.67-8.46z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.11C3.18 21.88 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.6H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.06-3.1z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.39l4.06 3.11c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                {isEn ? 'Sign in with Google' : 'เข้าสู่ระบบด้วย Google'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pageReviews.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic', padding: '10px 0' }}>
                {isEn ? 'No comments yet. Be the first!' : 'ยังไม่มีคอมเมนต์'}
              </p>
            ) : (
              pageReviews.map((review, rIdx) => {
                const currentUserId = googleUser ? String(googleUser.uid).trim() : null;
                const reviewOwnerId = review.userId ? String(review.userId).trim() : null;
                const isOwner = currentUserId && reviewOwnerId && currentUserId === reviewOwnerId;
                const reviewId = review.id || review.docId;

                const reviewDate = review.createdAt && review.createdAt.seconds 
                  ? new Date(review.createdAt.seconds * 1000).toLocaleDateString(isEn ? 'en-US' : 'th-TH')
                  : isEn ? 'Sending...' : 'กำลังส่ง...';

                const safeReviewText = renderReviewText(review.text);
                const safeReviewName = renderReviewText(review.name);

                return (
                  <div key={reviewId ? `rev-${reviewId}` : `rev-idx-${rIdx}`} style={{ padding: '15px 20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {review.userPhoto && <img src={review.userPhoto} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />}
                        <strong style={{ color: '#fff', fontSize: '1rem', fontFamily: 'Prompt, sans-serif' }}>
                          {safeReviewName}
                        </strong>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isOwner && editingReviewId !== reviewId && (
                          <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
                            <button 
                              onClick={() => { setEditingReviewId(reviewId); setEditText(review.text); }} 
                              style={{ background: 'none', border: 'none', color: '#ffb300', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                              {isEn ? 'Edit' : 'แก้ไข'}
                            </button>
                            <button 
                              onClick={() => handleDeleteReview(review)} 
                              style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                              {isEn ? 'Delete' : 'ลบ'}
                            </button>
                          </div>
                        )}
                        <span style={{ color: '#666', fontSize: '0.8rem' }}>
                          {reviewDate}
                        </span>
                      </div>
                    </div>

                    {editingReviewId === reviewId ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '5px' }}>
                        <textarea 
                          value={editText} 
                          onChange={(e) => setEditText(e.target.value)} 
                          maxLength={200} 
                          rows="2" 
                          style={{ padding: '10px', background: '#333', border: '1px solid #555', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', fontFamily: 'Prompt, sans-serif', outline: 'none', resize: 'none' }} 
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>{editText.length}/200 {isEn ? 'chars' : 'ตัวอักษร'}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => setEditingReviewId(null)} 
                              style={{ background: '#555', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                               {isEn ? 'Cancel' : 'ยกเลิก'}
                            </button>
                            <button 
                              onClick={() => handleUpdateReview(review)} 
                              style={{ background: '#00a854', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              {isEn ? 'Save' : 'บันทึก'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p 
                        style={{ margin: 0, color: '#ccc', fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: '1.6', paddingLeft: review.userPhoto ? '34px' : '0' }}
                        dangerouslySetInnerHTML={{ __html: safeReviewText }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <div style={{ marginTop: '15px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
            <span style={{ color: '#555', fontSize: '0.8rem' }}>
              {isEn ? `Total ${pageReviews.length} reviews` : `ทั้งหมด ${pageReviews.length} รีวิว`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}