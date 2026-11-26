package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func getUserMe(c *gin.Context, db *gorm.DB, user *User) bool {
	err := db.WithContext(c.Request.Context()).First(user, c.GetUint(userIDCtxKey)).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(c, http.StatusNotFound, "NOT_FOUND", "user not found")
		return false
	}
	if err != nil {
		log.Printf("get user me: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return false
	}
	return true
}
