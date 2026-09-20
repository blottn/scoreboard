let db = null;
export const getDB = async () => {
    if (db != null) { // Updates are running already
        return db;
    }
    let resp = await fetch("/db")
    db = await resp.json();
    console.log(`current db:`,  db);
    setTimeout(getDB, 500) // Every 500 ms refresh the DB
    return db;
}


export const updateDB = async (db) => {
    let resp = await fetch("/db", {
        method: "PUT",
        body: JSON.stringify(db),
    });
    console.log(await resp.text())
    return
}

