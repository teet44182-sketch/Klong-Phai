# Klongpai - เว็บไซต์ท่องเที่ยวชุมชนคลองไผ่

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.x-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![รองรับภาษา](https://img.shields.io/badge/Language-TH%20%7C%20EN-blue.svg)](#การรองรับหลายภาษา-multi-language)

Klongpai เป็นเว็บแอปพลิเคชันยุคใหม่สำหรับการส่งเสริมและยกระดับการท่องเที่ยวเชิงชุมชนคลองไผ่ ช่วยให้นักท่องเที่ยวค้นหาสถานที่ท่องเที่ยวลับ วางแผนการเดินทางแบบ interactive อ่านรีวิวจากผู้ใช้จริง และอุดหนุนสินค้า/กิจกรรมของคนในชุมชนได้อย่างมีประสิทธิภาพ

---

## สารบัญ (Table of Contents)

1. [คุณสมบัติเด่น (Features)](#คุณสมบัติเด่น-features)
2. [เทคโนโลยีที่ใช้ (Tech Stack)](#เทคโนโลยีที่ใช้-tech-stack)
3. [การติดตั้งและการใช้งาน (Getting Started)](#การติดตั้งและการใช้งาน-getting-started)
   - [ข้อกำหนดเบื้องต้น (Prerequisites)](#ข้อกำหนดเบื้องต้น-prerequisites)
   - [ขั้นตอนการติดตั้ง (Installation)](#ขั้นตอนการติดตั้ง-installation)
   - [การตั้งค่า Environment Variables (.env)](#การตั้งค่า-environment-variables-env)
   - [การรันและ Build โปรเจกต์ (Development & Build)](#การรันและ-build-โปรเจกต์-development--build)
4. [การตั้งค่า Firebase (Firebase Configuration)](#การตั้งค่า-firebase-firebase-configuration)
5. [การ Deploy บน Vercel](#การ-deploy-บน-vercel)
6. [โครงสร้างโปรเจกต์ (Project Structure)](#โครงสร้างโปรเจกต์-project-structure)
7. [คู่มือการใช้งาน (Usage Guide)](#คู่มือการใช้งาน-usage-guide)
8. [ผู้พัฒนาและผู้สนับสนุน (Contributors & Acknowledgments)](#ผู้พัฒนาและผู้สนับสนุน-contributors--acknowledgments)
9. [สัญญาอนุญาต (License)](#สัญญาอนุญาต-license)

---

## คุณสมบัติเด่น (Features)

- **ค้นหาสถานที่ท่องเที่ยวชุมชน (Explore Local Attractions)**: ค้นหาและดูรายละเอียดสถานที่ท่องเที่ยว ร้านอาหารเด็ด ที่พักโฮมสเตย์ และจุดทำกิจกรรมเชิงวัฒนธรรม
- **ระบบวางแผนการเดินทาง (Interactive Trip Planner)**: วางแผนการเดินทางรายวัน พร้อมระบบคำนวณเส้นทางและนำทางผ่าน Google Maps
- **ระบบรีวิวและให้คะแนน (Rating & Review System)**: ให้คะแนนสถานที่ 1-5 ดาว พร้อมระบบความปลอดภัยป้องกันการปั๊มรีวิว (Rate Limit: ส่งรีวิวได้ 1 ครั้ง ต่อ 5 นาที)
- **ระบบวิเคราะห์ข้อมูล (Built-in Analytics)**: เก็บสถิติยอดเข้าชมหน้าเว็บ (Page Views) และสถิติการคลิกนำทาง (Navigation Clicks) เพื่อให้นำข้อมูลไปพัฒนาชุมชนต่อได้
- **ระบบโปรโมชั่น (Promotions & Local Deals)**: จัดแสดงโปรโมชั่น ส่วนลด และดีลพิเศษสำหรับกิจกรรมทำมือ/เวิร์กชอปของชุมชน
- **รองรับ 2 ภาษา (Multi-Language)**: สลับเปลี่ยนภาษาไทย (TH) และภาษาอังกฤษ (EN) ได้อย่างราบรื่น
- **ระบบจัดการหลังบ้าน (Admin CMS Dashboard)**: ระบบจัดการข้อมูลสถานที่ ตรวจสอบรีวิว อัปเดตแบนเนอร์โปรโมชั่น และดูรายงาน Analytics

---

## เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend
- **Framework & Tooling**: [React 18](https://react.dev/), [Vite](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Styling & UI**: Tailwind CSS / Lucide React Icons
- **Interactive Maps**: [@react-google-maps/api](https://react-google-maps-api-docs.netlify.app/)

### Backend & Cloud Services (BaaS)
- **Database**: Firebase Firestore (NoSQL Database)
- **Authentication**: Firebase Auth (Email/Password & Google Sign-In)
- **Hosting**: [Vercel](https://vercel.com/)

---

## การติดตั้งและการใช้งาน (Getting Started)

### ข้อกำหนดเบื้องต้น (Prerequisites)

เครื่องคอมพิวเตอร์ของคุณต้องติดตั้งโปรแกรมต่อไปนี้ก่อนเริ่มงาน:
- **Node.js**: เวอร์ชั่น `v18.x` ขึ้นไป (แนะนำเวอร์ชั่น LTS)
- **npm** (v9+) หรือ **yarn** / **pnpm**
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Vercel CLI** (ตัวเลือกเสริม: `npm install -g vercel`)

---

### ขั้นตอนการติดตั้ง (Installation)

1. **Clone ตัวคลังโค้ด (Repository)**:
   ```bash
   git clone https://github.com/teet44182-sketch/Klong-Phai.git
   cd Klong_Phai/klong-phai-react
   ```

2. **ติดตั้ง Dependencies ทั้งหมด**:
   ```bash
   npm install
   ```

---

### การตั้งค่า Environment Variables (.env)

สร้างไฟล์ `.env.local` ไว้ที่ Root Directory(klong-phai-react) ของโปรเจกต์ แล้วใส่ค่าคอนฟิกดังนี้:

```env
# Firebase Configuration

```

---

### การรันและ Build โปรเจกต์ (Development & Build)

- **รัน Server สำหรับพัฒนา (Local Development)**:
  ```bash
  npm run dev
  ```
  เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`

- **Build สำหรับนำไปใช้งานจริง (Production Build)**:
  ```bash
  npm run build
  ```

- **ทดลองรันไฟล์ที่ Build แล้ว (Preview Production)**:
  ```bash
  npm run preview
  ```

---

## การตั้งค่า Firebase (Firebase Configuration)

### ตัวอย่าง Firestore Security Rules

นำโค้ดด้านล่างไปใส่ในช่อง Security Rules ของ Firebase Firestore เพื่อกำหนดสิทธิ์การเข้าถึงข้อมูลและการจำกัดเวลาการส่งรีวิว (Rate Limit):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    
    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn()
        && request.auth.token.email != null
        && (
          request.auth.token.email.lower() == 'klongpaitravel@gmail.com'
          
        );
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidString(field, min, max) {
      return field is string
        && field.size() >= min
        && field.size() <= max;
    }

    function isValidRating(rating) {
      return rating is number
        && rating >= 1
        && rating <= 5;
    }

    
    match /reviews/{reviewId} {
      allow read: if true;

      allow create: if isSignedIn()
        && request.resource.data.keys().hasAll(['placeId', 'text', 'userId', 'name'])
        && isValidString(request.resource.data.text, 2, 200)
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.placeId is string
        && request.resource.data.name is string;

      allow update: if isSignedIn()
        && (isOwner(resource.data.userId) || isAdmin())
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['text', 'updatedAt'])
        && isValidString(request.resource.data.text, 2, 200);

      allow delete: if isSignedIn() && (isOwner(resource.data.userId) || isAdmin());
    }

    
    match /ratings/{ratingId} {
      allow read: if true;

      allow create: if isSignedIn()
        && request.resource.data.keys().hasAll(['placeId', 'userId', 'rating'])
        && request.resource.data.userId == request.auth.uid
        && isValidRating(request.resource.data.rating)
        && request.resource.data.placeId is string;

      allow update: if isSignedIn()
        && (isOwner(resource.data.userId) || isAdmin())
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['rating', 'reviewText', 'updatedAt'])
        && isValidRating(request.resource.data.rating);

      allow delete: if isSignedIn() && (isOwner(resource.data.userId) || isAdmin());
    }

    
    match /navigationClicks/{clickId} {
      allow read: if isAdmin();

      allow create: if isSignedIn()
        && request.resource.data.keys().hasAll(['placeId', 'source'])
        && request.resource.data.placeId is string
        && request.resource.data.source is string
        && request.resource.data.source in [
          'detail_modal',
          'planner',
          'card',
          'checkin_promo',
          'detail_page',
          'map_marker'
        ];

      allow update: if false;
      allow delete: if false;
    }

    
    match /places/{placeId} {
      allow read: if true;
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    
    match /promotions/{promoId} {
      allow read: if true;
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    
    match /analytics/{docId} {
      allow read: if isAdmin();
      allow create, update: if true;
    }

    
    match /dailyViews/{date} {
      allow read: if isAdmin();
      allow create, update: if true;
    }

    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## การ Deploy บน Vercel

### วิธีที่ 1: Deploy ผ่าน Vercel CLI

```bash
# เข้าสู่ระบบ Vercel
vercel login

# Deploy เพื่อดูตัวอย่าง (Preview)
vercel

# Deploy ขึ้นระบบใช้งานจริง (Production)
vercel --prod
```

### วิธีที่ 2: Deploy ผ่าน GitHub Integration (แนะนำ)

1. Push โค้ดขึ้นคลังเก็บโค้ดของคุณ (GitHub / GitLab / Bitbucket)
2. นำเข้าโปรเจกต์บน [Vercel Dashboard](https://vercel.com/new)
3. เลือก Framework Preset เป็น **Vite**
4. เพิ่มค่าในไฟล์ `.env.local` ทั้งหมดเข้าไปในช่อง **Environment Variables** บน Vercel
5. กดปุ่ม **Deploy**

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
klong-phai-react/
├── public/
│   ├── icon1.svg
│   └── icon1.png
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   ├── context/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── i18n.js
│   ├── firebase.js
│   └── main.jsx
├── .env.example
├── .gitignore
├── .oxlintrc.json
├── index.html
├── LICENSE
├── package.json
├── package-lock.json
├── vercel.json
├── vite.config.js
└── README.md
```

---

## คู่มือการใช้งาน (Usage Guide)

1. **การค้นหาสถานที่**: ค้นหาสถานที่ท่องเที่ยว ร้านอาหาร และที่พัก ผ่านช่องค้นหาด้านบน หรือเลือกตามหมวดหมู่ที่ต้องการ
2. **การวางแผนทริปท่องเที่ยว**: ไปที่หน้า **Trip Planner** ค้นหาสถานที่และกดปุ่มเพิ่มในตารางเวลาประจำวัน จากนั้นกดปุ่ม "นำทาง" เพื่อให้ระบบสร้างเส้นทางบน Google Maps
3. **การเขียนรีวิว**: คลิกเลือกสถานที่ที่เคยไป เลือกคะแนนดาว (1-5 ดาว) พิมพ์ข้อความแสดงความคิดเห็น แล้วกดส่ง (หมายเหตุ: บัญชีผู้ใช้สามารถส่งรีวิวได้ 1 ครั้ง ในทุกๆ 5 นาที)
4. **สำหรับผู้ดูแลระบบ (Admin)**: เข้าสู่ระบบผ่าน Email: `klongpaitravel@gmail.com` เพื่อเพิ่ม/แก้ไขข้อมูลสถานที่ท่องเที่ยว ตรวจสอบยอดเข้าชม (Page Views) สถิติการคลิก และจัดการกิจกรรมโปรโมชั่น

---

## ผู้พัฒนาและผู้สนับสนุน (Contributors & Acknowledgments)

ขอขอบพระคุณชุมชนคลองไผ่ คนในชุมชน มัคคุเทศก์ท้องถิ่น และทีมงานผู้มีส่วนร่วมทุกท่านที่ให้ข้อมูลและสนับสนุนการพัฒนาโปรเจกต์เพื่อสังคมในครั้งนี้

- **ทีมพัฒนา**: ทีมคลองไผ่จ้า
- **ผู้สนับสนุนในการให้ข้อมูลเกี่ยวกับชุมชนคลองไผ่**: เทศบาลตำบลคลองไผ่, พี่เลี้ยงชุมชน, อาจารย์มทส, ผู้ให้ข้อมูลตามสถานที่เที่ยวต่างๆในชุมชนคลองไผ่

---

## สัญญาอนุญาต (License)

ซอฟต์แวร์นี้เผยแพร่ภายใต้ **MIT License** - อ่านรายละเอียดเพิ่มเติมได้ที่ไฟล์ [LICENSE](LICENSE)