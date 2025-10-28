# Authentication Flow

## 🔐 OAuth2 Password Grant Flow

### 1. Login Process

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant AuthService
    participant Backend
    participant AuthStore

    User->>LoginPage: Nhập username/password
    LoginPage->>AuthService: login(username, password)
    AuthService->>Backend: POST /oauth2/token
    Note over AuthService,Backend: grant_type=password<br/>username=xxx<br/>password=xxx
    Backend-->>AuthService: access_token, refresh_token
    AuthService-->>LoginPage: TokenResponse
    LoginPage->>AuthStore: setAuth(token, refreshToken, user)
    AuthStore-->>User: Redirect to /
```

### 2. Protected Routes

```mermaid
sequenceDiagram
    participant User
    participant ProtectedRoute
    participant AuthStore
    participant Page

    User->>ProtectedRoute: Navigate to /
    ProtectedRoute->>AuthStore: Check isAuthenticated
    alt Not authenticated
        AuthStore-->>ProtectedRoute: false
        ProtectedRoute-->>User: Redirect to /login
    else Authenticated
        AuthStore-->>ProtectedRoute: true
        ProtectedRoute->>Page: Render page
        Page-->>User: Show content
    end
```

### 3. API Calls with Token

```mermaid
sequenceDiagram
    participant Component
    participant ApiClient
    participant AuthStore
    participant Backend

    Component->>ApiClient: get/post/put/delete
    ApiClient->>AuthStore: getState().token
    AuthStore-->>ApiClient: Bearer token
    ApiClient->>Backend: Request + Authorization header
    
    alt Success (200)
        Backend-->>ApiClient: Response data
        ApiClient-->>Component: Return data
    else Unauthorized (401)
        Backend-->>ApiClient: 401 Error
        ApiClient->>AuthStore: clearAuth()
        ApiClient-->>Component: Redirect to /login
    end
```

### 4. Logout Process

```mermaid
sequenceDiagram
    participant User
    participant UserMenu
    participant AuthService
    participant Backend
    participant AuthStore

    User->>UserMenu: Click logout
    UserMenu->>AuthService: logout(token)
    AuthService->>Backend: POST /oauth2/revoke
    Note over AuthService,Backend: Revoke token
    Backend-->>AuthService: Success
    AuthService->>AuthStore: clearAuth()
    AuthStore-->>UserMenu: Clear local storage
    UserMenu-->>User: Redirect to /login
```

---

## 📂 Files Structure

```
chat-demo/
├── store/
│   └── authStore.ts              # Zustand store - auth state
├── services/
│   └── auth.service.ts           # OAuth2 login/logout/refresh
├── lib/
│   └── api-client.ts             # Axios instance + interceptors
├── components/
│   ├── ProtectedRoute.tsx        # Route guard
│   └── UserMenu.tsx              # User avatar + logout
└── app/
    └── login/
        └── page.tsx              # Login page
```

---

## 🔧 Configuration

### Backend Endpoint

```
POST http://localhost:12391/oauth2/token
Content-Type: application/json

{
  "grant_type": "password",
  "username": "tnguyen",
  "password": "Password0d!@#"
}
```

### Response Format

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "xxx-refresh-token-xxx",
  "token_type": "Bearer",
  "expires_in": 3600,
  "userId": 1,
  "username": "tnguyen",
  "fullName": "Nguyen Thanh",
  "email": "tnguyen@example.com",
  "roles": ["user", "admin"]
}
```

---

## 🛠️ Tech Stack

### Axios
- HTTP client
- Request/Response interceptors
- Auto attach Authorization header

### Zustand
- Lightweight state management
- Persist middleware (localStorage)
- Type-safe with TypeScript

---

## ✅ Features

### ✨ Implemented

- [x] Login page với OAuth2 Password Grant
- [x] Token storage trong localStorage (persist)
- [x] Protected routes - redirect to /login nếu chưa auth
- [x] Auto attach Bearer token vào mọi API requests
- [x] 401 handling - auto logout và redirect
- [x] Logout functionality
- [x] User menu với avatar
- [x] Loading states

### 🔄 Optional Enhancements

- [ ] Refresh token auto-renewal
- [ ] Remember me checkbox
- [ ] Login with social providers
- [ ] 2FA support
- [ ] Session timeout warning
- [ ] Concurrent login detection

---

## 🚀 Usage

### 1. Start Backend
```bash
cd SourceAPI/SourceAPI
dotnet run
```

Backend chạy ở: `http://localhost:12391`

### 2. Start Frontend
```bash
cd chat-demo
npm run dev
```

Frontend chạy ở: `http://localhost:3001`

### 3. Login

Truy cập: `http://localhost:3001`

Nếu chưa login → tự động redirect đến `/login`

Demo credentials:
- Username: `tnguyen`
- Password: `Password0d!@#`

### 4. Test Flow

1. ✅ Login thành công → redirect về `/`
2. ✅ Token được lưu vào localStorage
3. ✅ Mọi API calls tự động có Authorization header
4. ✅ Click avatar → xem user menu
5. ✅ Click "Đăng xuất" → clear token → redirect `/login`

---

## 🐛 Troubleshooting

### Lỗi: "401 Unauthorized"
- Kiểm tra backend có chạy không
- Kiểm tra endpoint `/oauth2/token` có đúng không
- Verify credentials trong .env.local

### Token bị mất sau reload
- Kiểm tra zustand persist middleware
- Check localStorage có key `auth-storage` không

### API calls không có token
- Kiểm tra axios interceptor trong `api-client.ts`
- Verify `useAuthStore.getState().token` có giá trị

---

**Version**: 2.0.0  
**Updated**: 2025-10-28  
**OAuth2 Flow**: Password Grant  
**State Management**: Zustand + localStorage

