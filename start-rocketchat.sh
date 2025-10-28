#!/bin/bash

# Script để chạy Rocket.Chat với Docker
echo "🚀 Starting Rocket.Chat with Docker Compose..."

# Kiểm tra Docker đã cài đặt chưa
if ! command -v docker &> /dev/null; then
    echo "❌ Docker chưa được cài đặt. Vui lòng cài Docker trước."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose chưa được cài đặt. Vui lòng cài Docker Compose trước."
    exit 1
fi

# Tạo thư mục cần thiết
mkdir -p uploads data/db data/dump

# Chạy Docker Compose
echo "📦 Pulling images và starting containers..."
docker-compose -f docker-compose-rocketchat.yml up -d

echo ""
echo "✅ Rocket.Chat đang chạy!"
echo ""
echo "📍 Truy cập: http://localhost:3000"
echo ""
echo "⏳ Lần đầu chạy sẽ mất vài phút để khởi tạo database..."
echo "💡 Kiểm tra logs: docker-compose -f docker-compose-rocketchat.yml logs -f rocketchat"
echo ""
echo "🛑 Dừng Rocket.Chat: docker-compose -f docker-compose-rocketchat.yml down"
echo "🔄 Khởi động lại: docker-compose -f docker-compose-rocketchat.yml restart"

