package router

import (
    "go-realtime-server/ws"
    "github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) *gin.Engine {
    r.GET("/ws", ws.HandleWebSocket)
    r.GET("/ping", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })
    return r
}