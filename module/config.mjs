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
    type: "physical"
  },
  dex: {
    label: "SW5E.AbilityDex",
    abbreviation: "SW5E.AbilityDexAbbr",
    type: "physical"
  },
  con: {
    label: "SW5E.AbilityCon",
    abbreviation: "SW5E.AbilityConAbbr",
    type: "physical"
  },
  int: {
    label: "SW5E.AbilityInt",
    abbreviation: "SW5E.AbilityIntAbbr",
    type: "mental",
    defaults: { vehicle: 0 }
  },
  wis: {
    label: "SW5E.AbilityWis",
    abbreviation: "SW5E.AbilityWisAbbr",
    type: "mental",
    defaults: { vehicle: 0 }
  },
  cha: {
    label: "SW5E.AbilityCha",
    abbreviation: "SW5E.AbilityChaAbbr",
    type: "mental",
    defaults: { vehicle: 0 }
  },
  hon: {
    label: "SW5E.AbilityHon",
    abbreviation: "SW5E.AbilityHonAbbr",
    type: "mental",
    defaults: { npc: "cha", vehicle: 0 }
  },
  san: {
    label: "SW5E.AbilitySan",
    abbreviation: "SW5E.AbilitySanAbbr",
    type: "mental",
    defaults: { npc: "wis", vehicle: 0 }
  }
};
preLocalize("abilities", { keys: ["label", "abbreviation"] });
patchConfig("abilities", "label", { since: 2.2, until: 2.4 });

Object.defineProperty(SW5E, "abilityAbbreviations", {
  get() {
    foundry.utils.logCompatibilityWarning(
      "The `abilityAbbreviations` configuration object has been merged with `abilities`.",
      { since: "SW5e 2.2", until: "SW5e 2.4" }
    );
    return Object.fromEntries(Object.entries(SW5E.abilities).map(([k, v]) => [k, v.abbreviation]));
  }
});

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

/* -------------------------------------------- */

/**
 * Configuration data for skills.
 *
 * @typedef {object} SkillConfiguration
 * @property {string} label    Localized label.
 * @property {string} ability  Key for the default ability used by this skill.
 */

/**
 * The set of skill which can be trained with their default ability scores.
 * @enum {SkillConfiguration}
 */
SW5E.skills = {
  acr: { label: "SW5E.SkillAcr", ability: "dex" },
  ani: { label: "SW5E.SkillAni", ability: "wis" },
  arc: { label: "SW5E.SkillArc", ability: "int" },
  ath: { label: "SW5E.SkillAth", ability: "str" },
  dec: { label: "SW5E.SkillDec", ability: "cha" },
  his: { label: "SW5E.SkillHis", ability: "int" },
  ins: { label: "SW5E.SkillIns", ability: "wis" },
  itm: { label: "SW5E.SkillItm", ability: "cha" },
  inv: { label: "SW5E.SkillInv", ability: "int" },
  med: { label: "SW5E.SkillMed", ability: "wis" },
  nat: { label: "SW5E.SkillNat", ability: "int" },
  prc: { label: "SW5E.SkillPrc", ability: "wis" },
  prf: { label: "SW5E.SkillPrf", ability: "cha" },
  per: { label: "SW5E.SkillPer", ability: "cha" },
  rel: { label: "SW5E.SkillRel", ability: "int" },
  slt: { label: "SW5E.SkillSlt", ability: "dex" },
  ste: { label: "SW5E.SkillSte", ability: "dex" },
  sur: { label: "SW5E.SkillSur", ability: "wis" }
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
  natural: true,
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
 * Various ways in which an item or ability can be activated.
 * @enum {string}
 */
SW5E.abilityActivationTypes = {
  action: "SW5E.Action",
  bonus: "SW5E.BonusAction",
  reaction: "SW5E.Reaction",
  minute: SW5E.timePeriods.minute,
  hour: SW5E.timePeriods.hour,
  day: SW5E.timePeriods.day,
  special: SW5E.timePeriods.spec,
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
 * Default types of creatures.
 * *Note: Not pre-localized to allow for easy fetching of pluralized forms.*
 * @enum {string}
 */
SW5E.creatureTypes = {
  aberration: "SW5E.CreatureAberration",
  beast: "SW5E.CreatureBeast",
  celestial: "SW5E.CreatureCelestial",
  construct: "SW5E.CreatureConstruct",
  dragon: "SW5E.CreatureDragon",
  elemental: "SW5E.CreatureElemental",
  fey: "SW5E.CreatureFey",
  fiend: "SW5E.CreatureFiend",
  giant: "SW5E.CreatureGiant",
  humanoid: "SW5E.CreatureHumanoid",
  monstrosity: "SW5E.CreatureMonstrosity",
  ooze: "SW5E.CreatureOoze",
  plant: "SW5E.CreaturePlant",
  undead: "SW5E.CreatureUndead"
};

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
 * Enumerate the lengths of time over which an item can have limited use ability.
 * @enum {string}
 */
SW5E.limitedUsePeriods = {
  sr: "SW5E.ShortRest",
  lr: "SW5E.LongRest",
  day: "SW5E.Day",
  charges: "SW5E.Charges"
};
preLocalize("limitedUsePeriods");

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
 * Enumerate the valid consumable types which are recognized by the system.
 * @enum {string}
 */
SW5E.consumableTypes = {
  ammo: "SW5E.ConsumableAmmo",
  potion: "SW5E.ConsumablePotion",
  poison: "SW5E.ConsumablePoison",
  food: "SW5E.ConsumableFood",
  scroll: "SW5E.ConsumableScroll",
  wand: "SW5E.ConsumableWand",
  rod: "SW5E.ConsumableRod",
  trinket: "SW5E.ConsumableTrinket"
};
preLocalize("consumableTypes", { sort: true });

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
      artificerInfusion: "SW5E.ClassFeature.ArtificerInfusion",
      channelDivinity: "SW5E.ClassFeature.ChannelDivinity",
      defensiveTactic: "SW5E.ClassFeature.DefensiveTactic",
      eldritchInvocation: "SW5E.ClassFeature.EldritchInvocation",
      elementalDiscipline: "SW5E.ClassFeature.ElementalDiscipline",
      fightingStyle: "SW5E.ClassFeature.FightingStyle",
      huntersPrey: "SW5E.ClassFeature.HuntersPrey",
      ki: "SW5E.ClassFeature.Ki",
      maneuver: "SW5E.ClassFeature.Maneuver",
      metamagic: "SW5E.ClassFeature.Metamagic",
      multiattack: "SW5E.ClassFeature.Multiattack",
      pact: "SW5E.ClassFeature.PactBoon",
      psionicPower: "SW5E.ClassFeature.PsionicPower",
      rune: "SW5E.ClassFeature.Rune",
      superiorHuntersDefense: "SW5E.ClassFeature.SuperiorHuntersDefense"
    }
  },
  monster: {
    label: "SW5E.Feature.Monster"
  },
  species: {
    label: "SW5E.Feature.Species"
  },
  feat: {
    label: "SW5E.Feature.Feat"
  }
};
preLocalize("featureTypes", { key: "label" });
preLocalize("featureTypes.class.subtypes", { sort: true });

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
 * Types of damage that are considered physical.
 * @enum {string}
 */
SW5E.physicalDamageTypes = {
  bludgeoning: "SW5E.DamageBludgeoning",
  piercing: "SW5E.DamagePiercing",
  slashing: "SW5E.DamageSlashing"
};
preLocalize("physicalDamageTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Types of damage the can be caused by abilities.
 * @enum {string}
 */
SW5E.damageTypes = {
  ...SW5E.physicalDamageTypes,
  acid: "SW5E.DamageAcid",
  cold: "SW5E.DamageCold",
  fire: "SW5E.DamageFire",
  force: "SW5E.DamageForce",
  lightning: "SW5E.DamageLightning",
  necrotic: "SW5E.DamageNecrotic",
  poison: "SW5E.DamagePoison",
  psychic: "SW5E.DamagePsychic",
  radiant: "SW5E.DamageRadiant",
  thunder: "SW5E.DamageThunder"
};
preLocalize("damageTypes", { sort: true });

/* -------------------------------------------- */

/**
 * Types of damage to which an actor can possess resistance, immunity, or vulnerability.
 * @enum {string}
 * @deprecated
 */
SW5E.damageResistanceTypes = {
  ...SW5E.damageTypes,
  physical: "SW5E.DamagePhysical"
};
preLocalize("damageResistanceTypes", { sort: true });

/* -------------------------------------------- */
/*  Movement                                    */
/* -------------------------------------------- */

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
  object: "SW5E.TargetObject",
  space: "SW5E.TargetSpace"
};
preLocalize("individualTargetTypes");

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

/**
 * Denominations of hit dice which can apply to classes.
 * @type {string[]}
 */
SW5E.hitDieTypes = ["d4", "d6", "d8", "d10", "d12"];

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
 * Various different ways a power can be prepared.
 */
SW5E.powerPreparationModes = {
  prepared: "SW5E.PowerPrepPrepared",
  pact: "SW5E.PactMagic",
  always: "SW5E.PowerPrepAlways",
  atwill: "SW5E.PowerPrepAtWill",
  innate: "SW5E.PowerPrepInnate"
};
preLocalize("powerPreparationModes");

/* -------------------------------------------- */

/**
 * Subset of `SW5E.powerPreparationModes` that consume power slots.
 * @type {boolean[]}
 */
SW5E.powerUpcastModes = ["always", "pact", "prepared"];

/* -------------------------------------------- */

/**
 * Configuration data for different types of powercasting supported.
 *
 * @typedef {object} PowercastingTypeConfiguration
 * @property {string} label                                                        Localized label.
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
    label: "SW5E.PowerProgPact"
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
  cantrip: "SW5E.PowerCantrip",
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
preLocalize("powerComponents", {keys: ["label", "abbr"]});

/* -------------------------------------------- */

/**
 * Supplementary rules keywords that inform a power's use.
 * @enum {object}
 */
SW5E.powerTags = {
  concentration: {
    label: "SW5E.Concentration",
    abbr: "SW5E.ConcentrationAbbr"
  },
  ritual: {
    label: "SW5E.Ritual",
    abbr: "SW5E.RitualAbbr"
  }
};
preLocalize("powerTags", {keys: ["label", "abbr"]});

/* -------------------------------------------- */

/**
 * Schools to which a power can belong.
 * @enum {string}
 */
SW5E.powerSchools = {
  abj: "SW5E.SchoolAbj",
  con: "SW5E.SchoolCon",
  div: "SW5E.SchoolDiv",
  enc: "SW5E.SchoolEnc",
  evo: "SW5E.SchoolEvo",
  ill: "SW5E.SchoolIll",
  nec: "SW5E.SchoolNec",
  trs: "SW5E.SchoolTrs"
};
preLocalize("powerSchools", { sort: true });

/* -------------------------------------------- */

/**
 * Power scroll item ID within the `SW5E.sourcePacks` compendium for each level.
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
 * A subset of weapon properties that determine the physical characteristics of the weapon.
 * These properties are used for determining physical resistance bypasses.
 * @enum {string}
 */
SW5E.physicalWeaponProperties = {
  ada: "SW5E.WeaponPropertiesAda",
  mgc: "SW5E.WeaponPropertiesMgc",
  sil: "SW5E.WeaponPropertiesSil"
};
preLocalize("physicalWeaponProperties", { sort: true });

/* -------------------------------------------- */

/**
 * The set of weapon property flags which can exist on a weapon.
 * @enum {string}
 */
SW5E.weaponProperties = {
  ...SW5E.physicalWeaponProperties,
  amm: "SW5E.WeaponPropertiesAmm",
  fin: "SW5E.WeaponPropertiesFin",
  fir: "SW5E.WeaponPropertiesFir",
  foc: "SW5E.WeaponPropertiesFoc",
  hvy: "SW5E.WeaponPropertiesHvy",
  lgt: "SW5E.WeaponPropertiesLgt",
  lod: "SW5E.WeaponPropertiesLod",
  rch: "SW5E.WeaponPropertiesRch",
  rel: "SW5E.WeaponPropertiesRel",
  ret: "SW5E.WeaponPropertiesRet",
  spc: "SW5E.WeaponPropertiesSpc",
  thr: "SW5E.WeaponPropertiesThr",
  two: "SW5E.WeaponPropertiesTwo",
  ver: "SW5E.WeaponPropertiesVer"
};
preLocalize("weaponProperties", { sort: true });

/* -------------------------------------------- */

/**
 * Compendium packs used for localized items.
 * @enum {string}
 */
SW5E.sourcePacks = {
  ITEMS: "sw5e.items"
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
  "item.quantity", "item.weight", "item.duration.value", "currency", "details.xp.value", "abilities.*.value",
  "attributes.senses", "attributes.movement", "attributes.ac.flat", "item.armor.value", "item.target", "item.range",
  "item.save.dc"
];

/* -------------------------------------------- */

/**
 * Conditions that can affect an actor.
 * @enum {string}
 */
SW5E.conditionTypes = {
  blinded: "SW5E.ConBlinded",
  charmed: "SW5E.ConCharmed",
  deafened: "SW5E.ConDeafened",
  diseased: "SW5E.ConDiseased",
  exhaustion: "SW5E.ConExhaustion",
  frightened: "SW5E.ConFrightened",
  grappled: "SW5E.ConGrappled",
  incapacitated: "SW5E.ConIncapacitated",
  invisible: "SW5E.ConInvisible",
  paralyzed: "SW5E.ConParalyzed",
  petrified: "SW5E.ConPetrified",
  poisoned: "SW5E.ConPoisoned",
  prone: "SW5E.ConProne",
  restrained: "SW5E.ConRestrained",
  stunned: "SW5E.ConStunned",
  unconscious: "SW5E.ConUnconscious"
};
preLocalize("conditionTypes", { sort: true });

/**
 * Languages a character can learn.
 * @enum {string}
 */
SW5E.languages = {
  common: "SW5E.LanguagesCommon",
  aarakocra: "SW5E.LanguagesAarakocra",
  abyssal: "SW5E.LanguagesAbyssal",
  aquan: "SW5E.LanguagesAquan",
  auran: "SW5E.LanguagesAuran",
  celestial: "SW5E.LanguagesCelestial",
  deep: "SW5E.LanguagesDeepSpeech",
  draconic: "SW5E.LanguagesDraconic",
  druidic: "SW5E.LanguagesDruidic",
  dwarvish: "SW5E.LanguagesDwarvish",
  elvish: "SW5E.LanguagesElvish",
  giant: "SW5E.LanguagesGiant",
  gith: "SW5E.LanguagesGith",
  gnomish: "SW5E.LanguagesGnomish",
  goblin: "SW5E.LanguagesGoblin",
  gnoll: "SW5E.LanguagesGnoll",
  halfling: "SW5E.LanguagesHalfling",
  ignan: "SW5E.LanguagesIgnan",
  infernal: "SW5E.LanguagesInfernal",
  orc: "SW5E.LanguagesOrc",
  primordial: "SW5E.LanguagesPrimordial",
  sylvan: "SW5E.LanguagesSylvan",
  terran: "SW5E.LanguagesTerran",
  cant: "SW5E.LanguagesThievesCant",
  undercommon: "SW5E.LanguagesUndercommon"
};
preLocalize("languages", { sort: true });

/**
 * Maximum allowed character level.
 * @type {number}
 */
SW5E.maxLevel = 20;

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
 * @property {string} label               Localization key for the trait name.
 * @property {string} [actorKeyPath]      If the trait doesn't directly map to an entry as `traits.[key]`, where is
 *                                        this trait's data stored on the actor?
 * @property {string} [configKey]         If the list of trait options doesn't match the name of the trait, where can
 *                                        the options be found within `CONFIG.SW5E`?
 * @property {string} [labelKey]          If config is an enum of objects, where can the label be found?
 * @property {object} [subtypes]          Configuration for traits that take some sort of base item.
 * @property {string} [subtypes.keyPath]  Path to subtype value on base items, should match a category key.
 * @property {string[]} [subtypes.ids]    Key for base item ID objects within `CONFIG.SW5E`.
 * @property {object} [children]          Mapping of category key to an object defining its children.
 * @property {boolean} [sortCategories]   Whether top-level categories should be sorted.
 */

/**
 * Configurable traits on actors.
 * @enum {TraitConfiguration}
 */
SW5E.traits = {
  saves: {
    label: "SW5E.ClassSaves",
    configKey: "abilities",
    labelKey: "label"
  },
  skills: {
    label: "SW5E.TraitSkillProf",
    labelKey: "label"
  },
  languages: {
    label: "SW5E.Languages"
  },
  di: {
    label: "SW5E.DamImm",
    configKey: "damageTypes"
  },
  dr: {
    label: "SW5E.DamRes",
    configKey: "damageTypes"
  },
  dv: {
    label: "SW5E.DamVuln",
    configKey: "damageTypes"
  },
  ci: {
    label: "SW5E.ConImm",
    configKey: "conditionTypes"
  },
  weapon: {
    label: "SW5E.TraitWeaponProf",
    actorKeyPath: "traits.weaponProf",
    configKey: "weaponProficiencies",
    subtypes: { keyPath: "weaponType", ids: ["weaponIds"] }
  },
  armor: {
    label: "SW5E.TraitArmorProf",
    actorKeyPath: "traits.armorProf",
    configKey: "armorProficiencies",
    subtypes: { keyPath: "armor.type", ids: ["armorIds", "shieldIds"] }
  },
  tool: {
    label: "SW5E.TraitToolProf",
    actorKeyPath: "traits.toolProf",
    configKey: "toolProficiencies",
    subtypes: { keyPath: "toolType", ids: ["toolIds"] },
    children: { vehicle: "vehicleTypes" },
    sortCategories: true
  }
};
preLocalize("traits", { key: "label" });

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
 * Advancement types that can be added to items.
 * @enum {*}
 */
SW5E.advancementTypes = {
  HitPoints: advancement.HitPointsAdvancement,
  ItemChoice: advancement.ItemChoiceAdvancement,
  ItemGrant: advancement.ItemGrantAdvancement,
  ScaleValue: advancement.ScaleValueAdvancement
};

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

  Object.values(SW5E[key]).forEach(o => o.toString = toString);
}

/* -------------------------------------------- */

export default SW5E;
