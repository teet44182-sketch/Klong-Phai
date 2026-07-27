// src/pages/Detail.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Detail({ places = [], onOpenMap, lang }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // กำหนดภาษาปัจจุบัน
  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  // สั่งให้หน้าเว็บเลื่อนกลับไปบนสุดโดยอัตโนมัติเมื่อเปิดหน้ารายละเอียด
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // ค้นหาข้อมูลสถานที่จาก props `places` (เปรียบเทียบ ID ทั้งแบบ String และ Number)
  const rawPlace = (places || []).find((item) => {
    const itemId = String(item.id || item.docId || '').trim();
    const targetId = String(id || '').trim();
    return itemId === targetId;
  });

  // จัดโครงสร้างและรองรับ multi-language
  const place = rawPlace
    ? {
        id: rawPlace.id || rawPlace.docId,
        title: isEn
          ? rawPlace.title_en || rawPlace.nameEn || rawPlace.title || rawPlace.name
          : rawPlace.title || rawPlace.name || rawPlace.placeName || 'ไม่มีชื่อสถานที่',
        detail: isEn
          ? rawPlace.detailDescription_en || rawPlace.detailEn || rawPlace.description_en || rawPlace.detailDescription || rawPlace.description
          : rawPlace.detailDescription || rawPlace.detail || rawPlace.description || 'ไม่มีข้อมูลรายละเอียดเพิ่มเติม',
        img: rawPlace.img || rawPlace.imageUrl || rawPlace.image,
        workingHours: isEn
          ? rawPlace.workingHours_en || rawPlace.workingHoursEn || rawPlace.workingHours || rawPlace.time
          : rawPlace.workingHours || rawPlace.time,
        phone: rawPlace.phone,
        mapUrl: rawPlace.mapUrl || rawPlace.googleMap,
      }
    : null;

  // ดักจับกรณีที่หาข้อมูลไม่เจอ
  if (!place) {
    return (
      <div style={{ padding: '120px 20px', textAlign: 'center', color: '#aaa', minHeight: '100vh', background: '#2b2b2b' }}>
        <h2 style={{ fontFamily: 'Mitr, sans-serif' }}>
          {isEn ? 'Place Not Found' : 'ไม่พบข้อมูลสถานที่นี้'}
        </h2>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            padding: '10px 24px',
            background: '#00a854',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontFamily: 'Mitr, sans-serif',
          }}
        >
          {isEn ? 'Back to Home' : 'กลับหน้าหลัก'}
        </button>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b' }}>
      {/* ส่วนหัวภาพพื้นหลังขนาดใหญ่ (Hero Banner) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '45vh',
          marginTop: '70px',
          overflow: 'hidden',
          background: '#1a1a1a',
        }}
      >
        {place.img && (
          <img
            src={place.img}
            alt={place.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(43,43,43,1))',
          }}
        />
      </div>

      {/* ส่วนเนื้อหารายละเอียด */}
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          margin: '-60px auto 0 auto',
          padding: '0 20px 80px 20px',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* ชื่อสถานที่ */}
        <h1
          style={{
            fontFamily: 'Mitr, sans-serif',
            fontSize: '2.5rem',
            color: '#ffffff',
            marginBottom: '20px',
            textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {place.title}
        </h1>

        {/* บล็อกรายละเอียดเนื้อหา */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '30px',
            borderRadius: '16px',
            color: '#eee',
            lineHeight: '1.8',
            fontFamily: 'Prompt, sans-serif',
          }}
        >
          <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '10px' }}>
            {isEn ? 'Information Details' : 'รายละเอียดข้อมูล'}
          </h3>
          <p style={{ fontSize: '1rem', marginBottom: '25px', whiteSpace: 'pre-line' }}>
            {place.detail}
          </p>

          {/* ข้อมูลการติดต่อและเวลาทำการ */}
          {(place.workingHours || place.phone) && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.9rem',
                color: '#ccc',
              }}
            >
              {place.workingHours && (
                <div>
                  <strong>{isEn ? 'Opening Hours:' : 'เวลาทำการ :'}</strong> {place.workingHours}
                </div>
              )}
              {place.phone && (
                <div>
                  <strong>{isEn ? 'Phone:' : 'เบอร์โทรศัพท์ :'}</strong> {place.phone}
                </div>
              )}
            </div>
          )}

          {/* ปุ่มสำหรับกดเปิดแผนที่ป๊อปอัป (Modal) */}
          {place.mapUrl && onOpenMap && (
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
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.background = '#008743')}
                onMouseOut={(e) => (e.target.style.background = '#00a854')}
              >
                {isEn ? 'View Navigation Map' : 'ดูแผนที่นำทาง'}
              </button>
            </div>
          )}
        </div>

        {/* ปุ่มกดย้อนกลับ */}
        <div style={{ marginTop: '20px' }}>
          <span
            onClick={() => navigate(-1)}
            style={{ color: '#aaa', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline', fontFamily: 'Prompt, sans-serif' }}
          >
            ← {isEn ? 'Go back to previous page' : 'ย้อนกลับไปหน้าก่อนหน้า'}
          </span>
        </div>
      </div>
    </div>
  );
}