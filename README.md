# Alliance ITSC - Training Application

## 📋 Tổng quan

Hệ thống training application với ASP.NET Core backend và React frontend.

### Components

- **SourceAPI**: ASP.NET Core 9.0 Web API
- **AppFrontend**: React application (built version)
- **Rocket.Chat Integration**: Real-time chat & collaboration

---

## 🚀 Quick Start

### Backend API

```bash
cd SourceAPI/SourceAPI
dotnet run
```

**Database**: Xem trong `Setting.txt`  
**User account**: tnguyen/Password0d!@#

### Frontend

AppFrontend là bản build sẵn. Chạy với HTTP server:

```bash
cd AppFrontend
npx serve -s . -p 3000
```

Hoặc thay đổi `baseUrl` trong `config/_config.js` để trỏ đến backend.

---

## 💬 Rocket.Chat Integration (NEW!)

### Quick Setup (15 phút)

1. **Chạy Rocket.Chat server:**
```bash
./start-rocketchat.sh
```

2. **Cấu hình backend:**
   - Copy `appsettings.example.json` → `appsettings.json`
   - Cập nhật thông tin Rocket.Chat credentials

3. **Tạo database tables:**
   - Xem SQL scripts trong `ROCKETCHAT_QUICK_START.md`

4. **Test API:**
```bash
curl -X POST http://localhost:5000/api/integrations/rocket/sync-user \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"email":"test@test.com","fullName":"Test User"}'
```

### Documentation

| File | Mục đích |
|------|----------|
| `ROCKETCHAT_QUICK_START.md` | Hướng dẫn setup nhanh 15 phút |
| `ROCKETCHAT_INTEGRATION_README.md` | Documentation đầy đủ |
| `ROCKETCHAT_TASKS.md` | Danh sách tasks (62h) |
| `IMPLEMENTATION_SUMMARY.md` | Tổng kết implementation |
| `ROCKETCHAT_SETUP.md` | Setup Rocket.Chat server |

### Features

- ✅ Auto-sync users to Rocket.Chat
- ✅ Create groups/channels
- ✅ Manage members & roles
- ✅ Send automated messages
- ✅ Webhook integration
- ✅ Message logging & moderation

---

## 📚 Project Structure

```
app_allianceitsc_01/
├── SourceAPI/                      # Backend API (.NET 9.0)
│   ├── SourceAPI/
│   │   ├── Controllers/
│   │   │   └── Integrations/      # Rocket.Chat APIs
│   │   ├── Services/
│   │   │   └── RocketChat/        # Business logic
│   │   ├── Data/Entities/         # Database entities
│   │   ├── Models/RocketChat/     # DTOs
│   │   └── Helpers/RocketChat/    # Utilities
│   ├── SourceAPI.Core/
│   ├── SourceAPI.Shared/
│   └── SourceAPI.DataShared/
├── AppFrontend/                    # Frontend (React build)
│   ├── index.html
│   ├── static/
│   └── config/_config.js
├── docker-compose-rocketchat.yml   # Rocket.Chat setup
├── start-rocketchat.sh            # Auto-start script
└── ROCKETCHAT_*.md                # Documentation
```

---

## 🔧 Development

### Prerequisites

- .NET 9.0 SDK
- Docker & Docker Compose (for Rocket.Chat)
- SQL Server (or compatible)
- Node.js (optional, for frontend dev)

### Environment Setup

1. Clone repository
2. Setup database (see `Setting.txt`)
3. Copy `appsettings.example.json` to `appsettings.json`
4. Update connection strings and secrets
5. Run migrations
6. Start backend API
7. (Optional) Start Rocket.Chat

### Configuration

**Backend**: `SourceAPI/SourceAPI/appsettings.json`  
**Frontend**: `AppFrontend/config/_config.js`  
**Rocket.Chat**: See `ROCKETCHAT_SETUP.md`

---

## 📊 API Endpoints

### Rocket.Chat Integration

All endpoints require `X-API-Key` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/integrations/rocket/sync-user` | Sync user to Rocket.Chat |
| POST | `/api/integrations/rocket/create-group` | Create chat group |
| POST | `/api/integrations/rocket/{roomId}/add-members` | Add members |
| POST | `/api/integrations/rocket/send` | Send message |

See `ROCKETCHAT_INTEGRATION_README.md` for full API documentation.

---

## 🔐 Security

- API Key authentication for integration endpoints
- JWT authentication for user endpoints
- Passwords hashed with strong crypto
- Environment-based configuration
- `.gitignore` configured to protect secrets

**Important**: Never commit `appsettings.json` với real passwords!

---

## 📝 License

© 2022 Alliance Software Company

---

## 🆘 Support

- **Backend Issues**: Check logs in `logs/` folder
- **Rocket.Chat Issues**: See `ROCKETCHAT_SETUP.md` troubleshooting
- **Integration Issues**: See `ROCKETCHAT_INTEGRATION_README.md`

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-28