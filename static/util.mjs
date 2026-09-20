export const getDB = async () => {
    let resp = await fetch("/db")
    let db = await resp.json();
    console.log(`current db:`,  db);
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
