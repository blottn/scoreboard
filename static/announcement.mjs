/* ==================================================
   WebSocket
   ================================================== */

let socket = null;

const connectWebSocket = () => {
    const protocol =
        location.protocol === "https:"
            ? "wss:"
            : "ws:";

    socket = new WebSocket(
        `${protocol}//${location.host}/ws`
    );

    socket.addEventListener(
        "open",
        () => {
            console.log(
                "Announcement WebSocket connected"
            );
        }
    );

    socket.addEventListener(
        "message",
        (event) => {
            let message;

            try {
                message =
                    JSON.parse(event.data);
            } catch {
                console.warn(
                    "Ignoring invalid WebSocket message:",
                    event.data
                );

                return;
            }

            if (
                message.type !== "winner"
            ) {
                return;
            }

            /*
             * index.mjs owns the banner itself,
             * including the timer and dismissal.
             */
            window.dispatchEvent(
                new CustomEvent(
                    "winnerAnnouncement",
                    {
                        detail: {
                            name: message.name,
                            color: message.color
                        }
                    }
                )
            );
        }
    );

    socket.addEventListener(
        "close",
        () => {
            console.log(
                "Announcement WebSocket disconnected"
            );

            setTimeout(
                connectWebSocket,
                1000
            );
        }
    );

    socket.addEventListener(
        "error",
        (error) => {
            console.error(
                "Announcement WebSocket error:",
                error
            );
        }
    );
};


connectWebSocket();

