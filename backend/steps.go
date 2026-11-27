package main

import "github.com/gin-gonic/gin"

type stepURI struct {
	ID     string `uri:"id"`
	StepID uint   `uri:"step_id"`
}

type createStepRequest struct {
	Title       string   `json:"title"`
	Position    *int     `json:"position"`
	Description *string  `json:"description"`
	StarterCode *string  `json:"starter_code"`
	BeforeCode  *string  `json:"before_code"`
	AfterCode   *string  `json:"after_code"`
	Expected    *string  `json:"expected"`
	Hints       []string `json:"hints"`
}

type updateStepRequest struct {
	Title       *string  `json:"title"`
	Description *string  `json:"description"`
	StarterCode *string  `json:"starter_code"`
	BeforeCode  *string  `json:"before_code"`
	AfterCode   *string  `json:"after_code"`
	Expected    *string  `json:"expected"`
	Hints       []string `json:"hints"`
}

type reorderStepsRequest struct {
	Order []uint `json:"order"`
}

func (app *App) handleListSteps(c *gin.Context) {
	var uri subjectURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleCreateStep(c *gin.Context) {
	var uri subjectURI
	var req createStepRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleUpdateStep(c *gin.Context) {
	var uri stepURI
	var req updateStepRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleReorderSteps(c *gin.Context) {
	var uri subjectURI
	var req reorderStepsRequest
	if !bindURI(c, &uri) {
		return
	}
	if !bindBody(c, &req) {
		return
	}
	// TODO
	respondNotImplemented(c)
}

func (app *App) handleDeleteStep(c *gin.Context) {
	var uri stepURI
	if !bindURI(c, &uri) {
		return
	}
	// TODO
	respondNotImplemented(c)
}
