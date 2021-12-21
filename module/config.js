import {ClassFeatures} from "./classFeatures.js";

// Namespace SW5e Configuration Values
export const SW5E = {};

// ASCII Artwork
SW5E.ASCII = `
 ___________      ___________       
/   _____/  \\    /  \\   ____/ ____  
\\_____  \\\\   \\/\\/   /____  \\_/ __ \\ 
/        \\\\        //       \\  ___/ 
\\______  / \\__/\\  //______  /\\__  >
       \\/       \\/        \\/    \\/ `;

/**
 * The set of Ability Scores used within the system.
 * @enum {string}
 */
SW5E.abilities = {
    str: "SW5E.AbilityStr",
    dex: "SW5E.AbilityDex",
    con: "SW5E.AbilityCon",
    int: "SW5E.AbilityInt",
    wis: "SW5E.AbilityWis",
    cha: "SW5E.AbilityCha"
};

/**
 * Localized abbreviations for Ability Scores.
 * @enum {string}
 */
SW5E.abilityAbbreviations = {
    str: "SW5E.AbilityStrAbbr",
    dex: "SW5E.AbilityDexAbbr",
    con: "SW5E.AbilityConAbbr",
    int: "SW5E.AbilityIntAbbr",
    wis: "SW5E.AbilityWisAbbr",
    cha: "SW5E.AbilityChaAbbr"
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

/* -------------------------------------------- */

/**
 * General weapon categories.
 * @enum {string}
 */
SW5E.weaponProficiencies = {
    blp: "SW5E.WeaponBlasterPistolProficiency",
    chk: "SW5E.WeaponChakramProficiency",
    dbb: "SW5E.WeaponDoubleBladeProficiency",
    dbs: "SW5E.WeaponDoubleSaberProficiency",
    dsh: "SW5E.WeaponDoubleShotoProficiency",
    dsw: "SW5E.WeaponDoubleSwordProficiency",
    hid: "SW5E.WeaponHiddenBladeProficiency",
    imp: "SW5E.WeaponImprovisedProficiency",
    lfl: "SW5E.WeaponLightFoilProficiency",
    lrg: "SW5E.WeaponLightRingProficiency",
    mar: "SW5E.WeaponMartialProficiency",
    mrb: "SW5E.WeaponMartialBlasterProficiency",
    mlw: "SW5E.WeaponMartialLightweaponProficiency",
    mvb: "SW5E.WeaponMartialVibroweaponProficiency",
    ntl: "SW5E.WeaponNaturalProficiency",
    swh: "SW5E.WeaponSaberWhipProficiency",
    sim: "SW5E.WeaponSimpleProficiency",
    smb: "SW5E.WeaponSimpleBlasterProficiency",
    slw: "SW5E.WeaponSimpleLightweaponProficiency",
    svb: "SW5E.WeaponSimpleVibroweaponProficiency",
    tch: "SW5E.WeaponTechbladeProficiency",
    vbr: "SW5E.WeaponVibrorapierProficiency",
    vbw: "SW5E.WeaponVibrowhipProficiency"
};

/**
 * A mapping between `SW5E.weaponTypes` and `SW5E.weaponProficiencies` that
 * is used to determine if character has proficiency when adding an item.
 * @enum {(boolean|string)}
 */
SW5E.weaponProficienciesMap = {
    natural: true,
    simpleVW: "sim",
    simpleB: "sim",
    simpleLW: "sim",
    martialVW: "mar",
    martialB: "mar",
    martialLW: "mar"
};

/* -------------------------------------------- */

/**
 * The basic weapon types in sw5e. This enables specific weapon proficiencies or
 * starting equipment provided by classes and backgrounds.
 * @enum {string}
 **/
SW5E.weaponIds = {
    "grenadelauncher": "sw5e.blasters.1PtYUVAzIi5e2x4H",
    "heavyshotgun": "sw5e.blasters.TSOf2xTMf792t4af",
    "cyclerrifle": "sw5e.blasters.yaFeefXN5oCNhZns",
    "lightpistol": "sw5e.blasters.3MuBVRCfB4j2pmm1",
    "heavyrepeater": "sw5e.blasters.CUGWEv0xw4OMdjsI",
    "ionpistol": "sw5e.blasters.4CdI8yfutf7ZggfY",
    "heavypistol": "sw5e.blasters.6S2Lb686mrKTQMTp",
    "handblaster": "sw5e.blasters.6aTkk5EqFsVKECbn",
    "disruptorpistol": "sw5e.blasters.7d9jf8kTjKtzIals",
    "sonicpistol": "sw5e.blasters.8EKfBUh1sNYcdyxQ",
    "bolt-thrower": "sw5e.blasters.9VhsUL3z9o62lUsT",
    "nightstingerrifle": "sw5e.blasters.9h8aYCXd9O2aJThy",
    "bkg": "sw5e.blasters.AChZTm3pFdO51aFE",
    "switchpistol": "sw5e.blasters.BF0DbpSuicX8qHhb",
    "shotgun": "sw5e.blasters.twTqep64yEvD27WD",
    "heavyslugpistol": "sw5e.blasters.HXyrCz4Kun53F4kK",
    "scattergun": "sw5e.blasters.Ul4lKHTI2TocCqBm",
    "switchcannon": "sw5e.blasters.KO4QzzK90ddtTCeP",
    "huntingrifle": "sw5e.blasters.E1qrlNHZ9VtE0lky",
    "incineratorpistol": "sw5e.blasters.EY3jaFiEsO9UzEz9",
    "ioncarbine": "sw5e.blasters.FJMwehrWtdagwsqn",
    "revolver": "sw5e.blasters.KGY7W9ckhHlCmTLI",
    "shatterrifle": "sw5e.blasters.Ger4Tz2ZQHBsvIdD",
    "shattercannon": "sw5e.blasters.V69p6jqgTM5oyp3P",
    "sonicrifle": "sw5e.blasters.Iv36Kvf4Twtr0WQf",
    "assaultcannon": "sw5e.blasters.mXu2wQEqg6czu3X1",
    "heavybowcaster": "sw5e.blasters.LyjP5ioaHCa8sSsp",
    "shouldercannon": "sw5e.blasters.quQ1kOTjP0Z4DkE7",
    "blasterrifle": "sw5e.blasters.Nww9kzfPy9D246fg",
    "switchcarbine": "sw5e.blasters.OZhhFSXfVaTxlvMy",
    "repeatingblaster": "sw5e.blasters.owCClcq8Zp0AJrb8",
    "arccaster": "sw5e.blasters.xGH5V5Dh3Xd8yRZr",
    "vaporprojector": "sw5e.blasters.PhJpjuTtS0E2dR5M",
    "blastercarbine": "sw5e.blasters.PoGaGtinF97I9fQ0",
    "sniperrifle": "sw5e.blasters.Q45OrdLhguL9OWNU",
    "carbinerifle": "sw5e.blasters.SAWonBPE2WqRRJBd",
    "switchrifle": "sw5e.blasters.TGpxeKGTfalYK5SA",
    "wristblaster": "sw5e.blasters.TlrVX9tsQfnzmyo6",
    "needler": "sw5e.blasters.tzlA3eYfQSOLVlUw",
    "switchsniper": "sw5e.blasters.UZqJABEq0NUKU2Uf",
    "slugthrower": "sw5e.blasters.k0KYmZ6myMThvhKH",
    "hold-out": "sw5e.blasters.V7uuRrAqCINlkgFk",
    "torpedolauncher": "sw5e.blasters.WUI1B0CvfWXMUABR",
    "bowcaster": "sw5e.blasters.nbUdM3rwdWFLeRQr",
    "ionrifle": "sw5e.blasters.aXCB2Uap09IIAV0p",
    "chaingun": "sw5e.blasters.cchq3Zp6gDRHCPmJ",
    "iws": "sw5e.blasters.yQKuemJZafYpqDxA",
    "slugpistol": "sw5e.blasters.nFL3lIO5cZyGdi7h",
    "rotarycannon": "sw5e.blasters.hiD9yXYbGr9qpEHP",
    "wristlauncher": "sw5e.blasters.fhQ3oxD0XojwKnVN",
    "lightbow": "sw5e.blasters.gIGxUwvW06msv36V",
    "subrepeater": "sw5e.blasters.gPDZk2wbFxPbbZrl",
    "blastercannon": "sw5e.blasters.hGHemt3w37BdkARm",
    "tranquilizerrifle": "sw5e.blasters.kTknGaMyXROkwRvm",
    "incineratorsniper": "sw5e.blasters.l1vS9YRrwQktdgbI",
    "energybow": "sw5e.blasters.lb1KS1SOtmf384Xv",
    "flechettecannon": "sw5e.blasters.lzJCdT9fuPVW5S44",
    "lightslugpistol": "sw5e.blasters.md4uo61mzq3xBFh0",
    "rocketlauncher": "sw5e.blasters.pYsmiZ98tXTfdbt0",
    "blasterpistol": "sw5e.blasters.rz0YqUmRxFl79W0K",
    "lightrepeater": "sw5e.blasters.t0Z84WWjYSNY92rf",
    "disruptorrifle": "sw5e.blasters.yOsWMLHMEtzucKDC",
    "shatterpistol": "sw5e.blasters.yVgru3dfq2S3HzVB",
    "railgun": "sw5e.blasters.zuPhwZGH0j2ovgG7",
    "lightglaive": "sw5e.lightweapons.A2LrY6YdgNv4JL74",
    "doubleshoto": "sw5e.lightweapons.AVDPyImR6l9E2JEi",
    "sithsaber": "sw5e.lightweapons.AoO7yHMOrYlG67fa",
    "lightring": "sw5e.lightweapons.CFd2Rv27dH0c7cMt",
    "sabergauntlet": "sw5e.lightweapons.Fbxbb4X9seaZzpQj",
    "lightfist": "sw5e.lightweapons.I0DFU813iysKiYCj",
    "cross-saber": "sw5e.lightweapons.J74mQptLf2FlsZHC",
    "retrosaber": "sw5e.lightweapons.L47ZLQgshik5X5ea",
    "chainedlightdagger": "sw5e.lightweapons.LzWg0JRhhyedB9bi",
    "lightsaberpike": "sw5e.lightweapons.NKFT1tIzfAAZHsHn",
    "lightaxe": "sw5e.lightweapons.Ncx7KBa8wBn9KztD",
    "canesaber": "sw5e.lightweapons.Nv2WbsbQ767k40Hz",
    "saberspear": "sw5e.lightweapons.NvHrxWiR8wiUeEhO",
    "lightclub": "sw5e.lightweapons.OJmYglDcsfSbzuyK",
    "lightdagger": "sw5e.lightweapons.Ri7R7WyapR2CDE9S",
    "shotosaber": "sw5e.lightweapons.RjQEzblykRC6Qn8E",
    "doublesaber": "sw5e.lightweapons.T3eHzkaSMMpLuBbr",
    "lightsaber": "sw5e.lightweapons.TjTDmB8pIYSLkQvw",
    "claymoresaber": "sw5e.lightweapons.TnPZm7K0XjygDfup",
    "crossguardsaber": "sw5e.lightweapons.TzLXYpz7oWOPvZQR",
    "greatsaber": "sw5e.lightweapons.VE0ivGhc34JZ7SDv",
    "bustersaber": "sw5e.lightweapons.VxjgQHyXgtRgk9cD",
    "martiallightsaber": "sw5e.lightweapons.ZAvRnvSdsRnz9CGQ",
    "dual-phasesaber": "sw5e.lightweapons.btN7KpXTNmkCSNCr",
    "saberwhip": "sw5e.lightweapons.gaFajnxdTGFGVOki",
    "saberaxe": "sw5e.lightweapons.gj2EIKC9sEvLvc2E",
    "lightfoil": "sw5e.lightweapons.s3PoP2XP6eNKibCh",
    "wristsaber": "sw5e.lightweapons.tct3YIDnft6YS1zm",
    "guardshoto": "sw5e.lightweapons.xYrgfBXhWqh7jsU5",
    "warsword": "sw5e.vibroweapons.1l5wYDmKxsVtBh8C",
    "techstaff": "sw5e.vibroweapons.1yjNZ2sexhgtLTJd",
    "doubleblade": "sw5e.vibroweapons.2JAikVfIqqfVnz89",
    "mancatcher": "sw5e.vibroweapons.2NpgNbbZii4hBxnf",
    "disguisedblade": "sw5e.vibroweapons.2hh7rbRe2M7NtsSA",
    "vibroknife": "sw5e.vibroweapons.3kUGRPNz1ZGoyroy",
    "vibrodagger": "sw5e.vibroweapons.4NC3GFIB6fkAFode",
    "vibromace": "sw5e.vibroweapons.4nhExqMbBBc43yEg",
    "vibrotonfa": "sw5e.vibroweapons.51SEwkiAyEyNxepE",
    "bo-rifle": "sw5e.vibroweapons.Q6TehYphedst0IO7",
    "bolas": "sw5e.vibroweapons.9aZ7pxuQ53FSSln2",
    "vibroshield": "sw5e.vibroweapons.AAPFz1h7zavJtNLT",
    "vibrowhip": "sw5e.vibroweapons.DMhK05ya9IaoRaqn",
    "electroprod": "sw5e.vibroweapons.DPM9vkX71mJqu56S",
    "net": "sw5e.vibroweapons.E4yr74pank6zL4EM",
    "echostaff": "sw5e.vibroweapons.EkHc4LJawI0MkZTt",
    "vibroglaive": "sw5e.vibroweapons.FSHBcQtY54JJeRVj",
    "electrovoulge": "sw5e.vibroweapons.GHNSNfGwYy5M7PHf",
    "techblade": "sw5e.vibroweapons.IAgE03WckaYyW18F",
    "vibrorapier": "sw5e.vibroweapons.INgbfJEkeG2eTK2J",
    "nervebaton": "sw5e.vibroweapons.IR2YLzSMJtarjPRB",
    "wristblade": "sw5e.vibroweapons.ITIKI8cm8bfdwJtr",
    "jaggedvibroblade": "sw5e.vibroweapons.Ix3zb5hgZ8gMlUCU",
    "vibrohammer": "sw5e.vibroweapons.IyUZfO6To2YpdRAc",
    "techaxe": "sw5e.vibroweapons.JJW1OllV82jC2RXG",
    "warhat": "sw5e.vibroweapons.KLQK6pxmZljlmTH7",
    "riotshocker": "sw5e.vibroweapons.Kdl45Yv1B8aV6wb1",
    "hookedvibroblade": "sw5e.vibroweapons.LbuQt3wl3ddFby24",
    "vibrostaff": "sw5e.vibroweapons.Nai38YsJRjYCUrtq",
    "vibrolance": "sw5e.vibroweapons.P5F9exDDwLqELvx8",
    "chaineddagger": "sw5e.vibroweapons.QOlVIUthbalyOzx5",
    "vibroblade": "sw5e.vibroweapons.UNkMw4mUkIIveQcJ",
    "chakram": "sw5e.vibroweapons.WFtEcb6twwwCCJw3",
    "vibrocutter": "sw5e.vibroweapons.aOSObG115AyL94wE",
    "vibrobuster": "sw5e.vibroweapons.b7eKH5T3Djwod7fk",
    "hiddenblade": "sw5e.vibroweapons.cmb8tlOI7j4wnfPi",
    "electrohammer": "sw5e.vibroweapons.eIrYhQUAWrtb7hge",
    "doublesword": "sw5e.vibroweapons.eNRNDJTz4Qwp9cGJ",
    "electrostaff": "sw5e.vibroweapons.h05hvfoThlmCxW5H",
    "vibrodart": "sw5e.vibroweapons.i9YbAYtjJ37eJv3K",
    "vibroclaw": "sw5e.vibroweapons.j0sgK34TRKbyBprP",
    "riotbaton": "sw5e.vibroweapons.mWlYuzFhHFek9NN2",
    "vibroaxe": "sw5e.vibroweapons.o8JR5oLCQOYpP9Oa",
    "vibrospear": "sw5e.vibroweapons.oS93z4sSFt0aidDI",
    "vibroclaymore": "sw5e.vibroweapons.owrLUNZDefZk5dWY",
    "vibroknuckler": "sw5e.vibroweapons.rqVAzueP6PdG3h4D",
    "vibropike": "sw5e.vibroweapons.rsn8G4aAxpu0gJBH",
    "disruptorshiv": "sw5e.vibroweapons.sG5tznTOdE50BvDE",
    "vibrobattleaxe": "sw5e.vibroweapons.sJOPfGy0XqCOFq1n",
    "electrobaton": "sw5e.vibroweapons.syMf22lyVB0OTV7V",
    "vibrobaton": "sw5e.vibroweapons.t4GxMD52v7myAi41",
    "vibrosword": "sw5e.vibroweapons.u1t2YqPQSOMWPQbs",
    "shockwhip": "sw5e.vibroweapons.wmMxWXgZdlJ8SLXe"
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

/**
 * The categories of tool proficiencies that a character can gain.
 *
 * @enum {string}
 */
SW5E.toolProficiencies = {
    ...SW5E.toolTypes,
    vehicle: "SW5E.ToolVehicle"
};

/* -------------------------------------------- */

/**
 * The various lengths of time over which effects can occur.
 * @enum {string}
 */
SW5E.timePeriods = {
    inst: "SW5E.TimeInst",
    turn: "SW5E.TimeTurn",
    round: "SW5E.TimeRound",
    minute: "SW5E.TimeMinute",
    hour: "SW5E.TimeHour",
    day: "SW5E.TimeDay",
    month: "SW5E.TimeMonth",
    year: "SW5E.TimeYear",
    perm: "SW5E.TimePerm",
    spec: "SW5E.Special"
};

/* -------------------------------------------- */

/**
 * Various ways in which an item or ability can be activated.
 * @enum {string}
 */
SW5E.abilityActivationTypes = {
    none: "SW5E.None",
    action: "SW5E.Action",
    bonus: "SW5E.BonusAction",
    reaction: "SW5E.Reaction",
    minute: SW5E.timePeriods.minute,
    hour: SW5E.timePeriods.hour,
    day: SW5E.timePeriods.day,
    special: SW5E.timePeriods.spec,
    legendary: "SW5E.LegendaryActionLabel",
    lair: "SW5E.LairActionLabel",
    crew: "SW5E.VehicleCrewAction"
};

/* -------------------------------------------- */

/**
 * Different things that an ability can consume upon use.
 * @enum {string}
 */
SW5E.abilityConsumptionTypes = {
    ammo: "SW5E.ConsumeAmmunition",
    attribute: "SW5E.ConsumeAttribute",
    material: "SW5E.ConsumeMaterial",
    charges: "SW5E.ConsumeCharges"
};

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
 * Colors used to visualize temporary and temporary maximum HP in token health bars
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

/* -------------------------------------------- */

/**
 * Different ways in which item capacity can be limited.
 * @enum {string}
 */
SW5E.itemCapacityTypes = {
    items: "SW5E.ItemContainerCapacityItems",
    weight: "SW5E.ItemContainerCapacityWeight"
};

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

/* -------------------------------------------- */

/**
 * Enumerate the lengths of time over which an item can have limited use ability
 * @enum {string}
 */
SW5E.limitedUsePeriods = {
    sr: "SW5E.ShortRest",
    lr: "SW5E.LongRest",
    day: "SW5E.Day",
    charges: "SW5E.Charges",
    recharge: "SW5E.Recharge",
    refitting: "SW5E.Refitting"
};

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

/* -------------------------------------------- */

/**
 * Equipment types that aren't armor.
 * @enum {string}
 */
SW5E.miscEquipmentTypes = {
    hyper: "SW5E.EquipmentHyperdrive",
    powerc: "SW5E.EquipmentPowerCoupling",
    reactor: "SW5E.EquipmentReactor",
    clothing: "SW5E.EquipmentClothing",
    trinket: "SW5E.EquipmentTrinket",
    ssarmor: "SW5E.EquipmentStarshipArmor",
    ssshield: "SW5E.EquipmentStarshipShield",
    vehicle: "SW5E.EquipmentVehicle"
};

/* -------------------------------------------- */

/**
 * The set of equipment types for armor, clothing, and other objects which can be worn by the character.
 * @enum {string}
 */
SW5E.equipmentTypes = {
    ...SW5E.miscEquipmentTypes,
    ...SW5E.armorTypes
};

/* -------------------------------------------- */

/**
 * The various types of vehicles in which characters can be proficient.
 * @enum {string}
 */
SW5E.vehicleTypes = {
    air: "SW5E.VehicleTypeAir",
    land: "SW5E.VehicleTypeLand",
    water: "SW5E.VehicleTypeWater"
};

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
        formula: "@attributes.ac.base + @abilities.dex.mod"
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
    ammo: "SW5E.ConsumableAmmunition",
    trinket: "SW5E.ConsumableTrinket",
    force: "SW5E.ConsumableForce",
    tech: "SW5E.ConsumableTech"
};

/* -------------------------------------------- */

/**
 * The valid currency denominations with localized labels, abbreviations, and conversions.
 * @enum {{
 *   label: string,
 *   abbreviation: string,
 *   [conversion]: {into: string, each: number}
 * }}
 */
SW5E.currencies = {
    CR: {
        label: "SW5E.CurrencyGC",
        abbreviation: "SW5E.CurrencyAbbrGC"
    }
};

/* -------------------------------------------- */

/**
 * Types of damage the can be caused by abilities.
 * @enum {string}
 */
SW5E.damageTypes = {
    acid: "SW5E.DamageAcid",
    cold: "SW5E.DamageCold",
    energy: "SW5E.DamageEnergy",
    fire: "SW5E.DamageFire",
    force: "SW5E.DamageForce",
    ion: "SW5E.DamageIon",
    kinetic: "SW5E.DamageKinetic",
    lightning: "SW5E.DamageLightning",
    necrotic: "SW5E.DamageNecrotic",
    poison: "SW5E.DamagePoison",
    psychic: "SW5E.DamagePsychic",
    sonic: "SW5E.DamageSonic"
};

/**
 * Types of damage to which an actor can possess resistance, immunity, or vulnerability.
 * @enum {string}
 */
SW5E.damageResistanceTypes = {
    ...SW5E.damageTypes
};

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

/**
 * The valid units of measure for the range of an action or effect.
 * This object automatically includes the movement units from `SW5E.movementUnits`.
 * @enum {string}
 */
SW5E.distanceUnits = {
    none: "SW5E.None",
    self: "SW5E.DistSelf",
    touch: "SW5E.DistTouch",
    spec: "SW5E.Special",
    any: "SW5E.DistAny",
    ...SW5E.movementUnits
};

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

/**
 * The types of single or area targets which can be applied to abilities.
 * @enum {string}
 */
SW5E.targetTypes = {
    none: "SW5E.None",
    self: "SW5E.TargetSelf",
    creature: "SW5E.TargetCreature",
    droid: "SW5E.TargetDroid",
    ally: "SW5E.TargetAlly",
    enemy: "SW5E.TargetEnemy",
    object: "SW5E.TargetObject",
    space: "SW5E.TargetSpace",
    radius: "SW5E.TargetRadius",
    sphere: "SW5E.TargetSphere",
    cylinder: "SW5E.TargetCylinder",
    cone: "SW5E.TargetCone",
    square: "SW5E.TargetSquare",
    cube: "SW5E.TargetCube",
    line: "SW5E.TargetLine",
    starship: "SW5E.TargetStarship",
    wall: "SW5E.TargetWall",
    weapon: "SW5E.TargetWeapon"
};

/* -------------------------------------------- */

/**
 * Mapping between `SW5E.targetTypes` and `MeasuredTemplate` shape types to define
 * which templates are produced by which area of effect target type.
 * @enum {string}
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

/**
 * Different types of healing that can be applied using abilities.
 * @enum {string}
 */
SW5E.healingTypes = {
    healing: "SW5E.Healing",
    temphp: "SW5E.HealingTemp"
};

/* -------------------------------------------- */

/**
 * Denominations of hit dice which can apply to classes.
 * @type {string[]}
 */
SW5E.hitDieTypes = ["d4", "d6", "d8", "d10", "d12", "d20"];

/* -------------------------------------------- */

/**
 * Enumerate the denominations of power dice which can apply to starships in the SW5E system
 * @type {string[]}
 */
SW5E.powerDieTypes = ["d1", "d4", "d6", "d8", "d10", "d12"];

/* -------------------------------------------- */

/**
 * Enumerate the upgrade costs as they apply to starships in the SW5E system based on Tier.
 * @type {number[]}
 */

SW5E.baseUpgradeCost = [0, 3900, 77500, 297000, 620000, 1150000];

/* -------------------------------------------- */

/**
 * Starship Deployment types
 * @enum {string}
 */

SW5E.deploymentTypes = {
    coord: "SW5E.DeploymentTypeCoordinator",
    gunner: "SW5E.DeploymentTypeGunner",
    mechanic: "SW5E.DeploymentTypeMechanic",
    operator: "SW5E.DeploymentTypeOperator",
    pilot: "SW5E.DeploymentTypePilot",
    technician: "SW5E.DeploymentTypeTechnician",
    crew: "SW5E.DeploymentTypeCrew",
    passenger: "SW5E.DeploymentTypePassenger"
};

/**
 * Starship Deployment types plural
 * @enum {string}
 */

SW5E.deploymentTypesPlural = {
    coord: "SW5E.DeploymentTypeCoordinatorPl",
    gunner: "SW5E.DeploymentTypeGunnerPl",
    mechanic: "SW5E.DeploymentTypeMechanicPl",
    operator: "SW5E.DeploymentTypeOperatorPl",
    pilot: "SW5E.DeploymentTypePilotPl",
    technician: "SW5E.DeploymentTypeTechnicianPl",
    crew: "SW5E.DeploymentTypeCrewPl",
    passenger: "SW5E.DeploymentTypePassengerPl"
};

/* -------------------------------------------- */

/**
 * Starship Deployable actor types
 * @type {string[]}
 */

SW5E.deployableTypes = ["character", "npc"];

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

/* -------------------------------------------- */

/**
 * The set of skill which can be trained.
 * @enum {string}
 */
SW5E.skills = {
    acr: "SW5E.SkillAcr",
    ani: "SW5E.SkillAni",
    ath: "SW5E.SkillAth",
    dec: "SW5E.SkillDec",
    ins: "SW5E.SkillIns",
    itm: "SW5E.SkillItm",
    inv: "SW5E.SkillInv",
    lor: "SW5E.SkillLor",
    med: "SW5E.SkillMed",
    nat: "SW5E.SkillNat",
    prc: "SW5E.SkillPrc",
    prf: "SW5E.SkillPrf",
    per: "SW5E.SkillPer",
    pil: "SW5E.SkillPil",
    slt: "SW5E.SkillSlt",
    ste: "SW5E.SkillSte",
    sur: "SW5E.SkillSur",
    tec: "SW5E.SkillTec"
};

/* -------------------------------------------- */

/**
 * The set of starship skills which can be trained in SW5e
 * @enum {string}
 */
SW5E.starshipSkills = {
    ast: "SW5E.StarshipSkillAst",
    bst: "SW5E.StarshipSkillBst",
    dat: "SW5E.StarshipSkillDat",
    hid: "SW5E.StarshipSkillHid",
    imp: "SW5E.StarshipSkillImp",
    inf: "SW5E.StarshipSkillInf",
    man: "SW5E.StarshipSkillMan",
    men: "SW5E.StarshipSkillMen",
    pat: "SW5E.StarshipSkillPat",
    prb: "SW5E.StarshipSkillPrb",
    ram: "SW5E.StarshipSkillRam",
    reg: "SW5E.StarshipSkillReg",
    scn: "SW5E.StarshipSkillScn",
    swn: "SW5E.StarshipSkillSwn"
};

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

/**
 * Subset of `SW5E.powerPreparationModes` that consume power slots.
 * @type {boolean[]}
 */
SW5E.powerUpcastModes = ["always", "prepared"];

/**
 * The available choices for power progression for a character class
 * @enum {string}
 */

SW5E.powerProgression = {
    none: "SW5E.PowerNone",
    consular: "SW5E.PowerProgCns",
    engineer: "SW5E.PowerProgEng",
    guardian: "SW5E.PowerProgGrd",
    scout: "SW5E.PowerProgSct",
    sentinel: "SW5E.PowerProgSnt"
};

/**
 * The max number of known powers available to each class per level
 * @type {number[]}  progresstionType[classLevel]
 */

SW5E.powersKnown = {
    none: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    consular: [9, 11, 13, 15, 17, 19, 21, 23, 25, 26, 28, 29, 31, 32, 34, 35, 37, 38, 39, 40],
    engineer: [6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    guardian: [5, 7, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24, 25, 27, 28, 29, 30],
    scout: [0, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    sentinel: [7, 9, 11, 13, 15, 17, 18, 19, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34, 35]
};

/**
 * The max number of powers cast for each power level per long rest
 * @type {number[]} progresstionType[powerLevel]
 */

SW5E.powerLimit = {
    none: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    consular: [1000, 1000, 1000, 1000, 1000, 1, 1, 1, 1],
    engineer: [1000, 1000, 1000, 1000, 1000, 1, 1, 1, 1],
    guardian: [1000, 1000, 1000, 1000, 1, 0, 0, 0, 0],
    scout: [1000, 1000, 1000, 1, 1, 0, 0, 0, 0],
    sentinel: [1000, 1000, 1000, 1000, 1, 1, 1, 0, 0],
    innate: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
    dual: [1000, 1000, 1000, 1000, 1000, 1, 1, 1, 1]
};

/**
 * The max level of a known/overpowered power available to each class per level
 * @type {number[]} progresstionType[classLevel]
 */

SW5E.powerMaxLevel = {
    none: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    consular: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
    engineer: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
    guardian: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
    scout: [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
    sentinel: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7],
    multi: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
    innate: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
    dual: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9]
};

/**
 * The number of base force/tech points available to each class per level
 * @type {number[]} progresstionType[classLevel]
 */

SW5E.powerPoints = {
    none: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    consular: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80],
    engineer: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
    guardian: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
    scout: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    sentinel: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57, 60]
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

/* -------------------------------------------- */

/**
 * The set of types which a weapon item can take.
 * @enum {string}
 */
SW5E.weaponTypes = {
    "ammo": "SW5E.WeaponAmmo",
    "improv": "SW5E.WeaponImprov",
    "martialVW": "SW5E.WeaponMartialVW",
    "martialB": "SW5E.WeaponMartialB",
    "martialLW": "SW5E.WeaponMartialLW",
    "natural": "SW5E.WeaponNatural",
    "siege": "SW5E.WeaponSiege",
    "simpleVW": "SW5E.WeaponSimpleVW",
    "simpleB": "SW5E.WeaponSimpleB",
    "simpleLW": "SW5E.WeaponSimpleLW",
    "primary (starship)": "SW5E.WeaponPrimarySW",
    "secondary (starship)": "SW5E.WeaponSecondarySW",
    "tertiary (starship)": "SW5E.WeaponTertiarySW",
    "quaternary (starship)": "SW5E.WeaponQuaternarySW"
};

/* -------------------------------------------- */

/**
 * The set of weapon property flags which can exist on armor.
 * @enum {string}
 */
SW5E.armorPropertiesTypes = {
    Absorptive: "SW5E.ArmorProperAbsorptive",
    Agile: "SW5E.ArmorProperAgile",
    Anchor: "SW5E.ArmorProperAnchor",
    Avoidant: "SW5E.ArmorProperAvoidant",
    Barbed: "SW5E.ArmorProperBarbed",
    Bulky: "SW5E.ArmorProperBulky",
    Charging: "SW5E.ArmorProperCharging",
    Concealing: "SW5E.ArmorProperConcealing",
    Cumbersome: "SW5E.ArmorProperCumbersome",
    Gauntleted: "SW5E.ArmorProperGauntleted",
    Imbalanced: "SW5E.ArmorProperImbalanced",
    Impermeable: "SW5E.ArmorProperImpermeable",
    Insulated: "SW5E.ArmorProperInsulated",
    Interlocking: "SW5E.ArmorProperInterlocking",
    Lambent: "SW5E.ArmorProperLambent",
    Lightweight: "SW5E.ArmorProperLightweight",
    Magnetic: "SW5E.ArmorProperMagnetic",
    Obscured: "SW5E.ArmorProperObscured",
    Obtrusive: "SW5E.ArmorProperObtrusive",
    Powered: "SW5E.ArmorProperPowered",
    Reactive: "SW5E.ArmorProperReactive",
    Regulated: "SW5E.ArmorProperRegulated",
    Reinforced: "SW5E.ArmorProperReinforced",
    Responsive: "SW5E.ArmorProperResponsive",
    Rigid: "SW5E.ArmorProperRigid",
    Silent: "SW5E.ArmorProperSilent",
    Spiked: "SW5E.ArmorProperSpiked",
    Strength: "SW5E.ArmorProperStrength",
    Steadfast: "SW5E.ArmorProperSteadfast",
    Versatile: "SW5E.ArmorProperVersatile"
};

/* -------------------------------------------- */

/**
 * The set of weapon property flags which can exist on a weapon.
 * @enum {string}
 */
SW5E.weaponProperties = {
    amm: "SW5E.WeaponPropertiesAmm",
    aut: "SW5E.WeaponPropertiesAut",
    bur: "SW5E.WeaponPropertiesBur",
    con: "SW5E.WeaponPropertiesCon",
    def: "SW5E.WeaponPropertiesDef",
    dex: "SW5E.WeaponPropertiesDex",
    dir: "SW5E.WeaponPropertiesDir",
    drm: "SW5E.WeaponPropertiesDrm",
    dgd: "SW5E.WeaponPropertiesDgd",
    dis: "SW5E.WeaponPropertiesDis",
    dpt: "SW5E.WeaponPropertiesDpt",
    dou: "SW5E.WeaponPropertiesDou",
    exp: "SW5E.WeaponPropertiesExp",
    fin: "SW5E.WeaponPropertiesFin",
    fix: "SW5E.WeaponPropertiesFix",
    foc: "SW5E.WeaponPropertiesFoc",
    hvy: "SW5E.WeaponPropertiesHvy",
    hid: "SW5E.WeaponPropertiesHid",
    hom: "SW5E.WeaponPropertiesHom",
    ion: "SW5E.WeaponPropertiesIon",
    ken: "SW5E.WeaponPropertiesKen",
    lgt: "SW5E.WeaponPropertiesLgt",
    lum: "SW5E.WeaponPropertiesLum",
    mlt: "SW5E.WeaponPropertiesMlt",
    mig: "SW5E.WeaponPropertiesMig",
    ovr: "SW5E.WeaponPropertiesOvr",
    pic: "SW5E.WeaponPropertiesPic",
    pow: "SW5E.WeaponPropertiesPow",
    rap: "SW5E.WeaponPropertiesRap",
    rch: "SW5E.WeaponPropertiesRch",
    rel: "SW5E.WeaponPropertiesRel",
    ret: "SW5E.WeaponPropertiesRet",
    sat: "SW5E.WeaponPropertiesSat",
    shk: "SW5E.WeaponPropertiesShk",
    sil: "SW5E.WeaponPropertiesSil",
    spc: "SW5E.WeaponPropertiesSpc",
    str: "SW5E.WeaponPropertiesStr",
    thr: "SW5E.WeaponPropertiesThr",
    two: "SW5E.WeaponPropertiesTwo",
    ver: "SW5E.WeaponPropertiesVer",
    vic: "SW5E.WeaponPropertiesVic",
    zon: "SW5E.WeaponPropertiesZon"
};

/* -------------------------------------------- */

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

/**
 * Types of components that can be required when casting a power.
 * @enum {string}
 */
SW5E.powerComponents = {
    V: "SW5E.ComponentVerbal",
    S: "SW5E.ComponentSomatic",
    M: "SW5E.ComponentMaterial"
};

/**
 * Schools to which a power can belong.
 * @enum {string}
 */
SW5E.powerSchools = {
    lgt: "SW5E.SchoolLgt",
    uni: "SW5E.SchoolUni",
    drk: "SW5E.SchoolDrk",
    tec: "SW5E.SchoolTec",
    enh: "SW5E.SchoolEnh"
};

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

// TODO: This is used for spell scrolls, it maps the level to the compendium ID of the item the spell would be bound to
// We could use this with, say, holocrons to produce scrolls
/*
// Power Scroll Compendium UUIDs
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
    keepVision: "SW5E.PolymorphKeepVision"
};

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

/* -------------------------------------------- */

/**
 * A selection of actor attributes that can be tracked on token resource bars.
 * @type {string[]}
 */
SW5E.trackableAttributes = [
    "attributes.ac.value",
    "attributes.init.value",
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
    "item.quantity",
    "item.weight",
    "item.duration.value",
    "currency",
    "details.xp.value",
    "abilities.*.value",
    "attributes.senses",
    "attributes.movement",
    "attributes.ac.flat",
    "item.armor.value",
    "item.target",
    "item.range",
    "item.save.dc"
];

/* -------------------------------------------- */

/**
 * Conditions that can effect an actor.
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
    shocked: "SW5E.ConShocked",
    slowed: "SW5E.ConSlowed",
    stunned: "SW5E.ConStunned",
    unconscious: "SW5E.ConUnconscious"
};

/**
 * Languages a character can learn.
 * @enum {string}
 */
SW5E.languages = {
    "abyssin": "SW5E.LanguagesAbyssin",
    "aleena": "SW5E.LanguagesAleena",
    "antarian": "SW5E.LanguagesAntarian",
    "anzellan": "SW5E.LanguagesAnzellan",
    "aqualish": "SW5E.LanguagesAqualish",
    "arconese": "SW5E.LanguagesArconese",
    "ardennian": "SW5E.LanguagesArdennian",
    "arkanian": "SW5E.LanguagesArkanian",
    "balosur": "SW5E.LanguagesBalosur",
    "barabel": "SW5E.LanguagesBarabel",
    "basic": "SW5E.LanguagesBasic",
    "besalisk": "SW5E.LanguagesBesalisk",
    "binary": "SW5E.LanguagesBinary",
    "bith": "SW5E.LanguagesBith",
    "bocce": "SW5E.LanguagesBocce",
    "bothese": "SW5E.LanguagesBothese",
    "catharese": "SW5E.LanguagesCatharese",
    "cerean": "SW5E.LanguagesCerean",
    "chadra-fan": "SW5E.LanguagesChadra-Fan",
    "chagri": "SW5E.LanguagesChagri",
    "cheunh": "SW5E.LanguagesCheunh",
    "chevin": "SW5E.LanguagesChevin",
    "chironan": "SW5E.LanguagesChironan",
    "clawdite": "SW5E.LanguagesClawdite",
    "codruese": "SW5E.LanguagesCodruese",
    "colicoid": "SW5E.LanguagesColicoid",
    "dashadi": "SW5E.LanguagesDashadi",
    "defel": "SW5E.LanguagesDefel",
    "devaronese": "SW5E.LanguagesDevaronese",
    "dosh": "SW5E.LanguagesDosh",
    "draethos": "SW5E.LanguagesDraethos",
    "durese": "SW5E.LanguagesDurese",
    "dug": "SW5E.LanguagesDug",
    "ewokese": "SW5E.LanguagesEwokese",
    "falleen": "SW5E.LanguagesFalleen",
    "felucianese": "SW5E.LanguagesFelucianese",
    "gamorrese": "SW5E.LanguagesGamorrese",
    "gand": "SW5E.LanguagesGand",
    "geonosian": "SW5E.LanguagesGeonosian",
    "givin": "SW5E.LanguagesGivin",
    "gran": "SW5E.LanguagesGran",
    "gungan": "SW5E.LanguagesGungan",
    "hapan": "SW5E.LanguagesHapan",
    "harchese": "SW5E.LanguagesHarchese",
    "herglese": "SW5E.LanguagesHerglese",
    "honoghran": "SW5E.LanguagesHonoghran",
    "huttese": "SW5E.LanguagesHuttese",
    "iktotchese": "SW5E.LanguagesIktotchese",
    "ithorese": "SW5E.LanguagesIthorese",
    "jawaese": "SW5E.LanguagesJawaese",
    "kaleesh": "SW5E.LanguagesKaleesh",
    "kaminoan": "SW5E.LanguagesKaminoan",
    "karkaran": "SW5E.LanguagesKarkaran",
    "keldor": "SW5E.LanguagesKelDor",
    "kharan": "SW5E.LanguagesKharan",
    "killik": "SW5E.LanguagesKillik",
    "klatooinian": "SW5E.LanguagesKlatooinian",
    "kubazian": "SW5E.LanguagesKubazian",
    "kushiban": "SW5E.LanguagesKushiban",
    "kyuzo": "SW5E.LanguagesKyuzo",
    "lannik": "SW5E.LanguagesLannik",
    "lasat": "SW5E.LanguagesLasat",
    "lowickese": "SW5E.LanguagesLowickese",
    "lurmese": "SW5E.LanguagesLurmese",
    "mandoa": "SW5E.LanguagesMandoa",
    "miralukese": "SW5E.LanguagesMiralukese",
    "mirialan": "SW5E.LanguagesMirialan",
    "moncal": "SW5E.LanguagesMonCal",
    "mustafarian": "SW5E.LanguagesMustafarian",
    "muun": "SW5E.LanguagesMuun",
    "nautila": "SW5E.LanguagesNautila",
    "ortolan": "SW5E.LanguagesOrtolan",
    "pakpak": "SW5E.LanguagesPakPak",
    "pyke": "SW5E.LanguagesPyke",
    "quarrenese": "SW5E.LanguagesQuarrenese",
    "rakata": "SW5E.LanguagesRakata",
    "rattataki": "SW5E.LanguagesRattataki",
    "rishii": "SW5E.LanguagesRishii",
    "rodese": "SW5E.LanguagesRodese",
    "ryn": "SW5E.LanguagesRyn",
    "selkatha": "SW5E.LanguagesSelkatha",
    "semblan": "SW5E.LanguagesSemblan",
    "shistavanen": "SW5E.LanguagesShistavanen",
    "shyriiwook": "SW5E.LanguagesShyriiwook",
    "sith": "SW5E.LanguagesSith",
    "squibbian": "SW5E.LanguagesSquibbian",
    "sriluurian": "SW5E.LanguagesSriluurian",
    "ssi-ruuvi": "SW5E.LanguagesSsi-ruuvi",
    "sullustese": "SW5E.LanguagesSullustese",
    "talzzi": "SW5E.LanguagesTalzzi",
    "tarasinese": "SW5E.LanguagesTarasinese",
    "thisspiasian": "SW5E.LanguagesThisspiasian",
    "togorese": "SW5E.LanguagesTogorese",
    "togruti": "SW5E.LanguagesTogruti",
    "toydarian": "SW5E.LanguagesToydarian",
    "tusken": "SW5E.LanguagesTusken",
    "twi'leki": "SW5E.LanguagesTwileki",
    "ugnaught": "SW5E.LanguagesUgnaught",
    "umbaran": "SW5E.LanguagesUmbaran",
    "utapese": "SW5E.LanguagesUtapese",
    "verpine": "SW5E.LanguagesVerpine",
    "vong": "SW5E.LanguagesVong",
    "voss": "SW5E.LanguagesVoss",
    "yevethan": "SW5E.LanguagesYevethan",
    "zabraki": "SW5E.LanguagesZabraki",
    "zygerrian": "SW5E.LanguagesZygerrian"
};

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

/**
 * Character features automatically granted by classes & archetypes at certain levels.
 * @type {object}
 */
SW5E.classFeatures = ClassFeatures;

/**
 * Special character flags.
 * @enum {{
 *   name: string,
 *   hint: string,
 *   [abilities]: string[],
 *   [skills]: string[],
 *   section: string,
 *   type: any,
 *   placeholder: any
 * }}
 */
SW5E.characterFlags = {
    adaptiveResilience: {
        name: "SW5E.FlagsAdaptiveResilience",
        hint: "SW5E.FlagsAdaptiveResilienceHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    aggressive: {
        name: "SW5E.FlagsAggressive",
        hint: "SW5E.FlagsAggressiveHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    amphibious: {
        name: "SW5E.FlagsAmphibious",
        hint: "SW5E.FlagsAmphibiousHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    armorIntegration: {
        name: "SW5E.FlagsArmorIntegration",
        hint: "SW5E.FlagsArmorIntegrationHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    businessSavvy: {
        name: "SW5E.FlagsBusinessSavvy",
        hint: "SW5E.FlagsBusinessSavvyHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    cannibalize: {
        name: "SW5E.FlagsCannibalize",
        hint: "SW5E.FlagsCannibalizeHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    closedMind: {
        name: "SW5E.FlagsClosedMind",
        hint: "SW5E.FlagsClosedMindHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    crudeWeaponSpecialists: {
        name: "SW5E.FlagsCrudeWeaponSpecialists",
        hint: "SW5E.FlagsCrudeWeaponSpecialistsHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    defiant: {
        name: "SW5E.FlagsDefiant",
        hint: "SW5E.FlagsDefiantHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    detailOriented: {
        name: "SW5E.FlagsDetailOriented",
        hint: "SW5E.FlagsDetailOrientedHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    enthrallingPheromones: {
        name: "SW5E.FlagsEnthrallingPheromones",
        hint: "SW5E.FlagsEnthrallingPheromonesHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    extraArms: {
        name: "SW5E.FlagsExtraArms",
        hint: "SW5E.FlagsExtraArmsHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    forceContention: {
        name: "SW5E.FlagsForceContention",
        hint: "SW5E.FlagsForceContentionHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    forceInsensitive: {
        name: "SW5E.FlagsForceInsensitive",
        hint: "SW5E.FlagsForceInsensitiveHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    foreignBiology: {
        name: "SW5E.FlagsForeignBiology",
        hint: "SW5E.FlagsForeignBiologyHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    furyOfTheSmall: {
        name: "SW5E.FlagsFuryOfTheSmall",
        hint: "SW5E.FlagsFuryOfTheSmallHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    grovelCowerAndBeg: {
        name: "SW5E.FlagsGrovelCowerAndBeg",
        hint: "SW5E.FlagsGrovelCowerAndBegHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    inscrutable: {
        name: "SW5E.FlagsInscrutable",
        hint: "SW5E.FlagsInscrutableHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    keenSenses: {
        name: "SW5E.FlagsKeenSenses",
        hint: "SW5E.FlagsKeenSensesHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    longlimbed: {
        name: "SW5E.FlagsLongLimbed",
        hint: "SW5E.FlagsLongLimbedHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    maintenanceMode: {
        name: "SW5E.FlagsMaintenanceMode",
        hint: "SW5E.FlagsMaintenanceModeHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    maskOfTheWild: {
        name: "SW5E.FlagsMaskOfTheWild",
        hint: "SW5E.FlagsMaskOfTheWildHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    multipleHearts: {
        name: "SW5E.FlagsMultipleHearts",
        hint: "SW5E.FlagsMultipleHeartsHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    naturallyStealthy: {
        name: "SW5E.FlagsNaturallyStealthy",
        hint: "SW5E.FlagsNaturallyStealthyHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    nimbleAgility: {
        name: "SW5E.FlagsNimbleAgility",
        hint: "SW5E.FlagsNimbleAgilityHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    nimbleEscape: {
        name: "SW5E.FlagsNimbleEscape",
        hint: "SW5E.FlagsNimbleEscapeHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    nimbleness: {
        name: "SW5E.FlagsNimbleness",
        hint: "SW5E.FlagsNimblenessHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    pintsized: {
        name: "SW5E.FlagsPintsized",
        hint: "SW5E.FlagsPintsizedHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    powerfulBuild: {
        name: "SW5E.FlagsPowerfulBuild",
        hint: "SW5E.FlagsPowerfulBuildHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    precognition: {
        name: "SW5E.FlagsPrecognition",
        hint: "SW5E.FlagsPrecognitionHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    programmer: {
        name: "SW5E.FlagsProgrammer",
        hint: "SW5E.FlagsProgrammerHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    puny: {
        name: "SW5E.FlagsPuny",
        hint: "SW5E.FlagsPunyHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    rapidReconstruction: {
        name: "SW5E.FlagsRapidReconstruction",
        hint: "SW5E.FlagsRapidReconstructionHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    rapidlyRegenerative: {
        name: "SW5E.FlagsRapidlyRegenerative",
        hint: "SW5E.FlagsRapidlyRegenerativeHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    regenerative: {
        name: "SW5E.FlagsRegenerative",
        hint: "SW5E.FlagsRegenerativeHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    savageAttacks: {
        name: "SW5E.FlagsSavageAttacks",
        hint: "SW5E.FlagsSavageAttacksHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    shapechanger: {
        name: "SW5E.FlagsShapechanger",
        hint: "SW5E.FlagsShapechangerHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    strongLegged: {
        name: "SW5E.FlagsStrongLegged",
        hint: "SW5E.FlagsStrongLeggedHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    sunlightSensitivity: {
        name: "SW5E.FlagsSunlightSensitivity",
        hint: "SW5E.FlagsSunlightSensitivityHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    surpriseAttack: {
        name: "SW5E.FlagsSurpriseAttack",
        hint: "SW5E.FlagsSurpriseAttackHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    techImpaired: {
        name: "SW5E.FlagsTechImpaired",
        hint: "SW5E.FlagsTechImpairedHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    techResistance: {
        name: "SW5E.FlagsTechResistance",
        hint: "SW5E.FlagsTechResistanceHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    tinker: {
        name: "SW5E.FlagsTinker",
        hint: "SW5E.FlagsTinkerHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    toughness: {
        name: "SW5E.FlagsToughness",
        hint: "SW5E.FlagsToughnessHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    trance: {
        name: "SW5E.FlagsTrance",
        hint: "SW5E.FlagsTranceHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    unarmedCombatant: {
        name: "SW5E.FlagsUnarmedCombatant",
        hint: "SW5E.FlagsUnarmedCombatantHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    undersized: {
        name: "SW5E.FlagsUndersized",
        hint: "SW5E.FlagsUndersizedHint",
        section: "SW5E.SpeciesTraits",
        type: Boolean
    },
    unsettlingVisage: {
        name: "SW5E.FlagsUnsettlingVisage",
        hint: "SW5E.FlagsUnsettlingVisageHint",
        section: "SW5E.SpeciesTraits",
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
    meleeCriticalDamageDice: {
        name: "SW5E.FlagsMeleeCriticalDice",
        hint: "SW5E.FlagsMeleeCriticalDiceHint",
        section: "SW5E.Features",
        type: Number,
        placeholder: 0
    }
};

/**
 * Flags allowed on actors. Any flags not in the list may be deleted during a migration.
 * @type {string[]}
 */
SW5E.allowedActorFlags = ["isPolymorphed", "originalActor", "dataVersion"].concat(Object.keys(SW5E.characterFlags));
