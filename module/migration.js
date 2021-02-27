/**
 * Perform a system migration for the entire World, applying migrations for Actors, Items, and Compendium packs
 * @return {Promise}      A Promise which resolves once the migration is completed
 */
export const migrateWorld = async function() {
  ui.notifications.info(`Applying SW5e System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, {permanent: true});

  // Migrate World Actors
  for ( let a of game.actors.entities ) {
    try {
      const updateData = migrateActorData(a.data);
      if ( !isObjectEmpty(updateData) ) {
        console.log(`Migrating Actor entity ${a.name}`);
        await a.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed sw5e system migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  for ( let i of game.items.entities ) {
    try {
      const updateData = migrateItemData(i.data);
      if ( !isObjectEmpty(updateData) ) {
        console.log(`Migrating Item entity ${i.name}`);
        await i.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed sw5e system migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate Actor Override Tokens
  for ( let s of game.scenes.entities ) {
    try {
      const updateData = migrateSceneData(s.data);
      if ( !isObjectEmpty(updateData) ) {
        console.log(`Migrating Scene entity ${s.name}`);
        await s.update(updateData, {enforceTypes: false});
      }
    } catch(err) {
      err.message = `Failed sw5e system migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Compendium Packs
  for ( let p of game.packs ) {
    if ( p.metadata.package !== "world" ) continue;
    if ( !["Actor", "Item", "Scene"].includes(p.metadata.entity) ) continue;
    await migrateCompendium(p);
  }

  // Set the migration as complete
  game.settings.set("sw5e", "systemMigrationVersion", game.system.data.version);
  ui.notifications.info(`SW5e System Migration to version ${game.system.data.version} completed!`, {permanent: true});
};

/* -------------------------------------------- */

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function(pack) {
  const entity = pack.metadata.entity;
  if ( !["Actor", "Item", "Scene"].includes(entity) ) return;

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  await pack.configure({locked: false});

  // Begin by requesting server-side data model migration and get the migrated content
  await pack.migrate();
  const content = await pack.getContent();

  // Iterate over compendium entries - applying fine-tuned migration functions
  for ( let ent of content ) {
    let updateData = {};
    try {
      switch (entity) {
        case "Actor":
          updateData = migrateActorData(ent.data);
          break;
        case "Item":
          updateData = migrateItemData(ent.data);
          break;
        case "Scene":
          updateData = migrateSceneData(ent.data);
          break;
      }
      if ( isObjectEmpty(updateData) ) continue;

      // Save the entry, if data was changed
      updateData["_id"] = ent._id;
      await pack.updateEntity(updateData);
      console.log(`Migrated ${entity} entity ${ent.name} in Compendium ${pack.collection}`);
    }

    // Handle migration failures
    catch(err) {
      err.message = `Failed sw5e system migration for entity ${ent.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }

  // Apply the original locked status for the pack
  pack.configure({locked: wasLocked});
  console.log(`Migrated all ${entity} entities from Compendium ${pack.collection}`);
};

/* -------------------------------------------- */
/*  Entity Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actor    The actor data object to update
 * @return {Object}         The updateData to apply
 */
export const migrateActorData = function(actor) {
  const updateData = {};

  // Actor Data Updates
  _migrateActorMovement(actor, updateData);
  _migrateActorSenses(actor, updateData);

  // Migrate Owned Items
  if ( !!actor.items ) {
    let hasItemUpdates = false;
    const items = actor.items.map(i => {

      // Migrate the Owned Item
      let itemUpdate = migrateItemData(i);

      // Prepared, Equipped, and Proficient for NPC actors
      if ( actor.type === "npc" ) {
        if (getProperty(i.data, "preparation.prepared") === false) itemUpdate["data.preparation.prepared"] = true;
        if (getProperty(i.data, "equipped") === false) itemUpdate["data.equipped"] = true;
        if (getProperty(i.data, "proficient") === false) itemUpdate["data.proficient"] = true;
      }

      // Update the Owned Item
      if ( !isObjectEmpty(itemUpdate) ) {
        hasItemUpdates = true;
        return mergeObject(i, itemUpdate, {enforceTypes: false, inplace: false});
      } else return i;
    });
    if ( hasItemUpdates ) updateData.items = items;
  }

  // Update NPC data with new datamodel information
  if (actor.type === "npc") {
    _updateNPCData(actor);
  }

  // migrate powers last since it relies on item classes being migrated first.
  _migrateActorPowers(actor, updateData);
  
  return updateData;
};

/* -------------------------------------------- */


/**
 * Scrub an Actor's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} actorData    The data object for an Actor
 * @return {Object}             The scrubbed Actor data
 */
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
 * Migrate a single Item entity to incorporate latest data model changes
 * @param item
 */
export const migrateItemData = function(item) {
  const updateData = {};
  _migrateItemClassPowerCasting(item, updateData)
  _migrateItemAttunement(item, updateData);
  return updateData;
};

/* -------------------------------------------- */

/**
 * Migrate a single Scene entity to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {Object} scene  The Scene data to Update
 * @return {Object}       The updateData to apply
 */
export const migrateSceneData = function(scene) {
  const tokens = duplicate(scene.tokens);
  return {
    tokens: tokens.map(t => {
      if (!t.actorId || t.actorLink || !t.actorData.data) {
        t.actorData = {};
        return t;
      }
      const token = new Token(t);
      if ( !token.actor ) {
        t.actorId = null;
        t.actorData = {};
      } else if ( !t.actorLink ) {
        const updateData = migrateActorData(token.data.actorData);
        t.actorData = mergeObject(token.data.actorData, updateData);
      }
      return t;
    })
  };
};

/* -------------------------------------------- */
/*  Low level migration utilities
/* -------------------------------------------- */

/* -------------------------------------------- */

/**
 * Update an NPC Actor's data based on compendium
 * @param {Object} actor    The data object for an Actor
 * @return {Object}         The updated Actor
 */
function _updateNPCData(actor) {

  let actorData = actor.data;
  const updateData = {};
// check for flag.core
  const hasSource = actor?.flags?.core?.sourceId !== undefined;
  if (!hasSource) return actor;
  // shortcut out if dataVersion flag is set to 1.2.4
  const sourceId = actor.flags.core.sourceId;
  const coreSource = sourceId.substr(0,sourceId.length-17);
  const core_id = sourceId.substr(sourceId.length-16,16);
  if (coreSource === "Compendium.sw5e.monsters"){
    game.packs.get("sw5e.monsters").getEntity(core_id).then(monster => {
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
      let newPowers = [];
      for ( let i of monster.items ) {
          const itemData = i.data;
          if ( itemData.type === "power" ) {
            const itemCompendium_id = itemData.flags?.core?.sourceId.split(".").slice(-1)[0];
            let hasPower = !!actor.items.find(item => item.flags?.core?.sourceId.split(".").slice(-1)[0] === itemCompendium_id);
            if (!hasPower) {
              // Clone power to new object. Don't know if it is technically needed, but seems to prevent some weirdness.
              const newPower = JSON.parse(JSON.stringify(itemData));

              newPowers.push(newPower);
            }
          }
      }

      const liveActor = game.actors.get(actor._id);

      liveActor.createEmbeddedEntity("OwnedItem", newPowers);

      // let updateActor = await actor.createOwnedItem(newPowers);
      // set flag to check to see if migration has been done so we don't do it again.
      liveActor.setFlag("sw5e", "dataVersion", "1.2.4");
    })  
  }


  //merge object
  actorData = mergeObject(actorData, updateData);
  // Return the scrubbed data
  return actor;
}


/**
 * Migrate the actor speed string to movement object
 * @private
 */
function _migrateActorMovement(actorData, updateData) {
  const ad = actorData.data;

  // Work is needed if old data is present
  const old = actorData.type === 'vehicle' ? ad?.attributes?.speed : ad?.attributes?.speed?.value;
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
  return updateData
}

/* -------------------------------------------- */

/**
 * Migrate the actor speed string to movement object
 * @private
 */
function _migrateActorPowers(actorData, updateData) {
  const ad = actorData.data;

  // If new Force & Tech data is not present, create it
  let hasNewAttrib = ad?.attributes?.force?.level !== undefined;
  if ( !hasNewAttrib ) {
    updateData["data.attributes.force.known.value"] = 0;
    updateData["data.attributes.force.known.max"] = 0;
    updateData["data.attributes.force.points.value"] = 0;
    updateData["data.attributes.force.points.min"] = 0;
    updateData["data.attributes.force.points.max"] = 0;
    updateData["data.attributes.force.points.temp"] = 0;
    updateData["data.attributes.force.points.tempmax"] = 0;
    updateData["data.attributes.force.level"] = 0;
    updateData["data.attributes.tech.known.value"] = 0;
    updateData["data.attributes.tech.known.max"] = 0;
    updateData["data.attributes.tech.points.value"] = 0;
    updateData["data.attributes.tech.points.min"] = 0;
    updateData["data.attributes.tech.points.max"] = 0;
    updateData["data.attributes.tech.points.temp"] = 0;
    updateData["data.attributes.tech.points.tempmax"] = 0;
    updateData["data.attributes.tech.level"] = 0;
  }

  // If new Power F/T split data is not present, create it
  const hasNewLimit = ad?.powers?.power1?.foverride !== undefined;
  if ( !hasNewLimit ) {
    for (let i = 1; i <= 9; i++) { 
      // add new 
      updateData["data.powers.power" + i + ".fvalue"] = getProperty(ad.powers,"power" + i + ".value");
      updateData["data.powers.power" + i + ".fmax"] = getProperty(ad.powers,"power" + i + ".max");
      updateData["data.powers.power" + i + ".foverride"] = null;
      updateData["data.powers.power" + i + ".tvalue"] = getProperty(ad.powers,"power" + i + ".value");
      updateData["data.powers.power" + i + ".tmax"] = getProperty(ad.powers,"power" + i + ".max");
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

  return updateData
}

/* -------------------------------------------- */

/**
 * Migrate the actor traits.senses string to attributes.senses object
 * @private
 */
function _migrateActorSenses(actor, updateData) {
  const ad = actor.data;
  if ( ad?.traits?.senses === undefined ) return;
  const original = ad.traits.senses || "";

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
  if ( !wasMatched && !!original ) {
    updateData["data.attributes.senses.special"] = original;
  }

  // Remove the old traits.senses string once the migration is complete
  updateData["data.traits.-=senses"] = null;
  return updateData;
}

/* -------------------------------------------- */

/**
 * @private
 */
function _migrateItemClassPowerCasting(item, updateData) {
  if (item.type === "class"){
    switch (item.name){
      case "Consular": 
        updateData["data.powercasting"] = "consular";
        break;
      case "Engineer":
        updateData["data.powercasting"] = "engineer";
        break;
      case "Guardian":
        updateData["data.powercasting"] = "guardian";
        break;
      case "Scout":
        updateData["data.powercasting"] = "scout";
        break;
      case "Sentinel":
        updateData["data.powercasting"] = "sentinel";
        break;
    }
  }
  return updateData;
}


/* -------------------------------------------- */

/**
 * Delete the old data.attuned boolean
 * @private
 */
function _migrateItemAttunement(item, updateData) {
  if ( item.data.attuned === undefined ) return;
  updateData["data.attunement"] = CONFIG.SW5E.attunementTypes.NONE;
  updateData["data.-=attuned"] = null;
  return updateData;
}


/* -------------------------------------------- */

/**
 * A general tool to purge flags from all entities in a Compendium pack.
 * @param {Compendium} pack   The compendium pack to clean
 * @private
 */
export async function purgeFlags(pack) {
  const cleanFlags = (flags) => {
    const flags5e = flags.sw5e || null;
    return flags5e ? {sw5e: flags5e} : {};
  };
  await pack.configure({locked: false});
  const content = await pack.getContent();
  for ( let entity of content ) {
    const update = {_id: entity.id, flags: cleanFlags(entity.data.flags)};
    if ( pack.entity === "Actor" ) {
      update.items = entity.data.items.map(i => {
        i.flags = cleanFlags(i.flags);
        return i;
      })
    }
    await pack.updateEntity(update, {recursive: false});
    console.log(`Purged flags from ${entity.name}`);
  }
  await pack.configure({locked: true});
}

/* -------------------------------------------- */


/**
 * Purge the data model of any inner objects which have been flagged as _deprecated.
 * @param {object} data   The data to clean
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
