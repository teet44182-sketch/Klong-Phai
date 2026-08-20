// src/components/Footer.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.language || 'th').startsWith('en');

  return (
    <footer style={{
      background: '#0d1f14',
      color: '#ccc',
      padding: '50px 20px 30px',
      borderTop: '3px solid #00a854',
      marginTop: 'auto',
      width: '100%'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '40px',
        textAlign: 'left'
      }}>
        {/* คอลัมน์ 1: โลโก้ */}
        <div>
          <h3 style={{
            color: '#00a854',
            fontFamily: 'Mitr, sans-serif',
            fontSize: '1.2rem',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isEn ? 'Khlong Phai Subdistrict Municipality' : 'เทศบาลตำบลคลองไผ่'}
          </h3>
          <p style={{
            fontSize: '0.85rem',
            color: '#aaa',
            lineHeight: '1.6',
            fontFamily: 'Sarabun, sans-serif'
          }}>
            {isEn 
              ? 'Khlong Phai Subdistrict Municipality, Sikhio, Nakhon Ratchasima'
              : 'เทศบาลตำบลคลองไผ่ อำเภอสีคิ้ว จังหวัดนครราชสีมา'
            }
          </p>
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
            <a 
              href="#" 
              style={{ 
                color: '#aaa', 
                fontSize: '1.4rem', 
                textDecoration: 'none',
                transition: 'color 0.3s, transform 0.2s',
                display: 'inline-block'
              }}
              onMouseOver={(e) => { e.target.style.color = '#00a854'; e.target.style.transform = 'scale(1.2)'; }}
              onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.transform = 'scale(1)'; }}
            >
              
            </a>
            <a 
              href="#" 
              style={{ 
                color: '#aaa', 
                fontSize: '1.4rem', 
                textDecoration: 'none',
                transition: 'color 0.3s, transform 0.2s',
                display: 'inline-block'
              }}
              onMouseOver={(e) => { e.target.style.color = '#00a854'; e.target.style.transform = 'scale(1.2)'; }}
              onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.transform = 'scale(1)'; }}
            >
              
            </a>
            <a 
              href="#" 
              style={{ 
                color: '#aaa', 
                fontSize: '1.4rem', 
                textDecoration: 'none',
                transition: 'color 0.3s, transform 0.2s',
                display: 'inline-block'
              }}
              onMouseOver={(e) => { e.target.style.color = '#00a854'; e.target.style.transform = 'scale(1.2)'; }}
              onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.transform = 'scale(1)'; }}
            >
              
            </a>
          </div>
        </div>

        {/* คอลัมน์ 2: ติดต่อเรา */}
        <div>
          <h4 style={{
            color: '#00a854',
            fontFamily: 'Mitr, sans-serif',
            fontSize: '1rem',
            marginBottom: '12px'
          }}>
            {isEn ? 'Contact' : 'ติดต่อเรา'}
          </h4>
          <div style={{
            fontSize: '0.85rem',
            color: '#aaa',
            lineHeight: '1.8',
            fontFamily: 'Sarabun, sans-serif'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>📍</span>
              <span>
                {isEn 
                  ? 'Khlong Phai, Sikhio, Nakhon Ratchasima 30140'
                  : 'คลองไผ่ อ.สีคิ้ว จ.นครราชสีมา 30140'
                }
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>Tel :</span>
              <span>044-XXX-XXXX</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Gmail :</span>
              <span>klongpaitravel@gmail.com</span>
            </div>
          </div>
        </div>

        {/* คอลัมน์ 3: ลิงก์ด่วน */}
        <div>
          <h4 style={{
            color: '#00a854',
            fontFamily: 'Mitr, sans-serif',
            fontSize: '1rem',
            marginBottom: '12px'
          }}>
            {isEn ? 'Quick Links' : 'ลิงก์ด่วน'}
          </h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontFamily: 'Sarabun, sans-serif'
          }}>
            <a 
              href="/" 
              style={{
                color: '#aaa',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.3s, transform 0.2s',
                display: 'inline-block'
              }}
              onMouseOver={(e) => { e.target.style.color = '#00a854'; e.target.style.transform = 'translateX(4px)'; }}
              onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.transform = 'translateX(0)'; }}
            >
              {isEn ? 'Home' : 'หน้าแรก'}
            </a>
            <a 
              href="/attractions" 
              style={{
                color: '#aaa',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.3s, transform 0.2s',
                display: 'inline-block'
              }}
              onMouseOver={(e) => { e.target.style.color = '#00a854'; e.target.style.transform = 'translateX(4px)'; }}
              onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.transform = 'translateX(0)'; }}
            >
              {isEn ? 'Attractions' : 'สถานที่ท่องเที่ยว'}
            </a>
            <a 
              href="/checkin" 
              style={{
                color: '#aaa',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.3s, transform 0.2s',
                display: 'inline-block'
              }}
              onMouseOver={(e) => { e.target.style.color = '#00a854'; e.target.style.transform = 'translateX(4px)'; }}
              onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.transform = 'translateX(0)'; }}
            >
              {isEn ? 'Top 10 Check-ins' : '10 จุดเช็คอิน'}
            </a>
            <a 
              href="/planner" 
              style={{
                color: '#aaa',
                textDecoration: 'none',
                fontSize: '0.85rem',
                transition: 'color 0.3s, transform 0.2s',
                display: 'inline-block'
              }}
              onMouseOver={(e) => { e.target.style.color = '#00a854'; e.target.style.transform = 'translateX(4px)'; }}
              onMouseOut={(e) => { e.target.style.color = '#aaa'; e.target.style.transform = 'translateX(0)'; }}
            >
              {isEn ? 'Trip Planner' : 'วางแผนทริป'}
            </a>
          </div>
        </div>
      </div>

      {/* ส่วนล่าง - ลิขสิทธิ์ */}
      <div style={{
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '24px',
        marginTop: '32px',
        fontSize: '0.75rem',
        color: '#555',
        fontFamily: 'Sarabun, sans-serif'
      }}>
        © {new Date().getFullYear()} 
        {isEn 
          ? ' Khlong Phai Subdistrict Municipality. All rights reserved.'
          : ' เทศบาลตำบลคลองไผ่. สงวนลิขสิทธิ์.'
        }
        <br />
        <span style={{ fontSize: '0.65rem', color: '#444' }}>
          
        </span>
      </div>
    </footer>
  );
}