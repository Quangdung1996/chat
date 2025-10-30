# Rocket.Chat Integration - Quick Start Guide

Hướng dẫn nhanh để chạy Rocket.Chat integration trong 15 phút.

## 🚀 Bước 1: Chạy Rocket.Chat Server (5 phút)

```bash
# Chạy Rocket.Chat với Docker
cd /Users/dungbui/app_allianceitsc_01
./start-rocketchat.sh

# Đợi 1-2 phút để server khởi động
```

Truy cập http://localhost:3000 và tạo admin user đầu tiên.

## 🔧 Bước 2: Tạo Bot User (2 phút)

1. Đăng nhập Rocket.Chat với admin account
2. Go to **Administration** (⚙️) → **Users** → **New**
3. Điền thông tin:
   - **Name**: Integration Bot
   - **Username**: `integration-bot`
   - **Email**: `bot@yourdomain.com`
   - **Password**: (Tạo password mạnh)
   - **Roles**: Check ✅ `bot`
4. Click **Save**

## ⚙️ Bước 3: Cấu hình Backend (3 phút)

### 3.1. Cập nhật `appsettings.json`

```json
{
  "RocketChat": {
    "BaseUrl": "http://localhost:3000",
    "AdminUsername": "admin",              // Admin username bạn vừa tạo
    "AdminPassword": "your-password",      // Admin password
    "BotUsername": "integration-bot",
    "BotPassword": "bot-password",         // Bot password
    "ApiKey": "my-secret-api-key-12345"    // Tạo random string
  }
}
```

### 3.2. Cập nhật `Startup.cs`

**Thêm vào đầu file:**
```csharp
using SourceAPI.Extensions;
using SourceAPI.Middleware;
```

**Trong `ConfigureServices` method:**
```csharp
public void ConfigureServices(IServiceCollection services)
{
    // ... existing code ...
    
    // Add Rocket.Chat integration (thêm dòng này)
    services.AddRocketChatServices(Configuration);
    
    // ... rest of code ...
}
```

**Trong `Configure` method (sau UseAuthentication):**
```csharp
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    // ... existing code ...
    
    app.UseAuthentication();
    
    // Add Rocket.Chat API key middleware (thêm dòng này)
    app.UseRocketChatApiKey();
    
    app.UseAuthorization();
    
    // ... rest of code ...
}
```

## 🗄️ Bước 4: Tạo Database Tables (3 phút)

**Chạy SQL script sau trên database của bạn:**

```sql
-- Rocket_UserMapping
CREATE TABLE Rocket_UserMapping (
    Id INT PRIMARY KEY IDENTITY,
    UserId INT NOT NULL,
    RocketUserId NVARCHAR(50) NOT NULL,
    RocketUsername NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastSyncAt DATETIME2,
    IsActive BIT NOT NULL DEFAULT 1,
    Metadata NVARCHAR(1000)
);

CREATE UNIQUE INDEX IX_Rocket_UserMapping_UserId ON Rocket_UserMapping(UserId, RocketUserId);

-- RoomMapping
CREATE TABLE RoomMapping (
    Id INT PRIMARY KEY IDENTITY,
    GroupCode NVARCHAR(100) NOT NULL UNIQUE,
    RocketRoomId NVARCHAR(50) NOT NULL,
    RoomName NVARCHAR(200) NOT NULL,
    RoomType NVARCHAR(20) NOT NULL DEFAULT 'group',
    DepartmentId INT,
    ProjectId INT,
    Description NVARCHAR(500),
    IsReadOnly BIT NOT NULL DEFAULT 0,
    IsArchived BIT NOT NULL DEFAULT 0,
    IsDeleted BIT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedBy INT,
    UpdatedAt DATETIME2,
    CustomFields NVARCHAR(2000)
);

-- RoomMemberMapping
CREATE TABLE RoomMemberMapping (
    Id INT PRIMARY KEY IDENTITY,
    RoomMappingId INT NOT NULL,
    UserMappingId INT NOT NULL,
    UserId INT NOT NULL,
    RocketUserId NVARCHAR(50) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'member',
    IsActive BIT NOT NULL DEFAULT 1,
    JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LeftAt DATETIME2,
    LastActivityAt DATETIME2,
    FOREIGN KEY (RoomMappingId) REFERENCES RoomMapping(Id),
    FOREIGN KEY (UserMappingId) REFERENCES Rocket_UserMapping(Id)
);

-- ChatMessageLog
CREATE TABLE ChatMessageLog (
    Id BIGINT PRIMARY KEY IDENTITY,
    RocketMessageId NVARCHAR(50) NOT NULL UNIQUE,
    RocketRoomId NVARCHAR(50) NOT NULL,
    RocketUserId NVARCHAR(50) NOT NULL,
    UserId INT,
    RoomMappingId INT,
    MessageText NVARCHAR(MAX) NOT NULL,
    MessageType NVARCHAR(50) NOT NULL DEFAULT 'text',
    IsDeleted BIT NOT NULL DEFAULT 0,
    IsAutoDeleted BIT NOT NULL DEFAULT 0,
    DeletionReason NVARCHAR(500),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LoggedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    Metadata NVARCHAR(MAX)
);

CREATE INDEX IX_ChatMessageLog_Room_Time ON ChatMessageLog(RocketRoomId, CreatedAt);
```

## ▶️ Bước 5: Chạy Backend (1 phút)

```bash
cd /Users/dungbui/app_allianceitsc_01/SourceAPI/SourceAPI
dotnet run
```

hoặc nhấn F5 trong Visual Studio.

## ✅ Bước 6: Test Integration (1 phút)

### Test 1: Sync User

```bash
curl -X POST http://localhost:5000/api/integrations/rocket/sync-user \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-api-key-12345" \
  -d '{
    "userId": 1,
    "email": "test@example.com",
    "fullName": "Nguyễn Văn Test"
  }'
```

**Kết quả mong đợi:**
```json
{
  "userId": 1,
  "rocketUserId": "abc123",
  "username": "nguyen-van-test",
  "isNewUser": true,
  "message": "User synced successfully"
}
```

### Test 2: Tạo Group

```bash
curl -X POST http://localhost:5000/api/integrations/rocket/create-group \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-api-key-12345" \
  -d '{
    "groupCode": "TEST-GROUP-001",
    "name": "Nhóm Test",
    "isPrivate": true,
    "description": "Nhóm test integration"
  }'
```

**Kết quả mong đợi:**
```json
{
  "roomId": "xyz789",
  "groupCode": "TEST-GROUP-001",
  "name": "nhom-test",
  "success": true,
  "message": "group created successfully"
}
```

### Kiểm tra trong Rocket.Chat UI

1. Mở http://localhost:3000
2. Bạn sẽ thấy:
   - User mới: `nguyen-van-test`
   - Group mới: `nhom-test`

## 🎉 Hoàn thành!

Bây giờ bạn đã có:
- ✅ Rocket.Chat server chạy
- ✅ Backend integration hoạt động
- ✅ API endpoints ready
- ✅ Database tables sẵn sàng

## 🔜 Bước tiếp theo

1. **Tích hợp vào flow đăng ký user**:
   - Hook vào controller đăng ký
   - Auto-sync user mới sang Rocket.Chat

2. **Tạo groups cho departments/projects**:
   - Tạo groups tự động khi tạo dự án
   - Thêm members tự động

3. **Webhooks** (nâng cao):
   - Nhận events từ Rocket.Chat
   - Log messages
   - Auto-moderation

Xem chi tiết: `ROCKETCHAT_INTEGRATION_README.md`

## ⚠️ Lưu ý

### Production Deployment

Khi deploy production:

1. **Đổi passwords** trong `appsettings.json`
2. **Đổi ApiKey** thành random string mạnh
3. **Sử dụng HTTPS** cho Rocket.Chat
4. **Backup database** định kỳ
5. **Enable logging** và monitoring

### Bảo mật

- ✅ Không commit passwords vào Git
- ✅ Sử dụng User Secrets cho development
- ✅ Sử dụng Azure Key Vault hoặc tương đương cho production
- ✅ Rotate API keys định kỳ

## 🆘 Troubleshooting

**Lỗi: Cannot connect to Rocket.Chat**
```bash
# Kiểm tra Rocket.Chat có chạy không
docker ps | grep rocketchat
docker-compose -f docker-compose-rocketchat.yml logs
```

**Lỗi: 401 Invalid API Key**
```
# Kiểm tra X-API-Key header khớp với appsettings.json
# Kiểm tra middleware đã được thêm vào Startup.cs
```

**Lỗi: Table does not exist**
```sql
-- Chạy lại SQL scripts ở Bước 4
-- Kiểm tra connection string trong appsettings.json
```

---

**Happy Coding! 🚀**

