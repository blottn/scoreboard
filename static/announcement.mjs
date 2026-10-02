const banner =
    document.querySelector("#winnerBanner");

const bannerText =
    document.querySelector(
        "#winnerBannerText"
    );


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
                message.type === "winner"
            ) {
                showWinner(
                    message.name,
                    message.color
                );
            }
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


/* ==================================================
   Winner banner
   ================================================== */

const showWinner = (
    name,
    color
) => {
    bannerText.textContent =
        `WINNER — ${name}`;

    banner.style.setProperty(
        "--winner-color",
        color || "#ffffff"
    );

    banner.classList.remove(
        "visible"
    );

    // Force the animation to restart
    void banner.offsetWidth;

    banner.classList.add(
        "visible"
    );
};
