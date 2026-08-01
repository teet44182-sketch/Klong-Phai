// src/components/SwipeCard.jsx
import React, { useState, useRef } from 'react';

export default function SwipeCard({ children, onSwipeLeft, onSwipeRight, isAdded }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

  const startPos = useRef({ x: 0, y: 0, time: 0 });
  const isHorizontalSwipe = useRef(null);
  const hasTriggeredAction = useRef(false);

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
    setSwipeDirection(null);
    hasTriggeredAction.current = false;
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

    const maxOffset = 250;
    const clampedX = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    setDragOffset({ x: clampedX, y: deltaY * 0.2 });

    if (clampedX > 30) {
      setSwipeDirection('right');
    } else if (clampedX < -30) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (isHorizontalSwipe.current === false) {
      setDragOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
      return;
    }

    const duration = Date.now() - startPos.current.time;
    const velocityX = Math.abs(dragOffset.x) / (duration || 1);

    const distanceThreshold = 80;
    const velocityThreshold = 0.3;

    const isSwipeRight = dragOffset.x > distanceThreshold || (dragOffset.x > 30 && velocityX > velocityThreshold);
    const isSwipeLeft = dragOffset.x < -distanceThreshold || (dragOffset.x < -30 && velocityX > velocityThreshold);

    // ✅ ตรวจสอบสถานะปัจจุบันก่อนตัดสินใจ
    // 🔴 ถ้าอยู่ในคิวแล้ว (isAdded = true) ปัดซ้าย = REMOVE, ปัดขวา = ไม่มีผล
    // 🟢 ถ้ายังไม่อยู่ในคิว (isAdded = false) ปัดขวา = ADD, ปัดซ้าย = ไม่มีผล
    
    if (isAdded) {
      // ✅ อยู่ในคิวแล้ว - ปัดซ้ายเท่านั้นที่ใช้ได้ (REMOVE)
      if (isSwipeLeft && onSwipeLeft && !hasTriggeredAction.current) {
        hasTriggeredAction.current = true;
        onSwipeLeft();
      }
      // ❌ ปัดขวาไม่มีผล (เพราะอยู่ในคิวแล้ว)
    } else {
      // ✅ ยังไม่อยู่ในคิว - ปัดขวาเท่านั้นที่ใช้ได้ (ADD)
      if (isSwipeRight && onSwipeRight && !hasTriggeredAction.current) {
        hasTriggeredAction.current = true;
        onSwipeRight();
      }
      // ❌ ปัดซ้ายไม่มีผล (เพราะยังไม่ได้อยู่ในคิว)
    }

    setDragOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  };

  const rotation = dragOffset.x * 0.06;
  const badgeOpacity = Math.min(Math.abs(dragOffset.x) / 60, 1);

  const showRightBadge = dragOffset.x > 20 && swipeDirection === 'right';
  const showLeftBadge = dragOffset.x < -20 && swipeDirection === 'left';

  // ✅ แสดงข้อความตามสถานะ
  const getRightBadgeText = () => {
    if (isAdded) return 'ADDED';
    return 'ADD';
  };

  const getLeftBadgeText = () => {
    if (isAdded) return 'REMOVE';
    return '';
  };

  const getRightBadgeColor = () => {
    if (isAdded) return '#ffaa00';
    return '#00a854';
  };

  const getLeftBadgeColor = () => {
    if (isAdded) return '#ff4d4d';
    return '#ffaa00';
  };

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
      {/* ✅ Badge ด้านขวา */}
      {showRightBadge && (
        <div style={{
          position: 'absolute', top: '16px', left: '16px',
          border: `3px solid ${getRightBadgeColor()}`, 
          color: getRightBadgeColor(), 
          fontWeight: '900',
          padding: '4px 12px', borderRadius: '8px', fontSize: '1rem',
          transform: 'rotate(-15deg)', zIndex: 20, background: 'rgba(0,0,0,0.75)',
          opacity: badgeOpacity, pointerEvents: 'none', 
          boxShadow: `0 4px 12px rgba(0,168,84,0.3)`
        }}>
          {getRightBadgeText()}
        </div>
      )}

      {/* ✅ Badge ด้านซ้าย */}
      {showLeftBadge && (
        <div style={{
          position: 'absolute', top: '16px', right: '16px',
          border: `3px solid ${getLeftBadgeColor()}`, 
          color: getLeftBadgeColor(), 
          fontWeight: '900',
          padding: '4px 12px', borderRadius: '8px', fontSize: '1rem',
          transform: 'rotate(15deg)', zIndex: 20, background: 'rgba(0,0,0,0.75)',
          opacity: badgeOpacity, pointerEvents: 'none', 
          boxShadow: `0 4px 12px rgba(255,77,77,0.3)`
        }}>
          {getLeftBadgeText()}
        </div>
      )}

      {children}
    </div>
  );
}