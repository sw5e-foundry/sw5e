/**
 * Syncronous version of fromUuid. Returns null when the uuid is of a compendium item, or a collection that isn't ready yet.
 * Retrieve a Document by its Universally Unique Identifier (uuid).
 * @param {string} uuid   The uuid of the Document to retrieve
 * @return {Document|null}
 */
export function fromUuidSynchronous(uuid) {
    if (!uuid) return null;
    let parts = uuid.split(".");
    let doc;

    // Compendium Documents
    if ( parts[0] === "Compendium" ) return console.warn(`[Warning] fromUuidSynchronous does not work on Compendium uuids such as ${uuid}.`);

    // World Documents
    else {
        const [docName, docId] = parts.slice(0, 2);
        parts = parts.slice(2);
        const collection = CONFIG[docName]?.collection?.instance;
        doc = collection?.get(docId);
    }

    // Embedded Documents
    while ( doc && (parts.length > 1) ) {
        const [embeddedName, embeddedId] = parts.slice(0, 2);
        doc = doc.getEmbeddedDocument(embeddedName, embeddedId);
        parts = parts.slice(2);
    }
    return doc || null;
}

/**
 * Safe version of fromUuid. Returns null when the uuid is of a collection that isn't ready yet.
 * Retrieve a Document by its Universally Unique Identifier (uuid).
 * @param {string} uuid   The uuid of the Document to retrieve
 * @return {Document|null}
 */
export async function fromUuidSafe(uuid) {
    if (!uuid) return null;
    let parts = uuid.split(".");
    let doc;

    // Compendium Documents
    if ( parts[0] === "Compendium" ) {
        parts.shift();
        const [scope, packName, id] = parts.slice(0, 3);
        parts = parts.slice(3);
        const pack = game.packs.get(`${scope}.${packName}`);
        doc = await pack?.getDocument(id);
    }

    // World Documents
    else {
        const [docName, docId] = parts.slice(0, 2);
        parts = parts.slice(2);
        const collection = CONFIG[docName]?.collection?.instance;
        doc = collection?.get(docId);
    }

    // Embedded Documents
    while ( doc && (parts.length > 1) ) {
        const [embeddedName, embeddedId] = parts.slice(0, 2);
        doc = doc.getEmbeddedDocument(embeddedName, embeddedId);
        parts = parts.slice(2);
    }
    return doc || null;
}

/**
 * Given a partial html string, finds the closing bracket
 * @param {string} html   The partial html string
 * @param {int} index     The index to start searching from
 * @return {int[]|null}   The indexes of the start and end of the bracket, and start and end of the bracket's content
 */
export function htmlFindClosingBracket(html, index=0) {
    if (!html) return null;
    let inString = false;
    let depth = 0;
    let prev = null;
    let blockStart = null;
    let blockEnd = null;
    let contentStart = null;
    let contentEnd = null;
    for (let i = index; i < html.length; i++) {
        const c = html[i];
        if (['"', "'", "`"].includes(c)) {
            if (!inString) inString = c;
            else if (inString === c && prev !== "\\") inString = false;
        }
        else if (inString) continue;
        else if (prev === '<') {
            if (blockStart === null) blockStart = i-1;
            contentEnd = i-1;

            if (c === '/') depth -= 1;
            else depth += 1;
        }
        else if (c === '>') {
            if (contentStart === null) contentStart = i+1;
            blockEnd = i+1;

            if (depth === 0) return [blockStart, blockEnd, contentStart, contentEnd];
        }
        prev = c;
    }
    return null;
}

