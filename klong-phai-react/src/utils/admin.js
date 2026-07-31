// src/utils/admin.js

// ✅ Admin emails - ใช้ตัวพิมพ์เล็กทั้งหมด
export const ADMIN_EMAILS = [
  "teet44182@gmail.com",
  "เทศบาล@gmail.com"
];

export const checkIsAdmin = (user) => {
  if (!user || !user.email) return false;
  const emailLower = user.email.toLowerCase();
  return ADMIN_EMAILS.some(adminEmail => 
    adminEmail.toLowerCase() === emailLower
  );
};

// ✅ ฟังก์ชัน sanitize สำหรับ admin actions
export const sanitizeAdminAction = (action) => {
  const allowedActions = ['create', 'update', 'delete', 'upload'];
  if (!action) return false;
  return allowedActions.includes(action.toLowerCase());
};