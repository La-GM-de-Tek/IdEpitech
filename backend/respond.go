package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details any    `json:"details,omitempty"`
}

type errorResponse struct {
	Error apiError `json:"error"`
}

type pageQuery struct {
	Page  int `form:"page"`
	Limit int `form:"limit"`
}

type sortQuery struct {
	Sort  string `form:"sort"`
	Order string `form:"order"`
}

func respondError(c *gin.Context, status int, code, message string) {
	c.JSON(status, errorResponse{Error: apiError{Code: code, Message: message}})
}

func abortError(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, errorResponse{Error: apiError{Code: code, Message: message}})
}

func respondNotImplemented(c *gin.Context) {
	respondError(c, http.StatusNotImplemented, "NOT_IMPLEMENTED", "route not implemented yet")
}

func bindURI(c *gin.Context, req any) bool {
	if err := c.ShouldBindUri(req); err != nil {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid uri parameters")
		return false
	}
	return true
}

func bindQuery(c *gin.Context, req any) bool {
	if err := c.ShouldBindQuery(req); err != nil {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid query parameters")
		return false
	}
	return true
}

func bindBody(c *gin.Context, req any) bool {
	if err := c.ShouldBind(req); err != nil {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request body")
		return false
	}
	return true
}
