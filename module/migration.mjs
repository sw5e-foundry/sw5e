import { slugifyIcon } from "./utils.js";

/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @returns {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function() {
    const version = game.system.data.version;
    ui.notifications.info(game.i18n.format("MIGRATION.5eBegin", {version}), {permanent: true});

    const migrationData = await getMigrationData();

    // Migrate World Actors
    for await ( let a of game.actors ) {
        try {
            const updateData = await migrateActorData(a.toObject(), migrationData);
            if ( !foundry.utils.isObjectEmpty(updateData) ) {
                console.log(`Migrating Actor document ${a.name}`);
                await a.update(updateData, {enforceTypes: false});
            }
        } catch (err) {
            err.message = `Failed sw5e system migration for Actor ${a.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Items
    for ( let i of game.items ) {
        try {
            const updateData = await migrateItemData(i.toObject(), migrationData);
            if ( !foundry.utils.isObjectEmpty(updateData) ) {
                console.log(`Migrating Item document ${i.name}`);
                await i.update(updateData, {enforceTypes: false});
            }
        } catch (err) {
            err.message = `Failed sw5e system migration for Item ${i.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Macros
    for ( const m of game.macros ) {
        try {
            const updateData = await migrateMacroData(m.toObject(), migrationData);
            if ( !foundry.utils.isObjectEmpty(updateData) ) {
                console.log(`Migrating Macro document ${m.name}`);
                await m.update(updateData, {enforceTypes: false});
            }
        } catch(err) {
            err.message = `Failed sw5e system migration for Macro ${m.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate Actor Override Tokens
    for ( let s of game.scenes ) {
        try {
            const updateData = await migrateSceneData(s.data, migrationData);
            if ( !foundry.utils.isObjectEmpty(updateData) ) {
                console.log(`Migrating Scene document ${s.name}`);
                await s.update(updateData, {enforceTypes: false});
                // If we do not do this, then synthetic token actors remain in cache
                // with the un-updated actorData.
                s.tokens.forEach(t => t._actor = null);
            }
        } catch(err) {
            err.message = `Failed sw5e system migration for Scene ${s.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Compendium Packs
    for ( let p of game.packs ) {
        if ( p.metadata.package !== "world" ) continue;
        if ( !["Actor", "Item", "Scene"].includes(p.documentName) ) continue;
        await migrateCompendium(p);
    }

    // Set the migration as complete
    game.settings.set("sw5e", "systemMigrationVersion", game.system.data.version);
    ui.notifications.info(game.i18n.format("MIGRATION.5eComplete", {version}), {permanent: true});
};

/* -------------------------------------------- */

/**
 * Apply migration rules to all Documents within a single Compendium pack
 * @param {CompendiumCollection} pack  Pack to be migrated.
 * @returns {Promise}
 */
export const migrateCompendium = async function(pack) {
    const documentName = pack.documentName;
    if ( !["Actor", "Item", "Scene"].includes(documentName) ) return;

    const migrationData = await getMigrationData();

    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const documents = await pack.getDocuments();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for await ( let doc of documents ) {
        let updateData = {};
        try {
            switch (documentName) {
                case "Actor":
                    updateData = await migrateActorData(doc.toObject(), migrationData);
                    break;
                case "Item":
                    updateData = migrateItemData(doc.toObject(), migrationData);
                    break;
                case "Scene":
                    updateData = await migrateSceneData(doc.data, migrationData);
                    break;
            }

            // Save the entry, if data was changed
            if ( foundry.utils.isObjectEmpty(updateData) ) continue;
            await doc.update(updateData);
            console.log(`Migrated ${documentName} document ${doc.name} in Compendium ${pack.collection}`);
        }

        // Handle migration failures
        catch(err) {
            err.message = `Failed sw5e system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
            console.error(err);
        }
    }

    // Apply the original locked status for the pack
    await pack.configure({locked: wasLocked});
    console.log(`Migrated all ${documentName} documents from Compendium ${pack.collection}`);
};

/**
 * Apply 'smart' AC migration to a given Actor compendium. This will perform the normal AC migration but additionally
 * check to see if the actor has armor already equipped, and opt to use that instead.
 * @param {CompendiumCollection|string} pack  Pack or name of pack to migrate.
 * @returns {Promise}
 */
export const migrateArmorClass = async function(pack) {
    if ( typeof pack === "string" ) pack = game.packs.get(pack);
    if ( pack.documentName !== "Actor" ) return;
    const wasLocked = pack.locked;
    await pack.configure({locked: false});
    const actors = await pack.getDocuments();
    const updates = [];
    const armor = new Set(Object.keys(CONFIG.SW5E.armorTypes));

    for ( const actor of actors ) {
        try {
            console.log(`Migrating ${actor.name}...`);
            const src = actor.toObject();
            const update = {_id: actor.id};

            // Perform the normal migration.
            _migrateActorAC(src, update);
            updates.push(update);

            // CASE 1: Armor is equipped
            const hasArmorEquipped = actor.itemTypes.equipment.some(e => {
                return armor.has(e.data.data.armor?.type) && e.data.data.equipped;
            });
            if ( hasArmorEquipped ) update["data.attributes.ac.calc"] = "default";

            // CASE 2: NPC Natural Armor
            else if ( src.type === "npc" ) update["data.attributes.ac.calc"] = "natural";
        } catch(e) {
            console.warn(`Failed to migrate armor class for Actor ${actor.name}`, e);
        }
    }

    await Actor.implementation.updateDocuments(updates, {pack: pack.collection});
    await pack.getDocuments(); // Force a re-prepare of all actors.
    await pack.configure({locked: wasLocked});
    console.log(`Migrated the AC of all Actors from Compendium ${pack.collection}`);
};

/* -------------------------------------------- */
/*  Document Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Migrate a single Actor document to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actor    The actor data object to update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}        The updateData to apply
 */
export const migrateActorData = async function(actor, migrationData) {
    const updateData = {};
    await _migrateTokenImage(actor, updateData, migrationData);

    // Actor Data Updates
    if (actor.data) {
        _migrateActorMovement(actor, updateData);
        _migrateActorSenses(actor, updateData);
        _migrateActorType(actor, updateData);
        _migrateActorAC(actor, updateData);
        if (["character", "npc"].includes(actor.type)) {
            _migrateActorAttribRank(actor, updateData);
        }
    }

    // Migrate embedded effects
    if ( actor.effects ) {
        const effects = migrateEffects(actor, migrationData);
        if ( effects.length > 0 ) updateData.effects = effects;
    }

    // Migrate Owned Items
    if ( !actor.items ) return updateData;
    const items = await actor.items.reduce(async (memo, i) => {
        const arr = await memo;
        // Migrate the Owned Item
        const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
        let itemUpdate = await migrateItemData(itemData, migrationData);

        // Prepared, Equipped, and Proficient for NPC actors
        if ( actor.type === "npc" ) {
            if (getProperty(itemData.data, "preparation.prepared") === false) itemUpdate["data.preparation.prepared"] = true;
                if (getProperty(itemData.data, "equipped") === false) itemUpdate["data.equipped"] = true;
                if (getProperty(itemData.data, "proficient") === false) itemUpdate["data.proficient"] = true;
            }

            // Update the Owned Item
        if ( !isObjectEmpty(itemUpdate) ) {
            itemUpdate._id = itemData._id;
            arr.push(expandObject(itemUpdate));
        }

        return arr;
    }, []);
    if ( items.length > 0 ) updateData.items = items;

    // Update NPC data with new datamodel information
    if (actor.type === "npc") {
        _updateNPCData(actor);
    }

    // migrate powers last since it relies on item classes being migrated first.
    if (["character", "npc"].includes(actor.type)) {
        _migrateActorPowers(actor, updateData);
    }

    return updateData;
};

/* -------------------------------------------- */

/**
 * Scrub an Actor's system data, removing all keys which are not explicitly defined in the system template
 * @param {object} actorData    The data object for an Actor
 * @returns {object}            The scrubbed Actor data
 */
// eslint-disable-next-line no-unused-vars -- We might want to still use this in later migrations.
function cleanActorData(actorData) {

    // Scrub system data
    const model = game.system.model.Actor[actorData.type];
    actorData.data = filterObject(actorData.data, model);

    // Scrub system flags
    const allowedFlags = CONFIG.SW5E.allowedActorFlags.reduce((obj, f) => {
        obj[f] = null;
        return obj;
    }, {});
    if ( actorData.flags.sw5e ) {
        actorData.flags.sw5e = filterObject(actorData.flags.sw5e, allowedFlags);
    }

    // Return the scrubbed data
    return actorData;
}


/* -------------------------------------------- */

/**
 * Migrate a single Item document to incorporate latest data model changes
 *
 * @param {object} item  Item data to migrate
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}     The updateData to apply
 */
export const migrateItemData = async function(item, migrationData) {
    const updateData = {};
    _migrateItemAttunement(item, updateData);
    _migrateItemRarity(item, updateData);
    _migrateItemClassPowerCasting(item, updateData);
    await _migrateItemPower(item, updateData);
    _migrateItemArmorType(item, updateData);
    _migrateItemCriticalData(item, updateData);
    await _migrateItemIcon(item, updateData, migrationData);
    _migrateItemArmorPropertiesData(item, updateData);
    _migrateItemWeaponPropertiesData(item, updateData);
    await _migrateItemModificationData(item, updateData, migrationData);
    _migrateItemBackgroundDescription(item, updateData);
    _migrateItemIdentifier(item, updateData);

    // Migrate embedded effects
    if ( item.effects ) {
        const effects = migrateEffects(item, migrationData);
        if ( effects.length > 0 ) updateData.effects = effects;
    }

    return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate any active effects attached to the provided parent.
 * @param {object} parent           Data of the parent being migrated.
 * @param {object} [migrationData]  Additional data to perform the migration.
 * @returns {object[]}              Updates to apply on the embedded effects.
 */
export const migrateEffects = function(parent, migrationData) {
    if ( !parent.effects ) return {};
    return parent.effects.reduce((arr, e) => {
        const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;
        let effectUpdate = migrateEffectData(effectData, migrationData);
        if ( !foundry.utils.isObjectEmpty(effectUpdate) ) {
            effectUpdate._id = effectData._id;
            arr.push(foundry.utils.expandObject(effectUpdate));
        }
        return arr;
    }, []);
};

/* -------------------------------------------- */

/**
 * Migrate the provided active effect data.
 * @param {object} effect           Effect data to migrate.
 * @param {object} [migrationData]  Additional data to perform the migration.
 * @returns {object}                The updateData to apply.
 */
export const migrateEffectData = function(effect, migrationData) {
    const updateData = {};
    _migrateEffectArmorClass(effect, updateData);
    return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single Macro document to incorporate latest data model changes.
 * @param {object} macro            Macro data to migrate
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply
 */
export const migrateMacroData = async function(macro, migrationData) {
    const updateData = {};
    await _migrateItemIcon(macro, updateData, migrationData);
    return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene   The Scene data to Update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}       The updateData to apply
 */
export const migrateSceneData = async function(scene, migrationData) {
    const tokens = await Promise.all(
        scene.tokens.map(async (token) => {
            const t = token.toObject();
            const update = {};
            await _migrateTokenImage(t, update, migrationData);

            if ( Object.keys(update).length ) foundry.utils.mergeObject(t, update);

            if ( !t.actorId || t.actorLink ) {
                t.actorData = {};
            }
            else if ( !game.actors.has(t.actorId) ) {
                t.actorId = null;
                t.actorData = {};
            }
            else if (!t.actorLink) {
                const actorData = duplicate(t.actorData);
                actorData.type = token.actor?.type;
                actorData.name = t.name;
                const update = await migrateActorData(actorData, migrationData);
                ["items", "effects"].forEach((embeddedName) => {
                    if (!update[embeddedName]?.length) return;
                    const updates = new Map(update[embeddedName].map(u => [u._id, u]));
                    t.actorData[embeddedName].forEach(original => {
                        const update = updates.get(original._id);
                        if (update) mergeObject(original, update);
                    });
                    delete update[embeddedName];
                });

                mergeObject(t.actorData, update);
            }
            return t;
        })
    );
    return {tokens};
};

/* -------------------------------------------- */

/**
 * Fetch bundled data for large-scale migrations.
 * @returns {Promise<object>}  Object mapping original system icons to their core replacements.
 */
export const getMigrationData = async function() {
    const data = {};
    try {
        const icons = await (await fetch("systems/sw5e/json/icon-migration.json")).json();
        data.iconMap = {};
        for ( const [old_path, new_path] of Object.entries(icons) ) {
            const slug = slugifyIcon(old_path);
            data.iconMap[slug] = new_path;
        }

        data.forcePowers = await (await game.packs.get("sw5e.forcepowers")).getDocuments();
        data.techPowers = await (await game.packs.get("sw5e.techpowers")).getDocuments();
        data.modifications = await (await game.packs.get("sw5e.modifications")).getDocuments();
    } catch(err) {
        console.warn(`Failed to retrieve migration data: ${err.message}`);
    }
    return data;
};

/* -------------------------------------------- */
/*  Low level migration utilities
/* -------------------------------------------- */

/* -------------------------------------------- */

/**
 * Update an NPC Actor's data based on compendium
 * @param {object} actor    The data object for an Actor
 * @returns {object}        The updated Actor
 */
function _updateNPCData(actor) {
    let actorData = actor.data;
    const updateData = {};
    // check for flag.core, if not there is no compendium monster so exit
    const hasSource = actor?.flags?.core?.sourceId !== undefined;
    if (!hasSource) return actor;
    // shortcut out if dataVersion flag is set to 1.2.4 or higher
    const hasDataVersion = actor?.flags?.sw5e?.dataVersion !== undefined;
    if (
        hasDataVersion &&
        (actor.flags.sw5e.dataVersion === "1.2.4" || isNewerVersion("1.2.4", actor.flags.sw5e.dataVersion))
    )
        return actor;
    // Check to see what the source of NPC is
    const sourceId = actor.flags.core.sourceId;
    const coreSource = sourceId.split(".").slice(0, 2).join(".");
    const core_id = sourceId.split(".").slice(2).join(".");
    if (coreSource === "Compendium.sw5e.monsters") {
        game.packs
            .get("sw5e.monsters")
            .getDocument(core_id)
            .then((monster) => {
                if (monster) {
                    const monsterData = monster.data.data;
                    // copy movement[], senses[], powercasting, force[], tech[], powerForceLevel, powerTechLevel
                    updateData["data.attributes.movement"] = monsterData.attributes.movement;
                    updateData["data.attributes.senses"] = monsterData.attributes.senses;
                    updateData["data.attributes.powercasting"] = monsterData.attributes.powercasting;
                    updateData["data.attributes.force"] = monsterData.attributes.force;
                    updateData["data.attributes.tech"] = monsterData.attributes.tech;
                    updateData["data.details.powerForceLevel"] = monsterData.details.powerForceLevel;
                    updateData["data.details.powerTechLevel"] = monsterData.details.powerTechLevel;
                    // push missing powers onto actor
                    const newPowers = [];
                    for (const i of monster.items) {
                        const itemData = i.data;
                        if (itemData.type === "power") {
                            const itemCompendium_id = itemData.flags?.core?.sourceId?.split(".")?.slice(-1)[0];
                            const hasPower = !!actor.items.find(
                                (item) => item.flags?.core?.sourceId?.split(".")?.slice(-1)[0] === itemCompendium_id
                            );
                            if (!hasPower) {
                                // Clone power to new object. Don't know if it is technically needed, but seems to prevent some weirdness.
                                const newPower = JSON.parse(JSON.stringify(itemData));

                                newPowers.push(newPower);
                            }
                        }
                    }

                    // get actor to create new powers
                    const liveActor = game.actors.get(actor._id);
                    // create the powers on the actor
                    liveActor.createEmbeddedDocuments("Item", newPowers);

                    // set flag to check to see if migration has been done so we don't do it again.
                    liveActor.setFlag("sw5e", "dataVersion", "1.2.4");
                } else {
                    updateData["flags"] = {core: {"-=sourceId": null}};
                }
            });
    }

    //merge object
    actorData = mergeObject(actorData, updateData);
    // Return the scrubbed data
    return actor;
}

/**
 * Migrate the actor speed string to movement object
 * @param {object} actorData   Actor data being migrated.
 * @param {object} updateData  Existing updates being applied to actor. *Will be mutated.*
 * @returns {object}           Modified version of update data.
 * @private
 */
function _migrateActorMovement(actorData, updateData) {
    const ad = actorData.data;

    // Work is needed if old data is present
    const old = actorData.type === "vehicle" ? ad?.attributes?.speed : ad?.attributes?.speed?.value;
    const hasOld = old !== undefined;
    if ( hasOld ) {
        // If new data is not present, migrate the old data
        const hasNew = ad?.attributes?.movement?.walk !== undefined;
        if ( !hasNew && (typeof old === "string") ) {
            const s = (old || "").split(" ");
            if ( s.length > 0 ) updateData["data.attributes.movement.walk"] = Number.isNumeric(s[0]) ? parseInt(s[0]) : null;
        }

        // Remove the old attribute
        updateData["data.attributes.-=speed"] = null;
    }
    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the actor powers if they are not present in the data model.
 * @private
 */
function _migrateActorPowers(actorData, updateData) {
    const ad = actorData.data;

    // If new Force & Tech data is not present, create it
    const hasNewAttrib = ad?.attributes?.force?.level !== undefined;
    if ( !hasNewAttrib ) {
        updateData["data.attributes.force.known.value"] = 0;
        updateData["data.attributes.force.known.max"] = 0;
        updateData["data.attributes.force.points.value"] = 0;
        updateData["data.attributes.force.points.min"] = 0;
        updateData["data.attributes.force.points.max"] = 0;
        updateData["data.attributes.force.points.temp"] = null;
        updateData["data.attributes.force.points.tempmax"] = null;
        updateData["data.attributes.force.level"] = 0;
        updateData["data.attributes.tech.known.value"] = 0;
        updateData["data.attributes.tech.known.max"] = 0;
        updateData["data.attributes.tech.points.value"] = 0;
        updateData["data.attributes.tech.points.min"] = 0;
        updateData["data.attributes.tech.points.max"] = 0;
        updateData["data.attributes.tech.points.temp"] = null;
        updateData["data.attributes.tech.points.tempmax"] = null;
        updateData["data.attributes.tech.level"] = 0;
    }

    // If new Power F/T split data is not present, create it
    const hasNewLimit = ad?.powers?.power1?.foverride !== undefined;
    if ( !hasNewLimit ) {
        for (let i = 1; i <= 9; i++) {
            // add new
            updateData["data.powers.power" + i + ".fvalue"] = ad?.powers?.["power" + i]?.value ?? 0;
            updateData["data.powers.power" + i + ".fmax"] = ad?.powers?.["power" + i]?.max ?? 0;
            updateData["data.powers.power" + i + ".foverride"] = null;
            updateData["data.powers.power" + i + ".tvalue"] = ad?.powers?.["power" + i]?.value ?? 0;
            updateData["data.powers.power" + i + ".tmax"] = ad?.powers?.["power" + i]?.max ?? 0;
            updateData["data.powers.power" + i + ".toverride"] = null;
            //remove old
            updateData["data.powers.power" + i + ".-=value"] = null;
            updateData["data.powers.power" + i + ".-=override"] = null;
        }
    }
    // If new Bonus Power DC data is not present, create it
    const hasNewBonus = ad?.bonuses?.power?.forceLightDC !== undefined;
    if ( !hasNewBonus ) {
        updateData["data.bonuses.power.forceLightDC"] = "";
        updateData["data.bonuses.power.forceDarkDC"] = "";
        updateData["data.bonuses.power.forceUnivDC"] = "";
        updateData["data.bonuses.power.techDC"] = "";
    }

    // Remove the Power DC Bonus
    updateData["data.bonuses.power.-=dc"] = null;

    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the actor traits.senses string to attributes.senses object
 * @param {object} actor       Actor data being migrated.
 * @param {object} updateData  Existing updates being applied to actor. *Will be mutated.*
 * @returns {object}           Modified version of update data.
 * @private
 */
function _migrateActorSenses(actor, updateData) {
    const ad = actor.data;
    if ( ad?.traits?.senses === undefined ) return;
    const original = ad.traits.senses || "";
    if ( typeof original !== "string" ) return;

    // Try to match old senses with the format like "Darkvision 60 ft, Blindsight 30 ft"
    const pattern = /([A-z]+)\s?([0-9]+)\s?([A-z]+)?/;
    let wasMatched = false;

    // Match each comma-separated term
    for ( let s of original.split(",") ) {
        s = s.trim();
        const match = s.match(pattern);
        if ( !match ) continue;
        const type = match[1].toLowerCase();
        if ( type in CONFIG.SW5E.senses ) {
            updateData[`data.attributes.senses.${type}`] = Number(match[2]).toNearest(0.5);
            wasMatched = true;
        }
    }

    // If nothing was matched, but there was an old string - put the whole thing in "special"
    if ( !wasMatched && original ) {
        updateData["data.attributes.senses.special"] = original;
    }

    // Remove the old traits.senses string once the migration is complete
    updateData["data.traits.-=senses"] = null;
    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the actor details.type string to object
 * @param {object} actor       Actor data being migrated.
 * @param {object} updateData  Existing updates being applied to actor. *Will be mutated.*
 * @returns {object}           Modified version of update data.
 * @private
 */
function _migrateActorType(actor, updateData) {
    const ad = actor.data;
    const original = ad.details?.type;
    if ( typeof original !== "string" ) return;

    // New default data structure
    let data = {
        value: "",
        subtype: "",
        swarm: "",
        custom: ""
    };

    // Specifics
    // (Some of these have weird names, these need to be addressed individually)
    if (original === "force entity") {
        data.value = "force";
        data.subtype = "storm";
    } else if (original === "human") {
        data.value = "humanoid";
        data.subtype = "human";
    } else if (["humanoid (any)", "humanoid (Villainous"].includes(original)) {
        data.value = "humanoid";
    } else if (original === "tree") {
        data.value = "plant";
        data.subtype = "tree";
    } else if (original === "(humanoid) or Large (beast) force entity") {
        data.value = "force";
    } else if (original === "droid (appears human)") {
        data.value = "droid";
    } else {
        // Match the existing string
        const pattern = /^(?:swarm of (?<size>[\w-]+) )?(?<type>[^(]+?)(?:\((?<subtype>[^)]+)\))?$/i;
        const match = original.trim().match(pattern);
        if ( match ) {
            // Match a known creature type
            const typeLc = match.groups.type.trim().toLowerCase();
            const typeMatch = Object.entries(CONFIG.SW5E.creatureTypes).find(([k, v]) => {
                return (typeLc === k)
                    || (typeLc === game.i18n.localize(v).toLowerCase())
                    || (typeLc === game.i18n.localize(`${v}Pl`).toLowerCase());
            });
            if (typeMatch) data.value = typeMatch[0];
            else {
                data.value = "custom";
                data.custom = match.groups.type.trim().titleCase();
            }
            data.subtype = match.groups.subtype?.trim().titleCase() || "";

            // Match a swarm
            const isNamedSwarm = actor.name.startsWith(game.i18n.localize("SW5E.CreatureSwarm"));
            if ( match.groups.size || isNamedSwarm ) {
                const sizeLc = match.groups.size ? match.groups.size.trim().toLowerCase() : "tiny";
                const sizeMatch = Object.entries(CONFIG.SW5E.actorSizes).find(([k, v]) => {
                    return (sizeLc === k) || (sizeLc === game.i18n.localize(v).toLowerCase());
                });
                data.swarm = sizeMatch ? sizeMatch[0] : "tiny";
            }
            else data.swarm = "";
        }

        // No match found
        else {
            data.value = "custom";
            data.custom = original;
        }
    }

    // Update the actor data
    updateData["data.details.type"] = data;
    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the actor attributes.ac.value to the new ac.flat override field.
 * @param {object} actorData   Actor data being migrated.
 * @param {object} updateData  Existing updates being applied to actor. *Will be mutated.*
 * @returns {object}           Modified version of update data.
 * @private
 */
function _migrateActorAC(actorData, updateData) {
    const ac = actorData.data?.attributes?.ac;
    // If the actor has a numeric ac.value, then their AC has not been migrated to the auto-calculation schema yet.
    if ( Number.isNumeric(ac?.value) ) {
        updateData["data.attributes.ac.flat"] = parseInt(ac.value);
        updateData["data.attributes.ac.calc"] = actorData.type === "npc" ? "natural" : "flat";
        updateData["data.attributes.ac.-=value"] = null;
        return updateData;
    }

    // Migrate ac.base in custom formulas to ac.armor
    if ( (typeof ac?.formula === "string") && ac?.formula.includes("@attributes.ac.base") ) {
        updateData["data.attributes.ac.formula"] = ac.formula.replaceAll("@attributes.ac.base", "@attributes.ac.armor");
    }

    // Protect against string values created by character sheets or importers that don't enforce data types
    if ( (typeof ac?.flat === "string") && Number.isNumeric(ac.flat) ) {
        updateData["data.attributes.ac.flat"] = parseInt(ac.flat);
    }

    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the actor to have Rank Deployment attributes
 * @private
 */
function _migrateActorAttribRank(actorData, updateData) {
    const ad = actorData.data;

    // If Rank data is present, remove it
    const v1 = ad?.attributes?.rank !== undefined;
    const v2 = ad?.attributes?.ranks !== undefined;
    if ( v1 ) updateData["data.attributes.-=rank"] = null;
    if ( v2 ) updateData["data.attributes.-=ranks"] = null;

    return updateData;
}

/* --------------------------------------------- */



/**
 * Update an Power Item's data based on compendium
 * @param {Object} item    The data object for an item
 * @private
 */
async function _migrateItemPower(item, updateData) {
    // if item is not a power shortcut out
    if (item.type !== "power") return updateData;

    const actor = item.parent;
    if (actor) console.log(`Checking Actor ${actor.name}'s ${item.name} for migration needs`);
    else console.log(`Checking ${item.name} for migration needs`);
    // check for flag.core, if not there is no compendium power so exit
    const hasSource = item?.flags?.core?.sourceId !== undefined;
    if (!hasSource) return updateData;

    // shortcut out if dataVersion flag is set to 1.2.4 or higher
    const hasDataVersion = item?.flags?.sw5e?.dataVersion !== undefined;
    if (
        hasDataVersion &&
        (item.flags.sw5e.dataVersion === "1.2.4" || isNewerVersion("1.2.4", item.flags.sw5e.dataVersion))
    )
        return updateData;

    // Check to see what the source of Power is
    const sourceId = item.flags.core.sourceId;
    const coreSource = sourceId.split(".").slice(0, 2).join(".");
    const core_id = sourceId.split(".").slice(2).join(".");

    //if power type is not force or tech  exit out
    let powerType = "none";
    if (coreSource === "Compendium.sw5e.forcepowers") powerType = "forcepowers";
    if (coreSource === "Compendium.sw5e.techpowers") powerType = "techpowers";
    if (powerType === "none") return updateData;

    const corePower = duplicate(updateData[coreSource].find((p) => p.id === core_id));
    if (corePower) {
        if (actor) console.log(`Updating Actor ${actor.name}'s ${item.name} from compendium`);
        else console.log(`Updating ${item.name} from compendium`);
        const corePowerData = corePower.data;
        // copy Core Power Data over original Power
        updateData["data"] = corePowerData;
        updateData["flags"] = {sw5e: {dataVersion: "1.2.4"}};
    } else {
        if (actor) console.error(`Update failed, couldn't find Actor ${actor.name}'s ${item.name} in compendium`);
        else console.error(`Update failed, couldn't find ${item.name} in compendium`);
        updateData["flags"] = {core: {"-=sourceId": null}};
    }

    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate any system token images from PNG to WEBP.
 * @param {object} actorData    Actor or token data to migrate.
 * @param {object} updateData   Existing update to expand upon.
 * @param {object<string, string>} [migrationData.iconMap]  A mapping of system icons to core foundry icons
 * @returns {object}            The updateData to apply
 * @private
 */
async function _migrateTokenImage(actorData, updateData, {iconMap}={}) {
    const prefix = "systems/sw5e/packs/Icons/";

    for ( let prop of ["img", "token.img"] ) {
        const path = foundry.utils.getProperty(actorData, prop);

        if ( !path?.startsWith(prefix) ) return;

        const img = path.substring(prefix.length);
        let slug = slugifyIcon(img);

        if ( iconMap && ( slug in iconMap ) ) slug = iconMap[slug];

        if ( slug !== img ) {
            const icon = await fetch(prefix + slug);
            if (icon.ok) updateData[prop] = prefix + slug;
        }
    }

    return updateData;
}

/* -------------------------------------------- */


/**
 * Delete the old data.attuned boolean.
 * @param {object} item        Item data to migrate
 * @param {object} updateData  Existing update to expand upon
 * @returns {object}           The updateData to apply
 * @private
 */
function _migrateItemAttunement(item, updateData) {
    if ( item.data?.attuned === undefined ) return updateData;
    updateData["data.attunement"] = CONFIG.SW5E.attunementTypes.NONE;
    updateData["data.-=attuned"] = null;
    return updateData;
}

/* -------------------------------------------- */

/**
 * Attempt to migrate item rarity from freeform string to enum value.
 * @param {object} item        Item data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 * @private
 */
function _migrateItemRarity(item, updateData) {
    if ( item.data?.rarity === undefined ) return updateData;
    const rarity = Object.keys(CONFIG.SW5E.itemRarity).find(key =>
        (CONFIG.SW5E.itemRarity[key].toLowerCase() === item.data.rarity.toLowerCase()) || (key === item.data.rarity)
    );
    updateData["data.rarity"] = rarity ?? "";
    return updateData;
}

/* -------------------------------------------- */

/**
 * Replace class powercasting string to object.
 * @param {object} item        Item data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 * @private
 */
function _migrateItemClassPowerCasting(item, updateData) {
    if ( !["class", "archetype"].includes(item.type) ) {
        const powercasting = item.data.powercasting;
        if ( item.data.classCasterType !== undefined ) updateData["data.-=classCasterType"] = null;
        if ( foundry.utils.getType(powercasting) === "Object" ) {
            if (powercasting.progression === undefined) return updateData;
            switch (powercasting.progression) {
                case "consular":
                    updateData["data.powercasting.force"] = "full";
                    break;
                case "engineer":
                    updateData["data.powercasting.tech"] = "full";
                    break;
                case "guardian":
                    updateData["data.powercasting.force"] = "half";
                    break;
                case "scout":
                    updateData["data.powercasting.tech"] = "half";
                    break;
                case "sentinel":
                    updateData["data.powercasting.force"] = "3/4";
                    break;
            }
            updateData["data.powercasting.-=progression"] = null;
            updateData["data.powercasting.-=ability"] = null;
        }
        else {
            updateData["data.powercasting"] = {
                force: "none",
                tech: "none"
            };
        }
    }
    return updateData;
}

/* --------------------------------------------- */

/**
 * Convert equipment items of type 'bonus' to 'trinket'.
 * @param {object} item        Item data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 * @private
 */
function _migrateItemArmorType(item, updateData) {
    if ( item.type !== "equipment" ) return updateData;
    if ( item.data?.armor?.type === "bonus" ) updateData["data.armor.type"] = "trinket";
    return updateData;
}

/* -------------------------------------------- */

/**
 * Set the item's `critical` property to a proper object value.
 * @param {object} item        Item data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 * @private
 */
function _migrateItemCriticalData(item, updateData) {
    const hasCritData = game.system.template.Item[item.type]?.templates?.includes("action");
    if ( !hasCritData || (foundry.utils.getType(item.data.critical) === "Object") ) return updateData;
    updateData["data.critical"] = {
        threshold: null,
        damage: null
    };
    return updateData;
}

/* -------------------------------------------- */

/**
 * Convert icon paths to the new standard.
 * @param {object} item                                     Item data to migrate
 * @param {object} updateData                               Existing update to expand upon
 * @param {object} [migrationData={}]                       Additional data to perform the migration
 * @param {object<string, string>} [migrationData.iconMap]  A mapping of system icons to core foundry icons
 * @returns {object}                                        The updateData to apply
 * @private
 */
async function _migrateItemIcon(item, updateData, {iconMap}={}) {
    const prefix = "systems/sw5e/packs/Icons/";
    if ( !item.img?.startsWith(prefix) ) return updateData;

    const img = item.img.substring(prefix.length);
    let slug = slugifyIcon(img);

    if ( iconMap && ( slug in iconMap ) ) slug = iconMap[slug];

    if ( slug !== img ) {
        const icon = await fetch(prefix + slug);
        if (icon.ok) updateData.img = prefix + slug;
    }

    return updateData;
}

/* -------------------------------------------- */

/**
 * Set the item's armor properties to a proper object value.
 * @param {object} item        Item data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 * @private
 */
function _migrateItemArmorPropertiesData(item, updateData) {
    if (item.type !== "equipment") return updateData;
    const hasProperties = item.data?.properties !== undefined;
    if (!hasProperties) return updateData;

    const props = item.data.properties;
    let configProp = {};
    if (item.data?.armor?.type in CONFIG.SW5E.castingEquipmentTypes) configProp = CONFIG.SW5E.castingProperties;
    else if (item.data?.armor?.type in CONFIG.SW5E.armorTypes) configProp = CONFIG.SW5E.armorProperties;

    // Remove existing properties not in current template
    for ( const key in props ) {
        if ( !( key in configProp ) ) updateData[`data.properties.-=${key}`] = null;
    }

    // Add template properties that don't exist yet on current weapon
    for ( const [key, prop] of Object.entries(configProp) ) {
        if ( !( key in props ) ) updateData[`data.properties.${key}`] = prop.type === "Boolean" ? false : null;
    }

    // Migrate from boolean to number
    for ( const [key, prop] of Object.entries(configProp) ) {
        if ( prop.type === "Number" && foundry.utils.getType(props[key]) !== "Number" ) {
            updateData[`data.properties.${key}`] = props[key] ? ( prop.min ?? 1 ) : null;
        }
    }

    return updateData;
}

/* -------------------------------------------- */

/**
 * Set the item's weapon properties to a proper object value.
 * @param {object} item        Item data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 * @private
 */
function _migrateItemWeaponPropertiesData(item, updateData) {
    if ( !( item.type === "weapon" || ( item.type === "consumable" && item.data.consumableType === "ammo" ) ) ) return updateData;
    const hasProperties = item.data?.properties !== undefined;
    if ( !hasProperties ) return updateData;

    const props = item.data.properties;
    const isStarship = item.data.weaponType in CONFIG.SW5E.weaponStarshipTypes || item.data.consumableType in CONFIG.SW5E.ammoStarshipTypes;
    const configProp = isStarship ? CONFIG.SW5E.weaponFullStarshipProperties : CONFIG.SW5E.weaponFullCharacterProperties;

    // Remove existing properties not in current template
    for ( const key in props ) {
        if ( !( key in configProp ) ) updateData[`data.properties.-=${key}`] = null;
    }

    // Add template properties that don't exist yet on current weapon
    for ( const [key, prop] of Object.entries(configProp) ) {
        if ( !( key in props ) ) updateData[`data.properties.${key}`] = prop.type === "Boolean" ? false : null;
    }

    // Migrate from boolean to number
    for ( const [key, prop] of Object.entries(configProp) ) {
        if ( prop.type === "Number" && foundry.utils.getType(props[key]) !== "Number" ) {
            updateData[`data.properties.${key}`] = props[key] ? ( prop.min ?? 1 ) : null;
        }
    }

    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the item's modifications to the newer system.
 * @param {object} item             Item data to migrate.
 * @param {Object} actor            The data object for the actor owning the item
 * @param {object} updateData       Existing update to expand upon.
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply.
 * @private
 */
async function _migrateItemModificationData(item, updateData, migrationData) {
    if (item.type === "modification") {
        if (item.data.modified !== undefined) updateData["data.-=modified"] = null;
    } else if (item.data.modifications !== undefined) {
        const itemMods = item.data.modifications;
        updateData[`data.-=modifications`] = null;

        if (itemMods.chassisType !== undefined) updateData["data.modify.chassis"] = itemMods.chassisType;
        if (itemMods.augmentSlots !== undefined) updateData["data.modify.augmentSlots"] = itemMods.augmentSlots;
        if (itemMods.type !== undefined) updateData["data.modify.type"] = itemMods.type;
        if (itemMods.overrides !== undefined) updateData["data.modify.overrides"] = itemMods.overrides;

        const items = [];
        for (const mod_data of Object.values(itemMods.mods).concat(itemMods.augments)) {
            if (!mod_data?.uuid) continue;
            const mod = migrationData.modifications.find((m) => m.uuid === mod_data.uuid);
            if (!mod) continue;
            const modType = (mod.data.data.modificationType === "augment") ? "augment" : "mod";
            const data = mod.toObject();
            delete data._id;
            items.push({
                data: data,
                name: mod.name,
                type: modType,
                disabled: mod_data.disabled
            });
        }
        if (items.length) updateData["data.modify.items"] = items;
    }

    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate background description.
 * @param {object} item        Background data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 */
function _migrateItemBackgroundDescription(item, updateData) {
    if ( item.type !== "background" ) return updateData;
    if ( [item.data.flavorText, item.data.flavorName, item.data.flavorDescription, item.data.flavorOptions].every(attr => attr === undefined) ) return updateData;
    if ( item.data.flavorText !== undefined ) updateData["data.-=flavorText"] = null
    if ( item.data.flavorName !== undefined ) updateData["data.-=flavorName"] = null
    if ( item.data.flavorDescription !== undefined ) updateData["data.-=flavorDescription"] = null
    if ( item.data.flavorOptions !== undefined ) updateData["data.-=flavorOptions"] = null

    let text = "";

    if ( item.data.flavorText ) text +=
        `<div class="background">\n` +
        `  <p>\n` +
        `      ${item.data.flavorText.value}\n` +
        `  </p>\n` +
        `</div>\n`
    if ( item.data.skillProficiencies ) text +=
        `<div class="background">\n` +
        `  <p><strong>Skill Proficiencies:</strong> ${item.data.skillProficiencies.value}</p>\n` +
        `</div>\n`
    if ( item.data.toolProficiencies ) text +=
        `<div class="background">\n` +
        `  <p><strong>Tool Proficiencies:</strong> ${item.data.toolProficiencies.value}</p>\n` +
        `</div>\n`
    if ( item.data.languages ) text +=
        `<div class="background">\n` +
        `  <p><strong>Languages:</strong> ${item.data.languages.value}</p>\n` +
        `</div>\n`
    if ( item.data.equipment ) text +=
        `<div class="background">\n` +
        `  <p><strong>Equipment:</strong> ${item.data.equipment}</p>\n` +
        `</div>\n`
    if ( item.data.flavorName && item.data.flavorDescription && item.data.flavorOptions ) text +=
        `<div class="background"><h3>${item.data.flavorName.value}</h3></div>\n` +
        `<div class="background"><p>${item.data.flavorDescription.value}</p></div>\n` +
        `<div class="smalltable">\n` +
        `  <p>\n` +
        `      ${item.data.flavorOptions.value}\n` +
        `  </p>\n` +
        `</div>\n`
    if ( item.data.featureName && item.data.featureText ) text +=
        `<div class="background"><h2>Feature: ${item.data.featureName.value}</h2></div>\n` +
        `<div class="background"><p>${item.data.featureText.value}</p></div>`
    if ( item.data.featOptions ) text +=
        `<h2>Background Feat</h2>\n` +
        `<p>\n` +
        `  As a further embodiment of the experience and training of your background, you can choose from the\n` +
        `  following feats:\n` +
        `</p>\n` +
        `<div class="smalltable">\n` +
        `  <p>\n` +
        `      ${item.data.featOptions.value}\n` +
        `  </p>\n` +
        `</div>\n`
    if ( item.data.personalityTraitOptions || item.data.idealOptions || item.data.flawOptions || item.data.bondOptions ) {
        text +=
            `<div class="background"><h2>Suggested Characteristics</h2></div>\n`
        if ( item.data.personalityTraitOptions ) text +=
            `<div class="medtable">\n` +
            `  <p>\n` +
            `      ${item.data.personalityTraitOptions.value}\n` +
            `  </p>\n` +
            `</div>\n` +
            `<p>&nbsp;</p>`
        if ( item.data.idealOptions ) text +=
            `<div class="medtable">\n` +
            `  <p>\n` +
            `      ${item.data.idealOptions.value}\n` +
            `  </p>\n` +
            `</div>\n` +
            `<p>&nbsp;</p>`
        if ( item.data.flawOptions ) text +=
            `<div class="medtable">\n` +
            `  <p>\n` +
            `      ${item.data.flawOptions.value}\n` +
            `  </p>\n` +
            `</div>\n` +
            `<p>&nbsp;</p>`
        if ( item.data.bondOptions ) text +=
            `<div class="medtable">\n` +
            `  <p>\n` +
            `      ${item.data.bondOptions.value}\n` +
            `  </p>\n` +
            `</div>\n`
    }

    if ( text ) updateData["data.description.value"] = text;

    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate archetype className into classIdentifier.
 * @param {object} item        Archetype data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 */
function _migrateItemIdentifier(item, updateData) {
    if ( item.type !== "archetype" ) return updateData;
    if ( item.data.className === undefined ) return updateData;

    updateData["data.-=className"] = null;
    updateData["data.classIdentifier"] = item.data.className.slugify({strict: true});

    return updateData;
}

/* -------------------------------------------- */

/**
 * Update an actor's item's modifications to new standard
 * @param {object} actor    The data object for an Actor
 * @param {object} items    The data object for the updated Items
 * @returns {object}        The updated Actor
 */
async function _updateActorModificationData(actor, items) {
    const liveActor = game.actors.get(actor._id);
    for (const item of items) {
        for (const mod of item?.data?.modify?.items || []) {
            if (!mod.id && mod.data) {
                const data = foundry.utils.duplicate(mod.data);
                data.data.modifying.id = item._id;
                const result = await liveActor.createEmbeddedDocuments("Item", [data]);
                if (result.length) mod.id = result[0].id;
            }
        }
    }
}


/* -------------------------------------------- */

/**
 * Change active effects that target AC.
 * @param {object} effect      Effect data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 */
function _migrateEffectArmorClass(effect, updateData) {
    let containsUpdates = false;
    const changes = effect.changes.map(c => {
        if ( c.key !== "data.attributes.ac.base" ) return c;
        c.key = "data.attributes.ac.armor";
        containsUpdates = true;
        return c;
    });
    if ( containsUpdates ) updateData.changes = changes;
    return updateData;
}

/* -------------------------------------------- */

/**
 * A general tool to purge flags from all documents in a Compendium pack.
 * @param {CompendiumCollection} pack   The compendium pack to clean.
 * @private
 */
export async function purgeFlags(pack) {
    const cleanFlags = flags => {
        const flags5e = flags.sw5e || null;
        return flags5e ? {sw5e: flags5e} : {};
    };
    await pack.configure({locked: false});
    const content = await pack.getDocuments();
    for ( let doc of content ) {
        const update = {flags: cleanFlags(doc.data.flags)};
        if ( pack.documentName === "Actor" ) {
            update.items = doc.data.items.map(i => {
                i.flags = cleanFlags(i.flags);
                return i;
            });
        }
        await doc.update(update, {recursive: false});
        console.log(`Purged flags from ${doc.name}`);
    }
    await pack.configure({locked: true});
}

/* -------------------------------------------- */


/**
 * Purge the data model of any inner objects which have been flagged as _deprecated.
 * @param {object} data   The data to clean.
 * @returns {object}      Cleaned data.
 * @private
 */
export function removeDeprecatedObjects(data) {
    for ( let [k, v] of Object.entries(data) ) {
        if ( getType(v) === "Object" ) {
            if (v._deprecated === true) {
                console.log(`Deleting deprecated object key ${k}`);
                delete data[k];
            }
            else removeDeprecatedObjects(v);
        }
    }
    return data;
}
