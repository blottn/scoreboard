// Package leases represents a way for user agents to hold control of a particular player via ping ponging in a websocket
package leases

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"time"

	"github.com/blottn/scoreboard/db"
	"golang.org/x/net/websocket"
)

var LeaseLength = flag.Duration("lease-length", 1*time.Minute, "how long leases are held without a message")

type Lease struct {
	PlayerID int
	Ws       *websocket.Conn
	LastSeen time.Time

	Ctx    context.Context
	Cancel context.CancelFunc
}

func (l Lease) Expire() {
	l.Cancel()
}

func (l Lease) Watch() {
	playerName, ok := db.GetName(l.PlayerID)
	if !ok {
		slog.Error("unknown player id", "player", l.PlayerID)
		return
	}

	go func() {
		<-l.Ctx.Done()
		l.Ws.Close()
	}()

	for {
		var msg string

		err := websocket.Message.Receive(l.Ws, &msg)
		if err != nil {
			return
		}

		l.LastSeen = time.Now()

		slog.Debug("message from player",
			"player", playerName,
			"message", msg,
		)
	}
}

var Leases = []Lease{}

// TakeLease brute force takes control of a player lease
func TakeLease(ctx context.Context, playerId int, ws *websocket.Conn) {
	for _, lease := range Leases {
		if lease.PlayerID == playerId {
			slog.Info(fmt.Sprintf("lease already held: %d, expiring", lease.PlayerID))
			lease.Expire()
		}
	}
	ctx, cancel := context.WithCancel(ctx)
	lease := Lease{
		PlayerID: playerId,
		Ws:       ws,
		LastSeen: time.Now(),

		Ctx:    ctx,
		Cancel: cancel,
	}
	Leases = append(Leases, lease)
	lease.Watch()
}

func CheckExpiries() {
	for _, lease := range Leases {
		if time.Since(lease.LastSeen) > *LeaseLength {
			lease.Expire()
		}
	}
}
