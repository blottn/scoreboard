import { getDB, onDBUpdate } from "./db.mjs";
import { agentId } from "./uid.mjs";

const playerSelect = document.querySelector("#selectPlayer");
const playerSelectTmpl = document.querySelector("#playerOption");

const sync = ({ Users }) => {
    const currentPlayer = Users.find(
        ({ Claimer }) => Claimer === agentId
    );

    const hasPlayer = currentPlayer != null;

    // Disable player selection if this browser already has a player.
    playerSelect.classList.toggle("disabled", hasPlayer);

    // Only show players that are currently unclaimed.
    Users
        .filter(({ Claimer }) => Claimer === "")
        .forEach(({ ID, Name }) => {
            let player = playerSelect.querySelector(
                `[id="${ID}"]`
            );

            if (player == null) {
                player = document.importNode(
                    playerSelectTmpl.content,
                    true
                ).firstElementChild;

                player.id = ID;
                playerSelect.appendChild(player);
            }

            player.querySelector(".name").textContent = Name;
        });

    // Remove players that are no longer available.
    playerSelect
        .querySelectorAll(":scope > div")
        .forEach((row) => {
            const user = Users.find(
                ({ ID }) => `${ID}` === row.id
            );

            if (user == null || user.Claimer !== "") {
                row.remove();
            }
        });
};

onDBUpdate(sync);

const claimPlayer = async (playerId) => {
    const db = getDB();

    const currentPlayer = db.Users.find(
        ({ Claimer }) => Claimer === agentId
    );

    // This browser already has a player.
    if (currentPlayer != null) {
        return;
    }

    const player = db.Users.find(
        ({ ID }) => `${ID}` === `${playerId}`
    );

    // Player doesn't exist or is already claimed.
    if (player == null || player.Claimer !== "") {
        return;
    }

    await fetch(`/claim/${playerId}?owner=${agentId}`);
};

window.becomePlayer = async function(event) {
    const db = getDB();

    const currentPlayer = db.Users.find(
        ({ Claimer }) => Claimer === agentId
    );

    // Don't allow selecting another player.
    if (currentPlayer != null) {
        return;
    }

    const playerId = event.currentTarget.id;

    await claimPlayer(playerId);
};
