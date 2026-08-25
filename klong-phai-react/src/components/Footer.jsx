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
            {isEn ? 'KhlongPhai Subdistrict Municipality' : 'เทศบาลตำบลคลองไผ่'}
          </h3>
          <p style={{
            fontSize: '0.85rem',
            color: '#aaa',
            lineHeight: '1.6',
            fontFamily: 'Sarabun, sans-serif'
          }}>
            {isEn 
              ? 'KhlongPhai Subdistrict Municipality, Sikhio, Nakhon Ratchasima'
              : 'เทศบาลตำบลคลองไผ่ อำเภอสีคิ้ว จังหวัดนครราชสีมา'
            }
          </p>
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
              <span>
                {isEn 
                  ? 'Address : KhlongPhai, Sikhio, Nakhon Ratchasima 30140'
                  : 'ที่อยู่ : ต.คลองไผ่ อ.สีคิ้ว จ.นครราชสีมา 30340'
                }
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>Tel :</span>
              <span>044-323 380</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>Gmail :</span>
              <span>klongpaitravel@gmail.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span>Facebook :</span>
              <a 
                href="https://www.facebook.com/profile.php?id=61592569703021" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#00a854', 
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  transition: 'color 0.3s ease, text-decoration 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00d4a8';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#00a854';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                ท่องเที่ยวคลองไผ่
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Tiktok :</span>
              <a 
                href="https://www.tiktok.com/@khlongphai_travel?_r=1&_t=ZS-999d5L4fkcE" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#00a854', 
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  transition: 'color 0.3s ease, text-decoration 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00d4a8';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#00a854';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                @khlongphai_travel
              </a>
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
              {isEn ? 'Activities' : 'กิจกรรม'}
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
          ? ' KhlongPhai Subdistrict Municipality. All rights reserved.'
          : ' เทศบาลตำบลคลองไผ่. สงวนลิขสิทธิ์.'
        }
      </div>
    </footer>
  );
}