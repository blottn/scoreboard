// Package db provides the common structs and a very primitive DB program
package db

type User struct {
	ID    int
	Name  string
	Team  string // FK team
	Score float64
}

type Team struct {
	Name  string
	Color float64 // I guess?
}
