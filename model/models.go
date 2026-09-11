// Package model provides the common structs and a very primitive DB program
package model

import (
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"time"
)

type User struct {
	Name  string
	Team  string // FK team
	Score float64
}

type Team struct {
	Name  string
	Color float64 // I guess?
}

var (
	DBFilePath = flag.String("db-file-path", "/dev/null", "the path to where the db will initially be loaded from an then persisted to")
	DBLoad     = flag.Bool("db-load", false, "whether the db should be loaded first")
	DBSave     = flag.Bool("db-save", false, "whether the db should be saved routinely")
	DBSaveRate = flag.Duration("db-save-rate", 1*time.Second, "How often at minimum the DB should be saved")
)

var DB = struct {
	Users []User
	Teams []Team
}{}

func Start() error {
	if *DBLoad {
		err := Load()
		if err != nil {
			return fmt.Errorf("load: %w", err)
		}
	}
	if *DBSave {
		go func() {
			ticker := time.NewTicker(*DBSaveRate)
			for {
				<-ticker.C
				err := Save()
				if err != nil {
					slog.Error(fmt.Sprintf("DB.Save: %s", err.Error()))
				}
			}
		}()
	}
	return nil
}

func Load() error {
	bs, err := os.ReadFile(*DBFilePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(bs, &DB)
}

func Save() error {
	bs, err := json.Marshal(DB)
	if err != nil {
		return err
	}
	return os.WriteFile(*DBFilePath, bs, 0x666)
}
