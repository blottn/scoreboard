export let db = null;

const listeners = new Set();

export const getDB = () => db;

export const onDBUpdate = (listener) => {
    listeners.add(listener);

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
        const newDB = await resp.json();

        db = newDB;

        console.log("current db:", db);

        notifyListeners();
    } catch (error) {
        console.error("failed to update db:", error);
    }

    setTimeout(updateDB, 500);
};

await updateDB();

export const sendDB = async (newDB) => {
    const resp = await fetch("/db", {
        method: "PUT",
        body: JSON.stringify(newDB),
    });

    console.log(await resp.text());
};
