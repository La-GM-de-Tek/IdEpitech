package main

import (
	"encoding/json"
	"time"
)

type User struct {
	ID       uint    `gorm:"primaryKey" json:"id"`
	Username string  `gorm:"size:32;uniqueIndex;not null" json:"username"`
	Mail     string  `gorm:"size:255;uniqueIndex;not null" json:"mail"`
	Password string  `gorm:"size:255;not null" json:"-"`
	Role     *string `gorm:"size:255" json:"role"`
	Image    *string `gorm:"size:255" json:"image"`
	Session  *uint   `json:"session"`
}

type Language struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"size:255;uniqueIndex;not null" json:"name"`
}

type Subject struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time `gorm:"type:date" json:"created_at"`
	UpdatedAt     time.Time `gorm:"type:date" json:"updated_at"`
	Name          string    `gorm:"size:255;not null" json:"name"`
	Langage       uint      `gorm:"not null" json:"langage"`
	Language      Language  `gorm:"foreignKey:Langage;constraint:OnDelete:RESTRICT" json:"-"`
	Slug          string    `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Description   *string   `gorm:"type:text" json:"description"`
	Difficulty    int       `gorm:"not null" json:"difficulty"`
	PdfPath       *string   `gorm:"size:255" json:"pdf_path"`
	ComponentPath *string   `gorm:"size:255" json:"component_path"`
	Published     bool      `gorm:"not null;default:false" json:"published"`
	Steps         []Step    `gorm:"constraint:OnDelete:CASCADE" json:"-"`
}

type Step struct {
	ID          uint            `gorm:"primaryKey" json:"id"`
	SubjectID   uint            `gorm:"not null;uniqueIndex:idx_step_subject_position" json:"subject_id"`
	Position    int             `gorm:"not null;uniqueIndex:idx_step_subject_position" json:"position"`
	Title       string          `gorm:"size:255;not null" json:"title"`
	Description *string         `gorm:"type:text" json:"description"`
	StarterCode *string         `gorm:"type:text" json:"starter_code"`
	BeforeCode  *string         `gorm:"type:text" json:"before_code"`
	AfterCode   *string         `gorm:"type:text" json:"after_code"`
	Expected    *string         `gorm:"type:text" json:"expected"`
	Hints       json.RawMessage `gorm:"type:json" json:"hints"`
	CreatedAt   time.Time       `gorm:"type:date" json:"created_at"`
	UpdatedAt   time.Time       `gorm:"type:date" json:"updated_at"`
}

type StepToUser struct {
	ID       uint      `gorm:"primaryKey" json:"id"`
	StepID   uint      `gorm:"not null;uniqueIndex:idx_step_user" json:"step_id"`
	Step     Step      `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	UserID   uint      `gorm:"not null;uniqueIndex:idx_step_user" json:"user_id"`
	User     User      `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	PassedAt time.Time `gorm:"type:date;not null" json:"passed_at"`
}

type SubjectToUser struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	SubjectID uint    `gorm:"not null;uniqueIndex:idx_subject_user" json:"subject_id"`
	Subject   Subject `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	UserID    uint    `gorm:"not null;uniqueIndex:idx_subject_user" json:"user_id"`
	User      User    `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	Completed bool    `gorm:"not null;default:false" json:"completed"`
	Bonus     bool    `gorm:"not null;default:false" json:"bonus"`
}

type Success struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `gorm:"type:date" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:date" json:"updated_at"`
	Name      string    `gorm:"size:255;uniqueIndex;not null" json:"name"`
}

type SuccessToUser struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SuccessID  uint      `gorm:"not null;uniqueIndex:idx_success_user" json:"success_id"`
	Success    Success   `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	UserID     uint      `gorm:"not null;uniqueIndex:idx_success_user" json:"user_id"`
	User       User      `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	ObtainedAt time.Time `gorm:"type:date;not null" json:"obtained_at"`
}

type Theme struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `gorm:"type:date" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:date" json:"updated_at"`
	Name      string    `gorm:"size:255;uniqueIndex;not null" json:"name"`
}

type ThemeToUser struct {
	ID      uint  `gorm:"primaryKey" json:"id"`
	ThemeID uint  `gorm:"not null;uniqueIndex:idx_theme_user" json:"theme_id"`
	Theme   Theme `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	UserID  uint  `gorm:"not null;uniqueIndex:idx_theme_user" json:"user_id"`
	User    User  `gorm:"constraint:OnDelete:CASCADE" json:"-"`
}

type Session struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Nom       string    `gorm:"size:255;not null" json:"nom"`
	Date      time.Time `gorm:"type:date;not null" json:"date"`
	Campus    string    `gorm:"size:255;not null" json:"campus"`
	SubjectID uint      `gorm:"column:subject;not null" json:"subject"`
	Subject   Subject   `gorm:"foreignKey:SubjectID;constraint:OnDelete:CASCADE" json:"-"`
	ThemeID   *uint     `gorm:"column:theme" json:"theme"`
	Theme     *Theme    `gorm:"foreignKey:ThemeID;constraint:OnDelete:SET NULL" json:"-"`
	Token     int       `gorm:"uniqueIndex;not null" json:"token"`
}

type SessionToUser struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	UserID    uint    `gorm:"not null;uniqueIndex:idx_session_user" json:"user_id"`
	User      User    `gorm:"constraint:OnDelete:CASCADE" json:"-"`
	SessionID uint    `gorm:"not null;uniqueIndex:idx_session_user" json:"session_id"`
	Session   Session `gorm:"constraint:OnDelete:CASCADE" json:"-"`
}

var models = []any{
	&User{},
	&Language{},
	&Subject{},
	&Step{},
	&StepToUser{},
	&SubjectToUser{},
	&Success{},
	&SuccessToUser{},
	&Theme{},
	&ThemeToUser{},
	&Session{},
	&SessionToUser{},
}
