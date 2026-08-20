// src/pages/Restaurant.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import SwipeCard from '../components/SwipeCard';
import restaurant from '../assets/restaurant.jpg'

export default function Restaurant({ 
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
  onAddToPlan,
  searchKeyword = '',
  onSearchChange
}) {
  const { t, i18n } = useTranslation();
  const [keyword, setKeyword] = useState(searchKeyword || '');
  const [isVisible, setIsVisible] = useState(false);

  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(keyword);
    }
  }, [keyword, onSearchChange]);

  const restaurants = (places || [])
    .filter(place => {
      const cat = String(place.category || place.type || '').toLowerCase().trim();
      return (
        cat === 'restaurant' || 
        cat === 'food' || 
        cat === 'ร้านอาหาร' ||
        cat === 'dining'
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

  const filteredRestaurants = restaurants.filter(place => {
    const searchKey = keyword.trim().toLowerCase();
    if (!searchKey) return true;
    const name = (place.name || '').toLowerCase();
    const nameEn = (place.nameEn || '').toLowerCase();
    const desc = (place.description || '').toLowerCase();
    const descEn = (place.descriptionEn || '').toLowerCase();
    return name.includes(searchKey) || nameEn.includes(searchKey) || 
           desc.includes(searchKey) || descEn.includes(searchKey);
  });

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

  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      
      <div style={{
        position: 'relative',
        width: '100%',
        height: '30vh', 
        marginTop: '70px', 
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
      }}>
        <img 
          src={restaurant} 
          alt="Restaurant Background"
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
            e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200';
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
          <h2 className="page-title" style={{ 
            fontSize: '2.5rem', 
            color: '#ffffff', 
            marginBottom: '12px',
            textShadow: '2px 2px 10px rgba(0,0,0,0.6)',
            fontFamily: 'Mitr, sans-serif',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease'
          }}>
            {t('nav_restaurant', isEn ? 'Restaurants' : 'ร้านอาหาร')}
          </h2>
          
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
                placeholder={isEn ? 'Search restaurants...' : 'ค้นหาร้านอาหาร...'} 
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
            {keyword.trim() !== '' ? (
              isEn 
                ? `Found ${filteredRestaurants.length} results for "${keyword}"`
                : `พบ ${filteredRestaurants.length} ผลลัพธ์สำหรับ "${keyword}"`
            ) : (
              isEn 
                ? `Showing all ${filteredRestaurants.length} restaurants`
                : `แสดงร้านอาหารทั้งหมด ${filteredRestaurants.length} ร้าน`
            )}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '40px', fontFamily: 'Prompt, sans-serif' }}>
            {isEn ? 'Loading restaurants...' : 'กำลังโหลดข้อมูลร้านอาหาร...'}
          </div>
        ) : (
          <div className="results-grid">
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((place, index) => {
                const placeId = place.id || place.docId;
                const isAdded = (selectedPlaces || []).some(p => (p.id || p.docId) === placeId);

                return (
                  <div
                    key={placeId}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                      transition: `opacity 0.6s ease ${0.05 + index * 0.04}s, transform 0.6s ease ${0.05 + index * 0.04}s`
                    }}
                  >
                    <SwipeCard
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
                  </div>
                );
              })
            ) : (
              <div className="no-result" style={{ color: '#aaa', textAlign: 'center', width: '100%', padding: '40px' }}>
                {isEn ? 'No restaurants found' : 'ไม่พบร้านอาหาร'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}