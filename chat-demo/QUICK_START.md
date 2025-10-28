# Quick Start Guide

## 🚀 Chạy ứng dụng

### Backend (ngrok)
Backend đang chạy tại:
```
https://8637f2ef4fa3.ngrok-free.app
```

### Frontend
```bash
cd chat-demo
npm run dev
```

Mở browser: **http://localhost:3001**

---

## 🔐 Login

### Demo Credentials
- **Username**: `tnguyen`
- **Password**: `Password0d!@#`

### OAuth2 Endpoint
```
POST https://8637f2ef4fa3.ngrok-free.app/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
username=tnguyen
password=Password0d!@#
```

### Expected Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "userId": 1,
  "username": "tnguyen",
  "fullName": "Nguyen Thanh",
  "email": "tnguyen@example.com"
}
```

---

## ✅ Test Flow

1. **Mở app**: http://localhost:3001
   - Chưa login → redirect `/login`

2. **Login**:
   - Nhập: `tnguyen` / `Password0d!@#`
   - Click "Đăng nhập"
   - → POST to OAuth2 endpoint
   - → Lưu token vào localStorage
   - → Redirect về `/`

3. **Chat**:
   - Sidebar: Danh sách rooms
   - Click room → xem messages
   - Gõ tin nhắn → Enter gửi
   - Mọi API calls tự động có `Authorization: Bearer {token}`

4. **Logout**:
   - Click avatar góc dưới sidebar
   - Click "Đăng xuất"
   - → Clear token
   - → Redirect `/login`

---

## 🔧 Configuration

### Environment Variables
File: `.env.local`
```env
NEXT_PUBLIC_API_URL=https://8637f2ef4fa3.ngrok-free.app
```

### Config File
File: `config/api.config.ts`
```typescript
export const API_CONFIG = {
  baseURL: 'https://8637f2ef4fa3.ngrok-free.app',
  timeout: 30000,
  // ...
};
```

---

## 📡 API Endpoints

Tất cả requests đều tự động thêm:
```
Authorization: Bearer {access_token}
```

### Auth
- `POST /oauth2/token` - Login/Refresh token
- `POST /oauth2/revoke` - Logout

### Chat
- `GET /api/integrations/rocket/rooms` - Danh sách phòng
- `GET /api/integrations/rocket/{roomId}/messages` - Lấy tin nhắn
- `POST /api/integrations/rocket/send` - Gửi tin nhắn
- `GET /api/integrations/rocket/{roomId}/members` - Danh sách members

---

## 🐛 Troubleshooting

### Lỗi: "Network Error" hoặc CORS
- Kiểm tra backend ngrok có chạy không
- Verify URL: `https://8637f2ef4fa3.ngrok-free.app`
- Check browser console cho chi tiết lỗi

### Lỗi: "401 Unauthorized"
- Token có thể đã hết hạn
- Logout và login lại
- Check localStorage có `auth-storage` không

### API không gọi được
- Verify `.env.local` có đúng URL không
- Restart Next.js dev server: `npm run dev`
- Check Network tab trong DevTools

### Login thất bại
- Verify credentials: `tnguyen` / `Password0d!@#`
- Check Network tab → POST /oauth2/token response
- Backend có trả về đúng format không

---

## 💡 Tips

- **DevTools**: F12 → Network tab để xem requests
- **localStorage**: F12 → Application → Local Storage → xem `auth-storage`
- **Token**: Copy từ localStorage để test với Postman
- **Reload**: Token persist, không mất khi reload page

---

**Happy Chatting!** 💬

