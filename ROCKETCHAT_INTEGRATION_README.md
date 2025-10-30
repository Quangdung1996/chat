# Rocket.Chat Integration - Backend Implementation

Tích hợp Rocket.Chat vào hệ thống ASP.NET Core API.

## 📋 Tổng quan

Dự án này implement tích hợp với Rocket.Chat để:
- ✅ Đồng bộ người dùng từ hệ thống nội bộ
- ✅ Tạo và quản lý nhóm/kênh chat
- ✅ Quản lý thành viên và vai trò
- ✅ Gửi tin nhắn tự động
- ✅ Nhận webhook events từ Rocket.Chat

## 🏗️ Cấu trúc

```
SourceAPI/
├── Data/
│   └── Entities/                    # Database entities
│       ├── RocketUserMapping.cs
│       ├── RoomMapping.cs
│       ├── RoomMemberMapping.cs
│       └── ChatMessageLog.cs
├── Models/
│   └── RocketChat/                  # DTOs and models
│       ├── RocketChatConfig.cs
│       └── DTOs/
├── Services/
│   └── RocketChat/                  # Business logic
│       ├── IRocketChatAuthService.cs
│       ├── RocketChatAuthService.cs
│       ├── IRocketChatUserService.cs
│       ├── RocketChatUserService.cs
│       ├── IRocketChatRoomService.cs
│       └── RocketChatRoomService.cs
├── Helpers/
│   └── RocketChat/                  # Helper utilities
│       ├── SlugHelper.cs
│       └── PasswordGenerator.cs
├── Controllers/
│   └── Integrations/
│       └── RocketChatIntegrationController.cs
├── Extensions/
│   └── RocketChatServiceExtensions.cs
└── Middleware/
    └── RocketChatApiKeyMiddleware.cs
```

## 🚀 Setup

### 1. Cài đặt Rocket.Chat

Xem file `ROCKETCHAT_SETUP.md` để cài đặt Rocket.Chat server.

```bash
./start-rocketchat.sh
```

### 2. Tạo Admin và Bot users trong Rocket.Chat

1. Mở http://localhost:3000
2. Tạo admin user đầu tiên
3. Tạo bot user:
   - Go to Administration → Users → New
   - Username: `integration-bot`
   - Email: `bot@yourdomain.com`
   - Password: (strong password)
   - Roles: Select `bot`

### 3. Cấu hình Backend

Cập nhật `appsettings.json`:

```json
{
  "RocketChat": {
    "BaseUrl": "http://localhost:3000",
    "AdminUsername": "admin",
    "AdminPassword": "your-admin-password",
    "BotUsername": "integration-bot",
    "BotPassword": "bot-password",
    "TokenCacheTTL": 82800,
    "WebhookSecret": "generate-random-secret-key",
    "ApiKey": "generate-random-api-key",
    "RateLimitDelayMs": 100,
    "MaxRetryAttempts": 3,
    "RetryDelayMs": 1000
  }
}
```

### 4. Cập nhật Startup.cs

Thêm vào `ConfigureServices`:

```csharp
using SourceAPI.Extensions;

public void ConfigureServices(IServiceCollection services)
{
    // ... existing services ...
    
    // Add Rocket.Chat integration
    services.AddRocketChatServices(Configuration);
}
```

Thêm vào `Configure`:

```csharp
using SourceAPI.Middleware;

public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // ... existing middleware ...
    
    // Add API key validation for Rocket.Chat endpoints
    app.UseRocketChatApiKey();
    
    // ... rest of middleware ...
}
```

### 5. Chạy Database Migrations

```bash
# TODO: Create migrations for the entities
dotnet ef migrations add RocketChatIntegration
dotnet ef database update
```

**Note**: Bạn cần tự tạo migrations vì phụ thuộc vào DbContext hiện tại của bạn.

## 📡 API Endpoints

### Authentication

Tất cả endpoints yêu cầu header:
```
X-API-Key: your-api-key-for-endpoints
```

### 1. Sync User (T-11)

Đồng bộ user từ hệ thống nội bộ sang Rocket.Chat.

**Request:**
```http
POST /api/integrations/rocket/sync-user
Content-Type: application/json
X-API-Key: your-api-key

{
  "userId": 123,
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A"
}
```

**Response:**
```json
{
  "userId": 123,
  "rocketUserId": "abc123xyz",
  "username": "nguyen-van-a",
  "isNewUser": true,
  "message": "User synced successfully"
}
```

### 2. Create Group (T-19b)

Tạo nhóm chat riêng tư hoặc kênh công khai.

**Request:**
```http
POST /api/integrations/rocket/create-group
Content-Type: application/json
X-API-Key: your-api-key

{
  "name": "Dự án ABC",
  "groupCode": "PROJ-001",
  "departmentId": 5,
  "projectId": 10,
  "description": "Nhóm chat dự án ABC",
  "isPrivate": true,
  "isReadOnly": false,
  "members": ["user1-rocket-id", "user2-rocket-id"]
}
```

**Response:**
```json
{
  "roomId": "room123xyz",
  "groupCode": "PROJ-001",
  "name": "du-an-abc",
  "success": true,
  "message": "group created successfully"
}
```

### 3. Add Members

Thêm thành viên vào nhóm (bulk).

**Request:**
```http
POST /api/integrations/rocket/{roomId}/add-members
Content-Type: application/json
X-API-Key: your-api-key

{
  "rocketUserIds": ["user1-id", "user2-id", "user3-id"],
  "roomType": "group"
}
```

**Response:**
```json
{
  "success": true,
  "totalProcessed": 3,
  "successCount": 3,
  "failCount": 0,
  "details": {
    "user1-id": true,
    "user2-id": true,
    "user3-id": true
  }
}
```

### 4. Send Message (T-36b)

Gửi tin nhắn vào phòng chat.

**Request:**
```http
POST /api/integrations/rocket/send
Content-Type: application/json
X-API-Key: your-api-key

{
  "roomId": "room123xyz",
  "text": "Thông báo: Họp nhóm lúc 14h",
  "alias": "System Bot"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg123abc"
}
```

## 🔐 Authentication Flow

1. **Admin Token**: Dùng cho các tác vụ quản lý (tạo user, tạo group, etc.)
   - Auto-cached với TTL 23 hours
   - Auto-refresh khi gần hết hạn

2. **Bot Token**: Dùng cho gửi tin nhắn tự động
   - Tương tự admin token

3. **User Token**: Có thể implement riêng nếu cần impersonate user

## 📊 Database Schema

### Rocket_UserMapping

```sql
CREATE TABLE Rocket_UserMapping (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    RocketUserId NVARCHAR(50) NOT NULL,
    RocketUsername NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    LastSyncAt DATETIME2,
    IsActive BIT NOT NULL,
    Metadata NVARCHAR(1000),
    CONSTRAINT UQ_User_Rocket UNIQUE (UserId, RocketUserId)
);
```

### RoomMapping

```sql
CREATE TABLE RoomMapping (
    Id INT PRIMARY KEY IDENTITY,
    GroupCode NVARCHAR(100) NOT NULL UNIQUE,
    RocketRoomId NVARCHAR(50) NOT NULL,
    RoomName NVARCHAR(200) NOT NULL,
    RoomType NVARCHAR(20) NOT NULL,
    DepartmentId INT,
    ProjectId INT,
    Description NVARCHAR(500),
    IsReadOnly BIT NOT NULL,
    IsArchived BIT NOT NULL,
    IsDeleted BIT NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    CreatedBy INT,
    UpdatedAt DATETIME2,
    CustomFields NVARCHAR(2000)
);
```

### RoomMemberMapping

```sql
CREATE TABLE RoomMemberMapping (
    Id INT PRIMARY KEY IDENTITY,
    RoomMappingId INT NOT NULL,
    UserMappingId INT NOT NULL,
    UserId INT NOT NULL,
    RocketUserId NVARCHAR(50) NOT NULL,
    Role NVARCHAR(20) NOT NULL,
    IsActive BIT NOT NULL,
    JoinedAt DATETIME2 NOT NULL,
    LeftAt DATETIME2,
    LastActivityAt DATETIME2,
    FOREIGN KEY (RoomMappingId) REFERENCES RoomMapping(Id),
    FOREIGN KEY (UserMappingId) REFERENCES Rocket_UserMapping(Id)
);
```

### ChatMessageLog

```sql
CREATE TABLE ChatMessageLog (
    Id BIGINT PRIMARY KEY IDENTITY,
    RocketMessageId NVARCHAR(50) NOT NULL UNIQUE,
    RocketRoomId NVARCHAR(50) NOT NULL,
    RocketUserId NVARCHAR(50) NOT NULL,
    UserId INT,
    RoomMappingId INT,
    MessageText NVARCHAR(MAX) NOT NULL,
    MessageType NVARCHAR(50) NOT NULL,
    IsDeleted BIT NOT NULL,
    IsAutoDeleted BIT NOT NULL,
    DeletionReason NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL,
    LoggedAt DATETIME2 NOT NULL,
    Metadata NVARCHAR(MAX)
);

CREATE INDEX IX_ChatMessageLog_Room_Time ON ChatMessageLog(RocketRoomId, CreatedAt);
```

## 🧪 Testing

### Manual Testing

1. **Test User Sync:**
```bash
curl -X POST http://localhost:5000/api/integrations/rocket/sync-user \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "userId": 1,
    "email": "test@example.com",
    "fullName": "Test User"
  }'
```

2. **Test Group Creation:**
```bash
curl -X POST http://localhost:5000/api/integrations/rocket/create-group \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "groupCode": "TEST-001",
    "name": "Test Group",
    "isPrivate": true
  }'
```

### Unit Tests

TODO: Add unit tests for:
- SlugHelper
- PasswordGenerator
- Services

## 📝 Implementation Checklist

### ✅ Completed (Giai đoạn 1)

- [x] T-01: RocketChatAuthService (Login/Logout/Token/Validate)
- [x] T-02: Token caching with auto-refresh
- [x] T-03: Configuration + DI
- [x] T-06: RocketUserMapping entity
- [x] T-07: EF Model
- [x] T-08: RocketChatUserService
- [x] T-09: Username/Password generation
- [x] T-11: API sync-user endpoint
- [x] T-15: Room naming convention
- [x] T-16: Metadata for rooms
- [x] T-17: Create private group
- [x] T-18: Create public channel
- [x] T-19b: API create-group endpoint
- [x] T-20: Add members
- [x] T-21: Remove members
- [x] T-22: Role management
- [x] T-23: Bulk add members with rate limiting
- [x] T-25: Announcement mode
- [x] T-26: Rename/Archive/Delete
- [x] T-36b: Send message

### ⏳ Pending

- [ ] T-10: Background job for user sync (cần Hangfire)
- [ ] T-24: Reconcile members
- [ ] T-27: Transfer ownership
- [ ] T-30: List/search groups API
- [ ] T-31: Webhook endpoint
- [ ] T-32: Configure outgoing webhooks
- [ ] T-33: Webhook token/HMAC validation
- [ ] T-34: Event dispatcher
- [ ] T-35: Chat message logging
- [ ] T-36: Message moderation policies
- [ ] T-37: Join/Leave event handlers
- [ ] T-38: Room created/deleted sync
- [ ] T-41: User info API with cache
- [ ] T-42: Slash command /userinfo
- [ ] Database migrations
- [ ] Unit tests
- [ ] Integration tests

## 🐛 Troubleshooting

### Connection refused to Rocket.Chat

```
Error: Connection refused to http://localhost:3000
```

**Solution**: Đảm bảo Rocket.Chat đang chạy:
```bash
docker-compose -f docker-compose-rocketchat.yml ps
```

### API Key invalid

```
401 Unauthorized: Invalid API Key
```

**Solution**: Kiểm tra header `X-API-Key` khớp với config trong `appsettings.json`

### Token expired

```
401 Unauthorized: Token expired
```

**Solution**: Token tự động refresh. Nếu vẫn lỗi, clear cache:
```csharp
_authService.ClearCache();
```

## 🔗 Resources

- [Rocket.Chat API Documentation](https://developer.rocket.chat/reference/api)
- [Rocket.Chat Webhooks](https://docs.rocket.chat/use-rocket.chat/workspace-administration/integrations)
- Tasks list: `ROCKETCHAT_TASKS.md`

## 👥 Support

Nếu có vấn đề, tham khảo:
1. `ROCKETCHAT_TASKS.md` - Danh sách tasks và DoD
2. `ROCKETCHAT_SETUP.md` - Setup Rocket.Chat server
3. API logs trong application

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-28

