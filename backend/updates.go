package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func buildMeUpdates(c *gin.Context, req updateMeRequest) (map[string]any, bool) {
	updates := map[string]any{}

	// Username
	if req.Username != nil {
		username, ok := formatUsername(c, *req.Username)
		if !ok {
			return nil, false
		}
		updates["username"] = username
	}

	// Mail
	if req.Mail != nil {
		mail, ok := formatMail(c, *req.Mail)
		if !ok {
			return nil, false
		}
		updates["mail"] = mail
	}

	// Image: "" removes the avatar
	if req.Image != nil && *req.Image == "" {
		updates["image"] = nil
	} else if req.Image != nil {
		image, ok := formatImage(c, *req.Image)
		if !ok {
			return nil, false
		}
		updates["image"] = image
	}

	return updates, true
}

func buildMePasswordUpdates(c *gin.Context, req updateMePasswordRequest, currentHash string) (map[string]any, bool) {
	if bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword)) != nil {
		respondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "current password is incorrect")
		return nil, false
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("buildMePasswordUpdates: hash: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return nil, false
	}

	return map[string]any{"password": string(hash)}, true
}

func applyUserUpdates(c *gin.Context, db *gorm.DB, user *User, updates map[string]any) bool {
	if len(updates) == 0 {
		return true
	}

	err := db.WithContext(c.Request.Context()).Model(user).Updates(updates).Error
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		respondError(c, http.StatusConflict, "CONFLICT", "username or mail already taken")
		return false
	}
	if err != nil {
		log.Printf("applyUserUpdates: user %d: %v", user.ID, err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return false
	}
	return true
}
