import Datastore from "nedb";
import fs from "fs";
import gulp from "gulp";
import logger from "fancy-log";
import mergeStream from "merge-stream";
import path from "path";
import through2 from "through2";
import yargs from "yargs";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

/**
 * Parsed arguments passed in through the command line.
 * @type {object}
 */
const parsedArgs = yargs(process.argv).argv;

/**
 * Folder where the compiled compendium packs should be located relative to the
 * base 5e system folder.
 * @type {string}
 */
const PACK_DEST = "./dist/packs/packs";

/**
 * Folder where source JSON files should be located relative to the 5e system folder.
 * @type {string}
 */
const PACK_SRC = "./packs/";

/**
 * Cache of DBs so they aren't loaded repeatedly when determining IDs.
 * @type {Object<string,Datastore>}
 */
const DB_CACHE = {};

/* ----------------------------------------- */
/*  Clean Packs                              */
/* ----------------------------------------- */

/**
 * Removes unwanted flags, permissions, and other data from entries before extracting or compiling.
 * @param {object} data  Data for a single entry to clean.
 * @param {object} [options={}]
 * @param {boolean} [options.clearSourceId=true]  Should the core sourceId flag be deleted.
 * @param {number} [options.ownership=0]          Value to reset default ownership to.
 */
function cleanPackEntry(data, { clearSourceId=true, ownership=0 } = {}) {
  if (data.ownership) data.ownership = { default: ownership };
  if (clearSourceId) delete data.flags?.core?.sourceId;
  if (typeof data.folder === "string") data.folder = null;
  delete data.system?.consume?.ammount;
  delete data.flags?.importSource;
  delete data.flags?.exportSource;
  delete data.flags?.dae;
  delete data.flags?.["midi-qol"];
  delete data.flags?.["midi-properties"];
  delete data.flags?.["midiProperties"];
  delete data.flags?.["betterrollssw5e"];
  delete data.flags?.sw5e?.persistSourceMigration;
  if (data._stats?.lastModifiedBy) data._stats.lastModifiedBy = "sw5ebuilder0000";

  // Remove empty entries in flags
  if (!data.flags) data.flags = {};
  Object.entries(data.flags).forEach(([key, contents]) => {
    if (Object.keys(contents).length === 0) delete data.flags[key];
  });

  if (data.system?.activation?.cost === 0) data.system.activation.cost = null;
  if (data.system?.duration?.value === "0") data.system.duration.value = "";
  if (data.system?.target?.value === 0) data.system.target.value = null;
  if (data.system?.target?.width === 0) data.system.target.width = null;
  if (data.system?.range?.value === 0) data.system.range.value = null;
  if (data.system?.range?.long === 0) data.system.range.long = null;
  if (data.system?.uses?.value === 0) data.system.uses.value = null;
  if (data.system?.uses?.max === "0") data.system.duration.value = "";
  if (data.system?.save?.dc === 0) data.system.save.dc = null;
  if (data.system?.capacity?.value === 0) data.system.capacity.value = null;
  if (data.system?.strength === 0) data.system.strength = null;
  if (data.system?.properties)
    data.system.properties = Object.fromEntries(
      Object.entries(data.system.properties).filter(([k, v]) => !k.startsWith("c_c_"))
    );
  if (typeof data.system?.price === "number") data.system.price = { denomination: "gc", value: data.system.price };

  // Remove mystery-man.svg from Actors
  if (["character", "npc", "starship"].includes(data.type) && data.img === "icons/svg/mystery-man.svg") {
    data.img = "";
    data.prototypeToken.texture.src = "";
  }

  if (data.effects) data.effects.forEach(i => cleanPackEntry(i, { clearSourceId: false }));
  if (data.items) data.items.forEach(i => cleanPackEntry(i, { clearSourceId: false }));
  if (data.pages) data.pages.forEach(i => cleanPackEntry(i, { ownership: -1 }));
  if (data.system?.description?.value) data.system.description.value = cleanString(data.system.description.value);
  if (data.label) data.label = cleanString(data.label);
  if (data.name) data.name = cleanString(data.name);
  data.sort = 0;
}

/**
 * Attempts to find an existing matching ID for an item of this name, otherwise generates a new unique ID.
 * @param {object} data        Data for the entry that needs an ID.
 * @param {string} pack        Name of the pack to which this item belongs.
 * @returns {Promise<string>}  Resolves once the ID is determined.
 */
function determineId(data, pack) {
  const db_path = path.join(PACK_DEST, `${pack}.db`);
  if (!DB_CACHE[db_path]) {
    DB_CACHE[db_path] = new Datastore({ filename: db_path, autoload: true });
    DB_CACHE[db_path].loadDatabase();
  }
  const db = DB_CACHE[db_path];

  return new Promise((resolve, reject) => {
    db.findOne({ name: data.name }, (err, entry) => {
      if (entry) {
        resolve(entry._id);
      } else {
        resolve(db.createNewId());
      }
    });
  });
}

/**
 * Removes invisible whitespace characters and normalises single- and double-quotes.
 * @param {string} str  The string to be cleaned.
 * @returns {string}    The cleaned string.
 */
function cleanString(str) {
  return str
    .replace(/\u2060/gu, "")
    .replace(/[‘’]/gu, "'")
    .replace(/[“”]/gu, '"');
}

/**
 * Cleans and formats source JSON files, removing unnecessary permissions and flags
 * and adding the proper spacing.
 *
 * - `gulp cleanPacks` - Clean all source JSON files.
 * - `gulp cleanPacks --pack classes` - Only clean the source files for the specified compendium.
 * - `gulp cleanPacks --pack classes --name Barbarian` - Only clean a single item from the specified compendium.
 */
function cleanPacks() {
  const packName = parsedArgs.pack;
  const entryName = parsedArgs.name?.toLowerCase();
  const folders = fs
    .readdirSync(PACK_SRC, { withFileTypes: true })
    .filter(file => file.isDirectory() && (!packName || packName === file.name));

  const packs = folders.map(folder => {
    logger.info(`Cleaning pack ${folder.name}`);
    return gulp.src(path.join(PACK_SRC, folder.name, "/**/*.json")).pipe(
      through2.obj(async (file, enc, callback) => {
        const json = JSON.parse(file.contents.toString());
        const name = json.name.toLowerCase();
        if (entryName && entryName !== name) return callback(null, file);
        cleanPackEntry(json);
        if (!json._id) json._id = await determineId(json, folder.name);
        fs.rmSync(file.path, { force: true });
        fs.writeFileSync(file.path, `${JSON.stringify(json, null, 2)}\n`, { mode: 0o664 });
        callback(null, file);
      })
    );
  });

  return mergeStream(packs);
}
export const clean = cleanPacks;

/* ----------------------------------------- */
/*  Compile Packs                            */
/* ----------------------------------------- */

/**
 * Compile the source JSON files into compendium packs.
 *
 * - `gulp compilePacks` - Compile all JSON files into their NEDB files.
 * - `gulp compilePacks --pack classes` - Only compile the specified pack.
 * - `gulp compilePacks --levelDB` - Compile files into levelDB files instead of NEDB.
 */
async function compilePacks() {
  const packName = parsedArgs.pack;
  const nedb = !parsedArgs.levelDB;
  // Determine which source folders to process
  const folders = fs
    .readdirSync(PACK_SRC, { withFileTypes: true })
    .filter(file => file.isDirectory() && (!packName || packName === file.name));

  for ( const folder of folders ) {
    const src = path.join(PACK_SRC, folder.name);
    const dest = path.join(PACK_DEST, nedb ? `${folder.name}.db` : `${folder.name}/`);
    logger.info(`Compiling pack ${folder.name}`);
    await compilePack(src, dest, { nedb, recursive: true, log: false, transformEntry: cleanPackEntry });
  }
}
export const compile = compilePacks;

/* ----------------------------------------- */
/*  Extract Packs                            */
/* ----------------------------------------- */

function sortObject(object) {
  //Thanks > http://whitfin.io/sorting-object-recursively-node-jsjavascript/
  if (!object) {
    return object;
  }

  const isArray = object instanceof Array;
  var sortedObj = {};
  if (isArray) {
    sortedObj = object.map(item => sortObject(item));
  } else {
    var keys = Object.keys(object);
    // console.log(keys);
    keys.sort(function (key1, key2) {
      (key1 = key1.toLowerCase()), (key2 = key2.toLowerCase());
      if (key1 < key2) return -1;
      if (key1 > key2) return 1;
      return 0;
    });

    for (var index in keys) {
      var key = keys[index];
      if (typeof object[key] == "object") {
        sortedObj[key] = sortObject(object[key]);
      } else {
        sortedObj[key] = object[key];
      }
    }
  }

  return sortedObj;
}

function transformName(entry, packName) {
  const name = entry.name.toLowerCase();
  const outputName = name.replace("'", "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+|-{2,}/g, "-");
  const subfolder = _getSubfolderName(entry, packName);
  return path.join(subfolder, `${outputName}.json`);
}

function checkChanges(entry, packName, dest) {
  const outputPath = (dest + "/" + transformName(entry, packName)).replace(/\\/g, "/");
  if (fs.existsSync(outputPath)) {
    const oldEntry = JSON.parse(fs.readFileSync(outputPath, { encoding: "utf8"}));
    // Do not update item if only changes are flags, stats, or advancement ids
    if (oldEntry._stats && entry._stats) oldEntry._stats = entry._stats;
    if (oldEntry.flags?.["sw5e-importer"] && entry.flags?.["sw5e-importer"]) oldEntry.flags["sw5e-importer"] = entry.flags["sw5e-importer"];
    if (oldEntry.system?.advancement && entry.system?.advancement) {
      const length = Math.min(oldEntry.system.advancement.length, entry.system.advancement.length);
      for (let i=0; i<length; i++) oldEntry.system.advancement[i]._id = entry.system.advancement[i]._id;
    }
    if (oldEntry.items && entry.items) {
      const length = Math.min(oldEntry.items.length, entry.items.length);
      for (let i=0; i<length; i++) {
        const oldItem = oldEntry.items[i];
        const newItem = entry.items[i];
        if (oldItem.flags?.["sw5e-importer"] && newItem.flags?.["sw5e-importer"]) oldItem.flags["sw5e-importer"] = newItem.flags["sw5e-importer"];
        if (oldItem.stats && newItem.stats) oldItem.stats = newItem.stats;
      }
    }
    const oldJson = JSON.stringify(sortObject(oldEntry));
    const newJson = JSON.stringify(sortObject(entry));
    return oldJson !== newJson;
  }
  return true;
}

/**
 * Extract the contents of compendium packs to JSON files.
 *
 * - `gulp extractPacks` - Extract all compendium NEDB files into JSON files.
 * - `gulp extractPacks --pack classes` - Only extract the contents of the specified compendium.
 * - `gulp extractPacks --pack classes --name Barbarian` - Only extract a single item from the specified compendium.
 * - `gulp extractPacks --levelDB` - Extracts levelDB files instead of NEDB.
 */
async function extractPacks() {
  const packName = parsedArgs.pack;
  const entryName = parsedArgs.name?.toLowerCase();
  const nedb = !parsedArgs.levelDB;
  // Load system.json.
  const system = JSON.parse(fs.readFileSync("./static/system.json", { encoding: "utf8" }));

  // Determine which source packs to process.
  const packs = fs.readdirSync(PACK_DEST, { withFileTypes: true }).filter(file => {
    if ( !file.isFile() || (path.extname(file.name) !== ".db") ) return false;
    return !packName || (packName === path.basename(file.name, ".db"));
  });

  for ( const pack of packs ) {
    const packName = path.basename(pack.name, ".db");
    const packInfo = system.packs.find(p => p.name === packName);
    const src = path.join(PACK_DEST, nedb ? pack.name : packName);
    const dest = path.join(PACK_SRC, packName);
    logger.info(`Extracting pack ${pack.name}`);
    await extractPack(src, dest, { nedb, log: false, documentType: packInfo.type, transformEntry: entry => {
      if ( entryName && (entryName !== entry.name.toLowerCase()) ) return false;
      cleanPackEntry(entry);
      if ( !checkChanges(entry, packName, dest) ) return false;
    }, transformName: entry => { return transformName(entry, packName)} });
  }
}
export const extract = extractPacks;

function deslugify(string) {
  return string.split("_").join(" ");
}

/**
 * Standardize name format.
 * @param {string} name
 * @returns {string}
 */
function slugify(name) {
  return name.toLowerCase().replace("'", "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+|-{2,}/g, "-");
}

/**
 * Determine a subfolder name based on which pack is being extracted.
 * @param {object} data  Data for the entry being extracted.
 * @param {string} pack  Name of the pack.
 * @returns {string}     Subfolder name the entry into which the entry should be created. An empty string if none.
 * @private
 */
function _getSubfolderName(data, pack) {
  const iID = data.flags["sw5e-importer"]?.uid ?? "";
  const iData = Object.fromEntries(`type-${iID}`.split(".").map(s => s.split("-")));
  let parts = new Set();

  switch (pack) {
    // Items
    case "adventuringgear":
    case "ammo":
    case "armor":
    case "blasters":
    case "lightweapons":
    case "enhanceditems":
    case "explosives":
    case "modification":
    case "starshipequipment":
    case "starshipmodifications":
    case "starshipweapons":
    case "vibroweapons":
      // foundry type
      if (["adventuringgear", "enhanceditems"].includes(pack)) parts.add(data.type);
      // item type
      parts.add(data.system?.type?.value);
      parts.add(data.system?.system?.value.toLowerCase());
      // item subtype
      parts.add(data.system?.type?.subtype);

      parts.delete(undefined);
      parts.delete("");
      parts.delete(pack);
      return [...parts].join("/");
    // 'classes'
    case "archetypes":
      return data.system.classIdentifier;
    // 'features'
    case "archetypefeatures":
    case "classfeatures":
    case "speciesfeatures":
    case "invocations":
      parts.add(data.system.type.subtype.slice(0, 10));
      parts.add(deslugify(iData.sourceName));
      parts.add(iData.level);

      parts.delete(undefined);
      parts.delete("");
      parts.delete(pack);
      parts.delete("None");
      return [...parts].join("/");
    case "feats":
    case "starshipactions":
      return data.system.type.subtype;
    case "deploymentfeatures":
      return data.system.deployment?.value;
    // powers
    case "forcepowers":
    case "techpowers":
      if (data.system?.level === undefined) return "";
      if (data.system.level === 0) return "at-will";
      return `level-${data.system.level}`;
    case "maneuver":
      return data.system.maneuverType;
    // actors
    case "fistorcodex":
    case "monsters":
    case "monsters_temp":
      return data.system.details.type.value;
    // other
    case "monstertraits":
      return data.system?.type?.value ?? data.type;

    default:
      return "";
  }
}
