const dbKey = "scoreboard-db";

export let db = null;

const listeners = new Set();

const cachedDB = localStorage.getItem(dbKey);

if (cachedDB != null) {
    try {
        db = JSON.parse(cachedDB);
    } catch {
        localStorage.removeItem(dbKey);
    }
}

export const getDB = () => db;

export const onDBUpdate = (listener) => {
    listeners.add(listener);

    if (db !== null) {
        listener(db);
    }

    return () => {
        listeners.delete(listener);
    };
};

const notifyListeners = () => {
    for (const listener of listeners) {
        listener(db);
    }
};

const updateDB = async () => {
    try {
        const resp = await fetch("/db");
        db = await resp.json();

        localStorage.setItem(dbKey, JSON.stringify(db));

        console.debug("current db:", db);

        notifyListeners();
    } catch (error) {
        console.error("failed to update db:", error);
    }

    setTimeout(updateDB, 500);
};

await updateDB();

export const sendDB = async (newDB) => {
    let db = await getDB();
    let update = {...db, ...newDB};
    const resp = await fetch("/db", {
        method: "POST",
        body: JSON.stringify(newDB),
    });

    console.log(await resp.text());
};
