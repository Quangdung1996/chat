# Rocket.Chat Integration - Task List

**Tổng thời gian ước tính**: 62 giờ  
**Backend**: ASP.NET Core API  
**Database**: SQL Server / PostgreSQL (sử dụng EF Core)

---

## 📊 Tiến độ tổng quan

| Giai đoạn | Tasks | Estimate | Status | Thanh toán |
|-----------|-------|----------|--------|------------|
| Giai đoạn 1 | T-01 → T-11 | 16h | 🟡 In Progress | 30% khi bắt đầu, 70% khi hoàn thành |
| Giai đoạn 2 | T-10, T-11, T-15 | 4h | ⚪ Pending | 100% khi bắt đầu |
| Giai đoạn 3 | T-16 → T-38 | 42h | ⚪ Pending | 100% khi bắt đầu |

**Ký hiệu**: ✅ Done | 🟢 In Progress | ⚪ Pending | ❌ Blocked

---

## 🔐 Giai đoạn 1: Xác thực & Đồng bộ người dùng (16h)

### Dịch vụ xác thực

- [ ] **T-01**: RocketChatAuthService (3h)
  - [ ] Implement `LoginAsync()` - Đăng nhập Rocket.Chat
  - [ ] Implement `LogoutAsync()` - Đăng xuất
  - [ ] Implement `GetTokenAsync()` - Lấy token
  - [ ] Implement `ValidateTokenAsync()` - Validate token
  - [ ] Xử lý 401/timeout/retry logic
  - **DoD**: Gọi được login/logout; lấy/validate token; xử lý 401/timeout; trả về token + userId sẵn dùng

- [ ] **T-02**: Cache token + tự làm mới (2h)
  - [ ] Implement token caching với TTL (~23h)
  - [ ] Auto-refresh khi token sắp hết hạn
  - [ ] Thread-safe implementation
  - [ ] Cấu hình TTL qua `appsettings.json`
  - **DoD**: Token cache với TTL; tự refresh khi hết hạn; thread-safe; cấu hình TTL qua appsettings

- [ ] **T-03**: Cấu hình + Dependency Injection (1h)
  - [ ] HttpClient configuration (BaseUrl, headers)
  - [ ] DI registration cho các services
  - [ ] Đọc config từ appsettings
  - [ ] Health check endpoint
  - **DoD**: HttpClient cấu hình BaseUrl/header mặc định; DI đăng ký services; đọc config từ appsettings

### Đồng bộ người dùng

- [ ] **T-06**: Migration bảng UserRocketChatMapping (1h)
  - [ ] Tạo migration cho bảng `UserRocketChatMapping`
  - [ ] Thêm unique index trên (UserId, RocketUserId)
  - [ ] Test migrate/rollback
  - **DoD**: Tạo bảng mapping + unique index; chạy migrate/rollback ok

- [ ] **T-07**: Model EF + cấu hình DbContext (1h)
  - [ ] Entity class `UserRocketChatMapping`
  - [ ] Fluent API configuration
  - [ ] CRUD repository pattern
  - **DoD**: Entity + Fluent API hoàn chỉnh; CRUD cơ bản hoạt động

- [ ] **T-08**: RocketChatUserService (3h)
  - [ ] `CreateUserAsync()` - Tạo user trên Rocket.Chat
  - [ ] `SyncUserAsync()` - Đồng bộ user
  - [ ] `UserExistsAsync()` - Kiểm tra user tồn tại
  - [ ] `GetMappingAsync()` - Lấy mapping
  - [ ] Error handling với messages rõ ràng
  - **DoD**: Gọi users.create; trả RocketUserId/Username; persist mapping; bắt lỗi có ngữ nghĩa

- [ ] **T-09**: Sinh username/password an toàn (2h)
  - [ ] Generate unique username (slug + số)
  - [ ] Generate strong password
  - [ ] Retry logic khi trùng username
  - [ ] Unit tests cho username generation
  - **DoD**: Username unique (slug + số); password đủ mạnh; retry khi trùng

- [ ] **T-10**: Hook vào đăng ký - Background job (2h)
  - [ ] Background job queue (Hangfire/BackgroundService)
  - [ ] Enqueue sync job sau khi user đăng ký
  - [ ] Không chặn response
  - [ ] Logging thành công/thất bại
  - **DoD**: Đăng ký xong sẽ enqueue sync Rocket; không chặn response; log thành công/thất bại

- [ ] **T-11**: API POST /api/integrations/rocket/sync-user (1h)
  - [ ] Endpoint với API key authentication
  - [ ] Idempotent implementation
  - [ ] Response: `{userId, rocketUserId, username}`
  - [ ] Swagger documentation
  - **DoD**: Endpoint bảo vệ bằng API key; idempotent; trả {userId, rocketUserId, username}

---

## 🏠 Giai đoạn 2: Khởi tạo phòng (4h)

### Khởi tạo phòng & đặt tên

- [ ] **T-15**: Quy ước tên phòng (1h)
  - [ ] Rule: `{PhongBan}-{DuAn}-{HauTo}`
  - [ ] Slug hoá (không dấu, lowercase, hyphen)
  - [ ] Check unique/trùng lặp
  - [ ] Validate độ dài/ký tự hợp lệ
  - **DoD**: Sinh tên/slug chuẩn; tránh trùng; rule kiểm soát độ dài/ký tự

- [ ] **T-16**: Gắn metadata vào phòng (1h)
  - [ ] Set DepartmentId/ProjectId vào mô tả
  - [ ] Set custom fields
  - [ ] Hiển thị đúng trên Rocket.Chat UI
  - **DoD**: Mô tả/customFields set đúng; hiển thị chuẩn trên Rocket UI

- [ ] **T-17**: Tạo nhóm riêng tư groups.create (2h)
  - [ ] Call Rocket.Chat API `groups.create`
  - [ ] Lưu RoomId/Name vào DB
  - [ ] Tuỳ chọn readonly/announcement
  - [ ] Error handling
  - **DoD**: Tạo group private; lưu RoomId/Name vào DB; tuỳ chọn readOnly hoạt động

- [ ] **T-18**: Tạo kênh công khai channels.create (1h)
  - [ ] Call API `channels.create`
  - [ ] Lưu mapping vào DB
  - [ ] Test join channel
  - **DoD**: Tạo channel public; lưu mapping; có thể join được

- [ ] **T-19b**: API POST /api/integrations/rocket/create-group (1h)
  - [ ] Endpoint với API key auth
  - [ ] Validate input
  - [ ] Response: `{roomId, groupCode}`
  - [ ] Idempotent theo groupCode
  - **DoD**: Endpoint bảo vệ; validate input; trả {roomId, groupCode}; idempotent theo groupCode

---

## 👥 Giai đoạn 3: Quản lý thành viên & Webhook (42h)

### Thành viên & vai trò

- [ ] **T-20**: Thêm thành viên (2h)
  - [ ] `groups.invite` / `channels.invite`
  - [ ] Check đã là member → skip
  - [ ] Ghi `RoomMemberMapping`
  - **DoD**: Invite thành công; kiểm tra đã là member thì bỏ qua; ghi RoomMemberMapping

- [ ] **T-21**: Xoá thành viên (2h)
  - [ ] `groups.kick` / `channels.kick`
  - [ ] Check quyền
  - [ ] Cập nhật DB
  - [ ] Audit log
  - **DoD**: Kick thành công; kiểm tra quyền; cập nhật DB; audit log

- [ ] **T-22**: Gán vai trò owner/moderator (2h)
  - [ ] Add/Remove owner
  - [ ] Add/Remove moderator
  - [ ] Validate ≥1 owner còn lại
  - [ ] Cập nhật DB
  - **DoD**: Add/Remove owner/moderator; luôn còn ≥1 owner; DB phản ánh đúng

- [ ] **T-23**: Thêm hàng loạt với rate limiting (2h)
  - [ ] Bulk add members
  - [ ] Delay/throttle để tránh rate limit
  - [ ] Report success/fail từng user
  - **DoD**: Thêm theo danh sách; delay chống rate limit; báo cáo success/fail từng user

- [ ] **T-24**: Đối soát thành viên (1h)
  - [ ] So sánh Rocket.Chat API vs DB
  - [ ] Cập nhật dữ liệu lệch
  - [ ] Báo cáo chênh lệch
  - **DoD**: So sánh API vs DB; cập nhật lệch; báo cáo chênh lệch

### Chính sách & thiết lập nhóm

- [ ] **T-25**: Nhóm thông báo (2h)
  - [ ] Bật announcement mode (chỉ owner/moderator post)
  - [ ] Set topic/announcement
  - [ ] Pin message
  - **DoD**: Bật chế độ announcement; đặt topic/announcement; pin message mẫu

### Vòng đời nhóm

- [ ] **T-26**: Rename/Archive/Delete (2h)
  - [ ] `groups.rename`
  - [ ] `groups.archive` / `groups.unarchive`
  - [ ] `groups.delete` (với confirmation)
  - [ ] Audit log
  - **DoD**: Đổi tên/lưu trữ/xoá hoạt động; xác nhận trước khi xoá; audit log

- [ ] **T-27**: Chuyển quyền chủ sở hữu (1h)
  - [ ] Transfer owner
  - [ ] Validate target là member
  - [ ] Confirm trên Rocket & DB
  - **DoD**: Transfer owner chỉ khi target là member; xác nhận thành công trên Rocket & DB

### Danh bạ & tìm kiếm nhóm

- [ ] **T-30**: API liệt kê/tìm kiếm nhóm (2h)
  - [ ] GET endpoint với pagination
  - [ ] Filter theo department/project/owner
  - [ ] Response JSON chuẩn
  - **DoD**: Liệt kê có phân trang; filter theo dept/project/owner; trả JSON ổn định

### Hook hiển thị thông tin

- [ ] **T-41**: API GET /api/rocketchat/user/{id}/info (2h)
  - [ ] Endpoint với API key auth
  - [ ] Cache 5 phút
  - [ ] Trả fullName/department/email
  - **DoD**: Bảo vệ bằng API key; cache tạm 5'; trả fullName/department/email

- [ ] **T-42**: Slash command /userinfo (2h)
  - [ ] Cấu hình slash command trong Rocket.Chat
  - [ ] Endpoint xử lý command
  - [ ] Trả về attachment card với thông tin user
  - [ ] Giới hạn quyền truy vấn
  - **DoD**: Slash command hoạt động; hiển thị card với Tên/Phòng ban; giới hạn quyền truy vấn

### Webhook cơ bản

- [ ] **T-31**: POST /api/webhooks/rocketchat (2h)
  - [ ] Nhận payload
  - [ ] Trả 200 trong <200ms
  - [ ] Enqueue job xử lý nền
  - **DoD**: Nhận payload; trả 200 trong <200ms; đẩy job vào queue để xử lý sau

- [ ] **T-32**: Cấu hình Outgoing Webhook (1h)
  - [ ] Thiết lập trong Rocket.Chat Admin
  - [ ] Test 3 events: Message/Join/Leave
  - **DoD**: Thiết lập trong Admin; test bắn đủ 3 sự kiện sang API

- [ ] **T-33**: Kiểm tra token/HMAC (3h)
  - [ ] Validate webhook token
  - [ ] Validate HMAC signature
  - [ ] Chặn request không hợp lệ
  - [ ] Log với correlationId
  - **DoD**: Xác thực token/HMAC; chặn request sai; log đầy đủ correlationId

### Xử lý sự kiện

- [ ] **T-34**: Event dispatcher (2h)
  - [ ] `IWebhookEventHandler` interface
  - [ ] Event router/dispatcher
  - [ ] Retry logic cho lỗi tạm thời
  - **DoD**: Dispatcher định tuyến theo event; interface handler; retry đơn giản cho lỗi tạm thời

- [ ] **T-35**: Log tin nhắn ChatMessageLog (4h)
  - [ ] Bảng `ChatMessageLog` (messageId, roomId, userId, text, timestamp)
  - [ ] Index theo room/time
  - [ ] Map user với hệ thống nội bộ
  - **DoD**: Lưu messageId/roomId/userId/text/time; index theo room/time; map user chuẩn

- [ ] **T-36**: Luật can thiệp (2h)
  - [ ] Policy xoá tin nhắn theo từ khoá
  - [ ] Call `chat.delete` API
  - [ ] Audit log
  - [ ] Bot phản hồi tự động
  - **DoD**: Policy xoá theo từ khoá/quy tắc; audit; phản hồi bot khi cần

- [ ] **T-36b**: Helper gửi tin nhắn (2h)
  - [ ] `chat.postMessage` wrapper
  - [ ] POST /api/rocket/send endpoint
  - [ ] Support roomId/groupCode
  - [ ] Trả về messageId
  - **DoD**: Gửi chủ động vào room bởi bot; hỗ trợ roomId/groupCode; trả về messageId

- [ ] **T-37**: Join/Leave event handler (2h)
  - [ ] Cập nhật `RoomMemberMapping` khi join
  - [ ] Cập nhật khi leave
  - [ ] Idempotent
  - [ ] Audit log
  - **DoD**: Cập nhật DB khi user vào/ra room; idempotent; audit

- [ ] **T-38**: Room created/deleted event (2h)
  - [ ] Đồng bộ khi phòng tạo từ Rocket UI
  - [ ] Đồng bộ khi phòng xoá
  - [ ] Trạng thái DB khớp với Rocket.Chat
  - **DoD**: Đồng bộ khi phòng tạo/xoá từ Rocket UI; trạng thái DB khớp Rocket

---

## 📁 Cấu trúc Backend

```
SourceAPI/
├── SourceAPI.RocketChat/          # New project
│   ├── Services/
│   │   ├── Auth/
│   │   │   ├── IRocketChatAuthService.cs
│   │   │   └── RocketChatAuthService.cs
│   │   ├── Users/
│   │   │   ├── IRocketChatUserService.cs
│   │   │   └── RocketChatUserService.cs
│   │   ├── Rooms/
│   │   │   ├── IRocketChatRoomService.cs
│   │   │   └── RocketChatRoomService.cs
│   │   └── Webhooks/
│   │       ├── IWebhookEventHandler.cs
│   │       └── WebhookEventDispatcher.cs
│   ├── Models/
│   │   ├── Requests/
│   │   ├── Responses/
│   │   └── DTOs/
│   ├── Data/
│   │   ├── Entities/
│   │   │   ├── UserRocketChatMapping.cs
│   │   │   ├── RoomMapping.cs
│   │   │   ├── RoomMemberMapping.cs
│   │   │   └── ChatMessageLog.cs
│   │   ├── Migrations/
│   │   └── RocketChatDbContext.cs
│   ├── BackgroundJobs/
│   │   ├── SyncUserJob.cs
│   │   └── ProcessWebhookJob.cs
│   └── Helpers/
│       ├── SlugHelper.cs
│       └── PasswordGenerator.cs
└── SourceAPI/
    ├── Controllers/
    │   └── Integrations/
    │       └── RocketChatController.cs
    └── appsettings.json             # Add RocketChat config
```

---

## 🔧 Configuration (appsettings.json)

```json
{
  "RocketChat": {
    "BaseUrl": "http://localhost:3000",
    "AdminUsername": "admin",
    "AdminPassword": "your-admin-password",
    "BotUsername": "integration-bot",
    "BotPassword": "bot-password",
    "TokenCacheTTL": 82800,
    "WebhookSecret": "your-webhook-secret",
    "ApiKey": "your-api-key",
    "RateLimitDelayMs": 100
  }
}
```

---

## 📝 Notes

- **Authentication**: Sử dụng API key hoặc JWT cho các endpoint integration
- **Background Jobs**: Dùng Hangfire hoặc BackgroundService của .NET
- **Caching**: IMemoryCache hoặc Redis
- **Logging**: Serilog với structured logging
- **Testing**: Unit tests + Integration tests
- **Documentation**: Swagger/OpenAPI

---

## 🚀 Getting Started

1. Cài đặt Rocket.Chat (xem `ROCKETCHAT_SETUP.md`)
2. Tạo admin user và bot user
3. Cấu hình `appsettings.json`
4. Chạy migrations
5. Start backend API
6. Test authentication endpoint
7. Test user sync
8. Cấu hình webhooks trong Rocket.Chat Admin

