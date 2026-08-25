// src/utils/rateLimit.js

/**
 * Rate Limit Utility - จำกัดการส่งรีวิว 1 ครั้ง / 5 นาที ต่อ User
 * ใช้ localStorage ร่วมกับ userId เพื่อบันทึกเวลาส่งล่าสุด
 */

// จำนวนนาทีที่จำกัด
const RATE_LIMIT_MINUTES = 5;

// Prefix สำหรับเก็บใน localStorage
const STORAGE_KEY_PREFIX = 'klongpai_review_limit_';

/**
 * ตรวจสอบว่า User สามารถส่งรีวิวได้หรือไม่
 * @param {string} userId - UID ของผู้ใช้จาก Firebase Auth
 * @returns {{ allowed: boolean, remainingMinutes?: number }}
 */
export const checkRateLimit = (userId) => {
  if (!userId) {
    // ถ้าไม่มี userId (ไม่ได้ Login) ไม่อนุญาตให้ส่ง
    return { allowed: false, message: 'กรุณาเข้าสู่ระบบก่อน' };
  }

  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
  const lastTimeStr = localStorage.getItem(storageKey);

  if (!lastTimeStr) {
    // ยังไม่เคยส่งรีวิวเลย
    return { allowed: true };
  }

  const lastTime = parseInt(lastTimeStr, 10);
  if (isNaN(lastTime)) {
    // ถ้า timestamp ผิดพลาด ให้ reset
    localStorage.removeItem(storageKey);
    return { allowed: true };
  }

  const elapsedMinutes = (Date.now() - lastTime) / (60 * 1000);

  if (elapsedMinutes < RATE_LIMIT_MINUTES) {
    // ยังไม่ครบ 5 นาที
    const remainingMinutes = Math.ceil(RATE_LIMIT_MINUTES - elapsedMinutes);
    return {
      allowed: false,
      remainingMinutes,
      message: `กรุณารออีก ${remainingMinutes} นาที ก่อนส่งรีวิวครั้งถัดไป`
    };
  }

  // ผ่านเงื่อนไขแล้ว
  return { allowed: true };
};

/**
 * บันทึกเวลาส่งรีวิวปัจจุบัน (เรียกหลังจากส่งสำเร็จ)
 * @param {string} userId - UID ของผู้ใช้
 */
export const setRateLimit = (userId) => {
  if (!userId) return;
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
  localStorage.setItem(storageKey, String(Date.now()));
};

/**
 * รีเซ็ต Rate Limit ของ User (ใช้ในกรณีทดสอบ หรือ Admin)
 * @param {string} userId - UID ของผู้ใช้
 */
export const resetRateLimit = (userId) => {
  if (!userId) return;
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
  localStorage.removeItem(storageKey);
};

/**
 * ดึงเวลาที่เหลือ (นาที) ที่ต้องรอ
 * @param {string} userId - UID ของผู้ใช้
 * @returns {number | null} - นาทีที่เหลือ, null ถ้าไม่มีการจำกัด
 */
export const getRemainingMinutes = (userId) => {
  if (!userId) return null;
  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
  const lastTimeStr = localStorage.getItem(storageKey);
  if (!lastTimeStr) return null;

  const lastTime = parseInt(lastTimeStr, 10);
  if (isNaN(lastTime)) return null;

  const elapsedMinutes = (Date.now() - lastTime) / (60 * 1000);
  if (elapsedMinutes >= RATE_LIMIT_MINUTES) return null;

  return Math.ceil(RATE_LIMIT_MINUTES - elapsedMinutes);
};