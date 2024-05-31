import * as advancement from "./documents/advancement/_module.mjs";
import { preLocalize } from "./utils.mjs";

// Namespace Configuration Values
const SW5E = {};

// ASCII Artwork
SW5E.ASCII = `_______________________________
______      ______ _____ _____
|  _  \\___  |  _  \\  ___|  ___|
| | | ( _ ) | | | |___ \\| |__
| | | / _ \\/\\ | | |   \\ \\  __|
| |/ / (_>  < |/ //\\__/ / |___
|___/ \\___/\\/___/ \\____/\\____/
_______________________________`;

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
 * Configure which ability score is used as the default modifier for initiative rolls,
 * when calculating hit points per level and hit dice, and as the default modifier for
 * saving throws to maintain concentration.
 * @enum {string}
 */
SW5E.defaultAbilities = {
  initiative: "dex",
  hitPoints: "con",
  concentration: "con"
};

Object.defineProperties(SW5E, {
  hitPointsAbility: {
    get: function() {
      foundry.utils.logCompatibilityWarning(
        "SW5E.hitPointsAbility has been deprecated and is now accessible through SW5E.defaultAbilities.hitPoints.",
        { since: "SW5e 3.1", until: "SW5e 3.3" }
      );
      return SW5E.defaultAbilities.hitPoints;
    },
    set: function(value) {
      foundry.utils.logCompatibilityWarning(
        "SW5E.hitPointsAbility has been deprecated and is now accessible through SW5E.defaultAbilities.hitPoints.",
        { since: "SW5e 3.1", until: "SW5e 3.3" }
      );
      SW5E.defaultAbilities.hitPoints = value;
    }
  },
  initiativeAbility: {
    get: function() {
      foundry.utils.logCompatibilityWarning(
        "SW5E.initiativeAbility has been deprecated and is now accessible through SW5E.defaultAbilities.initiative.",
        { since: "SW5e 3.1", until: "SW5e 3.3" }
      );
      return SW5E.defaultAbilities.initiative;
    },
    set: function(value) {
      foundry.utils.logCompatibilityWarning(
        "SW5E.initiativeAbility has been deprecated and is now accessible through SW5E.defaultAbilities.initiative.",
        { since: "SW5e 3.1", until: "SW5e 3.3" }
      );
      SW5E.defaultAbilities.initiative = value;
    }
  }
});

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
 * The set of skill which can be trained with their default ability scores.
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
  arc: {
    label: "SW5E.SkillArc",
    ability: "int",
    fullKey: "arcana",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.h3bYSPge8IOqne1N",
    icon: "icons/sundries/books/book-embossed-jewel-silver-green.webp"
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
  his: {
    label: "SW5E.SkillHis",
    ability: "int",
    fullKey: "history",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.kRBZbdWMGW9K3wdY",
    icon: "icons/sundries/books/book-embossed-bound-brown.webp"
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
  rel: {
    label: "SW5E.SkillRel",
    ability: "int",
    fullKey: "religion",
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
  }
};
preLocalize("skills", { key: "label", sort: true });

/* -------------------------------------------- */

/**
 * Character alignment options.
 * @enum {string}
 */
SW5E.alignments = {
  lg: "SW5E.AlignmentLG",
  ng: "SW5E.AlignmentNG",
  cg: "SW5E.AlignmentCG",
  ln: "SW5E.AlignmentLN",
  tn: "SW5E.AlignmentTN",
  cn: "SW5E.AlignmentCN",
  le: "SW5E.AlignmentLE",
  ne: "SW5E.AlignmentNE",
  ce: "SW5E.AlignmentCE"
};
preLocalize("alignments");

/* -------------------------------------------- */

/**
 * An enumeration of item attunement types.
 * @enum {string}
 */
SW5E.attunementTypes = {
  required: "SW5E.AttunementRequired",
  optional: "SW5E.AttunementOptional"
};
preLocalize("attunementTypes");

/**
 * An enumeration of item attunement states.
 * @type {{"0": string, "1": string, "2": string}}
 * @deprecated since 3.2, available until 3.4
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
  sim: "SW5E.WeaponSimpleProficiency",
  mar: "SW5E.WeaponMartialProficiency"
};
preLocalize("weaponProficiencies");

/**
 * A mapping between `SW5E.weaponTypes` and `SW5E.weaponProficiencies` that
 * is used to determine if character has proficiency when adding an item.
 * @enum {(boolean|string)}
 */
SW5E.weaponProficienciesMap = {
  simpleM: "sim",
  simpleB: "sim",
  martialM: "mar",
  martialB: "mar"
};

/**
 * The basic weapon types in 5e. This enables specific weapon proficiencies or
 * starting equipment provided by classes and backgrounds.
 * @enum {string}
 */
SW5E.weaponIds = {
  battleaxe: "I0WocDSuNpGJayPb",
  blowgun: "wNWK6yJMHG9ANqQV",
  club: "nfIRTECQIG81CvM4",
  dagger: "0E565kQUBmndJ1a2",
  dart: "3rCO8MTIdPGSW6IJ",
  flail: "UrH3sMdnUDckIHJ6",
  glaive: "rOG1OM2ihgPjOvFW",
  greataxe: "1Lxk6kmoRhG8qQ0u",
  greatclub: "QRCsxkCwWNwswL9o",
  greatsword: "xMkP8BmFzElcsMaR",
  halberd: "DMejWAc8r8YvDPP1",
  handaxe: "eO7Fbv5WBk5zvGOc",
  handcrossbow: "qaSro7kFhxD6INbZ",
  heavycrossbow: "RmP0mYRn2J7K26rX",
  javelin: "DWLMnODrnHn8IbAG",
  lance: "RnuxdHUAIgxccVwj",
  lightcrossbow: "ddWvQRLmnnIS0eLF",
  lighthammer: "XVK6TOL4sGItssAE",
  longbow: "3cymOVja8jXbzrdT",
  longsword: "10ZP2Bu3vnCuYMIB",
  mace: "Ajyq6nGwF7FtLhDQ",
  maul: "DizirD7eqjh8n95A",
  morningstar: "dX8AxCh9o0A9CkT3",
  net: "aEiM49V8vWpWw7rU",
  pike: "tC0kcqZT9HHAO0PD",
  quarterstaff: "g2dWN7PQiMRYWzyk",
  rapier: "Tobce1hexTnDk4sV",
  scimitar: "fbC0Mg1a73wdFbqO",
  shortsword: "osLzOwQdPtrK3rQH",
  sickle: "i4NeNZ30ycwPDHMx",
  spear: "OG4nBBydvmfWYXIk",
  shortbow: "GJv6WkD7D2J6rP6M",
  sling: "3gynWO9sN4OLGMWD",
  trident: "F65ANO66ckP8FDMa",
  warpick: "2YdfjN1PIIrSHZii",
  warhammer: "F0Df164Xv1gWcYt0",
  whip: "QKTyxoO0YDnAsbYe"
};

/* -------------------------------------------- */

/**
 * The basic ammunition types.
 * @enum {string}
 */
SW5E.ammoIds = {
  arrow: "3c7JXOzsv55gqJS5",
  blowgunNeedle: "gBQ8xqTA5f8wP5iu",
  crossbowBolt: "SItCnYBqhzqBoaWG",
  slingBullet: "z9SbsMIBZzuhZOqT"
};

/* -------------------------------------------- */

/**
 * The categories into which Tool items can be grouped.
 *
 * @enum {string}
 */
SW5E.toolTypes = {
  art: "SW5E.ToolArtisans",
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
 * The basic tool types in 5e. This enables specific tool proficiencies or
 * starting equipment provided by classes and backgrounds.
 * @enum {string}
 */
SW5E.toolIds = {
  alchemist: "SztwZhbhZeCqyAes",
  bagpipes: "yxHi57T5mmVt0oDr",
  brewer: "Y9S75go1hLMXUD48",
  calligrapher: "jhjo20QoiD5exf09",
  card: "YwlHI3BVJapz4a3E",
  carpenter: "8NS6MSOdXtUqD7Ib",
  cartographer: "fC0lFK8P4RuhpfaU",
  chess: "23y8FvWKf9YLcnBL",
  cobbler: "hM84pZnpCqKfi8XH",
  cook: "Gflnp29aEv5Lc1ZM",
  dice: "iBuTM09KD9IoM5L8",
  disg: "IBhDAr7WkhWPYLVn",
  drum: "69Dpr25pf4BjkHKb",
  dulcimer: "NtdDkjmpdIMiX7I2",
  flute: "eJOrPcAz9EcquyRQ",
  forg: "cG3m4YlHfbQlLEOx",
  glassblower: "rTbVrNcwApnuTz5E",
  herb: "i89okN7GFTWHsvPy",
  horn: "aa9KuBy4dst7WIW9",
  jeweler: "YfBwELTgPFHmQdHh",
  leatherworker: "PUMfwyVUbtyxgYbD",
  lute: "qBydtUUIkv520DT7",
  lyre: "EwG1EtmbgR3bM68U",
  mason: "skUih6tBvcBbORzA",
  navg: "YHCmjsiXxZ9UdUhU",
  painter: "ccm5xlWhx74d6lsK",
  panflute: "G5m5gYIx9VAUWC3J",
  pois: "il2GNi8C0DvGLL9P",
  potter: "hJS8yEVkqgJjwfWa",
  shawm: "G3cqbejJpfB91VhP",
  smith: "KndVe2insuctjIaj",
  thief: "woWZ1sO5IUVGzo58",
  tinker: "0d08g1i5WXnNrCNA",
  viol: "baoe3U5BfMMMxhCU",
  weaver: "ap9prThUB2y9lDyj",
  woodcarver: "xKErqkLo4ASYr5EP"
};

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
  charges: "SW5E.ConsumeCharges"
};
preLocalize("abilityConsumptionTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Configuration data for actor sizes.
 *
 * @typedef {object} ActorSizeConfiguration
 * @property {string} label                   Localized label.
 * @property {string} abbreviation            Localized abbreviation.
 * @property {number} hitDie                  Default hit die denomination for NPCs of this size.
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
    hitDie: 4,
    token: 0.5,
    capacityMultiplier: 0.5
  },
  sm: {
    label: "SW5E.SizeSmall",
    abbreviation: "SW5E.SizeSmallAbbr",
    hitDie: 6,
    dynamicTokenScale: 0.8
  },
  med: {
    label: "SW5E.SizeMedium",
    abbreviation: "SW5E.SizeMediumAbbr",
    hitDie: 8
  },
  lg: {
    label: "SW5E.SizeLarge",
    abbreviation: "SW5E.SizeLargeAbbr",
    hitDie: 10,
    token: 2,
    capacityMultiplier: 2
  },
  huge: {
    label: "SW5E.SizeHuge",
    abbreviation: "SW5E.SizeHugeAbbr",
    hitDie: 12,
    token: 3,
    capacityMultiplier: 4
  },
  grg: {
    label: "SW5E.SizeGargantuan",
    abbreviation: "SW5E.SizeGargantuanAbbr",
    hitDie: 20,
    token: 4,
    capacityMultiplier: 8
  }
};
preLocalize("actorSizes", { keys: ["label", "abbreviation"] });

/* -------------------------------------------- */
/*  Canvas                                      */
/* -------------------------------------------- */

/**
 * Colors used to visualize temporary and temporary maximum HP in token health bars.
 * @enum {number}
 */
SW5E.tokenHPColors = {
  damage: 0xFF0000,
  healing: 0x00FF00,
  temp: 0x66CCFF,
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
 * Configuration data for a map marker style. Options not included will fall back to the value set in `default` style.
 *
 * @typedef {object} MapLocationMarkerStyle
 * @property {number} [backgroundColor]      Color of the background inside the circle.
 * @property {number} [borderColor]          Color of the border in normal state.
 * @property {number} [borderHoverColor]     Color of the border when hovering over the marker.
 * @property {string} [fontFamily]           Font used for rendering the code on the marker.
 * @property {number} [shadowColor]          Color of the shadow under the marker.
 * @property {number} [textColor]            Color of the text on the marker.
 */

/**
 * Settings used to render map location markers on the canvas.
 * @enum {MapLocationMarkerStyle}
 */
SW5E.mapLocationMarker = {
  default: {
    backgroundColor: 0xFBF8F5,
    borderColor: 0x000000,
    borderHoverColor: 0xFF5500,
    fontFamily: "Roboto Slab",
    shadowColor: 0x000000,
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
    icon: "icons/creatures/tentacles/tentacle-eyes-yellow-pink.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.yy50qVC1JhPHt4LC",
    detectAlignment: true
  },
  beast: {
    label: "SW5E.CreatureBeast",
    plural: "SW5E.CreatureBeastPl",
    icon: "icons/creatures/claws/claw-bear-paw-swipe-red.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6bTHn7pZek9YX2tv"
  },
  celestial: {
    label: "SW5E.CreatureCelestial",
    plural: "SW5E.CreatureCelestialPl",
    icon: "icons/creatures/abilities/wings-birdlike-blue.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.T5CJwxjhBbi6oqaM",
    detectAlignment: true
  },
  construct: {
    label: "SW5E.CreatureConstruct",
    plural: "SW5E.CreatureConstructPl",
    icon: "icons/creatures/magical/construct-stone-earth-gray.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.jQGAJZBZTqDFod8d"
  },
  dragon: {
    label: "SW5E.CreatureDragon",
    plural: "SW5E.CreatureDragonPl",
    icon: "icons/creatures/abilities/dragon-fire-breath-orange.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.k2IRXZwGk9W0PM2S"
  },
  elemental: {
    label: "SW5E.CreatureElemental",
    plural: "SW5E.CreatureElementalPl",
    icon: "icons/creatures/magical/spirit-fire-orange.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.7z1LXGGkXpHuzkFh",
    detectAlignment: true
  },
  fey: {
    label: "SW5E.CreatureFey",
    plural: "SW5E.CreatureFeyPl",
    icon: "icons/creatures/magical/fae-fairy-winged-glowing-green.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.OFsRUt3pWljgm8VC",
    detectAlignment: true
  },
  fiend: {
    label: "SW5E.CreatureFiend",
    plural: "SW5E.CreatureFiendPl",
    icon: "icons/magic/death/skull-horned-goat-pentagram-red.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ElHKBJeiJPC7gj6k",
    detectAlignment: true
  },
  giant: {
    label: "SW5E.CreatureGiant",
    plural: "SW5E.CreatureGiantPl",
    icon: "icons/creatures/magical/humanoid-giant-forest-blue.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.AOXn3Mv5vPZwo0Uf"
  },
  humanoid: {
    label: "SW5E.CreatureHumanoid",
    plural: "SW5E.CreatureHumanoidPl",
    icon: "icons/magic/unholy/strike-body-explode-disintegrate.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iFzQs4AenN8ALRvw"
  },
  monstrosity: {
    label: "SW5E.CreatureMonstrosity",
    plural: "SW5E.CreatureMonstrosityPl",
    icon: "icons/creatures/abilities/mouth-teeth-rows-red.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.TX0yPEFTn79AMZ8P"
  },
  ooze: {
    label: "SW5E.CreatureOoze",
    plural: "SW5E.CreatureOozePl",
    icon: "icons/creatures/slimes/slime-movement-pseudopods-green.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.cgzIC1ecG03D97Fg"
  },
  plant: {
    label: "SW5E.CreaturePlant",
    plural: "SW5E.CreaturePlantPl",
    icon: "icons/magic/nature/tree-animated-strike.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.1oT7t6tHE4kZuSN1"
  },
  undead: {
    label: "SW5E.CreatureUndead",
    plural: "SW5E.CreatureUndeadPl",
    icon: "icons/magic/death/skull-horned-worn-fire-blue.webp",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.D2BdqS1GeD5rcZ6q",
    detectAlignment: true
  }
};
preLocalize("creatureTypes", { keys: ["label", "plural"], sort: true });

/* -------------------------------------------- */

/**
 * Classification types for item action types.
 * @enum {string}
 */
SW5E.itemActionTypes = {
  mwak: "SW5E.ActionMWAK",
  rwak: "SW5E.ActionRWAK",
  mpak: "SW5E.ActionMPAK",
  rpak: "SW5E.ActionRPAK",
  abil: "SW5E.ActionAbil",
  save: "SW5E.ActionSave",
  ench: "SW5E.ActionEnch",
  summ: "SW5E.ActionSumm",
  heal: "SW5E.ActionHeal",
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
  common: "SW5E.ItemRarityCommon",
  uncommon: "SW5E.ItemRarityUncommon",
  rare: "SW5E.ItemRarityRare",
  veryRare: "SW5E.ItemRarityVeryRare",
  legendary: "SW5E.ItemRarityLegendary",
  artifact: "SW5E.ItemRarityArtifact"
};
preLocalize("itemRarity");

/* -------------------------------------------- */

/**
 * The limited use periods that support a recovery formula.
 * @deprecated since SW5e 3.1, available until SW5e 3.3
 * @enum {string}
 */
SW5E.limitedUseFormulaPeriods = {
  charges: "SW5E.Charges",
  dawn: "SW5E.Dawn",
  dusk: "SW5E.Dusk"
};

/* -------------------------------------------- */

/**
 * Configuration data for limited use periods.
 *
 * @typedef {object} LimitedUsePeriodConfiguration
 * @property {string} label           Localized label.
 * @property {string} abbreviation    Shorthand form of the label.
 * @property {boolean} [formula]      Whether this limited use period restores charges via formula.
 */

/**
 * Enumerate the lengths of time over which an item can have limited use ability.
 * @enum {LimitedUsePeriodConfiguration}
 */
SW5E.limitedUsePeriods = {
  sr: {
    label: "SW5E.UsesPeriods.Sr",
    abbreviation: "SW5E.UsesPeriods.SrAbbreviation"
  },
  lr: {
    label: "SW5E.UsesPeriods.Lr",
    abbreviation: "SW5E.UsesPeriods.LrAbbreviation"
  },
  day: {
    label: "SW5E.UsesPeriods.Day",
    abbreviation: "SW5E.UsesPeriods.DayAbbreviation"
  },
  charges: {
    label: "SW5E.UsesPeriods.Charges",
    abbreviation: "SW5E.UsesPeriods.ChargesAbbreviation",
    formula: true
  },
  dawn: {
    label: "SW5E.UsesPeriods.Dawn",
    abbreviation: "SW5E.UsesPeriods.DawnAbbreviation",
    formula: true
  },
  dusk: {
    label: "SW5E.UsesPeriods.Dusk",
    abbreviation: "SW5E.UsesPeriods.DuskAbbreviation",
    formula: true
  }
};
preLocalize("limitedUsePeriods", { keys: ["label", "abbreviation"] });
patchConfig("limitedUsePeriods", "label", { since: "SW5e 3.1", until: "SW5e 3.3" });

/* -------------------------------------------- */

/**
 * Periods at which enchantments can be re-bound to new items.
 * @enum {{ label: string }}
 */
SW5E.enchantmentPeriods = {
  sr: {
    label: "SW5E.UsesPeriods.Sr"
  },
  lr: {
    label: "SW5E.UsesPeriods.Lr"
  },
  atwill: {
    label: "SW5E.UsesPeriods.AtWill"
  }
};
preLocalize("enchantmentPeriods", { key: "label" });

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
  shield: "SW5E.EquipmentShield"
};
preLocalize("armorTypes");

/* -------------------------------------------- */

/**
 * Equipment types that aren't armor.
 * @enum {string}
 */
SW5E.miscEquipmentTypes = {
  clothing: "SW5E.EquipmentClothing",
  trinket: "SW5E.EquipmentTrinket",
  vehicle: "SW5E.EquipmentVehicle"
};
preLocalize("miscEquipmentTypes", { sort: true });

/* -------------------------------------------- */

/**
 * The set of equipment types for armor, clothing, and other objects which can be worn by the character.
 * @enum {string}
 */
SW5E.equipmentTypes = {
  ...SW5E.miscEquipmentTypes,
  ...SW5E.armorTypes
};
preLocalize("equipmentTypes", { sort: true });

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
 * The basic armor types in 5e. This enables specific armor proficiencies,
 * automated AC calculation in NPCs, and starting equipment.
 * @enum {string}
 */
SW5E.armorIds = {
  breastplate: "SK2HATQ4abKUlV8i",
  chainmail: "rLMflzmxpe8JGTOA",
  chainshirt: "p2zChy24ZJdVqMSH",
  halfplate: "vsgmACFYINloIdPm",
  hide: "n1V07puo0RQxPGuF",
  leather: "WwdpHLXGX5r8uZu5",
  padded: "GtKV1b5uqFQqpEni",
  plate: "OjkIqlW2UpgFcjZa",
  ringmail: "nsXZejlmgalj4he9",
  scalemail: "XmnlF5fgIO3tg6TG",
  splint: "cKpJmsJmU8YaiuqG",
  studded: "TIV3B1vbrVHIhQAm"
};

/**
 * The basic shield in 5e.
 * @enum {string}
 */
SW5E.shieldIds = {
  shield: "sSs3hSzkKBMNBgTs"
};

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
  mage: {
    label: "SW5E.ArmorClassMage",
    formula: "13 + @abilities.dex.mod"
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
 * Configuration data for an items that have sub-types.
 *
 * @typedef {object} SubtypeTypeConfiguration
 * @property {string} label                       Localized label for this type.
 * @property {Record<string, string>} [subtypes]  Enum containing localized labels for subtypes.
 */

/**
 * Enumerate the valid consumable types which are recognized by the system.
 * @enum {SubtypeTypeConfiguration}
 */
SW5E.consumableTypes = {
  ammo: {
    label: "SW5E.ConsumableAmmo",
    subtypes: {
      arrow: "SW5E.ConsumableAmmoArrow",
      blowgunNeedle: "SW5E.ConsumableAmmoBlowgunNeedle",
      crossbowBolt: "SW5E.ConsumableAmmoCrossbowBolt",
      slingBullet: "SW5E.ConsumableAmmoSlingBullet"
    }
  },
  potion: {
    label: "SW5E.ConsumablePotion"
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
  scroll: {
    label: "SW5E.ConsumableScroll"
  },
  wand: {
    label: "SW5E.ConsumableWand"
  },
  rod: {
    label: "SW5E.ConsumableRod"
  },
  trinket: {
    label: "SW5E.ConsumableTrinket"
  }
};
preLocalize("consumableTypes", { key: "label", sort: true });
preLocalize("consumableTypes.ammo.subtypes", { sort: true });
preLocalize("consumableTypes.poison.subtypes", { sort: true });

/* -------------------------------------------- */

/**
 * Types of containers.
 * @enum {string}
 */
SW5E.containerTypes = {
  backpack: "H8YCd689ezlD26aT",
  barrel: "7Yqbqg5EtVW16wfT",
  basket: "Wv7HzD6dv1P0q78N",
  boltcase: "eJtPBiZtr2pp6ynt",
  bottle: "HZp69hhyNZUUCipF",
  bucket: "mQVYcHmMSoCUnBnM",
  case: "5mIeX824uMklU3xq",
  chest: "2YbuclKfhDL0bU4u",
  flask: "lHS63sC6bypENNlR",
  jug: "0ZBWwjFz3nIAXMLW",
  pot: "M8xM8BLK4tpUayEE",
  pitcher: "nXWdGtzi8DXDLLsL",
  pouch: "9bWTRRDym06PzSAf",
  quiver: "4MtQKPn9qMWCFjDA",
  sack: "CNdDj8dsXVpRVpXt",
  saddlebags: "TmfaFUSZJAotndn9",
  tankard: "uw6fINSmZ2j2o57A",
  vial: "meJEfX3gZgtMX4x2"
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
  arcane: {
    label: "SW5E.Focus.Arcane",
    itemIds: {
      crystal: "uXOT4fYbgPY8DGdd",
      orb: "tH5Rn0JVRG1zdmPa",
      rod: "OojyyGfh91iViuMF",
      staff: "BeKIrNIvNHRPQ4t5",
      wand: "KA2P6I48iOWlnboO"
    }
  },
  druidic: {
    label: "SW5E.Focus.Druidic",
    itemIds: {
      mistletoe: "xDK9GQd2iqOGH8Sd",
      totem: "PGL6aaM0wE5h0VN5",
      woodenstaff: "FF1ktpb2YSiyv896",
      yewwand: "t5yP0d7YaKwuKKiH"
    }
  },
  holy: {
    label: "SW5E.Focus.Holy",
    itemIds: {
      amulet: "paqlMjggWkBIAeCe",
      emblem: "laVqttkGMW4B9654",
      reliquary: "gP1URGq3kVIIFHJ7"
    }
  }
};
preLocalize("focusTypes", { key: "label" });

/* -------------------------------------------- */

/**
 * Types of "features" items.
 * @enum {SubtypeTypeConfiguration}
 */
SW5E.featureTypes = {
  background: {
    label: "SW5E.Feature.Background"
  },
  class: {
    label: "SW5E.Feature.Class.Label",
    subtypes: {
      arcaneShot: "SW5E.Feature.Class.ArcaneShot",
      artificerInfusion: "SW5E.Feature.Class.ArtificerInfusion",
      channelDivinity: "SW5E.Feature.Class.ChannelDivinity",
      defensiveTactic: "SW5E.Feature.Class.DefensiveTactic",
      eldritchInvocation: "SW5E.Feature.Class.EldritchInvocation",
      elementalDiscipline: "SW5E.Feature.Class.ElementalDiscipline",
      fightingStyle: "SW5E.Feature.Class.FightingStyle",
      huntersPrey: "SW5E.Feature.Class.HuntersPrey",
      ki: "SW5E.Feature.Class.Ki",
      maneuver: "SW5E.Feature.Class.Maneuver",
      metamagic: "SW5E.Feature.Class.Metamagic",
      multiattack: "SW5E.Feature.Class.Multiattack",
      pact: "SW5E.Feature.Class.PactBoon",
      psionicPower: "SW5E.Feature.Class.PsionicPower",
      rune: "SW5E.Feature.Class.Rune",
      superiorHuntersDefense: "SW5E.Feature.Class.SuperiorHuntersDefense"
    }
  },
  monster: {
    label: "SW5E.Feature.Monster"
  },
  species: {
    label: "SW5E.Feature.Species"
  },
  enchantment: {
    label: "SW5E.Enchantment.Label",
    subtypes: {
      artificerInfusion: "SW5E.Feature.Class.ArtificerInfusion",
      rune: "SW5E.Feature.Class.Rune"
    }
  },
  feat: {
    label: "SW5E.Feature.Feat"
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
preLocalize("featureTypes.class.subtypes", { sort: true });
preLocalize("featureTypes.enchantment.subtypes", { sort: true });
preLocalize("featureTypes.supernaturalGift.subtypes", { sort: true });

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
 */

/**
 * The various properties of all item types.
 * @enum {ItemPropertyConfiguration}
 */
SW5E.itemProperties = {
  ada: {
    label: "SW5E.Item.Property.Adamantine",
    isPhysical: true
  },
  amm: {
    label: "SW5E.Item.Property.Ammunition"
  },
  concentration: {
    label: "SW5E.Item.Property.Concentration",
    abbreviation: "SW5E.ConcentrationAbbr",
    icon: "systems/sw5e/icons/svg/statuses/concentrating.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.ow58p27ctAnr4VPH",
    isTag: true
  },
  fin: {
    label: "SW5E.Item.Property.Finesse"
  },
  fir: {
    label: "SW5E.Item.Property.Firearm"
  },
  foc: {
    label: "SW5E.Item.Property.Focus"
  },
  hvy: {
    label: "SW5E.Item.Property.Heavy"
  },
  lgt: {
    label: "SW5E.Item.Property.Light"
  },
  lod: {
    label: "SW5E.Item.Property.Loading"
  },
  material: {
    label: "SW5E.Item.Property.Material",
    abbreviation: "SW5E.ComponentMaterialAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.AeH5eDS4YeM9RETC"
  },
  mgc: {
    label: "SW5E.Item.Property.Magical",
    icon: "systems/sw5e/icons/svg/properties/magical.svg",
    isPhysical: true
  },
  rch: {
    label: "SW5E.Item.Property.Reach"
  },
  rel: {
    label: "SW5E.Item.Property.Reload"
  },
  ret: {
    label: "SW5E.Item.Property.Returning"
  },
  ritual: {
    label: "SW5E.Item.Property.Ritual",
    abbreviation: "SW5E.RitualAbbr",
    icon: "systems/sw5e/icons/svg/items/power.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.FjWqT5iyJ89kohdA",
    isTag: true
  },
  sil: {
    label: "SW5E.Item.Property.Silvered",
    isPhysical: true
  },
  somatic: {
    label: "SW5E.Item.Property.Somatic",
    abbreviation: "SW5E.ComponentSomaticAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.qwUNgUNilEmZkSC9"
  },
  spc: {
    label: "SW5E.Item.Property.Special"
  },
  stealthDisadvantage: {
    label: "SW5E.Item.Property.StealthDisadvantage"
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
  vocal: {
    label: "SW5E.Item.Property.Verbal",
    abbreviation: "SW5E.ComponentVerbalAbbr",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.6UXTNWMCQ0nSlwwx"
  },
  weightlessContents: {
    label: "SW5E.Item.Property.WeightlessContents"
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
  equipment: new Set([
    "concentration",
    "mgc",
    "stealthDisadvantage"
  ]),
  feat: new Set([
    "concentration",
    "mgc"
  ]),
  loot: new Set([
    "mgc"
  ]),
  weapon: new Set([
    "ada",
    "amm",
    "fin",
    "fir",
    "foc",
    "hvy",
    "lgt",
    "lod",
    "mgc",
    "rch",
    "rel",
    "ret",
    "sil",
    "spc",
    "thr",
    "two",
    "ver"
  ]),
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
 * The conversion number defines how many of that currency are equal to one GP.
 * @enum {CurrencyConfiguration}
 */
SW5E.currencies = {
  pp: {
    label: "SW5E.CurrencyPP",
    abbreviation: "SW5E.CurrencyAbbrPP",
    conversion: 0.1
  },
  gp: {
    label: "SW5E.CurrencyGP",
    abbreviation: "SW5E.CurrencyAbbrGP",
    conversion: 1
  },
  ep: {
    label: "SW5E.CurrencyEP",
    abbreviation: "SW5E.CurrencyAbbrEP",
    conversion: 2
  },
  sp: {
    label: "SW5E.CurrencySP",
    abbreviation: "SW5E.CurrencyAbbrSP",
    conversion: 10
  },
  cp: {
    label: "SW5E.CurrencyCP",
    abbreviation: "SW5E.CurrencyAbbrCP",
    conversion: 100
  }
};
preLocalize("currencies", { keys: ["label", "abbreviation"] });

/* -------------------------------------------- */
/*  Damage Types                                */
/* -------------------------------------------- */

/**
 * Configuration data for damage types.
 *
 * @typedef {object} DamageTypeConfiguration
 * @property {string} label          Localized label.
 * @property {string} icon           Icon representing this type.
 * @property {boolean} [isPhysical]  Is this a type that can be bypassed by magical or silvered weapons?
 * @property {string} [reference]    Reference to a rule page describing this damage type.
 * @property {Color} Color           Visual color of the damage type.
 */

/**
 * Types of damage the can be caused by abilities.
 * @enum {DamageTypeConfiguration}
 */
SW5E.damageTypes = {
  acid: {
    label: "SW5E.DamageAcid",
    icon: "systems/sw5e/icons/svg/damage/acid.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.IQhbKRPe1vCPdh8v",
    color: new Color(0x839D50)
  },
  bludgeoning: {
    label: "SW5E.DamageBludgeoning",
    icon: "systems/sw5e/icons/svg/damage/bludgeoning.svg",
    isPhysical: true,
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.39LFrlef94JIYO8m",
    color: new Color(0x0000A0)
  },
  cold: {
    label: "SW5E.DamageCold",
    icon: "systems/sw5e/icons/svg/damage/cold.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.4xsFUooHDEdfhw6g",
    color: new Color(0xADD8E6)
  },
  fire: {
    label: "SW5E.DamageFire",
    icon: "systems/sw5e/icons/svg/damage/fire.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.f1S66aQJi4PmOng6",
    color: new Color(0xFF4500)
  },
  force: {
    label: "SW5E.DamageForce",
    icon: "systems/sw5e/icons/svg/damage/force.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.eFTWzngD8dKWQuUR",
    color: new Color(0x800080)
  },
  lightning: {
    label: "SW5E.DamageLightning",
    icon: "systems/sw5e/icons/svg/damage/lightning.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9SaxFJ9bM3SutaMC",
    color: new Color(0x1E90FF)
  },
  necrotic: {
    label: "SW5E.DamageNecrotic",
    icon: "systems/sw5e/icons/svg/damage/necrotic.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.klOVUV5G1U7iaKoG",
    color: new Color(0x006400)
  },
  piercing: {
    label: "SW5E.DamagePiercing",
    icon: "systems/sw5e/icons/svg/damage/piercing.svg",
    isPhysical: true,
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.95agSnEGTdAmKhyC",
    color: new Color(0xC0C0C0)
  },
  poison: {
    label: "SW5E.DamagePoison",
    icon: "systems/sw5e/icons/svg/damage/poison.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.k5wOYXdWPzcWwds1",
    color: new Color(0x8A2BE2)
  },
  psychic: {
    label: "SW5E.DamagePsychic",
    icon: "systems/sw5e/icons/svg/damage/psychic.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.YIKbDv4zYqbE5teJ",
    color: new Color(0xFF1493)
  },
  radiant: {
    label: "SW5E.DamageRadiant",
    icon: "systems/sw5e/icons/svg/damage/radiant.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.5tcK9buXWDOw8yHH",
    color: new Color(0xFFD700)
  },
  slashing: {
    label: "SW5E.DamageSlashing",
    icon: "systems/sw5e/icons/svg/damage/slashing.svg",
    isPhysical: true,
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.sz2XKQ5lgsdPEJOa",
    color: new Color(0x8B0000)
  },
  thunder: {
    label: "SW5E.DamageThunder",
    icon: "systems/sw5e/icons/svg/damage/thunder.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.iqsmMHk7FSpiNkQy",
    color: new Color(0x708090)
  }
};
preLocalize("damageTypes", { keys: ["label"], sort: true });

/* -------------------------------------------- */
/*  Movement                                    */
/* -------------------------------------------- */

/**
 * Different types of healing that can be applied using abilities.
 * @enum {string}
 */
SW5E.healingTypes = {
  healing: {
    label: "SW5E.Healing",
    icon: "systems/sw5e/icons/svg/damage/healing.svg",
    color: new Color(0x46C252)
  },
  temphp: {
    label: "SW5E.HealingTemp",
    icon: "systems/sw5e/icons/svg/damage/temphp.svg",
    color: new Color(0x4B66DE)
  }
};
preLocalize("healingTypes", { keys: ["label"] });

/* -------------------------------------------- */

/**
 * The valid units of measure for movement distances in the game system.
 * By default this uses the imperial units of feet and miles.
 * @enum {string}
 */
SW5E.movementTypes = {
  burrow: "SW5E.MovementBurrow",
  climb: "SW5E.MovementClimb",
  fly: "SW5E.MovementFly",
  swim: "SW5E.MovementSwim",
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
 * Configuration data for a weight unit.
 *
 * @typedef {object} WeightUnitConfiguration
 * @property {string} label         Localized label for the unit.
 * @property {string} abbreviation  Localized abbreviation for the unit.
 * @property {number} conversion    Number that by which this unit should be multiplied to arrive at a standard value.
 * @property {string} type          Whether this is an "imperial" or "metric" unit.
 */

/**
 * The valid units for measurement of weight.
 * @enum {WeightUnitConfiguration}
 */
SW5E.weightUnits = {
  lb: {
    label: "SW5E.WeightUnit.Pounds.Label",
    abbreviation: "SW5E.WeightUnit.Pounds.Abbreviation",
    conversion: 1,
    type: "imperial"
  },
  tn: {
    label: "SW5E.WeightUnit.Tons.Label",
    abbreviation: "SW5E.WeightUnit.Tons.Abbreviation",
    conversion: 2000,
    type: "imperial"
  },
  kg: {
    label: "SW5E.WeightUnit.Kilograms.Label",
    abbreviation: "SW5E.WeightUnit.Kilograms.Abbreviation",
    conversion: 2.5,
    type: "metric"
  },
  Mg: {
    label: "SW5E.WeightUnit.Megagrams.Label",
    abbreviation: "SW5E.WeightUnit.Megagrams.Abbreviation",
    conversion: 2500,
    type: "metric"
  }
};
preLocalize("weightUnits", { keys: ["label", "abbreviation"] });

/* -------------------------------------------- */

/**
 * Encumbrance configuration data.
 *
 * @typedef {object} EncumbranceConfiguration
 * @property {Record<string, number>} currencyPerWeight  Pieces of currency that equal a base weight (lbs or kgs).
 * @property {Record<string, object>} effects            Data used to create encumbrance-related Active Effects.
 * @property {object} threshold                          Amount to multiply strength to get given capacity threshold.
 * @property {Record<string, number>} threshold.encumbered
 * @property {Record<string, number>} threshold.heavilyEncumbered
 * @property {Record<string, number>} threshold.maximum
 * @property {Record<string, {ft: number, m: number}>} speedReduction  Speed reduction caused by encumbered status.
 * @property {Record<string, number>} vehicleWeightMultiplier  Multiplier used to determine vehicle carrying capacity.
 * @property {Record<string, Record<string, string>>} baseUnits  Base units used to calculate carrying weight.
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
      metric: 2.5
    },
    heavilyEncumbered: {
      imperial: 10,
      metric: 5
    },
    maximum: {
      imperial: 15,
      metric: 7.5
    }
  },
  speedReduction: {
    encumbered: {
      ft: 10,
      m: 3
    },
    heavilyEncumbered: {
      ft: 20,
      m: 6
    },
    exceedingCarryingCapacity: {
      ft: 5,
      m: 1.5
    }
  },
  baseUnits: {
    default: {
      imperial: "lb",
      metric: "kg"
    },
    vehicle: {
      imperial: "tn",
      metric: "Mg"
    }
  }
};
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
  object: "SW5E.TargetObject",
  space: "SW5E.TargetSpace",
  creatureOrObject: "SW5E.TargetCreatureOrObject",
  any: "SW5E.TargetAny",
  willing: "SW5E.TargetWilling"
};
preLocalize("individualTargetTypes");

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

/**
 * Denominations of hit dice which can apply to classes.
 * @type {string[]}
 */
SW5E.hitDieTypes = ["d4", "d6", "d8", "d10", "d12"];

/* -------------------------------------------- */

/**
 * Configuration data for rest types.
 *
 * @typedef {object} RestConfiguration
 * @property {Record<string, number>} duration  Duration of different rest variants in minutes.
 */

/**
 * Types of rests.
 * @enum {RestConfiguration}
 */
SW5E.restTypes = {
  short: {
    duration: {
      normal: 60,
      gritty: 480,
      epic: 1
    }
  },
  long: {
    duration: {
      normal: 480,
      gritty: 10080,
      epic: 60
    }
  }
};

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
/*  Powercasting                                */
/* -------------------------------------------- */

/**
 * Define the standard slot progression by character level.
 * The entries of this array represent the power slot progression for a full power-caster.
 * @type {number[][]}
 */
SW5E.SPELL_SLOT_TABLE = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1]
];

/* -------------------------------------------- */

/**
 * Configuration data for pact casting progression.
 *
 * @typedef {object} PactProgressionConfig
 * @property {number} slots  Number of power slots granted.
 * @property {number} level  Level of powers that can be cast.
 */

/**
 * Define the pact slot & level progression by pact caster level.
 * @enum {PactProgressionConfig}
 */
SW5E.pactCastingProgression = {
  1: { slots: 1, level: 1 },
  2: { slots: 2, level: 1 },
  3: { slots: 2, level: 2 },
  5: { slots: 2, level: 3 },
  7: { slots: 2, level: 4 },
  9: { slots: 2, level: 5 },
  11: { slots: 3, level: 5 },
  17: { slots: 4, level: 5 }
};

/* -------------------------------------------- */

/**
 * Configuration data for power preparation modes.
 *
 * @typedef {object} PowerPreparationModeConfiguration
 * @property {string} label           Localized name of this power preparation type.
 * @property {boolean} [upcast]       Whether this preparation mode allows for upcasting.
 * @property {boolean} [at-wills]     Whether this mode allows for at-wills in a powerbook.
 * @property {number} [order]         The sort order of this mode in a powerbook.
 * @property {boolean} [prepares]     Whether this preparation mode prepares powers.
 */

/**
 * Various different ways a power can be prepared.
 * @enum {PowerPreparationModeConfiguration}
 */
SW5E.powerPreparationModes = {
  prepared: {
    label: "SW5E.PowerPrepPrepared",
    upcast: true,
    prepares: true
  },
  pact: {
    label: "SW5E.PactMagic",
    upcast: true,
    at-wills: true,
    order: 0.5
  },
  always: {
    label: "SW5E.PowerPrepAlways",
    upcast: true,
    prepares: true
  },
  atwill: {
    label: "SW5E.PowerPrepAtWill",
    order: -30
  },
  innate: {
    label: "SW5E.PowerPrepInnate",
    order: -20
  },
  ritual: {
    label: "SW5E.PowerPrepRitual",
    order: -10
  }
};
preLocalize("powerPreparationModes", { key: "label" });
patchConfig("powerPreparationModes", "label", { since: "SW5e 3.1", until: "SW5e 3.3" });

/* -------------------------------------------- */

/**
 * Subset of `SW5E.powerPreparationModes` that consume power slots.
 * @deprecated since SW5e 3.1, available until SW5e 3.3
 * @type {string[]}
 */
SW5E.powerUpcastModes = ["always", "pact", "prepared"];

/* -------------------------------------------- */

/**
 * Configuration data for different types of powercasting supported.
 *
 * @typedef {object} PowercastingTypeConfiguration
 * @property {string} label                               Localized label.
 * @property {string} img                                 Image used when rendered as a favorite on the sheet.
 * @property {boolean} [shortRest]                        Are these power slots additionally restored on a short rest?
 * @property {Object<string, PowercastingProgressionConfiguration>} [progression]  Any progression modes for this type.
 */

/**
 * Configuration data for a powercasting progression mode.
 *
 * @typedef {object} PowercastingProgressionConfiguration
 * @property {string} label             Localized label.
 * @property {number} [divisor=1]       Value by which the class levels are divided to determine powercasting level.
 * @property {boolean} [roundUp=false]  Should fractional values should be rounded up by default?
 */

/**
 * Different powercasting types and their progression.
 * @type {PowercastingTypeConfiguration}
 */
SW5E.powercastingTypes = {
  leveled: {
    label: "SW5E.PowerProgLeveled",
    img: "systems/sw5e/icons/power-tiers/{id}.webp",
    progression: {
      full: {
        label: "SW5E.PowerProgFull",
        divisor: 1
      },
      half: {
        label: "SW5E.PowerProgHalf",
        divisor: 2
      },
      third: {
        label: "SW5E.PowerProgThird",
        divisor: 3
      },
      artificer: {
        label: "SW5E.PowerProgArt",
        divisor: 2,
        roundUp: true
      }
    }
  },
  pact: {
    label: "SW5E.PowerProgPact",
    img: "icons/magic/unholy/silhouette-robe-evil-power.webp",
    shortRest: true
  }
};
preLocalize("powercastingTypes", { key: "label", sort: true });
preLocalize("powercastingTypes.leveled.progression", { key: "label" });

/* -------------------------------------------- */

/**
 * Ways in which a class can contribute to powercasting levels.
 * @enum {string}
 */
SW5E.powerProgression = {
  none: "SW5E.PowerNone",
  full: "SW5E.PowerProgFull",
  half: "SW5E.PowerProgHalf",
  third: "SW5E.PowerProgThird",
  pact: "SW5E.PowerProgPact",
  artificer: "SW5E.PowerProgArt"
};
preLocalize("powerProgression", { key: "label" });

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

/* -------------------------------------------- */

/**
 * The available choices for how power damage scaling may be computed.
 * @enum {string}
 */
SW5E.powerScalingModes = {
  none: "SW5E.PowerNone",
  at-will: "SW5E.PowerAt-Will",
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
 * @deprecated since SW5e 3.0, available until SW5e 3.3
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
 * @deprecated since SW5e 3.0, available until SW5e 3.3
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
 */

/**
 * Schools to which a power can belong.
 * @enum {PowerSchoolConfiguration}
 */
SW5E.powerSchools = {
  abj: {
    label: "SW5E.SchoolAbj",
    icon: "systems/sw5e/icons/svg/schools/abjuration.svg",
    fullKey: "abjuration",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.849AYEWw9FHD6JNz"
  },
  con: {
    label: "SW5E.SchoolCon",
    icon: "systems/sw5e/icons/svg/schools/conjuration.svg",
    fullKey: "conjuration",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.TWyKMhZJZGqQ6uls"
  },
  div: {
    label: "SW5E.SchoolDiv",
    icon: "systems/sw5e/icons/svg/schools/divination.svg",
    fullKey: "divination",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.HoD2MwzmVbMqj9se"
  },
  enc: {
    label: "SW5E.SchoolEnc",
    icon: "systems/sw5e/icons/svg/schools/enchantment.svg",
    fullKey: "enchantment",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.SehPXk24ySBVOwCZ"
  },
  evo: {
    label: "SW5E.SchoolEvo",
    icon: "systems/sw5e/icons/svg/schools/evocation.svg",
    fullKey: "evocation",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.kGp1RNuxL2SELLRC"
  },
  ill: {
    label: "SW5E.SchoolIll",
    icon: "systems/sw5e/icons/svg/schools/illusion.svg",
    fullKey: "illusion",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.smEk7kvVyslFozrB"
  },
  nec: {
    label: "SW5E.SchoolNec",
    icon: "systems/sw5e/icons/svg/schools/necromancy.svg",
    fullKey: "necromancy",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.W0eyiV1FBmngb6Qh"
  },
  trs: {
    label: "SW5E.SchoolTrs",
    icon: "systems/sw5e/icons/svg/schools/transmutation.svg",
    fullKey: "transmutation",
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.IYWewSailtmv6qEb"
  }
};
preLocalize("powerSchools", { key: "label", sort: true });

/* -------------------------------------------- */

/**
 * Types of power lists.
 * @enum {string}
 */
SW5E.powerListTypes = {
  class: "ITEM.TypeClass",
  archetype: "ITEM.TypeArchetype",
  background: "ITEM.TypeBackground",
  species: "ITEM.TypeSpecies",
  other: "JOURNALENTRYPAGE.SW5E.PowerList.Type.Other"
};
preLocalize("powerListTypes");

/* -------------------------------------------- */

/**
 * Power scroll item ID within the `SW5E.sourcePacks` compendium or a full UUID for each power level.
 * @enum {string}
 */
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

/* -------------------------------------------- */
/*  Weapon Details                              */
/* -------------------------------------------- */

/**
 * The set of types which a weapon item can take.
 * @enum {string}
 */
SW5E.weaponTypes = {
  simpleM: "SW5E.WeaponSimpleM",
  simpleB: "SW5E.WeaponSimpleB",
  martialM: "SW5E.WeaponMartialM",
  martialB: "SW5E.WeaponMartialB",
  natural: "SW5E.WeaponNatural",
  improv: "SW5E.WeaponImprov",
  siege: "SW5E.WeaponSiege"
};
preLocalize("weaponTypes");

/* -------------------------------------------- */

/**
 * Compendium packs used for localized items.
 * @enum {string}
 */
SW5E.sourcePacks = {
  BACKGROUNDS: "sw5e.backgrounds",
  CLASSES: "sw5e.classes",
  ITEMS: "sw5e.items",
  RACES: "sw5e.species"
};

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
  0: "SW5E.NotProficient",
  1: "SW5E.Proficient",
  0.5: "SW5E.HalfProficient",
  2: "SW5E.Expertise"
};
preLocalize("proficiencyLevels");

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
  .5: "SW5E.CoverHalf",
  .75: "SW5E.CoverThreeQuarters",
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
  "attributes.ac.value", "attributes.init.bonus", "attributes.movement", "attributes.senses", "attributes.powerdc",
  "attributes.powerLevel", "details.cr", "details.powerLevel", "details.xp.value", "skills.*.passive",
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
 * @typedef {object} _StatusEffectConfig5e
 * @property {string} icon            Icon used to represent the condition on the token.
 * @property {string} [reference]     UUID of a journal entry with details on this condition.
 * @property {string} [special]       Set this condition as a special status effect under this name.
 * @property {string[]} [riders]      Additional conditions, by id, to apply as part of this condition.
 */

/**
 * Configuration data for system status effects.
 * @typedef {Omit<StatusEffectConfig, "img"> & _StatusEffectConfig5e} StatusEffectConfig5e
 */

/**
 * @typedef {object} _ConditionConfiguration
 * @property {string} label        Localized label for the condition.
 * @property {boolean} [pseudo]    Is this a pseudo-condition, i.e. one that does not appear in the conditions appendix
 *                                 but acts as a status effect?
 * @property {number} [levels]     The number of levels of exhaustion an actor can obtain.
 */

/**
 * Configuration data for system conditions.
 * @typedef {Omit<StatusEffectConfig5e, "name"> & _ConditionConfiguration} ConditionConfiguration
 */

/**
 * Conditions that can affect an actor.
 * @enum {ConditionConfiguration}
 */
SW5E.conditionTypes = {
  bleeding: {
    label: "EFFECT.SW5E.StatusBleeding",
    icon: "systems/sw5e/icons/svg/statuses/bleeding.svg",
    pseudo: true
  },
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
  cursed: {
    label: "EFFECT.SW5E.StatusCursed",
    icon: "systems/sw5e/icons/svg/statuses/cursed.svg",
    pseudo: true
  },
  deafened: {
    label: "SW5E.ConDeafened",
    icon: "systems/sw5e/icons/svg/statuses/deafened.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.6G8JSjhn701cBITY"
  },
  diseased: {
    label: "SW5E.ConDiseased",
    icon: "systems/sw5e/icons/svg/statuses/diseased.svg",
    pseudo: true,
    reference: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.oNQWvyRZkTOJ8PBq"
  },
  exhaustion: {
    label: "SW5E.ConExhaustion",
    icon: "systems/sw5e/icons/svg/statuses/exhaustion.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.cspWveykstnu3Zcv",
    levels: 6
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
  silenced: {
    label: "EFFECT.SW5E.StatusSilenced",
    icon: "systems/sw5e/icons/svg/statuses/silenced.svg",
    pseudo: true
  },
  stunned: {
    label: "SW5E.ConStunned",
    icon: "systems/sw5e/icons/svg/statuses/stunned.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.ZyZMUwA2rboh4ObS",
    statuses: ["incapacitated"]
  },
  surprised: {
    label: "EFFECT.SW5E.StatusSurprised",
    icon: "systems/sw5e/icons/svg/statuses/surprised.svg",
    pseudo: true
  },
  transformed: {
    label: "EFFECT.SW5E.StatusTransformed",
    icon: "systems/sw5e/icons/svg/statuses/transformed.svg",
    pseudo: true
  },
  unconscious: {
    label: "SW5E.ConUnconscious",
    icon: "systems/sw5e/icons/svg/statuses/unconscious.svg",
    reference: "Compendium.sw5e.rules.JournalEntry.w7eitkpD7QQTB6j0.JournalEntryPage.UWw13ISmMxDzmwbd",
    statuses: ["incapacitated"],
    riders: ["prone"]
  }
};
preLocalize("conditionTypes", { key: "label", sort: true });

/* -------------------------------------------- */

/**
 * Various effects of conditions and which conditions apply it. Either keys for the conditions,
 * and with a number appended for a level of exhaustion.
 * @enum {object}
 */
SW5E.conditionEffects = {
  noMovement: new Set(["exhaustion-5", "grappled", "paralyzed", "petrified", "restrained", "stunned", "unconscious"]),
  halfMovement: new Set(["exhaustion-2"]),
  crawl: new Set(["prone", "exceedingCarryingCapacity"]),
  petrification: new Set(["petrified"]),
  halfHealth: new Set(["exhaustion-4"])
};

/* -------------------------------------------- */

/**
 * Extra status effects not specified in `conditionTypes`. If the ID matches a core-provided effect, then this
 * data will be merged into the core data.
 * @enum {Omit<StatusEffectConfig5e, "img"> & {icon: string}}
 */
SW5E.statusEffects = {
  burrowing: {
    name: "EFFECT.SW5E.StatusBurrowing",
    icon: "systems/sw5e/icons/svg/statuses/burrowing.svg",
    special: "BURROW"
  },
  concentrating: {
    name: "EFFECT.SW5E.StatusConcentrating",
    icon: "systems/sw5e/icons/svg/statuses/concentrating.svg",
    special: "CONCENTRATING"
  },
  dead: {
    name: "EFFECT.SW5E.StatusDead",
    icon: "systems/sw5e/icons/svg/statuses/dead.svg",
    special: "DEFEATED"
  },
  dodging: {
    name: "EFFECT.SW5E.StatusDodging",
    icon: "systems/sw5e/icons/svg/statuses/dodging.svg"
  },
  ethereal: {
    name: "EFFECT.SW5E.StatusEthereal",
    icon: "systems/sw5e/icons/svg/statuses/ethereal.svg"
  },
  flying: {
    name: "EFFECT.SW5E.StatusFlying",
    icon: "systems/sw5e/icons/svg/statuses/flying.svg",
    special: "FLY"
  },
  hiding: {
    name: "EFFECT.SW5E.StatusHiding",
    icon: "systems/sw5e/icons/svg/statuses/hiding.svg"
  },
  hovering: {
    name: "EFFECT.SW5E.StatusHovering",
    icon: "systems/sw5e/icons/svg/statuses/hovering.svg",
    special: "HOVER"
  },
  marked: {
    name: "EFFECT.SW5E.StatusMarked",
    icon: "systems/sw5e/icons/svg/statuses/marked.svg"
  },
  sleeping: {
    name: "EFFECT.SW5E.StatusSleeping",
    icon: "systems/sw5e/icons/svg/statuses/sleeping.svg",
    statuses: ["incapacitated", "unconscious"]
  },
  stable: {
    name: "EFFECT.SW5E.StatusStable",
    icon: "systems/sw5e/icons/svg/statuses/stable.svg"
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
      common: "SW5E.LanguagesCommon",
      dwarvish: "SW5E.LanguagesDwarvish",
      elvish: "SW5E.LanguagesElvish",
      giant: "SW5E.LanguagesGiant",
      gnomish: "SW5E.LanguagesGnomish",
      goblin: "SW5E.LanguagesGoblin",
      halfling: "SW5E.LanguagesHalfling",
      orc: "SW5E.LanguagesOrc"
    }
  },
  exotic: {
    label: "SW5E.LanguagesExotic",
    children: {
      aarakocra: "SW5E.LanguagesAarakocra",
      abyssal: "SW5E.LanguagesAbyssal",
      celestial: "SW5E.LanguagesCelestial",
      deep: "SW5E.LanguagesDeepSpeech",
      draconic: "SW5E.LanguagesDraconic",
      gith: "SW5E.LanguagesGith",
      gnoll: "SW5E.LanguagesGnoll",
      infernal: "SW5E.LanguagesInfernal",
      primordial: {
        label: "SW5E.LanguagesPrimordial",
        children: {
          aquan: "SW5E.LanguagesAquan",
          auran: "SW5E.LanguagesAuran",
          ignan: "SW5E.LanguagesIgnan",
          terran: "SW5E.LanguagesTerran"
        }
      },
      sylvan: "SW5E.LanguagesSylvan",
      undercommon: "SW5E.LanguagesUndercommon"
    }
  },
  druidic: "SW5E.LanguagesDruidic",
  cant: "SW5E.LanguagesThievesCant"
};
preLocalize("languages", { key: "label" });
preLocalize("languages.standard.children", { key: "label", sort: true });
preLocalize("languages.exotic.children", { key: "label", sort: true });
preLocalize("languages.exotic.children.primordial.children", { sort: true });
patchConfig("languages", "label", { since: "SW5e 2.4", until: "SW5e 3.1" });

/* -------------------------------------------- */

/**
 * Maximum allowed character level.
 * @type {number}
 */
SW5E.maxLevel = 20;

/**
 * Maximum ability score value allowed by default.
 * @type {number}
 */
SW5E.maxAbilityScore = 20;

/**
 * XP required to achieve each character level.
 * @type {number[]}
 */
SW5E.CHARACTER_EXP_LEVELS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
];

/**
 * XP granted for each challenge rating.
 * @type {number[]}
 */
SW5E.CR_EXP_LEVELS = [
  10, 200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 7200, 8400, 10000, 11500, 13000, 15000, 18000,
  20000, 22000, 25000, 33000, 41000, 50000, 62000, 75000, 90000, 105000, 120000, 135000, 155000
];

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
};
preLocalize("traitModes", { keys: ["label", "hint"] });

/* -------------------------------------------- */

/**
 * Special character flags.
 * @enum {CharacterFlagConfig}
 */
SW5E.characterFlags = {
  diamondSoul: {
    name: "SW5E.FlagsDiamondSoul",
    hint: "SW5E.FlagsDiamondSoulHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  elvenAccuracy: {
    name: "SW5E.FlagsElvenAccuracy",
    hint: "SW5E.FlagsElvenAccuracyHint",
    section: "SW5E.RacialTraits",
    abilities: ["dex", "int", "wis", "cha"],
    type: Boolean
  },
  halflingLucky: {
    name: "SW5E.FlagsHalflingLucky",
    hint: "SW5E.FlagsHalflingLuckyHint",
    section: "SW5E.RacialTraits",
    type: Boolean
  },
  initiativeAdv: {
    name: "SW5E.FlagsInitiativeAdv",
    hint: "SW5E.FlagsInitiativeAdvHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  initiativeAlert: {
    name: "SW5E.FlagsAlert",
    hint: "SW5E.FlagsAlertHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  jackOfAllTrades: {
    name: "SW5E.FlagsJOAT",
    hint: "SW5E.FlagsJOATHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  observantFeat: {
    name: "SW5E.FlagsObservant",
    hint: "SW5E.FlagsObservantHint",
    skills: ["prc", "inv"],
    section: "SW5E.Feats",
    type: Boolean
  },
  tavernBrawlerFeat: {
    name: "SW5E.FlagsTavernBrawler",
    hint: "SW5E.FlagsTavernBrawlerHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  powerfulBuild: {
    name: "SW5E.FlagsPowerfulBuild",
    hint: "SW5E.FlagsPowerfulBuildHint",
    section: "SW5E.RacialTraits",
    type: Boolean
  },
  reliableTalent: {
    name: "SW5E.FlagsReliableTalent",
    hint: "SW5E.FlagsReliableTalentHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  remarkableAthlete: {
    name: "SW5E.FlagsRemarkableAthlete",
    hint: "SW5E.FlagsRemarkableAthleteHint",
    abilities: ["str", "dex", "con"],
    section: "SW5E.Feats",
    type: Boolean
  },
  weaponCriticalThreshold: {
    name: "SW5E.FlagsWeaponCritThreshold",
    hint: "SW5E.FlagsWeaponCritThresholdHint",
    section: "SW5E.Feats",
    type: Number,
    placeholder: 20
  },
  powerCriticalThreshold: {
    name: "SW5E.FlagsPowerCritThreshold",
    hint: "SW5E.FlagsPowerCritThresholdHint",
    section: "SW5E.Feats",
    type: Number,
    placeholder: 20
  },
  meleeCriticalDamageDice: {
    name: "SW5E.FlagsMeleeCriticalDice",
    hint: "SW5E.FlagsMeleeCriticalDiceHint",
    section: "SW5E.Feats",
    type: Number,
    placeholder: 0
  }
};
preLocalize("characterFlags", { keys: ["name", "hint", "section"] });

/**
 * Flags allowed on actors. Any flags not in the list may be deleted during a migration.
 * @type {string[]}
 */
SW5E.allowedActorFlags = ["isPolymorphed", "originalActor"].concat(Object.keys(SW5E.characterFlags));

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
 * Configuration information for advancement types.
 *
 * @typedef {object} AdvancementTypeConfiguration
 * @property {typeof Advancement} documentClass  The advancement's document class.
 * @property {Set<string>} validItemTypes        What item types this advancement can be used with.
 * @property {boolean} [hidden]                  Should this advancement type be hidden in the selection dialog?
 */

const _ALL_ITEM_TYPES = ["background", "class", "species", "archetype"];

/**
 * Advancement types that can be added to items.
 * @enum {AdvancementTypeConfiguration}
 */
SW5E.advancementTypes = {
  AbilityScoreImprovement: {
    documentClass: advancement.AbilityScoreImprovementAdvancement,
    validItemTypes: new Set(["background", "class", "species"])
  },
  HitPoints: {
    documentClass: advancement.HitPointsAdvancement,
    validItemTypes: new Set(["class"])
  },
  ItemChoice: {
    documentClass: advancement.ItemChoiceAdvancement,
    validItemTypes: new Set(_ALL_ITEM_TYPES)
  },
  ItemGrant: {
    documentClass: advancement.ItemGrantAdvancement,
    validItemTypes: new Set(_ALL_ITEM_TYPES)
  },
  ScaleValue: {
    documentClass: advancement.ScaleValueAdvancement,
    validItemTypes: new Set(_ALL_ITEM_TYPES)
  },
  Size: {
    documentClass: advancement.SizeAdvancement,
    validItemTypes: new Set(["species"])
  },
  Trait: {
    documentClass: advancement.TraitAdvancement,
    validItemTypes: new Set(_ALL_ITEM_TYPES)
  }
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
  at-wills: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.jZD5mCTnMPJ9jW67",
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
  powerscroll: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.gi8IKhtOlBVhMJrN",
  creaturetags: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.9jV1fFF163dr68vd",
  telepathy: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.geTidcFIYWuUvD2L",
  legendaryactions: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.C1awOyZh78pq1xmY",
  lairactions: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.07PtjpMxiRIhkBEp",
  regionaleffects: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.uj8W27NKFyzygPUd",
  disease: "Compendium.sw5e.rules.JournalEntry.NizgRXLNUqtdlC1s.JournalEntryPage.oNQWvyRZkTOJ8PBq"
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
  spriteSheet: "systems/sw5e/tokens/composite/token-rings.json",
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
  "SRD 5.1": "SOURCE.BOOK.SRD"
};
preLocalize("sourceBooks", { sort: true });

/* -------------------------------------------- */
/*  Themes                                      */
/* -------------------------------------------- */

/**
 * Themes that can be set for the system or on sheets.
 * @enum {string}
 */
SW5E.themes = {
  light: "SHEETS.SW5E.THEME.Light",
  dark: "SHEETS.SW5E.THEME.Dark"
};
preLocalize("themes");

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
    const message = `The value of CONFIG.SW5E.${key} has been changed to an object.`
      +` The former value can be acccessed from .${fallbackKey}.`;
    foundry.utils.logCompatibilityWarning(message, options);
    return this[fallbackKey];
  }

  Object.values(SW5E[key]).forEach(o => {
    if ( foundry.utils.getType(o) !== "Object" ) return;
    Object.defineProperty(o, "toString", {value: toString});
  });
}

/* -------------------------------------------- */

export default SW5E;
