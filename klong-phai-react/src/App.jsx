// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

//  นำเข้าอุปกรณ์สำหรับ Authentication และ Database จาก Firebase
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, increment, deleteDoc, updateDoc } from 'firebase/firestore';

// นำเข้าหน้าเพจต่าง ๆ
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Accommodation from './pages/Accommodation';
import CommunityMap from './pages/CommunityMap';
import CheckInPoints from './pages/CheckInPoints'; 

// นำเข้า Pop-up แผนที่กลาง
import MapModal from './components/MapModal';

export default function App() {
  //  State คุมข้อมูลผู้ใช้งานที่ผ่านการยืนยันตัวตน Google Auth
  const [user, setUser] = useState(null);

  // State คุมการเปิด/ปิด Pop-up แผนที่
  const [modalInfo, setModalInfo] = useState({ isOpen: false, url: '' });
  
  // State คุมการเปิด/ปิด และเก็บข้อมูลของสถานที่ที่จะเอามาโชว์ในกล่องรายละเอียด
  const [detailModal, setDetailModal] = useState({ isOpen: false, placeData: null });

  //  State สำหรับควบคุมการเปิด/ปิด Dropdown ของ "ร้านอาหาร / ที่พัก" บน Navbar
  const [isFilterDropdownActive, setIsFilterDropdownActive] = useState(false);

  //   ย้ายระบบ Like State มารับส่งค่าสดๆ จาก Firebase
  const [likes, setLikes] = useState({});

  //  State คุมการแก้ไขรีวิวภายในกล่องรายละเอียดสถานที่
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState('');

  //  รายการคำหยาบที่ระบบต้องการแบน (Banwords)
  const bannedWords = ["ควย", "เย็ด", "มึง", "กู", "สัส", "เหี้ย", "ค_ย", "เ_ยด", "ดกทอง"];

  //  ฟังก์ชันตรวจสอบคำหยาบและความยาวข้อความ (Validation) สำหรับกล่องรายละเอียด
  const validateReviewText = (text) => {
    const cleanText = text.trim();
    if (cleanText.length < 2) {
      alert(" ข้อความรีวิวสั้นเกินไปครับ");
      return false;
    }
    if (cleanText.length > 200) {
      alert(" ข้อความรีวิวต้องไม่เกิน 200 ตัวอักษรครับ");
      return false;
    }
    const textLower = cleanText.toLowerCase();
    const hasBannedWord = bannedWords.some(word => textLower.includes(word));
    if (hasBannedWord) {
      alert(" ข้อความของคุณมีคำไม่เหมาะสม (คำหยาบ) กรุณาแก้ไขก่อนส่งครับ");
      return false;
    }
    return cleanText;
  };

  //  ดึงยอดไลก์สะสมจาก Firebase Firestore แบบ Realtime
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "likes"), (snapshot) => {
      const likesMap = {};
      snapshot.docs.forEach(doc => {
        likesMap[doc.id] = doc.data().count || 0;
      });
      setLikes(likesMap);
    });
    return () => unsubscribe();
  }, []);

  //   ฟังก์ชันไลก์แบบสลับสถานะ (Toggle)
  const handleLike = async (placeId) => {
    const isLiked = localStorage.getItem(`like_${placeId}`) === 'true';
    const likeDocRef = doc(db, "likes", String(placeId));

    try {
      if (isLiked) {
        await setDoc(likeDocRef, { count: increment(-1) }, { merge: true });
        localStorage.setItem(`like_${placeId}`, 'false');
      } else {
        await setDoc(likeDocRef, { count: increment(1) }, { merge: true });
        localStorage.setItem(`like_${placeId}`, 'true');
      }
    } catch (error) {
      console.error("Error updating like on Firebase:", error);
    }
  };

  //  ข้อมูลรีวิวแบบแบ่งแยกหมวดหมู่ตาม ID สถานที่จากระบบ Firebase
  const [reviewsData, setReviewsData] = useState({});
  const [inputText, setInputText] = useState('');

  //  ฟังก์ชันเฝ้าตรวจสถานะล็อกอิน Google
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  //  ฟังก์ชันดึงชุดคอมเมนต์รีวิวจาก Firebase แบบ Realtime (มี id: doc.id แน่นอน)
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const groupedReviews = {};
      allReviews.forEach(review => {
        if (!groupedReviews[review.placeId]) {
          groupedReviews[review.placeId] = [];
        }
        groupedReviews[review.placeId].push(review);
      });
      setReviewsData(groupedReviews);
    });
    return () => unsubscribe();
  }, []);

  //  ฟังก์ชันเข้าสู่ระบบด้วย Google
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  //  ฟังก์ชันออกจากระบบล็อกอิน Google
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const openMap = (url) => { setModalInfo({ isOpen: true, url: url }); };
  const closeMap = () => { setModalInfo({ isOpen: false, url: '' }); };
  const openDetail = (place) => { setDetailModal({ isOpen: true, placeData: place }); };

  //  ฟังก์ชันบันทึกรีวิวเขียนลงคลาวด์ Firebase ของกล่องป๊อปอัป
  const handleReviewSubmit = async (e, placeId) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const validatedText = validateReviewText(inputText);
    if (!validatedText) return;

    try {
      await addDoc(collection(db, "reviews"), {
        placeId: placeId,
        name: user.displayName,
        userPhoto: user.photoURL,
        text: validatedText,
        userId: String(user.uid).trim(),
        createdAt: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      console.error("Error saving review into Firebase:", error);
    }
  };

  //  ฟังก์ชันอัปเดตแก้ไขคอมเมนต์ในป๊อปอัป (ปรับปรุงตัวดักจับ ID ป้องกันกล่อง Error)
  const handleUpdateReview = async (review) => {
    const targetId = review.id || review.docId;
    if (!targetId) {
      alert(" ไม่สามารถแก้ไขได้เนื่องจากไม่พบ ID ของเอกสาร");
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
      console.error(error);
      alert(" ไม่สามารถแก้ไขข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDeleteReview = async (review) => {
  // บังคับเช็คตัวแปร ID ทุกรูปแบบที่อาจจะเกิดขึ้นได้
  const targetId = review.id || review.docId || review._id;
  
  if (!targetId) {
    alert(" ระบบหา ID บน Firebase ของคอมเมนต์นี้ไม่เจอ");
    console.log("คอมเมนต์ที่กดลบ:", review); 
    return;
  }
  
  if (!window.confirm("คุณต้องการลบคอมเมนต์รีวิวนี้ใช่หรือไม่?")) return;
  
  try {
    // ลบที่ตัว Database จริง ๆ
    await deleteDoc(doc(db, "reviews", targetId));
  } catch (error) {
    console.error(error);
    alert(" เกิดข้อผิดพลาดขณะลบข้อมูลจาก Database");
  }
 };

  useEffect(() => {
    const handleOutsideClick = () => setIsFilterDropdownActive(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <Router>
      <nav className="navbar">
        <Link to="/" className="nav-logo"><span>#</span> คลองไผ่</Link>
        <div className="nav-links">
          <Link to="/">หน้าแรก</Link>
          <div className={`dropdown ${isFilterDropdownActive ? 'active' : ''}`}>
            <button className="dropdown-btn" onClick={(e) => { e.stopPropagation(); setIsFilterDropdownActive(!isFilterDropdownActive); }}>
              ร้านอาหาร / ที่พัก
            </button>
            <div className="dropdown-content">
              <Link to="/restaurant" onClick={() => setIsFilterDropdownActive(false)}> ร้านอาหาร</Link>
              <Link to="/accommodation" onClick={() => setIsFilterDropdownActive(false)}> ที่พัก</Link>
            </div>
          </div>
          <Link to="/checkin" style={{ textDecoration: 'none', fontSize: '14px', color: '#ddd' }}>10 จุดเช็คอิน</Link>
          <Link to="/map">แผนที่ชุมชน</Link>
          <a href="#contact" onClick={(e) => { e.preventDefault(); alert('หน้าติดต่อมาเร็วๆนี้!'); }}>ติดต่อเรา</a>
          <a href="#plan" className="btn-green" onClick={(e) => { e.preventDefault(); alert('ฟังก์ชันนี้กำลังพัฒนา'); }}>วางแผนการเดินทาง</a>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/checkin" element={
          <CheckInPoints 
            onOpenMap={openDetail} 
            likes={likes} 
            onLike={handleLike} 
            googleUser={user} 
            handleGoogleLogin={handleLogin} 
            handleGoogleLogout={handleLogout} 
            reviewsData={reviewsData} 
          />
        } />
        <Route path="/restaurant" element={<Restaurant onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/accommodation" element={<Accommodation onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/map" element={<CommunityMap />} />
      </Routes>

      <MapModal isOpen={modalInfo.isOpen} mapUrl={modalInfo.url} onClose={closeMap} />

      {/*  Pop-up รายละเอียดสถานที่ */}
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
              <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                <img src={detailModal.placeData.img} alt={detailModal.placeData.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '10px', right: '15px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                   {likes[detailModal.placeData.id] || 0} ถูกใจ
                </div>
                <span className="map-modal-close" style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', top: '10px', right: '15px' }} onClick={() => setDetailModal({ isOpen: false, placeData: null })}>&times;</span>
              </div>

              <div style={{ padding: '25px' }}>
                <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '15px' }}>{detailModal.placeData.title}</h2>
                <p style={{ fontSize: '0.95rem', color: '#ddd', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-line' }}>{detailModal.placeData.detailDescription || "ไม่มีข้อมูลรายละเอียดเพิ่มเติมในขณะนี้"}</p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detailModal.placeData.workingHours && <div> <b>เวลาทำการ:</b> {detailModal.placeData.workingHours}</div>}
                  {detailModal.placeData.phone && <div> <b>เบอร์โทรศัพท์:</b> {detailModal.placeData.phone}</div>}
                </div>

                <div style={{ marginTop: '25px', textAlign: 'center', marginBottom: '25px' }}>
                  <button style={{ background: '#00a854', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '50px', fontFamily: 'Mitr, sans-serif', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => openMap(detailModal.placeData.mapUrl)}> ดูแผนที่นำทาง</button>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', margin: 0, fontSize: '1.1rem' }}> รีวิวจากผู้เข้าชม</h3>
                    {user && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#aaa' }}>
                          <img src={user.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                          <span>{user.displayName}</span>
                        </div>
                        <button type="button" onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'Prompt, sans-serif' }}>ออกจากระบบ</button>
                      </div>
                    )}
                  </div>

                  {user ? (
                    <form onSubmit={(e) => handleReviewSubmit(e, detailModal.placeData.id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      <textarea placeholder="เขียนคอมเมนต์ที่นี่..." value={inputText} onChange={(e) => setInputText(e.target.value)} required rows="2" maxLength={200} style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '6px', color: '#fff', fontSize: '0.9rem', outline: 'none', resize: 'none', lineHeight: '1.5', fontFamily: 'Prompt, sans-serif' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}>{inputText.length}/200 ตัวอักษร</span>
                        <button type="submit" style={{ background: '#00a854', color: '#fff', padding: '8px 20px', border: 'none', borderRadius: '50px', fontFamily: 'Mitr, sans-serif', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}>ส่งรีวิว</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                      <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 12px 0' }}> กรุณาเข้าสู่ระบบกูเกิลเพื่อยืนยันตัวตนก่อนส่งคอมเมนต์รีวิว</p>
                      <button type="button" onClick={handleLogin} style={{ background: '#fff', color: '#222', padding: '8px 16px', border: 'none', borderRadius: '4px', fontFamily: 'Mitr, sans-serif', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Google Sign-In</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {!(reviewsData[detailModal.placeData.id]) || reviewsData[detailModal.placeData.id].length === 0 ? (
                      <p style={{ color: '#777', textAlign: 'center', fontSize: '0.85rem', fontStyle: 'italic' }}>ยังไม่มีคอมเมนต์ เขียนรีวิวเป็นคนแรกเลย!</p>
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
                                {isOwner && editingReviewId !== reviewId && (
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => { setEditingReviewId(reviewId); setEditText(review.text); }} style={{ background: 'none', border: 'none', color: '#ffb300', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Prompt, sans-serif', padding: 0 }}>แก้ไข</button>
                                    <button onClick={() => handleDeleteReview(review)} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'Prompt, sans-serif', padding: 0 }}>ลบ</button>
                                  </div>
                                )}
                                <span style={{ color: '#666', fontSize: '0.75rem' }}>
                                  {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('th-TH') : 'กำลังส่ง...'}
                                </span>
                              </div>
                            </div>

                            {editingReviewId === reviewId ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '5px' }}>
                                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={200} rows="2" style={{ padding: '8px', background: '#333', border: '1px solid #555', borderRadius: '4px', color: '#fff', fontSize: '0.85rem', width: '100%', resize: 'none', fontFamily: 'Prompt, sans-serif' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.7rem', color: '#888' }}>{editText.length}/200 ตัวอักษร</span>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => setEditingReviewId(null)} style={{ background: '#666', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>ยกเลิก</button>
                                    <button onClick={() => handleUpdateReview(review)} style={{ background: '#00a854', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>บันทึก</button>
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
          )}
        </div>
      </div>
    </Router>
  );
}