#!/bin/bash

# 1. Go 서버 실행 (백그라운드로)
echo "🚀 Go 서버 실행 중..."
go run main.go &

# 2. localtunnel 실행
echo "🌐 LocalTunnel 시작 (https://carering.loca.lt)..."
npx localtunnel --port 8082 --subdomain carering