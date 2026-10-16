import {
    getDB,
    sendDB,
    onDBUpdate
} from "./db.mjs";

/* ==================================================
   Players
   ================================================== */

const playersTbl =
    document.querySelector("#players tbody");

const playerTmpl =
    document.querySelector("#player");


/* ==================================================
   Teams
   ================================================== */

const teamsContainer =
    document.querySelector("#teams");

const teamTmpl =
    document.querySelector("#team");

const createTeamForm =
    document.querySelector("#createTeam");

const newTeamName =
    document.querySelector("#newTeamName");

const newTeamColor =
    document.querySelector("#newTeamColor");


/* ==================================================
   Control panel
   ================================================== */

const winnerSelect =
    document.querySelector("#winnerSelect");

const announceWinnerButton =
    document.querySelector("#announceWinner");


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

    socket.addEventListener("open", () => {
        console.log("WebSocket connected");
    });

    socket.addEventListener("close", () => {
        console.log(
            "WebSocket disconnected; reconnecting..."
        );

        setTimeout(
            connectWebSocket,
            1000
        );
    });

    socket.addEventListener("error", (error) => {
        console.error(
            "WebSocket error:",
            error
        );
    });
};

connectWebSocket();


const sendAnnouncement = (message) => {
    if (
        socket == null ||
        socket.readyState !== WebSocket.OPEN
    ) {
        console.error(
            "Cannot announce: WebSocket is not connected"
        );

        return;
    }

    socket.send(
        JSON.stringify(message)
    );
};


/* ==================================================
   Player rendering
   ================================================== */

const makeTeamOptions = (
    select,
    teams,
    selectedTeam
) => {
    select.replaceChildren();

    const noTeam =
        document.createElement("option");

    noTeam.value = "";
    noTeam.textContent = "No team";

    select.appendChild(noTeam);

    teams.forEach(({ Name }) => {
        const option =
            document.createElement("option");

        option.value = Name;
        option.textContent = Name;

        select.appendChild(option);
    });

    select.value =
        selectedTeam ?? "";
};


const makePlayerRow = (
    { ID, Name, Team, Color, Score },
    Teams
) => {
    const row =
        document.importNode(
            playerTmpl.content,
            true
        ).firstElementChild;

    row.id = ID;

    row.querySelector(
        ".name"
    ).textContent = Name;

    const teamSelect =
        row.querySelector(".teamSelect");

    makeTeamOptions(
        teamSelect,
        Teams,
        Team
    );

    teamSelect.addEventListener(
        "change",
        () => {
            changePlayerTeam(
                ID,
                teamSelect.value
            );
        }
    );

    let colPick = row.querySelector(".playerColPicker input");
    if (document.activeElement !== colPick) {
        colPick.value = Color;
    }

    row.querySelector(
        ".score"
    ).textContent = Score;

    playersTbl.appendChild(row);

    return row;
};


const syncPlayers = (
    Users,
    Teams
) => {
    Users.forEach(
        ({ ID, Name, Team, Color, Score }) => {
            let row =
                playersTbl.querySelector(
                    `tr[id="${ID}"]`
                );

            if (row == null) {
                row = makePlayerRow(
                    {
                        ID,
                        Name,
                        Team,
                        Color,
                        Score
                    },
                    Teams
                );
            }

            const nameEl = row.querySelector(
                ".name"
            )
            if (document.activeElement !== nameEl) {
                nameEl.textContent = Name;
            }

            const teamSelect =
                row.querySelector(
                    ".teamSelect"
                );

            /*
             * Don't touch an actively-used select.
             */
            if (
                document.activeElement !==
                teamSelect
            ) {
                makeTeamOptions(
                    teamSelect,
                    Teams,
                    Team
                );
            }

            const score =
                row.querySelector(".score");

            /*
             * Don't overwrite text while the
             * administrator is editing it.
             */
            if (
                document.activeElement !==
                score
            ) {
                score.textContent = Score;
            }
        }
    );

    playersTbl
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
   Team rendering
   ================================================== */

const syncTeams = (Teams) => {
    Teams.forEach(
        ({ Name, Color }) => {
            let row =
                teamsContainer.querySelector(
                    `[data-team="${CSS.escape(Name)}"]`
                );

            if (row == null) {
                row =
                    document.importNode(
                        teamTmpl.content,
                        true
                    ).firstElementChild;

                row.dataset.team = Name;

                teamsContainer.appendChild(
                    row
                );

                const colorInput =
                    row.querySelector(
                        ".teamColor"
                    );

                colorInput.addEventListener(
                    "change",
                    async () => {
                        await changeTeamColor(
                            Name,
                            colorInput.value
                        );
                    }
                );
            }

            row.querySelector(
                ".teamName"
            ).textContent = Name;

            const colorInput =
                row.querySelector(
                    ".teamColor"
                );

            /*
             * Don't overwrite a color picker while
             * the user is interacting with it.
             */
            if (
                document.activeElement !==
                colorInput
            ) {
                colorInput.value = Color;
            }
        }
    );

    teamsContainer
        .querySelectorAll(".teamAdmin")
        .forEach((row) => {
            const exists =
                Teams.some(
                    ({ Name }) =>
                        Name === row.dataset.team
                );

            if (!exists) {
                row.remove();
            }
        });
};


/* ==================================================
   Winner selector
   ================================================== */

/*
 * This changes only when the actual available
 * winners change.
 *
 * A score update therefore does NOT rebuild the
 * select and interrupt the user's interaction.
 */
let winnerOptionsKey = "";


const getWinnerOptionsKey = (
    Users,
    Teams
) => {
    const players =
        Users.map(
            ({ ID, Name }) =>
                `player:${ID}:${Name}`
        );

    const teams =
        Teams.map(
            ({ Name }) =>
                `team:${Name}`
        );

    return [
        ...players,
        ...teams
    ].join("|");
};


const syncWinnerSelector = (
    Users,
    Teams
) => {
    const newKey =
        getWinnerOptionsKey(
            Users,
            Teams
        );

    /*
     * Nothing about the available options
     * changed, so leave the select completely
     * untouched.
     */
    if (newKey === winnerOptionsKey) {
        return;
    }

    winnerOptionsKey = newKey;

    const currentValue =
        winnerSelect.value;

    winnerSelect.replaceChildren();


    const placeholder =
        document.createElement("option");

    placeholder.value = "";
    placeholder.textContent =
        "Select a winner";

    winnerSelect.appendChild(
        placeholder
    );


    /*
     * Players
     */

    if (Users.length > 0) {
        const playersGroup =
            document.createElement(
                "optgroup"
            );

        playersGroup.label =
            "Players";

        Users.forEach(
            ({ ID, Name }) => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    `player:${ID}`;

                option.textContent =
                    Name;

                playersGroup.appendChild(
                    option
                );
            }
        );

        winnerSelect.appendChild(
            playersGroup
        );
    }


    /*
     * Teams
     */

    if (Teams.length > 0) {
        const teamsGroup =
            document.createElement(
                "optgroup"
            );

        teamsGroup.label =
            "Teams";

        Teams.forEach(
            ({ Name }) => {
                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    `team:${Name}`;

                option.textContent =
                    Name;

                teamsGroup.appendChild(
                    option
                );
            }
        );

        winnerSelect.appendChild(
            teamsGroup
        );
    }


    /*
     * Restore the previous selection if the
     * selected winner still exists.
     */
    const stillExists =
        Array.from(
            winnerSelect.options
        ).some(
            ({ value }) =>
                value === currentValue
        );

    if (stillExists) {
        winnerSelect.value =
            currentValue;
    }
};


/* ==================================================
   DB synchronization
   ================================================== */

const sync = ({
    Users,
    Teams
}) => {
    syncPlayers(
        Users,
        Teams
    );

    syncTeams(
        Teams
    );

    syncWinnerSelector(
        Users,
        Teams
    );
};

onDBUpdate(sync);


/* ==================================================
   Score editing
   ================================================== */

window.editScore = function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.target.blur();
    }
};

window.saveScore = async function(event) {
    const scoreElement =
        event.currentTarget;

    const id =
        scoreElement.parentElement.id;

    const text =
        scoreElement.textContent.trim();

    if (text === "") {
        return;
    }

    const newScore =
        Number(text);

    if (!Number.isInteger(newScore)) {
        return;
    }

    const db = getDB();

    const idx =
        db.Users.findIndex(
            ({ ID }) =>
                `${ID}` === id
        );

    if (idx === -1) {
        return;
    }

    const newDB =
        structuredClone(db);

    newDB.Users[idx].Score =
        newScore;

    await sendDB(newDB);
};

/* ==================================================
   Name editing
   ================================================== */

window.editName = function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.target.blur();
    }
};

window.saveName = async function(event) {
    const nameElement =
        event.currentTarget;

    const id =
        nameElement.parentElement.id;

    const text =
        nameElement.textContent.trim();

    if (text === "") {
        return;
    }

    const db = getDB();

    const idx =
        db.Users.findIndex(
            ({ ID }) =>
                `${ID}` === id
        );

    if (idx === -1) {
        return;
    }

    const newDB =
        structuredClone(db);

    newDB.Users[idx].Name =
        text;

    await sendDB(newDB);
};



/* ==================================================
   Player team editing
   ================================================== */

const changePlayerTeam = async (
    playerId,
    teamName
) => {
    const db = getDB();

    const idx =
        db.Users.findIndex(
            ({ ID }) =>
                `${ID}` ===
                `${playerId}`
        );

    if (idx === -1) {
        return;
    }

    const newDB =
        structuredClone(db);

    newDB.Users[idx].Team =
        teamName;

    await sendDB(newDB);
};


/* ==================================================
   Team creation
   ================================================== */

createTeamForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const name =
            newTeamName.value.trim();

        const color =
            newTeamColor.value;

        if (name === "") {
            return;
        }

        const db = getDB();

        const exists =
            db.Teams.some(
                ({ Name }) =>
                    Name === name
            );

        if (exists) {
            newTeamName.select();
            return;
        }

        const newDB =
            structuredClone(db);

        newDB.Teams.push({
            Name: name,
            Color: color
        });

        await sendDB(newDB);

        newTeamName.value = "";
        newTeamColor.value =
            "#ffffff";

        newTeamName.focus();
    }
);


/* ==================================================
   Team color editing
   ================================================== */

const changeTeamColor = async (
    teamName,
    color
) => {
    const db = getDB();

    if (
        db == null ||
        !Array.isArray(db.Teams)
    ) {
        return;
    }

    const idx =
        db.Teams.findIndex(
            ({ Name }) =>
                Name === teamName
        );

    if (idx === -1) {
        return;
    }

    const newDB =
        structuredClone(db);

    newDB.Teams[idx].Color =
        color;

    await sendDB(newDB);
};



/* ==================================================
   Team deletion
   ================================================== */

window.deleteTeam = async function(event) {
    const teamElement =
        event.currentTarget.parentElement;

    const teamName =
        teamElement.dataset.team;

    if (teamName == null) {
        return;
    }

    const db = getDB();

    const exists =
        db.Teams.some(
            ({ Name }) =>
                Name === teamName
        );

    if (!exists) {
        return;
    }

    const newDB =
        structuredClone(db);

    newDB.Teams =
        newDB.Teams.filter(
            ({ Name }) =>
                Name !== teamName
        );

    /*
     * Players belonging to a deleted team are
     * moved to no team.
     */
    newDB.Users.forEach(
        (user) => {
            if (
                user.Team === teamName
            ) {
                user.Team = "";
            }
        }
    );

    await sendDB(newDB);
};


/* ==================================================
   Winner announcement
   ================================================== */

announceWinnerButton.addEventListener(
    "click",
    () => {
        const value =
            winnerSelect.value;

        if (value === "") {
            return;
        }

        const db = getDB();

        let winnerName = "";
        let winnerColor =
            "#ffffff";


        /*
         * Player winner
         */

        if (
            value.startsWith(
                "player:"
            )
        ) {
            const playerId =
                value.substring(
                    "player:".length
                );

            const player =
                db.Users.find(
                    ({ ID }) =>
                        `${ID}` ===
                        playerId
                );

            if (player == null) {
                return;
            }

            winnerName =
                player.Name;

            /*
             * A player's winner banner uses
             * their team's color.
             */
            
            const team =
                db.Teams.find(
                    ({ Name }) =>
                        Name ===
                        player.Team
                );

            if (team != null) {
                winnerColor =
                    team.Color;
            }
        }


        /*
         * Team winner
         */

        if (
            value.startsWith(
                "team:"
            )
        ) {
            const teamName =
                value.substring(
                    "team:".length
                );

            const team =
                db.Teams.find(
                    ({ Name }) =>
                        Name ===
                        teamName
                );

            if (team == null) {
                return;
            }

            winnerName =
                team.Name;

            winnerColor =
                team.Color;
        }


        if (db.Mode === "player" && value.startsWith("player:")) {
            let pid = value.split(':')[1]
            console.log(pid);
            winnerColor = db.Users.filter(({ID}) => `${ID}` === pid)[0].Color;
        }


        if (winnerName === "") {
            return;
        }

        sendAnnouncement({
            type: "winner",
            name: winnerName,
            color: winnerColor
        });
    }
);

window.deletePlayer = async function(event) {
    let player_id = event.target.parentElement.id;
    const db = getDB();
    let trimmed = db.Users.filter(({ID}) => `${ID}` !== player_id);

    db.Users = trimmed;
    await sendDB(db);
}

window.setPlayerColor = async function(event) {
    let player_id = event.target.parentElement.parentElement.id;
    const db = getDB();
    db.Users = db.Users.map((User) => {
        if (`${User.ID}` === player_id) {
            User.Color = event.target.value;
        }
        return User;
    });

    await sendDB(db);
}

