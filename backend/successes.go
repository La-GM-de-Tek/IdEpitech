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
	if !bindQuery(c, &query) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetSuccess(c *gin.Context) {
	var uri successURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateSuccess(c *gin.Context) {
	var req successRequest
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateSuccess(c *gin.Context) {
	var uri successURI
	var req successRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteSuccess(c *gin.Context) {
	var uri successURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListMySuccesses(c *gin.Context) {
	var query pageQuery
	if !bindQuery(c, &query) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUnlockMySuccess(c *gin.Context) {
	var req unlockSuccessRequest
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListUserSuccesses(c *gin.Context) {
	var uri userURI
	var query pageQuery
	if !bindURI(c, &uri) {
		return
	}
	if !bindQuery(c, &query) {
		return
	}
	// TODO
	respondNotImplemented(c)
}
