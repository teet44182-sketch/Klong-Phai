// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// นำเข้าหน้าเพจต่าง ๆ
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Accommodation from './pages/Accommodation';
import CommunityMap from './pages/CommunityMap';

// นำเข้า Pop-up แผนที่กลาง
import MapModal from './components/MapModal';

export default function App() {
  // State คุมการเปิด/ปิด Pop-up แผนที่
  const [modalInfo, setModalInfo] = useState({ isOpen: false, url: '' });
  
  // 🎯 State ตัวใหม่: คุมการเปิด/ปิด และเก็บข้อมูลของสถานที่ที่จะเอามาโชว์ในกล่องรายละเอียด
  const [detailModal, setDetailModal] = useState({ isOpen: false, placeData: null });
  
  // State คุมการเปิด/ปิดเมนู Dropdown ของ Navbar
  const [isDropdownActive, setIsDropdownActive] = useState(false);

  // ฟังก์ชันช่วยสั่งเปิดหน้าต่างแผนที่
  const openMap = (url) => {
    setModalInfo({ isOpen: true, url: url });
  };

  // ฟังก์ชันสั่งปิดหน้าต่างแผนที่
  const closeMap = () => {
    setModalInfo({ isOpen: false, url: '' });
  };

  // 🎯 ฟังก์ชันใหม่: สำหรับสั่งเปิดกล่องรายละเอียดสถานที่ (จะส่งฟังก์ชันนี้ไปให้หน้าต่างๆ ใช้แทน)
  const openDetail = (place) => {
    setDetailModal({ isOpen: true, placeData: place });
  };

  // สั่งให้ซ่อน Dropdown อัตโนมัติเมื่อผู้ใช้คลิกพื้นที่อื่น ๆ บนจอ
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsDropdownActive(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // ฟังก์ชันสำหรับสลับเปิด/ปิด Dropdown เมื่อกดปุ่ม "10 จุดเช็คอิน"
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownActive(!isDropdownActive);
  };

  return (
    <Router>
      {/* 👑 Navbar สไตล์เดิมของคุณ ล็อกตำแหน่งให้อยู่บนสุดเสมอ */}
      <nav className="navbar">
        <Link to="/" className="nav-logo"><span>#</span> คลองไผ่</Link>
        <div className="nav-links">
          <Link to="/">หน้าแรก</Link>
          
          {/* Dropdown แบบระบบคลิกที่ย้ายมาคุมด้วย State ของ React */}
          <div className={`dropdown ${isDropdownActive ? 'active' : ''}`}>
            <button className="dropdown-btn" onClick={toggleDropdown}>
              10 จุดเช็คอิน
            </button>
            <div className="dropdown-content">
              <Link to="/restaurant">🍴 ร้านอาหาร</Link>
              <Link to="/accommodation">🏨 ที่พัก</Link>
            </div>
          </div>

          <Link to="/map">แผนที่ชุมชน</Link>
          <a href="#contact" onClick={(e) => { e.preventDefault(); alert('หน้าติดต่อมาเร็วๆนี้!'); }}>ติดต่อเรา</a>
          <a href="#plan" className="btn-green" onClick={(e) => { e.preventDefault(); alert(''); }}>วางแผนการเดินทาง</a>
        </div>
      </nav>

      {/* 🎯 จัดการเปลี่ยนหน้าตาม URL: ส่ง openDetail (ฟังก์ชันเปิดดีเทล) ไปให้ทุกหน้าใช้งานแทน onOpenMap ตัวเดิม */}
      <Routes>
        <Route path="/" element={<Home onOpenMap={openDetail} />} />
        <Route path="/restaurant" element={<Restaurant onOpenMap={openDetail} />} />
        <Route path="/accommodation" element={<Accommodation onOpenMap={openDetail} />} />
        <Route path="/map" element={<CommunityMap />} />
      </Routes>

      {/* 🗺️ โครงสร้าง Pop-up แผนที่ส่วนกลางเดิมของคุณ */}
      <MapModal 
        isOpen={modalInfo.isOpen} 
        mapUrl={modalInfo.url} 
        onClose={closeMap} 
      />

      {/* 🎯 🗂️ โครงสร้าง Pop-up รายละเอียดสถานที่ตัวใหม่ (สร้างแบบ inline ซ้อนไว้ท้ายไฟล์ทำงานได้ทันที) */}
      <div 
        className={`map-modal-overlay ${detailModal.isOpen ? 'active' : ''}`}
        style={{ zIndex: 2100 }} // ดันให้อยู่เหนือเลเยอร์อื่นๆ
        onClick={() => setDetailModal({ isOpen: false, placeData: null })}
      >
        <div 
          className="map-modal-content"
          style={{ 
            backgroundColor: '#2b2b2b', 
            color: '#fff', 
            maxWidth: '550px', 
            padding: '0', 
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          onClick={(e) => e.stopPropagation()} // กันไม่ให้กดตัวกล่องแล้วป๊อปอัปปิด
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
                <div style={{ marginTop: '25px', textAlign: 'center' }}>
                  <button 
                    style={{ background: '#00a854', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '50px', fontFamily: 'Mitr, sans-serif', cursor: 'pointer', fontWeight: 'bold' }}
                    onClick={() => {
                      openMap(detailModal.placeData.mapUrl); // เรียกแผนที่เดิมขึ้นมาซ้อน
                    }}
                  >
                    🗺️ ดูแผนที่นำทาง
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </Router>
  );
}