// src/pages/Accommodation.jsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import SwipeCard from '../components/SwipeCard';

export default function Accommodation({ 
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

  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  const accommodations = (places || [])
    .filter(place => {
      const cat = String(place.category || place.type || '').toLowerCase().trim();
      return (
        cat === 'accommodation' || 
        cat === 'accomodation' ||
        cat === 'hotel' || 
        cat === 'resort' || 
        cat === 'stay' || 
        cat === 'ที่พัก' || 
        cat === 'โรงแรม'
      );
    })
    .map(p => ({
      id: p.id || p.docId,
      name: p.title || p.name,
      nameEn: p.title_en || p.nameEn,
      description: p.description,
      descriptionEn: p.description_en || p.descriptionEn,
      detail: p.detailDescription || p.detail || p.description,
      detailEn: p.detailDescription_en || p.detailEn || p.description_en,
      img: p.img || p.imageUrl || p.image,
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      mapUrl: p.mapUrl || p.googleMap || p.map,
      workingHours: p.workingHours,
      phone: p.phone,
      category: p.category || p.type,
      coords: p.coords,
      lat: p.lat,
      lng: p.lng
    }));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 🟢 ปัดขวา = เพิ่มเข้าทริป + Toast
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

  // 🔴 ปัดซ้าย = ลบออกจากทริป
  const handleSwipeLeftRemove = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      setSelectedPlaces(prev => (prev || []).filter(p => (p.id || p.docId) !== placeId));
      // ✅ เพิ่มบรรทัดนี้ให้ Toast เด้ง
      if (onAddToPlan) onAddToPlan(place);
    }
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
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200" 
          alt={t('nav_accommodation', isEn ? 'Accommodation' : 'ที่พัก')}
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
          <h2 className="page-title" style={{ 
            fontSize: '2.5rem', 
            color: '#ffffff', 
            marginBottom: 0,
            textShadow: '2px 2px 10px rgba(0,0,0,0.6)',
            fontFamily: 'Mitr, sans-serif'
          }}>
            {t('nav_accommodation', isEn ? 'Accommodation' : 'ที่พัก')}
          </h2>
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
        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '40px', fontFamily: 'Prompt, sans-serif' }}>
            {isEn ? 'Loading accommodations...' : 'กำลังโหลดข้อมูลที่พัก...'}
          </div>
        ) : (
          <div className="results-grid">
            {accommodations.length > 0 ? (
              accommodations.map(place => {
                const placeId = place.id || place.docId;
                const isAdded = (selectedPlaces || []).some(p => (p.id || p.docId) === placeId);

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
                      onAddToPlan={onAddToPlan}
                      isAddedToPlan={isAdded}
                    />
                  </SwipeCard>
                );
              })
            ) : (
              <div className="no-result" style={{ color: '#aaa', textAlign: 'center', width: '100%' }}>
                {t('no_accommodation', isEn ? 'No accommodations available at the moment.' : 'ยังไม่มีข้อมูลที่พักในขณะนี้')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}