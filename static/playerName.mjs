import { getDB, sendDB, onDBUpdate } from "./db.mjs";
import { agentId } from "./uid.mjs";

const playerName = document.querySelector("#playerName");
const playerNameLabel = document.querySelector("#playerNameLabel");
const playerNameInput = document.querySelector("#playerNameInput");

let currentPlayer = null;

const sync = ({ Users }) => {
    currentPlayer = Users.find(
        ({ Claimer }) => Claimer === agentId
    );

    if (currentPlayer == null) {
        playerName.classList.remove("has-player");

        playerNameLabel.textContent = "No player selected";
        playerNameInput.value = "";

        return;
    }

    playerName.classList.add("has-player");

    if (document.activeElement !== playerNameInput) {
        playerNameLabel.textContent = currentPlayer.Name;
        playerNameInput.value = currentPlayer.Name;
    }
};

onDBUpdate(sync);

const startEditing = () => {
    if (currentPlayer == null) {
        return;
    }

    playerNameLabel.hidden = true;
    playerNameInput.hidden = false;

    playerNameInput.value = currentPlayer.Name;

    playerNameInput.focus();
    playerNameInput.select();
};

const stopEditing = () => {
    playerNameLabel.hidden = false;
    playerNameInput.hidden = true;
};

const saveName = async () => {
    if (currentPlayer == null) {
        stopEditing();
        return;
    }

    const name = playerNameInput.value.trim();

    if (name === "") {
        playerNameInput.value = currentPlayer.Name;
        stopEditing();
        return;
    }

    if (name === currentPlayer.Name) {
        stopEditing();
        return;
    }

    const db = getDB();

    const idx = db.Users.findIndex(
        ({ ID }) => `${ID}` === `${currentPlayer.ID}`
    );

    if (idx === -1) {
        stopEditing();
        return;
    }

    const newDB = structuredClone(db);

    newDB.Users[idx].Name = name;

    stopEditing();

    await sendDB(newDB);
};

playerNameLabel.addEventListener("click", startEditing);

playerNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        playerNameInput.blur();
    }

    if (event.key === "Escape") {
        event.preventDefault();

        if (currentPlayer != null) {
            playerNameInput.value = currentPlayer.Name;
        }

        stopEditing();
    }
});

playerNameInput.addEventListener("blur", saveName);
