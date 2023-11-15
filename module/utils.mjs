/* -------------------------------------------- */
/*  Formulas                                    */
/* -------------------------------------------- */

/**
 * Convert a bonus value to a simple integer for displaying on the sheet.
 * @param {number|string|null} bonus  Bonus formula.
 * @param {object} [data={}]          Data to use for replacing @ strings.
 * @returns {number}                  Simplified bonus as an integer.
 * @protected
 */
export function simplifyBonus(bonus, data = {}) {
  if (!bonus) return 0;
  if (Number.isNumeric(bonus)) return Number(bonus);
  try {
    const roll = new Roll(bonus, data);
    return roll.isDeterministic ? Roll.safeEval(roll.formula) : 0;
  } catch(error) {
    console.error(error);
    return 0;
  }
}

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
  if (sortKey) sorted = sorted.sort((a, b) => a[1][sortKey].localeCompare(b[1][sortKey]));
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
  if (parts[0] === "Compendium") {
    const [, scope, packName, id] = parts;
    const pack = game.packs.get(`${scope}.${packName}`);
    index = pack?.index.get(id);
  }

  // World Documents
  else if (parts.length < 3) {
    const [docName, id] = parts;
    const collection = CONFIG[docName].collection.instance;
    index = collection.get(id);
  }

  return index || null;
}

/* -------------------------------------------- */

/**
 * Creates an HTML document link for the provided UUID.
 * @param {string} uuid  UUID for which to produce the link.
 * @returns {string}     Link to the item or empty string if item wasn't found.
 */
export function linkForUuid(uuid) {
  return TextEditor._createContentLink(["", "UUID", uuid]).outerHTML;
}

/* -------------------------------------------- */
/*  Validators                                  */
/* -------------------------------------------- */

/**
 * Ensure the provided string contains only the characters allowed in identifiers.
 * @param {string} identifier
 * @returns {boolean}
 */
function isValidIdentifier(identifier) {
  return /^([a-z0-9_-]+)$/i.test(identifier);
}

/**
 * Ensure the provided string matches the pattern of an UUID.
 * @param {string} uuid
 * @returns {boolean}
 */
function isValidUUID(uuid) {
  let parts = uuid.split(".");

  // Compendium Document
  const packs = new Set(game.packs.keys());
  if (
    parts[0] === "Compendium"
    && parts.length >= 4
    && packs.has(`${parts[1]}.${parts[2]}`)
    && foundry.data.validators.isValidId(parts[3])
  ) {
    parts = parts.slice(4);
  }

  // World Document / Embedded Document
  while (parts.length >= 2 && parts[0] in game.documentTypes && foundry.data.validators.isValidId(parts[1])) {
    parts = parts.slice(2);
  }

  return parts.length === 0;
}

export const validators = {
  isValidIdentifier,
  isValidUUID
};

/* -------------------------------------------- */
/*  Handlebars Template Helpers                 */
/* -------------------------------------------- */

/**
 * Define a set of template paths to pre-load. Pre-loaded templates are compiled and cached for fast access when
 * rendering. These paths will also be available as Handlebars partials by using the file name
 * (e.g. "sw5e.actor-traits").
 * @returns {Promise}
 */
export async function preloadHandlebarsTemplates() {
  const partials = [
    // Shared Partials
    "systems/sw5e/templates/actors/parts/active-effects.hbs",
    "systems/sw5e/templates/apps/parts/trait-list.hbs",

    // Actor Sheet Partials
    "systems/sw5e/templates/actors/origActor/parts/actor-traits.hbs",
    "systems/sw5e/templates/actors/origActor/parts/actor-inventory.hbs",
    "systems/sw5e/templates/actors/origActor/parts/actor-features.hbs",
    "systems/sw5e/templates/actors/origActor/parts/actor-powerbook.hbs",
    "systems/sw5e/templates/actors/origActor/parts/actor-warnings.hbs",

    "systems/sw5e/templates/actors/newActor/parts/swalt-active-effects.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-biography.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-core.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-crew.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-crewactions.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-favorites.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-features.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-force-powerbook.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-inventory.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-notes.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-starships.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-superiority-powerbook.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-tech-powerbook.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-traits.hbs",
    "systems/sw5e/templates/actors/newActor/parts/swalt-warnings.hbs",

    // FavTab Partials
    "systems/sw5e/templates/actors/favTab/fav-item.hbs",
    "systems/sw5e/templates/actors/favTab/template.hbs",

    // Item Sheet Partials
    "systems/sw5e/templates/items/parts/item-action.hbs",
    "systems/sw5e/templates/items/parts/item-activation.hbs",
    "systems/sw5e/templates/items/parts/item-advancement.hbs",
    "systems/sw5e/templates/items/parts/item-description.hbs",
    "systems/sw5e/templates/items/parts/item-mountable.hbs",
    "systems/sw5e/templates/items/parts/item-powercasting.hbs",
    "systems/sw5e/templates/items/parts/item-modifications.hbs",
    "systems/sw5e/templates/items/parts/item-summary.hbs",

    // Journal Partials
    "systems/sw5e/templates/journal/parts/journal-table.hbs",

    // Advancement Partials
    "systems/sw5e/templates/advancement/parts/advancement-ability-score-control.hbs",
    "systems/sw5e/templates/advancement/parts/advancement-controls.hbs",
    "systems/sw5e/templates/advancement/parts/advancement-power-config.hbs",

    // Compendium Browser Partials
    "systems/sw5e/templates/apps/compendium-browser/filters.hbs",
    // "systems/sw5e/templates/apps/compendium-browser/browser-settings.hbs",
    "systems/sw5e/templates/apps/compendium-browser/partials/bestiary.hbs",
    "systems/sw5e/templates/apps/compendium-browser/partials/equipment.hbs",
    "systems/sw5e/templates/apps/compendium-browser/partials/feat.hbs",
    "systems/sw5e/templates/apps/compendium-browser/partials/maneuver.hbs",
    "systems/sw5e/templates/apps/compendium-browser/partials/power.hbs"
  ];

  const paths = {};
  for (const path of partials) {
    paths[path.replace(".hbs", ".html")] = path;
    paths[`sw5e.${path.split("/").pop().replace(".hbs", "")}`] = path;
  }

  return loadTemplates(paths);
}

/* -------------------------------------------- */

/**
 * A helper that fetch the appropriate item context from root and adds it to the first block parameter.
 * @param {object} context  Current evaluation context.
 * @param {object} options  Handlebars options.
 * @returns {string}
 */
function itemContext(context, options) {
  if (arguments.length !== 2) throw new Error("#sw5e-itemContext requires exactly one argument");
  if (foundry.utils.getType(context) === "function") context = context.call(this);

  const ctx = options.data.root.itemContext?.[context.id];
  if (!ctx) {
    const inverse = options.inverse(this);
    if (inverse) return options.inverse(this);
  }

  return options.fn(context, { data: options.data, blockParams: [ctx] });
}

/* -------------------------------------------- */

/**
 * Register custom Handlebars helpers used by 5e.
 */
export function registerHandlebarsHelpers() {
  Handlebars.registerHelper({
    getProperty: foundry.utils.getProperty,
    "sw5e-linkForUuid": linkForUuid,
    "sw5e-itemContext": itemContext
  });
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
 * @param {string} configKeyPath          Key path within `CONFIG.SW5E` to localize.
 * @param {object} [options={}]
 * @param {string} [options.key]          If each entry in the config enum is an object,
 *                                        localize and sort using this property.
 * @param {string[]} [options.keys=[]]    Array of localization keys. First key listed will be used for sorting
 *                                        if multiple are provided.
 * @param {boolean} [options.sort=false]  Sort this config enum, using the key if set.
 */
export function preLocalize(configKeyPath, { key, keys = [], sort = false } = {}) {
  if (key) keys.unshift(key);
  _preLocalizationRegistrations[configKeyPath] = { keys, sort };
}

/* -------------------------------------------- */

/**
 * Execute previously defined pre-localization tasks on the provided config object.
 * @param {object} config  The `CONFIG.SW5E` object to localize and sort. *Will be mutated.*
 */
export function performPreLocalization(config) {
  for (const [keyPath, settings] of Object.entries(_preLocalizationRegistrations)) {
    const target = foundry.utils.getProperty(config, keyPath);
    _localizeObject(target, settings.keys);
    if (settings.sort) foundry.utils.setProperty(config, keyPath, sortObjectEntries(target, settings.keys[0]));
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
  for (const [k, v] of Object.entries(obj)) {
    const type = typeof v;
    if (type === "string") {
      obj[k] = game.i18n.localize(v);
      continue;
    }

    if (type !== "object") {
      console.error(
        new Error(`Pre-localized configuration values must be a string or object, ${type} found for "${k}" instead.`)
      );
      continue;
    }
    if (!keys?.length) {
      console.error(new Error("Localization keys must be provided for pre-localizing when target is an object."));
      continue;
    }

    for (const key of keys) {
      if (!v[key]) continue;
      v[key] = game.i18n.localize(v[key]);
    }
  }
}

/* -------------------------------------------- */
/*  Migration                                   */
/* -------------------------------------------- */

/**
 * Synchronize the powers for all Actors in some collection with source data from an Item compendium pack.
 * @param {CompendiumCollection} actorPack      An Actor compendium pack which will be updated
 * @param {CompendiumCollection} powersPack     An Item compendium pack which provides source data for powers
 * @returns {Promise<void>}
 */
export async function synchronizeActorPowers(actorPack, powersPack) {
  // Load all actors and powers
  const actors = await actorPack.getDocuments();
  const powers = await powersPack.getDocuments();
  const powersMap = powers.reduce((obj, item) => {
    obj[item.name] = item;
    return obj;
  }, {});

  // Unlock the pack
  await actorPack.configure({ locked: false });

  // Iterate over actors
  SceneNavigation.displayProgressBar({ label: "Synchronizing Power Data", pct: 0 });
  for (const [i, actor] of actors.entries()) {
    const { toDelete, toCreate } = _synchronizeActorPowers(actor, powersMap);
    if (toDelete.length) await actor.deleteEmbeddedDocuments("Item", toDelete);
    if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate, { keepId: true });
    console.debug(`${actor.name} | Synchronized ${toCreate.length} powers`);
    SceneNavigation.displayProgressBar({ label: actor.name, pct: ((i / actors.length) * 100).toFixed(0) });
  }

  // Re-lock the pack
  await actorPack.configure({ locked: true });
  SceneNavigation.displayProgressBar({ label: "Synchronizing Power Data", pct: 100 });
}

/* -------------------------------------------- */

/**
 * A helper function to synchronize power data for a specific Actor.
 * @param {Actor5e} actor
 * @param {Object<string,Item5e>} powersMap
 * @returns {{toDelete: string[], toCreate: object[]}}
 * @private
 */
function _synchronizeActorPowers(actor, powersMap) {
  const powers = actor.itemTypes.power;
  const toDelete = [];
  const toCreate = [];
  if (!powers.length) return { toDelete, toCreate };

  for (const power of powers) {
    const source = powersMap[power.name];
    if (!source) {
      console.warn(`${actor.name} | ${power.name} | Does not exist in powers compendium pack`);
      continue;
    }

    // Combine source data with the preparation and uses data from the actor
    const powerData = source.toObject();
    const { preparation, uses, save } = power.toObject().system;
    Object.assign(powerData.system, { preparation, uses });
    powerData.system.save.dc = save.dc;
    foundry.utils.setProperty(powerData, "flags.core.sourceId", source.uuid);

    // Record powers to be deleted and created
    toDelete.push(power.id);
    toCreate.push(powerData);
  }
  return { toDelete, toCreate };
}

/* -------------------------------------------- */
/*  Other                                       */
/* -------------------------------------------- */

/**
 * Syncronous version of fromUuid.
 * Returns null when the uuid is of a compendium item, or a collection that isn't ready yet.
 * Retrieve a Document by its Universally Unique Identifier (uuid).
 * @param {string} uuid   The uuid of the Document to retrieve
 * @returns {Document|null}
 */
export function fromUuidSynchronous(uuid) {
  if (!uuid) return null;
  let parts = uuid.split(".");
  let doc;

  // Compendium Documents
  if (parts[0] === "Compendium") return console.warn(`[Warning] fromUuidSynchronous does not work on Compendium uuids such as ${uuid}.`);
  // World Documents
  else {
    const [docName, docId] = parts.slice(0, 2);
    parts = parts.slice(2);
    const collection = CONFIG[docName]?.collection?.instance;
    doc = collection?.get(docId);
  }

  // Embedded Documents
  while (doc && parts.length > 1) {
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
 * @returns {Document|null}
 */
export async function fromUuidSafe(uuid) {
  if (!uuid) return null;
  let parts = uuid.split(".");
  let doc;

  // Compendium Documents
  if (parts[0] === "Compendium") {
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
  while (doc && parts.length > 1) {
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
 * @returns {int[]|null}   The indexes of the start and end of the bracket, and start and end of the bracket's content
 */
export function htmlFindClosingBracket(html, index = 0) {
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
    } else if (inString) continue;
    else if (prev === "<") {
      if (blockStart === null) blockStart = i - 1;
      contentEnd = i - 1;

      if (c === "/") depth -= 1;
      else depth += 1;
    } else if (c === ">") {
      if (contentStart === null) contentStart = i + 1;
      blockEnd = i + 1;

      if (depth === 0) return [blockStart, blockEnd, contentStart, contentEnd];
    }
    prev = c;
  }
  return null;
}

/**
 * Given an string, sluggify it
 * @param {string} orig    The original string
 * @returns {string}       The slugified string
 */
export function sluggify(orig) {
  // Replace %20 and underscores with spaces
  orig = orig.replace(/%20|_/g, " ");
  // Capitalize each word
  orig = orig.replace(/\b\w+\b/g, w => w.capitalize());
  // Replace slashes and commas with dashes
  orig = orig.replace(/[/,]/g, "-");
  // Remove all whitespaces
  orig = orig.replace(/[\s]/g, "");
  // Replace all (ParenthesisedText) at the beggining of words with 'ParenthesisedText-'
  orig = orig.replace(/^\(([^)]*)\)/g, "$1-");
  // Replace all (ParenthesisedText) elsewhere '-ParenthesisedText'
  orig = orig.replace(/-*\(([^)]*)\)/g, "-$1");
  // Remove all non-word characters but dashes
  orig = orig.replace(/[^\w-]/g, "");

  return orig;
}

/**
 * Given an file path, sluggify it
 * @param {string} path    The icon path
 * @returns {string}       The slugified path
 */
export function sluggifyPath(path) {
  let folder_index = path.search(/\/[^/]*$/) + 1;
  let extension_index = path.search(/\.\w+$/);
  if (extension_index === -1) extension_index = path.length;

  let folder = path.substring(0, folder_index);
  let icon = path.substring(folder_index, extension_index);
  let extension = path.substring(extension_index);

  icon = sluggify(icon);

  return folder + icon + extension;
}

/**
 * Generate and return an HTML element for a FontAwesome icon
 * @param {string} glyph   The icon name
 * @param {string} [style] The style of the icon, defaults to "solid"
 * @returns {string}        The slugified name
 */
export function fontAwesomeIcon(glyph, style = "solid") {
  const styleClass = style === "regular" ? "far" : "fas";
  const glyphClass = glyph.startsWith("fa-") ? glyph : `fa-${glyph}`;
  const icon = document.createElement("i");
  icon.classList.add(styleClass, glyphClass);
  return icon;
}

/**
 * Querries from parent
 * @param {HTMLElement} parent
 * @param {string} selectors
 * @returns {HTMLElement} Result of the query
 */
export function htmlQuery(parent, selectors) {
  if (!(parent instanceof Element || parent instanceof Document)) return null;
  return parent.querySelector(selectors);
}

/**
 * Querries from parent
 * @param {HTMLElement} parent
 * @param {string} selectors
 * @returns {HTMLElement} Result of the query
 */
export function htmlQueryAll(parent, selectors) {
  if (!(parent instanceof Element || parent instanceof Document)) return [];
  return Array.from(parent.querySelectorAll(selectors));
}

/**
 * Check if a key is present in a given object in a type safe way
 * @param {object} obj The object to check
 * @param {string|number} key The key to check
 * @returns {boolean}
 */
export function objectHasKey(obj, key) {
  return (typeof key === "string" || typeof key === "number") && key in obj;
}

/**
 * Check if a value is a non-null object
 * @param {unknown} value
 * @returns {boolean}
 */
export function isObject(value) {
  return typeof value === "object" && value !== null;
}

/**
 * Collects every actor whose token is controlled on the canvas, and if none are, collects the current user's character, if it exists.
 *
 * @param {string[]} [types]          The actor types the function should take into consideration.
 * @param {boolean} [useOwnCharacter] If true, the function will append the user's own character to the list of collected actors.
 * @returns {Actors5e[]} An array of Actor5e elements according to the aforementioned filters.
 */
export function getSelectedOrOwnActors(types, useOwnCharacter = true) {
  const actors = canvas.tokens.controlled
    .flatMap(token => (token.actor ? token.actor : []))
    .filter(actor => actor.isOwner)
    .filter(actor => !types || types.includes(actor.type));

  if (actors.length === 0 && game.user.character && useOwnCharacter) actors.push(game.user.character);

  return actors;
}

/**
 * Composes multiple regex objects into a single one.
 *
 * @param {string} flags               The regex flags of the composed object.
 * @param {RegExp[]} regexes           The regex objects to compose.
 * @returns {RegExp}                   The composed regex object.
 */
export function getComposedRegex(flags, ...regexes) {
  return new RegExp(`(${regexes.map(regex => regex.source).join("|")})`, flags ?? "");
}
