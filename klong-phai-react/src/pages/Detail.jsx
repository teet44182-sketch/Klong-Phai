// src/pages/Detail.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { placesDatabase } from '../placesData';

export default function Detail({ onOpenMap }) {
  // 🎯 1. แกะค่า id ออกมาจากพาท URL ด้วย useParams()
  const { id } = useParams();
  const navigate = useNavigate();

  // 🎯 2. ค้นหาข้อมูลสถานที่ในฐานข้อมูลกลางที่มี id ตรงกับ URL (แปลง id เป็น Number เสมอเพื่อความชัวร์)
  const place = placesDatabase.find(item => item.id === Number(id));

  // สั่งให้หน้าเว็บเลื่อนกลับไปบนสุดโดยอัตโนมัติเมื่อเปิดหน้ารายละเอียด
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // 🎯 3. ดักจับกรณีที่หาข้อมูลไม่เจอ (เช่น พิมพ์ id บน URL มั่วๆ)
  if (!place) {
    return (
      <div style={{ padding: '120px 20px', textAlign: 'center', color: '#aaa' }}>
        <h2>❌ ไม่พบข้อมูลสถานที่นี้</h2>
        <button 
          onClick={() => navigate('/')} 
          style={{ marginTop: '20px', padding: '10px 20px', background: '#00a854', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      
      {/* 📸 ส่วนหัวภาพพื้นหลังขนาดใหญ่ (Hero Banner ของสถานที่นั้นๆ) */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '45vh',
        marginTop: '70px',
        overflow: 'hidden'
      }}>
        <img 
          src={place.img} 
          alt={place.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} 
        />
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(43,43,43,1))'
        }} />
      </div>

      {/* 📄 ส่วนเนื้อหารายละเอียดเจาะลึก */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        margin: '-60px auto 0 auto', // ดึงเนื้อหาขึ้นไปเกยภาพเล็กน้อยให้มีมิติแบบโมเดิร์น
        padding: '0 20px 80px 20px',
        position: 'relative',
        zIndex: 20
      }}>
        
        {/* ชื่อสถานที่ */}
        <h1 style={{ 
          fontFamily: 'Mitr, sans-serif', 
          fontSize: '2.5rem', 
          color: '#ffffff',
          marginBottom: '20px',
          textShadow: '2px 2px 8px rgba(0,0,0,0.5)'
        }}>
          {place.title}
        </h1>

        {/* บล็อกรายละเอียดเนื้อหา */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '30px',
          borderRadius: '16px',
          color: '#eee',
          lineHeight: '1.8'
        }}>
          
          <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '10px' }}>
            📌 รายละเอียดข้อมูล
          </h3>
          <p style={{ fontSize: '1rem', marginBottom: '25px', whiteSpace: 'pre-line' }}>
            {/* ดึงฟิลด์รายละเอียดแบบยาวที่เราเตรียมไว้ในขั้นตอนที่ 1 มาโชว์ ถ้าไม่มีจะดึงคำอธิบายสั้นๆ มาแทน */}
            {place.detailDescription || place.description || "ไม่มีข้อมูลรายละเอียดเพิ่มเติม"}
          </p>

          {/* ข้อมูลการติดต่อและเวลาทำการ (แสดงเฉพาะเมื่อมีข้อมูลอยู่จริง) */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: '#ccc' }}>
            {place.workingHours && (
              <div>⏰ <strong>เวลาเปิด - ปิด:</strong> {place.workingHours}</div>
            )}
            {place.phone && (
              <div>📞 <strong>เบอร์โทรศัพท์:</strong> {place.phone}</div>
            )}
          </div>

          {/* ปุ่มสำหรับกดเปิดแผนที่ป๊อปอัป (Modal) ตามระบบเดิมของคุณ */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button 
              onClick={() => onOpenMap(place.mapUrl)}
              style={{
                background: '#00a854',
                color: '#fff',
                padding: '12px 30px',
                border: 'none',
                borderRadius: '50px',
                fontFamily: 'Mitr, sans-serif',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0, 168, 84, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#008743'}
              onMouseOut={(e) => e.target.style.background = '#00a854'}
            >
              🗺️ ดูแผนที่นำทาง
            </button>
          </div>

        </div>

        {/* ปุ่มกดย้อนกลับ */}
        <div style={{ marginTop: '20px' }}>
          <span 
            onClick={() => navigate(-1)} 
            style={{ color: '#aaa', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
          >
            ← ย้อนกลับไปหน้าก่อนหน้า
          </span>
        </div>

      </div>

    </div>
  );
}