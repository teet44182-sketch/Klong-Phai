// src/pages/Attractions.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import SwipeCard from '../components/SwipeCard';

// ✅ ฟังก์ชันตรวจจับหมวดหมู่ย่อยจากชื่อสถานที่
const detectCategoryFromName = (name) => {
  if (!name) return 'other';
  const n = name.toLowerCase().trim();

  // 1. คาเฟ่และร้านอาหาร (เฉพาะคาเฟ่ ถือเป็นที่เที่ยว)
  if (n.includes('cook & coff') || n.includes('cook & coffee') || n.includes('coff') || n.includes('คาเฟ่') || n.includes('กาแฟ')) {
    return 'cafe';
  }
  // 2. วัดและสถานที่ทางศาสนา
  if (n.includes('วัด') || n.includes('ที่พักสงฆ์') || n.includes('พระพุทธบาท') || n.includes('temple')) {
    return 'temple';
  }
  // 3. ธรรมชาติและกิจกรรมกลางแจ้ง
  if (n.includes('sup') || n.includes('ล่อง') || n.includes('พิชิต') || n.includes('ปีน') || n.includes('เดินป่า') || n.includes('ยอดเขา') || n.includes('nature') || n.includes('activity')) {
    return 'nature_activity';
  }
  // 4. สถานที่ราชการและฝึกอบรม
  if (n.includes('ทัณฑสถาน') || n.includes('เรือนจำ') || n.includes('ราชทัณฑ์') || n.includes('ฝึกอบรม') || n.includes('prison') || n.includes('correctional') || n.includes('training')) {
    return 'government_training';
  }
  // 5. ศูนย์อนุรักษ์และศึกษา
  if (n.includes('อนุรักษ์') || n.includes('ศูนย์') || n.includes('conservation') || n.includes('learning')) {
    return 'conservation';
  }
  // 6. การคมนาคม
  if (n.includes('สถานีรถไฟ') || n.includes('สถานี') || n.includes('station')) {
    return 'transport';
  }
  // 7. สถานที่ท่องเที่ยวแนวใหม่
  if (n.includes('เรือนจำท่องเที่ยว') || n.includes('tourist prison') || n.includes('new')) {
    return 'new_attraction';
  }
  // ค่าเริ่มต้น (ยังไม่ระบุ)
  return 'other';
};

// ✅ ตัวเลือกหมวดหมู่พร้อมสีประจำหมวด (แท็กสี)
const CATEGORY_OPTIONS = [
  { 
    value: 'all', 
    label: 'ทั้งหมด', 
    labelEn: 'All',
    color: '#6B7280'
  },
  { 
    value: 'cafe', 
    label: 'คาเฟ่และร้านอาหาร', 
    labelEn: 'Cafes & Restaurants',
    color: '#D4A017' // ม่วง
  },
  { 
    value: 'temple', 
    label: 'วัดและศาสนสถาน', 
    labelEn: 'Temples',
    color: '#F1C40F' // เหลือง
  },
  { 
    value: 'nature_activity', 
    label: 'ธรรมชาติและกิจกรรม', 
    labelEn: 'Nature & Activities',
    color: '#1ABC9C' // เขียว
  },
  { 
    value: 'government_training', 
    label: 'ราชการและฝึกอบรม', 
    labelEn: 'Government & Training',
    color: '#307fef' // ส้ม
  },
  { 
    value: 'conservation', 
    label: 'ศูนย์อนุรักษ์และศึกษา', 
    labelEn: 'Conservation & Learning',
    color: '#27AE60' // น้ำเงิน
  },
  { 
    value: 'transport', 
    label: 'การคมนาคม', 
    labelEn: 'Transport',
    color: '#C0392B' // ฟ้า
  },
  { 
    value: 'new_attraction', 
    label: 'ท่องเที่ยวแนวใหม่', 
    labelEn: 'New Attractions',
    color: '#EC4899' // ชมพู
  },
  { 
    value: 'other', 
    label: 'อื่นๆ', 
    labelEn: 'Others',
    color: '#9CA3AF' // เทาอ่อน
  },
];

export default function Attractions({ 
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
  const [filterCategory, setFilterCategory] = useState('all');

  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  useEffect(() => {
    if (onSearchChange) onSearchChange(keyword);
  }, [keyword, onSearchChange]);

  // ✅ กรองเฉพาะสถานที่ท่องเที่ยว (ไม่รวมที่พักและร้านอาหาร)
  const allPlaces = (places || [])
    .filter(place => {
      const cat = (place.category || place.type || '').toString().toLowerCase().trim();
      // ข้ามที่พักและร้านอาหาร (ยกเว้นคาเฟ่ที่ถูกจัดเป็น cafe)
      if (cat === 'accommodation') return false;
      if (cat === 'restaurant') {
        // ถ้าเป็นร้านอาหาร แต่ชื่อเป็นคาเฟ่ ให้ถือเป็นสถานที่ท่องเที่ยว
        return detectCategoryFromName(place.title || place.name || '') === 'cafe';
      }
      // เฉพาะ travel หรือ cafe หรือไม่มีหมวด (ให้ถือเป็น travel)
      return true;
    })
    .map(p => {
      const rawCat = (p.category || p.type || '').toString().toLowerCase().trim();
      let subCategory;

      if (rawCat === 'cafe') {
        subCategory = 'cafe';
      } else if (rawCat === 'travel') {
        subCategory = detectCategoryFromName(p.title || p.name || '');
      } else {
        subCategory = detectCategoryFromName(p.title || p.name || '');
      }

      return {
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
        category: subCategory, // หมวดหมู่ย่อยใหม่
        coords: p.coords,
        lat: p.lat,
        lng: p.lng
      };
    });

  // ✅ ค้นหาตาม keyword
  const searchedPlaces = allPlaces.filter(place => {
    const searchKey = keyword.trim().toLowerCase();
    if (!searchKey) return true;
    const name = (place.name || '').toLowerCase();
    const nameEn = (place.nameEn || '').toLowerCase();
    return name.includes(searchKey) || nameEn.includes(searchKey);
  });

  // ✅ กรองตามหมวดหมู่ย่อย (ถ้าไม่เลือก (all) จะแสดงทั้งหมด)
  const filteredPlaces = searchedPlaces.filter(place => {
    if (filterCategory === 'all') return true;
    return (place.category || 'other') === filterCategory;
  });

  // ✅ นับจำนวนในแต่ละหมวดหมู่
  const getCategoryCount = (catValue) => {
    if (catValue === 'all') return searchedPlaces.length;
    return searchedPlaces.filter(place => (place.category || 'other') === catValue).length;
  };

  const handleSwipeRightAdd = (place) => {
    if (setSelectedPlaces) {
      const placeId = place.id || place.docId;
      setSelectedPlaces(prev => {
        const exists = (prev || []).some(p => (p.id || p.docId) === placeId);
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
      setSelectedPlaces(prev => (prev || []).filter(p => (p.id || p.docId) !== placeId));
      if (onAddToPlan) onAddToPlan(place);
    }
  };

  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      
      {/* Hero Section */}
      <div style={{ position: 'relative', width: '100%', height: '30vh', marginTop: '70px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <img 
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200" 
          alt={isEn ? 'Attractions' : 'สถานที่ท่องเที่ยว'}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'blur(8px)', transform: 'scale(1.1)', zIndex: 1 }}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'; }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(43, 43, 43, 0.9))', zIndex: 2 }} />
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px', width: '100%' }}>
          <h2 className="page-title" style={{ fontSize: '2.5rem', color: '#ffffff', marginBottom: '12px', textShadow: '2px 2px 10px rgba(0,0,0,0.6)', fontFamily: 'Mitr, sans-serif', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(-20px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
            {isEn ? 'All Attractions' : 'สถานที่ท่องเที่ยวทั้งหมด'}
          </h2>
          
          <div style={{ maxWidth: '500px', margin: '0 auto', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s' }}>
            <div className="search-box" style={{ margin: 0 }}>
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); if (onSearchChange) onSearchChange(e.target.value); }}
                placeholder={isEn ? 'Search attractions...' : 'ค้นหาสถานที่ท่องเที่ยว...'} 
                style={{ width: '100%', padding: '14px 24px', borderRadius: '30px', border: '2px solid rgba(255,255,255,0.25)', outline: 'none', fontSize: '16px', background: 'rgba(255,255,255,0.12)', color: '#fff', backdropFilter: 'blur(10px)', transition: 'all 0.3s ease' }}
                onFocus={(e) => { e.target.style.borderColor = '#00a854'; e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.boxShadow = '0 0 30px rgba(0,168,84,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="page-container" style={{ width: '100%', maxWidth: '1126px', margin: '0 auto', padding: '30px 20px 60px 20px', minHeight: '50vh', height: 'auto' }}>
        
        {/* ✅ Filter Tags */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', opacity: isVisible ? 1 : 0, transition: 'opacity 0.6s ease 0.5s' }}>
          {CATEGORY_OPTIONS.map(opt => {
            const isActive = filterCategory === opt.value;
            const count = getCategoryCount(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => setFilterCategory(opt.value)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '30px',
                  border: isActive ? '2px solid transparent' : `2px solid ${opt.color}`,
                  background: isActive ? `linear-gradient(135deg, ${opt.color}, ${opt.color}CC)` : 'transparent',
                  color: isActive ? '#ffffff' : opt.color,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontFamily: 'Prompt, sans-serif',
                  transition: 'all 0.25s ease',
                  boxShadow: isActive ? `0 4px 15px ${opt.color}40` : 'none',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.background = `${opt.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; } }}
              >
                {isEn ? opt.labelEn : opt.label}
                <span style={{ background: isActive ? 'rgba(255,255,255,0.25)' : `${opt.color}20`, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', color: isActive ? '#fff' : opt.color }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {!loading && (
          <div style={{ marginBottom: '20px', color: '#888', fontSize: '0.9rem', fontFamily: 'Prompt, sans-serif', opacity: isVisible ? 1 : 0, transition: 'opacity 0.6s ease 0.5s', textAlign: 'center' }}>
            {keyword.trim() !== '' ? (
              isEn ? `Found ${filteredPlaces.length} results for "${keyword}"` : `พบ ${filteredPlaces.length} ผลลัพธ์สำหรับ "${keyword}"`
            ) : (
              isEn ? `Showing all ${filteredPlaces.length} places` : `แสดงทั้งหมด ${filteredPlaces.length} สถานที่`
            )}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#aaa', textAlign: 'center', padding: '40px', fontFamily: 'Prompt, sans-serif' }}>
            {isEn ? 'Loading places...' : 'กำลังโหลดข้อมูล...'}
          </div>
        ) : (
          <div className="results-grid">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place, index) => {
                const placeId = place.id || place.docId;
                const isAdded = (selectedPlaces || []).some(p => (p.id || p.docId) === placeId);

                return (
                  <div key={placeId} style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)', transition: `opacity 0.6s ease ${0.05 + index * 0.04}s, transform 0.6s ease ${0.05 + index * 0.04}s` }}>
                    <SwipeCard isAdded={isAdded} onSwipeRight={() => handleSwipeRightAdd(place)} onSwipeLeft={() => handleSwipeLeftRemove(place)}>
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
                {isEn ? 'No places found' : 'ไม่พบสถานที่'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}