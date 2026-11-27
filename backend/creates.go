package main

import (
	"encoding/json"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func buildSubject(req createSubjectRequest) Subject {
	return Subject{
		Name:          req.Name,
		Slug:          *req.Slug,
		Langage:       req.Langage,
		Description:   req.Description,
		Difficulty:    req.Difficulty,
		ComponentPath: req.ComponentPath,
		Published:     req.Published != nil && *req.Published,
	}
}

func buildSteps(reqs []createStepRequest) []Step {
	steps := make([]Step, len(reqs))
	for i, s := range reqs {
		steps[i] = Step{
			Position:    i,
			Title:       s.Title,
			Description: s.Description,
			StarterCode: s.StarterCode,
			BeforeCode:  s.BeforeCode,
			AfterCode:   s.AfterCode,
			Expected:    s.Expected,
			Hints:       buildHints(s.Hints),
		}
	}
	return steps
}

func buildHints(hints []string) json.RawMessage {
	if len(hints) == 0 {
		return nil
	}
	raw, _ := json.Marshal(hints)
	return raw
}

func createSubject(c *gin.Context, db *gorm.DB, subject *Subject, steps []Step) bool {
	err := db.WithContext(c.Request.Context()).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(subject).Error; err != nil {
			return err
		}
		if len(steps) == 0 {
			return nil
		}
		for i := range steps {
			steps[i].SubjectID = subject.ID
		}
		return tx.Create(&steps).Error
	})
	return checkSubjectWrite(c, "createSubject", err)
}
