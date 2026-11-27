package main

import (
	"mime/multipart"
	"net/http"

	"github.com/gin-gonic/gin"
)

type subjectURI struct {
	ID string `uri:"id"`
}

type listSubjectsQuery struct {
	pageQuery
	sortQuery
	Langage    *uint  `form:"langage"`
	Difficulty *int   `form:"difficulty"`
	Search     string `form:"search"`
	Published  *bool  `form:"published"`
}

type createSubjectRequest struct {
	Name          string              `json:"name"`
	Slug          *string             `json:"slug"`
	Langage       uint                `json:"langage"`
	Description   *string             `json:"description"`
	Difficulty    int                 `json:"difficulty"`
	ComponentPath *string             `json:"component_path"`
	Published     *bool               `json:"published"`
	Steps         []createStepRequest `json:"steps"`
}

type updateSubjectRequest struct {
	Name          *string `json:"name"`
	Slug          *string `json:"slug"`
	Langage       *uint   `json:"langage"`
	Description   *string `json:"description"`
	Difficulty    *int    `json:"difficulty"`
	ComponentPath *string `json:"component_path"`
	Published     *bool   `json:"published"`
}

type uploadPdfRequest struct {
	File *multipart.FileHeader `form:"file"`
}

func (app *App) handleListSubjects(c *gin.Context) {
	var query listSubjectsQuery
	if !bindQuery(c, &query) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetSubject(c *gin.Context) {
	var uri subjectURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateSubject(c *gin.Context) {
	var req createSubjectRequest
	if !bindBody(c, &req) {
		return
	}
	if !formatCreateSubjectRequest(c, &req) {
		return
	}

	subject := buildSubject(req)
	if !createSubject(c, app.db, &subject, buildSteps(req.Steps)) {
		return
	}

	c.JSON(http.StatusCreated, subject)
}

func (app *App) handleUpdateSubject(c *gin.Context) {
	var uri subjectURI
	var req updateSubjectRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	updates, ok := buildSubjectUpdates(c, req)
	if !ok {
		return
	}

	var subject Subject
	if !getSubject(c, app.db, uri.ID, &subject) {
		return
	}
	if !applySubjectUpdates(c, app.db, &subject, updates) {
		return
	}

	c.JSON(http.StatusOK, subject)
}

func (app *App) handleDeleteSubject(c *gin.Context) {
	var uri subjectURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetSubjectPdf(c *gin.Context) {
	var uri subjectURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUploadSubjectPdf(c *gin.Context) {
	var uri subjectURI
	var req uploadPdfRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteSubjectPdf(c *gin.Context) {
	var uri subjectURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}
