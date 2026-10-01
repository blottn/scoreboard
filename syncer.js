// Sync takes a document element and reads a key from the 
export const sync = (el) => {
    let path = [el.id];
    getPath(el);
}

export const getPath = (el) => {
    if (el === undefined || el === null) {
        return [];
    }
    return [...getPath(el.parent), el.id];
}
