// src/components/StarRating.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * StarRating - Component สำหรับให้คะแนนดาว (1-5)
 * @param {number} rating - คะแนนปัจจุบัน (0 = ยังไม่ได้เลือก)
 * @param {function} onChange - ฟังก์ชันเมื่อมีการเลือกคะแนน
 * @param {boolean} readonly - โหมดอ่านอย่างเดียว (ไม่สามารถคลิกได้)
 * @param {number} size - ขนาดของดาว (px)
 * @param {string} color - สีของดาวที่เลือก
 * @param {string} emptyColor - สีของดาวที่ยังไม่ถูกเลือก
 */
export default function StarRating({
  rating = 0,
  onChange = null,
  readonly = false,
  size = 28,
  color = '#FFD700',
  emptyColor = '#555555'
}) {
  const { t } = useTranslation();
  const [hoverRating, setHoverRating] = useState(0);

  // ถ้าเป็น readonly หรือไม่มี onChange ให้ใช้ rating ที่รับมา
  const displayRating = readonly ? rating : (hoverRating || rating);

  const handleClick = (selectedRating) => {
    if (readonly || !onChange) return;
    if (selectedRating === rating) {
      // ถ้าคลิกซ้ำ ให้ reset เป็น 0 (ยกเลิกการให้คะแนน)
      onChange(0);
    } else {
      onChange(selectedRating);
    }
  };

  const handleMouseEnter = (index) => {
    if (readonly) return;
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const getStarLabel = (index) => {
    const labels = {
      1: t('rating.poor', 'แย่'),
      2: t('rating.fair', 'พอใช้'),
      3: t('rating.good', 'ดี'),
      4: t('rating.very_good', 'ดีมาก'),
      5: t('rating.excellent', 'ยอดเยี่ยม')
    };
    return labels[index] || '';
  };

  return (
    <div
      className="star-rating"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        direction: 'ltr',
        cursor: readonly ? 'default' : 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      role={readonly ? 'img' : 'radiogroup'}
      aria-label={readonly ? t('rating.average', 'คะแนนเฉลี่ย') : t('rating.select', 'เลือกคะแนน')}
    >
      {[1, 2, 3, 4, 5].map((index) => {
        const isFilled = index <= displayRating;
        const isHovered = index <= hoverRating;
        const starColor = (isFilled || isHovered) ? color : emptyColor;

        return (
          <span
            key={index}
            className="star-item"
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            style={{
              display: 'inline-block',
              fontSize: `${size}px`,
              lineHeight: '1',
              color: starColor,
              transition: 'transform 0.15s ease, color 0.15s ease',
              transform: (isHovered && !readonly) ? 'scale(1.2)' : 'scale(1)',
              cursor: readonly ? 'default' : 'pointer',
              position: 'relative'
            }}
            role={readonly ? 'presentation' : 'radio'}
            aria-checked={isFilled}
            aria-label={getStarLabel(index)}
            tabIndex={readonly ? -1 : 0}
            onKeyDown={(e) => {
              if (readonly || !onChange) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(index);
              }
            }}
          >
            ★
          </span>
        );
      })}

      {/* แสดงข้อความ Hover หรือค่าคะแนน */}
      {!readonly && hoverRating > 0 && (
        <span
          style={{
            marginLeft: '8px',
            fontSize: `${size * 0.5}px`,
            color: '#aaa',
            fontFamily: 'Prompt, sans-serif',
            minWidth: '40px'
          }}
        >
          {getStarLabel(hoverRating)}
        </span>
      )}

      {readonly && rating > 0 && (
        <span
          style={{
            marginLeft: '8px',
            fontSize: `${size * 0.5}px`,
            color: '#aaa',
            fontFamily: 'Prompt, sans-serif'
          }}
        >
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}