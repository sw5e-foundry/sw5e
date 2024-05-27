import Proficiency from "../../documents/actor/proficiency.mjs";
import { simplifyBonus } from "../../utils.mjs";
import { FormulaField, MappingField, UUIDField, LocalDocumentField } from "../fields.mjs";
import RollConfigField from "../shared/roll-config-field.mjs";
import AttributesFields from "./templates/attributes.mjs";
import CommonTemplate from "./templates/common.mjs";
import DetailsFields from "./templates/details.mjs";
import TraitsFields from "./templates/traits.mjs";

const { SchemaField, NumberField, StringField, BooleanField, ArrayField, IntegerSortField } = foundry.data.fields;

/**
 * @typedef {object} ActorFavorites5e
 * @property {"effect"|"item"|"skill"|"slots"|"tool"} type  The favorite type.
 * @property {string} id                                    The Document UUID, skill or tool identifier, or power slot
 *                                                          level identifier.
 * @property {number} sort                                  The sort value.
 */

/**
 * System data definition for Starships.
 *
 * @property {object} attributes
 * @property {object} attributes.ac
 * @property {number} attributes.ac.flat                       Flat value used for flat or natural armor calculation.
 * @property {string} attributes.ac.calc                       Name of one of the built-in formulas to use.
 * @property {string} attributes.ac.formula                    Custom formula to use.
 * @property {object} attributes.hp
 * @property {number} attributes.hp.value                      Current hull points.
 * @property {number} attributes.hp.max                        Override for maximum HP.
 * @property {number} attributes.hp.temp                       Current shield points.
 * @property {number} attributes.hp.tempmax                    Override for maximum SP.
 * @property {object} attributes.hp.bonuses
 * @property {string} attributes.hp.bonuses.level              Bonus formula applied to HP for each class level.
 * @property {string} attributes.hp.bonuses.overall            Bonus formula applied to total HP.
 * @property {string} attributes.hp.bonuses.templevel          Bonus formula applied to SP for each class level.
 * @property {string} attributes.hp.bonuses.tempoverall        Bonus formula applied to total SP.
 * @property {object} attributes.death
 * @property {number} attributes.death.success                 Number of successful death saves.
 * @property {number} attributes.death.failure                 Number of failed death saves.
 * @property {number} attributes.systemDamage                  Number of levels of system damage.
 * @property {object} attributes.deployment
 * @property {object} attributes.deployment.pilot
 * @property {string} attributes.deployment.pilot.value        UUID of the actor deployed as the pilot.
 * @property {boolean} attributes.deployment.pilot.active      Is the active actor a pilot?
 * @property {object} attributes.deployment.crew
 * @property {string[]} attributes.deployment.crew.value       Array of UUIDs of actors deployed as crew members..
 * @property {boolean} attributes.deployment.crew.active       Is the active actor a crew member?
 * @property {object} attributes.deployment.passenger
 * @property {string[]} attributes.deployment.passenger.value  Array of UUIDs of actors deployed as passengers..
 * @property {boolean} attributes.deployment.passenger.active  Is the active actor a passenger?
 * @property {object} attributes.deployment.active
 * @property {string} attributes.deployment.active.value       UUID of the active actor.
 * @property {object} attributes.fuel
 * @property {number} attributes.fuel.value                    Amount of units of fuel stored.
 * @property {object} attributes.power
 * @property {string} attributes.power.routing                 Power routing as defined in `SW5E.powerRoutingOpts`.
 * @property {object} attributes.power.central
 * @property {number} attributes.power.central.value           Number of power dice stored in central storage.
 * @property {object} attributes.power.comms
 * @property {number} attributes.power.comms.value             Number of power dice stored in comms storage.
 * @property {object} attributes.power.engines
 * @property {number} attributes.power.engines.value           Number of power dice stored in engines storage.
 * @property {object} attributes.power.shields
 * @property {number} attributes.power.shields.value           Number of power dice stored in shields storage.
 * @property {object} attributes.power.sensors
 * @property {number} attributes.power.sensors.value           Number of power dice stored in sensors storage.
 * @property {object} attributes.power.weapons
 * @property {number} attributes.power.weapons.value           Number of power dice stored in weapons storage.
 * @property {boolean} attributes.used                         Does the ship have the 'used' condition.
 * @property {object} details
 * @property {string} details.source                           What book or adventure is this Starship from.
 * @property {Item5e|string} details.starshipsize              Starships's size item or name.
 * @property {Object<string, SkillData>} skills                Starship's skills.
 * @property {object} traits
 * @property {ActorFavorites5e[]} favorites               The character's favorites.
 * @property {SimpleTraitData} traits.ci                       Condition immunities.
 * @property {DamageTraitData} traits.di                       Hull Damage immunities.
 * @property {DamageTraitData} traits.dr                       Hull Damage resistances.
 * @property {DamageTraitData} traits.dv                       Hull Damage vulnerabilities.
 * @property {DamageTraitData} traits.sdi                      Shield Damage immunities.
 * @property {DamageTraitData} traits.sdr                      Shield Damage resistances.
 * @property {DamageTraitData} traits.sdv                      Shield Damage vulnerabilities.
 */
export default class StarshipData extends CommonTemplate {
  /** @inheritdoc */
  static metadata = Object.freeze(foundry.utils.mergeObject(super.metadata, {
    supportsAdvancement: true
  }, {inplace: false}));

  /* -------------------------------------------- */

  /** @inheritdoc */
  static _systemType = "starship";

  /* -------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      attributes: new foundry.data.fields.SchemaField(
        {
          ...AttributesFields.common,
          bonuses: new SchemaField(
            {
              mwak: makeAttackBonuses({ label: "SW5E.BonusMWAttack" }),
              rwak: makeAttackBonuses({ label: "SW5E.BonusRWAttack" }),
              abilities: new SchemaField(
                {
                  check: new FormulaField({ required: true, label: "SW5E.BonusAbilityCheck" }),
                  save: new FormulaField({ required: true, label: "SW5E.BonusAbilitySave" }),
                  skill: new FormulaField({ required: true, label: "SW5E.BonusAbilitySkill" })
                },
                { label: "SW5E.BonusAbility" }
              )
            },
            { label: "SW5E.Bonuses" }
          ),
          ac: new SchemaField(
            {
              flat: new NumberField({ integer: true, min: 0, label: "SW5E.ArmorClassFlat" }),
              calc: new StringField({ initial: "starship", label: "SW5E.ArmorClassCalculation" }),
              formula: new FormulaField({ deterministic: true, label: "SW5E.ArmorClassFormula" })
            },
            { label: "SW5E.ArmorClass" }
          ),
          hp: new SchemaField(
            {
              value: new NumberField({
                nullable: true,
                integer: true,
                min: 0,
                initial: null,
                label: "SW5E.HullPointsCurrent"
              }),
              max: new NumberField({
                nullable: true,
                integer: true,
                min: 0,
                initial: null,
                label: "SW5E.HullPointsOverride"
              }),
              temp: new NumberField({
                integer: true,
                initial: 0,
                min: 0,
                label: "SW5E.ShieldPoints"
              }),
              tempmax: new NumberField({
                integer: true,
                nullable: true,
                initial: null,
                label: "SW5E.ShieldPointsMax"
              }),
              bonuses: new SchemaField({
                level: new FormulaField({ deterministic: true, label: "SW5E.HullPointsBonusLevel" }),
                overall: new FormulaField({ deterministic: true, label: "SW5E.HullPointsBonusOverall" }),
                templevel: new FormulaField({ deterministic: true, label: "SW5E.ShieldPointsBonusLevel" }),
                tempoverall: new FormulaField({ deterministic: true, label: "SW5E.ShieldPointsBonusOverall" })
              })
            },
            { label: "SW5E.HullPoints" }
          ),
          death: new RollConfigField(
            {
              success: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.DestructionSaveSuccesses"
              }),
              failure: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.DestructionSaveFailures"
              })
            },
            { label: "SW5E.DeathSave" }
          ),
          systemDamage: new NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.SystemDamage"
          }),
          deployment: new SchemaField({
            pilot: new SchemaField({
              value: new UUIDField({ label: "SW5E.DeployedPilot", nullable: true }),
              active: new BooleanField()
            }),
            crew: new SchemaField({
              items: new SetField(new UUIDField({ label: "SW5E.DeployedCrew", nullable: true })),
              active: new BooleanField()
            }),
            passenger: new SchemaField({
              items: new SetField(new UUIDField({ label: "SW5E.DeployedPassenger", nullable: true })),
              active: new BooleanField()
            }),
            active: new SchemaField({
              value: new UUIDField({ label: "SW5E.DeployedActive", nullable: true })
            })
          }),
          fuel: new SchemaField({
            value: new NumberField({
              required: true,
              nullable: false,
              integer: true,
              min: 0,
              initial: 0
            })
          }),
          power: new SchemaField({
            routing: new StringField({
              required: true,
              nullable: false,
              initial: "none"
            }),
            central: new SchemaField({
              value: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            comms: new SchemaField({
              value: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            engines: new SchemaField({
              value: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            shields: new SchemaField({
              value: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            sensors: new SchemaField({
              value: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            weapons: new SchemaField({
              value: new NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            })
          }),
          used: new BooleanField()
        },
        { label: "SW5E.Attributes" }
      ),
      details: new SchemaField(
        {
          ...DetailsFields.common,
          source: new StringField({ required: true, label: "SW5E.Source" }),
          starshipsize: new LocalDocumentField(foundry.documents.BaseItem, {
            required: true, fallback: true, label: "SW5E.StarshipSize"
          })
        },
        { label: "SW5E.Details"
        }),
      skills: new MappingField(
        new RollConfigField({
          value: new NumberField({ required: true, initial: 0, label: "SW5E.ProficiencyLevel" }),
          ability: "dex",
          bonuses: new SchemaField(
            {
              check: new FormulaField({ required: true, label: "SW5E.SkillBonusCheck" }),
              passive: new FormulaField({ required: true, label: "SW5E.SkillBonusPassive" })
            },
            { label: "SW5E.SkillBonuses" }
          )
        }),
        { initialKeys: CONFIG.SW5E.starshipSkills, initialValue: this.#initialSkillValue }
      ),
      traits: new SchemaField(
        {
          ci: TraitsFields.makeSimpleTrait({ label: "SW5E.ConImm" }),
          dr: TraitsFields.makeDamageTrait({ label: "SW5E.HullDamRes" }, { initial: ["ion", "lightning", "necrotic"] }),
          dv: TraitsFields.makeDamageTrait({ label: "SW5E.HullDamVuln" }),
          di: TraitsFields.makeDamageTrait({ label: "SW5E.HullDamImm" }, { initial: ["poison", "psychic"] }),
          sdr: TraitsFields.makeDamageTrait({ label: "SW5E.ShieldDamRes" }, { initial: ["acid", "cold", "fire", "necrotic"] }),
          sdv: TraitsFields.makeDamageTrait({ label: "SW5E.ShieldDamVuln" }),
          sdi: TraitsFields.makeDamageTrait({ label: "SW5E.ShieldDamImm" }, { initial: ["poison", "psychic"] })
        },
        { label: "SW5E.Traits" }
      ),
      favorites: new ArrayField(new SchemaField({
        type: new StringField({ required: true, blank: false }),
        id: new StringField({ required: true, blank: false }),
        sort: new IntegerSortField()
      }), { label: "SW5E.Favorites" })
    });
  }

  /* -------------------------------------------- */
  /*  Data Migration                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
    AttributesFields._migrateInitiative(source.attributes);
    this.#migratePowerRouting(source);
  }

  /**
   * Migrate the starship's power routing data to integers.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migratePowerRouting(source) {
    source.attributes.power ??= {};
    if (typeof source.attributes.power.routing !== "string") source.attributes.power.routing = "none";
  }

  /* -------------------------------------------- */

  /**
   * Populate the proper initial abilities for the skills.
   * @param {string} key      Key for which the initial data will be created.
   * @param {object} initial  The initial skill object created by SkillData.
   * @returns {object}        Initial skills object with the ability defined.
   * @private
   */
  static #initialSkillValue(key, initial) {
    if (CONFIG.SW5E.starshipSkills[key]?.ability) initial.ability = CONFIG.SW5E.starshipSkills[key].ability;
    return initial;
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  //TODO: Update this for starships
  /** @inheritdoc */
  prepareBaseData() {
    this.details.level = 0;
    this.attributes.hd = 0;
    this.attributes.attunement.value = 0;

    for ( const item of this.parent.items ) {
      // Class levels & hit dice
      if ( item.type === "class" ) {
        const classLevels = parseInt(item.system.levels) || 1;
        this.details.level += classLevels;
        this.attributes.hd += classLevels - (parseInt(item.system.hitDiceUsed) || 0);
      }

      // Attuned items
      else if ( item.system.attunement === CONFIG.SW5E.attunementTypes.ATTUNED ) {
        this.attributes.attunement.value += 1;
      }
    }

    // Character proficiency bonus
    this.attributes.prof = Proficiency.calculateMod(this.details.level);

    // Experience required for next level
    const { xp, level } = this.details;
    xp.max = this.parent.getLevelExp(level || 1);
    xp.min = level ? this.parent.getLevelExp(level - 1) : 0;
    if ( level >= CONFIG.SW5E.CHARACTER_EXP_LEVELS.length ) xp.pct = 100;
    else {
      const required = xp.max - xp.min;
      const pct = Math.round((xp.value - xp.min) * 100 / required);
      xp.pct = Math.clamped(pct, 0, 100);
    }

    AttributesFields.prepareBaseArmorClass.call(this);
  }

  /* -------------------------------------------- */

  //TODO: Update this for starships
  /**
   * Prepare movement & senses values derived from species item.
   */
  prepareEmbeddedData() {
    if ( this.details.species instanceof Item ) {
      AttributesFields.prepareSpecies.call(this, this.details.species);
      this.details.type = this.details.species.system.type;
    } else {
      this.attributes.movement.units ??= Object.keys(CONFIG.SW5E.movementUnits)[0];
      this.attributes.senses.units ??= Object.keys(CONFIG.SW5E.movementUnits)[0];
      this.details.type = new CreatureTypeField({ swarm: false }).initialize({ value: "humanoid" }, this);
    }
  }

  /* -------------------------------------------- */

  //TODO: Update this for starships
  /**
   * Prepare remaining starship data.
   */
  prepareDerivedData() {
    const rollData = this.getRollData({ deterministic: true });
    const { originalSaves } = this.parent.getOriginalStats();

    this.prepareAbilities({ rollData, originalSaves });
    AttributesFields.prepareExhaustionLevel.call(this);
    AttributesFields.prepareMovement.call(this);
    AttributesFields.prepareConcentration.call(this, rollData);
    TraitsFields.prepareResistImmune.call(this);

    // Hit Points
    const hpOptions = {};
    if ( this.attributes.hp.max === null ) {
      hpOptions.advancement = Object.values(this.parent.classes)
        .map(c => c.advancement.byType.HitPoints?.[0]).filter(a => a);
      hpOptions.bonus = (simplifyBonus(this.attributes.hp.bonuses.level, rollData) * this.details.level)
        + simplifyBonus(this.attributes.hp.bonuses.overall, rollData);
      hpOptions.mod = this.abilities[CONFIG.SW5E.defaultAbilities.hitPoints ?? "con"]?.mod ?? 0;
    }
    AttributesFields.prepareHitPoints.call(this, this.attributes.hp, hpOptions);
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */
  
  //TODO: Update this for starships
  /** @inheritdoc */
  getRollData({ deterministic=false }={}) {
    const data = super.getRollData({ deterministic });
    data.classes = {};
    for ( const [identifier, cls] of Object.entries(this.parent.classes) ) {
      data.classes[identifier] = {...cls.system};
      if ( cls.archetype ) data.classes[identifier].archetype = cls.archetype.system;
    }
    return data;
  }

  /* -------------------------------------------- */

  /**
   * Checks whether the item with the given relative UUID has been favorited
   * @param {string} favoriteId  The relative UUID of the item to check.
   * @returns {boolean}
   */
  hasFavorite(favoriteId) {
    return !!this.favorites.find(f => f.id === favoriteId);
  }

  /* -------------------------------------------- */

  /**
   * Add a favorite item to this actor.
   * If the given item is already favorite, this method has no effect.
   * @param {ActorFavorites5e} favorite  The favorite to add.
   * @returns {Promise<Actor5e>}
   * @throws If the item intended to be favorited does not belong to this actor.
   */
  addFavorite(favorite) {
    if ( this.hasFavorite(favorite.id) ) return Promise.resolve(this.parent);

    if ( favorite.id.startsWith(".") && fromUuidSync(favorite.id, { relative: this.parent }) === null ) {
      // Assume that an ID starting with a "." is a relative ID.
      throw new Error(`The item with id ${favorite.id} is not owned by actor ${this.parent.id}`);
    }

    let maxSort = 0;
    const favorites = this.favorites.map(f => {
      if ( f.sort > maxSort ) maxSort = f.sort;
      return { ...f };
    });
    favorites.push({ ...favorite, sort: maxSort + CONST.SORT_INTEGER_DENSITY });
    return this.parent.update({ "system.favorites": favorites });
  }

  /* -------------------------------------------- */

  /**
   * Removes the favorite with the given relative UUID or resource ID
   * @param {string} favoriteId  The relative UUID or resource ID of the favorite to remove.
   * @returns {Promise<Actor5e>}
   */
  removeFavorite(favoriteId) {
    if ( favoriteId.startsWith("resources.") ) return this.parent.update({ [`system.${favoriteId}.max`]: 0 });
    const favorites = this.favorites.filter(f => f.id !== favoriteId);
    return this.parent.update({ "system.favorites": favorites });
  }
}

/* -------------------------------------------- */

/**
 * Data structure for starship's attack bonuses.
 *
 * @typedef {object} AttackBonusesData
 * @property {string} attack  Numeric or dice bonus to attack rolls.
 * @property {string} damage  Numeric or dice bonus to damage rolls.
 */

/**
 * Produce the schema field for a simple trait.
 * @param {object} schemaOptions  Options passed to the outer schema.
 * @returns {AttackBonusesData}
 */
function makeAttackBonuses(schemaOptions = {}) {
  return new SchemaField(
    {
      attack: new FormulaField({ required: true, label: "SW5E.BonusAttack" }),
      damage: new FormulaField({ required: true, label: "SW5E.BonusDamage" })
    },
    schemaOptions
  );
}
