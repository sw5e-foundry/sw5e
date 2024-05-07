import { ItemDataModel } from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import EquippableItemTemplate from "./templates/equippable-item.mjs";
import IdentifiableTemplate from "./templates/identifiable.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import MountableTemplate from "./templates/mountable.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Equipment items.
 * @mixes ItemDescriptionTemplate
 * @mixes ItemTypeTemplate
 * @mixes IdentifiableTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 * @mixes MountableTemplate
 *
 * @property {object} armor               Armor details and equipment type information.
 * @property {number} armor.value         Base armor class or shield bonus.
 * @property {number} armor.dex           Maximum dex bonus added to armor class.
 * @property {number} armor.magicalBonus  Bonus added to AC from the armor's magical nature.
 * @property {object} speed               Speed granted by a piece of vehicle equipment.
 * @property {number} speed.value         Speed granted by this piece of equipment measured in feet or meters
 *                                        depending on system setting.
 * @property {string} speed.conditions    Conditions that may affect item's speed.
 * @property {number} strength            Minimum strength required to use a piece of armor.
 * @property {number} proficient          Does the owner have proficiency in this piece of equipment?
 */
export default class EquipmentData extends ItemDataModel.mixin(
  ItemDescriptionTemplate, IdentifiableTemplate, ItemTypeTemplate, PhysicalItemTemplate, EquippableItemTemplate,
  ActivatedEffectTemplate, ActionTemplate, MountableTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      type: new ItemTypeField({value: "light", subtype: false}, {label: "SW5E.ItemEquipmentType"}),
      armor: new SchemaField({
        value: new NumberField({required: true, integer: true, min: 0, label: "SW5E.ArmorClass"}),
        magicalBonus: new NumberField({min: 0, integer: true, label: "SW5E.MagicalBonus"}),
        dex: new NumberField({required: true, integer: true, label: "SW5E.ItemEquipmentDexMod"})
      }),
      properties: new SetField(new StringField(), {
        label: "SW5E.ItemEquipmentProperties"
      }),
      speed: new SchemaField({
        value: new NumberField({required: true, min: 0, label: "SW5E.Speed"}),
        conditions: new StringField({required: true, label: "SW5E.SpeedConditions"})
      }, {label: "SW5E.Speed"}),
      strength: new NumberField({
        required: true, integer: true, min: 0, label: "SW5E.ItemRequiredStr"
      }),
      proficient: new NumberField({
        required: true, min: 0, max: 1, integer: true, initial: null, label: "SW5E.ProficiencyLevel"
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
    EquipmentData.#migrateType(source);
    EquipmentData.#migrateStrength(source);
    EquipmentData.#migrateProficient(source);
  }

  /* -------------------------------------------- */

  /**
   * Apply migrations to the armor field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateArmor(source) {
    if ( !("armor" in source) ) return;
    source.armor ??= {};
    if ( (typeof source.armor.dex === "string") ) {
      const dex = source.armor.dex;
      if ( dex === "" ) source.armor.dex = null;
      else if ( Number.isNumeric(dex) ) source.armor.dex = Number(dex);
    }
  }

  /* -------------------------------------------- */

  /**
   * Apply migrations to the type field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateType(source) {
    if ( !("type" in source) ) return;
    if ( source.type.value === "bonus" ) source.type.value = "trinket";
  }

  /* -------------------------------------------- */

  /**
   * Ensure blank strength values are migrated to null, and string values are converted to numbers.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateStrength(source) {
    if ( typeof source.strength !== "string" ) return;
    if ( source.strength === "" ) source.strength = null;
    if ( Number.isNumeric(source.strength) ) source.strength = Number(source.strength);
  }

  /* -------------------------------------------- */

  /**
   * Migrates stealth disadvantage boolean to properties.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static _migrateStealth(source) {
    if ( foundry.utils.getProperty(source, "system.stealth") === true ) {
      foundry.utils.setProperty(source, "flags.sw5e.migratedProperties", ["stealthDisadvantage"]);
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
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.armor.value = (this._source.armor.value ?? 0) + (this.magicAvailable ? (this.armor.magicalBonus ?? 0) : 0);
    this.type.label = CONFIG.SW5E.equipmentTypes[this.type.value]
      ?? game.i18n.localize(CONFIG.Item.typeLabels.equipment);
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async getFavoriteData() {
    return foundry.utils.mergeObject(await super.getFavoriteData(), {
      subtitle: [this.type.label, this.parent.labels.activation],
      uses: this.hasLimitedUses ? this.getUsesData() : null
    });
  }

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [
      this.type.label,
      (this.isArmor || this.isMountable) ? (this.parent.labels?.armor ?? null) : null,
      this.properties.has("stealthDisadvantage") ? game.i18n.localize("SW5E.Item.Property.StealthDisadvantage") : null
    ];
  }

  /* -------------------------------------------- */

  /**
   * Properties displayed on the item card.
   * @type {string[]}
   */
  get cardProperties() {
    return [
      (this.isArmor || this.isMountable) ? (this.parent.labels?.armor ?? null) : null,
      this.properties.has("stealthDisadvantage") ? game.i18n.localize("SW5E.Item.Property.StealthDisadvantage") : null
    ];
  }

  /* -------------------------------------------- */

  /**
   * Is this Item any of the armor subtypes?
   * @type {boolean}
   */
  get isArmor() {
    return this.type.value in CONFIG.SW5E.armorTypes;
  }

  /* -------------------------------------------- */

  /**
   * Is this item a separate large object like a siege engine or vehicle component that is
   * usually mounted on fixtures rather than equipped, and has its own AC and HP?
   * @type {boolean}
   */
  get isMountable() {
    return this.type.value === "vehicle";
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
    const itemProf = config[this.type.value];
    const actorProfs = actor.system.traits?.armorProf?.value ?? new Set();
    const isProficient = (itemProf === true) || actorProfs.has(itemProf) || actorProfs.has(this.type.baseItem);
    return Number(isProficient);
  }

  /* -------------------------------------------- */

  /**
   * Does this armor impose disadvantage on stealth checks?
   * @type {boolean}
   * @deprecated since SW5e 3.0, available until SW5e 3.2
   */
  get stealth() {
    foundry.utils.logCompatibilityWarning(
      "The `system.stealth` value on equipment has migrated to the 'stealthDisadvantage' property.",
      { since: "SW5e 3.0", until: "SW5e 3.2" }
    );
    return this.properties.has("stealthDisadvantage");
  }
}
