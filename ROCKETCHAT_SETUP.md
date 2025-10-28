# Hướng dẫn cài đặt Rocket.Chat với Docker

## 📋 Yêu cầu
- Docker Desktop đã cài đặt
- Cổng 3000 chưa bị sử dụng

## 🚀 Cách 1: Chạy bằng Script (Đơn giản nhất)

```bash
# Cấp quyền thực thi cho script
chmod +x start-rocketchat.sh

# Chạy script
./start-rocketchat.sh
```

## 🚀 Cách 2: Chạy thủ công với Docker Compose

```bash
# Tạo thư mục cần thiết
mkdir -p uploads data/db data/dump

# Khởi động Rocket.Chat
docker-compose -f docker-compose-rocketchat.yml up -d

# Xem logs
docker-compose -f docker-compose-rocketchat.yml logs -f rocketchat
```

## 📍 Truy cập

Sau khi chạy thành công, truy cập:
- **URL**: http://localhost:3000
- Lần đầu sẽ mất 1-2 phút để khởi tạo database

## 🔧 Setup ban đầu

1. Mở http://localhost:3000
2. Điền thông tin admin:
   - Name: Tên của bạn
   - Email: Email admin
   - Username: username admin
   - Password: Mật khẩu mạnh
3. Đặt tên cho workspace
4. Chọn loại hình tổ chức
5. Hoàn thành!

## 📊 Các lệnh quản lý

```bash
# Xem logs
docker-compose -f docker-compose-rocketchat.yml logs -f

# Dừng Rocket.Chat
docker-compose -f docker-compose-rocketchat.yml down

# Khởi động lại
docker-compose -f docker-compose-rocketchat.yml restart

# Xem trạng thái
docker-compose -f docker-compose-rocketchat.yml ps

# Xóa hoàn toàn (bao gồm data)
docker-compose -f docker-compose-rocketchat.yml down -v
rm -rf data/ uploads/
```

## 🔐 Bảo mật

Nếu deploy production:

1. **Đổi ROOT_URL** trong `docker-compose-rocketchat.yml`:
   ```yaml
   - ROOT_URL=https://yourdomain.com
   ```

2. **Thêm SSL/TLS** (dùng reverse proxy như Nginx hoặc Traefik)

3. **Tạo MongoDB authentication**

4. **Backup định kỳ** thư mục `data/`

## 🔧 Troubleshooting

### Lỗi "Cannot connect to MongoDB"
```bash
# Khởi động lại MongoDB replica set
docker-compose -f docker-compose-rocketchat.yml restart mongo-init-replica
docker-compose -f docker-compose-rocketchat.yml restart rocketchat
```

### Port 3000 đã được sử dụng
Sửa trong `docker-compose-rocketchat.yml`:
```yaml
ports:
  - 3001:3000  # Đổi 3001 thành port bạn muốn
```

### Xóa data và khởi động lại từ đầu
```bash
docker-compose -f docker-compose-rocketchat.yml down -v
rm -rf data/ uploads/
docker-compose -f docker-compose-rocketchat.yml up -d
```

## 📚 Tài liệu tham khảo

- [Rocket.Chat Official Docs](https://docs.rocket.chat/)
- [Docker Deployment Guide](https://docs.rocket.chat/deploy/deploy-rocket.chat/deploy-with-docker-and-docker-compose)
- [Rocket.Chat Website](https://www.rocket.chat/)

## ✨ Tính năng chính

- ✅ Real-time chat
- ✅ Video/Audio calls
- ✅ File sharing
- ✅ Screen sharing
- ✅ Team collaboration
- ✅ Mobile apps (iOS, Android)
- ✅ API & Webhooks
- ✅ Bots & Integrations
- ✅ Self-hosted (kiểm soát hoàn toàn data)

## 🆚 So với AppFrontend hiện tại

AppFrontend của bạn là một ứng dụng Training/Admin custom.
Rocket.Chat là nền tảng chat collaboration hoàn chỉnh, có thể:
- Dùng làm internal chat cho team
- Tích hợp với các hệ thống khác
- Thay thế Slack, Microsoft Teams (nhưng self-hosted)

