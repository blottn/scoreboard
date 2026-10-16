package db

import (
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"time"
)

var (
	DBFilePath = flag.String("db-file-path", "live/live", "the path to where the db will initially be loaded from and then persisted to")
	DBLoad     = flag.Bool("db-load", true, "whether the db should be loaded first")
	DBSave     = flag.Bool("db-save", true, "whether the db should be saved routinely")
	DBSaveRate = flag.Duration("db-save-rate", 1*time.Second, "How often at minimum the DB should be saved")
)

type Database struct {
	Users      []*User
	Teams      []*Team
	NowPlaying string
	Mode       string // either "team" or "player" (individual) mode
}

var DB = Database{
	Users:      []*User{},
	Teams:      []*Team{},
	NowPlaying: "dev",
	Mode:       "team",
}

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
	for _, usr := range DB.Users {
		if usr.ID > lastID {
			lastID = usr.ID
		}
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

var version = 0

func Save() error {
	version += 1
	bs, err := json.Marshal(DB)
	if err != nil {
		return err
	}
	return os.WriteFile(fmt.Sprintf("%s-%d", *DBFilePath, version), bs, 0o666)
}

func GetName(ID int) (string, bool) {
	for _, user := range DB.Users {
		if user.ID == ID {
			return user.Name, true
		}
	}
	return "", false
}
