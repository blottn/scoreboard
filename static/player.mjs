// Player.mjs tries to control a #selectPlayer block if available
// It also gives functions for checking the current player

import { getDB, sendDB } from "./db.mjs";

import { agentId } from "./uid.mjs";

let playerSelect = document.querySelector("#selectPlayer");
let playerSelectTmpl = document.querySelector("#playerOption");

async function sync() {
    let { Users, ...db } = await getDB();
    Users.filter(({Claimer}) => Claimer === "").forEach(({ID, Name}) => {
        let player = playerSelect.querySelector(`[id="${ID}"]`);
        if (player == null) {
            player = document.importNode(playerSelectTmpl.content, true);
            player = player.firstElementChild;
            player.id = ID;
            playerSelect.appendChild(player);
        }
        player.querySelector(".name").textContent = Name;
    });
    playerSelect.querySelectorAll(":scope > div").forEach((row) => {
        Users.forEach(({ID, Claimer}) => {
            if (`${ID}` === row.id && Claimer !== "") {
                row.parentElement.removeChild(row);
            }
        })
    });
    setTimeout(sync, 0);
}
sync();

const claimPlayer = async (playerId) => {
    await fetch(`/claim/${playerId}?owner=${agentId}`);
}

window.becomePlayer = function(event) {
    // TODO sometimes this hits the p block instead of the div
    claimPlayer(event.target.id);
    console.log(event.target.id);
}
