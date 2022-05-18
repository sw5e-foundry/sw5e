/* -------------------------------------------- */
/*  Object Helpers                              */
/* -------------------------------------------- */

/**
 * Sort the provided object by its values or by an inner sortKey.
 * @param {object} obj        The object to sort.
 * @param {string} [sortKey]  An inner key upon which to sort.
 * @returns {object}          A copy of the original object that has been sorted.
 */
export function sortObjectEntries(obj, sortKey) {
    let sorted = Object.entries(obj);
    if ( sortKey ) sorted = sorted.sort((a, b) => a[1][sortKey].localeCompare(b[1][sortKey]));
    else sorted = sorted.sort((a, b) => a[1].localeCompare(b[1]));
    return Object.fromEntries(sorted);
}

/* -------------------------------------------- */

/**
 * Retrieve the indexed data for a Document using its UUID. Will never return a result for embedded documents.
 * @param {string} uuid  The UUID of the Document index to retrieve.
 * @returns {object}     Document's index if one could be found.
 */
export function indexFromUuid(uuid) {
    const parts = uuid.split(".");
    let index;

    // Compendium Documents
    if ( parts[0] === "Compendium" ) {
        const [, scope, packName, id] = parts;
        const pack = game.packs.get(`${scope}.${packName}`);
        index = pack?.index.get(id);
    }

    // World Documents
    else if ( parts.length < 3 ) {
        const [docName, id] = parts;
        const collection = CONFIG[docName].collection.instance;
        index = collection.get(id);
    }

    return index || null;
}

/* -------------------------------------------- */

/**
 * Creates an HTML document link for the provided UUID. This should be replaced by the core feature once
 * foundryvtt#6166 is implemented.
 * @param {string} uuid  UUID for which to produce the link.
 * @returns {string}     Link to the item or empty string if item wasn't found.
 * @private
 */
export function _linkForUuid(uuid) {
    const index = game.sw5e.utils.indexFromUuid(uuid);

    let link;

    if ( !index ) {
        link = `@Item[${uuid}]{${game.i18n.localize("SW5E.Unknown")}}`;
    } else if ( uuid.startsWith("Compendium.") ) {
        link = `@Compendium[${uuid.slice(11)}]{${index.name}}`;
    } else {
        const [type, id] = uuid.split(".");
        link = `@${type}[${id}]{${index.name}}`;
    }

    return TextEditor.enrichHTML(link);
}

/* -------------------------------------------- */
/*  Config Pre-Localization                     */
/* -------------------------------------------- */

/**
 * Storage for pre-localization configuration.
 * @type {object}
 * @private
 */
const _preLocalizationRegistrations = {};

/**
 * Mark the provided config key to be pre-localized during the init stage.
 * @param {string} configKey              Key within `CONFIG.SW5E` to localize.
 * @param {object} [options={}]
 * @param {string} [options.key]          If each entry in the config enum is an object,
 *                                        localize and sort using this property.
 * @param {string[]} [options.keys=[]]    Array of localization keys. First key listed will be used for sorting
 *                                        if multiple are provided.
 * @param {boolean} [options.sort=false]  Sort this config enum, using the key if set.
 */
export function preLocalize(configKey, { key, keys=[], sort=false }={}) {
    if ( key ) keys.unshift(key);
    _preLocalizationRegistrations[configKey] = { keys, sort };
}

/* -------------------------------------------- */

/**
 * Execute previously defined pre-localization tasks on the provided config object.
 * @param {object} config  The `CONFIG.SW5E` object to localize and sort. *Will be mutated.*
 */
export function performPreLocalization(config) {
    for ( const [key, settings] of Object.entries(_preLocalizationRegistrations) ) {
        _localizeObject(config[key], settings.keys);
        if ( settings.sort ) config[key] = sortObjectEntries(config[key], settings.keys[0]);
    }
}

/* -------------------------------------------- */

/**
 * Localize the values of a configuration object by translating them in-place.
 * @param {object} obj       The configuration object to localize.
 * @param {string[]} [keys]  List of inner keys that should be localized if this is an object.
 * @private
 */
function _localizeObject(obj, keys) {
    for ( const [k, v] of Object.entries(obj) ) {
        const type = typeof v;
        if ( type === "string" ) {
            obj[k] = game.i18n.localize(v);
            continue;
        }

        if ( type !== "object" ) {
            console.error(new Error(
                `Pre-localized configuration values must be a string or object, ${type} found for "${k}" instead.`
            ));
            continue;
        }
        if ( !keys?.length ) {
            console.error(new Error(
                "Localization keys must be provided for pre-localizing when target is an object."
            ));
            continue;
        }

        for ( const key of keys ) {
            if ( !v[key] ) continue;
            v[key] = game.i18n.localize(v[key]);
        }
    }
}

/* -------------------------------------------- */
/*  Other                                       */
/* -------------------------------------------- */

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

/* -------------------------------------------- */

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

/* -------------------------------------------- */

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
