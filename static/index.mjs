import { getDB, updateDB } from "./util.mjs";
await updateDB();

let { Users, Teams } = await getDB()


// Scoreboard
let scoreBody = document.querySelector("#scores tbody");
let scoreTmpl = document.querySelector("#scores > table > tbody > template");
const makeScoreRow = ({ID, Name, Team, Score}) => {
    const clone = document.importNode(scoreTmpl.content, true);
    clone.firstElementChild.id = ID;
    let name = clone.querySelector(".name");
    name.textContent = Name;
    let team = clone.querySelector(".team");
    team.textContent = Team;
    let score = clone.querySelector(".score");
    score.textContent = Score;
    scoreBody.appendChild(clone);
}

const updateScoreRow = ({ID, Name, Team, Score}) => {
    let el = document.getElementById(ID);
    let name = el.querySelector(".name");
    name.textContent = Name;
    let team = el.querySelector(".team");
    team.textContent = Team;
    let score = el.querySelector(".score");
    score.textContent = Score;
}

// End scoreboard


// Teams
let teamBody = document.querySelector("#teams tbody");
let teamTmpl = document.querySelector("#teams > table > tbody > template");
const makeTeamRow = ({Name, Color}) => {
    const clone = document.importNode(teamTmpl.content, true);
    clone.firstElementChild.id = Name;
    let name = clone.querySelector(".teamName");
    name.textContent = Name;
    let team = clone.querySelector(".teamTotalScore");
    team.textContent = "0"; // TODO calcoolate
    teamBody.appendChild(clone);
}

const updateTeamRow = ({Name, Color}) => {
    let el = document.getElementById(Name);
    let name = el.querySelector(".teamName");
    name.textContent = Name;
    let score = el.querySelector(".teamTotalScore");
    score.textContent = "0"; // TODO calcoolate
}
// End Teams

Users.forEach((user) => {
    console.log(user);
    makeScoreRow(user)
});

Teams.forEach((team) => {
    console.log(team);
    makeTeamRow(team);
});
// Useful for testing
const bumpUserScore = () => {
    let usr = Users[0];
    usr.Score += 1;
    updateScoreRow(usr);
    setTimeout(bumpUserScore, 750)
}
bumpUserScore();
