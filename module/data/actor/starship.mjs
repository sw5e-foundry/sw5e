import { FormulaField, MappingField, UUIDField, LocalDocumentField } from "../fields.mjs";
import AttributesFields from "./templates/attributes.mjs";
import CommonTemplate from "./templates/common.mjs";
import DetailsFields from "./templates/details.mjs";
import TraitsFields from "./templates/traits.mjs";

/**
 * System data definition for Vehicles.
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
  static _systemType = "starship";

  /* -------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      attributes: new foundry.data.fields.SchemaField(
        {
          ...AttributesFields.common,
          ac: new foundry.data.fields.SchemaField(
            {
              flat: new foundry.data.fields.NumberField({ integer: true, min: 0, label: "SW5E.ArmorClassFlat" }),
              calc: new foundry.data.fields.StringField({ initial: "starship", label: "SW5E.ArmorClassCalculation" }),
              formula: new FormulaField({ deterministic: true, label: "SW5E.ArmorClassFormula" })
            },
            { label: "SW5E.ArmorClass" }
          ),
          hp: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.NumberField({
                nullable: true,
                integer: true,
                min: 0,
                initial: null,
                label: "SW5E.HullPointsCurrent"
              }),
              max: new foundry.data.fields.NumberField({
                nullable: true,
                integer: true,
                min: 0,
                initial: null,
                label: "SW5E.HullPointsOverride"
              }),
              temp: new foundry.data.fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
                label: "SW5E.ShieldPoints"
              }),
              tempmax: new foundry.data.fields.NumberField({
                integer: true,
                nullable: true,
                initial: null,
                label: "SW5E.ShieldPointsMax"
              }),
              bonuses: new foundry.data.fields.SchemaField({
                level: new FormulaField({ deterministic: true, label: "SW5E.HullPointsBonusLevel" }),
                overall: new FormulaField({ deterministic: true, label: "SW5E.HullPointsBonusOverall" }),
                templevel: new FormulaField({ deterministic: true, label: "SW5E.ShieldPointsBonusLevel" }),
                tempoverall: new FormulaField({ deterministic: true, label: "SW5E.ShieldPointsBonusOverall" })
              })
            },
            { label: "SW5E.HullPoints" }
          ),
          death: new foundry.data.fields.SchemaField(
            {
              success: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.DestructionSaveSuccesses"
              }),
              failure: new foundry.data.fields.NumberField({
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
          systemDamage: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.SystemDamage"
          }),
          deployment: new foundry.data.fields.SchemaField({
            pilot: new foundry.data.fields.SchemaField({
              value: new UUIDField({ label: "SW5E.DeployedPilot", nullable: true }),
              active: new foundry.data.fields.BooleanField()
            }),
            crew: new foundry.data.fields.SchemaField({
              items: new foundry.data.fields.SetField(new UUIDField({ label: "SW5E.DeployedCrew", nullable: true })),
              active: new foundry.data.fields.BooleanField()
            }),
            passenger: new foundry.data.fields.SchemaField({
              items: new foundry.data.fields.SetField(new UUIDField({ label: "SW5E.DeployedPassenger", nullable: true })),
              active: new foundry.data.fields.BooleanField()
            }),
            active: new foundry.data.fields.SchemaField({
              value: new UUIDField({ label: "SW5E.DeployedActive", nullable: true })
            })
          }),
          fuel: new foundry.data.fields.SchemaField({
            value: new foundry.data.fields.NumberField({
              required: true,
              nullable: false,
              integer: true,
              min: 0,
              initial: 0
            })
          }),
          power: new foundry.data.fields.SchemaField({
            routing: new foundry.data.fields.StringField({
              required: true,
              nullable: false,
              initial: "none"
            }),
            central: new foundry.data.fields.SchemaField({
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            comms: new foundry.data.fields.SchemaField({
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            engines: new foundry.data.fields.SchemaField({
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            shields: new foundry.data.fields.SchemaField({
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            sensors: new foundry.data.fields.SchemaField({
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            }),
            weapons: new foundry.data.fields.SchemaField({
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0
              })
            })
          }),
          used: new foundry.data.fields.BooleanField()
        },
        { label: "SW5E.Attributes" }
      ),
      details: new foundry.data.fields.SchemaField(
        {
          ...DetailsFields.common,
          source: new foundry.data.fields.StringField({ required: true, label: "SW5E.Source" }),
          starshipsize: new LocalDocumentField(foundry.documents.BaseItem, {
            required: true, fallback: true, label: "SW5E.StarshipSize"
          })
        },
        { label: "SW5E.Details"
        }),
      skills: new MappingField(
        new foundry.data.fields.SchemaField({
          value: new foundry.data.fields.NumberField({ required: true, initial: 0, label: "SW5E.ProficiencyLevel" }),
          ability: new foundry.data.fields.StringField({ required: true, initial: "dex", label: "SW5E.Ability" }),
          bonuses: new foundry.data.fields.SchemaField(
            {
              check: new FormulaField({ required: true, label: "SW5E.SkillBonusCheck" }),
              passive: new FormulaField({ required: true, label: "SW5E.SkillBonusPassive" })
            },
            { label: "SW5E.SkillBonuses" }
          )
        }),
        { initialKeys: CONFIG.SW5E.starshipSkills, initialValue: this.#initialSkillValue }
      ),
      traits: new foundry.data.fields.SchemaField(
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
      )
    });
  }

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
}
