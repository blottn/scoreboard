import { getDB, sendDB } from "./db.mjs";

let { Users, Teams } = await getDB();

let playersTbl = document.querySelector("table");
let playerTmpl = document.querySelector("template#player");

// Sync ensures the UI makes sense given the current db
function sync() {
    let { Users, Teams} = getDB(); 
    // Add/ update
    Users.forEach(({ID, Name, Team, Score}) => {
        let row = document.querySelector(`tr[id="${ID}"]`);
        if (row == null) {
            row = document.importNode(playerTmpl.content, true);
            row = row.firstElementChild;
            row.id = ID;
            playersTbl.appendChild(row);
        }
        row.querySelector(".name").textContent = Name;
        row.querySelector(".team").textContent = Team;
        row.querySelector(".score").textContent = Score;
    })
    setTimeout(500, sync)
}
sync();

window.editScore = function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        event.target.blur();
    }
}

window.saveScore = function(event) {
    let id = event.srcElement.parentElement.id
    let newScore = event.srcElement.textContent;
    setPlayerScore(id, newScore);
    sendDB({Users, Teams });
}

function setPlayerScore(playerId, score) {
    let { Users, ...db} = getDB();
    let idx = Users.findIndex(({ID}) => `${ID}` === playerId);
    if (idx === undefined) {
        return
    }
    Users[idx].Score = parseInt(score);
    sendDB({Users, ...db});
}
