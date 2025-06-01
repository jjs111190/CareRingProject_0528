#!/bin/bash

# 1. Go 서버 실행 (백그라운드)
echo "🚀 Go 서버 실행 중..."
go run main.go &

# 2. LocalTunnel 무한 재시도 루프
while true; do
  echo "🌐 LocalTunnel 연결 시도 중... (https://carering.loca.lt)"
  npx localtunnel --port 8082 --subdomain carering

  echo "❌ localtunnel 연결 종료됨. 5초 후 재시도..."
  sleep 5
done