// go-realtime-server/auth/verify.go
package auth

import (
	"errors"
	"fmt"
	"go-realtime-server/config"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

type Claims struct {
	UserID int `json:"user_id"`
	jwt.StandardClaims
}

func VerifyToken(tokenString string) (int, error) {
	if tokenString == "" {
		return 0, errors.New("토큰이 제공되지 않았습니다")
	}

	cfg := config.LoadConfig()

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// 알고리즘 검증
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("예상치 못한 서명 방식: %v", token.Header["alg"])
		}
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return 0, fmt.Errorf("토큰 파싱 오류: %v", err)
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		// 토큰 만료 확인
		if claims.ExpiresAt < time.Now().Unix() {
			return 0, errors.New("토큰이 만료되었습니다")
		}
		return claims.UserID, nil
	}

	return 0, errors.New("유효하지 않은 토큰입니다")
}
