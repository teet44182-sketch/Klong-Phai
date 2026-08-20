// src/main.jsx
import React from 'react';  // ✅ เพิ่มบรรทัดนี้
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.jsx';

// ============================================================
// ✅ Error Boundary - จัดการ Error ทั้งแอป
// ============================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#2b2b2b',
          color: '#fff',
          padding: '20px',
          textAlign: 'center',
          fontFamily: 'Prompt, sans-serif'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}></div>
          <h1 style={{ fontFamily: 'Mitr, sans-serif', color: '#ff6b6b' }}>
            มีบางอย่างผิดพลาด
          </h1>
          <p style={{ color: '#aaa', maxWidth: '400px', marginBottom: '20px' }}>
            กรุณารีเฟรชหน้าเว็บ หรือลองใหม่ในภายหลัง
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#00a854',
              color: '#fff',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '50px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = '#008743'}
            onMouseOut={(e) => e.target.style.background = '#00a854'}
          >
            รีเฟรชหน้า
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// ✅ App with Error Boundary
// ============================================================
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);