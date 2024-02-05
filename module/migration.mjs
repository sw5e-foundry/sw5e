import { sluggifyPath } from "./utils.mjs";

/**
 * Checks if the world needs migrating.
 * @returns {boolean}      Wheter migration is needed or not.
 */
export const needsMigration = function() {
  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) return false;
  const cv = game.settings.get("sw5e", "systemMigrationVersion") || game.world.flags.sw5e?.version;
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if (!cv && totalDocuments === 0) {
    game.settings.set("sw5e", "systemMigrationVersion", game.system.version);
    return false;
  }
  if (cv && !foundry.utils.isNewerVersion(game.system.flags.needsMigrationVersion, cv)) return false;

  if (cv && foundry.utils.isNewerVersion(game.system.flags.compatibleMigrationVersion, cv)) {
    ui.notifications.error("MIGRATION.5eVersionTooOldWarning", { localize: true, permanent: true });
  }

  return true;
};

/* -------------------------------------------- */

/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @param {boolean}  [migrateSystemCompendiums=false]
 * @returns {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function(migrateSystemCompendiums = false) {
  const version = game.system.version;
  ui.notifications.info(game.i18n.format("MIGRATION.5eBegin", { version }), { permanent: true });

  const migrationData = await getMigrationData();

  // // Migrate Armor Class
  // for (let p of game.packs) {
  //     if (!["Actor"].includes(p.documentName)) continue;
  //     await migrateArmorClass(p, migrationData);
  // }

  await migrateItemTypes(migrateSystemCompendiums);

  // Migrate World Actors
  const actors = game.actors
    .map(a => [a, true])
    .concat(Array.from(game.actors.invalidDocumentIds).map(id => [game.actors.getInvalid(id), false]));
  for await (const [actor, valid] of actors) {
    try {
      const flags = { persistSourceMigration: false };
      const source = valid ? actor.toObject() : game.data.actors.find(a => a._id === actor.id);
      let updateData = await migrateActorData(source, migrationData, flags);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Actor document ${actor.name}`);
        if ( flags.persistSourceMigration ) {
          updateData = foundry.utils.mergeObject(source, updateData, {inplace: false});
        }
        await actor.update(updateData, {enforceTypes: false, diff: valid && !flags.persistSourceMigration});
      }
      if ( actor.effects && actor.items && foundry.utils.isNewerVersion("3.0.0", actor._stats.systemVersion) ) {
        const deleteIds = _duplicatedEffects(actor);
        if ( deleteIds.size ) await actor.deleteEmbeddedDocuments("ActiveEffect", Array.from(deleteIds));
      }
    } catch(err) {
      err.message = `Failed sw5e system migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  const items = game.items
    .map(i => [i, true])
    .concat(Array.from(game.items.invalidDocumentIds).map(id => [game.items.getInvalid(id), false]));
  for await (const [item, valid] of items) {
    try {
      const flags = { persistSourceMigration: false };
      const source = valid ? item.toObject() : game.data.items.find(i => i._id === item.id);
      let updateData = await migrateItemData(source, migrationData, flags);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Item document ${item.name}`);
        if ( flags.persistSourceMigration ) {
          updateData = foundry.utils.mergeObject(source, updateData, {inplace: false});
        }
        await item.update(updateData, {enforceTypes: false, diff: valid && !flags.persistSourceMigration});
      }
    } catch(err) {
      err.message = `Failed sw5e system migration for Item ${item.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Macros
  for (const m of game.macros) {
    try {
      const updateData = await migrateMacroData(m.toObject(), migrationData);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Macro document ${m.name}`);
        await m.update(updateData, { enforceTypes: false });
      }
    } catch(err) {
      err.message = `Failed sw5e system migration for Macro ${m.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Roll Tables
  for ( const table of game.tables ) {
    try {
      const updateData = migrateRollTableData(table.toObject(), migrationData);
      if ( !foundry.utils.isEmpty(updateData) ) {
        console.log(`Migrating RollTable document ${table.name}`);
        await table.update(updateData, { enforceTypes: false });
      }
    } catch( err ) {
      err.message = `Failed sw5e system migration for RollTable ${table.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate Actor Override Tokens
  for (const s of game.scenes) {
    try {
      const updateData = await migrateSceneData(s, migrationData);
      if (!foundry.utils.isEmpty(updateData)) {
        console.log(`Migrating Scene document ${s.name}`);
        await s.update(updateData, { enforceTypes: false });
      }
    } catch(err) {
      err.message = `Failed sw5e system migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }

    // Migrate ActorDeltas individually in order to avoid issues with ActorDelta bulk updates.
    for ( const token of s.tokens ) {
      if ( token.actorLink || !token.actor ) continue;
      try {
        const flags = { persistSourceMigration: false };
        const source = token.actor.toObject();
        let updateData = migrateActorData(source, migrationData, flags);
        if ( !foundry.utils.isEmpty(updateData) ) {
          console.log(`Migrating ActorDelta document ${token.actor.name} [${token.delta.id}] in Scene ${s.name}`);
          if ( flags.persistSourceMigration ) {
            updateData = foundry.utils.mergeObject(source, updateData, { inplace: false });
          } else {
            // Workaround for core issue of bulk updating ActorDelta collections.
            ["items", "effects"].forEach(col => {
              for ( const [i, update] of (updateData[col] ?? []).entries() ) {
                const original = token.actor[col].get(update._id);
                updateData[col][i] = foundry.utils.mergeObject(original.toObject(), update, { inplace: false });
              }
            });
          }
          await token.actor.update(updateData, { enforceTypes: false, diff: !flags.persistSourceMigration });
        }
      } catch(err) {
        err.message = `Failed sw5e system migration for ActorDelta [${token.id}]: ${err.message}`;
        console.error(err);
      }
    }
  }

  // Migrate World Compendium Packs
  for (let p of game.packs) {
    if (!p) continue;
    if (p.metadata.packageType !== "world" && !migrateSystemCompendiums) continue;
    if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
    await migrateCompendium(p);
  }

  // Set the migration as complete
  game.settings.set("sw5e", "systemMigrationVersion", game.system.version);
  ui.notifications.info(game.i18n.format("MIGRATION.5eComplete", { version }), { permanent: true });
};

/* -------------------------------------------- */

/**
 * Apply migration rules to all Documents within a single Compendium pack
 * @param {CompendiumCollection} pack  Pack to be migrated.
 * @returns {Promise}
 */
export const migrateCompendium = async function(pack) {
  const documentName = pack.documentName;
  if (!["Actor", "Item", "Scene"].includes(documentName)) return;

  const migrationData = await getMigrationData();

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  await pack.configure({ locked: false });
  sw5e.moduleArt.suppressArt = true;

  // Begin by requesting server-side data model migration and get the migrated content
  await pack.migrate();
  const documents = await pack.getDocuments();

  // Iterate over compendium entries - applying fine-tuned migration functions
  for await (let doc of documents) {
    const flags = { persistSourceMigration: false };
    const source = doc.toObject();
    let updateData = {};
    try {
      switch (documentName) {
        case "Actor":
          updateData = await migrateActorData(source, migrationData, flags);
          if ( (documentName === "Actor") && source.effects && source.items
            && foundry.utils.isNewerVersion("3.0.0", source._stats.systemVersion) ) {
            const deleteIds = _duplicatedEffects(source);
            if ( deleteIds.size ) await doc.deleteEmbeddedDocuments("ActiveEffect", Array.from(deleteIds));
          }
          break;
        case "Item":
          updateData = await migrateItemData(source, migrationData, flags);
          break;
        case "Scene":
          updateData = await migrateSceneData(source, migrationData, flags);
          break;
      }

      // Save the entry, if data was changed
      if (foundry.utils.isEmpty(updateData)) continue;
      if ( flags.persistSourceMigration ) updateData = foundry.utils.mergeObject(source, updateData);
      await doc.update(updateData, { diff: !flags.persistSourceMigration });
      console.log(`Migrated ${documentName} document ${doc.name} in Compendium ${pack.collection}`);
    } catch(err) {
      // Handle migration failures
      err.message = `Failed sw5e system migration for document ${doc.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }

  // Apply the original locked status for the pack
  await pack.configure({ locked: wasLocked });
  sw5e.moduleArt.suppressArt = false;
  console.log(`Migrated all ${documentName} documents from Compendium ${pack.collection}`);
};

/* -------------------------------------------- */

/**
 * Re-parents compendia from one top-level folder to another.
 * @param {string} from  The name of the source folder.
 * @param {string} to    The name of the destination folder.
 */
export function reparentCompendiums(from, to) {
  const compendiumFolders = new Map();
  for ( const folder of game.folders ) {
    if ( folder.type !== "Compendium" ) continue;
    if ( folder.folder ) {
      let folders = compendiumFolders.get(folder.folder);
      if ( !folders ) {
        folders = [];
        compendiumFolders.set(folder.folder, folders);
      }
      folders.push(folder);
    }
    if ( folder.name === from ) from = folder;
    else if ( folder.name === to ) to = folder;
  }
  if ( !(from instanceof Folder) || !(to instanceof Folder) ) return;
  const config = game.settings.get("core", "compendiumConfiguration");

  // Re-parent packs directly under the source folder.
  Object.values(config).forEach(conf => {
    if ( conf.folder === from.id ) conf.folder = to.id;
  });

  game.settings.set("core", "compendiumConfiguration", config);

  // Re-parent folders directly under the source folder.
  const updates = (compendiumFolders.get(from) ?? []).map(f => ({ _id: f.id, folder: to.id }));
  return Folder.implementation.updateDocuments(updates).then(() => from.delete());
}

/* -------------------------------------------- */

/**
 * Update all compendium packs using the new system data model.
 */
export async function refreshAllCompendiums() {
  for (const pack of game.packs) {
    await refreshCompendium(pack);
  }
}

/* -------------------------------------------- */

/**
 * Update all Documents in a compendium using the new system data model.
 * @param {CompendiumCollection} pack  Pack to refresh.
 */
export async function refreshCompendium(pack) {
  if (!pack?.documentName) return;
  sw5e.moduleArt.suppressArt = true;
  const DocumentClass = CONFIG[pack.documentName].documentClass;
  const wasLocked = pack.locked;
  await pack.configure({ locked: false });
  await pack.migrate();

  ui.notifications.info(`Beginning to refresh Compendium ${pack.collection}`);
  const documents = await pack.getDocuments();
  for (const doc of documents) {
    const data = doc.toObject();
    await doc.delete();
    await DocumentClass.create(data, { keepId: true, keepEmbeddedIds: true, pack: pack.collection });
  }
  await pack.configure({ locked: wasLocked });
  sw5e.moduleArt.suppressArt = false;
  ui.notifications.info(`Refreshed all documents from Compendium ${pack.collection}`);
}

/* -------------------------------------------- */

/**
 * Apply 'smart' AC migration to a given Actor compendium. This will perform the normal AC migration but additionally
 * check to see if the actor has armor already equipped, and opt to use that instead.
 * @param {CompendiumCollection|string} pack  Pack or name of pack to migrate.
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {Promise}
 */
export const migrateArmorClass = async function(pack, migrationData) {
  if (typeof pack === "string") pack = game.packs.get(pack);
  if (pack.documentName !== "Actor") return;
  const wasLocked = pack.locked;
  await pack.configure({ locked: false });
  const actors = await pack.getDocuments();
  const updates = [];

  for (const actor of actors) {
    if (actor.type === "starship") continue;
    try {
      console.log(`Migrating ${actor.name}...`);
      const src = actor.toObject();
      const update = { _id: actor.id };

      // Perform the normal migration.
      _migrateActorAC(src, update);
      // TODO: See if AC migration within DataModel is enough to handle this
      updates.push(update);

      // If actor has the name of an armor but doesn't have it equipped, try to add it
      const hasArmorEquipped = actor.itemTypes.equipment.some(e => {
        return e.isArmor && e.system.equipped;
      });
      const armorName = actor.system.attributes.ac.formula.toLowerCase();
      const armorItem = migrationData.armors.find(a => a.name.toLowerCase() === armorName);
      if (!hasArmorEquipped && armorItem) {
        const armorData = armorItem.toObject();
        armorData.system.equipped = true;
        actor.createEmbeddedDocuments("Item", [armorData]);
      }

      // CASE 1: Armor is equipped
      if (hasArmorEquipped || armorItem) update["system.attributes.ac.calc"] = "default";
      // CASE 2: NPC Natural Armor
      else if (src.type === "npc") update["system.attributes.ac.calc"] = "natural";
    } catch(e) {
      console.warn(`Failed to migrate armor class for Actor ${actor.name}`, e);
    }
  }

  await Actor.implementation.updateDocuments(updates, { pack: pack.collection });
  await pack.getDocuments(); // Force a re-prepare of all actors.
  await pack.configure({ locked: wasLocked });
  console.log(`Migrated the AC of all Actors from Compendium ${pack.collection}`);
};

/* -------------------------------------------- */
/*  Document Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Migrate a single Actor document to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actor            The actor data object to update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @param {object} [flags={}] Track the needs migration flag.
 * @returns {object}                The updateData to apply
 */
export const migrateActorData = async function(actor, migrationData, flags={}) {
  const updateData = {};
  await _migrateTokenImage(actor, updateData, migrationData);
  _migrateActorAC(actor, updateData);
  _migrateActorMovementSenses(actor, updateData);
  _migrateActorTraits(actor, updateData);
  _migrateActorAttribRank(actor, updateData);

  // Migrate embedded effects
  if (actor.effects) {
    const effects = migrateEffects(actor, migrationData);
    if (effects.length > 0) updateData.effects = effects;
  }

  // Migrate Owned Items
  if (!actor.items) return updateData;
  const items = await actor.items.reduce(async (memo, i) => {
    const arr = await memo;

    // Migrate the Owned Item
    const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
    const itemFlags = { persistSourceMigration: false };
    let itemUpdate = migrateItemData(itemData, migrationData, itemFlags);

    if ( (itemData.type === "background") && (actor.system?.details?.background !== itemData._id) ) {
      updateData["system.details.background"] = itemData._id;
    }

    if ( (itemData.type === "species") && (actor.system?.details?.species !== itemData._id) ) {
      updateData["system.details.species"] = itemData._id;
    }

    if ( (itemData.type === "starshipsize") && (actor.system?.details?.starshipsize !== itemData._id) ) {
      updateData["system.details.starshipsize"] = itemData._id;
    }

    // Prepared, Equipped, and Proficient for NPC actors
    if (actor.type === "npc") {
      if (foundry.utils.getProperty(itemData.system, "preparation.prepared") === false) itemUpdate["system.preparation.prepared"] = true;
      if (foundry.utils.getProperty(itemData.system, "equipped") === false) itemUpdate["system.equipped"] = true;
    }

    // Update the Owned Item
    if (!foundry.utils.isEmpty(itemUpdate)) {
      if ( itemFlags.persistSourceMigration ) {
        itemUpdate = foundry.utils.mergeObject(itemData, itemUpdate, {inplace: false});
        flags.persistSourceMigration = true;
      }
      arr.push({ ...itemUpdate, _id: itemData._id });
    }

    // Update tool expertise.
    if (actor.system.tools) {
      const hasToolProf = itemData.system.type?.baseItem in actor.system.tools;
      if (itemData.type === "tool" && itemData.system.proficient > 1 && hasToolProf) {
        updateData[`system.tools.${itemData.system.type.baseItem}.value`] = itemData.system.proficient;
      }
    }

    return arr;
  }, []);
  if (items.length > 0) updateData.items = items;

  // Update NPC data with new datamodel information
  if (actor.type === "npc") {
    _updateNPCData(actor);
  }

  return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single Item document to incorporate latest data model changes
 *
 * @param {object} item             Item data to migrate
 * @param {object} [migrationData]  Additional data to perform the migration
 * @param {object} [flags={}] Track the needs migration flag.
 * @returns {object}                The updateData to apply
 */
export async function migrateItemData(item, migrationData, flags={}) {
  const updateData = {};
  await _migrateItemPower(item, updateData);
  await _migrateItemIcon(item, updateData, migrationData);
  await _migrateItemModificationData(item, updateData, migrationData);
  _migrateItemBackgroundDescription(item, updateData);
  _migrateItemIdentifier(item, updateData);
  _migrateItemSpeciesDroid(item, updateData);

  // Migrate embedded effects
  if (item.effects) {
    const effects = migrateEffects(item, migrationData);
    if (effects.length > 0) updateData.effects = effects;
  }

  // Migrate properties
  const migratedProperties = foundry.utils.getProperty(item, "flags.sw5e.migratedProperties");
  if ( migratedProperties?.length ) {
    flags.persistSourceMigration = true;
    const properties = new Set(foundry.utils.getProperty(item, "system.properties") ?? [])
      .union(new Set(migratedProperties));
    updateData["system.properties"] = Array.from(properties);
    updateData["flags.sw5e.-=migratedProperties"] = null;
  }

  if ( foundry.utils.getProperty(item, "flags.sw5e.persistSourceMigration") ) {
    flags.persistSourceMigration = true;
    updateData["flags.sw5e.-=persistSourceMigration"] = null;
  }

  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate any active effects attached to the provided parent.
 * @param {object} parent           Data of the parent being migrated.
 * @param {object} [migrationData]  Additional data to perform the migration.
 * @returns {object[]}              Updates to apply on the embedded effects.
 */
export const migrateEffects = function(parent, migrationData) {
  if (!parent.effects) return {};
  return parent.effects.reduce((arr, e) => {
    const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;
    let effectUpdate = migrateEffectData(effectData, migrationData);
    if (!foundry.utils.isEmpty(effectUpdate)) {
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
  _migrateEffectCharacterFlags(effect, updateData, migrationData);
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
  _migrateMacroCommands(macro, updateData);
  return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single RollTable document to incorporate the latest data model changes.
 * @param {object} table            Roll table data to migrate.
 * @param {object} [migrationData]  Additional data to perform the migration.
 * @returns {object}                The update delta to apply.
 */
export function migrateRollTableData(table, migrationData) {
  const updateData = {};
  if ( !table.results?.length ) return updateData;
  const results = table.results.reduce((arr, result) => {
    const resultUpdate = {};
    if ( !foundry.utils.isEmpty(resultUpdate) ) {
      resultUpdate._id = result._id;
      arr.push(foundry.utils.expandObject(resultUpdate));
    }
    return arr;
  }, []);
  if ( results.length ) updateData.results = results;
  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate a single Scene document to incorporate changes to the data model of its actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene            The Scene data to Update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply
 */
export const migrateSceneData = async function(scene, migrationData) {
  const tokens = await Promise.all(
    scene.tokens.reduce(async (arr, token) => {
      const t = token instanceof foundry.abstract.DataModel ? token.toObject() : token;
      const update = {};
      await _migrateTokenImage(t, update, migrationData);

      if ( !game.actors.has(t.actorId) ) update.actorId = null;
      if ( !foundry.utils.isEmpty(update) ) arr.push({ ...update, _id: t._id });
      return arr;
    }, [])
  );
  if ( tokens.length ) return { tokens };
  return {};
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
    for (const [old_path, new_path] of Object.entries(icons)) {
      const slug = sluggifyPath(old_path);
      data.iconMap[slug] = new_path;
    }

    const characterFlags = await (await fetch("systems/sw5e/json/character-flags-migration.json")).json();
    data.characterFlags = Object.fromEntries(Object.entries(characterFlags).map(([k, v]) => [`flags.sw5e.${k}`, v]));

    data.forcePowers = await (await game.packs.get("sw5e.forcepowers")).getDocuments();
    data.techPowers = await (await game.packs.get("sw5e.techpowers")).getDocuments();
    data.armors = await (await game.packs.get("sw5e.armor")).getDocuments();
    data.modifications = await (await game.packs.get("sw5e.modifications")).getDocuments();
  } catch(err) {
    console.warn(`Failed to retrieve migration data: ${err.message}`);
  }
  return data;
};

/* -------------------------------------------- */
/*  Low level migration utilities
/* -------------------------------------------- */

/**
 * Update an NPC Actor's data based on compendium
 * @param {object} actor    The data object for an Actor
 * @returns {object}        The updated Actor
 */
function _updateNPCData(actor) {
  let actorSysData = actor.system;
  const updateData = {};
  // Check for flag.core, if not there is no compendium monster so exit
  const hasSource = actor?.flags?.core?.sourceId !== undefined;
  if (!hasSource) return actor;
  // Shortcut out if dataVersion flag is set to 1.2.4 or higher
  const hasDataVersion = actor?.flags?.sw5e?.dataVersion !== undefined;
  if (
    hasDataVersion
    && (actor.flags.sw5e.dataVersion === "1.2.4" || isNewerVersion("1.2.4", actor.flags.sw5e.dataVersion))
  ) return actor;
  // Check to see what the source of NPC is
  const sourceId = actor.flags.core.sourceId;
  const coreSource = sourceId.split(".").slice(0, 2).join(".");
  const core_id = sourceId.split(".").slice(2).join(".");
  if (coreSource === "Compendium.sw5e.monsters") {
    game.packs
      .get("sw5e.monsters")
      .getDocument(core_id)
      .then(monster => {
        if (monster) {
          const monsterSysData = monster.system;
          // Copy movement[], senses[], powercasting, force[], tech[], powerForceLevel, powerTechLevel
          updateData["system.attributes.movement"] = monsterSysData.attributes.movement;
          updateData["system.attributes.senses"] = monsterSysData.attributes.senses;
          updateData["system.attributes.powercasting"] = monsterSysData.attributes.powercasting;
          updateData["system.attributes.force"] = monsterSysData.attributes.force;
          updateData["system.attributes.tech"] = monsterSysData.attributes.tech;
          updateData["system.details.powerForceLevel"] = monsterSysData.details.powerForceLevel;
          updateData["system.details.powerTechLevel"] = monsterSysData.details.powerTechLevel;
          // Push missing powers onto actor
          const newPowers = [];
          for (const i of monster.items) {
            if (i.type === "power") {
              const itemCompendium_id = i.flags?.core?.sourceId?.split(".")?.slice(-1)[0];
              const hasPower = !!actor.items.find(
                item => i.flags?.core?.sourceId?.split(".")?.slice(-1)[0] === itemCompendium_id
              );
              if (!hasPower) {
                // Clone power to new object.
                // Don't know if it is technically needed, but seems to prevent some weirdness.
                const newPower = JSON.parse(JSON.stringify(i));

                newPowers.push(newPower);
              }
            }
          }

          // Get actor to create new powers
          const liveActor = game.actors.get(actor._id);
          // Create the powers on the actor
          liveActor.createEmbeddedDocuments("Item", newPowers);

          // Set flag to check to see if migration has been done so we don't do it again.
          liveActor.setFlag("sw5e", "dataVersion", "1.2.4");
        } else {
          updateData.flags = { core: { "-=sourceId": null } };
        }
      });
  }

  // Merge object
  mergeObject(actorSysData, updateData);
  // Return the scrubbed data
  return actor;
}

/* -------------------------------------------- */

/**
 * Identify effects that might have been duplicated when legacyTransferral was disabled.
 * @param {object} parent   Data of the actor being migrated.
 * @returns {Set<string>}   IDs of effects to delete from the actor.
 * @private
 */
function _duplicatedEffects(parent) {
  const deleteIds = new Set();
  for ( const item of parent.items ) {
    for ( const effect of item.effects ?? [] ) {
      if ( !effect.transfer ) continue;
      const match = parent.effects.find(t => {
        const diff = foundry.utils.diffObject(t, effect);
        return t.origin.endsWith(`Item.${item._id}`) && !("changes" in diff) && !deleteIds.has(t._id);
      });
      if ( match ) deleteIds.add(match._id);
    }
  }
  return deleteIds;
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
  const ac = actorData.system?.attributes?.ac;
  // If the actor has a numeric ac.value, then their AC has not been migrated to the auto-calculation schema yet.
  if (Number.isNumeric(ac?.value)) {
    updateData["system.attributes.ac.flat"] = parseInt(ac.value);
    updateData["system.attributes.ac.calc"] = actorData.type === "npc" ? "natural" : "flat";
    updateData["system.attributes.ac.-=value"] = null;
    return updateData;
  }

  // Migrate ac.base in custom formulas to ac.armor
  if (typeof ac?.formula === "string" && ac?.formula.includes("@attributes.ac.base")) {
    updateData["system.attributes.ac.formula"] = ac.formula.replaceAll("@attributes.ac.base", "@attributes.ac.armor");
  }

  // Protect against string values created by character sheets or importers that don't enforce data types
  if (typeof ac?.flat === "string" && Number.isNumeric(ac.flat)) {
    updateData["system.attributes.ac.flat"] = parseInt(ac.flat);
  }

  // Remove invalid AC formula strings.
  if (ac?.formula) {
    try {
      const roll = new Roll(ac.formula);
      Roll.safeEval(roll.formula);
    } catch(e) {
      updateData["system.attributes.ac.formula"] = "";
    }
  }

  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the actor to have Rank Deployment attributes
 * @param {object} actorData
 * @param {object} updateData
 * @returns {object}
 * @private
 */
function _migrateActorAttribRank(actorData, updateData) {
  if (!["character", "npc"].includes(actorData.type)) return updateData;
  const asd = actorData.system;

  // If Rank data is present, remove it
  const v1 = asd?.attributes?.rank !== undefined;
  const v2 = asd?.attributes?.ranks !== undefined;
  if (v1) updateData["system.attributes.-=rank"] = null;
  if (v2) updateData["system.attributes.-=ranks"] = null;

  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the actor's traits
 * @param {object} actorData
 * @param {object} updateData
 * @returns {object}
 * @private
 */
function _migrateActorTraits(actorData, updateData) {
  const flags = actorData?.flags?.sw5e ?? {};

  if (flags.powerfulBuild !== undefined) {
    updateData["flags.sw5e.-=powerfulBuild"] = null;
    updateData["flags.sw5e.encumbranceMultiplier"] = 2;
  }

  return updateData;
}

/* --------------------------------------------- */

/**
 * Update an Power Item's data based on compendium
 * @param {object} item    The data object for an item
 * @param {object} updateData
 * @private
 */
async function _migrateItemPower(item, updateData) {
  // If item is not a power shortcut out
  if (item.type !== "power") return updateData;

  const actor = item.parent;
  if (actor) console.log(`Checking Actor ${actor.name}'s ${item.name} for migration needs`);
  else console.log(`Checking ${item.name} for migration needs`);
  // Check for flag.core, if not there is no compendium power so exit
  const hasSource = item?.flags?.core?.sourceId !== undefined;
  if (!hasSource) return updateData;

  // Shortcut out if dataVersion flag is set to 1.2.4 or higher
  const hasDataVersion = item?.flags?.sw5e?.dataVersion !== undefined;
  if (
    hasDataVersion
    && (item.flags.sw5e.dataVersion === "1.2.4" || isNewerVersion("1.2.4", item.flags.sw5e.dataVersion))
  ) return updateData;

  // Check to see what the source of Power is
  const sourceId = item.flags.core.sourceId;
  const coreSource = sourceId.split(".").slice(0, 2).join(".");
  const core_id = sourceId.split(".").slice(2).join(".");

  // If power type is not force or tech  exit out
  let powerType = "none";
  if (coreSource === "Compendium.sw5e.forcepowers") powerType = "forcepowers";
  if (coreSource === "Compendium.sw5e.techpowers") powerType = "techpowers";
  if (powerType === "none") return updateData;

  const corePower = duplicate(updateData[coreSource].find(p => p.id === core_id));
  if (corePower) {
    if (actor) console.log(`Updating Actor ${actor.name}'s ${item.name} from compendium`);
    else console.log(`Updating ${item.name} from compendium`);
    const corePowerSysData = corePower.system;
    // Copy Core Power Data over original Power
    updateData.system = corePowerSysData;
    updateData.flags = { sw5e: { dataVersion: "1.2.4" } };
  } else {
    if (actor) console.error(`Update failed, couldn't find Actor ${actor.name}'s ${item.name} in compendium`);
    else console.error(`Update failed, couldn't find ${item.name} in compendium`);
    updateData.flags = { core: { "-=sourceId": null } };
  }

  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the actor movement & senses to replace `0` with `null`.
 * @param {object} actorData   Actor data being migrated.
 * @param {object} updateData  Existing updates being applied to actor. *Will be mutated.*
 * @returns {object}           Modified version of update data.
 * @private
 */
function _migrateActorMovementSenses(actorData, updateData) {
  if ( actorData._stats?.systemVersion && foundry.utils.isNewerVersion("2.4.0", actorData._stats.systemVersion) ) {
    for ( const key of Object.keys(CONFIG.SW5E.movementTypes) ) {
      const keyPath = `system.attributes.movement.${key}`;
      if ( foundry.utils.getProperty(actorData, keyPath) === 0 ) updateData[keyPath] = null;
    }
    for ( const key of Object.keys(CONFIG.SW5E.senses) ) {
      const keyPath = `system.attributes.senses.${key}`;
      if ( foundry.utils.getProperty(actorData, keyPath) === 0 ) updateData[keyPath] = null;
    }
  }
  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate any system token images from PNG to WEBP.
 * @param {object} actorData       Actor or token data to migrate.
 * @param {object} updateData      Existing update to expand upon.
 * @param {object} migrationData
 * @param {Object<string, string>} [migrationData.iconMap]  A mapping of system icons to core foundry icons
 * @returns {object}               The updateData to apply
 * @private
 */
async function _migrateTokenImage(actorData, updateData, { iconMap } = {}) {
  const prefix = "systems/sw5e/packs/Icons/";

  for (let prop of ["texture.src", "prototypeToken.texture.src"]) {
    const path = foundry.utils.getProperty(actorData, prop);

    if (!path?.startsWith(prefix)) return;

    const img = path.substring(prefix.length);
    let slug = sluggifyPath(img);

    if (iconMap && slug in iconMap) slug = iconMap[slug];

    if (slug !== img) {
      const icon = await fetch(prefix + slug);
      if (icon.ok) updateData[prop] = prefix + slug;
    }
  }
  return updateData;
}

/* -------------------------------------------- */

/**
 * Convert icon paths to the new standard.
 * @param {object} item                                     Item data to migrate
 * @param {object} updateData                               Existing update to expand upon
 * @param {object} [migrationData={}]                       Additional data to perform the migration
 * @param {Object<string, string>} [migrationData.iconMap]  A mapping of system icons to core foundry icons
 * @returns {object}                                        The updateData to apply
 * @private
 */
async function _migrateItemIcon(item, updateData, { iconMap } = {}) {
  const prefix = "systems/sw5e/packs/Icons/";
  if (!item.img?.startsWith(prefix)) return updateData;

  const img = item.img.substring(prefix.length);
  let slug = sluggifyPath(img);

  if (iconMap && slug in iconMap) slug = iconMap[slug];

  if (slug !== img) {
    const icon = await fetch(prefix + slug);
    if (icon.ok) updateData.img = prefix + slug;
  }

  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate the item's modifications to the newer system.
 * @param {object} item             Item data to migrate.
 * @param {object} updateData       Existing update to expand upon.
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply.
 * @private
 */
async function _migrateItemModificationData(item, updateData, migrationData) {
  if (item.type === "modification") {
    if (item.system.modified !== undefined) updateData["system.-=modified"] = null;
  } else if (item.system.modifications !== undefined) {
    const itemMods = item.system.modifications;
    updateData["system.-=modifications"] = null;

    if (itemMods.chassisType !== undefined) updateData["system.modify.chassis"] = itemMods.chassisType;
    if (itemMods.augmentSlots !== undefined) updateData["system.modify.augmentSlots"] = itemMods.augmentSlots;
    if (itemMods.type !== undefined) updateData["system.modify.type"] = itemMods.type;
    if (itemMods.overrides !== undefined) updateData["system.modify.changes"] = itemMods.overrides;

    const items = [];
    for (const mod_data of Object.values(itemMods.mods).concat(itemMods.augments)) {
      if (!mod_data?.uuid) continue;
      const mod = migrationData.modifications.find(m => m.uuid === mod_data.uuid);
      if (!mod) continue;
      const modType = mod.system.modificationType === "augment" ? "augment" : "mod";

      const sysdata = mod.toObject();
      delete sysdata._id;
      items.push({
        system: sysdata,
        name: mod.name,
        type: modType,
        disabled: mod_data.disabled
      });
    }
    if (items.length) updateData["system.modify.items"] = items;
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
  if (item.type !== "background") return updateData;
  if (
    [item.system.flavorText, item.system.flavorName, item.system.flavorDescription, item.system.flavorOptions].every(
      attr => attr === undefined
    )
  ) return updateData;
  if (item.system.flavorText !== undefined) updateData["system.-=flavorText"] = null;
  if (item.system.flavorName !== undefined) updateData["system.-=flavorName"] = null;
  if (item.system.flavorDescription !== undefined) updateData["system.-=flavorDescription"] = null;
  if (item.system.flavorOptions !== undefined) updateData["system.-=flavorOptions"] = null;

  let text = "";

  /* eslint-disable no-useless-concat */
  if (item.system.flavorText) text +=
      '<div class="background">\n' + "  <p>\n" + `      ${item.system.flavorText.value}\n` + "  </p>\n" + "</div>\n";
  if (item.system.skillProficiencies) text +=
      '<div class="background">\n'
      + `  <p><strong>Skill Proficiencies:</strong> ${item.system.skillProficiencies.value}</p>\n`
      + "</div>\n";
  if (item.system.toolProficiencies) text +=
      '<div class="background">\n'
      + `  <p><strong>Tool Proficiencies:</strong> ${item.system.toolProficiencies.value}</p>\n`
      + "</div>\n";
  if (item.system.languages) text +=
      '<div class="background">\n'
      + `  <p><strong>Languages:</strong> ${item.system.languages.value}</p>\n`
      + "</div>\n";
  if (item.system.equipment) text +=
      '<div class="background">\n' + `  <p><strong>Equipment:</strong> ${item.system.equipment}</p>\n` + "</div>\n";
  if (item.system.flavorName && item.system.flavorDescription && item.system.flavorOptions) text +=
      `<div class="background"><h3>${item.system.flavorName.value}</h3></div>\n`
      + `<div class="background"><p>${item.system.flavorDescription.value}</p></div>\n`
      + '<div class="smalltable">\n'
      + "  <p>\n"
      + `      ${item.system.flavorOptions.value}\n`
      + "  </p>\n"
      + "</div>\n";
  if (item.system.featureName && item.system.featureText) text +=
      `<div class="background"><h2>Feature: ${item.system.featureName.value}</h2></div>\n`
      + `<div class="background"><p>${item.system.featureText.value}</p></div>`;
  if (item.system.featOptions) text +=
      "<h2>Background Feat</h2>\n"
      + "<p>\n"
      + "  As a further embodiment of the experience and training of your background, you can choose from the\n"
      + "  following feats:\n"
      + "</p>\n"
      + '<div class="smalltable">\n'
      + "  <p>\n"
      + `      ${item.system.featOptions.value}\n`
      + "  </p>\n"
      + "</div>\n";
  if (
    item.system.personalityTraitOptions
    || item.system.idealOptions
    || item.system.flawOptions
    || item.system.bondOptions
  ) {
    text += '<div class="background"><h2>Suggested Characteristics</h2></div>\n';
    if (item.system.personalityTraitOptions) text +=
        '<div class="medtable">\n'
        + "  <p>\n"
        + `      ${item.system.personalityTraitOptions.value}\n`
        + "  </p>\n"
        + "</div>\n"
        + "<p>&nbsp;</p>";
    if (item.system.idealOptions) text +=
        '<div class="medtable">\n'
        + "  <p>\n"
        + `      ${item.system.idealOptions.value}\n`
        + "  </p>\n"
        + "</div>\n"
        + "<p>&nbsp;</p>";
    if (item.system.flawOptions) text +=
        '<div class="medtable">\n'
        + "  <p>\n"
        + `      ${item.system.flawOptions.value}\n`
        + "  </p>\n"
        + "</div>\n"
        + "<p>&nbsp;</p>";
    if (item.system.bondOptions) text +=
        '<div class="medtable">\n' + "  <p>\n" + `      ${item.system.bondOptions.value}\n` + "  </p>\n" + "</div>\n";
  }
  /* eslint-enable no-useless-concat */

  if (text) updateData["system.description.value"] = text;

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
  if (item.type !== "archetype") return updateData;
  if (item.system.className === undefined) return updateData;

  updateData["system.-=className"] = null;
  updateData["system.classIdentifier"] = item.system.className.slugify({ strict: true });

  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate species isDroid data
 * @param {object} item        Archetype data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 */
function _migrateItemSpeciesDroid(item, updateData) {
  if (item.type !== "species") return updateData;

  updateData["system.details.isDroid"] = !!item.system?.colorScheme?.value;

  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate all deprecated item types.
 * @param {boolean} migrateSystemCompendiums  Migrate items in system compendiums.
 */
async function migrateItemTypes(migrateSystemCompendiums) {
  // Make deprecated item types temporarily valid
  const validTypes = game.documentTypes.Item;
  game.documentTypes.Item = game.documentTypes.Item.concat(CONFIG.SW5E.deprecatedItemTypes);

  const items = new Set(game.items);
  const actors = new Set(game.actors);
  const scenes = new Set(game.scenes);
  const wasLocked = {};

  // Accumulate invalid World Actors
  for (const id of game.actors.invalidDocumentIds) actors.add(game.actors.getInvalid(id));
  // Accumulate invalid World Items
  for (const id of game.items.invalidDocumentIds) items.add(game.items.getInvalid(id));
  // Accumulate everything from compendium packs
  for await (const pack of game.packs) {
    if (!pack) continue;
    if (pack.metadata.packageType !== "world" && !migrateSystemCompendiums) continue;
    const documentName = pack.documentName;
    if (!["Actor", "Item", "Scene"].includes(documentName)) continue;
    let set = null;
    if (documentName === "Item") set = items;
    if (documentName === "Actor") set = actors;
    if (documentName === "Scene") set = scenes;

    // Unlock the pack for editing
    wasLocked[pack.collection] = pack.locked;
    await pack.configure({ locked: false });

    // Iterate over compendium entries
    const documents = await pack.getDocuments();
    for await (let doc of documents) set.add(doc);
  }
  // Accumulate actors from scenes
  for (const scene of scenes) for (const token of scene?.tokens ?? []) if (!token.actorLink) actors.add(token.actor);
  // Accumulate items from actors
  for (const actor of actors) for (const item of actor?.items ?? []) items.add(item);

  // Migrate items
  for await (const item of items) await _migrateItemType(item);

  // Apply the original locked status for the packs
  for await (const [collection, lock] of Object.entries(wasLocked)) {
    const pack = await game.packs.get(collection);
    pack.configure({ locked: lock });
  }

  // Restore valid item types
  game.documentTypes.Item = validTypes;
}

/* -------------------------------------------- */

/**
 * Migrate item with deprecated type
 * @param {object} item        Item to migrate.
 */
async function _migrateItemType(item) {
  if (!CONFIG.SW5E.deprecatedItemTypes.includes(item?.type)) return;

  console.log(`Migrating item ${item.name} with deprecated type ${item.type}`);

  if (item.type === "starship") {
    await item.update({ type: "starshipsize" });
    return;
  }

  if (item.type in CONFIG.SW5E.featLikeItemsMigration) {
    const updates = {
      "system.critical": {
        threshold: item?.system?.critical?.threshold ?? null,
        damage: item?.system?.critical?.damage ?? ""
      },
      "system.save": {
        ability: item?.system?.save?.ability ?? "",
        dc: item?.system?.save?.dc ?? 0,
        scaling: item?.system?.save?.scaling ?? "power"
      },
      "system.type": CONFIG.SW5E.featLikeItemsMigration[item.type]
    };

    switch (item.type) {
      case "deploymentfeature":
        updates["system.requirements"] = [item.system.deployment?.value ?? "", item.system.rank?.value ?? ""].join(" ");
        break;
      case "starshipaction":
        updates["system.type"].subtype = item.system.deployment;
    }
    console.log(`Migrating feat-like Item document ${item.name}`);
    await item.update(updates);
    await item.update({ type: "feat" });
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
  const changes = (effect.changes || []).map(c => {
    if (c.key !== "system.attributes.ac.base") return c;
    c.key = "system.attributes.ac.armor";
    containsUpdates = true;
    return c;
  });
  if (containsUpdates) updateData.changes = changes;
  return updateData;
}

/* -------------------------------------------- */

/**
 * Change active effects that target character flags.
 * @param {object} effect           Effect data to migrate.
 * @param {object} updateData       Existing update to expand upon.
 * @param {object} migrationData    Additional data to perform the migration
 * @returns {object}                The updateData to apply.
 */
function _migrateEffectCharacterFlags(effect, updateData, migrationData) {
  let containsUpdates = false;
  const newChanges = [];
  const changes = (effect.changes || []).map(c => {
    if (c.key in migrationData.characterFlags) {
      containsUpdates = true;
      const data = migrationData.characterFlags[c.key];
      for (const [i, change] of data.changes.entries()) {
        const key = change.flag ? `flags.sw5e.${change.flag}` : change.field;
        const mode = CONST.ACTIVE_EFFECT_MODES[change.mode];
        if (i === 0) {
          c.key = key;
          c.mode = mode;
          c.value = change.value;
        }
        else {
          newChanges.push({
            key,
            mode,
            value: change.value
          });
        }
      }
    }
    return c;
  });
  if (!foundry.utils.isEmpty(newChanges)) changes.push(...newChanges);
  if (containsUpdates) updateData.changes = changes;
  return updateData;
}

/* -------------------------------------------- */

/**
 * Migrate macros from the old 'sw5e.rollItemMacro' and 'sw5e.macros' commands to the new location.
 * @param {object} macro       Macro data to migrate.
 * @param {object} updateData  Existing update to expand upon.
 * @returns {object}           The updateData to apply.
 */
function _migrateMacroCommands(macro, updateData) {
  if (macro.command.includes("game.sw5e.rollItemMacro")) {
    updateData.command = macro.command.replaceAll("game.sw5e.rollItemMacro", "sw5e.documents.macro.rollItem");
  } else if (macro.command.includes("game.sw5e.macros.")) {
    updateData.command = macro.command.replaceAll("game.sw5e.macros.", "sw5e.documents.macro.");
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
  const cleanFlags = flags => {
    const flags5e = flags.sw5e || null;
    return flags5e ? { sw5e: flags5e } : {};
  };
  await pack.configure({ locked: false });
  const content = await pack.getDocuments();
  for (let doc of content) {
    const update = { flags: cleanFlags(doc.flags) };
    if (pack.documentName === "Actor") {
      update.items = doc.items.map(i => {
        i.flags = cleanFlags(i.flags);
        return i;
      });
    }
    await doc.update(update, { recursive: false });
    console.log(`Purged flags from ${doc.name}`);
  }
  await pack.configure({ locked: true });
}
