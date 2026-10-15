// Generates a user id and puts it in localStorage, when connecting it tries to grab that ID

const idKey = "score-agent-id";

if (localStorage.getItem(idKey) == null) {
    const id =
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(idKey, id);
}

export const agentId = localStorage.getItem(idKey);
