/* -------------------------------------------- */
/*  Formatters                                  */
/* -------------------------------------------- */

/**
 * Format a Challenge Rating using the proper fractional symbols.
 * @param {number} value  CR value for format.
 * @returns {string}
 */
export function formatCR(value) {
  return { 0.125: "⅛", 0.25: "¼", 0.5: "½" }[value] ?? formatNumber(value);
}

/* -------------------------------------------- */

/**
 * A helper for using Intl.NumberFormat within handlebars.
 * @param {number} value    The value to format.
 * @param {object} options  Options forwarded to {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat}
 * @returns {string}
 */
export function formatNumber(value, options) {
  const formatter = new Intl.NumberFormat(game.i18n.lang, options);
  return formatter.format(value);
}

/* -------------------------------------------- */

/**
 * A helper function to format textarea text to HTML with linebreaks.
 * @param {string} value  The text to format.
 * @returns {Handlebars.SafeString}
 */
export function formatText(value) {
  return new Handlebars.SafeString(value?.replaceAll("\n", "<br>") ?? "");
}

/* -------------------------------------------- */
/*  Formulas                                    */
/* -------------------------------------------- */

/**
 * Handle a delta input for a number value from a form.
 * @param {HTMLInputElement} input  Input that contains the modified value.
 * @param {Document} target         Target document to be updated.
 * @returns {number|void}
 */
export function parseInputDelta(input, target) {
  let value = input.value;
  if ( ["+", "-"].includes(value[0]) ) {
    const delta = parseFloat(value);
    value = Number(foundry.utils.getProperty(target, input.dataset.name ?? input.name)) + delta;
  }
  else if ( value[0] === "=" ) value = Number(value.slice(1));
  if ( Number.isNaN(value) ) return;
  input.value = value;
  return value;
}

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
/*  IDs                                         */
/* -------------------------------------------- */

/**
 * Create an ID from the input truncating or padding the value to make it reach 16 characters.
 * @param {string} id
 * @returns {string}
 */
export function staticID(id) {
  if ( id.length >= 16 ) return id.substring(0, 16);
  return id.padEnd(16, "0");
}

/* -------------------------------------------- */
/*  Object Helpers                              */
/* -------------------------------------------- */

/**
 * Transform an object, returning only the keys which match the provided filter.
 * @param {object} obj         Object to transform.
 * @param {Function} [filter]  Filtering function. If none is provided, it will just check for truthiness.
 * @returns {string[]}         Array of filtered keys.
 */
export function filteredKeys(obj, filter) {
  filter ??= e => e;
  return Object.entries(obj).filter(e => filter(e[1])).map(e => e[0]);
}

/* -------------------------------------------- */

/**
 * Transform an object, returning only the key-value pairs which match the provided filter.
 * @param {object} obj         Object to transform.
 * @param {Function} [filter]  Filtering function. If none is provided, it will just check for value truthiness.
 * @returns {object}           Filtered object.
 */
export function filteredObject(obj, filter) {
  filter ??= (([k,v]) => v);
  return Object.fromEntries(Object.entries(obj).filter(e => filter(e)));
}

/* -------------------------------------------- */

/**
 * Sort the provided object by its values or by an inner sortKey.
 * @param {object} obj                 The object to sort.
 * @param {string|Function} [sortKey]  An inner key upon which to sort or sorting function.
 * @returns {object}                   A copy of the original object that has been sorted.
 */
export function sortObjectEntries(obj, sortKey) {
  let sorted = Object.entries(obj);
  const sort = (lhs, rhs) => foundry.utils.getType(lhs) === "string" ? lhs.localeCompare(rhs) : lhs - rhs;
  if ( foundry.utils.getType(sortKey) === "function" ) sorted = sorted.sort((lhs, rhs) => sortKey(lhs[1], rhs[1]));
  else if ( sortKey ) sorted = sorted.sort((lhs, rhs) => sort(lhs[1][sortKey], rhs[1][sortKey]));
  else sorted = sorted.sort((lhs, rhs) => sort(lhs[1], rhs[1]));
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
    "systems/sw5e/templates/shared/active-effects.hbs",
    "systems/sw5e/templates/shared/inventory.hbs",
    "systems/sw5e/templates/shared/inventory2.hbs",
    "systems/sw5e/templates/shared/active-effects2.hbs",
    "systems/sw5e/templates/apps/parts/trait-list.hbs",

    // Actor Sheet Partials
    "systems/sw5e/templates/actors/origActor/parts/actor-traits.hbs",
    "systems/sw5e/templates/actors/origActor/parts/actor-inventory.hbs",
    "systems/sw5e/templates/actors/origActor/parts/actor-features.hbs",
    "systems/sw5e/templates/actors/origActor/parts/actor-powerbook.hbs",
    "systems/sw5e/templates/actors/origActor/parts/actor-warnings.hbs",
    "systems/sw5e/templates/actors/origActor/tabs/character-details.hbs",
    "systems/sw5e/templates/actors/origActor/tabs/character-features.hbs",
    "systems/sw5e/templates/actors/origActor/tabs/character-powers.hbs",
    "systems/sw5e/templates/actors/origActor/tabs/character-biography.hbs",

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
    "systems/sw5e/templates/items/parts/item-source.hbs",
    "systems/sw5e/templates/items/parts/item-modifications.hbs",
    "systems/sw5e/templates/items/parts/item-summary.hbs",
    "systems/sw5e/templates/items/parts/item-tooltip.hbs",

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
 * A helper that converts the provided object into a series of `data-` entries.
 * @param {object} object   Object to convert into dataset entries.
 * @param {object} options  Handlebars options.
 * @returns {string}
 */
function dataset(object, options) {
  const entries = [];
  for ( let [key, value] of Object.entries(object ?? {}) ) {
    key = key.replace(/[A-Z]+(?![a-z])|[A-Z]/g, (a, b) => (b ? "-" : "") + a.toLowerCase());
    entries.push(`data-${key}="${value}"`);
  }
  return new Handlebars.SafeString(entries.join(" "));
}

/* -------------------------------------------- */

/**
 * A helper to create a set of <option> elements in a <select> block grouped together
 * in <optgroup> based on the provided categories.
 *
 * @param {SelectChoices} choices          Choices to format.
 * @param {object} [options]
 * @param {boolean} [options.localize]     Should the label be localized?
 * @param {string} [options.blank]         Name for the empty option, if one should be added.
 * @param {string} [options.labelAttr]     Attribute pointing to label string.
 * @param {string} [options.chosenAttr]    Attribute pointing to chosen boolean.
 * @param {string} [options.childrenAttr]  Attribute pointing to array of children.
 * @returns {Handlebars.SafeString}        Formatted option list.
 */
function groupedSelectOptions(choices, options) {
  const localize = options.hash.localize ?? false;
  const blank = options.hash.blank ?? null;
  const labelAttr = options.hash.labelAttr ?? "label";
  const chosenAttr = options.hash.chosenAttr ?? "chosen";
  const childrenAttr = options.hash.childrenAttr ?? "children";

  // Create an option
  const option = (name, label, chosen) => {
    if ( localize ) label = game.i18n.localize(label);
    html += `<option value="${name}" ${chosen ? "selected" : ""}>${label}</option>`;
  };

  // Create a group
  const group = category => {
    let label = category[labelAttr];
    if ( localize ) game.i18n.localize(label);
    html += `<optgroup label="${label}">`;
    children(category[childrenAttr]);
    html += "</optgroup>";
  };

  // Add children
  const children = children => {
    for ( let [name, child] of Object.entries(children) ) {
      if ( child[childrenAttr] ) group(child);
      else option(name, child[labelAttr], child[chosenAttr] ?? false);
    }
  };

  // Create the options
  let html = "";
  if ( blank !== null ) option("", blank);
  children(choices);
  return new Handlebars.SafeString(html);
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
 * Conceal a section and display a notice if unidentified.
 * @param {boolean} conceal  Should the section be concealed?
 * @param {object} options   Handlebars options.
 * @returns {string}
 */
function concealSection(conceal, options) {
  let content = options.fn(this);
  if ( !conceal ) return content;

  content = `<div inert>
    ${content}
  </div>
  <div class="unidentified-notice">
      <div>
          <strong>${game.i18n.localize("SW5E.Unidentified.Title")}</strong>
          <p>${game.i18n.localize("SW5E.Unidentified.Notice")}</p>
      </div>
  </div>`;
  return content;
}

/* -------------------------------------------- */

/**
 * Register custom Handlebars helpers used by 5e.
 */
export function registerHandlebarsHelpers() {
  Handlebars.registerHelper({
    getProperty: foundry.utils.getProperty,
    "sw5e-concealSection": concealSection,
    "sw5e-dataset": dataset,
    "sw5e-groupedSelectOptions": groupedSelectOptions,
    "sw5e-linkForUuid": linkForUuid,
    "sw5e-itemContext": itemContext,
    "sw5e-numberFormat": (context, options) => formatNumber(context, options.hash),
    "sw5e-textFormat": formatText
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
    if ( !target ) continue;
    _localizeObject(target, settings.keys);
    if (settings.sort) foundry.utils.setProperty(config, keyPath, sortObjectEntries(target, settings.keys[0]));
  }

  // Localize & sort status effects
  CONFIG.statusEffects.forEach(s => s.name = game.i18n.localize(s.name));
  CONFIG.statusEffects.sort((lhs, rhs) =>
    lhs.id === "dead" ? -1 : rhs.id === "dead" ? 1 : lhs.name.localeCompare(rhs.name)
  );
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
      const value = foundry.utils.getProperty(v, key);
      if ( !value ) continue;
      foundry.utils.setProperty(v, key, game.i18n.localize(value));
    }
  }
}

/* -------------------------------------------- */
/*  Localization                                */
/* -------------------------------------------- */

/**
 * A cache of already-fetched labels for faster lookup.
 * @type {Map<string, string>}
 */
const _attributeLabelCache = new Map();

/**
 * Convert an attribute path to a human-readable label.
 * @param {string} attr              The attribute path.
 * @param {object} [options]
 * @param {Actor5e} [options.actor]  An optional reference actor.
 * @returns {string|void}
 */
export function getHumanReadableAttributeLabel(attr, { actor }={}) {
  // Check any actor-specific names first.
  if ( attr.startsWith("resources.") && actor ) {
    const resource = foundry.utils.getProperty(actor, `system.${attr}`);
    if ( resource.label ) return resource.label;
  }

  if ( (attr === "details.xp.value") && (actor?.type === "npc") ) {
    return game.i18n.localize("SW5E.ExperiencePointsValue");
  }

  // Check if the attribute is already in cache.
  let label = _attributeLabelCache.get(attr);
  if ( label ) return label;

  // Derived fields.
  if ( attr === "attributes.init.total" ) label = "SW5E.InitiativeBonus";
  else if ( attr === "attributes.ac.value" ) label = "SW5E.ArmorClass";
  else if ( attr === "attributes.powerdc" ) label = "SW5E.PowerDC";

  // Abilities.
  else if ( attr.startsWith("abilities.") ) {
    const [, key] = attr.split(".");
    label = game.i18n.format("SW5E.AbilityScoreL", { ability: CONFIG.SW5E.abilities[key].label });
  }

  // Skills.
  else if ( attr.startsWith("skills.") ) {
    const [, key] = attr.split(".");
    label = game.i18n.format("SW5E.SkillPassiveScore", { skill: CONFIG.SW5E.skills[key].label });
  }

  // Power slots.
  else if ( attr.startsWith("powers.") ) {
    const [, key] = attr.split(".");
    if ( key === "pact" ) label = "SW5E.PowerSlotsPact";
    else {
      const plurals = new Intl.PluralRules(game.i18n.lang, {type: "ordinal"});
      const level = Number(key.slice(5));
      label = game.i18n.format(`SW5E.PowerSlotsN.${plurals.select(level)}`, { n: level });
    }
  }

  // Attempt to find the attribute in a data model.
  if ( !label ) {
    const { CharacterData, NPCData, VehicleData, GroupData } = sw5e.dataModels.actor;
    for ( const model of [CharacterData, NPCData, VehicleData, GroupData] ) {
      const field = model.schema.getField(attr);
      if ( field ) {
        label = field.label;
        break;
      }
    }
  }

  if ( label ) {
    label = game.i18n.localize(label);
    _attributeLabelCache.set(attr, label);
  }

  return label;
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
 * Collects every actor whose token is controlled on the canvas, and if none are,
 * collects the current user's character, if it exists.
 *
 * @param {string[]} [types]          The actor types the function should take into consideration.
 * @param {boolean} [useOwnCharacter] If true, the function will append the user's own character
 *                                    to the list of collected actors.
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
