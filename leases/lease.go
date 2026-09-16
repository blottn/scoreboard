// Package leases represents a way for user agents to hold control of a particular player via ping ponging in a websocket
package leases

import (
	"context"
	"flag"
	"fmt"
	"io"
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
		slog.Error(fmt.Sprintf("unknown player id: %d", l.PlayerID))
		return
	}
	for {
		select { // Check fi we are done
		case <-l.Ctx.Done():
		default:
		}
		bs, err := io.ReadAll(l.Ws)
		if err != nil {
			slog.Error(fmt.Sprintf("error reading from ws: %s", err.Error()), "player", playerName)
			return
		}
		msg := string(bs)
		slog.Debug(fmt.Sprintf("message from player %s", msg), "player", playerName)
		l.LastSeen = time.Now()
	}
}

var Leases = []Lease{}

func TakeLease(ctx context.Context, playerId int, ws *websocket.Conn) {
	for _, lease := range Leases {
		if lease.PlayerID == playerId {
			slog.Info(fmt.Sprintf("lease already held: %d", lease.PlayerID))
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
