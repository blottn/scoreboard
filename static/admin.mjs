import { getDB, updateDB } from "./util.mjs";

let { Users, Teams } = await getDB();
const updateFromDB = async () => {
    let newdb = await getDB();
    Users = newdb.Users;
    Teams = newdb.Teams;

    setTimeout(updateFromDB, 500)
}
await updateFromDB();


let playersTbl = document.querySelector("table");
let playerTmpl = document.querySelector("template#player");
console.log(playerTmpl);

// Sync ensures the UI makes sense given the current db
function sync() {
    // Add/ update
    Users.forEach(({ID, Name, Team, Score}) => {
        let row = document.querySelector(`tr[id="${ID}"]`);
        console.log(row);
        if (row == null) {
            row = document.importNode(playerTmpl.content, true);
            row = row.firstElementChild;
            row.id = ID;
            playersTbl.appendChild(row);
        }
        console.log(row);
        row.querySelector(".name").textContent = Name;
        row.querySelector(".team").textContent = Team;
        row.querySelector(".score").textContent = Score;
    })
    playersTbl.querySelectorAll("tr").forEach((row) => {
        console.log(row.id);
    });
}

sync();

window.editScore = function(event) {
    console.log(event.srcElement.parentElement);
    if (event.key === "Enter") {
        event.preventDefault();
        event.target.blur();
    }
}

window.saveScore = function(event) {
    console.log(event);
    let id = event.srcElement.parentElement.id
    let newScore = event.srcElement.textContent;
    setPlayerScore(id, newScore);
    updateDB({Users, Teams });
}

function setPlayerScore(playerId, score) {
    let idx = Users.findIndex(({ID}) => `${ID}` === playerId);
    if (idx === undefined) {
        return
    }
    Users[idx].Score = parseInt(score);
    updateDB({Users, Teams});
}
