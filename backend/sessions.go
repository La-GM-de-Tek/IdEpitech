package main

import "github.com/gin-gonic/gin"

type sessionURI struct {
	ID uint `uri:"id"`
}

type listSessionsQuery struct {
	pageQuery
	Campus  string `form:"campus"`
	From    string `form:"from"`
	To      string `form:"to"`
	Subject *uint  `form:"subject"`
	Theme   *uint  `form:"theme"`
}

type createSessionRequest struct {
	Nom     string `json:"nom"`
	Date    string `json:"date"`
	Campus  string `json:"campus"`
	Subject uint   `json:"subject"`
	Theme   *uint  `json:"theme"`
	Token   *int   `json:"token"`
}

type updateSessionRequest struct {
	Nom     *string `json:"nom"`
	Date    *string `json:"date"`
	Campus  *string `json:"campus"`
	Subject *uint   `json:"subject"`
	Theme   *uint   `json:"theme"`
	Token   *int    `json:"token"`
}

type redeemSessionRequest struct {
	Token int `json:"token"`
}

func (app *App) handleListSessions(c *gin.Context) {
	var query listSessionsQuery
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListCampuses(c *gin.Context) {
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetSession(c *gin.Context) {
	var uri sessionURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateSession(c *gin.Context) {
	var req createSessionRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateSession(c *gin.Context) {
	var uri sessionURI
	var req updateSessionRequest
	bindURI(c, &uri)
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteSession(c *gin.Context) {
	var uri sessionURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListSessionUsers(c *gin.Context) {
	var uri sessionURI
	var query pageQuery
	bindURI(c, &uri)
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleRedeemSession(c *gin.Context) {
	var req redeemSessionRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListMySessions(c *gin.Context) {
	var query pageQuery
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListUserSessions(c *gin.Context) {
	var uri userURI
	var query pageQuery
	bindURI(c, &uri)
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}
