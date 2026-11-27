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
	if !bindQuery(c, &query) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListCampuses(c *gin.Context) {
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetSession(c *gin.Context) {
	var uri sessionURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateSession(c *gin.Context) {
	var req createSessionRequest
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateSession(c *gin.Context) {
	var uri sessionURI
	var req updateSessionRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteSession(c *gin.Context) {
	var uri sessionURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListSessionUsers(c *gin.Context) {
	var uri sessionURI
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

func (app *App) handleRedeemSession(c *gin.Context) {
	var req redeemSessionRequest
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListMySessions(c *gin.Context) {
	var query pageQuery
	if !bindQuery(c, &query) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListUserSessions(c *gin.Context) {
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
