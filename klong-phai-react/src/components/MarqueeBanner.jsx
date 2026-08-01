// src/components/MarqueeBanner.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function MarqueeBanner({ items = [] }) {
  const { i18n } = useTranslation();
  const isEn = (i18n.language || 'th').startsWith('en');

  const defaultItems = isEn ? [
    'Explore Khlong Phai Nature',
    'Top 10 Check-in Points',
    'Authentic Local Food',
    'Cozy Homestay',
    'Plan Your Trip Easily'
  ] : [
    'เที่ยวเทศบาลตำบลคลองไผ่ สัมผัสธรรมชาติ',
    'จุดเช็คอินสุดฮิต 10 อันดับ',
    'ชิมอาหารพื้นเมืองรสเด็ด',
    'ที่พักโฮมสเตย์อบอุ่น',
    'วางแผนทริปได้ง่ายๆ'
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  return (
    <div className="marquee-container">
      <div className="marquee-track">
        {[...Array(3)].map((_, i) => (
          displayItems.map((item, idx) => (
            <span key={`${i}-${idx}`} className="marquee-item">
              {item}
            </span>
          ))
        ))}
      </div>
    </div>
  );
}