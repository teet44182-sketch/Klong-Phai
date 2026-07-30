// src/pages/CheckInPoints.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import SwipeCard from '../components/SwipeCard';
import { bannedWords } from '../utils/wordlist';

// นำเข้า Firebase Firestore เฉพาะส่วนการจัดการ Review
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
  places = [],        // รับ places จาก Props
  loading = false,    // รับ loading จาก Props
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
  selectedPlaces = [],          // รายการสถานที่ในทริป
  setSelectedPlaces,            // ฟังก์ชันอัปเดตรายการในทริป
  onAddToPlan                   // Handler เพิ่มเติม (ถ้ามี)
}) {
  const { t, i18n } = useTranslation();
  
  // กำหนดภาษาปัจจุบัน
  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  const [inputText, setInputText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState('');

  const pageId = 'checkin_page'; 
  const pageReviews = reviewsData[pageId] || [];

  // เลื่อนกลับไปบนสุดเมื่อเปิดหน้านี้
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 🟢 ปัดขวา / กดเพิ่ม = เพิ่มเข้าแผนทริป (ตรวจสอบ ID ไม่ให้ซ้ำ)
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

  // 🔴 ปัดซ้าย / กดลบ = ลบออกจากแผนทริป
  const handleSwipeLeftRemove = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      setSelectedPlaces(prev => (prev || []).filter(p => (p.id || p.docId) !== placeId));
    }
  };

  // 🖱️ ฟังก์ชันสำหรับคลิกปุ่มบน Card (สลับเพิ่ม/ลบ)
  const handleToggleAddToPlan = (place) => {
    const placeId = place.id || place.docId;
    const safeSelected = selectedPlaces || [];
    const exists = safeSelected.some(p => (p.id || p.docId) === placeId);

    if (exists) {
      handleSwipeLeftRemove(place);
    } else {
      handleSwipeRightAdd(place);
    }

    if (onAddToPlan) {
      onAddToPlan(place);
    }
  };

  // ฟังก์ชันช่วยแปลงและจัด Format ข้อมูลสถานที่ให้พร้อมใช้งาน (รองรับ coords แบบ Array และ _en จาก Firestore)
  const mapPlaceData = (p) => {
    if (!p) return null;

    // 1. จัดการพิกัด lat, lng รองรับทั้ง coords: [lat, lng], lat/lng, latitude/longitude
    let lat = p.lat || p.latitude;
    let lng = p.lng || p.longitude;

    if (Array.isArray(p.coords) && p.coords.length >= 2) {
      lat = p.coords[0];
      lng = p.coords[1];
    }

    // 2. Map ค่าฟิลด์ต่างๆ พร้อม Fallback ครอบคลุมทั้ง camelCase และ snake_case (_en)
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

  // 1. กรองเฉพาะสถานที่หมวดหมู่เกี่ยวกับจุดเช็คอิน/ท่องเที่ยว
  const filteredPlaces = (places || [])
    .filter(p => {
      if (!p) return false;
      const cat = (p.category || p.type || '').toString().toLowerCase().trim();
      const validCategories = ['checkin', 'check_in', 'check-in', 'attraction', 'tourist', 'travel', 'top10', ''];
      
      // ถ้าไม่มี category และ type กำหนด ให้ยอมรับไว้ก่อน
      if (!p.category ) return true;

      return validCategories.includes(cat);
    })
    .map(mapPlaceData)
    .filter(Boolean);

  // 2. Fallback: ถ้ากรองแล้วไม่พบข้อมูลเลย ให้ใช้สถานที่ทั้งหมดจาก props เพื่อป้องกันหน้าว่าง
  const finalPlaces = filteredPlaces.length > 0 
    ? filteredPlaces 
    : (places || []).map(mapPlaceData).filter(Boolean);

  const validateReviewText = (text) => {
    const cleanText = text.trim();
    if (cleanText.length < 2) {
      alert(isEn ? "Review text is too short." : "ข้อความรีวิวสั้นเกินไปครับ");
      return false;
    }
    if (cleanText.length > 200) {
      alert(isEn ? "Review text must not exceed 200 characters." : "ข้อความรีวิวต้องไม่เกิน 200 ตัวอักษรครับ");
      return false;
    }
    const textLower = cleanText.toLowerCase();
    const hasBannedWord = bannedWords.some(word => textLower.includes(word));
    if (hasBannedWord) {
      alert(isEn ? "Your text contains inappropriate language. Please edit before submitting." : "ข้อความของคุณมีคำไม่เหมาะสม (คำหยาบ) กรุณาแก้ไขก่อนส่งครับ");
      return false;
    }
    return cleanText;
  };

  // จัดอันดับสถานที่ตามจำนวน Likes
  const sortedPlaces = [...finalPlaces].sort((a, b) => {
    const scoreA = likes[a.id || a.docId] || 0;
    const scoreB = likes[b.id || b.docId] || 0;
    return scoreB - scoreA;
  });

  // ฟังก์ชันแปลงข้อมูล place ให้แสดงผลตามภาษาที่เลือก
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
    if (!inputText.trim() || !googleUser) return;

    const validatedText = validateReviewText(inputText);
    if (!validatedText) return;

    try {
      await addDoc(collection(db, "reviews"), {
        placeId: pageId,
        name: googleUser.displayName || 'Anonymous',   
        userPhoto: googleUser.photoURL || '', 
        text: validatedText,
        userId: String(googleUser.uid).trim(), 
        createdAt: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      console.error("Error saving checkin page review:", error);
    }
  };

  const handleUpdateReview = async (review) => {
    const targetId = review.id || review.docId;
    if (!targetId) {
      alert(isEn ? "Cannot update: Document ID not found." : "ไม่สามารถอัปเดตได้เนื่องจากไม่พบ ID ของเอกสารรีวิว");
      return;
    }
    if (!editText.trim()) return;

    const validatedText = validateReviewText(editText);
    if (!validatedText) return;

    try {
      await updateDoc(doc(db, "reviews", targetId), {
        text: validatedText,
        updatedAt: serverTimestamp() 
      });
      setEditingReviewId(null);
      setEditText('');
    } catch (error) {
      console.error("Error updating review:", error);
      alert(isEn ? "Failed to update review. Please try again." : "ไม่สามารถแก้ไขข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDeleteReview = async (review) => {
    const targetId = review.id || review.docId || review._id;
    
    if (!targetId) {
      alert(isEn ? "Cannot find comment ID on Firebase." : "ระบบหา ID บน Firebase ของคอมเมนต์นี้ไม่เจอ");
      return;
    }
    
    if (!window.confirm(isEn ? "Are you sure you want to delete this comment?" : "คุณต้องการลบคอมเมนต์รีวิวนี้ใช่หรือไม่?")) return;
    
    try {
      await deleteDoc(doc(db, "reviews", targetId));
    } catch (error) {
      console.error("Error deleting review:", error);
      alert(isEn ? "An error occurred while deleting data from the database." : "เกิดข้อผิดพลาดขณะลบข้อมูลจาก Database");
    }
  };

  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      
      {/* ส่วนหัวภาพพื้นหลังแบบเบลอ (Hero BG Blur) */}
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
          src="src/assets/cf.jpg" 
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

        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px' }}>
          <h1 className="page-title" style={{ 
            fontSize: '2.2rem', 
            color: '#ffffff', 
            marginBottom: '8px',
            textShadow: '2px 2px 10px rgba(0,0,0,0.6)',
            fontFamily: 'Mitr, sans-serif'
          }}>
            {t('checkin_title', isEn ? 'Top 10 Check-in Points in Khlong Phai' : 'จัดอันดับ 10 จุดเช็คอิน คลองไผ่')}
          </h1>
          <p style={{ color: '#ccc', margin: 0, fontFamily: 'Prompt, sans-serif', fontSize: '0.95rem' }}>
            {t('checkin_subtitle', isEn 
              ? 'Rankings update in real-time based on heart votes' 
              : 'อันดับจะจัดเรียงและเปลี่ยนแปลงแบบเรียลไทม์ผ่านปุ่มโหวตหัวใจ บนกล่องการ์ดสถานที่')}
          </p>
        </div>
      </div>

      {/* ส่วนแสดงผลเนื้อหาการ์ดผลลัพธ์ด้านล่าง */}
      <div className="page-container" style={{ 
        width: '100%',
        maxWidth: '1126px',
        margin: '0 auto',
        padding: '30px 20px 60px 20px', 
        minHeight: '50vh',
        height: 'auto' 
      }}>
        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '40px', fontFamily: 'Prompt, sans-serif' }}>
            {isEn ? 'Loading places...' : 'กำลังโหลดข้อมูลสถานที่...'}
          </div>
        ) : sortedPlaces.length === 0 ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '40px', fontFamily: 'Prompt, sans-serif' }}>
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
                <div key={placeId ? `checkin-${placeId}` : `checkin-idx-${index}`} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: '-8px', left: '-8px',
                    background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#00a854',
                    color: index <= 2 ? '#000' : '#fff', fontWeight: 'bold', padding: '4px 12px', borderRadius: '6px', zIndex: 20, fontSize: '0.85rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontFamily: 'Mitr, sans-serif'
                  }}>
                    {isEn ? `Rank ${index + 1}` : `อันดับ ${index + 1}`}
                  </div>

                  {/* 🎴 ครอบด้วย SwipeCard เพื่อรองรับ Touch Swipe ปัดเข้า/ออกคิว */}
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

        {/* Section Review / Discussion */}
        <div style={{ background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '30px', borderRadius: '16px', color: '#eee', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', margin: 0, fontSize: '1.3rem' }}>
              {t('checkin_discuss', isEn ? 'Discuss these 10 Check-in Points' : 'พูดคุยเกี่ยวกับ 10 จุดเช็คอินนี้')}
            </h3>
            {googleUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#aaa' }}>
                  {googleUser.photoURL && <img src={googleUser.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                  <span>{googleUser.displayName}</span>
                </div>
                <button type="button" onClick={handleGoogleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'Prompt, sans-serif' }}>
                  {t('logout', isEn ? 'Sign out' : 'ออกจากระบบ')}
                </button>
              </div>
            )}
          </div>

          {googleUser ? (
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
              <textarea 
                placeholder={t('checkin_placeholder', isEn ? "Write a review or recommendation... (2-200 characters)" : "เขียนรีวิวหรือแนะนำสิ่งที่น่าสนใจใน 10 จุดเช็คอินนี้... (2-200 ตัวอักษร)")} 
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                required 
                maxLength={200} 
                rows="3" 
                style={{ padding: '14px 16px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', resize: 'none', lineHeight: '1.5', fontFamily: 'Prompt, sans-serif' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'Prompt, sans-serif' }}>
                  {inputText.length}/200 {t('chars_limit', isEn ? 'chars' : 'ตัวอักษร')}
                </span>
                <button type="submit" style={{ background: '#00a854', color: '#fff', padding: '10px 28px', border: 'none', borderRadius: '50px', fontFamily: 'Mitr, sans-serif', fontSize: '0.95rem', cursor: 'pointer' }}>
                  {t('btn_submit_review', isEn ? 'Submit' : 'ส่งความเห็น')}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '30px' }}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 16px 0', fontFamily: 'Prompt, sans-serif' }}>
                {t('login_prompt', isEn ? 'Please sign in with Google to join the discussion.' : 'กรุณาเข้าสู่ระบบด้วย Google เพื่อยืนยันตัวตนก่อนร่วมแสดงความคิดเห็น')}
              </p>
              <button type="button" onClick={handleGoogleLogin} style={{ background: '#fff', color: '#222', padding: '10px 20px', border: 'none', borderRadius: '6px', fontFamily: 'Mitr, sans-serif', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'block' }}>
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-1.14 2.76-2.4 3.61v3h3.86c2.26-2.08 3.67-5.14 3.67-8.46z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.11C3.18 21.88 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.6H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.06-3.1z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.39l4.06 3.11c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                {t('google_login', 'Sign in with Google')}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pageReviews.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic', padding: '10px 0' }}>
                {t('no_reviews', isEn ? 'No comments yet. Be the first to comment!' : 'ยังไม่มีคอมเมนต์ มาร่วมแชร์ความเห็นเกี่ยวกับ 10 จุดเช็คอินเป็นคนแรกกันครับ!')}
              </p>
            ) : (
              pageReviews.map((review, rIdx) => {
                const currentUserId = googleUser ? String(googleUser.uid).trim() : null;
                const reviewOwnerId = review.userId ? String(review.userId).trim() : null;
                const isOwner = currentUserId && reviewOwnerId && currentUserId === reviewOwnerId;
                const reviewId = review.id || review.docId;

                const reviewDate = review.createdAt && review.createdAt.seconds 
                  ? new Date(review.createdAt.seconds * 1000).toLocaleDateString(isEn ? 'en-US' : 'th-TH')
                  : t('sending', isEn ? 'Sending...' : 'กำลังส่ง...');

                return (
                  <div key={reviewId ? `rev-${reviewId}` : `rev-idx-${rIdx}`} style={{ padding: '15px 20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {review.userPhoto && <img src={review.userPhoto} alt="" style={{ width: 26, height: 26, borderRadius: '50%' }} />}
                        <strong style={{ color: '#fff', fontSize: '1rem', fontFamily: 'Prompt, sans-serif' }}>{review.name}</strong>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isOwner && editingReviewId !== reviewId && (
                          <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', fontFamily: 'Prompt, sans-serif' }}>
                            <button onClick={() => { setEditingReviewId(reviewId); setEditText(review.text); }} style={{ background: 'none', border: 'none', color: '#ffb300', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                              {t('edit', isEn ? 'Edit' : 'แก้ไข')}
                            </button>
                            <button onClick={() => handleDeleteReview(review)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                              {t('delete', isEn ? 'Delete' : 'ลบ')}
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
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={200} rows="2" style={{ padding: '10px', background: '#333', border: '1px solid #555', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', fontFamily: 'Prompt, sans-serif', outline: 'none', resize: 'none' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'Prompt, sans-serif' }}>{editText.length}/200 {t('chars_limit', isEn ? 'chars' : 'ตัวอักษร')}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingReviewId(null)} style={{ background: '#555', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Prompt, sans-serif' }}>
                              {t('cancel', isEn ? 'Cancel' : 'ยกเลิก')}
                            </button>
                            <button onClick={() => handleUpdateReview(review)} style={{ background: '#00a854', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Prompt, sans-serif', fontWeight: 'bold' }}>
                              {t('save', isEn ? 'Save' : 'บันทึก')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: '#ccc', fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: '1.6', paddingLeft: review.userPhoto ? '34px' : '0' }}>{review.text}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}