import fs from "fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import logger from "fancy-log";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

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

// eslint-disable-next-line
const argv = yargs(hideBin(process.argv))
  .command(packageCommand())
  .help().alias("help", "h")
  .argv;


// eslint-disable-next-line
function packageCommand() {
  return {
    command: "package [action] [pack] [entry]",
    describe: "Manage packages",
    builder: yargs => {
      yargs.positional("action", {
        describe: "The action to perform.",
        type: "string",
        choices: ["unpack", "pack", "clean"]
      });
      yargs.positional("pack", {
        describe: "Name of the pack upon which to work.",
        type: "string"
      });
      yargs.positional("entry", {
        describe: "Name of any entry within a pack upon which to work. Only applicable to extract & clean commands.",
        type: "string"
      });
    },
    handler: async argv => {
      const { action, pack, entry } = argv;
      switch ( action ) {
        case "clean":
          return await cleanPacks(pack, entry);
        case "pack":
          return await compilePacks(pack);
        case "unpack":
          return await extractPacks(pack, entry);
      }
    }
  };
}


/* ----------------------------------------- */
/*  Clean Packs                              */
/* ----------------------------------------- */

/**
 * Removes unwanted flags, permissions, and other data from entries before extracting or compiling.
 * @param {object} data                           Data for a single entry to clean.
 * @param {object} [options={}]
 * @param {boolean} [options.clearSourceId=true]  Should the core sourceId flag be deleted.
 * @param {number} [options.ownership=0]          Value to reset default ownership to.
 */
function cleanPackEntry(data, { clearSourceId=true, ownership=0 }={}) {
  if ( data.ownership ) data.ownership = { default: ownership };
  if ( clearSourceId ) {
    delete data._stats?.compendiumSource;
    delete data.flags?.core?.sourceId;
  }
  delete data.flags?.importSource;
  delete data.flags?.exportSource;
  delete data.system?.consume?.ammount;
  delete data.flags?.dae;
  delete data.flags?.["midi-qol"];
  delete data.flags?.["midi-properties"];
  delete data.flags?.["midiProperties"];
  delete data.flags?.["betterrollssw5e"];
  delete data.flags?.["betterRollssw5e"];
  delete data.flags?.sw5e?.persistSourceMigration;
  if ( data._stats?.lastModifiedBy ) data._stats.lastModifiedBy = "sw5ebuilder00000";

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
  if ( data.system?.properties && !( data.system.properties instanceof Array ) ) {
    if ( Object.keys(data.system.properties)[0] == 0 ) {
      data.system.properties = Object.values(data.system.properties);
    } else {
      data.system.properties = Object.entries(data.system.properties).filter(([k, v]) => v).map(([k, v]) => k);
    }
  }
  if ( data.system?.properties ) data.system.properties = data.system.properties.filter(k => !k.startsWith("c_c_"));
  if (typeof data.system?.price === "number") data.system.price = { denomination: "gc", value: data.system.price };


  // Remove mystery-man.svg from Actors
  if ( ["character", "npc", "starship"].includes(data.type) && data.img === "icons/svg/mystery-man.svg" ) {
    data.img = "";
    data.prototypeToken.texture.src = "";
  }

  if ( data.effects ) data.effects.forEach(i => cleanPackEntry(i, { clearSourceId: false }));
  if ( data.items ) data.items.forEach(i => cleanPackEntry(i, { clearSourceId: false }));
  if ( data.pages ) data.pages.forEach(i => cleanPackEntry(i, { ownership: -1 }));
  if ( data.system?.description?.value ) data.system.description.value = cleanString(data.system.description.value);
  if ( data.label ) data.label = cleanString(data.label);
  if ( data.name ) data.name = cleanString(data.name);
}


/**
 * Removes invisible whitespace characters and normalizes single- and double-quotes.
 * @param {string} str  The string to be cleaned.
 * @returns {string}    The cleaned string.
 */
function cleanString(str) {
  return str.replace(/\u2060/gu, "").replace(/[‘’]/gu, "'").replace(/[“”]/gu, '"');
}


/**
 * Cleans and formats source JSON files, removing unnecessary permissions and flags and adding the proper spacing.
 * @param {string} [packName]   Name of pack to clean. If none provided, all packs will be cleaned.
 * @param {string} [entryName]  Name of a specific entry to clean.
 *
 * - `npm run build:clean` - Clean all source JSON files.
 * - `npm run build:clean -- classes` - Only clean the source files for the specified compendium.
 * - `npm run build:clean -- classes Barbarian` - Only clean a single item from the specified compendium.
 */
async function cleanPacks(packName, entryName) {
  entryName = entryName?.toLowerCase();
  const folders = fs.readdirSync(PACK_SRC, { withFileTypes: true }).filter(file =>
    file.isDirectory() && ( !packName || (packName === file.name) )
  );

  /**
   * Walk through directories to find JSON files.
   * @param {string} directoryPath
   * @yields {string}
   */
  async function* _walkDir(directoryPath) {
    const directory = await readdir(directoryPath, { withFileTypes: true });
    for ( const entry of directory ) {
      const entryPath = path.join(directoryPath, entry.name);
      if ( entry.isDirectory() ) yield* _walkDir(entryPath);
      else if ( path.extname(entry.name) === ".json" ) yield entryPath;
    }
  }

  for ( const folder of folders ) {
    logger.info(`Cleaning pack ${folder.name}`);
    for await ( const src of _walkDir(path.join(PACK_SRC, folder.name)) ) {
      const json = JSON.parse(await readFile(src, { encoding: "utf8" }));
      if ( entryName && (entryName !== json.name.toLowerCase()) ) continue;
      if ( !json._id || !json._key ) {
        console.log(`Failed to clean \x1b[31m${src}\x1b[0m, must have _id and _key.`);
        continue;
      }
      cleanPackEntry(json);
      fs.rmSync(src, { force: true });
      writeFile(src, `${JSON.stringify(json, null, 2)}\n`, { mode: 0o664 });
    }
  }
}


/* ----------------------------------------- */
/*  Compile Packs                            */
/* ----------------------------------------- */

/**
 * Compile the source JSON files into compendium packs.
 * @param {string} [packName]       Name of pack to compile. If none provided, all packs will be packed.
 *
 * - `npm run build:db` - Compile all JSON files into their LevelDB files.
 * - `npm run build:db -- classes` - Only compile the specified pack.
 */
async function compilePacks(packName) {
  // Determine which source folders to process
  const folders = fs.readdirSync(PACK_SRC, { withFileTypes: true }).filter(file =>
    file.isDirectory() && ( !packName || (packName === file.name) )
  );

  for ( const folder of folders ) {
    const src = path.join(PACK_SRC, folder.name);
    const dest = path.join(PACK_DEST, folder.name);
    logger.info(`Compiling pack ${folder.name}`);
    await compilePack(src, dest, { recursive: true, log: true, transformEntry: cleanPackEntry });
  }
}


/* ----------------------------------------- */
/*  Extract Packs                            */
/* ----------------------------------------- */

/**
 * Extract the contents of compendium packs to JSON files.
 * @param {string} [packName]       Name of pack to extract. If none provided, all packs will be unpacked.
 * @param {string} [entryName]      Name of a specific entry to extract.
 *
 * - `npm build:json - Extract all compendium LevelDB files into JSON files.
 * - `npm build:json -- classes` - Only extract the contents of the specified compendium.
 * - `npm build:json -- classes Barbarian` - Only extract a single item from the specified compendium.
 */
async function extractPacks(packName, entryName) {
  entryName = entryName?.toLowerCase();

  // Load system.json.
  const system = JSON.parse(fs.readFileSync("./static/system.json", { encoding: "utf8" }));

  // Determine which source packs to process.
  const packs = system.packs.filter(p => !packName || p.name === packName);

  for ( const packInfo of packs ) {
    logger.info(`Extracting pack ${packInfo.name}`);
    const dest = path.join(PACK_SRC, packInfo.name);
    const src = path.join("./dist/", packInfo.path ?? "");

    // const folders = {};
    // const containers = {};
    // await extractPack(packInfo.path, dest, {
    //   log: false, transformEntry: e => {
    //     if ( e._key.startsWith("!folders") ) folders[e._id] = { name: slugify(e.name), folder: e.folder };
    //     else if ( e.type === "container" ) containers[e._id] = {
    //       name: slugify(e.name), container: e.system?.container, folder: e.folder
    //     };
    //     return false;
    //   }
    // });
    // const buildPath = (collection, entry, parentKey) => {
    //   let parent = collection[entry[parentKey]];
    //   entry.path = entry.name;
    //   while ( parent ) {
    //     entry.path = path.join(parent.name, entry.path);
    //     parent = collection[parent[parentKey]];
    //   }
    // };

    // Object.values(folders).forEach(f => buildPath(folders, f, "folder"));
    // Object.values(containers).forEach(c => {
    //   buildPath(containers, c, "container");
    //   const folder = folders[c.folder];
    //   if ( folder ) c.path = path.join(folder.path, c.path);
    // });

    // const transformName = entry => {
    //   if ( entry._id in folders ) return path.join(folders[entry._id].path, "_folder.json");
    //   if ( entry._id in containers ) return path.join(containers[entry._id].path, "_container.json");
    //   const outputName = slugify(entry.name);
    //   const parent = containers[entry.system?.container] ?? folders[entry.folder];
    //   const dest = path.join(parent?.path ?? "", `${outputName}.json`);
    //   return dest;
    // }

    await extractPack(src, dest, {
      log: false, transformEntry: entry => {
        if ( entryName && (entryName !== entry.name.toLowerCase()) ) return false;
        cleanPackEntry(entry);
        const name = path.join(dest, transformName(entry, packInfo.name)) + ".json";
        if (!checkChanges(entry, name)) return false;
      }, transformName: entry => transformName(entry, packInfo.name) + ".json"
    });
  }
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
 * Sort an object's keys.
 * @param {object} obj
 * @returns {object}
 */
function sortObject(obj) {
  //Thanks > http://whitfin.io/sorting-object-recursively-node-jsjavascript/
  if (!obj) return obj;

  const isArray = obj instanceof Array;
  var sortedObj = {};
  if (isArray) {
    sortedObj = obj.map(item => sortObject(item));
  } else {
    var keys = Object.keys(obj);
    // console.log(keys);
    keys.sort(function (key1, key2) {
      (key1 = key1.toLowerCase()), (key2 = key2.toLowerCase());
      if (key1 < key2) return -1;
      if (key1 > key2) return 1;
      return 0;
    });

    for (var index in keys) {
      var key = keys[index];
      if (typeof obj[key] == "obj") {
        sortedObj[key] = sortObject(obj[key]);
      } else {
        sortedObj[key] = obj[key];
      }
    }
  }

  return sortedObj;
}

/**
 * Checks if there are meaningful changes in an entry.
 * @param {object} entry
 * @param {string} dest
 * @returns {boolean}
 */
function checkChanges(entry, dest) {
  if (fs.existsSync(dest)) {
    const oldEntry = JSON.parse(fs.readFileSync(dest, { encoding: "utf8" }));
    // Do not update item if only changes are flags, stats, or advancement ids
    if (oldEntry._stats && entry._stats) oldEntry._stats = entry._stats;
    if (oldEntry.flags?.["sw5e-importer"] && entry.flags?.["sw5e-importer"]) oldEntry.flags["sw5e-importer"] = entry.flags["sw5e-importer"];
    if (oldEntry.system?.advancement && entry.system?.advancement) {
      const length = Math.min(oldEntry.system.advancement.length, entry.system.advancement.length);
      for (let i = 0; i < length; i++) oldEntry.system.advancement[i]._id = entry.system.advancement[i]._id;
    }
    if (oldEntry.items && entry.items) {
      const length = Math.min(oldEntry.items.length, entry.items.length);
      for (let i = 0; i < length; i++) {
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

function transformName(entry, packName) {
  const iID = entry.flags["sw5e-importer"]?.uid ?? "";
  const iData = Object.fromEntries(`type-${iID}`.split(".").map(s => s.split("-")));
  let parts = new Set();

  let subfolder = "";

  switch (packName) {
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
      if (["adventuringgear", "enhanceditems"].includes(packName)) parts.add(entry.type);
      // item type
      if (entry.type !== "loot") parts.add(entry.system?.type?.value?.toLowerCase());
      // item subtype
      parts.add(entry.system?.type?.subtype);

      parts.delete(undefined);
      parts.delete("");
      parts.delete(packName);
      if (packName.endsWith("s")) parts.delete(packName.substring(0, packName.length-1));
      subfolder = [...parts].join("/");
      break;
    // 'classes'
    case "archetypes":
      subfolder = entry.system.classIdentifier;
      break;
    // 'features'
    case "archetypefeatures":
    case "classfeatures":
    case "speciesfeatures":
    case "invocations":
      parts.add(entry.system.type.subtype.slice(0, 10));
      parts.add(deslugify(iData.sourceName));
      parts.add(iData.level);

      parts.delete(undefined);
      parts.delete("");
      parts.delete(packName);
      parts.delete("None");
      subfolder = [...parts].join("/");
      break;
    case "feats":
    case "starshipactions":
      subfolder = entry.system.type.subtype;
      break;
    case "deploymentfeatures":
      subfolder = entry.system.requirements.split(" ")[0];
      break;
    // powers
    case "forcepowers":
    case "techpowers":
      if (entry.system?.level === undefined) subfolder = "";
      else if (entry.system.level === 0) subfolder = "at-will";
      else subfolder = `level-${entry.system.level}`;
      break;
    case "maneuver":
      subfolder = entry.system.type.value;
      break;
    // actors
    case "fistorcodex":
    case "monsters":
    case "monsters_temp":
      subfolder = entry.system.details.type.value;
      break;
    // other
    case "monstertraits":
      subfolder = entry.system?.type?.value ?? entry.type;
      break;
    default:
      subfolder = "";
  }

  return path.join(subfolder ?? "", slugify(entry.name));
}

function deslugify(string) {
  return string.split("_").join(" ");
}
