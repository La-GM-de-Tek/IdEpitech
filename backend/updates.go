package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func buildUserMeUpdates(c *gin.Context, req updateMeRequest) (map[string]any, bool) {
	updates := map[string]any{}

	// Username
	if req.Username != nil {
		isError, username := formatUsername(c, *req.Username)
		if isError {
			return nil, false
		}
		updates["username"] = username
	}

	// Mail
	if req.Mail != nil {
		isError, mail := formatMail(c, *req.Mail)
		if isError {
			return nil, false
		}
		updates["mail"] = mail
	}

	// Image
	if req.Image != nil && *req.Image == "" {
		updates["image"] = nil
	} else if req.Image != nil {
		isError, image := formatImagePath(c, *req.Image)
		if isError {
			return nil, false
		}
		updates["image"] = image
	}

	return updates, true
}

func applyUserUpdates(c *gin.Context, db *gorm.DB, user *User, updates map[string]any) bool {
	if len(updates) == 0 {
		return true
	}

	err := db.WithContext(c.Request.Context()).Model(user).Updates(updates).Error
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		respondError(c, http.StatusConflict, "CONFLICT", "username or mail already in use")
		return false
	}
	if err != nil {
		log.Printf("update user %d: %v", user.ID, err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return false
	}
	return true
}
