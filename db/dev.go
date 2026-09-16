package db

import (
	"math/rand"
)

func AddDevUsers() {
	teams := []string{
		"pee-nutZ",
		"cash-yous",
	}
	names := []string{
		"nick",
		"kris",
		"ciarán",
		"ellie",
		"katja",
	}
	for _, name := range names {
		team := teams[rand.Intn(len(teams))]
		NewUser(name, team)
	}
}
