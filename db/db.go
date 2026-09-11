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
	DBFilePath = flag.String("db-file-path", "/dev/null", "the path to where the db will initially be loaded from an then persisted to")
	DBLoad     = flag.Bool("db-load", false, "whether the db should be loaded first")
	DBSave     = flag.Bool("db-save", false, "whether the db should be saved routinely")
	DBSaveRate = flag.Duration("db-save-rate", 1*time.Second, "How often at minimum the DB should be saved")
)

type Database struct {
	Users []User
	Teams []Team
}

var DB = Database{}

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

func GetName(ID int) (string, bool) {
	for _, user := range DB.Users {
		if user.ID == ID {
			return user.Name, true
		}
	}
	return "", false
}
