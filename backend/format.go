package main

import (
	"net/http"
	"net/mail"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
)

func formatUsername(c *gin.Context, username string) (bool, string) {
	var result = strings.TrimSpace(username)
	var length = utf8.RuneCountInString(result)

	if length < 3 || length > 32 {
		respondError(c, http.StatusBadRequest, "BAD_REQUEST", "Username must be between 3 and 32 characters.")
		return true, ""
	}

	return false, result
}

func formatMail(c *gin.Context, email string) (bool, string) {
	var result = strings.ToLower(strings.TrimSpace(email))

	if len(result) < 1 || len(result) > 255 {
		respondError(c, http.StatusBadRequest, "BAD_REQUEST", "Mail must be a valid email address.")
		return true, ""
	}

	addr, err := mail.ParseAddress(result)
	if err != nil || addr.Address != result {
		respondError(c, http.StatusBadRequest, "BAD_REQUEST", "Mail must be a valid email address.")
		return true, ""
	}

	return false, result
}

func formatImagePath(c *gin.Context, imagePath string) (bool, string) {
	var result = strings.TrimSpace(imagePath)

	if len(result) < 1 || len(result) > 255 {
		respondError(c, http.StatusBadRequest, "BAD_REQUEST", "Image path must be between 1 and 255 characters.")
		return true, ""
	}

	return false, result
}
