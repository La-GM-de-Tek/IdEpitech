package main

import "github.com/gin-gonic/gin"

type themeURI struct {
	ID uint `uri:"id"`
}

type userThemeURI struct {
	ID      uint `uri:"id"`
	ThemeID uint `uri:"theme_id"`
}

type themeRequest struct {
	Name *string `json:"name"`
}

type grantThemeRequest struct {
	ThemeID uint `json:"theme_id"`
}

func (app *App) handleListThemes(c *gin.Context) {
	var query pageQuery
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetTheme(c *gin.Context) {
	var uri themeURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateTheme(c *gin.Context) {
	var req themeRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateTheme(c *gin.Context) {
	var uri themeURI
	var req themeRequest
	bindURI(c, &uri)
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteTheme(c *gin.Context) {
	var uri themeURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListMyThemes(c *gin.Context) {
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGrantUserTheme(c *gin.Context) {
	var uri userURI
	var req grantThemeRequest
	bindURI(c, &uri)
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleRevokeUserTheme(c *gin.Context) {
	var uri userThemeURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}
