// Generates a user id and puts it in localStorage, when connecting it tries to grab that ID

const idKey = "score-agent-id";

if (localStorage.getItem(idKey) == null) {
    localStorage.setItem(idKey, uuidv4());
}
export const id = localStorage.getItem(idKey);
