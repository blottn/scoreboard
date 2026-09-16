// Package db provides the common structs and a very primitive DB program
package db

import (
	"fmt"
	"log/slog"
)

type User struct {
	ID    int
	Name  string
	Team  string // FK team
	Score float64
}

var lastID = 0

func NewUser(name, team string) *User {
	slog.Info(fmt.Sprintf("new user: %s on %s", name, team))
	usr := User{
		ID:    lastID,
		Name:  name,
		Team:  team,
		Score: 0.,
	}
	lastID += 1
	DB.Users = append(DB.Users, usr)
	return &usr
}

type Team struct {
	Name  string
	Color float64 // I guess?
}
