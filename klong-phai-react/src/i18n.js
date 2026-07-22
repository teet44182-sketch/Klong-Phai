// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  th: {
    translation: {
      brand_title: "คลองไผ่",
      nav_home: "หน้าแรก",
      nav_restaurant_acc: "ร้านอาหาร / ที่พัก",
      nav_restaurant: "ร้านอาหาร",
      nav_accommodation: "ที่พัก",
      nav_top10: "10 จุดเช็คอิน",
      nav_map: "แผนที่ชุมชน",
      nav_contact: "ติดต่อเรา",
      nav_plan: "วางแผนการเดินทาง",
      hero_title: "เที่ยวชุมชน คลองไผ่",
      search_placeholder: "ค้นหาสถานที่ท่องเที่ยว...",
      search_result: 'ผลการค้นหา "{keyword}" ({count} รายการ)',
      no_result: "ไม่พบข้อมูลสถานที่ที่คุณค้นหา",
      btn_map_view: "ดูรายละเอียดและแผนที่",
      btn_nav_map: "ดูแผนที่นำทาง",
      like_label: "ถูกใจ",
      label_hours: "เวลาทำการ:",
      label_phone: "เบอร์โทรศัพท์:",
      reviews_title: "รีวิวจากผู้เข้าชม",
      logout: "ออกจากระบบ",
      btn_submit_review: "ส่งรีวิว",
      edit: "แก้ไข",
      delete: "ลบ",
      cancel: "ยกเลิก",
      save: "บันทึก",
      checkin_title: "จัดอันดับ 10 จุดเช็คอิน คลองไผ่",
      checkin_subtitle: "อันดับจะจัดเรียงและเปลี่ยนแปลงแบบเรียลไทม์ผ่านปุ่มโหวตหัวใจ",
      checkin_discuss_title: "พูดคุยเกี่ยวกับ 10 จุดเช็คอินนี้",
      checkin_placeholder: "เขียนรีวิวหรือแนะนำสิ่งที่น่าสนใจใน 10 จุดเช็คอินนี้... (2-200 ตัวอักษร)",
      chars_limit: "ตัวอักษร",
      login_prompt: "กรุณาเข้าสู่ระบบด้วย Google เพื่อยืนยันตัวตนก่อนร่วมแสดงความคิดเห็น",
      google_login: "Sign in with Google",
      no_reviews: "ยังไม่มีคอมเมนต์ มาร่วมแชร์ความเห็นเป็นคนแรกกันครับ!",
      sending: "กำลังส่ง...",
      map_title: "แผนที่อินโฟกราฟิกชุมชนคลองไผ่",
      map_subtitle: "แผนที่นำเที่ยวสำหรับนักเดินทาง — คลิกหมุดเพื่อดูรายละเอียด",
      filter_all: "ทั้งหมด",
      filter_travel: "สถานที่ท่องเที่ยว",
      filter_accommodation: "ที่พัก",
      filter_restaurant: "ร้านอาหาร",
      showing_places: "แสดง {{count}} จาก {{total}} สถานที่",
      no_detail_info: "ไม่มีข้อมูลรายละเอียดเพิ่มเติมในขณะนี้",
      confirm_delete: "คุณต้องการลบคอมเมนต์รีวิวนี้ใช่หรือไม่?",
      alert_short: "ข้อความรีวิวสั้นเกินไปครับ",
      alert_long: "ข้อความรีวิวต้องไม่เกิน 200 ตัวอักษรครับ",
      alert_banned: "ข้อความของคุณมีคำไม่เหมาะสม (คำหยาบ) กรุณาแก้ไขก่อนส่งครับ",
      rank: "อันดับ"
    }
  },
  en: {
    translation: {
      brand_title: "Khlong Phai",
      nav_home: "Home",
      nav_restaurant_acc: "Dining & Stay",
      nav_restaurant: "Restaurants",
      nav_accommodation: "Accommodations",
      nav_top10: "Top 10 Check-ins",
      nav_map: "Community Map",
      nav_contact: "Contact Us",
      nav_plan: "Plan Your Trip",
      hero_title: "Explore Khlong Phai",
      search_placeholder: "Search attractions...",
      search_result: 'Search results for "{keyword}" ({count} items)',
      no_result: "No places found",
      btn_map_view: "Details & Map",
      btn_nav_map: "Get Directions",
      like_label: "Likes",
      label_hours: "Opening Hours:",
      label_phone: "Phone:",
      reviews_title: "Visitor Reviews",
      logout: "Sign Out",
      btn_submit_review: "Submit Review",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      checkin_title: "Top 10 Check-in Points in Khlong Phai",
      checkin_subtitle: "Rankings update in real-time based on heart votes",
      checkin_discuss_title: "Discuss these 10 Check-in Points",
      checkin_placeholder: "Write a review or recommendation... (2-200 characters)",
      chars_limit: "chars",
      login_prompt: "Please sign in with Google to join the discussion.",
      google_login: "Sign in with Google",
      no_reviews: "No comments yet. Be the first to share your thoughts!",
      sending: "Sending...",
      map_title: "Khlong Phai Community Infographic Map",
      map_subtitle: "Traveler map — Click pins for details",
      filter_all: "All",
      filter_travel: "Attractions",
      filter_accommodation: "Accommodations",
      filter_restaurant: "Restaurants",
      showing_places: "Showing {{count}} of {{total}} places",
      no_detail_info: "No additional details available at the moment.",
      confirm_delete: "Are you sure you want to delete this comment?",
      alert_short: "Review text is too short.",
      alert_long: "Review text must not exceed 200 characters.",
      alert_banned: "Your text contains inappropriate language. Please edit before submitting.",
      rank: "Rank"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "th",
    fallbackLng: "th",
    interpolation: { escapeValue: false }
  });

export default i18n;