// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import './App.css';

import { bannedWords } from './utils/wordlist';
import LangSwitcherText from './components/LangSwitcherText';
import FloatingTripBasket from './components/FloatingTripBasket';
import ScrollProgress from './components/ScrollProgress';
import SkeletonCard from './components/SkeletonCard';
import Footer from './components/Footer';
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
  setDoc,
  increment,
  deleteDoc,
  updateDoc,
  getDoc
} from 'firebase/firestore';

// ============================================================
// ✅ Lazy Loading - โหลดเฉพาะหน้าที่เข้า
// ============================================================
const Home = lazy(() => import('./pages/Home'));
const Restaurant = lazy(() => import('./pages/Restaurant'));
const Accommodation = lazy(() => import('./pages/Accommodation'));
const CommunityMap = lazy(() => import('./pages/CommunityMap'));
const CheckInPoints = lazy(() => import('./pages/CheckInPoints'));
const Detail = lazy(() => import('./pages/Detail'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));
const Attractions = lazy(() => import('./pages/Attractions'));

import { ToastProvider, useToast } from './context/ToastContext';

// ============================================================
// Admin Emails
// ============================================================
const ADMIN_EMAILS = [
  'teet44182@gmail.com',
  'เทศบาล@gmail.com',
  'admin2@gmail.com'
];

// ============================================================
// Page View Tracker
// ============================================================
function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    const track = async () => {
      try {
        const page = location.pathname || '/';
        const ref = doc(db, 'analytics', 'pageViews');
        await setDoc(ref, {
          [page]: increment(1),
          total: increment(1),
          lastUpdated: serverTimestamp()
        }, { merge: true });
      } catch (e) {}
    };
    track();
  }, [location.pathname]);
  return null;
}

// ============================================================
// Compress Image
// ============================================================
const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
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

// ============================================================
// Sanitize Input
// ============================================================
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

// ============================================================
// Parse iFrame URL
// ============================================================
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

// ============================================================
// Extract Coords From URL
// ============================================================
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

// ============================================================
// Get Place Coords
// ============================================================
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

// ============================================================
// Main App
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

  const [selectedPlaces, setSelectedPlaces] = useState(() => {
    try {
      const saved = localStorage.getItem('my_trip_plan');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [detailModal, setDetailModal] = useState({ isOpen: false, placeData: null });
  const [showEmbedMap, setShowEmbedMap] = useState(false);
  const [embedMapUrl, setEmbedMapUrl] = useState('');
  const [isAddPlaceModalOpen, setIsAddPlaceModalOpen] = useState(false);
  const [editingPlaceId, setEditingPlaceId] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isFilterDropdownActive, setIsFilterDropdownActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ===== Review States =====
  const [reviewText, setReviewText] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [lastReviewSubmitTime, setLastReviewSubmitTime] = useState(0);
  const REVIEW_COOLDOWN_MS = 5000;

  const [newPlace, setNewPlace] = useState({
    title: '', title_en: '', description: '', detailDescription: '',
    img: '', gallery: [], category: 'travel', type: 'travel',
    mapUrl: '', workingHours: '', phone: '', lat: '', lng: ''
  });

  const [imageFileName, setImageFileName] = useState('');
  const [likes, setLikes] = useState({});
  const [reviewsData, setReviewsData] = useState({});

  // ===== Cursor Glow Effect =====
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // ===== Save to Local Storage =====
  useEffect(() => {
    localStorage.setItem('my_trip_plan', JSON.stringify(selectedPlaces));
  }, [selectedPlaces]);

  // ===== Auth =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email) {
        setIsAdmin(
          ADMIN_EMAILS.some(
            email => email.toLowerCase() === currentUser.email.toLowerCase()
          )
        );
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ===== Fetch Places =====
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "places"), (snapshot) => {
      setPlaces(snapshot.docs.map(d => ({ id: d.id, docId: d.id, ...d.data() })));
      setLoadingPlaces(false);
    }, () => setLoadingPlaces(false));
    return () => unsubscribe();
  }, []);

  // ===== Fetch Likes =====
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "likes"), (snapshot) => {
      const likesMap = {};
      snapshot.docs.forEach(d => { likesMap[d.id] = d.data().count || 0; });
      setLikes(likesMap);
    });
    return () => unsubscribe();
  }, []);

  // ===== Fetch Reviews =====
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

  // ===== Fetch Analytics =====
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(doc(db, 'analytics', 'pageViews'), (snap) => {
      if (snap.exists()) setPageViews(snap.data() || {});
    });
    return () => unsub();
  }, [isAdmin]);

  // ============================================================
  // TRIP PLANNER FUNCTIONS
  // ============================================================
  
  const isAddedToTrip = (place) => {
    if (!place) return false;
    const placeId = place.id || place.docId;
    return selectedPlaces.some(item => (item.id || item.docId) === placeId);
  };

  const handleAddPlaceToTrip = (place) => {
    if (!place) return;
    const placeId = place.id || place.docId;
    const title = sanitizeInput(place.title || place.name || 'สถานที่');
    const exists = selectedPlaces.some(item => (item.id || item.docId) === placeId);

    if (exists) {
      setSelectedPlaces(prev => prev.filter(p => (p.id || p.docId) !== placeId));
      showToast(isEn ? 'Removed "' + title + '" from trip' : 'ลบ "' + title + '" ออกจากทริปแล้ว');
    } else {
      setSelectedPlaces(prev => [...prev, place]);
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
  // MAP FUNCTIONS
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
    setEditingReviewId(null);
    setEditReviewText('');
  };

  // ============================================================
  // LOGIN / LOGOUT
  // ============================================================
  const handleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      const email = result?.email || auth.currentUser?.email || '';
      const isUserAdmin = ADMIN_EMAILS.some(
        e => e.toLowerCase() === email.toLowerCase()
      );
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
  // IMAGE HANDLERS
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
    try {
      showToast(isEn ? 'Compressing image...' : 'กำลังย่อรูป...');
      const compressed = await compressImage(file, 1200, 0.7);
      setNewPlace(prev => ({ ...prev, img: compressed }));
      showToast(isEn ? 'Image compressed' : 'ย่อรูปสำเร็จ');
    } catch (err) {
      console.error(err);
      showToast(isEn ? 'Failed to process image' : 'ไม่สามารถประมวลผลรูปได้');
    }
  };

  const handleGalleryBrowse = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name} ${isEn ? 'is not an image' : 'ไม่ใช่ไฟล์รูป'}`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} ${isEn ? 'is too large' : 'ใหญ่เกินไป'}`);
        continue;
      }
      try {
        const compressed = await compressImage(file, 1000, 0.65);
        setNewPlace(prev => ({
          ...prev,
          gallery: [...(prev.gallery || []), compressed]
        }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRemoveGalleryImg = (idx) => {
    setNewPlace(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== idx) }));
  };

  const resetForm = () => {
    setEditingPlaceId(null);
    setImageFileName('');
    setNewPlace({
      title: '', title_en: '', description: '', detailDescription: '',
      img: '', gallery: [], category: 'travel', type: 'travel',
      mapUrl: '', workingHours: '', phone: '', lat: '', lng: ''
    });
  };

  // ============================================================
  // ADD / EDIT PLACE
  // ============================================================
  const handleAddPlaceSubmit = async (e) => {
    e.preventDefault();
    if (!newPlace.title) {
      showToast(isEn ? 'Please enter a place name' : 'กรุณากรอกชื่อสถานที่');
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
  // LIKE
  // ============================================================
  const handleLike = async (placeId) => {
    const isLiked = localStorage.getItem(`like_${placeId}`) === 'true';
    try {
      await setDoc(doc(db, "likes", String(placeId)), { count: increment(isLiked ? -1 : 1) }, { merge: true });
      localStorage.setItem(`like_${placeId}`, isLiked ? 'false' : 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // ============================================================
  // EDIT / DELETE PLACE
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
      detailDescription: place.detailDescription || place.detail || '',
      img: place.img || place.imageUrl || place.image || '',
      gallery: Array.isArray(place.gallery) ? place.gallery : [],
      category: rawType,
      type: rawType,
      mapUrl: place.mapUrl || place.googleMap || place.map || '',
      workingHours: place.workingHours || '',
      phone: place.phone || '',
      lat: place.lat || place.latitude || (Array.isArray(place.coords) ? place.coords[0] : '') || '',
      lng: place.lng || place.longitude || (Array.isArray(place.coords) ? place.coords[1] : '') || ''
    });
    setImageFileName(place.img ? 'มีรูปเดิมในระบบ' : '');
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
  // LANGUAGE
  // ============================================================
  const handleLanguageChange = (nextLang) => i18n.changeLanguage(nextLang);

  // ============================================================
  // REVIEW FUNCTIONS - With Cooldown 5 seconds
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

    const now = Date.now();
    if (now - lastReviewSubmitTime < REVIEW_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((REVIEW_COOLDOWN_MS - (now - lastReviewSubmitTime)) / 1000);
      showToast(isEn ? `Please wait ${waitSeconds}s before posting again` : `กรุณารอ ${waitSeconds} วินาทีก่อนส่งอีกครั้ง`);
      return;
    }

    const validated = validateReviewText(reviewText);
    if (!validated) return;

    setIsSubmittingReview(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        placeId: placeId,
        name: user.displayName || 'Anonymous',
        userPhoto: user.photoURL || '',
        text: validated,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      
      setReviewText('');
      setLastReviewSubmitTime(now);
      showToast(isEn ? 'Review submitted!' : 'ส่งรีวิวเรียบร้อย!');
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

    const isOwner = review.userId === user.uid;
    const isAdminUser = ADMIN_EMAILS.some(email => email.toLowerCase() === user.email?.toLowerCase());
    
    if (!isOwner && !isAdminUser) {
      showToast(isEn ? 'You can only edit your own reviews' : 'คุณสามารถแก้ไขได้เฉพาะรีวิวของคุณ');
      return;
    }

    const validated = validateReviewText(editReviewText);
    if (!validated) return;

    try {
      await updateDoc(doc(db, 'reviews', review.id), {
        text: validated,
        updatedAt: serverTimestamp()
      });
      setEditingReviewId(null);
      setEditReviewText('');
      showToast(isEn ? 'Review updated!' : 'แก้ไขรีวิวเรียบร้อย!');
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

    if (!window.confirm(isEn ? 'Delete this review?' : 'ลบรีวิวนี้?')) return;
    
    try {
      await deleteDoc(doc(db, 'reviews', review.id));
      showToast(isEn ? 'Review deleted!' : 'ลบรีวิวแล้ว');
    } catch (err) {
      console.error('Delete error:', err);
      showToast(isEn ? 'Failed to delete: ' + err.message : 'ลบไม่สำเร็จ: ' + err.message);
    }
  };

  // ============================================================
  // OPEN PLANNER
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

  const inputStyle = {
    padding: '12px 14px',
    background: '#2b2d31',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'Prompt, sans-serif',
    width: '100%'
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

  const currentPlaceId = detailModal.placeData?.id || detailModal.placeData?.docId;
  const currentReviews = currentPlaceId ? (reviewsData[currentPlaceId] || []) : [];

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <HelmetProvider>
      <Helmet>
        <html lang={currentLang === 'en' ? 'en' : 'th'} />
        <title>{isEn ? 'Khlong Phai Travel Guide' : 'เที่ยวคลองไผ่'}</title>
        <meta name="description" content={isEn 
          ? 'Travel guide for Khlong Phai - attractions, accommodations, restaurants with maps and reviews'
          : 'แหล่งรวมสถานที่ท่องเที่ยว ที่พัก ร้านอาหาร ในคลองไผ่ พร้อมแผนที่และรีวิว'
        } />
        <meta property="og:title" content={isEn ? 'Khlong Phai Travel Guide' : 'เที่ยวคลองไผ่'} />
        <meta property="og:description" content={isEn 
          ? 'Travel guide for Khlong Phai - attractions, accommodations, restaurants with maps and reviews'
          : 'แหล่งรวมสถานที่ท่องเที่ยว ที่พัก ร้านอาหาร ในคลองไผ่ พร้อมแผนที่และรีวิว'
        } />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="theme-color" content="#00a854" />
      </Helmet>

      <PageViewTracker />
      
      <nav className="navbar">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <span>#</span> {t('brand_title', 'คลองไผ่')}
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

          <Link to="/checkin" onClick={closeMobileMenu}>{t('nav_top10', '10 จุดเช็คอิน')}</Link>
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

      {/* ✅ Scroll Progress Bar */}
      <ScrollProgress />

      {/* ✅ Cursor Glow */}
      <div 
        className="cursor-glow" 
        style={{ 
          left: mousePos.x, 
          top: mousePos.y,
          opacity: mousePos.x > 0 ? 1 : 0
        }} 
      />

      {/* ============================================================ */}
      {/* ✅ Routes with Suspense */}
      {/* ============================================================ */}
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
              likes={likes} 
              onLike={handleLike}
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
              likes={likes} 
              onLike={handleLike}
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
              likes={likes} 
              onLike={handleLike}
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
              likes={likes} 
              onLike={handleLike}
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
            />
          } />
          <Route path="/detail/:id" element={<Detail places={places} onOpenMap={openMap} lang={currentLang} />} />
        </Routes>
      </Suspense>
             <Footer />
      <FloatingTripBasket
        selectedPlaces={selectedPlaces}
        onAddPlace={handleAddPlaceToTrip}
        onOpenTripPlanner={handleOpenPlanner}
      />

      {showAnalytics && isAdmin && (
        <div className="map-modal-overlay active" style={{ zIndex: 2300 }} onClick={() => setShowAnalytics(false)}>
          <div className="map-modal-content" style={{ backgroundColor: '#1e1e1e', color: '#fff', maxWidth: '480px', padding: '28px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#7c4dff', marginBottom: '8px' }}>
              {isEn ? 'Website Analytics' : 'ยอดเข้าชมเว็บไซต์'}
            </h2>
            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px' }}>
              {isEn ? 'Real-time updates' : 'อัปเดตแบบเรียลไทม์'}
            </p>
            <div style={{ background: 'rgba(124,77,255,0.12)', border: '1px solid rgba(124,77,255,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#bbb' }}>
                {isEn ? 'Total Views' : 'ยอดรวมทั้งหมด'}
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 'bold', fontFamily: 'Mitr, sans-serif' }}>
                {(pageViews.total || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(pageViews).filter(([k]) => k !== 'total' && k !== 'lastUpdated').sort((a, b) => (b[1] || 0) - (a[1] || 0)).map(([path, count]) => (
                <div key={path} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '8px' }}>
                  <span>{pageNameMap[path] || path}</span>
                  <span style={{ background: '#00a854', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {(count || 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAnalytics(false)} style={{ marginTop: '24px', width: '100%', background: '#6c757d', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isEn ? 'Close' : 'ปิด'}
            </button>
          </div>
        </div>
      )}

      {isAddPlaceModalOpen && (
        <div className="map-modal-overlay active" style={{ zIndex: 2200 }} onClick={() => { setIsAddPlaceModalOpen(false); resetForm(); }}>
          <div className="map-modal-content" style={{ backgroundColor: '#1e1e1e', color: '#fff', maxWidth: '560px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#ffe76c', marginBottom: '20px' }}>
              {editingPlaceId ? (isEn ? 'Edit Place' : 'แก้ไขสถานที่') : (isEn ? 'Add New Place' : 'เพิ่มสถานที่ใหม่')}
            </h2>
            <form onSubmit={handleAddPlaceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: 4 }}>
                  {isEn ? 'Category' : 'ประเภท'}
                </label>
                <select value={newPlace.category} onChange={e => setNewPlace({ ...newPlace, category: e.target.value, type: e.target.value })} style={inputStyle}>
                  <option value="travel">{isEn ? 'Attraction (travel)' : 'สถานที่ท่องเที่ยว (travel)'}</option>
                  <option value="accommodation">{isEn ? 'Accommodation' : 'ที่พัก (accommodation)'}</option>
                  <option value="restaurant">{isEn ? 'Restaurant' : 'ร้านอาหาร (restaurant)'}</option>
                </select>
              </div>
              <input type="text" placeholder={isEn ? 'Place name (Thai) *' : 'ชื่อสถานที่ (ไทย) *'} value={newPlace.title} onChange={e => setNewPlace({ ...newPlace, title: e.target.value })} required style={inputStyle} />
              <input type="text" placeholder={isEn ? 'Place name (English)' : 'ชื่อสถานที่ (อังกฤษ)'} value={newPlace.title_en} onChange={e => setNewPlace({ ...newPlace, title_en: e.target.value })} style={inputStyle} />
              <div>
                <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: 4 }}>
                  {isEn ? 'Main Image' : 'รูปหน้าปก'}
                </label>
                <input type="file" accept="image/*" onChange={handleImageBrowse} style={{ ...inputStyle, padding: 8 }} />
                {newPlace.img && <img src={newPlace.img} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: 4 }}>
                  {isEn ? 'Additional Images' : 'รูปอื่นๆ'}
                </label>
                <input type="file" accept="image/*" multiple onChange={handleGalleryBrowse} style={{ ...inputStyle, padding: 8 }} />
                {newPlace.gallery?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {newPlace.gallery.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img src={img} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6 }} />
                        <button type="button" onClick={() => handleRemoveGalleryImg(idx)} style={{ position: 'absolute', top: -6, right: -6, background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 10 }}>x</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <textarea placeholder={isEn ? 'Short description' : 'คำอธิบายสั้น'} value={newPlace.description} onChange={e => setNewPlace({ ...newPlace, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'none' }} />
              <textarea placeholder={isEn ? 'Full details' : 'รายละเอียด'} value={newPlace.detailDescription} onChange={e => setNewPlace({ ...newPlace, detailDescription: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              <div>
                <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'block', marginBottom: 6 }}>
                  {isEn ? 'Location (important for navigation)' : 'พิกัด (สำคัญสำหรับการนำทาง)'}
                </label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input type="text" placeholder="Latitude" value={newPlace.lat} onChange={e => setNewPlace({ ...newPlace, lat: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                  <input type="text" placeholder="Longitude" value={newPlace.lng} onChange={e => setNewPlace({ ...newPlace, lng: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                </div>
                <button type="button" onClick={() => window.open('https://www.google.com/maps', '_blank')} style={{ width: '100%', background: 'rgba(66,133,244,0.15)', border: '1px solid #4285F4', color: '#8ab4f8', padding: '10px', borderRadius: 8, cursor: 'pointer' }}>
                  {isEn ? 'Open Google Maps' : 'เปิด Google Maps'}
                </button>
              </div>
              <input type="text" placeholder={isEn ? 'Opening hours' : 'เวลาทำการ'} value={newPlace.workingHours} onChange={e => setNewPlace({ ...newPlace, workingHours: e.target.value })} style={inputStyle} />
              <input type="text" placeholder={isEn ? 'Phone number' : 'เบอร์โทร'} value={newPlace.phone} onChange={e => setNewPlace({ ...newPlace, phone: e.target.value })} style={inputStyle} />
              <input type="text" placeholder={isEn ? 'Google Maps URL or Embed Code' : 'Google Maps URL หรือ Embed Code'} value={newPlace.mapUrl} onChange={e => setNewPlace({ ...newPlace, mapUrl: e.target.value })} style={inputStyle} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => { setIsAddPlaceModalOpen(false); resetForm(); }} style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
                  {isEn ? 'Cancel' : 'ยกเลิก'}
                </button>
                <button type="submit" style={{ background: '#ffe76c', color: '#3b3a3b', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
                  {editingPlaceId ? (isEn ? 'Save' : 'บันทึก') : (isEn ? 'Add Place' : 'เพิ่มสถานที่')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
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

                  {/* ===== REVIEW SECTION ===== */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '12px', fontSize: '1rem' }}>
                      {isEn ? 'Reviews' : 'รีวิว'} ({placeReviews.length})
                    </h3>

                    {user ? (
                      <div style={{ marginBottom: '16px' }}>
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
                                {isOwner && editingReviewId !== review.id && (
                                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem' }}>
                                    <button 
                                      onClick={() => { setEditingReviewId(review.id); setEditReviewText(review.text); }} 
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
                              {editingReviewId === review.id ? (
                                <div>
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
// Export
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