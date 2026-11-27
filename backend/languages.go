package main

import "github.com/gin-gonic/gin"

type languageURI struct {
	ID uint `uri:"id"`
}

type languageRequest struct {
	Name *string `json:"name"`
}

func (app *App) handleListLanguages(c *gin.Context) {
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetLanguage(c *gin.Context) {
	var uri languageURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateLanguage(c *gin.Context) {
	var req languageRequest
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateLanguage(c *gin.Context) {
	var uri languageURI
	var req languageRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteLanguage(c *gin.Context) {
	var uri languageURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}
