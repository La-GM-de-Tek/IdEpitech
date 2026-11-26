package main

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var rewardThemes = []string{
	"manta", "printemps", "cobra", "ete", "paques", "aquarium", "saint-valentin",
	"automne", "forest", "octobre-rose", "nouvel-an", "halloween", "noel",
}

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

type unlockThemeRequest struct {
	Name string `json:"name" binding:"required"`
}

type userThemeResponse struct {
	ID    uint  `json:"id"`
	Theme Theme `json:"theme"`
}

func seedThemes(db *gorm.DB) error {
	for _, name := range rewardThemes {
		if err := db.FirstOrCreate(&Theme{}, Theme{Name: name}).Error; err != nil {
			return err
		}
	}
	return nil
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
	var rows []ThemeToUser
	err := app.db.WithContext(c.Request.Context()).
		Preload("Theme").
		Where("user_id = ?", c.GetUint(userIDCtxKey)).
		Order("id").
		Find(&rows).Error
	if err != nil {
		log.Printf("my themes: select: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return
	}

	themes := make([]userThemeResponse, len(rows))
	for i, row := range rows {
		themes[i] = userThemeResponse{ID: row.ID, Theme: row.Theme}
	}
	c.JSON(http.StatusOK, themes)
}

func (app *App) handleUnlockMyTheme(c *gin.Context) {
	var req unlockThemeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		return
	}
	db := app.db.WithContext(c.Request.Context())

	var theme Theme
	err := db.Where("name = ?", strings.TrimSpace(req.Name)).First(&theme).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		respondError(c, http.StatusNotFound, "NOT_FOUND", "theme not found")
		return
	}
	if err != nil {
		log.Printf("unlock theme: select theme: %v", err)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return
	}

	row := ThemeToUser{ThemeID: theme.ID, UserID: c.GetUint(userIDCtxKey)}
	result := db.Where(row).FirstOrCreate(&row)
	if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
		result = db.Where(row).First(&row)
		result.RowsAffected = 0
	}
	if result.Error != nil {
		log.Printf("unlock theme: insert: %v", result.Error)
		respondError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error")
		return
	}

	status := http.StatusOK
	if result.RowsAffected > 0 {
		status = http.StatusCreated
	}
	c.JSON(status, userThemeResponse{ID: row.ID, Theme: theme})
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
