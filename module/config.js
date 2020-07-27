// Namespace D&D5e Configuration Values
export const SW5E = {};

// ASCII Artwork
SW5E.ASCII = `_______________________________
     _
    | |
 ___| |_ __ _ _ ____      ____ _ _ __ ___
/ __| __/ _\ | |__\ \ /\ / / _\ | |__/ __|
\__ \ || (_) | |   \ V  V / (_) | |  \__ \
|___/\__\__/_|_|    \_/\_/ \__/_|_|  |___/
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

/* -------------------------------------------- */

/**
 * Character alignment options
 * @type {Object}
 */
SW5E.alignments = {
  'll': "SW5E.AlignmentLL",
  'nl': "SW5E.AlignmentNL",
  'cl': "SW5E.AlignmentCL",
  'lb': "SW5E.AlignmentLB",
  'bn': "SW5E.AlignmentBN",
  'cb': "SW5E.AlignmentCB",
  'ld': "SW5E.AlignmentLD",
  'nd': "SW5E.AlignmentND",
  'cd': "SW5E.AlignmentCD"
};


SW5E.weaponProficiencies = {
  "sim": "SW5E.WeaponSimpleProficiency",
  "bla": "SW5E.WeaponBlasterProficiency"
};

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


/* -------------------------------------------- */

/**
 * This Object defines the various lengths of time which can occur in D&D5e
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
  "legendary": "SW5E.LegAct",
  "lair": "SW5E.LairAct"
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
 * The set of equipment types for armor, clothing, and other objects which can ber worn by the character
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
  "trinket": "SW5E.EquipmentTrinket"
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


/* -------------------------------------------- */

/**
 * Enumerate the valid consumable types which are recognized by the system
 * @type {Object}
 */
SW5E.consumableTypes = {
  "adrenal": "SW5E.ConsumableAdrenal",
  "poison": "SW5E.ConsumablePoison",
  "explosive": "SW5E.ConsumableExplosive",
  "food": "SW5E.ConsumableFood",
  "medpac": "SW5E.ConsumableMedpac",
  "technology": "SW5E.ConsumableTechnology",
  "ammunition": "SW5E.ConsumableAmmunition",
  "trinket": "SW5E.ConsumableTrinket"
};


/* -------------------------------------------- */

/**
 * The valid currency denominations supported by the 5e system
 * @type {Object}
 */
SW5E.currencies = {
  "CR": "SW5E.CurrencyCR",
  };

/* -------------------------------------------- */


// Damage Types
SW5E.damageTypes = {
  "acid": "SW5E.DamageAcid",
  "cold": "SW5E.DamageCold",
  "energy": "SW5E.DamageEnergy",
  "fire": "SW5E.DamageFire",
  "force": "SW5E.DamageForce",
  "ion": "SW5E.DamageIon",
  "kinetic": "SW5E.DamageKinetic",
  "lightning": "SW5E.DamageLightning",
  "necrotic": "SW5E.DamageNecrotic",
  "poison": "SW5E.DamagePoison",
  "psychic": "SW5E.DamagePsychic",
  "Sonic": "SW5E.DamageSonic"
};

/* -------------------------------------------- */

// armor Types
SW5E.armorpropertiesTypes = {
"Absorptive": "SW5E.ArmorProperAbsorptive",
"Agile": "SW5E.ArmorProperAgile",
"Anchor": "SW5E.ArmorProperAnchor",
"Avoidant": "SW5E.ArmorProperAvoidant",
"Barbed": "SW5E.ArmorProperBarbed",
"Charging": "SW5E.ArmorProperCharging",
"Concealing": "SW5E.ArmorProperConcealing",
"Cumbersome": "SW5E.ArmorProperCumbersome",
"Gauntleted": "SW5E.ArmorProperGauntleted",
"Imbalanced": "SW5E.ArmorProperImbalanced",
"Impermeable": "SW5E.ArmorProperImpermeable",
"Insulated": "SW5E.ArmorProperInsulated",
"Interlocking": "SW5E.ArmorProperInterlocking",
"Lambent": "SW5E.ArmorProperLambent",
"Lightweight": "SW5E.ArmorProperLightweight",
"Magnetic": "SW5E.ArmorProperMagnetic",
"Obscured": "SW5E.ArmorProperObscured",
"Powered": "SW5E.ArmorProperPowered",
"Reactive": "SW5E.ArmorProperReactive",
"Regulated": "SW5E.ArmorProperRegulated",
"Reinforced": "SW5E.ArmorProperReinforced",
"Responsive": "SW5E.ArmorProperResponsive",
"Rigid": "SW5E.ArmorProperRigid",
"Silent": "SW5E.ArmorProperSilent",
"Spiked": "SW5E.ArmorProperSpiked",
"Steadfast": "SW5E.ArmorProperSteadfast",
"Versatile": "SW5E.ArmorProperVersatile"
};

/* -------------------------------------------- */

SW5E.distanceUnits = {
  "none": "SW5E.None",
  "self": "SW5E.DistSelf",
  "touch": "SW5E.DistTouch",
  "ft": "SW5E.DistFt",
  "mi": "SW5E.DistMi",
  "spec": "SW5E.Special",
  "any": "SW5E.DistAny"
};

/* -------------------------------------------- */


/**
 * Configure aspects of encumbrance calculation so that it could be configured by modules
 * @type {Object}
 */
SW5E.encumbrance = {
  currencyPerWeight: 50,
  strMultiplier: 15
};

/* -------------------------------------------- */

/**
 * This Object defines the types of single or area targets which can be applied in D&D5e
 * @type {Object}
 */
SW5E.targetTypes = {
  "none": "SW5E.None",
  "self": "SW5E.TargetSelf",
  "creature": "SW5E.TargetCreature",
  "droid": "SW5E.TargetDroid",
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
  "wall": "SW5E.TargetWall",
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
 * Enumerate the denominations of hit dice which can apply to classes in the D&D5E system
 * @type {Array.<string>}
 */
SW5E.hitDieTypes = ["d6", "d8", "d10", "d12"];


/* -------------------------------------------- */

/**
 * Character senses options
 * @type {Object}
 */
SW5E.senses = {
  "bs": "SW5E.SenseBS",
  "dv": "SW5E.SenseDV",
  "ts": "SW5E.SenseTS",
  "tr": "SW5E.SenseTR"
};


/* -------------------------------------------- */

/**
 * The set of skill which can be trained in D&D5e
 * @type {Object}
 */
SW5E.skills = {
  "acr": "SW5E.SkillAcr",
  "ani": "SW5E.SkillAni",
  "ath": "SW5E.SkillAth",
  "dec": "SW5E.SkillDec",
  "ins": "SW5E.SkillIns",
  "itm": "SW5E.SkillItm",
  "inv": "SW5E.SkillInv",
  "lor": "SW5E.SkillLor",
  "med": "SW5E.SkillMed",
  "nat": "SW5E.SkillNat",
  "prc": "SW5E.SkillPrc",
  "prf": "SW5E.SkillPrf",
  "per": "SW5E.SkillPer",
  "pil": "SW5E.SkillPil",
  "slt": "SW5E.SkillSlt",
  "ste": "SW5E.SkillSte",
  "sur": "SW5E.SkillSur",
  "tec": "SW5E.SkillTec",
};


/* -------------------------------------------- */

SW5E.powerPreparationModes = {
  "always": "SW5E.PowerPrepAlways",
  "atwill": "SW5E.PowerPrepAtWill",
  "innate": "SW5E.PowerPrepInnate",
  "prepared": "SW5E.PowerPrepPrepared"
};

SW5E.powerUpcastModes = ["always"];


SW5E.powerProgression = {
  "none": "SW5E.PowerNone",
  "full": "SW5E.PowerProgFull",
  "artificer": "SW5E.PowerProgArt"
};

/* -------------------------------------------- */

/**
 * The available choices for how power damage scaling may be computed
 * @type {Object}
 */
SW5E.powerScalingModes = {
  "none": "SW5E.PowerNone",
  "atwill": "SW5E.PowerAtWill",
  "level": "SW5E.PowerLevel"
};

/* -------------------------------------------- */

// Weapon Types
SW5E.weaponTypes = {
  "simpleVW": "SW5E.WeaponSimpleVW",
  "simpleB": "SW5E.WeaponSimpleB",
  "simpleLW": "SW5E.WeaponSimpleLW",
  "martialVW": "SW5E.WeaponMartialVW",
  "martialB": "SW5E.WeaponMartialB",
  "martialLW": "SW5E.WeaponMartialLW",
  "natural": "SW5E.WeaponNatural",
  "improv": "SW5E.WeaponImprov",
  "ammo": "SW5E.WeaponAmmo"
};


/* -------------------------------------------- */

/**
 * Define the set of weapon property flags which can exist on a weapon
 * @type {Object}
 */
SW5E.weaponProperties = {
  "amm": "SW5E.WeaponPropertiesAmm",
  "bur": "SW5E.WeaponPropertiesBur",
  "def": "SW5E.WeaponPropertiesDef",
  "dex": "SW5E.WeaponPropertiesDex",
  "drm": "SW5E.WeaponPropertiesBur",
  "dgd": "SW5E.WeaponPropertiesDgd",
  "dis": "SW5E.WeaponPropertiesDis",
  "dpt": "SW5E.WeaponPropertiesDpt",
  "dou": "SW5E.WeaponPropertiesDou",
  "hvy": "SW5E.WeaponPropertiesHvy",
  "hid": "SW5E.WeaponPropertiesHid",
  "fin": "SW5E.WeaponPropertiesFin",
  "fix": "SW5E.WeaponPropertiesFix",
  "foc": "SW5E.WeaponPropertiesFoc",
  "ken": "SW5E.WeaponPropertiesKen",
  "lgt": "SW5E.WeaponPropertiesLgt",
  "lum": "SW5E.WeaponPropertiesLum",
  "pic": "SW5E.WeaponPropertiesPic",
  "rap": "SW5E.WeaponPropertiesRap",
  "rch": "SW5E.WeaponPropertiesRch",
  "rel": "SW5E.WeaponPropertiesRel",
  "ret": "SW5E.WeaponPropertiesRet",
  "shk": "SW5E.WeaponPropertiesShk",
  "spc": "SW5E.WeaponPropertiesSpc",
  "str": "SW5E.WeaponPropertiesStr",
  "thr": "SW5E.WeaponPropertiesThr",
  "two": "SW5E.WeaponPropertiesTwo",
  "ver": "SW5E.WeaponPropertiesVer",
  "vic": "SW5E.WeaponPropertiesVic"
};


// Power Components
SW5E.powerComponents = {
  "V": "SW5E.ComponentVerbal",
  "S": "SW5E.ComponentSomatic",
  "M": "SW5E.ComponentMaterial"
};

// Power Schools
SW5E.powerSchools = {
  "lgt": "SW5E.SchoolLgt",
  "uni": "SW5E.SchoolUni",
  "drk": "SW5E.SchoolDrk",
  "tec": "SW5E.SchoolTec",
  "enh": "SW5E.SchoolEnh"
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


// Condition Types
SW5E.conditionTypes = {
  "blinded": "SW5E.ConBlinded",
  "charmed": "SW5E.ConCharmed",
  "deafened": "SW5E.ConDeafened",
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
  "shocked": "SW5E.ConShocked",
  "stunned": "SW5E.ConStunned",
  "unconscious": "SW5E.ConUnconscious"
};

// Languages
SW5E.languages = {
  "basic": "SW5E.LanguagesBasic",
  "binary": "SW5E.LanguagesBinary",
  "bith": "SW5E.LanguagesBith",
  "bocce": "SW5E.LanguagesBocce",
  "bothese": "SW5E.LanguagesBothese",
  "catharese": "SW5E.LanguagesCartharese",
  "cheunh": "SW5E.LanguagesCheunh",
  "durese": "SW5E.LanguagesDurese",
  "dug": "SW5E.LanguagesDug",
  "ewokese": "SW5E.LanguagesEwokese",
  "gamorrese": "SW5E.LanguagesGamorrese",
  "geonosian": "SW5E.LanguagesGeonosian",
  "hapan": "SW5E.LanguagesHapan",
  "huttese": "SW5E.LanguagesHuttese",
  "jawaese": "SW5E.LanguagesJawaese",
  "kaleesh": "SW5E.LanguagesKaleesh",
  "kaminoan": "SW5E.LanguagesKaminoan",
  "keldor": "SW5E.LanguagesKelDor",
  "mandoa": "SW5E.LanguagesMandoa",
  "moncal": "SW5E.LanguagesMonCal",
  "pakpak": "SW5E.LanguagesPakPak",
  "rodese": "SW5E.LanguagesRodese",
  "sith": "SW5E.LanguagesSith",
  "togruti": "SW5E.LanguagesTogruti",
  "dosh": "SW5E.LanguagesDosh",
  "twi'leki": "SW5E.LanguagesTwileki",
  "tusken": "SW5E.LanguagesTusken",
  "shyriiwook": "SW5E.LanguagesShyriiwook",
  "zabraki": "SW5E.LanguagesZabraki",
  "vong": "SW5E.LanguagesVong"
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

// Configure Optional Character Flags
SW5E.characterFlags = {
  "detailOriented": {
    name: "Detail Oriented",
    hint: "You have advantage on Intelligence (Investigation) checks within 5 feet.",
    section: "Racial Traits",
    type: Boolean
  },
  "keenSenses": {
    name: "Keen Hearing and Smell",
    hint: "You have advantage on Wisdom (Perception) checks that involve hearing or smell.",
    section: "Racial Traits",
    type: Boolean
  },
  "naturallyStealthy": {
    name: "Naturally Stealthy",
    hint: "You can attempt to hide even when you are obscured only by a creature that is your size or larger than you.",
    section: "Racial Traits",
    type: Boolean
  },
  "nimbleEscape": {
    name: "Nimble Escape",
    hint: "You can take the Disengage or Hide action as a bonus action.",
    section: "Racial Traits",
    type: Boolean
  },
  "powerfulBuild": {
    name: "Powerful Build",
    hint: "You count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift.",
    section: "Racial Traits",
    type: Boolean
  },
  "programmer": {
    name: "Programmer",
    hint: "Whenever you make an Intelligence (Technology) check related to computers, you are considered to have expertise in the Technology skill.",
    section: "Racial Traits",
    type: Boolean
  },
  "techResistance": {
    name: "Tech Resistance",
    hint: "You have advantage on Dexterity and Intelligence saving throws against tech powers.",
    section: "Racial Traits",
    type: Boolean
  },
  "unarmedCombatant": {
    name: "Unarmed Combatant",
    hint: "Your unarmed strikes deal 1d4 kinetic damage. You can use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.",
    section: "Racial Traits",
    type: Boolean
  },
  "undersized": {
    name: "Undersized",
    hint: "You can’t use heavy shields, martial weapons with the two-handed property unless it also has the light property, and if a martial weapon has the versatile property, you can only wield it in two hands.",
    section: "Racial Traits",
    type: Boolean
  },
  "initiativeAdv": {
    name: "Advantage on Initiative",
    hint: "Provided by feats or magical items.",
    section: "Feats",
    type: Boolean
  },
  "initiativeAlert": {
    name: "Alert Feat",
    hint: "Provides +5 to Initiative.",
    section: "Feats",
    type: Boolean
  },
  "jackOfAllTrades": {
    name: "Jack of All Trades",
    hint: "Half-Proficiency to Ability Checks in which you are not already Proficient.",
    section: "Feats",
    type: Boolean
  },
  "observantFeat": {
    name: "Observant Feat",
    hint: "Provides a +5 to passive Perception and Investigation.",
    skills: ['prc','inv'],
    section: "Feats",
    type: Boolean
  },
  "remarkableAthlete": {
    name: "Remarkable Athlete.",
    hint: "Half-Proficiency (rounded-up) to physical Ability Checks and Initiative.",
    abilities: ['str','dex','con'],
    section: "Feats",
    type: Boolean
  },
  "weaponCriticalThreshold": {
    name: "Critical Hit Threshold",
    hint: "Allow for expanded critical range; for example Improved or Superior Critical",
    section: "Feats",
    type: Number,
    placeholder: 20
  }
};
