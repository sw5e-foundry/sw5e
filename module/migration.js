import {SW5E} from "./config.js";

/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @returns {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function () {
    ui.notifications.info(
        `Applying SW5e System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`,
        {permanent: true}
    );
    // Migrate World Actors
    for await (const a of game.actors) {
        try {
            console.log(`Checking Actor document ${a.name} for migration needs`);
            const updateData = await migrateActorData(a.toObject());
            if (!foundry.utils.isObjectEmpty(updateData)) {
                console.log(`Migrating Actor document ${a.name}`);
                await a.update(updateData, {enforceTypes: false});
            }
        } catch (err) {
            err.message = `Failed sw5e system migration for Actor ${a.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Items
    for (const i of game.items) {
        try {
            const updateData = await migrateItemData(i.toObject());
            if (!foundry.utils.isObjectEmpty(updateData)) {
                console.log(`Migrating Item document ${i.name}`);
                await i.update(updateData, {enforceTypes: false});
            }
        } catch (err) {
            err.message = `Failed sw5e system migration for Item ${i.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate Actor Override Tokens
    for (const s of game.scenes) {
        try {
            const updateData = await migrateSceneData(s.data);
            if (!foundry.utils.isObjectEmpty(updateData)) {
                console.log(`Migrating Scene document ${s.name}`);
                await s.update(updateData, {enforceTypes: false});
                // If we do not do this, then synthetic token actors remain in cache
                // with the un-updated actorData.
                s.tokens.forEach((t) => (t._actor = null));
            }
        } catch (err) {
            err.message = `Failed sw5e system migration for Scene ${s.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Compendium Packs
    for (const p of game.packs) {
        if (p.metadata.package !== "world") continue;
        if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
        await migrateCompendium(p);
    }

    // Set the migration as complete
    game.settings.set("sw5e", "systemMigrationVersion", game.system.data.version);
    ui.notifications.info(`SW5e System Migration to version ${game.system.data.version} completed!`, {permanent: true});
};

/* -------------------------------------------- */

/**
 * Apply migration rules to all Documents within a single Compendium pack
 * @param {CompendiumCollection} pack  Pack to be migrated.
 * @returns {Promise}
 */
export const migrateCompendium = async function (pack) {
    const documentName = pack.documentName;
    if (!["Actor", "Item", "Scene"].includes(documentName)) return;

    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const documents = await pack.getDocuments();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for await (const doc of documents) {
        let updateData = {};
        try {
            switch (documentName) {
                case "Actor":
                    updateData = await migrateActorData(doc.toObject());
                    break;
                case "Item":
                    updateData = migrateItemData(doc.toObject());
                    break;
                case "Scene":
                    updateData = await migrateSceneData(doc.data);
                    break;
            }

            // Save the entry, if data was changed
            if (foundry.utils.isObjectEmpty(updateData)) continue;
            await doc.update(updateData);
            console.log(`Migrated ${documentName} document ${doc.name} in Compendium ${pack.collection}`);
        } catch (err) {
            // Handle migration failures
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
export const migrateArmorClass = async function (pack) {
    if (typeof pack === "string") pack = game.packs.get(pack);
    if (pack.documentName !== "Actor") return;
    const wasLocked = pack.locked;
    await pack.configure({locked: false});
    const actors = await pack.getDocuments();
    const updates = [];
    const armor = new Set(Object.keys(CONFIG.SW5E.armorTypes));

    for (const actor of actors) {
        try {
            console.log(`Migrating ${actor.name}...`);
            const src = actor.toObject();
            const update = {_id: actor.id};

            // Perform the normal migration.
            _migrateActorAC(src, update);
            updates.push(update);

            // CASE 1: Armor is equipped
            const hasArmorEquipped = actor.itemTypes.equipment.some((e) => {
                return armor.has(e.data.data.armor?.type) && e.data.data.equipped;
            });
            if (hasArmorEquipped) update["data.attributes.ac.calc"] = "default";
            // CASE 2: NPC Natural Armor
            else if (src.type === "npc") update["data.attributes.ac.calc"] = "natural";
        } catch (e) {
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
 * @returns {object}        The updateData to apply
 */
export const migrateActorData = async function (actor) {
    const updateData = {};

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

    // Migrate Owned Items
    if (!!actor.items) {
        const items = await actor.items.reduce(async (memo, i) => {
            const results = await memo;

            // Migrate the Owned Item
            const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
            const itemUpdate = await migrateActorItemData(itemData, actor);

            // Prepared, Equipped, and Proficient for NPC actors
            if (actor.type === "npc") {
                if (getProperty(itemData.data, "preparation.prepared") === false)
                    itemUpdate["data.preparation.prepared"] = true;
                if (getProperty(itemData.data, "equipped") === false) itemUpdate["data.equipped"] = true;
                if (getProperty(itemData.data, "proficient") === false) itemUpdate["data.proficient"] = true;
            }

            // Update the Owned Item
            if (!isObjectEmpty(itemUpdate)) {
                itemUpdate._id = itemData._id;
                console.log(`Migrating Actor ${actor.name}'s ${i.name}`);
                results.push(expandObject(itemUpdate));
            }

            return results;
        }, []);

        if (items.length > 0) updateData.items = items;
    }

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
    if (actorData.flags.sw5e) {
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
 * @returns {object}     The updateData to apply
 */
export const migrateItemData = async function (item) {
    const updateData = {};
    _migrateItemClassPowerCasting(item, updateData);
    _migrateItemAttunement(item, updateData);
    _migrateItemRarity(item, updateData);
    await _migrateItemPower(item, null, updateData);
    _migrateItemArmorType(item, updateData);
    _migrateItemCriticalData(item, updateData);
    _migrateItemArmorPropertiesData(item, updateData);
    _migrateItemWeaponPropertiesData(item, updateData);
    await _migrateItemModificationData(item, null, updateData);
    return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single owned actor Item document to incorporate latest data model changes
 * @param item
 * @param actor
 */
export const migrateActorItemData = async function (item, actor) {
    const updateData = {};
    _migrateItemClassPowerCasting(item, updateData);
    _migrateItemAttunement(item, updateData);
    _migrateItemRarity(item, updateData);
    await _migrateItemPower(item, actor, updateData);
    _migrateItemArmorType(item, updateData);
    _migrateItemCriticalData(item, updateData);
    _migrateItemArmorPropertiesData(item, updateData);
    _migrateItemWeaponPropertiesData(item, updateData);
    await _migrateItemModificationData(item, actor, updateData);
    return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene   The Scene data to Update
 * @returns {object}       The updateData to apply
 */
export const migrateSceneData = async function (scene) {
    const tokens = await Promise.all(
        scene.tokens.map(async (token) => {
            const t = token.toObject();
            const update = {};
            if (Object.keys(update).length) foundry.utils.mergeObject(t, update);

            if (!t.actorId || t.actorLink) {
                t.actorData = {};
            } else if (!game.actors.has(t.actorId)) {
                t.actorId = null;
                t.actorData = {};
            } else if (!t.actorLink) {
                const actorData = duplicate(t.actorData);
                actorData.type = token.actor?.type;
                actorData.name = t.name;
                const update = await migrateActorData(actorData);
                ["items", "effects"].forEach((embeddedName) => {
                    if (!update[embeddedName]?.length) return;
                    const updates = new Map(update[embeddedName].map((u) => [u._id, u]));
                    t.actorData[embeddedName].forEach((original) => {
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
    if (hasOld) {
        // If new data is not present, migrate the old data
        const hasNew = ad?.attributes?.movement?.walk !== undefined;
        if (!hasNew && typeof old === "string") {
            const s = (old || "").split(" ");
            if (s.length > 0)
                updateData["data.attributes.movement.walk"] = Number.isNumeric(s[0]) ? parseInt(s[0]) : null;
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
    if (!hasNewAttrib) {
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
    if (!hasNewLimit) {
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
    if (!hasNewBonus) {
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
    if (ad?.traits?.senses === undefined) return;
    const original = ad.traits.senses || "";
    if (typeof original !== "string") return;

    // Try to match old senses with the format like "Darkvision 60 ft, Blindsight 30 ft"
    const pattern = /([A-z]+)\s?([0-9]+)\s?([A-z]+)?/;
    let wasMatched = false;

    // Match each comma-separated term
    for (const s of original.split(",")) {
        s = s.trim();
        const match = s.match(pattern);
        if (!match) continue;
        const type = match[1].toLowerCase();
        if (type in CONFIG.SW5E.senses) {
            updateData[`data.attributes.senses.${type}`] = Number(match[2]).toNearest(0.5);
            wasMatched = true;
        }
    }

    // If nothing was matched, but there was an old string - put the whole thing in "special"
    if (!wasMatched && !!original) {
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
    if (typeof original !== "string") return;

    // New default data structure
    const data = {
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
        if (match) {
            // Match a known creature type
            const typeLc = match.groups.type.trim().toLowerCase();
            const typeMatch = Object.entries(CONFIG.SW5E.creatureTypes).find(([k, v]) => {
                return (
                    typeLc === k ||
                    typeLc === game.i18n.localize(v).toLowerCase() ||
                    typeLc === game.i18n.localize(`${v}Pl`).toLowerCase()
                );
            });
            if (typeMatch) data.value = typeMatch[0];
            else {
                data.value = "custom";
                data.custom = match.groups.type.trim().titleCase();
            }
            data.subtype = match.groups.subtype?.trim().titleCase() || "";

            // Match a swarm
            const isNamedSwarm = actor.name.startsWith(game.i18n.localize("SW5E.CreatureSwarm"));
            if (match.groups.size || isNamedSwarm) {
                const sizeLc = match.groups.size ? match.groups.size.trim().toLowerCase() : "tiny";
                const sizeMatch = Object.entries(CONFIG.SW5E.actorSizes).find(([k, v]) => {
                    return sizeLc === k || sizeLc === game.i18n.localize(v).toLowerCase();
                });
                data.swarm = sizeMatch ? sizeMatch[0] : "tiny";
            } else data.swarm = "";
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
    if (Number.isNumeric(ac?.value)) {
        updateData["data.attributes.ac.flat"] = parseInt(ac.value);
        updateData["data.attributes.ac.calc"] = actorData.type === "npc" ? "natural" : "flat";
        updateData["data.attributes.ac.-=value"] = null;
        return updateData;
    }

    if (typeof ac?.flat === "string" && Number.isNumeric(ac.flat)) {
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

    // If old Rank data is present, remove it
    const hasOldAttrib = ad?.attributes?.rank !== undefined;
    if (!hasOldAttrib) updateData["-=data.attributes.rank"] = null;
    // If new Rank data is not present, create it
    const hasNewAttrib = ad?.attributes?.ranks !== undefined;
    if (!hasNewAttrib) updateData["data.attributes.ranks"] = 0;

    return updateData;
}

/* --------------------------------------------- */

/**
 * Migrate the Class item powercasting field to allow powercasting to properly calculate
 * @private
 */
function _migrateItemClassPowerCasting(item, updateData) {
    if (item.type === "class") {
        switch (item.name) {
            case "Consular":
                updateData["data.powercasting"] = {
                    progression: "consular",
                    ability: ""
                };
                break;
            case "Engineer":
                updateData["data.powercasting"] = {
                    progression: "engineer",
                    ability: ""
                };
                break;
            case "Guardian":
                updateData["data.powercasting"] = {
                    progression: "guardian",
                    ability: ""
                };
                break;
            case "Scout":
                updateData["data.powercasting"] = {
                    progression: "scout",
                    ability: ""
                };
                break;
            case "Sentinel":
                updateData["data.powercasting"] = {
                    progression: "sentinel",
                    ability: ""
                };
                break;
        }
    }
    return updateData;
}

/* -------------------------------------------- */

/**
 * Update an Power Item's data based on compendium
 * @param {Object} item    The data object for an item
 * @param {Object} actor   The data object for the actor owning the item
 * @private
 */
async function _migrateItemPower(item, actor, updateData) {
    // if item is not a power shortcut out
    if (item.type !== "power") return updateData;

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
    if (coreSource === "Compendium.sw5e.forcepowers") powerType = "sw5e.forcepowers";
    if (coreSource === "Compendium.sw5e.techpowers") powerType = "sw5e.techpowers";
    if (powerType === "none") return updateData;

    const corePower = duplicate(await game.packs.get(powerType).getDocument(core_id));
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
 * Delete the old data.attuned boolean.
 * @param {object} item        Item data to migrate
 * @param {object} updateData  Existing update to expand upon
 * @returns {object}           The updateData to apply
 * @private
 */
function _migrateItemAttunement(item, updateData) {
    if (item.data?.attuned === undefined) return updateData;
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
    if (item.data?.rarity === undefined) return updateData;
    const rarity = Object.keys(CONFIG.SW5E.itemRarity).find(
        (key) =>
            CONFIG.SW5E.itemRarity[key].toLowerCase() === item.data.rarity.toLowerCase() || key === item.data.rarity
    );
    updateData["data.rarity"] = rarity ?? "";
    return updateData;
}

/* -------------------------------------------- */

/**
 * Convert equipment items of type 'bonus' to 'trinket'.
 * @param {object} item        Item data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 * @private
 */
function _migrateItemArmorType(item, updateData) {
    if (item.type !== "equipment") return updateData;
    if (item.data?.armor?.type === "bonus") updateData["data.armor.type"] = "trinket";
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
    if (foundry.utils.getType(item.data.critical) === "Object") return updateData;
    updateData["data.critical"] = {
        threshold: null,
        damage: null
    };
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
    if (item.data?.armor?.type in CONFIG.SW5E.armorTypes) configProp = CONFIG.SW5E.armorProperties;
    if (item.data?.armor?.type in CONFIG.SW5E.castingEquipmentTypes) configProp = CONFIG.SW5E.castingProperties;
    // Remove existing properties not in current template
    for (const key in props) {
        if (!(key in configProp)) updateData[`data.properties.-=${key}`] = null;
    }
    // Add template properties that don't exist yet on current armor
    for (const [key, val] of Object.entries(configProp)) {
        if (!(key in props)) updateData[`data.properties.${key}`] = val.type === "Boolean" ? false : 0;
    }
    // Migrate from boolean to number
    for (const [key, prop] of Object.entries(configProp)) {
        if (prop.type === "Number" && foundry.utils.getType(props[key]) !== "Number") {
            updateData[`data.properties.${key}`] = props[key] ? 1 : 0;
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
    if (item.type !== "weapon") return updateData;
    const hasProperties = item.data?.properties !== undefined;
    if (!hasProperties) return updateData;
    const props = item.data.properties;
    const isStarship = item.data.weaponType in SW5E.weaponStarshipTypes;
    const configProp = isStarship ? SW5E.weaponFullStarshipProperties : SW5E.weaponFullCharacterProperties;
    // Remove existing properties not in current template
    for (const key in props) {
        if (!(key in configProp)) updateData[`data.properties.-=${key}`] = null;
    }
    // Add template properties that don't exist yet on current weapon
    for (const [key, prop] of Object.entries(configProp)) {
        if (!(key in props)) updateData[`data.properties.${key}`] = prop.type === "Boolean" ? false : 0;
    }
    // Migrate from boolean to number
    for (const [key, prop] of Object.entries(configProp)) {
        if (prop.type === "Number" && foundry.utils.getType(props[key]) !== "Number") {
            updateData[`data.properties.${key}`] = props[key] ? (prop.min ?? 1) : 0;
        }
    }

    return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the item's modifications to the newer system.
 * @param {object} item        Item data to migrate.
 * @param {Object} actor       The data object for the actor owning the item
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 * @private
 */
async function _migrateItemModificationData(item, actor, updateData) {
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
            if (!mod_data?.id) continue;
            const mod = await fromUuid(mod_data.id);
            if (!mod) continue;
            const modType = (mod.data.data.modificationType === "augment") ? "augment" : "mod";
            const data = mod.toObject();
            delete data._id;
            data.data.modifying.id = item.id;
            const obj = { data: data, name: mod.name, type: modType, disabled: mod_data.disabled };

            if (actor) {
                const result = await Item5e.createDocuments([data], {parent: actor});
                if (result?.length) obj.id = result[0].id;
            }

            items.push(obj);
        }
        if (items.length) updateData["data.modify.items"] = modify;
    }

    return updateData;
}

/* -------------------------------------------- */

/**
 * A general tool to purge flags from all documents in a Compendium pack.
 * @param {CompendiumCollection} pack   The compendium pack to clean.
 * @private
 */
export async function purgeFlags(pack) {
    const cleanFlags = (flags) => {
        const flags5e = flags.sw5e || null;
        return flags5e ? {sw5e: flags5e} : {};
    };
    await pack.configure({locked: false});
    const content = await pack.getDocuments();
    for (const doc of content) {
        const update = {flags: cleanFlags(doc.data.flags)};
        if (pack.documentName === "Actor") {
            update.items = doc.data.items.map((i) => {
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
    for (const [k, v] of Object.entries(data)) {
        if (getType(v) === "Object") {
            if (v._deprecated === true) {
                console.log(`Deleting deprecated object key ${k}`);
                delete data[k];
            } else removeDeprecatedObjects(v);
        }
    }
    return data;
}
