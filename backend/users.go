package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
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
	if !getUserMe(c, app.db, &user) {
		return
	}

	c.JSON(http.StatusOK, user)
}

func (app *App) handleUpdateMe(c *gin.Context) {
	var req updateMeRequest
	if !bindBody(c, &req) {
		return
	}

	var user User
	if !getUserMe(c, app.db, &user) {
		return
	}

	updates, ok := buildUserMeUpdates(c, req)
	if !ok {
		return
	}
	if !applyUserUpdates(c, app.db, &user, updates) {
		return
	}

	c.JSON(http.StatusOK, user)
}

func (app *App) handleUpdateMyPassword(c *gin.Context) {
	var req updatePasswordRequest
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteMe(c *gin.Context) {
	var req deleteMeRequest
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListUsers(c *gin.Context) {
	var query listUsersQuery
	if !bindQuery(c, &query) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetUser(c *gin.Context) {
	var uri userURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateUser(c *gin.Context) {
	var uri userURI
	var req updateUserRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteUser(c *gin.Context) {
	var uri userURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}
