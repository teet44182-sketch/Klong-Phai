// src/components/LangSwitcherText.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LangSwitcherText({ lang, onLangChange }) {
  const { i18n } = useTranslation();
  const currentLang = lang || (i18n.language?.startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  const toggleLang = (targetLang) => {
    if (currentLang === targetLang) return;
    if (onLangChange) {
      onLangChange(targetLang);
    } else {
      i18n.changeLanguage(targetLang);
    }
  };

  // ✅ ป้องกัน XSS - sanitize language code
  const safeLang = (code) => {
    return code === 'th' || code === 'en' ? code : 'th';
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '30px',
        padding: '3px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        cursor: 'pointer',
        userSelect: 'none',
        fontFamily: 'Mitr, sans-serif',
        fontSize: '12px',
        fontWeight: 'bold',
        width: '80px',
        height: '32px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          width: '36px',
          height: '24px',
          borderRadius: '20px',
          background: '#00a854',
          boxShadow: '0 2px 6px rgba(0, 168, 84, 0.4)',
          transform: isEn ? 'translateX(36px)' : 'translateX(0px)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      <button
        type="button"
        onClick={() => toggleLang('th')}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '36px',
          height: '24px',
          border: 'none',
          background: 'transparent',
          color: !isEn ? '#ffffff' : '#888888',
          cursor: 'pointer',
          transition: 'color 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'inherit',
          fontSize: 'inherit',
          padding: 0,
        }}
      >
        TH
      </button>

      <button
        type="button"
        onClick={() => toggleLang('en')}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '36px',
          height: '24px',
          border: 'none',
          background: 'transparent',
          color: isEn ? '#ffffff' : '#888888',
          cursor: 'pointer',
          transition: 'color 0.25s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'inherit',
          fontSize: 'inherit',
          padding: 0,
        }}
      >
        EN
      </button>
    </div>
  );
}