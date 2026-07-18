// src/pages/CheckInPoints.jsx
import React, { useState } from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';

export default function CheckInPoints({ onOpenMap, likes = {}, onLike }) {
  // 💬 สเตตสำหรับเก็บรายการรีวิวภาพรวมของหน้า 10 จุดเช็คอิน
  const [pageReviews, setPageReviews] = useState([
    { id: 1, name: 'นักท่องเที่ยวสายกิน', text: 'ตามเก็บครบทั้งร้านอาหารและที่พักในลิสต์นี้ ดีงามมากค่ะ', date: '18/07/2026' }
  ]);

  const [inputName, setInputName] = useState('');
  const [inputText, setInputText] = useState('');

  // 🎯 ดึงฐานข้อมูลมาจัดการ Sorting เรียงลำดับจากคะแนน Like มากที่สุดไปน้อยที่สุด
  const sortedPlaces = [...placesDatabase].sort((a, b) => {
    const scoreA = likes[a.id] || 0;
    const scoreB = likes[b.id] || 0;
    return scoreB - scoreA;
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!inputName.trim() || !inputText.trim()) return;

    const newReview = {
      id: Date.now(),
      name: inputName,
      text: inputText,
      date: new Date().toLocaleDateString('th-TH')
    };

    setPageReviews([newReview, ...pageReviews]);
    setInputName('');
    setInputText('');
  };

  return (
    <div className="page-wrapper" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#2b2b2b', paddingTop: '100px' }}>
      <div style={{ width: '100%', maxWidth: '1126px', margin: '0 auto', padding: '0 20px 60px 20px' }}>
        
        <h1 style={{ fontFamily: 'Mitr, sans-serif', fontSize: '2.2rem', color: '#fff', marginBottom: '10px' }}>
          🏆 จัดอันดับ 10 จุดเช็คอิน คลองไผ่
        </h1>
        <p style={{ color: '#aaa', marginBottom: '40px', fontFamily: 'Prompt, sans-serif' }}>
          อันดับจะจัดเรียงและเปลี่ยนแปลงแบบเรียลไทม์ผ่านปุ่มโหวตหัวใจ ❤️ บนกล่องการ์ดสถานที่
        </p>

        {/* ส่วนแสดงรายการการ์ดสถานที่เรียงตามไลก์ */}
        <div className="results-grid" style={{ marginBottom: '60px' }}>
          {sortedPlaces.slice(0, 10).map((place, index) => (
            <div key={place.id} style={{ position: 'relative' }}>
              
              {/* 🥇 🥈 🥉 ป้ายบอกลำดับสกรีนทับมุมซ้ายบนตัวการ์ด */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '-8px',
                background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#00a854',
                color: index <= 2 ? '#000' : '#fff',
                fontWeight: 'bold',
                padding: '4px 12px',
                borderRadius: '6px',
                zIndex: 20,
                fontSize: '0.85rem',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                fontFamily: 'Mitr, sans-serif'
              }}>
                {index === 0 ? '🥇 อันดับ 1' : index === 1 ? '🥈 อันดับ 2' : index === 2 ? '🥉 อันดับ 3' : `อันดับ ${index + 1}`}
              </div>

              {/* เรียกใช้ Card component ตัวเดียวกับหน้าอื่น */}
              <Card 
                place={place} 
                onOpenMap={onOpenMap} 
                likesCount={likes[place.id] || 0}
                onLike={onLike}
              />
            </div>
          ))}
        </div>

        {/* 💬 ส่วนระบบรีวิวประจำหน้า 10 จุดเช็คอิน (No-Reply) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '30px',
          borderRadius: '16px',
          color: '#eee',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', marginBottom: '20px', fontSize: '1.3rem' }}>
            💬 พูดคุยเกี่ยวกับ 10 จุดเช็คอินนี้
          </h3>

          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
            <input 
              type="text"
              placeholder="ชื่อของคุณ"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              required
              style={{
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'Prompt, sans-serif'
              }}
            />
            <textarea 
              placeholder="เขียนรีวิวหรือแนะนำสิ่งที่น่าสนใจใน 10 จุดเช็คอินนี้..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              required
              rows="3"
              style={{
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.6',
                fontFamily: 'Prompt, sans-serif'
              }}
            />
            <button 
              type="submit"
              style={{
                alignSelf: 'flex-end',
                background: '#00a854',
                color: '#fff',
                padding: '10px 28px',
                border: 'none',
                borderRadius: '50px',
                fontFamily: 'Mitr, sans-serif',
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
            >
              ส่งความเห็น
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pageReviews.map((review) => (
              <div key={review.id} style={{
                padding: '15px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: '#fff', fontSize: '1rem', fontFamily: 'Prompt, sans-serif' }}>{review.name}</strong>
                  <span style={{ color: '#777', fontSize: '0.8rem' }}>{review.date}</span>
                </div>
                <p style={{ margin: 0, color: '#ccc', fontSize: '0.95rem', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {review.text}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}