package main

import (
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
	go func() {
		err := db.Start()
		if err != nil {
			slog.Error(err.Error())
		}
	}()
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
	http.HandleFunc("/claim/{player}", func(w http.ResponseWriter, r *http.Request) {
		toClaim, err := strconv.Atoi(r.PathValue("player"))
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, err.Error())
			slog.Error("failed to claim", "err", err.Error())
			return
		}
		claimer := r.URL.Query().Get("owner")

		claimed := false
		for _, usr := range db.DB.Users {
			if usr.ID == toClaim && usr.Claimer == "" {
				usr.Claimer = claimer
				claimed = true
			}
		}
		if !claimed {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, "tried to claim non existent usr")
			slog.Error("tried to claim non existent usr", "player", toClaim)
			return
		}
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "claimed")
	})
	room := []*websocket.Conn{}

	http.Handle("/ws", &websocket.Server{
		Handler: func(ws *websocket.Conn) {
			room = append(room, ws)

			defer func() {
				for i, conn := range room {
					if conn == ws {
						room = append(room[:i], room[i+1:]...)
						break
					}
				}

				ws.Close()
			}()

			for {
				var msg string

				err := websocket.Message.Receive(ws, &msg)
				if err != nil {
					return
				}

				if msg == "" {
					continue
				}

				slog.Info(
					fmt.Sprintf(
						"websocket message: %s",
						msg,
					),
				)

				for _, conn := range room {
					if conn == ws {
						continue
					}

					err := websocket.Message.Send(
						conn,
						msg,
					)
					if err != nil {
						slog.Info(
							fmt.Sprintf(
								"websocket send error: %s",
								err,
							),
						)
					}
				}
			}
		},
	})
	http.Handle("/", http.FileServer(http.Dir("./static")))

	slog.Info(fmt.Sprintf("listening on %s", *listenAddr))

	// db.AddDevUsers()

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
	slog.Info(fmt.Sprintf("update: %v", update))
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
