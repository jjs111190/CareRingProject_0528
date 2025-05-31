package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

// 외부에서 접근 가능하도록 대문자로 시작
var RedisClient *redis.Client
var Clients = make(map[string]*websocket.Conn)

// 추가
var Ctx = context.Background()

type Message struct {
	Room               string `json:"room"`
	Content            string `json:"content"`
	SenderID           int    `json:"sender_id"`
	ReceiverID         int    `json:"receiver_id"`
	Timestamp          string `json:"timestamp"`
	MessageID          int    `json:"message_id"`
	SenderNickname     string `json:"sender_nickname"`
	SenderProfileImage string `json:"sender_profile_image"`
}

func InitRedis() {
	RedisClient = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
}

// Subscribe: 메시지를 수신하면 handler 콜백 실행
func Subscribe(channel string, handler func(string)) {
	pubsub := RedisClient.Subscribe(Ctx, channel)
	go func() {
		for msg := range pubsub.Channel() {
			handler(msg.Payload)
		}
	}()
}

// Publish: 메시지를 해당 채널에 전송
func Publish(channel string, msg string) {
	RedisClient.Publish(Ctx, channel, msg)
}
func SubscribeAndBroadcast(rdb *redis.Client) {
	pubsub := rdb.Subscribe(Ctx, "chat_channel")
	ch := pubsub.Channel()

	for msg := range ch {
		var message Message
		err := json.Unmarshal([]byte(msg.Payload), &message)
		if err != nil {
			log.Printf("❌ Redis 메시지 파싱 실패: %v\n", err)
			continue
		}

		fmt.Printf("📨 메시지 수신 (room: %s): %s\n", message.Room, message.Content)

		conn, ok := Clients[message.Room]
		if ok {
			err := conn.WriteJSON(message)
			if err != nil {
				log.Printf("❌ 소켓 전송 실패: %v\n", err)
				conn.Close()
				delete(Clients, message.Room)
			}
		} else {
			fmt.Printf("⚠️ 해당 room(%s) 연결 없음\n", message.Room)
		}
	}
}
