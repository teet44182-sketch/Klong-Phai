// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';

// Component สลับภาษา
import LangSwitcherText from './components/LangSwitcherText'; 

// Firebase Modules
import { auth, db, loginWithGoogle, logout } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs,
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  setDoc, 
  increment, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';

// Pages
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Accommodation from './pages/Accommodation';
import CommunityMap from './pages/CommunityMap';
import CheckInPoints from './pages/CheckInPoints';
import Detail from './pages/Detail';

// Modals
import MapModal from './components/MapModal';

// รายชื่อ Admin Emails
const ADMIN_EMAILS = ['Teet44182@gmail.com'];

export default function App() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'th').startsWith('th') ? 'th' : 'en';

  // State Auth & Admin
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // State สำหรับเก็บข้อมูลสถานที่จาก Firestore
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  // State UI & Modals
  const [modalInfo, setModalInfo] = useState({ isOpen: false, url: '' });
  const [detailModal, setDetailModal] = useState({ isOpen: false, placeData: null });
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false); // Modal สำหรับ Admin เพิ่มสถานที่
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isFilterDropdownActive, setIsFilterDropdownActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State ฟอร์มเพิ่มสถานที่ (Admin)
  const [newPlace, setNewPlace] = useState({
    title: '',
    title_en: '',
    description: '',
    detailDescription: '',
    img: '',
    category: 'checkin', // checkin, restaurant, accommodation
    mapUrl: '',
    workingHours: '',
    phone: ''
  });

  // State Likes & Reviews
  const [likes, setLikes] = useState({});
  const [reviewsData, setReviewsData] = useState({});
  const [inputText, setInputText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState('');

  const bannedWords = ["ควย", "เย็ด", "มึง", "กู", "สัส", "เหี้ย", "ค_ย", "เ_ยด", "ดกทอง"];
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // 1. ตรวจสอบสถานะ Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        const isUserAdmin = ADMIN_EMAILS.some(
          email => email.toLowerCase() === currentUser.email.toLowerCase()
        );
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. ดึงข้อมูลสถานที่ (places) จาก Firebase Firestore แบบ Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "places"), (snapshot) => {
      const placesList = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setPlaces(placesList);
      setLoadingPlaces(false);
    }, (error) => {
      console.error("Error fetching places real-time:", error);
      setLoadingPlaces(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. ดึง Likes
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "likes"), (snapshot) => {
      const likesMap = {};
      snapshot.docs.forEach(docSnap => {
        likesMap[docSnap.id] = docSnap.data().count || 0;
      });
      setLikes(likesMap);
    });
    return () => unsubscribe();
  }, []);

  // 4. ดึง Reviews
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allReviews = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const grouped = {};
      allReviews.forEach(review => {
        if (!grouped[review.placeId]) grouped[review.placeId] = [];
        grouped[review.placeId].push(review);
      });
      setReviewsData(grouped);
    });
    return () => unsubscribe();
  }, []);

  // Handlers Login / Logout
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login Handle Error:", error);
      alert(`ไม่สามารถเข้าสู่ระบบได้ (${error.code || error.message})`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Admin Add Place Handler
  const handleAddPlaceSubmit = async (e) => {
    e.preventDefault();
    if (!newPlace.title || !newPlace.img) {
      alert("กรุณากรอกชื่อสถานที่และใส่ URL รูปภาพหลักครับ");
      return;
    }

    try {
      await addDoc(collection(db, "places"), {
        ...newPlace,
        createdAt: serverTimestamp()
      });
      alert("เพิ่มสถานที่เรียบร้อยแล้ว!");
      setIsAddPlaceModalOpen(false);
      setNewPlace({
        title: '',
        title_en: '',
        description: '',
        detailDescription: '',
        img: '',
        category: 'checkin',
        mapUrl: '',
        workingHours: '',
        phone: ''
      });
    } catch (error) {
      console.error("Error adding place:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกสถานที่");
    }
  };

  // Like Toggle
  const handleLike = async (placeId) => {
    const isLiked = localStorage.getItem(`like_${placeId}`) === 'true';
    const likeDocRef = doc(db, "likes", String(placeId));
    const delta = isLiked ? -1 : 1;

    try {
      await setDoc(likeDocRef, { count: increment(delta) }, { merge: true });
      localStorage.setItem(`like_${placeId}`, isLiked ? 'false' : 'true');
    } catch (error) {
      console.error("Like failed:", error);
    }
  };

  // Admin Place Handlers
  const handleEditPlace = (place) => {
    alert(`[Admin Action] แก้ไขสถานที่: ${place.nameEn || place.name || place.title}`);
  };

  const handleDeletePlace = async (place) => {
    const placeTitle = place.nameEn || place.name || place.title;
    if (window.confirm(`[Admin Confirm] คุณต้องการลบสถานที่ "${placeTitle}" ใช่หรือไม่?`)) {
      try {
        await deleteDoc(doc(db, "places", String(place.id)));
        alert("ลบสถานที่เรียบร้อยแล้ว");
      } catch (error) {
        console.error("Error deleting place:", error);
        alert("เกิดข้อผิดพลาดในการลบสถานที่");
      }
    }
  };

  // Review Validation
  const validateReviewText = (text) => {
    const cleanText = text.trim();
    if (cleanText.length < 2) {
      alert(t('alert_short', 'ข้อความรีวิวสั้นเกินไปครับ'));
      return false;
    }
    if (cleanText.length > 200) {
      alert(t('alert_long', 'ข้อความรีวิวต้องไม่เกิน 200 ตัวอักษรครับ'));
      return false;
    }
    const textLower = cleanText.toLowerCase();
    if (bannedWords.some(word => textLower.includes(word))) {
      alert(t('alert_banned', 'ข้อความของคุณมีคำไม่เหมาะสม กรุณาแก้ไขก่อนส่งครับ'));
      return false;
    }
    return cleanText;
  };

  const handleReviewSubmit = async (e, placeId) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const validatedText = validateReviewText(inputText);
    if (!validatedText) return;

    try {
      await addDoc(collection(db, "reviews"), {
        placeId: String(placeId),
        name: user.displayName,
        userPhoto: user.photoURL,
        text: validatedText,
        userId: String(user.uid).trim(),
        createdAt: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      console.error("Error saving review:", error);
    }
  };

  const handleUpdateReview = async (review) => {
    const targetId = review.id || review.docId;
    if (!targetId || !editText.trim()) return;

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
    }
  };

  const handleDeleteReview = async (review) => {
    const targetId = review.id || review.docId || review._id;
    if (!targetId) return;

    if (!window.confirm(t('confirm_delete', 'คุณต้องการลบคอมเมนต์รีวิวนี้ใช่หรือไม่?'))) return;

    try {
      await deleteDoc(doc(db, "reviews", targetId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const openMap = (url) => setModalInfo({ isOpen: true, url });
  const closeMap = () => setModalInfo({ isOpen: false, url: '' });
  const openDetail = (place) => { setDetailModal({ isOpen: true, placeData: place }); setGalleryIndex(0); };
  const handleLanguageChange = (nextLang) => i18n.changeLanguage(nextLang);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsFilterDropdownActive(false);
      setIsMobileMenuOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <Router>
      <nav className="navbar">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}><span>#</span> {t('brand_title', 'คลองไผ่')}</Link>

        <button
          className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(prev => !prev); }}
          aria-label="เปิด/ปิดเมนู"
        >
          <span /><span /><span />
        </button>

        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" onClick={closeMobileMenu}>{t('nav_home', 'หน้าแรก')}</Link>
          <div className={`dropdown ${isFilterDropdownActive ? 'active' : ''}`}>
            <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setIsFilterDropdownActive(!isFilterDropdownActive); }}>
              {t('nav_restaurant_acc', 'ร้านอาหาร / ที่พัก')}
            </button>
            <div className="dropdown-content">
              <Link to="/restaurant" onClick={() => { setIsFilterDropdownActive(false); closeMobileMenu(); }}> {t('nav_restaurant', 'ร้านอาหาร')}</Link>
              <Link to="/accommodation" onClick={() => { setIsFilterDropdownActive(false); closeMobileMenu(); }}> {t('nav_accommodation', 'ที่พัก')}</Link>
            </div>
          </div>
          <Link to="/checkin" style={{ textDecoration: 'none', fontSize: '14px', color: '#ddd' }} onClick={closeMobileMenu}>{t('nav_top10', '10 จุดเช็คอิน')}</Link>
          <Link to="/map" onClick={closeMobileMenu}>{t('nav_map', 'แผนที่ชุมชน')}</Link>

          {/* 🌟 ปุ่ม Admin: แสดงเฉพาะเมื่อเป็น Admin */}
          {isAdmin && (
            <button 
              onClick={() => setIsAddPlaceModalOpen(true)}
              style={{ background: '#ff9800', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              ➕ เพิ่มสถานที่
            </button>
          )}

          {/* 🟢 ปุ่มวางแผนการเดินทาง */}
          <Link 
            to="/map" 
            className="plan-btn"
            onClick={closeMobileMenu}
            style={{
              background: '#00a854',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: '25px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0, 168, 84, 0.4)'
            }}
          >
            {t('nav_plan', 'วางแผนการเดินทาง')}
          </Link>

          <div onClick={(e) => e.stopPropagation()}>
            <LangSwitcherText lang={currentLang} onLangChange={handleLanguageChange} />
          </div>
        </div>
      </nav>

      {/* 🌟 ส่ง places และ loadingPlaces ไปยังทุก Router Page */}
      <Routes>
        <Route path="/" element={<Home places={places} loading={loadingPlaces} onOpenMap={openDetail} likes={likes} onLike={handleLike} lang={currentLang} />} />
        <Route path="/checkin" element={
          <CheckInPoints 
            places={places}
            loading={loadingPlaces}
            onOpenMap={openDetail} 
            likes={likes} 
            onLike={handleLike} 
            googleUser={user} 
            handleGoogleLogin={handleLogin} 
            handleGoogleLogout={handleLogout} 
            reviewsData={reviewsData} 
            lang={currentLang}
            isAdmin={isAdmin}              
            onEditPlace={handleEditPlace}  
            onDeletePlace={handleDeletePlace}
          />
        } />
        <Route path="/restaurant" element={<Restaurant places={places} loading={loadingPlaces} onOpenMap={openDetail} likes={likes} onLike={handleLike} lang={currentLang} />} />
        <Route path="/accommodation" element={<Accommodation places={places} loading={loadingPlaces} onOpenMap={openDetail} likes={likes} onLike={handleLike} lang={currentLang} />} />
        <Route path="/map" element={<CommunityMap places={places} loading={loadingPlaces} lang={currentLang} />} />
        <Route path="/detail/:id" element={<Detail places={places} loading={loadingPlaces} onOpenMap={openMap} lang={currentLang} />} />
      </Routes>

      <MapModal isOpen={modalInfo.isOpen} mapUrl={modalInfo.url} onClose={closeMap} zIndex={9999} />

      {/* 🌟 Modal สำหรับ Admin เพิ่มสถานที่ใหม่ */}
      {isAddPlaceModalOpen && (
        <div className="map-modal-overlay active" style={{ zIndex: 3000 }} onClick={() => setIsAddPlaceModalOpen(false)}>
          <div className="map-modal-content" style={{ background: '#222', color: '#fff', padding: '25px', maxWidth: '500px', borderRadius: '12px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#ff9800', marginTop: 0 }}>➕ เพิ่มสถานที่ใหม่ (Admin)</h3>
            <form onSubmit={handleAddPlaceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
              <input type="text" placeholder="ชื่อสถานที่ (ภาษาไทย) *" value={newPlace.title} onChange={(e) => setNewPlace({...newPlace, title: e.target.value})} required style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }} />
              <input type="text" placeholder="ชื่อสถานที่ (English)" value={newPlace.title_en} onChange={(e) => setNewPlace({...newPlace, title_en: e.target.value})} style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }} />
              
              <select value={newPlace.category} onChange={(e) => setNewPlace({...newPlace, category: e.target.value})} style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}>
                <option value="checkin">10 จุดเช็คอิน</option>
                <option value="restaurant">ร้านอาหาร</option>
                <option value="accommodation">ที่พัก</option>
              </select>

              <input type="url" placeholder="URL รูปภาพหลัก *" value={newPlace.img} onChange={(e) => setNewPlace({...newPlace, img: e.target.value})} required style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }} />
              <textarea placeholder="คำอธิบายสั้นๆ" value={newPlace.description} onChange={(e) => setNewPlace({...newPlace, description: e.target.value})} rows="2" style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px', resize: 'none' }} />
              <textarea placeholder="รายละเอียดเชิงลึก" value={newPlace.detailDescription} onChange={(e) => setNewPlace({...newPlace, detailDescription: e.target.value})} rows="3" style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px', resize: 'none' }} />
              <input type="text" placeholder="เวลาทำการ (เช่น 08:00 - 17:00)" value={newPlace.workingHours} onChange={(e) => setNewPlace({...newPlace, workingHours: e.target.value})} style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }} />
              <input type="text" placeholder="เบอร์โทรศัพท์" value={newPlace.phone} onChange={(e) => setNewPlace({...newPlace, phone: e.target.value})} style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }} />
              <input type="url" placeholder="Google Maps URL" value={newPlace.mapUrl} onChange={(e) => setNewPlace({...newPlace, mapUrl: e.target.value})} style={{ padding: '8px', background: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddPlaceModalOpen(false)} style={{ background: '#666', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" style={{ background: '#ff9800', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>บันทึกสถานที่</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <div 
        className={`map-modal-overlay ${detailModal.isOpen ? 'active' : ''}`}
        style={{ zIndex: 2100 }} 
        onClick={() => { setDetailModal({ isOpen: false, placeData: null }); setEditingReviewId(null); }}
      >
        <div 
          className="map-modal-content"
          style={{ backgroundColor: '#2b2b2b', color: '#fff', maxWidth: '550px', padding: '0', maxHeight: '85vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', scrollbarWidth: 'thin' }}
          onClick={(e) => e.stopPropagation()} 
        >
          {detailModal.placeData && (
            <div>
              {(() => {
                const images = [detailModal.placeData.img, ...(detailModal.placeData.gallery || [])];
                const total = images.length;
                
                const placeTitle = currentLang === 'en' && detailModal.placeData.title_en 
                  ? detailModal.placeData.title_en 
                  : (detailModal.placeData.name || detailModal.placeData.title);

                const placeDetailDesc = currentLang === 'en' && detailModal.placeData.detailDescription_en
                  ? detailModal.placeData.detailDescription_en
                  : (detailModal.placeData.detailDescription || detailModal.placeData.detail || t('no_detail_info', 'ไม่มีข้อมูลรายละเอียดเพิ่มเติมในขณะนี้'));

                const placeWorkingHours = currentLang === 'en' && detailModal.placeData.workingHours_en
                  ? detailModal.placeData.workingHours_en
                  : detailModal.placeData.workingHours;

                return (
                  <div>
                    <div style={{ width: '100%', height: '220px', position: 'relative', overflow: 'hidden', background: '#111' }}>
                      <img
                        key={galleryIndex}
                        src={images[galleryIndex]}
                        alt={`${placeTitle} ${galleryIndex + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 0.3s ease' }}
                      />

                      {total > 1 && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setGalleryIndex(i => (i - 1 + total) % total); }}
                            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                          >‹</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setGalleryIndex(i => (i + 1) % total); }}
                            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
                          >›</button>

                          <div style={{ position: 'absolute', bottom: '38px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
                            {images.map((_, i) => (
                              <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setGalleryIndex(i); }}
                                style={{ width: '7px', height: '7px', borderRadius: '50%', border: 'none', background: i === galleryIndex ? '#ffffff' : 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0 }}
                              />
                            ))}
                          </div>

                          <div style={{ position: 'absolute', top: '10px', left: '12px', background: 'rgba(0,0,0,0.55)', padding: '2px 9px', borderRadius: '10px', fontSize: '0.72rem', color: '#fff', zIndex: 2 }}>
                            {galleryIndex + 1} / {total}
                          </div>
                        </>
                      )}

                      <div style={{ position: 'absolute', bottom: '10px', right: '15px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', zIndex: 2 }}>
                        {likes[detailModal.placeData.id] || 0} {t('like_label', 'ถูกใจ')}
                      </div>

                      <span className="map-modal-close" style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', top: '10px', right: '15px', zIndex: 3 }} onClick={() => setDetailModal({ isOpen: false, placeData: null })}>&times;</span>
                    </div>

                    <div style={{ padding: '25px' }}>
                      <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '15px' }}>{placeTitle}</h2>
                      <p style={{ fontSize: '0.95rem', color: '#ddd', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-line' }}>{placeDetailDesc}</p>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {placeWorkingHours && <div><b>{t('label_hours', 'เวลาทำการ:')}</b> {placeWorkingHours}</div>}
                        {detailModal.placeData.phone && <div><b>{t('label_phone', 'เบอร์โทรศัพท์:')}</b> {detailModal.placeData.phone}</div>}
                      </div>

                      <div style={{ marginTop: '25px', textAlign: 'center', marginBottom: '25px' }}>
                        <button style={{ background: '#00a854', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '50px', fontFamily: 'Mitr, sans-serif', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => openMap(detailModal.placeData.mapUrl)}>
                          {t('btn_nav_map', 'ดูแผนที่นำทาง')}
                        </button>
                      </div>

                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', margin: 0, fontSize: '1.1rem' }}>{t('reviews_title', 'รีวิวจากผู้เข้าชม')}</h3>
                          {user && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#aaa' }}>
                                <img src={user.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                                <span>{user.displayName}</span>
                              </div>
                              <button type="button" onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'Prompt, sans-serif' }}>
                                {t('logout', 'ออกจากระบบ')}
                              </button>
                            </div>
                          )}
                        </div>

                        {user ? (
                          <form onSubmit={(e) => handleReviewSubmit(e, detailModal.placeData.id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            <textarea placeholder={t('checkin_placeholder', 'เขียนคอมเมนต์ที่นี่...')} value={inputText} onChange={(e) => setInputText(e.target.value)} required rows="2" maxLength={200} style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none', resize: 'none', lineHeight: '1.5', fontFamily: 'Prompt, sans-serif' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: '#888' }}>{inputText.length}/200 {t('chars_limit', 'ตัวอักษร')}</span>
                              <button type="submit" style={{ background: '#00a854', color: '#fff', padding: '8px 20px', border: 'none', borderRadius: '50px', fontFamily: 'Mitr, sans-serif', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>{t('btn_submit_review', 'ส่งรีวิว')}</button>
                            </div>
                          </form>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                            <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 12px 0' }}>{t('login_prompt', 'กรุณาเข้าสู่ระบบกูเกิลเพื่อยืนยันตัวตนก่อนส่งคอมเมนต์รีวิว')}</p>
                            <button type="button" onClick={handleLogin} style={{ background: '#fff', color: '#222', padding: '8px 16px', border: 'none', borderRadius: '4px', fontFamily: 'Mitr, sans-serif', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{t('google_login', 'Sign in with Google')}</button>
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {!(reviewsData[detailModal.placeData.id]) || reviewsData[detailModal.placeData.id].length === 0 ? (
                            <p style={{ color: '#777', textAlign: 'center', fontSize: '0.85rem', fontStyle: 'italic' }}>{t('no_reviews', 'ยังไม่มีคอมเมนต์ เขียนรีวิวเป็นคนแรกเลย!')}</p>
                          ) : (
                            reviewsData[detailModal.placeData.id].map((review) => {
                              const reviewId = review.id || review.docId;
                              const isOwner = user && String(user.uid).trim() === String(review.userId).trim();

                              return (
                                <div key={reviewId || Math.random()} style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {review.userPhoto && <img src={review.userPhoto} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />}
                                      <strong style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'Prompt, sans-serif' }}>{review.name}</strong>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      {(isOwner || isAdmin) && editingReviewId !== reviewId && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          {isOwner && (
                                            <button onClick={() => { setEditingReviewId(reviewId); setEditText(review.text); }} style={{ background: 'none', border: 'none', color: '#ffb300', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Prompt, sans-serif', padding: 0 }}>{t('edit', 'แก้ไข')}</button>
                                          )}
                                          <button onClick={() => handleDeleteReview(review)} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Prompt, sans-serif', padding: 0 }}>{t('delete', 'ลบ')}</button>
                                        </div>
                                      )}
                                      <span style={{ color: '#666', fontSize: '0.75rem' }}>
                                        {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'th-TH') : t('sending', 'กำลังส่ง...')}
                                      </span>
                                    </div>
                                  </div>

                                  {editingReviewId === reviewId ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '5px' }}>
                                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={200} rows="2" style={{ padding: '8px', background: '#333', border: '1px solid #555', borderRadius: '4px', color: '#fff', fontSize: '0.85rem', width: '100%', resize: 'none', fontFamily: 'Prompt, sans-serif' }} />
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#888' }}>{editText.length}/200 {t('chars_limit', 'ตัวอักษร')}</span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                          <button onClick={() => setEditingReviewId(null)} style={{ background: '#666', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>{t('cancel', 'ยกเลิก')}</button>
                                          <button onClick={() => handleUpdateReview(review)} style={{ background: '#00a854', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>{t('save', 'บันทึก')}</button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p style={{ margin: 0, color: '#ccc', fontSize: '0.85rem', whiteSpace: 'pre-line', lineHeight: '1.5', paddingLeft: review.userPhoto ? '32px' : '0' }}>
                                      {review.text}
                                    </p>
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
              })()}
            </div>
          )}
        </div>
      </div>
    </Router>
  );
}