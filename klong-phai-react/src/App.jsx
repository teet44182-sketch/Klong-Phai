// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// 🔒 นำเข้าอุปกรณ์ส่งออกสำหรับ Authentication และ Database พร้อมระบบ Anonymous Auth 
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore';

// นำเข้าหน้าเพจต่าง ๆ
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Accommodation from './pages/Accommodation';
import CommunityMap from './pages/CommunityMap';
import CheckInPoints from './pages/CheckInPoints'; 

// นำเข้า Pop-up แผนที่กลาง
import MapModal from './components/MapModal';

export default function App() {
  // 🔒 State คุมข้อมูลบัญชีนิรนาม (Anonymous) ประจำเครื่องเพื่อใช้ในการล็อกแต้ม Like กันสแปม
  const [anonUser, setAnonUser] = useState(null);

  // State คุมระบบแสดงผล Pop-up
  const [modalInfo, setModalInfo] = useState({ isOpen: false, url: '' });
  const [detailModal, setDetailModal] = useState({ isOpen: false, placeData: null });
  const [isFilterDropdownActive, setIsFilterDropdownActive] = useState(false);

  // 🎯 ☁️ ระบบ Like State ดึงข้อมูลสดๆ แบบ Realtime จาก Firebase
  const [likes, setLikes] = useState({});
  const [userLikedPlaces, setUserLikedPlaces] = useState({}); // เช็คสถานะการกด (❤️ / 🤍)

  // ✍️ State สำหรับควบคุมฟอร์มคอมเมนต์ (ชื่อผู้เขียน และ ข้อความรีวิว) ตามภาพดีไซน์
  const [inputName, setInputName] = useState('');
  const [inputText, setInputText] = useState('');

  // 🔒 ระบบแอบรันเข้าสู่ระบบแบบไม่ระบุตัวตน (Anonymous) ทันทีเพื่อสร้าง UID ประจำเครื่องแบบไร้ตัวตน
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setAnonUser(currentUser);

        // ดึงข้อมูลประวัติการกดไลก์ของ UID เครื่องนี้จากฐานข้อมูลมาตรวจสอบแบบ Realtime
        if (currentUser.uid) {
          const unsubscribeUserLikes = onSnapshot(collection(db, "likes"), (snapshot) => {
            snapshot.docs.forEach(async (placeDoc) => {
              const userLikeRef = doc(db, "likes", placeDoc.id, "userLikes", currentUser.uid);
              const userLikeSnap = await getDoc(userLikeRef);
              setUserLikedPlaces(prev => ({ ...prev, [placeDoc.id]: userLikeSnap.exists() }));
            });
          });
        }
      } else {
        // หากเครื่องนี้ยังไม่มีตัวตนในระบบ Firebase ให้แอบสร้าง ID ประจำเครื่องทันที
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous Auth Error:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ☁️ ดึงยอดไลก์รวมทั้งหมดขึ้นมาแสดงผลจาก Firebase แบบ Realtime
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

  // 🎯 ☁️ ฟังก์ชันสลับสถานะกดไลก์ (Toggle Like) ผูกกับ UID กันปั๊มยอด 100% แม้เปิด Incognito
  const handleLike = async (placeId) => {
    if (!anonUser) return;

    const placeRef = doc(db, "likes", String(placeId));
    const userLikeRef = doc(db, "likes", String(placeId), "userLikes", anonUser.uid);

    try {
      // ใช้ Transaction ป้องกันการส่งข้อมูลซ้ำซ้อนพร้อมๆ กัน
      await runTransaction(db, async (transaction) => {
        const placeSnap = await transaction.get(placeRef);
        const userLikeSnap = await transaction.get(userLikeRef);

        let currentCount = placeSnap.exists() ? (placeSnap.data().count || 0) : 0;

        if (userLikeSnap.exists()) {
          // 👎 เครื่องนี้เคยกดไปแล้ว -> ลบสิทธิ์ และลดคะแนนลง 1
          transaction.delete(userLikeRef);
          transaction.set(placeRef, { count: Math.max(0, currentCount - 1) }, { merge: true });
        } else {
          // 👍 เครื่องนี้ยังไม่เคยกด -> บันทึกหลักฐาน UID ประจำเครื่อง และบวกแต้มเพิ่ม 1
          transaction.set(userLikeRef, { likedAt: serverTimestamp() });
          transaction.set(placeRef, { count: currentCount + 1 }, { merge: true });
        }
      });
    } catch (error) {
      console.error("Error updating secure like:", error);
    }
  };

  // 🔒 ดึงข้อมูลคอมเมนต์รีวิวทั้งหมดจัดกลุ่มตามไอดีสถานที่แบบ Realtime
  const [reviewsData, setReviewsData] = useState({});

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

  const openMap = (url) => setModalInfo({ isOpen: true, url: url });
  const closeMap = () => setModalInfo({ isOpen: false, url: '' });
  const openDetail = (place) => setDetailModal({ isOpen: true, placeData: place });

  // ✍️ ฟังก์ชันส่งคอมเมนต์รีวิวแบบกรอกชื่อเองอิสระตามหน้า UI ใหม่ของคุณ
  const handleReviewSubmit = async (e, placeId) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // หากไม่พิมพ์ชื่อมา ระบบจะใส่ชื่อตั้งต้นให้อัตโนมัติ
    const authorName = inputName.trim() || "ผู้เยี่ยมชมทั่วไป";

    try {
      await addDoc(collection(db, "reviews"), {
        placeId: placeId,
        name: authorName,
        text: inputText.trim(),
        createdAt: serverTimestamp() // บันทึกเวลาจาก Server กลาง ป้องกันการปั๊มหรือเปลี่ยนเวลาเครื่อง
      });
      setInputText(''); // เคลียร์ช่องพิมพ์รีวิวหลังส่งสำเร็จ
    } catch (error) {
      console.error("Error saving review into Firebase:", error);
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
              <Link to="/restaurant" onClick={() => setIsFilterDropdownActive(false)}>🍴 ร้านอาหาร</Link>
              <Link to="/accommodation" onClick={() => setIsFilterDropdownActive(false)}>🏨 ที่พัก</Link>
            </div>
          </div>

          <Link to="/checkin" style={{ textDecoration: 'none', fontSize: '14px', color: '#ddd' }}>
            10 จุดเช็คอิน
          </Link>

          <Link to="/map">แผนที่ชุมชน</Link>
          <a href="#contact" onClick={(e) => { e.preventDefault(); alert('หน้าติดต่อมาเร็วๆนี้!'); }}>ติดต่อเรา</a>
          <a href="#plan" className="btn-green" onClick={(e) => { e.preventDefault(); alert(''); }}>วางแผนการเดินทาง</a>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/checkin" element={<CheckInPoints onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/restaurant" element={<Restaurant onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/accommodation" element={<Accommodation onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/map" element={<CommunityMap />} />
      </Routes>

      <MapModal isOpen={modalInfo.isOpen} mapUrl={modalInfo.url} onClose={closeMap} />

      {/* 🗂️ โครงสร้าง Pop-up กล่องแสดงรายละเอียดข้อมูลสถานที่ */}
      <div 
        className={`map-modal-overlay ${detailModal.isOpen ? 'active' : ''}`}
        style={{ zIndex: 2100 }} 
        onClick={() => setDetailModal({ isOpen: false, placeData: null })}
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
                
                {/* 🎯 ปุ่มแสดงผลสถานะไลก์: หากเครื่องนี้เคยกดไปแล้วจะขึ้น ❤️ ถ้ายังไม่เคยจะเป็น 🤍 */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '15px',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {userLikedPlaces[detailModal.placeData.id] ? '❤️' : '🤍'} {likes[detailModal.placeData.id] || 0} ถูกใจ
                </div>

                <span className="map-modal-close" style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', top: '10px', right: '15px' }} onClick={() => setDetailModal({ isOpen: false, placeData: null })}>&times;</span>
              </div>

              <div style={{ padding: '25px' }}>
                <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '15px' }}>{detailModal.placeData.title}</h2>
                <p style={{ fontSize: '0.95rem', color: '#ddd', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-line' }}>{detailModal.placeData.detailDescription || "ไม่มีข้อมูลรายละเอียดเพิ่มเติมในขณะนี้"}</p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detailModal.placeData.workingHours && <div>⏰ <b>เวลาทำการ:</b> {detailModal.placeData.workingHours}</div>}
                  {detailModal.placeData.phone && <div>📞 <b>เบอร์โทรศัพท์:</b> {detailModal.placeData.phone}</div>}
                </div>

                <div style={{ marginTop: '25px', textAlign: 'center', marginBottom: '25px' }}>
                  <button style={{ background: '#00a854', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '50px', fontFamily: 'Mitr, sans-serif', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => openMap(detailModal.placeData.mapUrl)}>🗺️ ดูแผนที่นำทาง</button>
                </div>

                {/* 💬 กล่องระบบพูดคุยและแสดงความคิดเห็นสไตล์เรียบหรูตามรูปแบบรูปภาพต้นฉบับของคุณ */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00c853', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      💬 พูดคุยเกี่ยวกับสถานที่นี้
                    </h3>
                  </div>

                  {/* ฟอร์มกรอกข้อมูลประกอบด้วยช่องใส่ชื่อ และข้อความแบบเขียนได้อิสระทันที */}
                  <form onSubmit={(e) => handleReviewSubmit(e, detailModal.placeData.id)} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                    <input 
                      type="text"
                      placeholder="ชื่อของคุณ"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.95rem',
                        outline: 'none',
                        fontFamily: 'Prompt, sans-serif'
                      }}
                    />
                    
                    <textarea 
                      placeholder="เขียนรีวิวหรือแนะนำสิ่งที่คุณประทับใจเกี่ยวกับจุดนี้..." 
                      value={inputText} 
                      onChange={(e) => setInputText(e.target.value)} 
                      required 
                      rows="3" 
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
                        fontFamily: 'Prompt, sans-serif' 
                      }} 
                    />
                    
                    <button 
                      type="submit" 
                      style={{ 
                        alignSelf: 'flex-end', 
                        background: '#00c853', 
                        color: '#fff', 
                        padding: '10px 24px', 
                        border: 'none', 
                        borderRadius: '50px', 
                        fontFamily: 'Mitr, sans-serif', 
                        fontSize: '0.95rem', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        transition: 'background 0.2s'
                      }}
                    >
                      ส่งความเห็น
                    </button>
                  </form>

                  {/* รายการกล่องข้อความรีวิวที่ดึงสดลงมาจาก Firebase Cloud */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {!(reviewsData[detailModal.placeData.id]) || reviewsData[detailModal.placeData.id].length === 0 ? (
                      <p style={{ color: '#777', textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic', padding: '10px 0' }}>
                        ยังไม่มีคอมเมนต์ มาร่วมแชร์ความเห็นเป็นคนแรกกันครับ!
                      </p>
                    ) : (
                      reviewsData[detailModal.placeData.id].map((review) => (
                        <div key={review.id} style={{ 
                          padding: '14px 18px', 
                          background: 'rgba(255, 255, 255, 0.03)', 
                          border: '1px solid rgba(255, 255, 255, 0.05)', 
                          borderRadius: '10px' 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ color: '#fff', fontSize: '1rem', fontFamily: 'Prompt, sans-serif' }}>
                              {review.name}
                            </strong>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>
                              {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('th-TH') : 'กำลังส่ง...'}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#ccc', fontSize: '0.9rem', whiteSpace: 'pre-line', lineHeight: '1.6', textAlign: 'center', padding: '10px 0' }}>
                            {review.text}
                          </p>
                        </div>
                      ))
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