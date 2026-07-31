// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useRef } from 'react';

const ToastContext = createContext();

// ✅ Sanitize toast message - ป้องกัน XSS
const sanitizeMessage = (message) => {
  if (!message) return '';
  return String(message)
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ show: false, message: '' });
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const showToast = (message) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    const safeMessage = sanitizeMessage(message);

    setToast({ show: true, message: safeMessage });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

    timerRef.current = setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 320);
    }, 2500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: visible
              ? 'translate(-50%, -50%) scale(1)'
              : 'translate(-50%, -48%) scale(0.92)',
            opacity: visible ? 1 : 0,
            background: 'rgba(18, 18, 18, 0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: '50px',
            fontSize: '0.95rem',
            fontWeight: '500',
            letterSpacing: '0.2px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.1)',
            zIndex: 999999,
            transition: 'opacity 0.32s ease, transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
            pointerEvents: 'none',
            textAlign: 'center',
            maxWidth: '90vw',
            lineHeight: 1.45,
            fontFamily: 'Prompt, sans-serif'
          }}
          dangerouslySetInnerHTML={{ __html: toast.message }}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);