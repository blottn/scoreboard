import { onDBUpdate } from "./db.mjs";

const scoreBody = document.querySelector("#scores tbody");
const scoreTmpl = document.querySelector("#scores > table > tbody > template");

const teamBody = document.querySelector("#teams tbody");
const teamTmpl = document.querySelector("#teams > table > tbody > template");

const makeScoreRow = ({ ID, Name, Team, Score }) => {
    const row = document.importNode(
        scoreTmpl.content,
        true
    ).firstElementChild;

    row.id = ID;

    row.querySelector(".name").textContent = Name;
    row.querySelector(".team").textContent = Team;
    row.querySelector(".score").textContent = Score;

    scoreBody.appendChild(row);

    return row;
};

const makeTeamRow = ({ Name, Color }) => {
    const row = document.importNode(
        teamTmpl.content,
        true
    ).firstElementChild;

    row.id = Name;
    row.style.setProperty("--team-color", Color);

    row.querySelector(".teamName").textContent = Name;
    row.querySelector(".teamTotalScore").textContent = "0";

    teamBody.appendChild(row);

    return row;
};

const sync = ({ Users, Teams }) => {
    // Scores
    Users.forEach(({ ID, Name, Team, Score }) => {
        let row = scoreBody.querySelector(`tr[id="${ID}"]`);

        if (row == null) {
            row = makeScoreRow({
                ID,
                Name,
                Team,
                Score
            });
        }

        const name = row.querySelector(".name");
        const teamName = row.querySelector(".team");
        const score = row.querySelector(".score");

        if (name.textContent !== Name) {
            name.textContent = Name;
        }

        if (teamName.textContent !== Team) {
            teamName.textContent = Team;
        }

        if (score.textContent !== `${Score}`) {
            score.textContent = Score;
        }

        const team = Teams.find(({ Name }) => Name === Team);

        if (team != null) {
            row.style.setProperty("--team-color", team.Color);
            row.style.borderLeft = `5px solid ${team.Color}`;
            row.style.backgroundColor =
                `color-mix(in srgb, ${team.Color} 12%, var(--surface))`;
        } else {
            row.style.removeProperty("--team-color");
            row.style.borderLeft = "";
            row.style.backgroundColor = "";
        }
    });

    // Teams
    Teams.forEach(({ Name, Color }) => {
        let row = teamBody.querySelector(`tr[id="${Name}"]`);

        if (row == null) {
            row = makeTeamRow({
                Name,
                Color
            });
        }

        row.style.setProperty("--team-color", Color);

        const teamName = row.querySelector(".teamName");

        if (teamName.textContent !== Name) {
            teamName.textContent = Name;
        }

        const total = Users
            .filter(({ Team }) => Team === Name)
            .reduce(
                (sum, { Score }) => sum + (Number(Score) || 0),
                0
            );

        const totalElement = row.querySelector(".teamTotalScore");

        if (totalElement.textContent !== `${total}`) {
            totalElement.textContent = total;
        }
    });
};

onDBUpdate(sync);
