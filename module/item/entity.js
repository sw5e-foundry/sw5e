import {simplifyRollFormula, d20Roll, damageRoll} from "../dice.js";
import AbilityUseDialog from "../apps/ability-use-dialog.js";

/**
 * Override and extend the basic Item implementation
 * @extends {Item}
 */
export default class Item5e extends Item {

  /* -------------------------------------------- */
  /*  Item Properties                             */
  /* -------------------------------------------- */

  /**
   * Determine which ability score modifier is used by this item
   * @type {string|null}
   */
  get abilityMod() {
    const itemData = this.data.data;
    if (!("ability" in itemData)) return null;

    // Case 1 - defined directly by the item
    if (itemData.ability) return itemData.ability;

    // Case 2 - inferred from a parent actor
    else if (this.actor) {
      const actorData = this.actor.data.data;

      // Powers - Use Actor powercasting modifier based on power school
      if (this.data.type === "power") {
        switch (this.data.data.school) {
          case "lgt": return "wis";
          case "uni": return (actorData.abilities["wis"].mod >= actorData.abilities["cha"].mod) ? "wis" : "cha";
          case "drk": return "cha";
          case "tec": return "int";
        }
        return "none";
      }
        

      // Tools - default to Intelligence
      else if (this.data.type === "tool") return "int";

      // Weapons
      else if (this.data.type === "weapon") {
        const wt = itemData.weaponType;

        // Weapons using the powercasting modifier
        // No current SW5e weapons use this, but it's worth checking just in case
        if (["mpak", "rpak"].includes(itemData.actionType)) {
          return actorData.attributes.powercasting || "int";
        }

        // Finesse weapons - Str or Dex (PHB pg. 147)
        else if (itemData.properties.fin === true) {
          return (actorData.abilities["dex"].mod >= actorData.abilities["str"].mod) ? "dex" : "str";
        }

        // Ranged weapons - Dex (PH p.194)
        else if ( ["simpleB", "martialB"].includes(wt) ) return "dex";
      }
      return "str";
    }

    // Case 3 - unknown
    return null
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement an attack roll as part of its usage
   * @type {boolean}
   */
  get hasAttack() {
    return ["mwak", "rwak", "mpak", "rpak"].includes(this.data.data.actionType);
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement a damage roll as part of its usage
   * @type {boolean}
   */
  get hasDamage() {
    return !!(this.data.data.damage && this.data.data.damage.parts.length);
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement a versatile damage roll as part of its usage
   * @type {boolean}
   */
  get isVersatile() {
    return !!(this.hasDamage && this.data.data.damage.versatile);
  }

  /* -------------------------------------------- */

  /**
   * Does the item provide an amount of healing instead of conventional damage?
   * @return {boolean}
   */
  get isHealing() {
    return (this.data.data.actionType === "heal") && this.data.data.damage.parts.length;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item implement a saving throw as part of its usage
   * @type {boolean}
   */
  get hasSave() {
    const save = this.data.data?.save || {};
    return !!(save.ability && save.scaling);
  }

  /* -------------------------------------------- */

  /**
   * Does the Item have a target
   * @type {boolean}
   */
  get hasTarget() {
    const target = this.data.data.target;
    return target && !["none",""].includes(target.type);
  }

  /* -------------------------------------------- */

  /**
   * Does the Item have an area of effect target
   * @type {boolean}
   */
  get hasAreaTarget() {
    const target = this.data.data.target;
    return target && (target.type in CONFIG.SW5E.areaTargetTypes);
  }

  /* -------------------------------------------- */

  /**
   * A flag for whether this Item is limited in it's ability to be used by charges or by recharge.
   * @type {boolean}
   */
  get hasLimitedUses() {
    let chg = this.data.data.recharge || {};
    let uses = this.data.data.uses || {};
    return !!chg.value || (uses.per && (uses.max > 0));
  }

  /* -------------------------------------------- */
  /*	Data Preparation														*/
  /* -------------------------------------------- */

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Get the Item's data
    const itemData = this.data;
    const data = itemData.data;
    const C = CONFIG.SW5E;
    const labels = this.labels = {};

    // Classes
    if ( itemData.type === "class" ) {
      data.levels = Math.clamped(data.levels, 1, 20);
    }

    // Power Level,  School, and Components
    if ( itemData.type === "power" ) {
      data.preparation.mode = data.preparation.mode || "prepared";
      labels.level = C.powerLevels[data.level];
      labels.school = C.powerSchools[data.school];
      labels.components = Object.entries(data.components).reduce((arr, c) => {
        if ( c[1] !== true ) return arr;
        arr.push(c[0].titleCase().slice(0, 1));
        return arr;
      }, []);
      labels.materials = data?.materials?.value ?? null;
    }

    // Feat Items
    else if ( itemData.type === "feat" ) {
      const act = data.activation;
      if ( act && (act.type === C.abilityActivationTypes.legendary) ) labels.featType = game.i18n.localize("SW5E.LegendaryActionLabel");
      else if ( act && (act.type === C.abilityActivationTypes.lair) ) labels.featType = game.i18n.localize("SW5E.LairActionLabel");
      else if ( act && act.type ) labels.featType = game.i18n.localize(data.damage.length ? "SW5E.Attack" : "SW5E.Action");
      else labels.featType = game.i18n.localize("SW5E.Passive");
    }

    // TODO: Something with all this
    // Species Items
    else if ( itemData.type === "species" ) {
    //  labels.species = C.species[data.species];
    }
    // Archetype Items
    else if ( itemData.type === "archetype" ) {
    //  labels.archetype = C.archetype[data.archetype];
    }
    // Background Items
    else if ( itemData.type === "background" ) {
    //  labels.background = C.background[data.background];
    }
    // Class Feature Items
    else if ( itemData.type === "classfeature" ) {
    //  labels.classFeature = C.classFeature[data.classFeature];
	}
    // Deployment Items
    else if ( itemData.type === "deployment" ) {
    //  labels.deployment = C.deployment[data.deployment];
	}
    // Venture Items
    else if ( itemData.type === "venture" ) {
    //  labels.venture = C.venture[data.venture];
	}	
	// Fighting Style Items
	else if ( itemData.type === "fightingstyle" ) {
    //  labels.fightingstyle = C.fightingstyle[data.fightingstyle];
	}
	// Fighting Mastery Items
	else if ( itemData.type === "fightingmastery" ) {
	//  labels.fightingmastery = C.fightingmastery[data.fightingmastery];
	}
	// Lightsaber Form Items
	else if ( itemData.type === "lightsaberform" ) {
	//  labels.lightsaberform = C.lightsaberform[data.lightsaberform];
	}

    // Equipment Items
    else if ( itemData.type === "equipment" ) {
      labels.armor = data.armor.value ? `${data.armor.value} ${game.i18n.localize("SW5E.AC")}` : "";
    }

    // Activated Items
    if ( data.hasOwnProperty("activation") ) {

      // Ability Activation Label
      let act = data.activation || {};
      if ( act ) labels.activation = [act.cost, C.abilityActivationTypes[act.type]].filterJoin(" ");

      // Target Label
      let tgt = data.target || {};
      if (["none", "touch", "self"].includes(tgt.units)) tgt.value = null;
      if (["none", "self"].includes(tgt.type)) {
        tgt.value = null;
        tgt.units = null;
      }
      labels.target = [tgt.value, C.distanceUnits[tgt.units], C.targetTypes[tgt.type]].filterJoin(" ");

      // Range Label
      let rng = data.range || {};
      if ( ["none", "touch", "self"].includes(rng.units) ) {
        rng.value = null;
        rng.long = null;
      }
      labels.range = [rng.value, rng.long ? `/ ${rng.long}` : null, C.distanceUnits[rng.units]].filterJoin(" ");

      // Duration Label
      let dur = data.duration || {};
      if (["inst", "perm"].includes(dur.units)) dur.value = null;
      labels.duration = [dur.value, C.timePeriods[dur.units]].filterJoin(" ");

      // Recharge Label
      let chg = data.recharge || {};
      labels.recharge = `${game.i18n.localize("SW5E.Recharge")} [${chg.value}${parseInt(chg.value) < 6 ? "+" : ""}]`;
    }

    // Item Actions
    if ( data.hasOwnProperty("actionType") ) {
      // Damage
      let dam = data.damage || {};
      if (dam.parts) {
        labels.damage = dam.parts.map(d => d[0]).join(" + ").replace(/\+ -/g, "- ");
        labels.damageTypes = dam.parts.map(d => C.damageTypes[d[1]]).join(", ");
      }
    }

    // if this item is owned, we prepareFinalAttributes() at the end of actor init
    if (!this.isOwned) this.prepareFinalAttributes();
  }

  /* -------------------------------------------- */

  /**
   * Compute item attributes which might depend on prepared actor data.
   */
  prepareFinalAttributes() {
    if ( this.data.data.hasOwnProperty("actionType") ) {
      // Saving throws
      this.getSaveDC();

      // To Hit
      this.getAttackToHit();

      // Limited Uses
      this.prepareMaxUses();

      // Damage Label
      this.getDerivedDamageLabel();
    }
  }

    /* -------------------------------------------- */

    /**
     * Populate a label with the compiled and simplified damage formula
     * based on owned item actor data. This is only used for display
     * purposes and is not related to Item5e#rollDamage
     *
     * @returns {Array} array of objects with `formula` and `damageType`
     */
    getDerivedDamageLabel() {
      const itemData = this.data.data;
      if ( !this.hasDamage || !itemData || !this.isOwned ) return [];

      const rollData = this.getRollData();

      const derivedDamage = itemData.damage?.parts?.map((damagePart) => ({
        formula: simplifyRollFormula(damagePart[0], rollData, { constantFirst: false }),
        damageType: damagePart[1],
      }));

      this.labels.derivedDamage = derivedDamage

      return derivedDamage;
    }

  /* -------------------------------------------- */

  /**
   * Update the derived power DC for an item that requires a saving throw
   * @returns {number|null}
   */
  getSaveDC() {
    if ( !this.hasSave ) return;
    const save = this.data.data?.save;

    // Actor power-DC based scaling
    if ( save.scaling === "power" ) {
      switch (this.data.data.school) {
        case "lgt": {
          save.dc = this.isOwned ? getProperty(this.actor.data, "data.attributes.powerForceLightDC") : null;
          break;
        }
        case "uni": {
          save.dc = this.isOwned ? getProperty(this.actor.data, "data.attributes.powerForceUnivDC") : null;
          break;
        }
        case "drk": {
          save.dc = this.isOwned ? getProperty(this.actor.data, "data.attributes.powerForceDarkDC") : null;
          break;
        }
        case "tec": {
          save.dc = this.isOwned ? getProperty(this.actor.data, "data.attributes.powerTechDC") : null;
          break;
        }
      }
    }

    // Ability-score based scaling
    else if ( save.scaling !== "flat" ) {
      save.dc = this.isOwned ? getProperty(this.actor.data, `data.abilities.${save.scaling}.dc`) : null;
    }

    // Update labels
    const abl = CONFIG.SW5E.abilities[save.ability];
    this.labels.save = game.i18n.format("SW5E.SaveDC", {dc: save.dc || "", ability: abl});
    return save.dc;
  }

  /* -------------------------------------------- */

  /**
   * Update a label to the Item detailing its total to hit bonus.
   * Sources:
   * - item entity's innate attack bonus
   * - item's actor's proficiency bonus if applicable
   * - item's actor's global bonuses to the given item type
   * - item's ammunition if applicable
   *
   * @returns {Object} returns `rollData` and `parts` to be used in the item's Attack roll
   */
  getAttackToHit() {
    const itemData = this.data.data;
    if ( !this.hasAttack || !itemData ) return;
    const rollData = this.getRollData();

    // Define Roll bonuses
    const parts = [];

    // Include the item's innate attack bonus as the initial value and label
    if ( itemData.attackBonus ) {
      parts.push(itemData.attackBonus)
      this.labels.toHit = itemData.attackBonus;
    }

    // Take no further action for un-owned items
    if ( !this.isOwned ) return {rollData, parts};

    // Ability score modifier
    parts.push(`@mod`);

    // Add proficiency bonus if an explicit proficiency flag is present or for non-item features
    if ( !["weapon", "consumable"].includes(this.data.type) || itemData.proficient ) {
      parts.push("@prof");
    }

    // Actor-level global bonus to attack rolls
    const actorBonus = this.actor.data.data.bonuses?.[itemData.actionType] || {};
    if ( actorBonus.attack ) parts.push(actorBonus.attack);

    // One-time bonus provided by consumed ammunition
    if ( (itemData.consume?.type === 'ammo') && !!this.actor.items ) {
      const ammoItemData = this.actor.items.get(itemData.consume.target)?.data;

      if (ammoItemData) {
        const ammoItemQuantity = ammoItemData.data.quantity;
        const ammoCanBeConsumed = ammoItemQuantity && (ammoItemQuantity - (itemData.consume.amount ?? 0) >= 0);
        const ammoItemAttackBonus = ammoItemData.data.attackBonus;
        const ammoIsTypeConsumable = (ammoItemData.type === "consumable") && (ammoItemData.data.consumableType === "ammo")
        if ( ammoCanBeConsumed && ammoItemAttackBonus && ammoIsTypeConsumable ) {
          parts.push("@ammo");
          rollData["ammo"] = ammoItemAttackBonus;
        }
      }
    }

    // Condense the resulting attack bonus formula into a simplified label
    let toHitLabel = simplifyRollFormula(parts.join('+'), rollData).trim();
    if (toHitLabel.charAt(0) !== '-') {
      toHitLabel = '+ ' + toHitLabel
    }
    this.labels.toHit = toHitLabel;

    // Update labels and return the prepared roll data
    return {rollData, parts};
  }

  /* -------------------------------------------- */

  /**
   * Populates the max uses of an item.
   * If the item is an owned item and the `max` is not numeric, calculate based on actor data.
   */
  prepareMaxUses() {
    const data = this.data.data;
    if (!data.uses?.max) return;
    let max = data.uses.max;

    // if this is an owned item and the max is not numeric, we need to calculate it
    if (this.isOwned && !Number.isNumeric(max)) {
      if (this.actor.data === undefined) return;
      try {
        max = Roll.replaceFormulaData(max, this.actor.getRollData(), {missing: 0, warn: true});
        max = Roll.safeEval(max);
      } catch(e) {
        console.error('Problem preparing Max uses for', this.data.name, e);
        return;
      }
    }
    data.uses.max = Number(max);
  }

  /* -------------------------------------------- */

  /**
   * Roll the item to Chat, creating a chat card which contains follow up attack or damage roll options
   * @param {boolean} [configureDialog]     Display a configuration dialog for the item roll, if applicable?
   * @param {string} [rollMode]             The roll display mode with which to display (or not) the card
   * @param {boolean} [createMessage]       Whether to automatically create a chat message (if true) or simply return
   *                                        the prepared chat message data (if false).
   * @return {Promise<ChatMessage|object|void>}
   */
  async roll({configureDialog=true, rollMode, createMessage=true}={}) {
    let item = this;
    const id = this.data.data;                // Item system data
    const actor = this.actor;
    const ad = actor.data.data;               // Actor system data

    // Reference aspects of the item data necessary for usage
    const hasArea = this.hasAreaTarget;       // Is the ability usage an AoE?
    const resource = id.consume || {};        // Resource consumption
    const recharge = id.recharge || {};       // Recharge mechanic
    const uses = id?.uses ?? {};              // Limited uses
    const isPower = this.type === "power";    // Does the item require a power slot?
    // TODO: Possibly Mod this to not consume slots based on class?
    // We could use this for feats and architypes that let a character cast one slot every rest or so
    const requirePowerSlot = isPower && (id.level > 0) && CONFIG.SW5E.powerUpcastModes.includes(id.preparation.mode);

    // Define follow-up actions resulting from the item usage
    let createMeasuredTemplate = hasArea;       // Trigger a template creation
    let consumeRecharge = !!recharge.value;     // Consume recharge
    let consumeResource = !!resource.target && resource.type !== "ammo" && !['simpleB', 'martialB'].includes(id.weaponType); // Consume a linked (non-ammo) resource, ignore if use is from a blaster
    let consumePowerSlot = requirePowerSlot;    // Consume a power slot
    let consumeUsage = !!uses.per;              // Consume limited uses
    let consumeQuantity = uses.autoDestroy;     // Consume quantity of the item in lieu of uses
    let consumePowerLevel = null;               // Consume a specific category of power slot
    if ( requirePowerSlot ) consumePowerLevel = id.preparation.mode === "pact" ? "pact" : `power${id.level}`;

  // Display a configuration dialog to customize the usage
    const needsConfiguration = createMeasuredTemplate || consumeRecharge || consumeResource || consumePowerSlot || consumeUsage;
    if (configureDialog && needsConfiguration) {
      const configuration = await AbilityUseDialog.create(this);
      if (!configuration) return;
      

      // Determine consumption preferences
      createMeasuredTemplate = Boolean(configuration.placeTemplate);
      consumeUsage = Boolean(configuration.consumeUse);
      consumeRecharge = Boolean(configuration.consumeRecharge);
      consumeResource = Boolean(configuration.consumeResource);
      consumePowerSlot = Boolean(configuration.consumeSlot);

      // Handle power upcasting
      if ( requirePowerSlot ) {
        consumePowerLevel = `power${configuration.level}`;
        if (consumePowerSlot === false) consumePowerLevel = null;
        const upcastLevel = parseInt(configuration.level);
        if (upcastLevel !== id.level) {
          item = this.clone({"data.level": upcastLevel}, {keepId: true});
          item.data.update({_id: this.id}); // Retain the original ID (needed until 0.8.2+)
          item.prepareFinalAttributes(); // Power save DC, etc...
        }
      }
    }

    // Determine whether the item can be used by testing for resource consumption
    const usage = item._getUsageUpdates({consumeRecharge, consumeResource, consumePowerLevel, consumeUsage, consumeQuantity});
    if ( !usage ) return;
    
    const {actorUpdates, itemUpdates, resourceUpdates} = usage;

    // Commit pending data updates
    if ( !foundry.utils.isObjectEmpty(itemUpdates) ) await item.update(itemUpdates);
    if ( consumeQuantity && (item.data.data.quantity === 0) ) await item.delete();
    if ( !foundry.utils.isObjectEmpty(actorUpdates) ) await actor.update(actorUpdates);
    if ( !foundry.utils.isObjectEmpty(resourceUpdates) ) {
      const resource = actor.items.get(id.consume?.target);
      if ( resource ) await resource.update(resourceUpdates);
    }

    // Initiate measured template creation
    if ( createMeasuredTemplate ) {
      const template = game.sw5e.canvas.AbilityTemplate.fromItem(item);
      if ( template ) template.drawPreview();
    }

    // Create or return the Chat Message data
    return item.displayCard({rollMode, createMessage});
  }

  /* -------------------------------------------- */

  /**
   * Verify that the consumed resources used by an Item are available.
   * Otherwise display an error and return false.
   * @param {boolean} consumeQuantity     Consume quantity of the item if other consumption modes are not available?
   * @param {boolean} consumeRecharge     Whether the item consumes the recharge mechanic
   * @param {boolean} consumeResource     Whether the item consumes a limited resource
   * @param {string|null} consumePowerLevel The category of power slot to consume, or null
   * @param {boolean} consumeUsage        Whether the item consumes a limited usage
   * @returns {object|boolean}            A set of data changes to apply when the item is used, or false
   * @private
   */
  _getUsageUpdates({consumeQuantity, consumeRecharge, consumeResource, consumePowerLevel, consumeUsage}) {

    // Reference item data
    const id = this.data.data;
    const actorUpdates = {};
    const itemUpdates = {};
    const resourceUpdates = {};

    // Consume Recharge
    if ( consumeRecharge ) {
      const recharge = id.recharge || {};
      if ( recharge.charged === false ) {
        ui.notifications.warn(game.i18n.format("SW5E.ItemNoUses", {name: this.name}));
        return false;
      }
      itemUpdates["data.recharge.charged"] = false;
    }

    // Consume Limited Resource
    if ( consumeResource ) {
      const canConsume = this._handleConsumeResource(itemUpdates, actorUpdates, resourceUpdates);
      if ( canConsume === false ) return false;
    }

    // Consume Power Slots and Force/Tech Points
    if ( consumePowerLevel ) {
      if ( Number.isNumeric(consumePowerLevel) ) consumePowerLevel = `power${consumePowerLevel}`;
      const level = this.actor?.data.data.powers[consumePowerLevel];
      const fp = this.actor.data.data.attributes.force.points;
      const tp = this.actor.data.data.attributes.tech.points;
      const powerCost = id.level + 1;
      const innatePower = this.actor.data.data.attributes.powercasting === 'innate';
      if (!innatePower){
        switch (id.school){
          case "lgt":
          case "uni":
          case "drk": {
            const powers = Number(level?.fvalue ?? 0);
            if ( powers === 0 ) {
              const label = game.i18n.localize(`SW5E.PowerLevel${id.level}`);
              ui.notifications.warn(game.i18n.format("SW5E.PowerCastNoSlots", {name: this.name, level: label}));
              return false;
            }
            actorUpdates[`data.powers.${consumePowerLevel}.fvalue`] = Math.max(powers - 1, 0);
            if (fp.temp >= powerCost) {
              actorUpdates["data.attributes.force.points.temp"] = fp.temp - powerCost;
            }else{
              actorUpdates["data.attributes.force.points.value"] = fp.value + fp.temp - powerCost;
              actorUpdates["data.attributes.force.points.temp"] = 0;
            }
            break;
          }
          case "tec": {
            const powers = Number(level?.tvalue ?? 0);
            if ( powers === 0 ) {
              const label = game.i18n.localize(`SW5E.PowerLevel${id.level}`);
              ui.notifications.warn(game.i18n.format("SW5E.PowerCastNoSlots", {name: this.name, level: label}));
              return false;
            }
            actorUpdates[`data.powers.${consumePowerLevel}.tvalue`] = Math.max(powers - 1, 0);
            if (tp.temp >= powerCost) {
              actorUpdates["data.attributes.tech.points.temp"] = tp.temp - powerCost;
            }else{
              actorUpdates["data.attributes.tech.points.value"] = tp.value + tp.temp - powerCost;
              actorUpdates["data.attributes.tech.points.temp"] = 0;
            }
            break;
          }
        }
      }
    }
    

    // Consume Limited Usage
    if ( consumeUsage ) {
      const uses = id.uses || {};
      const available = Number(uses.value ?? 0);
      let used = false;

      // Reduce usages
      const remaining = Math.max(available - 1, 0);
      if ( available >= 1 ) {
        used = true;
        itemUpdates["data.uses.value"] = remaining;
      }

      // Reduce quantity if not reducing usages or if usages hit 0 and we are set to consumeQuantity
      if ( consumeQuantity && (!used || (remaining === 0)) ) {
        const q = Number(id.quantity ?? 1);
        if ( q >= 1 ) {
          used = true;
          itemUpdates["data.quantity"] = Math.max(q - 1, 0);
          itemUpdates["data.uses.value"] = uses.max ?? 1;
        }
      }

      // If the item was not used, return a warning
      if ( !used ) {
        ui.notifications.warn(game.i18n.format("SW5E.ItemNoUses", {name: this.name}));
        return false;
      }
    }

    // Return the configured usage
    return {itemUpdates, actorUpdates, resourceUpdates};
  }

  /* -------------------------------------------- */

  /**
   * Handle update actions required when consuming an external resource
   * @param {object} itemUpdates        An object of data updates applied to this item
   * @param {object} actorUpdates       An object of data updates applied to the item owner (Actor)
   * @param {object} resourceUpdates    An object of data updates applied to a different resource item (Item)
   * @return {boolean|void}             Return false to block further progress, or return nothing to continue
   * @private
   */
  _handleConsumeResource(itemUpdates, actorUpdates, resourceUpdates) {
    const actor = this.actor;
    const itemData = this.data.data;
    const consume = itemData.consume || {};
    if ( !consume.type ) return;

    // No consumed target
    const typeLabel = CONFIG.SW5E.abilityConsumptionTypes[consume.type];
    if ( !consume.target ) {
      ui.notifications.warn(game.i18n.format("SW5E.ConsumeWarningNoResource", {name: this.name, type: typeLabel}));
      return false;
    }

    // Identify the consumed resource and its current quantity
    let resource = null;
    let amount = Number(consume.amount ?? 1);
    let quantity = 0;
    switch ( consume.type ) {
      case "attribute":
        resource = getProperty(actor.data.data, consume.target);
        quantity = resource || 0;
        break;
      case "ammo":
      case "material":
        resource = actor.items.get(consume.target);
        quantity = resource ? resource.data.data.quantity : 0;
        break;
      case "charges":
        resource = actor.items.get(consume.target);
        if ( !resource ) break;
        const uses = resource.data.data.uses;
        if ( uses.per && uses.max ) quantity = uses.value;
        else if ( resource.data.data.recharge?.value ) {
          quantity = resource.data.data.recharge.charged ? 1 : 0;
          amount = 1;
        }
        break;
    }

    // Verify that a consumed resource is available
    if ( !resource ) {
      ui.notifications.warn(game.i18n.format("SW5E.ConsumeWarningNoSource", {name: this.name, type: typeLabel}));
      return false;
    }

    // Verify that the required quantity is available
    let remaining = quantity - amount;
    if ( remaining < 0 ) {
      ui.notifications.warn(game.i18n.format("SW5E.ConsumeWarningNoQuantity", {name: this.name, type: typeLabel}));
      return false;
    }

    // Define updates to provided data objects
    switch ( consume.type ) {
      case "attribute":
        actorUpdates[`data.${consume.target}`] = remaining;
        break;
      case "ammo":
      case "material":
        resourceUpdates["data.quantity"] = remaining;
        break;
      case "charges":
        const uses = resource.data.data.uses || {};
        const recharge = resource.data.data.recharge || {};
        if ( uses.per && uses.max ) resourceUpdates["data.uses.value"] = remaining;
        else if ( recharge.value ) resourceUpdates["data.recharge.charged"] = false;
        break;
    }
  }

  /* -------------------------------------------- */

  /**
   * Display the chat card for an Item as a Chat Message
   * @param {object} options          Options which configure the display of the item chat card
   * @param {string} rollMode         The message visibility mode to apply to the created card
   * @param {boolean} createMessage   Whether to automatically create a ChatMessage entity (if true), or only return
   *                                  the prepared message data (if false)
   */
  async displayCard({rollMode, createMessage=true}={}) {

    // Render the chat card template
    const token = this.actor.token;
    const templateData = {
      actor: this.actor,
      tokenId: token?.uuid || null,
      item: this.data,
      data: this.getChatData(),
      labels: this.labels,
      hasAttack: this.hasAttack,
      isHealing: this.isHealing,
      hasDamage: this.hasDamage,
      isVersatile: this.isVersatile,
      isPower: this.data.type === "power",
      hasSave: this.hasSave,
      hasAreaTarget: this.hasAreaTarget,
      isTool: this.data.type === "tool"
    };
    const html = await renderTemplate("systems/sw5e/templates/chat/item-card.html", templateData);

    // Create the ChatMessage data object
    const chatData = {
      user: game.user.data._id,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      content: html,
      flavor: this.data.data.chatFlavor || this.name,
      speaker: ChatMessage.getSpeaker({actor: this.actor, token}),
      flags: {"core.canPopout": true}
    };

    // If the Item was destroyed in the process of displaying its card - embed the item data in the chat message
    if ( (this.data.type === "consumable") && !this.actor.items.has(this.id) ) {
      chatData.flags["sw5e.itemData"] = this.data;
    }

    // Apply the roll mode to adjust message visibility
    ChatMessage.applyRollMode(chatData, rollMode || game.settings.get("core", "rollMode"));

    // Create the Chat Message or return its data
    return createMessage ? ChatMessage.create(chatData) : chatData;
  }

  /* -------------------------------------------- */
  /*  Chat Cards																	*/
  /* -------------------------------------------- */

  /**
   * Prepare an object of chat data used to display a card for the Item in the chat log
   * @param {Object} htmlOptions    Options used by the TextEditor.enrichHTML function
   * @return {Object}               An object of chat data to render
   */
  getChatData(htmlOptions={}) {
    const data = foundry.utils.deepClone(this.data.data);
    const labels = this.labels;

    // Rich text description
    data.description.value = TextEditor.enrichHTML(data.description.value, htmlOptions);

    // Item type specific properties
    const props = [];
    const fn = this[`_${this.data.type}ChatData`];
    if ( fn ) fn.bind(this)(data, labels, props);

    // Equipment properties
    if ( data.hasOwnProperty("equipped") && !["loot", "tool"].includes(this.data.type) ) {
      if ( data.attunement === CONFIG.SW5E.attunementTypes.REQUIRED ) props.push(game.i18n.localize(CONFIG.SW5E.attunements[CONFIG.SW5E.attunementTypes.REQUIRED]));
      props.push(
        game.i18n.localize(data.equipped ? "SW5E.Equipped" : "SW5E.Unequipped"),
        game.i18n.localize(data.proficient ? "SW5E.Proficient" : "SW5E.NotProficient"),
      );
    }

    // Ability activation properties
    if ( data.hasOwnProperty("activation") ) {
      props.push(
        labels.activation + (data.activation?.condition ? ` (${data.activation.condition})` : ""),
        labels.target,
        labels.range,
        labels.duration
      );
    }

    // Filter properties and return
    data.properties = props.filter(p => !!p);
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for equipment type items
   * @private
   */
  _equipmentChatData(data, labels, props) {
    props.push(
      CONFIG.SW5E.equipmentTypes[data.armor.type],
      labels.armor || null,
      data.stealth.value ? game.i18n.localize("SW5E.StealthDisadvantage") : null
    );
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for weapon type items
   * @private
   */
  _weaponChatData(data, labels, props) {
    props.push(
      CONFIG.SW5E.weaponTypes[data.weaponType],
    );
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for consumable type items
   * @private
   */
  _consumableChatData(data, labels, props) {
    props.push(
      CONFIG.SW5E.consumableTypes[data.consumableType],
      data.uses.value + "/" + data.uses.max + " " + game.i18n.localize("SW5E.Charges")
    );
    data.hasCharges = data.uses.value >= 0;
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for tool type items
   * @private
   */
  _toolChatData(data, labels, props) {
    props.push(
      CONFIG.SW5E.abilities[data.ability] || null,
      CONFIG.SW5E.proficiencyLevels[data.proficient || 0]
    );
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for loot type items
   * @private
   */
  _lootChatData(data, labels, props) {
    props.push(
      game.i18n.localize("SW5E.ItemTypeLoot"),
      data.weight ? data.weight + " " + game.i18n.localize("SW5E.AbbreviationLbs") : null
    );
  }

  /* -------------------------------------------- */

  /**
   * Render a chat card for Power type data
   * @return {Object}
   * @private
   */
  _powerChatData(data, labels, props) {
    props.push(
      labels.level,
      labels.components + (labels.materials ? ` (${labels.materials})` : "")
    );
  }

  /* -------------------------------------------- */

  /**
   * Prepare chat card data for items of the "Feat" type
   * @private
   */
  _featChatData(data, labels, props) {
    props.push(data.requirements);
  }

  /* -------------------------------------------- */
  /*  Item Rolls - Attack, Damage, Saves, Checks  */
  /* -------------------------------------------- */

  /**
   * Place an attack roll using an item (weapon, feat, power, or equipment)
   * Rely upon the d20Roll logic for the core implementation
   *
   * @param {object} options        Roll options which are configured and provided to the d20Roll function
   * @return {Promise<Roll|null>}   A Promise which resolves to the created Roll instance
   */
  async rollAttack(options={}) {
    const itemData = this.data.data;
    const flags = this.actor.data.flags.sw5e || {};
    if ( !this.hasAttack ) {
      throw new Error("You may not place an Attack Roll with this Item.");
    }
    let title = `${this.name} - ${game.i18n.localize("SW5E.AttackRoll")}`;

    // get the parts and rollData for this item's attack
    const {parts, rollData} = this.getAttackToHit();

    // Handle ammunition consumption
    delete this._ammo;
    let ammo = null;
    let ammoUpdate = null;
    const consume = itemData.consume;
    if ( consume?.type === "ammo" ) {
      ammo = this.actor.items.get(consume.target);
      if (ammo?.data) {
        const q = ammo.data.data.quantity;
        const consumeAmount = consume.amount ?? 0;
        if ( q && (q - consumeAmount >= 0) ) {
          this._ammo = ammo;
          title += ` [${ammo.name}]`;
        }
      }

      // Get pending ammunition update
      const usage = this._getUsageUpdates({consumeResource: true});
      if ( usage === false ) return null;
      ammoUpdate = usage.resourceUpdates || {};
    }

    // Compose roll options
    const rollConfig = mergeObject({
      parts: parts,
      actor: this.actor,
      data: rollData,
      title: title,
      flavor: title,
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      dialogOptions: {
        width: 400,
        top: options.event ? options.event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: {"flags.sw5e.roll": {type: "attack", itemId: this.id }}
    }, options);
    rollConfig.event = options.event;

    // Expanded critical hit thresholds
    if (( this.data.type === "weapon" ) && flags.weaponCriticalThreshold) {
      rollConfig.critical = parseInt(flags.weaponCriticalThreshold);
    } else if (( this.data.type === "power" ) && flags.powerCriticalThreshold) {
      rollConfig.critical = parseInt(flags.powerCriticalThreshold);
    }

    // Elven Accuracy
    if ( flags.elvenAccuracy && ["dex", "int", "wis", "cha"].includes(this.abilityMod) ) {
      rollConfig.elvenAccuracy = true;
    }


    // Apply Halfling Lucky
    if ( flags.halflingLucky ) rollConfig.halflingLucky = true;

    // Invoke the d20 roll helper
    const roll = await d20Roll(rollConfig);
    if ( roll === false ) return null;

    // Commit ammunition consumption on attack rolls resource consumption if the attack roll was made
    if ( ammo && !isObjectEmpty(ammoUpdate) ) await ammo.update(ammoUpdate);
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Place a damage roll using an item (weapon, feat, power, or equipment)
   * Rely upon the damageRoll logic for the core implementation.
   * @param {MouseEvent} [event]    An event which triggered this roll, if any
   * @param {boolean} [critical]    Should damage be rolled as a critical hit?
   * @param {number} [powerLevel]   If the item is a power, override the level for damage scaling
   * @param {boolean} [versatile]   If the item is a weapon, roll damage using the versatile formula
   * @param {object} [options]      Additional options passed to the damageRoll function
   * @return {Promise<Roll>}        A Promise which resolves to the created Roll instance
   */
  rollDamage({critical=false, event=null, powerLevel=null, versatile=false, options={}}={}) {
    if ( !this.hasDamage ) throw new Error("You may not make a Damage Roll with this Item.");
    const itemData = this.data.data;
    const actorData = this.actor.data.data;
    const messageData = {"flags.sw5e.roll": {type: "damage", itemId: this.id }};

    // Get roll data
    const parts = itemData.damage.parts.map(d => d[0]);
    const rollData = this.getRollData();
    if ( powerLevel ) rollData.item.level = powerLevel;

    // Configure the damage roll
    const actionFlavor = game.i18n.localize(itemData.actionType === "heal" ? "SW5E.Healing" : "SW5E.DamageRoll");
    const title = `${this.name} - ${actionFlavor}`;
    const rollConfig = {
      actor: this.actor,
      critical: critical ?? event?.altKey ?? false,
      data: rollData,
      event: event,
      fastForward: event ? event.shiftKey || event.altKey || event.ctrlKey || event.metaKey : false,
      parts: parts,
      title: title,
      flavor: this.labels.damageTypes.length ? `${title} (${this.labels.damageTypes})` : title,
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      dialogOptions: {
        width: 400,
        top: event ? event.clientY - 80 : null,
        left: window.innerWidth - 710
      },
      messageData: messageData
    };

    // Adjust damage from versatile usage
    if ( versatile && itemData.damage.versatile ) {
      parts[0] = itemData.damage.versatile;
      messageData["flags.sw5e.roll"].versatile = true;
    }

    // Scale damage from up-casting powers
    if ( (this.data.type === "power") ) {
      if ( (itemData.scaling.mode === "atwill") ) {
        const level = this.actor.data.type === "character" ? actorData.details.level : actorData.details.powerLevel;
        this._scaleAtWillDamage(parts, itemData.scaling.formula, level, rollData);
      }
      else if ( powerLevel && (itemData.scaling.mode === "level") && itemData.scaling.formula ) {
        const scaling = itemData.scaling.formula;
        this._scalePowerDamage(parts, itemData.level, powerLevel, scaling, rollData);
      }
    }

    // Add damage bonus formula
    const actorBonus = getProperty(actorData, `bonuses.${itemData.actionType}`) || {};
    if ( actorBonus.damage && (parseInt(actorBonus.damage) !== 0) ) {
      parts.push(actorBonus.damage);
    }

    // Handle ammunition damage
    const ammoData = this._ammo?.data;

    // only add the ammunition damage if the ammution is a consumable with type 'ammo'
    if ( this._ammo && (ammoData.type === "consumable") && (ammoData.data.consumableType === "ammo") ) {
      parts.push("@ammo");
      rollData["ammo"] = ammoData.data.damage.parts.map(p => p[0]).join("+");
      rollConfig.flavor += ` [${this._ammo.name}]`;
      delete this._ammo;
    }

    // Scale melee critical hit damage
    if ( itemData.actionType === "mwak" ) {
      rollConfig.criticalBonusDice = this.actor.getFlag("sw5e", "meleeCriticalDamageDice") ?? 0;
    }

    // Call the roll helper utility
    return damageRoll(mergeObject(rollConfig, options));
  }

  /* -------------------------------------------- */

  /**
   * Adjust an at-will damage formula to scale it for higher level characters and monsters
   * @private
   */
  _scaleAtWillDamage(parts, scale, level, rollData) {
    const add = Math.floor((level + 1) / 6);
    if ( add === 0 ) return;
    this._scaleDamage(parts, scale || parts.join(" + "), add, rollData);
  }

  /* -------------------------------------------- */

  /**
   * Adjust the power damage formula to scale it for power level up-casting
   * @param {Array} parts         The original damage parts
   * @param {number} baseLevel    The default power level
   * @param {number} powerLevel   The casted power level
   * @param {string} formula      The scaling formula
   * @param {object} rollData     A data object that should be applied to the scaled damage roll
   * @return {string[]}           The scaled roll parts
   * @private
   */
  _scalePowerDamage(parts, baseLevel, powerLevel, formula, rollData) {
    const upcastLevels = Math.max(powerLevel - baseLevel, 0);
    if ( upcastLevels === 0 ) return parts;
    this._scaleDamage(parts, formula, upcastLevels, rollData);
  }

  /* -------------------------------------------- */

  /**
   * Scale an array of damage parts according to a provided scaling formula and scaling multiplier
   * @param {string[]} parts    Initial roll parts
   * @param {string} scaling    A scaling formula
   * @param {number} times      A number of times to apply the scaling formula
   * @param {object} rollData   A data object that should be applied to the scaled damage roll
   * @return {string[]}         The scaled roll parts
   * @private
   */
  _scaleDamage(parts, scaling, times, rollData) {
    if ( times <= 0 ) return parts;
    const p0 = new Roll(parts[0], rollData);
    const s = new Roll(scaling, rollData).alter(times);

    // Attempt to simplify by combining like dice terms
    let simplified = false;
    if ( (s.terms[0] instanceof Die) && (s.terms.length === 1) ) {
      const d0 = p0.terms[0];
      const s0 = s.terms[0];
      if ( (d0 instanceof Die) && (d0.faces === s0.faces) && d0.modifiers.equals(s0.modifiers) ) {
        d0.number += s0.number;
        parts[0] = p0.formula;
        simplified = true;
      }
    }

    // Otherwise add to the first part
    if ( !simplified ) {
      parts[0] = `${parts[0]} + ${s.formula}`;
    }
    return parts;
  }

  /* -------------------------------------------- */

  /**
   * Place an attack roll using an item (weapon, feat, power, or equipment)
   * Rely upon the d20Roll logic for the core implementation
   *
   * @return {Promise<Roll>}   A Promise which resolves to the created Roll instance
   */
  async rollFormula(options={}) {
    if ( !this.data.data.formula ) {
      throw new Error("This Item does not have a formula to roll!");
    }

    // Define Roll Data
    const rollData = this.getRollData();
    if ( options.powerLevel ) rollData.item.level = options.powerLevel;
    const title = `${this.name} - ${game.i18n.localize("SW5E.OtherFormula")}`;

    // Invoke the roll and submit it to chat
    const roll = new Roll(rollData.item.formula, rollData).roll();
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: title,
      rollMode: game.settings.get("core", "rollMode"),
      messageData: {"flags.sw5e.roll": {type: "other", itemId: this.id }}
    });
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Perform an ability recharge test for an item which uses the d6 recharge mechanic
   * @return {Promise<Roll>}   A Promise which resolves to the created Roll instance
   */
  async rollRecharge() {
    const data = this.data.data;
    if ( !data.recharge.value ) return;

    // Roll the check
    const roll = new Roll("1d6").roll();
    const success = roll.total >= parseInt(data.recharge.value);

    // Display a Chat Message
    const promises = [roll.toMessage({
      flavor: `${game.i18n.format("SW5E.ItemRechargeCheck", {name: this.name})} - ${game.i18n.localize(success ? "SW5E.ItemRechargeSuccess" : "SW5E.ItemRechargeFailure")}`,
      speaker: ChatMessage.getSpeaker({actor: this.actor, token: this.actor.token})
    })];

    // Update the Item data
    if ( success ) promises.push(this.update({"data.recharge.charged": true}));
    return Promise.all(promises).then(() => roll);
  }

  /* -------------------------------------------- */

  /**
   * Roll a Tool Check. Rely upon the d20Roll logic for the core implementation
   * @prarm {Object} options   Roll configuration options provided to the d20Roll function
   * @return {Promise<Roll>}   A Promise which resolves to the created Roll instance
   */
  rollToolCheck(options={}) {
    if ( this.type !== "tool" ) throw "Wrong item type!";

    // Prepare roll data
    let rollData = this.getRollData();
    const parts = [`@mod`, "@prof"];
    const title = `${this.name} - ${game.i18n.localize("SW5E.ToolCheck")}`;

    // Add global actor bonus
    const bonuses = getProperty(this.actor.data.data, "bonuses.abilities") || {};
    if ( bonuses.check ) {
      parts.push("@checkBonus");
      rollData.checkBonus = bonuses.check;
    }

    // Compose the roll data
    const rollConfig = mergeObject({
      parts: parts,
      data: rollData,
      title: title,
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      flavor: title,
      dialogOptions: {
        width: 400,
        top: options.event ? options.event.clientY - 80 : null,
        left: window.innerWidth - 710,
      },
      chooseModifier: true,
      halflingLucky: this.actor.getFlag("sw5e", "halflingLucky" ) || false,
      reliableTalent: (this.data.data.proficient >= 1) && this.actor.getFlag("sw5e", "reliableTalent"),
      messageData: {"flags.sw5e.roll": {type: "tool", itemId: this.id }}
    }, options);
    rollConfig.event = options.event;

    // Call the roll helper utility
    return d20Roll(rollConfig);
  }

  /* -------------------------------------------- */

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    // Include an ability score modifier if one exists
    const abl = this.abilityMod;
    if ( abl ) {
      const ability = rollData.abilities[abl];
      if ( !ability ) {
        console.warn(`Item ${this.name} in Actor ${this.actor.name} has an invalid item ability modifier of ${abl} defined`);
      }
      rollData["mod"] = ability?.mod || 0;
    }

    // Include a proficiency score
    const prof = ("proficient" in rollData.item) ? (rollData.item.proficient || 0) : 1;
    rollData["prof"] = Math.floor(prof * (rollData.attributes.prof || 0));
    return rollData;
  }

  /* -------------------------------------------- */
  /*  Chat Message Helpers                        */
  /* -------------------------------------------- */

  static chatListeners(html) {
    html.on('click', '.card-buttons button', this._onChatCardAction.bind(this));
    html.on('click', '.item-name', this._onChatCardToggleContent.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle execution of a chat card action via a click event on one of the card buttons
   * @param {Event} event       The originating click event
   * @returns {Promise}         A promise which resolves once the handler workflow is complete
   * @private
   */
  static async _onChatCardAction(event) {
    event.preventDefault();

    // Extract card data
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message =  game.messages.get(messageId);
    const action = button.dataset.action;

    // Validate permission to proceed with the roll
    const isTargetted = action === "save";
    if ( !( isTargetted || game.user.isGM || message.isAuthor ) ) return;

    // Recover the actor for the chat card
    const actor = await this._getChatCardActor(card);
    if ( !actor ) return;

    // Get the Item from stored flag data or by the item ID on the Actor
    const storedData = message.getFlag("sw5e", "itemData");
    const item = storedData ? new this(storedData, {parent: actor}) : actor.items.get(card.dataset.itemId);
    if ( !item ) {
      return ui.notifications.error(game.i18n.format("SW5E.ActionWarningNoItem", {item: card.dataset.itemId, name: actor.name}))
    }
    const powerLevel = parseInt(card.dataset.powerLevel) || null;

    // Handle different actions
    switch ( action ) {
      case "attack":
        await item.rollAttack({event}); break;
      case "damage":
      case "versatile":
        await item.rollDamage({
          critical: event.altKey,
          event: event,
          powerLevel: powerLevel,
          versatile: action === "versatile"
        });
        break;
      case "formula":
        await item.rollFormula({event, powerLevel}); break;
      case "save":
        const targets = this._getChatCardTargets(card);
        for ( let token of targets ) {
          const speaker = ChatMessage.getSpeaker({scene: canvas.scene, token: token});
          await token.actor.rollAbilitySave(button.dataset.ability, { event, speaker });
        }
        break;
      case "toolCheck":
        await item.rollToolCheck({event}); break;
      case "placeTemplate":
        const template = game.sw5e.canvas.AbilityTemplate.fromItem(item);
        if ( template ) template.drawPreview();
        break;
    }

    // Re-enable the button
    button.disabled = false;
  }

  /* -------------------------------------------- */

  /**
   * Handle toggling the visibility of chat card content when the name is clicked
   * @param {Event} event   The originating click event
   * @private
   */
  static _onChatCardToggleContent(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const card = header.closest(".chat-card");
    const content = card.querySelector(".card-content");
    content.style.display = content.style.display === "none" ? "block" : "none";
  }

  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor|null}         The Actor entity or null
   * @private
   */
  static async _getChatCardActor(card) {

    // Case 1 - a synthetic actor from a Token
    if ( card.dataset.tokenId ) {
      const token = await fromUuid(card.dataset.tokenId);
      if ( !token ) return null;
      return token.actor;
    }

    // Case 2 - use Actor ID directory
    const actorId = card.dataset.actorId;
    return game.actors.get(actorId) || null;
  }

  /* -------------------------------------------- */

  /**
   * Get the Actor which is the author of a chat card
   * @param {HTMLElement} card    The chat card being used
   * @return {Actor[]}            An Array of Actor entities, if any
   * @private
   */
  static _getChatCardTargets(card) {
    let targets = canvas.tokens.controlled.filter(t => !!t.actor);
    if ( !targets.length && game.user.character ) targets = targets.concat(game.user.character.getActiveTokens());
    if ( !targets.length ) ui.notifications.warn(game.i18n.localize("SW5E.ActionWarningNoToken"));
    return targets;
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if ( !this.isEmbedded || (this.parent.type === "vehicle") ) return;
    const actorData = this.parent.data;
    const isNPC = this.parent.type === "npc";
    let updates;
    switch (data.type) {
      case "equipment":
        updates = this._onCreateOwnedEquipment(data, actorData, isNPC);
        break;
      case "weapon":
        updates = this._onCreateOwnedWeapon(data, actorData, isNPC);
        break;
      case "power":
        updates = this._onCreateOwnedPower(data, actorData, isNPC);
        break;
    }
    if (updates) return this.data.update(updates);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    // The below options are only needed for character classes
    if ( userId !== game.user.id ) return;
    const isCharacterClass = this.parent && (this.parent.type !== "vehicle") && (this.type === "class");
    if ( !isCharacterClass ) return;

    // Assign a new primary class
    const pc = this.parent.items.get(this.parent.data.data.details.originalClass);
    if ( !pc ) this.parent._assignPrimaryClass();

    // Prompt to add new class features
    if (options.addFeatures === false) return;
    this.parent.getClassFeatures({
      className: this.name,
      archetypeName: this.data.data.archetype,
      level: this.data.data.levels
    }).then(features => {
      return this.parent.addEmbeddedItems(features, options.promptAddFeatures);
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    // The below options are only needed for character classes
    if ( userId !== game.user.id ) return;
    const isCharacterClass = this.parent && (this.parent.type !== "vehicle") && (this.type === "class");
    if ( !isCharacterClass ) return;

    // Prompt to add new class features
    const addFeatures = changed["name"] || (changed.data && ["archetype", "levels"].some(k => k in changed.data));
    if ( !addFeatures || (options.addFeatures === false) ) return;
    this.parent.getClassFeatures({
      className: changed.name || this.name,
      archetypeName: changed.data?.archetype || this.data.data.archetype,
      level: changed.data?.levels || this.data.data.levels
    }).then(features => {
      return this.parent.addEmbeddedItems(features, options.promptAddFeatures);
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onDelete(options, userId) {
    super._onDelete(options, userId);

    // Assign a new primary class
    if ( this.parent && (this.type === "class") && (userId === game.user.id) )  {
      if ( this.id !== this.parent.data.data.details.originalClass ) return;
      this.parent._assignPrimaryClass();
    }
  }

  /* -------------------------------------------- */

  /**
   * Pre-creation logic for the automatic configuration of owned equipment type Items
   * @private
   */
  _onCreateOwnedEquipment(data, actorData, isNPC) {
    const updates = {};
    if ( foundry.utils.getProperty(data, "data.equipped") === undefined ) {
      updates["data.equipped"] = isNPC;  // NPCs automatically equip equipment
    }
    if ( foundry.utils.getProperty(data, "data.proficient") === undefined ) {
      if ( isNPC ) {
        updates["data.proficient"] = true;  // NPCs automatically have equipment proficiency
      } else {
        const armorProf = CONFIG.SW5E.armorProficienciesMap[data.data?.armor?.type]; // Player characters check proficiency
        const actorArmorProfs = actorData.data.traits?.armorProf?.value || [];
        updates["data.proficient"] = (armorProf === true) || actorArmorProfs.includes(armorProf);
      }
    }
    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Pre-creation logic for the automatic configuration of owned power type Items
   * @private
   */
  _onCreateOwnedPower(data, actorData, isNPC) {
    const updates = {};
    updates["data.preparation.prepared"] = true;       // Automatically prepare powers for everyone
    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Pre-creation logic for the automatic configuration of owned weapon type Items
   * @private
   */
  _onCreateOwnedWeapon(data, actorData, isNPC) {
    const updates = {};
    if ( foundry.utils.getProperty(data, "data.equipped") === undefined ) {
      updates["data.equipped"] = isNPC;       // NPCs automatically equip weapons
    }
    if ( foundry.utils.getProperty(data, "data.proficient") === undefined ) {
      if ( isNPC ) {
        updates["data.proficient"] = true;    // NPCs automatically have equipment proficiency
      } else {
        // TODO: With the changes to make weapon proficiencies more verbose, this may need revising
        const weaponProf = CONFIG.SW5E.weaponProficienciesMap[data.data?.weaponType]; // Player characters check proficiency
        const actorWeaponProfs = actorData.data.traits?.weaponProf?.value || [];
        updates["data.proficient"] = (weaponProf === true) || actorWeaponProfs.includes(weaponProf);
      }
    }
    return updates;
  }

  /* -------------------------------------------- */
  /*  Factory Methods                             */
  /* -------------------------------------------- */
// TODO: Make work properly
  /**
   * Create a consumable power scroll Item from a power Item.
   * @param {Item5e} power      The power to be made into a scroll
   * @return {Item5e}           The created scroll consumable item
   */
  static async createScrollFromPower(power) {

    // Get power data
    const itemData = power instanceof Item5e ? power.data : power;
    const {actionType, description, source, activation, duration, target, range, damage, save, level} = itemData.data;

    // Get scroll data
    const scrollUuid = `Compendium.${CONFIG.SW5E.sourcePacks.ITEMS}.${CONFIG.SW5E.powerScrollIds[level]}`;
    const scrollItem = await fromUuid(scrollUuid);
    const scrollData = scrollItem.data;
    delete scrollData._id;

    // Split the scroll description into an intro paragraph and the remaining details
    const scrollDescription = scrollData.data.description.value;
    const pdel = '</p>';
    const scrollIntroEnd = scrollDescription.indexOf(pdel);
    const scrollIntro = scrollDescription.slice(0, scrollIntroEnd + pdel.length);
    const scrollDetails = scrollDescription.slice(scrollIntroEnd + pdel.length);

    // Create a composite description from the scroll description and the power details
    const desc = `${scrollIntro}<hr/><h3>${itemData.name} (Level ${level})</h3><hr/>${description.value}<hr/><h3>Scroll Details</h3><hr/>${scrollDetails}`;

    // Create the power scroll data
    const powerScrollData = mergeObject(scrollData, {
      name: `${game.i18n.localize("SW5E.PowerScroll")}: ${itemData.name}`,
      img: itemData.img,
      data: {
        "description.value": desc.trim(),
        source,
        actionType,
        activation,
        duration,
        target,
        range,
        damage,
        save,
        level
      }
    });
    return new this(powerScrollData);
  }
}
