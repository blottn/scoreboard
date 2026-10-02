import { getDB } from "./db.mjs";

export const getTeamColor = (name) => {
    const { Teams } = getDB();

    return Teams.find(({ Name }) => Name === name)?.Color;
};
