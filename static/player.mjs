// Player.mjs tries to control a #selectPlayer block if available
// It also gives functions for checking the current player

import { getDB, sendDB } from "./db.mjs";

let playerSelect = document.querySelector("#selectPlayer");
let playerSelectTmpl = document.querySelector("#playerOption");

async function sync() {
    let { Users, ...db } = await getDB();
    Users.filter(({Free}) => Free).forEach(({ID, Name, Free}) => {
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
        Users.forEach(({ID, Free}) => {
            if (`${ID}` === row.id && Free == false) {
                row.parentElement.removeChild(row);
            }
        })
    });
    setTimeout(sync, 0);
}
sync();


const takeLease = (id) => {
    let ws = new WebSocket(`/ws/${id}`);
    ws.addEventListener("connect", () => {
    const tick = () => {
            ws.send(`tick: ${id}`)
            setTimeout(tick, 100);
        }
        tick();
    });
}

window.becomePlayer = function(event) {
    // TODO sometimes this hits the p block instead of the div
    takeLease(event.target.id);
    console.log(event.target.id);
}
