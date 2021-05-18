import {ClassFeatures} from "./classFeatures.js"

// Namespace Configuration Values
export const SW5E = {};

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
 * The set of Ability Scores used within the system
 * @type {Object}
 */
SW5E.abilities = {
  "str": "SW5E.AbilityStr",
  "dex": "SW5E.AbilityDex",
  "con": "SW5E.AbilityCon",
  "int": "SW5E.AbilityInt",
  "wis": "SW5E.AbilityWis",
  "cha": "SW5E.AbilityCha"
};

SW5E.abilityAbbreviations = {
  "str": "SW5E.AbilityStrAbbr",
  "dex": "SW5E.AbilityDexAbbr",
  "con": "SW5E.AbilityConAbbr",
  "int": "SW5E.AbilityIntAbbr",
  "wis": "SW5E.AbilityWisAbbr",
  "cha": "SW5E.AbilityChaAbbr"
};

/* -------------------------------------------- */

/**
 * Character alignment options
 * @type {Object}
 */
SW5E.alignments = {
  'lg': "SW5E.AlignmentLG",
  'ng': "SW5E.AlignmentNG",
  'cg': "SW5E.AlignmentCG",
  'ln': "SW5E.AlignmentLN",
  'tn': "SW5E.AlignmentTN",
  'cn': "SW5E.AlignmentCN",
  'le': "SW5E.AlignmentLE",
  'ne': "SW5E.AlignmentNE",
  'ce': "SW5E.AlignmentCE"
};

/* -------------------------------------------- */

/**
 * An enumeration of item attunement types
 * @enum {number}
 */
SW5E.attunementTypes = {
  NONE: 0,
  REQUIRED: 1,
  ATTUNED: 2,
};

/**
 * An enumeration of item attunement states
 * @type {{"0": string, "1": string, "2": string}}
 */
SW5E.attunements = {
  0: "SW5E.AttunementNone",
  1: "SW5E.AttunementRequired",
  2: "SW5E.AttunementAttuned"
};

/* -------------------------------------------- */


SW5E.weaponProficiencies = {
  "sim": "SW5E.WeaponSimpleProficiency",
  "mar": "SW5E.WeaponMartialProficiency"
};

/**
 * A map of weapon item proficiency to actor item proficiency
 * Used when a new player owned item is created
 * @type {Object}
 */
SW5E.weaponProficienciesMap = {
  "natural": true,
  "simpleM": "sim",
  "simpleR": "sim",
  "martialM": "mar",
  "martialR": "mar"
}

/**
 * The basic weapon types in 5e. This enables specific weapon proficiencies or
 * starting equipment provided by classes and backgrounds.
 *
 * @enum {string}
 */
SW5E.weaponIds = {
    "battleaxe": "I0WocDSuNpGJayPb",
    "blowgun": "wNWK6yJMHG9ANqQV",
    "club": "nfIRTECQIG81CvM4",
    "dagger": "0E565kQUBmndJ1a2",
    "dart": "3rCO8MTIdPGSW6IJ",
    "flail": "UrH3sMdnUDckIHJ6",
    "glaive": "rOG1OM2ihgPjOvFW",
    "greataxe": "1Lxk6kmoRhG8qQ0u",
    "greatclub": "QRCsxkCwWNwswL9o",
    "greatsword": "xMkP8BmFzElcsMaR",
    "halberd": "DMejWAc8r8YvDPP1",
    "handaxe": "eO7Fbv5WBk5zvGOc",
    "handcrossbow": "qaSro7kFhxD6INbZ",
    "heavycrossbow": "RmP0mYRn2J7K26rX",
    "javelin": "DWLMnODrnHn8IbAG",
    "lance": "RnuxdHUAIgxccVwj",
    "lightcrossbow": "ddWvQRLmnnIS0eLF",
    "lighthammer": "XVK6TOL4sGItssAE",
    "longbow": "3cymOVja8jXbzrdT",
    "longsword": "10ZP2Bu3vnCuYMIB",
    "mace": "Ajyq6nGwF7FtLhDQ",
    "maul": "DizirD7eqjh8n95A",
    "morningstar": "dX8AxCh9o0A9CkT3",
    "net": "aEiM49V8vWpWw7rU",
    "pike": "tC0kcqZT9HHAO0PD",
    "quarterstaff": "g2dWN7PQiMRYWzyk",
    "rapier": "Tobce1hexTnDk4sV",
    "scimitar": "fbC0Mg1a73wdFbqO",
    "shortsword": "osLzOwQdPtrK3rQH",
    "sickle": "i4NeNZ30ycwPDHMx",
    "spear": "OG4nBBydvmfWYXIk",
    "shortbow": "GJv6WkD7D2J6rP6M",
    "sling": "3gynWO9sN4OLGMWD",
    "trident": "F65ANO66ckP8FDMa",
    "warpick": "2YdfjN1PIIrSHZii",
    "warhammer":  "F0Df164Xv1gWcYt0",
    "whip": "QKTyxoO0YDnAsbYe"
};

/* -------------------------------------------- */



SW5E.toolProficiencies = {
  "art": "SW5E.ToolArtisans",
  "disg": "SW5E.ToolDisguiseKit",
  "forg": "SW5E.ToolForgeryKit",
  "game": "SW5E.ToolGamingSet",
  "herb": "SW5E.ToolHerbalismKit",
  "music": "SW5E.ToolMusicalInstrument",
  "navg": "SW5E.ToolNavigators",
  "pois": "SW5E.ToolPoisonersKit",
  "thief": "SW5E.ToolThieves",
  "vehicle": "SW5E.ToolVehicle"
};

/**
 * The basic tool types in 5e. This enables specific tool proficiencies or
 * starting equipment provided by classes and backgrounds.
 *
 * @enum {string}
 */
SW5E.toolIds = {
  "alchemist": "SztwZhbhZeCqyAes",
  "bagpipes": "yxHi57T5mmVt0oDr",
  "brewer": "Y9S75go1hLMXUD48",
  "calligrapher": "jhjo20QoiD5exf09",
  "card": "YwlHI3BVJapz4a3E",
  "carpenter": "8NS6MSOdXtUqD7Ib",
  "cartographer": "fC0lFK8P4RuhpfaU",
  "cobbler": "hM84pZnpCqKfi8XH",
  "cook": "Gflnp29aEv5Lc1ZM",
  "dice": "iBuTM09KD9IoM5L8",
  "disg": "IBhDAr7WkhWPYLVn",
  "drum": "69Dpr25pf4BjkHKb",
  "dulcimer": "NtdDkjmpdIMiX7I2",
  "flute": "eJOrPcAz9EcquyRQ",
  "forg": "cG3m4YlHfbQlLEOx",
  "glassblower": "rTbVrNcwApnuTz5E",
  "herb": "i89okN7GFTWHsvPy",
  "horn": "aa9KuBy4dst7WIW9",
  "jeweler": "YfBwELTgPFHmQdHh",
  "leatherworker": "PUMfwyVUbtyxgYbD",
  "lute": "qBydtUUIkv520DT7",
  "lyre": "EwG1EtmbgR3bM68U",
  "mason": "skUih6tBvcBbORzA",
  "navg": "YHCmjsiXxZ9UdUhU",
  "painter": "ccm5xlWhx74d6lsK",
  "panflute": "G5m5gYIx9VAUWC3J",
  "pois": "il2GNi8C0DvGLL9P",
  "potter": "hJS8yEVkqgJjwfWa",
  "shawm": "G3cqbejJpfB91VhP",
  "smith": "KndVe2insuctjIaj",
  "thief": "woWZ1sO5IUVGzo58",
  "tinker": "0d08g1i5WXnNrCNA",
  "viol": "baoe3U5BfMMMxhCU",
  "weaver": "ap9prThUB2y9lDyj",
  "woodcarver": "xKErqkLo4ASYr5EP",
};


/* -------------------------------------------- */

/**
 * This Object defines the various lengths of time which can occur
 * @type {Object}
 */
SW5E.timePeriods = {
  "inst": "SW5E.TimeInst",
  "turn": "SW5E.TimeTurn",
  "round": "SW5E.TimeRound",
  "minute": "SW5E.TimeMinute",
  "hour": "SW5E.TimeHour",
  "day": "SW5E.TimeDay",
  "month": "SW5E.TimeMonth",
  "year": "SW5E.TimeYear",
  "perm": "SW5E.TimePerm",
  "spec": "SW5E.Special"
};


/* -------------------------------------------- */

/**
 * This describes the ways that an ability can be activated
 * @type {Object}
 */
SW5E.abilityActivationTypes = {
  "none": "SW5E.None",
  "action": "SW5E.Action",
  "bonus": "SW5E.BonusAction",
  "reaction": "SW5E.Reaction",
  "minute": SW5E.timePeriods.minute,
  "hour": SW5E.timePeriods.hour,
  "day": SW5E.timePeriods.day,
  "special": SW5E.timePeriods.spec,
  "legendary": "SW5E.LegendaryActionLabel",
  "lair": "SW5E.LairActionLabel",
  "crew": "SW5E.VehicleCrewAction"
};

/* -------------------------------------------- */


SW5E.abilityConsumptionTypes = {
  "ammo": "SW5E.ConsumeAmmunition",
  "attribute": "SW5E.ConsumeAttribute",
  "material": "SW5E.ConsumeMaterial",
  "charges": "SW5E.ConsumeCharges"
};


/* -------------------------------------------- */

// Creature Sizes
SW5E.actorSizes = {
  "tiny": "SW5E.SizeTiny",
  "sm": "SW5E.SizeSmall",
  "med": "SW5E.SizeMedium",
  "lg": "SW5E.SizeLarge",
  "huge": "SW5E.SizeHuge",
  "grg": "SW5E.SizeGargantuan"
};

SW5E.tokenSizes = {
  "tiny": 1,
  "sm": 1,
  "med": 1,
  "lg": 2,
  "huge": 3,
  "grg": 4
};

/**
 * Colors used to visualize temporary and temporary maximum HP in token health bars
 * @enum {number}
 */
SW5E.tokenHPColors = {
  temp: 0x66CCFF,
  tempmax: 0x440066,
  negmax: 0x550000
}

/* -------------------------------------------- */

/**
 * Creature types
 * @type {Object}
 */
SW5E.creatureTypes = {
  "aberration": "SW5E.CreatureAberration",
  "beast": "SW5E.CreatureBeast",
  "celestial": "SW5E.CreatureCelestial",
  "construct": "SW5E.CreatureConstruct",
  "dragon": "SW5E.CreatureDragon",
  "elemental": "SW5E.CreatureElemental",
  "fey": "SW5E.CreatureFey",
  "fiend": "SW5E.CreatureFiend",
  "giant": "SW5E.CreatureGiant",
  "humanoid": "SW5E.CreatureHumanoid",
  "monstrosity": "SW5E.CreatureMonstrosity",
  "ooze": "SW5E.CreatureOoze",
  "plant": "SW5E.CreaturePlant",
  "undead": "SW5E.CreatureUndead"
};


/* -------------------------------------------- */

/**
 * Classification types for item action types
 * @type {Object}
 */
SW5E.itemActionTypes = {
  "mwak": "SW5E.ActionMWAK",
  "rwak": "SW5E.ActionRWAK",
  "mpak": "SW5E.ActionMPAK",
  "rpak": "SW5E.ActionRPAK",
  "save": "SW5E.ActionSave",
  "heal": "SW5E.ActionHeal",
  "abil": "SW5E.ActionAbil",
  "util": "SW5E.ActionUtil",
  "other": "SW5E.ActionOther"
};

/* -------------------------------------------- */

SW5E.itemCapacityTypes = {
  "items": "SW5E.ItemContainerCapacityItems",
  "weight": "SW5E.ItemContainerCapacityWeight"
};

/* -------------------------------------------- */

/**
 * Enumerate the lengths of time over which an item can have limited use ability
 * @type {Object}
 */
SW5E.limitedUsePeriods = {
  "sr": "SW5E.ShortRest",
  "lr": "SW5E.LongRest",
  "day": "SW5E.Day",
  "charges": "SW5E.Charges"
};


/* -------------------------------------------- */

/**
 * The set of equipment types for armor, clothing, and other objects which can be worn by the character
 * @type {Object}
 */
SW5E.equipmentTypes = {
  "light": "SW5E.EquipmentLight",
  "medium": "SW5E.EquipmentMedium",
  "heavy": "SW5E.EquipmentHeavy",
  "bonus": "SW5E.EquipmentBonus",
  "natural": "SW5E.EquipmentNatural",
  "shield": "SW5E.EquipmentShield",
  "clothing": "SW5E.EquipmentClothing",
  "trinket": "SW5E.EquipmentTrinket",
  "vehicle": "SW5E.EquipmentVehicle"
};


/* -------------------------------------------- */

/**
 * The set of Armor Proficiencies which a character may have
 * @type {Object}
 */
SW5E.armorProficiencies = {
  "lgt": SW5E.equipmentTypes.light,
  "med": SW5E.equipmentTypes.medium,
  "hvy": SW5E.equipmentTypes.heavy,
  "shl": "SW5E.EquipmentShieldProficiency"
};

/**
 * A map of armor item proficiency to actor item proficiency
 * Used when a new player owned item is created
 * @type {Object}
 */
SW5E.armorProficienciesMap = {
  "natural": true,
  "clothing": true,
  "light": "lgt",
  "medium": "med",
  "heavy": "hvy",
  "shield": "shl"
}


/* -------------------------------------------- */

/**
 * Enumerate the valid consumable types which are recognized by the system
 * @type {Object}
 */
SW5E.consumableTypes = {
  "ammo": "SW5E.ConsumableAmmunition",
  "potion": "SW5E.ConsumablePotion",
  "poison": "SW5E.ConsumablePoison",
  "food": "SW5E.ConsumableFood",
  "scroll": "SW5E.ConsumableScroll",
  "wand": "SW5E.ConsumableWand",
  "rod": "SW5E.ConsumableRod",
  "trinket": "SW5E.ConsumableTrinket"
};

/* -------------------------------------------- */

/**
 * The valid currency denominations supported by the 5e system
 * @type {Object}
 */
SW5E.currencies = {
  "pp": "SW5E.CurrencyPP",
  "gp": "SW5E.CurrencyGP",
  "ep": "SW5E.CurrencyEP",
  "sp": "SW5E.CurrencySP",
  "cp": "SW5E.CurrencyCP",
};


/**
 * Define the upwards-conversion rules for registered currency types
 * @type {{string, object}}
 */
SW5E.currencyConversion = {
  cp: {into: "sp", each: 10},
  sp: {into: "ep", each: 5 },
  ep: {into: "gp", each: 2 },
  gp: {into: "pp", each: 10}
};

/* -------------------------------------------- */


// Damage Types
SW5E.damageTypes = {
  "acid": "SW5E.DamageAcid",
  "bludgeoning": "SW5E.DamageBludgeoning",
  "cold": "SW5E.DamageCold",
  "fire": "SW5E.DamageFire",
  "force": "SW5E.DamageForce",
  "lightning": "SW5E.DamageLightning",
  "necrotic": "SW5E.DamageNecrotic",
  "piercing": "SW5E.DamagePiercing",
  "poison": "SW5E.DamagePoison",
  "psychic": "SW5E.DamagePsychic",
  "radiant": "SW5E.DamageRadiant",
  "slashing": "SW5E.DamageSlashing",
  "thunder": "SW5E.DamageThunder"
};

// Damage Resistance Types
SW5E.damageResistanceTypes = mergeObject(foundry.utils.deepClone(SW5E.damageTypes), {
  "physical": "SW5E.DamagePhysical"
});


/* -------------------------------------------- */

/**
 * The valid units of measure for movement distances in the game system.
 * By default this uses the imperial units of feet and miles.
 * @type {Object<string,string>}
 */
SW5E.movementTypes = {
  "burrow": "SW5E.MovementBurrow",
  "climb": "SW5E.MovementClimb",
  "fly": "SW5E.MovementFly",
  "swim": "SW5E.MovementSwim",
  "walk": "SW5E.MovementWalk",
};

/**
 * The valid units of measure for movement distances in the game system.
 * By default this uses the imperial units of feet and miles.
 * @type {Object<string,string>}
 */
SW5E.movementUnits = {
  "ft": "SW5E.DistFt",
  "mi": "SW5E.DistMi"
};

/**
 * The valid units of measure for the range of an action or effect.
 * This object automatically includes the movement units from SW5E.movementUnits
 * @type {Object<string,string>}
 */
SW5E.distanceUnits = {
  "none": "SW5E.None",
  "self": "SW5E.DistSelf",
  "touch": "SW5E.DistTouch",
  "spec": "SW5E.Special",
  "any": "SW5E.DistAny"
};
for ( let [k, v] of Object.entries(SW5E.movementUnits) ) {
  SW5E.distanceUnits[k] = v;
}

/* -------------------------------------------- */


/**
 * Configure aspects of encumbrance calculation so that it could be configured by modules
 * @type {Object}
 */
SW5E.encumbrance = {
  currencyPerWeight: 50,
  strMultiplier: 15,
  vehicleWeightMultiplier: 2000 // 2000 lbs in a ton
};

/* -------------------------------------------- */

/**
 * This Object defines the types of single or area targets which can be applied
 * @type {Object}
 */
SW5E.targetTypes = {
  "none": "SW5E.None",
  "self": "SW5E.TargetSelf",
  "creature": "SW5E.TargetCreature",
  "ally": "SW5E.TargetAlly",
  "enemy": "SW5E.TargetEnemy",
  "object": "SW5E.TargetObject",
  "space": "SW5E.TargetSpace",
  "radius": "SW5E.TargetRadius",
  "sphere": "SW5E.TargetSphere",
  "cylinder": "SW5E.TargetCylinder",
  "cone": "SW5E.TargetCone",
  "square": "SW5E.TargetSquare",
  "cube": "SW5E.TargetCube",
  "line": "SW5E.TargetLine",
  "wall": "SW5E.TargetWall"
};


/* -------------------------------------------- */


/**
 * Map the subset of target types which produce a template area of effect
 * The keys are SW5E target types and the values are MeasuredTemplate shape types
 * @type {Object}
 */
SW5E.areaTargetTypes = {
  cone: "cone",
  cube: "rect",
  cylinder: "circle",
  line: "ray",
  radius: "circle",
  sphere: "circle",
  square: "rect",
  wall: "ray"
};


/* -------------------------------------------- */

// Healing Types
SW5E.healingTypes = {
  "healing": "SW5E.Healing",
  "temphp": "SW5E.HealingTemp"
};


/* -------------------------------------------- */


/**
 * Enumerate the denominations of hit dice which can apply to classes
 * @type {string[]}
 */
SW5E.hitDieTypes = ["d6", "d8", "d10", "d12"];


/* -------------------------------------------- */

/**
 * The set of possible sensory perception types which an Actor may have
 * @enum {string}
 */
SW5E.senses = {
  "blindsight": "SW5E.SenseBlindsight",
  "darkvision": "SW5E.SenseDarkvision",
  "tremorsense": "SW5E.SenseTremorsense",
  "truesight": "SW5E.SenseTruesight"
};

/* -------------------------------------------- */

/**
 * The set of skill which can be trained
 * @type {Object}
 */
SW5E.skills = {
  "acr": "SW5E.SkillAcr",
  "ani": "SW5E.SkillAni",
  "arc": "SW5E.SkillArc",
  "ath": "SW5E.SkillAth",
  "dec": "SW5E.SkillDec",
  "his": "SW5E.SkillHis",
  "ins": "SW5E.SkillIns",
  "itm": "SW5E.SkillItm",
  "inv": "SW5E.SkillInv",
  "med": "SW5E.SkillMed",
  "nat": "SW5E.SkillNat",
  "prc": "SW5E.SkillPrc",
  "prf": "SW5E.SkillPrf",
  "per": "SW5E.SkillPer",
  "rel": "SW5E.SkillRel",
  "slt": "SW5E.SkillSlt",
  "ste": "SW5E.SkillSte",
  "sur": "SW5E.SkillSur"
};


/* -------------------------------------------- */

SW5E.powerPreparationModes = {
  "prepared": "SW5E.PowerPrepPrepared",
  "pact": "SW5E.PactMagic",
  "always": "SW5E.PowerPrepAlways",
  "atwill": "SW5E.PowerPrepAtWill",
  "innate": "SW5E.PowerPrepInnate"
};

SW5E.powerUpcastModes = ["always", "pact", "prepared"];

SW5E.powerProgression = {
  "none": "SW5E.PowerNone",
  "full": "SW5E.PowerProgFull",
  "half": "SW5E.PowerProgHalf",
  "third": "SW5E.PowerProgThird",
  "pact": "SW5E.PowerProgPact",
  "artificer": "SW5E.PowerProgArt"
};

/* -------------------------------------------- */

/**
 * The available choices for how power damage scaling may be computed
 * @type {Object}
 */
SW5E.powerScalingModes = {
  "none": "SW5E.PowerNone",
  "cantrip": "SW5E.PowerCantrip",
  "level": "SW5E.PowerLevel"
};

/* -------------------------------------------- */


/**
 * Define the set of types which a weapon item can take
 * @type {Object}
 */
SW5E.weaponTypes = {
  "simpleM": "SW5E.WeaponSimpleM",
  "simpleR": "SW5E.WeaponSimpleR",
  "martialM": "SW5E.WeaponMartialM",
  "martialR": "SW5E.WeaponMartialR",
  "natural": "SW5E.WeaponNatural",
  "improv": "SW5E.WeaponImprov",
  "siege": "SW5E.WeaponSiege"
};


/* -------------------------------------------- */

/**
 * Define the set of weapon property flags which can exist on a weapon
 * @type {Object}
 */
SW5E.weaponProperties = {
  "ada": "SW5E.WeaponPropertiesAda",
  "amm": "SW5E.WeaponPropertiesAmm",
  "fin": "SW5E.WeaponPropertiesFin",
  "fir": "SW5E.WeaponPropertiesFir",
  "foc": "SW5E.WeaponPropertiesFoc",
  "hvy": "SW5E.WeaponPropertiesHvy",
  "lgt": "SW5E.WeaponPropertiesLgt",
  "lod": "SW5E.WeaponPropertiesLod",
  "mgc": "SW5E.WeaponPropertiesMgc",
  "rch": "SW5E.WeaponPropertiesRch",
  "rel": "SW5E.WeaponPropertiesRel",
  "ret": "SW5E.WeaponPropertiesRet",
  "sil": "SW5E.WeaponPropertiesSil",
  "spc": "SW5E.WeaponPropertiesSpc",
  "thr": "SW5E.WeaponPropertiesThr",
  "two": "SW5E.WeaponPropertiesTwo",
  "ver": "SW5E.WeaponPropertiesVer"
};


// Power Components
SW5E.powerComponents = {
  "V": "SW5E.ComponentVerbal",
  "S": "SW5E.ComponentSomatic",
  "M": "SW5E.ComponentMaterial"
};

// Power Schools
SW5E.powerSchools = {
  "abj": "SW5E.SchoolAbj",
  "con": "SW5E.SchoolCon",
  "div": "SW5E.SchoolDiv",
  "enc": "SW5E.SchoolEnc",
  "evo": "SW5E.SchoolEvo",
  "ill": "SW5E.SchoolIll",
  "nec": "SW5E.SchoolNec",
  "trs": "SW5E.SchoolTrs"
};

// Power Levels
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

// Power Scroll Compendium UUIDs
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

/**
 * Compendium packs used for localized items.
 * @enum {string}
 */
SW5E.sourcePacks = {
  ITEMS: "sw5e.items"
}

/**
 * Define the standard slot progression by character level.
 * The entries of this array represent the power slot progression for a full power-caster.
 * @type {Array[]}
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

// Polymorph options.
SW5E.polymorphSettings = {
  keepPhysical: 'SW5E.PolymorphKeepPhysical',
  keepMental: 'SW5E.PolymorphKeepMental',
  keepSaves: 'SW5E.PolymorphKeepSaves',
  keepSkills: 'SW5E.PolymorphKeepSkills',
  mergeSaves: 'SW5E.PolymorphMergeSaves',
  mergeSkills: 'SW5E.PolymorphMergeSkills',
  keepClass: 'SW5E.PolymorphKeepClass',
  keepFeats: 'SW5E.PolymorphKeepFeats',
  keepPowers: 'SW5E.PolymorphKeepPowers',
  keepItems: 'SW5E.PolymorphKeepItems',
  keepBio: 'SW5E.PolymorphKeepBio',
  keepVision: 'SW5E.PolymorphKeepVision'
};

/* -------------------------------------------- */

/**
 * Skill, ability, and tool proficiency levels
 * Each level provides a proficiency multiplier
 * @type {Object}
 */
SW5E.proficiencyLevels = {
  0: "SW5E.NotProficient",
  1: "SW5E.Proficient",
  0.5: "SW5E.HalfProficient",
  2: "SW5E.Expertise"
};

/* -------------------------------------------- */

/**
 * The amount of cover provided by an object.
 * In cases where multiple pieces of cover are
 * in play, we take the highest value.
 */
SW5E.cover = {
  0: 'SW5E.None',
  .5: 'SW5E.CoverHalf',
  .75: 'SW5E.CoverThreeQuarters',
  1: 'SW5E.CoverTotal'
};

/* -------------------------------------------- */


// Condition Types
SW5E.conditionTypes = {
  "blinded": "SW5E.ConBlinded",
  "charmed": "SW5E.ConCharmed",
  "deafened": "SW5E.ConDeafened",
  "diseased": "SW5E.ConDiseased",
  "exhaustion": "SW5E.ConExhaustion",
  "frightened": "SW5E.ConFrightened",
  "grappled": "SW5E.ConGrappled",
  "incapacitated": "SW5E.ConIncapacitated",
  "invisible": "SW5E.ConInvisible",
  "paralyzed": "SW5E.ConParalyzed",
  "petrified": "SW5E.ConPetrified",
  "poisoned": "SW5E.ConPoisoned",
  "prone": "SW5E.ConProne",
  "restrained": "SW5E.ConRestrained",
  "stunned": "SW5E.ConStunned",
  "unconscious": "SW5E.ConUnconscious"
};

// Languages
SW5E.languages = {
  "common": "SW5E.LanguagesCommon",
  "aarakocra": "SW5E.LanguagesAarakocra",
  "abyssal": "SW5E.LanguagesAbyssal",
  "aquan": "SW5E.LanguagesAquan",
  "auran": "SW5E.LanguagesAuran",
  "celestial": "SW5E.LanguagesCelestial",
  "deep": "SW5E.LanguagesDeepSpeech",
  "draconic": "SW5E.LanguagesDraconic",
  "druidic": "SW5E.LanguagesDruidic",
  "dwarvish": "SW5E.LanguagesDwarvish",
  "elvish": "SW5E.LanguagesElvish",
  "giant": "SW5E.LanguagesGiant",
  "gith": "SW5E.LanguagesGith",
  "gnomish": "SW5E.LanguagesGnomish",
  "goblin": "SW5E.LanguagesGoblin",
  "gnoll": "SW5E.LanguagesGnoll",
  "halfling": "SW5E.LanguagesHalfling",
  "ignan": "SW5E.LanguagesIgnan",
  "infernal": "SW5E.LanguagesInfernal",
  "orc": "SW5E.LanguagesOrc",
  "primordial": "SW5E.LanguagesPrimordial",
  "sylvan": "SW5E.LanguagesSylvan",
  "terran": "SW5E.LanguagesTerran",
  "cant": "SW5E.LanguagesThievesCant",
  "undercommon": "SW5E.LanguagesUndercommon"
};

// Character Level XP Requirements
SW5E.CHARACTER_EXP_LEVELS =  [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000,
  120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]
;

// Challenge Rating XP Levels
SW5E.CR_EXP_LEVELS = [
  10, 200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900, 7200, 8400, 10000, 11500, 13000, 15000, 18000,
  20000, 22000, 25000, 33000, 41000, 50000, 62000, 75000, 90000, 105000, 120000, 135000, 155000
];

// Character Features Per Class And Level
SW5E.classFeatures = ClassFeatures;

// Configure Optional Character Flags
SW5E.characterFlags = {
  "diamondSoul": {
    name: "SW5E.FlagsDiamondSoul",
    hint: "SW5E.FlagsDiamondSoulHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  "elvenAccuracy": {
    name: "SW5E.FlagsElvenAccuracy",
    hint: "SW5E.FlagsElvenAccuracyHint",
    section: "SW5E.RacialTraits",
    type: Boolean
  },
  "halflingLucky": {
    name: "SW5E.FlagsHalflingLucky",
    hint: "SW5E.FlagsHalflingLuckyHint",
    section: "SW5E.RacialTraits",
    type: Boolean
  },
  "initiativeAdv": {
    name: "SW5E.FlagsInitiativeAdv",
    hint: "SW5E.FlagsInitiativeAdvHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  "initiativeAlert": {
    name: "SW5E.FlagsAlert",
    hint: "SW5E.FlagsAlertHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  "jackOfAllTrades": {
    name: "SW5E.FlagsJOAT",
    hint: "SW5E.FlagsJOATHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  "observantFeat": {
    name: "SW5E.FlagsObservant",
    hint: "SW5E.FlagsObservantHint",
    skills: ['prc','inv'],
    section: "SW5E.Feats",
    type: Boolean
  },
  "powerfulBuild": {
    name: "SW5E.FlagsPowerfulBuild",
    hint: "SW5E.FlagsPowerfulBuildHint",
    section: "SW5E.RacialTraits",
    type: Boolean
  },
  "reliableTalent": {
    name: "SW5E.FlagsReliableTalent",
    hint: "SW5E.FlagsReliableTalentHint",
    section: "SW5E.Feats",
    type: Boolean
  },
  "remarkableAthlete": {
    name: "SW5E.FlagsRemarkableAthlete",
    hint: "SW5E.FlagsRemarkableAthleteHint",
    abilities: ['str','dex','con'],
    section: "SW5E.Feats",
    type: Boolean
  },
  "weaponCriticalThreshold": {
    name: "SW5E.FlagsWeaponCritThreshold",
    hint: "SW5E.FlagsWeaponCritThresholdHint",
    section: "SW5E.Feats",
    type: Number,
    placeholder: 20
  },
  "powerCriticalThreshold": {
    name: "SW5E.FlagsPowerCritThreshold",
    hint: "SW5E.FlagsPowerCritThresholdHint",
    section: "SW5E.Feats",
    type: Number,
    placeholder: 20
  },
  "meleeCriticalDamageDice": {
    name: "SW5E.FlagsMeleeCriticalDice",
    hint: "SW5E.FlagsMeleeCriticalDiceHint",
    section: "SW5E.Feats",
    type: Number,
    placeholder: 0
  },
};

// Configure allowed status flags
SW5E.allowedActorFlags = ["isPolymorphed", "originalActor"].concat(Object.keys(SW5E.characterFlags));
