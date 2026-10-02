import { getDB, sendDB, onDBUpdate } from "./db.mjs";

const playersTbl = document.querySelector("table");
const playerTmpl = document.querySelector("template#player");

const sync = ({ Users }) => {
    Users.forEach(({ ID, Name, Team, Score }) => {
        let row = playersTbl.querySelector(`tr[id="${ID}"]`);

        if (row == null) {
            row = document.importNode(
                playerTmpl.content,
                true
            ).firstElementChild;

            row.id = ID;
            playersTbl.appendChild(row);
        }

        row.querySelector(".name").textContent = Name;
        row.querySelector(".team").textContent = Team;

        const score = row.querySelector(".score");

        // Don't overwrite the value while the admin is editing it.
        if (document.activeElement !== score) {
            score.textContent = Score;
        }
    });
};

onDBUpdate(sync);

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
