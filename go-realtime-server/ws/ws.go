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
	fmt.Printf("✅ 클라이언트 room %s 연결됨\n", joinReq.Room)
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
