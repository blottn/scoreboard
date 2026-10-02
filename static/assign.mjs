import { getDB, sendDB, onDBUpdate } from "./db.mjs";

const assigns = document.querySelector("#assigns");
const tmpl = assigns.querySelector("template");

const sync = ({ Users }) => {
    Users
        .filter(({ Claimer }) => Claimer !== "")
        .forEach(({ Name, ID, Claimer }) => {
            let instance = assigns.querySelector(
                `div[id="${ID}"]`
            );

            if (instance == null) {
                instance = document.importNode(
                    tmpl.content,
                    true
                ).firstElementChild;

                instance.id = ID;
                assigns.appendChild(instance);
            }

            instance.querySelector(".name").textContent = Name;
            instance.querySelector(".owner").textContent = Claimer;
        });

    Users
        .filter(({ Claimer }) => Claimer === "")
        .forEach(({ ID }) => {
            const instance = assigns.querySelector(
                `div[id="${ID}"]`
            );

            if (instance != null) {
                instance.remove();
            }
        });
};

onDBUpdate(sync);

window.logoutUser = async function(event) {
    const id = event.currentTarget.parentElement.id;
    const db = getDB();

    const idx = db.Users.findIndex(
        ({ ID }) => `${ID}` === id
    );

    if (idx === -1) {
        return;
    }

    const newDB = structuredClone(db);

    newDB.Users[idx].Claimer = "";

    await sendDB(newDB);
};
