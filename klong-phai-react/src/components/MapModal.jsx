// src/components/MapModal.jsx
import React from 'react';

export default function MapModal({ isOpen, mapUrl, onClose, zIndex }) {
  if (!isOpen) return null;

  // ✅ Validate URL - ป้องกัน XSS
  const validateMapUrl = (url) => {
    if (!url) return '';
    if (typeof url !== 'string') return '';
    
    // อนุญาตเฉพาะ URL ที่ขึ้นต้นด้วย https
    if (url.startsWith('https://')) {
      return url;
    }
    // ถ้าเป็น URL สั้นๆ ให้แปลง
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    return '';
  };

  const safeUrl = validateMapUrl(mapUrl);

  return (
    <div className="map-modal-overlay active" onClick={onClose} style={zIndex ? { zIndex } : {}}>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="map-modal-close" onClick={onClose}>×</span>
        <h3 style={{ marginBottom: '15px', color: '#1e5f38', fontFamily: 'Mitr' }}>
          แผนที่สถานที่
        </h3>
        <div className="map-iframe-container">
          {safeUrl ? (
            <iframe 
              src={safeUrl} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy"
              title="Map"
              sandbox="allow-scripts allow-same-origin allow-popups"
            ></iframe>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#999',
              fontSize: '1rem'
            }}>
              ไม่พบข้อมูลแผนที่
            </div>
          )}
        </div>
      </div>
    </div>
  );
}