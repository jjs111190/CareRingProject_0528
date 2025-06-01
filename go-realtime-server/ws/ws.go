package ws

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"go-realtime-server/utils"

	"github.com/gorilla/websocket"
)

var mutex = sync.Mutex{}

func HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("❌ WebSocket 업그레이드 실패:", err)
		return
	}

	// room 정보를 JSON으로 수신
	var joinReq struct {
		Room string `json:"room"`
	}
	if err := conn.ReadJSON(&joinReq); err != nil {
		log.Println("❌ 클라이언트 room 수신 실패:", err)
		conn.Close()
		return
	}

	RegisterClient(joinReq.Room, conn)
	log.Printf("✅ 클라이언트 room %s 연결됨\n", joinReq.Room)

	// 🔄 메시지 수신 루프 시작
	for {
		var msg map[string]interface{}
		if err := conn.ReadJSON(&msg); err != nil {
			log.Println("❌ 메시지 수신 실패:", err)
			UnregisterClient(joinReq.Room)
			break
		}

		msgType := msg["type"]
		log.Println("📩 수신된 메시지 타입:", msgType)

		switch msgType {
		case "delete_message":
			messageID := int(msg["message_id"].(float64))
			receiverID := int(msg["receiverId"].(float64))   // ✅ 숫자로 받음
			receiverRoom := "user_" + fmt.Sprint(receiverID) // ✅ room 이름으로 변환

			broadcast := map[string]interface{}{
				"type":       "delete_message",
				"message_id": messageID,
			}

			log.Printf("🧾 DELETE 브로드캐스트 준비 - 메시지 ID: %d, 수신자 room: %s", messageID, receiverRoom)

			// 수신자에게 전송
			if receiverConn, ok := utils.Clients[receiverRoom]; ok {
				receiverConn.WriteJSON(broadcast)
				log.Printf("📤 수신자에게 메시지 삭제 전송 완료: %s", receiverRoom)
			} else {
				log.Printf("⚠️ 수신자 연결 없음: %s", receiverRoom)
			}

			// 본인에게도 전송
			if selfConn, ok := utils.Clients[joinReq.Room]; ok {
				selfConn.WriteJSON(broadcast)
				log.Printf("📤 본인에게 메시지 삭제 전송 완료: %s", joinReq.Room)
			} else {
				log.Printf("⚠️ 본인 연결 없음: %s", joinReq.Room)
			}

			log.Printf("🗑️ 삭제 메시지 브로드캐스트 완료: %d", messageID)

		case "typing":
			senderRaw, ok1 := msg["senderId"]
			receiverRaw, ok2 := msg["receiverId"]

			if !ok1 || !ok2 {
				log.Println("❌ senderId 또는 receiverId 누락")
				break
			}

			senderId, ok1 := senderRaw.(float64)
			receiverId, ok2 := receiverRaw.(float64)

			if !ok1 || !ok2 {
				log.Println("❌ senderId 또는 receiverId 타입 변환 실패")
				break
			}

			receiverRoom := "user_" + fmt.Sprint(int(receiverId))
			senderRoom := "user_" + fmt.Sprint(int(senderId))

			// 타이핑 메시지 생성
			typingPayload := map[string]interface{}{
				"type":      "typing",
				"sender_id": int(senderId),
			}

			// 수신자에게 전송
			if receiverConn, ok := utils.Clients[receiverRoom]; ok {
				receiverConn.WriteJSON(typingPayload)
				log.Printf("✍️ 수신자에게 타이핑 전송: %s", receiverRoom)
			} else {
				log.Printf("⚠️ 수신자 연결 없음: %s", receiverRoom)
			}

			// (선택) 발신자에게도 전송
			if senderConn, ok := utils.Clients[senderRoom]; ok {
				senderConn.WriteJSON(typingPayload)
				log.Printf("✍️ 발신자에게 타이핑 전송: %s", senderRoom)
			}
		default:
			log.Printf("⚠️ 처리되지 않은 메시지 타입: %v", msgType)
		}
	}
}

func RegisterClient(room string, conn *websocket.Conn) {
	mutex.Lock()
	defer mutex.Unlock()
	utils.Clients[room] = conn
}

func UnregisterClient(room string) {
	mutex.Lock()
	defer mutex.Unlock()
	if conn, exists := utils.Clients[room]; exists {
		conn.Close()
		delete(utils.Clients, room)
	}
}
