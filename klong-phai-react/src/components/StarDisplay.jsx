// src/components/StarDisplay.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * StarDisplay - Component สำหรับแสดงคะแนนเฉลี่ย
 * @param {number} average - คะแนนเฉลี่ย (เช่น 4.2)
 * @param {number} total - จำนวนคนที่ให้คะแนน
 * @param {number} size - ขนาดของดาว (px)
 * @param {string} color - สีของดาว
 * @param {string} emptyColor - สีของดาวที่ยังไม่ถูกเลือก
 * @param {boolean} showTotal - แสดงจำนวนคนที่ให้คะแนนหรือไม่
 * @param {string} variant - 'inline' หรือ 'block'
 */
export default function StarDisplay({
  average = 0,
  total = 0,
  size = 16,
  color = '#FFD700',
  emptyColor = '#444444',
  showTotal = true,
  variant = 'inline'
}) {
  const { t } = useTranslation();

  // ปัดเศษให้เหลือ 1 ตำแหน่ง
  const displayAverage = Math.round(average * 10) / 10;

  // คำนวณจำนวนดาวเต็ม (เต็ม = 1, ครึ่ง = 0.5)
  const fullStars = Math.floor(displayAverage);
  const hasHalfStar = displayAverage - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const renderStars = () => {
    const stars = [];

    // ดาวเต็ม
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span
          key={`full-${i}`}
          style={{
            color: color,
            fontSize: `${size}px`,
            lineHeight: '1',
            display: 'inline-block'
          }}
        >
          ★
        </span>
      );
    }

    // ดาวครึ่ง (ถ้ามี)
    if (hasHalfStar) {
      stars.push(
        <span
          key="half"
          style={{
            position: 'relative',
            display: 'inline-block',
            fontSize: `${size}px`,
            lineHeight: '1',
            width: `${size * 0.9}px`,
            overflow: 'hidden'
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              overflow: 'hidden',
              color: color
            }}
          >
            ★
          </span>
          <span
            style={{
              color: emptyColor,
              width: '100%',
              display: 'block'
            }}
          >
            ★
          </span>
        </span>
      );
    }

    // ดาวว่าง
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span
          key={`empty-${i}`}
          style={{
            color: emptyColor,
            fontSize: `${size}px`,
            lineHeight: '1',
            display: 'inline-block'
          }}
        >
          ★
        </span>
      );
    }

    return stars;
  };

  // ถ้าไม่มีคะแนนเลย
  if (total === 0) {
    return (
      <span
        style={{
          color: '#666',
          fontSize: `${size * 0.7}px`,
          fontFamily: 'Prompt, sans-serif',
          display: variant === 'block' ? 'block' : 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        {t('rating.no_ratings', 'ยังไม่มีคะแนน')}
      </span>
    );
  }

  // กรณี inline (แสดงใน Card)
  if (variant === 'inline') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'Prompt, sans-serif'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          {renderStars()}
        </span>
        <span
          style={{
            fontSize: `${size * 0.7}px`,
            color: '#ccc',
            fontWeight: 'bold'
          }}
        >
          {displayAverage}
        </span>
        {showTotal && (
          <span
            style={{
              fontSize: `${size * 0.55}px`,
              color: '#666'
            }}
          >
            ({total} {t('rating.reviews', 'รีวิว')})
          </span>
        )}
      </span>
    );
  }

  // กรณี block (แสดงใน Modal / Detail)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        fontFamily: 'Prompt, sans-serif',
        padding: '8px 0'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
          {renderStars()}
        </span>
        <span
          style={{
            fontSize: `${size * 1.2}px`,
            color: '#fff',
            fontWeight: 'bold'
          }}
        >
          {displayAverage}
        </span>
        <span
          style={{
            fontSize: `${size * 0.6}px`,
            color: '#666'
          }}
        >
          / 5
        </span>
      </div>
      {showTotal && (
        <span
          style={{
            fontSize: `${size * 0.6}px`,
            color: '#666'
          }}
        >
          {t('rating.from', 'จาก')} {total} {t('rating.reviews', 'รีวิว')}
        </span>
      )}
    </div>
  );
}