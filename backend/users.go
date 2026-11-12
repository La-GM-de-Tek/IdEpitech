package main

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type userURI struct {
	ID uint `uri:"id"`
}

type updateMeRequest struct {
	Username *string `json:"username"`
	Mail     *string `json:"mail"`
	Image    *string `json:"image"`
}

type updatePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type deleteMeRequest struct {
	Password string `json:"password"`
}

type listUsersQuery struct {
	pageQuery
	sortQuery
	Search string `form:"search"`
	Role   string `form:"role"`
}

type updateUserRequest struct {
	Role     *string `json:"role"`
	Username *string `json:"username"`
	Image    *string `json:"image"`
}

func (app *App) handleMe(c *gin.Context) {
	var user User
	err := app.db.WithContext(c.Request.Context()).First(&user, c.GetUint(userIDCtxKey)).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(c, http.StatusNotFound, "NOT_FOUND", "user not found")
		return
	}
	if err != nil {
		log.Printf("me: select: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return
	}

	c.JSON(http.StatusOK, user)
}

func (app *App) handleUpdateMe(c *gin.Context) {
	var req updateMeRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateMyPassword(c *gin.Context) {
	var req updatePasswordRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteMe(c *gin.Context) {
	var req deleteMeRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListUsers(c *gin.Context) {
	var query listUsersQuery
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetUser(c *gin.Context) {
	var uri userURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateUser(c *gin.Context) {
	var uri userURI
	var req updateUserRequest
	bindURI(c, &uri)
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteUser(c *gin.Context) {
	var uri userURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}
