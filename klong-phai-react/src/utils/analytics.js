// src/utils/analytics.js
import { db } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
  deleteDoc,
  getDoc
} from 'firebase/firestore';

/**
 * Analytics Utility - บันทึกสถิติการกดปุ่มนำทาง
 */

/**
 * บันทึกการคลิกปุ่มนำทาง
 * @param {string} placeId - ID ของสถานที่
 * @param {string|null} userId - UID ของผู้ใช้ (ถ้ามี)
 * @param {string} source - แหล่งที่มาของการคลิก
 */
export const trackNavigationClick = async (placeId, userId = null, source = 'unknown') => {
  if (!placeId) {
    console.warn('trackNavigationClick: placeId is required');
    return;
  }

  try {
    const clickData = {
      placeId,
      userId: userId || null,
      source,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, 'navigationClicks'), clickData);

    // ✅ อัปเดตเฉพาะถ้า placeId เป็น ID จริง (ไม่ใช่ 'checkin_page')
    if (placeId !== 'checkin_page') {
      const placeRef = doc(db, 'places', placeId);
      await updateDoc(placeRef, {
        totalNavigationClicks: increment(1)
      });
    }

    console.log(`✅ Navigation click tracked for place ${placeId} from ${source}`);
  } catch (error) {
    console.error('❌ Failed to track navigation click:', error);
  }
};

/**
 * บันทึกการให้คะแนน (Rating) และอัปเดตค่าเฉลี่ย
 */
export const submitRating = async (placeId, userId, rating, reviewText = '', reviewId = null) => {
  if (!placeId || !userId) {
    return { success: false, message: 'Missing placeId or userId' };
  }
  if (rating < 1 || rating > 5) {
    return { success: false, message: 'Rating must be between 1 and 5' };
  }

  try {
    const batch = writeBatch(db);

    if (reviewId) {
      const ratingRef = doc(db, 'ratings', reviewId);
      batch.update(ratingRef, {
        rating,
        reviewText: reviewText || '',
        updatedAt: serverTimestamp()
      });
    } else {
      const ratingRef = doc(collection(db, 'ratings'));
      batch.set(ratingRef, {
        placeId,
        userId,
        rating,
        reviewText: reviewText || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    await batch.commit();

    // ✅ ถ้า placeId ไม่ใช่ 'checkin_page' ให้คำนวณค่าเฉลี่ย
    if (placeId !== 'checkin_page') {
      await recalculatePlaceRating(placeId);
    } else {
      console.log(`⏭️ Skipped rating recalculation for ${placeId} (not a real place)`);
    }

    return { success: true, message: 'Rating submitted successfully' };
  } catch (error) {
    console.error('❌ Failed to submit rating:', error);
    return { success: false, message: error.message };
  }
};

/**
 * คำนวณค่าเฉลี่ยคะแนนของสถานที่ใหม่ และอัปเดตใน places collection
 * @param {string} placeId
 */
export const recalculatePlaceRating = async (placeId) => {
  try {
    // ✅ ตรวจสอบว่าเอกสาร places มีอยู่จริง
    const placeRef = doc(db, 'places', placeId);
    const placeSnap = await getDoc(placeRef);
    if (!placeSnap.exists()) {
      console.log(`⏭️ Place ${placeId} does not exist, skipping rating update`);
      return;
    }

    const ratingsQuery = query(
      collection(db, 'ratings'),
      where('placeId', '==', placeId)
    );
    const snapshot = await getDocs(ratingsQuery);

    let total = 0;
    let count = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.rating && typeof data.rating === 'number') {
        total += data.rating;
        count++;
      }
    });

    const avg = count > 0 ? total / count : 0;
    const avgRounded = Math.round(avg * 10) / 10;

    await updateDoc(placeRef, {
      avgRating: avgRounded,
      totalRatings: count
    });

    console.log(`Updated rating for place ${placeId}: avg=${avgRounded}, count=${count}`);
  } catch (error) {
    console.error('❌Failed to recalculate place rating:', error);
  }
};

/**
 * ลบ Rating
 */
export const deleteRating = async (ratingId, placeId) => {
  if (!ratingId || !placeId) return;

  try {
    await deleteDoc(doc(db, 'ratings', ratingId));
    if (placeId !== 'checkin_page') {
      await recalculatePlaceRating(placeId);
    }
  } catch (error) {
    console.error('❌ Failed to delete rating:', error);
  }
};