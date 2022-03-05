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
