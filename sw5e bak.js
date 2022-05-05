/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * Perform one-time pre-localization and sorting of some configuration objects
 */
Hooks.once("setup", function () {
    const localizeKeys = [
        "abilities",
        "abilityAbbreviations",
        "abilityActivationTypes",
        "abilityConsumptionTypes",
        "actorSizes",
        "alignments",
        "armorClasses.label",
        "armorProficiencies",
        // "armorProperties",
        "armorTypes",
        "conditionTypes",
        "consumableTypes",
        "cover",
        "currencies.label",
        "currencies.abbreviation",
        "damageResistanceTypes",
        "damageTypes",
        "ssCrewStationTypes",
        "distanceUnits",
        "equipmentTypes",
        "healingTypes",
        "itemActionTypes",
        "itemRarity",
        "languages",
        "limitedUsePeriods",
        "miscEquipmentTypes",
        "movementTypes",
        "movementUnits",
        "polymorphSettings",
        "proficiencyLevels",
        "senses",
        "skills",
        "starshipSkills",
        "powerComponents",
        "powerLevels",
        "powerPreparationModes",
        "powerScalingModes",
        "powerSchools",
        "targetTypes",
        "timePeriods",
        "toolProficiencies",
        "toolTypes",
        "vehicleTypes",
        "weaponProficiencies",
        // "weaponProperties",
        "weaponSizes",
        "weaponTypes"
    ];
    const sortKeys = [
        "abilityAbbreviations",
        "abilityActivationTypes",
        "abilityConsumptionTypes",
        "actorSizes",
        // "armorProperties",
        "armorTypes",
        "conditionTypes",
        "consumableTypes",
        "cover",
        "damageResistanceTypes",
        "damageTypes",
        "ssCrewStationTypes",
        "equipmentTypes",
        "healingTypes",
        "languages",
        "miscEquipmentTypes",
        "movementTypes",
        "polymorphSettings",
        "senses",
        "skills",
        "starshipSkills",
        "powerScalingModes",
        "powerSchools",
        "targetTypes",
        "timePeriods",
        "toolProficiencies",
        "toolTypes",
        "vehicleTypes",
        // "weaponProperties",
        "weaponSizes"
    ];
    preLocalizeConfig(CONFIG.SW5E, localizeKeys, sortKeys);

    // add DND5E translation for module compatability
    game.i18n.translations.DND5E = game.i18n.translations.SW5E;
});

/* -------------------------------------------- */

/**
 * Localize and sort configuration values
 * @param {object} config           The configuration object being prepared
 * @param {string[]} localizeKeys   An array of keys to localize
 * @param {string[]} sortKeys       An array of keys to sort
 */
function preLocalizeConfig(config, localizeKeys, sortKeys) {
    // Localize Objects
    for (const key of localizeKeys) {
        if (key.includes(".")) {
            const [inner, label] = key.split(".");
            _localizeObject(config[inner], label);
        } else _localizeObject(config[key]);
    }

    // Sort objects
    for (const key of sortKeys) {
        if (key.includes(".")) {
            const [configKey, sortKey] = key.split(".");
            config[configKey] = _sortObject(config[configKey], sortKey);
        } else config[key] = _sortObject(config[key]);
    }
}

/* -------------------------------------------- */

/**
 * Localize the values of a configuration object by translating them in-place.
 * @param {object} obj                The configuration object to localize
 * @param {string} [key]              An inner key which should be localized
 * @private
 */
function _localizeObject(obj, key) {
    for (const [k, v] of Object.entries(obj)) {
        // String directly
        if (typeof v === "string") {
            obj[k] = game.i18n.localize(v);
            continue;
        }

        // Inner object
        if (typeof v !== "object" || !(key in v)) {
            console.debug(v);
            console.error(new Error("Configuration values must be a string or inner object for pre-localization"));
            continue;
        }
        v[key] = game.i18n.localize(v[key]);
    }
}

/* -------------------------------------------- */

/**
 * Sort a configuration object by its values or by an inner sortKey.
 * @param {object} obj                The configuration object to sort
 * @param {string} [sortKey]          An inner key upon which to sort
 * @returns {{[p: string]: any}}      The sorted configuration object
 */
function _sortObject(obj, sortKey) {
    let sorted = Object.entries(obj);
    if (sortKey) sorted = sorted.sort((a, b) => a[1][sortKey].localeCompare(b[1][sortKey]));
    else sorted = sorted.sort((a, b) => a[1].localeCompare(b[1]));
    return Object.fromEntries(sorted);
}

/* --------------------------------------------- */
