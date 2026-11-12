package main

import "github.com/gin-gonic/gin"

type successURI struct {
	ID uint `uri:"id"`
}

type successRequest struct {
	Name *string `json:"name"`
}

type unlockSuccessRequest struct {
	SuccessID *uint   `json:"success_id"`
	Name      *string `json:"name"`
}

func (app *App) handleListSuccesses(c *gin.Context) {
	var query pageQuery
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetSuccess(c *gin.Context) {
	var uri successURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateSuccess(c *gin.Context) {
	var req successRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateSuccess(c *gin.Context) {
	var uri successURI
	var req successRequest
	bindURI(c, &uri)
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteSuccess(c *gin.Context) {
	var uri successURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListMySuccesses(c *gin.Context) {
	var query pageQuery
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUnlockMySuccess(c *gin.Context) {
	var req unlockSuccessRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListUserSuccesses(c *gin.Context) {
	var uri userURI
	var query pageQuery
	bindURI(c, &uri)
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}
