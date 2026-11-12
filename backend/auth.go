package main

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	tokenTTL     = 24 * time.Hour
	userIDCtxKey = "userID"
	roleAdmin    = "admin"
)

type registerRequest struct {
	Username string `json:"username" binding:"required,min=3,max=32"`
	Mail     string `json:"mail" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8,max=72"`
}

type loginRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type authResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	User        User   `json:"user"`
}

func (app *App) handleRegister(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("register: hash: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return
	}

	user := User{
		Username: strings.TrimSpace(req.Username),
		Mail:     strings.ToLower(strings.TrimSpace(req.Mail)),
		Password: string(hash),
	}
	err = app.db.WithContext(c.Request.Context()).Create(&user).Error
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		respondError(c, http.StatusConflict, "CONFLICT", "mail or username already taken")
		return
	}
	if err != nil {
		log.Printf("register: create: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return
	}

	app.respondWithToken(c, http.StatusCreated, user)
}

func (app *App) handleLogin(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}

	login := strings.TrimSpace(req.Login)
	var user User
	err := app.db.WithContext(c.Request.Context()).
		Where("mail = ? OR username = ?", strings.ToLower(login), login).
		First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid login or password")
		return
	}
	if err != nil {
		log.Printf("login: select: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)) != nil {
		respondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid login or password")
		return
	}

	app.respondWithToken(c, http.StatusOK, user)
}

func (app *App) handleLogout(c *gin.Context) {
	// TODO
	respondNotImplemented(c)
}

func (app *App) respondWithToken(c *gin.Context, status int, user User) {
	token, err := app.signToken(user.ID)
	if err != nil {
		log.Printf("sign token: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return
	}
	c.JSON(status, authResponse{
		AccessToken: token,
		ExpiresIn:   int(tokenTTL.Seconds()),
		User:        user,
	})
}

func (app *App) signToken(userID uint) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatUint(uint64(userID), 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(tokenTTL)),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(app.jwtSecret)
}

func (app *App) requireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := strings.CutPrefix(c.GetHeader("Authorization"), "Bearer ")
		if !ok || raw == "" {
			abortError(c, http.StatusUnauthorized, "UNAUTHORIZED", "missing bearer token")
			return
		}

		claims := &jwt.RegisteredClaims{}
		_, err := jwt.ParseWithClaims(raw, claims,
			func(*jwt.Token) (any, error) { return app.jwtSecret, nil },
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
			jwt.WithExpirationRequired(),
		)
		if err != nil {
			abortError(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid or expired token")
			return
		}

		userID, err := strconv.ParseUint(claims.Subject, 10, 64)
		if err != nil {
			abortError(c, http.StatusUnauthorized, "UNAUTHORIZED", "invalid token subject")
			return
		}

		c.Set(userIDCtxKey, uint(userID))
		c.Next()
	}
}

func (app *App) requireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		var user User
		err := app.db.WithContext(c.Request.Context()).
			Select("id", "role").
			First(&user, c.GetUint(userIDCtxKey)).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			abortError(c, http.StatusUnauthorized, "UNAUTHORIZED", "user not found")
			return
		}
		if err != nil {
			log.Printf("require admin: select: %v", err)
			abortError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
			return
		}
		if user.Role == nil || *user.Role != roleAdmin {
			abortError(c, http.StatusForbidden, "FORBIDDEN", "admin role required")
			return
		}

		c.Next()
	}
}
