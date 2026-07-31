// src/components/SwipeCard.jsx
import React, { useState, useRef } from 'react';

export default function SwipeCard({ children, onSwipeLeft, onSwipeRight, isAdded }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const startPos = useRef({ x: 0, y: 0, time: 0 });
  const isHorizontalSwipe = useRef(null);

  // ✅ ป้องกันการ swipe บน element ที่เป็น interactive
  const isInteractiveElement = (target) => {
    if (!target) return false;
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
    if (interactiveTags.includes(target.tagName)) return true;
    if (target.closest('button')) return true;
    if (target.closest('a')) return true;
    if (target.closest('input')) return true;
    if (target.closest('textarea')) return true;
    return false;
  };

  const handleStart = (e, clientX, clientY) => {
    if (isInteractiveElement(e.target)) return;
    
    startPos.current = { 
      x: clientX, 
      y: clientY, 
      time: Date.now() 
    };
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  };

  const handleMove = (e, clientX, clientY) => {
    if (!isDragging) return;

    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalSwipe.current === false) return;

    if (e.cancelable) e.preventDefault();

    // ✅ จำกัดการเลื่อน
    const maxOffset = 250;
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    setDragOffset({ x: clampedX, y: deltaY * 0.2 });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (isHorizontalSwipe.current === false) {
      setDragOffset({ x: 0, y: 0 });
      return;
    }

    const duration = Date.now() - startPos.current.time;
    const velocityX = Math.abs(dragOffset.x) / (duration || 1);

    const distanceThreshold = 80;
    const velocityThreshold = 0.3;

    const isSwipeRight = dragOffset.x > distanceThreshold || (dragOffset.x > 30 && velocityX > velocityThreshold);
    const isSwipeLeft = dragOffset.x < -distanceThreshold || (dragOffset.x < -30 && velocityX > velocityThreshold);

    if (isSwipeRight && onSwipeRight) {
      onSwipeRight();
    } else if (isSwipeLeft && onSwipeLeft) {
      onSwipeLeft();
    }

    setDragOffset({ x: 0, y: 0 });
  };

  const rotation = dragOffset.x * 0.06;
  const badgeOpacity = Math.min(Math.abs(dragOffset.x) / 60, 1);

  return (
    <div
      onTouchStart={(e) => handleStart(e, e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleMove(e, e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleEnd}
      onMouseDown={(e) => {
        if (isInteractiveElement(e.target)) return;
        e.preventDefault();
        handleStart(e, e.clientX, e.clientY);
      }}
      onMouseMove={(e) => handleMove(e, e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={() => { if (isDragging) handleEnd(); }}
      style={{
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotation}deg)`,
        opacity: 1,
        transition: isDragging 
          ? 'none' 
          : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        position: 'relative',
        marginBottom: '12px',
        touchAction: 'pan-y'
      }}
    >
      {/* Badge + ADD */}
      {dragOffset.x > 20 && (
        <div style={{
          position: 'absolute', top: '16px', left: '16px',
          border: '3px solid #00a854', color: '#00a854', fontWeight: '900',
          padding: '4px 12px', borderRadius: '8px', fontSize: '1rem',
          transform: 'rotate(-15deg)', zIndex: 20, background: 'rgba(0,0,0,0.75)',
          opacity: badgeOpacity, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,168,84,0.3)'
        }}>
          ADD
        </div>
      )}

      {/* Badge SKIP */}
      {dragOffset.x < -20 && (
        <div style={{
          position: 'absolute', top: '16px', right: '16px',
          border: '3px solid #ff4d4d', color: '#ff4d4d', fontWeight: '900',
          padding: '4px 12px', borderRadius: '8px', fontSize: '1rem',
          transform: 'rotate(15deg)', zIndex: 20, background: 'rgba(0,0,0,0.75)',
          opacity: badgeOpacity, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(255,77,77,0.3)'
        }}>
          SKIP
        </div>
      )}

      {children}
    </div>
  );
}