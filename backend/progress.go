package main

import "github.com/gin-gonic/gin"

type mySubjectURI struct {
	SubjectID uint `uri:"subject_id"`
}

type myStepURI struct {
	SubjectID uint `uri:"subject_id"`
	StepID    uint `uri:"step_id"`
}

type userSubjectURI struct {
	ID        uint `uri:"id"`
	SubjectID uint `uri:"subject_id"`
}

type listUserSubjectsQuery struct {
	pageQuery
	Completed *bool `form:"completed"`
	Bonus     *bool `form:"bonus"`
	Langage   *uint `form:"langage"`
}

type validateStepRequest struct {
	Output *string `json:"output"`
}

type importSubjectItem struct {
	Slug string `json:"slug"`
	Mark string `json:"mark"`
}

type importSubjectsRequest struct {
	Subjects []importSubjectItem `json:"subjects"`
}

func (app *App) handleListMySubjects(c *gin.Context) {
	var query listUserSubjectsQuery
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetMySubject(c *gin.Context) {
	var uri mySubjectURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleValidateStep(c *gin.Context) {
	var uri myStepURI
	var req validateStepRequest
	bindURI(c, &uri)
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleResetMySubject(c *gin.Context) {
	var uri mySubjectURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleImportMySubjects(c *gin.Context) {
	var req importSubjectsRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleListUserSubjects(c *gin.Context) {
	var uri userURI
	var query listUserSubjectsQuery
	bindURI(c, &uri)
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetUserSubject(c *gin.Context) {
	var uri userSubjectURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}
