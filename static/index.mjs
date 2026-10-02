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

            /*
             * Store the player's team color on the row.
             *
             * The CSS uses this value to give the player
             * row a subtle tint matching their team.
             */
            const team =
                getDB()?.Teams?.find(
                    ({ Name: teamName }) =>
                        teamName === Team
                );

            row.style.setProperty(
                "--team-color",
                team?.Color || "#ffffff"
            );

            row.classList.toggle(
                "has-team",
                Boolean(Team)
            );
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
   DB synchronization
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
    document.querySelector(
        "#winnerBanner"
    );

const winnerName =
    document.querySelector(
        "#winnerBanner .winnerName"
    );

const winnerTimerBar =
    document.querySelector(
        "#winnerBanner .winnerTimerBar"
    );

const WINNER_DURATION =
    30 * 1000;

let winnerTimeout = null;
let winnerAnimation = null;


/* --------------------------------------------------
   Stop timer
   -------------------------------------------------- */

const stopWinnerTimer = () => {
    if (winnerTimeout !== null) {
        clearTimeout(
            winnerTimeout
        );

        winnerTimeout = null;
    }

    if (winnerAnimation !== null) {
        cancelAnimationFrame(
            winnerAnimation
        );

        winnerAnimation = null;
    }
};


/* --------------------------------------------------
   Hide banner
   -------------------------------------------------- */

const hideWinnerBanner = () => {
    stopWinnerTimer();

    if (winnerBanner == null) {
        return;
    }

    winnerBanner.classList.remove(
        "visible"
    );

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


/* --------------------------------------------------
   Timer
   -------------------------------------------------- */

const startWinnerTimer = () => {
    const startedAt =
        performance.now();

    const update = (now) => {
        const elapsed =
            now - startedAt;

        const progress =
            Math.min(
                elapsed /
                    WINNER_DURATION,
                1
            );

        /*
         * The bar starts full and drains
         * towards the centre.
         */
        const remaining =
            1 - progress;

        if (winnerTimerBar != null) {
            winnerTimerBar.style.transform =
                `scaleX(${remaining})`;
        }

        if (progress < 1) {
            winnerAnimation =
                requestAnimationFrame(
                    update
                );
        } else {
            winnerAnimation = null;
        }
    };

    winnerAnimation =
        requestAnimationFrame(
            update
        );

    winnerTimeout =
        setTimeout(
            hideWinnerBanner,
            WINNER_DURATION
        );
};


/* --------------------------------------------------
   Show banner
   -------------------------------------------------- */

const showWinnerBanner = (
    name,
    color
) => {
    if (winnerBanner == null) {
        return;
    }

    stopWinnerTimer();

    if (winnerName != null) {
        winnerName.textContent =
            name;
    }

    winnerBanner.style.setProperty(
        "--winner-color",
        color || "#ffffff"
    );

    if (winnerTimerBar != null) {
        winnerTimerBar.style.transform =
            "scaleX(1)";
    }

    winnerBanner.hidden = false;

    requestAnimationFrame(() => {
        winnerBanner.classList.add(
            "visible"
        );
    });

    startWinnerTimer();
};


/* --------------------------------------------------
   Winner announcement event
   --------------------------------------------------

   announcement.mjs owns the WebSocket connection.

   It dispatches "winnerAnnouncement" when the
   server announces a winner.

   Keeping the WebSocket in one module prevents
   every scoreboard page from opening two separate
   connections.
   */

window.addEventListener(
    "winnerAnnouncement",
    (event) => {
        const {
            name,
            color
        } = event.detail ?? {};

        if (typeof name !== "string") {
            return;
        }

        showWinnerBanner(
            name,
            color
        );
    }
);


/* --------------------------------------------------
   Dismiss when clicking outside
   -------------------------------------------------- */

document.addEventListener(
    "click",
    (event) => {
        if (
            winnerBanner == null ||
            winnerBanner.hidden ||
            !winnerBanner.classList.contains(
                "visible"
            )
        ) {
            return;
        }

        if (
            !winnerBanner.contains(
                event.target
            )
        ) {
            hideWinnerBanner();
        }
    }
);


/* --------------------------------------------------
   Dismiss when clicking banner
   -------------------------------------------------- */

if (winnerBanner != null) {
    winnerBanner.addEventListener(
        "click",
        () => {
            hideWinnerBanner();
        }
    );
};
