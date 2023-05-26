import Datastore from "nedb";
import fs from "fs";
import gulp from "gulp";
import logger from "fancy-log";
import mergeStream from "merge-stream";
import path from "path";
import through2 from "through2";
import yargs from "yargs";


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
/*  Clean Packs
/* ----------------------------------------- */

/**
 * Removes unwanted flags, permissions, and other data from entries before extracting or compiling.
 * @param {object} data  Data for a single entry to clean.
 * @param {object} [options]
 * @param {boolean} [options.clearSourceId]  Should the core sourceId flag be deleted.
 */
function cleanPackEntry(data, { clearSourceId=true }={}) {
  if ( data.ownership ) data.ownership = { default: 0 };
  if ( clearSourceId ) delete data.flags?.core?.sourceId;
  delete data.flags?.importSource;
  delete data.flags?.exportSource;
  if ( data._stats?.lastModifiedBy ) data._stats.lastModifiedBy = "sw5ebuilder0000";

  // Remove empty entries in flags
  if ( !data.flags ) data.flags = {};
  Object.entries(data.flags).forEach(([key, contents]) => {
    if ( Object.keys(contents).length === 0 ) delete data.flags[key];
  });

  if ( data.system?.activation?.cost === 0 ) data.system.activation.cost = null;
  if ( data.system?.duration?.value === "0" ) data.system.duration.value = "";
  if ( data.system?.target?.value === 0 ) data.system.target.value = null;
  if ( data.system?.target?.width === 0 ) data.system.target.width = null;
  if ( data.system?.range?.value === 0 ) data.system.range.value = null;
  if ( data.system?.range?.long === 0 ) data.system.range.long = null;
  if ( data.system?.uses?.value === 0 ) data.system.uses.value = null;
  if ( data.system?.uses?.max === "0" ) data.system.duration.value = "";
  if ( data.system?.save?.dc === 0 ) data.system.save.dc = null;
  if ( data.system?.capacity?.value === 0 ) data.system.capacity.value = null;
  if ( data.system?.strength === 0 ) data.system.strength = null;
  if ( data.system?.properties ) data.system.properties = Object.fromEntries(Object.entries(data.system.properties).filter(([k,v])=>!k.startsWith('c_c_')));
  if ( typeof data.system?.price === "number" ) data.system.price = { denomination: "gc", value: data.system.price };

  // Remove mystery-man.svg from Actors
  if ( ["character", "npc", "starship"].includes(data.type) && data.img === "icons/svg/mystery-man.svg" ) {
    data.img = "";
    data.prototypeToken.texture.src = "";
  }

  if ( data.effects ) data.effects.forEach(i => cleanPackEntry(i, { clearSourceId: false }));
  if ( data.items ) data.items.forEach(i => cleanPackEntry(i, { clearSourceId: false }));
  if ( data.system?.description?.value ) data.system.description.value = cleanString(data.system.description.value);
  if ( data.label ) data.label = cleanString(data.label);
  if ( data.name ) data.name = cleanString(data.name);
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
  if ( !DB_CACHE[db_path] ) {
    DB_CACHE[db_path] = new Datastore({ filename: db_path, autoload: true });
    DB_CACHE[db_path].loadDatabase();
  }
  const db = DB_CACHE[db_path];

  return new Promise((resolve, reject) => {
    db.findOne({ name: data.name }, (err, entry) => {
      if ( entry ) {
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
  return str.replace(/\u2060/gu, "").replace(/[‘’]/gu, "'").replace(/[“”]/gu, '"');
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
  const folders = fs.readdirSync(PACK_SRC, { withFileTypes: true }).filter(file =>
    file.isDirectory() && ( !packName || (packName === file.name) )
  );

  const packs = folders.map(folder => {
    logger.info(`Cleaning pack ${folder.name}`);
    return gulp.src(path.join(PACK_SRC, folder.name, "/**/*.json"))
      .pipe(through2.obj(async (file, enc, callback) => {
        const json = JSON.parse(file.contents.toString());
        const name = json.name.toLowerCase();
        if ( entryName && (entryName !== name) ) return callback(null, file);
        cleanPackEntry(json);
        if ( !json._id ) json._id = await determineId(json, folder.name);
        fs.rmSync(file.path, { force: true });
        fs.writeFileSync(file.path, `${JSON.stringify(json, null, 2)}\n`, { mode: 0o664 });
        callback(null, file);
      }));
  });

  return mergeStream(packs);
}
export const clean = cleanPacks;


/* ----------------------------------------- */
/*  Compile Packs
/* ----------------------------------------- */

/**
 * Compile the source JSON files into compendium packs.
 *
 * - `gulp compilePacks` - Compile all JSON files into their NEDB files.
 * - `gulp compilePacks --pack classes` - Only compile the specified pack.
 */
function compilePacks() {
  const packName = parsedArgs.pack;
  // Determine which source folders to process
  const folders = fs.readdirSync(PACK_SRC, { withFileTypes: true }).filter(file =>
    file.isDirectory() && ( !packName || (packName === file.name) )
  );

  const packs = folders.map(folder => {
    const filePath = path.join(PACK_DEST, `${folder.name}.db`);
    fs.rmSync(filePath, { force: true });
    fs.mkdirSync(PACK_DEST, { recursive: true });
    const db = fs.createWriteStream(filePath, { flags: "a", mode: 0o664 });
    const data = [];
    logger.info(`Compiling pack ${folder.name}`);
    return gulp.src(path.join(PACK_SRC, folder.name, "/**/*.json"))
      .pipe(through2.obj((file, enc, callback) => {
        const json = JSON.parse(file.contents.toString());
        cleanPackEntry(json);
        data.push(json);
        callback(null, file);
      }, callback => {
        data.sort((lhs, rhs) => lhs._id > rhs._id ? 1 : -1);
        data.forEach(entry => db.write(`${JSON.stringify(entry)}\n`));
        callback();
      }));
  });
  return mergeStream(packs);
}
export const compile = compilePacks;


/* ----------------------------------------- */
/*  Extract Packs
/* ----------------------------------------- */

/**
 * Extract the contents of compendium packs to JSON files.
 *
 * - `gulp extractPacks` - Extract all compendium NEDB files into JSON files.
 * - `gulp extractPacks --pack classes` - Only extract the contents of the specified compendium.
 * - `gulp extractPacks --pack classes --name Barbarian` - Only extract a single item from the specified compendium.
 */
function extractPacks() {
  const packName = parsedArgs.pack ?? "*";
  const entryName = parsedArgs.name?.toLowerCase();
  const packs = gulp.src(`${PACK_DEST}/**/${packName}.db`)
    .pipe(through2.obj((file, enc, callback) => {
      const filename = path.parse(file.path).name;
      const folder = path.join(PACK_SRC, filename);
      if ( !fs.existsSync(folder) ) fs.mkdirSync(folder, { recursive: true, mode: 0o775 });

      const db = new Datastore({ filename: file.path, autoload: true });
      db.loadDatabase();

      db.find({}, (err, entries) => {
        entries.forEach(entry => {
          const name = entry.name.toLowerCase();
          if ( entryName && (entryName !== name) ) return;
          cleanPackEntry(entry);

          const subfolder = path.join(folder, _getSubfolderName(entry, filename) ?? "");
          if ( !fs.existsSync(subfolder) ) fs.mkdirSync(subfolder, { recursive: true, mode: 0o775 });

          const outputName = name.replace("'", "").replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+|-{2,}/g, "-");
          const outputPath = path.join(subfolder, `${outputName}.json`);

          let hasChanges = true;
          if (fs.existsSync(outputPath)) {
            const oldFile = JSON.parse(fs.readFileSync(outputPath, { encoding: "utf8"}));
            // Do not update item if only changes are flags, stats, or advancement ids
            if (oldFile._stats && entry._stats) oldFile._stats = entry._stats;
            if (oldFile.flags?.["sw5e-importer"] && entry.flags?.["sw5e-importer"]) oldFile.flags["sw5e-importer"] = entry.flags["sw5e-importer"];
            if (oldFile.system?.advancement && entry.system?.advancement) {
              const length = Math.min(oldFile.system.advancement.length, entry.system.advancement.length);
              for (let i=0; i<length; i++) oldFile.system.advancement[i]._id = entry.system.advancement[i]._id;
            }
            if (oldFile.items && entry.items) {
              const length = Math.min(oldFile.items.length, entry.items.length);
              for (let i=0; i<length; i++) {
                const oldItem = oldFile.items[i];
                const newItem = entry.items[i];
                if (oldItem.flags?.["sw5e-importer"] && newItem.flags?.["sw5e-importer"]) oldItem.flags["sw5e-importer"] = newItem.flags["sw5e-importer"];
                if (oldItem.stats && newItem.stats) oldItem.stats = newItem.stats;
              }
            }
            hasChanges = JSON.stringify(entry) !== JSON.stringify(oldFile);
          }

          if (hasChanges) {
            const output = `${JSON.stringify(entry, null, 2)}\n`;
            fs.writeFileSync(outputPath, output, { mode: 0o664 });
          }
        });
      });

      logger.info(`Extracting pack ${filename}`);
      callback(null, file);
    }));

  return mergeStream(packs);
}
export const extract = extractPacks;


function deslugify(string) {
  return string.split("_").join(" ");
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
  const iData = Object.fromEntries(`type-${iID}`.split('.').map(s=>s.split('-')));
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
      parts.add(data.system?.armor?.type);
      parts.add(data.system?.consumableType);
      parts.add(data.system?.weaponType);
      parts.add(data.system?.modificationType);
      parts.add(data.system?.type?.value);
      parts.add(data.system?.system?.value.toLowerCase());
      // item subtype
      parts.add(data.system?.ammoType);
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
      if ( data.system?.level === undefined ) return "";
      if ( data.system.level === 0 ) return "at-will";
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
      return data.system?.weaponType ?? data.system?.type?.value ?? data.type;

    default: return "";
  }
}
