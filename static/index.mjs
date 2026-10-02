import {
    getDB,
    onDBUpdate
} from "./db.mjs";


/* ==================================================
   Scoreboard
   ================================================== */

const scoreBody =
    document.querySelector("#scores tbody");

const scoreTmpl =
    document.querySelector(
        "#scores > table > tbody > template"
    );


const makeScoreRow = ({
    ID,
    Name,
    Team,
    Score
}) => {
    const clone =
        document.importNode(
            scoreTmpl.content,
            true
        );

    const row =
        clone.firstElementChild;

    row.id = ID;

    row.querySelector(
        ".name"
    ).textContent = Name;

    row.querySelector(
        ".team"
    ).textContent = Team;

    row.querySelector(
        ".score"
    ).textContent = Score;

    scoreBody.appendChild(row);
};


/* ==================================================
   Teams
   ================================================== */

const teamBody =
    document.querySelector("#teams tbody");

const teamTmpl =
    document.querySelector(
        "#teams > table > tbody > template"
    );


const makeTeamRow = ({
    Name,
    Color
}) => {
    const clone =
        document.importNode(
            teamTmpl.content,
            true
        );

    const row =
        clone.firstElementChild;

    row.id = Name;

    row.querySelector(
        ".teamName"
    ).textContent = Name;

    row.querySelector(
        ".teamTotalScore"
    ).textContent = "0";

    row.style.setProperty(
        "--team-color",
        Color || "#ffffff"
    );

    teamBody.appendChild(row);
};


/* ==================================================
   Scoreboard sync
   ================================================== */

const syncScores = (Users) => {
    Users.forEach(
        ({
            ID,
            Name,
            Team,
            Score
        }) => {
            let row =
                scoreBody.querySelector(
                    `tr[id="${CSS.escape(String(ID))}"]`
                );

            if (row == null) {
                makeScoreRow({
                    ID,
                    Name,
                    Team,
                    Score
                });

                row =
                    scoreBody.querySelector(
                        `tr[id="${CSS.escape(String(ID))}"]`
                    );
            }

            row.querySelector(
                ".name"
            ).textContent = Name;

            row.querySelector(
                ".team"
            ).textContent = Team;

            row.querySelector(
                ".score"
            ).textContent = Score;
        }
    );

    scoreBody
        .querySelectorAll(":scope > tr")
        .forEach((row) => {
            const exists =
                Users.some(
                    ({ ID }) =>
                        `${ID}` === row.id
                );

            if (!exists) {
                row.remove();
            }
        });
};


/* ==================================================
   Team sync
   ================================================== */

const syncTeams = (
    Users,
    Teams
) => {
    Teams.forEach(
        ({
            Name,
            Color
        }) => {
            let row =
                teamBody.querySelector(
                    `tr[id="${CSS.escape(Name)}"]`
                );

            if (row == null) {
                makeTeamRow({
                    Name,
                    Color
                });

                row =
                    teamBody.querySelector(
                        `tr[id="${CSS.escape(Name)}"]`
                    );
            }

            row.querySelector(
                ".teamName"
            ).textContent = Name;

            row.style.setProperty(
                "--team-color",
                Color || "#ffffff"
            );

            const total =
                Users
                    .filter(
                        ({ Team }) =>
                            Team === Name
                    )
                    .reduce(
                        (
                            sum,
                            { Score }
                        ) =>
                            sum +
                            (
                                Number(Score) ||
                                0
                            ),
                        0
                    );

            row.querySelector(
                ".teamTotalScore"
            ).textContent = total;
        }
    );

    teamBody
        .querySelectorAll(":scope > tr")
        .forEach((row) => {
            const exists =
                Teams.some(
                    ({ Name }) =>
                        Name === row.id
                );

            if (!exists) {
                row.remove();
            }
        });
};


/* ==================================================
   DB sync
   ================================================== */

const sync = ({
    Users,
    Teams
}) => {
    syncScores(Users);

    syncTeams(
        Users,
        Teams
    );
};

onDBUpdate(sync);


/* ==================================================
   Winner banner
   ================================================== */

const winnerBanner =
    document.querySelector("#winnerBanner");

let winnerTimeout = null;


const hideWinnerBanner = () => {
    if (winnerTimeout !== null) {
        clearTimeout(
            winnerTimeout
        );

        winnerTimeout = null;
    }

    if (winnerBanner == null) {
        return;
    }

    winnerBanner.classList.remove(
        "visible"
    );

    /*
     * Remove the banner from the layout after
     * the transition has finished.
     */
    setTimeout(() => {
        if (
            !winnerBanner.classList.contains(
                "visible"
            )
        ) {
            winnerBanner.hidden = true;
        }
    }, 300);
};


const showWinnerBanner = (
    name,
    color
) => {
    if (winnerBanner == null) {
        return;
    }

    /*
     * If another winner is currently displayed,
     * cancel its existing timer.
     */
    if (winnerTimeout !== null) {
        clearTimeout(
            winnerTimeout
        );
    }

    winnerBanner.textContent = name;

    winnerBanner.style.setProperty(
        "--winner-color",
        color || "#ffffff"
    );

    winnerBanner.hidden = false;

    /*
     * Force the browser to notice the hidden ->
     * visible transition.
     */
    requestAnimationFrame(() => {
        winnerBanner.classList.add(
            "visible"
        );
    });

    /*
     * Automatically hide after one minute.
     */
    winnerTimeout = setTimeout(
        () => {
            hideWinnerBanner();
        },
        60 * 1000
    );
};


/*
 * Clicking the banner dismisses it immediately.
 */
if (winnerBanner != null) {
    winnerBanner.addEventListener(
        "click",
        hideWinnerBanner
    );
}


/* ==================================================
   WebSocket
   ================================================== */

let socket = null;


const connectWebSocket = () => {
    const protocol =
        location.protocol === "https:"
            ? "wss:"
            : "ws:";

    socket =
        new WebSocket(
            `${protocol}//${location.host}/ws`
        );

    socket.addEventListener(
        "open",
        () => {
            console.log(
                "WebSocket connected"
            );
        }
    );

    socket.addEventListener(
        "message",
        (event) => {
            let message;

            try {
                message =
                    JSON.parse(
                        event.data
                    );
            } catch (error) {
                console.error(
                    "Invalid WebSocket message:",
                    event.data
                );

                return;
            }

            if (
                message.type === "winner"
            ) {
                showWinnerBanner(
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
                "WebSocket disconnected; reconnecting..."
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
                "WebSocket error:",
                error
            );
        }
    );
};


connectWebSocket();


