// src/App.jsx
import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import './App.css';

import Cropper from 'react-cropper';
import { bannedWords } from './utils/wordlist';
import LangSwitcherText from './components/LangSwitcherText';
import FloatingTripBasket from './components/FloatingTripBasket';
import ScrollProgress from './components/ScrollProgress';
import SkeletonCard from './components/SkeletonCard';
import Footer from './components/Footer';
import Card from './components/Card';
import { auth, db, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  increment,
  deleteDoc,
  updateDoc,
  writeBatch,
  getDocs,
  where
} from 'firebase/firestore';

import StarRating from './components/StarRating';
import StarDisplay from './components/StarDisplay';
import { checkRateLimit, setRateLimit } from './utils/rateLimit';
import { trackNavigationClick, submitRating, recalculatePlaceRating } from './utils/analytics';

// Lazy Loading
const Home = lazy(() => import('./pages/Home'));
const Restaurant = lazy(() => import('./pages/Restaurant'));
const Accommodation = lazy(() => import('./pages/Accommodation'));
const CommunityMap = lazy(() => import('./pages/CommunityMap'));
const CheckInPoints = lazy(() => import('./pages/CheckInPoints'));
const Detail = lazy(() => import('./pages/Detail'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));
const Attractions = lazy(() => import('./pages/Attractions'));

import { ToastProvider, useToast } from './context/ToastContext';

const ADMIN_EMAILS = [
  'teet44182@gmail.com',
  'klongpaitravel@gmail.com',
  'admin2@gmail.com',
  'adisonbb2@gmail.com',
  'pppurpg@gmail.com',
  'monsichasungsanit@gmail.com',
  'khunyoi16@gmail.com'
];

// ============================================================
// ✅ PageViewTracker – บันทึกยอดเข้าชม (รวม + รายวัน) + นับรีเฟรช
// ============================================================
function PageViewTracker() {
  const location = useLocation();
  const lastTracked = useRef({ path: '', time: 0 });

  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    const now = Date.now();

    if (lastTracked.current.path === currentPath && now - lastTracked.current.time < 2000) {
      return;
    }

    lastTracked.current.path = currentPath;
    lastTracked.current.time = now;

    const track = async () => {
      try {
        const page = location.pathname || '/';
        const nowDate = new Date();
        const todayStr = nowDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

        const batch = writeBatch(db);

        const totalRef = doc(db, 'analytics', 'pageViews');
        batch.set(totalRef, {
          [page]: increment(1),
          total: increment(1),
          lastUpdated: serverTimestamp()
        }, { merge: true });

        const dailyRef = doc(db, 'dailyViews', todayStr);
        batch.set(dailyRef, {
          [page]: increment(1),
          total: increment(1),
          lastUpdated: serverTimestamp()
        }, { merge: true });

        await batch.commit();
        console.log(`✅ Analytics: ${page} (${todayStr})`);
      } catch (e) {
        console.warn('Analytics tracking error:', e);
      }
    };
    track();
  }, [location.pathname, location.search, location.hash]);

  return null;
}

// ============================================================
// Utility functions
// ============================================================
export const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const sanitizeInput = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

const parseIframeUrl = (input) => {
  if (!input) return '';
  if (typeof input !== 'string') return '';

  if (input.includes('<iframe') || input.includes('iframe')) {
    let match = input.match(/src\s*=\s*["']([^"']+)["']/i);
    if (match) return match[1];
    match = input.match(/src\s*=\s*([^\s>]+)/i);
    if (match) return match[1];
  }

  if (input.includes('google.com/maps/embed')) return input;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  if (input.startsWith('//')) return `https:${input}`;

  return input;
};

const extractCoordsFromUrl = (url) => {
  if (!url) return null;
  const cleanUrl = parseIframeUrl(url);

  const qMatch = cleanUrl.match(/[?&]q=([^&]+)/i);
  if (qMatch) {
    let q = decodeURIComponent(qMatch[1]).replace(/%2C/g, ',');
    const coordsMatch = q.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (coordsMatch) {
      return [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])];
    }
  }

  const embedMatch = cleanUrl.match(/!2d([^!]+)!3d([^!]+)/i);
  if (embedMatch) {
    return [parseFloat(embedMatch[2]), parseFloat(embedMatch[1])];
  }

  const embedMatch2 = cleanUrl.match(/!3d([^!]+)!2d([^!]+)/i);
  if (embedMatch2) {
    return [parseFloat(embedMatch2[1]), parseFloat(embedMatch2[2])];
  }

  const atMatch = cleanUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/i);
  if (atMatch) {
    return [parseFloat(atMatch[1]), parseFloat(atMatch[2])];
  }

  const centerMatch = cleanUrl.match(/[?&]center=([^&]+)/i);
  if (centerMatch) {
    const center = decodeURIComponent(centerMatch[1]);
    const coordsMatch = center.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (coordsMatch) {
      return [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])];
    }
  }

  return null;
};

const getPlaceCoords = (place) => {
  if (!place) return null;

  if (Array.isArray(place.coords) && place.coords.length === 2) {
    return [parseFloat(place.coords[0]), parseFloat(place.coords[1])];
  }

  const lat = parseFloat(place.lat || place.latitude);
  const lng = parseFloat(place.lng || place.longitude);
  if (!isNaN(lat) && !isNaN(lng)) {
    return [lat, lng];
  }

  if (place.mapUrl) {
    return extractCoordsFromUrl(place.mapUrl);
  }

  return null;
};

// ✅ ตรวจจับ Genre จากชื่อ
const detectGenreFromName = (name) => {
  if (!name) return 'other';
  const n = name.toLowerCase().trim();

  if (n.includes('cook & coff') || n.includes('coff') || n.includes('cafe') || n.includes('กาแฟ')) return 'cafe';
  if (n.includes('วัด') || n.includes('ที่พักสงฆ์') || n.includes('พระพุทธบาท') || n.includes('temple')) return 'temple';
  if (n.includes('sup') || n.includes('ล่อง') || n.includes('พิชิต') || n.includes('ปีน') || n.includes('เดินป่า') || n.includes('ยอดเขา') || n.includes('nature')) return 'nature_activity';
  if (n.includes('ทัณฑสถาน') || n.includes('เรือนจำ') || n.includes('ราชทัณฑ์') || n.includes('ฝึกอบรม') || n.includes('prison') || n.includes('training')) return 'government_training';
  if (n.includes('อนุรักษ์') || n.includes('ศูนย์') || n.includes('conservation') || n.includes('learning')) return 'conservation';
  if (n.includes('สถานีรถไฟ') || n.includes('สถานี') || n.includes('station')) return 'transport';
  if (n.includes('เรือนจำท่องเที่ยว') || n.includes('tourist prison') || n.includes('new')) return 'new_attraction';
  
  return 'other';
};

const GENRE_OPTIONS = [
  { value: 'other', label: 'อื่นๆ' },
  { value: 'cafe', label: 'คาเฟ่และร้านอาหาร' },
  { value: 'temple', label: 'วัดและศาสนสถาน' },
  { value: 'nature_activity', label: 'ธรรมชาติและกิจกรรม' },
  { value: 'government_training', label: 'ราชการและฝึกอบรม' },
  { value: 'conservation', label: 'ศูนย์อนุรักษ์และศึกษา' },
  { value: 'transport', label: 'การคมนาคม' },
  { value: 'new_attraction', label: 'ท่องเที่ยวแนวใหม่' },
];

// ============================================================
// MainApp Component
// ============================================================
function MainApp() {
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentLang = (i18n.language || 'th').startsWith('th') ? 'th' : 'en';
  const isEn = currentLang === 'en';

  // ===== State =====
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [places, setPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [pageViews, setPageViews] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);

  // ===== Daily Stats =====
  const [dailyStats, setDailyStats] = useState({
    todayTotal: 0,
    avgDaily: 0,
    dailyData: [],
    lastUpdated: null,
    loading: false
  });

  const [selectedPlaces, setSelectedPlaces] = useState(() => {
    try {
      const saved = localStorage.getItem('my_trip_plan');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // ===== Modal States =====
  const [detailModal, setDetailModal] = useState({ isOpen: false, placeData: null });
  const [showEmbedMap, setShowEmbedMap] = useState(false);
  const [embedMapUrl, setEmbedMapUrl] = useState('');
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isFilterDropdownActive, setIsFilterDropdownActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ===== Review & Rating States =====
  const [reviewText, setReviewText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // ===== Place Form State =====
  const [newPlace, setNewPlace] = useState({
    title: '', title_en: '', description: '', detailDescription: '',
    description_en: '', detailDescription_en: '',
    img: '', gallery: [], category: 'travel', type: 'travel',
    subCategory: 'other',
    mapUrl: '', workingHours: '', phone: '', lat: '', lng: ''
  });
  const [imageFileName, setImageFileName] = useState('');
  const [formLang, setFormLang] = useState('th');

  // ===== Firestore Data =====
  const [reviewsData, setReviewsData] = useState({});
  const [ratingsData, setRatingsData] = useState({});

  // ===== Crop =====
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, mode: 'main' });
  const cropperRef = useRef(null);

  // ===== Cursor Glow =====
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // ============================================================
  // Effects
  // ============================================================
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    localStorage.setItem('my_trip_plan', JSON.stringify(selectedPlaces));
  }, [selectedPlaces]);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        setIsAdmin(
          ADMIN_EMAILS.some(email => email.toLowerCase() === currentUser.email.toLowerCase())
        );
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Places
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "places"), (snapshot) => {
      setPlaces(snapshot.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() })));
      setLoadingPlaces(false);
    }, () => setLoadingPlaces(false));
    return () => unsubscribe();
  }, []);

  // Ratings
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "ratings"), (snapshot) => {
      const ratingsMap = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        const key = data.placeId || 'unknown';
        if (!ratingsMap[key]) ratingsMap[key] = [];
        ratingsMap[key].push({ id: d.id, ...data });
      });
      setRatingsData(ratingsMap);
    });
    return () => unsubscribe();
  }, []);

  // Reviews
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const grouped = {};
      all.forEach(r => {
        if (!grouped[r.placeId]) grouped[r.placeId] = [];
        grouped[r.placeId].push(r);
      });
      setReviewsData(grouped);
    });
    return () => unsubscribe();
  }, []);

  // Analytics
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(doc(db, 'analytics', 'pageViews'), (snap) => {
      if (snap.exists()) setPageViews(snap.data() || {});
    });
    return () => unsub();
  }, [isAdmin]);

  // ============================================================
  // Trip Planner Functions
  // ============================================================
  const handleAddPlaceToTrip = (place) => {
    if (!place) return;
    const placeId = place.id || place.docId;
    const title = sanitizeInput(place.title || place.name || 'สถานที่');
    const exists = selectedPlaces.some(item => (item.id || item.docId) === placeId);

    if (exists) {
      setSelectedPlaces(prev => prev.filter(p => (p.id || p.docId) !== placeId));
      showToast(isEn ? 'Removed "' + title + '" from trip' : 'ลบ "' + title + '" ออกจากทริปแล้ว');
    } else {
      setSelectedPlaces(prev => {
        const stillExists = prev.some(item => (item.id || item.docId) === placeId);
        if (stillExists) return prev;
        return [...prev, place];
      });
      showToast(isEn ? 'Added "' + title + '" to trip' : 'เพิ่ม "' + title + '" ลงทริปแล้ว');
    }
  };

  const handleRemovePlaceFromTrip = (place) => {
    if (!place) return;
    const placeId = place.id || place.docId;
    const title = sanitizeInput(place.title || place.name || 'สถานที่');
    setSelectedPlaces(prev => prev.filter(p => (p.id || p.docId) !== placeId));
    showToast(isEn ? 'Removed "' + title + '" from trip' : 'ลบ "' + title + '" ออกจากทริปแล้ว');
  };

  const generateMultiStopMapUrl = (placesList) => {
    if (!placesList || placesList.length === 0) return '#';
    const coordsList = placesList.map(p => getPlaceCoords(p)).filter(Boolean);
    if (coordsList.length === 0) return '#';
    if (coordsList.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coordsList[0][0]},${coordsList[0][1]}`;
    }
    const origin = `${coordsList[0][0]},${coordsList[0][1]}`;
    const destination = `${coordsList[coordsList.length - 1][0]},${coordsList[coordsList.length - 1][1]}`;
    const waypoints = coordsList.slice(1, -1).map(c => `${c[0]},${c[1]}`).join('|');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    return url;
  };

  const estimateTripTime = (count) => {
    if (count === 0) return isEn ? '0 min' : '0 นาที';
    const minutes = count * 35 + Math.max(0, count - 1) * 12;
    if (minutes < 60) {
      return `~${minutes} ${isEn ? 'min' : 'นาที'}`;
    }
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    if (remain === 0) {
      return `~${hours} ${isEn ? 'hr' : 'ชม.'}`;
    }
    return `~${hours} ${isEn ? 'hr' : 'ชม.'} ${remain} ${isEn ? 'min' : 'นาที'}`;
  };

  // ============================================================
  // Map Functions
  // ============================================================
  const getEmbedMapUrl = (place) => {
    if (!place) return '';
    if (place.mapUrl) {
      const parsed = parseIframeUrl(place.mapUrl);
      if (parsed) return parsed;
    }
    const coords = getPlaceCoords(place);
    if (coords) {
      return `https://www.google.com/maps?q=${coords[0]},${coords[1]}&z=15&output=embed`;
    }
    return '';
  };

  const openMap = (place) => {
    if (!place) return;
    const coords = getPlaceCoords(place);
    if (coords) {
      const placeId = place.id || place.docId;
      const userId = user?.uid || null;
      trackNavigationClick(placeId, userId, 'card');
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank');
    } else {
      showToast(isEn ? 'No location data found' : 'ไม่พบพิกัดของสถานที่นี้');
    }
  };

  const openDetail = (place) => {
    setDetailModal({ isOpen: true, placeData: place });
    setGalleryIndex(0);
    setShowEmbedMap(false);
    setEmbedMapUrl('');
    setReviewText('');
    setUserRating(0);
    setEditingReviewId(null);
    setEditReviewText('');
    setEditRating(0);
  };

  // ============================================================
  // Login / Logout
  // ============================================================
  const handleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      const email = result?.email || auth.currentUser?.email || '';
      const isUserAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
      if (isUserAdmin) {
        showToast(isEn ? 'Admin login successful' : 'เข้าสู่ระบบ Admin สำเร็จ');
      } else {
        showToast(isEn ? 'Login successful' : 'เข้าสู่ระบบสำเร็จ');
      }
    } catch (e) {
      console.error(e);
      showToast(isEn ? 'Login failed' : 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast(isEn ? 'Logged out' : 'ออกจากระบบแล้ว');
    } catch (e) {
      console.error(e);
    }
  };

  // ============================================================
  // Image Handlers
  // ============================================================
  const handleImageBrowse = async (e) => {
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
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropModal({ isOpen: true, imageSrc: ev.target.result, mode: 'main' });
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryBrowse = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      showToast(`${file.name} ${isEn ? 'is not an image' : 'ไม่ใช่ไฟล์รูป'}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(`${file.name} ${isEn ? 'is too large' : 'ใหญ่เกินไป'}`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropModal({ isOpen: true, imageSrc: ev.target.result, mode: 'gallery' });
    };
    reader.readAsDataURL(file);
  };

  const handleCropCancel = () => {
    setCropModal({ isOpen: false, imageSrc: null, mode: 'main' });
    setImageFileName('');
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(inp => inp.value = '');
  };

  const handleCropConfirm = async () => {
    const cropper = cropperRef.current?.cropper;
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
      const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      try {
        const compressed = await compressImage(croppedFile, 1200, 0.7);
        if (cropModal.mode === 'main') {
          setNewPlace(prev => ({ ...prev, img: compressed }));
        } else if (cropModal.mode === 'gallery') {
          setNewPlace(prev => ({ ...prev, gallery: [...(prev.gallery || []), compressed] }));
        }
        setCropModal({ isOpen: false, imageSrc: null, mode: 'main' });
        showToast(isEn ? 'Cropped and compressed successfully!' : 'ครอบตัดและย่อรูปสำเร็จ!');
      } catch (err) {
        console.error(err);
        showToast(isEn ? 'Failed to process cropped image' : 'ไม่สามารถประมวลผลรูปที่ Crop ได้');
      }
    }, 'image/jpeg');
  };

  const handleRemoveGalleryImg = (idx) => {
    setNewPlace(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }));
  };

  const resetForm = () => {
    setEditingPlaceId(null);
    setImageFileName('');
    setNewPlace({
      title: '', title_en: '', description: '', detailDescription: '',
      description_en: '', detailDescription_en: '',
      img: '', gallery: [], category: 'travel', type: 'travel',
      subCategory: 'other',
      mapUrl: '', workingHours: '', phone: '', lat: '', lng: ''
    });
    setFormLang('th');
  };

  const handleCategoryChange = (value) => {
    let subCat = newPlace.subCategory || 'other';
    if (value === 'accommodation' || value === 'restaurant') {
      subCat = 'other';
    }
    setNewPlace(prev => ({ ...prev, category: value, type: value, subCategory: subCat }));
  };

  const handleSubCategoryChange = (value) => {
    setNewPlace(prev => ({ ...prev, subCategory: value, category: 'travel', type: 'travel' }));
  };

  // ============================================================
  // Add / Edit Place
  // ============================================================
  const handleAddPlaceSubmit = async (e) => {
    e.preventDefault();

    const requiredTitle = formLang === 'en' ? newPlace.title_en : newPlace.title;
    if (!requiredTitle) {
      showToast(formLang === 'en' ? 'Please enter an English place name' : 'กรุณากรอกชื่อสถานที่');
      return;
    }
    if (!newPlace.img) {
      showToast(isEn ? 'Please select a main image' : 'กรุณาเลือกรูปภาพหลัก');
      return;
    }
    try {
      let selectedType = (newPlace.category || 'travel').toLowerCase().trim();
      if (selectedType.includes('accom') || selectedType.includes('stay') || selectedType.includes('พัก')) {
        selectedType = 'accommodation';
      } else if (selectedType.includes('rest') || selectedType.includes('food') || selectedType.includes('อาหาร')) {
        selectedType = 'restaurant';
      } else {
        selectedType = 'travel';
      }

      const payload = {
        ...newPlace,
        subCategory: selectedType === 'travel' ? (newPlace.subCategory || 'other') : 'other',
        type: selectedType,
        category: selectedType,
        gallery: newPlace.gallery || []
      };

      if (newPlace.lat && newPlace.lng) {
        payload.lat = parseFloat(newPlace.lat);
        payload.lng = parseFloat(newPlace.lng);
        payload.coords = [parseFloat(newPlace.lat), parseFloat(newPlace.lng)];
      }

      if (newPlace.mapUrl) {
        payload.mapUrl = parseIframeUrl(newPlace.mapUrl);
      }

      if (editingPlaceId) {
        await updateDoc(doc(db, "places", String(editingPlaceId)), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        showToast(isEn ? 'Place updated' : 'แก้ไขสถานที่เรียบร้อยแล้ว');
      } else {
        await addDoc(collection(db, "places"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        showToast(isEn ? 'Place added' : 'เพิ่มสถานที่ใหม่เรียบร้อยแล้ว');
      }
      setIsAddPlaceModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving place:", error);
      showToast(`${isEn ? 'Failed to save: ' : 'ไม่สามารถบันทึกได้: '}${error.code || error.message}`);
    }
  };

  // ============================================================
  // Edit / Delete Place
  // ============================================================
  const handleEditPlace = (place) => {
    const targetId = place.id || place.docId;
    setEditingPlaceId(targetId);
    let rawType = String(place.type || place.category || 'travel').toLowerCase().trim();
    if (rawType.includes('accom') || rawType.includes('stay') || rawType.includes('พัก') || rawType.includes('hotel')) {
      rawType = 'accommodation';
    } else if (rawType.includes('rest') || rawType.includes('food') || rawType.includes('อาหาร')) {
      rawType = 'restaurant';
    } else {
      rawType = 'travel';
    }

    setNewPlace({
      title: place.title || place.name || '',
      title_en: place.title_en || place.nameEn || '',
      description: place.description || '',
      description_en: place.description_en || '',
      detailDescription: place.detailDescription || place.detail || '',
      detailDescription_en: place.detailDescription_en || place.detailEn || '',
      img: place.img || place.imageUrl || place.image || '',
      gallery: Array.isArray(place.gallery) ? place.gallery : [],
      category: rawType,
      type: rawType,
      subCategory: place.subCategory && place.subCategory !== 'other' 
        ? place.subCategory 
        : detectGenreFromName(place.title || place.name || ''),
      mapUrl: place.mapUrl || place.googleMap || place.map || '',
      workingHours: place.workingHours || '',
      phone: place.phone || '',
      lat: place.lat || place.latitude || (Array.isArray(place.coords) ? place.coords[0] : '') || '',
      lng: place.lng || place.longitude || (Array.isArray(place.coords) ? place.coords[1] : '') || ''
    });
    setImageFileName(place.img ? 'มีรูปเดิมในระบบ' : '');
    setFormLang(place.title_en && !place.title ? 'en' : 'th');
    setIsAddPlaceModalOpen(true);
  };

  const handleDeletePlace = async (place) => {
    const targetId = place.id || place.docId;
    if (!targetId) {
      showToast(isEn ? 'Place ID not found' : 'ไม่พบ ID ของสถานที่');
      return;
    }
    if (window.confirm(isEn ? `Delete "${place.title || place.name}"?` : `ลบ "${place.title || place.name}" ใช่หรือไม่?`)) {
      try {
        await deleteDoc(doc(db, "places", String(targetId)));
        showToast(isEn ? 'Place deleted' : 'ลบเรียบร้อยแล้ว');
      } catch (error) {
        console.error(error);
        showToast(`${isEn ? 'Failed to delete: ' : 'ไม่สามารถลบได้: '}${error.code || error.message}`);
      }
    }
  };

  // ============================================================
  // Language
  // ============================================================
  const handleLanguageChange = (nextLang) => i18n.changeLanguage(nextLang);

  // ============================================================
  // Review & Rating Functions (Integrated)
  // ============================================================
  const validateReviewText = (text) => {
    const clean = sanitizeInput(text.trim());
    if (clean.length < 2) {
      showToast(isEn ? 'Review too short (min 2 characters)' : 'ข้อความสั้นเกินไป (ขั้นต่ำ 2 ตัวอักษร)');
      return false;
    }
    if (clean.length > 200) {
      showToast(isEn ? 'Max 200 characters' : 'ไม่เกิน 200 ตัวอักษร');
      return false;
    }
    const lower = clean.toLowerCase();
    if (bannedWords.some(w => lower.includes(w))) {
      showToast(isEn ? 'Inappropriate language detected' : 'มีคำไม่เหมาะสม');
      return false;
    }
    return clean;
  };

  const handleReviewSubmit = async (placeId) => {
    if (!user) {
      showToast(isEn ? 'Please sign in first' : 'กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    if (!placeId) {
      showToast(isEn ? 'Place ID not found' : 'ไม่พบ ID ของสถานที่');
      return;
    }

    // Rate Limit
    const rateLimitCheck = checkRateLimit(user.uid);
    if (!rateLimitCheck.allowed) {
      showToast(isEn 
        ? `Please wait ${rateLimitCheck.remainingMinutes} min before next review`
        : `กรุณารออีก ${rateLimitCheck.remainingMinutes} นาทีก่อนส่งรีวิวครั้งถัดไป`
      );
      return;
    }

    if (userRating < 1 || userRating > 5) {
      showToast(isEn ? 'Please select a rating (1-5 stars)' : 'กรุณาให้คะแนนดาว (1-5)');
      return;
    }

    const validated = validateReviewText(reviewText);
    if (!validated) return;

    setIsSubmittingReview(true);
    try {
      // 1. Save rating via analytics (creates/updates ratings collection)
      const result = await submitRating(placeId, user.uid, userRating, validated);
      if (!result.success) {
        showToast(isEn ? 'Failed to submit rating: ' + result.message : 'ไม่สามารถส่งคะแนนได้: ' + result.message);
        setIsSubmittingReview(false);
        return;
      }

      // 2. Save review (text only, rating is separate in ratings collection)
      await addDoc(collection(db, 'reviews'), {
        placeId: placeId,
        name: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        text: validated,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      // 3. Update rate limit
      setRateLimit(user.uid);

      setReviewText('');
      setUserRating(0);
      showToast(isEn ? 'Review and rating submitted!' : 'ส่งรีวิวและคะแนนเรียบร้อย!');
    } catch (err) {
      console.error('Submit error:', err);
      showToast(`${isEn ? 'Failed: ' : 'ส่งไม่สำเร็จ: '}${err.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleUpdateReview = async (review) => {
    if (!review || !review.id) {
      showToast(isEn ? 'Review ID not found' : 'ไม่พบ ID ของรีวิว');
      return;
    }
    if (!user) {
      showToast(isEn ? 'Please sign in first' : 'กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    if (editRating < 1 || editRating > 5) {
      showToast(isEn ? 'Please select a rating (1-5 stars)' : 'กรุณาเลือกคะแนน (1-5)');
      return;
    }
    const isOwner = review.userId === user.uid;
    const isAdminUser = ADMIN_EMAILS.some(email => email.toLowerCase() === user.email?.toLowerCase());
    if (!isOwner && !isAdminUser) {
      showToast(isEn ? 'You can only edit your own reviews' : 'คุณสามารถแก้ไขได้เฉพาะรีวิวของคุณ');
      return;
    }
    const validated = validateReviewText(editReviewText);
    if (!validated) return;

    try {
      // 1. Update rating
      const placeId = review.placeId;
      const result = await submitRating(placeId, user.uid, editRating, validated, review.id);
      if (!result.success) {
        showToast(isEn ? 'Failed to update rating: ' + result.message : 'ไม่สามารถอัปเดตคะแนนได้: ' + result.message);
        return;
      }

      // 2. Update review text
      await updateDoc(doc(db, 'reviews', review.id), {
        text: validated,
        updatedAt: serverTimestamp()
      });

      setEditingReviewId(null);
      setEditReviewText('');
      setEditRating(0);
      showToast(isEn ? 'Review and rating updated!' : 'แก้ไขรีวิวและคะแนนเรียบร้อย!');
    } catch (err) {
      console.error('Update error:', err);
      showToast(isEn ? 'Failed to update: ' + err.message : 'แก้ไขไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteReview = async (review) => {
    if (!review || !review.id) {
      showToast(isEn ? 'Review ID not found' : 'ไม่พบ ID ของรีวิว');
      return;
    }
    if (!user) {
      showToast(isEn ? 'Please sign in first' : 'กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    const isOwner = review.userId === user.uid;
    const isAdminUser = ADMIN_EMAILS.some(email => email.toLowerCase() === user.email?.toLowerCase());
    if (!isOwner && !isAdminUser) {
      showToast(isEn ? 'You can only delete your own reviews' : 'คุณสามารถลบได้เฉพาะรีวิวของคุณ');
      return;
    }
    if (!window.confirm(isEn ? 'Delete this review and rating?' : 'ลบรีวิวและคะแนนนี้?')) return;

    try {
      // 1. Delete rating
      const q = query(collection(db, 'ratings'), where('placeId', '==', review.placeId), where('userId', '==', review.userId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();

      // 2. Delete review
      await deleteDoc(doc(db, 'reviews', review.id));

      // 3. Recalculate average
      await recalculatePlaceRating(review.placeId);

      showToast(isEn ? 'Review and rating deleted!' : 'ลบรีวิวและคะแนนเรียบร้อย!');
    } catch (err) {
      console.error('Delete error:', err);
      showToast(isEn ? 'Failed to delete: ' + err.message : 'ลบไม่สำเร็จ: ' + err.message);
    }
  };

  // ============================================================
  // Open Planner
  // ============================================================
  const handleOpenPlanner = () => {
    navigate('/planner');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    const handler = () => {
      setIsFilterDropdownActive(false);
      setIsMobileMenuOpen(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // ============================================================
  // Helper: Get Average Rating
  // ============================================================
  const getPlaceRating = (placeId) => {
    if (!placeId) return { avg: 0, total: 0 };
    const ratings = ratingsData[placeId] || [];
    if (ratings.length === 0) return { avg: 0, total: 0 };
    const total = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
    return { avg: Math.round((total / ratings.length) * 10) / 10, total: ratings.length };
  };

  // ============================================================
  // Render helpers
  // ============================================================
  const inputStyle = {
    padding: '10px 12px',
    background: '#2b2d31',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: 'Prompt, sans-serif',
    width: '100%',
    transition: 'border 0.2s'
  };

  const pageNameMap = {
    '/': isEn ? 'Home' : 'หน้าแรก',
    '/checkin': isEn ? 'Top 10' : '10 จุดเช็คอิน',
    '/attractions': isEn ? 'Attractions' : 'สถานที่ท่องเที่ยว',
    '/restaurant': isEn ? 'Restaurants' : 'ร้านอาหาร',
    '/accommodation': isEn ? 'Accommodation' : 'ที่พัก',
    '/map': isEn ? 'Map' : 'แผนที่',
    '/planner': isEn ? 'Planner' : 'วางแผนทริป'
  };

  const previewPlace = {
    id: 'preview',
    title: formLang === 'en' ? (newPlace.title_en || 'Place Name EN') : (newPlace.title || 'ชื่อสถานที่'),
    name: formLang === 'en' ? (newPlace.title_en || 'Place Name EN') : (newPlace.title || 'ชื่อสถานที่'),
    title_en: newPlace.title_en || '',
    nameEn: newPlace.title_en || '',
    description: formLang === 'en' ? (newPlace.description_en || 'Short description') : (newPlace.description || 'คำอธิบายสั้น'),
    descriptionEn: newPlace.description_en || '',
    detail: formLang === 'en' ? (newPlace.detailDescription_en || 'Details') : (newPlace.detailDescription || 'รายละเอียด'),
    detailEn: newPlace.detailDescription_en || '',
    img: newPlace.img || '',
    category: newPlace.category || 'travel',
    type: newPlace.type || 'travel',
    subCategory: newPlace.subCategory || 'other'
  };

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <HelmetProvider>
      <Helmet>
        <html lang={currentLang === 'en' ? 'en' : 'th'} />
        <title>{isEn ? 'Klongpai Travel Guide' : 'เที่ยวคลองไผ่'}</title>
        <meta name="description" content={isEn 
          ? 'Travel guide for Klongpai - attractions, accommodations, restaurants with maps and reviews'
          : 'แหล่งรวมสถานที่ท่องเที่ยว ที่พัก ร้านอาหาร ในคลองไผ่ พร้อมแผนที่และรีวิว'
        } />
        <meta property="og:title" content={isEn ? 'Klongpai Travel Guide' : 'เที่ยวคลองไผ่'} />
        <meta property="og:description" content={isEn 
          ? 'Travel guide for Klongpai - attractions, accommodations, restaurants with maps and reviews'
          : 'แหล่งรวมสถานที่ท่องเที่ยว ที่พัก ร้านอาหาร ในคลองไผ่ พร้อมแผนที่และรีวิว'
        } />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="theme-color" content="#00a854" />
      </Helmet>

      <PageViewTracker />
      
      <nav className="navbar">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <span>#</span> {isEn ? 'Klongpai' : 'คลองไผ่'}
        </Link>

        <button
          className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileMenuOpen(p => !p);
          }}
        >
          <span /><span /><span />
        </button>

        <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" onClick={closeMobileMenu}>{t('nav_home', 'หน้าแรก')}</Link>
          <Link to="/attractions" onClick={closeMobileMenu}>{isEn ? 'Attractions' : 'สถานที่ท่องเที่ยว'}</Link>

          <div className={`dropdown ${isFilterDropdownActive ? 'active' : ''}`}>
            <button
              className="dropdown-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterDropdownActive(!isFilterDropdownActive);
              }}
            >
              {t('nav_restaurant_acc', 'ร้านอาหาร / ที่พัก')}
            </button>
            <div className="dropdown-content">
              <Link to="/restaurant" onClick={() => { setIsFilterDropdownActive(false); closeMobileMenu(); }}>
                {t('nav_restaurant', 'ร้านอาหาร')}
              </Link>
              <Link to="/accommodation" onClick={() => { setIsFilterDropdownActive(false); closeMobileMenu(); }}>
                {t('nav_accommodation', 'ที่พัก')}
              </Link>
            </div>
          </div>

          <Link to="/checkin" onClick={closeMobileMenu}>{t('nav_top10','กิจกรรม')}</Link>
          <Link to="/map" onClick={closeMobileMenu}>{t('nav_map', 'แผนที่ชุมชน')}</Link>

          {isAdmin && (
            <>
              <button
                onClick={() => { resetForm(); setIsAddPlaceModalOpen(true); }}
                style={{ background: '#ffe76c', color: '#3b3a3b', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                {isEn ? 'Add Place' : 'เพิ่มสถานที่'}
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                style={{ background: '#7c4dff', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                {isEn ? 'Analytics' : 'ยอดเข้าชม'}
              </button>
            </>
          )}

          <Link
            to="/planner"
            onClick={() => { closeMobileMenu(); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); }}
            style={{ background: '#00a854', color: '#fff', padding: '8px 18px', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {t('nav_plan', 'วางแผนการเดินทาง')}
            {selectedPlaces.length > 0 && (
              <span style={{ background: '#fff', color: '#00a854', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                {selectedPlaces.length}
              </span>
            )}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={e => e.stopPropagation()}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
                <span style={{ fontSize: '0.85rem', color: '#ddd', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName?.split(' ')[0] || 'User'}
                </span>
                <button onClick={handleLogout} style={{ background: 'rgba(255,77,77,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,77,77,0.3)', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {isEn ? 'Sign out' : 'ออกจากระบบ'}
                </button>
              </div>
            ) : (
              <button onClick={handleLogin} style={{ background: '#fff', color: '#222', border: 'none', padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-1.14 2.76-2.4 3.61v3h3.86c2.26-2.08 3.67-5.14 3.67-8.46z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.11C3.18 21.88 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.6H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.06-3.1z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.39l4.06 3.11c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                {isEn ? 'Sign in' : 'เข้าสู่ระบบ'}
              </button>
            )}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <LangSwitcherText lang={currentLang} onLangChange={handleLanguageChange} />
          </div>
        </div>
      </nav>

      <ScrollProgress />

      <div 
        className="cursor-glow" 
        style={{ 
          left: mousePos.x, 
          top: mousePos.y,
          opacity: mousePos.x > 0 ? 1 : 0
        }} 
      />

      <Suspense fallback={
        <div style={{ 
          paddingTop: '90px', 
          minHeight: '100vh', 
          background: '#2b2b2b',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '25px',
          maxWidth: '1126px',
          margin: '0 auto',
          padding: '90px 20px 40px'
        }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      }>
        <Routes>
          <Route path="/" element={
            <Home 
              places={places} 
              loading={loadingPlaces} 
              onOpenMap={openDetail} 
              lang={currentLang} 
              selectedPlaces={selectedPlaces} 
              setSelectedPlaces={setSelectedPlaces}
              onAddToPlan={handleAddPlaceToTrip} 
              isAdmin={isAdmin} 
              onEditPlace={handleEditPlace} 
              onDeletePlace={handleDeletePlace}  
            />
          } />
          <Route path="/checkin" element={
            <CheckInPoints 
              places={places} 
              loading={loadingPlaces} 
              onOpenMap={openDetail} 
              googleUser={user} 
              handleGoogleLogin={handleLogin} 
              handleGoogleLogout={handleLogout}
              reviewsData={reviewsData} 
              lang={currentLang} 
              isAdmin={isAdmin}
              onEditPlace={handleEditPlace} 
              onDeletePlace={handleDeletePlace}
              selectedPlaces={selectedPlaces} 
              setSelectedPlaces={setSelectedPlaces} 
              onAddToPlan={handleAddPlaceToTrip} 
            />
          } />
          <Route path="/attractions" element={
            <Attractions 
              places={places} 
              loading={loadingPlaces} 
              onOpenMap={openDetail} 
              lang={currentLang} 
              isAdmin={isAdmin} 
              onEditPlace={handleEditPlace} 
              onDeletePlace={handleDeletePlace}
              selectedPlaces={selectedPlaces} 
              setSelectedPlaces={setSelectedPlaces} 
              onAddToPlan={handleAddPlaceToTrip} 
            />
          } />
          <Route path="/restaurant" element={
            <Restaurant 
              places={places} 
              loading={loadingPlaces} 
              onOpenMap={openDetail} 
              lang={currentLang} 
              isAdmin={isAdmin} 
              onEditPlace={handleEditPlace} 
              onDeletePlace={handleDeletePlace}
              selectedPlaces={selectedPlaces} 
              setSelectedPlaces={setSelectedPlaces} 
              onAddToPlan={handleAddPlaceToTrip} 
            />
          } />
          <Route path="/accommodation" element={
            <Accommodation 
              places={places} 
              loading={loadingPlaces} 
              onOpenMap={openDetail} 
              lang={currentLang} 
              isAdmin={isAdmin} 
              onEditPlace={handleEditPlace} 
              onDeletePlace={handleDeletePlace}
              selectedPlaces={selectedPlaces} 
              setSelectedPlaces={setSelectedPlaces} 
              onAddToPlan={handleAddPlaceToTrip} 
            />
          } />
          <Route path="/map" element={<CommunityMap places={places} lang={currentLang} />} />
          <Route path="/planner" element={
            <TripPlanner 
              places={places} 
              lang={currentLang} 
              selectedPlaces={selectedPlaces}
              setSelectedPlaces={setSelectedPlaces} 
              generateMultiStopMapUrl={generateMultiStopMapUrl}
              estimateTripTime={estimateTripTime}
              onRemoveFromPlan={handleRemovePlaceFromTrip}
              user={user}
            />
          } />
          <Route path="/detail/:id" element={
            <Detail 
              places={places} 
              onOpenMap={openMap} 
              lang={currentLang}
              user={user}
            />
          } />
        </Routes>
      </Suspense>
      <Footer />
      <FloatingTripBasket
        selectedPlaces={selectedPlaces}
        onAddPlace={handleAddPlaceToTrip}
        onOpenTripPlanner={handleOpenPlanner}
      />

      {/* ===== ANALYTICS MODAL ===== */}
      {showAnalytics && isAdmin && (
        <div className="map-modal-overlay active" style={{ zIndex: 2300 }} onClick={() => setShowAnalytics(false)}>
          <div className="map-modal-content" style={{ backgroundColor: '#1e1e1e', color: '#fff', maxWidth: '560px', padding: '28px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#7c4dff', marginBottom: '4px' }}>
              {isEn ? 'Website Analytics' : 'ยอดเข้าชมเว็บไซต์'}
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '20px' }}>
              {isEn ? 'Real-time updates' : 'อัปเดตแบบเรียลไทม์'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(124,77,255,0.12)', border: '1px solid rgba(124,77,255,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#bbb' }}>{isEn ? 'Total Views' : 'ยอดรวม'}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', fontFamily: 'Mitr, sans-serif' }}>
                  {(pageViews.total || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'rgba(0,168,84,0.12)', border: '1px solid rgba(0,168,84,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#bbb' }}>{isEn ? 'Today' : 'วันนี้'}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', fontFamily: 'Mitr, sans-serif' }}>
                  {dailyStats.todayTotal.toLocaleString()}
                </div>
              </div>
              <div style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#bbb' }}>{isEn ? 'Avg Daily (30d)' : 'เฉลี่ยรายวัน (30 วัน)'}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', fontFamily: 'Mitr, sans-serif' }}>
                  {dailyStats.avgDaily.toLocaleString()}
                </div>
              </div>
            </div>

            {dailyStats.lastUpdated && (
              <div style={{ fontSize: '0.7rem', color: '#666', textAlign: 'center', marginBottom: '16px' }}>
                {isEn ? 'Last updated: ' : 'อัปเดตล่าสุด: '}
                {dailyStats.lastUpdated.toLocaleString(isEn ? 'en-US' : 'th-TH', { timeZone: 'Asia/Bangkok' })}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '8px' }}>{isEn ? 'Page Breakdown' : 'ยอดแยกตามหน้า'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {Object.entries(pageViews)
                  .filter(([k]) => k !== 'total' && k !== 'lastUpdated')
                  .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                  .map(([path, count]) => (
                    <div key={path} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem' }}>{pageNameMap[path] || path}</span>
                      <span style={{ background: '#00a854', color: '#fff', padding: '0 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {(count || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <button onClick={() => setShowAnalytics(false)} style={{ marginTop: '16px', width: '100%', background: '#6c757d', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isEn ? 'Close' : 'ปิด'}
            </button>
          </div>
        </div>
      )}

      {/* ===== CROP MODAL ===== */}
      {cropModal.isOpen && (
        <div 
          className="map-modal-overlay active" 
          style={{ zIndex: 2500, padding: '20px', alignItems: 'center', justifyContent: 'center' }} 
          onClick={handleCropCancel}
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
                ref={cropperRef}
                src={cropModal.imageSrc}
                style={{ height: '100%', width: '100%' }}
                aspectRatio={4 / 3}
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
                onClick={handleCropCancel} 
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
                onClick={handleCropConfirm} 
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

      {/* ===== ADD/EDIT PLACE MODAL ===== */}
      {isAddPlaceModalOpen && (
        <div className="map-modal-overlay active" style={{ zIndex: 2200 }} onClick={() => { setIsAddPlaceModalOpen(false); resetForm(); }}>
          <div className="map-modal-content" style={{ backgroundColor: '#1e1e1e', color: '#fff', maxWidth: '760px', padding: '20px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#ffe76c', margin: 0, fontSize: '1.2rem' }}>
                {editingPlaceId ? (isEn ? 'Edit Place' : 'แก้ไขสถานที่') : (isEn ? 'Add New Place' : 'เพิ่มสถานที่ใหม่')}
              </h2>
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '4px' }}>
                <button
                  type="button"
                  onClick={() => setFormLang('th')}
                  style={{
                    padding: '4px 12px', borderRadius: '16px',
                    background: formLang === 'th' ? '#00a854' : 'transparent',
                    color: formLang === 'th' ? '#fff' : '#aaa', border: 'none', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '0.8rem'
                  }}
                >
                  ไทย
                </button>
                <button
                  type="button"
                  onClick={() => setFormLang('en')}
                  style={{
                    padding: '4px 12px', borderRadius: '16px',
                    background: formLang === 'en' ? '#00a854' : 'transparent',
                    color: formLang === 'en' ? '#fff' : '#aaa', border: 'none', cursor: 'pointer',
                    fontWeight: 'bold', fontSize: '0.8rem'
                  }}
                >
                  EN
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '320px' }}>
                <form onSubmit={handleAddPlaceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder={formLang === 'en' ? 'Place Name (English) *' : 'ชื่อสถานที่ (ไทย) *'} 
                    value={formLang === 'en' ? newPlace.title_en : newPlace.title} 
                    onChange={e => setNewPlace(prev => formLang === 'en' ? { ...prev, title_en: e.target.value } : { ...prev, title: e.target.value })} 
                    required 
                    style={inputStyle} 
                  />
                  
                  {formLang === 'en' ? (
                    <input 
                      type="text" 
                      placeholder="ชื่อสถานที่ (ไทย) (ไม่บังคับ)" 
                      value={newPlace.title} 
                      onChange={e => setNewPlace(prev => ({ ...prev, title: e.target.value }))} 
                      style={{ ...inputStyle, opacity: 0.7 }} 
                    />
                  ) : (
                    <input 
                      type="text" 
                      placeholder="Place Name (English) (Optional)" 
                      value={newPlace.title_en} 
                      onChange={e => setNewPlace(prev => ({ ...prev, title_en: e.target.value }))} 
                      style={{ ...inputStyle, opacity: 0.7 }} 
                    />
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Category</label>
                      <select value={newPlace.category} onChange={e => handleCategoryChange(e.target.value)} style={inputStyle}>
                        <option value="travel">Travel</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="restaurant">Restaurant</option>
                      </select>
                    </div>
                    
                    {newPlace.category === 'travel' && (
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Genre</label>
                        <select value={newPlace.subCategory} onChange={e => handleSubCategoryChange(e.target.value)} style={inputStyle}>
                          {GENRE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Main Image</label>
                    <input type="file" accept="image/*" onChange={handleImageBrowse} style={{ ...inputStyle, padding: '6px', fontSize: '0.8rem' }} />
                    {newPlace.img && (
                      <div style={{ position: 'relative', marginTop: '8px' }}>
                        <img src={newPlace.img} alt="" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '6px' }} />
                        <button
                          type="button"
                          onClick={() => setNewPlace(prev => ({ ...prev, img: '' }))}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>Gallery</label>
                    <input type="file" accept="image/*" multiple onChange={handleGalleryBrowse} style={{ ...inputStyle, padding: '6px', fontSize: '0.8rem' }} />
                    {newPlace.gallery?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {newPlace.gallery.map((img, idx) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            <img src={img} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px' }} />
                            <button type="button" onClick={() => handleRemoveGalleryImg(idx)} style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '9px' }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <textarea 
                    placeholder={formLang === 'en' ? 'Short Description (EN)' : 'คำอธิบายสั้น'} 
                    value={formLang === 'en' ? newPlace.description_en : newPlace.description} 
                    onChange={e => setNewPlace(prev => formLang === 'en' ? { ...prev, description_en: e.target.value } : { ...prev, description: e.target.value })} 
                    rows="2" 
                    style={{ ...inputStyle, resize: 'none' }} 
                  />
                  {formLang === 'en' ? (
                    <textarea placeholder="คำอธิบายสั้น (ไทย) (ไม่บังคับ)" value={newPlace.description} onChange={e => setNewPlace(prev => ({ ...prev, description: e.target.value }))} rows="2" style={{ ...inputStyle, resize: 'none', opacity: 0.7 }} />
                  ) : (
                    <textarea placeholder="Short Description (EN) (Optional)" value={newPlace.description_en} onChange={e => setNewPlace(prev => ({ ...prev, description_en: e.target.value }))} rows="2" style={{ ...inputStyle, resize: 'none', opacity: 0.7 }} />
                  )}
                  
                  <textarea 
                    placeholder={formLang === 'en' ? 'Details (EN)' : 'รายละเอียด'} 
                    value={formLang === 'en' ? newPlace.detailDescription_en : newPlace.detailDescription} 
                    onChange={e => setNewPlace(prev => formLang === 'en' ? { ...prev, detailDescription_en: e.target.value } : { ...prev, detailDescription: e.target.value })} 
                    rows="3" 
                    style={{ ...inputStyle, resize: 'none' }} 
                  />
                  {formLang === 'en' ? (
                    <textarea placeholder="รายละเอียด (ไทย) (ไม่บังคับ)" value={newPlace.detailDescription} onChange={e => setNewPlace(prev => ({ ...prev, detailDescription: e.target.value }))} rows="3" style={{ ...inputStyle, resize: 'none', opacity: 0.7 }} />
                  ) : (
                    <textarea placeholder="Details (EN) (Optional)" value={newPlace.detailDescription_en} onChange={e => setNewPlace(prev => ({ ...prev, detailDescription_en: e.target.value }))} rows="3" style={{ ...inputStyle, resize: 'none', opacity: 0.7 }} />
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="text" placeholder="Latitude" value={newPlace.lat} onChange={e => setNewPlace(prev => ({ ...prev, lat: e.target.value }))} style={inputStyle} />
                    <input type="text" placeholder="Longitude" value={newPlace.lng} onChange={e => setNewPlace(prev => ({ ...prev, lng: e.target.value }))} style={inputStyle} />
                  </div>
                  <input type="text" placeholder={isEn ? 'Opening Hours' : 'เวลาทำการ'} value={newPlace.workingHours} onChange={e => setNewPlace(prev => ({ ...prev, workingHours: e.target.value }))} style={inputStyle} />
                  <input type="text" placeholder={isEn ? 'Phone Number' : 'เบอร์โทร'} value={newPlace.phone} onChange={e => setNewPlace(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} />
                  <input type="text" placeholder={isEn ? 'Google Maps URL or Embed Code' : 'Google Maps URL หรือ Embed Code'} value={newPlace.mapUrl} onChange={e => setNewPlace(prev => ({ ...prev, mapUrl: e.target.value }))} style={inputStyle} />
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <button type="button" onClick={() => { setIsAddPlaceModalOpen(false); resetForm(); }} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      {isEn ? 'Cancel' : 'ยกเลิก'}
                    </button>
                    <button type="submit" style={{ background: '#ffe76c', color: '#3b3a3b', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      {editingPlaceId ? (isEn ? 'Save' : 'บันทึก') : (isEn ? 'Add Place' : 'เพิ่มสถานที่')}
                    </button>
                  </div>
                </form>
              </div>

              <div style={{ flex: 1, minWidth: '280px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#fff', marginBottom: '14px', fontSize: '0.95rem', textAlign: 'center' }}>
                  {isEn ? 'Live Preview' : 'ตัวอย่างการ์ด'}
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                  <button onClick={() => setFormLang('th')} style={{ padding: '4px 12px', borderRadius: '14px', background: formLang === 'th' ? '#00a854' : 'transparent', color: formLang === 'th' ? '#fff' : '#aaa', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>ไทย</button>
                  <button onClick={() => setFormLang('en')} style={{ padding: '4px 12px', borderRadius: '14px', background: formLang === 'en' ? '#00a854' : 'transparent', color: formLang === 'en' ? '#fff' : '#aaa', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>EN</button>
                </div>

                <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                  <Card 
                    place={previewPlace}
                    onOpenMap={() => {}}
                    lang={formLang}
                    isAdmin={isAdmin}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onAddToPlan={() => {}}
                    isAddedToPlan={false}
                  />
                </div>
                <p style={{ textAlign: 'center', color: '#777', fontSize: '0.75rem', marginTop: '12px' }}>
                  {isEn ? 'This is how the card will look like' : 'นี่คือลักษณะการ์ดที่จะแสดงผล'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL (Review + Rating Integrated) ===== */}
      <div className={`map-modal-overlay ${detailModal.isOpen ? 'active' : ''}`} style={{ zIndex: 2100 }} onClick={() => {
        setDetailModal({ isOpen: false, placeData: null });
        setShowEmbedMap(false);
        setEmbedMapUrl('');
      }}>
        <div className="map-modal-content" style={{ backgroundColor: '#1e1e1e', color: '#fff', maxWidth: 600, padding: 0, maxHeight: '95vh', overflowY: 'auto', borderRadius: '16px' }} onClick={e => e.stopPropagation()}>
          {detailModal.placeData && (() => {
            const p = detailModal.placeData;
            const images = [p.img, ...(p.gallery || [])].filter(Boolean);
            const title = isEn && p.title_en ? p.title_en : (p.title || p.name);
            const desc = isEn && p.detailDescription_en ? p.detailDescription_en : (p.detailDescription || p.detail || p.description || '');
            const embedUrl = getEmbedMapUrl(p);
            const placeId = p.id || p.docId;
            const placeReviews = reviewsData[placeId] || [];
            const placeRatingInfo = getPlaceRating(placeId);
            // ✅ เพิ่ม currentRatings เพื่อใช้ใน loop reviews
            const currentRatings = ratingsData[placeId] || [];

            return (
              <div>
                <span 
                  className="map-modal-close" 
                  style={{ 
                    color: '#fff', 
                    position: 'absolute',
                    top: '12px',
                    right: '18px',
                    zIndex: 10,
                    fontSize: '2rem',
                    cursor: 'pointer'
                  }} 
                  onClick={() => {
                    setDetailModal({ isOpen: false, placeData: null });
                    setShowEmbedMap(false);
                    setEmbedMapUrl('');
                  }}
                >
                  &times;
                </span>

                <div style={{ width: '100%', height: 250, position: 'relative', background: '#111' }}>
                  <img 
                    src={images[galleryIndex] || 'https://via.placeholder.com/600x250?text=No+Image'} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  {images.length > 1 && (
                    <>
                      <button 
                        onClick={e => { e.stopPropagation(); setGalleryIndex(i => (i - 1 + images.length) % images.length); }} 
                        style={{ 
                          position: 'absolute', 
                          left: 10, 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          background: 'rgba(0,0,0,0.6)', 
                          border: 'none', 
                          color: '#fff', 
                          width: 36, 
                          height: 36, 
                          borderRadius: '50%', 
                          cursor: 'pointer', 
                          fontSize: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ‹
                      </button>
                      <button 
                        onClick={e => { e.stopPropagation(); setGalleryIndex(i => (i + 1) % images.length); }} 
                        style={{ 
                          position: 'absolute', 
                          right: 10, 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          background: 'rgba(0,0,0,0.6)', 
                          border: 'none', 
                          color: '#fff', 
                          width: 36, 
                          height: 36, 
                          borderRadius: '50%', 
                          cursor: 'pointer', 
                          fontSize: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ›
                      </button>
                    </>
                  )}
                  {images.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.6)',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      color: '#fff'
                    }}>
                      {galleryIndex + 1} / {images.length}
                    </div>
                  )}
                </div>

                <div style={{ padding: '20px 24px' }}>
                  <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '8px', fontSize: '1.3rem' }}>
                    {title}
                  </h2>

                  {/* Average Rating Display */}
                  {placeRatingInfo.total > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <StarDisplay
                        average={placeRatingInfo.avg}
                        total={placeRatingInfo.total}
                        size={16}
                        variant="inline"
                        showTotal={true}
                      />
                    </div>
                  )}

                  <p style={{ color: '#ddd', lineHeight: '1.7', whiteSpace: 'pre-line', marginBottom: '12px', fontSize: '0.95rem' }}>
                    {desc}
                  </p>

                  {(p.workingHours || p.phone) && (
                    <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '16px' }}>
                      {p.workingHours && <div>{isEn ? 'Hours: ' : 'เวลาทำการ: '}{p.workingHours}</div>}
                      {p.phone && <div>{isEn ? 'Phone: ' : 'เบอร์โทร: '}{p.phone}</div>}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <button 
                      onClick={() => {
                        if (embedUrl) {
                          setEmbedMapUrl(embedUrl);
                          setShowEmbedMap(!showEmbedMap);
                        } else {
                          showToast(isEn ? 'No location data available' : 'ไม่มีข้อมูลพิกัด');
                        }
                      }} 
                      style={{ 
                        flex: 1,
                        background: showEmbedMap ? '#ff6b35' : '#00a854', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '12px', 
                        borderRadius: '50px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {showEmbedMap ? (isEn ? 'Hide Map' : 'ซ่อนแผนที่') : (isEn ? 'View Map' : 'ดูแผนที่')}
                    </button>
                    
                    <button 
                      onClick={() => {
                        const coords = getPlaceCoords(p);
                        if (coords) {
                          const userId = user?.uid || null;
                          trackNavigationClick(placeId, userId, 'detail_modal');
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank');
                        } else {
                          showToast(isEn ? 'No location data found' : 'ไม่พบพิกัดของสถานที่นี้');
                        }
                      }} 
                      style={{ 
                        flex: 1,
                        background: '#4285F4', 
                        color: '#fff', 
                        border: 'none', 
                        padding: '12px', 
                        borderRadius: '50px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {isEn ? 'Navigate' : 'นำทาง'}
                    </button>
                  </div>

                  {showEmbedMap && embedUrl && (
                    <div style={{ 
                      marginBottom: '16px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'rgba(255,255,255,0.05)'
                      }}>
                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
                          {isEn ? 'Map' : 'แผนที่'}
                        </span>
                        <button 
                          onClick={() => setShowEmbedMap(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff4d4d',
                            cursor: 'pointer',
                            fontSize: '1.2rem'
                          }}
                        >
                          x
                        </button>
                      </div>
                      <div style={{ width: '100%', height: '320px', background: '#333' }}>
                        <iframe 
                          src={embedUrl}
                          width="100%" 
                          height="100%" 
                          style={{ border: 0 }} 
                          allowFullScreen 
                          loading="lazy"
                          title="Map"
                          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        />
                      </div>
                    </div>
                  )}

                  {/* ===== REVIEW SECTION (Integrated with Rating) ===== */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '12px', fontSize: '1rem' }}>
                      {isEn ? 'Reviews' : 'รีวิว'} ({placeReviews.length})
                    </h3>

                    {user ? (
                      <div style={{ marginBottom: '16px' }}>
                        {/* StarRating for new review */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>
                            {isEn ? 'Your rating:' : 'คะแนนของคุณ:'}
                          </span>
                          <StarRating
                            rating={userRating}
                            onChange={(value) => setUserRating(value)}
                            size={28}
                            showLabels={true}
                          />
                        </div>

                        <textarea
                          value={reviewText}
                          onChange={e => setReviewText(e.target.value)}
                          placeholder={isEn ? "Write a review... (2-200 chars)" : "เขียนรีวิว... (2-200 ตัวอักษร)"}
                          maxLength={200}
                          rows="2"
                          style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            background: 'rgba(255,255,255,0.06)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '8px', 
                            color: '#fff', 
                            fontSize: '0.9rem',
                            resize: 'none',
                            fontFamily: 'Prompt, sans-serif',
                            outline: 'none'
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#666' }}>{reviewText.length}/200</span>
                          <button 
                            onClick={() => handleReviewSubmit(placeId)} 
                            style={{ 
                              background: isSubmittingReview ? '#666' : '#00a854', 
                              color: '#fff', 
                              border: 'none', 
                              padding: '6px 18px', 
                              borderRadius: '20px', 
                              cursor: isSubmittingReview ? 'not-allowed' : 'pointer', 
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              opacity: isSubmittingReview ? 0.6 : 1
                            }}
                            disabled={isSubmittingReview}
                          >
                            {isSubmittingReview ? (isEn ? 'Sending...' : 'กำลังส่ง...') : (isEn ? 'Submit' : 'ส่งรีวิว')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '16px' }}>
                        <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                          {isEn ? 'Sign in to write a review' : 'เข้าสู่ระบบเพื่อเขียนรีวิว'}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {placeReviews.length === 0 ? (
                        <p style={{ color: '#555', textAlign: 'center', fontSize: '0.85rem' }}>
                          {isEn ? 'No reviews yet' : 'ยังไม่มีรีวิว'}
                        </p>
                      ) : (
                        placeReviews.map((review) => {
                          const isOwner = user && review.userId === user.uid;
                          const isAdminUser = user && ADMIN_EMAILS.some(e => e.toLowerCase() === user.email?.toLowerCase());
                          const canEditDelete = isOwner || isAdminUser;

                          // ✅ ใช้ currentRatings ที่ประกาศไว้ข้างบน
                          const reviewRating = currentRatings.find(r => r.userId === review.userId);
                          const displayRating = reviewRating ? reviewRating.rating : 0;

                          return (
                            <div key={review.id} style={{ 
                              padding: '10px 14px', 
                              background: 'rgba(255,255,255,0.03)', 
                              borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {review.userPhoto && (
                                    <img src={review.userPhoto} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                                  )}
                                  <strong style={{ fontSize: '0.85rem', color: '#ddd' }}>{review.name}</strong>
                                </div>
                                {canEditDelete && editingReviewId !== review.id && (
                                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem' }}>
                                    <button 
                                      onClick={() => { 
                                        setEditingReviewId(review.id); 
                                        setEditReviewText(review.text);
                                        setEditRating(displayRating);
                                      }} 
                                      style={{ background: 'none', border: 'none', color: '#ffb300', cursor: 'pointer' }}
                                    >
                                      {isEn ? 'Edit' : 'แก้ไข'}
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteReview(review)} 
                                      style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}
                                    >
                                      {isEn ? 'Delete' : 'ลบ'}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Display the rating stars for this review */}
                              {displayRating > 0 && (
                                <div style={{ marginBottom: '4px' }}>
                                  <StarDisplay
                                    average={displayRating}
                                    total={1}
                                    size={14}
                                    variant="inline"
                                    showTotal={false}
                                  />
                                </div>
                              )}

                              {editingReviewId === review.id ? (
                                <div>
                                  {/* Edit Rating */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                    <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                      {isEn ? 'Rating:' : 'คะแนน:'}
                                    </span>
                                    <StarRating
                                      rating={editRating}
                                      onChange={(value) => setEditRating(value)}
                                      size={24}
                                      showLabels={true}
                                    />
                                  </div>
                                  <textarea 
                                    value={editReviewText} 
                                    onChange={e => setEditReviewText(e.target.value)} 
                                    maxLength={200} 
                                    rows="2" 
                                    style={{ 
                                      width: '100%', 
                                      padding: '8px 12px', 
                                      background: '#333', 
                                      border: '1px solid #555', 
                                      borderRadius: '6px', 
                                      color: '#fff', 
                                      resize: 'none',
                                      fontSize: '0.85rem',
                                      fontFamily: 'Prompt, sans-serif'
                                    }} 
                                  />
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', justifyContent: 'flex-end' }}>
                                    <button 
                                      onClick={() => setEditingReviewId(null)} 
                                      style={{ background: '#555', color: '#fff', border: 'none', padding: '3px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                      {isEn ? 'Cancel' : 'ยกเลิก'}
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateReview(review)} 
                                      style={{ background: '#00a854', color: '#fff', border: 'none', padding: '3px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                      {isEn ? 'Save' : 'บันทึก'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p style={{ margin: 0, color: '#ccc', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>{review.text}</p>
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
      </div>
    </HelmetProvider>
  );
}

// ============================================================
// App Wrapper
// ============================================================
export default function App() {
  return (
    <Router>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </Router>
  );
}