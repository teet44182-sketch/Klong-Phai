// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// 🔒 นำเข้าอุปกรณ์ส่งออกสำหรับ Authentication และ Database จากไฟล์เชื่อมต่อที่คุณสร้างไว้
import { auth, googleProvider, db } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';

// นำเข้าหน้าเพจต่าง ๆ
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Accommodation from './pages/Accommodation';
import CommunityMap from './pages/CommunityMap';
import CheckInPoints from './pages/CheckInPoints'; 

// นำเข้า Pop-up แผนที่กลาง
import MapModal from './components/MapModal';

export default function App() {
  // 🔒 State คุมข้อมูลผู้ใช้งานที่ผ่านการยืนยันตัวตน Google Auth
  const [user, setUser] = useState(null);

  // State คุมการเปิด/ปิด Pop-up แผนที่
  const [modalInfo, setModalInfo] = useState({ isOpen: false, url: '' });
  
  // State คุมการเปิด/ปิด และเก็บข้อมูลของสถานที่ที่จะเอามาโชว์ในกล่องรายละเอียด
  const [detailModal, setDetailModal] = useState({ isOpen: false, placeData: null });

  // 🎯 State สำหรับควบคุมการเปิด/ปิด Dropdown ของ "ร้านอาหาร / ที่พัก" บน Navbar
  const [isFilterDropdownActive, setIsFilterDropdownActive] = useState(false);

  // 🎯 ☁️ ย้ายระบบ Like State มารับส่งค่าสดๆ จาก Firebase (ลบโค้ด localStorage เดิมออก)
  const [likes, setLikes] = useState({});

  // ☁️ ดึงยอดไลก์สะสมจาก Firebase Firestore แบบ Realtime เมื่อเปิดเว็บ
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

  // 🎯 ☁️ ฟังก์ชันเพิ่มแต้มไลก์ ยิงอัปเดตค่าสะสมขึ้นเซิร์ฟเวอร์ Firebase ตรงๆ (กดรัวได้เหมือนเดิม)
  const handleLike = async (placeId) => {
    try {
      const likeDocRef = doc(db, "likes", String(placeId));
      // ใช้ increment(1) ฝั่ง Firebase เพื่อป้องกันปัญหาตบแต่งตัวเลขหน้าเครื่อง หรือเน็ตดีเลย์แย่งกันกด
      await setDoc(likeDocRef, {
        count: increment(1)
      }, { merge: true });
    } catch (error) {
      console.error("Error updating like on Firebase:", error);
    }
  };

  // 🔒 เปลี่ยนจากข้อมูล Mockup มารับข้อมูลจริงแบบแบ่งแยกหมวดหมู่ตาม ID สถานที่จากระบบ Firebase Cloud Firestore
  const [reviewsData, setReviewsData] = useState({});

  // 🔒 ควบคุมเฉพาะช่องเขียนคอมเมนต์รีวิวประจำกล่องรายละเอียด (ช่องใส่ชื่อไม่ต้องมีแล้วเพราะใช้ Google Account)
  const [inputText, setInputText] = useState('');

  // 🔒 ฟังก์ชันเฝ้าตรวจสถานะล็อกอิน Google (ดักตรวจเงียบๆ แบบเงื่อนไขปลอดภัยสูงสุด)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔒 ฟังก์ชันดึงชุดคอมเมนต์รีวิวจาก Firebase แบบ Realtime อัปเดตตารางหน้าจอทันทีเมื่อมีการพิมพ์คอมเมนต์เพิ่ม
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // ดำเนินการกระจายข้อความรีวิวจัดสรรเข้าไปตาม Id ของสถานที่แต่ละจุดโดยอัตโนมัติ
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

  // 🔒 ฟังก์ชันคลิกกระตุ้นให้แสดงหน้าต่างป๊อปอัปตรวจสอบสิทธิ์ของกูเกิลเพื่อเข้าสู่ระบบ
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  // 🔒 ฟังก์ชันออกจากระบบล็อกอิน Google
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // ฟังก์ชันช่วยสั่งเปิดหน้าต่างแผนที่
  const openMap = (url) => {
    setModalInfo({ isOpen: true, url: url });
  };

  // ฟังก์ชันสั่งปิดหน้าต่างแผนที่
  const closeMap = () => {
    setModalInfo({ isOpen: false, url: '' });
  };

  // ฟังก์ชันสำหรับสั่งเปิดกล่องรายละเอียดสถานที่
  const openDetail = (place) => {
    setDetailModal({ isOpen: true, placeData: place });
  };

  // 🔒 ฟังก์ชันบันทึกรีวิวเขียนลงคลาวด์ Firebase แบบระบุเงื่อนไขตรวจสอบความปลอดภัยอย่างรัดกุม
  const handleReviewSubmit = async (e, placeId) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    try {
      await addDoc(collection(db, "reviews"), {
        placeId: placeId,               // ไอดีสถานที่ที่รีวิว
        name: user.displayName,          // ดึงชื่อเต็มของเจ้าของบัญชี Google อัตโนมัติ ป้องกันการปลอมแปลงชื่อ
        userPhoto: user.photoURL,        // ลิงก์รูปอวาตาร์ภาพโปรไฟล์ Google
        text: inputText.trim(),          // ข้อความรีวิว
        userId: user.uid,               // 🔒 แนบไอดีจำเพาะ (UID) ส่งไปเทียบค่าความถูกต้องของ Rules หลังบ้านเพื่อความปลอดภัยสูงสุด
        createdAt: serverTimestamp()    // ใช้เวลาเซิร์ฟเวอร์คลาวด์กลางบันทึกค่าล็อกเวลา ป้องกันการดัดแปลงเวลาหน้าเครื่องคอมพิวเตอร์ผู้ใช้
      });
      setInputText('');
    } catch (error) {
      console.error("Error saving review into Firebase:", error);
    }
  };

  // 🎯 ดักจับเหตุการณ์คลิกนอกพื้นที่ Dropdown เพื่อสั่งหุบแผงเมนูกระจกฝ้าอัตโนมัติ
  useEffect(() => {
    const handleOutsideClick = () => setIsFilterDropdownActive(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <Router>
      {/* 👑 Navbar สไตล์เดิมของคุณ ล็อกตำแหน่งให้อยู่บนสุดเสมอ */}
      <nav className="navbar">
        <Link to="/" className="nav-logo"><span>#</span> คลองไผ่</Link>
        <div className="nav-links">
          <Link to="/">หน้าแรก</Link>
          
          {/* 🎯 ปุ่ม "ร้านอาหาร / ที่พัก" แบบ Filter Dropdown บน Navbar ผูกเข้ากับระบบฝ้ากระจกใน CSS */}
          <div className={`dropdown ${isFilterDropdownActive ? 'active' : ''}`}>
            <button 
              className="dropdown-btn" 
              onClick={(e) => {
                e.stopPropagation(); // กันไม่ให้เกิด Event บับเบิลไปโดน window.click ล่างสุด
                setIsFilterDropdownActive(!isFilterDropdownActive);
              }}
            >
              ร้านอาหาร / ที่พัก
            </button>
            <div className="dropdown-content">
              {/* ส่ง Query String เพื่อให้หน้า Home นำค่าไปเปลี่ยนรูปแบบฟิลเตอร์อัตโนมัติ พร้อมสั่งปิดเมนูย่อยทันทีเมื่อคลิก */}
              <Link to="/restaurant" onClick={() => setIsFilterDropdownActive(false)}>🍴 ร้านอาหาร</Link>
              <Link to="/accommodation" onClick={() => setIsFilterDropdownActive(false)}>🏨 ที่พัก</Link>
            </div>
          </div>

          {/* ปรับแก้เอาคลาส dropdown-btn ออกเพื่อไม่ให้แสดงเครื่องหมายลูกศรซ้อนทับ */}
          <Link to="/checkin" style={{ textDecoration: 'none', fontSize: '14px', color: '#ddd' }}>
            10 จุดเช็คอิน
          </Link>

          <Link to="/map">แผนที่ชุมชน</Link>
          <a href="#contact" onClick={(e) => { e.preventDefault(); alert('หน้าติดต่อมาเร็วๆนี้!'); }}>ติดต่อเรา</a>
          <a href="#plan" className="btn-green" onClick={(e) => { e.preventDefault(); alert(''); }}>วางแผนการเดินทาง</a>
        </div>
      </nav>

      {/* 🎯 จัดการเปลี่ยนหน้าตาม URL พร้อมส่ง props ไลก์เข้าไป */}
      <Routes>
        <Route path="/" element={<Home onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/checkin" element={<CheckInPoints onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/restaurant" element={<Restaurant onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/accommodation" element={<Accommodation onOpenMap={openDetail} likes={likes} onLike={handleLike} />} />
        <Route path="/map" element={<CommunityMap />} />
      </Routes>

      {/* 🗺️ โครงสร้าง Pop-up แผนที่ส่วนกลางเดิมของคุณ */}
      <MapModal 
        isOpen={modalInfo.isOpen} 
        mapUrl={modalInfo.url} 
        onClose={closeMap} 
      />

      {/* 🎯 🗂️ โครงสร้าง Pop-up รายละเอียดสถานที่ตัวใหม่ */}
      <div 
        className={`map-modal-overlay ${detailModal.isOpen ? 'active' : ''}`}
        style={{ zIndex: 2100 }} 
        onClick={() => setDetailModal({ isOpen: false, placeData: null })}
      >
        <div 
          className="map-modal-content"
          style={{ 
            backgroundColor: '#2b2b2b', 
            color: '#fff', 
            maxWidth: '550px', 
            padding: '0', 
            maxHeight: '85vh', 
            overflowY: 'auto', 
            border: '1px solid rgba(255,255,255,0.1)',
            scrollbarWidth: 'thin'
          }}
          onClick={(e) => e.stopPropagation()} 
        >
          {detailModal.placeData && (
            <div>
              {/* รูปภาพหัวป๊อปอัป */}
              <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                <img 
                  src={detailModal.placeData.img} 
                  alt={detailModal.placeData.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                
                {/* 🎯 แสดงจำนวนไลก์สะสมในหน้าต่างรายละเอียดด้วย */}
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
                  ❤️ {likes[detailModal.placeData.id] || 0} ถูกใจ
                </div>

                <span 
                  className="map-modal-close" 
                  style={{ color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', top: '10px', right: '15px' }}
                  onClick={() => setDetailModal({ isOpen: false, placeData: null })}
                >
                  &times;
                </span>
              </div>

              {/* ข้อความรายละเอียด */}
              <div style={{ padding: '25px' }}>
                <h2 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '15px' }}>
                  {detailModal.placeData.title}
                </h2>
                
                <p style={{ fontSize: '0.95rem', color: '#ddd', lineHeight: '1.6', marginBottom: '20px', whiteSpace: 'pre-line' }}>
                  {detailModal.placeData.detailDescription || "ไม่มีข้อมูลรายละเอียดเพิ่มเติมในขณะนี้"}
                </p>

                {/* ส่วนแสดงเวลาและเบอร์โทรเพิ่มความสมบูรณ์ */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {detailModal.placeData.workingHours && <div>⏰ <b>เวลาทำการ:</b> {detailModal.placeData.workingHours}</div>}
                  {detailModal.placeData.phone && <div>📞 <b>เบอร์โทรศัพท์:</b> {detailModal.placeData.phone}</div>}
                </div>

                {/* ปุ่มเปิดแผนที่ต่อเนื่องเชื่อมโยงระบบเดิม */}
                <div style={{ marginTop: '25px', textAlign: 'center', marginBottom: '25px' }}>
                  <button 
                    style={{ background: '#00a854', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '50px', fontFamily: 'Mitr, sans-serif', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => {
                      openMap(detailModal.placeData.mapUrl); 
                    }}
                  >
                    🗺️ ดูแผนที่นำทาง
                  </button>
                </div>

                {/* 💬 ส่วนระบบรีวิวและแสดงความคิดเห็นประจำสถานที่เชื่อม Firebase */}
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '25px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', margin: 0, fontSize: '1.1rem' }}>
                      💬 รีวิวจากผู้เข้าชม
                    </h3>
                    
                    {/* 🔒 แสดงโปรไฟล์และปุ่มกด Logout ออกจากระบบเมื่อล็อกอินอยู่ */}
                    {user && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#aaa' }}>
                          <img src={user.photoURL} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                          <span>{user.displayName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff4d4d',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                            fontFamily: 'Prompt, sans-serif'
                          }}
                        >
                          ออกจากระบบ
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 🔒 ฟอร์มเขียนรีวิว: ปรับเงื่อนไขสลับหน้า UI ตามสิทธิ์ความปลอดภัยสูงสุด */}
                  {user ? (
                    <form onSubmit={(e) => handleReviewSubmit(e, detailModal.placeData.id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      <textarea 
                        placeholder="เขียนคอมเมนต์ที่นี่..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        required
                        rows="2"
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.9rem',
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
                          background: '#00a854',
                          color: '#fff',
                          padding: '8px 20px',
                          border: 'none',
                          borderRadius: '50px',
                          fontFamily: 'Mitr, sans-serif',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ส่งรีวิว
                      </button>
                    </form>
                  ) : (
                    // 🔒 ปุ่มล็อกอินด้วยช่องทางยืนยัน Google Auth หากยังไม่ได้ทำการล็อกอินเข้าสู่ระบบ
                    <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                      <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0 0 12px 0' }}>🔒 กรุณาเข้าสู่ระบบกูเกิลเพื่อยืนยันตัวตนก่อนส่งคอมเมนต์รีวิว</p>
                      <button 
                        type="button"
                        onClick={handleLogin}
                        style={{
                          background: '#fff',
                          color: '#222',
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '4px',
                          fontFamily: 'Mitr, sans-serif',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        Google Sign-In
                      </button>
                    </div>
                  )}

                  {/* รายการแสดงคอมเมนต์แบบก้อนเดี่ยวไหลต่อกันดึงค่าสดจาก Firebase */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {!(reviewsData[detailModal.placeData.id]) || reviewsData[detailModal.placeData.id].length === 0 ? (
                      <p style={{ color: '#777', textAlign: 'center', fontSize: '0.85rem', fontStyle: 'italic' }}>
                        ยังไม่มีคอมเมนต์ เขียนรีวิวเป็นคนแรกเลย!
                      </p>
                    ) : (
                      reviewsData[detailModal.placeData.id].map((review) => (
                        <div key={review.id} style={{
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {review.userPhoto && (
                                <img src={review.userPhoto} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                              )}
                              <strong style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'Prompt, sans-serif' }}>{review.name}</strong>
                            </div>
                            <span style={{ color: '#666', fontSize: '0.75rem' }}>
                              {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('th-TH') : 'กำลังส่ง...'}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#ccc', fontSize: '0.85rem', whiteSpace: 'pre-line', lineHeight: '1.5', paddingLeft: review.userPhoto ? '32px' : '0' }}>
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