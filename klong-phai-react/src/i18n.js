// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  th: {
    translation: {
      // ===== Navbar =====
      brand_title: "คลองไผ่",
      nav_home: "หน้าแรก",
      nav_restaurant_acc: "ร้านอาหาร / ที่พัก",
      nav_restaurant: "ร้านอาหาร",
      nav_accommodation: "ที่พัก",
      nav_top10: "10 จุดเช็คอิน",
      nav_map: "แผนที่ชุมชน",
      nav_contact: "ติดต่อเรา",
      nav_plan: "วางแผนการเดินทาง",

      // ===== Hero =====
      hero_title: "เทศบาลตำบลคลองไผ่",
      hero_subtitle: "ค้นพบสถานที่ท่องเที่ยว ที่พัก และร้านอาหารในคลองไผ่",
      search_placeholder: "ค้นหาสถานที่ท่องเที่ยว...",

      // ===== Search =====
      search_result: 'ผลการค้นหา "{keyword}" ({count} รายการ)',
      no_result: "ไม่พบข้อมูลสถานที่ที่คุณค้นหา",

      // ===== Card / Button =====
      btn_map_view: "ดูรายละเอียดและแผนที่",
      btn_nav_map: "ดูแผนที่นำทาง",
      like_label: "ถูกใจ",
      label_hours: "เวลาทำการ:",
      label_phone: "เบอร์โทรศัพท์:",

      // ===== Review =====
      reviews_title: "รีวิวจากผู้เข้าชม",
      btn_submit_review: "ส่งรีวิว",
      edit: "แก้ไข",
      delete: "ลบ",
      cancel: "ยกเลิก",
      save: "บันทึก",
      your_review: "รีวิวของคุณ",
      no_reviews_yet: "ยังไม่มีรีวิว",
      be_first_review: "เป็นคนแรกที่รีวิว!",
      loading_reviews: "กำลังโหลดรีวิว...",
      sign_in_to_review: "เข้าสู่ระบบเพื่อเขียนรีวิว",
      confirm_delete_review: "คุณต้องการลบรีวิวนี้ใช่หรือไม่?",
      review_short: "ข้อความรีวิวสั้นเกินไป (ขั้นต่ำ 2 ตัวอักษร)",
      review_long: "ข้อความรีวิวยาวเกินไป (สูงสุด 200 ตัวอักษร)",
      review_banned: "พบคำไม่เหมาะสม กรุณาแก้ไข",
      review_success: "ส่งรีวิวเรียบร้อย!",
      review_update_success: "แก้ไขรีวิวเรียบร้อย!",
      review_delete_success: "ลบรีวิวเรียบร้อย!",
      review_failed: "ไม่สามารถส่งรีวิวได้",
      review_update_failed: "ไม่สามารถแก้ไขรีวิวได้",
      review_delete_failed: "ไม่สามารถลบรีวิวได้",
      review_placeholder: "เขียนรีวิวเกี่ยวกับสถานที่นี้... (2-200 ตัวอักษร)",

      // ===== Check-in Page =====
      checkin_title: "จัดอันดับ 10 จุดเช็คอิน คลองไผ่",
      checkin_subtitle: "อันดับจะจัดเรียงและเปลี่ยนแปลงแบบเรียลไทม์ผ่านปุ่มโหวตหัวใจ",
      checkin_discuss_title: "พูดคุยเกี่ยวกับ 10 จุดเช็คอินนี้",
      checkin_placeholder: "เขียนรีวิวหรือแนะนำสิ่งที่น่าสนใจใน 10 จุดเช็คอินนี้... (2-200 ตัวอักษร)",
      chars_limit: "ตัวอักษร",
      login_prompt: "กรุณาเข้าสู่ระบบด้วย Google เพื่อยืนยันตัวตนก่อนร่วมแสดงความคิดเห็น",
      google_login: "เข้าสู่ระบบด้วย Google",
      no_reviews: "ยังไม่มีคอมเมนต์ มาร่วมแชร์ความเห็นเป็นคนแรกกันครับ!",
      sending: "กำลังส่ง...",
      rank: "อันดับ",

      // ===== Map Page =====
      map_title: "แผนที่อินโฟกราฟิกชุมชนคลองไผ่",
      map_subtitle: "แผนที่นำเที่ยวสำหรับนักเดินทาง — คลิกหมุดเพื่อดูรายละเอียด",
      filter_all: "ทั้งหมด",
      filter_travel: "สถานที่ท่องเที่ยว",
      filter_accommodation: "ที่พัก",
      filter_restaurant: "ร้านอาหาร",
      showing_places: "แสดง {{count}} จาก {{total}} สถานที่",

      // ===== Detail Page =====
      no_detail_info: "ไม่มีข้อมูลรายละเอียดเพิ่มเติมในขณะนี้",

      // ===== Trip Planner =====
      planner_title: "วางแผนเส้นทางท่องเที่ยว",
      planner_subtitle: "ปัดขวา = เพิ่ม · ปัดซ้าย = ลบออกจากคิว",
      combo_recommend: "Combo แนะนำ",
      selected_places: "จุดแวะในทริป",
      est_time: "เวลาโดยประมาณ",
      queue: "คิวสถานที่แนะนำ",
      no_places_in_queue: "คุณเลือกครบทุกสถานที่ในคิวแล้ว!",
      navigate: "นำทาง",
      add: "เพิ่ม",
      remove: "ลบออก",
      add_to_trip: "เพิ่มลงทริป",
      remove_from_trip: "ลบออกจากทริป",
      added: "เพิ่มแล้ว",
      empty_trip: "ยังไม่มีสถานที่ในทริป",

      // ===== Auth =====
      logout: "ออกจากระบบ",
      sign_in: "เข้าสู่ระบบ",
      sign_out: "ออกจากระบบ",
      admin: "ผู้ดูแลระบบ",

      // ===== Admin =====
      add_place: "เพิ่มสถานที่",
      analytics: "ยอดเข้าชม",
      total_views: "ยอดรวมทั้งหมด",
      page_views: "ยอดเข้าชมหน้า",
      edit_place: "แก้ไขสถานที่",
      delete_place: "ลบสถานที่",

      // ===== Place Categories =====
      attractions: "สถานที่ท่องเที่ยว",
      restaurants: "ร้านอาหาร",
      accommodations: "ที่พัก",
      top10: "10 จุดเช็คอิน",
      map: "แผนที่ชุมชน",
      planner: "วางแผนทริป",
      no_accommodation: "ยังไม่มีข้อมูลที่พักในขณะนี้",
      no_attractions: "ยังไม่มีข้อมูลสถานที่ท่องเที่ยวในขณะนี้",
      no_restaurants: "ยังไม่มีข้อมูลร้านอาหารในขณะนี้",

      // ===== Map Actions =====
      view_map: "ดูแผนที่",
      hide_map: "ซ่อนแผนที่",
      navigate: "นำทาง",
      location: "พิกัด",
      hours: "เวลาทำการ",
      phone: "เบอร์โทร",

      // ===== Loading =====
      loading: "กำลังโหลด...",

      // ===== Form =====
      submit: "ส่ง",
      close: "ปิด",
      confirm: "ยืนยัน",
      ok: "ตกลง",
      yes: "ใช่",
      no: "ไม่",
      continue: "ดำเนินการต่อ",
      back: "กลับ",
      next: "ถัดไป",
      done: "เสร็จ",

      // ===== Sort / Filter =====
      filter: "กรอง",
      sort: "เรียงลำดับ",
      by_likes: "ตามจำนวนไลค์",
      by_name: "ตามชื่อ",
      by_rating: "ตามคะแนน",
      ascending: "น้อยไปมาก",
      descending: "มากไปน้อย",
      clear: "ล้าง",
      apply: "ใช้",

      // ===== Misc =====
      language: "ภาษา",
      thai: "ไทย",
      english: "อังกฤษ",
      welcome: "ยินดีต้อนรับ",
      guest: "แขก",
      profile: "โปรไฟล์",
      settings: "ตั้งค่า",
      help: "ช่วยเหลือ",
      about: "เกี่ยวกับ",
      contact: "ติดต่อ",
      follow_us: "ติดตามเรา",
      share: "แชร์",
      copy_link: "คัดลอกลิงก์",
      copied: "คัดลอกแล้ว",
      open_in_maps: "เปิดใน Google Maps",
      directions: "เส้นทาง",
      start: "เริ่มต้น",
      end: "สิ้นสุด",
      via: "ผ่าน",
      distance: "ระยะทาง",
      duration: "ระยะเวลา",
      mins: "นาที",
      hours: "ชั่วโมง",
      km: "กิโลเมตร",
      view_route: "ดูเส้นทาง",
      plan_trip: "วางแผนทริป",
      select_places: "เลือกสถานที่",
      my_trip: "ทริปของฉัน",
      no_data: "ไม่มีข้อมูล",
      error: "เกิดข้อผิดพลาด",
      retry: "ลองอีกครั้ง",
      success: "สำเร็จ",
      view_details: "ดูรายละเอียด",
      all_places: "ทุกสถานที่",
      search: "ค้นหา",
      reorder: "เรียงลำดับ",
      trip_plan: "แผนทริป",
      estimated_time: "เวลาโดยประมาณ",
      no_traffic: "รถไม่ติด",
      traffic: "รถติด",
      route: "เส้นทาง",
      start_route: "เริ่มนำทาง",
      alert_short: "ข้อความรีวิวสั้นเกินไปครับ",
      alert_long: "ข้อความรีวิวต้องไม่เกิน 200 ตัวอักษรครับ",
      alert_banned: "ข้อความของคุณมีคำไม่เหมาะสม (คำหยาบ) กรุณาแก้ไขก่อนส่งครับ",
      confirm_delete: "คุณต้องการลบคอมเมนต์รีวิวนี้ใช่หรือไม่?",
      
      // ===== Info Sections (Home Page) =====
      about_title: "ชุมชนคลองไผ่คืออะไร?",
      about_desc: "ชุมชนคลองไผ่เป็นชุมชนท่องเที่ยวเชิงนิเวศที่มีความโดดเด่นด้านวัฒนธรรมท้องถิ่น ธรรมชาติที่สวยงาม และการต้อนรับที่อบอุ่น ตั้งอยู่ในพื้นที่อำเภอสีคิ้ว จังหวัดนครราชสีมา เป็นแหล่งท่องเที่ยวที่เหมาะสำหรับผู้ที่ต้องการพักผ่อนหย่อนใจ เรียนรู้วิถีชีวิตท้องถิ่น และสัมผัสกับธรรมชาติที่บริสุทธิ์",
      attractions_title: "สถานที่น่าสนใจ",
      attractions_desc: "ภายในชุมชนคลองไผ่มีสถานที่ท่องเที่ยวที่น่าสนใจมากมาย ทั้งวัดเขาพริก จุดชมวิวเขื่อนลำตะคอง ศูนย์อนุรักษ์พันธุกรรมพืช และกิจกรรม SUP Board ล่องแม่น้ำบรรพกาล (ลำตะคอง) นอกจากนี้ยังมีร้านอาหารและที่พักที่พร้อมให้บริการนักท่องเที่ยวอย่างเต็มรูปแบบ",
      activities_title: "กิจกรรมท่องเที่ยว",
      activities_desc: "เที่ยวชมวัดวาอาราม ชมธรรมชาติ เดินป่าพิชิตยอดเขา ล่องแพ SUP Board ถ่ายรูปจุดชมวิว ชิมอาหารท้องถิ่น และพักผ่อนในโฮมสเตย์ที่อบอุ่น ทุกกิจกรรมได้รับการออกแบบให้เหมาะสมกับนักท่องเที่ยวทุกวัย พร้อมมัคคุเทศก์ท้องถิ่นที่มีประสบการณ์คอยอำนวยความสะดวก",

      // ===== Image Alt Text (เพิ่มเติมเพื่อให้ Home.jsx ทำงานสมบูรณ์) =====
      alt_about_1: "ชุมชนคลองไผ่",
      alt_about_2: "ธรรมชาติคลองไผ่",
      alt_about_3: "วิวคลองไผ่",
      alt_attractions_1: "สถานที่น่าสนใจ",
      alt_attractions_2: "ธรรมชาติ",
      alt_attractions_3: "วิวเขา",
      alt_activities_1: "กิจกรรมท่องเที่ยว",
      alt_activities_2: "กิจกรรมกลางแจ้ง",
      alt_activities_3: "วิวทะเล"
    }
  },
  en: {
    translation: {
      // ===== Navbar =====
      brand_title: "Khlong Phai",
      nav_home: "Home",
      nav_restaurant_acc: "Dining & Stay",
      nav_restaurant: "Restaurants",
      nav_accommodation: "Accommodations",
      nav_top10: "Top 10 Check-ins",
      nav_map: "Community Map",
      nav_contact: "Contact Us",
      nav_plan: "Plan Your Trip",

      // ===== Hero =====
      hero_title: "Khlong Phai Subdistrict Municipality",
      hero_subtitle: "Discover attractions, accommodations and restaurants in Khlong Phai",
      search_placeholder: "Search attractions...",

      // ===== Search =====
      search_result: 'Search results for "{keyword}" ({count} items)',
      no_result: "No places found",

      // ===== Card / Button =====
      btn_map_view: "Details & Map",
      btn_nav_map: "Get Directions",
      like_label: "Likes",
      label_hours: "Opening Hours:",
      label_phone: "Phone:",

      // ===== Review =====
      reviews_title: "Visitor Reviews",
      btn_submit_review: "Submit Review",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      your_review: "Your Review",
      no_reviews_yet: "No reviews yet",
      be_first_review: "Be the first to review!",
      loading_reviews: "Loading reviews...",
      sign_in_to_review: "Sign in to write a review",
      confirm_delete_review: "Are you sure you want to delete this review?",
      review_short: "Review is too short (min 2 characters)",
      review_long: "Review is too long (max 200 characters)",
      review_banned: "Inappropriate language detected",
      review_success: "Review submitted!",
      review_update_success: "Review updated!",
      review_delete_success: "Review deleted!",
      review_failed: "Failed to submit review",
      review_update_failed: "Failed to update review",
      review_delete_failed: "Failed to delete review",
      review_placeholder: "Write a review about this place... (2-200 characters)",

      // ===== Check-in Page =====
      checkin_title: "Top 10 Check-in Points in Khlong Phai",
      checkin_subtitle: "Rankings update in real-time based on heart votes",
      checkin_discuss_title: "Discuss these 10 Check-in Points",
      checkin_placeholder: "Write a review or recommendation... (2-200 characters)",
      chars_limit: "chars",
      login_prompt: "Please sign in with Google to join the discussion.",
      google_login: "Sign in with Google",
      no_reviews: "No comments yet. Be the first to share your thoughts!",
      sending: "Sending...",
      rank: "Rank",

      // ===== Map Page =====
      map_title: "Khlong Phai Community Infographic Map",
      map_subtitle: "Traveler map — Click pins for details",
      filter_all: "All",
      filter_travel: "Attractions",
      filter_accommodation: "Accommodations",
      filter_restaurant: "Restaurants",
      showing_places: "Showing {{count}} of {{total}} places",

      // ===== Detail Page =====
      no_detail_info: "No additional details available at the moment.",

      // ===== Trip Planner =====
      planner_title: "Trip Planner",
      planner_subtitle: "Swipe right = add · Swipe left = remove from queue",
      combo_recommend: "Recommended Combos",
      selected_places: "Places in Trip",
      est_time: "Estimated Time",
      queue: "Recommended Queue",
      no_places_in_queue: "All places selected!",
      navigate: "Navigate",
      add: "Add",
      remove: "Remove",
      add_to_trip: "Add to Trip",
      remove_from_trip: "Remove from Trip",
      added: "Added",
      empty_trip: "No places in your trip yet",

      // ===== Auth =====
      logout: "Sign Out",
      sign_in: "Sign In",
      sign_out: "Sign Out",
      admin: "Admin",

      // ===== Admin =====
      add_place: "Add Place",
      analytics: "Analytics",
      total_views: "Total Views",
      page_views: "Page Views",
      edit_place: "Edit Place",
      delete_place: "Delete Place",

      // ===== Place Categories =====
      attractions: "Attractions",
      restaurants: "Restaurants",
      accommodations: "Accommodations",
      top10: "Top 10 Check-ins",
      map: "Community Map",
      planner: "Trip Planner",
      no_accommodation: "No accommodations available at the moment.",
      no_attractions: "No attractions available at the moment.",
      no_restaurants: "No restaurants available at the moment.",

      // ===== Map Actions =====
      view_map: "View Map",
      hide_map: "Hide Map",
      navigate: "Navigate",
      location: "Location",
      hours: "Opening Hours",
      phone: "Phone",

      // ===== Loading =====
      loading: "Loading...",

      // ===== Form =====
      submit: "Submit",
      close: "Close",
      confirm: "Confirm",
      ok: "OK",
      yes: "Yes",
      no: "No",
      continue: "Continue",
      back: "Back",
      next: "Next",
      done: "Done",

      // ===== Sort / Filter =====
      filter: "Filter",
      sort: "Sort",
      by_likes: "By Likes",
      by_name: "By Name",
      by_rating: "By Rating",
      ascending: "Ascending",
      descending: "Descending",
      clear: "Clear",
      apply: "Apply",

      // ===== Misc =====
      language: "Language",
      thai: "Thai",
      english: "English",
      welcome: "Welcome",
      guest: "Guest",
      profile: "Profile",
      settings: "Settings",
      help: "Help",
      about: "About",
      contact: "Contact",
      follow_us: "Follow Us",
      share: "Share",
      copy_link: "Copy Link",
      copied: "Copied!",
      open_in_maps: "Open in Google Maps",
      directions: "Directions",
      start: "Start",
      end: "End",
      via: "Via",
      distance: "Distance",
      duration: "Duration",
      mins: "mins",
      hours: "hours",
      km: "km",
      view_route: "View Route",
      plan_trip: "Plan Trip",
      select_places: "Select Places",
      my_trip: "My Trip",
      no_data: "No Data",
      error: "Error",
      retry: "Retry",
      success: "Success",
      view_details: "View Details",
      all_places: "All Places",
      search: "Search",
      reorder: "Reorder",
      trip_plan: "Trip Plan",
      estimated_time: "Estimated Time",
      no_traffic: "No Traffic",
      traffic: "Traffic",
      route: "Route",
      start_route: "Start Route",
      alert_short: "Review text is too short.",
      alert_long: "Review text must not exceed 200 characters.",
      alert_banned: "Your text contains inappropriate language. Please edit before submitting.",
      confirm_delete: "Are you sure you want to delete this comment?",
      
      // ===== Info Sections (Home Page) =====
      about_title: "What is Khlong Phai Community?",
      about_desc: "Khlong Phai is an ecotourism community with outstanding local culture, beautiful nature, and warm hospitality. Located in Sikhio District, Nakhon Ratchasima Province, it is a perfect destination for those seeking relaxation, learning about local life, and experiencing pristine nature.",
      attractions_title: "Interesting Places",
      attractions_desc: "Khlong Phai community has many interesting tourist attractions including Wat Khao Phrik, Lam Takhong Dam viewpoint, Plant Genetic Conservation Center, and SUP Board activities on the ancient river (Lam Takhong). There are also restaurants and accommodations ready to serve tourists.",
      activities_title: "Tourist Activities",
      activities_desc: "Visit temples, enjoy nature, hike to the mountain peak, rafting, SUP Board, take photos at viewpoints, taste local food, and relax in cozy homestays. All activities are designed to suit tourists of all ages, with experienced local guides to facilitate your journey.",

      // ===== Image Alt Text (เพิ่มเติมเพื่อให้ Home.jsx ทำงานสมบูรณ์) =====
      alt_about_1: "Khlong Phai Community",
      alt_about_2: "Khlong Phai Nature",
      alt_about_3: "Khlong Phai View",
      alt_attractions_1: "Interesting Places",
      alt_attractions_2: "Nature",
      alt_attractions_3: "Mountain View",
      alt_activities_1: "Tourist Activities",
      alt_activities_2: "Outdoor Activities",
      alt_activities_3: "Sea View"
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