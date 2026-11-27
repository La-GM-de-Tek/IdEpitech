package main

import (
	"net/http"
	"net/mail"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
)

func formatUsername(c *gin.Context, username string) (string, bool) {
	result := strings.TrimSpace(username)
	length := utf8.RuneCountInString(result)

	if length < 3 || length > 32 {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "username must be between 3 and 32 characters")
		return "", false
	}

	return result, true
}

func formatMail(c *gin.Context, email string) (string, bool) {
	result := strings.ToLower(strings.TrimSpace(email))

	if len(result) < 1 || len(result) > 255 {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "mail must be a valid email address")
		return "", false
	}

	addr, err := mail.ParseAddress(result)
	if err != nil || addr.Address != result {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "mail must be a valid email address")
		return "", false
	}

	return result, true
}

func formatImage(c *gin.Context, image string) (string, bool) {
	result := strings.TrimSpace(image)

	if len(result) < 1 || len(result) > 255 {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "image must be between 1 and 255 characters")
		return "", false
	}

	return result, true
}

func formatPassword(c *gin.Context, password string) bool {
	if utf8.RuneCountInString(password) < 8 || len(password) > 72 {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "password must be between 8 and 72 characters")
		return false
	}

	return true
}

func formatRegisterRequest(c *gin.Context, req *registerRequest) bool {
	var ok bool
	if req.Username, ok = formatUsername(c, req.Username); !ok {
		return false
	}
	if req.Mail, ok = formatMail(c, req.Mail); !ok {
		return false
	}
	return formatPassword(c, req.Password)
}

func formatLoginRequest(c *gin.Context, req *loginRequest) bool {
	req.Login = strings.TrimSpace(req.Login)
	if req.Login == "" || req.Password == "" {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "login and password are required")
		return false
	}
	return true
}

func formatMePasswordRequest(c *gin.Context, req *updateMePasswordRequest) bool {
	if req.CurrentPassword == "" {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "current password is required")
		return false
	}
	return formatPassword(c, req.NewPassword)
}
