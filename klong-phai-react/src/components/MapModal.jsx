// src/components/MapModal.jsx
import React from 'react';

export default function MapModal({ isOpen, mapUrl, onClose, zIndex }) {
  // ถ้าไม่ได้สั่งให้เปิด (isOpen === false) ไม่ต้องเรนเดอร์อะไรออกมา
  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay active" onClick={onClose} style={zIndex ? { zIndex } : {}}>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="map-modal-close" onClick={onClose}>×</span>
        <h3 style={{ marginBottom: '15px', color: '#1e5f38', fontFamily: 'Mitr' }}>
          แผนที่สถานที่
        </h3>
        <div className="map-iframe-container">
          <iframe 
            src={mapUrl} 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy"
            title="Map"
          ></iframe>
        </div>
      </div>
    </div>
  );
}