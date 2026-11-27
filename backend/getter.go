package main

import (
	"errors"
	"log"
	"net/http"
	"strconv"

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

// getSubject finds a subject by numeric id, or by slug otherwise.
func getSubject(c *gin.Context, db *gorm.DB, idOrSlug string, subject *Subject) bool {
	query := db.WithContext(c.Request.Context())
	if id, err := strconv.ParseUint(idOrSlug, 10, 64); err == nil {
		query = query.Where("id = ?", id)
	} else {
		query = query.Where("slug = ?", idOrSlug)
	}

	err := query.First(subject).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(c, http.StatusNotFound, "NOT_FOUND", "subject not found")
		return false
	}
	if err != nil {
		log.Printf("getSubject: select: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return false
	}
	return true
}
