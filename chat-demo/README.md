# Chat Demo - Next.js 15 Frontend 💬

Ứng dụng frontend đầy đủ tính năng cho Rocket.Chat Integration, xây dựng bằng **Next.js 15**, **TypeScript** và **Tailwind CSS**.

> **Bám sát 100%** các yêu cầu trong `ROCKETCHAT_TASKS.md` - 62 giờ development tasks

## ✨ Tính năng chính

### 👥 Quản lý người dùng
- ✅ Đồng bộ user từ hệ thống vào Rocket.Chat
- ✅ Tự động sinh username unique
- ✅ Background job integration
- ✅ Idempotent API calls

### 💬 Quản lý phòng chat
- ✅ Tạo group (private) & channel (public)
- ✅ Gắn metadata (department, project)
- ✅ Quy ước tên phòng tự động
- ✅ Filter & search với pagination
- ✅ Archive/Rename/Delete rooms

### 👤 Quản lý thành viên
- ✅ Thêm/xóa members (single & bulk)
- ✅ Phân quyền: Owner/Moderator/Member
- ✅ Rate limiting tự động
- ✅ Đối soát members (reconcile)
- ✅ Transfer ownership

### 📨 Tin nhắn & Chat
- ✅ Gửi tin nhắn vào room
- ✅ Xem lịch sử messages
- ✅ Delete/Pin messages
- ✅ Announcement mode
- ✅ Set topic/announcement

### 🔗 Webhook Integration
- ✅ Cấu hình webhooks
- ✅ 5 loại events: Message/Join/Leave/RoomCreated/RoomDeleted
- ✅ Security: Token validation, HMAC signature
- ✅ Background processing
- ✅ Audit logging

---

## 🚀 Quick Start

### 1. Cài đặt
```bash
npm install
```

### 2. Cấu hình
```bash
cp .env.example .env.local
```

Sửa `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:12391
NEXT_PUBLIC_API_KEY=your-api-key-here
```

### 3. Chạy
```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

## 📁 Cấu trúc project

```
chat-demo/
├── app/                      # Next.js 15 App Router
│   ├── layout.tsx           # Root layout + Navigation
│   ├── page.tsx             # 🏠 Trang chủ (Dashboard)
│   ├── users/               # 👥 Quản lý người dùng
│   ├── rooms/               # 💬 Quản lý phòng chat
│   ├── members/             # 👤 Quản lý thành viên
│   ├── messages/            # 📨 Tin nhắn & Chat
│   ├── webhooks/            # 🔗 Webhook config
│   └── settings/            # ⚙️ Cấu hình hệ thống
├── components/              # Shared components
│   ├── Navigation.tsx       # Navbar responsive
│   ├── PageHeader.tsx       # Page title component
│   └── Card.tsx             # Card container
├── services/                # API Services
│   └── rocketchat.service.ts  # Rocket.Chat API client
├── types/                   # TypeScript types
│   └── rocketchat.ts        # All type definitions
├── config/                  # Configuration
│   └── api.config.ts        # API endpoints
├── lib/                     # Utilities
│   └── api-client.ts        # HTTP client wrapper
├── .env.example             # Environment template
├── FEATURES.md              # Chi tiết tính năng
└── README.md                # This file
```

## 🔧 Cấu hình API

File `config/api.config.ts` chứa tất cả endpoint configurations:

```typescript
export const API_CONFIG = {
  baseURL: 'http://localhost:12391',
  endpoints: {
    auth: { ... },
    user: { ... },
    chat: { ... },
    rocketChat: { ... }
  }
};
```

## 📡 Sử dụng API Client

```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const data = await apiClient.get('/api/users');

// POST request
const result = await apiClient.post('/api/auth/login', {
  username: 'user',
  password: 'pass'
});
```

## 🎨 Tech Stack

- **Next.js 15** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React 19** - UI library

## 📝 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm start` - Chạy production server
- `npm run lint` - Chạy ESLint

## 🔗 Kết nối Backend

Backend (.NET Core) cần chạy trước khi test kết nối:

```bash
cd ../SourceAPI/SourceAPI
dotnet run
```

Sau đó test kết nối tại trang chủ bằng nút "Test Kết Nối Backend".

## 🚀 Deployment

### Build production
```bash
npm run build
```

### Chạy production
```bash
npm start
```

## 📄 License

© 2025 Alliance Software Company
