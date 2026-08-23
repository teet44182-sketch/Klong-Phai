// src/pages/CheckInPoints.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import checkin from '../assets/checkin.jpg';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { db } from '../firebase';
import { 
  collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp,
  onSnapshot, query, orderBy
} from 'firebase/firestore';
import { sanitizeInput, compressImage } from '../App';
import { bannedWords } from '../utils/wordlist';

// ============================================================
// Utility: แปลง YouTube Watch URL เป็น Embed URL
// ============================================================
const getEmbedUrl = (url) => {
  if (!url) return null;
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com')) {
    return url;
  }
  return url;
};

// ============================================================
// Component: Slider สำหรับ PromotionCard
// ============================================================
function PromotionSlider({ image, videoUrl, title, lang }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    const items = [];
    if (image) {
      items.push({ type: 'image', url: image });
    }
    const embed = getEmbedUrl(videoUrl);
    if (embed) {
      items.push({ type: 'video', url: embed });
    }
    setSlides(items);
    setCurrentIndex(0);
  }, [image, videoUrl]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (slides.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: '1.1rem' }}>
        {lang === 'en' ? 'No media' : 'ไม่มีรูปภาพ/วิดีโอ'}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#111', minHeight: '340px' }}>
      {slides.map((slide, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: idx === currentIndex ? 1 : 0,
            transition: 'opacity 0.5s ease',
            pointerEvents: idx === currentIndex ? 'auto' : 'none',
          }}
        >
          {slide.type === 'image' ? (
            <img
              src={slide.url}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <iframe
              src={slide.url}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              title={title}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
            }}
          >
            ›
          </button>

          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 5,
          }}>
            {slides.map((_, idx) => (
              <span
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: idx === currentIndex ? '#00a854' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  transition: 'background 0.3s',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Component: PromotionCard
// ============================================================
function PromotionCard({ promo, lang, isAdmin, onEdit, onDelete }) {
  const isEn = lang === 'en';
  const title = isEn && promo.titleEn ? promo.titleEn : promo.title;
  const description = isEn && promo.descriptionEn ? promo.descriptionEn : promo.description;
  const hasCoords = (promo.lat && promo.lng) || (promo.coords && promo.coords.length === 2);

  const handleNavigate = (e) => {
    e.stopPropagation();
    let lat, lng;
    if (promo.coords && promo.coords.length === 2) {
      lat = promo.coords[0];
      lng = promo.coords[1];
    } else {
      lat = promo.lat;
      lng = promo.lng;
    }
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  const handleCardClick = () => {
    if (promo.link) {
      window.open(promo.link, '_blank');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        background: '#1a1a1a',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '2px solid transparent',
        backgroundImage: 'linear-gradient(#1a1a1a, #1a1a1a), linear-gradient(135deg, #00a854, #00d4a8, #00ff88)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 40px rgba(0,168,84,0.05)',
        marginBottom: '36px',
        cursor: promo.link ? 'pointer' : 'default',
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease',
        width: '100%',
        minHeight: '340px',
        position: 'relative',
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        if (promo.link) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 24px 72px rgba(0,0,0,0.8), 0 0 60px rgba(0,168,84,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.6), 0 0 40px rgba(0,168,84,0.05)';
      }}
    >
      {/* ด้านซ้าย: Slider (รูปภาพ + วิดีโอ) */}
      <div style={{ flex: '0 0 50%', maxWidth: '50%', minHeight: '340px', background: '#111', position: 'relative' }}>
        <PromotionSlider image={promo.image} videoUrl={promo.videoUrl} title={title} lang={lang} />
        
        {/* ปุ่ม Admin (Edit/Delete) */}
        {isAdmin && (
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 10 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(promo); }}
              style={{ background: 'rgba(0,0,0,0.8)', color: '#ffca28', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}
            >
              ✏️ {isEn ? 'Edit' : 'แก้ไข'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(promo); }}
              style={{ background: 'rgba(0,0,0,0.8)', color: '#ff4b4b', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', backdropFilter: 'blur(4px)' }}
            >
              🗑️ {isEn ? 'Delete' : 'ลบ'}
            </button>
          </div>
        )}

        {/* Badge พิกัด */}
        {hasCoords && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            color: '#00e87a',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            border: '1px solid rgba(0,168,84,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 5,
          }}>
             {isEn ? 'Location available' : 'มีพิกัดนำทาง'}
          </div>
        )}
      </div>

      {/* ด้านขวา: ข้อความ + ปุ่มนำทาง */}
      <div style={{ flex: 1, padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00e87a', fontSize: '1.8rem', marginBottom: '12px', fontWeight: '600', lineHeight: '1.3' }}>
          {title || (isEn ? 'Untitled' : 'ไม่มีชื่อ')}
        </h3>
        {description && (
          <p style={{ color: '#ddd', fontSize: '1.05rem', lineHeight: '1.8', marginBottom: '20px', whiteSpace: 'pre-line' }}>
            {description}
          </p>
        )}
        
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: 'auto', alignItems: 'center' }}>
          {promo.link && (
            <span style={{ color: '#00a854', fontWeight: 'bold', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              {isEn ? 'Learn more →' : 'ดูรายละเอียด →'}
            </span>
          )}
          
          {hasCoords && (
            <span
              onClick={handleNavigate}
              style={{
                color: '#00a854',
                fontWeight: '500',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                borderBottom: '1px solid transparent',
                marginLeft: 'auto'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderBottom = '1px solid #00a854';
                e.currentTarget.style.color = '#00e87a';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderBottom = '1px solid transparent';
                e.currentTarget.style.color = '#00a854';
              }}
            >
               {isEn ? 'Navigate' : 'นำทาง'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component (ส่วนที่เหลือเหมือนเดิม)
// ============================================================
export default function CheckInPoints({
  places = [],
  loading = false,
  onOpenMap,
  googleUser,
  handleGoogleLogin,
  handleGoogleLogout,
  reviewsData = {},
  lang,
  isAdmin = false,
}) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();

  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  const [isVisible, setIsVisible] = useState(false);

  // ===== Review States =====
  const [inputText, setInputText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const COOLDOWN_MS = 5000;

  const pageId = 'checkin_page';
  const pageReviews = reviewsData[pageId] || [];

  // ===== Promotion States =====
  const [promotions, setPromotions] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [newPromo, setNewPromo] = useState({
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    image: '',
    videoUrl: '',
    link: '',
    coordsInput: ''
  });
  const [promoImageFileName, setPromoImageFileName] = useState('');

  // ===== Crop States for Promo =====
  const [promoCropModal, setPromoCropModal] = useState({ isOpen: false, imageSrc: null });
  const promoCropperRef = useRef(null);

  // ===== Fetch Promotions =====
  useEffect(() => {
    const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPromotions(data);
    }, (error) => {
      console.error('Error fetching promotions:', error);
    });
    return () => unsubscribe();
  }, []);

  // ===== UI Visibility =====
  useEffect(() => {
    window.scrollTo(0, 0);
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // ===== Utility Functions =====
  const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const detectScriptInjection = (text) => {
    const patterns = [
      /<script/i, /javascript:/i, /onerror\s*=/i, /onload\s*=/i,
      /onclick\s*=/i, /onmouseover\s*=/i, /onfocus\s*=/i,
      /eval\s*\(/i, /document\./i, /window\./i,
      /alert\s*\(/i, /confirm\s*\(/i, /prompt\s*\(/i,
    ];
    return patterns.some(pattern => pattern.test(text));
  };

  // ============================================================
  // REVIEW FUNCTIONS (เหมือนเดิม)
  // ============================================================
  const validateReviewText = (text) => {
    const cleanText = sanitizeInput(text);
    if (cleanText.length < 2) {
      showToast(isEn ? "Review is too short (min 2 characters)" : "ข้อความสั้นเกินไป (ขั้นต่ำ 2 ตัวอักษร)");
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
      showToast(isEn ? "Failed to submit: " + error.message : "ไม่สามารถส่งรีวิวได้: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReview = async (review) => {
    const targetId = review.id || review.docId;
    if (!targetId) {
      showToast(isEn ? "Document ID not found" : "ไม่พบ ID");
      return;
    }
    if (!editText.trim()) {
      showToast(isEn ? "Please write something" : "กรุณาเขียนข้อความ");
      return;
    }
    if (googleUser && review.userId !== googleUser.uid) {
      showToast(isEn ? "You can only edit your own reviews" : "คุณสามารถแก้ไขได้เฉพาะรีวิวของคุณ");
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
      showToast(isEn ? "Failed to update: " + error.message : "ไม่สามารถแก้ไขได้: " + error.message);
    }
  };

  const handleDeleteReview = async (review) => {
    const targetId = review.id || review.docId || review._id;
    if (!targetId) {
      showToast(isEn ? "Comment ID not found" : "ไม่พบ ID");
      return;
    }
    if (googleUser && review.userId !== googleUser.uid) {
      showToast(isEn ? "You can only delete your own reviews" : "คุณสามารถลบได้เฉพาะรีวิวของคุณ");
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

  // ============================================================
  // PROMOTION FUNCTIONS (เหมือนเดิม ไม่ต้องแก้ เพราะใช้ image กับ videoUrl แยกกัน)
  // ============================================================
  const resetPromoForm = () => {
    setEditingPromoId(null);
    setPromoImageFileName('');
    setNewPromo({
      title: '',
      titleEn: '',
      description: '',
      descriptionEn: '',
      image: '',
      videoUrl: '',
      link: '',
      coordsInput: ''
    });
  };

  const handlePromoImageBrowse = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(isEn ? 'Please select an image file' : 'กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(isEn ? 'Image too large (max 5MB)' : 'รูปใหญ่เกินไป (สูงสุด 5MB)');
      return;
    }
    setPromoImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPromoCropModal({ isOpen: true, imageSrc: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handlePromoCropCancel = () => {
    setPromoCropModal({ isOpen: false, imageSrc: null });
    setPromoImageFileName('');
    const fileInput = document.querySelector('input[name="promoImage"]');
    if (fileInput) fileInput.value = '';
  };

  const handlePromoCropConfirm = async () => {
    const cropper = promoCropperRef.current?.cropper;
    if (!cropper) {
      showToast(isEn ? 'Cropper not ready' : 'ระบบ Crop ยังไม่พร้อม');
      return;
    }
    const canvas = cropper.getCroppedCanvas();
    if (!canvas) {
      showToast(isEn ? 'Failed to crop image' : 'ไม่สามารถตัดรูปได้');
      return;
    }
    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast(isEn ? 'Failed to process image' : 'ไม่สามารถประมวลผลรูปได้');
        return;
      }
      const croppedFile = new File([blob], 'promo-cropped.jpg', { type: 'image/jpeg' });
      try {
        const compressed = await compressImage(croppedFile, 1200, 0.7);
        setNewPromo(prev => ({ ...prev, image: compressed }));
        setPromoCropModal({ isOpen: false, imageSrc: null });
        showToast(isEn ? 'Cropped and compressed successfully!' : 'ครอบตัดและย่อรูปสำเร็จ!');
      } catch (err) {
        console.error(err);
        showToast(isEn ? 'Failed to process cropped image' : 'ไม่สามารถประมวลผลรูปที่ Crop ได้');
      }
    }, 'image/jpeg');
  };

  const handlePromoSubmit = async (e) => {
    e.preventDefault();

    const requiredTitle = isEn ? newPromo.titleEn : newPromo.title;
    if (!requiredTitle) {
      showToast(isEn ? 'Please enter a title' : 'กรุณากรอกชื่อเรื่อง');
      return;
    }
    if (!newPromo.image && !newPromo.videoUrl) {
      showToast(isEn ? 'Please provide an image or video' : 'กรุณาใส่รูปภาพหรือวิดีโอ');
      return;
    }

    let lat = null, lng = null;
    if (newPromo.coordsInput.trim()) {
      const parts = newPromo.coordsInput.split(',').map(s => s.trim());
      if (parts.length === 2) {
        const latNum = parseFloat(parts[0]);
        const lngNum = parseFloat(parts[1]);
        if (!isNaN(latNum) && !isNaN(lngNum)) {
          lat = latNum;
          lng = lngNum;
        }
      }
    }

    const payload = {
      title: newPromo.title || '',
      titleEn: newPromo.titleEn || '',
      description: newPromo.description || '',
      descriptionEn: newPromo.descriptionEn || '',
      image: newPromo.image || '',
      videoUrl: newPromo.videoUrl || '',
      link: newPromo.link || '',
      lat: lat,
      lng: lng,
      coords: (lat !== null && lng !== null) ? [lat, lng] : null,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingPromoId) {
        await updateDoc(doc(db, 'promotions', editingPromoId), payload);
        showToast(isEn ? 'Promotion updated!' : 'อัปเดตโปรโมทเรียบร้อย!');
      } else {
        await addDoc(collection(db, 'promotions'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast(isEn ? 'Promotion added!' : 'เพิ่มโปรโมทเรียบร้อย!');
      }
      setShowPromoModal(false);
      resetPromoForm();
    } catch (error) {
      console.error('Error saving promotion:', error);
      showToast(isEn ? 'Failed to save: ' + error.message : 'ไม่สามารถบันทึกได้: ' + error.message);
    }
  };

  const handleEditPromo = (promo) => {
    setEditingPromoId(promo.id);
    let lat = promo.lat || (promo.coords ? promo.coords[0] : null);
    let lng = promo.lng || (promo.coords ? promo.coords[1] : null);
    const coordsString = (lat !== null && lng !== null) ? `${lat}, ${lng}` : '';

    setNewPromo({
      title: promo.title || '',
      titleEn: promo.titleEn || '',
      description: promo.description || '',
      descriptionEn: promo.descriptionEn || '',
      image: promo.image || '',
      videoUrl: promo.videoUrl || '',
      link: promo.link || '',
      coordsInput: coordsString
    });
    setPromoImageFileName(promo.image ? 'มีรูปเดิม' : '');
    setShowPromoModal(true);
  };

  const handleDeletePromo = async (promo) => {
    if (!window.confirm(isEn ? `Delete promotion "${promo.title || promo.titleEn}"?` : `ลบโปรโมท "${promo.title || promo.titleEn}" ใช่หรือไม่?`)) return;
    try {
      await deleteDoc(doc(db, 'promotions', promo.id));
      showToast(isEn ? 'Promotion deleted!' : 'ลบโปรโมทเรียบร้อย!');
    } catch (error) {
      console.error('Error deleting promotion:', error);
      showToast(isEn ? 'Failed to delete' : 'ไม่สามารถลบได้');
    }
  };

  // ============================================================
  // RENDER (เหมือนเดิม)
  // ============================================================
  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      
      {/* HERO SECTION */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '45vh',
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
            filter: 'blur(8px) brightness(0.8)',
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
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(43, 43, 43, 0.85))',
          zIndex: 2
        }} />
        <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '0 20px', width: '100%' }}>
          <h1 className="page-title" style={{ 
            fontSize: '2.8rem',
            marginBottom: '12px',
            textShadow: '0 4px 20px rgba(0,0,0,0.7)',
            fontFamily: 'Mitr, sans-serif',
            color: '#ffffff',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease'
          }}>
            {isEn ? 'Interesting activites in Klongpai' : 'กิจกรรมน่าทำในคลองไผ่'}
          </h1>
          <p style={{ 
            color: '#ddd',
            margin: '0 0 20px 0',
            fontFamily: 'Prompt, sans-serif',
            fontSize: '1.1rem',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'opacity 0.8s ease 0.15s, transform 0.8s ease 0.15s'
          }}>
            {isEn 
              ? 'Discover the most popular activities in Klongpai' 
              : 'กิจกรรมยอดนิยมในคลองไผ่'}
          </p>
        </div>
      </div>

      {/* PROMOTIONS SECTION */}
      <div style={{ 
        maxWidth: '1126px',
        margin: '0 auto',
        padding: '40px 20px 20px 20px',
        width: '100%'
      }}>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <button
              onClick={() => { resetPromoForm(); setShowPromoModal(true); }}
              style={{
                background: '#00a854',
                color: '#fff',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '30px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: 'Mitr, sans-serif',
                boxShadow: '0 4px 16px rgba(0,168,84,0.4)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#008743'}
              onMouseOut={(e) => e.currentTarget.style.background = '#00a854'}
            >
              + {isEn ? 'Add Promotion' : 'เพิ่มโปรโมท'}
            </button>
          </div>
        )}

        {promotions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', fontSize: '1.1rem' }}>
            {isEn ? 'No promotions yet. Stay tuned!' : 'ยังไม่มีโปรโมทในขณะนี้'}
          </div>
        ) : (
          <div style={{ marginBottom: '40px' }}>
            {promotions.map((promo) => (
              <PromotionCard
                key={promo.id}
                promo={promo}
                lang={currentLang}
                isAdmin={isAdmin}
                onEdit={handleEditPromo}
                onDelete={handleDeletePromo}
              />
            ))}
          </div>
        )}
      </div>

      {/* REVIEW SECTION (เหมือนเดิม) */}
      <div className="page-container" style={{ 
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 20px 60px 20px',
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '30px',
          borderRadius: '16px',
          color: '#eee',
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

      {/* MODAL: ADD/EDIT PROMOTION (เหมือนเดิม) */}
      {showPromoModal && (
        <div className="map-modal-overlay active" style={{ zIndex: 2200 }} onClick={() => { setShowPromoModal(false); resetPromoForm(); }}>
          <div className="map-modal-content" style={{ backgroundColor: '#1e1e1e', color: '#fff', maxWidth: '760px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#ffe76c', margin: 0, fontSize: '1.3rem' }}>
                {editingPromoId ? (isEn ? 'Edit Promotion' : 'แก้ไขโปรโมท') : (isEn ? 'Add Promotion' : 'เพิ่มโปรโมท')}
              </h2>
              <button onClick={() => { setShowPromoModal(false); resetPromoForm(); }} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.8rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handlePromoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder={isEn ? 'Title (Thai) *' : 'ชื่อเรื่อง (ไทย) *'}
                value={newPromo.title}
                onChange={e => setNewPromo(prev => ({ ...prev, title: e.target.value }))}
                required={!isEn}
                style={{ padding: '10px 12px', background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', width: '100%' }}
              />
              <input
                type="text"
                placeholder={isEn ? 'Title (English) *' : 'ชื่อเรื่อง (อังกฤษ)'}
                value={newPromo.titleEn}
                onChange={e => setNewPromo(prev => ({ ...prev, titleEn: e.target.value }))}
                required={isEn}
                style={{ padding: '10px 12px', background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', width: '100%' }}
              />
              <textarea
                placeholder={isEn ? 'Description (Thai)' : 'คำอธิบาย (ไทย)'}
                value={newPromo.description}
                onChange={e => setNewPromo(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                style={{ padding: '10px 12px', background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', resize: 'none', width: '100%' }}
              />
              <textarea
                placeholder={isEn ? 'Description (English)' : 'คำอธิบาย (อังกฤษ)'}
                value={newPromo.descriptionEn}
                onChange={e => setNewPromo(prev => ({ ...prev, descriptionEn: e.target.value }))}
                rows="3"
                style={{ padding: '10px 12px', background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', resize: 'none', width: '100%' }}
              />

              <div>
                <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Main Image' : 'รูปภาพหลัก'}
                </label>
                <input
                  type="file"
                  name="promoImage"
                  accept="image/*"
                  onChange={handlePromoImageBrowse}
                  style={{ padding: '6px', background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem', width: '100%' }}
                />
                {newPromo.image && (
                  <div style={{ position: 'relative', marginTop: '8px' }}>
                    <img src={newPromo.image} alt="Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '6px' }} />
                    <button
                      type="button"
                      onClick={() => setNewPromo(prev => ({ ...prev, image: '' }))}
                      style={{ position: 'absolute', top: '4px', right: '4px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <input
                type="url"
                placeholder={isEn ? 'Video URL (YouTube/Vimeo embed)' : 'URL วิดีโอ (YouTube/Vimeo embed)'}
                value={newPromo.videoUrl}
                onChange={e => setNewPromo(prev => ({ ...prev, videoUrl: e.target.value }))}
                style={{ padding: '10px 12px', background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', width: '100%' }}
              />

              <input
                type="url"
                placeholder={isEn ? 'Link (e.g., /detail/xxx or https://...)' : 'ลิงก์ (เช่น /detail/xxx หรือ https://...)'}
                value={newPromo.link}
                onChange={e => setNewPromo(prev => ({ ...prev, link: e.target.value }))}
                style={{ padding: '10px 12px', background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', width: '100%' }}
              />

              <input
                type="text"
                placeholder={isEn ? 'Coordinates (e.g., 14.872085, 101.569337)' : 'พิกัด (เช่น 14.872085, 101.569337)'}
                value={newPromo.coordsInput}
                onChange={e => setNewPromo(prev => ({ ...prev, coordsInput: e.target.value }))}
                style={{ padding: '10px 12px', background: '#2b2d31', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', width: '100%' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowPromoModal(false); resetPromoForm(); }} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {isEn ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button type="submit" style={{ background: '#ffe76c', color: '#3b3a3b', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editingPromoId ? (isEn ? 'Save' : 'บันทึก') : (isEn ? 'Add' : 'เพิ่ม')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CROP MODAL (เหมือนเดิม) */}
      {promoCropModal.isOpen && (
        <div 
          className="map-modal-overlay active" 
          style={{ zIndex: 2500, padding: '20px', alignItems: 'center', justifyContent: 'center' }} 
          onClick={handlePromoCropCancel}
        >
          <div 
            className="map-modal-content" 
            style={{ 
              backgroundColor: '#1e1e1e', 
              color: '#fff', 
              maxWidth: '90vw', 
              maxHeight: '90vh', 
              width: '100%', 
              padding: '20px', 
              border: '1px solid rgba(255,255,255,0.1)', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: '16px'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#ffe76c', marginBottom: '16px', fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}>
              {isEn ? 'Crop Image' : 'ครอบตัดรูปภาพ'}
            </h2>
            
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              background: '#111', 
              borderRadius: '12px', 
              padding: '8px', 
              minHeight: '300px',
              maxHeight: '60vh',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <Cropper
                ref={promoCropperRef}
                src={promoCropModal.imageSrc}
                style={{ height: '100%', width: '100%' }}
                aspectRatio={16 / 9}
                guides={true}
                viewMode={1}
                autoCropArea={0.8}
                background={false}
                responsive={true}
                checkOrientation={false}
                toggleDragModeOnDblclick={false}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={handlePromoCropCancel} 
                style={{ 
                  background: '#6c757d', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  flex: 1,
                  minWidth: '80px',
                  fontSize: '0.9rem'
                }}
              >
                {isEn ? 'Cancel' : 'ยกเลิก'}
              </button>
              <button 
                type="button" 
                onClick={handlePromoCropConfirm} 
                style={{ 
                  background: '#00a854', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  flex: 1,
                  minWidth: '80px',
                  fontSize: '0.9rem'
                }}
              >
                {isEn ? 'Crop & Confirm' : 'ตัดและยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}