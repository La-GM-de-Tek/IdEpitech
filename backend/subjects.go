package main

import (
	"errors"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"gorm.io/gorm"
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

	if strings.TrimSpace(req.Name) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"VALIDATION_ERROR": "Name is required"})
		return
	}
	if req.Difficulty < 0 || req.Difficulty > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"VALIDATION_ERROR": "Difficulty scope is between 0 and 3"})
		return
	}

	slugText := slug.Make(req.Name)
	if req.Slug != nil && *req.Slug != "" {
		slugText = *req.Slug
	}
	published := false
	if req.Published != nil {
		published = *req.Published
	}

	subject := Subject {
		Name: req.Name,
		Slug: slugText,
		Langage: req.Langage,
		Description: req.Description,
		Difficulty: req.Difficulty,
		ComponentPath: req.ComponentPath,
		Published: published,
	}

    err := app.db.Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(&subject).Error; err != nil {
            return err
        }
        for i, s := range req.Steps {
            step := Step {
				SubjectID: subject.ID,
				Title: s.Title,
				Position: i,
				Description: s.Description,
				StarterCode: s.StarterCode,
				BeforeCode: s.BeforeCode,
				AfterCode: s.AfterCode,
				Expected: s.Expected,
				Hints: nil, // TODO
			}
            if err := tx.Create(&step).Error; err != nil {
                return err
            }
        }
        return nil
    })

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"INTERNAL ERROR": "Could not create Subject"})
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

	var subject Subject
	query := app.db.WithContext(c.Request.Context())

	if id, convErr := strconv.ParseUint(uri.ID, 10, 64); convErr == nil {
		query = query.Where("id = ?", id)
	} else {
		query = query.Where("slug = ?", uri.ID)
	}
	err := query.First(&subject).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(c, http.StatusNotFound, "NOT_FOUND", "Subject not found")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal error")
		return
	}

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Name cannot be empty")
			return
		}
		subject.Name = name
	}
	if req.Slug != nil {
		slugText := strings.TrimSpace(*req.Slug)
		if slugText == "" {
			respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Slug cannot be empty")
			return
		}
		subject.Slug = slugText
	}
	if req.Langage != nil {
		subject.Langage = *req.Langage
	}
	if req.Description != nil {
		subject.Description = req.Description
	}
	if req.Difficulty != nil {
		if *req.Difficulty < 0 || *req.Difficulty > 3 {
			respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Difficulty must be between 0 and 3")
			return
		}
		subject.Difficulty = *req.Difficulty
	}
	if req.ComponentPath != nil {
		subject.ComponentPath = req.ComponentPath
	}
	if req.Published != nil {
		subject.Published = *req.Published
	}

	err = app.db.WithContext(c.Request.Context()).Save(&subject).Error
	if errors.Is(err, gorm.ErrDuplicatedKey) {
		respondError(c, http.StatusConflict, "CONFLICT", "Slug already taken")
		return
	}
	if errors.Is(err, gorm.ErrForeignKeyViolated) {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Language does not exist")
		return
	}
	if err != nil {
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal error")
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
