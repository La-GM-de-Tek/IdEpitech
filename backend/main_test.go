package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Integration tests need TEST_DATABASE_URL, e.g. with docker compose:
//
//	TEST_DATABASE_URL='postgres://Idepitech:Idepitech@localhost:5433/Idepitech?sslmode=disable' go test ./...
//
// Each run works in its own temporary schema, dropped at the end,
// so existing data is never touched. Without the variable, they are skipped.

var testDB *gorm.DB

const testSecret = "test-secret"

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)

	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		os.Exit(m.Run())
	}

	schema, cleanup, err := setupTestSchema(dsn)
	if err != nil {
		log.Fatalf("test db: %v", err)
	}

	testDB, err = openTestDB(dsn, schema)
	if err != nil {
		cleanup()
		log.Fatalf("test db: %v", err)
	}

	code := m.Run()
	cleanup()
	os.Exit(code)
}

func setupTestSchema(dsn string) (string, func(), error) {
	admin, err := gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: logger.Discard})
	if err != nil {
		return "", nil, err
	}
	schema := "test_" + randomHex(6)
	if err := admin.Exec("CREATE SCHEMA " + schema).Error; err != nil {
		return "", nil, err
	}
	cleanup := func() {
		if err := admin.Exec("DROP SCHEMA " + schema + " CASCADE").Error; err != nil {
			log.Printf("drop schema %s: %v", schema, err)
		}
	}
	return schema, cleanup, nil
}

func openTestDB(dsn, schema string) (*gorm.DB, error) {
	u, err := url.Parse(dsn)
	if err != nil {
		return nil, err
	}
	q := u.Query()
	q.Set("search_path", schema)
	u.RawQuery = q.Encode()

	db, err := gorm.Open(postgres.Open(u.String()), &gorm.Config{
		TranslateError: true,
		Logger:         logger.Discard,
	})
	if err != nil {
		return nil, err
	}
	return db, db.AutoMigrate(models...)
}

func randomHex(n int) string {
	b := make([]byte, n)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func newTestApp(t *testing.T) (*App, *gin.Engine) {
	t.Helper()
	if testDB == nil {
		t.Skip("TEST_DATABASE_URL not set: integration test skipped")
	}
	app := &App{db: testDB, jwtSecret: []byte(testSecret)}
	r := gin.New()
	app.registerRoutes(r)
	return app, r
}

func createTestUser(t *testing.T, app *App, password string) (User, string) {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		t.Fatalf("hash: %v", err)
	}
	id := randomHex(4)
	user := User{
		Username: "user_" + id,
		Mail:     fmt.Sprintf("user_%s@test.local", id),
		Password: string(hash),
	}
	if err := app.db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	t.Cleanup(func() { app.db.Delete(&User{}, user.ID) })

	token, err := app.signToken(user.ID)
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	return user, token
}

func doRequest(t *testing.T, r *gin.Engine, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()
	header := ""
	if token != "" {
		header = "Bearer " + token
	}
	return doRequestAuthHeader(t, r, method, path, header, body)
}

func doRequestAuthHeader(t *testing.T, r *gin.Engine, method, path, authHeader string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var raw []byte
	switch b := body.(type) {
	case nil:
	case string:
		raw = []byte(b)
	default:
		var err error
		if raw, err = json.Marshal(b); err != nil {
			t.Fatalf("marshal body: %v", err)
		}
	}

	req := httptest.NewRequest(method, path, bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func errorCode(t *testing.T, w *httptest.ResponseRecorder) string {
	t.Helper()
	var resp errorResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode error body %q: %v", w.Body.String(), err)
	}
	return resp.Error.Code
}

func assertStatus(t *testing.T, w *httptest.ResponseRecorder, want int) {
	t.Helper()
	if w.Code != want {
		t.Fatalf("status = %d, want %d (body: %s)", w.Code, want, w.Body.String())
	}
}
