// src/components/FloatingTripBasket.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export default function FloatingTripBasket({ 
  selectedPlaces = [], 
  onAddPlace, 
  onOpenTripPlanner 
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const droppedPlace = JSON.parse(rawData);
      if (onAddPlace) {
        onAddPlace(droppedPlace);
        const title = droppedPlace.title || droppedPlace.name || 'สถานที่';
        showToast(`เพิ่ม "${title}" ลงทริปแล้ว`);
      }
    } catch (err) {
      console.error("Failed to parse dragged place:", err);
      showToast('ไม่สามารถเพิ่มสถานที่นี้ได้');
    }
  };

  const handleClick = () => {
    if (onOpenTripPlanner) {
      onOpenTripPlanner();
    } else {
      navigate('/planner');
    }
  };

  // ✅ แสดงเฉพาะถ้ามี selectedPlaces
  if (selectedPlaces.length === 0) return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '25px',
        right: '25px',
        zIndex: 9999,
        background: isDragOver ? '#00c865' : '#00a854',
        color: '#fff',
        padding: isDragOver ? '16px 24px' : '12px 20px',
        borderRadius: '30px',
        boxShadow: isDragOver ? '0 10px 25px rgba(0,200,101,0.6)' : '0 6px 20px rgba(0,0,0,0.4)',
        border: '2px solid rgba(255, 255, 255, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        fontFamily: 'Mitr, sans-serif',
        userSelect: 'none'
      }}
    >
      <span style={{ fontSize: '1.4rem' }}>🗺️</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', lineHeight: '1.2' }}>
          {isDragOver ? 'ปล่อยเพื่อเพิ่ม!' : 'ทริปของคุณ'}
        </span>
        <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          {selectedPlaces.length} {selectedPlaces.length === 1 ? 'สถานที่' : 'สถานที่'} 
          (กดเพื่อดูแผน)
        </span>
      </div>
    </div>
  );
}