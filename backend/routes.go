package main

import "github.com/gin-gonic/gin"

func (app *App) registerRoutes(r *gin.Engine) {
	api := r.Group("/api")
	user := api.Group("", app.requireAuth())
	admin := api.Group("", app.requireAuth(), app.requireAdmin())

	api.GET("/health", app.handleHealth)

	api.POST("/auth/register", app.handleRegister)
	api.POST("/auth/login", app.handleLogin)
	user.POST("/auth/logout", app.handleLogout)

	user.GET("/users/me", app.handleMe)
	user.PATCH("/users/me", app.handleUpdateMe)
	user.PATCH("/users/me/password", app.handleUpdateMyPassword)
	user.DELETE("/users/me", app.handleDeleteMe)
	admin.GET("/users", app.handleListUsers)
	user.GET("/users/:id", app.handleGetUser)
	admin.PATCH("/users/:id", app.handleUpdateUser)
	admin.DELETE("/users/:id", app.handleDeleteUser)

	api.GET("/languages", app.handleListLanguages)
	api.GET("/languages/:id", app.handleGetLanguage)
	admin.POST("/languages", app.handleCreateLanguage)
	admin.PATCH("/languages/:id", app.handleUpdateLanguage)
	admin.DELETE("/languages/:id", app.handleDeleteLanguage)

	api.GET("/subjects", app.handleListSubjects)
	api.GET("/subjects/:id", app.handleGetSubject)
	admin.POST("/subjects", app.handleCreateSubject)
	admin.PATCH("/subjects/:id", app.handleUpdateSubject)
	admin.DELETE("/subjects/:id", app.handleDeleteSubject)

	api.GET("/subjects/:id/pdf", app.handleGetSubjectPdf)
	admin.PUT("/subjects/:id/pdf", app.handleUploadSubjectPdf)
	admin.DELETE("/subjects/:id/pdf", app.handleDeleteSubjectPdf)

	api.GET("/subjects/:id/steps", app.handleListSteps)
	admin.POST("/subjects/:id/steps", app.handleCreateStep)
	admin.PATCH("/subjects/:id/steps/:step_id", app.handleUpdateStep)
	admin.PUT("/subjects/:id/steps/order", app.handleReorderSteps)
	admin.DELETE("/subjects/:id/steps/:step_id", app.handleDeleteStep)

	user.GET("/users/me/subjects", app.handleListMySubjects)
	user.GET("/users/me/subjects/:subject_id", app.handleGetMySubject)
	user.POST("/users/me/subjects/:subject_id/steps/:step_id/validate", app.handleValidateStep)
	user.DELETE("/users/me/subjects/:subject_id", app.handleResetMySubject)
	user.POST("/users/me/subjects/import", app.handleImportMySubjects)
	admin.GET("/users/:id/subjects", app.handleListUserSubjects)
	admin.GET("/users/:id/subjects/:subject_id", app.handleGetUserSubject)

	api.GET("/successes", app.handleListSuccesses)
	api.GET("/successes/:id", app.handleGetSuccess)
	admin.POST("/successes", app.handleCreateSuccess)
	admin.PATCH("/successes/:id", app.handleUpdateSuccess)
	admin.DELETE("/successes/:id", app.handleDeleteSuccess)
	user.GET("/users/me/successes", app.handleListMySuccesses)
	user.POST("/users/me/successes", app.handleUnlockMySuccess)
	user.GET("/users/:id/successes", app.handleListUserSuccesses)

	api.GET("/themes", app.handleListThemes)
	api.GET("/themes/:id", app.handleGetTheme)
	admin.POST("/themes", app.handleCreateTheme)
	admin.PATCH("/themes/:id", app.handleUpdateTheme)
	admin.DELETE("/themes/:id", app.handleDeleteTheme)
	user.GET("/users/me/themes", app.handleListMyThemes)
	admin.POST("/users/:id/themes", app.handleGrantUserTheme)
	admin.DELETE("/users/:id/themes/:theme_id", app.handleRevokeUserTheme)

	api.GET("/sessions", app.handleListSessions)
	api.GET("/sessions/campuses", app.handleListCampuses)
	api.GET("/sessions/:id", app.handleGetSession)
	admin.POST("/sessions", app.handleCreateSession)
	admin.PATCH("/sessions/:id", app.handleUpdateSession)
	admin.DELETE("/sessions/:id", app.handleDeleteSession)
	admin.GET("/sessions/:id/users", app.handleListSessionUsers)
	user.POST("/sessions/redeem", app.handleRedeemSession)
	user.GET("/users/me/sessions", app.handleListMySessions)
	admin.GET("/users/:id/sessions", app.handleListUserSessions)
}
