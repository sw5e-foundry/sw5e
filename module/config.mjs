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
    fullKey: "strength"
  },
  dex: {
    label: "SW5E.AbilityDex",
    abbreviation: "SW5E.AbilityDexAbbr",
    type: "physical",
    fullKey: "dexterity"
  },
  con: {
    label: "SW5E.AbilityCon",
    abbreviation: "SW5E.AbilityConAbbr",
    type: "physical",
    fullKey: "constitution"
  },
  int: {
    label: "SW5E.AbilityInt",
    abbreviation: "SW5E.AbilityIntAbbr",
    type: "mental",
    fullKey: "intelligence",
    defaults: { vehicle: 0 }
  },
  wis: {
    label: "SW5E.AbilityWis",
    abbreviation: "SW5E.AbilityWisAbbr",
    type: "mental",
    fullKey: "wisdom",
    defaults: { vehicle: 0 }
  },
  cha: {
    label: "SW5E.AbilityCha",
    abbreviation: "SW5E.AbilityChaAbbr",
    type: "mental",
    fullKey: "charisma",
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
 * @property {string} label    Localized label.
 * @property {string} ability  Key for the default ability used by this skill.
 * @property {string} fullKey  Fully written key used as alternate for enrichers.
 */

/**
 * The set of skills which can be trained by characters with their default ability scores.
 * @enum {SkillConfiguration}
 */
SW5E.skills = {
  acr: { label: "SW5E.SkillAcr", ability: "dex", fullKey: "acrobatics" },
  ani: { label: "SW5E.SkillAni", ability: "wis", fullKey: "animalHandling" },
  ath: { label: "SW5E.SkillAth", ability: "str", fullKey: "athletics" },
  dec: { label: "SW5E.SkillDec", ability: "cha", fullKey: "deception" },
  ins: { label: "SW5E.SkillIns", ability: "wis", fullKey: "insight" },
  itm: { label: "SW5E.SkillItm", ability: "cha", fullKey: "intimidation" },
  inv: { label: "SW5E.SkillInv", ability: "int", fullKey: "investigation" },
  lor: { label: "SW5E.SkillLor", ability: "int", fullKey: "lore" },
  med: { label: "SW5E.SkillMed", ability: "wis", fullKey: "medicine" },
  nat: { label: "SW5E.SkillNat", ability: "int", fullKey: "nature" },
  prc: { label: "SW5E.SkillPrc", ability: "wis", fullKey: "perception" },
  prf: { label: "SW5E.SkillPrf", ability: "cha", fullKey: "performance" },
  per: { label: "SW5E.SkillPer", ability: "cha", fullKey: "persuasion" },
  pil: { label: "SW5E.SkillPil", ability: "int", fullKey: "pilloting" },
  slt: { label: "SW5E.SkillSlt", ability: "dex", fullKey: "sleightOfHand" },
  ste: { label: "SW5E.SkillSte", ability: "dex", fullKey: "stealth" },
  sur: { label: "SW5E.SkillSur", ability: "wis", fullKey: "survival" },
  tec: { label: "SW5E.SkillTec", ability: "int", fullKey: "technology" }
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
  lgt: SW5E.equipmentTypes.light,
  med: SW5E.equipmentTypes.medium,
  hvy: SW5E.equipmentTypes.heavy,
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
 * Creature sizes.
 * @enum {string}
 */
SW5E.actorSizes = {
  tiny: "SW5E.SizeTiny",
  sm: "SW5E.SizeSmall",
  med: "SW5E.SizeMedium",
  lg: "SW5E.SizeLarge",
  huge: "SW5E.SizeHuge",
  grg: "SW5E.SizeGargantuan"
};
preLocalize("actorSizes");

/**
 * Default token image size for the values of `SW5E.actorSizes`.
 * @enum {number}
 */
SW5E.tokenSizes = {
  tiny: 0.5,
  sm: 1,
  med: 1,
  lg: 2,
  huge: 3,
  grg: 4
};

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
 * Default types of creatures.
 * *Note: Not pre-localized to allow for easy fetching of pluralized forms.*
 * @enum {string}
 */
SW5E.creatureTypes = {
  aberration: "SW5E.CreatureAberration",
  beast: "SW5E.CreatureBeast",
  construct: "SW5E.CreatureConstruct",
  droid: "SW5E.CreatureDroid",
  force: "SW5E.CreatureForceEntity",
  humanoid: "SW5E.CreatureHumanoid",
  plant: "SW5E.CreaturePlant",
  undead: "SW5E.CreatureUndead"
};

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
 * Enumerate the valid consumable types which are recognized by the system.
 * @enum {string}
 */
SW5E.consumableTypes = {
  adrenal: "SW5E.ConsumableAdrenal",
  poison: "SW5E.ConsumablePoison",
  explosive: "SW5E.ConsumableExplosive",
  food: "SW5E.ConsumableFood",
  medpac: "SW5E.ConsumableMedpac",
  technology: "SW5E.ConsumableTechnology",
  ammo: "SW5E.ConsumableAmmo",
  trinket: "SW5E.ConsumableTrinket",
  force: "SW5E.ConsumableForce",
  tech: "SW5E.ConsumableTech"
};
preLocalize("consumableTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Enumerate the valid ammunition types which are recognized by the system.
 * @enum {string}
 */
SW5E.ammoStandardTypes = {
  arrow: "SW5E.AmmoArrow",
  bolt: "SW5E.AmmoBolt",
  cartridge: "SW5E.AmmoCartridge",
  dart: "SW5E.AmmoDart",
  flechetteClip: "SW5E.AmmoFlechetteClip",
  flechetteMag: "SW5E.AmmoFlechetteMag",
  missile: "SW5E.AmmoMissile",
  powerCell: "SW5E.AmmoPowerCell",
  powerGenerator: "SW5E.AmmoPowerGenerator",
  projectorCanister: "SW5E.AmmoProjectorCanister",
  projectorTank: "SW5E.AmmoProjectorTank",
  rocket: "SW5E.AmmoRocket",
  snare: "SW5E.AmmoSnare",
  torpedo: "SW5E.AmmoTorpedo"
};
preLocalize("ammoStandardTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Enumerate the valid ammunition types which are recognized by the system.
 * @enum {string}
 */
SW5E.ammoStarshipTypes = {
  sscluster: "SW5E.AmmoSsCluster",
  ssmissile: "SW5E.AmmoSsMissile",
  sstorpedo: "SW5E.AmmoSsTorpedo",
  ssbomb: "SW5E.AmmoSsBomb"
};
preLocalize("ammoStarshipTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Enumerate the valid ammunition types which are recognized by the system.
 * @enum {string}
 */
SW5E.ammoTypes = {
  ...SW5E.ammoStandardTypes,
  ...SW5E.ammoStarshipTypes
};
preLocalize("ammoTypes", { sort: true });

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
    label: "SW5E.Feature.Class",
    subtypes: {
      berserkerInvocation: "SW5E.ClassFeature.BerserkerInstinct",
      consularForceAffinity: "SW5E.ClassFeature.ConsularForceAffinity",
      consularInvocation: "SW5E.ClassFeature.ConsularFEC",
      engineerInvocation: "SW5E.ClassFeature.EngineerModification",
      fighterInvocation: "SW5E.ClassFeature.FighterStrategy",
      guardianInvocation: "SW5E.ClassFeature.GuardianAura",
      guardianCTF: "SW5E.ClassFeature.GuardianCTF",
      monkFocus: "SW5E.ClassFeature.MonkFocus",
      monkInvocation: "SW5E.ClassFeature.MonkVow",
      multiattack: "SW5E.ClassFeature.Multiattack",
      operativeInvocation: "SW5E.ClassFeature.OperativeExploit",
      scholarInvocation: "SW5E.ClassFeature.ScholarDiscovery",
      scoutInvocation: "SW5E.ClassFeature.ScoutRoutine",
      sentinelInvocation: "SW5E.ClassFeature.SentinelIdeal",
      sentinelFES: "SW5E.ClassFeature.SentinelFES"
    }
  },
  customizationOption: {
    label: "SW5E.Feature.CustomizationOption",
    subtypes: {
      classImprovement: "SW5E.CustomizationOption.ClassImprovement",
      fightingMastery: "SW5E.CustomizationOption.FightingMastery",
      fightingStyle: "SW5E.CustomizationOption.FightingStyle",
      lightsaberForm: "SW5E.CustomizationOption.LightsaberForm",
      multiclassImprovement: "SW5E.CustomizationOption.MulticlassImprovement",
      splashclassImprovement: "SW5E.CustomizationOption.SplashclassImprovement",
      weaponFocus: "SW5E.CustomizationOption.WeaponFocus",
      weaponSupremacy: "SW5E.CustomizationOption.WeaponSupremacy"
    }
  },
  deployment: {
    label: "SW5E.Feature.Deployment",
    subtypes: {
      venture: "SW5E.DeploymentFeature.Venture"
    }
  },
  monster: {
    label: "SW5E.Feature.Monster"
  },
  species: {
    label: "SW5E.Feature.Species"
  },
  starship: {
    label: "SW5E.Feature.Starship",
    subtypes: {
      role: "SW5E.StarshipFeature.Role",
      roleSpecialization: "SW5E.StarshipFeature.RoleSpecialization",
      roleMastery: "SW5E.StarshipFeature.RoleMastery"
    }
  },
  starshipAction: {
    label: "SW5E.Feature.StarshipAction",
    subtypes: {
      pilot: "SW5E.StarshipActionFeature.Pilot",
      crew: "SW5E.StarshipActionFeature.Crew",
      passenger: "SW5E.StarshipActionFeature.Passenger"
    }
  },
  feat: {
    label: "SW5E.Feature.Feat"
  }
};
preLocalize("featureTypes", { key: "label" });
for (const [key, type] of Object.entries(SW5E.featureTypes)) if ("subtypes" in type) preLocalize(`featureTypes.${key}.subtypes`, { sort: true });

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
 * @enum {string}
 */
SW5E.physicalDamageTypes = {
  kinetic: "SW5E.DamageKinetic"
};
preLocalize("physicalDamageTypes", { sort: true });

/**
 * Types of damage the can be caused by abilities.
 * @enum {string}
 */
SW5E.damageTypes = {
  ...SW5E.physicalDamageTypes,
  acid: "SW5E.DamageAcid",
  cold: "SW5E.DamageCold",
  energy: "SW5E.DamageEnergy",
  fire: "SW5E.DamageFire",
  force: "SW5E.DamageForce",
  ion: "SW5E.DamageIon",
  lightning: "SW5E.DamageLightning",
  necrotic: "SW5E.DamageNecrotic",
  poison: "SW5E.DamagePoison",
  psychic: "SW5E.DamagePsychic",
  sonic: "SW5E.DamageSonic"
};
preLocalize("damageTypes", { sort: true });

/**
 * Types of damage to which an actor can possess resistance, immunity, or vulnerability.
 * @enum {string}
 * @deprecated
 */
SW5E.damageResistanceTypes = {
  ...SW5E.damageTypes
};
preLocalize("damageResistanceTypes", { sort: true });

/**
 * Different types of healing that can be applied using abilities.
 * @enum {string}
 */
SW5E.healingTypes = {
  healing: "SW5E.Healing",
  temphp: "SW5E.HealingTemp"
};
preLocalize("healingTypes");

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
 * Configure aspects of encumbrance calculation so that it could be configured by modules.
 * @enum {{ imperial: number, metric: number }}
 */
SW5E.encumbrance = {
  currencyPerWeight: {
    imperial: 50,
    metric: 110
  },
  strMultiplier: {
    imperial: 15,
    metric: 6.8
  },
  vehicleWeightMultiplier: {
    imperial: 2000, // 2000 lbs in an imperial ton
    metric: 1000 // 1000 kg in a metric ton
  }
};

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
 * @property {string} label     Localized label for this type.
 * @property {string} template  Type of `MeasuredTemplate` create for this target type.
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
    template: "circle"
  },
  cylinder: {
    label: "SW5E.TargetCylinder",
    template: "circle"
  },
  cone: {
    label: "SW5E.TargetCone",
    template: "cone"
  },
  square: {
    label: "SW5E.TargetSquare",
    template: "rect"
  },
  cube: {
    label: "SW5E.TargetCube",
    template: "rect"
  },
  line: {
    label: "SW5E.TargetLine",
    template: "ray"
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
 * Types of components that can be required when casting a power.
 * @enum {object}
 */
SW5E.powerComponents = {
  vocal: {
    label: "SW5E.ComponentVerbal",
    abbr: "SW5E.ComponentVerbalAbbr"
  },
  somatic: {
    label: "SW5E.ComponentSomatic",
    abbr: "SW5E.ComponentSomaticAbbr"
  },
  material: {
    label: "SW5E.ComponentMaterial",
    abbr: "SW5E.ComponentMaterialAbbr"
  }
};
preLocalize("powerComponents", { keys: ["label", "abbr"] });

/* -------------------------------------------- */

/**
 * Supplementary rules keywords that inform a power's use.
 * @enum {object}
 */
SW5E.powerTags = {
  concentration: {
    label: "SW5E.Concentration",
    abbr: "SW5E.ConcentrationAbbr",
    filter: true
  },
  ritual: {
    label: "SW5E.Ritual",
    abbr: "SW5E.RitualAbbr"
  },
  freeLearn: {
    label: "SW5E.FreeLearn",
    abbr: "SW5E.FreeLearnAbbr"
  }
};
preLocalize("powerTags", { keys: ["label", "abbr"] });

/* -------------------------------------------- */

/**
 * Schools to which a force power can belong.
 * @enum {string}
 */
SW5E.powerSchoolsForce = {
  lgt: "SW5E.SchoolLgt",
  uni: "SW5E.SchoolUni",
  drk: "SW5E.SchoolDrk"
};
preLocalize("powerSchoolsForce");

/* -------------------------------------------- */

/**
 * Schools to which a tech power can belong.
 * @enum {string}
 */
SW5E.powerSchoolsTech = {
  tec: "SW5E.SchoolTec"
};
preLocalize("powerSchoolsTech");

/* -------------------------------------------- */

/**
 * Schools to which a power can belong.
 * @enum {string}
 */
SW5E.powerSchools = {
  ...SW5E.powerSchoolsForce,
  ...SW5E.powerSchoolsTech,
  enh: "SW5E.SchoolEnh"
};
preLocalize("powerSchools");

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

// TODO: This is used for spell scrolls, it maps the level to the compendium ID of the item the spell would be bound to
// We could use this with, say, holocrons to produce scrolls
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
 * Conditions that can affect an actor.
 * @enum {string}
 */
SW5E.conditionTypes = {
  blinded: "SW5E.ConBlinded",
  charmed: "SW5E.ConCharmed",
  corroded: "SW5E.ConCorroded",
  deafened: "SW5E.ConDeafened",
  diseased: "SW5E.ConDiseased",
  exhaustion: "SW5E.ConExhaustion",
  frightened: "SW5E.ConFrightened",
  grappled: "SW5E.ConGrappled",
  ignited: "SW5E.ConIgnited",
  incapacitated: "SW5E.ConIncapacitated",
  invisible: "SW5E.ConInvisible",
  paralyzed: "SW5E.ConParalyzed",
  petrified: "SW5E.ConPetrified",
  poisoned: "SW5E.ConPoisoned",
  prone: "SW5E.ConProne",
  restrained: "SW5E.ConRestrained",
  shocked: "SW5E.ConShocked",
  slowed: "SW5E.ConSlowed",
  stunned: "SW5E.ConStunned",
  unconscious: "SW5E.ConUnconscious",
  weakened: "SW5E.ConWeakened"
};
preLocalize("conditionTypes", { sort: true });

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
preLocalize("languages.standard.children", { sort: true });
preLocalize("languages.exotic.children", { key: "label", sort: true });
patchConfig("languages", "label", { since: "SW5e 2.4", until: "SW5e 2.6" });

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
 * @property {object} [subtypes]           Configuration for traits that take some sort of base item.
 * @property {string} [subtypes.keyPath]   Path to subtype value on base items, should match a category key.
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
    midiClone: true,
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
    if ( !_enrichmentLookup ) {
      _enrichmentLookup = {
        abilities: {},
        skills: {},
        tools: {}
      };
      Object.entries(SW5E.abilities).forEach(([k, a]) => _enrichmentLookup.abilities[k] = _enrichmentLookup.abilities[a.fullKey] = a);
      Object.entries(SW5E.allSkills).forEach(([k, s]) => _enrichmentLookup.skills[k] = _enrichmentLookup.skills[s.fullKey] = s);
      Object.entries(SW5E.toolIds).forEach(([k, t]) => _enrichmentLookup.tools[k] = t);
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
