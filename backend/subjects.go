package main

import (
	"mime/multipart"

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
	bindQuery(c, &query)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetSubject(c *gin.Context) {
	var uri subjectURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateSubject(c *gin.Context) {
	var req createSubjectRequest
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateSubject(c *gin.Context) {
	var uri subjectURI
	var req updateSubjectRequest
	bindURI(c, &uri)
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteSubject(c *gin.Context) {
	var uri subjectURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleGetSubjectPdf(c *gin.Context) {
	var uri subjectURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUploadSubjectPdf(c *gin.Context) {
	var uri subjectURI
	var req uploadPdfRequest
	bindURI(c, &uri)
	bindBody(c, &req)
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteSubjectPdf(c *gin.Context) {
	var uri subjectURI
	bindURI(c, &uri)
	// TODO
	respondNotImplemented(c)
}
