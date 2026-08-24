// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  th: {
    translation: {
      // ===== Navbar =====
      brand_title: "เที่ยวคลองไผ่",
      nav_home: "หน้าแรก",
      nav_restaurant_acc: "ร้านอาหาร / ที่พัก",
      nav_restaurant: "ร้านอาหาร",
      nav_accommodation: "ที่พัก",
      nav_top10: "กิจกรรม",
      nav_map: "แผนที่ชุมชน",
      nav_contact: "ติดต่อเรา",
      nav_plan: "วางแผนการเดินทาง",

      // ===== Hero (Home Page) =====
      hero_title: "เที่ยวคลองไผ่",
      hero_subtitle: "ท่องเที่ยวคลองไผ่ ในแบบที่เป็นคุณ",
      hero_description: "ค้นพบสถานที่ วางแผนการเดินทาง และออกไปสัมผัสคลองไผ่ได้ง่าย ๆ ในที่เดียว",
      hero_button: "สำรวจคลองไผ่",
      hero_more_info: "ข้อมูลเพิ่มเติม",

      // ===== Hero Alt =====
      hero_alt: "วัดเขาพริก",

      // ===== Feature Cards (ระหว่าง Hero กับ Description) =====
      features_title: "เที่ยวคลองไผ่ได้ง่ายขึ้น",
      features_subtitle: "เครื่องมือช่วยค้นหาสถานที่ สำรวจแผนที่ วางแผนทริป และค้นหากิจกรรม",
      feature_1_title: "แนะนำสถานที่",
      feature_1_desc: "รวมจุดน่าเที่ยวและสถานที่น่าสนใจในคลองไผ่ ที่อยากชวนให้คุณออกไปสัมผัสด้วยตัวเอง",
      feature_2_title: "แผนที่ชุมชน",
      feature_2_desc: "สำรวจสถานที่น่าสนใจรอบคลองไผ่ พร้อมข้อมูลสำหรับการเดินทาง",
      feature_3_title: "วางแผนการเดินทาง",
      feature_3_desc: "เลือกสถานที่ที่สนใจ แล้วจัดแผนการเดินทางของคุณได้ง่าย ๆ ในที่เดียว",
      feature_4_title: "กิจกรรมน่าสนใจ",
      feature_4_desc: "หลากหลายกิจกรรม ทั้งเดินเขา ล่องเรือ SUP และเรียนรู้ภูมิปัญญาท้องถิ่น",

      // ===== Search =====
      search_placeholder: "ค้นหาสถานที่ท่องเที่ยว...",
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
      about_desc: "คลองไผ่คือคำตอบของวันพักผ่อนที่แท้จริง ชุมชนเล็กๆ ริมน้ำที่เต็มไปด้วยวิถีชีวิตเรียบง่าย ธรรมชาติบริสุทธิ์ และวัฒนธรรมท้องถิ่นที่ยังคงความเป็นเอกลักษณ์ ที่นี่คุณจะได้พบกับภูเขา สายน้ำ รอยยิ้มอบอุ่น และการต้อนรับที่ทำให้คุณรู้สึกเหมือนอยู่บ้าน เหมาะสำหรับทุกคนที่ต้องการหลีกหนีความวุ่นวาย มาพักผ่อนหย่อนใจ และเก็บเกี่ยวประสบการณ์ดีๆ ติดตัวกลับไป",
      attractions_section_title: "สถานที่น่าสนใจ",
      attractions_section_desc: "ภายในชุมชนคลองไผ่มีสถานที่ท่องเที่ยวที่น่าสนใจมากมาย ทั้งวัดเขาพริก จุดชมวิวเขื่อนลำตะคอง ศูนย์อนุรักษ์พันธุกรรมพืช และกิจกรรม SUP Board ล่องแม่น้ำบรรพกาล (ลำตะคอง) นอกจากนี้ยังมีร้านอาหารและที่พักที่พร้อมให้บริการนักท่องเที่ยวอย่างเต็มรูปแบบ",
      activities_section_title: "กิจกรรมท่องเที่ยว",
      activities_section_desc: "เที่ยวชมวัดวาอาราม ชมธรรมชาติ เดินป่าพิชิตยอดเขา ล่องแพ SUP Board ถ่ายรูปจุดชมวิว ชิมอาหารท้องถิ่น และพักผ่อนในโฮมสเตย์ที่อบอุ่น ทุกกิจกรรมได้รับการออกแบบให้เหมาะสมกับนักท่องเที่ยวทุกวัย พร้อมมัคคุเทศก์ท้องถิ่นที่มีประสบการณ์คอยอำนวยความสะดวก",

      // ===== Image Alt Text =====
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
      brand_title: "Explore Klongpai",
      nav_home: "Home",
      nav_restaurant_acc: "Dining & Stay",
      nav_restaurant: "Restaurants",
      nav_accommodation: "Accommodations",
      nav_top10: "Top 10 Check-ins",
      nav_map: "Community Map",
      nav_contact: "Contact Us",
      nav_plan: "Plan Your Trip",

      // ===== Hero (Home Page) =====
      hero_title: "Klongpai",
      hero_subtitle: "Explore Klongpai, Your Way",
      hero_description: "Discover places, plan your journey, and experience Klongpai all in one place.",
      hero_button: "Explore Klongpai",
      hero_more_info: "More information",

      // ===== Hero Alt =====
      hero_alt: "Wat Khao Phrik",

      // ===== Feature Cards (ระหว่าง Hero กับ Description) =====
      features_title: "Explore Klongpai with Ease",
      features_subtitle: "Tools to discover places, explore the map, plan your trip, and find activities.",
      feature_1_title: "Recommended Places",
      feature_1_desc: "Discover must-visit spots and interesting places around Klongpai, waiting for you to explore.",
      feature_2_title: "Community Map",
      feature_2_desc: "Explore interesting places around Klongpai with useful travel information.",
      feature_3_title: "Plan Your Trip",
      feature_3_desc: "Choose the places you want to visit and easily create your own itinerary in one place.",
      feature_4_title: "Interesting Activities",
      feature_4_desc: "Various activities including hiking, SUP boating, and learning local wisdom",

      // ===== Search =====
      search_placeholder: "Search attractions...",
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
      checkin_title: "Top 10 Check-in Points in Klongpai",
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
      map_title: "Klongpai Community Infographic Map",
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
      about_title: "What is Klongpai Community?",
      about_desc: "Klongpai is the perfect escape from city life. A small riverside community with simple living, pristine nature, and rich local culture. Here you'll find mountains, rivers, warm smiles, and hospitality that makes you feel at home. Perfect for anyone looking to relax, recharge, and take home unforgettable experiences.",
      attractions_section_title: "Interesting Places",
      attractions_section_desc: "Klongpai community has many interesting tourist attractions including Wat Khao Phrik, Lam Takhong Dam viewpoint, Plant Genetic Conservation Center, and SUP Board activities on the ancient river (Lam Takhong). There are also restaurants and accommodations ready to serve tourists.",
      activities_section_title: "Tourist Activities",
      activities_section_desc: "Visit temples, enjoy nature, hike to the mountain peak, rafting, SUP Board, take photos at viewpoints, taste local food, and relax in cozy homestays. All activities are designed to suit tourists of all ages, with experienced local guides to facilitate your journey.",

      // ===== Image Alt Text =====
      alt_about_1: "Klongpai Community",
      alt_about_2: "Klongpai Nature",
      alt_about_3: "Klongpai View",
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