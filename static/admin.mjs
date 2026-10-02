import {
    getDB,
    sendDB,
    onDBUpdate
} from "./db.mjs";

const playersTbl = document.querySelector("#players tbody");
const playerTmpl = document.querySelector("#player");

const teamsContainer = document.querySelector("#teams");
const teamTmpl = document.querySelector("#team");

const createTeamForm = document.querySelector("#createTeam");
const newTeamName = document.querySelector("#newTeamName");
const newTeamColor = document.querySelector("#newTeamColor");


/* ==================================================
   Rendering
   ================================================== */

const makeTeamOptions = (
    select,
    teams,
    selectedTeam
) => {
    select.replaceChildren();

    const noTeam = document.createElement("option");

    noTeam.value = "";
    noTeam.textContent = "No team";

    select.appendChild(noTeam);

    teams.forEach(({ Name }) => {
        const option = document.createElement("option");

        option.value = Name;
        option.textContent = Name;

        select.appendChild(option);
    });

    select.value = selectedTeam ?? "";
};

const makePlayerRow = (
    { ID, Name, Team, Score },
    Teams
) => {
    const row = document.importNode(
        playerTmpl.content,
        true
    ).firstElementChild;

    row.id = ID;

    row.querySelector(".name").textContent = Name;

    const teamSelect = row.querySelector(
        ".teamSelect"
    );

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

    row.querySelector(".score").textContent = Score;

    playersTbl.appendChild(row);

    return row;
};

const syncPlayers = (Users, Teams) => {
    Users.forEach(({ ID, Name, Team, Score }) => {
        let row = playersTbl.querySelector(
            `tr[id="${ID}"]`
        );

        if (row == null) {
            row = makePlayerRow(
                {
                    ID,
                    Name,
                    Team,
                    Score
                },
                Teams
            );
        }

        row.querySelector(".name").textContent = Name;

        const teamSelect = row.querySelector(
            ".teamSelect"
        );

        if (document.activeElement !== teamSelect) {
            makeTeamOptions(
                teamSelect,
                Teams,
                Team
            );
        }

        const score = row.querySelector(".score");

        if (document.activeElement !== score) {
            score.textContent = Score;
        }
    });

    playersTbl
        .querySelectorAll(":scope > tr")
        .forEach((row) => {
            const exists = Users.some(
                ({ ID }) => `${ID}` === row.id
            );

            if (!exists) {
                row.remove();
            }
        });
};

const syncTeams = (Teams) => {
    Teams.forEach(({ Name, Color }) => {
        let row = teamsContainer.querySelector(
            `[data-team="${CSS.escape(Name)}"]`
        );

        if (row == null) {
            row = document.importNode(
                teamTmpl.content,
                true
            ).firstElementChild;

            row.dataset.team = Name;

            teamsContainer.appendChild(row);

            const colorInput = row.querySelector(
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

        row.querySelector(".teamName").textContent = Name;

        const colorInput = row.querySelector(
            ".teamColor"
        );

        if (document.activeElement !== colorInput) {
            colorInput.value = Color;
        }
    });

    teamsContainer
        .querySelectorAll(".teamAdmin")
        .forEach((row) => {
            const exists = Teams.some(
                ({ Name }) =>
                    Name === row.dataset.team
            );

            if (!exists) {
                row.remove();
            }
        });
};

const sync = ({ Users, Teams }) => {
    syncPlayers(Users, Teams);
    syncTeams(Teams);
};

onDBUpdate(sync);


/* ==================================================
   Player score management
   ================================================== */

window.editScore = function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.target.blur();
    }
};

window.saveScore = async function(event) {
    const scoreElement = event.currentTarget;
    const id = scoreElement.parentElement.id;
    const text = scoreElement.textContent.trim();

    if (text === "") {
        return;
    }

    const newScore = Number(text);

    if (!Number.isInteger(newScore)) {
        return;
    }

    const db = getDB();

    const idx = db.Users.findIndex(
        ({ ID }) => `${ID}` === id
    );

    if (idx === -1) {
        return;
    }

    const newDB = structuredClone(db);

    newDB.Users[idx].Score = newScore;

    await sendDB(newDB);
};


/* ==================================================
   Player team management
   ================================================== */

const changePlayerTeam = async (
    playerId,
    teamName
) => {
    const db = getDB();

    const idx = db.Users.findIndex(
        ({ ID }) => `${ID}` === `${playerId}`
    );

    if (idx === -1) {
        return;
    }

    const newDB = structuredClone(db);

    newDB.Users[idx].Team = teamName;

    await sendDB(newDB);
};


/* ==================================================
   Team creation
   ================================================== */

createTeamForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const name = newTeamName.value.trim();
        const color = newTeamColor.value;

        if (name === "") {
            return;
        }

        const db = getDB();

        const exists = db.Teams.some(
            ({ Name }) => Name === name
        );

        if (exists) {
            newTeamName.select();
            return;
        }

        const newDB = structuredClone(db);

        newDB.Teams.push({
            Name: name,
            Color: color
        });

        await sendDB(newDB);

        newTeamName.value = "";
        newTeamColor.value = "#ffffff";

        newTeamName.focus();
    }
);


/* ==================================================
   Team color management
   ================================================== */

const changeTeamColor = async (
    teamName,
    color
) => {
    const db = getDB();

    if (db == null || !Array.isArray(db.Teams)) {
        return;
    }

    const idx = db.Teams.findIndex(
        ({ Name }) => Name === teamName
    );

    if (idx === -1) {
        return;
    }

    const newDB = structuredClone(db);

    newDB.Teams[idx].Color = color;

    console.log(
        `Changing team "${teamName}" color to ${color}`
    );

    await sendDB(newDB);
};


/* ==================================================
   Team deletion
   ================================================== */

window.deleteTeam = async function(event) {
    const teamElement =
        event.currentTarget.parentElement;

    const teamName = teamElement.dataset.team;

    if (teamName == null) {
        return;
    }

    const db = getDB();

    const teamExists = db.Teams.some(
        ({ Name }) => Name === teamName
    );

    if (!teamExists) {
        return;
    }

    const newDB = structuredClone(db);

    newDB.Teams = newDB.Teams.filter(
        ({ Name }) => Name !== teamName
    );

    newDB.Users.forEach((user) => {
        if (user.Team === teamName) {
            user.Team = "";
        }
    });

    await sendDB(newDB);
};
