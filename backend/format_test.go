package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// Unit tests: no database needed.

func newTestContext() (*gin.Context, *httptest.ResponseRecorder) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	return c, w
}

func TestFormatPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"empty", "", true},
		{"7 chars", "abcdefg", true},
		{"8 chars", "abcdefgh", false},
		{"72 bytes", strings.Repeat("a", 72), false},
		{"73 bytes", strings.Repeat("a", 73), true},
		{"8 accented runes", strings.Repeat("é", 8), false},
		{"7 accented runes", strings.Repeat("é", 7), true},
		{"37 accented runes over 72 bytes", strings.Repeat("é", 37), true},
		{"8 spaces", strings.Repeat(" ", 8), false},
		{"padded short password", "  abc  ", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c, w := newTestContext()
			gotErr := !formatPassword(c, tt.password)
			if gotErr != tt.wantErr {
				t.Fatalf("formatPassword(%q) failed = %v, want %v", tt.password, gotErr, tt.wantErr)
			}
			if tt.wantErr && w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", w.Code)
			}
			if !tt.wantErr && w.Body.Len() != 0 {
				t.Fatalf("valid password wrote a response: %s", w.Body.String())
			}
		})
	}
}

func TestFormatMePasswordRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     updateMePasswordRequest
		wantErr bool
	}{
		{"valid", updateMePasswordRequest{CurrentPassword: "old-password", NewPassword: "new-password"}, false},
		{"missing current", updateMePasswordRequest{NewPassword: "new-password"}, true},
		{"missing new", updateMePasswordRequest{CurrentPassword: "old-password"}, true},
		{"both missing", updateMePasswordRequest{}, true},
		{"new too short", updateMePasswordRequest{CurrentPassword: "old-password", NewPassword: "short"}, true},
		{"short current is accepted here", updateMePasswordRequest{CurrentPassword: "x", NewPassword: "new-password"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c, w := newTestContext()
			gotErr := !formatMePasswordRequest(c, &tt.req)
			if gotErr != tt.wantErr {
				t.Fatalf("formatMePasswordRequest(%+v) failed = %v, want %v", tt.req, gotErr, tt.wantErr)
			}
			if tt.wantErr && w.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", w.Code)
			}
		})
	}
}
