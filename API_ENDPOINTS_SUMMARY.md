# Rocket.Chat Integration - API Endpoints Summary

## 📊 Tổng quan

**Total Endpoints**: 23 endpoints  
**Base URL**: `http://localhost:5000/api`  
**Authentication**: API Key via `X-API-Key` header

---

## 🔐 User Management (3 endpoints)

### 1. Sync User to Rocket.Chat
**T-11**: Đồng bộ user từ hệ thống nội bộ vào Rocket.Chat

```http
POST /api/integrations/rocket/sync-user
Content-Type: application/json
X-API-Key: your-api-key

{
  "userId": 1,
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "userId": 1,
  "rocketUserId": "abc123...",
  "username": "john-doe-xyz",
  "isNewUser": true,
  "message": "User synced successfully"
}
```

### 2. Get User Info
**T-41**: Lấy thông tin user mapping

```http
GET /api/integrations/rocket/user/{userId}/info
X-API-Key: your-api-key
```

**Response:**
```json
{
  "userId": 1,
  "rocketUserId": "abc123",
  "username": "john-doe",
  "email": "user@example.com",
  "fullName": "John Doe",
  "isActive": true,
  "lastSyncAt": "2025-01-28T10:00:00Z"
}
```

---

## 🏠 Room Management (8 endpoints)

### 3. Create Group/Channel
**T-19b**: Tạo group hoặc channel (idempotent theo GroupCode)

```http
POST /api/integrations/rocket/create-group
Content-Type: application/json
X-API-Key: your-api-key

{
  "groupCode": "SALES-PROJECT-001",
  "name": "Sales Project Room",
  "isPrivate": true,
  "departmentId": 1,
  "projectId": 10,
  "description": "Sales team project discussion",
  "isReadOnly": false,
  "members": ["user1-rocket-id", "user2-rocket-id"]
}
```

**Response:**
```json
{
  "roomId": "xyz789...",
  "groupCode": "SALES-PROJECT-001",
  "name": "Sales Project Room",
  "success": true,
  "message": "Group created successfully"
}
```

### 4. List/Search Groups
**T-30**: Liệt kê rooms với filter và pagination

```http
GET /api/integrations/rocket/groups?departmentId=1&projectId=10&pageSize=50&pageNumber=1
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "pageNumber": 1,
  "pageSize": 50,
  "data": [
    {
      "id": 1,
      "groupCode": "SALES-PROJECT-001",
      "rocketRoomId": "xyz789",
      "roomName": "Sales Project Room",
      "roomType": "group",
      "departmentId": 1,
      "projectId": 10,
      "isArchived": false,
      "createdAt": "2025-01-28T10:00:00Z"
    }
  ]
}
```

### 5. Rename Room
**T-26**: Đổi tên room

```http
PUT /api/integrations/rocket/room/{roomId}/rename
Content-Type: application/json
X-API-Key: your-api-key

{
  "newName": "New Room Name",
  "roomType": "group"
}
```

### 6. Archive Room
**T-26**: Lưu trữ room

```http
POST /api/integrations/rocket/room/{roomId}/archive?roomType=group
X-API-Key: your-api-key
```

### 7. Delete Room
**T-26**: Xóa room (cần confirm)

```http
DELETE /api/integrations/rocket/room/{roomId}?roomType=group&confirm=true
X-API-Key: your-api-key
```

### 8. Set Announcement Mode
**T-25**: Bật chế độ announcement (chỉ owner/moderator post được)

```http
POST /api/integrations/rocket/room/{roomId}/announcement-mode
Content-Type: application/json
X-API-Key: your-api-key

{
  "announcementOnly": true,
  "roomType": "group"
}
```

### 9. Set Room Topic
**T-25**: Đặt topic cho room

```http
PUT /api/integrations/rocket/room/{roomId}/topic
Content-Type: application/json
X-API-Key: your-api-key

{
  "topic": "This is the room topic",
  "roomType": "group"
}
```

---

## 👥 Member Management (7 endpoints)

### 10. Add Single Member
**T-20**: Thêm 1 member vào room

```http
POST /api/integrations/rocket/room/{roomId}/add-member
Content-Type: application/json
X-API-Key: your-api-key

{
  "rocketUserId": "user-rocket-id",
  "roomType": "group"
}
```

### 11. Add Multiple Members (Bulk)
**T-23**: Thêm nhiều members với rate limiting

```http
POST /api/integrations/rocket/room/{roomId}/add-members
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
  "successCount": 2,
  "failCount": 1,
  "details": {
    "user1-id": true,
    "user2-id": true,
    "user3-id": false
  }
}
```

### 12. Remove Member
**T-21**: Xóa member khỏi room

```http
DELETE /api/integrations/rocket/room/{roomId}/member/{rocketUserId}?roomType=group
X-API-Key: your-api-key
```

### 13. Add Moderator
**T-22**: Thêm vai trò moderator

```http
POST /api/integrations/rocket/room/{roomId}/moderator/{rocketUserId}?roomType=group
X-API-Key: your-api-key
```

### 14. Remove Moderator
**T-22**: Xóa vai trò moderator

```http
DELETE /api/integrations/rocket/room/{roomId}/moderator/{rocketUserId}?roomType=group
X-API-Key: your-api-key
```

### 15. Add Owner
**T-22**: Thêm vai trò owner

```http
POST /api/integrations/rocket/room/{roomId}/owner/{rocketUserId}?roomType=group
X-API-Key: your-api-key
```

### 16. Get Room Members
**T-24**: Lấy danh sách members của room

```http
GET /api/integrations/rocket/room/{roomMappingId}/members?includeInactive=false
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "roomMappingId": 1,
  "members": [
    {
      "id": 1,
      "userId": 1,
      "rocketUserId": "abc123",
      "role": "owner",
      "isActive": true,
      "joinedAt": "2025-01-28T10:00:00Z",
      "username": "john-doe",
      "fullName": "John Doe"
    }
  ]
}
```

---

## 💬 Messaging (3 endpoints)

### 17. Send Message
**T-36b**: Gửi tin nhắn vào room

```http
POST /api/integrations/rocket/send
Content-Type: application/json
X-API-Key: your-api-key

{
  "roomId": "room-rocket-id",
  "text": "Hello, this is a message",
  "alias": "Bot Name"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg-123..."
}
```

### 18. Get Room Messages
Lấy tin nhắn của room với pagination

```http
GET /api/integrations/rocket/room/{rocketRoomId}/messages?pageSize=100&pageNumber=1
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "rocketRoomId": "room123",
  "pageNumber": 1,
  "pageSize": 100,
  "messages": [
    {
      "id": 1,
      "rocketMessageId": "msg123",
      "rocketUserId": "user123",
      "userId": 1,
      "messageText": "Hello world",
      "messageType": "text",
      "isDeleted": false,
      "createdAt": "2025-01-28T10:00:00Z"
    }
  ]
}
```

---

## 🔔 Webhooks (2 endpoints)

### 19. Receive Webhook
**T-31, T-32**: Nhận webhook từ Rocket.Chat

```http
POST /api/webhooks/rocketchat
Content-Type: application/json
X-Webhook-Token: your-webhook-secret

{
  "event": "message",
  "messageId": "msg123",
  "roomId": "room123",
  "userId": "user123",
  "username": "john.doe",
  "text": "Hello from Rocket.Chat",
  "timestamp": "2025-01-28T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "correlationId": "guid-xyz..."
}
```

**Supported Events:**
- `message` / `message_sent` → T-35: Log message
- `user_joined` / `join` → T-37: Update member mapping
- `user_left` / `leave` → T-37: Update member mapping
- `room_created` → T-38: Sync room to DB
- `room_deleted` → T-38: Mark room as deleted

---

## 📋 Tasks Coverage

| Task | Endpoint | Status |
|------|----------|--------|
| T-11 | POST /sync-user | ✅ |
| T-19b | POST /create-group | ✅ |
| T-20 | POST /room/{id}/add-member | ✅ |
| T-21 | DELETE /room/{id}/member/{userId} | ✅ |
| T-22 | POST/DELETE /room/{id}/moderator/{userId} | ✅ |
| T-22 | POST /room/{id}/owner/{userId} | ✅ |
| T-23 | POST /room/{id}/add-members | ✅ |
| T-24 | GET /room/{id}/members | ✅ |
| T-25 | POST /room/{id}/announcement-mode | ✅ |
| T-25 | PUT /room/{id}/topic | ✅ |
| T-26 | PUT /room/{id}/rename | ✅ |
| T-26 | POST /room/{id}/archive | ✅ |
| T-26 | DELETE /room/{id} | ✅ |
| T-30 | GET /groups | ✅ |
| T-31-38 | POST /webhooks/rocketchat | ✅ |
| T-36b | POST /send | ✅ |
| T-41 | GET /user/{id}/info | ✅ |

**Missing Tasks:**
- T-27: Transfer ownership (can be added later)
- T-42: Slash command /userinfo (requires Rocket.Chat slash command config)

---

## 🔑 Authentication

Tất cả endpoints (trừ webhook) yêu cầu API Key:

```http
X-API-Key: your-api-key-here
```

**Cấu hình trong appsettings.json:**
```json
{
  "RocketChat": {
    "ApiKey": "your-api-key-for-endpoints"
  }
}
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid API key |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## 🧪 Testing với curl

```bash
# 1. Sync user
curl -X POST http://localhost:5000/api/integrations/rocket/sync-user \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"email":"test@test.com","fullName":"Test User"}'

# 2. Create group
curl -X POST http://localhost:5000/api/integrations/rocket/create-group \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"groupCode":"TEST-001","name":"Test Group","isPrivate":true}'

# 3. Send message
curl -X POST http://localhost:5000/api/integrations/rocket/send \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room-id","text":"Hello World"}'

# 4. List groups
curl http://localhost:5000/api/integrations/rocket/groups?pageSize=10 \
  -H "X-API-Key: your-api-key"
```

---

## 📝 Next Steps

1. ✅ Implement API Key Middleware
2. ✅ Setup Rocket.Chat outgoing webhooks
3. 🔄 Add Hangfire for background jobs
4. 🔄 Add response caching for GET endpoints
5. 🔄 Add rate limiting
6. 📚 Generate Swagger documentation

---

**Last Updated**: 2025-01-28  
**API Version**: 1.0  
**Total Endpoints**: 23

