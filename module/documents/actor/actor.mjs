import Proficiency from "./proficiency.mjs";
import * as Trait from "./trait.mjs";
import ScaleValueAdvancement from "../advancement/scale-value.mjs";
import SystemDocumentMixin from "../mixins/document.mjs";
import { d20Roll, attribDieRoll } from "../../dice/dice.mjs";
import { simplifyBonus, fromUuidSynchronous } from "../../utils.mjs";
import ShortRestDialog from "../../applications/actor/short-rest.mjs";
import LongRestDialog from "../../applications/actor/long-rest.mjs";
import RechargeRepairDialog from "../../applications/actor/recharge-repair.mjs";
import RefittingRepairDialog from "../../applications/actor/refitting-repair.mjs";
import RegenRepairDialog from "../../applications/actor/regen-repair.mjs";
import AllocatePowerDice from "../../applications/actor/allocate-power-dice.mjs";
import ExpendPowerDice from "../../applications/actor/expend-power-dice.mjs";
import ActiveEffect5e from "../active-effect.mjs";
import PropertyAttribution from "../../applications/property-attribution.mjs";

/**
 * Extend the base Actor class to implement additional system-specific logic for SW5e.
 */
export default class Actor5e extends SystemDocumentMixin(Actor) {
  /**
   * The data source for Actor5e.classes allowing it to be lazily computed.
   * @type {Object<Item5e>}
   * @private
   */
  _classes;

  /**
   * The data source for Actor5e.deployments allowing it to be lazily computed.
   * @type {Object<Item5e>}
   * @private
   */
  _deployments;

  /**
   * The data source for Actor5e.starships allowing it to be lazily computed.
   * @type {Object<Item5e>}
   * @private
   */
  _starships;

  /**
   * The data source for Actor5e.focuses allowing it to be lazily computed.
   * @type {Object<Item5e>}
   * @private
   */
  _focuses;

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * A mapping of classes belonging to this Actor.
   * @type {Object<Item5e>}
   */
  get classes() {
    if (this._classes !== undefined) return this._classes;
    if (!["character", "npc"].includes(this.type)) return (this._classes = {});
    return (this._classes = this.items
      .filter(item => item.type === "class")
      .reduce((obj, cls) => {
        obj[cls.identifier] = cls;
        return obj;
      }, {}));
  }

  /* -------------------------------------------- */

  /**
   * A mapping of deployments belonging to this Actor.
   * @type {Object<string, Item5e>}
   */
  get deployments() {
    if (this._deployments !== undefined) return this._deployments;
    if (!["character", "npc"].includes(this.type)) return (this._deployments = {});
    return (this._deployments = this.items
      .filter(item => item.type === "deployment")
      .reduce((obj, dep) => {
        obj[dep.identifier] = dep;
        return obj;
      }, {}));
  }

  /* -------------------------------------------- */

  /**
   * A mapping of starships belonging to this Actor.
   * @type {Object<string, Item5e>}
   */
  get starships() {
    if (this._starships !== undefined) return this._starships;
    if (this.type !== "starship") return (this._starships = {});
    return (this._starships = this.items
      .filter(item => item.type === "starshipsize")
      .reduce((obj, sship) => {
        obj[sship.identifier] = sship;
        return obj;
      }, {}));
  }

  /* -------------------------------------------- */

  /**
   * A mapping of focuses equipped by this Actor.
   * @type {Object<Item5e>}
   */
  get focuses() {
    if (this._focuses !== undefined) return this._focuses;
    if (!["character", "npc"].includes(this.type)) return (this._focuses = {});
    return (this._focuses = this.items
      .filter(item =>
        item.type === "equipment"
        && Object.values(CONFIG.SW5E.powerFocus).includes(item.system.type.value)
        && item.system.equipped
      ).reduce((obj, focus) => {
        const type = focus.system.type.value;
        if (obj[type] !== undefined) this._preparationWarnings.push({
          message: game.i18n.format("SW5E.WarnMultiplePowercastingFocus", { type }),
          type: "warning"
        });
        obj[type] = focus;
        return obj;
      }, {}));
  }

  /* -------------------------------------------- */

  /**
   * Is this Actor currently polymorphed into some other creature?
   * @type {boolean}
   */
  get isPolymorphed() {
    return this.getFlag("sw5e", "isPolymorphed") || false;
  }

  /* -------------------------------------------- */

  /**
   * The Actor's currently equipped armor, if any.
   * @type {Item5e|null}
   */
  get armor() {
    return this.system.attributes.ac.equippedArmor ?? null;
  }

  /* -------------------------------------------- */

  /**
   * The Actor's currently equipped shield, if any.
   * @type {Item5e|null}
   */
  get shield() {
    return this.system.attributes.ac.equippedShield ?? null;
  }

  /* -------------------------------------------- */

  /**
   * Get which type of caster the actor is.
   * @type {Array<string>}
   */
  get caster() {
    const types = [];
    for (const prog of ["force", "tech"]) if (this.system.attributes[prog].level || this.system.attributes[prog].known.value) types.push(prog);
    if (this.system.attributes.super.level || this.system.attributes.super.known.value) types.push("super");
    return types;
  }

  /* -------------------------------------------- */
  /*  Methods                                     */
  /* -------------------------------------------- */

  /** @inheritdoc */
  _initializeSource(source, options = {}) {
    source = super._initializeSource(source, options);
    if (!source._id || !options.pack || sw5e.moduleArt.suppressArt) return source;
    const uuid = `Compendium.${options.pack}.${source._id}`;
    const art = game.sw5e.moduleArt.map.get(uuid);
    if (art?.actor || art?.token) {
      if (art.actor) source.img = art.actor;
      if (typeof art.token === "string") source.prototypeToken.texture.src = art.token;
      else if (art.token) foundry.utils.mergeObject(source.prototypeToken, art.token);
      const biography = source.system.details?.biography;
      if (art.credit && biography) {
        if (typeof biography.value !== "string") biography.value = "";
        biography.value += `<p>${art.credit}</p>`;
      }
    }
    return source;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareData() {
    if ( !game.template.Actor.types.includes(this.type) ) return super.prepareData();
    this._classes = undefined;
    this._deployments = undefined;
    this._starships = undefined;
    this._focuses = undefined;
    this._preparationWarnings = [];
    super.prepareData();
    this.items.forEach(item => item.prepareFinalAttributes());
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareBaseData() {
    if ( !game.template.Actor.types.includes(this.type) ) return;
    if ( this.type !== "group" ) this._prepareBaseArmorClass();

    // Type-specific preparation
    switch (this.type) {
      case "character":
        return this._prepareCharacterData();
      case "npc":
        return this._prepareNPCData();
      case "starship":
        return this._prepareBaseStarshipData();
      case "vehicle":
        return this._prepareVehicleData();
    }
  }

  /* --------------------------------------------- */

  /** @inheritDoc */
  applyActiveEffects() {
    this._prepareScaleValues();
    if ( this.system?.prepareEmbeddedData instanceof Function ) this.system.prepareEmbeddedData();
    // The Active Effects do not have access to their parent at preparation time, so we wait until this stage to
    // determine whether they are suppressed or not.
    for ( const effect of this.allApplicableEffects() ) {
      effect.determineSuppression();
    }
    return super.applyActiveEffects();
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    if ( !game.template.Actor.types.includes(this.type) || (this.type === "group") ) return;

    const flags = this.flags.sw5e || {};
    this.labels = {};

    // Retrieve data for polymorphed actors
    let originalSaves = null;
    let originalSkills = null;
    if (this.isPolymorphed) {
      const transformOptions = flags.transformOptions;
      const original = game.actors?.get(flags.originalActor);
      if (original) {
        if (transformOptions.mergeSaves) originalSaves = original.system.abilities;
        if (transformOptions.mergeSkills) originalSkills = original.system.skills;
      }
    }

    // Prepare abilities, skills, & everything else
    const globalBonuses = this.system.bonuses?.abilities ?? {};
    const rollData = this.getRollData();
    const checkBonus = simplifyBonus(globalBonuses?.check, rollData);
    this._prepareAbilities(rollData, globalBonuses, checkBonus, originalSaves);
    this._prepareSkills(rollData, globalBonuses, checkBonus, originalSkills);
    this._prepareTools(rollData, globalBonuses, checkBonus);
    this._prepareArmorClass();
    this._prepareEncumbrance();
    this._prepareHitPoints(rollData);
    this._prepareInitiative(rollData, checkBonus);
    this._preparePowercasting(rollData);
    this._prepareSuperiority(rollData);
    this._prepareStarshipData();
  }

  /* -------------------------------------------- */

  /**
   * Return the amount of experience required to gain a certain character level.
   * @param {number} level  The desired level.
   * @returns {number}      The XP required.
   */
  getLevelExp(level) {
    const levels = CONFIG.SW5E.CHARACTER_EXP_LEVELS;
    return levels[Math.min(level, levels.length - 1)];
  }

  /* -------------------------------------------- */

  /**
   * Return the amount of experience granted by killing a creature of a certain CR.
   * @param {number} cr     The creature's challenge rating.
   * @returns {number}      The amount of experience granted per kill.
   */
  getCRExp(cr) {
    if (cr < 1.0) return Math.max(200 * cr, 10);
    return CONFIG.SW5E.CR_EXP_LEVELS[cr];
  }

  /* -------------------------------------------- */

  /**
   * Return the amount of prestige required to gain a certain rank level.
   * @param {number} rank   The derired rank.
   * @returns {number}      The prestige required.
   */
  getRankExp(rank) {
    const ranks = CONFIG.SW5E.CHARACTER_RANK_LEVELS;
    return ranks[Math.min(rank, ranks.length - 1)];
  }

  /* -------------------------------------------- */

  /**
   * @inheritdoc
   * @param {object} [options]
   * @param {boolean} [options.deterministic] Whether to force deterministic values for data properties that could be
   *                                          either a die term or a flat term.
   */
  getRollData({ deterministic = false } = {}) {
    let data;
    if ( this.system.getRollData ) data = this.system.getRollData({ deterministic });
    else data = {...super.getRollData()};
    data.flags = {...this.flags};
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Return data related to the installation of an item in a starship.
   * @param {string} itemId       The id of the item.
   * @returns {
   *           {Number} minCrew      The minimum crew required to install.
   *           {Number} installCost  The credits cost to install.
   *           {Number} installTime  The time taken to install.
   *         }
   */
  getInstallationData(itemId) {
    if (this.type !== "starship") return [0, 0, 0];

    const item = this.items.get(itemId);
    const ship = this.itemTypes.starshipsize?.[0];

    const itemData = item.system;
    const shipData = ship.system;

    const isMod = item.type === "starshipmod";
    const isWpn = item.type === "weapon";

    const baseCost = isMod ? itemData.baseCost?.value ?? itemData.baseCost?.default ?? 0 : itemData.price?.value ?? 0;
    const sizeMult = isMod ? shipData.modCostMult ?? 1 : isWpn ? 1 : shipData.equipCostMult ?? 1;
    const gradeMult = isMod ? Number(itemData.grade.value) || 1 : 1;
    const fullCost = baseCost * sizeMult * gradeMult;

    const minCrew = isMod ? shipData.modMinWorkforce : shipData.equipMinWorkforce;
    const installCost = Math.ceil(fullCost / 2);
    const installTime = (baseCost * sizeMult) / (500 * minCrew);
    // TODO SW5E: accept a 'crew' parameter to use instead of minCrew in the install time calculation
    //       pottentially add a checkbox for players working, to decrease/remove the installation cost

    return { minCrew, installCost, installTime };
  }

  /* -------------------------------------------- */

  /**
   * Add the default items that every starship has.
   */
  async addStarshipDefaults() {
    if (this.items.size !== 0) return;

    const items = [];

    const pack = await game.packs.get("sw5e.starshipactions");
    const actions = await pack.getDocuments();
    for (const action of actions) items.push(action.toObject());

    for (const id of CONFIG.SW5E.ssDefaultEquipment) {
      const item = (await fromUuid(id)).toObject();
      item.system.equipped = true;
      items.push(item);
    }

    await this.createEmbeddedDocuments("Item", items);
  }

  /* -------------------------------------------- */
  /*  Base Data Preparation Helpers               */
  /* -------------------------------------------- */

  /**
   * Initialize derived AC fields for Active Effects to target.
   * Mutates the system.attributes.ac object.
   * @protected
   */
  _prepareBaseArmorClass() {
    const ac = this.system.attributes.ac;
    ac.armor = 10;
    ac.shield = ac.cover = 0;
    ac.bonus = "";
  }

  /* -------------------------------------------- */

  /**
   * Derive any values that have been scaled by the Advancement system.
   * Mutates the value of the `system.scale` object.
   * @protected
   */
  _prepareScaleValues() {
    this.system.scale = this.items.reduce((scale, item) => {
      if ( ScaleValueAdvancement.metadata.validItemTypes.has(item.type) ) scale[item.identifier] = item.scaleValues;
      return scale;
    }, {});

    const superiority = this.system?.attributes?.super;
    if (superiority?.level) {
      if (this.system.scale.superiority) ui.notifications.warn("SW5E.SuperiorityIdentifierWarn");
      this.system.scale.superiority = superiority;
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare base data related to the power-casting capabilities of the Actor.
   * Mutates the value of the system.powers object.
   * @protected
   */
  _prepareBasePowercasting() {
    if (this.type === "vehicle" || this.type === "starship") return;

    const isNPC = this.type === "npc";

    // Prepare base progression data
    const charProgression = ["force", "tech"].reduce((obj, castType) => {
      obj[castType] = {
        castType,
        prefix: castType.slice(0, 1),
        powersKnownCur: 0,
        powersKnownMax: 0,
        points: 0,
        casterLevel: 0,
        maxPowerLevel: 0,
        maxClassProg: null,
        maxClassLevel: 0,
        classes: 0,
        attributeOverride: null
      };
      return obj;
    }, {});

    if (isNPC) {
      for (const progression of Object.values(charProgression)) {
        const level = this.system?.details?.[`power${progression.castType.capitalize()}Level`];
        if (level) {
          progression.classes = 1;
          progression.points = level * CONFIG.SW5E.powerPointsBase.full;
          progression.casterLevel = level;
          progression.maxClassLevel = level;
          progression.maxClassProg = "full";
        }
      }
    } else {
      // Translate the list of classes into force and tech power-casting progression
      for (const cls of this.itemTypes.class) {
        const cd = cls.system;
        const ad = cls?.archetype?.system;
        const levels = cd.levels;
        if (levels < 1) continue;
        for (const progression of Object.values(charProgression)) {
          const castType = progression.castType;

          let prog = ad?.powercasting?.[castType] ?? "none";
          if (prog === "none") prog = cd?.powercasting?.[castType] ?? "none";

          if (!(prog in CONFIG.SW5E.powerProgression) || prog === "none") continue;
          if (prog === "half" && castType === "tech" && levels < 2) continue; // Tech half-casters only get techcasting at lvl 2

          for (let d of [ad, cd]) {
            let override = d?.powercasting?.[`${castType}Override`];
            if (override in CONFIG.SW5E.abilities) {
              if (progression.override) this._preparationWarnings.push({
                message: game.i18n.localize("SW5E.WarnMultiplePowercastingOverride"),
                type: "warning"
              });
              progression.override = override;
            }
          }

          const known = CONFIG.SW5E.powersKnown[castType][prog][levels];
          const points = levels * CONFIG.SW5E.powerPointsBase[prog];
          const casterLevel = levels * (CONFIG.SW5E.powerMaxLevel[prog][20] / 9);

          progression.classes++;
          progression.powersKnownMax += known;
          progression.points += points;
          progression.casterLevel += casterLevel;

          if (levels > progression.maxClassLevel) {
            progression.maxClassLevel = levels;
            progression.maxClassProg = prog;
          }
        }
      }

      // Calculate known powers
      for (const pwr of this.itemTypes.power) {
        if ( pwr?.system?.preparation?.mode === "innate" || pwr?.system?.components?.freeLearn ) continue;
        const school = pwr?.system?.school;
        if (["lgt", "uni", "drk"].includes(school)) charProgression.force.powersKnownCur++;
        if ("tec" === school) charProgression.tech.powersKnownCur++;
      }

      charProgression.tech.points /= 2;
    }

    // Apply progression data
    for (const progression of Object.values(charProgression)) {
      // 'Round Appropriately'
      progression.points = Math.round(progression.points);
      progression.casterLevel = Math.round(progression.casterLevel);

      // What level is considered 'high level casting'
      progression.limit = CONFIG.SW5E.powerLimit[progression.maxClassProg];

      // What is the maximum power level you can cast
      if (progression.classes) {
        if (progression.classes === 1) {
          progression.maxPowerLevel = CONFIG.SW5E.powerMaxLevel[progression.maxClassProg][progression.maxClassLevel];
        } else {
          progression.maxPowerLevel = CONFIG.SW5E.powerMaxLevel.full[progression.casterLevel];
        }
      }

      // Shortcuts to make the code cleaner
      const p = progression.prefix;
      const pmax = `${p}max`;
      const pval = `${p}value`;

      // Set the 'power slots'
      const powers = this.system.powers;
      for ( const level of Array.fromRange(Object.keys(CONFIG.SW5E.powerLevels).length - 1, 1) ) {
        const slot = powers[`power${level}`] ??= { [pval]: 0 };

        slot.level = level;
        slot[pmax] = (level > progression.maxPowerLevel) ? 0 : ((level >= progression.limit) ? 1 : 1000);

        if (isNPC) slot[pval] = slot[pmax];
        else slot[pval] = Math.min(parseInt(slot[pval] ?? slot.value ?? slot[pmax]), slot[pmax]);
      }

      // Apply the calculated values to the sheet
      const target = this.system.attributes[progression.castType];
      target.known ??= {};
      target.known.value = progression.powersKnownCur;
      target.known.max = progression.powersKnownMax;
      target.points.max ??= progression.points;
      target.level = progression.casterLevel;
      target.maxPowerLevel = progression.maxPowerLevel;
      target.override = progression.override;
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare base data related to the superiority capabilities of the Actor.
   * Mutates the value of the system.superiority object.
   * @protected
   */
  _prepareBaseSuperiority() {
    if (this.type === "vehicle" || this.type === "starship") return;
    const superiority = this.system.attributes.super;

    // Determine superiority level based on class items
    let { level, levels, known, dice } = this.itemTypes.class.reduce(
      (obj, cls) => {
        const cd = cls?.system;
        const ad = cls?.archetype?.system;

        const cp = cd?.superiority?.progression ?? 0;
        const ap = ad?.superiority?.progression ?? 0;

        const progression = Math.max(cp, ap);
        const levels = cd?.levels ?? 1;

        if (progression) {
          obj.level += levels * progression;
          obj.levels += levels;
          obj.known += CONFIG.SW5E.maneuversKnownProgression[Math.round(levels * progression)];
          obj.dice += Math.round(CONFIG.SW5E.superiorityDiceQuantProgression[levels] * progression);
        }

        return obj;
      },
      { level: 0, levels: 0, known: 0, dice: 0 }
    );

    level = Math.round(Math.max(Math.min(level, CONFIG.SW5E.maxLevel), 0));
    levels = Math.round(Math.max(Math.min(levels, CONFIG.SW5E.maxLevel), 0));

    // Calculate derived values
    superiority.level = level;
    superiority.known ??= {};
    superiority.known.value = this.itemTypes.maneuver.length;
    superiority.known.max = known;
    superiority.dice.max ??= dice;
    superiority.die = CONFIG.SW5E.superiorityDieSizeProgression[levels];

    this.superiority = superiority;
  }

  /* -------------------------------------------- */

  /**
   * Perform any Character specific preparation.
   * Mutates several aspects of the system data object.
   * @protected
   */
  _prepareCharacterData() {
    this.system.details.level = 0;
    this.system.attributes.hd = 0;
    this.system.attributes.attunement.value = 0;
    this.system.details.ranks = 0;

    for (const item of this.items) {
      // Class levels & hit dice
      if (item.type === "class") {
        const classLevels = parseInt(item.system.levels) || 1;
        this.system.details.level += classLevels;
        this.system.attributes.hd += classLevels - (parseInt(item.system.hitDiceUsed) || 0);
      }
      // Determine character rank based on owned Deployment items
      if (item.type === "deployment") {
        const rankLevels = parseInt(item.system.levels) || 1;
        this.system.details.ranks += rankLevels;
      }

      // Attuned items
      else if (item.system.attunement === CONFIG.SW5E.attunementTypes.ATTUNED) {
        this.system.attributes.attunement.value += 1;
      }
    }

    // Character proficiency bonus
    this.system.attributes.prof = Proficiency.calculateMod(this.system.details.level);

    // Experience required for next level
    const { xp, level } = this.system.details;
    xp.max = this.getLevelExp(level || 1);
    xp.min = level ? this.getLevelExp(level - 1) : 0;
    if ( level >= CONFIG.SW5E.CHARACTER_EXP_LEVELS.length ) xp.pct = 100;
    else {
      const required = xp.max - xp.min;
      const pct = Math.round((xp.value - xp.min) * 100 / required);
      xp.pct = Math.clamped(pct, 0, 100);
    }

    // Prestige required for next Rank
    const { prestige, rank } = this.system.details;
    prestige.max = this.getRankExp(rank || 1);
    prestige.min = rank ? this.getRankExp(rank - 1) : 0;
    if ( rank >= CONFIG.SW5E.CHARACTER_RANK_LEVELS.length ) prestige.pct = 100;
    else {
      const required = prestige.max - prestige.min;
      const pct = Math.round((prestige.value - prestige.min) * 100 / required);
      prestige.pct = Math.clamped(pct, 0, 100);
    }

    // Add base Powercasting attributes
    this._prepareBasePowercasting();

    // Add base Superiority attributes
    this._prepareBaseSuperiority();
  }

  /* -------------------------------------------- */

  /**
   * Perform any NPC specific preparation.
   * Mutates several aspects of the system data object.
   * @protected
   */
  _prepareNPCData() {
    const cr = this.system.details.cr;

    // Attuned items
    this.system.attributes.attunement.value = this.items.filter(i => {
      return i.system.attunement === CONFIG.SW5E.attunementTypes.ATTUNED;
    }).length;

    // Kill Experience
    this.system.details.xp ??= {};
    this.system.details.xp.value = this.getCRExp(cr);

    // Proficiency
    this.system.attributes.prof = Proficiency.calculateMod(Math.max(cr, 1));

    // Determine npc rank based on owned Deployment items
    this.system.details.ranks = this.items.reduce((acc, item) => {
      if (item.type === "deployment") {
        const rankLevels = parseInt(item.system.levels) || 1;
        acc += rankLevels;
      }
      return acc;
    }, 0);

    // Add base Powercasting attributes
    this._prepareBasePowercasting();
  }

  /* -------------------------------------------- */

  /**
   * Perform any Vehicle specific preparation.
   * Mutates several aspects of the system data object.
   * @protected
   */
  _prepareVehicleData() {
    this.system.attributes.prof = 0;
  }

  /* -------------------------------------------- */

  /**
   * Perform any Starship specific preparation.
   * Mutates several aspects of the system data object.
   * @protected
   */
  _prepareBaseStarshipData() {
    if (this.type !== "starship") return;

    // Determine starship's proficiency bonus based on active deployed crew member
    this.system.attributes.prof = 0;
    const active = this.system.attributes.deployment.active;
    const actor = fromUuidSynchronous(active.value);
    if (actor?.system?.details?.ranks) this.system.attributes.prof = actor.system.attributes?.prof ?? 0;

    // Determine Starship size-based properties based on owned Starship item
    const sizeData = this.itemTypes.starshipsize[0]?.system ?? {};
    const hugeOrGrg = ["huge", "grg"].includes(sizeData.size);
    const tiers = parseInt(sizeData.tier ?? 0);

    this.system.traits.size = sizeData.size ?? "med"; // Needs to be the short code
    this.system.details.tier = tiers;

    this.system.attributes.cost = {
      baseBuild: sizeData.buildBaseCost ?? 0,
      baseUpgrade: CONFIG.SW5E.ssBaseUpgradeCost[tiers],
      multEquip: sizeData.equipCostMult ?? 1,
      multModification: sizeData.modCostMult ?? 1,
      multUpgrade: sizeData.upgrdCostMult ?? 1
    };

    this.system.attributes.equip = {
      size: {
        cargoCap: sizeData.cargoCap ?? 0,
        crewMinWorkforce: parseInt(sizeData.crewMinWorkforce ?? 1),
        foodCap: sizeData.foodCap ?? 0
      }
    };

    this.system.attributes.fuel.cost = sizeData.fuelCost ?? 0;
    this.system.attributes.fuel.fuelCap = sizeData.fuelCap ?? 0;

    const hullmax = (sizeData.hullDiceStart ?? 0) + ((hugeOrGrg ? 2 : 1) * tiers);
    this.system.attributes.hull = {
      die: sizeData.hullDice ?? "d1",
      dicemax: hullmax,
      dice: hullmax - parseInt(sizeData.hullDiceUsed ?? 0)
    };

    const shldmax = (sizeData.shldDiceStart ?? 0) + ((hugeOrGrg ? 2 : 1) * tiers);
    this.system.attributes.shld = {
      die: sizeData.shldDice ?? "d1",
      dicemax: shldmax,
      dice: shldmax - parseInt(sizeData.shldDiceUsed ?? 0)
    };

    this.system.attributes.mods = {
      cap: { max: sizeData.modBaseCap ?? 0 },
      suite: { max: sizeData.modMaxSuitesBase ?? 0 },
      hardpoint: { max: 0 }
    };

    this.system.attributes.power.die = CONFIG.SW5E.powerDieTypes[tiers];

    this.system.attributes.workforce = {
      minBuild: sizeData.buildMinWorkforce ?? 0,
      minEquip: sizeData.equipMinWorkforce ?? 0,
      minModification: sizeData.modMinWorkforce ?? 0,
      minUpgrade: sizeData.upgrdMinWorkforce ?? 0
    };
    this.system.attributes.workforce.max = this.system.attributes.workforce.minBuild * 5;

    // Determine Starship armor-based properties based on owned Starship item
    const armorData = this._getEquipment("starship", { equipped: true })?.[0]?.system ?? {};
    this.system.attributes.equip.armor = {
      dr: parseInt(armorData.attributes?.dmgred?.value ?? 0),
      maxDex: armorData.armor?.dex ?? 99,
      stealthDisadv: armorData.stealth ?? false
    };

    // Determine Starship hyperdrive-based properties based on owned Starship item
    const hyperdriveData = this._getEquipment("hyper", { equipped: true })?.[0]?.system ?? {};
    this.system.attributes.equip.hyperdrive = {
      class: parseFloat(hyperdriveData.attributes?.hdclass?.value ?? null)
    };

    // Determine Starship power coupling-based properties based on owned Starship item
    const pwrcplData = this._getEquipment("powerc", { equipped: true })?.[0]?.system ?? {};
    this.system.attributes.equip.powerCoupling = {
      centralCap: parseInt(pwrcplData.attributes?.cscap?.value ?? 0),
      systemCap: parseInt(pwrcplData.attributes?.sscap?.value ?? 0)
    };

    this.system.attributes.power.central.max = 0;
    this.system.attributes.power.comms.max = 0;
    this.system.attributes.power.engines.max = 0;
    this.system.attributes.power.shields.max = 0;
    this.system.attributes.power.sensors.max = 0;
    this.system.attributes.power.weapons.max = 0;

    // Determine Starship reactor-based properties based on owned Starship item
    const reactorData = this._getEquipment("reactor", { equipped: true })?.[0]?.system ?? {};
    this.system.attributes.equip.reactor = {
      fuelMult: parseFloat(reactorData.attributes?.fuelcostsmod?.value ?? 1),
      powerRecDie: reactorData.attributes?.powerdicerec?.value ?? "1d1"
    };

    // Determine Starship shield-based properties based on owned Starship item
    const shieldData = this._getEquipment("ssshield", { equipped: true })?.[0]?.system ?? {};
    this.system.attributes.equip.shields = {
      capMult: parseFloat(shieldData.attributes?.capx?.value ?? 0),
      regenRateMult: parseFloat(shieldData.attributes?.regrateco?.value ?? 0)
    };

    // Inherit deployed pilot's proficiency in piloting
    const pilot = fromUuidSynchronous(this.system.attributes.deployment.pilot.value);
    if (pilot) this.system.skills.man.value = Math.max(this.system.skills.man.value, pilot.system.skills.pil.value);
  }

  /* -------------------------------------------- */
  /*  Derived Data Preparation Helpers            */
  /* -------------------------------------------- */

  /**
   * Prepare abilities.
   * @param {object} rollData      Data produced by `getRollData` to be applied to bonus formulas.
   * @param {object} globalBonuses  Global bonus data.
   * @param {number} checkBonus     Global ability check bonus.
   * @param {object} originalSaves  A transformed actor's original actor's abilities.
   * @protected
   */
  _prepareAbilities(rollData, globalBonuses, checkBonus, originalSaves) {
    const flags = this.flags.sw5e ?? {};
    const dcBonus = simplifyBonus(this.system.bonuses?.power?.dc, rollData);
    const saveBonus = simplifyBonus(globalBonuses.save, rollData);
    for (const [id, abl] of Object.entries(this.system.abilities)) {
      if (flags.diamondSoul) abl.proficient = 1; // Diamond Soul is proficient in all saves
      abl.mod = Math.floor((abl.value - 10) / 2);

      const isRA = this._getCharacterFlag("remarkableAthlete", { ability: id });
      abl.checkProf = new Proficiency(this.system.attributes.prof, isRA || flags.jackOfAllTrades ? 0.5 : 0);
      const saveBonusAbl = simplifyBonus(abl.bonuses?.save, rollData);
      abl.saveBonus = saveBonusAbl + saveBonus;

      abl.saveProf = new Proficiency(this.system.attributes.prof, abl.proficient);
      const checkBonusAbl = simplifyBonus(abl.bonuses?.check, rollData);
      abl.checkBonus = checkBonusAbl + checkBonus;

      abl.save = abl.mod + abl.saveBonus;
      if (Number.isNumeric(abl.saveProf.term)) abl.save += abl.saveProf.flat;
      abl.dc = 8 + abl.mod + this.system.attributes.prof + dcBonus;

      if ( !Number.isFinite(abl.max) ) abl.max = CONFIG.SW5E.maxAbilityScore;

      // If we merged saves when transforming, take the highest bonus here.
      if (originalSaves && abl.proficient) abl.save = Math.max(abl.save, originalSaves[id].save);
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare skill checks. Mutates the values of system.skills.
   * @param {object} rollData       Data produced by `getRollData` to be applied to bonus formulas.
   * @param {object} globalBonuses   Global bonus data.
   * @param {number} checkBonus      Global ability check bonus.
   * @param {object} originalSkills  A transformed actor's original actor's skills.
   * @protected
   */
  _prepareSkills(rollData, globalBonuses, checkBonus, originalSkills) {
    if (this.type === "vehicle") return;
    const flags = this.flags.sw5e ?? {};

    // Skill modifiers
    const skillBonus = simplifyBonus(globalBonuses.skill, rollData);
    for (const [id, skl] of Object.entries(this.system.skills)) {
      const ability = this.system.abilities[skl.ability];
      const baseBonus = simplifyBonus(skl.bonuses?.check, rollData);

      // Remarkable Athlete
      if (this._getCharacterFlag("remarkableAthlete", { ability: skl.ability }) && skl.value < 0.5) {
        skl.value = 0.5;
      }

      // Jack of All Trades
      else if (flags.jackOfAllTrades && skl.value < 0.5) {
        skl.value = 0.5;
      }

      // Polymorph Skill Proficiencies
      if (originalSkills) {
        skl.value = Math.max(skl.value, originalSkills[id].value);
      }

      // Compute modifier
      const checkBonusAbl = simplifyBonus(ability?.bonuses?.check, rollData);
      skl.bonus = baseBonus + checkBonus + checkBonusAbl + skillBonus;
      skl.mod = ability?.mod ?? 0;
      skl.prof = new Proficiency(this.system.attributes.prof, skl.value);
      skl.proficient = skl.value;
      skl.total = skl.mod + skl.bonus;
      if (Number.isNumeric(skl.prof.term)) skl.total += skl.prof.flat;

      // Compute passive bonus
      const passive = this._getCharacterFlag("observantFeat", { skill: id }) ? 5 : 0;
      const passiveBonus = simplifyBonus(skl.bonuses?.passive, rollData);
      skl.passive = 10 + skl.mod + skl.bonus + skl.prof.flat + passive + passiveBonus;
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare tool checks. Mutates the values of system.tools.
   * @param {object} rollData       Data produced by `getRollData` to be applied to bonus formulae.
   * @param {object} globalBonuses   Global bonus data.
   * @param {number} checkBonus      Global ability check bonus.
   * @protected
   */
  _prepareTools(rollData, globalBonuses, checkBonus) {
    if (this.type === "vehicle" || this.type === "starship") return;
    const flags = this.flags.sw5e ?? {};
    for (const tool of Object.values(this.system.tools)) {
      const ability = this.system.abilities[tool.ability];
      const baseBonus = simplifyBonus(tool.bonuses.check, rollData);
      let roundDown = true;

      // Remarkable Athlete.
      if (this._getCharacterFlag("remarkableAthlete", { ability: tool.ability }) && tool.value < 0.5) {
        tool.value = 0.5;
        roundDown = false;
      }

      // Jack of All Trades.
      else if (flags.jackOfAllTrades && tool.value < 0.5) tool.value = 0.5;

      const checkBonusAbl = simplifyBonus(ability?.bonuses?.check, rollData);
      tool.bonus = baseBonus + checkBonus + checkBonusAbl;
      tool.mod = ability?.mod ?? 0;
      tool.prof = new Proficiency(this.system.attributes.prof, tool.value, roundDown);
      tool.total = tool.mod + tool.bonus;
      if (Number.isNumeric(tool.prof.term)) tool.total += tool.prof.flat;
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare a character's AC value from their equipped armor and shield.
   * Mutates the value of the `system.attributes.ac` object.
   */
  _prepareArmorClass() {
    const ac = this.system.attributes.ac;

    // Apply automatic migrations for older data structures
    let cfg = CONFIG.SW5E.armorClasses[ac.calc];
    if (!cfg) {
      ac.calc = "flat";
      if (Number.isNumeric(ac.value)) ac.flat = Number(ac.value);
      cfg = CONFIG.SW5E.armorClasses.flat;
    }

    // Identify Equipped Items
    const armorTypes = new Set(Object.keys(CONFIG.SW5E.armorTypes));
    const { armors, shields } = this.itemTypes.equipment.reduce(
      (obj, equip) => {
        if ( !equip.system.equipped || !armorTypes.has(equip.system.type.value) ) return obj;
        if ( equip.system.type.value === "shield" ) obj.shields.push(equip);
        else obj.armors.push(equip);
        return obj;
      },
      { armors: [], shields: [] }
    );
    const rollData = this.getRollData({ deterministic: true });

    // Determine base AC
    switch (ac.calc) {
      // Flat AC (no additional bonuses)
      case "flat":
        ac.value = Number(ac.flat);
        return;

      // Natural AC (includes bonuses)
      case "natural":
        ac.base = Number(ac.flat);
        break;

      // Starship-Based AC
      case "starship":
        const tier = this.system.details.tier;
        ac.tier = Math.max(tier - 1, 0);
        if (armors.length) {
          if (armors.length > 1) this._preparationWarnings.push({
            message: game.i18n.localize("SW5E.WarnMultipleArmor"),
            type: "warning"
          });
          const armorData = armors[0].system.armor;
          ac.dex = Math.min(armorData.dex ?? Infinity, this.system.abilities.dex.mod);
          ac.base = (armorData.value ?? 0) + ac.tier + ac.dex;
          ac.equippedArmor = armors[0];
        } else {
          ac.dex = this.system.abilities.dex.mod;
          ac.base = 10 + ac.tier + ac.dex;
        }
        break;

      default:
        let formula = ac.calc === "custom" ? ac.formula : cfg.formula;
        if (armors.length) {
          if (armors.length > 1) this._preparationWarnings.push({
            message: game.i18n.localize("SW5E.WarnMultipleArmor"),
            type: "warning"
          });
          const armorData = armors[0].system.armor;
          const isHeavy = armors[0].system.type.value === "heavy";
          ac.armor = armorData.value ?? ac.armor;
          ac.dex = isHeavy ? 0 : Math.min(armorData.dex ?? Infinity, this.system.abilities.dex?.mod ?? 0);
          ac.equippedArmor = armors[0];
        } else ac.dex = this.system.abilities.dex?.mod ?? 0;

        const rollData = this.getRollData({ deterministic: true });
        rollData.attributes.ac = ac;
        try {
          const replaced = Roll.replaceFormulaData(formula, rollData);
          ac.base = Roll.safeEval(replaced);
        } catch(err) {
          this._preparationWarnings.push({
            message: game.i18n.localize("SW5E.WarnBadACFormula"),
            link: "armor",
            type: "error"
          });
          const replaced = Roll.replaceFormulaData(CONFIG.SW5E.armorClasses.default.formula, rollData);
          ac.base = Roll.safeEval(replaced);
        }
        break;
    }

    // Equipped Shield
    if (shields.length) {
      if (shields.length > 1) this._preparationWarnings.push({
        message: game.i18n.localize("SW5E.WarnMultipleShields"),
        type: "warning"
      });
      ac.shield = shields[0].system.armor.value ?? 0;
      ac.equippedShield = shields[0];
    }

    // Compute total AC and return
    ac.bonus = simplifyBonus(ac.bonus, rollData);
    ac.value = ac.base + ac.shield + ac.bonus + ac.cover;
  }

  /* -------------------------------------------- */

  /**
   * Prepare the level and percentage of encumbrance for an Actor.
   * Optionally include the weight of carried currency by applying the standard rule from the PHB pg. 143.
   * Mutates the value of the `system.attributes.encumbrance` object.
   * @protected
   */
  _prepareEncumbrance() {
    const config = CONFIG.SW5E.encumbrance;
    const encumbrance = this.system.attributes.encumbrance ??= {};
    const units = game.settings.get("sw5e", "metricWeightUnits") ? "metric" : "imperial";

    // Get the total weight from items
    let weight = this.items
      .filter(item => !item.container)
      .reduce((weight, item) => weight + (item.system.totalWeight ?? 0), 0);

    // [Optional] add Currency Weight (for non-transformed actors)
    const currency = this.system.currency;
    if ( game.settings.get("sw5e", "currencyWeight") && currency ) {
      const numCoins = Object.values(currency).reduce((val, denom) => val + Math.max(denom, 0), 0);
      const currencyPerWeight = config.currencyPerWeight[units];
      weight += numCoins / currencyPerWeight;
    }

    // Determine the Encumbrance size class
    const keys = Object.keys(CONFIG.SW5E.actorSizes);
    const index = keys.findIndex(k => k === this.system.traits.size);
    const sizeConfig = CONFIG.SW5E.actorSizes[
      keys[this.flags.sw5e?.powerfulBuild ? Math.min(index + 1, keys.length - 1) : index]
    ];
    const sizeMod = sizeConfig?.capacityMultiplier ?? sizeConfig?.token ?? 1;
    const traitMod = this.flags.sw5e?.encumbranceMultiplier ?? 1;
    const mod = sizeMod * traitMod;

    const calculateThreshold = multiplier => this.type === "vehicle"
      ? this.system.attributes.capacity.cargo * config.vehicleWeightMultiplier[units]
      : ((this.system.abilities.str?.value ?? 10) * multiplier * mod).toNearest(0.1);

    // Populate final Encumbrance values
    encumbrance.mod = mod;
    encumbrance.value = weight.toNearest(0.1);
    encumbrance.thresholds = {
      encumbered: calculateThreshold(config.threshold.encumbered[units]),
      heavilyEncumbered: calculateThreshold(config.threshold.heavilyEncumbered[units]),
      maximum: calculateThreshold(config.threshold.maximum[units])
    };
    encumbrance.max = encumbrance.thresholds.maximum;
    encumbrance.stops = {
      encumbered: Math.clamped((encumbrance.thresholds.encumbered * 100) / encumbrance.max, 0, 100),
      heavilyEncumbered: Math.clamped((encumbrance.thresholds.heavilyEncumbered * 100) / encumbrance.max, 0, 100)
    };
    encumbrance.pct = Math.clamped((encumbrance.value * 100) / encumbrance.max, 0, 100);
    encumbrance.encumbered = encumbrance.value > encumbrance.heavilyEncumbered;
  }

  /* -------------------------------------------- */

  /**
   * Prepare hit points for characters.
   * @param {object} rollData  Data produced by `getRollData` to be applied to bonus formulas.
   * @protected
   */
  _prepareHitPoints(rollData) {
    if (!("hp" in this.system.attributes)) return;

    const hp = this.system.attributes.hp;
    if ( !["character", "starship"].includes(this.type) || (this.system.attributes.hp.max !== null) ) {
      hp.pct = Math.clamped(hp.max ? (hp.value / hp.max) * 100 : 0, 0, 100);
      return;
    }
    const level = this.system.details.level ?? this.system.details.tier;
    const classes = this.type === "character" ? this.classes : this.starships;
    for (const advancementType of ["HitPoints", "HullPoints", "ShieldPoints"]) {
      if ((this.type === "character") !== (advancementType === "HitPoints")) continue;

      const temp = advancementType === "ShieldPoints" ? "temp" : "";
      if (this._source.system.attributes.hp[`${temp}max`] !== null) continue;

      const property = `${advancementType[0].toLowerCase()}${advancementType.slice(1)}Ability`;
      const abilityId = CONFIG.SW5E[property] || "con";
      const abilityMod = this.system.abilities[abilityId]?.mod ?? 0;
      let base = Object.values(classes).reduce((total, item) => {
        const advancement = item.advancement.byType[advancementType]?.[0];
        return total + (advancement?.getAdjustedTotal(abilityMod) ?? 0);
      }, 0);

      if (temp) base = Math.round(base * this.system.attributes.equip.shields.capMult);

      const levelBonus = simplifyBonus(hp.bonuses[`${temp}level`], rollData) * level;
      const overallBonus = simplifyBonus(hp.bonuses[`${temp}overall`], rollData);

      hp[`${temp}max`] = base + levelBonus + overallBonus;

    }

    if (this.type === "starship") {
      if ( this.system.attributes.exhaustion >= 4 ) {
        hp.max = Math.floor(hp.max * 0.5);
        hp.tempmax = Math.floor(hp.tempmax * 0.5);
      }
      hp.value = Math.min(hp.value, hp.max);
      hp.temp = Math.min(hp.temp, hp.tempmax);
    } else {
      if ( this.system.attributes.exhaustion >= 4 ) hp.max = Math.floor(hp.max * 0.5);
      hp.value = Math.min(hp.value, hp.max + (hp.tempmax ?? 0));
    }
    hp.pct = Math.clamped(hp.max ? (hp.value / hp.max) * 100 : 0, 0, 100);
  }

  /* -------------------------------------------- */

  /**
   * Prepare the initiative data for an actor.
   * Mutates the value of the system.attributes.init object.
   * @param {object} rollData         Data produced by getRollData to be applied to bonus formulas
   * @param {number} globalCheckBonus  Global ability check bonus
   * @protected
   */
  _prepareInitiative(rollData, globalCheckBonus = 0) {
    const init = (this.system.attributes.init ??= {});
    const flags = this.flags.sw5e || {};

    // Compute initiative modifier
    const abilityId = init.ability || CONFIG.SW5E.initiativeAbility;
    const ability = this.system.abilities?.[abilityId] || {};
    init.mod = ability.mod ?? 0;

    // Initiative proficiency
    const prof = this.system.attributes.prof ?? 0;
    const ra = this._getCharacterFlag("remarkableAthlete", { ability: abilityId });
    init.prof = new Proficiency(prof, flags.jackOfAllTrades || ra ? 0.5 : 0);

    // Total initiative includes all numeric terms
    const initBonus = simplifyBonus(init.bonus, rollData);
    const abilityBonus = simplifyBonus(ability.bonuses?.check, rollData);
    init.total =
      init.mod
      + initBonus
      + abilityBonus
      + globalCheckBonus
      + (flags.initiativeAlert ? 5 : 0)
      + (Number.isNumeric(init.prof.term) ? init.prof.flat : 0);
  }

  /* -------------------------------------------- */
  /*  Powercasting Preparation                    */
  /* -------------------------------------------- */

  /**
   * Prepare data related to the power-casting capabilities of the Actor.
   * @param {object} rollData  Data produced by `getRollData` to be applied to bonus formulas.
   * @protected
   */
  _preparePowercasting(rollData) {
    if (!this.system.powers) return;

    const bonusAll = simplifyBonus(this.system.bonuses?.power?.dc, rollData);
    const bonusLight = simplifyBonus(this.system.bonuses?.power?.forceLightDC, rollData) + bonusAll;
    const bonusDark = simplifyBonus(this.system.bonuses?.power?.forceDarkDC, rollData) + bonusAll;
    const bonusUniv = simplifyBonus(this.system.bonuses?.power?.forceUnivDC, rollData) + bonusAll;
    const bonusTech = simplifyBonus(this.system.bonuses?.power?.techDC, rollData) + bonusAll;

    const abl = this.system.abilities;
    const attr = this.system.attributes;
    const fOverride = attr.force.override;
    const tOverride = attr.tech.override;
    const base = 8 + attr.prof ?? 0;
    const lvl = Number(this.system.details?.level ?? this.system.details.cr ?? 0);

    // Powercasting DC for Actors and NPCs
    attr.powerForceLightDC = base + (abl[fOverride ?? "wis"].mod ?? 0);
    attr.powerForceDarkDC = base + (abl[fOverride ?? "cha"].mod ?? 0);
    attr.powerForceUnivDC = Math.max(attr.powerForceLightDC, attr.powerForceDarkDC);
    attr.powerTechDC = base + (abl[tOverride ?? "int"].mod ?? 0);

    if (game.settings.get("sw5e", "simplifiedForcecasting")) {
      attr.powerForceLightDC = attr.powerForceUnivDC;
      attr.powerForceDarkDC = attr.powerForceUnivDC;
    }

    attr.powerForceLightDC += bonusLight;
    attr.powerForceDarkDC += bonusDark;
    attr.powerForceUnivDC += bonusUniv;
    attr.powerTechDC += bonusTech;

    // Set Force and tech bonus points for PC Actors
    const ability = {};
    for (const castType of ["force", "tech"]) {
      const cast = attr[castType];
      const castSource = this._source.system.attributes[castType];

      if (castSource.points.max !== null) continue;
      if (cast.level === 0) continue;

      if (cast.override) ability[castType] = {
        id: cast.override,
        mod: abl[cast.override]?.mod ?? 0
      };
      else {
        ability[castType] = CONFIG.SW5E.powerPointsBonus[castType].reduce(
          (acc, id) => {
            const mod = abl?.[id]?.mod ?? -Infinity;
            if (mod > acc.mod) acc = { id, mod };
            return acc;
          },
          { id: "str", mod: -Infinity }
        );
      }
      if ( ability[castType]?.mod ) cast.points.max += ability[castType].mod;

      const levelBonus = simplifyBonus(cast.points.bonuses.level ?? 0, rollData) * lvl;
      const overallBonus = simplifyBonus(cast.points.bonuses.overall ?? 0, rollData);
      const focus = this.focuses[CONFIG.SW5E.powerFocus[castType]];
      const focusProperty = CONFIG.SW5E.powerFocusBonus[castType];
      const focusBonus = focus?.system?.properties?.[focusProperty] ?? 0;

      cast.points.max += levelBonus + overallBonus + focusBonus;
    }

    // Apply any 'power slot' overrides
    const powers = this.system.powers;
    for (const castType of ["f", "t"]) {
      const pmax = `${castType}max`;
      const pval = `${castType}value`;
      const povr = `${castType}override`;
      for ( const level of Array.fromRange(Object.keys(CONFIG.SW5E.powerLevels).length - 1, 1) ) {
        const slot = powers[`power${level}`];

        const override = Number.isNumeric(slot[povr]) ? Math.max(parseInt(slot[povr]), 0) : null;
        if ( Number.isNumeric(override) ) {
          if ( this.type === "npc" || slot[pval] === slot[pmax] ) slot[pval] = override;
          else slot[pval] = Math.min(slot[pval], override);
          slot[pmax] = override;
        }
      }
    }

    // Set a fallback 'powercasting stat', based on the highest caster level
    // This is used for non-power items with power attacks or powercasting based saving throws
    if ( attr.force.level >= attr.tech.level ) attr.powercasting = ability.force?.id;
    else attr.powercasting = ability.tech?.id;

    // Fallback Powercasting DC and modifier
    const powercastingAbility = abl[attr.powercasting];
    attr.powerdc = powercastingAbility ? powercastingAbility.dc : 8 + attr.prof;
    attr.powermod = powercastingAbility ? powercastingAbility.mod : 0;
  }

  /* -------------------------------------------- */

  /**
   * Prepare data related to the superiority capabilities of the Actor
   * @param {object} rollData  Data produced by `getRollData` to be applied to bonus formulas.
   * @protected
   */
  _prepareSuperiority(rollData) {
    if (!(this.type === "character" || this.type === "npc")) return;

    const bonusAll = simplifyBonus(this.system.bonuses?.super?.dc, rollData);
    const bonusGeneral = simplifyBonus(this.system.bonuses?.super?.generalDC, rollData) + bonusAll;
    const bonusPhysical = simplifyBonus(this.system.bonuses?.super?.physicalDC, rollData) + bonusAll;
    const bonusMental = simplifyBonus(this.system.bonuses?.super?.mentalDC, rollData) + bonusAll;

    const abl = this.system.abilities;
    const spr = this.system.attributes.super;
    const base = 8 + this.system.attributes.prof ?? 0;

    // Powercasting DC for Actors and NPCs
    spr.physicalDC = base + Math.max(abl.str.mod ?? 0, abl.dex.mod ?? 0, abl.con.mod ?? 0);
    spr.mentalDC = base + Math.max(abl.int.mod ?? 0, abl.wis.mod ?? 0, abl.cha.mod ?? 0);
    spr.generalDC = Math.max(spr.physicalDC, spr.mentalDC);

    spr.generalDC += bonusGeneral;
    spr.physicalDC += bonusPhysical;
    spr.mentalDC += bonusMental;

    const levelBonus = simplifyBonus(spr.dice.bonuses.level ?? 0, rollData) * Number(this.system.details?.level ?? 0);
    const overallBonus = simplifyBonus(spr.dice.bonuses.overall ?? 0, rollData);

    spr.dice.max += levelBonus + overallBonus;
  }

  /* -------------------------------------------- */

  _prepareStarshipData() {
    if (this.type !== "starship") return;

    // Find Size info of Starship
    const attr = this.system.attributes;
    const abl = this.system.abilities;
    const sizeData = this.itemTypes.starshipsize[0]?.system ?? {};

    // Set Power Die Storage
    attr.power.central.max += attr.equip.powerCoupling.centralCap;
    attr.power.comms.max += attr.equip.powerCoupling.systemCap;
    attr.power.engines.max += attr.equip.powerCoupling.systemCap;
    attr.power.shields.max += attr.equip.powerCoupling.systemCap;
    attr.power.sensors.max += attr.equip.powerCoupling.systemCap;
    attr.power.weapons.max += attr.equip.powerCoupling.systemCap;

    // Disable Shields
    attr.shld.depleted = attr.hp.temp === 0 && attr.equip.shields.capMult !== 0;

    // Prepare Speeds
    if (game.settings.get("sw5e", "oldStarshipMovement")) {
      attr.movement.space = (sizeData.baseSpaceSpeed ?? 0) + (50 * (abl.str.mod - abl.con.mod));
      attr.movement.turn = Math.min(
        attr.movement.space,
        Math.max(50, (sizeData.baseTurnSpeed ?? 0) - (50 * (abl.dex.mod - abl.con.mod)))
      );
    } else {
      const roles = this.itemTypes.feat.filter(
        f => f.system.type.value === "starship" && f.system.type.subtype === "role"
      );
      if (roles.length === 0) this._preparationWarnings.push({
        message: game.i18n.localize("SW5E.WarnNoSSRole"),
        type: "warning"
      });
      else if (roles.length > 1) this._preparationWarnings.push({
        message: game.i18n.localize("SW5E.WarnMultipleSSRole"),
        type: "warning"
      });
      else {
        const role = roles[0];
        attr.movement.space = role?.system?.attributes?.speed?.space ?? 0;
        attr.movement.turn = role?.system?.attributes?.speed?.turn ?? 0;
      }
    }

    // Prepare Mods
    attr.mods.cap.value = this.itemTypes.starshipmod
      .filter(i => i.system.equipped && !i.system.free.slot)
      .reduce((acc, i) => acc + i.system.quantity, 0);

    // Prepare Suites
    attr.mods.suite.max += (sizeData.modMaxSuitesMult ?? 1) * abl.con.mod;
    attr.mods.suite.value = this.itemTypes.starshipmod.filter(
      i => i.system.equipped && !i.system.free.suite && i.system.system.value === "Suite"
    ).length;

    // Prepare Hardpoints
    attr.mods.hardpoint.max += (sizeData.hardpointMult ?? 1) * Math.max(1, abl.str.mod);

    // Prepare Fuel
    attr.fuel = this._computeFuel();
  }

  _computeFuel() {
    const fuel = this.system.attributes.fuel;
    fuel.cost *= this.system.attributes.equip.reactor.fuelMult;
    // Compute Fuel percentage
    const pct = Math.clamped((fuel.value.toNearest(0.1) * 100) / fuel.fuelCap, 0, 100);
    return { ...fuel, pct, fueled: pct > 0 };
  }

  /* -------------------------------------------- */

  /**
   * Get a list of all equipment of a certain type.
   * @param {string} type         The type of equipment to return, empty for all.
   * @param {boolean} [equipped]  Ignore non-equipped items
   * @type {object}               Array of items of that type
   */
  _getEquipment(type, { equipped = false } = {}) {
    return this.itemTypes.equipment.filter(
      item => type === item.system.type.value && (!equipped || item.system.equipped)
    );
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    if ( (await super._preCreate(data, options, user)) === false ) return false;

    const sourceId = this.getFlag("core", "sourceId");
    if (sourceId?.startsWith("Compendium.")) return;

    // Configure prototype token settings
    const prototypeToken = {};
    if ("size" in (this.system.traits || {})) {
      const size = CONFIG.SW5E.actorSizes[this.system.traits.size || "med"].token ?? 1;
      if ( !foundry.utils.hasProperty(data, "prototypeToken.width") ) prototypeToken.width = size;
      if ( !foundry.utils.hasProperty(data, "prototypeToken.height") ) prototypeToken.height = size;
      if ( this.type === "character" ) Object.assign(prototypeToken, {
        sight: { enabled: true },
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY
      });
      else if (this.type === "starship") Object.assign(prototypeToken, {
        actorLink: true
      });
      this.updateSource({ prototypeToken });
    }
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    // Add starship actions
    if (this.type === "starship") this.addStarshipDefaults();
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _preUpdate(changed, options, user) {
    if ( (await super._preUpdate(changed, options, user)) === false ) return false;

    // Apply changes in Actor size to Token width/height
    if ("size" in (this.system.traits || {})) {
      const newSize = foundry.utils.getProperty(changed, "system.traits.size");
      if (newSize && newSize !== this.system.traits?.size) {
        let size = CONFIG.SW5E.actorSizes[newSize].token ?? 1;
        if (!foundry.utils.hasProperty(changed, "prototypeToken.width")) {
          changed.prototypeToken ||= {};
          changed.prototypeToken.height = size;
          changed.prototypeToken.width = size;
        }
      }
    }

    // Reset death save counters
    if ("hp" in (this.system.attributes || {})) {
      const isDead = this.system.attributes.hp.value <= 0;
      if (isDead && foundry.utils.getProperty(changed, "system.attributes.hp.value") > 0) {
        foundry.utils.setProperty(changed, "system.attributes.death.success", 0);
        foundry.utils.setProperty(changed, "system.attributes.death.failure", 0);
      }
    }

    // Record previous exhaustion level.
    if ( Number.isFinite(foundry.utils.getProperty(changed, "system.attributes.exhaustion")) ) {
      foundry.utils.setProperty(options, "sw5e.originalExhaustion", this.system.attributes.exhaustion);
    }
  }

  /* -------------------------------------------- */

  /**
   * Assign a class item as the original class for the Actor based on which class has the most levels.
   * @returns {Promise<Actor5e>}  Instance of the updated actor.
   * @protected
   */
  _assignPrimaryClass() {
    const classes = this.itemTypes.class.sort((a, b) => b.system.levels - a.system.levels);
    const newPC = classes[0]?.id || "";
    return this.update({ "system.details.originalClass": newPC });
  }

  /* -------------------------------------------- */
  /*  Gameplay Mechanics                          */
  /* -------------------------------------------- */

  /** @override */
  async modifyTokenAttribute(attribute, value, isDelta, isBar) {
    if (attribute === "attributes.hp") {
      const hp = this.system.attributes.hp;
      const delta = isDelta ? -1 * value : hp.value + hp.temp - value;
      return this.applyDamage(Math.abs(delta), delta >= 0 ? 1 : -1);
    } else if ( attribute.startsWith(".") ) {
      const item = fromUuidSync(attribute, { relative: this });
      let newValue = item?.system.uses?.value ?? 0;
      if ( isDelta ) newValue += value;
      else newValue = value;
      return item?.update({ "system.uses.value": newValue });
    }
    return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
  }

  /* -------------------------------------------- */

  /**
   * Description of a source of damage.
   *
   * @typedef {object} DamageDescription
   * @property {number} value            Amount of damage.
   * @property {string} type             Type of damage.
   * @property {Set<string>} properties  Physical properties that affect damage application.
   * @property {string} [itemUuid]       UUID of the item that caused this damage.
   */

  /**
   * Options for damage application.
   *
   * @typedef {object} DamageApplicationOptions
   * @property {number} [multiplier=1]    Amount by which to multiply all damage.
   * @property {object|boolean} [ignore]  Set to `true` to ignore all damage modifiers. If set to an object, then
   *                                      values can either be `true` to indicate that the all modifications of that
   *                                      type should be ignored, or a set of specific damage types for which it should
   *                                      be ignored.
   * @property {boolean|Set<string>} [ignore.immunity]       Should this actor's damage immunity be ignored?
   * @property {boolean|Set<string>} [ignore.resistance]     Should this actor's damage resistance be ignored?
   * @property {boolean|Set<string>} [ignore.vulnerability]  Should this actor's damage vulnerability be ignored?
   * @property {boolean|Set<string>} [ignore.modification]   Should this actor's damage modification be ignored?
   */

  /**
   * Apply a certain amount of damage or healing to the health pool for Actor
   * @param {DamageDescription[]|number} damages     Damages to apply.
   * @param {DamageApplicationOptions} [options={}]  Damage application options.
   * @returns {Promise<Actor5e>}                     A Promise which resolves once the damage has been applied.
   */
  async applyDamage(damages, options={}) {
    const hp = this.system.attributes.hp;
    const traits = this.system.traits ?? {};
    if ( !hp ) return this; // Group actors don't have HP at the moment

    if ( foundry.utils.getType(options) !== "Object" ) {
      foundry.utils.logCompatibilityWarning(
        "Actor5e.applyDamage now takes an options object as its second parameter with `multiplier` as an parameter.",
        { since: "SW5e 3.0", until: "SW5e 3.2" }
      );
      options = { multiplier: options };
    }

    if ( Number.isNumeric(damages) ) {
      damages = [{ value: damages }];
      options.ignore ??= true;
    }

    const multiplier = options.multiplier ?? 1;

    /**
     * A hook event that fires before damage amount is calculated for an actor.
     * @param {Actor5e} actor                     The actor being damaged.
     * @param {DamageDescription[]} damages       Damage descriptions.
     * @param {DamageApplicationOptions} options  Additional damage application options.
     * @returns {boolean}                         Explicitly return `false` to prevent damage application.
     * @function sw5e.preCalculateDamage
     * @memberof hookEvents
     */
    if ( Hooks.call("sw5e.preCalculateDamage", this, damages, options) === false ) return this;

    const ignore = (category, type) => {
      return options.ignore === true
        || options.ignore?.[category] === true
        || options.ignore?.[category]?.has?.(type);
    };

    const hasEffect = (category, type, properties) => {
      const config = traits?.[category];
      if ( !config?.value.has(type) ) return false;
      if ( !CONFIG.SW5E.damageTypes[type]?.isPhysical || !properties?.size ) return true;
      return !config.bypasses?.intersection(properties)?.size;
    };

    const rollData = this.getRollData({deterministic: true});

    // TODO SW5E: Readd support for starship shield damage resistance/immunity/modification

    let amount = damages.reduce((total, d) => {
      // Skip damage types with immunity
      if ( !ignore("immunity", d.type) && hasEffect("di", d.type, d.properties) ) return total;

      let value = d.value;

      // Apply type-specific damage reduction
      if ( !ignore("modification", d.type) && traits?.dm?.amount[d.type] ) {
        const modification = simplifyBonus(traits.dm.amount[d.type], rollData);
        if ( Math.sign(value) !== Math.sign(value + modification) ) value = 0;
        else value += modification;
      }

      let damageMultiplier = multiplier;

      // Apply type-specific damage resistance
      if ( !ignore("resistance", d.type) && hasEffect("dr", d.type, d.properties) ) damageMultiplier /= 2;

      // Apply type-specific damage vulnerability
      if ( !ignore("vulnerability", d.type) && hasEffect("dv", d.type, d.properties) ) damageMultiplier *= 2;

      return total + (value * damageMultiplier);
    }, 0);

    // Round damage towards zero
    amount = amount > 0 ? Math.floor(amount) : Math.ceil(amount);

    const deltaTemp = amount > 0 ? Math.min(hp.temp, amount) : 0;
    const deltaHP = amount - deltaTemp;
    const updates = {
      "system.attributes.hp.temp": hp.temp - deltaTemp,
      "system.attributes.hp.value": hp.value - deltaHP
    };

    /**
     * A hook event that fires before damage is applied to an actor.
     * @param {Actor5e} actor                     Actor the damage will be applied to.
     * @param {number} amount                     Amount of damage that will be applied.
     * @param {object} updates                    Distinct updates to be performed on the actor.
     * @param {DamageApplicationOptions} options  Additional damage application options.
     * @returns {boolean}                         Explicitly return `false` to prevent damage application.
     * @function sw5e.preApplyDamage
     * @memberof hookEvents
     */
    if ( Hooks.call("sw5e.preApplyDamage", this, amount, updates, options) === false ) return this;

    // Delegate damage application to a hook
    // TODO: Replace this in the future with a better modifyTokenAttribute function in the core
    if ( Hooks.call("modifyTokenAttribute", {
      attribute: "attributes.hp",
      value: amount,
      isDelta: false,
      isBar: true
    }, updates) === false ) return this;

    await this.update(updates, {dhp: -amount});

    /**
     * A hook event that fires after damage has been applied to an actor.
     * @param {Actor5e} actor                     Actor that has been damaged.
     * @param {number} amount                     Amount of damage that has been applied.
     * @param {DamageApplicationOptions} options  Additional damage application options.
     * @function sw5e.applyDamage
     * @memberof hookEvents
     */
    Hooks.callAll("sw5e.applyDamage", this, amount, options);

    return this;
  }

  /* -------------------------------------------- */

  /**
   * Apply a certain amount of temporary hit point, but only if it's more than the actor currently has.
   * @param {number} amount       An amount of temporary hit points to set
   * @returns {Promise<Actor5e>}  A Promise which resolves once the temp HP has been applied
   */
  async applyTempHP(amount = 0) {
    amount = parseInt(amount);
    const hp = this.system.attributes.hp;

    // Update the actor if the new amount is greater than the current
    const tmp = parseInt(hp.temp) || 0;
    return amount > tmp ? this.update({"system.attributes.hp.temp": amount}, {dtemp: amount}) : this;
  }

  /* -------------------------------------------- */

  /**
   * Apply an array of damages to the health pool of the Actor
   * @param {{Number: amount, String: type}[]} damages    Amount and Types of the damages to apply
   * @param {string} [itemUuid]                           The uuid of the item dealing the damage
   */
  async applyDamages(damages, itemUuid = null) {
    for (const damage of damages) {
      await this.applyDamage(Math.abs(damage.amount), damage.amount >= 0 ? 1 : -1, {
        damageType: damage.type,
        itemUuid
      });
    }
    return this;
  }

  /* -------------------------------------------- */

  /**
   * Get a color used to represent the current hit points of an Actor.
   * @param {number} current        The current HP value
   * @param {number} max            The maximum HP value
   * @returns {Color}               The color used to represent the HP percentage
   */
  static getHPColor(current, max) {
    const pct = Math.clamped(current, 0, max) / max;
    return Color.fromRGB([1 - (pct / 2), pct, 0]);
  }

  /* -------------------------------------------- */

  /**
   * Determine whether the character has at least one of the provided flags that wrorks with the provided ability or skill.
   * @param {string|string[]} flags           Flags to check
   * @param {object}  [options]
   * @param {string}  [options.ability]       Ability to check.
   * @param {string}  [options.skill]         Skill to check.
   * @param {boolean} [options.situational]   Also check flag.situational
   * @returns {string|boolean}                Whether the actor one of the flags for which the ability or skill fits.
   * @private
   */
  _getCharacterFlag(flags, options = { ability: null, skill: null, situational: false }) {
    const midi = game.modules.get("midi-qol")?.active;
    const flagsChar = foundry.utils.mergeObject(this.flags.sw5e ?? {}, this.flags["midi-qol"] ?? {});
    const flagsCfg = CONFIG.SW5E.characterFlags;
    if (typeof flags === "string") flags = [flags];
    let result = false;
    if (options.situational && !midi) result = flags.reduce(
      ((acc, flag) => (
        foundry.utils.getProperty(flagsChar, `situational.${flag}`)
        && (!options.ability || (flagsCfg[`situational.${flag}`].abilities?.includes(options.ability) ?? true))
        && (!options.skill || (flagsCfg[`situational.${flag}`].skills?.includes(options.skill) ?? true))
      ) ? `situational.${flag}` : acc),
      result
    );
    result = flags.reduce(
      ((acc, flag) => (
        foundry.utils.getProperty(flagsChar, flag)
        && (!flagsCfg[flag].midiClone || !midi)
        && (!options.ability || (flagsCfg[flag].abilities?.includes(options.ability) ?? true))
        && (!options.skill || (flagsCfg[flag].skills?.includes(options.skill) ?? true))
      ) ? flag : acc),
      result
    );
    return result;
  }

  /* -------------------------------------------- */

  /**
   * Gets the tooltip for a specific character flag.
   * @param {string} flagId  The id of the flag to get the tooltip
   * @returns {string}       The tooltip, with any conditions attached.
   * @private
   */
  _getCharacterFlagTooltip(flagId) {
    const flag = CONFIG.SW5E.characterFlags[flagId];
    if (!flag) return "";

    if (flagId in CONFIG.SW5E.midiFlags) {
      const arr = [
        ...this._prepareActiveEffectAttributions(`flags.sw5e.${flagId}`),
        ...this._prepareActiveEffectAttributions(`flags.sw5e.situational.${flagId}`),
        ...this._prepareActiveEffectAttributions(`flags.midi-qol.${flagId}`),
        ...this._prepareActiveEffectAttributions(`flags.midi-qol.situational.${flagId}`)
      ];

      const source = arr.map(attribution => attribution.label).join(", ");
      return `${flag.name} (${source})`;
    }

    if (flag.condition) return `${flag.name} (${flag.condition})`;
    return flag.name;
  }

  /* -------------------------------------------- */

  /**
   * Removes currency from the actor
   * @param {number} amount   Amount to remove.
   * @returns {boolean}       Wheter the operation was succesfull.
   */
  async removeCurrency(amount) {
    const cur = this.system.currency.gc;
    if (cur >= amount) {
      await this.update({ "system.currency.gc": cur - amount });
      return true;
    }
    return false;
  }

  /* -------------------------------------------- */
  /*  Rolling                                     */
  /* -------------------------------------------- */

  /**
   * Roll a Skill Check
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {string} skillId      The skill id (e.g. "ins")
   * @param {object} options      Options which configure how the skill check is rolled
   * @returns {Promise<D20Roll>}  A Promise which resolves to the created Roll instance
   */
  async rollSkill(skillId, options = {}) {
    const flags = this.flags.sw5e ?? {};
    const skl = this.system.skills[skillId];
    const abl = this.system.abilities[options.ability ?? skl.ability];
    const globalBonuses = this.system.bonuses?.abilities ?? {};
    const parts = ["@mod", "@abilityCheckBonus"];
    const data = this.getRollData();

    // Add ability modifier
    data.mod = abl?.mod;
    data.defaultAbility = options.ability ?? skl.ability;

    // Include proficiency bonus
    if (skl.prof.hasProficiency) {
      parts.push("@prof");
      data.prof = skl.prof.term;
    }

    // Mastery proficiency
    const mastery = skl?.proficient >= 3;
    const masteryHint = mastery ? CONFIG.SW5E.proficiencyLevels[skl?.proficient].label : null;

    // High/Grand Mastery proficiency
    if (skl.proficient >= 4) options.elvenAccuracy = skl.proficient - 3;

    // Global ability check bonus
    if (globalBonuses.check) {
      parts.push("@checkBonus");
      data.checkBonus = Roll.replaceFormulaData(globalBonuses.check, data);
    }

    // Ability-specific check bonus
    if (abl?.bonuses?.check) data.abilityCheckBonus = Roll.replaceFormulaData(abl.bonuses.check, data);
    else data.abilityCheckBonus = 0;

    // Skill-specific skill bonus
    if (skl.bonuses?.check) {
      const checkBonusKey = `${skillId}CheckBonus`;
      parts.push(`@${checkBonusKey}`);
      data[checkBonusKey] = Roll.replaceFormulaData(skl.bonuses.check, data);
    }

    // Global skill check bonus
    if (globalBonuses.skill) {
      parts.push("@skillBonus");
      data.skillBonus = Roll.replaceFormulaData(globalBonuses.skill, data);
    }

    // Flags
    const supremeAptitude = !!this._getCharacterFlag("supremeAptitude", { ability: abl });
    // Reliable Talent applies to any skill check we have full or better proficiency in
    const reliableTalent = skl.value >= 1 && flags.reliableTalent;

    const advantageFlag = this._getCharacterFlag([
      "advantage.all",
      "advantage.skill.all",
      `advantage.skill.${skillId}`,
      "advantage.ability.all",
      "advantage.ability.check.all",
      `advantage.ability.check.${data.defaultAbility}`
    ], { situational: true });
    const advantage = !!(mastery || advantageFlag || options.advantage);
    const advantageHint = masteryHint || this._getCharacterFlagTooltip(advantageFlag);

    const disadvantageFlag = this._getCharacterFlag([
      "disadvantage.all",
      "disadvantage.skill.all",
      `disadvantage.skill.${skillId}`,
      "disadvantage.ability.all",
      "disadvantage.ability.check.all",
      `disadvantage.ability.check.${data.defaultAbility}`
    ], { situational: true });
    const disadvantage = !!(disadvantageFlag || options.disadvantage);
    const disadvantageHint = this._getCharacterFlagTooltip(disadvantageFlag);

    // Roll and return
    const flavor = game.i18n.format("SW5E.SkillPromptTitle", { skill: CONFIG.SW5E.allSkills[skillId]?.label ?? "" });
    const rollData = foundry.utils.mergeObject(
      {
        data,
        title: `${flavor}: ${this.name}`,
        flavor,
        chooseModifier: true,
        elvenAccuracy: supremeAptitude,
        halflingLucky: flags.halflingLucky,
        reliableTalent,
        advantageHint,
        disadvantageHint,
        messageData: {
          speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
          "flags.sw5e.roll": { type: "skill", skillId }
        }
      },
      options
    );
    rollData.parts = parts.concat(options.parts ?? []);
    rollData.advantage = advantage && !disadvantage;
    rollData.disadvantage = !advantage && disadvantage;

    /**
     * A hook event that fires before a skill check is rolled for an Actor.
     * @function sw5e.preRollSkill
     * @memberof hookEvents
     * @param {Actor5e} actor                Actor for which the skill check is being rolled.
     * @param {D20RollConfiguration} config  Configuration data for the pending roll.
     * @param {string} skillId               ID of the skill being rolled as defined in `SW5E.allSkills`.
     * @returns {boolean}                    Explicitly return `false` to prevent skill check from being rolled.
     */
    if (Hooks.call("sw5e.preRollSkill", this, rollData, skillId) === false) return;

    const roll = await d20Roll(rollData);

    /**
     * A hook event that fires after a skill check has been rolled for an Actor.
     * @function sw5e.rollSkill
     * @memberof hookEvents
     * @param {Actor5e} actor   Actor for which the skill check has been rolled.
     * @param {D20Roll} roll    The resulting roll.
     * @param {string} skillId  ID of the skill that was rolled as defined in `SW5E.allSkills`.
     */
    if (roll) Hooks.callAll("sw5e.rollSkill", this, roll, skillId);

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll a Tool Check.
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonuses.
   * @param {string} toolId       The identifier of the tool being rolled.
   * @param {object} options      Options which configure how the tool check is rolled.
   * @returns {Promise<D20Roll>}  A Promise which resolves to the created Roll instance.
   */
  async rollToolCheck(toolId, options = {}) {
    // Prepare roll data.
    const tool = this.system.tools[toolId];
    const toolItem = await Trait.getBaseItem(CONFIG.SW5E.toolIds[toolId]);
    const toolType = toolItem.system.type.value;
    const ability = this.system.abilities[options.ability || (tool?.ability ?? "int")];
    const globalBonuses = this.system.bonuses?.abilities ?? {};
    const parts = ["@mod", "@abilityCheckBonus"];
    const data = this.getRollData();

    // Add ability modifier.
    data.mod = ability?.mod ?? 0;
    data.defaultAbility = options.ability || (tool?.ability ?? "int");

    // Add proficiency.
    const prof = options.prof ?? tool?.prof;
    if ( prof?.hasProficiency ) {
      parts.push("@prof");
      data.prof = prof.term;
    }

    // Mastery proficiency
    const mastery = tool?.value >= 3;
    const masteryHint = mastery ? CONFIG.SW5E.proficiencyLevels[tool?.value].label : null;

    // High/Grand Mastery proficiency
    if (tool?.value >= 4) options.elvenAccuracy = (tool.value) - 3;

    // Global ability check bonus.
    if (globalBonuses.check) {
      parts.push("@checkBonus");
      data.checkBonus = Roll.replaceFormulaData(globalBonuses.check, data);
    }

    // Ability-specific check bonus.
    if (ability?.bonuses.check) data.abilityCheckBonus = Roll.replaceFormulaData(ability.bonuses.check, data);
    else data.abilityCheckBonus = 0;

    // Tool-specific check bonus.
    if (tool?.bonuses.check || options.bonus) {
      parts.push("@toolBonus");
      const bonus = [];
      if (tool?.bonuses.check) bonus.push(Roll.replaceFormulaData(tool.bonuses.check, data));
      if (options.bonus) bonus.push(Roll.replaceFormulaData(options.bonus, data));
      data.toolBonus = bonus.join(" + ");
    }

    // Flags
    const advantageFlag = this._getCharacterFlag([
      "advantage.all",
      "advantage.tool.all",
      `advantage.tool.${toolType}`,
      "advantage.ability.all",
      "advantage.ability.check.all",
      `advantage.ability.check.${data.defaultAbility}`
    ], { situational: true });
    const advantage = !!(mastery || advantageFlag || options.advantage);
    const advantageHint = masteryHint || this._getCharacterFlagTooltip(advantageFlag);

    const disadvantageFlag = this._getCharacterFlag([
      "disadvantage.all",
      "disadvantage.tool.all",
      `disadvantage.tool.${toolType}`,
      "disadvantage.ability.all",
      "disadvantage.ability.check.all",
      `disadvantage.ability.check.${data.defaultAbility}`
    ], { situational: true });
    const disadvantage = !!(disadvantageFlag || options.disadvantage);
    const disadvantageHint = this._getCharacterFlagTooltip(disadvantageFlag);

    // Reliable Talent applies to any tool check we have full or better proficiency in
    const reliableTalent = (prof?.multiplier >= 1 && this.getFlag("sw5e", "reliableTalent"));

    const flavor = game.i18n.format("SW5E.ToolPromptTitle", {tool: Trait.keyLabel(toolId, {trait: "tool"}) ?? ""});
    const rollData = foundry.utils.mergeObject(
      {
        data,
        flavor,
        title: `${flavor}: ${this.name}`,
        chooseModifier: true,
        halflingLucky: this.getFlag("sw5e", "halflingLucky"),
        reliableTalent,
        advantageHint,
        disadvantageHint,
        messageData: {
          speaker: options.speaker || ChatMessage.implementation.getSpeaker({ actor: this }),
          "flags.sw5e.roll": { type: "tool", toolId }
        }
      },
      options
    );
    rollData.parts = parts.concat(options.parts ?? []);
    rollData.advantage = advantage && !disadvantage;
    rollData.disadvantage = !advantage && disadvantage;

    /**
     * A hook event that fires before a tool check is rolled for an Actor.
     * @function sw5e.preRollRool
     * @memberof hookEvents
     * @param {Actor5e} actor                Actor for which the tool check is being rolled.
     * @param {D20RollConfiguration} config  Configuration data for the pending roll.
     * @param {string} toolId                Identifier of the tool being rolled.
     * @returns {boolean}                    Explicitly return `false` to prevent skill check from being rolled.
     */
    if (Hooks.call("sw5e.preRollToolCheck", this, rollData, toolId) === false) return;

    const roll = await d20Roll(rollData);

    /**
     * A hook event that fires after a tool check has been rolled for an Actor.
     * @function sw5e.rollTool
     * @memberof hookEvents
     * @param {Actor5e} actor   Actor for which the tool check has been rolled.
     * @param {D20Roll} roll    The resulting roll.
     * @param {string} toolId   Identifier of the tool that was rolled.
     */
    if (roll) Hooks.callAll("sw5e.rollToolCheck", this, roll, toolId);

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll a generic ability test or saving throw.
   * Prompt the user for input on which variety of roll they want to do.
   * @param {string} abilityId    The ability id (e.g. "str")
   * @param {object} options      Options which configure how ability tests or saving throws are rolled
   */
  rollAbility(abilityId, options = {}) {
    const label = CONFIG.SW5E.abilities[abilityId]?.label ?? "";
    new Dialog({
      title: `${game.i18n.format("SW5E.AbilityPromptTitle", { ability: label })}: ${this.name}`,
      content: `<p>${game.i18n.format("SW5E.AbilityPromptText", { ability: label })}</p>`,
      buttons: {
        test: {
          label: game.i18n.localize("SW5E.ActionAbil"),
          callback: () => this.rollAbilityTest(abilityId, options)
        },
        save: {
          label: game.i18n.localize("SW5E.ActionSave"),
          callback: () => this.rollAbilitySave(abilityId, options)
        }
      }
    }).render(true);
  }

  /* -------------------------------------------- */

  /**
   * Roll an Ability Test
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {string} abilityId    The ability ID (e.g. "str")
   * @param {object} options      Options which configure how ability tests are rolled
   * @returns {Promise<D20Roll>}  A Promise which resolves to the created Roll instance
   */
  async rollAbilityTest(abilityId, options = {}) {
    const flags = this.flags.sw5e ?? {};
    const label = CONFIG.SW5E.abilities[abilityId]?.label ?? "";
    const abl = this.system.abilities[abilityId];
    const globalBonuses = this.system.bonuses?.abilities ?? {};
    const parts = [];
    const data = this.getRollData();

    // Add ability modifier
    parts.push("@mod");
    data.mod = abl?.mod ?? 0;

    // Include proficiency bonus
    if (abl?.checkProf.hasProficiency) {
      parts.push("@prof");
      data.prof = abl.checkProf.term;
    }

    // Add ability-specific check bonus
    if (abl?.bonuses?.check) {
      const checkBonusKey = `${abilityId}CheckBonus`;
      parts.push(`@${checkBonusKey}`);
      data[checkBonusKey] = Roll.replaceFormulaData(abl.bonuses.check, data);
    }

    // Add global actor bonus
    if (globalBonuses.check) {
      parts.push("@checkBonus");
      data.checkBonus = Roll.replaceFormulaData(globalBonuses.check, data);
    }

    // Flags
    const supremeAptitude = !!this._getCharacterFlag("supremeAptitude", { ability: abilityId });

    const advantageFlag = this._getCharacterFlag([
      "advantage.all",
      "advantage.ability.all",
      "advantage.ability.check.all",
      `advantage.ability.check.${abilityId}`
    ], { situational: true });
    const advantage = !!(advantageFlag || options.advantage);
    const advantageHint = this._getCharacterFlagTooltip(advantageFlag);

    const disadvantageFlag = this._getCharacterFlag([
      "disadvantage.all",
      "disadvantage.ability.all",
      "disadvantage.ability.check.all",
      `disadvantage.ability.check.${abilityId}`
    ], { situational: true });
    const disadvantage = !!(disadvantageFlag || options.disadvantage);
    const disadvantageHint = this._getCharacterFlagTooltip(disadvantageFlag);

    // Roll and return
    const flavor = game.i18n.format("SW5E.AbilityPromptTitle", { ability: label });
    const rollData = foundry.utils.mergeObject(
      {
        data,
        title: `${flavor}: ${this.name}`,
        flavor,
        elvenAccuracy: supremeAptitude,
        halflingLucky: flags.halflingLucky,
        advantageHint,
        disadvantageHint,
        messageData: {
          speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
          "flags.sw5e.roll": { type: "ability", abilityId }
        }
      },
      options
    );
    rollData.parts = parts.concat(options.parts ?? []);
    rollData.advantage = advantage && !disadvantage;
    rollData.disadvantage = !advantage && disadvantage;

    /**
     * A hook event that fires before an ability test is rolled for an Actor.
     * @function sw5e.preRollAbilityTest
     * @memberof hookEvents
     * @param {Actor5e} actor                Actor for which the ability test is being rolled.
     * @param {D20RollConfiguration} config  Configuration data for the pending roll.
     * @param {string} abilityId             ID of the ability being rolled as defined in `SW5E.abilities`.
     * @returns {boolean}                    Explicitly return `false` to prevent ability test from being rolled.
     */
    if (Hooks.call("sw5e.preRollAbilityTest", this, rollData, abilityId) === false) return;

    const roll = await d20Roll(rollData);

    /**
     * A hook event that fires after an ability test has been rolled for an Actor.
     * @function sw5e.rollAbilityTest
     * @memberof hookEvents
     * @param {Actor5e} actor     Actor for which the ability test has been rolled.
     * @param {D20Roll} roll      The resulting roll.
     * @param {string} abilityId  ID of the ability that was rolled as defined in `SW5E.abilities`.
     */
    if (roll) Hooks.callAll("sw5e.rollAbilityTest", this, roll, abilityId);

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll an Ability Saving Throw
   * Prompt the user for input regarding Advantage/Disadvantage and any Situational Bonus
   * @param {string} abilityId    The ability ID (e.g. "str")
   * @param {object} options      Options which configure how ability tests are rolled
   * @returns {Promise<D20Roll>}  A Promise which resolves to the created Roll instance
   */
  async rollAbilitySave(abilityId, options = {}) {
    const flags = this.flags.sw5e ?? {};
    const label = CONFIG.SW5E.abilities[abilityId]?.label ?? "";
    const abl = this.system.abilities[abilityId];
    const globalBonuses = this.system.bonuses?.abilities ?? {};
    const parts = [];
    const data = this.getRollData();

    // Item data
    const item = fromUuidSync(options.saveItemUuid);
    const schoolCfg = CONFIG.SW5E.powerSchools[item?.system?.school] ?? {};
    const itemData = item ? {
      isForcePower: schoolCfg.isForce,
      isTechPower: schoolCfg.isTech,
      isPoison: item.system.type.value === "poison",
      damageTypes: (item?.system?.damage?.parts ?? []).reduce(((set, part) => {
        if (part[1]) set.add(part[1]);
        return set;
      }), new Set())
    } : {};


    // Add ability modifier
    parts.push("@mod");
    data.mod = abl?.mod ?? 0;

    // Include proficiency bonus
    if (abl?.saveProf.hasProficiency) {
      parts.push("@prof");
      data.prof = abl.saveProf.term;
    }

    // Mastery proficiency
    const mastery = abl?.proficient >= 3;
    const masteryHint = mastery ? CONFIG.SW5E.proficiencyLevels[abl?.proficient].label : null;

    // High/Grand Mastery proficiency
    if (abl?.proficient >= 4) options.elvenAccuracy = abl.proficient - 3;

    // Include ability-specific saving throw bonus
    if (abl?.bonuses?.save) {
      const saveBonusKey = `${abilityId}SaveBonus`;
      parts.push(`@${saveBonusKey}`);
      data[saveBonusKey] = Roll.replaceFormulaData(abl.bonuses.save, data);
    }

    // Include a global actor ability save bonus
    if (globalBonuses.save) {
      parts.push("@saveBonus");
      data.saveBonus = Roll.replaceFormulaData(globalBonuses.save, data);
    }

    // Flags
    const supremeDurability = !!this._getCharacterFlag("supremeDurability", { ability: abilityId });
    // TODO SW5E: Check for inflicting poisoned condition for twoLivered
    const twoLivered = (itemData.isPoison) && this._getCharacterFlag("twoLivered");
    // TODO SW5E: Check for blinded, deafened, or incapacitated for dangerSense
    const dangerSense = this._getCharacterFlag("dangerSense", { ability: abilityId });

    const dmgAdvantageFlag = itemData.damageTypes?.size && this._getCharacterFlag([
      "advantage.ability.save.dmg.all",
      ...Array.from(itemData.damageTypes ?? {}).map(dmg => `advantage.ability.save.dmg.${dmg}`)
    ], { situational: true });
    const forceAdvantageFlag = itemData.isForcePower && this._getCharacterFlag([
      "advantage.ability.save.force.all",
      `advantage.ability.save.force.${abilityId}`
    ], { situational: true });
    const techAdvantageFlag = itemData.isTechPower && this._getCharacterFlag([
      "advantage.ability.save.tech.all",
      `advantage.ability.save.tech.${abilityId}`
    ], { situational: true });
    const advantageFlag = twoLivered || dangerSense || dmgAdvantageFlag || forceAdvantageFlag || techAdvantageFlag || this._getCharacterFlag([
      "advantage.all",
      "advantage.ability.all",
      "advantage.ability.save.all",
      `advantage.ability.save.${abilityId}`
    ], { situational: true });
    const advantage = !!(mastery || advantageFlag || options.advantage);
    const advantageHint = masteryHint || this._getCharacterFlagTooltip(advantageFlag);

    const dmgDisadvantageFlag = itemData.damageTypes?.size && this._getCharacterFlag([
      "disadvantage.ability.save.dmg.all",
      ...Array.from(itemData.damageTypes ?? {}).map(dmg => `disadvantage.ability.save.dmg.${dmg}`)
    ], { situational: true });
    const forceDisadvantageFlag = itemData.isForcePower && this._getCharacterFlag([
      "disadvantage.ability.save.force.all",
      `disadvantage.ability.save.force.${abilityId}`
    ], { situational: true });
    const techDisadvantageFlag = itemData.isTechPower && this._getCharacterFlag([
      "disadvantage.ability.save.tech.all",
      `disadvantage.ability.save.tech.${abilityId}`
    ], { situational: true });
    const disadvantageFlag = dmgDisadvantageFlag || forceDisadvantageFlag || techDisadvantageFlag || this._getCharacterFlag([
      "disadvantage.all",
      "disadvantage.ability.all",
      "disadvantage.ability.save.all",
      `disadvantage.ability.save.${abilityId}`
    ], { situational: true });
    const disadvantage = !!(disadvantageFlag || options.disadvantage);
    const disadvantageHint = this._getCharacterFlagTooltip(disadvantageFlag);

    // Roll and return
    const flavor = game.i18n.format("SW5E.SavePromptTitle", { ability: label });
    const rollData = foundry.utils.mergeObject(
      {
        data,
        title: `${flavor}: ${this.name}`,
        flavor,
        elvenAccuracy: supremeDurability,
        halflingLucky: flags.halflingLucky,
        advantageHint,
        disadvantageHint,
        messageData: {
          speaker: options.speaker || ChatMessage.getSpeaker({ actor: this }),
          "flags.sw5e.roll": { type: "save", abilityId }
        }
      },
      options
    );
    rollData.parts = parts.concat(options.parts ?? []);
    rollData.advantage = advantage && !disadvantage;
    rollData.disadvantage = !advantage && disadvantage;

    /**
     * A hook event that fires before an ability save is rolled for an Actor.
     * @function sw5e.preRollAbilitySave
     * @memberof hookEvents
     * @param {Actor5e} actor                Actor for which the ability save is being rolled.
     * @param {D20RollConfiguration} config  Configuration data for the pending roll.
     * @param {string} abilityId             ID of the ability being rolled as defined in `SW5E.abilities`.
     * @returns {boolean}                    Explicitly return `false` to prevent ability save from being rolled.
     */
    if (Hooks.call("sw5e.preRollAbilitySave", this, rollData, abilityId) === false) return;

    const roll = await d20Roll(rollData);

    /**
     * A hook event that fires after an ability save has been rolled for an Actor.
     * @function sw5e.rollAbilitySave
     * @memberof hookEvents
     * @param {Actor5e} actor     Actor for which the ability save has been rolled.
     * @param {D20Roll} roll      The resulting roll.
     * @param {string} abilityId  ID of the ability that was rolled as defined in `SW5E.abilities`.
     */
    if (roll) Hooks.callAll("sw5e.rollAbilitySave", this, roll, abilityId);

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Perform a death saving throw, rolling a d20 plus any global save bonuses
   * @param {object} options          Additional options which modify the roll
   * @returns {Promise<D20Roll|null>} A Promise which resolves to the Roll instance
   */
  async rollDeathSave(options = {}) {
    const death = this.system.attributes.death;

    // Display a warning if we are not at zero HP or if we already have reached 3
    if (this.system.attributes.hp.value > 0 || death.failure >= 3 || death.success >= 3) {
      ui.notifications.warn("SW5E.DeathSaveUnnecessary", { localize: true });
      return null;
    }

    // Evaluate a global saving throw bonus
    const speaker = options.speaker || ChatMessage.getSpeaker({ actor: this });
    const globalBonuses = this.system.bonuses?.abilities ?? {};
    const parts = [];
    const data = this.getRollData();

    // Diamond Soul adds proficiency
    if (this.getFlag("sw5e", "diamondSoul")) {
      parts.push("@prof");
      data.prof = new Proficiency(this.system.attributes.prof, 1).term;
    }

    const advantageFlag = this._getCharacterFlag([
      "advantage.all",
      "advantage.ability.save.all",
      "advantage.deathSave"
    ], { situational: true });
    const advantage = !!(advantageFlag || options.advantage);
    const advantageHint = this._getCharacterFlagTooltip(advantageFlag);

    const disadvantageFlag = this._getCharacterFlag([
      "disadvantage.all",
      "disadvantage.ability.save.all",
      "disadvantage.deathSave"
    ], { situational: true });
    const disadvantage = !!(disadvantageFlag || options.disadvantage);
    const disadvantageHint = this._getCharacterFlagTooltip(disadvantageFlag);

    // Include a global actor ability save bonus
    if (globalBonuses.save) {
      parts.push("@saveBonus");
      data.saveBonus = Roll.replaceFormulaData(globalBonuses.save, data);
    }

    // Evaluate the roll
    const flavor = game.i18n.localize("SW5E.DeathSavingThrow");
    const rollData = foundry.utils.mergeObject(
      {
        data,
        title: `${flavor}: ${this.name}`,
        flavor,
        halflingLucky: this.getFlag("sw5e", "halflingLucky"),
        targetValue: 10,
        advantageHint,
        disadvantageHint,
        messageData: {
          speaker: speaker,
          "flags.sw5e.roll": { type: "death" }
        }
      },
      options
    );
    rollData.parts = parts.concat(options.parts ?? []);
    rollData.advantage = advantage && !disadvantage;
    rollData.disadvantage = !advantage && disadvantage;

    /**
     * A hook event that fires before a death saving throw is rolled for an Actor.
     * @function sw5e.preRollDeathSave
     * @memberof hookEvents
     * @param {Actor5e} actor                Actor for which the death saving throw is being rolled.
     * @param {D20RollConfiguration} config  Configuration data for the pending roll.
     * @returns {boolean}                    Explicitly return `false` to prevent death saving throw from being rolled.
     */
    if (Hooks.call("sw5e.preRollDeathSave", this, rollData) === false) return;

    const roll = await d20Roll(rollData);
    if (!roll) return null;

    // Take action depending on the result
    const details = {};

    // Save success
    if (roll.total >= (roll.options.targetValue ?? 10)) {
      let successes = (death.success || 0) + 1;

      // Critical Success = revive with 1hp
      if (roll.isCritical) {
        details.updates = {
          "system.attributes.death.success": 0,
          "system.attributes.death.failure": 0,
          "system.attributes.hp.value": 1
        };
        details.chatString = "SW5E.DeathSaveCriticalSuccess";
      }

      // 3 Successes = survive and reset checks
      else if (successes === 3) {
        details.updates = {
          "system.attributes.death.success": 0,
          "system.attributes.death.failure": 0
        };
        details.chatString = "SW5E.DeathSaveSuccess";
      }

      // Increment successes
      else details.updates = { "system.attributes.death.success": Math.clamped(successes, 0, 3) };
    }

    // Save failure
    else {
      let failures = (death.failure || 0) + (roll.isFumble ? 2 : 1);
      details.updates = { "system.attributes.death.failure": Math.clamped(failures, 0, 3) };
      if (failures >= 3) {
        // 3 Failures = death
        details.chatString = "SW5E.DeathSaveFailure";
      }
    }

    /**
     * A hook event that fires after a death saving throw has been rolled for an Actor, but before
     * updates have been performed.
     * @function sw5e.rollDeathSave
     * @memberof hookEvents
     * @param {Actor5e} actor              Actor for which the death saving throw has been rolled.
     * @param {D20Roll} roll               The resulting roll.
     * @param {object} details
     * @param {object} details.updates     Updates that will be applied to the actor as a result of this save.
     * @param {string} details.chatString  Localizable string displayed in the create chat message. If not set, then
     *                                     no chat message will be displayed.
     * @returns {boolean}                  Explicitly return `false` to prevent updates from being performed.
     */
    if (Hooks.call("sw5e.rollDeathSave", this, roll, details) === false) return roll;

    if (!foundry.utils.isEmpty(details.updates)) await this.update(details.updates);

    // Display success/failure chat message
    if (details.chatString) {
      let chatData = { content: game.i18n.format(details.chatString, { name: this.name }), speaker };
      ChatMessage.applyRollMode(chatData, roll.options.rollMode);
      await ChatMessage.create(chatData);
    }

    // Return the rolled result
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Perform a destruction saving throw, rolling a d20 plus any global save bonuses
   * @param {object} options           Additional options which modify the roll
   * @returns {Promise<D20Roll|null>}  A Promise which resolves to the Roll instance
   */
  async rollDestructionSave(options = {}) {
    const death = this.system.attributes.death;

    // Display a warning if we are not at zero HP or if we already have reached 3
    if (this.system.attributes.hp.value > 0 || death.failure >= 3 || death.success >= 3) {
      ui.notifications.warn(game.i18n.localize("SW5E.DestructionSaveUnnecessary"));
      return null;
    }

    // Evaluate a global saving throw bonus
    const speaker = options.speaker || ChatMessage.getSpeaker({ actor: this });
    const globalBonuses = this.system.bonuses?.abilities ?? {};
    const parts = [];
    const data = this.getRollData();

    const advantageFlag = this._getCharacterFlag([
      "advantage.all",
      "advantage.ability.save.all",
      "advantage.deathSave"
    ], { situational: true });
    const advantage = !!(advantageFlag || options.advantage);
    const advantageHint = this._getCharacterFlagTooltip(advantageFlag);

    const disadvantageFlag = this._getCharacterFlag([
      "disadvantage.all",
      "disadvantage.ability.save.all",
      "disadvantage.deathSave"
    ], { situational: true });
    const disadvantage = !!(disadvantageFlag || options.disadvantage);
    const disadvantageHint = this._getCharacterFlagTooltip(disadvantageFlag);

    // Include a global actor ability save bonus
    if (globalBonuses.save) {
      parts.push("@saveBonus");
      data.saveBonus = Roll.replaceFormulaData(globalBonuses.save, data);
    }

    // Evaluate the roll
    const rollData = foundry.utils.mergeObject(
      {
        parts,
        data,
        title: `${game.i18n.localize("SW5E.DestructionSavingThrow")}: ${this.name}`,
        halflingLucky: this.getFlag("sw5e", "halflingLucky"),
        advantageHint,
        disadvantageHint,
        targetValue: 10,
        messageData: {
          speaker: speaker,
          "flags.sw5e.roll": { type: "destruction" }
        }
      },
      options
    );
    rollData.advantage = advantage && !disadvantage;
    rollData.disadvantage = !advantage && disadvantage;

    /**
     * A hook event that fires before a destruction saving throw is rolled for an Actor.
     * @function sw5e.preRollDestructionSave
     * @memberof hookEvents
     * @param {Actor5e} actor                Actor for which the destruction saving throw is being rolled.
     * @param {D20RollConfiguration} config  Configuration data for the pending roll.
     * @returns {boolean}                    Explicitly return `false` to prevent destruction save from being rolled.
     */
    if (Hooks.call("sw5e.preRollDestructionSave", this, rollData) === false) return;

    const roll = await d20Roll(rollData);
    if (!roll) return null;

    // Take action depending on the result
    const details = {};

    // Save success
    if (roll.total >= (roll.options.targetValue ?? 10)) {
      let successes = (death.success || 0) + 1;

      // Critical Success = revive with 1hp
      if (roll.isCritical) {
        details.updates = {
          "system.attributes.death.success": 0,
          "system.attributes.death.failure": 0,
          "system.attributes.hp.value": 1
        };
        details.chatString = "SW5E.DestructionSaveCriticalSuccess";
      }

      // 3 Successes = survive and reset checks
      else if (successes === 3) {
        details.updates = {
          "system.attributes.death.success": 0,
          "system.attributes.death.failure": 0
        };
        details.chatString = "SW5E.DestructionSaveSuccess";
      }

      // Increment successes
      else details.update = { "system.attributes.death.success": Math.clamped(successes, 0, 3) };
    }

    // Save failure
    else {
      let failures = (death.failure || 0) + (roll.isFumble ? 2 : 1);
      details.updates = { "system.attributes.death.failure": Math.clamped(failures, 0, 3) };
      if (failures >= 3) {
        // 3 Failures = destruction
        details.chatString = "SW5E.DestructionSaveFailure";
      }
    }
    /**
     * A hook event that fires after a destruction saving throw has been rolled for an Actor, but before
     * updates have been performed.
     * @function sw5e.rollDestructionSave
     * @memberof hookEvents
     * @param {Actor5e} actor              Actor for which the destruction saving throw has been rolled.
     * @param {D20Roll} roll               The resulting roll.
     * @param {object} details
     * @param {object} details.updates     Updates that will be applied to the actor as a result of this save.
     * @param {string} details.chatString  Localizable string displayed in the create chat message. If not set, then
     *                                     no chat message will be displayed.
     * @returns {boolean}                  Explicitly return `false` to prevent updates from being performed.
     */
    if (Hooks.call("sw5e.rollDestructionSave", this, roll, details) === false) return roll;

    if (!foundry.utils.isEmpty(details.updates)) await this.update(details.updates);

    // Display success/failure chat message
    if (details.chatString) {
      let chatData = { content: game.i18n.format(details.chatString, { name: this.name }), speaker };
      ChatMessage.applyRollMode(chatData, roll.options.rollMode);
      await ChatMessage.create(chatData);
    }

    // Return the rolled result
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Get an un-evaluated D20Roll instance used to roll initiative for this Actor.
   * @param {object} [options]                        Options which modify the roll
   * @param {D20Roll.ADV_MODE} [options.advantageMode]    A specific advantage mode to apply
   * @param {string} [options.flavor]                     Special flavor text to apply
   * @returns {D20Roll}                               The constructed but unevaluated D20Roll
   */
  getInitiativeRoll(options = {}) {
    // Use a temporarily cached initiative roll
    if (this._cachedInitiativeRoll) return this._cachedInitiativeRoll.clone();

    // Obtain required data
    const init = this.system.attributes?.init;
    const abilityId = init?.ability || CONFIG.SW5E.initiativeAbility;
    const data = this.getRollData();
    const flags = this.flags.sw5e || {};
    if (flags.initiativeAdv) options.advantageMode ??= sw5e.dice.D20Roll.ADV_MODE.ADVANTAGE;

    // Standard initiative formula
    const parts = ["1d20"];

    // Special initiative bonuses
    if (init) {
      parts.push(init.mod);
      if (init.prof.term !== "0") {
        parts.push("@prof");
        data.prof = init.prof.term;
      }
      if (init.bonus) {
        parts.push("@bonus");
        data.bonus = Roll.replaceFormulaData(init.bonus, data);
      }
    }

    // Ability check bonuses
    if ("abilities" in this.system) {
      const abilityBonus = this.system.abilities[abilityId]?.bonuses?.check;
      if (abilityBonus) {
        parts.push("@abilityBonus");
        data.abilityBonus = Roll.replaceFormulaData(abilityBonus, data);
      }
    }

    // Global check bonus
    if ("bonuses" in this.system) {
      const globalCheckBonus = this.system.bonuses.abilities?.check;
      if (globalCheckBonus) {
        parts.push("@globalBonus");
        data.globalBonus = Roll.replaceFormulaData(globalCheckBonus, data);
      }
    }

    // Alert feat
    if (flags.initiativeAlert) {
      parts.push("@alertBonus");
      data.alertBonus = 5;
    }

    // Ability score tiebreaker
    const tiebreaker = game.settings.get("sw5e", "initiativeDexTiebreaker");
    if (tiebreaker && "abilities" in this.system) {
      const abilityValue = this.system.abilities[abilityId]?.value;
      if (Number.isNumeric(abilityValue)) parts.push(String(abilityValue / 100));
    }

    options = foundry.utils.mergeObject(
      {
        flavor: options.flavor ?? game.i18n.localize("SW5E.Initiative"),
        halflingLucky: flags.halflingLucky ?? false,
        critical: null,
        fumble: null
      },
      options
    );

    // Create the d20 roll
    const formula = parts.join(" + ");
    return new CONFIG.Dice.D20Roll(formula, data, options);
  }

  /* -------------------------------------------- */

  /**
   * Roll initiative for this Actor with a dialog that provides an opportunity to elect advantage or other bonuses.
   * @param {object} [rollOptions]      Options forwarded to the Actor#getInitiativeRoll method
   * @returns {Promise<void>}           A promise which resolves once initiative has been rolled for the Actor
   */
  async rollInitiativeDialog(rollOptions = {}) {
    // Create and configure the Initiative roll
    const roll = this.getInitiativeRoll(rollOptions);
    const choice = await roll.configureDialog({
      defaultRollMode: game.settings.get("core", "rollMode"),
      title: `${game.i18n.localize("SW5E.InitiativeRoll")}: ${this.name}`,
      chooseModifier: false,
      defaultAction: rollOptions.advantageMode ?? sw5e.dice.D20Roll.ADV_MODE.NORMAL
    });
    if (choice === null) return; // Closed dialog

    // Temporarily cache the configured roll and use it to roll initiative for the Actor
    this._cachedInitiativeRoll = roll;
    await this.rollInitiative({ createCombatants: true });
    delete this._cachedInitiativeRoll;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async rollInitiative(options={}, rollOptions={}) {
    this._cachedInitiativeRoll ??= this.getInitiativeRoll(rollOptions);

    /**
     * A hook event that fires before initiative is rolled for an Actor.
     * @function sw5e.preRollInitiative
     * @memberof hookEvents
     * @param {Actor5e} actor  The Actor that is rolling initiative.
     * @param {D20Roll} roll   The initiative roll.
     */
    if ( Hooks.call("sw5e.preRollInitiative", this, this._cachedInitiativeRoll) === false ) {
      delete this._cachedInitiativeRoll;
      return null;
    }

    const combat = await super.rollInitiative(options);
    const combatants = this.isToken ? this.getActiveTokens(false, true).reduce((arr, t) => {
      const combatant = game.combat.getCombatantByToken(t.id);
      if ( combatant ) arr.push(combatant);
      return arr;
    }, []) : [game.combat.getCombatantByActor(this.id)];
    /**
     * A hook event that fires after an Actor has rolled for initiative.
     * @function sw5e.rollInitiative
     * @memberof hookEvents
     * @param {Actor5e} actor           The Actor that rolled initiative.
     * @param {Combatant[]} combatants  The associated Combatants in the Combat.
     */
    Hooks.callAll("sw5e.rollInitiative", this, combatants);
    delete this._cachedInitiativeRoll;
    return combat;
  }

  /* -------------------------------------------- */

  /**
   * Roll a hit die of the appropriate type, gaining hit points equal to the die roll plus your CON modifier.
   * @param {string} [denomination]  The hit denomination of hit die to roll. Example "d8".
   *                                 If no denomination is provided, the first available HD will be used
   * @param {object} options         Additional options which modify the roll.
   * @returns {Promise<Roll|null>}   The created Roll instance, or null if no hit die was rolled
   */
  async rollHitDie(denomination, options = {}) {
    // If no denomination was provided, choose the first available
    let cls = null;
    if (!denomination) {
      cls = this.itemTypes.class.find(c => c.system.hitDiceUsed < c.system.levels);
      if (!cls) return null;
      denomination = cls.system.hitDice;
    }

    // Otherwise, locate a class (if any) which has an available hit die of the requested denomination
    else cls = this.items.find(i => {
      return i.system.hitDice === denomination && (i.system.hitDiceUsed || 0) < (i.system.levels || 1);
    });

    // If no class is available, display an error notification
    if (!cls) {
      ui.notifications.error(game.i18n.format("SW5E.HitDiceWarn", { name: this.name, formula: denomination }));
      return null;
    }

    // Prepare roll data
    const flavor = game.i18n.localize("SW5E.HitDiceRoll");
    const rollConfig = foundry.utils.mergeObject(
      {
        formula: `max(0, 1${denomination} + @abilities.con.mod)`,
        data: this.getRollData(),
        chatMessage: true,
        messageData: {
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor,
          title: `${flavor}: ${this.name}`,
          rollMode: game.settings.get("core", "rollMode"),
          "flags.sw5e.roll": { type: "hitDie" }
        }
      },
      options
    );

    /**
     * A hook event that fires before a hit die is rolled for an Actor.
     * @function sw5e.preRollHitDie
     * @memberof hookEvents
     * @param {Actor5e} actor               Actor for which the hit die is to be rolled.
     * @param {object} config               Configuration data for the pending roll.
     * @param {string} config.formula       Formula that will be rolled.
     * @param {object} config.data          Data used when evaluating the roll.
     * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
     * @param {object} config.messageData   Data used to create the chat message.
     * @param {string} denomination         Size of hit die to be rolled.
     * @returns {boolean}                   Explicitly return `false` to prevent hit die from being rolled.
     */
    if (Hooks.call("sw5e.preRollHitDie", this, rollConfig, denomination) === false) return;

    const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({ async: true });
    if (rollConfig.chatMessage) roll.toMessage(rollConfig.messageData);

    const hp = this.system.attributes.hp;
    const dhp = Math.min(Math.max(0, hp.max + (hp.tempmax ?? 0)) - hp.value, roll.total);
    const updates = {
      actor: { "system.attributes.hp.value": hp.value + dhp },
      class: { "system.hitDiceUsed": cls.system.hitDiceUsed + 1 }
    };

    /**
     * A hook event that fires after a hit die has been rolled for an Actor, but before updates have been performed.
     * @function sw5e.rollHitDie
     * @memberof hookEvents
     * @param {Actor5e} actor         Actor for which the hit die has been rolled.
     * @param {Roll} roll             The resulting roll.
     * @param {object} updates
     * @param {object} updates.actor  Updates that will be applied to the actor.
     * @param {object} updates.class  Updates that will be applied to the class.
     * @returns {boolean}             Explicitly return `false` to prevent updates from being performed.
     */
    if (Hooks.call("sw5e.rollHitDie", this, roll, updates) === false) return roll;

    // Re-evaluate dhp in the event that it was changed in the previous hook
    const updateOptions = { dhp: (updates.actor?.["system.attributes.hp.value"] ?? hp.value) - hp.value };

    // Perform updates
    if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor, updateOptions);
    if (!foundry.utils.isEmpty(updates.class)) await cls.update(updates.class);

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll a hull die of the appropriate type, gaining hull points equal to the die roll plus your CON modifier
   * @param {string} [denomination]          The hit denomination of hull die to roll. Example "d8".
   *                                         If no denomination is provided, the first available HD will be used
   * @param {string} [numDice]               How many dice to roll?
   * @param {string} [keep]                  Which dice to keep? Example "kh1".
   * @param {object} options                 Additional options which modify the roll.
   * @returns {Promise<attribDieRoll|null>}  The created Roll instance, or null if no hull die was rolled
   */
  async rollHullDie(denomination, numDice = "1", keep = "", options = {}) {
    // If no denomination was provided, choose the first available
    let sship = null;
    const hullMult = ["huge", "grg"].includes(this.system.traits.size) ? 2 : 1;
    if (!denomination) {
      sship = this.itemTypes.starshipsize.find(
        s => s.system.hullDiceUsed < (s.system.tier * hullMult) + s.system.hullDiceStart
      );
      if (!sship) return null;
      denomination = sship.system.hullDice;
    }
    // Otherwise locate a starship (if any) which has an available hit die of the requested denomination
    else sship = this.items.find(i => {
      return (
        i.system.hullDice === denomination
          && (i.system.hullDiceUsed || 0) < (i.system.tier * hullMult || 0) + i.system.hullDiceStart
      );
    });

    // If no starship is available, display an error notification
    if (!sship) {
      ui.notifications.error(
        game.i18n.format("SW5E.HullDiceWarn", {
          name: this.name,
          formula: denomination
        })
      );
      return null;
    }


    // Prepare roll data
    if (options.fastForward === undefined) options.fastForward = !options.dialog;
    const flavor = game.i18n.localize("SW5E.HullDiceRoll");
    const rollConfig = foundry.utils.mergeObject(
      {
        formula: `max(0, ${numDice}${denomination}${keep} + @abilities.con.mod)`,
        data: this.getRollData(),
        chatMessage: true,
        messageData: {
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor,
          title: `${flavor}: ${this.name}`,
          rollMode: game.settings.get("core", "rollMode"),
          "flags.sw5e.roll": { type: "hullDie" }
        }
      },
      options
    );

    /**
     * A hook event that fires before a hull die is rolled for an Actor.
     * @function sw5e.preRollHullDie
     * @memberof hookEvents
     * @param {Actor5e} actor               Actor for which the hull die is to be rolled.
     * @param {object} config               Configuration data for the pending roll.
     * @param {string} config.formula       Formula that will be rolled.
     * @param {object} config.data          Data used when evaluating the roll.
     * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
     * @param {object} config.messageData   Data used to create the chat message.
     * @param {string} denomination         Size of hull die to be rolled.
     * @returns {boolean}                   Explicitly return `false` to prevent hull die from being rolled.
     */
    if (Hooks.call("sw5e.preRollHullDie", this, rollConfig, denomination) === false) return;

    const roll = await new Roll(rollConfig.formula, rollConfig.data).roll({ async: true });
    if (!roll) return roll;
    if (rollConfig.chatMessage) roll.toMessage(rollConfig.messageData);

    const hp = this.system.attributes.hp;
    const dhp = Math.min(Math.max(0, hp.max) - hp.value, roll.total);
    const updates = {
      actor: { "system.attributes.hp.value": hp.value + dhp },
      starship: { "system.hullDiceUsed": sship.system.hullDiceUsed + 1 }
    };

    /**
     * A hook event that fires after a hull die has been rolled for an Actor, but before updates have been performed.
     * @function sw5e.rollHullDie
     * @memberof hookEvents
     * @param {Actor5e} actor            Actor for which the hull die has been rolled.
     * @param {AttribDieRoll} roll       The resulting roll.
     * @param {object} updates
     * @param {object} updates.actor     Updates that will be applied to the actor.
     * @param {object} updates.starship  Updates that will be applied to the starship size.
     * @returns {boolean}                Explicitly return `false` to prevent updates from being performed.
     */
    if (Hooks.call("sw5e.rollHullDie", this, roll, updates) === false) return roll;

    // Perform updates
    if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);
    if (!foundry.utils.isEmpty(updates.starship)) await sship.update(updates.starship);

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Results from a roll shield die operation.
   *
   * @typedef {object} SDRollResult
   * @property {number} sp             Shield Points recovered.
   * @property {object} actorUpdates   Updates applied to the actor.
   * @property {object} itemUpdates    Updates applied to the actor's items.
   * @property {Roll} roll             The created Roll instance, or null if no shield die was rolled
   */

  /**
   * Roll a shield die of the appropriate type, gaining shield points equal to the die roll
   * multiplied by the shield regeneration coefficient
   *
   * @param {object} [cfg]
   * @param {string} [cfg.denomination]     The denomination of shield die to roll. Example "d8".
   *                                        If no denomination is provided, the first available SD will be used
   * @param {boolean} [cfg.natural=false]   Natural ship shield regeneration (true) or user action (false)?
   * @param {string} [cfg.numDice="1"]      How many dice to roll?
   * @param {string} [cfg.keep=""]          Which dice to keep? Example "kh1".
   * @param {string} [cfg.update=true]      Wheter to apply the updates or just return them.
   * @param {object} [cfg.options={}]       Additional options which modify the roll.
   * @returns {Promise<SDRollResult|null>}  A Promise which resolves once the shield die roll workflow has completed.
   */
  async rollShieldDie({ denomination, natural = false, numDice = "1", keep = "", update = true, options = {} } = {}) {
    const result = {
      sp: 0,
      actorUpdates: {},
      itemUpdates: [],
      roll: null
    };

    const attr = this.system.attributes;
    const shld = attr.shld;
    const hp = attr.hp;

    // If shields are depleted, display an error notification and exit
    if (shld.depleted) {
      ui.notifications.error(
        game.i18n.format("SW5E.ShieldDepletedWarn", {
          name: this.name
        })
      );
      return result;
    }

    // If no denomination was provided, choose the first available
    let sship = null;
    const shldMult = ["huge", "grg"].includes(this.system.traits.size) ? 2 : 1;
    if (!denomination) {
      sship = this.itemTypes.starshipsize.find(
        i => (i.system.shldDiceUsed || 0) < (i.system.tier * shldMult || 0) + i.system.shldDiceStart
      );
      if (!sship) return result;
      denomination = sship.system.shldDice;
    }
    // Otherwise locate a starship (if any) which has an available shield die of the requested denomination
    else {
      sship = this.itemTypes.starshipsize.find(i => {
        return (
          i.system.shldDice === denomination
          && (i.system.shldDiceUsed || 0) < (i.system.tier * shldMult || 0) + i.system.shldDiceStart
        );
      });
    }

    // If no starship is available, display an error notification
    if (!sship) {
      ui.notifications.error(
        game.i18n.format("SW5E.ShieldDiceWarn", {
          name: this.name,
          formula: denomination
        })
      );
      return result;
    }

    // If shields are full, display an error notification
    if (hp.temp >= hp.tempmax) {
      ui.notifications.error(
        game.i18n.format("SW5E.ShieldFullWarn", {
          name: this.name
        })
      );
      return result;
    }

    // Prepare roll data
    if (options.fastForward === undefined) options.fastForward = !options.dialog;
    const dieRoll = natural
      ? `${denomination.substring(1)} * @attributes.equip.shields.regenRateMult`
      : `max(0, 1${denomination} + @abilities.str.mod)`;
    const flavor = game.i18n.localize("SW5E.ShieldDiceRoll");
    const rollConfig = foundry.utils.mergeObject(
      {
        formula: dieRoll,
        data: this.getRollData(),
        chatMessage: true,
        messageData: {
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor,
          title: `${flavor}: ${this.name}`,
          rollMode: game.settings.get("core", "rollMode"),
          "flags.sw5e.roll": { type: "shieldDie" }
        }
      },
      options
    );

    /**
     * A hook event that fires before a shield die is rolled for an Actor.
     * @function sw5e.preRollShieldDie
     * @memberof hookEvents
     * @param {Actor5e} actor               Actor for which the shield die is to be rolled.
     * @param {object} config               Configuration data for the pending roll.
     * @param {string} config.formula       Formula that will be rolled.
     * @param {object} config.data          Data used when evaluating the roll.
     * @param {boolean} config.chatMessage  Should a chat message be created for this roll?
     * @param {object} config.messageData   Data used to create the chat message.
     * @param {string} denomination         Size of shield die to be rolled.
     * @returns {boolean}                   Explicitly return `false` to prevent shield die from being rolled.
     */
    if (Hooks.call("sw5e.preRollShieldDie", this, rollConfig, denomination) === false) return;

    const roll = await new Roll(rollConfig.formula, rollConfig.data)?.roll({ async: true });
    if (!roll) return result;
    if (rollConfig.chatMessage) roll.toMessage(rollConfig.messageData);
    result.roll = roll;

    const dsp = Math.min(Math.max(0, hp.tempmax) - hp.temp, roll.total);
    result.sp = dsp;

    const updates = {
      actor: { "system.attributes.hp.temp": hp.temp + dsp },
      starship: { "system.shldDiceUsed": sship.system.shldDiceUsed + 1 }
    };
    result.actorUpdates = updates.actor;
    result.itemUpdates = [{ ...updates.starship, _id: sship.id }];

    /**
     * A hook event that fires after a shield die has been rolled for an Actor, but before updates have been performed.
     * @function sw5e.rollShieldDie
     * @memberof hookEvents
     * @param {Actor5e} actor            Actor for which the shield die has been rolled.
     * @param {AttribDieRoll} roll       The resulting roll.
     * @param {object} updates
     * @param {object} updates.actor     Updates that will be applied to the actor.
     * @param {object} updates.starship  Updates that will be applied to the starship size.
     * @returns {boolean}                Explicitly return `false` to prevent updates from being performed.
     */
    if (Hooks.call("sw5e.rollShieldDie", this, roll, updates) === false) return result;

    // Perform updates
    if (update) {
      if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);
      if (!foundry.utils.isEmpty(updates.starship)) await sship.update(updates.starship);
    }

    return result;
  }

  /* -------------------------------------------- */

  /**
   * Results from a power die recovery operation.
   *
   * @typedef {object} PDRecResult
   * @property {number} pd             Power die recovered.
   * @property {object} actorUpdates   Updates applied to the actor.
   * @property {object} itemUpdates    Updates applied to the actor's items.
   * @property {Roll} roll             The created Roll instance, or null if no power die was rolled.
   */

  /**
   * Roll a power die recovery of the appropriate type, gaining power dice equal to the roll
   *
   * @param {object} config
   * @param {string} [config.formula]                Formula from reactor to use for power die recovery.
   * @param {boolean} [config.update=false]          Wheter or not to perform the updates or just return them.
   * @param {object} [config.options={}]             Additional options which modify the roll.
   * @returns {Promise<PDRecResult|null>} A Promise which resolves once the power die recovery workflow has completed.
   */
  async rollPowerDieRecovery({ formula, update = false, options = {} } = {}) {
    const result = {
      pd: 0,
      actorUpdates: {},
      itemUpdates: [],
      roll: null
    };

    // Prepare helper data
    const attr = this.system.attributes;
    const pd = attr.power;

    // If no formula check starship for equipped reactor
    if (!formula) formula = attr.equip.reactor.powerRecDie;

    // Calculate how many available slots for power die the ship has
    const pdMissing = {};
    const slots = CONFIG.SW5E.powerDieSlots;
    for (const slot of Object.keys(slots)) {
      pdMissing[slot] = pd[slot].max - Number(pd[slot].value);
      pdMissing.total = (pdMissing.total ?? 0) + pdMissing[slot];
    }

    // Don't roll it there are no available slots
    if (!pdMissing.total) return result;

    // Prepare roll data
    const flavor = game.i18n.localize("SW5E.PowerDiceRecovery");

    // Call the roll helper utility
    const rollData = foundry.utils.mergeObject(
      {
        event: new Event("pwrDieRec"),
        parts: [formula],
        data: this.getRollData(),
        title: `${flavor}: ${this.name}`,
        fastForward: true,
        dialogOptions: { width: 350 },
        messageData: {
          speaker: ChatMessage.getSpeaker({ actor: this }),
          "flags.sw5e.roll": { type: "pwrDieRec" }
        }
      },
      options
    );

    /**
     * A hook event that fires before a power recovery die is rolled for an Actor.
     * @function sw5e.preRollPowerDieRecovery
     * @memberof hookEvents
     * @param {Actor5e} actor         Actor for which the power recovery die is to be rolled.
     * @param {object} rollData       Configuration data for the pending roll.
     * @param {string} formula        Formula of power recovery die to be rolled.
     * @returns {boolean}             Explicitly return `false` to prevent power recovery die from being rolled.
     */
    if (Hooks.call("sw5e.preRollPowerDieRecovery", this, rollData, formula) === false) return result;

    const roll = await attribDieRoll(rollData);
    if (!roll) return result;

    // If the roll is enough to fill all available slots
    if (pdMissing.total <= roll.total) {
      for (const slot of Object.keys(slots)) result.actorUpdates[`system.attributes.power.${slot}.value`] = pd[slot].max;
      result.pd = pdMissing.total;
    }
    // If all new power die can fit into the central storage
    else if (pdMissing.central >= roll.total) {
      result.actorUpdates["system.attributes.power.central.value"] = String(Number(pd.central.value) + roll.total);
      result.pd = roll.total;
    }
    // Otherwise, create an allocation dialog popup
    else {
      result.actorUpdates["system.attributes.power.central.value"] = pd.central.max;
      try {
        const allocation = await AllocatePowerDice.allocatePowerDice(this, roll.total - pdMissing.central);
        for (const slot of allocation) result.actorUpdates[`system.attributes.power.${slot}.value`] = Number(pd[slot].value) + 1;
        result.pd = allocation.length + pdMissing.central;
      } catch(err) {
        return result;
      }
    }

    const updates = {
      actor: result.actorUpdates,
      starship: result.itemUpdates
    };

    /**
     * A hook event that fires after a power die recovery has been rolled, but before updates have been performed.
     * @function sw5e.rollPowerDieRecovery
     * @memberof hookEvents
     * @param {Actor5e} actor            Actor for which the power recovery die has been rolled.
     * @param {AttribDieRoll} roll       The resulting roll.
     * @param {object} updates
     * @param {object} updates.actor     Updates that will be applied to the actor.
     * @param {object} updates.starship  Updates that will be applied to the starship size.
     * @returns {boolean}                Explicitly return `false` to prevent updates from being performed.
     */
    if (Hooks.call("sw5e.rollPowerDieRecovery", this, roll, updates) === false) return result;

    // Perform updates
    if (update) {
      if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);
      if (!foundry.utils.isEmpty(updates.starship)) await sship.update(updates.starship);
    }

    result.roll = roll;
    return result;
  }

  /* -------------------------------------------- */

  /**
   * Roll a power die
   *
   * @param {string} [slot]                Where to draw the power die from, if empty, opens a popup to select
   * @param {object} options               Additional options which modify the roll.
   * @returns {Promise<AttribDieRoll|null>}  The created Roll instance, or null if no power die was rolled
   */
  async rollPowerDie(slot = null, options = {}) {
    // Prepare helper data
    const attr = this.system.attributes;
    const pd = attr.power;
    const slots = CONFIG.SW5E.powerDieSlots;

    // Validate the slot
    if (slot === null) {
      try {
        slot = await ExpendPowerDice.expendPowerDice(this);
      } catch(err) {
        return null;
      }
    }
    if (!(slot in slots)) {
      ui.notifications.warn(
        game.i18n.format("SW5E.PowerDieInvalidSlot", {
          slot
        })
      );
      return null;
    }
    if (pd[slot].value < 1) {
      ui.notifications.warn(
        game.i18n.format("SW5E.PowerDieUnavailable", {
          slot: game.i18n.localize(CONFIG.SW5E.powerDieSlots[slot])
        })
      );
      return null;
    }

    // Prepare the roll data
    const flavor = game.i18n.localize("SW5E.PowerDiceRoll");

    // Call the roll helper utility
    const rollData = foundry.utils.mergeObject(
      {
        event: new Event("pwrDieRoll"),
        parts: [pd.die],
        data: this.getRollData(),
        title: `${flavor}: ${this.name}`,
        fastForward: true,
        dialogOptions: { width: 350 },
        messageData: {
          speaker: ChatMessage.getSpeaker({ actor: this }),
          "flags.sw5e.roll": { type: "pwrDieRoll" }
        }
      },
      options
    );

    /**
     * A hook event that fires before a power die is rolled for an Actor.
     * @function sw5e.preRollPowerDie
     * @memberof hookEvents
     * @param {Actor5e} actor         Actor for which the power die is to be rolled.
     * @param {object} rollData       Configuration data for the pending roll.
     * @param {string} denomination   Size of power die to be rolled.
     * @returns {boolean}             Explicitly return `false` to prevent power die from being rolled.
     */
    if (Hooks.call("sw5e.preRollPowerDie", this, rollData, pd.die) === false) return;

    const roll = await attribDieRoll(rollData);
    if (!roll) return roll;

    const updates = {
      actor: {}
    };
    updates.actor[`system.attributes.power.${slot}.value`] = pd[slot].value - 1;

    /**
     * A hook event that fires after a Power die has been rolled for an Actor, but before updates have been performed.
     * @function sw5e.rollPowerDie
     * @memberof hookEvents
     * @param {Actor5e} actor            Actor for which the Power die has been rolled.
     * @param {AttribDieRoll} roll       The resulting roll.
     * @param {object} updates
     * @param {object} updates.actor     Updates that will be applied to the actor.
     * @returns {boolean}                Explicitly return `false` to prevent updates from being performed.
     */
    if (Hooks.call("sw5e.rollPowerDie", this, roll, updates) === false) return roll;

    // Perform updates
    if (!foundry.utils.isEmpty(updates.actor)) await this.update(updates.actor);

    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll hit points for a specific class as part of a level-up workflow.
   * @param {Item5e} item                         The class item whose hit dice to roll.
   * @param {object} options
   * @param {boolean} [options.chatMessage=true]  Display the chat message for this roll.
   * @returns {Promise<Roll>}                     The completed roll.
   * @see {@link sw5e.preRollClassHitPoints}
   */
  async rollClassHitPoints(item, { chatMessage = true } = {}) {
    if (item.type !== "class") throw new Error("Hit points can only be rolled for a class item.");
    const rollData = {
      formula: `1${item.system.hitDice}`,
      data: item.getRollData(),
      chatMessage
    };
    const flavor = game.i18n.format("SW5E.AdvancementHitPointsRollMessage", { class: item.name });
    const messageData = {
      title: `${flavor}: ${this.name}`,
      flavor,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      "flags.sw5e.roll": { type: "hitPoints" }
    };

    /**
     * A hook event that fires before hit points are rolled for a character's class.
     * @function sw5e.preRollClassHitPoints
     * @memberof hookEvents
     * @param {Actor5e} actor            Actor for which the hit points are being rolled.
     * @param {Item5e} item              The class item whose hit dice will be rolled.
     * @param {object} rollData
     * @param {string} rollData.formula  The string formula to parse.
     * @param {object} rollData.data     The data object against which to parse attributes within the formula.
     * @param {object} messageData       The data object to use when creating the message.
     */
    Hooks.callAll("sw5e.preRollClassHitPoints", this, item, rollData, messageData);

    const roll = new Roll(rollData.formula, rollData.data);
    await roll.evaluate({ async: true });

    /**
     * A hook event that fires after hit points haven been rolled for a character's class.
     * @function sw5e.rollClassHitPoints
     * @memberof hookEvents
     * @param {Actor5e} actor  Actor for which the hit points have been rolled.
     * @param {Roll} roll      The resulting roll.
     */
    Hooks.callAll("sw5e.rollClassHitPoints", this, roll);

    if (rollData.chatMessage) await roll.toMessage(messageData);
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll hull points for a specific starship as part of a tier-up workflow.
   * @param {Item5e} item                         The starship size item whose hull dice to roll.
   * @param {number} tier                         The tier of the starship.
   * @param {object} options
   * @param {boolean} [options.chatMessage=true]  Display the chat message for this roll.
   * @returns {Promise<Roll>}                     The completed roll.
   * @see {@link sw5e.preRollStarshipHullPoints}
   */
  async rollStarshipHullPoints(item, tier, { chatMessage = true } = {}) {
    if (item.type !== "starshipsize") throw new Error("Hull points can only be rolled for a starship size item.");
    const quant =
      (tier === 0) ? (item.system?.hullDiceStart ?? 2) - 1 : ["huge", "gargantuan"].includes(item.system.identifier) ? 2 : 1;
    const rollData = {
      formula: `${quant}${item.system.hullDice}`,
      data: item.getRollData(),
      chatMessage
    };
    if (tier === 0) rollData.formula += ` + ${item.system.hullDice.substring(1)}`;
    const flavor = game.i18n.format("SW5E.AdvancementHullPointsRollMessage", { starship: item.name });
    const messageData = {
      title: `${flavor}: ${this.name}`,
      flavor,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      "flags.sw5e.roll": { type: "hitPoints" }
    };

    /**
     * A hook event that fires before hull points are rolled for a starship's tier.
     * @function sw5e.preRollStarshipHullPoints
     * @memberof hookEvents
     * @param {Actor5e} actor            Actor for which the hull points are being rolled.
     * @param {Item5e} item              The starship size item whose hull dice will be rolled.
     * @param {object} rollData
     * @param {string} rollData.formula  The string formula to parse.
     * @param {object} rollData.data     The data object against which to parse attributes within the formula.
     * @param {object} messageData       The data object to use when creating the message.
     */
    Hooks.callAll("sw5e.preRollStarshipHullPoints", this, item, rollData, messageData);

    const roll = new Roll(rollData.formula, rollData.data);
    await roll.evaluate({ async: true });

    /**
     * A hook event that fires after hull points haven been rolled for a starship's tier.
     * @function sw5e.rollStarshipHullPoints
     * @memberof hookEvents
     * @param {Actor5e} actor  Actor for which the hull points have been rolled.
     * @param {Roll} roll      The resulting roll.
     */
    Hooks.callAll("sw5e.rollStarshipHullPoints", this, roll);

    if (rollData.chatMessage) await roll.toMessage(messageData);
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll shield points for a specific starship as part of a tier-up workflow.
   * @param {Item5e} item                         The starship size item whose shield dice to roll.
   * @param {number} tier                         The tier of the starship.
   * @param {object} options
   * @param {boolean} [options.chatMessage=true]  Display the chat message for this roll.
   * @returns {Promise<Roll>}                     The completed roll.
   * @see {@link sw5e.preRollStarshipShieldPoints}
   */
  async rollStarshipShieldPoints(item, tier, { chatMessage = true } = {}) {
    if (item.type !== "starshipsize") throw new Error("Shield points can only be rolled for a starship size item.");
    const quant =
      (tier === 0) ? (item.system?.shldDiceStart ?? 2) - 1 : ["huge", "gargantuan"].includes(item.system.identifier) ? 2 : 1;
    const rollData = {
      formula: `${quant}${item.system.shldDice}`,
      data: item.getRollData(),
      chatMessage
    };
    if (tier === 0) rollData.formula += ` + ${item.system.shldDice.substring(1)}`;
    const flavor = game.i18n.format("SW5E.AdvancementShieldPointsRollMessage", { starship: item.name });
    const messageData = {
      title: `${flavor}: ${this.name}`,
      flavor,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      "flags.sw5e.roll": { type: "hitPoints" }
    };

    /**
     * A hook event that fires before shield points are rolled for a starship's tier.
     * @function sw5e.preRollStarshipShieldPoints
     * @memberof hookEvents
     * @param {Actor5e} actor            Actor for which the shield points are being rolled.
     * @param {Item5e} item              The starship size item whose shield dice will be rolled.
     * @param {object} rollData
     * @param {string} rollData.formula  The string formula to parse.
     * @param {object} rollData.data     The data object against which to parse attributes within the formula.
     * @param {object} messageData       The data object to use when creating the message.
     */
    Hooks.callAll("sw5e.preRollStarshipShieldPoints", this, item, rollData, messageData);

    const roll = new Roll(rollData.formula, rollData.data);
    await roll.evaluate({ async: true });

    /**
     * A hook event that fires after shield points haven been rolled for a starship's tier.
     * @function sw5e.rollStarshipShieldPoints
     * @memberof hookEvents
     * @param {Actor5e} actor  Actor for which the shield points have been rolled.
     * @param {Roll} roll      The resulting roll.
     */
    Hooks.callAll("sw5e.rollStarshipShieldPoints", this, roll);

    if (rollData.chatMessage) await roll.toMessage(messageData);
    return roll;
  }

  /* -------------------------------------------- */

  /**
   * Roll hit points for an NPC based on the HP formula.
   * @param {object} options
   * @param {boolean} [options.chatMessage=true]  Display the chat message for this roll.
   * @returns {Promise<Roll>}                     The completed roll.
   * @see {@link sw5e.preRollNPCHitPoints}
   */
  async rollNPCHitPoints({ chatMessage = true } = {}) {
    if (this.type !== "npc") throw new Error("NPC hit points can only be rolled for NPCs");
    const rollData = {
      formula: this.system.attributes.hp.formula,
      data: this.getRollData(),
      chatMessage
    };
    const flavor = game.i18n.format("SW5E.HPFormulaRollMessage");
    const messageData = {
      title: `${flavor}: ${this.name}`,
      flavor,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      "flags.sw5e.roll": { type: "hitPoints" }
    };

    /**
     * A hook event that fires before hit points are rolled for an NPC.
     * @function sw5e.preRollNPCHitPoints
     * @memberof hookEvents
     * @param {Actor5e} actor            Actor for which the hit points are being rolled.
     * @param {object} rollData
     * @param {string} rollData.formula  The string formula to parse.
     * @param {object} rollData.data     The data object against which to parse attributes within the formula.
     * @param {object} messageData       The data object to use when creating the message.
     */
    Hooks.callAll("sw5e.preRollNPCHitPoints", this, rollData, messageData);

    const roll = new Roll(rollData.formula, rollData.data);
    await roll.evaluate({ async: true });

    /**
     * A hook event that fires after hit points are rolled for an NPC.
     * @function sw5e.rollNPCHitPoints
     * @memberof hookEvents
     * @param {Actor5e} actor  Actor for which the hit points have been rolled.
     * @param {Roll} roll      The resulting roll.
     */
    Hooks.callAll("sw5e.rollNPCHitPoints", this, roll);

    if (rollData.chatMessage) await roll.toMessage(messageData);
    return roll;
  }

  /* -------------------------------------------- */
  /*  Resting                                     */
  /* -------------------------------------------- */

  /**
   * Configuration options for a rest.
   *
   * @typedef {object} RestConfiguration
   * @property {boolean} dialog            Present a dialog window which allows for rolling hit dice as part of the
   *                                       Short Rest and selecting whether a new day has occurred.
   * @property {boolean} chat              Should a chat message be created to summarize the results of the rest?
   * @property {boolean} newDay            Does this rest carry over to a new day?
   * @property {boolean} [autoHD]          Should hit dice be spent automatically during a short rest?
   * @property {number} [autoHDThreshold]  How many hit points should be missing before hit dice are
   *                                       automatically spent during a short rest.
   */

  /**
   * Results from a rest operation.
   *
   * @typedef {object} RestResult
   * @property {number} dhp            Hit points recovered during the rest.
   * @property {number} dhd            Hit dice recovered or spent during the rest.
   * @property {object} updateData     Updates applied to the actor.
   * @property {object[]} updateItems  Updates applied to actor's items.
   * @property {boolean} longRest      Whether the rest type was a long rest.
   * @property {boolean} newDay        Whether a new day occurred during the rest.
   * @property {Roll[]} rolls          Any rolls that occurred during the rest process, not including hit dice.
   */

  /* -------------------------------------------- */

  /**
   * Take a short rest, possibly spending hit dice and recovering resources, item uses, and tech slots & points.
   * @param {RestConfiguration} [config]  Configuration options for a short rest.
   * @returns {Promise<RestResult>}       A Promise which resolves once the short rest workflow has completed.
   */
  async shortRest(config = {}) {
    config = foundry.utils.mergeObject(
      {
        dialog: true,
        chat: true,
        newDay: false,
        autoHD: false,
        autoHDThreshold: 3
      },
      config
    );

    /**
     * A hook event that fires before a short rest is started.
     * @function sw5e.preShortRest
     * @memberof hookEvents
     * @param {Actor5e} actor             The actor that is being rested.
     * @param {RestConfiguration} config  Configuration options for the rest.
     * @returns {boolean}                 Explicitly return `false` to prevent the rest from being started.
     */
    if (Hooks.call("sw5e.preShortRest", this, config) === false) return;

    // Take note of the initial hit points and number of hit dice the Actor has
    const hd0 = this.system.attributes.hd;
    const hp0 = this.system.attributes.hp.value;

    // Display a Dialog for rolling hit dice
    if (config.dialog) {
      try {
        config.newDay = await ShortRestDialog.shortRestDialog({ actor: this, canRoll: hd0 > 0 });
      } catch(err) {
        return;
      }
    }

    // Automatically spend hit dice
    else if (config.autoHD) await this.autoSpendHitDice({ threshold: config.autoHDThreshold });

    // Return the rest result
    const dhd = this.system.attributes.hd - hd0;
    const dhp = this.system.attributes.hp.value - hp0;
    const dtp = this.system.attributes.tech.points.max - this.system.attributes.tech.points.value;
    return this._rest(config.chat, config.newDay, false, dhd, dhp, dtp);
  }

  /* -------------------------------------------- */

  /**
   * Take a long rest, recovering hit points, hit dice, resources, item uses, and tech & force power points & slots.
   * @param {RestConfiguration} [config]  Configuration options for a long rest.
   * @returns {Promise<RestResult>}          A Promise which resolves once the long rest workflow has completed.
   */
  async longRest(config = {}) {
    config = foundry.utils.mergeObject(
      {
        dialog: true,
        chat: true,
        newDay: true
      },
      config
    );

    /**
     * A hook event that fires before a long rest is started.
     * @function sw5e.preLongRest
     * @memberof hookEvents
     * @param {Actor5e} actor             The actor that is being rested.
     * @param {RestConfiguration} config  Configuration options for the rest.
     * @returns {boolean}                 Explicitly return `false` to prevent the rest from being started.
     */
    if (Hooks.call("sw5e.preLongRest", this, config) === false) return;

    if (config.dialog) {
      try {
        config.newDay = await LongRestDialog.longRestDialog({ actor: this });
      } catch(err) {
        return;
      }
    }

    const dtp = this.system.attributes.tech.points.max - this.system.attributes.tech.points.value;
    const dfp = this.system.attributes.force.points.max - this.system.attributes.force.points.value;

    return this._rest(config.chat, config.newDay, true, 0, 0, dtp, dfp);
  }

  /* -------------------------------------------- */

  /**
   * Perform all of the changes needed for a short or long rest.
   *
   * @param {boolean} chat           Summarize the results of the rest workflow as a chat message.
   * @param {boolean} newDay         Has a new day occurred during this rest?
   * @param {boolean} longRest       Is this a long rest?
   * @param {number} [dhd=0]         Number of hit dice spent during so far during the rest.
   * @param {number} [dhp=0]         Number of hit points recovered so far during the rest.
   * @param {number} [dtp=0]         Number of tech points recovered so far during the rest.
   * @param {number} [dfp=0]         Number of force points recovered so far during the rest.
   * @returns {Promise<RestResult>}  Consolidated results of the rest workflow.
   * @private
   */
  async _rest(chat, newDay, longRest, dhd = 0, dhp = 0, dtp = 0, dfp = 0) {
    // TODO: Turn gritty realism into the SW5e longer rests variant rule https://sw5e.com/rules/variantRules/Longer%20Rests
    let hitPointsRecovered = 0;
    let hitPointUpdates = {};
    let hitDiceRecovered = 0;
    let hitDiceUpdates = [];
    const rolls = [];

    // Recover hit points & hit dice on long rest
    if (longRest) {
      ({ updates: hitPointUpdates, hitPointsRecovered } = this._getRestHitPointRecovery());
      ({ updates: hitDiceUpdates, hitDiceRecovered } = this._getRestHitDiceRecovery());
    }

    // Figure out the rest of the changes
    const result = {
      dhd: dhd + hitDiceRecovered,
      dhp: dhp + hitPointsRecovered,
      dtp,
      dfp,
      updateData: {
        ...hitPointUpdates,
        ...this._getRestResourceRecovery({
          recoverShortRestResources: !longRest,
          recoverLongRestResources: longRest
        }),
        ...this._getRestPowerRecovery({ recoverForcePowers: longRest }),
        ...this._getRestSuperiorityRecovery()
      },
      updateItems: [
        ...hitDiceUpdates,
        ...(await this._getRestItemUsesRecovery({ recoverLongRestUses: longRest, recoverDailyUses: newDay, rolls }))
      ],
      longRest,
      newDay
    };
    result.rolls = rolls;

    /**
     * A hook event that fires after rest result is calculated, but before any updates are performed.
     * @function sw5e.preRestCompleted
     * @memberof hookEvents
     * @param {Actor5e} actor      The actor that is being rested.
     * @param {RestResult} result  Details on the rest to be completed.
     * @returns {boolean}          Explicitly return `false` to prevent the rest updates from being performed.
     */
    if (Hooks.call("sw5e.preRestCompleted", this, result) === false) return result;

    // Perform updates
    await this.update(result.updateData, { isRest: true });
    await this.updateEmbeddedDocuments("Item", result.updateItems, { isRest: true });

    // Display a Chat Message summarizing the rest effects
    if (chat) await this._displayRestResultMessage(result, longRest);

    /**
     * A hook event that fires when the rest process is completed for an actor.
     * @function sw5e.restCompleted
     * @memberof hookEvents
     * @param {Actor5e} actor      The actor that just completed resting.
     * @param {RestResult} result  Details on the rest completed.
     */
    Hooks.callAll("sw5e.restCompleted", this, result);

    // Return data summarizing the rest effects
    return result;
  }

  /* -------------------------------------------- */

  /**
   * Display a chat message with the result of a rest.
   *
   * @param {RestResult} result         Result of the rest operation.
   * @param {boolean} [longRest=false]  Is this a long rest?
   * @returns {Promise<ChatMessage>}    Chat message that was created.
   * @protected
   */
  async _displayRestResultMessage(result, longRest = false) {
    const { dhd, dhp, dtp, dfp, newDay } = result;
    const diceRestored = dhd !== 0;
    const healthRestored = dhp !== 0;
    const length = longRest ? "Long" : "Short";

    // Summarize the rest duration
    let restFlavor;
    switch (game.settings.get("sw5e", "restVariant")) {
      case "normal":
        restFlavor = longRest && newDay ? "SW5E.LongRestOvernight" : `SW5E.${length}RestNormal`;
        break;
      case "gritty":
        restFlavor = !longRest && newDay ? "SW5E.ShortRestOvernight" : `SW5E.${length}RestGritty`;
        break;
      case "epic":
        restFlavor = `SW5E.${length}RestEpic`;
        break;
    }

    // Determine the chat message to display
    let message;
    if (longRest) {
      message = "SW5E.LongRestResult";
      if (healthRestored) message += "HP";
      if (dfp !== 0) message += "FP";
      if (dtp !== 0) message += "TP";
      if (diceRestored) message += "HD";
    } else {
      message = "SW5E.ShortRestResultShort";
      if (diceRestored && healthRestored) {
        if (dtp !== 0) {
          message = "SW5E.ShortRestResultWithTech";
        } else {
          message = "SW5E.ShortRestResult";
        }
      } else if (dtp !== 0) {
        message = "SW5E.ShortRestResultOnlyTech";
      }
    }

    // Create a chat message
    let chatData = {
      user: game.user.id,
      speaker: { actor: this, alias: this.name },
      flavor: game.i18n.localize(restFlavor),
      rolls: result.rolls,
      content: game.i18n.format(message, {
        name: this.name,
        dice: longRest ? dhd : -dhd,
        health: dhp,
        tech: dtp,
        force: dfp
      })
    };
    ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
    return ChatMessage.create(chatData);
  }

  /* -------------------------------------------- */

  /**
   * Automatically spend hit dice to recover hit points up to a certain threshold.
   * @param {object} [options]
   * @param {number} [options.threshold=3]  A number of missing hit points which would trigger an automatic HD roll.
   * @returns {Promise<number>}             Number of hit dice spent.
   */
  async autoSpendHitDice({ threshold = 3 } = {}) {
    const hp = this.system.attributes.hp;
    const max = Math.max(0, hp.max + hp.tempmax);
    let diceRolled = 0;
    while (this.system.attributes.hp.value + threshold <= max) {
      const r = await this.rollHitDie();
      if (r === null) break;
      diceRolled += 1;
    }
    return diceRolled;
  }

  /* -------------------------------------------- */

  /**
   * Recovers actor hit points and eliminates any temp HP.
   * @param {object} [options]
   * @param {boolean} [options.recoverTemp=true]     Reset temp HP to zero.
   * @param {boolean} [options.recoverTempMax=true]  Reset temp max HP to zero.
   * @returns {object}                               Updates to the actor and change in hit points.
   * @protected
   */
  _getRestHitPointRecovery({ recoverTemp = true, recoverTempMax = true } = {}) {
    const hp = this.system.attributes.hp;
    let max = hp.max;
    let updates = {};
    if (recoverTempMax) updates["system.attributes.hp.tempmax"] = 0;
    else max = Math.max(0, max + (hp.tempmax || 0));
    updates["system.attributes.hp.value"] = max;
    if (recoverTemp) updates["system.attributes.hp.temp"] = 0;
    return { updates, hitPointsRecovered: max - hp.value };
  }

  /* -------------------------------------------- */

  /**
   * Recovers actor resources.
   * @param {object} [options]
   * @param {boolean} [options.recoverShortRestResources=true]  Recover resources that recharge on a short rest.
   * @param {boolean} [options.recoverLongRestResources=true]   Recover resources that recharge on a long rest.
   * @returns {object}                                          Updates to the actor.
   * @protected
   */
  _getRestResourceRecovery({ recoverShortRestResources = true, recoverLongRestResources = true } = {}) {
    let updates = {};
    for (let [k, r] of Object.entries(this.system.resources)) {
      if (Number.isNumeric(r.max) && ((recoverShortRestResources && r.sr) || (recoverLongRestResources && r.lr))) {
        updates[`system.resources.${k}.value`] = Number(r.max);
      }
    }
    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Recovers power points and slots.
   * @param {object} [options]
   * @param {boolean} [options.recoverTechPowers=true]    Recover all tech power points and slots.
   * @param {boolean} [options.recoverForcePowers=true]   Recover all force power points and slots.
   * @returns {object}                                  Updates to the actor.
   * @protected
   */
  _getRestPowerRecovery({ recoverTechPowers = true, recoverForcePowers = true } = {}) {
    let updates = {};

    if (recoverTechPowers) {
      updates["system.attributes.tech.points.value"] = this.system.attributes.tech.points.max;
      updates["system.attributes.tech.points.temp"] = 0;
      updates["system.attributes.tech.points.tempmax"] = 0;

      for (let [k, v] of Object.entries(this.system.powers)) {
        updates[`system.powers.${k}.tvalue`] = Number.isNumeric(v.toverride) ? v.toverride : v.tmax ?? 0;
      }
    }

    if (recoverForcePowers) {
      updates["system.attributes.force.points.value"] = this.system.attributes.force.points.max;
      updates["system.attributes.force.points.temp"] = 0;
      updates["system.attributes.force.points.tempmax"] = 0;

      for (let [k, v] of Object.entries(this.system.powers)) {
        updates[`system.powers.${k}.fvalue`] = Number.isNumeric(v.foverride) ? v.foverride : v.fmax ?? 0;
      }
    }

    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Recovers superiority dice.
   *
   * @returns {object}       Updates to the actor.
   * @protected
   */
  _getRestSuperiorityRecovery() {
    let updates = {};

    updates["system.attributes.super.dice.value"] = this.system.attributes.super.dice.max;

    return updates;
  }

  /* -------------------------------------------- */

  /**
   * Recovers class hit dice during a long rest.
   *
   * @param {object} [options]
   * @param {number} [options.maxHitDice]  Maximum number of hit dice to recover.
   * @returns {object}                     Array of item updates and number of hit dice recovered.
   * @protected
   */
  _getRestHitDiceRecovery({ maxHitDice } = {}) {
    // Determine the number of hit dice which may be recovered
    if (maxHitDice === undefined) maxHitDice = Math.max(Math.round(this.system.details.level / 2), 1);

    // Sort classes which can recover HD, assuming players prefer recovering larger HD first.
    const sortedClasses = Object.values(this.classes).sort((a, b) => {
      return (parseInt(b.system.hitDice.slice(1)) || 0) - (parseInt(a.system.hitDice.slice(1)) || 0);
    });

    // Update hit dice usage
    let updates = [];
    let hitDiceRecovered = 0;
    for (let item of sortedClasses) {
      const hitDiceUsed = item.system.hitDiceUsed;
      if (hitDiceRecovered < maxHitDice && hitDiceUsed > 0) {
        let delta = Math.min(hitDiceUsed || 0, maxHitDice - hitDiceRecovered);
        hitDiceRecovered += delta;
        updates.push({ _id: item.id, "system.hitDiceUsed": hitDiceUsed - delta });
      }
    }

    return { updates, hitDiceRecovered };
  }

  /* -------------------------------------------- */

  /**
   * Recovers item uses during short or long rests.
   *
   * @param {object} [options]
   * @param {boolean} [options.recoverShortRestUses=true]  Recover uses for items that recharge after a short rest.
   * @param {boolean} [options.recoverLongRestUses=true]   Recover uses for items that recharge after a long rest.
   * @param {boolean} [options.recoverDailyUses=true]      Recover uses for items that recharge on a new day.
   * @param {Roll[]} [options.rolls]                       Rolls that have been performed as part of this rest.
   * @returns {Promise<object[]>}                          Array of item updates.
   * @protected
   */
  async _getRestItemUsesRecovery({
    recoverShortRestUses = true,
    recoverLongRestUses = true,
    recoverDailyUses = true,
    rolls
  } = {}) {
    let recovery = [];
    if (recoverShortRestUses) recovery.push("sr");
    if (recoverLongRestUses) recovery.push("lr");
    if (recoverDailyUses) recovery.push("day");

    let updates = [];
    for (let item of this.items) {
      const uses = item.system.uses;
      if (recovery.includes(uses?.per)) {
        updates.push({ _id: item.id, "system.uses.value": uses.max });
      }
      if (recoverLongRestUses && item.system.recharge?.value) {
        updates.push({ _id: item.id, "system.recharge.charged": true });
      }

      // Items that roll to gain charges on a new day
      if (recoverDailyUses && uses?.recovery && uses?.per in CONFIG.SW5E.limitedUseFormulaPeriods) {
        const roll = new Roll(uses.recovery, item.getRollData());
        if (recoverLongRestUses && game.settings.get("sw5e", "restVariant") === "gritty") {
          roll.alter(7, 0, { multiplyNumeric: true });
        }

        let total = 0;
        try {
          total = (await roll.evaluate({ async: true })).total;
        } catch(err) {
          ui.notifications.warn(
            game.i18n.format("SW5E.ItemRecoveryFormulaWarning", {
              name: item.name,
              formula: uses.recovery
            })
          );
        }

        const newValue = Math.clamped(uses.value + total, 0, uses.max);
        if (newValue !== uses.value) {
          const diff = newValue - uses.value;
          const isMax = newValue === uses.max;
          const locKey = `SW5E.Item${diff < 0 ? "Loss" : "Recovery"}Roll${isMax ? "Max" : ""}`;
          updates.push({ _id: item.id, "system.uses.value": newValue });
          rolls.push(roll);
          await roll.toMessage({
            user: game.user.id,
            speaker: { actor: this, alias: this.name },
            flavor: game.i18n.format(locKey, { name: item.name, count: Math.abs(diff) })
          });
        }
      }
    }
    return updates;
  }

  /* -------------------------------------------- */
  /*  Repairing                                   */
  /* -------------------------------------------- */

  /**
   * Configuration options for a repair.
   *
   * @typedef {object} RepairConfiguration
   * @property {boolean} dialog              Present a dialog window which allows for rolling hull dice as part
   *                                         of the Repair and selecting whether a new day has occurred.
   * @property {boolean} chat                Should a chat message be created to summarize the results of the repair?
   * @property {boolean} [autoHD]            Should hull dice be spent automatically during a repair?
   * @property {boolean} [autoHDThreshold]   How many hull points should be missing before hull dice are
   *                                         automatically spent during a a repair.
   */

  /**
   * Results from a repair operation.
   *
   * @typedef {object} RepairResult
   * @property {number} dhp               Hull points recovered during the repair.
   * @property {number} dhd               Hull dice recovered or spent during the repair.
   * @property {object} updateData        Updates applied to the actor.
   * @property {object[]} updateItems     Updates applied to actor's items.
   * @property {boolean} RefittingRepair  Whether the rest type was a long rest.
   * @property {boolean} newDay           Whether a new day occurred during the repair.
   * @property {Roll[]} rolls             Any rolls that occurred during the rest process, not including hull/shld dice.
   */

  /**
   * Take a recharge repair, possibly spending hull dice and recovering resources, and item uses.
   * @param {RepairConfiguration} [config]  Configuration options for a recharge repair.
   * @returns {Promise<RepairResult>}       A Promise which resolves once the recharge repair workflow has completed.
   */
  async rechargeRepair(config = {}) {
    config = foundry.utils.mergeObject(
      {
        dialog: true,
        chat: true,
        autoHD: false,
        autoHDThreshold: 3,
        newDay: false
      },
      config
    );

    /**
     * A hook event that fires before a recharge repair is started.
     * @function sw5e.preRechargeRepair
     * @memberof hookEvents
     * @param {Actor5e} actor               The actor that is being repaired.
     * @param {RepairConfiguration} config  Configuration options for the repair.
     * @returns {boolean}                   Explicitly return `false` to prevent the repair from being started.
     */
    if (Hooks.call("sw5e.preRechargeRepair", this, config) === false) return;

    // Take note of the initial hull points and number of hull dice the Actor has
    const hd0 = this.system.attributes.hull.dice;
    const hp0 = this.system.attributes.hp.value;
    const regenShld = !this.system.attributes.shld.depleted;

    // Display a Dialog for rolling hull dice
    if (config.dialog) {
      try {
        config.newDay = await RechargeRepairDialog.rechargeRepairDialog({
          actor: this,
          canRoll: hd0 > 0
        });
      } catch(err) {
        return;
      }
    }

    // Automatically spend hull dice
    else if (config.autoHD) await this.autoSpendHullDice({ threshold: config.autoHDThreshold });

    // Return the rest result
    const dhd = this.system.attributes.hull.dice - hd0;
    const dhp = this.system.attributes.hp.value - hp0;

    return this._repair(config.chat, config.newDay, false, regenShld, dhd, dhp);
  }

  /* -------------------------------------------- */

  /**
   * Take a refitting repair, recovering hull points, hull dice, resources, and item uses.
   *
   * @param {RepairConfiguration} [config]  Configuration options for a refitting repair.
   * @returns {Promise<RepairResult>}       A Promise which resolves once the refitting repair workflow has completed.
   */
  async refittingRepair(config = {}) {
    config = foundry.utils.mergeObject(
      {
        dialog: true,
        chat: true,
        newDay: true
      },
      config
    );

    /**
     * A hook event that fires before a refitting repair is started.
     * @function sw5e.preRefittingRepair
     * @memberof hookEvents
     * @param {Actor5e} actor               The actor that is being repaired.
     * @param {RepairConfiguration} config  Configuration options for the repair.
     * @returns {boolean}                   Explicitly return `false` to prevent the repair from being started.
     */
    if (Hooks.call("sw5e.preRefittingRepair", this, config) === false) return;

    if (config.dialog) {
      try {
        config.newDay = await RefittingRepairDialog.refittingRepairDialog({ actor: this });
      } catch(err) {
        return;
      }
    }

    return this._repair(config.chat, config.newDay, true, true, 0, 0);
  }

  /* -------------------------------------------- */

  /**
   * Take a regen repair, recovering shield points, and power dice.
   *
   * @param {object} [options]
   * @param {boolean} [options.dialog=true]        Present a confirmation dialog window whether or not to regen.
   * @param {boolean} [options.chat=true]          Summarize the results of the regen workflow as a chat message.
   * @param {boolean} [options.useShieldDie=true]  Whether to expend a shield die for automatic regen.
   * @returns {Promise<RepairResult>}              A Promise which resolves once the regen workflow has completed.
   */
  async regenRepair({ dialog = true, chat = true, useShieldDie = true } = {}) {
    if (dialog) {
      try {
        useShieldDie = await RegenRepairDialog.regenRepairDialog({ actor: this });
      } catch(err) {
        return;
      }
    }

    // Prepare shield point recovery
    let shldRecovery = null;
    if (useShieldDie) shldRecovery = await this.rollShieldDie({ natural: true, update: false });

    // Prepare power die recovery
    const pdRecovery = await this.rollPowerDieRecovery({ update: false });

    // Consolidate the changes
    const result = {
      sp: shldRecovery?.sp ?? 0,
      pd: pdRecovery.pd,

      actorUpdates: {
        ...(shldRecovery?.actorUpdates ?? {}),
        ...pdRecovery.actorUpdates
      },
      itemUpdates: [...(shldRecovery?.itemUpdates ?? []), ...pdRecovery.itemUpdates]
    };

    if (foundry.utils.isEmpty(result.actorUpdates) && !result.itemUpdates.length) return result;

    // Perform updates
    await this.update(result.actorUpdates);
    await this.updateEmbeddedDocuments("Item", result.itemUpdates);

    // Display a Chat Message summarizing the repair effects
    if (chat) await this._displayRegenResultMessage(result);

    return result;
  }

  /* -------------------------------------------- */

  /**
   * Perform all of the changes needed for a recharge or refitting repair.
   *
   * @param {boolean} chat             Summarize the results of the repair workflow as a chat message.
   * @param {boolean} newDay           Has a new day occurred during this repair?
   * @param {boolean} refittingRepair  Is this a refitting repair?
   * @param {boolean} resetShields     reset shields to max during the repair.
   * @param {number} [dhd=0]           Number of hull dice spent during so far during the repair.
   * @param {number} [dhp=0]           Number of hull points recovered so far during the repair.
   * @returns {Promise<RepairResult>}  Consolidated results of the repair workflow.
   * @private
   */
  async _repair(chat, newDay, refittingRepair, resetShields, dhd = 0, dhp = 0) {
    // TODO: Turn gritty realism into the SW5e longer repairs variant rule https://sw5e.com/rules/variantRules/Longer%20Repairs
    let powerDiceUpdates = {};
    let hullPointsRecovered = 0;
    let hullPointUpdates = {};
    let hullDiceRecovered = 0;
    let hullDiceUpdates = [];
    let shldPointsRecovered = 0;
    let shldPointUpdates = {};
    let shldDiceRecovered = 0;
    let shldDiceUpdates = [];
    const rolls = [];

    // Recover power dice on any repair
    ({ updates: powerDiceUpdates } = this._getRepairPowerDiceRecovery());

    // Recover hit points & hit dice on refitting repair
    if (refittingRepair) {
      ({ updates: hullPointUpdates, hullPointsRecovered } = this._getRepairHullPointRecovery());
      ({ updates: hullDiceUpdates, hullDiceRecovered } = this._getRepairHullDiceRecovery());
      resetShields = true;
    }

    if (resetShields) {
      ({ updates: shldPointUpdates, shldPointsRecovered } = this._getRepairShieldPointRecovery());
      ({ updates: shldDiceUpdates, shldDiceRecovered } = this._getRepairShieldDiceRecovery());
    }

    // Figure out the repair of the changes
    const result = {
      dhd: dhd + hullDiceRecovered,
      dhp: dhp + hullPointsRecovered,
      shd: shldDiceRecovered,
      shp: shldPointsRecovered,
      updateData: {
        ...powerDiceUpdates,
        ...hullPointUpdates,
        ...shldPointUpdates
      },
      updateItems: [
        ...hullDiceUpdates,
        ...shldDiceUpdates,
        ...(await this._getRepairItemUsesRecovery({
          recoverRefittingRepairUses: refittingRepair,
          recoverDailyUses: newDay,
          rolls
        }))
      ],
      newDay
    };
    result.rolls = rolls;

    /**
     * A hook event that fires after repair result is calculated, but before any updates are performed.
     * @function sw5e.preRepairCompleted
     * @memberof hookEvents
     * @param {Actor5e} actor      The actor that is being repaired.
     * @param {RepairResult} result  Details on the repair to be completed.
     * @returns {boolean}          Explicitly return `false` to prevent the repair updates from being performed.
     */
    if (Hooks.call("sw5e.preRepairCompleted", this, result) === false) return result;

    // Perform updates
    await this.update(result.updateData, { isRest: true });
    await this.updateEmbeddedDocuments("Item", result.updateItems, { isRest: true });

    // Display a Chat Message summarizing the repair effects
    if (chat) await this._displayRepairResultMessage(result, refittingRepair);

    /**
     * A hook event that fires when the repair process is completed for an actor.
     * @function sw5e.repairCompleted
     * @memberof hookEvents
     * @param {Actor5e} actor        The actor that just completed repairing.
     * @param {RepairResult} result  Details on the repair completed.
     */
    Hooks.callAll("sw5e.repairCompleted", this, result);

    // Return data summarizing the repair effects
    return result;
  }

  /* -------------------------------------------- */

  /**
   * Display a chat message with the result of a repair.
   *
   * @param {RepairResult} result              Result of the repair operation.
   * @param {boolean} [refittingRepair=false]  Is this a refitting repair?
   * @returns {Promise<ChatMessage>}           Chat message that was created.
   * @protected
   */
  async _displayRepairResultMessage(result, refittingRepair) {
    const { dhd, dhp, shd, shp, newDay } = result;
    const hullDiceRestored = dhd !== 0;
    const hullPointsRestored = dhp !== 0;
    const shldDiceRestored = shd !== 0;
    const shldPointsRestored = shp !== 0;
    const length = refittingRepair ? "Refitting" : "Recharge";

    let repairFlavor;
    let message;

    // Summarize the repair duration
    repairFlavor = refittingRepair && newDay ? "SW5E.RefittingRepairOvernight" : `SW5E.${length}RepairNormal`;

    // If we have a variant timing use the following instead
    /*
        /* switch (game.settings.get("sw5e", "repairVariant")) {
        /*     case "normal":
        /*         repairFlavor =
        /*             refittingRepair && newDay ? "SW5E.RefittingRepairOvernight" : `SW5E.${length}RepairNormal`;
        /*         break;
        /*     case "gritty":
        /*         repairFlavor =
        /*             !refittingRepair && newDay ? "SW5E.RechargeRepairOvernight" : `SW5E.${length}RepairGritty`;
        /*         break;
        /*     case "epic":
        /*         repairFlavor = `SW5E.${length}RepairEpic`;
        /*         break;
        /* }
        */

    // Determine the chat message to display
    if (refittingRepair) {
      message = "SW5E.RefittingRepairResult";
      if (hullPointsRestored) message += "HP";
      if (hullDiceRestored) message += "HD";
      if (shldDiceRestored || shldPointsRestored) message += "S";
    } else {
      message = "SW5E.RechargeRepairResult";
      if (hullPointsRestored) message += "HP";
      if (hullDiceRestored) message += "HD";
      if (shldDiceRestored || shldPointsRestored) message += "S";
    }

    // Create a chat message
    let chatData = {
      user: game.user.id,
      speaker: { actor: this, alias: this.name },
      flavor: game.i18n.localize(repairFlavor),
      content: game.i18n.format(message, {
        name: this.name,
        hullDice: refittingRepair ? dhd : -dhd,
        hullPoints: dhp,
        shldDice: shd,
        shldPoints: shp
      })
    };
    ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
    return ChatMessage.create(chatData);
  }

  /* -------------------------------------------- */

  /**
   * Display a chat message with the result of a regen.
   *
   * @param {RepairResult} result              Result of the regen operation.
   * @returns {Promise<ChatMessage>}           Chat message that was created.
   * @protected
   */
  async _displayRegenResultMessage(result) {
    const { sp, pd } = result;
    const shldPointsRestored = sp !== 0;
    const powerDiceRestored = pd !== 0;

    let message = "SW5E.RegenRepairResult";

    if (shldPointsRestored) message += "S";
    if (powerDiceRestored) message += "P";

    // Create a chat message
    let chatData = {
      user: game.user.id,
      speaker: { actor: this, alias: this.name },
      content: game.i18n.format(message, {
        name: this.name,
        shieldPoints: sp,
        powerDice: pd
      })
    };
    ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
    return ChatMessage.create(chatData);
  }

  /* -------------------------------------------- */

  /**
   * Automatically spend hull dice to recover hull points up to a certain threshold.
   *
   * @param {object} [options]
   * @param {number} [options.threshold=3]  A number of missing hull points which would trigger an automatic HD roll.
   * @returns {Promise<number>}             Number of hull dice spent.
   */
  async autoSpendHullDice({ threshold = 3 } = {}) {
    const hp = this.system.attributes.hp;
    const max = MAth.max(0, hp.max);
    let diceRolled = 0;
    while (this.system.attributes.hp.value + threshold <= max) {
      const r = await this.rollHullDie(undefined, { dialog: false });
      if (r === null) break;
      diceRolled += 1;
    }
    return diceRolled;
  }

  /* -------------------------------------------- */

  /**
   * Recovers actor hull points.
   *
   * @returns {object}           Updates to the actor and change in hull points.
   * @protected
   */
  _getRepairHullPointRecovery() {
    const hp = this.system.attributes.hp;
    let max = Math.max(0, hp.max);
    let updates = {};

    updates["system.attributes.hp.value"] = max;

    return { updates, hullPointsRecovered: max - hp.value };
  }

  /* -------------------------------------------- */

  /**
   * Recovers actor shield points and repair depleted shields.
   *
   * @returns {object}           Updates to the actor and change in shield points.
   * @protected
   */
  _getRepairShieldPointRecovery() {
    const hp = this.system.attributes.hp;
    let max = Math.max(0, hp.tempmax);
    let updates = {};

    updates["system.attributes.hp.temp"] = max;
    updates["system.attributes.shld.depleted"] = false;

    return { updates, shldPointsRecovered: max - hp.temp };
  }

  /* -------------------------------------------- */

  /**
   * Recovers actor power dice.
   *
   * @returns {object}  Updates to the actor.
   * @protected
   */
  _getRepairPowerDiceRecovery() {
    const power = this.system.attributes.power;
    const updates = {};

    for (const slot of Object.keys(CONFIG.SW5E.powerDieSlots)) updates[`system.attributes.power.${slot}.value`] = power[slot].max;

    return { updates };
  }

  /* -------------------------------------------- */

  /**
   * Recovers hull during a refitting repair.
   *
   * @param {object} [options]
   * @param {number} [options.maxHullDice]    Maximum number of hull dice to recover.
   * @returns {object}                         Array of item updates and number of hit dice recovered.
   * @protected
   */
  _getRepairHullDiceRecovery({ maxHullDice = undefined } = {}) {
    // Determine the number of hull dice which may be recovered
    if (maxHullDice === undefined) maxHullDice = this.system.attributes.hull.dicemax;

    // Sort starship sizes which can recover HD, assuming players prefer recovering larger HD first.
    const sortedStarships = Object.values(this.starships).sort((a, b) => {
      return (parseInt(b.system.hullDice.slice(1)) || 0) - (parseInt(a.system.hullDice.slice(1)) || 0);
    });

    // Update hull dice usage
    let updates = [];
    let hullDiceRecovered = 0;
    for (let item of sortedStarships) {
      const hullDiceUsed = item.system.hullDiceUsed;
      if (hullDiceRecovered < maxHullDice && hullDiceUsed > 0) {
        let delta = Math.min(hullDiceUsed || 0, maxHullDice - hullDiceRecovered);
        hullDiceRecovered += delta;
        updates.push({
          _id: item.id,
          "system.hullDiceUsed": hullDiceUsed - delta
        });
      }
    }

    return { updates, hullDiceRecovered };
  }

  /* -------------------------------------------- */

  /**
   * Recovers shields during a repair.
   *
   * @returns {object}           Array of item updates and number of shield dice recovered.
   * @protected
   */
  _getRepairShieldDiceRecovery() {
    // Determine the number of shield dice which may be recovered
    const maxShldDice = this.system.attributes.shld.dicemax;

    // Sort starship sizes which can recover SD, assuming players prefer recovering larger SD first.
    const sortedStarships = Object.values(this.starships).sort((a, b) => {
      return (parseInt(b.system.shldDice.slice(1)) || 0) - (parseInt(a.system.shldDice.slice(1)) || 0);
    });

    // Update shield dice usage
    let updates = [];
    let shldDiceRecovered = 0;
    for (let item of sortedStarships) {
      const shldDiceUsed = item.system.shldDiceUsed;
      if (shldDiceRecovered < maxShldDice && shldDiceUsed > 0) {
        let delta = Math.min(shldDiceUsed || 0, maxShldDice - shldDiceRecovered);
        shldDiceRecovered += delta;
        updates.push({
          _id: item.id,
          "system.shldDiceUsed": shldDiceUsed - delta
        });
      }
    }

    return { updates, shldDiceRecovered };
  }

  /* -------------------------------------------- */

  /**
   * Recovers item uses during recharge or refitting repairs.
   *
   * @param {object} [options]
   * @param {boolean} [options.recoverRechargeRepairUses=true]   Recover item uses that recharge after ship recharge.
   * @param {boolean} [options.recoverRefittingRepairUses=true]  Recover item uses that recharge after ship refit.
   * @param {boolean} [options.recoverDailyUses=true]            Recover item uses that recharge on a new day.
   * @param {Roll[]} [options.rolls]                             Rolls that have been performed as part of this rest.
   * @returns {Promise<object[]}                                Array of item updates.
   * @protected
   */
  async _getRepairItemUsesRecovery({
    recoverRechargeRepairUses = true,
    recoverRefittingRepairUses = true,
    recoverDailyUses = true,
    rolls
  } = {}) {
    let recovery = [];
    if (recoverRechargeRepairUses) recovery.push("recharge");
    if (recoverRefittingRepairUses) recovery.push("refitting");
    if (recoverDailyUses) recovery.push("day");

    let updates = [];
    for (let item of this.items) {
      const uses = item.system.uses;
      if (recovery.includes(uses?.per)) {
        updates.push({ _id: item.id, "system.uses.value": uses.max });
      }
      if (recoverRefittingRepairUses && item.system.recharge?.value) {
        updates.push({ _id: item.id, "system.recharge.charged": true });
      }

      // Items that roll to gain charges on a new day
      if (recoverDailyUses && uses?.recovery && uses?.per in CONFIG.SW5E.limitedUseFormulaPeriods) {
        const roll = new Roll(uses.recovery, this.getRollData());

        let total = 0;
        try {
          total = (await roll.evaluate({ async: true })).total;
        } catch(err) {
          ui.notifications.warn(
            game.i18n.format("SW5E.ItemRecoveryFormulaWarning", {
              name: item.name,
              formula: uses.recovery
            })
          );
        }

        const newValue = Math.clamped(uses.value + total, 0, uses.max);
        if (newValue !== uses.value) {
          const diff = newValue - uses.value;
          const isMax = newValue === uses.max;
          const locKey = `SW5E.Item${diff < 0 ? "Loss" : "Recovery"}Roll${isMax ? "Max" : ""}`;
          updates.push({ _id: item.id, "system.uses.value": newValue });
          rolls.push(roll);
          await roll.toMessage({
            user: game.user.id,
            speaker: { actor: this, alias: this.name },
            flavor: game.i18n.format(locKey, { name: item.name, count: Math.abs(diff) })
          });
        }
      }
    }

    return updates;
  }

  /* -------------------------------------------- */
  /*  Property Attribution                        */
  /* -------------------------------------------- */

  /**
   * Format an HTML breakdown for a given property.
   * @param {string} attribution      The property.
   * @param {object} [options]
   * @param {string} [options.title]  A title for the breakdown.
   * @returns {Promise<string>}
   */
  async getAttributionData(attribution, { title }={}) {
    switch ( attribution ) {
      case "attributes.ac": return this._prepareArmorClassAttribution({ title });
      case "attributes.movement": return this._prepareMovementAttribution();
      default: return "";
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare a movement breakdown.
   * @returns {string}
   * @protected
   */
  _prepareMovementAttribution() {
    const { movement } = this.system.attributes;
    const units = movement.units || Object.keys(CONFIG.SW5E.movementUnits)[0];
    return Object.entries(CONFIG.SW5E.movementTypes).reduce((html, [k, label]) => {
      const value = movement[k];
      if ( value ) html += `
        <div class="row">
          <i class="fas ${k}"></i>
          <span class="value">${value} <span class="units">${units}</span></span>
          <span class="label">${label}</span>
        </div>
      `;
      return html;
    }, "");
  }

  /* -------------------------------------------- */

  /**
   * Prepare an AC breakdown.
   * @param {object} [options]
   * @param {string} [options.title]  A title for the breakdown.
   * @returns {Promise<string>}
   * @protected
   */
  async _prepareArmorClassAttribution({ title }={}) {
    const rollData = this.getRollData({ deterministic: true });
    const ac = rollData.attributes.ac;
    const cfg = CONFIG.SW5E.armorClasses[ac.calc];
    const attribution = [];

    if ( ac.calc === "flat" ) {
      attribution.push({
        label: game.i18n.localize("SW5E.ArmorClassFlat"),
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: ac.flat
      });
      return new PropertyAttribution(this, attribution, "attributes.ac", { title }).renderTooltip();
    }

    // Base AC Attribution
    switch ( ac.calc ) {

      // Natural armor
      case "natural":
        attribution.push({
          label: game.i18n.localize("SW5E.ArmorClassNatural"),
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: ac.flat
        });
        break;

      default:
        const formula = ac.calc === "custom" ? ac.formula : cfg.formula;
        let base = ac.base;
        const dataRgx = new RegExp(/@([a-z.0-9_-]+)/gi);
        for ( const [match, term] of formula.matchAll(dataRgx) ) {
          const value = String(foundry.utils.getProperty(rollData, term));
          if ( (term === "attributes.ac.armor") || (value === "0") ) continue;
          if ( Number.isNumeric(value) ) base -= Number(value);
          attribution.push({
            label: match,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value
          });
        }
        const armorInFormula = formula.includes("@attributes.ac.armor");
        let label = game.i18n.localize("SW5E.PropertyBase");
        if ( armorInFormula ) label = this.armor?.name ?? game.i18n.localize("SW5E.ArmorClassUnarmored");
        attribution.unshift({
          label,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: base
        });
        break;
    }

    // Shield
    if ( ac.shield !== 0 ) attribution.push({
      label: this.shield?.name ?? game.i18n.localize("SW5E.EquipmentShield"),
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: ac.shield
    });

    // Bonus
    if ( ac.bonus !== 0 ) attribution.push(...this._prepareActiveEffectAttributions("system.attributes.ac.bonus"));

    // Cover
    if ( ac.cover !== 0 ) attribution.push({
      label: game.i18n.localize("SW5E.Cover"),
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: ac.cover
    });

    if ( attribution.length ) {
      return new PropertyAttribution(this, attribution, "attributes.ac", { title }).renderTooltip();
    }

    return "";
  }

  /* -------------------------------------------- */

  /**
   * Break down all of the Active Effects affecting a given target property.
   * @param {string} target               The data property being targeted.
   * @returns {AttributionDescription[]}  Any active effects that modify that property.
   * @protected
   */
  _prepareActiveEffectAttributions(target) {
    const rollData = this.getRollData({ deterministic: true });
    const attributions = [];
    for ( const e of this.allApplicableEffects() ) {
      let source = e.sourceName;
      if ( e.origin === this.uuid ) source = e.name;
      if ( !source || e.disabled || e.isSuppressed ) continue;
      const {value, mode} = [...e.changes].reduce((obj, change, _, arr) => {
        if ( change.key !== target ) return obj;
        switch ( change.mode ) {
          case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
          case CONST.ACTIVE_EFFECT_MODES.CUSTOM:
            arr.splice(1); // Stop reduce after this iteration
            obj.value = simplifyBonus(change.value, rollData);
            obj.mode = change.mode;
            break;
          case CONST.ACTIVE_EFFECT_MODES.ADD:
            obj.value += simplifyBonus(change.value, rollData);
            break;
        }
        return obj;
      }, {
        value: 0,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      });
      if ( value ) attributions.push({ value, label: source, mode });
    }
    return attributions;
  }

  /* -------------------------------------------- */
  /*  Conversion & Transformation                 */
  /* -------------------------------------------- */

  /**
   * Options that determine what properties of the original actor are kept and which are replaced with
   * the target actor.
   *
   * @typedef {object} TransformationOptions
   * @property {boolean} [keepPhysical=false]       Keep physical abilities (str, dex, con)
   * @property {boolean} [keepMental=false]         Keep mental abilities (int, wis, cha)
   * @property {boolean} [keepSaves=false]          Keep saving throw proficiencies
   * @property {boolean} [keepSkills=false]         Keep skill proficiencies
   * @property {boolean} [mergeSaves=false]         Take the maximum of the save proficiencies
   * @property {boolean} [mergeSkills=false]        Take the maximum of the skill proficiencies
   * @property {boolean} [keepClass=false]          Keep proficiency bonus
   * @property {boolean} [keepFeats=false]          Keep features
   * @property {boolean} [keepPowers=false]         Keep powers and powercasting ability
   * @property {boolean} [keepItems=false]          Keep items
   * @property {boolean} [keepBio=false]            Keep biography
   * @property {boolean} [keepVision=false]         Keep vision
   * @property {boolean} [keepSelf=false]           Keep self
   * @property {boolean} [keepAE=false]             Keep all effects
   * @property {boolean} [keepOriginAE=true]        Keep effects which originate on this actor
   * @property {boolean} [keepOtherOriginAE=true]   Keep effects which originate on another actor
   * @property {boolean} [keepPowerAE=true]         Keep effects which originate from actors powers
   * @property {boolean} [keepFeatAE=true]          Keep effects which originate from actors features
   * @property {boolean} [keepEquipmentAE=true]     Keep effects which originate on actors equipment
   * @property {boolean} [keepClassAE=true]         Keep effects which originate from actors class/archetype
   * @property {boolean} [keepBackgroundAE=true]    Keep effects which originate from actors background
   * @property {boolean} [transformTokens=true]     Transform linked tokens too
   */

  /**
   * Transform this Actor into another one.
   *
   * @param {Actor5e} target                      The target Actor.
   * @param {TransformationOptions} [options={}]  Options that determine how the transformation is performed.
   * @param {boolean} [options.renderSheet=true]  Render the sheet of the transformed actor after the polymorph
   * @returns {Promise<Array<Token>>|null}        Updated token if the transformation was performed.
   */
  async transformInto(
    target,
    {
      keepPhysical = false,
      keepMental = false,
      keepSaves = false,
      keepSkills = false,
      mergeSaves = false,
      mergeSkills = false,
      keepClass = false,
      keepFeats = false,
      keepPowers = false,
      keepItems = false,
      keepBio = false,
      keepVision = false,
      keepSelf = false,
      keepAE = false,
      keepOriginAE = true,
      keepOtherOriginAE = true,
      keepPowerAE = true,
      keepEquipmentAE = true,
      keepFeatAE = true,
      keepClassAE = true,
      keepBackgroundAE = true,
      transformTokens = true
    } = {},
    { renderSheet = true } = {}
  ) {
    // Ensure the player is allowed to polymorph
    const allowed = game.settings.get("sw5e", "allowPolymorphing");
    if (!allowed && !game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("SW5E.PolymorphWarn"));
      return null;
    }

    // Get the original Actor data and the new source data
    const o = this.toObject();
    o.flags.sw5e = o.flags.sw5e || {};
    o.flags.sw5e.transformOptions = { mergeSkills, mergeSaves };
    const source = target.toObject();

    if (keepSelf) {
      o.img = source.img;
      o.name = `${o.name} (${game.i18n.localize("SW5E.PolymorphSelf")})`;
    }

    // Prepare new data to merge from the source
    const d = foundry.utils.mergeObject(
      foundry.utils.deepClone({
        type: o.type, // Remain the same actor type
        name: `${o.name} (${source.name})`, // Append the new shape to your old name
        system: source.system, // Get the systemdata model of your new form
        items: source.items, // Get the items of your new form
        effects: o.effects.concat(source.effects), // Combine active effects from both forms
        img: source.img, // New appearance
        ownership: o.ownership, // Use the original actor permissions
        folder: o.folder, // Be displayed in the same sidebar folder
        flags: o.flags, // Use the original actor flags
        prototypeToken: { name: `${o.name} (${source.name})`, texture: {}, sight: {}, detectionModes: [] } // Set a new empty token
      }),
      keepSelf ? o : {}
    ); // Keeps most of original actor

    // Specifically delete some data attributes
    delete d.system.resources; // Don't change your resource pools
    delete d.system.currency; // Don't lose currency
    delete d.system.bonuses; // Don't lose global bonuses
    if ( keepPowers ) delete d.system.attributes.powercasting; // Keep powercasting ability if retaining powers.

    // Specific additional adjustments
    d.system.details.alignment = o.system.details.alignment; // Don't change alignment
    d.system.attributes.exhaustion = o.system.attributes.exhaustion; // Keep your prior exhaustion level
    d.system.attributes.inspiration = o.system.attributes.inspiration; // Keep inspiration
    d.system.powers = o.system.powers; // Keep power slots
    d.system.attributes.ac.flat = target.system.attributes.ac.value; // Override AC

    // Token appearance updates
    for (const k of ["width", "height", "alpha", "lockRotation"]) {
      d.prototypeToken[k] = source.prototypeToken[k];
    }
    for (const k of ["offsetX", "offsetY", "scaleX", "scaleY", "src", "tint"]) {
      d.prototypeToken.texture[k] = source.prototypeToken.texture[k];
    }
    for (const k of ["bar1", "bar2", "displayBars", "displayName", "disposition", "rotation", "elevation"]) {
      d.prototypeToken[k] = o.prototypeToken[k];
    }

    if (!keepSelf) {
      const sightSource = keepVision ? o.prototypeToken : source.prototypeToken;
      for (const k of [
        "range",
        "angle",
        "visionMode",
        "color",
        "attenuation",
        "brightness",
        "saturation",
        "contrast",
        "enabled"
      ]) {
        d.prototypeToken.sight[k] = sightSource.sight[k];
      }
      d.prototypeToken.detectionModes = sightSource.detectionModes;

      // Transfer ability scores
      const abilities = d.system.abilities;
      for (let k of Object.keys(abilities)) {
        const oa = o.system.abilities[k];
        const prof = abilities[k].proficient;
        const type = CONFIG.SW5E.abilities[k]?.type;
        if (keepPhysical && type === "physical") abilities[k] = oa;
        else if (keepMental && type === "mental") abilities[k] = oa;

        // Set saving throw proficiencies.
        if (keepSaves && oa) abilities[k].proficient = oa.proficient;
        else if (mergeSaves && oa) abilities[k].proficient = Math.max(prof, oa.proficient);
        else abilities[k].proficient = source.system.abilities[k].proficient;
      }

      // Transfer skills
      if (keepSkills) d.system.skills = o.system.skills;
      else if (mergeSkills) {
        for (let [k, s] of Object.entries(d.system.skills)) {
          s.value = Math.max(s.value, o.system.skills[k]?.value ?? 0);
        }
      }

      // Keep specific items from the original data
      d.items = d.items.concat(
        o.items.filter(i => {
          if (["class", "archetype", "deployment"].includes(i.type)) return keepClass;
          else if (i.type === "feat") return keepFeats;
          else if (["power", "maneuver"].includes(i.type)) return keepPowers;
          else return keepItems;
        })
      );

      // Transfer classes for NPCs
      if (!keepClass && d.system.details.cr) {
        const cls = new sw5e.dataModels.item.ClassData({ levels: d.system.details.cr });
        d.items.push({
          type: "class",
          name: game.i18n.localize("SW5E.PolymorphTmpClass"),
          system: cls.toObject()
        });
      }

      // Keep biography
      if (keepBio) d.system.details.biography = o.system.details.biography;

      // Keep senses
      if (keepVision) d.system.traits.senses = o.system.traits.senses;

      // Remove active effects
      const oEffects = foundry.utils.deepClone(d.effects);
      const originEffectIds = new Set(
        oEffects
          .filter(effect => {
            return !effect.origin || effect.origin === this.uuid;
          })
          .map(e => e._id)
      );
      d.effects = d.effects.filter(e => {
        if (keepAE) return true;
        const origin = e.origin?.startsWith("Actor") || e.origin?.startsWith("Item") ? fromUuidSync(e.origin) : {};
        const originIsSelf = origin?.parent?.uuid === this.uuid;
        const isOriginEffect = originEffectIds.has(e._id);
        if (isOriginEffect) return keepOriginAE;
        if (!isOriginEffect && !originIsSelf) return keepOtherOriginAE;
        if (["power", "maneuver"].includes(origin.type)) return keepPowerAE;
        if (origin.type === "feat") return keepFeatAE;
        if (origin.type === "background") return keepBackgroundAE;
        if (["archetype", "class"].includes(origin.type)) return keepClassAE;
        if (["equipment", "weapon", "tool", "loot", "container"].includes(origin.type)) return keepEquipmentAE;
        return true;
      });
    }

    // Set a random image if source is configured that way
    if (source.prototypeToken.randomImg) {
      const images = await target.getTokenImages();
      d.prototypeToken.texture.src = images[Math.floor(Math.random() * images.length)];
    }

    // Set new data flags
    if (!this.isPolymorphed || !d.flags.sw5e.originalActor) d.flags.sw5e.originalActor = this.id;
    d.flags.sw5e.isPolymorphed = true;

    // Gather previous actor data
    const previousActorIds = this.getFlag("sw5e", "previousActorIds") || [];
    previousActorIds.push(this._id);
    foundry.utils.setProperty(d.flags, "sw5e.previousActorIds", previousActorIds);

    // Update unlinked Tokens, and grab a copy of any actorData adjustments to re-apply
    if (this.isToken) {
      const tokenData = d.prototypeToken;
      delete d.prototypeToken;
      tokenData.delta = d;
      const previousActorData = this.token.delta.toObject();
      foundry.utils.setProperty(tokenData, "flags.sw5e.previousActorData", previousActorData);
      await this.sheet?.close();
      const update = await this.token.update(tokenData);
      if (renderSheet) this.sheet?.render(true);
      return update;
    }

    // Close sheet for non-transformed Actor
    await this.sheet?.close();

    /**
     * A hook event that fires just before the actor is transformed.
     * @function sw5e.transformActor
     * @memberof hookEvents
     * @param {Actor5e} actor                  The original actor before transformation.
     * @param {Actor5e} target                 The target actor into which to transform.
     * @param {object} data                    The data that will be used to create the new transformed actor.
     * @param {TransformationOptions} options  Options that determine how the transformation is performed.
     * @param {object} [options]
     */
    Hooks.callAll(
      "sw5e.transformActor",
      this,
      target,
      d,
      {
        keepPhysical,
        keepMental,
        keepSaves,
        keepSkills,
        mergeSaves,
        mergeSkills,
        keepClass,
        keepFeats,
        keepPowers,
        keepItems,
        keepBio,
        keepVision,
        keepSelf,
        keepAE,
        keepOriginAE,
        keepOtherOriginAE,
        keepPowerAE,
        keepEquipmentAE,
        keepFeatAE,
        keepClassAE,
        keepBackgroundAE,
        transformTokens
      },
      { renderSheet }
    );

    // Create new Actor with transformed data
    const newActor = await this.constructor.create(d, { renderSheet });

    // Update placed Token instances
    if (!transformTokens) return;
    const tokens = this.getActiveTokens(true);
    const updates = tokens.map(t => {
      const newTokenData = foundry.utils.deepClone(d.prototypeToken);
      newTokenData._id = t.id;
      newTokenData.actorId = newActor.id;
      newTokenData.actorLink = true;

      const dOriginalActor = foundry.utils.getProperty(d, "flags.sw5e.originalActor");
      foundry.utils.setProperty(newTokenData, "flags.sw5e.originalActor", dOriginalActor);
      foundry.utils.setProperty(newTokenData, "flags.sw5e.isPolymorphed", true);
      return newTokenData;
    });
    return canvas.scene?.updateEmbeddedDocuments("Token", updates);
  }

  /* -------------------------------------------- */

  /**
   * If this actor was transformed with transformTokens enabled, then its
   * active tokens need to be returned to their original state. If not, then
   * we can safely just delete this actor.
   * @param {object} [options]
   * @param {boolean} [options.renderSheet=true]  Render Sheet after revert the transformation.
   * @returns {Promise<Actor>|null}  Original actor if it was reverted.
   */
  async revertOriginalForm({ renderSheet = true } = {}) {
    if (!this.isPolymorphed) return;
    if ( !this.isOwner ) {
      ui.notifications.warn("SW5E.PolymorphRevertWarn", {localize: true});
      return null;
    }

    /**
     * A hook event that fires just before the actor is reverted to original form.
     * @function sw5e.revertOriginalForm
     * @memberof hookEvents
     * @param {Actor} this                 The original actor before transformation.
     * @param {object} [options]
     */
    Hooks.callAll("sw5e.revertOriginalForm", this, { renderSheet });
    const previousActorIds = this.getFlag("sw5e", "previousActorIds") ?? [];
    const isOriginalActor = !previousActorIds.length;
    const isRendered = this.sheet.rendered;

    // Obtain a reference to the original actor
    const original = game.actors.get(this.getFlag("sw5e", "originalActor"));

    // If we are reverting an unlinked token, grab the previous actorData, and create a new token
    if (this.isToken) {
      const baseActor = original ? original : game.actors.get(this.token.actorId);
      if (!baseActor) {
        ui.notifications.warn(
          game.i18n.format("SW5E.PolymorphRevertNoOriginalActorWarn", {
            reference: this.getFlag("sw5e", "originalActor")
          })
        );
        return;
      }
      const prototypeTokenData = await baseActor.getTokenDocument();
      const actorData = this.token.getFlag("sw5e", "previousActorData");
      const tokenUpdate = this.token.toObject();
      actorData._id = tokenUpdate.delta._id;
      tokenUpdate.delta = actorData;

      for (const k of ["width", "height", "alpha", "lockRotation", "name"]) {
        tokenUpdate[k] = prototypeTokenData[k];
      }
      for (const k of ["offsetX", "offsetY", "scaleX", "scaleY", "src", "tint"]) {
        tokenUpdate.texture[k] = prototypeTokenData.texture[k];
      }
      tokenUpdate.sight = prototypeTokenData.sight;
      tokenUpdate.detectionModes = prototypeTokenData.detectionModes;

      await this.sheet.close();
      await canvas.scene?.deleteEmbeddedDocuments("Token", [this.token._id]);
      const token = await TokenDocument.implementation.create(tokenUpdate, {
        parent: canvas.scene,
        keepId: true,
        render: true
      });
      if (isOriginalActor) {
        await this.unsetFlag("sw5e", "isPolymorphed");
        await this.unsetFlag("sw5e", "previousActorIds");
        await this.token.unsetFlag("sw5e", "previousActorData");
      }
      if (isRendered && renderSheet) token.actor?.sheet?.render(true);
      return token;
    }

    if (!original) {
      ui.notifications.warn(
        game.i18n.format("SW5E.PolymorphRevertNoOriginalActorWarn", {
          reference: this.getFlag("sw5e", "originalActor")
        })
      );
      return;
    }

    // Get the Tokens which represent this actor
    if (canvas.ready) {
      const tokens = this.getActiveTokens(true);
      const tokenData = await original.getTokenDocument();
      const tokenUpdates = tokens.map(t => {
        const update = duplicate(tokenData);
        update._id = t.id;
        delete update.x;
        delete update.y;
        return update;
      });
      await canvas.scene.updateEmbeddedDocuments("Token", tokenUpdates);
    }
    if (isOriginalActor) {
      await this.unsetFlag("sw5e", "isPolymorphed");
      await this.unsetFlag("sw5e", "previousActorIds");
    }

    // Delete the polymorphed version(s) of the actor, if possible
    if (game.user.isGM) {
      const idsToDelete = previousActorIds
        .filter(
          id =>
            id !== original.id // Is not original Actor Id
            && game.actors?.get(id) // Actor still exists
        )
        .concat([this.id]); // Add this id

      await Actor.implementation.deleteDocuments(idsToDelete);
    } else if (isRendered) {
      this.sheet?.close();
    }
    if (isRendered && renderSheet) original.sheet?.render(isRendered);
    return original;
  }

  /* -------------------------------------------- */

  /**
   * Deploy an Actor into this starship.
   *
   * @param {Actor} target The Actor to be deployed.
   * @param {string} toDeploy ID of the position to deploy in
   */
  async ssDeployCrew(target, toDeploy) {
    if (!target) return;
    const ssUpdates = {};
    const tUpdates = {};

    const tDeployed = target.system.attributes.deployed;
    const otherShip = target.getStarship();
    if (otherShip) {
      if (otherShip.uuid !== this.uuid) await otherShip?.ssUndeployCrew(target, tDeployed.deployments);
      else if (tDeployed.deployments.has(toDeploy)) return;
    }
    tDeployed.deployments.add(toDeploy);
    tUpdates["system.attributes.deployed.uuid"] = this.uuid;
    tUpdates["system.attributes.deployed.deployments"] = Array.from(tDeployed.deployments);

    // Get the starship Actor data and the new crewmember data
    const tUUID = target.uuid;
    const ssDeploy = this.system.attributes.deployment;
    const ssDeployment = ssDeploy[toDeploy];

    if (ssDeployment.items) {
      ssDeployment.items.add(tUUID);
      ssUpdates[`system.attributes.deployment.${toDeploy}.items`] = Array.from(ssDeployment.items);
    } else {
      if (![null, tUUID].includes(ssDeployment.value)) {
        const otherCrew = fromUuidSynchronous(ssDeployment.value);
        if (otherCrew) await this.ssUndeployCrew(otherCrew, [toDeploy]);
      }
      ssUpdates[`system.attributes.deployment.${toDeploy}.value`] = tUUID;
    }
    if (ssDeploy.active.value === target.uuid) {
      ssUpdates[`system.attributes.deployment.${toDeploy}.active`] = true;
    }

    await this.update(ssUpdates);
    await target.update(tUpdates);

    if (!ssDeploy.crew.items.has(tUUID) && toDeploy !== "passenger") this.ssDeployCrew(target, "crew");
  }

  /* -------------------------------------------- */

  /**
   * Undeploys an actor from this starship.
   *
   * @param {Actor} target The Actor to be undeployed.
   * @param {Array} [toUndeploy] Array of ids of the positions to undeploy from, empty for all
   */
  async ssUndeployCrew(target, toUndeploy) {
    if (!target) return;
    if (!toUndeploy) toUndeploy = Object.keys(CONFIG.SW5E.ssCrewStationTypes);
    const ssUpdates = {};
    const tUpdates = {};

    const ssDeploy = this.system.attributes.deployment;
    const tDeployed = target.system.attributes.deployed;

    for (const key of toUndeploy) {
      const ssDeployment = ssDeploy[key];
      if (ssDeployment) {
        if (ssDeployment.items) {
          ssDeployment.items.delete(target.uuid);
          ssUpdates[`system.attributes.deployment.${key}.items`] = Array.from(ssDeployment.items);
        } else ssUpdates[`system.attributes.deployment.${key}.value`] = null;

        if (ssDeploy.active.value === target.uuid) {
          ssUpdates[`system.attributes.deployment.${key}.active`] = false;
        }
      }

      if (tDeployed?.deployments?.has(key)) {
        tDeployed?.deployments?.delete(key);
        tUpdates["system.attributes.deployed.deployments"] = Array.from(tDeployed.deployments);
      }
    }

    if (tDeployed.deployments.size === 0) {
      tUpdates["system.attributes.depleted.uuid"] = null;
      if (ssDeploy.active.value === target.uuid) await this.ssToggleActiveCrew();
    }

    await this.update(ssUpdates);
    await target.update(tUpdates);
  }

  /* -------------------------------------------- */

  /**
   * Toggles if a crew member is active in this starship.
   *
   * @param {string} target UUID of the target, if empty will set everyone as inactive
   * @returns {string|null} The new active crew member's id.
   */
  async ssToggleActiveCrew(target) {
    const ssUpdates = {};

    const ssDeploy = this.system.attributes.deployment;
    const ssActive = ssDeploy.active;

    if (target === ssActive.value) target = null;
    ssUpdates["system.attributes.deployment.active.value"] = target;

    for (const key of Object.keys(CONFIG.SW5E.ssCrewStationTypes)) {
      const ssDeployment = ssDeploy[key];
      if (ssDeployment.items) ssUpdates[`system.attributes.deployment.${key}.active`] = ssDeployment.items.has(target);
      else ssUpdates[`system.attributes.deployment.${key}.active`] = ssDeployment.value === target;
    }

    await this.update(ssUpdates);
    return ssActive.value;
  }

  /* -------------------------------------------- */

  /**
   * Gets the starship the actor is deployed into
   * @returns {Actor|null} The starship
   */
  getStarship() {
    const starship = fromUuidSynchronous(this?.system?.attributes?.deployed?.uuid);
    if (starship && starship instanceof TokenDocument) return starship.actor;
    return starship;
  }

  /* -------------------------------------------- */

  /**
   * Add additional system-specific sidebar directory context menu options for SW5e Actor documents
   * @param {jQuery} html         The sidebar HTML
   * @param {Array} entryOptions  The default array of context menu options
   */
  static addDirectoryContextOptions(html, entryOptions) {
    entryOptions.push({
      name: "SW5E.PolymorphRestoreTransformation",
      icon: '<i class="fa-solid fa-backward"></i>',
      callback: li => {
        const actor = game.actors.get(li.data("documentId"));
        return actor.revertOriginalForm();
      },
      condition: li => {
        const allowed = game.settings.get("sw5e", "allowPolymorphing");
        if (!allowed && !game.user.isGM) return false;
        const actor = game.actors.get(li.data("documentId"));
        return actor && actor.isPolymorphed;
      },
      group: "system"
    }, {
      name: "SW5E.Group.Primary.Set",
      icon: '<i class="fa-solid fa-star"></i>',
      callback: li => {
        game.settings.set("sw5e", "primaryParty", { actor: game.actors.get(li[0].dataset.documentId) });
      },
      condition: li => {
        const actor = game.actors.get(li[0].dataset.documentId);
        const primary = game.settings.get("sw5e", "primaryParty")?.actor;
        return game.user.isGM && (actor.type === "group") && (actor.system.type.value === "party") && (actor !== primary);
      },
      group: "system"
    }, {
      name: "SW5E.Group.Primary.Remove",
      icon: '<i class="fa-regular fa-star"></i>',
      callback: li => {
        game.settings.set("sw5e", "primaryParty", { actor: null });
      },
      condition: li => {
        const actor = game.actors.get(li[0].dataset.documentId);
        const primary = game.settings.get("sw5e", "primaryParty")?.actor;
        return game.user.isGM && (actor === primary);
      },
      group: "system"
    });
  }

  /* -------------------------------------------- */

  /**
   * Add class to actor entry representing the primary group.
   * @param {jQuery} jQuery
   */
  static onRenderActorDirectory(jQuery) {
    const primaryParty = game.settings.get("sw5e", "primaryParty")?.actor;
    if ( primaryParty ) {
      const element = jQuery[0]?.querySelector(`[data-entry-id="${primaryParty.id}"]`);
      element?.classList.add("primary-party");
    }
  }

  /* -------------------------------------------- */

  /**
   * Format a type object into a string.
   * @param {object} typeData          The type data to convert to a string.
   * @returns {string}
   */
  static formatCreatureType(typeData) {
    if (typeof typeData === "string") return typeData; // Backwards compatibility
    let localizedType;
    if (typeData.value === "custom") {
      localizedType = typeData.custom;
    } else if ( typeData.value in CONFIG.SW5E.creatureTypes ) {
      const code = CONFIG.SW5E.creatureTypes[typeData.value];
      localizedType = game.i18n.localize(typeData.swarm ? code.plural : code.label);
    }
    let type = localizedType;
    if (typeData.swarm) {
      type = game.i18n.format("SW5E.CreatureSwarmPhrase", {
        size: game.i18n.localize(CONFIG.SW5E.actorSizes[typeData.swarm].label),
        type: localizedType
      });
    }
    if (typeData.subtype) type = `${type} (${typeData.subtype})`;
    return type;
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);
    this._displayScrollingDamage(options.dhp);

    this.token?.flashRing(options);
    if ( userId === game.userId ) {
      await this.updateEncumbrance(options);
      this._onUpdateExhaustion(data, options);
    }

    // When updating an actor deployed on a starship, rerender the starship sheet if it is open
    const starship = this.getStarship();
    if (starship) {
      const app = starship.apps[starship.sheet.appId];
      if (app) {
        starship.prepareData();
        app.render(true);
      }
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onCreateDescendantDocuments(parent, collection, documents, data, options, userId) {
    if ( (userId === game.userId) && (collection === "items") ) await this.updateEncumbrance(options);
    super._onCreateDescendantDocuments(parent, collection, documents, data, options, userId);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId) {
    if ( (userId === game.userId) && (collection === "items") ) await this.updateEncumbrance(options);
    super._onUpdateDescendantDocuments(parent, collection, documents, changes, options, userId);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId) {
    if ( (userId === game.userId) ) {
      if ( collection === "items" ) await this.updateEncumbrance(options);
      await this._clearFavorites(documents);
    }
    super._onDeleteDescendantDocuments(parent, collection, documents, ids, options, userId);
  }

  /* -------------------------------------------- */

  /**
   * Follow-up actions taken after a set of embedded Documents in this parent Document are updated.
   * @param {string} embeddedName   The name of the embedded Document type
   * @param {Document[]} documents  An Array of updated Documents
   * @param {object[]} result       An Array of incremental data objects
   * @param {object} options        Options which modified the update operation
   * @param {string} userId         The ID of the User who triggered the operation
   * @memberof ClientDocumentMixin#
   */
  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId);

    const starship = this.getStarship();
    if (starship) {
      const app = starship.apps[starship.sheet.appId];
      if (app) {
        starship.prepareData();
        app.render(true);
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Display changes to health as scrolling combat text.
   * Adapt the font size relative to the Actor's HP total to emphasize more significant blows.
   * @param {number} dhp      The change in hit points that was applied
   * @private
   */
  _displayScrollingDamage(dhp) {
    if (!dhp) return;
    dhp = Number(dhp);
    const tokens = this.isToken ? [this.token?.object] : this.getActiveTokens(true);
    for (const t of tokens) {
      if ( !t.visible || !t.renderable ) continue;
      const pct = Math.clamped(Math.abs(dhp) / this.system.attributes.hp.max, 0, 1);
      canvas.interface.createScrollingText(t.center, dhp.signedString(), {
        anchor: CONST.TEXT_ANCHOR_POINTS.TOP,
        fontSize: 16 + (32 * pct), // Range between [16, 48]
        fill: CONFIG.SW5E.tokenHPColors[dhp < 0 ? "damage" : "healing"],
        stroke: 0x000000,
        strokeThickness: 4,
        jitter: 0.25
      });
    }
  }

  /* -------------------------------------------- */

  /**
   * TODO: Perform this as part of Actor._preUpdateOperation instead when it becomes available in v12.
   * Handle syncing the Actor's exhaustion level with the ActiveEffect.
   * @param {object} data                          The Actor's update delta.
   * @param {DocumentModificationContext} options  Additional options supplied with the update.
   * @returns {Promise<ActiveEffect|void>}
   * @protected
   */
  async _onUpdateExhaustion(data, options) {
    const level = foundry.utils.getProperty(data, "system.attributes.exhaustion");
    if ( !Number.isFinite(level) ) return;
    let effect = this.effects.get(ActiveEffect5e.ID.EXHAUSTION);
    if ( level < 1 ) return effect?.delete();
    else if ( effect ) {
      const originalExhaustion = foundry.utils.getProperty(options, "sw5e.originalExhaustion");
      return effect.update({ "flags.sw5e.exhaustionLevel": level }, { sw5e: { originalExhaustion } });
    } else {
      effect = await ActiveEffect.implementation.fromStatusEffect("exhaustion", { parent: this });
      effect.updateSource({ "flags.sw5e.exhaustionLevel": level });
      return ActiveEffect.implementation.create(effect, { parent: this, keepId: true });
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle applying/removing encumbrance statuses.
   * @param {DocumentModificationContext} options  Additional options supplied with the update.
   * @returns {Promise<ActiveEffect>|void}
   */
  updateEncumbrance(options) {
    const encumbrance = this.system.attributes?.encumbrance;
    if ( !encumbrance || (game.settings.get("sw5e", "encumbrance") === "none") ) return;
    const statuses = [];
    const variant = game.settings.get("sw5e", "encumbrance") === "variant";
    if ( encumbrance.value > encumbrance.thresholds.maximum ) statuses.push("exceedingCarryingCapacity");
    if ( (encumbrance.value > encumbrance.thresholds.heavilyEncumbered) && variant ) statuses.push("heavilyEncumbered");
    if ( (encumbrance.value > encumbrance.thresholds.encumbered) && variant ) statuses.push("encumbered");

    const effect = this.effects.get(ActiveEffect5e.ID.ENCUMBERED);
    if ( !statuses.length ) return effect?.delete();

    const effectData = { ...CONFIG.SW5E.encumbrance.effects[statuses[0]], statuses };
    if ( effect ) {
      const originalEncumbrance = effect.statuses.first();
      return effect.update(effectData, { sw5e: { originalEncumbrance } });
    }

    return ActiveEffect.implementation.create(
      { _id: ActiveEffect5e.ID.ENCUMBERED, ...effectData },
      { parent: this, keepId: true }
    );
  }

  /* -------------------------------------------- */

  /**
   * Handle clearing favorited entries that were deleted.
   * @param {Document[]} documents  The deleted Documents.
   * @returns {Promise<Actor5e>|void}
   * @protected
   */
  _clearFavorites(documents) {
    if ( !("favorites" in this.system) ) return;
    const ids = new Set(documents.map(d => d.getRelativeUUID(this)));
    const favorites = this.system.favorites.filter(f => !ids.has(f.id));
    return this.update({ "system.favorites": favorites });
  }
}
