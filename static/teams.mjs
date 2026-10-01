// Teams provides functions for setting team colors

import { getDB } from "./db.mjs";

export const getTeamColor = (name) => {
    let { Teams } = getDB();
    return Teams.find(({Name, Color}) => Name == name)?.Color;
}
