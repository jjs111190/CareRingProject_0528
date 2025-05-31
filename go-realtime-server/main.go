package main

import (
	"fmt"
	"log"
	"net/http"

	"go-realtime-server/utils" // redis.go 경로
	"go-realtime-server/ws"    // ws.go 경로

	"github.com/redis/go-redis/v9"
)

func main() {
	// 1. Redis 클라이언트 생성
	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	// 2. Redis 구독 시작
	fmt.Println("🟢 Redis 구독 시작됨 (chat_channel)")
	go utils.SubscribeAndBroadcast(rdb) // ✅ 함수 이름 대문자 시작 확인

	// 3. WebSocket 핸들러 등록
	http.HandleFunc("/ws", ws.HandleWebSocket)

	// 4. 서버 시작
	log.Println("🚀 WebSocket 서버 실행 중 :8082/ws")
	log.Fatal(http.ListenAndServe(":8082", nil))
}
