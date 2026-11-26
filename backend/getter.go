package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func getMe(c *gin.Context, db *gorm.DB, user *User, fields ...string) bool {
	query := db.WithContext(c.Request.Context())
	if len(fields) > 0 {
		query = query.Select(fields)
	}
	err := query.First(user, c.GetUint(userIDCtxKey)).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(c, http.StatusNotFound, "NOT_FOUND", "user not found")
		return false
	}
	if err != nil {
		log.Printf("getMe: select: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return false
	}
	return true
}
