package main

import (
	"net/http"
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

const (
	passwordPath    = "/api/users/me/password"
	currentPassword = "current-password"
	newPassword     = "brand-new-password"
)

func passwordBody(current, next string) map[string]string {
	return map[string]string{"current_password": current, "new_password": next}
}

func storedHash(t *testing.T, app *App, id uint) string {
	t.Helper()
	var user User
	if err := app.db.Select("password").First(&user, id).Error; err != nil {
		t.Fatalf("reload user: %v", err)
	}
	return user.Password
}

func login(t *testing.T, app *App, login, password string) int {
	t.Helper()
	_, r := newTestApp(t)
	w := doRequest(t, r, http.MethodPost, "/api/auth/login", "", map[string]string{"login": login, "password": password})
	return w.Code
}

func TestUpdatePasswordSuccess(t *testing.T) {
	app, r := newTestApp(t)
	user, token := createTestUser(t, app, currentPassword)
	before := storedHash(t, app, user.ID)

	w := doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, newPassword))
	assertStatus(t, w, http.StatusNoContent)
	if w.Body.Len() != 0 {
		t.Errorf("204 must have an empty body, got %q", w.Body.String())
	}

	after := storedHash(t, app, user.ID)
	if after == before {
		t.Fatal("password hash did not change")
	}
	if after == newPassword {
		t.Fatal("new password stored in plaintext")
	}
	if bcrypt.CompareHashAndPassword([]byte(after), []byte(newPassword)) != nil {
		t.Fatal("stored hash does not match the new password")
	}
	if bcrypt.CompareHashAndPassword([]byte(after), []byte(currentPassword)) == nil {
		t.Fatal("stored hash still matches the old password")
	}
}

func TestUpdatePasswordThenLogin(t *testing.T) {
	app, r := newTestApp(t)
	user, token := createTestUser(t, app, currentPassword)

	w := doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, newPassword))
	assertStatus(t, w, http.StatusNoContent)

	if code := login(t, app, user.Username, newPassword); code != http.StatusOK {
		t.Errorf("login with new password: status = %d, want 200", code)
	}
	if code := login(t, app, user.Username, currentPassword); code != http.StatusUnauthorized {
		t.Errorf("login with old password: status = %d, want 401", code)
	}
}

func TestUpdatePasswordKeepsOtherFields(t *testing.T) {
	app, r := newTestApp(t)
	user, token := createTestUser(t, app, currentPassword)

	w := doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, newPassword))
	assertStatus(t, w, http.StatusNoContent)

	var got User
	if err := app.db.First(&got, user.ID).Error; err != nil {
		t.Fatalf("reload user: %v", err)
	}
	if got.Username != user.Username || got.Mail != user.Mail {
		t.Errorf("other fields changed: got %s/%s, want %s/%s", got.Username, got.Mail, user.Username, user.Mail)
	}
}

func TestUpdatePasswordOnlyChangesCaller(t *testing.T) {
	app, r := newTestApp(t)
	_, token := createTestUser(t, app, currentPassword)
	other, _ := createTestUser(t, app, currentPassword)
	otherBefore := storedHash(t, app, other.ID)

	w := doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, newPassword))
	assertStatus(t, w, http.StatusNoContent)

	if storedHash(t, app, other.ID) != otherBefore {
		t.Fatal("another user's password was changed")
	}
}

func TestUpdatePasswordKeepsSpaces(t *testing.T) {
	app, r := newTestApp(t)
	user, token := createTestUser(t, app, currentPassword)
	spaced := "  spaced password  "

	w := doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, spaced))
	assertStatus(t, w, http.StatusNoContent)

	if code := login(t, app, user.Username, spaced); code != http.StatusOK {
		t.Errorf("login with exact spaced password: status = %d, want 200", code)
	}
	if code := login(t, app, user.Username, strings.TrimSpace(spaced)); code != http.StatusUnauthorized {
		t.Errorf("login with trimmed password: status = %d, want 401", code)
	}
}

func TestUpdatePasswordBoundaries(t *testing.T) {
	tests := []struct {
		name string
		next string
	}{
		{"exactly 8 chars", "12345678"},
		{"exactly 72 bytes", strings.Repeat("a", 72)},
		{"8 multibyte chars", strings.Repeat("é", 8)},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app, r := newTestApp(t)
			user, token := createTestUser(t, app, currentPassword)

			w := doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, tt.next))
			assertStatus(t, w, http.StatusNoContent)

			if bcrypt.CompareHashAndPassword([]byte(storedHash(t, app, user.ID)), []byte(tt.next)) != nil {
				t.Fatal("stored hash does not match the new password")
			}
		})
	}
}

func TestUpdatePasswordRejected(t *testing.T) {
	tests := []struct {
		name       string
		body       any
		wantStatus int
		wantCode   string
	}{
		{"wrong current password", passwordBody("wrong-password", newPassword), http.StatusUnauthorized, "UNAUTHORIZED"},
		{"current password with different case", passwordBody(strings.ToUpper(currentPassword), newPassword), http.StatusUnauthorized, "UNAUTHORIZED"},
		{"current password with extra space", passwordBody(currentPassword+" ", newPassword), http.StatusUnauthorized, "UNAUTHORIZED"},
		{"missing current password", map[string]string{"new_password": newPassword}, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"empty current password", passwordBody("", newPassword), http.StatusBadRequest, "VALIDATION_ERROR"},
		{"missing new password", map[string]string{"current_password": currentPassword}, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"new password too short", passwordBody(currentPassword, "1234567"), http.StatusBadRequest, "VALIDATION_ERROR"},
		{"new password over 72 bytes", passwordBody(currentPassword, strings.Repeat("a", 73)), http.StatusBadRequest, "VALIDATION_ERROR"},
		{"multibyte new password over 72 bytes", passwordBody(currentPassword, strings.Repeat("é", 37)), http.StatusBadRequest, "VALIDATION_ERROR"},
		{"empty JSON object", map[string]string{}, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"no body", nil, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"malformed JSON", `{"current_password":`, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"wrong JSON types", `{"current_password":123,"new_password":true}`, http.StatusBadRequest, "VALIDATION_ERROR"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app, r := newTestApp(t)
			user, token := createTestUser(t, app, currentPassword)
			before := storedHash(t, app, user.ID)

			w := doRequest(t, r, http.MethodPatch, passwordPath, token, tt.body)
			assertStatus(t, w, tt.wantStatus)
			if code := errorCode(t, w); code != tt.wantCode {
				t.Errorf("error code = %q, want %q", code, tt.wantCode)
			}
			if storedHash(t, app, user.ID) != before {
				t.Fatal("password changed on a rejected request")
			}
		})
	}
}

func TestUpdatePasswordAuth(t *testing.T) {
	app, r := newTestApp(t)
	user, _ := createTestUser(t, app, currentPassword)
	before := storedHash(t, app, user.ID)

	wrongSecret := &App{jwtSecret: []byte("another-secret")}
	forged, err := wrongSecret.signToken(user.ID)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	tests := []struct {
		name   string
		header string
	}{
		{"no header", ""},
		{"not bearer", "Basic abc"},
		{"empty bearer", "Bearer "},
		{"garbage token", "Bearer not-a-jwt"},
		{"token signed with another secret", "Bearer " + forged},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := doRequestAuthHeader(t, r, http.MethodPatch, passwordPath, tt.header, passwordBody(currentPassword, newPassword))
			assertStatus(t, w, http.StatusUnauthorized)
			if code := errorCode(t, w); code != "UNAUTHORIZED" {
				t.Errorf("error code = %q, want UNAUTHORIZED", code)
			}
		})
	}

	if storedHash(t, app, user.ID) != before {
		t.Fatal("password changed without valid authentication")
	}
}

func TestUpdatePasswordDeletedUser(t *testing.T) {
	app, r := newTestApp(t)
	user, token := createTestUser(t, app, currentPassword)
	if err := app.db.Delete(&User{}, user.ID).Error; err != nil {
		t.Fatalf("delete user: %v", err)
	}

	w := doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, newPassword))
	assertStatus(t, w, http.StatusNotFound)
	if code := errorCode(t, w); code != "NOT_FOUND" {
		t.Errorf("error code = %q, want NOT_FOUND", code)
	}
}

func TestUpdatePasswordTwice(t *testing.T) {
	app, r := newTestApp(t)
	_, token := createTestUser(t, app, currentPassword)

	w := doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, newPassword))
	assertStatus(t, w, http.StatusNoContent)

	w = doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(currentPassword, "third-password"))
	assertStatus(t, w, http.StatusUnauthorized)

	w = doRequest(t, r, http.MethodPatch, passwordPath, token, passwordBody(newPassword, "third-password"))
	assertStatus(t, w, http.StatusNoContent)
}
