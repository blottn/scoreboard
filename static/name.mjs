import {
    getDB,
    sendDB,
    onDBUpdate
} from "./db.mjs";

import {
    agentId
} from "./uid.mjs";


const playerName =
    document.querySelector(
        "#myPlayerName"
    );

const nameInput =
    document.querySelector(
        "#playerNameInput"
    );


let currentPlayer = null;


/* ==================================================
   Find our player
   ================================================== */

const findMyPlayer = (Users) => {
    return Users.find(
        ({ Claimer }) =>
            `${Claimer}` === `${agentId}`
    ) ?? null;
};


/* ==================================================
   Render
   ================================================== */

const sync = ({
    Users
}) => {
    const player =
        findMyPlayer(Users);

    currentPlayer = player;

    if (player == null) {
        playerName.textContent =
            "No player selected";

        playerName.hidden = false;
        nameInput.hidden = true;

        return;
    }

    /*
     * Don't overwrite the input while
     * the player is editing their name.
     */
    if (
        document.activeElement !==
        nameInput
    ) {
        playerName.textContent =
            player.Name;

        nameInput.value =
            player.Name;
    }
};


/* ==================================================
   Start editing
   ================================================== */

playerName.addEventListener(
    "click",
    () => {
        if (currentPlayer == null) {
            return;
        }

        nameInput.value =
            currentPlayer.Name;

        playerName.hidden = true;
        nameInput.hidden = false;

        nameInput.focus();
        nameInput.select();
    }
);


/* ==================================================
   Stop editing
   ================================================== */

const stopEditing = () => {
    nameInput.hidden = true;
    playerName.hidden = false;
};


/* ==================================================
   Save
   ================================================== */

const saveName = async () => {
    if (currentPlayer == null) {
        stopEditing();
        return;
    }

    const newName =
        nameInput.value.trim();

    /*
     * Empty names are not allowed.
     */
    if (newName === "") {
        nameInput.value =
            currentPlayer.Name;

        stopEditing();

        return;
    }

    /*
     * Nothing changed.
     */
    if (
        newName ===
        currentPlayer.Name
    ) {
        stopEditing();

        return;
    }

    const db = getDB();

    const idx =
        db.Users.findIndex(
            ({ ID }) =>
                `${ID}` ===
                `${currentPlayer.ID}`
        );

    if (idx === -1) {
        stopEditing();

        return;
    }

    const newDB =
        structuredClone(db);

    newDB.Users[idx].Name =
        newName;

    /*
     * Update the visible name immediately.
     */
    playerName.textContent =
        newName;

    stopEditing();

    await sendDB(newDB);
};


/* ==================================================
   Keyboard
   ================================================== */

nameInput.addEventListener(
    "keydown",
    (event) => {
        if (event.key === "Enter") {
            event.preventDefault();

            nameInput.blur();

            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();

            if (currentPlayer != null) {
                nameInput.value =
                    currentPlayer.Name;
            }

            stopEditing();
        }
    }
);


/* ==================================================
   Blur
   ================================================== */

nameInput.addEventListener(
    "blur",
    saveName
);


/* ==================================================
   DB updates
   ================================================== */

onDBUpdate(sync);
