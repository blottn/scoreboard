import { getDB, onDBUpdate } from "./db.mjs";

const body = document.querySelector("body");

const db = getDB();

const getWinningColor = (db) => {
    if (db.Mode == "player") {
        let max = db.Users[0];
        db.Users.forEach((user) => {
            if (user.Score > max.Score) {
                max = user;
            }
        });
        return max.Color;
    } else {
        let max = db.Teams[0];
        db.Teams.forEach((team) => {
            if (team.Score > max.Score) {
                max = team;
            }
        });
        return max.Color;
    }
}

const sync = (db) => {
    body.style.setProperty('--winning-color', getWinningColor(db));
}
sync(db);
onDBUpdate(sync);
