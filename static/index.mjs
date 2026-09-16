
const getDB = async () => {
    let resp = await fetch("/db")
    let db = await resp.json();
    console.log(`current db:`,  db);
    return db;
}


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

let { Users } = await getDB()
Users.forEach((user) => {
    console.log(user);
    makeScoreRow(user)
});

// Useful for testing
const bumpUserScore = () => {
    let usr = Users[0];
    usr.Score += 1;
    updateScoreRow(usr);
    setTimeout(bumpUserScore, 750)
}
bumpUserScore();
