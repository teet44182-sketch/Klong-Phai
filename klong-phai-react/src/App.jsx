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
    e.stopPropagation(); // กันไม่ให้ event ไหลไปโดน window ที่สั่งปิด
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

      {/* 🎯 จัดการเปลี่ยนหน้าตาม URL เส้นทางที่ระบุ */}
      <Routes>
        <Route path="/" element={<Home onOpenMap={openMap} />} />
        <Route path="/restaurant" element={<Restaurant onOpenMap={openMap} />} />
        <Route path="/accommodation" element={<Accommodation onOpenMap={openMap} />} />
        <Route path="/map" element={<CommunityMap />} />
      </Routes>

      {/* 🗺️ โครงสร้าง Pop-up แผนที่ส่วนกลางที่จะเรนเดอร์เมื่อถูกเรียกใช้งาน */}
      <MapModal 
        isOpen={modalInfo.isOpen} 
        mapUrl={modalInfo.url} 
        onClose={closeMap} 
      />
    </Router>
  );
}