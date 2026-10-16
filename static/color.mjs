import { getDB, onDBUpdate } from "./db.mjs";

const body = document.querySelector("body");

const db = getDB();

const getWinningColor = (db) => {
    if (db.Mode == "player") {
        let max = db.Users[0];
        db.Users.forEach((User) => {
            if (User.Score > max.Score) {
                max = User;
            }
        });
        return max.Color;
    } else {
        
    }
}

const sync = (db) => {
    if (db.Mode == "player") {
        // Get winn
    }
}
