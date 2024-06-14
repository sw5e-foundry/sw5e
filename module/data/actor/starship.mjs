import HullDice from "../../documents/actor/hull-dice.mjs";
import ShieldDice from "../../documents/actor/shield-dice.mjs";
import { simplifyBonus, fromUuidSynchronous } from "../../utils.mjs";
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
  }, { inplace: false }));

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
        {
          label: "SW5E.Details"
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

  /** @inheritdoc */
  prepareBaseData() {

    // Determine starship's proficiency bonus based on active deployed crew member
    this.attributes.prof = 0;
    const active = this.attributes.deployment.active;
    const actor = fromUuidSynchronous(active.value);
    if (actor?.system?.details?.ranks) this.attributes.prof = actor.system.attributes?.prof ?? 0;

    // Determine Starship size-based properties based on owned Starship item
    const sizeData = this.itemTypes.starshipsize[0]?.system ?? {};
    const hugeOrGrg = ["huge", "grg"].includes(sizeData.size);
    const tiers = parseInt(sizeData.tier ?? 0);

    this.traits.size = sizeData.size ?? "med"; // Needs to be the short code
    this.details.tier = tiers;

    this.attributes.cost = {
      baseBuild: sizeData.buildBaseCost ?? 0,
      baseUpgrade: CONFIG.SW5E.ssBaseUpgradeCost[tiers],
      multEquip: sizeData.equipCostMult ?? 1,
      multModification: sizeData.modCostMult ?? 1,
      multUpgrade: sizeData.upgrdCostMult ?? 1
    };

    this.attributes.equip = {
      size: {
        cargoCap: sizeData.cargoCap ?? 0,
        crewMinWorkforce: parseInt(sizeData.crewMinWorkforce ?? 1),
        foodCap: sizeData.foodCap ?? 0
      }
    };

    this.attributes.fuel.cost = sizeData.fuelCost ?? 0;
    this.attributes.fuel.fuelCap = sizeData.fuelCap ?? 0;

    this.attributes.hull = new HullDice(this.parent);
    /* Make this data availble in HullDice

    const hullmax = (sizeData.hullDiceStart ?? 0) + ((hugeOrGrg ? 2 : 1) * tiers);
    this.attributes.hull = {
      die: sizeData.hullDice ?? "d1",
      dicemax: hullmax,
      dice: hullmax - parseInt(sizeData.hullDiceUsed ?? 0)
    };
    */

    this.attributes.shld = new ShieldDice(this.parent);
    /* Make this data availble in ShieldDice

    const shldmax = (sizeData.shldDiceStart ?? 0) + ((hugeOrGrg ? 2 : 1) * tiers);
    this.attributes.shld = {
      die: sizeData.shldDice ?? "d1",
      dicemax: shldmax,
      dice: shldmax - parseInt(sizeData.shldDiceUsed ?? 0)
    };
    */

    this.attributes.mods = {
      cap: { max: sizeData.modBaseCap ?? 0 },
      suite: { max: sizeData.modMaxSuitesBase ?? 0 },
      hardpoint: { max: 0 }
    };

    this.attributes.power.die = CONFIG.SW5E.powerDieTypes[tiers];

    this.attributes.workforce = {
      minBuild: sizeData.buildMinWorkforce ?? 0,
      minEquip: sizeData.equipMinWorkforce ?? 0,
      minModification: sizeData.modMinWorkforce ?? 0,
      minUpgrade: sizeData.upgrdMinWorkforce ?? 0
    };
    this.attributes.workforce.max = this.attributes.workforce.minBuild * 5;

    // Determine Starship armor-based properties based on owned Starship item
    const armorData = this.getEquipment("starship", { equipped: true })?.[0]?.system ?? {};
    this.attributes.equip.armor = {
      dr: parseInt(armorData.attributes?.dmgred?.value ?? 0),
      maxDex: armorData.armor?.dex ?? 99,
      stealthDisadv: armorData.stealth ?? false
    };

    // Determine Starship hyperdrive-based properties based on owned Starship item
    const hyperdriveData = this.getEquipment("hyper", { equipped: true })?.[0]?.system ?? {};
    this.attributes.equip.hyperdrive = {
      class: parseFloat(hyperdriveData.attributes?.hdclass?.value ?? null)
    };

    // Determine Starship power coupling-based properties based on owned Starship item
    const pwrcplData = this.getEquipment("powerc", { equipped: true })?.[0]?.system ?? {};
    this.attributes.equip.powerCoupling = {
      centralCap: parseInt(pwrcplData.attributes?.cscap?.value ?? 0),
      systemCap: parseInt(pwrcplData.attributes?.sscap?.value ?? 0)
    };

    this.attributes.power.central.max = 0;
    this.attributes.power.comms.max = 0;
    this.attributes.power.engines.max = 0;
    this.attributes.power.shields.max = 0;
    this.attributes.power.sensors.max = 0;
    this.attributes.power.weapons.max = 0;

    // Determine Starship reactor-based properties based on owned Starship item
    const reactorData = this.getEquipment("reactor", { equipped: true })?.[0]?.system ?? {};
    this.attributes.equip.reactor = {
      fuelMult: parseFloat(reactorData.attributes?.fuelcostsmod?.value ?? 1),
      powerRecDie: reactorData.attributes?.powerdicerec?.value ?? "1d1"
    };

    // Determine Starship shield-based properties based on owned Starship item
    const shieldData = this.getEquipment("ssshield", { equipped: true })?.[0]?.system ?? {};
    this.attributes.equip.shields = {
      capMult: parseFloat(shieldData.attributes?.capx?.value ?? 0),
      regenRateMult: parseFloat(shieldData.attributes?.regrateco?.value ?? 0)
    };

    // Inherit deployed pilot's proficiency in piloting
    const pilot = fromUuidSynchronous(this.attributes.deployment.pilot.value);
    if (pilot) this.skills.man.value = Math.max(this.skills.man.value, pilot.system.skills.pil.value);
  }

  /* -------------------------------------------- */

  // TODO: Update this for starships
  /**
   * Prepare movement & senses values derived from species item.
   */
  prepareEmbeddedData() {
    if (this.details.species instanceof Item) {
      AttributesFields.prepareSpecies.call(this, this.details.species);
      this.details.type = this.details.species.system.type;
    } else {
      this.details.type = new CreatureTypeField({ swarm: false }).initialize({ value: "humanoid" }, this);
    }
    for (const key of Object.keys(CONFIG.SW5E.movementTypes)) this.attributes.movement[key] ??= 0;
    for (const key of Object.keys(CONFIG.SW5E.senses)) this.attributes.senses[key] ??= 0;
    this.attributes.movement.units ??= Object.keys(CONFIG.SW5E.movementUnits)[0];
    this.attributes.senses.units ??= Object.keys(CONFIG.SW5E.movementUnits)[0];
  }

  /* -------------------------------------------- */

  // TODO: Update this for starships
  /**
   * Prepare remaining starship data.
   */
  prepareDerivedData() {
    const rollData = this.parent.getRollData({ deterministic: true });
    const { originalSaves } = this.parent.getOriginalStats();

    this.prepareAbilities({ rollData, originalSaves });
    AttributesFields.prepareMovement.call(this);
    TraitsFields.prepareResistImmune.call(this);

    // Hull/Shield Points
    const hspOptions = {};
    if (this.attributes.hp.max === null) {
      hspOptions.hullAdvancement = Object.values(this.parent.starshipsizes)
        .map(c => c.advancement.byType.hullPoints?.[0]).filter(a => a);
      hspOptions.hullBonus = (simplifyBonus(this.attributes.hp.bonuses.level, rollData) * this.details.tier)
        + simplifyBonus(this.attributes.hp.bonuses.overall, rollData);
      hspOptions.hullMod = this.abilities[CONFIG.SW5E.defaultAbilities.hullPoints ?? "str"]?.mod ?? 0;
      hspOptions.shieldAdvancement = Object.values(this.parent.starshipsizes)
        .map(c => c.advancement.byType.shieldPoints?.[0]).filter(a => a);
      hspOptions.shieldBonus = (simplifyBonus(this.attributes.hp.bonuses.templevel, rollData) * this.details.tier)
        + simplifyBonus(this.attributes.hp.bonuses.tempoverall, rollData);
      hspOptions.shieldMod = this.abilities[CONFIG.SW5E.defaultAbilities.shieldPoints ?? "con"]?.mod ?? 0;
      hspOptions.shieldCapMult = this.attributes.equip.shields.capMult;
    }
    AttributesFields.prepareHullShieldPoints.call(this, this.attributes.hp, hspOptions);
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
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
    if (this.hasFavorite(favorite.id)) return Promise.resolve(this.parent);

    if (favorite.id.startsWith(".") && fromUuidSync(favorite.id, { relative: this.parent }) === null) {
      // Assume that an ID starting with a "." is a relative ID.
      throw new Error(`The item with id ${favorite.id} is not owned by actor ${this.parent.id}`);
    }

    let maxSort = 0;
    const favorites = this.favorites.map(f => {
      if (f.sort > maxSort) maxSort = f.sort;
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
    if (favoriteId.startsWith("resources.")) return this.parent.update({ [`system.${favoriteId}.max`]: 0 });
    const favorites = this.favorites.filter(f => f.id !== favoriteId);
    return this.parent.update({ "system.favorites": favorites });
  }
  /* -------------------------------------------- */

  /**
   * Get a list of all equipment of a certain type.
   * @param {string} type         The type of equipment to return, empty for all.
   * @param {boolean} [equipped]  Ignore non-equipped items
   * @type {object}               Array of items of that type
   */
  getEquipment(type, { equipped = false } = {}) {
    return this.itemTypes.equipment.filter(
      item => type === item.system.armor.type && (!equipped || item.system.equipped)
    );
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
