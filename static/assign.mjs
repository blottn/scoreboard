import { getDB, sendDB } from "./db.mjs";

let { Users, ...db } = await getDB();

let assigns = document.querySelector("#assigns");
let tmpl = assigns.querySelector("template");

const sync = async () => {
    let { Users, ...db } = await getDB();
    Users.filter(({Claimer}) => Claimer !== "")
        .forEach(({Name, ID, Claimer}) => {
           let instance = assigns.querySelector(`div[id="${ID}"]`);
            if (instance == null) {
                console.log("new node");
                instance = document.importNode(tmpl.content, true);
                instance = instance.firstElementChild;
                instance.id = ID;
                assigns.appendChild(instance);
            }
            instance.querySelector(".name").textContent = Name;
            instance.querySelector(".owner").textContent = Claimer;
    });
    Users.filter(({Claimer}) => Claimer === "")
        .forEach(({ID}) => {
            let instance = assigns.querySelector(`div[id="${ID}"]`)
            if (instance != null) {
                assigns.removeChild(instance);
            }
        })
    setTimeout(sync, 200);
}
sync();

window.logoutUser = async function(event) {
    let { Users, ...db } = await getDB();

    
    let idx = Users.findIndex(({ID}) => `${ID}` === event.target.parentElement.id)
    if (idx === undefined) {
        return
    }
    Users[idx].Claimer = "";
    sendDB({Users, ...db});
}
