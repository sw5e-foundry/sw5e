import { FormulaField } from "../fields.mjs";
import SystemDataModel from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import EquippableItemTemplate from "./templates/equippable-item.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import MountableTemplate from "./templates/mountable.mjs";
import ModdableTemplate from "./templates/moddable.mjs";
import { makeItemProperties, migrateItemProperties } from "./helpers.mjs";

/**
 * Data definition for Equipment items.
 * @mixes ItemDescriptionTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 * @mixes MountableTemplate
 * @mixes ModdableTemplate
 *
 * @property {object} armor                 Armor details and equipment type information.
 * @property {string} armor.type            Equipment type as defined in `SW5E.equipmentTypes`.
 * @property {number} armor.value           Base armor class or shield bonus.
 * @property {number} armor.dex             Maximum dex bonus added to armor class.
 * @property {string} baseItem              Base armor as defined in `SW5E.armorIds` for determining proficiency.
 * @property {object} speed                 Speed granted by a piece of vehicle equipment.
 * @property {number} speed.value           Speed granted by this piece of equipment measured in feet or meters
 *                                          depending on system setting.
 * @property {string} speed.conditions      Conditions that may affect item's speed.
 * @property {number} strength              Minimum strength required to use a piece of armor.
 * @property {boolean} stealth              Does this equipment grant disadvantage on stealth checks when used?
 * @property {object} properties            Mapping of various weapon property booleans and numbers.
 * @property {number} proficient            Does the owner have proficiency in this piece of equipment?
 * @property {object} attributes
 * @property {object} attributes.capx
 * @property {number} attributes.capx.value            Starship: Multiplier for shield capacity.
 * @property {object} attributes.dmgred
 * @property {number} attributes.dmgred.value          Starship: Damage reduction.
 * @property {object} attributes.regrateco
 * @property {number} attributes.regrateco.value       Starship: Shield regeneration rate coefficient.
 * @property {object} attributes.cscap
 * @property {number} attributes.cscap.value           Starship: Central power dice storage capacity.
 * @property {object} attributes.sscap
 * @property {number} attributes.sscap.value           Starship: System power dice storage capacity.
 * @property {object} attributes.fuelcostmod
 * @property {number} attributes.fuelcostmod.value     Starship: Fuel cost modifier.
 * @property {object} attributes.powerdicerec
 * @property {string} attributes.powerdicerec.value    Starship: Formula for power die recovery.
 * @property {object} attributes.hdclass
 * @property {number} attributes.hdclass.value         Starship: Hyperdrive class.
 */
export default class EquipmentData extends SystemDataModel.mixin(
  ItemDescriptionTemplate,
  PhysicalItemTemplate,
  EquippableItemTemplate,
  ActivatedEffectTemplate,
  ActionTemplate,
  MountableTemplate,
  ModdableTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      armor: new foundry.data.fields.SchemaField(
        {
          type: new foundry.data.fields.StringField({
            required: true,
            initial: "light",
            label: "SW5E.ItemEquipmentType"
          }),
          value: new foundry.data.fields.NumberField({
            required: true,
            integer: true,
            min: 0,
            label: "SW5E.ArmorClass"
          }),
          dex: new foundry.data.fields.NumberField({ required: true, integer: true, label: "SW5E.ItemEquipmentDexMod" })
        },
        { label: "" }
      ),
      baseItem: new foundry.data.fields.StringField({ required: true, label: "SW5E.ItemEquipmentBase" }),
      speed: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.NumberField({ required: true, min: 0, label: "SW5E.Speed" }),
          conditions: new foundry.data.fields.StringField({ required: true, label: "SW5E.SpeedConditions" })
        },
        { label: "SW5E.Speed" }
      ),
      strength: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        min: 0,
        label: "SW5E.ItemRequiredStr"
      }),
      stealth: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.ItemEquipmentStealthDisav" }),
      proficient: new foundry.data.fields.NumberField({
        required: true,
        min: 0,
        max: 1,
        integer: true,
        initial: null,
        label: "SW5E.ProficiencyLevel"
      }),
      properties: makeItemProperties(CONFIG.SW5E.equipmentProperties, {
        required: true,
        label: "SW5E.ItemEquipmentProperties"
      }),

      // Starship equipment
      attributes: new foundry.data.fields.SchemaField({
        capx: new foundry.data.fields.SchemaField(
          {
            value: new foundry.data.fields.NumberField({
              nullable: true,
              min: 0
            })
          },
          { required: true, label: "SW5E.CapacityMultiplier" }
        ),
        dmgred: new foundry.data.fields.SchemaField(
          {
            value: new foundry.data.fields.NumberField({
              nullable: true,
              integer: true,
              min: 0
            })
          },
          { required: true, label: "SW5E.DmgRed" }
        ),
        regrateco: new foundry.data.fields.SchemaField(
          {
            value: new foundry.data.fields.NumberField({
              nullable: true,
              min: 0
            })
          },
          { required: true, label: "SW5E.RegenerationRateCoefficient" }
        ),
        cscap: new foundry.data.fields.SchemaField(
          {
            value: new foundry.data.fields.NumberField({
              nullable: true,
              integer: true,
              min: 0
            })
          },
          { required: true, label: "SW5E.CentStorageCapacity" }
        ),
        sscap: new foundry.data.fields.SchemaField(
          {
            value: new foundry.data.fields.NumberField({
              nullable: true,
              integer: true,
              min: 0
            })
          },
          { required: true, label: "SW5E.SysStorageCapacity" }
        ),
        fuelcostsmod: new foundry.data.fields.SchemaField(
          {
            value: new foundry.data.fields.NumberField({
              nullable: true,
              min: 0
            })
          },
          { required: true, label: "SW5E.FuelCostsMod" }
        ),
        powerdicerec: new foundry.data.fields.SchemaField(
          { value: new FormulaField({}) },
          { label: "SW5E.PowerDiceRecovery" }
        ),
        hdclass: new foundry.data.fields.SchemaField(
          {
            value: new foundry.data.fields.NumberField({
              nullable: true,
              min: 0,
              max: 15
            })
          },
          { required: true, label: "SW5E.SysStorageCapacity" }
        )
      })
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    EquipmentData.#migrateArmor(source);
    EquipmentData.#migrateStrength(source);
    EquipmentData.#migrateProficient(source);
    EquipmentData.#migrateStarshipData(source);
    migrateItemProperties(source.properties, CONFIG.SW5E.equipmentProperties);
  }

  /* -------------------------------------------- */

  /**
   * Apply migrations to the armor field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateArmor(source) {
    if (!("armor" in source)) return;
    source.armor ??= {};
    if (source.armor.type === "bonus") source.armor.type = "trinket";
    if (typeof source.armor.dex === "string") {
      const dex = source.armor.dex;
      if (dex === "") source.armor.dex = null;
      else if (Number.isNumeric(dex)) source.armor.dex = Number(dex);
    }
  }

  /* -------------------------------------------- */

  /**
   * Ensure blank strength values are migrated to null, and string values are converted to numbers.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateStrength(source) {
    if (typeof source.strength !== "string") return;
    if (source.strength === "") source.strength = null;
    if (Number.isNumeric(source.strength)) source.strength = Number(source.strength);
  }

  /* -------------------------------------------- */

  /**
   * Ensure starship attributes are stored in the correct place.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateStarshipData(source) {
    const starshipAttrs = ["capx", "dmgred", "regrateco", "cscap", "sscap", "fuelcostmod", "powerdicerec", "hdclass"];

    source.attributes ??= {};
    for (const attr of starshipAttrs) {
      if (source[attr]) {
        source.attributes[attr] = source[attr];
        delete source[attr];
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate the proficient field to convert boolean values.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateProficient(source) {
    if ( typeof source.proficient === "boolean" ) source.proficient = Number(source.proficient);
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [
      CONFIG.SW5E.equipmentTypes[this.armor.type],
      this.parent.labels?.armor ?? null,
      this.stealth ? game.i18n.localize("SW5E.StealthDisadvantage") : null
    ];
  }

  /* -------------------------------------------- */

  /**
   * Is this Item any of the armor subtypes?
   * @type {boolean}
   */
  get isArmor() {
    return this.armor.type in CONFIG.SW5E.armorTypes;
  }

  /* -------------------------------------------- */

  /**
   * Is this item a separate large object like a siege engine or vehicle component that is
   * usually mounted on fixtures rather than equipped, and has its own AC and HP?
   * @type {boolean}
   */
  get isMountable() {
    return this.armor.type === "vehicle";
  }

  /* -------------------------------------------- */

  /**
   * The proficiency multiplier for this item.
   * @returns {number}
   */
  get proficiencyMultiplier() {
    if ( Number.isFinite(this.proficient) ) return this.proficient;
    const actor = this.parent.actor;
    if ( !actor ) return 0;
    if ( actor.type === "npc" ) return 1; // NPCs are always considered proficient with any armor in their stat block.
    const config = CONFIG.SW5E.armorProficienciesMap;
    const itemProf = config[this.armor?.type];
    const actorProfs = actor.system.traits?.armorProf?.value ?? new Set();
    const isProficient = (itemProf === true) || actorProfs.has(itemProf) || actorProfs.has(this.baseItem);
    return Number(isProficient);
  }

  /* -------------------------------------------- */

  /**
   * Is this a starship item.
   * @type {boolean}
   */
  get isStarshipItem() {
    return (this.armor.type in CONFIG.SW5E.ssEquipmentTypes) || this.armor.type === "starship"
  }
}
