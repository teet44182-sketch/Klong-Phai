// src/components/SwipeCard.jsx
import React, { useState, useRef } from 'react';

export default function SwipeCard({ children, onSwipeLeft, onSwipeRight, isAdded }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  // ตรวจสอบว่าเป็นการกดลงบน Interactive Elements (เช่น ปุ่ม, ลิงก์) หรือไม่
  const isInteractiveElement = (target) => {
    return (
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('a')
    );
  };

  const handleStart = (e, clientX, clientY) => {
    if (isInteractiveElement(e.target)) return;
    startPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;

    if (dragOffset.x > threshold) {
      if (onSwipeRight) onSwipeRight();
    } else if (dragOffset.x < -threshold) {
      if (onSwipeLeft) onSwipeLeft();
    }

    setDragOffset({ x: 0, y: 0 });
  };

  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  return (
    <div
      onTouchStart={(e) => handleStart(e, e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => {
        if (isInteractiveElement(e.target)) return;
        e.preventDefault(); // ป้องกันการเลือกข้อความ หรือจับลากรูปภาพ
        handleStart(e, e.clientX, e.clientY);
      }}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={() => { if (isDragging) handleEnd(); }}
      style={{
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
        opacity: opacity,
        transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        position: 'relative',
        marginBottom: '12px',
        touchAction: 'pan-y'
      }}
    >
      {/* Indicator ปัดขวา */}
      {dragOffset.x > 30 && (
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          border: '2px solid #00a854', color: '#00a854', fontWeight: 'bold',
          padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem',
          transform: 'rotate(-15deg)', zIndex: 10, background: 'rgba(0,0,0,0.8)',
          pointerEvents: 'none'
        }}>
          + ADD
        </div>
      )}

      {/* Indicator ปัดซ้าย */}
      {dragOffset.x < -30 && (
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          border: '2px solid #ff4d4d', color: '#ff4d4d', fontWeight: 'bold',
          padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem',
          transform: 'rotate(15deg)', zIndex: 10, background: 'rgba(0,0,0,0.8)',
          pointerEvents: 'none'
        }}>
          SKIP
        </div>
      )}

      {children}
    </div>
  );
}