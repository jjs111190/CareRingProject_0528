#!/bin/bash

echo "🚀 Starting CareRing Application..."

# Docker Compose 실행
cd ../backend
docker-compose up -d

# FastAPI 서버 실행
cd ../backend
 python -m venv venv 
source venv/bin/activate
pip install fastapi pydantic
pip install "pydantic[email]"
pip install uvicorn
pip install "uvicorn[standard]"
pip install sqlalchemy
pip install databases psycopg2-binary pymysql
pip install 'python-jose[cryptography]'
pip install python-multipart
pip install "python-socketio[asyncio_client]"
pip install fastapi-socketio
pip install redis
python -m pip install --break-system-packages -r requirements.txt
python -m pip install "passlib[bcrypt]" --break-system-packages
uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# React Native 실행
cd ../frontend
npx react-native start

#서버 키는 법
docker start carering-mysql
#서버 끄는법
docker stop carering-mysql

#파이썬 추가할때 
pip freeze > requirements.txt

#외부 서버 여는법
 npx localtunnel --port 8000 --subdomain mycarering

#웹서버열기
npx localtunnel --port 8000 --subdomain carering


#sql에 들어가기
 docker exec -it carering-mysql mysql -u root -p
 DELETE FROM basic_info;
 DELETE FROM lifestyle;
 DELETE FROM users;
 
 #테이블은 남기고 지우기 
 SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE comments;
TRUNCATE TABLE posts;
TRUNCATE TABLE follows;
TRUNCATE TABLE basic_info;
TRUNCATE TABLE lifestyle;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

#서버 키는 법
#서버 키는 법
 npx react-native clean                            
npx react-native start --reset-cache

이동
cd /Users/jangjaeseok/Desktop/CareRing/backend/server/my-tunnel
pm2 restart mycarering-tunnel
스크립트 재시작
pm2 stop mycarering-tunnel
중지
pm2 delete mycarering-tunnel
완전 삭제 (이후 다시 start 가능)
pm2 logs mycarering-tunnel
실시간 로그 보기
pm2 list
실행 중인 앱 리스트 확인
pm2 save

 npx react-native run-android

서버 실행
 pm2 start "npx ts-node my-tunnel/tunnel.ts" --name mycarering-tunnel
 
 모든 서버 키는 법
npm run tunnel

 emulator -avd Pixel_6a_API_33 -dns-server 8.8.8.8


npx webpack serve

#go run 실행할때

go run main.go

