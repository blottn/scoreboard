import { getDB, sendDB, onDBUpdate }  from "./db.mjs";

let gameModeBlock = document.getElementById("gameMode");
let body = document.querySelector("body");

onDBUpdate((db) => {
    gameModeBlock.setAttribute("mode", db.Mode);
    body.setAttribute("mode", db.Mode);
});

// Check if we are on admin, make it clickable
const isAdmin = window.location.href.endsWith("admin.html");
if (isAdmin) {
    body.setAttribute("admin", "yes");
    gameModeBlock.setAttribute("admin", "yes");
    gameModeBlock.addEventListener("click", () => {
        let db = getDB();
        if (db["Mode"] === "team") {
            db["Mode"] = "player";
            gameModeBlock.setAttribute("mode", "player");
        } else {
            db["Mode"] = "team";
            gameModeBlock.setAttribute("mode", "team");
        }
        sendDB(db);
    });
}

export const getUserColor = (ID) => {
    let db = getDB();
}
