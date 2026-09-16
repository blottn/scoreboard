package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/blottn/scoreboard/db"
	"github.com/blottn/scoreboard/leases"
	"golang.org/x/net/websocket"
)

func main() {
	flag.Parse()
	err := run()
	if err != nil {
		slog.Error(err.Error())
	}
}

var listenAddr = flag.String("listen-addr", ":5352", "Where the http server listens")

func run() error {
	ctx := context.Background()

	go db.Start()
	go func() {
		for {
			leases.CheckExpiries()
		}
	}()

	http.HandleFunc("/db", func(w http.ResponseWriter, r *http.Request) {
		var err error
		switch r.Method {
		case http.MethodPost:
			err = SetDB(r)
		case http.MethodPut:
			err = UpdateDB(r)
		default:
			err = FetchDB(w)
		}
		if err != nil {
			slog.Error(fmt.Sprintf("http handler: %s", err.Error()))
			w.WriteHeader(500)
			w.Write([]byte("error"))
		}
	})
	http.Handle("/ws", &websocket.Server{
		Handler: func(c *websocket.Conn) {
			defer c.Close()
			req := c.Request()
			player := req.Header.Get("player")
			if player == "" {
				slog.Error("player header was not set")
				return
			}
			playerId, err := strconv.Atoi(player)
			if err != nil {
				slog.Error(fmt.Sprintf("parse playerId: %s", err.Error()))
				return
			}
			leases.TakeLease(ctx, playerId, c)
		},
	})

	http.Handle("/", http.FileServer(http.Dir("./static")))

	slog.Info(fmt.Sprintf("listening on %s", *listenAddr))

	db.AddDevUsers()

	err := http.ListenAndServe(*listenAddr, nil)
	if err != nil {
		return err
	}
	return nil
}

func FetchDB(w http.ResponseWriter) error {
	slog.Info("get DB")
	return json.NewEncoder(w).Encode(db.DB)
}

func UpdateDB(r *http.Request) error {
	slog.Info("update DB")
	update := db.Database{}
	err := json.NewDecoder(r.Body).Decode(&update)
	if err != nil {
		return err
	}
	for _, user := range update.Users {
		for i, dbUser := range db.DB.Users {
			if user.ID == dbUser.ID {
				db.DB.Users[i] = user
				break
			}
		}
	}
	return nil
}

func SetDB(r *http.Request) error {
	slog.Info("set DB")
	data := db.Database{}
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		return err
	}
	db.DB = data
	return nil
}
