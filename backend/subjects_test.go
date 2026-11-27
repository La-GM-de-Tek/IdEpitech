package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

const subjectsPath = "/api/subjects"

func createTestAdmin(t *testing.T, app *App) string {
	t.Helper()
	user, token := createTestUser(t, app, "admin-password")
	if err := app.db.Model(&user).Update("role", roleAdmin).Error; err != nil {
		t.Fatalf("promote admin: %v", err)
	}
	return token
}

func createTestLanguage(t *testing.T, app *App) Language {
	t.Helper()
	language := Language{Name: "lang_" + randomHex(4)}
	if err := app.db.Create(&language).Error; err != nil {
		t.Fatalf("create language: %v", err)
	}
	t.Cleanup(func() { app.db.Delete(&Language{}, language.ID) })
	return language
}

func cleanupSubjects(t *testing.T, app *App, prefix string) {
	t.Helper()
	t.Cleanup(func() {
		var ids []uint
		app.db.Model(&Subject{}).Where("slug LIKE ?", prefix+"%").Pluck("id", &ids)
		if len(ids) > 0 {
			app.db.Where("subject_id IN ?", ids).Delete(&Step{})
			app.db.Delete(&Subject{}, ids)
		}
	})
}

func decodeSubject(t *testing.T, w *httptest.ResponseRecorder) Subject {
	t.Helper()
	var subject Subject
	if err := json.Unmarshal(w.Body.Bytes(), &subject); err != nil {
		t.Fatalf("decode subject %q: %v", w.Body.String(), err)
	}
	return subject
}

func newSubjectTest(t *testing.T) (*App, *gin.Engine, string, Language, string) {
	t.Helper()
	app, r := newTestApp(t)
	token := createTestAdmin(t, app)
	language := createTestLanguage(t, app)
	name := "subject-" + randomHex(4)
	cleanupSubjects(t, app, name)
	return app, r, token, language, name
}

func TestCreateSubjectMinimal(t *testing.T) {
	app, r, token, language, name := newSubjectTest(t)

	w := doRequest(t, r, http.MethodPost, subjectsPath, token, map[string]any{
		"name":       "  " + strings.ToUpper(name) + "  ",
		"langage":    language.ID,
		"difficulty": 2,
	})
	assertStatus(t, w, http.StatusCreated)

	got := decodeSubject(t, w)
	if got.ID == 0 {
		t.Fatal("id not set in response")
	}
	if got.Name != strings.ToUpper(name) {
		t.Errorf("name = %q, want trimmed %q", got.Name, strings.ToUpper(name))
	}
	if got.Slug != name {
		t.Errorf("slug = %q, want %q generated from name", got.Slug, name)
	}
	if got.Published {
		t.Error("published defaults to true, want false")
	}

	var stored Subject
	if err := app.db.First(&stored, got.ID).Error; err != nil {
		t.Fatalf("subject not stored: %v", err)
	}
	if stored.Slug != name || stored.Difficulty != 2 || stored.Langage != language.ID {
		t.Errorf("stored = %+v, want slug %q, difficulty 2, langage %d", stored, name, language.ID)
	}
}

func TestCreateSubjectExplicitSlugIsNormalized(t *testing.T) {
	_, r, token, language, name := newSubjectTest(t)

	w := doRequest(t, r, http.MethodPost, subjectsPath, token, map[string]any{
		"name":       "Whatever",
		"slug":       "  " + strings.ToUpper(strings.ReplaceAll(name, "-", " ")) + " ",
		"langage":    language.ID,
		"difficulty": 0,
		"published":  true,
	})
	assertStatus(t, w, http.StatusCreated)

	got := decodeSubject(t, w)
	if got.Slug != name {
		t.Errorf("slug = %q, want %q", got.Slug, name)
	}
	if !got.Published {
		t.Error("published = false, want true")
	}
}

func TestCreateSubjectWithSteps(t *testing.T) {
	app, r, token, language, name := newSubjectTest(t)

	w := doRequest(t, r, http.MethodPost, subjectsPath, token, map[string]any{
		"name":       name,
		"langage":    language.ID,
		"difficulty": 1,
		"steps": []map[string]any{
			{"title": " First ", "position": 7, "hints": []string{"a", "b"}},
			{"title": "Second", "expected": "42"},
		},
	})
	assertStatus(t, w, http.StatusCreated)
	got := decodeSubject(t, w)

	var steps []Step
	if err := app.db.Where("subject_id = ?", got.ID).Order("position").Find(&steps).Error; err != nil {
		t.Fatalf("select steps: %v", err)
	}
	if len(steps) != 2 {
		t.Fatalf("got %d steps, want 2", len(steps))
	}
	if steps[0].Position != 0 || steps[0].Title != "First" {
		t.Errorf("step 0 = position %d title %q, want position 0 (array order) title %q", steps[0].Position, steps[0].Title, "First")
	}
	var hints []string
	if err := json.Unmarshal(steps[0].Hints, &hints); err != nil || len(hints) != 2 || hints[0] != "a" {
		t.Errorf("step 0 hints = %s, want [\"a\",\"b\"]", steps[0].Hints)
	}
	if steps[1].Position != 1 || steps[1].Expected == nil || *steps[1].Expected != "42" {
		t.Errorf("step 1 = position %d expected %v, want position 1 expected 42", steps[1].Position, steps[1].Expected)
	}
	if steps[1].Hints != nil {
		t.Errorf("step 1 hints = %s, want NULL", steps[1].Hints)
	}
}

func TestCreateSubjectRejected(t *testing.T) {
	app, r, token, language, name := newSubjectTest(t)

	valid := func(changes map[string]any) map[string]any {
		body := map[string]any{"name": name, "langage": language.ID, "difficulty": 1}
		for k, v := range changes {
			body[k] = v
		}
		return body
	}

	tests := []struct {
		name string
		body any
	}{
		{"missing name", valid(map[string]any{"name": nil})},
		{"blank name", valid(map[string]any{"name": "   "})},
		{"name over 255 characters", valid(map[string]any{"name": strings.Repeat("é", 256)})},
		{"name without letters or digits", valid(map[string]any{"name": "!!!"})},
		{"slug without letters or digits", valid(map[string]any{"slug": "!!!"})},
		{"negative difficulty", valid(map[string]any{"difficulty": -1})},
		{"difficulty over 3", valid(map[string]any{"difficulty": 4})},
		{"unknown langage", valid(map[string]any{"langage": 0})},
		{"step without title", valid(map[string]any{"steps": []map[string]any{{"title": " "}}})},
		{"no body", nil},
		{"malformed JSON", `{"name":`},
		{"wrong JSON types", `{"name":1,"difficulty":"hard"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := doRequest(t, r, http.MethodPost, subjectsPath, token, tt.body)
			assertStatus(t, w, http.StatusBadRequest)
			if code := errorCode(t, w); code != "VALIDATION_ERROR" {
				t.Errorf("error code = %q, want VALIDATION_ERROR", code)
			}
		})
	}

	var count int64
	app.db.Model(&Subject{}).Where("slug LIKE ?", name+"%").Count(&count)
	if count != 0 {
		t.Errorf("%d subjects created by rejected requests, want 0", count)
	}
}

func TestCreateSubjectDuplicateSlug(t *testing.T) {
	_, r, token, language, name := newSubjectTest(t)
	body := map[string]any{"name": name, "langage": language.ID, "difficulty": 1}

	assertStatus(t, doRequest(t, r, http.MethodPost, subjectsPath, token, body), http.StatusCreated)

	w := doRequest(t, r, http.MethodPost, subjectsPath, token, body)
	assertStatus(t, w, http.StatusConflict)
	if code := errorCode(t, w); code != "CONFLICT" {
		t.Errorf("error code = %q, want CONFLICT", code)
	}
}

func TestCreateSubjectRequiresAdmin(t *testing.T) {
	app, r := newTestApp(t)
	_, token := createTestUser(t, app, "user-password")

	w := doRequest(t, r, http.MethodPost, subjectsPath, token, map[string]any{"name": "x", "langage": 1, "difficulty": 1})
	assertStatus(t, w, http.StatusForbidden)

	w = doRequest(t, r, http.MethodPost, subjectsPath, "", map[string]any{"name": "x", "langage": 1, "difficulty": 1})
	assertStatus(t, w, http.StatusUnauthorized)
}

func createTestSubject(t *testing.T, r *gin.Engine, token string, language Language, slugText string) Subject {
	t.Helper()
	w := doRequest(t, r, http.MethodPost, subjectsPath, token, map[string]any{
		"name": slugText, "langage": language.ID, "difficulty": 1, "description": "desc",
	})
	assertStatus(t, w, http.StatusCreated)
	return decodeSubject(t, w)
}

func TestUpdateSubjectByIDAndSlug(t *testing.T) {
	app, r, token, language, name := newSubjectTest(t)
	subject := createTestSubject(t, r, token, language, name)

	w := doRequest(t, r, http.MethodPatch, fmt.Sprintf("%s/%d", subjectsPath, subject.ID), token, map[string]any{
		"name":       "  Renamed  ",
		"difficulty": 3,
	})
	assertStatus(t, w, http.StatusOK)
	got := decodeSubject(t, w)
	if got.Name != "Renamed" || got.Difficulty != 3 {
		t.Errorf("response = name %q difficulty %d, want Renamed 3", got.Name, got.Difficulty)
	}
	if got.Slug != name || got.Description == nil || *got.Description != "desc" {
		t.Errorf("untouched fields changed: slug %q description %v", got.Slug, got.Description)
	}

	w = doRequest(t, r, http.MethodPatch, subjectsPath+"/"+name, token, map[string]any{
		"slug":      strings.ToUpper(name) + " v2",
		"published": true,
	})
	assertStatus(t, w, http.StatusOK)
	got = decodeSubject(t, w)
	if got.Slug != name+"-v2" || !got.Published {
		t.Errorf("response = slug %q published %v, want %q true", got.Slug, got.Published, name+"-v2")
	}

	var stored Subject
	app.db.First(&stored, subject.ID)
	if stored.Name != "Renamed" || stored.Slug != name+"-v2" || stored.Difficulty != 3 || !stored.Published {
		t.Errorf("stored = %+v", stored)
	}
}

func TestUpdateSubjectEmptyObjectChangesNothing(t *testing.T) {
	_, r, token, language, name := newSubjectTest(t)
	subject := createTestSubject(t, r, token, language, name)

	w := doRequest(t, r, http.MethodPatch, fmt.Sprintf("%s/%d", subjectsPath, subject.ID), token, map[string]any{})
	assertStatus(t, w, http.StatusOK)
	if got := decodeSubject(t, w); got.Name != subject.Name || got.Slug != subject.Slug {
		t.Errorf("response = %+v, want unchanged %+v", got, subject)
	}
}

func TestUpdateSubjectRejected(t *testing.T) {
	app, r, token, language, name := newSubjectTest(t)
	subject := createTestSubject(t, r, token, language, name)
	other := createTestSubject(t, r, token, language, name+"-other")
	path := fmt.Sprintf("%s/%d", subjectsPath, subject.ID)

	tests := []struct {
		name       string
		path       string
		body       any
		wantStatus int
		wantCode   string
	}{
		{"unknown id", subjectsPath + "/999999999", map[string]any{"name": "x"}, http.StatusNotFound, "NOT_FOUND"},
		{"unknown slug", subjectsPath + "/" + name + "-missing", map[string]any{"name": "x"}, http.StatusNotFound, "NOT_FOUND"},
		{"blank name", path, map[string]any{"name": " "}, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"slug without letters or digits", path, map[string]any{"slug": "!!!"}, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"difficulty over 3", path, map[string]any{"difficulty": 4}, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"unknown langage", path, map[string]any{"langage": 0}, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"slug already taken", path, map[string]any{"slug": other.Slug}, http.StatusConflict, "CONFLICT"},
		{"no body", path, nil, http.StatusBadRequest, "VALIDATION_ERROR"},
		{"malformed JSON", path, `{"name":`, http.StatusBadRequest, "VALIDATION_ERROR"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := doRequest(t, r, http.MethodPatch, tt.path, token, tt.body)
			assertStatus(t, w, tt.wantStatus)
			if code := errorCode(t, w); code != tt.wantCode {
				t.Errorf("error code = %q, want %q", code, tt.wantCode)
			}
		})
	}

	var stored Subject
	app.db.First(&stored, subject.ID)
	if stored.Name != subject.Name || stored.Slug != subject.Slug || stored.Difficulty != subject.Difficulty || stored.Langage != subject.Langage {
		t.Errorf("subject changed by rejected requests: %+v", stored)
	}
}
