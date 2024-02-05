import * as advancement from "./documents/advancement/_module.mjs";
import { preLocalize } from "./utils.mjs";

// Namespace SW5e Configuration Values
const SW5E = {};

// ASCII Artwork
SW5E.ASCII = `
 ___________      ___________       
/   _____/  \\    /  \\   ____/ ____  
\\_____  \\\\   \\/\\/   /____  \\_/ __ \\ 
/        \\\\        //       \\  ___/ 
\\______  / \\__/\\  //______  /\\__  >
       \\/       \\/        \\/    \\/ `;

/* -------------------------------------------- */

/**
 * Configuration data for abilities.
 *
 * @typedef {object} AbilityConfiguration
 * @property {string} label                               Localized label.
 * @property {string} abbreviation                        Localized abbreviation.
 * @property {string} fullKey                             Fully written key used as alternate for enrichers.
 * @property {string} [reference]                         Reference to a rule page describing this ability.
 * @property {string} [type]                              Whether this is a "physical" or "mental" ability.
 * @property {Object<string, number|string>}  [defaults]  Default values for this ability based on actor type.
 *                                                        If a string is used, the system will attempt to fetch.
 *                                                        the value of the specified ability.
 */

/**
 * The set of Ability Scores used within the system.
 * @enum {AbilityConfiguration}
 */
SW5E.abilities = {
  str: {
    label: "SW5E.AbilityStr",
    abbreviation: "SW5E.AbilityStrAbbr",
    type: "physical",
    fullKey: "strength",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.nUPv6C66Ur64BIUH"
  },
  dex: {
    label: "SW5E.AbilityDex",
    abbreviation: "SW5E.AbilityDexAbbr",
    type: "physical",
    fullKey: "dexterity",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ER8CKDUWLsFXuARJ"
  },
  con: {
    label: "SW5E.AbilityCon",
    abbreviation: "SW5E.AbilityConAbbr",
    type: "physical",
    fullKey: "constitution",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.MpA4jnwD17Q0RPg7"
  },
  int: {
    label: "SW5E.AbilityInt",
    abbreviation: "SW5E.AbilityIntAbbr",
    type: "mental",
    fullKey: "intelligence",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.WzWWcTIppki35YvF",
    defaults: { vehicle: 0 }
  },
  wis: {
    label: "SW5E.AbilityWis",
    abbreviation: "SW5E.AbilityWisAbbr",
    type: "mental",
    fullKey: "wisdom",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.v3IPyTtqvXqN934s",
    defaults: { vehicle: 0 }
  },
  cha: {
    label: "SW5E.AbilityCha",
    abbreviation: "SW5E.AbilityChaAbbr",
    type: "mental",
    fullKey: "charisma",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9FyghudYFV5QJOuG",
    defaults: { vehicle: 0 }
  },
  hon: {
    label: "SW5E.AbilityHon",
    abbreviation: "SW5E.AbilityHonAbbr",
    type: "mental",
    fullKey: "honor",
    defaults: { npc: "cha", vehicle: 0 },
    improvement: false
  },
  san: {
    label: "SW5E.AbilitySan",
    abbreviation: "SW5E.AbilitySanAbbr",
    type: "mental",
    fullKey: "sanity",
    defaults: { npc: "wis", vehicle: 0 },
    improvement: false
  }
};
preLocalize("abilities", { keys: ["label", "abbreviation"] });

/**
 * Configure which ability score is used as the default modifier for initiative rolls.
 * @type {string}
 */
SW5E.initiativeAbility = "dex";

/**
 * Configure which ability score is used when calculating hit points per level.
 * @type {string}
 */
SW5E.hitPointsAbility = "con";

/**
 * Configure which ability score is used when calculating hull points.
 * @type {string}
 */
SW5E.hullPointsAbility = "con";

/**
 * Configure which ability score is used when calculating shield points.
 * @type {string}
 */
SW5E.shieldPointsAbility = "str";

/* -------------------------------------------- */

/**
 * Configuration data for skills.
 *
 * @typedef {object} SkillConfiguration
 * @property {string} label        Localized label.
 * @property {string} ability      Key for the default ability used by this skill.
 * @property {string} fullKey      Fully written key used as alternate for enrichers.
 * @property {string} [reference]  Reference to a rule page describing this skill.
 */

/**
 * The set of skills which can be trained by characters with their default ability scores.
 * @enum {SkillConfiguration}
 */
SW5E.skills = {
  acr: {
    label: "SW5E.SkillAcr",
    ability: "dex",
    fullKey: "acrobatics",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.AvvBLEHNl7kuwPkN",
    icon: "icons/equipment/feet/shoes-simple-leaf-green.webp"
  },
  ani: {
    label: "SW5E.SkillAni",
    ability: "wis",
    fullKey: "animalHandling",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.xb3MCjUvopOU4viE",
    icon: "icons/environment/creatures/horse-brown.webp"
  },
  ath: {
    label: "SW5E.SkillAth",
    ability: "str",
    fullKey: "athletics",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.rIR7ttYDUpH3tMzv",
    icon: "icons/magic/control/buff-strength-muscle-damage-orange.webp"
  },
  dec: {
    label: "SW5E.SkillDec",
    ability: "cha",
    fullKey: "deception",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.mqVZ2fz0L7a9VeKJ",
    icon: "icons/magic/control/mouth-smile-deception-purple.webp"
  },
  ins: {
    label: "SW5E.SkillIns",
    ability: "wis",
    fullKey: "insight",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.8R5SMbAGbECNgO8z",
    icon: "icons/magic/perception/orb-crystal-ball-scrying-blue.webp"
  },
  itm: {
    label: "SW5E.SkillItm",
    ability: "cha",
    fullKey: "intimidation",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.4VHHI2gJ1jEsppfg",
    icon: "icons/skills/social/intimidation-impressing.webp"
  },
  inv: {
    label: "SW5E.SkillInv",
    ability: "int",
    fullKey: "investigation",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.Y7nmbQAruWOs7WRM",
    icon: "icons/tools/scribal/magnifying-glass.webp"
  },
  lor: {
    label: "SW5E.SkillLor",
    ability: "int",
    fullKey: "lore",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.kRBZbdWMGW9K3wdY",
    icon: "icons/sundries/books/book-embossed-bound-brown.webp"
  },
  med: {
    label: "SW5E.SkillMed",
    ability: "wis",
    fullKey: "medicine",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.GeYmM7BVfSCAga4o",
    icon: "icons/tools/cooking/mortar-herbs-yellow.webp"
  },
  nat: {
    label: "SW5E.SkillNat",
    ability: "int",
    fullKey: "nature",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ueMx3uF2PQlcye31",
    icon: "icons/magic/nature/plant-sprout-snow-green.webp"
  },
  prc: {
    label: "SW5E.SkillPrc",
    ability: "wis",
    fullKey: "perception",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.zjEeHCUqfuprfzhY",
    icon: "icons/magic/perception/eye-ringed-green.webp"
  },
  prf: {
    label: "SW5E.SkillPrf",
    ability: "cha",
    fullKey: "performance",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hYT7Z06yDNBcMtGe",
    icon: "icons/tools/instruments/lute-gold-brown.webp"
  },
  per: {
    label: "SW5E.SkillPer",
    ability: "cha",
    fullKey: "persuasion",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.4R5H8iIsdFQTsj3X",
    icon: "icons/skills/social/diplomacy-handshake.webp"
  },
  pil: {
    label: "SW5E.SkillPil",
    ability: "int",
    fullKey: "pilloting",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.CXVzERHdP4qLhJXM",
    icon: "icons/magic/holy/saint-glass-portrait-halo.webp"
  },
  slt: {
    label: "SW5E.SkillSlt",
    ability: "dex",
    fullKey: "sleightOfHand",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.yg6SRpGNVz9nDW0A",
    icon: "icons/sundries/gaming/playing-cards.webp"
  },
  ste: {
    label: "SW5E.SkillSte",
    ability: "dex",
    fullKey: "stealth",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.4MfrpERNiQXmvgCI",
    icon: "icons/magic/perception/shadow-stealth-eyes-purple.webp"
  },
  sur: {
    label: "SW5E.SkillSur",
    ability: "wis",
    fullKey: "survival",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.t3EzDU5b9BVAIEVi",
    icon: "icons/magic/fire/flame-burning-campfire-yellow-blue.webp"
  },
  tec: {
    label: "SW5E.SkillTec",
    ability: "int",
    fullKey: "technology",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.h3bYSPge8IOqne1N",
    icon: "icons/sundries/books/book-embossed-jewel-silver-green.webp"
  }
};
preLocalize("skills", { key: "label", sort: true });

/**
 * The set of skills which can be trained on starships with their default ability scores.
 * @enum {SkillConfiguration}
 */
SW5E.starshipSkills = {
  ast: { label: "SW5E.StarshipSkillAst", ability: "int", fullKey: "astrogation" },
  bst: { label: "SW5E.StarshipSkillBst", ability: "str", fullKey: "boost" },
  dat: { label: "SW5E.StarshipSkillDat", ability: "int", fullKey: "data" },
  hid: { label: "SW5E.StarshipSkillHid", ability: "dex", fullKey: "hide" },
  imp: { label: "SW5E.StarshipSkillImp", ability: "cha", fullKey: "impress" },
  inf: { label: "SW5E.StarshipSkillInf", ability: "cha", fullKey: "interfere" },
  man: { label: "SW5E.StarshipSkillMan", ability: "dex", fullKey: "maneuvering" },
  men: { label: "SW5E.StarshipSkillMen", ability: "cha", fullKey: "menace" },
  pat: { label: "SW5E.StarshipSkillPat", ability: "con", fullKey: "patch" },
  prb: { label: "SW5E.StarshipSkillPrb", ability: "int", fullKey: "probe" },
  ram: { label: "SW5E.StarshipSkillRam", ability: "str", fullKey: "ram" },
  reg: { label: "SW5E.StarshipSkillReg", ability: "con", fullKey: "regulation" },
  scn: { label: "SW5E.StarshipSkillScn", ability: "wis", fullKey: "scan" },
  swn: { label: "SW5E.StarshipSkillSwn", ability: "cha", fullKey: "swindle" }
};
preLocalize("starshipSkills", { key: "label", sort: true });

/**
 * The set of skills which can be trained by characters or starships with their default ability scores.
 * @enum {SkillConfiguration}
 */
SW5E.allSkills = {
  ...SW5E.skills,
  ...SW5E.starshipSkills
};

/* -------------------------------------------- */

/**
 * Character alignment options.
 * @enum {string}
 */
SW5E.alignments = {
  ll: "SW5E.AlignmentLL",
  nl: "SW5E.AlignmentNL",
  cl: "SW5E.AlignmentCL",
  lb: "SW5E.AlignmentLB",
  bn: "SW5E.AlignmentBN",
  cb: "SW5E.AlignmentCB",
  ld: "SW5E.AlignmentLD",
  nd: "SW5E.AlignmentND",
  cd: "SW5E.AlignmentCD"
};
preLocalize("alignments");

/* -------------------------------------------- */

/**
 * An enumeration of item attunement types.
 * @enum {number}
 */
SW5E.attunementTypes = {
  NONE: 0,
  REQUIRED: 1,
  ATTUNED: 2
};

/**
 * An enumeration of item attunement states.
 * @type {{"0": string, "1": string, "2": string}}
 */
SW5E.attunements = {
  0: "SW5E.AttunementNone",
  1: "SW5E.AttunementRequired",
  2: "SW5E.AttunementAttuned"
};
preLocalize("attunements");

/* -------------------------------------------- */

/**
 * General weapon categories.
 * @enum {string}
 */
SW5E.weaponProficiencies = {
  imp: "SW5E.WeaponImprovisedProficiency",
  exb: "SW5E.WeaponExoticBlasterProficiency",
  elw: "SW5E.WeaponExoticLightweaponProficiency",
  evw: "SW5E.WeaponExoticVibroweaponProficiency",
  mrb: "SW5E.WeaponMartialBlasterProficiency",
  mlw: "SW5E.WeaponMartialLightweaponProficiency",
  mvb: "SW5E.WeaponMartialVibroweaponProficiency",
  ntl: "SW5E.WeaponNaturalProficiency",
  smb: "SW5E.WeaponSimpleBlasterProficiency",
  slw: "SW5E.WeaponSimpleLightweaponProficiency",
  svb: "SW5E.WeaponSimpleVibroweaponProficiency"
};
preLocalize("weaponProficiencies");

/**
 * A mapping between `SW5E.weaponTypes` and `SW5E.weaponProficiencies` that
 * is used to determine if character has proficiency when adding an item.
 * @enum {(boolean|string)}
 */
SW5E.weaponProficienciesMap = {
  simpleB: "smb",
  simpleLW: "slw",
  simpleVW: "svb",
  martialB: "mrb",
  martialLW: "mlw",
  martialVW: "mvb",
  exoticB: "exb",
  exoticLW: "elw",
  exoticVW: "evw"
};

/**
 * The basic weapon types in sw5e. This enables specific weapon proficiencies or
 * starting equipment provided by classes and backgrounds.
 * @enum {string}
 **/
SW5E.weaponIds = {
  grenadelauncher: "sw5e.blasters.1PtYUVAzIi5e2x4H",
  lightpistol: "sw5e.blasters.3MuBVRCfB4j2pmm1",
  compoundbow: "sw5e.blasters.45PDLB373AvNUyJT",
  ionpistol: "sw5e.blasters.4CdI8yfutf7ZggfY",
  cryorifle: "sw5e.blasters.4Jw4d9459nFSSsUF",
  wristrifle: "sw5e.blasters.4j1MM03ja8KDnRU2",
  incineratorrifle: "sw5e.blasters.66PqJG2lNxMNCg5C",
  heavypistol: "sw5e.blasters.6S2Lb686mrKTQMTp",
  handblaster: "sw5e.blasters.6aTkk5EqFsVKECbn",
  disruptorpistol: "sw5e.blasters.7d9jf8kTjKtzIals",
  sonicpistol: "sw5e.blasters.8EKfBUh1sNYcdyxQ",
  "bolt-thrower": "sw5e.blasters.9VhsUL3z9o62lUsT",
  disruptorcarbine: "sw5e.blasters.9ayhGXQJLdIiaTMF",
  nightstingerrifle: "sw5e.blasters.9h8aYCXd9O2aJThy",
  lightningcarbine: "sw5e.blasters.Aq421AKVuVHZjFJQ",
  switchpistol: "sw5e.blasters.BF0DbpSuicX8qHhb",
  incineratorcarbine: "sw5e.blasters.BFsQzs9kgBwTWMzJ",
  huntingrifle: "sw5e.blasters.E1qrlNHZ9VtE0lky",
  incineratorpistol: "sw5e.blasters.EY3jaFiEsO9UzEz9",
  iws: "sw5e.blasters.EmpVpcgRewUPxdJr",
  ioncarbine: "sw5e.blasters.FJMwehrWtdagwsqn",
  energyslingshot: "sw5e.blasters.FZTA1E9Os0RE1p0k",
  revolver: "sw5e.blasters.Fd6o5uHTGQCNBQP3",
  shatterrifle: "sw5e.blasters.Ger4Tz2ZQHBsvIdD",
  stealthcarbine: "sw5e.blasters.Gq8Xo1CEp8m1HLEa",
  heavyslugpistol: "sw5e.blasters.HXyrCz4Kun53F4kK",
  sonicrifle: "sw5e.blasters.Iv36Kvf4Twtr0WQf",
  heavybowcaster: "sw5e.blasters.Jf8Or7nDFSHPic54",
  switchcannon: "sw5e.blasters.KO4QzzK90ddtTCeP",
  antimaterielrifle: "sw5e.blasters.LXfN4Frdg9Neip42",
  blasterrifle: "sw5e.blasters.Nww9kzfPy9D246fg",
  sentrygun: "sw5e.blasters.O2CMHIk0z1iv5rvq",
  switchcarbine: "sw5e.blasters.OZhhFSXfVaTxlvMy",
  vaporprojector: "sw5e.blasters.PhJpjuTtS0E2dR5M",
  cryocarbine: "sw5e.blasters.PkRIfISeSwgqXOBf",
  blastercarbine: "sw5e.blasters.PoGaGtinF97I9fQ0",
  sniperrifle: "sw5e.blasters.Q45OrdLhguL9OWNU",
  switchrifle: "sw5e.blasters.TGpxeKGTfalYK5SA",
  heavyshotgun: "sw5e.blasters.TSOf2xTMf792t4af",
  wristblaster: "sw5e.blasters.TlrVX9tsQfnzmyo6",
  switchsniper: "sw5e.blasters.UZqJABEq0NUKU2Uf",
  scattergun: "sw5e.blasters.Ul4lKHTI2TocCqBm",
  slugthrower: "sw5e.blasters.UnQu0tKV6bRU8fcE",
  holdout: "sw5e.blasters.V7uuRrAqCINlkgFk",
  shoulderblaster: "sw5e.blasters.W9dZwJA9S6GuupCx",
  torpedolauncher: "sw5e.blasters.WUI1B0CvfWXMUABR",
  bowcaster: "sw5e.blasters.WeVSJ3sJaeIAnnvc",
  heavycarbine: "sw5e.blasters.YK7Nzdui6FW7dNjE",
  smartpistol: "sw5e.blasters.Z3zN5LhPEBnA2gB3",
  scatterblaster: "sw5e.blasters.aEhiMrl8fQ4uE3od",
  ionrifle: "sw5e.blasters.aXCB2Uap09IIAV0p",
  cryopistol: "sw5e.blasters.btSGBSe1oW54ekiK",
  shortbow: "sw5e.blasters.bwGON0wPMPw4L2QJ",
  handbkg: "sw5e.blasters.dHVGZmcv4QblKIhU",
  beamrifle: "sw5e.blasters.eU07RkTEbHfAkaCn",
  soniccarbine: "sw5e.blasters.efeQYIZhTk6GGTv4",
  lightningrifle: "sw5e.blasters.es7oacLob9VulqVC",
  wristlauncher: "sw5e.blasters.fhQ3oxD0XojwKnVN",
  lightbow: "sw5e.blasters.gIGxUwvW06msv36V",
  radrifle: "sw5e.blasters.i1d3IODE5XVAeLuw",
  marksmanblaster: "sw5e.blasters.iY4iRHbLcx10OgRQ",
  mortarlauncher: "sw5e.blasters.jWIMqI3Wg3EJZjMv",
  handcannon: "sw5e.blasters.jeBtqq1xgKnDpqwC",
  tranquilizerrifle: "sw5e.blasters.kTknGaMyXROkwRvm",
  incineratorsniper: "sw5e.blasters.l1vS9YRrwQktdgbI",
  heavyblasterrifle: "sw5e.blasters.lawuC5DlTMgma6P8",
  energybow: "sw5e.blasters.lb1KS1SOtmf384Xv",
  flechettecannon: "sw5e.blasters.lzJCdT9fuPVW5S44",
  assaultcannon: "sw5e.blasters.mXu2wQEqg6czu3X1",
  lightslugpistol: "sw5e.blasters.md4uo61mzq3xBFh0",
  slugpistol: "sw5e.blasters.nFL3lIO5cZyGdi7h",
  rocketlauncher: "sw5e.blasters.pYsmiZ98tXTfdbt0",
  rocketrifle: "sw5e.blasters.q5JrhC2pyO64xhbu",
  blasterpistol: "sw5e.blasters.rz0YqUmRxFl79W0K",
  lightningpistol: "sw5e.blasters.tAzbTqCc6S6aeCvc",
  shotgun: "sw5e.blasters.twTqep64yEvD27WD",
  needler: "sw5e.blasters.tzlA3eYfQSOLVlUw",
  disruptorsniper: "sw5e.blasters.wQvskhxKbF3itdx8",
  arccaster: "sw5e.blasters.xGH5V5Dh3Xd8yRZr",
  disruptorrifle: "sw5e.blasters.yOsWMLHMEtzucKDC",
  shatterpistol: "sw5e.blasters.yVgru3dfq2S3HzVB",
  cyclerrifle: "sw5e.blasters.yaFeefXN5oCNhZns",
  afixedrifle: "sw5e.blasters.ZKM6kkOgHXGnXMgi",
  railgun: "sw5e.blasters.zuPhwZGH0j2ovgG7",
  "bo-rifle": "sw5e.blasters.AohJSYDPWfhsAqHM",

  sunsaber: "sw5e.lightweapons.0Mwf5lFw326kCXaP",
  splitsaber: "sw5e.lightweapons.2bOBHr15ltB32A46",
  broadsaber: "sw5e.lightweapons.58STrK1evawiWDxe",
  lightglaive: "sw5e.lightweapons.A2LrY6YdgNv4JL74",
  doubleshoto: "sw5e.lightweapons.AVDPyImR6l9E2JEi",
  sithsaber: "sw5e.lightweapons.AoO7yHMOrYlG67fa",
  lightring: "sw5e.lightweapons.T81gCX274rZCwcUF",
  sabergauntlet: "sw5e.lightweapons.QsWyd6ML0hMEavZT",
  lightfist: "sw5e.lightweapons.I0DFU813iysKiYCj",
  pikesaber: "sw5e.lightweapons.J0CdF65GSK1tlWr2",
  crosssaber: "sw5e.lightweapons.qfg0n9Yz1aZykKcM",
  retrosaber: "sw5e.lightweapons.L47ZLQgshik5X5ea",
  chainedlightdagger: "sw5e.lightweapons.LzWg0JRhhyedB9bi",
  lightsaberpike: "sw5e.lightweapons.NKFT1tIzfAAZHsHn",
  lightaxe: "sw5e.lightweapons.Ncx7KBa8wBn9KztD",
  saberspear: "sw5e.lightweapons.NvHrxWiR8wiUeEhO",
  lightclub: "sw5e.lightweapons.OJmYglDcsfSbzuyK",
  lightblade: "sw5e.lightweapons.QYOc47JL2U2OCFnM",
  bitesaber: "sw5e.lightweapons.R438U6CVFIcKQUj4",
  lightdagger: "sw5e.lightweapons.Ri7R7WyapR2CDE9S",
  shotosaber: "sw5e.lightweapons.RjQEzblykRC6Qn8E",
  blightsaber: "sw5e.lightweapons.SnVUeLTVdJyu6FLA",
  doublesaber: "sw5e.lightweapons.T3eHzkaSMMpLuBbr",
  lightsaber: "sw5e.lightweapons.TjTDmB8pIYSLkQvw",
  claymoresaber: "sw5e.lightweapons.Zy8993dOg0rOsXoS",
  crossguardsaber: "sw5e.lightweapons.TzLXYpz7oWOPvZQR",
  lightkatana: "sw5e.lightweapons.U1nekOEjEnj6zztB",
  greatsaber: "sw5e.lightweapons.mSZS5YaRrV0VEjDc",
  bustersaber: "sw5e.lightweapons.NcPqEgYr26QVzPrs",
  martiallightsaber: "sw5e.lightweapons.ZAvRnvSdsRnz9CGQ",
  phaseknife: "sw5e.lightweapons.ZaubWVQfostRNL56",
  warsaber: "sw5e.lightweapons.aJmL8jD1ZbmurHGe",
  sabermace: "sw5e.lightweapons.bfKWgOJsnedKQZMT",
  dualphasesaber: "sw5e.lightweapons.btN7KpXTNmkCSNCr",
  lightnodachi: "sw5e.lightweapons.dHlqXZ0f51MsuNO3",
  lightcutlass: "sw5e.lightweapons.f2Gs7BXTGRANoziO",
  // "lightlance": "sw5e.lightweapons.g0oF8qIKUMSBKd98",
  saberwhip: "sw5e.lightweapons.gaFajnxdTGFGVOki",
  sicklesaber: "sw5e.lightweapons.gciw8MclS0kQ40S3",
  saberaxe: "sw5e.lightweapons.gj2EIKC9sEvLvc2E",
  brightsaber: "sw5e.lightweapons.izAkWbwSJEmH6NhS",
  lightbaton: "sw5e.lightweapons.l5JZlEuy2sDFmsxT",
  lightfoil: "sw5e.lightweapons.s3PoP2XP6eNKibCh",
  wristsaber: "sw5e.lightweapons.tct3YIDnft6YS1zm",
  guardshoto: "sw5e.lightweapons.xYrgfBXhWqh7jsU5",
  saberstaff: "sw5e.lightweapons.8VjKAKu1UfvGU3t5",

  warsword: "sw5e.vibroweapons.1l5wYDmKxsVtBh8C",
  techstaff: "sw5e.vibroweapons.1yjNZ2sexhgtLTJd",
  stungauntlet: "sw5e.vibroweapons.2HU5GIeXszOFsdzz",
  doubleblade: "sw5e.vibroweapons.2JAikVfIqqfVnz89",
  mancatcher: "sw5e.vibroweapons.2NpgNbbZii4hBxnf",
  disguisedblade: "sw5e.vibroweapons.2hh7rbRe2M7NtsSA",
  vibroknife: "sw5e.vibroweapons.3kUGRPNz1ZGoyroy",
  vibrodagger: "sw5e.vibroweapons.4NC3GFIB6fkAFode",
  vibromace: "sw5e.vibroweapons.4nhExqMbBBc43yEg",
  vibrotonfa: "sw5e.vibroweapons.51SEwkiAyEyNxepE",
  bolas: "sw5e.vibroweapons.9aZ7pxuQ53FSSln2",
  vibroshield: "sw5e.vibroweapons.AAPFz1h7zavJtNLT",
  vibrowhip: "sw5e.vibroweapons.DMhK05ya9IaoRaqn",
  electroprod: "sw5e.vibroweapons.DPM9vkX71mJqu56S",
  net: "sw5e.vibroweapons.E4yr74pank6zL4EM",
  echostaff: "sw5e.vibroweapons.EkHc4LJawI0MkZTt",
  vibroglaive: "sw5e.vibroweapons.FSHBcQtY54JJeRVj",
  electrovoulge: "sw5e.vibroweapons.GHNSNfGwYy5M7PHf",
  vibronodachi: "sw5e.vibroweapons.GN53CEWMAFvR1LDU",
  techblade: "sw5e.vibroweapons.IAgE03WckaYyW18F",
  vibrorapier: "sw5e.vibroweapons.INgbfJEkeG2eTK2J",
  cesta: "sw5e.vibroweapons.IP3ZvnlOyVLRjonU",
  nervebaton: "sw5e.vibroweapons.IR2YLzSMJtarjPRB",
  wristblade: "sw5e.vibroweapons.ITIKI8cm8bfdwJtr",
  jaggedvibroblade: "sw5e.vibroweapons.Ix3zb5hgZ8gMlUCU",
  vibrohammer: "sw5e.vibroweapons.IyUZfO6To2YpdRAc",
  techaxe: "sw5e.vibroweapons.JJW1OllV82jC2RXG",
  warhat: "sw5e.vibroweapons.KLQK6pxmZljlmTH7",
  riotshocker: "sw5e.vibroweapons.Kdl45Yv1B8aV6wb1",
  hookedvibroblade: "sw5e.vibroweapons.LbuQt3wl3ddFby24",
  vibrosabre: "sw5e.vibroweapons.Lrx4vPikf9djuvi9",
  vibrostaff: "sw5e.vibroweapons.Nai38YsJRjYCUrtq",
  vibrokatana: "sw5e.vibroweapons.OAF3LCdfJBwqPDqX",
  vibrolance: "sw5e.vibroweapons.P5F9exDDwLqELvx8",
  chaineddagger: "sw5e.vibroweapons.QOlVIUthbalyOzx5",
  vibrocutlass: "sw5e.vibroweapons.WRORHupqx7zNC5c1",
  vibroblade: "sw5e.vibroweapons.UNkMw4mUkIIveQcJ",
  diresword: "sw5e.vibroweapons.VOLVlfFZ9WsDLAHO",
  chakram: "sw5e.vibroweapons.WFtEcb6twwwCCJw3",
  vibrocutter: "sw5e.vibroweapons.aOSObG115AyL94wE",
  direvibroblade: "sw5e.vibroweapons.abw8hrZisGBcNuyn",
  vibrobuster: "sw5e.vibroweapons.b7eKH5T3Djwod7fk",
  hiddenblade: "sw5e.vibroweapons.cmb8tlOI7j4wnfPi",
  atlatl: "sw5e.vibroweapons.d7T8eIMQVNYXFOU7",
  electrohammer: "sw5e.vibroweapons.eIrYhQUAWrtb7hge",
  doublesword: "sw5e.vibroweapons.eNRNDJTz4Qwp9cGJ",
  vibroflail: "sw5e.vibroweapons.ez4L9NPb3WxDn0vy",
  unarmedstrike: "sw5e.vibroweapons.fnPxFBccb0qvVPQW",
  electrostaff: "sw5e.vibroweapons.h05hvfoThlmCxW5H",
  vibrodart: "sw5e.vibroweapons.i9YbAYtjJ37eJv3K",
  vibroclaw: "sw5e.vibroweapons.j0sgK34TRKbyBprP",
  riotbaton: "sw5e.vibroweapons.mWlYuzFhHFek9NN2",
  neuronicwhip: "sw5e.vibroweapons.meWyezpYa3y8uRrl",
  vibroaxe: "sw5e.vibroweapons.o8JR5oLCQOYpP9Oa",
  vibrospear: "sw5e.vibroweapons.oS93z4sSFt0aidDI",
  vibroclaymore: "sw5e.vibroweapons.owrLUNZDefZk5dWY",
  electrowhip: "sw5e.vibroweapons.pTGzbu3OOCvWiC52",
  vibroknuckler: "sw5e.vibroweapons.rqVAzueP6PdG3h4D",
  vibropike: "sw5e.vibroweapons.rsn8G4aAxpu0gJBH",
  disruptorshiv: "sw5e.vibroweapons.sG5tznTOdE50BvDE",
  vibrobattleaxe: "sw5e.vibroweapons.sJOPfGy0XqCOFq1n",
  electrobaton: "sw5e.vibroweapons.syMf22lyVB0OTV7V",
  vibrobaton: "sw5e.vibroweapons.t4GxMD52v7myAi41",
  vibrosword: "sw5e.vibroweapons.u1t2YqPQSOMWPQbs",
  vibrostiletto: "sw5e.vibroweapons.vaNoEh1SebpPzEtd",
  shockwhip: "sw5e.vibroweapons.wmMxWXgZdlJ8SLXe"
};

/* -------------------------------------------- */

/**
 * The basic ammunition types.
 * @enum {string}
 */
SW5E.ammoIds = {
  arrow: "sw5e.ammo.kW97lhvo8rYMypG0",
  arrowcombustive: "sw5e.ammo.n1gjy0mheXViYfsE",
  arrowelectroshock: "sw5e.ammo.q5XpHt4TEi7JY4IM",
  arrownoisemaker: "sw5e.ammo.rWNnt31Qc8vijcUb",
  bolt: "sw5e.ammo.bXgrfvShJWyNygV0",
  boltdeafening: "sw5e.ammo.dmodQxWAT6Bfrhns",
  boltelectrifying: "sw5e.ammo.NNjJbfRx67JdirSR",
  boltpanic: "sw5e.ammo.z7ztMrbJCh3cl5LM",
  corrosivecartridge: "sw5e.ammo.eNEdlWIHLR3yflJM",
  cryocell: "sw5e.ammo.0gGP4fOTbT5Nr0UP",
  dart: "sw5e.ammo.ld3OaEeYKbfHUtUC",
  deafeningcalibrator: "sw5e.ammo.4PPbZh3aWNVgkGEE",
  deafeningcell: "sw5e.ammo.HwoQydBMvGIrHcxI",
  deafeningcollimator: "sw5e.ammo.21IMgkOdo3vPnJlo",
  deafeningdart: "sw5e.ammo.9Fgu4ImgnUh3nALy",
  electrifyingcalibrator: "sw5e.ammo.Ir6H3twcOBgEKEVe",
  electrifyingcartridge: "sw5e.ammo.Ebbb4CPzKhzF1hNk",
  electrifyingcollimator: "sw5e.ammo.CFAPdZKogjI5VDsC",
  electrifyingdart: "sw5e.ammo.PhZJjeGTlaftiIX5",
  flechetteclipfragmentation: "sw5e.ammo.S0hF8VlOBRPiKzJc",
  flechetteclipion: "sw5e.ammo.AhnNsZEaSyt5vQoa",
  flechetteclipplasma: "sw5e.ammo.JhA6Fk0CmRAhWQqs",
  flechettemagfragmentation: "sw5e.ammo.WFGBHjctJW2G8Ous",
  flechettemagion: "sw5e.ammo.mZ0ZWeKLLAPTWzos",
  flechettemagplasma: "sw5e.ammo.YpAiDCFvnJ9DFH0q",
  fluxcollimator: "sw5e.ammo.8pm1jGUlEEcYXXZG",
  gascartridge: "sw5e.ammo.HLuN9PeH3L2SEV01",
  incendiarycell: "sw5e.ammo.aIRzZOPc6kfGQjpQ",
  missilefragmentation: "sw5e.ammo.dP1OJg8DNYwKRbbN",
  missileincendiary: "sw5e.ammo.NtAv7g53vVoHGGbQ",
  missileion: "sw5e.ammo.I8TXYDvGwMmBcYuS",
  oscillationcalibrator: "sw5e.ammo.sPAXclp1H3d1OinS",
  paniccalibrator: "sw5e.ammo.SrUO28T2x6jeNReS",
  paniccollimator: "sw5e.ammo.F89IDxtKvqG9MIbD",
  panicdart: "sw5e.ammo.LlVD11rEsLRXu6M3",
  powercell: "sw5e.ammo.oeJaLYngzLX0x6Yj",
  powergenerator: "sw5e.ammo.yeyBmy7LpYNzP5GN",
  projectorcanistercorrosive: "sw5e.ammo.DTHeXNdbxQNWCSuR",
  projectorcanistercryo: "sw5e.ammo.F6zNyxxWi8TiUb4m",
  projectorcanisterincendiary: "sw5e.ammo.F1uipGbRDApT0sMX",
  projectortankcorrosive: "sw5e.ammo.FFHbfcWjrvgf8ld6",
  projectortankcryo: "sw5e.ammo.A2Dpmn2IDuhwFgS4",
  projectortankincendiary: "sw5e.ammo.YcEOLA1eLtDmlJOI",
  rocketfragmentation: "sw5e.ammo.JcaUDwCQIjqhvHUn",
  rocketincendiary: "sw5e.ammo.0bQtnYFq1LxRqNeJ",
  rocketion: "sw5e.ammo.eRVG9TORFV6YGuA0",
  slugcartridge: "sw5e.ammo.td6veREVMHQB6kiU",
  snare: "sw5e.ammo.pyFkRdUK4sZZrJtG",
  torpedofragmentation: "sw5e.ammo.rkYFnv2yNA9mh8Jk",
  torpedoplasma: "sw5e.ammo.6fDA5yg8WAoCBGlk"
};

/* -------------------------------------------- */

/**
 * The categories into which Tool items can be grouped.
 *
 * @enum {string}
 */
SW5E.toolTypes = {
  artisan: "SW5E.ToolArtisanImplement",
  specialist: "SW5E.ToolSpecialistKit",
  game: "SW5E.ToolGamingSet",
  music: "SW5E.ToolMusicalInstrument"
};
preLocalize("toolTypes", { sort: true });

/**
 * The categories of tool proficiencies that a character can gain.
 *
 * @enum {string}
 */
SW5E.toolProficiencies = {
  ...SW5E.toolTypes,
  vehicle: "SW5E.ToolVehicle"
};
preLocalize("toolProficiencies", { sort: true });

/**
 * The basic tool types in sw5e. This enables specific tool proficiencies or
 * starting equipment provided by classes and backgrounds.
 * @enum {string}
 **/
SW5E.toolIds = {
  constructorsimplements: "sw5e.implements.5HKxptQKBFED544u",
  geneticistsimplements: "sw5e.implements.80xuLufR1m7kpNRs",
  cybertechsimplements: "sw5e.implements.9w7V1PCf2aD4caVP",
  jewelersimplements: "sw5e.implements.EYpkyPlywQaH9Ivy",
  gadgeteersimplements: "sw5e.implements.GJrYc9KQ22o7qTlz",
  tinkersimplements: "sw5e.implements.IkmQFQjGc4xq0Czd",
  armstechsimplements: "sw5e.implements.Mrwh3CEneCPnPP1T",
  artistsimplements: "sw5e.implements.OXlKtbL29bLUluf2",
  biotechsimplements: "sw5e.implements.QTg2sCpSdPfyUoCq",
  astrotechsimplements: "sw5e.implements.RlQ4zlWA7EdohcEh",
  surveyorsimplements: "sw5e.implements.SvureMOX5qo6LqGt",
  audiotechsimplements: "sw5e.implements.VNto9t3diElKRHWG",
  armormechsimplements: "sw5e.implements.sjsX3NYk7eZ4udlw",
  synthweaversimplements: "sw5e.implements.uP1rZHmbOmg8BUaX",
  artificersimplements: "sw5e.implements.w7lWDrGgZeYbwiSH",

  chefskit: "sw5e.kits.BnhGtUc9G7issUcW",
  disguisekit: "sw5e.kits.ChmVrypurts3VY7i",
  scavengingkit: "sw5e.kits.NVxy5wBSpJcHxPEm",
  spicerskit: "sw5e.kits.NlppEcEGpDVDyPiH",
  mechanicskit: "sw5e.kits.NubaMVVv3vNwbtuj",
  brewerskit: "sw5e.kits.OAt131yAvZYPlUmO",
  munitionskit: "sw5e.kits.VJL0ue7Bpl3s0MHx",
  archaeologistkit: "sw5e.kits.WrJhpfymps4yRBdk",
  slicerskit: "sw5e.kits.Yonb0zHFV9asPJHq",
  bioanalysiskit: "sw5e.kits.fWoNUuZCNLG8W67s",
  demolitionskit: "sw5e.kits.gyhyVW4PEUWLpZTL",
  artilleristskit: "sw5e.kits.jJ1CiyKVXOlyjn8h",
  forgerykit: "sw5e.kits.ksrKs7yvm7X7CMxA",
  securitykit: "sw5e.kits.nqf9reJDGplVaeac",
  poisonerskit: "sw5e.kits.ofea5VziX4jBg5So",
  biochemistskit: "sw5e.kits.pq0o4lUKg8Nl08yf",

  sabaccdeck: "sw5e.gamingsets.RvFP7y8VWPMROQWv",
  pazaakdeck: "sw5e.gamingsets.XfClqzNPbjJxHqil",
  dejarikset: "sw5e.gamingsets.dKho3HXE7XfS4iRU",
  chancecubes: "sw5e.gamingsets.kqt52rtjpaz6jiCf",

  mandoviol: "sw5e.musicalinstruments.9hYtv8pguNI8aae9",
  lute: "sw5e.musicalinstruments.BE1Tg7LCM7yfwypT",
  shawm: "sw5e.musicalinstruments.BLDVxPfj8jQw1DUN",
  fizzz: "sw5e.musicalinstruments.IZEi9N6YzWFBHpNh",
  chindinkaluhorn: "sw5e.musicalinstruments.NgKMduBdltQQqgnC",
  kloohorn: "sw5e.musicalinstruments.PfxeK6e5htdyzDEP",
  xantha: "sw5e.musicalinstruments.WVSGXxzBoTUoPvi9",
  slitherhorn: "sw5e.musicalinstruments.WZbBxDVRLynROWbf",
  traz: "sw5e.musicalinstruments.XwLhLqUJMahD3fo6",
  ommnibox: "sw5e.musicalinstruments.e9nNVlBmPvPD6cbU",
  bandfill: "sw5e.musicalinstruments.ic6PBK7VxBLk24rZ",
  flute: "sw5e.musicalinstruments.mumHDhvGww117xoq",
  valahorn: "sw5e.musicalinstruments.sNnvwOZrUp5xJuHe",
  drum: "sw5e.musicalinstruments.sryr7sQ5IeUny6cd",
  fanfar: "sw5e.musicalinstruments.wASdyFsdQEJHhXeC"
};
preLocalize("toolIds");

/* -------------------------------------------- */

/**
 * Specific equipment types that modify base AC.
 * @enum {string}
 */
SW5E.armorTypes = {
  light: "SW5E.EquipmentLight",
  medium: "SW5E.EquipmentMedium",
  heavy: "SW5E.EquipmentHeavy",
  natural: "SW5E.EquipmentNatural",
  starship: "SW5E.EquipmentStarshipArmor",
  shield: "SW5E.EquipmentShield"
};
preLocalize("armorTypes");

/**
 * Casting Focus equipment types
 * @enum {string}
 */
SW5E.castingEquipmentTypes = {
  wristpad: "SW5E.EquipmentWristpad",
  focusgenerator: "SW5E.EquipmentFocusGenerator"
};
preLocalize("castingEquipmentTypes", { sort: true });

/**
 * Equipment types that aren't armor.
 * @enum {string}
 */
SW5E.miscEquipmentTypes = {
  clothing: "SW5E.EquipmentClothing",
  trinket: "SW5E.EquipmentTrinket",
  vehicle: "SW5E.EquipmentVehicle",
  ...SW5E.castingEquipmentTypes
};
preLocalize("miscEquipmentTypes", { sort: true });

/**
 * Starship specific equipment types that aren't armor.
 * @enum {string}
 */
SW5E.ssEquipmentTypes = {
  hyper: "SW5E.EquipmentHyperdrive",
  powerc: "SW5E.EquipmentPowerCoupling",
  reactor: "SW5E.EquipmentReactor",
  ssshield: "SW5E.EquipmentStarshipShield"
};
preLocalize("ssEquipmentTypes", { sort: true });

/**
 * The set of equipment types for armor, clothing, and other objects which can be worn by the character.
 * @enum {string}
 */
SW5E.equipmentTypes = {
  ...SW5E.miscEquipmentTypes,
  ...SW5E.ssEquipmentTypes,
  ...SW5E.armorTypes
};
preLocalize("equipmentTypes", { sort: true });

/**
 * The set of Armor Proficiencies which a character may have.
 * @type {object}
 */
SW5E.armorProficiencies = {
  lgt: "SW5E.ArmorLightProficiency",
  med: "SW5E.ArmorMediumProficiency",
  hvy: "SW5E.ArmorHeavyProficiency",
  shl: "SW5E.EquipmentShieldProficiency"
};
preLocalize("armorProficiencies");

/**
 * A mapping between `SW5E.equipmentTypes` and `SW5E.armorProficiencies` that
 * is used to determine if character has proficiency when adding an item.
 * @enum {(boolean|string)}
 */
SW5E.armorProficienciesMap = {
  natural: true,
  clothing: true,
  light: "lgt",
  medium: "med",
  heavy: "hvy",
  shield: "shl"
};

/**
 * The basic armor types in sw5e. This enables specific armor proficiencies,
 * automated AC calculation in NPCs, and starting equipment.
 * @enum {string}
 **/
SW5E.armorIds = {
  combatsuit: "sw5e.armor.iJXWiOLOQcVohJBN",
  fiberarmor: "sw5e.armor.zAkvWO8lEohqewbB",

  mesharmor: "sw5e.armor.WalIq3DWny0Ud4Vn",
  weavearmor: "sw5e.armor.hpN14Vhgw82PHeEz",
  compositearmor: "sw5e.armor.mToMe4McIkZRIeCN",

  battlearmor: "sw5e.armor.wafF3SF4zQBOs34y",
  assaultarmor: "sw5e.armor.GO4yvhWLgLTrU0xb",
  heavyexoskeleton: "sw5e.armor.ggFMzbQrwkGZCoaQ"
};
preLocalize("armorIds");

/**
 * The basic shield types in sw5e. This enables specific shield proficiencies,
 * automated AC calculation in NPCs, and starting equipment.
 * @enum {string}
 **/
SW5E.shieldIds = {
  lightshieldgenerator: "sw5e.armor.eMXpw3HIVMnaNFQ1",
  mediumshieldgenerator: "sw5e.armor.R2GRWrNHmAZzksg5",
  heavyshieldgenerator: "sw5e.armor.2u9493AUhrh2AfES",

  lightphysicalshield: "sw5e.armor.k1pOOCzZoWEr5Dia",
  mediumphysicalshield: "sw5e.armor.4vGeVWgLIUfN9YiB",
  heavyphysicalshield: "sw5e.armor.KvzKRKNWATwdzxjz"
};
preLocalize("shieldIds");

/**
 * Common armor class calculations.
 * @enum {{ label: string, [formula]: string }}
 */
SW5E.armorClasses = {
  flat: {
    label: "SW5E.ArmorClassFlat",
    formula: "@attributes.ac.flat"
  },
  natural: {
    label: "SW5E.ArmorClassNatural",
    formula: "@attributes.ac.flat"
  },
  default: {
    label: "SW5E.ArmorClassEquipment",
    formula: "@attributes.ac.armor + @attributes.ac.dex"
  },
  starship: {
    label: "SW5E.ArmorClassStarshipEquipment",
    formula: "@attributes.ac.armor + @attributes.ac.dex"
  },
  mage: {
    label: "SW5E.ArmorClassMage",
    formula: "12 + @abilities.dex.mod"
  },
  draconic: {
    label: "SW5E.ArmorClassDraconic",
    formula: "13 + @abilities.dex.mod"
  },
  unarmoredMonk: {
    label: "SW5E.ArmorClassUnarmoredMonk",
    formula: "10 + @abilities.dex.mod + @abilities.wis.mod"
  },
  unarmoredBarb: {
    label: "SW5E.ArmorClassUnarmoredBarbarian",
    formula: "10 + @abilities.dex.mod + @abilities.con.mod"
  },
  custom: {
    label: "SW5E.ArmorClassCustom"
  }
};
preLocalize("armorClasses", { key: "label" });

/* -------------------------------------------- */

/**
 * Time periods that accept a numeric value.
 * @enum {string}
 */
SW5E.scalarTimePeriods = {
  turn: "SW5E.TimeTurn",
  round: "SW5E.TimeRound",
  minute: "SW5E.TimeMinute",
  hour: "SW5E.TimeHour",
  day: "SW5E.TimeDay",
  month: "SW5E.TimeMonth",
  year: "SW5E.TimeYear"
};
preLocalize("scalarTimePeriods");

/* -------------------------------------------- */

/**
 * Time periods for powers that don't have a defined ending.
 * @enum {string}
 */
SW5E.permanentTimePeriods = {
  disp: "SW5E.TimeDisp",
  dstr: "SW5E.TimeDispTrig",
  perm: "SW5E.TimePerm"
};
preLocalize("permanentTimePeriods");

/* -------------------------------------------- */

/**
 * Time periods that don't accept a numeric value.
 * @enum {string}
 */
SW5E.specialTimePeriods = {
  inst: "SW5E.TimeInst",
  spec: "SW5E.Special"
};
preLocalize("specialTimePeriods");

/* -------------------------------------------- */

/**
 * The various lengths of time over which effects can occur.
 * @enum {string}
 */
SW5E.timePeriods = {
  ...SW5E.specialTimePeriods,
  ...SW5E.permanentTimePeriods,
  ...SW5E.scalarTimePeriods
};
preLocalize("timePeriods");

/* -------------------------------------------- */

/**
 * Ways in which to activate an item that cannot be labeled with a cost.
 * @enum {string}
 */
SW5E.staticAbilityActivationTypes = {
  none: "SW5E.NoneActionLabel",
  special: SW5E.timePeriods.spec
};

/**
 * Various ways in which an item or ability can be activated.
 * @enum {string}
 */
SW5E.abilityActivationTypes = {
  ...SW5E.staticAbilityActivationTypes,
  action: "SW5E.Action",
  bonus: "SW5E.BonusAction",
  reaction: "SW5E.Reaction",
  minute: SW5E.timePeriods.minute,
  hour: SW5E.timePeriods.hour,
  day: SW5E.timePeriods.day,
  legendary: "SW5E.LegendaryActionLabel",
  mythic: "SW5E.MythicActionLabel",
  lair: "SW5E.LairActionLabel",
  crew: "SW5E.VehicleCrewAction"
};
preLocalize("abilityActivationTypes");

/* -------------------------------------------- */

/**
 * Different things that an ability can consume upon use.
 * @enum {string}
 */
SW5E.abilityConsumptionTypes = {
  ammo: "SW5E.ConsumeAmmunition",
  attribute: "SW5E.ConsumeAttribute",
  hitDice: "SW5E.ConsumeHitDice",
  material: "SW5E.ConsumeMaterial",
  charges: "SW5E.ConsumeCharges",
  powerdice: "SW5E.PowerDiePl"
};
preLocalize("abilityConsumptionTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Configuration data for actor sizes.
 *
 * @typedef {object} ActorSizeConfiguration
 * @property {string} label                   Localized label.
 * @property {string} abbreviation            Localized abbreviation.
 * @property {number} [token=1]               Default token size.
 * @property {number} [capacityMultiplier=1]  Multiplier used to calculate carrying capacities.
 */

/**
 * Creature sizes ordered from smallest to largest.
 * @enum {ActorSizeConfiguration}
 */
SW5E.actorSizes = {
  tiny: {
    label: "SW5E.SizeTiny",
    abbreviation: "SW5E.SizeTinyAbbr",
    token: 0.5,
    capacityMultiplier: 0.5
  },
  sm: {
    label: "SW5E.SizeSmall",
    abbreviation: "SW5E.SizeSmallAbbr",
    dynamicTokenScale: 0.8
  },
  med: {
    label: "SW5E.SizeMedium",
    abbreviation: "SW5E.SizeMediumAbbr"
  },
  lg: {
    label: "SW5E.SizeLarge",
    abbreviation: "SW5E.SizeLargeAbbr",
    token: 2,
    capacityMultiplier: 2
  },
  huge: {
    label: "SW5E.SizeHuge",
    abbreviation: "SW5E.SizeHugeAbbr",
    token: 3,
    capacityMultiplier: 4
  },
  grg: {
    label: "SW5E.SizeGargantuan",
    abbreviation: "SW5E.SizeGargantuanAbbr",
    token: 4,
    capacityMultiplier: 8
  }
};
preLocalize("actorSizes", { keys: ["label", "abbreviation"] });
patchConfig("actorSizes", "label", { since: "SW5e 3.0", until: "SW5e 3.2" });

/**
 * Default token image size for the values of `SW5E.actorSizes`.
 * @enum {number}
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 */
Object.defineProperty(SW5E, "tokenSizes", {
  get() {
    foundry.utils.logCompatibilityWarning(
      "SW5E.tokenSizes has been deprecated and is now accessible through the .token property on SW5E.actorSizes.",
      { since: "SW5e 3.0", until: "SW5e 3.2" }
    );
    return Object.entries(SW5E.actorSizes).reduce((obj, [k, v]) => {
      obj[k] = v.token ?? 1;
      return obj;
    }, {});
  }
});

/* -------------------------------------------- */
/*  Canvas                                      */
/* -------------------------------------------- */

/**
 * Colors used to visualize temporary and temporary maximum HP in token health bars.
 * @enum {number}
 */
SW5E.tokenHPColors = {
  damage: 0xff0000,
  healing: 0x00ff00,
  temp: 0x66ccff,
  tempmax: 0x440066,
  negmax: 0x550000
};

/* -------------------------------------------- */

/**
 * Colors used when a dynamic token ring effects.
 * @enum {number}
 */
SW5E.tokenRingColors = {
  damage: 0xFF0000,
  defeated: 0x000000,
  healing: 0x00FF00,
  temp: 0x33AAFF
};

/* -------------------------------------------- */

/**
 * Settings used to render map location markers on the canvas.
 * @type {object}
 */
SW5E.mapLocationMarker = {
  default: {
    backgroundColor: 0xFBF8F5,
    borderColor: 0x000000,
    borderHoverColor: 0xFF5500,
    font: null,
    textColor: 0x000000
  }
};

/* -------------------------------------------- */

/**
 * Configuration data for creature types.
 *
 * @typedef {object} CreatureTypeConfiguration
 * @property {string} label               Localized label.
 * @property {string} plural              Localized plural form used in swarm name.
 * @property {string} [reference]         Reference to a rule page describing this type.
 * @property {boolean} [detectAlignment]  Is this type detectable by powers such as "Detect Evil and Good"?
 */

/**
 * Default types of creatures.
 * @enum {CreatureTypeConfiguration}
 */
SW5E.creatureTypes = {
  aberration: {
    label: "SW5E.CreatureAberration",
    plural: "SW5E.CreatureAberrationPl",
    icon: "/icons/creatures/tentacles/tentacle-eyes-yellow-pink.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.yy50qVC1JhPHt4LC",
    detectAlignment: true
  },
  beast: {
    label: "SW5E.CreatureBeast",
    plural: "SW5E.CreatureBeastPl",
    icon: "/icons/creatures/claws/claw-bear-paw-swipe-red.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6bTHn7pZek9YX2tv"
  },
  construct: {
    label: "SW5E.CreatureConstruct",
    plural: "SW5E.CreatureConstructPl",
    icon: "/icons/creatures/magical/construct-stone-earth-gray.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.jQGAJZBZTqDFod8d"
  },
  droid: {
    label: "SW5E.CreatureDroid",
    plural: "SW5E.CreatureDroidPl",
    icon: "/icons/creatures/abilities/dragon-fire-breath-orange.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.k2IRXZwGk9W0PM2S"
  },
  force: {
    label: "SW5E.CreatureForce",
    plural: "SW5E.CreatureForcePl",
    icon: "/icons/creatures/magical/fae-fairy-winged-glowing-green.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.OFsRUt3pWljgm8VC"
  },
  humanoid: {
    label: "SW5E.CreatureHumanoid",
    plural: "SW5E.CreatureHumanoidPl",
    icon: "/icons/magic/unholy/strike-body-explode-disintegrate.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iFzQs4AenN8ALRvw"
  },
  plant: {
    label: "SW5E.CreaturePlant",
    plural: "SW5E.CreaturePlantPl",
    icon: "/icons/magic/nature/tree-animated-strike.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.1oT7t6tHE4kZuSN1"
  },
  undead: {
    label: "SW5E.CreatureUndead",
    plural: "SW5E.CreatureUndeadPl",
    icon: "/icons/magic/death/skull-horned-worn-fire-blue.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.D2BdqS1GeD5rcZ6q",
    detectAlignment: true
  }
};
preLocalize("creatureTypes", { keys: ["label", "plural"], sort: true });
patchConfig("creatureTypes", "label", { since: "SW5e 3.0", until: "SW5e 3.2" });

/* -------------------------------------------- */

/**
 * Classification types for item action types that are attacks.
 * @enum {string}
 */
SW5E.itemActionTypesAttack = {
  mwak: "SW5E.ActionMWAK",
  rwak: "SW5E.ActionRWAK",
  mpak: "SW5E.ActionMPAK",
  rpak: "SW5E.ActionRPAK"
};
preLocalize("itemActionTypesAttack");

/* -------------------------------------------- */

/**
 * Classification types for item action types.
 * @enum {string}
 */
SW5E.itemActionTypes = {
  ...SW5E.itemActionTypesAttack,
  save: "SW5E.ActionSave",
  heal: "SW5E.ActionHeal",
  abil: "SW5E.ActionAbil",
  util: "SW5E.ActionUtil",
  other: "SW5E.ActionOther"
};
preLocalize("itemActionTypes");

/* -------------------------------------------- */

/**
 * Different ways in which item capacity can be limited.
 * @enum {string}
 */
SW5E.itemCapacityTypes = {
  items: "SW5E.ItemContainerCapacityItems",
  weight: "SW5E.ItemContainerCapacityWeight"
};
preLocalize("itemCapacityTypes", { sort: true });

/* -------------------------------------------- */

/**
 * List of various item rarities.
 * @enum {string}
 */
SW5E.itemRarity = {
  standard: "SW5E.ItemRarityStandard",
  premium: "SW5E.ItemRarityPremium",
  prototype: "SW5E.ItemRarityPrototype",
  advanced: "SW5E.ItemRarityAdvanced",
  legendary: "SW5E.ItemRarityLegendary",
  artifact: "SW5E.ItemRarityArtifact"
};
preLocalize("itemRarity");

/* -------------------------------------------- */

/**
 * The limited use periods that support a recovery formula.
 * @enum {string}
 */
SW5E.limitedUseFormulaPeriods = {
  charges: "SW5E.Charges",
  dawn: "SW5E.Dawn",
  dusk: "SW5E.Dusk"
};

/* -------------------------------------------- */

/**
 * Enumerate the lengths of time over which an item can have limited use ability
 * @enum {string}
 */
SW5E.limitedUsePeriods = {
  sr: "SW5E.ShortRest",
  lr: "SW5E.LongRest",
  day: "SW5E.Day",
  recharge: "SW5E.Recharge",
  refitting: "SW5E.Refitting",
  ...SW5E.limitedUseFormulaPeriods
};
preLocalize("limitedUsePeriods");

/* -------------------------------------------- */

/**
 * The various types of vehicles in which characters can be proficient.
 * @enum {string}
 */
SW5E.vehicleTypes = {
  air: "SW5E.VehicleTypeAir",
  land: "SW5E.VehicleTypeLand",
  space: "SW5E.VehicleTypeSpace",
  water: "SW5E.VehicleTypeWater"
};
preLocalize("vehicleTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Enumerate the valid ammunition types which are recognized by the system.
 * @enum {string}
 */
SW5E.ammoStandardTypes = {
  arrow: "SW5E.ConsumableAmmoArrow",
  bolt: "SW5E.ConsumableAmmoBolt",
  cartridge: "SW5E.ConsumableAmmoCartridge",
  dart: "SW5E.ConsumableAmmoDart",
  flechetteClip: "SW5E.ConsumableAmmoFlechetteClip",
  flechetteMag: "SW5E.ConsumableAmmoFlechetteMag",
  missile: "SW5E.ConsumableAmmoMissile",
  powerCell: "SW5E.ConsumableAmmoPowerCell",
  powerGenerator: "SW5E.ConsumableAmmoPowerGenerator",
  projectorCanister: "SW5E.ConsumableAmmoProjectorCanister",
  projectorTank: "SW5E.ConsumableAmmoProjectorTank",
  rocket: "SW5E.ConsumableAmmoRocket",
  snare: "SW5E.ConsumableAmmoSnare",
  torpedo: "SW5E.ConsumableAmmoTorpedo"
};
preLocalize("ammoStandardTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Enumerate the valid ammunition types which are recognized by the system.
 * @enum {string}
 */
SW5E.ammoStarshipTypes = {
  sscluster: "SW5E.ConsumableAmmoSsCluster",
  ssmissile: "SW5E.ConsumableAmmoSsMissile",
  sstorpedo: "SW5E.ConsumableAmmoSsTorpedo",
  ssbomb: "SW5E.ConsumableAmmoSsBomb"
};
preLocalize("ammoStarshipTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Enumerate the valid consumable types which are recognized by the system.
 * @enum {string}
 */
SW5E.consumableTypes = {
  ammo: {
    label: "SW5E.ConsumableAmmo",
    subtypes: {
      ...SW5E.ammoStandardTypes,
      ...SW5E.ammoStarshipTypes
    }
  },
  barrier: {
    label: "SW5E.ConsumableBarrier",
    subtypes: {
      physical: "SW5E.ConsumableBarrierPhysical",
      enviromental: "SW5E.ConsumableBarrierEnviromental"
    }
  },
  explosive: {
    label: "SW5E.ConsumableExplosive",
    subtypes: {
      grenade: "SW5E.ConsumableExplosiveGrenade",
      mine: "SW5E.ConsumableExplosiveMine",
      charge: "SW5E.ConsumableExplosiveCharge",
      thermal: "SW5E.ConsumableExplosiveThermal"
    }
  },
  medical: {
    label: "SW5E.ConsumableMedical",
    subtypes: {
      medpac: "SW5E.ConsumableMedicalMedpac",
      vitapac: "SW5E.ConsumableMedicalVitapac",
      repairkit: "SW5E.ConsumableMedicalRepairKit"
    }
  },
  substance: {
    label: "SW5E.ConsumableSubstance",
    subtypes: {
      adrenal: "SW5E.ConsumableSubstanceAdrenal",
      beverage: "SW5E.ConsumableSubstanceBeverage",
      spice: "SW5E.ConsumableSubstanceSpice",
      stimpac: "SW5E.ConsumableSubstanceStimpac"
    }
  },
  poison: {
    label: "SW5E.ConsumablePoison",
    subtypes: {
      contact: "SW5E.ConsumablePoisonContact",
      ingested: "SW5E.ConsumablePoisonIngested",
      inhaled: "SW5E.ConsumablePoisonInhaled",
      injury: "SW5E.ConsumablePoisonInjury"
    }
  },
  food: {
    label: "SW5E.ConsumableFood"
  },
  technology: {
    label: "SW5E.ConsumableTechnology",
    subtypes: {
      spike: "SW5E.ConsumableTechnologySpike",
      teleporter: "SW5E.ConsumableTechnologyTeleporter"
    }
  },
  trinket: {
    label: "SW5E.ConsumableTrinket"
  }
};
patchConfig("consumableTypes", "label", { since: "SW5e 3.0", until: "SW5e 3.2" });
preLocalize("consumableTypes", { key: "label", sort: true });
for (const [key, type] of Object.entries(SW5E.consumableTypes)) if ("subtypes" in type) preLocalize(`consumableTypes.${key}.subtypes`, { sort: true });

/**
 * Valid ammunition types which are recognized by the system.
 * @enum {string}
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 */
Object.defineProperty(SW5E, "ammoTypes", {
  get() {
    foundry.utils.logCompatibilityWarning(
      "SW5E.ammoTypes has been deprecated and is now accessible through the .ammo.subtypes property on SW5E.consumableTypes.",
      { since: "SW5e 3.0", until: "SW5e 3.2" }
    );
    return SW5E.consumableTypes.ammo.subtypes;
  }
});

/* -------------------------------------------- */

/**
 * Types of containers.
 * @enum {string}
 */
SW5E.containerTypes = {
  backpack: "sw5e.adventuringgear.PN7A13FrDSyo2Neg",
  bottle: "sw5e.adventuringgear.WmT9R9tLTJ9yRTfP",
  camtono: "sw5e.adventuringgear.XuAbKi14AZTKnouv",
  canteen: "sw5e.adventuringgear.diDeGGcu9chi0Sys",
  chest: "sw5e.adventuringgear.MjUTZY5SnDWCaX0o",
  crate: "sw5e.adventuringgear.Y3cPZev6cVmfYpDz",
  pitcher: "sw5e.adventuringgear.tNDMj0ofQupjYbUP",
  pouch: "sw5e.adventuringgear.3hZYvPRii0zqaOdh",
  smugglepack: "sw5e.adventuringgear.xxl1lBqJaegzesdU",
  bucket: "sw5e.adventuringgear.b3D7Wid3bik2Xlst",
  flask: "sw5e.adventuringgear.3IZ4M5tgF6sVeleY",
  hovercart: "sw5e.adventuringgear.NV7w8EsXcNOjGfdy",
  jug: "sw5e.adventuringgear.9ssHBQvPFrSeB9nu",
  pot: "sw5e.adventuringgear.V6HwYvTHkJiubxJS",
  sack: "sw5e.adventuringgear.7ahkqGMiHMWRFtg3",
  tankard: "sw5e.adventuringgear.9hOQLERdixohVRLB",
  vial: "sw5e.adventuringgear.VONgs3pCXP5fPWYc"
};

/* -------------------------------------------- */

/**
 * Configuration data for powercasting foci.
 *
 * @typedef {object} PowercastingFocusConfiguration
 * @property {string} label                    Localized label for this category.
 * @property {Object<string, string>} itemIds  Item IDs or UUIDs.
 */

/**
 * Type of powercasting foci.
 * @enum {PowercastingFocusConfiguration}
 */
SW5E.focusTypes = {
  force: {
    label: "SW5E.Focus.Force",
    itemIds: {
      focusgenerator: "sw5e.adventuringgear.mcGJhS8B2IJgomSB"
    }
  },
  tech: {
    label: "SW5E.Focus.Tech",
    itemIds: {
      wristpad: "sw5e.adventuringgear.1t8Bxbq4vlbkAUzo"
    }
  }
};

/* -------------------------------------------- */

/**
 * Migration data for old 'feat-like items'.
 * @enum {object}
 * @property {string} value       system.type.value data after migration
 * @property {string} [subtype]   system.type.subtype data after migration
 */
SW5E.featLikeItemsMigration = {
  deploymentfeature: {
    value: "deployment"
  },
  classfeature: {
    value: "class"
  },
  fightingmastery: {
    value: "customizationOption",
    subtype: "fightingMastery"
  },
  fightingstyle: {
    value: "customizationOption",
    subtype: "fightingStyle"
  },
  lightsaberform: {
    value: "customizationOption",
    subtype: "lightsaberForm"
  },
  starshipaction: {
    value: "starshipAction"
  },
  starshipfeature: {
    value: "starship"
  },
  venture: {
    value: "deployment",
    subtype: "venture"
  }
};

/*
 * List of deprecated item types
 */
SW5E.deprecatedItemTypes = [...Object.keys(SW5E.featLikeItemsMigration), "starship"];

/**
 * Categorization of all item types.
 */
SW5E.itemTypes = {
  inventory: ["weapon", "equipment", "consumable", "tool", "backpack", "modification", "loot", "starshipmod"],
  class: ["archetype", "background", "class", "deployment", "starshipsize", "species"],
  other: ["feat", "maneuver", "power"]
};

/* -------------------------------------------- */

/**
 * Configuration data for an item with the "feature" type.
 *
 * @typedef {object} FeatureTypeConfiguration
 * @property {string} label                       Localized label for this type.
 * @property {Object<string, string>} [subtypes]  Enum containing localized labels for subtypes.
 */

/**
 * Types of "features" items.
 * @enum {FeatureTypeConfiguration}
 */
SW5E.featureTypes = {
  background: {
    label: "SW5E.Feature.Background"
  },
  class: {
    label: "SW5E.Feature.Class.Label",
    subtypes: {
      berserkerInvocation: "SW5E.Feature.Class.BerserkerInstinct",
      consularForceAffinity: "SW5E.Feature.Class.ConsularForceAffinity",
      consularInvocation: "SW5E.Feature.Class.ConsularFEC",
      engineerInvocation: "SW5E.Feature.Class.EngineerModification",
      fighterInvocation: "SW5E.Feature.Class.FighterStrategy",
      guardianInvocation: "SW5E.Feature.Class.GuardianAura",
      guardianCTF: "SW5E.Feature.Class.GuardianCTF",
      monkFocus: "SW5E.Feature.Class.MonkFocus",
      monkInvocation: "SW5E.Feature.Class.MonkVow",
      multiattack: "SW5E.Feature.Class.Multiattack",
      operativeInvocation: "SW5E.Feature.Class.OperativeExploit",
      scholarInvocation: "SW5E.Feature.Class.ScholarDiscovery",
      scoutInvocation: "SW5E.Feature.Class.ScoutRoutine",
      sentinelInvocation: "SW5E.Feature.Class.SentinelIdeal",
      sentinelFES: "SW5E.Feature.Class.SentinelFES"
    }
  },
  customizationOption: {
    label: "SW5E.Feature.CustomizationOption.Label",
    subtypes: {
      classImprovement: "SW5E.Feature.CustomizationOption.ClassImprovement",
      fightingMastery: "SW5E.Feature.CustomizationOption.FightingMastery",
      fightingStyle: "SW5E.Feature.CustomizationOption.FightingStyle",
      lightsaberForm: "SW5E.Feature.CustomizationOption.LightsaberForm",
      multiclassImprovement: "SW5E.Feature.CustomizationOption.MulticlassImprovement",
      splashclassImprovement: "SW5E.Feature.CustomizationOption.SplashclassImprovement",
      weaponFocus: "SW5E.Feature.CustomizationOption.WeaponFocus",
      weaponSupremacy: "SW5E.Feature.CustomizationOption.WeaponSupremacy"
    }
  },
  deployment: {
    label: "SW5E.Feature.Deployment.Label",
    subtypes: {
      venture: "SW5E.Feature.DeploymentFeature.Venture"
    }
  },
  feat: {
    label: "SW5E.Feature.Feat"
  },
  monster: {
    label: "SW5E.Feature.Monster"
  },
  species: {
    label: "SW5E.Feature.Species"
  },
  starship: {
    label: "SW5E.Feature.Starship.Label",
    subtypes: {
      role: "SW5E.Feature.Starship.Role",
      roleSpecialization: "SW5E.Feature.Starship.RoleSpecialization",
      roleMastery: "SW5E.Feature.Starship.RoleMastery"
    }
  },
  starshipAction: {
    label: "SW5E.Feature.StarshipAction.Label",
    subtypes: {
      pilot: "SW5E.Feature.StarshipAction.Pilot",
      crew: "SW5E.Feature.StarshipAction.Crew",
      passenger: "SW5E.Feature.StarshipAction.Passenger"
    }
  },
  supernaturalGift: {
    label: "SW5E.Feature.SupernaturalGift.Label",
    subtypes: {
      blessing: "SW5E.Feature.SupernaturalGift.Blessing",
      charm: "SW5E.Feature.SupernaturalGift.Charm",
      epicBoon: "SW5E.Feature.SupernaturalGift.EpicBoon"
    }
  }
};
preLocalize("featureTypes", { key: "label" });
for (const [key, type] of Object.entries(SW5E.featureTypes)) if ("subtypes" in type) preLocalize(`featureTypes.${key}.subtypes`, { sort: true });

/* -------------------------------------------- */

/**
 * Configuration data for item properties.
 *
 * @typedef {object} ItemPropertyConfiguration
 * @property {string} label           Localized label.
 * @property {string} [abbreviation]  Localized abbreviation.
 * @property {string} [icon]          Icon that can be used in certain places to represent this property.
 * @property {string} [reference]     Reference to a rule page describing this property.
 * @property {boolean} [isPhysical]   Is this property one that can cause damage resistance bypasses?
 * @property {boolean} [isTag]        Is this power property a tag, rather than a component?
 * @property {boolean} [numeric]      Is this a numeric property?
 * @property {number} [base]          Baseline value when a numeric property is set to null.
 * @property {number} [min]           Minimum value a numeric property can assume.
 * @property {number} [max]           Maximum value a numeric property can assume.
 */

/**
 * The various properties of all item types.
 * @enum {ItemPropertyConfiguration}
 */
SW5E.itemProperties = {
  // Common properties
  concentration: {
    label: "SW5E.Item.Property.Concentration",
    abbreviation: "SW5E.ConcentrationAbbr",
    icon: "systems/sw5e/icons/svg/statuses/concentrating.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ow58p27ctAnr4VPH",
    isTag: true
  },
  foc: {
    label: "SW5E.Item.Property.Focus"
  },
  material: {
    label: "SW5E.Item.Property.Material",
    abbreviation: "SW5E.ComponentMaterialAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.AeH5eDS4YeM9RETC"
  },
  mgc: {
    label: "SW5E.Item.Property.Enhanced",
    isPhysical: true
  },
  ritual: {
    label: "SW5E.Item.Property.Ritual",
    abbreviation: "SW5E.RitualAbbr",
    icon: "systems/sw5e/icons/svg/items/power.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.FjWqT5iyJ89kohdA",
    isTag: true
  },
  somatic: {
    label: "SW5E.Item.Property.Somatic",
    abbreviation: "SW5E.ComponentSomaticAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.qwUNgUNilEmZkSC9"
  },
  vocal: {
    label: "SW5E.Item.Property.Verbal",
    abbreviation: "SW5E.ComponentVerbalAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6UXTNWMCQ0nSlwwx"
  },
  weightlessContents: {
    label: "SW5E.Item.Property.WeightlessContents"
  },

  // Weapon properties
  // amm: {
  //   label: "SW5E.Item.Property.Ammunition"
  // },
  aut: {
    label: "SW5E.Item.Property.Auto"
  },
  bit: {
    label: "SW5E.Item.Property.Biting",
    numeric: true,
    min: 0
  },
  bri: {
    label: "SW5E.Item.Property.Bright",
    numeric: true,
    min: 0
  },
  bru: {
    label: "SW5E.Item.Property.Brutal",
    numeric: true,
    min: 0,
    max: 3
  },
  bur: {
    label: "SW5E.Item.Property.Burst",
    numeric: true,
    min: 2
  },
  cor: {
    label: "SW5E.Item.Property.Corruption",
    numeric: true,
    min: 0
  },
  def: {
    label: "SW5E.Item.Property.Defensive",
    numeric: true,
    min: 0,
    max: 3
  },
  dex: {
    label: "SW5E.Item.Property.Dexterity",
    numeric: true,
    min: 0
  },
  dgd: {
    label: "SW5E.Item.Property.Disguised"
  },
  dir: {
    label: "SW5E.Item.Property.Dire",
    numeric: true,
    min: 0,
    max: 3
  },
  dis: {
    label: "SW5E.Item.Property.Disintegrate",
    numeric: true,
    min: 0
  },
  dou: {
    label: "SW5E.Item.Property.Double"
  },
  dpt: {
    label: "SW5E.Item.Property.Disruptive"
  },
  drm: {
    label: "SW5E.Item.Property.Disarming"
  },
  fin: {
    label: "SW5E.Item.Property.Finesse"
  },
  fix: {
    label: "SW5E.Item.Property.Fixed"
  },
  hid: {
    label: "SW5E.Item.Property.Hidden"
  },
  hvy: {
    label: "SW5E.Item.Property.Heavy"
  },
  ilk: {
    label: "SW5E.Item.Property.Interlocking"
  },
  ken: {
    label: "SW5E.Item.Property.Keen",
    numeric: true,
    min: 0,
    max: 3
  },
  lgt: {
    label: "SW5E.Item.Property.Light"
  },
  // lod: {
  //   label: "SW5E.Item.Property.Loading"
  // },
  lum: {
    label: "SW5E.Item.Property.Luminous"
  },
  mig: {
    label: "SW5E.Item.Property.Mighty"
  },
  mod: {
    label: "SW5E.Item.Property.Modal"
  },
  neu: {
    label: "SW5E.Item.Property.Neuralizing",
    numeric: true,
    min: 0
  },
  pcl: {
    label: "SW5E.Item.Property.PowerCell"
  },
  pen: {
    label: "SW5E.Item.Property.Penetrating",
    numeric: true,
    min: 0
  },
  pic: {
    label: "SW5E.Item.Property.Piercing",
    numeric: true,
    min: 0,
    max: 3
  },
  ran: {
    label: "SW5E.Item.Property.Range"
  },
  rap: {
    label: "SW5E.Item.Property.Rapid",
    numeric: true,
    min: 2
  },
  rch: {
    label: "SW5E.Item.Property.Reach"
  },
  rck: {
    label: "SW5E.Item.Property.Reckless",
    numeric: true,
    min: 0
  },
  rel: {
    label: "SW5E.Item.Property.Reload",
    numeric: true,
    min: 0
  },
  ret: {
    label: "SW5E.Item.Property.Returning"
  },
  shk: {
    label: "SW5E.Item.Property.Shocking",
    numeric: true,
    min: 0
  },
  sil: {
    label: "SW5E.Item.Property.Silent"
  },
  slg: {
    label: "SW5E.Item.Property.SlugCartridge"
  },
  smr: {
    label: "SW5E.Item.Property.Smart"
  },
  son: {
    label: "SW5E.Item.Property.Sonorous",
    numeric: true,
    min: 0
  },
  spc: {
    label: "SW5E.Item.Property.Special"
  },
  spz: {
    label: "SW5E.Item.Property.Specialized",
    numeric: true,
    min: 0
  },
  str: {
    label: "SW5E.Item.Property.Strength",
    numeric: true,
    min: 0
  },
  swi: {
    label: "SW5E.Item.Property.Switch"
  },
  thr: {
    label: "SW5E.Item.Property.Thrown"
  },
  two: {
    label: "SW5E.Item.Property.TwoHanded"
  },
  ver: {
    label: "SW5E.Item.Property.Versatile"
  },
  vic: {
    label: "SW5E.Item.Property.Vicious",
    numeric: true,
    min: 0,
    max: 3
  },

  // Starship weapon properties
  SS_amm: {
    label: "SW5E.Item.Property.Ammunition"
  },
  SS_aut: {
    label: "SW5E.Item.Property.Auto"
  },
  SS_bur: {
    label: "SW5E.Item.Property.Burst",
    numeric: true,
    min: 2
  },
  SS_con: {
    label: "SW5E.Item.Property.Constitution",
    numeric: true,
    min: 0
  },
  SS_dir: {
    label: "SW5E.Item.Property.Dire",
    numeric: true,
    min: 0,
    max: 3
  },
  SS_exp: {
    label: "SW5E.Item.Property.Explosive"
  },
  SS_hid: {
    label: "SW5E.Item.Property.Hidden"
  },
  SS_hom: {
    label: "SW5E.Item.Property.Homing"
  },
  SS_hvy: {
    label: "SW5E.Item.Property.Heavy"
  },
  SS_ion: {
    label: "SW5E.Item.Property.Ionizing"
  },
  SS_ken: {
    label: "SW5E.Item.Property.Keen",
    numeric: true,
    min: 0,
    max: 3
  },
  SS_mlt: {
    label: "SW5E.Item.Property.Melt"
  },
  SS_ovr: {
    label: "SW5E.Item.Property.Overheat",
    numeric: true,
    min: 0
  },
  SS_pic: {
    label: "SW5E.Item.Property.Piercing",
    numeric: true,
    min: 0,
    max: 3
  },
  SS_pow: {
    label: "SW5E.Item.Property.Power"
  },
  SS_ran: {
    label: "SW5E.Item.Property.Range"
  },
  SS_rap: {
    label: "SW5E.Item.Property.Rapid",
    numeric: true,
    min: 2
  },
  SS_rel: {
    label: "SW5E.Item.Property.Reload",
    numeric: true,
    min: 0
  },
  SS_sat: {
    label: "SW5E.Item.Property.Saturate"
  },
  SS_spc: {
    label: "SW5E.Item.Property.Special"
  },
  SS_vic: {
    label: "SW5E.Item.Property.Vicious",
    numeric: true,
    min: 0,
    max: 3
  },
  SS_zon: {
    label: "SW5E.Item.Property.Zone"
  },

  // Armor properties
  A_Absorptive: {
    label: "SW5E.Item.Property.Absorptive",
    numeric: true,
    min: 0,
    max: 3
  },
  A_Agile: {
    label: "SW5E.Item.Property.Agile",
    numeric: true,
    min: 0
  },
  A_Anchor: {
    label: "SW5E.Item.Property.Anchor"
  },
  A_Avoidant: {
    label: "SW5E.Item.Property.Avoidant",
    numeric: true,
    min: 0,
    max: 3
  },
  A_Barbed: {
    label: "SW5E.Item.Property.Barbed"
  },
  A_Bulky: {
    label: "SW5E.Item.Property.Bulky"
  },
  A_Charging: {
    label: "SW5E.Item.Property.Charging",
    numeric: true,
    min: 0,
    max: 3
  },
  A_Concealing: {
    label: "SW5E.Item.Property.Concealing"
  },
  A_Cumbersome: {
    label: "SW5E.Item.Property.Cumbersome"
  },
  A_Gauntleted: {
    label: "SW5E.Item.Property.Gauntleted"
  },
  A_Imbalanced: {
    label: "SW5E.Item.Property.Imbalanced"
  },
  A_Impermeable: {
    label: "SW5E.Item.Property.Impermeable"
  },
  A_Insulated: {
    label: "SW5E.Item.Property.Insulated",
    numeric: true,
    min: 0,
    max: 3
  },
  A_Interlocking: {
    label: "SW5E.Item.Property.Interlocking"
  },
  A_Lambent: {
    label: "SW5E.Item.Property.Lambent"
  },
  A_Lightweight: {
    label: "SW5E.Item.Property.Lightweight"
  },
  A_Magnetic: {
    label: "SW5E.Item.Property.Magnetic",
    numeric: true
  },
  A_Obscured: {
    label: "SW5E.Item.Property.Obscured"
  },
  A_Obtrusive: {
    label: "SW5E.Item.Property.Obtrusive"
  },
  A_Powered: {
    label: "SW5E.Item.Property.Powered",
    numeric: true,
    min: 0
  },
  A_Reactive: {
    label: "SW5E.Item.Property.Reactive",
    numeric: true,
    min: 0,
    max: 3
  },
  A_Regulated: {
    label: "SW5E.Item.Property.Regulated"
  },
  A_Reinforced: {
    label: "SW5E.Item.Property.Reinforced"
  },
  A_Responsive: {
    label: "SW5E.Item.Property.Responsive",
    numeric: true,
    min: 0,
    max: 3
  },
  A_Rigid: {
    label: "SW5E.Item.Property.Rigid"
  },
  A_Silent: {
    label: "SW5E.Item.Property.Silent"
  },
  A_Spiked: {
    label: "SW5E.Item.Property.Spiked"
  },
  A_Strength: {
    label: "SW5E.Item.Property.Strength",
    numeric: true,
    min: 0
  },
  A_Steadfast: {
    label: "SW5E.Item.Property.Steadfast"
  },
  A_Versatile: {
    label: "SW5E.Item.Property.Versatile",
    numeric: true
  },

  // Casting Focus properties
  C_Absorbing: {
    label: "SW5E.CastingPropertyAbsorbing",
    numeric: true
  },
  C_Acessing: {
    label: "SW5E.CastingPropertyAcessing",
    numeric: true
  },
  C_Amplifying: {
    label: "SW5E.CastingPropertyAmplifying",
    numeric: true
  },
  C_Bolstering: {
    label: "SW5E.CastingPropertyBolstering",
    numeric: true
  },
  C_Constitution: {
    label: "SW5E.CastingPropertyConstitution",
    numeric: true
  },
  C_Dispelling: {
    label: "SW5E.CastingPropertyDispelling",
    numeric: true
  },
  C_Elongating: {
    label: "SW5E.CastingPropertyElongating",
    numeric: true
  },
  C_Enlarging: {
    label: "SW5E.CastingPropertyEnlarging",
    numeric: true
  },
  C_Expanding: {
    label: "SW5E.CastingPropertyExpanding",
    numeric: true
  },
  C_Extending: {
    label: "SW5E.CastingPropertyExtending",
    numeric: true
  },
  C_Fading: {
    label: "SW5E.CastingPropertyFading",
    numeric: true
  },
  C_Focused: {
    label: "SW5E.CastingPropertyFocused"
  },
  C_Increasing: {
    label: "SW5E.CastingPropertyIncreasing",
    numeric: true
  },
  C_Inflating: {
    label: "SW5E.CastingPropertyInflating",
    numeric: true
  },
  C_Mitigating: {
    label: "SW5E.CastingPropertyMitigating",
    numeric: true
  },
  C_Ranging: {
    label: "SW5E.CastingPropertyRanging",
    numeric: true
  },
  C_Rending: {
    label: "SW5E.CastingPropertyRending",
    numeric: true
  },
  C_Repelling: {
    label: "SW5E.CastingPropertyRepelling"
  },
  C_Storing: {
    label: "SW5E.CastingPropertyStoring",
    numeric: true
  },
  C_Surging: {
    label: "SW5E.CastingPropertySurging",
    numeric: true
  },
  C_Withering: {
    label: "SW5E.CastingPropertyWithering",
    numeric: true
  }
};
preLocalize("itemProperties", { keys: ["label", "abbreviation"], sort: true });

/* -------------------------------------------- */

/**
 * The various properties of an item per item type.
 * @enum {object}
 */
SW5E.validProperties = {
  consumable: new Set([
    "mgc"
  ]),
  container: new Set([
    "mgc",
    "weightlessContents"
  ]),
  equipment: {
    default: new Set([
      "concentration",
      "mgc"
    ]),
    armor: new Set([
      "A_Absorptive",
      "A_Agile",
      "A_Anchor",
      "A_Avoidant",
      "A_Barbed",
      "A_Bulky",
      "A_Charging",
      "A_Concealing",
      "A_Cumbersome",
      "A_Gauntleted",
      "A_Imbalanced",
      "A_Impermeable",
      "A_Insulated",
      "A_Interlocking",
      "A_Lambent",
      "A_Lightweight",
      "A_Magnetic",
      "A_Obscured",
      "A_Obtrusive",
      "A_Powered",
      "A_Reactive",
      "A_Regulated",
      "A_Reinforced",
      "A_Responsive",
      "A_Rigid",
      "A_Silent",
      "A_Spiked",
      "A_Strength",
      "A_Steadfast",
      "A_Versatile"
    ]),
    focus: new Set([
      "C_Absorbing",
      "C_Acessing",
      "C_Amplifying",
      "C_Bolstering",
      "C_Constitution",
      "C_Dispelling",
      "C_Elongating",
      "C_Enlarging",
      "C_Expanding",
      "C_Extending",
      "C_Fading",
      "C_Focused",
      "C_Increasing",
      "C_Inflating",
      "C_Mitigating",
      "C_Ranging",
      "C_Rending",
      "C_Repelling",
      "C_Storing",
      "C_Surging",
      "C_Withering"
    ])
  },
  feat: new Set([
    "concentration",
    "mgc"
  ]),
  loot: new Set([
    "mgc"
  ]),
  weapon: {
    default: new Set([
      "mgc"
    ]),
    character: new Set([
      // "amm",
      "aut",
      "bit",
      "bri",
      "bru",
      "bur",
      "cor",
      "def",
      "dex",
      "dgd",
      "dir",
      "dis",
      "dou",
      "dpt",
      "drm",
      "fin",
      "fix",
      "hid",
      "hvy",
      "ilk",
      "ken",
      "lgt",
      // "lod",
      "lum",
      "mig",
      "mod",
      "neu",
      "pcl",
      "pen",
      "pic",
      "ran",
      "rap",
      "rch",
      "rck",
      "rel",
      "ret",
      "shk",
      "sil",
      "slg",
      "smr",
      "son",
      "spc",
      "spz",
      "str",
      "swi",
      "thr",
      "two",
      "ver",
      "vic"
    ]),
    starship: new Set([
      "SS_amm",
      "SS_aut",
      "SS_bur",
      "SS_con",
      "SS_dir",
      "SS_exp",
      "SS_hid",
      "SS_hom",
      "SS_hvy",
      "SS_ion",
      "SS_ken",
      "SS_mlt",
      "SS_ovr",
      "SS_pic",
      "SS_pow",
      "SS_ran",
      "SS_rap",
      "SS_rel",
      "SS_sat",
      "SS_spc",
      "SS_vic",
      "SS_zon"
    ])
  },
  power: new Set([
    "vocal",
    "somatic",
    "material",
    "concentration",
    "ritual"
  ]),
  tool: new Set([
    "concentration",
    "mgc"
  ])
};

/* -------------------------------------------- */


/**
 * Configuration data for an item with the "loot" type.
 *
 * @typedef {object} LootTypeConfiguration
 * @property {string} label                       Localized label for this type.
 */

/**
 * Types of "loot" items.
 * @enum {LootTypeConfiguration}
 */
SW5E.lootTypes = {
  art: {
    label: "SW5E.Loot.Art"
  },
  gear: {
    label: "SW5E.Loot.Gear"
  },
  gem: {
    label: "SW5E.Loot.Gem"
  },
  junk: {
    label: "SW5E.Loot.Junk"
  },
  material: {
    label: "SW5E.Loot.Material"
  },
  resource: {
    label: "SW5E.Loot.Resource"
  },
  treasure: {
    label: "SW5E.Loot.Treasure"
  }
};
preLocalize("lootTypes", { key: "label" });

/* -------------------------------------------- */

/**
 * @typedef {object} CurrencyConfiguration
 * @property {string} label         Localized label for the currency.
 * @property {string} abbreviation  Localized abbreviation for the currency.
 * @property {number} conversion    Number by which this currency should be multiplied to arrive at a standard value.
 */

/**
 * The valid currency denominations with localized labels, abbreviations, and conversions.
 * The conversion number defines how many of that currency are equal to one GC.
 * @enum {CurrencyConfiguration} */
SW5E.currencies = {
  gc: {
    label: "SW5E.CurrencyGC",
    abbreviation: "SW5E.CurrencyAbbrGC",
    conversion: 1
  }
};
preLocalize("currencies", { keys: ["label", "abbreviation"] });

/* -------------------------------------------- */

/**
 * The set of possible sensory perception types which an Actor may have.
 * @enum {string}
 */
SW5E.senses = {
  blindsight: "SW5E.SenseBlindsight",
  darkvision: "SW5E.SenseDarkvision",
  tremorsense: "SW5E.SenseTremorsense",
  truesight: "SW5E.SenseTruesight"
};
preLocalize("senses", { sort: true });

/* -------------------------------------------- */
/*  Modifications                               */
/* -------------------------------------------- */

/**
 * Enumerate the valid modification types which are recognized by the system
 */
SW5E.chassisTypes = {
  none: "SW5E.ItemChassisNone",
  chassis: "SW5E.ItemChassisChassis",
  engineer: "SW5E.ItemChassisEngineer"
};
preLocalize("chassisTypes", { sort: true });

/**
 * The number of base augment slots based on chassis rarity.
 */
SW5E.chassisAugmentSlotsByRarity = {
  common: 0,
  uncommon: 0,
  rare: 1,
  veryRare: 1,
  legendary: 2,
  artifact: 2
};

/* -------------------------------------------- */

/**
 * Enumerate the valid modification types which are recognized by the system
 */
SW5E.modificationTypesEquipment = {
  armor: "SW5E.ModTypeArmor",
  clothing: "SW5E.ModTypeClothing",
  shield: "SW5E.ModTypeShield"
};
preLocalize("modificationTypesEquipment", { sort: true });

SW5E.modificationTypesWeapon = {
  blaster: "SW5E.ModTypeBlaster",
  lightweapon: "SW5E.ModTypeLightweapon",
  vibroweapon: "SW5E.ModTypeVibroweapon"
};
preLocalize("modificationTypesWeapon", { sort: true });

SW5E.modificationTypesCasting = {
  focusgenerator: "SW5E.ModTypeFocusgenerator",
  wristpad: "SW5E.ModTypeWristpad"
};
preLocalize("modificationTypesCasting", { sort: true });

SW5E.modificationTypesCreature = {
  cybernetic: "SW5E.ModTypeCybernetic",
  droidcustomization: "SW5E.ModTypeDroidCustomization"
};
preLocalize("modificationTypesCreature", { sort: true });

SW5E.modificationTypes = {
  ...SW5E.modificationTypesEquipment,
  ...SW5E.modificationTypesWeapon,
  ...SW5E.modificationTypesCasting,
  ...SW5E.modificationTypesCreature,
  augment: "SW5E.ModTypeAugment"
};
preLocalize("modificationTypes");

/* -------------------------------------------- */

/**
 * Enumerate the valid modification slots which are recognized by the system
 * @type {object}
 */
SW5E.modificationSlots = {
  armor: {
    slot1: "SW5E.ModSlotOverlay",
    slot2: "SW5E.ModSlotUnderlay",
    slot3: "SW5E.ModSlotReinforcement",
    slot4: "SW5E.ModSlotArmoring"
  },
  blaster: {
    slot1: "SW5E.ModSlotTargeting",
    slot2: "SW5E.ModSlotBarrel",
    slot3: "SW5E.ModSlotCore",
    slot4: "SW5E.ModSlotAttachment"
  },
  clothing: {
    slot1: "SW5E.ModSlotWeave",
    slot2: "SW5E.ModSlotInlay",
    slot3: "SW5E.ModSlotPattern",
    slot4: "SW5E.ModSlotStitching"
  },
  focusgenerator: {
    slot1: "SW5E.ModSlotEmmiter",
    slot2: "SW5E.ModSlotConductor",
    slot3: "SW5E.ModSlotChannel",
    slot4: "SW5E.ModSlotCycler"
  },
  lightweapon: {
    slot1: "SW5E.ModSlotLens",
    slot2: "SW5E.ModSlotCrystal",
    slot3: "SW5E.ModSlotCell",
    slot4: "SW5E.ModSlotHilt"
  },
  shield: {
    slot1: "SW5E.ModSlotOverlay",
    slot2: "SW5E.ModSlotUnderlay",
    slot3: "SW5E.ModSlotReinforcement",
    slot4: "SW5E.ModSlotShielding"
  },
  vibroweapon: {
    slot1: "SW5E.ModSlotGrip",
    slot2: "SW5E.ModSlotEdge",
    slot3: "SW5E.ModSlotOscillator",
    slot4: "SW5E.ModSlotGuard"
  },
  wristpad: {
    slot1: "SW5E.ModSlotProcessor",
    slot2: "SW5E.ModSlotMotherboard",
    slot3: "SW5E.ModSlotAmplifier",
    slot4: "SW5E.ModSlotDataport"
  }
};
preLocalize("modificationSlots", { keys: ["slot1", "slot2", "slot3", "slot4"] });

/* -------------------------------------------- */
/*  Damage Types                                */
/* -------------------------------------------- */

/**
 * Types of damage that are considered physical.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {string}
 */
SW5E.physicalDamageTypes = {
  kinetic: "SW5E.DamageKinetic"
};
preLocalize("physicalDamageTypes", { sort: true });

/**
 * Configuration data for damage types.
 *
 * @typedef {object} DamageTypeConfiguration
 * @property {string} label          Localized label.
 * @property {string} icon           Icon representing this type.
 * @property {boolean} [isPhysical]  Is this a type that can be bypassed by magical or silvered weapons?
 * @property {string} [reference]    Reference to a rule page describing this damage type.
 */

/**
 * Types of damage the can be caused by abilities.
 * @enum {DamageTypeConfiguration}
 */
SW5E.damageTypes = {
  acid: {
    label: "SW5E.DamageAcid",
    icon: "systems/sw5e/icons/svg/damage/acid.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.IQhbKRPe1vCPdh8v"
  },
  cold: {
    label: "SW5E.DamageCold",
    icon: "systems/sw5e/icons/svg/damage/cold.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.4xsFUooHDEdfhw6g"
  },
  energy: {
    label: "SW5E.DamageEnergy",
    icon: "systems/sw5e/icons/svg/damage/energy.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5tcK9buXWDOw8yHH"
  },
  fire: {
    label: "SW5E.DamageFire",
    icon: "systems/sw5e/icons/svg/damage/fire.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.f1S66aQJi4PmOng6"
  },
  force: {
    label: "SW5E.DamageForce",
    icon: "systems/sw5e/icons/svg/damage/force.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.eFTWzngD8dKWQuUR"
  },
  ion: {
    label: "SW5E.DamageIon",
    icon: "systems/sw5e/icons/svg/damage/ion.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.eFTWzngD8dKWQuUR"
  },
  kinetic: {
    label: "SW5E.DamageKinetic",
    icon: "systems/sw5e/icons/svg/damage/kinetic.svg",
    isPhysical: true,
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.39LFrlef94JIYO8m"
  },
  lightning: {
    label: "SW5E.DamageLightning",
    icon: "systems/sw5e/icons/svg/damage/lightning.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9SaxFJ9bM3SutaMC"
  },
  necrotic: {
    label: "SW5E.DamageNecrotic",
    icon: "systems/sw5e/icons/svg/damage/acid.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.klOVUV5G1U7iaKoG"
  },
  poison: {
    label: "SW5E.DamagePoison",
    icon: "systems/sw5e/icons/svg/statuses/poisoned.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.k5wOYXdWPzcWwds1"
  },
  psychic: {
    label: "SW5E.DamagePsychic",
    icon: "systems/sw5e/icons/svg/damage/psychic.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.YIKbDv4zYqbE5teJ"
  },
  sonic: {
    label: "SW5E.DamageSonic",
    icon: "systems/sw5e/icons/svg/damage/sonic.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iqsmMHk7FSpiNkQy"
  }
};
patchConfig("damageTypes", "label", { since: "SW5e 3.0", until: "SW5e 3.2" });
preLocalize("damageTypes", { keys: ["label"], sort: true });

/**
 * Different types of healing that can be applied using abilities.
 * @enum {string}
 */
SW5E.healingTypes = {
  healing: {
    label: "SW5E.Healing",
    icon: "systems/sw5e/icons/svg/damage/healing.svg"
  },
  temphp: {
    label: "SW5E.HealingTemp",
    icon: "systems/sw5e/icons/svg/damage/temphp.svg"
  }
};
patchConfig("healingTypes", "label", { since: "SW5e 3.0", until: "SW5e 3.2" });
preLocalize("healingTypes", { keys: ["label"] });

/* -------------------------------------------- */
/*  Movement                                    */
/* -------------------------------------------- */

/**
 * The valid units of measure for movement distances in the game system.
 * By default this uses the imperial units of feet and miles.
 * @enum {string}
 */
SW5E.movementTypes = {
  burrow: "SW5E.MovementBurrow",
  climb: "SW5E.MovementClimb",
  crawl: "SW5E.MovementCrawl",
  fly: "SW5E.MovementFly",
  roll: "SW5E.MovementRoll",
  space: "SW5E.MovementSpace",
  swim: "SW5E.MovementSwim",
  turn: "SW5E.MovementTurn",
  walk: "SW5E.MovementWalk"
};
preLocalize("movementTypes", { sort: true });

/* -------------------------------------------- */
/*  Measurement                                 */
/* -------------------------------------------- */

/**
 * The valid units of measure for movement distances in the game system.
 * By default this uses the imperial units of feet and miles.
 * @enum {string}
 */
SW5E.movementUnits = {
  ft: "SW5E.DistFt",
  mi: "SW5E.DistMi",
  m: "SW5E.DistM",
  km: "SW5E.DistKm"
};
preLocalize("movementUnits");

/* -------------------------------------------- */

/**
 * The types of range that are used for measuring actions and effects.
 * @enum {string}
 */
SW5E.rangeTypes = {
  self: "SW5E.DistSelf",
  touch: "SW5E.DistTouch",
  spec: "SW5E.Special",
  any: "SW5E.DistAny"
};
preLocalize("rangeTypes");

/* -------------------------------------------- */

/**
 * The valid units of measure for the range of an action or effect. A combination of `SW5E.movementUnits` and
 * `SW5E.rangeUnits`.
 * @enum {string}
 */
SW5E.distanceUnits = {
  ...SW5E.movementUnits,
  ...SW5E.rangeTypes
};
preLocalize("distanceUnits");

/* -------------------------------------------- */

/**
 * Encumbrance configuration data.
 *
 * @typedef {object} EncumbranceConfiguration
 * @property {Record<string, number>} currencyPerWeight  Pieces of currency that equal a base weight (lbs or kgs).
 * @property {Record<string, object>} effects            Data used to create encumbrance-replated Active Effects.
 * @property {object} threshold                          Amount to multiply strength to get given capacity threshold.
 * @property {Record<string, number>} threshold.encumbered
 * @property {Record<string, number>} threshold.heavilyEncumbered
 * @property {Record<string, number>} threshold.maximum
 * @property {Record<string, number>} speedReduction     Speed reduction caused by encumbered status effects.
 * @property {Record<string, number>} vehicleWeightMultiplier  Multiplier used to determine vehicle carrying capacity.
 */

/**
 * Configure aspects of encumbrance calculation so that it could be configured by modules.
 * @type {EncumbranceConfiguration}
 */
SW5E.encumbrance = {
  currencyPerWeight: {
    imperial: 50,
    metric: 110
  },
  effects: {
    encumbered: {
      name: "EFFECT.SW5E.StatusEncumbered",
      icon: "systems/sw5e/icons/svg/statuses/encumbered.svg"
    },
    heavilyEncumbered: {
      name: "EFFECT.SW5E.StatusHeavilyEncumbered",
      icon: "systems/sw5e/icons/svg/statuses/heavily-encumbered.svg"
    },
    exceedingCarryingCapacity: {
      name: "EFFECT.SW5E.StatusExceedingCarryingCapacity",
      icon: "systems/sw5e/icons/svg/statuses/exceeding-carrying-capacity.svg"
    }
  },
  threshold: {
    encumbered: {
      imperial: 5,
      metric: 2.2
    },
    heavilyEncumbered: {
      imperial: 10,
      metric: 4.5
    },
    maximum: {
      imperial: 15,
      metric: 6.8
    }
  },
  speedReduction: {
    encumbered: 10,
    heavilyEncumbered: 20
  },
  vehicleWeightMultiplier: {
    imperial: 2000, // 2000 lbs in an imperial ton
    metric: 1000 // 1000 kg in a metric ton
  }
};
Object.defineProperty(SW5E.encumbrance, "strMultiplier", {
  get() {
    foundry.utils.logCompatibilityWarning(
      "`SW5E.encumbrance.strMultiplier` has been moved to `SW5E.encumbrance.threshold.maximum`.",
      { since: "SW5e 3.0", until: "SW5e 3.2" }
    );
    return this.threshold.maximum;
  }
});
preLocalize("encumbrance.effects", { key: "name" });

/* -------------------------------------------- */
/*  Targeting                                   */
/* -------------------------------------------- */

/**
 * Targeting types that apply to one or more distinct targets.
 * @enum {string}
 */
SW5E.individualTargetTypes = {
  self: "SW5E.TargetSelf",
  ally: "SW5E.TargetAlly",
  enemy: "SW5E.TargetEnemy",
  creature: "SW5E.TargetCreature",
  droid: "SW5E.TargetDroid",
  object: "SW5E.TargetObject",
  space: "SW5E.TargetSpace",
  creatureOrObject: "SW5E.TargetCreatureOrObject",
  any: "SW5E.TargetAny",
  willing: "SW5E.TargetWilling",
  starship: "SW5E.TargetStarship",
  weapon: "SW5E.TargetWeapon"
};
preLocalize("individualTargetTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Information needed to represent different area of effect target types.
 *
 * @typedef {object} AreaTargetDefinition
 * @property {string} label        Localized label for this type.
 * @property {string} template     Type of `MeasuredTemplate` create for this target type.
 * @property {string} [reference]  Reference to a rule page describing this area of effect.
 */

/**
 * Targeting types that cover an area.
 * @enum {AreaTargetDefinition}
 */
SW5E.areaTargetTypes = {
  radius: {
    label: "SW5E.TargetRadius",
    template: "circle"
  },
  sphere: {
    label: "SW5E.TargetSphere",
    template: "circle",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.npdEWb2egUPnB5Fa"
  },
  cylinder: {
    label: "SW5E.TargetCylinder",
    template: "circle",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.jZFp4R7tXsIqkiG3"
  },
  cone: {
    label: "SW5E.TargetCone",
    template: "cone",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.DqqAOr5JnX71OCOw"
  },
  square: {
    label: "SW5E.TargetSquare",
    template: "rect"
  },
  cube: {
    label: "SW5E.TargetCube",
    template: "rect",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.dRfDIwuaHmUQ06uA"
  },
  line: {
    label: "SW5E.TargetLine",
    template: "ray",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6DOoBgg7okm9gBc6"
  },
  wall: {
    label: "SW5E.TargetWall",
    template: "ray"
  }
};
preLocalize("areaTargetTypes", { key: "label", sort: true });

/* -------------------------------------------- */

/**
 * The types of single or area targets which can be applied to abilities.
 * @enum {string}
 */
SW5E.targetTypes = {
  ...SW5E.individualTargetTypes,
  ...Object.fromEntries(Object.entries(SW5E.areaTargetTypes).map(([k, v]) => [k, v.label]))
};
preLocalize("targetTypes", { sort: true });

/* -------------------------------------------- */
/*  Hit Dice                                    */
/* -------------------------------------------- */

/**
 * Denominations of hit dice which can apply to classes.
 * @type {string[]}
 */
SW5E.hitDieTypes = ["d4", "d6", "d8", "d10", "d12", "d20"];

/* -------------------------------------------- */

/**
 * Default average roll for hit dice each hit die size for the values of `SW5E.hitDieTypes`.
 * @enum {number}
 */
SW5E.hitDieAvg = {
  d4: 3,
  d6: 4,
  d8: 5,
  d10: 6,
  d12: 7,
  d20: 11
};

/* -------------------------------------------- */
/*  Starships                                   */
/* -------------------------------------------- */

/**
 * Enumerate the denominations of power dice which can apply to starships in the SW5E system
 * @type {string[]}
 */
SW5E.powerDieTypes = ["d1", "d4", "d6", "d8", "d10", "d12"];

/* -------------------------------------------- */

/**
 * Starship power die slots
 * @enum {string}
 */
SW5E.powerDieSlots = {
  central: "SW5E.PowerDieSlotCentral",
  comms: "SW5E.PowerDieSlotComms",
  engines: "SW5E.PowerDieSlotEngines",
  sensors: "SW5E.PowerDieSlotSensors",
  shields: "SW5E.PowerDieSlotShields",
  weapons: "SW5E.PowerDieSlotWeapons"
};
preLocalize("powerDieSlots");

/* -------------------------------------------- */

/**
 * Starship power routing options
 * @enum {string}
 */
SW5E.powerRoutingOpts = {
  engines: "SW5E.PowerRoutingEngines",
  shields: "SW5E.PowerRoutingShields",
  weapons: "SW5E.PowerRoutingWeapons"
};
preLocalize("powerRoutingOpts", { sort: true });

/* -------------------------------------------- */

/**
 * Starship power routing effects
 * @enum {string}
 */
SW5E.powerRoutingEffects = {
  engines: {
    positive: "SW5E.PowerRoutingEnginesPositive",
    neutral: "SW5E.PowerRoutingEnginesNeutral",
    negative: "SW5E.PowerRoutingEnginesNegative"
  },
  shields: {
    positive: "SW5E.PowerRoutingShieldsPositive",
    neutral: "SW5E.PowerRoutingShieldsNeutral",
    negative: "SW5E.PowerRoutingShieldsNegative"
  },
  weapons: {
    positive: "SW5E.PowerRoutingWeaponsPositive",
    neutral: "SW5E.PowerRoutingWeaponsNeutral",
    negative: "SW5E.PowerRoutingWeaponsNegative"
  }
};
preLocalize("powerRoutingEffects", { keys: ["positive", "neutral", "negative"] });

/* -------------------------------------------- */

/**
 * Starship modification system
 * @enum {string}
 */
SW5E.ssModSystems = {
  Engineering: "SW5E.ModSystemEngineering",
  Operation: "SW5E.ModSystemOperation",
  Suite: "SW5E.ModSystemSuite",
  Universal: "SW5E.ModSystemUniversal",
  Weapon: "SW5E.ModSystemWeapon"
};
preLocalize("ssModSystems", { sort: true });

/* -------------------------------------------- */

/**
 * Starship modification system base cost
 * @enum {string}
 */
SW5E.ssModSystemsBaseCost = {
  engineering: 3500,
  operation: 3500,
  suite: 5000,
  universal: 4000,
  weapon: 3000
};

/* -------------------------------------------- */

/**
 * Enumerate the upgrade costs as they apply to starships in the SW5E system based on Tier.
 * @type {number[]}
 */
SW5E.ssBaseUpgradeCost = [0, 3900, 77500, 297000, 620000, 1150000];

/* -------------------------------------------- */

/**
 * Starship Crew Station types
 * @enum {string}
 */
SW5E.ssCrewStationTypes = {
  pilot: "SW5E.CrewStationTypePilot",
  crew: "SW5E.CrewStationTypeCrew",
  passenger: "SW5E.CrewStationTypePassenger"
};
preLocalize("ssCrewStationTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Starship Crew Station types plural
 * @enum {string}
 */
SW5E.ssCrewStationTypesPlural = {
  pilot: "SW5E.CrewStationTypePilotPl",
  crew: "SW5E.CrewStationTypeCrewPl",
  passenger: "SW5E.CrewStationTypePassengerPl"
};
preLocalize("ssCrewStationTypesPlural", { sort: true });

/* -------------------------------------------- */

/**
 * Starship Deployable actor types
 * @type {string[]}
 */
SW5E.ssDeployableTypes = ["character", "npc"];

/* -------------------------------------------- */

/**
 * Default equipments to be added on starship creation
 */
SW5E.ssDefaultEquipment = [
  "Compendium.sw5e.starshipequipment.oqB8RltTDjHnaS1Y",
  "Compendium.sw5e.starshipequipment.jk7zL3cqhufDKsuh",
  "Compendium.sw5e.starshipequipment.InvkgxmcbufkjOUR",
  "Compendium.sw5e.starshiparmor.RvtLP3FgKLBYBHSf",
  "Compendium.sw5e.starshiparmor.aG6mKPerYCFmkI00",
  "Compendium.sw5e.starships.6liD1m4hqKSeS5sp"
];

/* -------------------------------------------- */

/**
 * The fields of the details tab of a starship type
 * @enum {{
 *   field: string,
 *   name: string,
 *   [select]: string,
 *   [move]: boolean
 * }}
 */
SW5E.ssTypeDetails = {
  tier: { name: "SW5E.StarshipTier" },
  hullDice: {
    name: "SW5E.HullDice",
    select: "hitDieTypes"
  },
  hullDiceStart: { name: "SW5E.HullDiceStart" },
  hullDiceUsed: { name: "SW5E.HullDiceUsed" },
  shldDice: {
    name: "SW5E.ShieldDice",
    select: "hitDieTypes"
  },
  shldDiceStart: { name: "SW5E.ShieldDiceStart" },
  shldDiceUsed: { name: "SW5E.ShieldDiceUsed" },
  buildBaseCost: { name: "SW5E.StockCost" },
  buildMinWorkforce: { name: "SW5E.MinConstWorkforce" },
  upgrdCostMult: { name: "SW5E.UpgradeCostMult" },
  upgrdMinWorkforce: { name: "SW5E.UpgradeMinWorkforce" },
  baseSpaceSpeed: { name: "SW5E.BaseSpaceSpeed", move: true },
  baseTurnSpeed: { name: "SW5E.BaseTurnSpeed", move: true },
  crewMinWorkforce: { name: "SW5E.MinCrew" },
  modBaseCap: { name: "SW5E.ModCap" },
  modMaxSuitesBase: { name: "SW5E.ModMaxSuitesBase" },
  modMaxSuitesMult: { name: "SW5E.ModMaxSuitesMult" },
  modCostMult: { name: "SW5E.ModCostMult" },
  modMinWorkforce: { name: "SW5E.ModMinWorkforce" },
  hardpointMult: { name: "SW5E.HardpointStrMult" },
  equipCostMult: { name: "SW5E.EquipCostMult" },
  equipMinWorkforce: { name: "SW5E.EquipMinWorkforce" },
  cargoCap: { name: "SW5E.CargoCap" },
  fuelCost: { name: "SW5E.FuelCostPerUnit" },
  fuelCap: { name: "SW5E.FuelCapacity" },
  foodCap: { name: "SW5E.FoodCap" }
};
preLocalize("ssTypeDetails", { key: "name" });

/* -------------------------------------------- */
/*  Powercasting                                */
/* -------------------------------------------- */

/**
 * Various different ways a power can be prepared.
 * @enum {string}
 */
SW5E.powerPreparationModes = {
  prepared: "SW5E.PowerPrepPrepared",
  always: "SW5E.PowerPrepAlways",
  atwill: "SW5E.PowerPrepAtWill",
  innate: "SW5E.PowerPrepInnate"
};
preLocalize("powerPreparationModes");

/* -------------------------------------------- */

/**
 * Subset of `SW5E.powerPreparationModes` that consume power points.
 * @type {string[]}
 */
SW5E.powerUpcastModes = ["always", "prepared"];

/* -------------------------------------------- */

/**
 * The available choices for power progression for a character class
 * @enum {string}
 */
SW5E.powerProgression = {
  none: "SW5E.PowerProgNone",
  full: "SW5E.PowerProgFull",
  "3/4": "SW5E.PowerProg3/4",
  half: "SW5E.PowerProgHalf",
  arch: "SW5E.PowerProgArch"
};
preLocalize("powerProgression");

/* -------------------------------------------- */

/**
 * The max number of known powers available to each class per level
 * @type {number[]}  progressionType[classLevel]
 */
SW5E.powersKnown = {
  force: {
    full: [0, 9, 11, 13, 15, 17, 19, 21, 23, 25, 26, 28, 29, 31, 32, 34, 35, 37, 38, 39, 40],
    "3/4": [0, 7, 9, 11, 13, 15, 17, 18, 19, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34, 35],
    half: [0, 5, 7, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24, 25, 27, 28, 29, 30],
    arch: [0, 0, 0, 4, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24, 25]
  },
  tech: {
    full: [0, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    "3/4": [0, 0, 0, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    half: [0, 0, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    arch: [0, 0, 0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  }
};

/* -------------------------------------------- */

/**
 * The number of base force/tech points available to each class per level
 * @type {number} progressionType
 */
SW5E.powerPointsBase = {
  full: 4,
  "3/4": 3,
  half: 2,
  arch: 1
};

/* -------------------------------------------- */

/**
 * The attributes you can add to your force/tech points maximum
 * @type {number} progressionType
 */
SW5E.powerPointsBonus = {
  force: ["wis", "cha"],
  tech: ["int"]
};

/* -------------------------------------------- */

/**
 * The focus that affects this type of powercasting
 * @type {string} progressionType
 */
SW5E.powerFocus = {
  force: "focusgenerator",
  tech: "wristpad"
};

/* -------------------------------------------- */
/**
 * The focus property that adds bonus power points
 * @type {string} progressionType
 */
SW5E.powerFocusBonus = {
  force: "c_Bolstering",
  tech: "c_Surging"
};

/* -------------------------------------------- */

/**
 * The max level of a known/overpowered power available to each class per level
 * @type {number[]} progressionType[classLevel]
 */
SW5E.powerMaxLevel = {
  full: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
  "3/4": [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7],
  half: [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  arch: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]
};

/* -------------------------------------------- */

/**
 * The first level for which you can only cast once per long rest
 * @type {number} progressionType[powerLevel]
 */
SW5E.powerLimit = {
  full: 6,
  "3/4": 5,
  half: 4,
  arch: 4
};

/* -------------------------------------------- */

/**
 * The available choices for how power damage scaling may be computed.
 * @enum {string}
 */
SW5E.powerScalingModes = {
  none: "SW5E.PowerNone",
  atwill: "SW5E.PowerAtWill",
  level: "SW5E.PowerLevel"
};
preLocalize("powerScalingModes", { sort: true });

/* -------------------------------------------- */

/**
 * Configuration data for power components.
 *
 * @typedef {object} PowerComponentConfiguration
 * @property {string} label         Localized label.
 * @property {string} abbr          Localized abbreviation.
 * @property {string} [reference]   Reference to a rule page describing this component.
 */

/**
 * Types of components that can be required when casting a power.
 * @enum {PowerComponentConfiguration}
 */
SW5E.powerComponents = {
  vocal: {
    label: "SW5E.ComponentVerbal",
    abbr: "SW5E.ComponentVerbalAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6UXTNWMCQ0nSlwwx"
  },
  somatic: {
    label: "SW5E.ComponentSomatic",
    abbr: "SW5E.ComponentSomaticAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.qwUNgUNilEmZkSC9"
  },
  material: {
    label: "SW5E.ComponentMaterial",
    abbr: "SW5E.ComponentMaterialAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.AeH5eDS4YeM9RETC"
  }
};
preLocalize("powerComponents", { keys: ["label", "abbr"] });

/* -------------------------------------------- */

/**
 * Configuration data for power tags.
 *
 * @typedef {object} PowerTagConfiguration
 * @property {string} label         Localized label.
 * @property {string} abbr          Localized abbreviation.
 * @property {string} icon          Icon representing this tag.
 * @property {string} [reference]   Reference to a rule page describing this tag.
 */

/**
 * Supplementary rules keywords that inform a power's use.
 * @enum {PowerTagConfiguration}
 */
SW5E.powerTags = {
  concentration: {
    label: "SW5E.Concentration",
    abbr: "SW5E.ConcentrationAbbr",
    icon: "systems/sw5e/icons/svg/statuses/concentrating.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ow58p27ctAnr4VPH"
  },
  ritual: {
    label: "SW5E.Ritual",
    abbr: "SW5E.RitualAbbr",
    icon: "systems/sw5e/icons/svg/items/power.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.FjWqT5iyJ89kohdA"
  },
  freeLearn: {
    label: "SW5E.FreeLearn",
    abbr: "SW5E.FreeLearnAbbr",
    icon: "systems/sw5e/icons/svg/items/book.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.FjWqT5iyJ89kohdA"
  }
};
preLocalize("powerTags", { keys: ["label", "abbr"] });

/* -------------------------------------------- */

/**
 * Configuration data for power schools.
 *
 * @typedef {object} PowerSchoolConfiguration
 * @property {string} label        Localized label.
 * @property {string} icon         Power school icon.
 * @property {string} fullKey      Fully written key used as alternate for enrichers.
 * @property {string} [reference]  Reference to a rule page describing this school.
 * @property {bool}   [isForce]    Are the powers of this school force powers?
 * @property {bool}   [isTech]    Are the powers of this school tech powers?
 */

/**
 * Schools to which a power can belong.
 * @enum {PowerSchoolConfiguration}
 */
SW5E.powerSchools = {
  lgt: {
    label: "SW5E.SchoolLgt",
    icon: "systems/sw5e/icons/svg/schools/light.svg",
    fullKey: "light",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.849AYEWw9FHD6JNz",
    isForce: true
  },
  uni: {
    label: "SW5E.SchoolUni",
    icon: "systems/sw5e/icons/svg/schools/universal.svg",
    fullKey: "universal",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.TWyKMhZJZGqQ6uls",
    isForce: true
  },
  drk: {
    label: "SW5E.SchoolDrk",
    icon: "systems/sw5e/icons/svg/schools/dark.svg",
    fullKey: "dark",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.HoD2MwzmVbMqj9se",
    isForce: true
  },
  tec: {
    label: "SW5E.SchoolTec",
    icon: "systems/sw5e/icons/svg/schools/tech.svg",
    fullKey: "tech",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.SehPXk24ySBVOwCZ",
    isTech: true
  },
  enh: {
    label: "SW5E.SchoolEnh",
    icon: "systems/sw5e/icons/svg/schools/enhanced.svg",
    fullKey: "enhanced"
  }
};
preLocalize("powerSchools", { key: "label", sort: true });
patchConfig("powerSchools", "label", { since: "SW5e 3.0", until: "SW5e 3.2" });

/* -------------------------------------------- */

/**
 * Valid power levels.
 * @enum {string}
 */
SW5E.powerLevels = {
  0: "SW5E.PowerLevel0",
  1: "SW5E.PowerLevel1",
  2: "SW5E.PowerLevel2",
  3: "SW5E.PowerLevel3",
  4: "SW5E.PowerLevel4",
  5: "SW5E.PowerLevel5",
  6: "SW5E.PowerLevel6",
  7: "SW5E.PowerLevel7",
  8: "SW5E.PowerLevel8",
  9: "SW5E.PowerLevel9"
};
preLocalize("powerLevels");

// TODO SW5E: This is used for spell scrolls, it maps the level to the compendium ID of the item
// the spell would be bound to. We could use this with, say, holocrons to produce scrolls
/**
 * Power Scroll Compendium UUIDs
 * Power scroll item ID within the `SW5E.sourcePacks` compendium for each level.
 * @enum {string}

SW5E.powerScrollIds = {
  0: "rQ6sO7HDWzqMhSI3",
  1: "9GSfMg0VOA2b4uFN",
  2: "XdDp6CKh9qEvPTuS",
  3: "hqVKZie7x9w3Kqds",
  4: "DM7hzgL836ZyUFB1",
  5: "wa1VF8TXHmkrrR35",
  6: "tI3rWx4bxefNCexS",
  7: "mtyw4NS1s7j2EJaD",
  8: "aOrinPg7yuDZEuWr",
  9: "O4YbkJkLlnsgUszZ"
};
 */

/* -------------------------------------------- */
/*  Superiority                                 */
/* -------------------------------------------- */

/**
 * Types to which a maneuver can belong.
 * @enum {string}
 */
SW5E.maneuverTypes = {
  general: "SW5E.ManeuverTypeGeneral",
  physical: "SW5E.ManeuverTypePhysical",
  mental: "SW5E.ManeuverTypeMental"
};
preLocalize("maneuverTypes");

/**
 * Enumerate the denominations of superiority dice which can apply to characters in the SW5E system
 * @type {string[]}
 */
SW5E.superiorityDieTypes = ["d4", "d6", "d8", "d10", "d12"];

/* -------------------------------------------- */

/**
 * Enumerate the types of superiority progression in the SW5E system
 * @enum {string}
 */
SW5E.superiorityProgression = {
  0: "SW5E.None",
  0.5: "SW5E.Half",
  1: "SW5E.Full"
};
preLocalize("superiorityProgression");

/**
 * The max number of superiority dice available per superiority level
 * @type {number[]}
 */
SW5E.superiorityDiceQuantProgression = [0, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12];

/**
 * The size of the superiority die per superiority level
 * @type {number[]}
 */
SW5E.superiorityDieSizeProgression = [
  "",
  "d4",
  "d4",
  "d4",
  "d4",
  "d6",
  "d6",
  "d6",
  "d6",
  "d8",
  "d8",
  "d8",
  "d8",
  "d10",
  "d10",
  "d10",
  "d10",
  "d12",
  "d12",
  "d12",
  "d12"
];

/**
 * The max number of known maneuvers available per superiority level
 * @type {number[]}
 */
SW5E.maneuversKnownProgression = [0, 1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24];

/* -------------------------------------------- */
/*  Weapon Details                              */
/* -------------------------------------------- */

/**
 * The set of types which a non-starship weapon item can take.
 * @enum {string}
 */
SW5E.weaponStandardTypes = {
  ammo: "SW5E.WeaponAmmo",
  improv: "SW5E.WeaponImprov",
  exoticB: "SW5E.WeaponExoticB",
  exoticLW: "SW5E.WeaponExoticLW",
  exoticVW: "SW5E.WeaponExoticVW",
  martialB: "SW5E.WeaponMartialB",
  martialLW: "SW5E.WeaponMartialLW",
  martialVW: "SW5E.WeaponMartialVW",
  natural: "SW5E.WeaponNatural",
  siege: "SW5E.WeaponSiege",
  simpleB: "SW5E.WeaponSimpleB",
  simpleLW: "SW5E.WeaponSimpleLW",
  simpleVW: "SW5E.WeaponSimpleVW"
};
preLocalize("weaponStandardTypes");

/**
 * The set of types which a starship weapon item can take.
 * @enum {string}
 */
SW5E.weaponStarshipTypes = {
  "primary (starship)": "SW5E.WeaponPrimarySW",
  "secondary (starship)": "SW5E.WeaponSecondarySW",
  "tertiary (starship)": "SW5E.WeaponTertiarySW",
  "quaternary (starship)": "SW5E.WeaponQuaternarySW"
};
preLocalize("weaponStarshipTypes");

/**
 * The set of types which a weapon item can take.
 * @enum {string}
 */
SW5E.weaponTypes = {
  ...SW5E.weaponStandardTypes,
  ...SW5E.weaponStarshipTypes
};
preLocalize("weaponTypes");

/**
 * The set of weapon size flags which can exist on a starship weapon.
 * @enum {string}
 */
SW5E.weaponSizes = {
  tiny: "SW5E.SizeTiny",
  sm: "SW5E.SizeSmall",
  med: "SW5E.SizeMedium",
  lg: "SW5E.SizeLarge",
  huge: "SW5E.SizeHuge",
  grg: "SW5E.SizeGargantuan"
};
preLocalize("weaponSizes");

/**
 * The set of melee weapon classifications.
 * @enum {string}
 */
SW5E.meleeWeaponClasses = {
  blade: "SW5E.WeaponClassBlade",
  crushing: "SW5E.WeaponClassCrushing",
  polearm: "SW5E.WeaponClassPolearm",
  trip: "SW5E.WeaponClassTrip"
};
preLocalize("meleeWeaponClasses");

/**
 * The set of ranged weapon classifications.
 * @enum {string}
 */
SW5E.rangedWeaponClasses = {
  carbine: "SW5E.WeaponClassCarbine",
  heavy: "SW5E.WeaponClassHeavy",
  rifle: "SW5E.WeaponClassRifle",
  sidearm: "SW5E.WeaponClassSidearm"
};
preLocalize("rangedWeaponClasses");

/**
 * The set of weapon classifications.
 * @enum {string}
 */
SW5E.weaponClasses = {
  ...SW5E.meleeWeaponClasses,
  ...SW5E.rangedWeaponClasses
};
preLocalize("weaponClasses");

/**
 * The set of firing arcs for starship weapons.
 * @enum {{
 *    label: string,
 *    direction: [number],
 *    angle: [number],
 * }}
 */
SW5E.weaponFiringArcs = {
  forward: {
    label: "SW5E.FiringArcForward",
    direction: 0,
    shape: "cone"
  },
  rear: {
    label: "SW5E.FiringArcRear",
    direction: 180,
    shape: "cone"
  },
  left: {
    label: "SW5E.FiringArcLeft",
    direction: 270,
    shape: "cone"
  },
  right: {
    label: "SW5E.FiringArcRight",
    direction: 90,
    shape: "cone"
  },
  turret: {
    label: "SW5E.FiringArcTurret",
    direction: 0,
    shape: "circle"
  },
  broadside: {
    label: "SW5E.FiringArcBroadside"
  }
};
preLocalize("weaponFiringArcs", { keys: ["label"], sort: false });

/* -------------------------------------------- */

/**
 * A subset of weapon properties that determine the physical characteristics of the weapon.
 * These properties are used for determining physical resistance bypasses.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 * }}
 */
SW5E.physicalWeaponProperties = {
  mgc: {
    name: "SW5E.WeaponPropertyEnh",
    full: "SW5E.WeaponPropertyEnhFull",
    desc: "SW5E.WeaponPropertyEnhDesc",
    type: "Boolean"
  }
};
preLocalize("physicalWeaponProperties", { keys: ["name", "full", "desc"] });

/**
 * The set of weapon property flags which can exist on any weapon.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 * }}
 */
SW5E.weaponCommonProperties = {
  ...SW5E.physicalWeaponProperties,
  aut: {
    name: "SW5E.WeaponPropertyAut",
    full: "SW5E.WeaponPropertyAutFull",
    desc: "SW5E.WeaponPropertyAutDesc",
    type: "Boolean"
  },
  bur: {
    name: "SW5E.WeaponPropertyBur",
    full: "SW5E.WeaponPropertyBurFull",
    desc: "SW5E.WeaponPropertyBurDesc",
    type: "Number",
    min: 2
  },
  dir: {
    name: "SW5E.WeaponPropertyDir",
    full: "SW5E.WeaponPropertyDirFull",
    desc: "SW5E.WeaponPropertyDirDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  hvy: {
    name: "SW5E.WeaponPropertyHvy",
    full: "SW5E.WeaponPropertyHvyFull",
    desc: "SW5E.WeaponPropertyHvyDesc",
    type: "Boolean"
  },
  hid: {
    name: "SW5E.WeaponPropertyHid",
    full: "SW5E.WeaponPropertyHidFull",
    desc: "SW5E.WeaponPropertyHidDesc",
    type: "Boolean"
  },
  ken: {
    name: "SW5E.WeaponPropertyKen",
    full: "SW5E.WeaponPropertyKenFull",
    desc: "SW5E.WeaponPropertyKenDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  pic: {
    name: "SW5E.WeaponPropertyPic",
    full: "SW5E.WeaponPropertyPicFull",
    desc: "SW5E.WeaponPropertyPicDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  ran: {
    name: "SW5E.WeaponPropertyRan",
    full: "SW5E.WeaponPropertyRanFull",
    desc: "SW5E.WeaponPropertyRanDesc",
    type: "Boolean"
  },
  rap: {
    name: "SW5E.WeaponPropertyRap",
    full: "SW5E.WeaponPropertyRapFull",
    desc: "SW5E.WeaponPropertyRapDesc",
    type: "Number",
    min: 2
  },
  rel: {
    name: "SW5E.WeaponPropertyRel",
    full: "SW5E.WeaponPropertyRelFull",
    desc: "SW5E.WeaponPropertyRelDesc",
    type: "Number",
    min: 0
  },
  smr: {
    name: "SW5E.WeaponPropertySmr",
    full: "SW5E.WeaponPropertySmrFull",
    desc: "SW5E.WeaponPropertySmrDesc",
    type: "Boolean"
  },
  spc: {
    name: "SW5E.WeaponPropertySpc",
    full: "SW5E.WeaponPropertySpcFull",
    desc: "SW5E.WeaponPropertySpcDesc",
    type: "Boolean"
  },
  vic: {
    name: "SW5E.WeaponPropertyVic",
    full: "SW5E.WeaponPropertyVicFull",
    desc: "SW5E.WeaponPropertyVicDesc",
    type: "Number",
    min: 0,
    max: 3
  }
};
preLocalize("weaponCommonProperties", { keys: ["name", "full", "desc"] });

/**
 * The set of weapon property flags which can exist only on a character (non-starship) weapon.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 *   [ship]: boolean
 * }}
 */
SW5E.weaponCharacterProperties = {
  bit: {
    name: "SW5E.WeaponPropertyBit",
    full: "SW5E.WeaponPropertyBitFull",
    desc: "SW5E.WeaponPropertyBitDesc",
    type: "Number",
    min: 0
  },
  bri: {
    name: "SW5E.WeaponPropertyBri",
    full: "SW5E.WeaponPropertyBriFull",
    desc: "SW5E.WeaponPropertyBriDesc",
    type: "Number",
    min: 0
  },
  bru: {
    name: "SW5E.WeaponPropertyBru",
    full: "SW5E.WeaponPropertyBruFull",
    desc: "SW5E.WeaponPropertyBruDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  cor: {
    name: "SW5E.WeaponPropertyCor",
    full: "SW5E.WeaponPropertyCorFull",
    desc: "SW5E.WeaponPropertyCorDesc",
    type: "Number",
    min: 0
  },
  def: {
    name: "SW5E.WeaponPropertyDef",
    full: "SW5E.WeaponPropertyDefFull",
    desc: "SW5E.WeaponPropertyDefDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  dex: {
    name: "SW5E.WeaponPropertyDex",
    full: "SW5E.WeaponPropertyDexFull",
    desc: "SW5E.WeaponPropertyDexDesc",
    type: "Number",
    min: 0
  },
  drm: {
    name: "SW5E.WeaponPropertyDrm",
    full: "SW5E.WeaponPropertyDrmFull",
    desc: "SW5E.WeaponPropertyDrmDesc",
    type: "Boolean"
  },
  dgd: {
    name: "SW5E.WeaponPropertyDgd",
    full: "SW5E.WeaponPropertyDgdFull",
    desc: "SW5E.WeaponPropertyDgdDesc",
    type: "Boolean"
  },
  dis: {
    name: "SW5E.WeaponPropertyDis",
    full: "SW5E.WeaponPropertyDisFull",
    desc: "SW5E.WeaponPropertyDisDesc",
    type: "Number",
    min: 0
  },
  dpt: {
    name: "SW5E.WeaponPropertyDpt",
    full: "SW5E.WeaponPropertyDptFull",
    desc: "SW5E.WeaponPropertyDptDesc",
    type: "Boolean"
  },
  dou: {
    name: "SW5E.WeaponPropertyDou",
    full: "SW5E.WeaponPropertyDouFull",
    desc: "SW5E.WeaponPropertyDouDesc",
    type: "Boolean"
  },
  fin: {
    name: "SW5E.WeaponPropertyFin",
    full: "SW5E.WeaponPropertyFinFull",
    desc: "SW5E.WeaponPropertyFinDesc",
    type: "Boolean"
  },
  fix: {
    name: "SW5E.WeaponPropertyFix",
    full: "SW5E.WeaponPropertyFixFull",
    desc: "SW5E.WeaponPropertyFixDesc",
    type: "Boolean"
  },
  ilk: {
    name: "SW5E.WeaponPropertyIlk",
    full: "SW5E.WeaponPropertyIlkFull",
    desc: "SW5E.WeaponPropertyIlkDesc",
    type: "Boolean"
  },
  lgt: {
    name: "SW5E.WeaponPropertyLgt",
    full: "SW5E.WeaponPropertyLgtFull",
    desc: "SW5E.WeaponPropertyLgtDesc",
    type: "Boolean"
  },
  lum: {
    name: "SW5E.WeaponPropertyLum",
    full: "SW5E.WeaponPropertyLumFull",
    desc: "SW5E.WeaponPropertyLumDesc",
    type: "Boolean"
  },
  mig: {
    name: "SW5E.WeaponPropertyMig",
    full: "SW5E.WeaponPropertyMigFull",
    desc: "SW5E.WeaponPropertyMigDesc",
    type: "Boolean"
  },
  mod: {
    name: "SW5E.WeaponPropertyMod",
    full: "SW5E.WeaponPropertyModFull",
    desc: "SW5E.WeaponPropertyModDesc",
    type: "Boolean"
  },
  neu: {
    name: "SW5E.WeaponPropertyNeu",
    full: "SW5E.WeaponPropertyNeuFull",
    desc: "SW5E.WeaponPropertyNeuDesc",
    type: "Number",
    min: 0
  },
  pen: {
    name: "SW5E.WeaponPropertyPen",
    full: "SW5E.WeaponPropertyPenFull",
    desc: "SW5E.WeaponPropertyPenDesc",
    type: "Number",
    min: 0
  },
  pcl: {
    name: "SW5E.WeaponPropertyPcl",
    full: "SW5E.WeaponPropertyPclFull",
    desc: "SW5E.WeaponPropertyPclDesc",
    type: "Boolean"
  },
  rch: {
    name: "SW5E.WeaponPropertyRch",
    full: "SW5E.WeaponPropertyRchFull",
    desc: "SW5E.WeaponPropertyRchDesc",
    type: "Boolean"
  },
  rck: {
    name: "SW5E.WeaponPropertyRck",
    full: "SW5E.WeaponPropertyRckFull",
    desc: "SW5E.WeaponPropertyRckDesc",
    type: "Number",
    min: 0
  },
  ret: {
    name: "SW5E.WeaponPropertyRet",
    full: "SW5E.WeaponPropertyRetFull",
    desc: "SW5E.WeaponPropertyRetDesc",
    type: "Boolean"
  },
  shk: {
    name: "SW5E.WeaponPropertyShk",
    full: "SW5E.WeaponPropertyShkFull",
    desc: "SW5E.WeaponPropertyShkDesc",
    type: "Number",
    min: 0
  },
  sil: {
    name: "SW5E.WeaponPropertySil",
    full: "SW5E.WeaponPropertySilFull",
    desc: "SW5E.WeaponPropertySilDesc",
    type: "Boolean"
  },
  slg: {
    name: "SW5E.WeaponPropertySlg",
    full: "SW5E.WeaponPropertySlgFull",
    desc: "SW5E.WeaponPropertySlgDesc",
    type: "Boolean"
  },
  son: {
    name: "SW5E.WeaponPropertySon",
    full: "SW5E.WeaponPropertySonFull",
    desc: "SW5E.WeaponPropertySonDesc",
    type: "Number",
    min: 0
  },
  spz: {
    name: "SW5E.WeaponPropertySpz",
    full: "SW5E.WeaponPropertySpzFull",
    desc: "SW5E.WeaponPropertySpzDesc",
    type: "Number",
    min: 0
  },
  str: {
    name: "SW5E.WeaponPropertyStr",
    full: "SW5E.WeaponPropertyStrFull",
    desc: "SW5E.WeaponPropertyStrDesc",
    type: "Number",
    min: 0
  },
  swi: {
    name: "SW5E.WeaponPropertySwi",
    full: "SW5E.WeaponPropertySwiFull",
    desc: "SW5E.WeaponPropertySwiDesc",
    type: "Boolean"
  },
  thr: {
    name: "SW5E.WeaponPropertyThr",
    full: "SW5E.WeaponPropertyThrFull",
    desc: "SW5E.WeaponPropertyThrDesc",
    type: "Boolean"
  },
  two: {
    name: "SW5E.WeaponPropertyTwo",
    full: "SW5E.WeaponPropertyTwoFull",
    desc: "SW5E.WeaponPropertyTwoDesc",
    type: "Boolean"
  },
  ver: {
    name: "SW5E.WeaponPropertyVer",
    full: "SW5E.WeaponPropertyVerFull",
    desc: "SW5E.WeaponPropertyVerDesc",
    type: "Boolean"
  }
};
preLocalize("weaponCharacterProperties", { keys: ["name", "full", "desc"] });

/**
 * The set of weapon property flags which can exist only on a starship weapon.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 *   [ship]: boolean
 * }}
 */
SW5E.weaponStarshipProperties = {
  con: {
    name: "SW5E.WeaponPropertyCon",
    full: "SW5E.WeaponPropertyConFull",
    desc: "SW5E.WeaponPropertyConDesc",
    type: "Number",
    min: 0
  },
  exp: {
    name: "SW5E.WeaponPropertyExp",
    full: "SW5E.WeaponPropertyExpFull",
    desc: "SW5E.WeaponPropertyExpDesc",
    type: "Boolean"
  },
  hom: {
    name: "SW5E.WeaponPropertyHom",
    full: "SW5E.WeaponPropertyHomFull",
    desc: "SW5E.WeaponPropertyHomDesc",
    type: "Boolean"
  },
  ion: {
    name: "SW5E.WeaponPropertyIon",
    full: "SW5E.WeaponPropertyIonFull",
    desc: "SW5E.WeaponPropertyIonDesc",
    type: "Boolean"
  },
  mlt: {
    name: "SW5E.WeaponPropertyMlt",
    full: "SW5E.WeaponPropertyMltFull",
    desc: "SW5E.WeaponPropertyMltDesc",
    type: "Boolean"
  },
  ovr: {
    name: "SW5E.WeaponPropertyOvr",
    full: "SW5E.WeaponPropertyOvrFull",
    desc: "SW5E.WeaponPropertyOvrDesc",
    type: "Number",
    min: 0
  },
  pow: {
    name: "SW5E.WeaponPropertyPow",
    full: "SW5E.WeaponPropertyPowFull",
    desc: "SW5E.WeaponPropertyPowDesc",
    type: "Boolean"
  },
  sat: {
    name: "SW5E.WeaponPropertySat",
    full: "SW5E.WeaponPropertySatFull",
    desc: "SW5E.WeaponPropertySatDesc",
    type: "Boolean"
  },
  zon: {
    name: "SW5E.WeaponPropertyZon",
    full: "SW5E.WeaponPropertyZonFull",
    desc: "SW5E.WeaponPropertyZonDesc",
    type: "Boolean"
  }
};
preLocalize("weaponStarshipProperties", { keys: ["name", "full", "desc"] });

/* -------------------------------------------- */

/**
 * The set of weapon property flags which can exist on a weapon.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 *   [ship]: boolean
 * }}
 */
SW5E.weaponProperties = {
  ...SW5E.weaponCommonProperties,
  ...SW5E.weaponCharacterProperties,
  ...SW5E.weaponStarshipProperties
};

/**
 * The full set of weapon property flags which can exist on a character (non-starship) weapon.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 *   [ship]: boolean
 * }}
 */
SW5E.weaponFullCharacterProperties = {
  ...SW5E.weaponCommonProperties,
  ...SW5E.weaponCharacterProperties
};

/**
 * The full set of weapon property flags which can exist on a starship weapon.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 *   [ship]: boolean
 * }}
 */
SW5E.weaponFullStarshipProperties = {
  ...SW5E.weaponCommonProperties,
  ...SW5E.weaponStarshipProperties
};

/* -------------------------------------------- */
/*  Equipment Properties                        */
/* -------------------------------------------- */

/**
 * The set of armor property flags which can exist on any armor.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 * }}
 */
SW5E.armorProperties = {
  Absorptive: {
    name: "SW5E.ArmorPropertyAbsorptive",
    full: "SW5E.ArmorPropertyAbsorptiveFull",
    desc: "SW5E.ArmorPropertyAbsorptiveDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  Agile: {
    name: "SW5E.ArmorPropertyAgile",
    full: "SW5E.ArmorPropertyAgileFull",
    desc: "SW5E.ArmorPropertyAgileDesc",
    type: "Number",
    min: 0
  },
  Anchor: {
    name: "SW5E.ArmorPropertyAnchor",
    full: "SW5E.ArmorPropertyAnchorFull",
    desc: "SW5E.ArmorPropertyAnchorDesc",
    type: "Boolean"
  },
  Avoidant: {
    name: "SW5E.ArmorPropertyAvoidant",
    full: "SW5E.ArmorPropertyAvoidantFull",
    desc: "SW5E.ArmorPropertyAvoidantDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  Barbed: {
    name: "SW5E.ArmorPropertyBarbed",
    full: "SW5E.ArmorPropertyBarbedFull",
    desc: "SW5E.ArmorPropertyBarbedDesc",
    type: "Boolean"
  },
  Bulky: {
    name: "SW5E.ArmorPropertyBulky",
    full: "SW5E.ArmorPropertyBulkyFull",
    desc: "SW5E.ArmorPropertyBulkyDesc",
    type: "Boolean"
  },
  Charging: {
    name: "SW5E.ArmorPropertyCharging",
    full: "SW5E.ArmorPropertyChargingFull",
    desc: "SW5E.ArmorPropertyChargingDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  Concealing: {
    name: "SW5E.ArmorPropertyConcealing",
    full: "SW5E.ArmorPropertyConcealingFull",
    desc: "SW5E.ArmorPropertyConcealingDesc",
    type: "Boolean"
  },
  Cumbersome: {
    name: "SW5E.ArmorPropertyCumbersome",
    full: "SW5E.ArmorPropertyCumbersomeFull",
    desc: "SW5E.ArmorPropertyCumbersomeDesc",
    type: "Boolean"
  },
  Gauntleted: {
    name: "SW5E.ArmorPropertyGauntleted",
    full: "SW5E.ArmorPropertyGauntletedFull",
    desc: "SW5E.ArmorPropertyGauntletedDesc",
    type: "Boolean"
  },
  Imbalanced: {
    name: "SW5E.ArmorPropertyImbalanced",
    full: "SW5E.ArmorPropertyImbalancedFull",
    desc: "SW5E.ArmorPropertyImbalancedDesc",
    type: "Boolean"
  },
  Impermeable: {
    name: "SW5E.ArmorPropertyImpermeable",
    full: "SW5E.ArmorPropertyImpermeableFull",
    desc: "SW5E.ArmorPropertyImpermeableDesc",
    type: "Boolean"
  },
  Insulated: {
    name: "SW5E.ArmorPropertyInsulated",
    full: "SW5E.ArmorPropertyInsulatedFull",
    desc: "SW5E.ArmorPropertyInsulatedDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  Interlocking: {
    name: "SW5E.ArmorPropertyInterlocking",
    full: "SW5E.ArmorPropertyInterlockingFull",
    desc: "SW5E.ArmorPropertyInterlockingDesc",
    type: "Boolean"
  },
  Lambent: {
    name: "SW5E.ArmorPropertyLambent",
    full: "SW5E.ArmorPropertyLambentFull",
    desc: "SW5E.ArmorPropertyLambentDesc",
    type: "Boolean"
  },
  Lightweight: {
    name: "SW5E.ArmorPropertyLightweight",
    full: "SW5E.ArmorPropertyLightweightFull",
    desc: "SW5E.ArmorPropertyLightweightDesc",
    type: "Boolean"
  },
  Magnetic: {
    name: "SW5E.ArmorPropertyMagnetic",
    full: "SW5E.ArmorPropertyMagneticFull",
    desc: "SW5E.ArmorPropertyMagneticDesc",
    type: "Number"
  },
  Obscured: {
    name: "SW5E.ArmorPropertyObscured",
    full: "SW5E.ArmorPropertyObscuredFull",
    desc: "SW5E.ArmorPropertyObscuredDesc",
    type: "Boolean"
  },
  Obtrusive: {
    name: "SW5E.ArmorPropertyObtrusive",
    full: "SW5E.ArmorPropertyObtrusiveFull",
    desc: "SW5E.ArmorPropertyObtrusiveDesc",
    type: "Boolean"
  },
  Powered: {
    name: "SW5E.ArmorPropertyPowered",
    full: "SW5E.ArmorPropertyPoweredFull",
    desc: "SW5E.ArmorPropertyPoweredDesc",
    type: "Number",
    min: 0
  },
  Reactive: {
    name: "SW5E.ArmorPropertyReactive",
    full: "SW5E.ArmorPropertyReactiveFull",
    desc: "SW5E.ArmorPropertyReactiveDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  Regulated: {
    name: "SW5E.ArmorPropertyRegulated",
    full: "SW5E.ArmorPropertyRegulatedFull",
    desc: "SW5E.ArmorPropertyRegulatedDesc",
    type: "Boolean"
  },
  Reinforced: {
    name: "SW5E.ArmorPropertyReinforced",
    full: "SW5E.ArmorPropertyReinforcedFull",
    desc: "SW5E.ArmorPropertyReinforcedDesc",
    type: "Boolean"
  },
  Responsive: {
    name: "SW5E.ArmorPropertyResponsive",
    full: "SW5E.ArmorPropertyResponsiveFull",
    desc: "SW5E.ArmorPropertyResponsiveDesc",
    type: "Number",
    min: 0,
    max: 3
  },
  Rigid: {
    name: "SW5E.ArmorPropertyRigid",
    full: "SW5E.ArmorPropertyRigidFull",
    desc: "SW5E.ArmorPropertyRigidDesc",
    type: "Boolean"
  },
  Silent: {
    name: "SW5E.ArmorPropertySilent",
    full: "SW5E.ArmorPropertySilentFull",
    desc: "SW5E.ArmorPropertySilentDesc",
    type: "Boolean"
  },
  Spiked: {
    name: "SW5E.ArmorPropertySpiked",
    full: "SW5E.ArmorPropertySpikedFull",
    desc: "SW5E.ArmorPropertySpikedDesc",
    type: "Boolean"
  },
  Strength: {
    name: "SW5E.ArmorPropertyStrength",
    full: "SW5E.ArmorPropertyStrengthFull",
    desc: "SW5E.ArmorPropertyStrengthDesc",
    type: "Number",
    min: 0
  },
  Steadfast: {
    name: "SW5E.ArmorPropertySteadfast",
    full: "SW5E.ArmorPropertySteadfastFull",
    desc: "SW5E.ArmorPropertySteadfastDesc",
    type: "Boolean"
  },
  Versatile: {
    name: "SW5E.ArmorPropertyVersatile",
    full: "SW5E.ArmorPropertyVersatileFull",
    desc: "SW5E.ArmorPropertyVersatileDesc",
    type: "Number"
  }
};
preLocalize("armorProperties", { keys: ["name", "full", "desc"] });

/**
 * The set of casting property flags which can exist on any casting focus.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string,
 *   [min]: number,
 *   [max]: number,
 * }}
 */
SW5E.castingProperties = {
  c_Absorbing: {
    name: "SW5E.CastingPropertyAbsorbing",
    full: "SW5E.CastingPropertyAbsorbingFull",
    desc: "SW5E.CastingPropertyAbsorbingDesc",
    type: "Number"
  },
  c_Acessing: {
    name: "SW5E.CastingPropertyAcessing",
    full: "SW5E.CastingPropertyAcessingFull",
    desc: "SW5E.CastingPropertyAcessingDesc",
    type: "Number"
  },
  c_Amplifying: {
    name: "SW5E.CastingPropertyAmplifying",
    full: "SW5E.CastingPropertyAmplifyingFull",
    desc: "SW5E.CastingPropertyAmplifyingDesc",
    type: "Number"
  },
  c_Bolstering: {
    name: "SW5E.CastingPropertyBolstering",
    full: "SW5E.CastingPropertyBolsteringFull",
    desc: "SW5E.CastingPropertyBolsteringDesc",
    type: "Number"
  },
  c_Constitution: {
    name: "SW5E.CastingPropertyConstitution",
    full: "SW5E.CastingPropertyConstitutionFull",
    desc: "SW5E.CastingPropertyConstitutionDesc",
    type: "Number"
  },
  c_Dispelling: {
    name: "SW5E.CastingPropertyDispelling",
    full: "SW5E.CastingPropertyDispellingFull",
    desc: "SW5E.CastingPropertyDispellingDesc",
    type: "Number"
  },
  c_Elongating: {
    name: "SW5E.CastingPropertyElongating",
    full: "SW5E.CastingPropertyElongatingFull",
    desc: "SW5E.CastingPropertyElongatingDesc",
    type: "Number"
  },
  c_Enlarging: {
    name: "SW5E.CastingPropertyEnlarging",
    full: "SW5E.CastingPropertyEnlargingFull",
    desc: "SW5E.CastingPropertyEnlargingDesc",
    type: "Number"
  },
  c_Expanding: {
    name: "SW5E.CastingPropertyExpanding",
    full: "SW5E.CastingPropertyExpandingFull",
    desc: "SW5E.CastingPropertyExpandingDesc",
    type: "Number"
  },
  c_Extending: {
    name: "SW5E.CastingPropertyExtending",
    full: "SW5E.CastingPropertyExtendingFull",
    desc: "SW5E.CastingPropertyExtendingDesc",
    type: "Number"
  },
  c_Fading: {
    name: "SW5E.CastingPropertyFading",
    full: "SW5E.CastingPropertyFadingFull",
    desc: "SW5E.CastingPropertyFadingDesc",
    type: "Number"
  },
  c_Focused: {
    name: "SW5E.CastingPropertyFocused",
    full: "SW5E.CastingPropertyFocusedFull",
    desc: "SW5E.CastingPropertyFocusedDesc",
    type: "Boolean"
  },
  c_Increasing: {
    name: "SW5E.CastingPropertyIncreasing",
    full: "SW5E.CastingPropertyIncreasingFull",
    desc: "SW5E.CastingPropertyIncreasingDesc",
    type: "Number"
  },
  c_Inflating: {
    name: "SW5E.CastingPropertyInflating",
    full: "SW5E.CastingPropertyInflatingFull",
    desc: "SW5E.CastingPropertyInflatingDesc",
    type: "Number"
  },
  c_Mitigating: {
    name: "SW5E.CastingPropertyMitigating",
    full: "SW5E.CastingPropertyMitigatingFull",
    desc: "SW5E.CastingPropertyMitigatingDesc",
    type: "Number"
  },
  c_Ranging: {
    name: "SW5E.CastingPropertyRanging",
    full: "SW5E.CastingPropertyRangingFull",
    desc: "SW5E.CastingPropertyRangingDesc",
    type: "Number"
  },
  c_Rending: {
    name: "SW5E.CastingPropertyRending",
    full: "SW5E.CastingPropertyRendingFull",
    desc: "SW5E.CastingPropertyRendingDesc",
    type: "Number"
  },
  c_Repelling: {
    name: "SW5E.CastingPropertyRepelling",
    full: "SW5E.CastingPropertyRepellingFull",
    desc: "SW5E.CastingPropertyRepellingDesc",
    type: "Boolean"
  },
  c_Storing: {
    name: "SW5E.CastingPropertyStoring",
    full: "SW5E.CastingPropertyStoringFull",
    desc: "SW5E.CastingPropertyStoringDesc",
    type: "Number"
  },
  c_Surging: {
    name: "SW5E.CastingPropertySurging",
    full: "SW5E.CastingPropertySurgingFull",
    desc: "SW5E.CastingPropertySurgingDesc",
    type: "Number"
  },
  c_Withering: {
    name: "SW5E.CastingPropertyWithering",
    full: "SW5E.CastingPropertyWitheringFull",
    desc: "SW5E.CastingPropertyWitheringDesc",
    type: "Number"
  }
};
preLocalize("castingProperties", { keys: ["name", "full", "desc"] });

/**
 * The set of equipment property flags which can exist on an equipment.
 * @deprecated since SW5e 3.0, available until SW5e 3.2
 * @enum {{
 *   name: string,
 *   full: string,
 *   type: string
 *   [min]: number,
 *   [max]: number,
 *   [ship]: boolean
 * }}
 */
SW5E.equipmentProperties = {
  ...SW5E.armorProperties,
  ...SW5E.castingProperties
};

/* -------------------------------------------- */

/**
 * Compendium packs used for localized items.
 * @enum {string}
 */
SW5E.sourcePacks = {
  ITEMS: "sw5e.items"
};

/* -------------------------------------------- */
/*  ???                                         */
/* -------------------------------------------- */

/**
 * Settings to configure how actors are merged when polymorphing is applied.
 * @enum {string}
 */
SW5E.polymorphSettings = {
  keepPhysical: "SW5E.PolymorphKeepPhysical",
  keepMental: "SW5E.PolymorphKeepMental",
  keepSaves: "SW5E.PolymorphKeepSaves",
  keepSkills: "SW5E.PolymorphKeepSkills",
  mergeSaves: "SW5E.PolymorphMergeSaves",
  mergeSkills: "SW5E.PolymorphMergeSkills",
  keepClass: "SW5E.PolymorphKeepClass",
  keepFeats: "SW5E.PolymorphKeepFeats",
  keepPowers: "SW5E.PolymorphKeepPowers",
  keepItems: "SW5E.PolymorphKeepItems",
  keepBio: "SW5E.PolymorphKeepBio",
  keepVision: "SW5E.PolymorphKeepVision",
  keepSelf: "SW5E.PolymorphKeepSelf"
};
preLocalize("polymorphSettings", { sort: true });

/**
 * Settings to configure how actors are effects are merged when polymorphing is applied.
 * @enum {string}
 */
SW5E.polymorphEffectSettings = {
  keepAE: "SW5E.PolymorphKeepAE",
  keepOtherOriginAE: "SW5E.PolymorphKeepOtherOriginAE",
  keepOriginAE: "SW5E.PolymorphKeepOriginAE",
  keepEquipmentAE: "SW5E.PolymorphKeepEquipmentAE",
  keepFeatAE: "SW5E.PolymorphKeepFeatureAE",
  keepPowerAE: "SW5E.PolymorphKeepPowerAE",
  keepClassAE: "SW5E.PolymorphKeepClassAE",
  keepBackgroundAE: "SW5E.PolymorphKeepBackgroundAE"
};
preLocalize("polymorphEffectSettings", { sort: true });

/**
 * Settings to configure how actors are merged when preset polymorphing is applied.
 * @enum {object}
 */
SW5E.transformationPresets = {
  wildshape: {
    icon: '<i class="fas fa-paw"></i>',
    label: "SW5E.PolymorphWildShape",
    options: {
      keepBio: true,
      keepClass: true,
      keepMental: true,
      mergeSaves: true,
      mergeSkills: true,
      keepEquipmentAE: false
    }
  },
  polymorph: {
    icon: '<i class="fas fa-pastafarianism"></i>',
    label: "SW5E.Polymorph",
    options: {
      keepEquipmentAE: false,
      keepClassAE: false,
      keepFeatAE: false,
      keepBackgroundAE: false
    }
  },
  polymorphSelf: {
    icon: '<i class="fas fa-eye"></i>',
    label: "SW5E.PolymorphSelf",
    options: {
      keepSelf: true
    }
  }
};
preLocalize("transformationPresets", { sort: true, keys: ["label"] });

/* -------------------------------------------- */

/**
 * Skill, ability, and tool proficiency levels.
 * The key for each level represents its proficiency multiplier.
 * @enum {string}
 */
SW5E.proficiencyLevels = {
  0: {
    label: "SW5E.NotProficient",
    mult: 0,
    icon: "far fa-circle",
    sort: "0"
  },
  0.5: {
    label: "SW5E.Trained",
    mult: 0.5,
    icon: "fas fa-adjust",
    sort: "1"
  },
  1: {
    label: "SW5E.Proficient",
    mult: 1,
    icon: "fas fa-check",
    sort: "2"
  },
  2: {
    label: "SW5E.Expertise",
    mult: 2,
    icon: "fas fa-check-double",
    sort: "3"
  },
  3: {
    label: "SW5E.Mastery",
    mult: 2,
    icon: "fas fa-star-half",
    sort: "4"
  },
  4: {
    label: "SW5E.HighMastery",
    mult: 2,
    icon: "fas fa-star-half-alt",
    sort: "5"
  },
  5: {
    label: "SW5E.GrandMastery",
    mult: 2,
    icon: "fas fa-star",
    sort: "6"
  }
};
preLocalize("proficiencyLevels", { key: "label" });

SW5E.proficiencyLevelsOrdered = Object.keys(SW5E.proficiencyLevels)
  .map(p => Number(p))
  .sort((a, b) => a - b);

SW5E.proficiencyLevelsLabels = Object.fromEntries(Object.entries(SW5E.proficiencyLevels).map(([k, v]) => [k, v.label]));
preLocalize("proficiencyLevelsLabels");

/* -------------------------------------------- */

/**
 * Weapon and armor item proficiency levels.
 * @enum {string}
 */
SW5E.weaponAndArmorProficiencyLevels = {
  0: "SW5E.NotProficient",
  1: "SW5E.Proficient"
};
preLocalize("weaponAndArmorProficiencyLevels");

/* -------------------------------------------- */

/**
 * The amount of cover provided by an object. In cases where multiple pieces
 * of cover are in play, we take the highest value.
 * @enum {string}
 */
SW5E.cover = {
  0: "SW5E.None",
  0.25: "SW5E.CoverOneQuarter",
  0.5: "SW5E.CoverHalf",
  0.75: "SW5E.CoverThreeQuarters",
  1: "SW5E.CoverTotal"
};
preLocalize("cover");

/* -------------------------------------------- */

/**
 * A selection of actor attributes that can be tracked on token resource bars.
 * @type {string[]}
 * @deprecated since v10
 */
SW5E.trackableAttributes = [
  "attributes.ac.value",
  "attributes.init.bonus",
  "attributes.movement",
  "attributes.senses",
  "attributes.powerForceLightDC",
  "attributes.powerForceDarkDC",
  "attributes.powerForceUnivDC",
  "attributes.powerTechDC",
  "attributes.powerLevel",
  "details.cr",
  "details.powerLevel",
  "details.xp.value",
  "skills.*.passive",
  "abilities.*.value"
];

/* -------------------------------------------- */

/**
 * A selection of actor and item attributes that are valid targets for item resource consumption.
 * @type {string[]}
 */
SW5E.consumableResources = [
  // Configured during init.
];

/* -------------------------------------------- */

/**
 * Configuration data for system conditions.
 *
 * @typedef {object} ConditionConfiguration
 * @property {string} label        Localized label for the condition.
 * @property {string} [icon]       Icon used to represent the condition on the token.
 * @property {string} [reference]  UUID of a journal entry with details on this condition.
 * @property {string} [special]    Set this condition as a special status effect under this name.
 */

/**
 * Conditions that can affect an actor.
 * @enum {ConditionConfiguration}
 */
SW5E.conditionTypes = {
  blinded: {
    label: "SW5E.ConBlinded",
    icon: "systems/sw5e/icons/svg/statuses/blinded.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.0b8N4FymGGfbZGpJ",
    special: "BLIND"
  },
  charmed: {
    label: "SW5E.ConCharmed",
    icon: "systems/sw5e/icons/svg/statuses/charmed.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.zZaEBrKkr66OWJvD"
  },
  corroded: {
    label: "SW5E.ConCorroded",
    icon: "systems/sw5e/icons/svg/statuses/corroded.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.UWw13ISmMxDzmwbd"
  },
  deafened: {
    label: "SW5E.ConDeafened",
    icon: "systems/sw5e/icons/svg/statuses/deafened.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.6G8JSjhn701cBITY"
  },
  diseased: {
    label: "SW5E.ConDiseased",
    icon: "icons/svg/biohazard.svg"
  },
  exhaustion: {
    label: "SW5E.ConExhaustion",
    icon: "systems/sw5e/icons/svg/statuses/exhaustion.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.cspWveykstnu3Zcv"
  },
  frightened: {
    label: "SW5E.ConFrightened",
    icon: "systems/sw5e/icons/svg/statuses/frightened.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.oreoyaFKnvZCrgij"
  },
  grappled: {
    label: "SW5E.ConGrappled",
    icon: "systems/sw5e/icons/svg/statuses/grappled.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.gYDAhd02ryUmtwZn"
  },
  ignited: {
    label: "SW5E.ConIgnited",
    icon: "systems/sw5e/icons/svg/statuses/ignited.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.UWw13ISmMxDzmwbd"
  },
  incapacitated: {
    label: "SW5E.ConIncapacitated",
    icon: "systems/sw5e/icons/svg/statuses/incapacitated.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.TpkZgLfxCmSndmpb"
  },
  invisible: {
    label: "SW5E.ConInvisible",
    icon: "systems/sw5e/icons/svg/statuses/invisible.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.3UU5GCTVeRDbZy9u"
  },
  paralyzed: {
    label: "SW5E.ConParalyzed",
    icon: "systems/sw5e/icons/svg/statuses/paralyzed.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.xnSV5hLJIMaTABXP",
    statuses: ["incapacitated"]
  },
  petrified: {
    label: "SW5E.ConPetrified",
    icon: "systems/sw5e/icons/svg/statuses/petrified.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.xaNDaW6NwQTgHSmi",
    statuses: ["incapacitated"]
  },
  poisoned: {
    label: "SW5E.ConPoisoned",
    icon: "systems/sw5e/icons/svg/statuses/poisoned.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.lq3TRI6ZlED8ABMx"
  },
  prone: {
    label: "SW5E.ConProne",
    icon: "systems/sw5e/icons/svg/statuses/prone.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.y0TkcdyoZlOTmAFT"
  },
  restrained: {
    label: "SW5E.ConRestrained",
    icon: "systems/sw5e/icons/svg/statuses/restrained.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.cSVcyZyNe2iG1fIc"
  },
  shocked: {
    label: "SW5E.ConShocked",
    icon: "systems/sw5e/icons/svg/statuses/shocked.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.UWw13ISmMxDzmwbd"
  },
  slowed: {
    label: "SW5E.ConSlowed",
    icon: "systems/sw5e/icons/svg/statuses/slowed.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.UWw13ISmMxDzmwbd"
  },
  stunned: {
    label: "SW5E.ConStunned",
    icon: "systems/sw5e/icons/svg/statuses/stunned.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.ZyZMUwA2rboh4ObS",
    statuses: ["incapacitated"]
  },
  unconscious: {
    label: "SW5E.ConUnconscious",
    icon: "systems/sw5e/icons/svg/statuses/unconscious.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.UWw13ISmMxDzmwbd",
    statuses: ["incapacitated", "prone"]
  },
  weakened: {
    label: "SW5E.ConWeakened",
    icon: "systems/sw5e/icons/svg/statuses/weakened.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.UWw13ISmMxDzmwbd"
  }
};
preLocalize("conditionTypes", { key: "label", sort: true });
patchConfig("conditionTypes", "label", { since: "SW5e 3.0", until: "SW5e 3.2" });

/* -------------------------------------------- */

/**
 * Extra status effects not specified in `conditionTypes`. If the ID matches a core-provided effect, then this
 * data will be merged into the core data.
 * @enum {object}
 */
SW5E.statusEffects = {
  bleeding: {
    icon: "systems/sw5e/icons/svg/statuses/bleeding.svg"
  },
  burrowing: {
    name: "EFFECT.SW5E.StatusBurrowing",
    icon: "icons/svg/cave.svg"
  },
  concentrating: {
    name: "EFFECT.SW5E.StatusConcentrating",
    icon: "systems/sw5e/icons/svg/statuses/concentrating.svg"
  },
  curse: {},
  dead: {
    icon: "systems/sw5e/icons/svg/statuses/dead.svg"
  },
  dodging: {
    name: "EFFECT.SW5E.StatusDodging",
    icon: "systems/sw5e/icons/svg/statuses/dodging.svg"
  },
  fly: {},
  hidden: {
    name: "EFFECT.SW5E.StatusHidden",
    icon: "icons/svg/cowled.svg"
  },
  marked: {
    name: "EFFECT.SW5E.StatusMarked",
    icon: "systems/sw5e/icons/svg/statuses/marked.svg"
  },
  silence: {
    icon: "systems/sw5e/icons/svg/statuses/silenced.svg"
  },
  sleep: {
    name: "EFFECT.SW5E.StatusSleeping"
  },
  surprised: {
    name: "EFFECT.SW5E.StatusSurprised",
    icon: "systems/sw5e/icons/svg/statuses/surprised.svg"
  },
  transformed: {
    name: "EFFECT.SW5E.StatusTransformed",
    icon: "icons/svg/pawprint.svg"
  }
};

/* -------------------------------------------- */
/*  Languages                                   */
/* -------------------------------------------- */

/**
 * Languages a character can learn.
 * @enum {string}
 */
SW5E.languages = {
  standard: {
    label: "SW5E.LanguagesStandard",
    children: {
      abyssin: "SW5E.LanguagesAbyssin",
      aleena: "SW5E.LanguagesAleena",
      antarian: "SW5E.LanguagesAntarian",
      anzellan: "SW5E.LanguagesAnzellan",
      aqualish: "SW5E.LanguagesAqualish",
      arconese: "SW5E.LanguagesArconese",
      ardennian: "SW5E.LanguagesArdennian",
      arkanian: "SW5E.LanguagesArkanian",
      balosur: "SW5E.LanguagesBalosur",
      barabel: "SW5E.LanguagesBarabel",
      basic: "SW5E.LanguagesBasic",
      besalisk: "SW5E.LanguagesBesalisk",
      binary: "SW5E.LanguagesBinary",
      bith: "SW5E.LanguagesBith",
      bocce: "SW5E.LanguagesBocce",
      bothese: "SW5E.LanguagesBothese",
      catharese: "SW5E.LanguagesCatharese",
      cerean: "SW5E.LanguagesCerean",
      "chadra-fan": "SW5E.LanguagesChadra-Fan",
      chagri: "SW5E.LanguagesChagri",
      cheunh: "SW5E.LanguagesCheunh",
      chevin: "SW5E.LanguagesChevin",
      chironan: "SW5E.LanguagesChironan",
      clawdite: "SW5E.LanguagesClawdite",
      codruese: "SW5E.LanguagesCodruese",
      colicoid: "SW5E.LanguagesColicoid",
      dashadi: "SW5E.LanguagesDashadi",
      defel: "SW5E.LanguagesDefel",
      devaronese: "SW5E.LanguagesDevaronese",
      dosh: "SW5E.LanguagesDosh",
      draethos: "SW5E.LanguagesDraethos",
      durese: "SW5E.LanguagesDurese",
      dug: "SW5E.LanguagesDug",
      ewokese: "SW5E.LanguagesEwokese",
      falleen: "SW5E.LanguagesFalleen",
      felucianese: "SW5E.LanguagesFelucianese",
      gamorrese: "SW5E.LanguagesGamorrese",
      gand: "SW5E.LanguagesGand",
      geonosian: "SW5E.LanguagesGeonosian",
      givin: "SW5E.LanguagesGivin",
      gran: "SW5E.LanguagesGran",
      gungan: "SW5E.LanguagesGungan",
      hapan: "SW5E.LanguagesHapan",
      harchese: "SW5E.LanguagesHarchese",
      herglese: "SW5E.LanguagesHerglese",
      honoghran: "SW5E.LanguagesHonoghran",
      huttese: "SW5E.LanguagesHuttese",
      iktotchese: "SW5E.LanguagesIktotchese",
      ithorese: "SW5E.LanguagesIthorese",
      jawaese: "SW5E.LanguagesJawaese",
      kaleesh: "SW5E.LanguagesKaleesh",
      kaminoan: "SW5E.LanguagesKaminoan",
      karkaran: "SW5E.LanguagesKarkaran",
      keldor: "SW5E.LanguagesKelDor",
      kharan: "SW5E.LanguagesKharan",
      killik: "SW5E.LanguagesKillik",
      klatooinian: "SW5E.LanguagesKlatooinian",
      kubazian: "SW5E.LanguagesKubazian",
      kushiban: "SW5E.LanguagesKushiban",
      kyuzo: "SW5E.LanguagesKyuzo",
      lannik: "SW5E.LanguagesLannik",
      lasat: "SW5E.LanguagesLasat",
      lowickese: "SW5E.LanguagesLowickese",
      lurmese: "SW5E.LanguagesLurmese",
      mandoa: "SW5E.LanguagesMandoa",
      miralukese: "SW5E.LanguagesMiralukese",
      mirialan: "SW5E.LanguagesMirialan",
      moncal: "SW5E.LanguagesMonCal",
      mustafarian: "SW5E.LanguagesMustafarian",
      muun: "SW5E.LanguagesMuun",
      nautila: "SW5E.LanguagesNautila",
      ortolan: "SW5E.LanguagesOrtolan",
      pakpak: "SW5E.LanguagesPakPak",
      pyke: "SW5E.LanguagesPyke",
      quarrenese: "SW5E.LanguagesQuarrenese",
      rakata: "SW5E.LanguagesRakata",
      rattataki: "SW5E.LanguagesRattataki",
      rishii: "SW5E.LanguagesRishii",
      rodese: "SW5E.LanguagesRodese",
      ryn: "SW5E.LanguagesRyn",
      selkatha: "SW5E.LanguagesSelkatha",
      semblan: "SW5E.LanguagesSemblan",
      shistavanen: "SW5E.LanguagesShistavanen",
      shyriiwook: "SW5E.LanguagesShyriiwook",
      sith: "SW5E.LanguagesSith",
      squibbian: "SW5E.LanguagesSquibbian",
      sriluurian: "SW5E.LanguagesSriluurian",
      "ssi-ruuvi": "SW5E.LanguagesSsi-ruuvi",
      sullustese: "SW5E.LanguagesSullustese",
      talzzi: "SW5E.LanguagesTalzzi",
      tarasinese: "SW5E.LanguagesTarasinese",
      thisspiasian: "SW5E.LanguagesThisspiasian",
      togorese: "SW5E.LanguagesTogorese",
      togruti: "SW5E.LanguagesTogruti",
      toydarian: "SW5E.LanguagesToydarian",
      tusken: "SW5E.LanguagesTusken",
      "twi'leki": "SW5E.LanguagesTwileki",
      ugnaught: "SW5E.LanguagesUgnaught",
      umbaran: "SW5E.LanguagesUmbaran",
      utapese: "SW5E.LanguagesUtapese",
      verpine: "SW5E.LanguagesVerpine",
      vong: "SW5E.LanguagesVong",
      voss: "SW5E.LanguagesVoss",
      yevethan: "SW5E.LanguagesYevethan",
      zabraki: "SW5E.LanguagesZabraki",
      zygerrian: "SW5E.LanguagesZygerrian"
    }
  },
  exotic: {
    label: "SW5E.LanguagesExotic",
    children: {}
  }
};
preLocalize("languages", { key: "label" });
preLocalize("languages.standard.children", { key: "label", sort: true });
preLocalize("languages.exotic.children", { key: "label", sort: true });
patchConfig("languages", "label", { since: "SW5e 2.4", until: "SW5e 3.1" });

/* -------------------------------------------- */

/**
 * Maximum allowed character level.
 * @type {number}
 */
SW5E.maxLevel = 20;

/**
 * Maximum allowed character rank.
 * @type {number}
 */
SW5E.maxRank = 20;

/**
 * Maximum allowed character rank in a single deployment.
 * @type {number}
 */
SW5E.maxIndividualRank = 5;

/**
 * Maximum allowed starship tier.
 * @type {number}
 */
SW5E.maxTier = 5;

/**
 * Maximum ability score value allowed by default.
 * @type {number}
 */
SW5E.maxAbilityScore = 20;

/* -------------------------------------------- */

/**
 * XP required to achieve each character level.
 * @type {number[]}
 */
SW5E.CHARACTER_EXP_LEVELS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000,
  265000, 305000, 355000
];

/**
 * XP granted for each challenge rating.
 * @type {number[]}
 */
SW5E.CR_EXP_LEVELS = [
  10, 200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 7200, 8400, 10000, 11500, 13000, 15000, 18000, 20000,
  22000, 25000, 33000, 41000, 50000, 62000, 75000, 90000, 105000, 120000, 135000, 155000
];

/**
 * Rank Level Prestige Requirements.
 * @type {number[]}
 */
SW5E.CHARACTER_RANK_LEVELS = [
  0, 1, 5, 20, 50, 100, 200, 350, 550, 800, 1100, 1450, 1850, 2300, 2800, 3350, 3950, 4600, 5300, 6050, 6850, 7700,
  8600, 9550, 10550, 11600, 12700, 13850, 15050, 16300, 17600
];

/* -------------------------------------------- */

/**
 * @typedef {object} CharacterFlagConfig
 * @property {string} name
 * @property {string} hint
 * @property {string} section
 * @property {typeof boolean|string|number} type
 * @property {string} placeholder
 * @property {string[]} [abilities]
 * @property {Object<string, string>} [choices]
 * @property {string[]} [skills]
 */

/* -------------------------------------------- */

/**
 * Trait configuration information.
 *
 * @typedef {object} TraitConfiguration
 * @property {object} labels
 * @property {string} labels.title         Localization key for the trait name.
 * @property {string} labels.localization  Prefix for a localization key that can be used to generate various
 *                                         plural variants of the trait type.
 * @property {string} icon                 Path to the icon used to represent this trait.
 * @property {string} [actorKeyPath]       If the trait doesn't directly map to an entry as `traits.[key]`, where is
 *                                         this trait's data stored on the actor?
 * @property {string} [configKey]          If the list of trait options doesn't match the name of the trait, where can
 *                                         the options be found within `CONFIG.SW5E`?
 * @property {string} [labelKeyPath]       If config is an enum of objects, where can the label be found?
 *                                         Deprecated in favor of the standardized `system.type.value`.
 * @property {object} [subtypes]           Configuration for traits that take some sort of base item.
 * @property {string} [subtypes.keyPath]   Path to subtype value on base items, should match a category key.
 *                                         Deprecated in favor of the standardized `system.type.value`.
 * @property {string[]} [subtypes.ids]     Key for base item ID objects within `CONFIG.SW5E`.
 * @property {object} [children]           Mapping of category key to an object defining its children.
 * @property {boolean} [sortCategories]    Whether top-level categories should be sorted.
 * @property {boolean} [expertise]         Can an actor receive expertise in this trait?
 */

/**
 * Configurable traits on actors.
 * @enum {TraitConfiguration}
 */
SW5E.traits = {
  saves: {
    labels: {
      title: "SW5E.ClassSaves",
      localization: "SW5E.TraitSavesPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-saves.svg",
    actorKeyPath: "system.abilities",
    configKey: "abilities",
    labelKeyPath: "label"
  },
  skills: {
    labels: {
      title: "SW5E.Skills",
      localization: "SW5E.TraitSkillsPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-skills.svg",
    actorKeyPath: "system.skills",
    labelKeyPath: "label",
    expertise: true
  },
  languages: {
    labels: {
      title: "SW5E.Languages",
      localization: "SW5E.TraitLanguagesPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-languages.svg"
  },
  armor: {
    labels: {
      title: "SW5E.TraitArmorProf",
      localization: "SW5E.TraitArmorPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-armor-proficiencies.svg",
    actorKeyPath: "system.traits.armorProf",
    configKey: "armorProficiencies",
    subtypes: { keyPath: "armor.type", ids: ["armorIds", "shieldIds"] }
  },
  weapon: {
    labels: {
      title: "SW5E.TraitWeaponProf",
      localization: "SW5E.TraitWeaponPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-weapon-proficiencies.svg",
    actorKeyPath: "system.traits.weaponProf",
    configKey: "weaponProficiencies",
    subtypes: { keyPath: "weaponType", ids: ["weaponIds"] }
  },
  tool: {
    labels: {
      title: "SW5E.TraitToolProf",
      localization: "SW5E.TraitToolPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-tool-proficiencies.svg",
    actorKeyPath: "system.tools",
    configKey: "toolProficiencies",
    subtypes: { keyPath: "toolType", ids: ["toolIds"] },
    children: { vehicle: "vehicleTypes" },
    sortCategories: true,
    expertise: true
  },
  di: {
    labels: {
      title: "SW5E.DamImm",
      localization: "SW5E.TraitDIPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-damage-immunities.svg",
    configKey: "damageTypes"
  },
  dr: {
    labels: {
      title: "SW5E.DamRes",
      localization: "SW5E.TraitDRPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-damage-resistances.svg",
    configKey: "damageTypes"
  },
  dv: {
    labels: {
      title: "SW5E.DamVuln",
      localization: "SW5E.TraitDVPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-damage-vulnerabilities.svg",
    configKey: "damageTypes"
  },
  sdi: {
    labels: {
      title: "SW5E.ShldDamImm",
      localization: "SW5E.TraitSDIPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-damage-immunities.svg",
    configKey: "damageTypes"
  },
  sdr: {
    labels: {
      title: "SW5E.ShldDamRes",
      localization: "SW5E.TraitSDRPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-damage-resistances.svg",
    configKey: "damageTypes"
  },
  sdv: {
    labels: {
      title: "SW5E.ShldDamVuln",
      localization: "SW5E.TraitSDVPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-damage-vulnerabilities.svg",
    configKey: "damageTypes"
  },
  ci: {
    labels: {
      title: "SW5E.ConImm",
      localization: "SW5E.TraitCIPlural"
    },
    icon: "systems/sw5e/icons/svg/trait-condition-immunities.svg",
    configKey: "conditionTypes"
  }
};
preLocalize("traits", { key: "labels.title" });

/* -------------------------------------------- */

/**
 * Modes used within a trait advancement.
 * @enum {object}
 */
SW5E.traitModes = {
  default: {
    label: "SW5E.AdvancementTraitModeDefaultLabel",
    hint: "SW5E.AdvancementTraitModeDefaultHint"
  },
  expertise: {
    label: "SW5E.AdvancementTraitModeExpertiseLabel",
    hint: "SW5E.AdvancementTraitModeExpertiseHint"
  },
  forcedExpertise: {
    label: "SW5E.AdvancementTraitModeForceLabel",
    hint: "SW5E.AdvancementTraitModeForceHint"
  },
  upgrade: {
    label: "SW5E.AdvancementTraitModeUpgradeLabel",
    hint: "SW5E.AdvancementTraitModeUpgradeHint"
  }
  // TODO SW5E: Mastery proficiencies?
};
preLocalize("traitModes", { keys: ["label", "hint"] });

/* -------------------------------------------- */

SW5E.midiFlags = {
  // Attacks
  "advantage.all": {
    name: "SW5E.CharacterFlags.Advantage.all.Name",
    section: "midiFlags",
    midiClone: true,
    type: Boolean
  },
  "advantage.attack.all": {
    name: "SW5E.CharacterFlags.Advantage.Attack.all.Name",
    section: "midiFlags",
    midiClone: true,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.itemActionTypesAttack).map((key => [
    `advantage.attack.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Attack.${key}.Name`,
      section: "midiFlags",
      midiClone: true,
      type: Boolean
    }
  ]))),
  ...Object.fromEntries(Object.keys(SW5E.abilities).map((key => [
    `advantage.attack.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Attack.${key}.Name`,
      section: "midiFlags",
      midiClone: true,
      type: Boolean
    }
  ]))),
  "grants.advantage.attack.all": {
    name: "SW5E.CharacterFlags.Grants.Advantage.Attack.all.Name",
    section: "midiFlags",
    midiClone: true,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.itemActionTypesAttack).map((key => [
    `grants.advantage.attack.${key}`,
    {
      name: `SW5E.CharacterFlags.Grants.Advantage.Attack.${key}.Name`,
      section: "midiFlags",
      midiClone: true,
      type: Boolean
    }
  ]))),

  // Critical
  // "critical.all": {
  //   name: "SW5E.CharacterFlags.Critical.all.Name",
  //   section: "midiFlags",
  //   midiClone: true,
  //   type: Boolean
  // },
  // ...Object.fromEntries(Object.keys(SW5E.itemActionTypesAttack).map(((key) => [
  //   `critical.${key}`,
  //   {
  //     name: `SW5E.CharacterFlags.Critical.Attack.${key}.Name`,
  //     section: "midiFlags",
  //     midiClone: true,
  //     type: Boolean
  //   }
  // ]))),
  // "noCritical.all": {
  //   name: "SW5E.CharacterFlags.NoCritical.all.Name",
  //   section: "midiFlags",
  //   midiClone: true,
  //   type: Boolean
  // },
  // ...Object.fromEntries(Object.keys(SW5E.itemActionTypesAttack).map(((key) => [
  //   `noCritical.${key}`,
  //   {
  //     name: `SW5E.CharacterFlags.NoCritical.Attack.${key}.Name`,
  //     section: "midiFlags",
  //     midiClone: true,
  //     type: Boolean
  //   }
  // ]))),
  // "grants.critical.all": {
  //   name: "SW5E.CharacterFlags.Grants.Critical.all.Name",
  //   section: "midiFlags",
  //   midiClone: true,
  //   type: Boolean
  // },
  // ...Object.fromEntries(Object.keys(SW5E.itemActionTypesAttack).map(((key) => [
  //   `grants.critical.${key}`,
  //   {
  //     name: `SW5E.CharacterFlags.Grants.Critical.Attack.${key}.Name`,
  //     section: "midiFlags",
  //     midiClone: true,
  //     type: Boolean
  //   }
  // ]))),
  // "fail.critical.all": {
  //   name: "SW5E.CharacterFlags.Fail.Critical.all.Name",
  //   section: "midiFlags",
  //   midiClone: true,
  //   type: Boolean
  // },
  // ...Object.fromEntries(Object.keys(SW5E.itemActionTypesAttack).map(((key) => [
  //   `fail.critical.${key}`,
  //   {
  //     name: `SW5E.CharacterFlags.Fail.Critical.Attack.${key}.Name`,
  //     section: "midiFlags",
  //     midiClone: true,
  //     type: Boolean
  //   }
  // ]))),

  // Ability checks
  "advantage.ability.all": {
    name: "SW5E.CharacterFlags.Advantage.Ability.all.Name",
    section: "midiFlags",
    midiClone: true,
    type: Boolean
  },
  "advantage.ability.check.all": {
    name: "SW5E.CharacterFlags.Advantage.Ability.Check.all.Name",
    section: "midiFlags",
    midiClone: true,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.abilities).map((key => [
    `advantage.ability.check.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Ability.Check.${key}.Name`,
      section: "midiFlags",
      midiClone: true,
      type: Boolean
    }
  ]))),

  // Skill Checks
  "advantage.skill.all": {
    name: "SW5E.CharacterFlags.Advantage.Skill.all.Name",
    section: "midiFlags",
    midiClone: true,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.allSkills).map((key => [
    `advantage.skill.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Skill.${key}.Name`,
      section: "midiFlags",
      midiClone: true,
      type: Boolean
    }
  ]))),

  // Tool Checks
  "advantage.tool.all": {
    name: "SW5E.CharacterFlags.Advantage.Tool.all.Name",
    section: "midiFlags",
    midiClone: false,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.toolTypes).map((key => [
    `advantage.tool.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Tool.${key}.Name`,
      section: "midiFlags",
      midiClone: false,
      type: Boolean
    }
  ]))),

  // Saving Throws
  "advantage.ability.save.all": {
    name: "SW5E.CharacterFlags.Advantage.Ability.Save.all.Name",
    section: "midiFlags",
    midiClone: true,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.abilities).map((key => [
    `advantage.ability.save.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Ability.Save.${key}.Name`,
      section: "midiFlags",
      midiClone: true,
      type: Boolean
    }
  ]))),
  "advantage.ability.save.dmg.all": {
    name: "SW5E.CharacterFlags.Advantage.Ability.Save.Dmg.all.Name",
    section: "midiFlags",
    midiClone: false,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.damageTypes).map((key => [
    `advantage.ability.save.dmg.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Ability.Save.Dmg.${key}.Name`,
      section: "midiFlags",
      midiClone: false,
      type: Boolean
    }
  ]))),
  "advantage.ability.save.tech.all": {
    name: "SW5E.CharacterFlags.Advantage.Ability.Save.Tech.all.Name",
    section: "midiFlags",
    midiClone: false,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.abilities).map((key => [
    `advantage.ability.save.tech.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Ability.Save.Tech.${key}.Name`,
      section: "midiFlags",
      midiClone: false,
      type: Boolean
    }
  ]))),
  "advantage.ability.save.force.all": {
    name: "SW5E.CharacterFlags.Advantage.Ability.Save.Force.all.Name",
    section: "midiFlags",
    midiClone: false,
    type: Boolean
  },
  ...Object.fromEntries(Object.keys(SW5E.abilities).map((key => [
    `advantage.ability.save.force.${key}`,
    {
      name: `SW5E.CharacterFlags.Advantage.Ability.Save.Force.${key}.Name`,
      section: "midiFlags",
      midiClone: false,
      type: Boolean
    }
  ]))),
  "advantage.deathSave": {
    name: "SW5E.CharacterFlags.Advantage.DeathSave.Name",
    section: "midiFlags",
    midiClone: true,
    type: Boolean
  }
};
for (const [id, flag] of Object.entries(SW5E.midiFlags)) {
  if (!(id.startsWith("advantage") || id.startsWith("grants.advantage"))) continue;
  SW5E.midiFlags[id.replace("advantage", "disadvantage")] = {
    name: flag.name.replace("Advantage", "Disadvantage"),
    section: flag.section,
    midiClone: flag.midiClone,
    type: flag.type
  };
}
for (const [id, flag] of Object.entries(SW5E.midiFlags)) {
  SW5E.midiFlags[`situational.${id}`] = {
    name: flag.name.replace("CharacterFlags", "CharacterFlags.Situational"),
    section: flag.section,
    midiClone: false,
    type: flag.type
  };
}
preLocalize("midiFlags", { keys: ["name", "condition", "section"] });

/**
 * Special character flags.
 * * @enum {CharacterFlagConfig}
 */
SW5E.characterFlags = {
  ...SW5E.midiFlags,
  extraArms: {
    name: "SW5E.FlagsExtraArms",
    hint: "SW5E.FlagsExtraArmsHint",
    section: "SW5E.SpeciesTraits",
    type: Boolean
  },
  forceInsensitive: {
    name: "SW5E.FlagsForceInsensitive",
    hint: "SW5E.FlagsForceInsensitiveHint",
    section: "SW5E.SpeciesTraits",
    type: Boolean
  },
  pintsized: {
    name: "SW5E.FlagsPintsized",
    hint: "SW5E.FlagsPintsizedHint",
    section: "SW5E.SpeciesTraits",
    type: Boolean
  },
  puny: {
    name: "SW5E.FlagsPuny",
    hint: "SW5E.FlagsPunyHint",
    section: "SW5E.SpeciesTraits",
    type: Boolean
  },
  techImpaired: {
    name: "SW5E.FlagsTechImpaired",
    hint: "SW5E.FlagsTechImpairedHint",
    section: "SW5E.SpeciesTraits",
    type: Boolean
  },
  twoLivered: {
    name: "SW5E.FlagsTwoLivered",
    hint: "SW5E.FlagsTwoLiveredHint",
    condition: "SW5E.FlagsTwoLiveredCondition",
    section: "SW5E.SpeciesTraits",
    type: Boolean
  },
  undersized: {
    name: "SW5E.FlagsUndersized",
    hint: "SW5E.FlagsUndersizedHint",
    section: "SW5E.SpeciesTraits",
    type: Boolean
  },
  dangerSense: {
    name: "SW5E.FlagsDangerSense",
    hint: "SW5E.FlagsDangerSenseHint",
    abilities: ["dex"],
    section: "SW5E.Features",
    type: Boolean
  },
  halflingLucky: {
    name: "SW5E.FlagsHalflingLucky",
    hint: "SW5E.FlagsHalflingLuckyHint",
    section: "SW5E.Features",
    type: Boolean
  },
  initiativeAdv: {
    name: "SW5E.FlagsInitiativeAdv",
    hint: "SW5E.FlagsInitiativeAdvHint",
    section: "SW5E.Features",
    type: Boolean
  },
  initiativeAlert: {
    name: "SW5E.FlagsAlert",
    hint: "SW5E.FlagsAlertHint",
    section: "SW5E.Features",
    type: Boolean
  },
  jackOfAllTrades: {
    name: "SW5E.FlagsJOAT",
    hint: "SW5E.FlagsJOATHint",
    section: "SW5E.Features",
    type: Boolean
  },
  observantFeat: {
    name: "SW5E.FlagsObservant",
    hint: "SW5E.FlagsObservantHint",
    skills: ["prc", "inv"],
    section: "SW5E.Features",
    type: Boolean
  },
  reliableTalent: {
    name: "SW5E.FlagsReliableTalent",
    hint: "SW5E.FlagsReliableTalentHint",
    section: "SW5E.Features",
    type: Boolean
  },
  remarkableAthlete: {
    name: "SW5E.FlagsRemarkableAthlete",
    hint: "SW5E.FlagsRemarkableAthleteHint",
    abilities: ["str", "dex", "con"],
    section: "SW5E.Features",
    type: Boolean
  },
  tavernBrawlerFeat: {
    name: "SW5E.FlagsTavernBrawler",
    hint: "SW5E.FlagsTavernBrawlerHint",
    section: "SW5E.Features",
    type: Boolean
  },
  weaponCriticalThreshold: {
    name: "SW5E.FlagsWeaponCritThreshold",
    hint: "SW5E.FlagsWeaponCritThresholdHint",
    section: "SW5E.Features",
    type: Number,
    placeholder: 20
  },
  powerCriticalThreshold: {
    name: "SW5E.FlagsPowerCritThreshold",
    hint: "SW5E.FlagsPowerCritThresholdHint",
    section: "SW5E.Features",
    type: Number,
    placeholder: 20
  },
  maneuverCriticalThreshold: {
    name: "SW5E.FlagsManeuverCritThreshold",
    hint: "SW5E.FlagsManeuverCritThresholdHint",
    section: "SW5E.Features",
    type: Number,
    placeholder: 20
  },
  meleeCriticalDamageDice: {
    name: "SW5E.FlagsMeleeCriticalDice",
    hint: "SW5E.FlagsMeleeCriticalDiceHint",
    section: "SW5E.Features",
    type: Number,
    placeholder: 0
  },
  forcePowerDiscount: {
    name: "SW5E.FlagsForcePowerDiscount",
    hint: "SW5E.FlagsForcePowerDiscountHint",
    section: "SW5E.Features",
    type: Number,
    placeholder: 0
  },
  techPowerDiscount: {
    name: "SW5E.FlagsTechPowerDiscount",
    hint: "SW5E.FlagsTechPowerDiscountHint",
    section: "SW5E.Features",
    type: Number,
    placeholder: 0
  },
  // Keeping the id as 'elvenAccuracy' for DND5E compatibility
  elvenAccuracy: {
    name: "SW5E.FlagsSupremeAccuracy",
    hint: "SW5E.FlagsSupremeAccuracyHint",
    section: "SW5E.Features",
    abilities: ["dex", "int", "wis", "cha"],
    type: Boolean
  },
  supremeAptitude: {
    name: "SW5E.FlagsSupremeAptitude",
    hint: "SW5E.FlagsSupremeAptitudeHint",
    section: "SW5E.Features",
    abilities: ["str", "dex", "con", "int"],
    type: Boolean
  },
  supremeDurability: {
    name: "SW5E.FlagsSupremeDurability",
    hint: "SW5E.FlagsSupremeDurabilityHint",
    section: "SW5E.Features",
    abilities: ["str", "con", "wis", "cha"],
    type: Boolean
  },
  encumbranceMultiplier: {
    name: "SW5E.FlagsEncumbranceMultiplier",
    hint: "SW5E.FlagsEncumbranceMultiplierHint",
    section: "SW5E.Features",
    type: Number,
    placeholder: 1
  }
};
preLocalize("characterFlags", { keys: ["name", "hint", "condition", "section"] });

/**
 * Flags allowed on actors. Any flags not in the list may be deleted during a migration.
 * @type {string[]}
 */
SW5E.allowedActorFlags = ["isPolymorphed", "originalActor", "dataVersion"].concat(Object.keys(SW5E.characterFlags));

/* -------------------------------------------- */

/**
 * Different types of actor structures that groups can represent.
 * @enum {object}
 */
SW5E.groupTypes = {
  party: "SW5E.Group.TypeParty",
  encounter: "SW5E.Group.TypeEncounter"
};
preLocalize("groupTypes");

/* -------------------------------------------- */

/**
 * Advancement types that can be added to items.
 * @enum {*}
 */
SW5E.advancementTypes = {
  AbilityScoreImprovement: advancement.AbilityScoreImprovementAdvancement,
  HitPoints: advancement.HitPointsAdvancement,
  HullPoints: advancement.HullPointsAdvancement,
  ShieldPoints: advancement.ShieldPointsAdvancement,
  ItemChoice: advancement.ItemChoiceAdvancement,
  ItemGrant: advancement.ItemGrantAdvancement,
  ScaleValue: advancement.ScaleValueAdvancement,
  Size: advancement.SizeAdvancement,
  Trait: advancement.TraitAdvancement
};

/* -------------------------------------------- */

/**
 * Default artwork configuration for each Document type and sub-type.
 * @type {Record<string, Record<string, string>>}
 */
SW5E.defaultArtwork = {
  Item: {
    background: "systems/sw5e/icons/svg/items/background.svg",
    class: "systems/sw5e/icons/svg/items/class.svg",
    consumable: "systems/sw5e/icons/svg/items/consumable.svg",
    container: "systems/sw5e/icons/svg/items/container.svg",
    equipment: "systems/sw5e/icons/svg/items/equipment.svg",
    feat: "systems/sw5e/icons/svg/items/feature.svg",
    loot: "systems/sw5e/icons/svg/items/loot.svg",
    species: "systems/sw5e/icons/svg/items/species.svg",
    power: "systems/sw5e/icons/svg/items/power.svg",
    archetype: "systems/sw5e/icons/svg/items/archetype.svg",
    tool: "systems/sw5e/icons/svg/items/tool.svg",
    weapon: "systems/sw5e/icons/svg/items/weapon.svg"
  }
};

/* -------------------------------------------- */
/*  Rules                                       */
/* -------------------------------------------- */

/**
 * Configuration information for rule types.
 *
 * @typedef {object} RuleTypeConfiguration
 * @property {string} label         Localized label for the rule type.
 * @property {string} [references]  Key path for a configuration object that contains reference data.
 */

/**
 * Types of rules that can be used in rule pages and the &Reference enricher.
 * @enum {RuleTypeConfiguration}
 */
SW5E.ruleTypes = {
  rule: {
    label: "SW5E.Rule.Type.Rule",
    references: "rules"
  },
  ability: {
    label: "SW5E.Ability",
    references: "enrichmentLookup.abilities"
  },
  areaOfEffect: {
    label: "SW5E.AreaOfEffect",
    references: "areaTargetTypes"
  },
  condition: {
    label: "SW5E.Rule.Type.Condition",
    references: "conditionTypes"
  },
  creatureType: {
    label: "SW5E.CreatureType",
    references: "creatureTypes"
  },
  damage: {
    label: "SW5E.DamageType",
    references: "damageTypes"
  },
  skill: {
    label: "SW5E.Skill",
    references: "enrichmentLookup.skills"
  },
  powerComponent: {
    label: "SW5E.PowerComponent",
    references: "itemProperties"
  },
  powerSchool: {
    label: "SW5E.PowerSchool",
    references: "enrichmentLookup.powerSchools"
  },
  powerTag: {
    label: "SW5E.PowerTag",
    references: "itemProperties"
  }
};
preLocalize("ruleTypes", { key: "label" });

/* -------------------------------------------- */

/**
 * List of rules that can be referenced from enrichers.
 * @enum {string}
 */
SW5E.rules = {
  inspiration: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.nkEPI89CiQnOaLYh",
  carryingcapacity: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.1PnjDBKbQJIVyc2t",
  push: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.Hni8DjqLzoqsVjb6",
  lift: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.Hni8DjqLzoqsVjb6",
  drag: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.Hni8DjqLzoqsVjb6",
  encumbrance: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.JwqYf9qb6gJAWZKs",
  hiding: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.plHuoNdS0j3umPNS",
  passiveperception: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.988C2hQNyvqkdbND",
  time: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.eihqNjwpZ3HM4IqY",
  speed: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.HhqeIiSj8sE1v1qZ",
  travelpace: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.eFAISahBloR2X8MX",
  forcedmarch: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.uQWQpRKQ1kWhuvjZ",
  difficultterrainpace: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hFW5BR2yHHwwgurD",
  climbing: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.KxUXbMrUCIAhv4AF",
  swimming: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.KxUXbMrUCIAhv4AF",
  longjump: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.1U0myNrOvIVBUdJV",
  highjump: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.raPwIkqKSv60ELmy",
  falling: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.kREHL5pgNUOhay9f",
  suffocating: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.BIlnr0xYhqt4TGsi",
  vision: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.O6hamUbI9kVASN8b",
  light: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.O6hamUbI9kVASN8b",
  lightlyobscured: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.MAxtfJyvJV7EpzWN",
  heavilyobscured: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.wPFjfRruboxhtL4b",
  brightlight: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.RnMokVPyKGbbL8vi",
  dimlight: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.n1Ocpbyhr6HhgbCG",
  darkness: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.4dfREIDjG5N4fvxd",
  blindsight: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.sacjsfm9ZXnw4Tqc",
  darkvision: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ldmA1PbnEGVkmE11",
  tremorsense: "Compendium.sw5e.rules.JournalEntry.eVtpEGXjA2tamEIJ.JournalEntryPage.8AIlZ95v54mL531X",
  truesight: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.kNa8rJFbtaTM3Rmk",
  food: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.jayo7XVgGnRCpTW0",
  water: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iIEI87J7lr2sqtb5",
  resting: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.dpHJXYLigIdEseIb",
  shortrest: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.1s2swI3UsjUUgbt2",
  longrest: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6cLtjbHn4KV2R7G9",
  surprise: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.YmOt8HderKveA19K",
  initiative: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.RcwElV4GAcVXKWxo",
  bonusaction: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.2fu2CXsDg8gQmGGw",
  reaction: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.2VqLyxMyMxgXe2wC",
  difficultterrain: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6tqz947qO8vPyxvD",
  beingprone: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.bV8akkBdVUUG21CO",
  droppingprone: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hwTLpAtSS5OqQsI1",
  standingup: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hwTLpAtSS5OqQsI1",
  crawling: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.VWG9qe8PUNtS28Pw",
  movingaroundothercreatures: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9ZWCknaXCOdhyOrX",
  flying: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.0B1fxfmw0a48tPsc",
  size: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.HWHRQVBVG7K0RVVW",
  space: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.WIA5bs3P45PmO3OS",
  squeezing: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.wKtOwagDAiNfVoPS",
  attack: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.u4GQCzoBig20yRLj",
  castapower: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.GLwN36E4WXn3Cp4Z",
  dash: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.Jqn0MEvq6fduYNo6",
  disengage: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ZOPRfI48NyjoloEF",
  dodge: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.V1BkwK2HQrtEfa4d",
  help: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.KnrD3u2AnQfmtOWj",
  hide: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.BXlHhE4ZoiFwiXLK",
  ready: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.8xJzZVelP2AmQGfU",
  search: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5cn1ZTLgQq95vfZx",
  useanobject: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ljqhJx8Qxu2ivo69",
  attackrolls: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5wkqEqhbBD5kDeE7",
  unseenattackers: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5ZJNwEPlsGurecg5",
  unseentargets: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5ZJNwEPlsGurecg5",
  rangedattacks: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.S9aclVOCbusLE3kC",
  range: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.HjKXuB8ndjcqOds7",
  rangedattacksinclosecombat: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.qEZvxW0NM7ixSQP5",
  meleeattacks: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.GTk6emvzNxl8Oosl",
  reach: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hgZ5ZN4B3y7tmFlt",
  unarmedstrike: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.xJjJ4lhymAYXAOvO",
  opportunityattacks: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.zeU0NyCyP10lkLg3",
  twoweaponfighting: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.FQTS08uH74A6psL2",
  grappling: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.Sl4bniSPSbyrakM2",
  escapingagrapple: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.2TZKy9YbMN3ZY3h8",
  movingagrappledcreature: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.x5bUdhAD7u5Bt2rg",
  shoving: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hrdqMF8hRXJdNzJx",
  cover: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.W7f7PcRubNUMIq2S",
  halfcover: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hv0J61IAfofuhy3Q",
  threequarterscover: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.zAMStUjUrPV10dFm",
  totalcover: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.BKUAxXuPEzxiEOeL",
  hitpoints: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.PFbzoMBviI2DD9QP",
  damagerolls: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.hd26AqKrCqtcQBWy",
  criticalhits: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.gFL1VhSEljL1zvje",
  damagetypes: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.jVOgf7DNEhkzYNIe",
  damageresistance: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.v0WE18nT5SJO8Ft7",
  damagevulnerability: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.v0WE18nT5SJO8Ft7",
  healing: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ICketFqbFslqKiX9",
  instantdeath: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.8BG05mA0mEzwmrHU",
  deathsavingthrows: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.JL8LePEJQYFdNuLL",
  deathsaves: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.JL8LePEJQYFdNuLL",
  stabilizing: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.r1CgZXLcqFop6Dlx",
  knockingacreatureout: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.uEwjgKGuCRTNADYv",
  temporaryhitpoints: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.AW6HpJZHqxfESXaq",
  temphp: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.AW6HpJZHqxfESXaq",
  mounting: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.MFpyvUIdcBpC9kIE",
  dismounting: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.MFpyvUIdcBpC9kIE",
  controllingamount: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.khmR2xFk1NxoQUgZ",
  underwatercombat: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6zVOeLyq4iMnrQT4",
  powerlevel: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.A6k5fS0kFqPXTW3v",
  knownpowers: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.oezg742GlxmEwT85",
  preparedpowers: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.oezg742GlxmEwT85",
  powerslots: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.Su6wbb0O9UN4ZDIH",
  castingatahigherlevel: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.4H9SLM95OCLfFizz",
  upcasting: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.4H9SLM95OCLfFizz",
  castinginarmor: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.z4A8vHSK2pb8YA9X",
  atwills: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.jZD5mCTnMPJ9jW67",
  rituals: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.FjWqT5iyJ89kohdA",
  castingtime: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.zRVW8Tvyk6BECjZD",
  bonusactioncasting: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.RP1WL9FXI3aknlxZ",
  reactioncasting: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.t62lCfinwU9H7Lji",
  longercastingtimes: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.gOAIRFCyPUx42axn",
  powerrange: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.RBYPyE5z5hAZSbH6",
  components: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.xeHthAF9lxfn2tII",
  verbal: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6UXTNWMCQ0nSlwwx",
  powerduration: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9mp0SRsptjvJcq1e",
  instantaneous: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.kdlgZOpRMB6bGCod",
  concentrating: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ow58p27ctAnr4VPH",
  powertargets: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.G80AIQr04sxdVpw4",
  areaofeffect: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.wvtCeGHgnUmh0cuj",
  pointoforigin: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.8HxbRceQQUAhyWRt",
  powersavingthrows: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.8DajfNll90eeKcmB",
  powerattackrolls: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.qAFzmGZKhVvAEUF3",
  combiningmagicaleffects: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.TMIN963hG773yZzO",
  schoolsofmagic: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.TeF6CKMDRpYpsLd4",
  detectingtraps: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.DZ7AhdQ94xggG4bj",
  disablingtraps: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.DZ7AhdQ94xggG4bj",
  curingmadness: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6Icem7G3CICdNOkM",
  damagethreshold: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9LJZhqvCburpags3",
  poisontypes: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.I6OMMWUaYCWR9xip",
  contactpoison: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.kXnCEqqGUWRZeZDj",
  ingestedpoison: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.Y0vsJYSWeQcFpJ27",
  inhaledpoison: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.KUyN4eK1xTBzXsjP",
  injurypoison: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.LUL48OUq6SJeMGc7",
  attunement: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.UQ65OwIyGK65eiOK",
  wearingitems: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iPB8mGKuQx3X0Z2J",
  wieldingitems: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iPB8mGKuQx3X0Z2J",
  multipleitemsofthesamekind: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.rLJdvz4Mde8GkEYQ",
  paireditems: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.rd9pCH8yFraSGN34",
  commandword: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.HiXixxLYesv6Ff3t",
  consumables: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.UEPAcZFzQ5x196zE",
  itempowers: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.DABoaeeF6w31UCsj",
  charges: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.NLRXcgrpRCfsA5mO",
  creaturetags: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9jV1fFF163dr68vd",
  telepathy: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.geTidcFIYWuUvD2L",
  legendaryactions: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.C1awOyZh78pq1xmY",
  lairactions: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.07PtjpMxiRIhkBEp",
  regionaleffects: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.uj8W27NKFyzygPUd"
};

/* -------------------------------------------- */
/*  Token Rings Framework                       */
/* -------------------------------------------- */

/**
 * Token Rings configuration data
 *
 * @typedef {object} TokenRingsConfiguration
 * @property {Record<string, string>} effects        Localized names of the configurable ring effects.
 * @property {string} spriteSheet                    The sprite sheet json source.
 * @property {typeof BaseSamplerShader} shaderClass  The shader class definition associated with the token ring.
 */

/**
 * @type {TokenRingsConfiguration}
 */
SW5E.tokenRings = {
  effects: {
    RING_PULSE: "SW5E.TokenRings.Effects.RingPulse",
    RING_GRADIENT: "SW5E.TokenRings.Effects.RingGradient",
    BKG_WAVE: "SW5E.TokenRings.Effects.BackgroundWave"
  },
  spriteSheet: "systems/sw5e/icons/composite/token-rings.json",
  shaderClass: null
};
preLocalize("tokenRings.effects");

/* -------------------------------------------- */
/*  Sources                                     */
/* -------------------------------------------- */

/**
 * List of books available as sources.
 * @enum {string}
 */
SW5E.sourceBooks = {
  PHB: "SOURCE.BOOK.PHB",
  SnV: "SOURCE.BOOK.SnV",
  SotG: "SOURCE.BOOK.SotG",
  WH: "SOURCE.BOOK.WH",
  EC: "SOURCE.BOOK.EC"
};
preLocalize("sourceBooks", { sort: true });

/* -------------------------------------------- */
/*  Enrichment                                  */
/* -------------------------------------------- */

let _enrichmentLookup;
Object.defineProperty(SW5E, "enrichmentLookup", {
  get() {
    const slugify = value => value?.slugify().replaceAll("-", "");
    if ( !_enrichmentLookup ) {
      _enrichmentLookup = {
        abilities: foundry.utils.deepClone(SW5E.abilities),
        skills: foundry.utils.deepClone(SW5E.skills),
        powerSchools: foundry.utils.deepClone(SW5E.powerSchools),
        tools: foundry.utils.deepClone(SW5E.toolIds)
      };
      const addFullKeys = key => Object.entries(SW5E[key]).forEach(([k, v]) =>
        _enrichmentLookup[key][slugify(v.fullKey)] = { ...v, key: k }
      );
      addFullKeys("abilities");
      addFullKeys("skills");
      addFullKeys("powerSchools");
    }
    return _enrichmentLookup;
  },
  enumerable: true
});

/* -------------------------------------------- */

/**
 * Patch an existing config enum to allow conversion from string values to object values without
 * breaking existing modules that are expecting strings.
 * @param {string} key          Key within SW5E that has been replaced with an enum of objects.
 * @param {string} fallbackKey  Key within the new config object from which to get the fallback value.
 * @param {object} [options]    Additional options passed through to logCompatibilityWarning.
 */
function patchConfig(key, fallbackKey, options) {
  /** @override */
  function toString() {
    const message =
      `The value of CONFIG.SW5E.${key} has been changed to an object.`
      + ` The former value can be acccessed from .${fallbackKey}.`;
    foundry.utils.logCompatibilityWarning(message, options);
    return this[fallbackKey];
  }

  Object.values(SW5E[key]).forEach(o => {
    if ( foundry.utils.getType(o) !== "Object" ) return;
    o.toString = toString;
  });
}

/* -------------------------------------------- */

export default SW5E;
