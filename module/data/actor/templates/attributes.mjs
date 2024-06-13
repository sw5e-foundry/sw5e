import { FormulaField, UUIDField } from "../../fields.mjs";
import MovementField from "../../shared/movement-field.mjs";
import SensesField from "../../shared/senses-field.mjs";
import ActiveEffect5e from "../../../documents/active-effect.mjs";
import RollConfigField from "../../shared/roll-config-field.mjs";
import { simplifyBonus } from "../../../utils.mjs";

/**
 * Shared contents of the attributes schema between various actor types.
 */
export default class AttributesFields {
  /**
   * Fields shared between characters, NPCs, and vehicles.
   *
   * @type {object}
   * @property {object} init
   * @property {string} init.ability     The ability used for initiative rolls.
   * @property {string} init.bonus       The bonus provided to initiative rolls.
   * @property {object} movement
   * @property {number} movement.burrow  Actor burrowing speed.
   * @property {number} movement.climb   Actor climbing speed.
   * @property {number} movement.fly     Actor flying speed.
   * @property {number} movement.swim    Actor swimming speed.
   * @property {number} movement.walk    Actor walking speed.
   * @property {string} movement.units   Movement used to measure the various speeds.
   * @property {boolean} movement.hover  Is this flying creature able to hover in place.
   */
  static get common() {
    return {
      init: new RollConfigField({
        ability: "",
        bonus: new FormulaField({required: true, label: "SW5E.InitiativeBonus"})
      }, { label: "SW5E.Initiative" }),
      movement: new MovementField()
    };
  }

  /* -------------------------------------------- */

  /**
   * Fields shared between characters and NPCs.
   *
   * @type {object}
   * @property {object} attunement
   * @property {number} attunement.max                     Maximum number of attuned items.
   * @property {object} senses
   * @property {number} senses.darkvision                  Creature's darkvision range.
   * @property {number} senses.blindsight                  Creature's blindsight range.
   * @property {number} senses.tremorsense                 Creature's tremorsense range.
   * @property {number} senses.truesight                   Creature's truesight range.
   * @property {string} senses.units                       Distance units used to measure senses.
   * @property {string} senses.special                     Description of any special senses or restrictions.
   * @property {string} forcecasting                       Primary Forcecasting ability.
   * @property {object} force
   * @property {object} force.points
   * @property {number} force.points.value                 Current force points.
   * @property {number} force.points.max                   Override for maximum FP.
   * @property {number} force.points.temp                  Temporary FP applied on top of value.
   * @property {object} force.points.bonuses
   * @property {string} force.points.bonuses.level         Bonus formula applied for each class level.
   * @property {string} force.points.bonuses.overall       Bonus formula applied to total FP.
   * @property {string} techcasting                        Primary Techcasting ability.
   * @property {object} tech
   * @property {object} tech.points
   * @property {number} tech.points.value                  Current tech points.
   * @property {number} tech.points.max                    Override for maximum TP.
   * @property {number} tech.points.temp                   Temporary TP applied on top of value.
   * @property {object} tech.points.bonuses
   * @property {string} tech.points.bonuses.level          Bonus formula applied for each class level.
   * @property {string} tech.points.bonuses.overall        Bonus formula applied to total TP.
   * @property {object} super
   * @property {number} super.die                          Override for SD size.
   * @property {object} super.dice
   * @property {number} super.dice.value                   Current superiority dice.
   * @property {number} super.dice.max                     Override for maximum SD.
   * @property {object} super.dice.bonuses
   * @property {string} super.dice.bonuses.level           Bonus formula applied for each class level.
   * @property {string} super.dice.bonuses.overall         Bonus formula applied to total SD.
   * @property {number} exhaustion                         Creature's exhaustion level.
   * @property {object} concentration
   * @property {string} concentration.ability              The ability used for concentration saving throws.
   * @property {string} concentration.bonus                The bonus provided to concentration saving throws.
   * @property {number} concentration.limit                The amount of items this actor can concentrate on.
   * @property {object} concentration.roll
   * @property {number} concentration.roll.min             The minimum the d20 can roll.
   * @property {number} concentration.roll.max             The maximum the d20 can roll.
   * @property {number} concentration.roll.mode            The default advantage mode for this actor's concentration saving throws.
   * @property {object} deployed
   * @property {string} deployed.uuid                      UUID of the starship this character is deployed on.
   * @property {Set<string>} deployed.deployments          Positions the actor is deployed on.
   */
  static get creature() {
    return {
      attunement: new foundry.data.fields.SchemaField(
        {
          max: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 3,
            label: "SW5E.AttunementMax"
          })
        },
        { label: "SW5E.Attunement" }
      ),
      senses: new SensesField(),
      forcecasting: new foundry.data.fields.StringField({
        required: true, blank: true, initial: "wis", label: "SW5E.ForcePowerAbility"
      }),
      force: new foundry.data.fields.SchemaField(
        { points: makePointsResource({ label: "SW5E.ForcePoint", hasTemp: true }) },
        { label: "SW5E.ForceCasting" }
      ),
      techcasting: new foundry.data.fields.StringField({
        required: true, blank: true, initial: "int", label: "SW5E.TechPowerAbility"
      }),
      tech: new foundry.data.fields.SchemaField(
        { points: makePointsResource({ label: "SW5E.TechPoint", hasTemp: true }) },
        { label: "SW5E.TechCasting" }
      ),
      super: new foundry.data.fields.SchemaField(
        {
          die: new foundry.data.fields.NumberField({
            nullable: true,
            integer: true,
            min: 0,
            initial: null,
            label: "SW5E.SuperiorityDieOverride"
          }),
          dice: makePointsResource({ label: "SW5E.SuperDice" })
        },
        { label: "SW5E.Superiority" }
      ),
      deployed: new foundry.data.fields.SchemaField(
        {
          uuid: new UUIDField({ label: "SW5E.DeployedStarship", nullable: true }),
          deployments: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
            label: "SW5E.DeployedPositions"
          })
        },
        { label: "SW5E.Deployed" }
      ),
      exhaustion: new foundry.data.fields.NumberField({
        required: true, nullable: false, integer: true, min: 0, initial: 0, label: "SW5E.Exhaustion"
      }),
      concentration: new RollConfigField({
        ability: "",
        bonuses: new foundry.data.fields.SchemaField({
          save: new FormulaField({required: true, label: "SW5E.SaveBonus"})
        }),
        limit: new foundry.data.fields.NumberField({integer: true, min: 0, initial: 1, label: "SW5E.AttrConcentration.Limit"})
      }, {label: "SW5E.Concentration"})
    };
  }

  /* -------------------------------------------- */
  /*  Data Migration                              */
  /* -------------------------------------------- */

  /**
   * Migrate the old init.value and incorporate it into init.bonus.
   * @param {object} source  The source attributes object.
   * @internal
   */
  static _migrateInitiative(source) {
    const init = source?.init;
    if (!init?.value || typeof init?.bonus === "string") return;
    if (init.bonus) init.bonus += init.value < 0 ? ` - ${init.value * -1}` : ` + ${init.value}`;
    else init.bonus = `${init.value}`;
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * Initialize derived AC fields for Active Effects to target.
   * @this {CharacterData|NPCData|StarshipData|VehicleData}
   */
  static prepareBaseArmorClass() {
    const ac = this.attributes.ac;
    ac.armor = 10;
    ac.shield = ac.cover = 0;
    ac.bonus = "";
  }

  /* -------------------------------------------- */

  /**
   * Adjust exhaustion level based on Active Effects.
   * @this {CharacterData|NPCData}
   */
  static prepareExhaustionLevel() {
    const exhaustion = this.parent.effects.get(ActiveEffect5e.ID.EXHAUSTION);
    const level = exhaustion?.getFlag("sw5e", "exhaustionLevel");
    this.attributes.exhaustion = Number.isFinite(level) ? level : 0;
  }

  /* -------------------------------------------- */

  /**
   * Prepare concentration data for an Actor.
   * @this {CharacterData|NPCData}
   * @param {object} rollData  The Actor's roll data.
   */
  static prepareConcentration(rollData) {
    const { concentration } = this.attributes;
    const abilityId = concentration.ability || CONFIG.SW5E.defaultAbilities.concentration;
    const ability = this.abilities?.[abilityId] || {};
    const bonus = simplifyBonus(concentration.bonuses.save, rollData);
    concentration.save = (ability.save ?? 0) + bonus;
  }

  /* -------------------------------------------- */

  /**
   * Prepare base data related to the power-casting capabilities of the Actor.
   * Mutates the value of the system.powers object.
   * @this {CharacterData|NPCData}
   */
  static prepareBasePowercasting() {

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
      const powers = this.powers;
      for ( const level of Array.fromRange(Object.keys(CONFIG.SW5E.powerLevels).length - 1, 1) ) {
        const slot = powers[`power${level}`] ??= { [pval]: 0 };

        slot[pmax] = (level > progression.maxPowerLevel) ? 0 : ((level >= progression.limit) ? 1 : 1000);

        if (isNPC) slot[pval] = slot[pmax];
        else slot[pval] = Math.min(parseInt(slot[pval] ?? slot.value ?? slot[pmax]), slot[pmax]);
      }

      // Apply the calculated values to the sheet
      const target = this.attributes[progression.castType];
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
   * @this {CharacterData|NPCData}
   */
  static prepareBaseSuperiority() {
    if (this.type === "vehicle" || this.type === "starship") return;
    const superiority = this.attributes.super;

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
   * Calculate maximum hit points, taking an provided advancement into consideration.
   * @param {object} hp                 HP object to calculate.
   * @param {object} [options={}]
   * @param {HitPointsAdvancement[]} [options.advancement=[]]  Advancement items from which to get hit points per-level.
   * @param {number} [options.bonus=0]  Additional bonus to add atop the calculated value.
   * @param {number} [options.mod=0]    Modifier for the ability to add to hit points from advancement.
   * @this {ActorDataModel}
   */
  static prepareHitPoints(hp, { advancement=[], mod=0, bonus=0 }={}) {
    const base = advancement.reduce((total, advancement) => total + advancement.getAdjustedTotal(mod), 0);
    hp.max = (hp.max ?? 0) + base + bonus;
    if ( this.parent.hasConditionEffect("halfHealth") ) hp.max = Math.floor(hp.max * 0.5);

    hp.effectiveMax = hp.max + (hp.tempmax ?? 0);
    hp.value = Math.min(hp.value, hp.effectiveMax);
    hp.damage = hp.effectiveMax - hp.value;
    hp.pct = Math.clamped(hp.effectiveMax ? (hp.value / hp.effectiveMax) * 100 : 0, 0, 100);
  }

  /* -------------------------------------------- */

  /**
   * Calculate maximum hull/shield points, taking an provided advancement into consideration.
   * @param {object} hp                                                 HP object to calculate.
   * @param {object} [options={}]
   * @param {HullPointsAdvancement[]} [options.hullAdvancement=[]]      Advancement items from which to get hull points per-level.
   * @param {ShieldPointsAdvancement[]} [options.shieldAdvancement=[]]  Advancement items from which to get shield points per-level.
   * @param {number} [options.hullBonus=0]                              Additional bonus to add atop the calculated value.
   * @param {number} [options.shieldBonus=0]                            Additional bonus to add atop the calculated value.
   * @param {number} [options.hullMod=0]                                Modifier for the ability to add to hull points from advancement.
   * @param {number} [options.shieldMod=0]                              Modifier for the ability to add to shield points from advancement.
   * @param {number} [options.shieldCapMult=1]                          Multiplier for the shield points based on equipment.
   * @this {ActorDataModel}
   */
  static prepareHullShieldPoints(hp, { hullAdvancement=[], shieldAdvancement=[], hullMod=0, shieldMod=0, hullBonus=0, shieldBonus=0, shieldCapMult=1 }={}) {
    const hullBase = hullAdvancement.reduce((total, hullAdvancement) => total + hullAdvancement.getAdjustedTotal(hullMod), 0);
    hp.max = (hp.max ?? 0) + hullBase + hullBonus;
    const shieldBase = shieldAdvancement.reduce((total, shieldAdvancement) => total + Math.round(shieldAdvancement.getAdjustedTotal(shieldMod) * shieldCapMult), 0);
    hp.tempmax = (hp.tempmax ?? 0) + shieldBase + shieldBonus;

    hp.effectiveMax = hp.max + (hp.tempmax ?? 0);
    hp.value = Math.min(hp.value, hp.effectiveMax);
    hp.damage = hp.effectiveMax - hp.value;
    hp.pct = Math.clamped(hp.effectiveMax ? (hp.value / hp.effectiveMax) * 100 : 0, 0, 100);
  }

  /* -------------------------------------------- */

  /**
   * Modify movement speeds taking exhaustion and any other conditions into account.
   * @this {CharacterData|NPCData}
   */
  static prepareMovement() {
    const statuses = this.parent.statuses;
    const noMovement = this.parent.hasConditionEffect("noMovement");
    const halfMovement = this.parent.hasConditionEffect("halfMovement");
    const encumbered = statuses.has("encumbered");
    const heavilyEncumbered = statuses.has("heavilyEncumbered");
    const exceedingCarryingCapacity = statuses.has("exceedingCarryingCapacity");
    const crawl = this.parent.hasConditionEffect("crawl");
    const units = this.attributes.movement.units;
    for ( const type in CONFIG.SW5E.movementTypes ) {
      let speed = this.attributes.movement[type];
      if ( noMovement || (crawl && (type !== "walk")) ) speed = 0;
      else {
        if ( halfMovement ) speed *= 0.5;
        if ( heavilyEncumbered ) {
          speed = Math.max(0, speed - (CONFIG.SW5E.encumbrance.speedReduction.heavilyEncumbered[units] ?? 0));
        } else if ( encumbered ) {
          speed = Math.max(0, speed - (CONFIG.SW5E.encumbrance.speedReduction.encumbered[units] ?? 0));
        }
        if ( exceedingCarryingCapacity ) {
          speed = Math.min(speed, CONFIG.SW5E.encumbrance.speedReduction.exceedingCarryingCapacity[units] ?? 0);
        }
      }
      this.attributes.movement[type] = speed;
    }
  }

  /* -------------------------------------------- */

  /**
   * Apply movement and sense changes based on a species item. This method should be called during
   * the `prepareEmbeddedData` step of data preparation.
   * @param {Item5e} species                    Species item from which to get the stats.
   * @param {object} [options={}]
   * @param {boolean} [options.force=false]  Override any values on the actor.
   * @this {CharacterData|NPCData}
   */
  static prepareSpecies(species, { force=false }={}) {
    for ( const key of Object.keys(CONFIG.SW5E.movementTypes) ) {
      if ( !species.system.movement[key] || (!force && (this.attributes.movement[key] !== null)) ) continue;
      this.attributes.movement[key] = species.system.movement[key];
    }
    if ( species.system.movement.hover ) this.attributes.movement.hover = true;
    if ( force && species.system.movement.units ) this.attributes.movement.units = species.system.movement.units;
    else this.attributes.movement.units ??= species.system.movement.units ?? Object.keys(CONFIG.SW5E.movementUnits)[0];

    for ( const key of Object.keys(CONFIG.SW5E.senses) ) {
      if ( !species.system.senses[key] || (!force && (this.attributes.senses[key] !== null)) ) continue;
      this.attributes.senses[key] = species.system.senses[key];
    }
    this.attributes.senses.special = [this.attributes.senses.special, species.system.senses.special].filterJoin(";");
    if ( force && species.system.senses.units ) this.attributes.senses.units = species.system.senses.units;
    else this.attributes.senses.units ??= species.system.senses.units ?? Object.keys(CONFIG.SW5E.movementUnits)[0];
  }
}

/**
 * Produce the schema field for a points resource.
 * @param {object} [schemaOptions]    Options passed to the outer schema.
 * @returns {PowerCastingData}
 */
function makePointsResource(schemaOptions = {}) {
  const baseLabel = schemaOptions.label;
  const schemaObj = {
    value: new foundry.data.fields.NumberField({
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      label: `${baseLabel}Current`
    }),
    max: new foundry.data.fields.NumberField({
      nullable: true,
      integer: true,
      min: 0,
      initial: null,
      label: `${baseLabel}Override`
    }),
    bonuses: new foundry.data.fields.SchemaField({
      level: new FormulaField({ deterministic: true, label: `${baseLabel}BonusLevel` }),
      overall: new FormulaField({ deterministic: true, label: `${baseLabel}BonusOverall` })
    })
  };
  if (schemaOptions.hasTemp) schemaObj.temp = new foundry.data.fields.NumberField({
    integer: true,
    initial: 0,
    min: 0,
    label: `${baseLabel}Temp`
  });
  if (schemaOptions.hasTempMax) schemaObj.tempmax = new foundry.data.fields.NumberField({
    integer: true,
    initial: 0,
    label: `${baseLabel}TempMax`
  });
  return new foundry.data.fields.SchemaField(schemaObj, schemaOptions);
}
