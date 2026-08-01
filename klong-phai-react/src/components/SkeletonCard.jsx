// src/components/SkeletonCard.jsx
import React from 'react';

export default function SkeletonCard() {
  return (
    <div style={{ 
      background: '#1e1e1e', 
      borderRadius: '12px', 
      padding: '12px',
      border: '1px solid rgba(255,255,255,0.05)',
      overflow: 'hidden'
    }}>
      <div className="skeleton skeleton-image" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" style={{ width: '90%' }} />
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '12px' 
      }}>
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        <div className="skeleton skeleton-text" style={{ width: '30%' }} />
      </div>
    </div>
  );
}