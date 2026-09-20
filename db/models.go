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
	NewTeam(team, "yellow")
	return &usr
}

type Team struct {
	Name  string
	Color string // I guess?
}

func NewTeam(name string, color string) *Team {
	slog.Info(fmt.Sprintf("attempting to create team: %s", name))
	var found *Team
	for _, team := range DB.Teams {
		if team.Name == name {
			slog.Info("found existing team, updating to match request")
			team.Color = color
			found = &team
		}
	}
	if found != nil {
		return found
	}
	t := Team{
		name, color,
	}
	slog.Info(fmt.Sprintf("created team: %s", name))
	DB.Teams = append(DB.Teams, t)
	return &t
}
