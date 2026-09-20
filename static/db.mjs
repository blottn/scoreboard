export let db = null;
export const getDB = () => db;
export const updateDB = async () => {
    const resp = await fetch("/db");
    db = await resp.json();
    console.log(`current db:`,  db);
    setTimeout(updateDB, 500) // Every 500 ms refresh the DB
}

export const sendDB = async (db) => {
    let resp = await fetch("/db", {
        method: "PUT",
        body: JSON.stringify(db),
    });
    console.log(await resp.text())
    return
}

