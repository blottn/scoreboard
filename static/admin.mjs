import { getDB, updateDB } from "./util.mjs";

let { Users, Teams } = await getDB();

console.log(Users);

let playersTbl = document.querySelector("table");
let playerTmpl = document.querySelector("template#player");
Users.forEach(({ID, Name, Team, Score}) => {
    let frag = document.importNode(playerTmpl.content, true);
    frag.firstElementChild.id = ID;
    let name = frag.querySelector(".name");
    name.textContent = Name;
    let team = frag.querySelector(".team");
    team.textContent = Team;
    let score = frag.querySelector(".score");
    score.textContent = Score;
    playersTbl.appendChild(frag);
});

window.editScore = function(event) {
    console.log(event.srcElement.parentElement);
    if (event.key === "Enter") {
        event.preventDefault();
        event.target.blur();
    }
}

window.saveScore = function(event) {
    updateDB({Users, Teams });
}
