import {
    getDB,
    sendDB,
    onDBUpdate
} from "./db.mjs";

window.addPlayer = function(event) {
    let db = getDB();
    db.Users = [...db.Users, {ID: Math.floor(Date.now())}]
    sendDB(db);
};
