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
 * Data definition for Weapon items.
 * @mixes ItemDescriptionTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 * @mixes MountableTemplate
 * @mixes ModdableTemplate
 *
 * @property {string} weaponType          Weapon category as defined in `SW5E.weaponTypes`.
 * @property {string} baseItem            Base weapon as defined in `SW5E.weaponIds` for determining proficiency.
 * @property {object} ammo
 * @property {string} ammo.target         Id of the selected ammo item.
 * @property {string} ammo.value          Current ammount of loaded ammo.
 * @property {string} ammo.use            Ammount of ammo spent per shot.
 * @property {Array<string>} ammo.types   Types of ammo this ammo can accept.
 * @property {object} properties          Mapping of various equipment property booleans and numbers.
 * @property {boolean} proficient         Does the weapon's owner have proficiency?
 */
export default class WeaponData extends SystemDataModel.mixin(
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
      weaponType: new foundry.data.fields.StringField({
        required: true,
        initial: "simpleM",
        label: "SW5E.ItemWeaponType"
      }),
      baseItem: new foundry.data.fields.StringField({ required: true, blank: true, label: "SW5E.ItemWeaponBase" }),
      ammo: new foundry.data.fields.SchemaField(
        {
          target: new foundry.data.fields.StringField({
            required: true,
            nullable: true,
            label: "SW5E.WeaponAmmoSelected"
          }),
          value: new foundry.data.fields.NumberField({
            required: true,
            nullable: true,
            label: "SW5E.WeaponAmmoLoaded"
          }),
          use: new foundry.data.fields.NumberField({ required: true, nullable: true, label: "SW5E.WeaponAmmoUse" }),
          types: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), {
            required: true,
            initial: ["powerCell"],
            label: "SW5E.WeaponAmmoValid"
          })
        },
        {}
      ),
      properties: makeItemProperties(CONFIG.SW5E.weaponProperties, {
        required: true,
        label: "SW5E.ItemWeaponProperties"
      }),
      proficient: new foundry.data.fields.BooleanField({ required: true, initial: true, label: "SW5E.Proficient" })
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
    WeaponData.#migrateProficient(source);
    WeaponData.#migrateWeaponType(source);
    migrateItemProperties(source.properties, CONFIG.SW5E.weaponProperties);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the proficient field to remove non-boolean values.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateProficient(source) {
    if (typeof source.proficient === "number") source.proficient = Boolean(source.proficient);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the weapon type.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateWeaponType(source) {
    if (source.weaponType === null) source.weaponType = "simpleVW";
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [CONFIG.SW5E.weaponTypes[this.weaponType]];
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeAbilityMod() {
    if (["simpleB", "martialB"].includes(this.weaponType)) return "dex";

    const abilities = this.parent?.actor?.system.abilities;
    if (this.properties.fin && abilities) {
      return (abilities.dex?.mod ?? 0) >= (abilities.str?.mod ?? 0) ? "dex" : "str";
    }

    return null;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeCriticalThreshold() {
    return this.parent?.actor?.flags.sw5e?.weaponCriticalThreshold ?? Infinity;
  }

  /* -------------------------------------------- */

  /**
   * Is this item a separate large object like a siege engine or vehicle component that is
   * usually mounted on fixtures rather than equipped, and has its own AC and HP?
   * @type {boolean}
   */
  get isMountable() {
    return this.weaponType === "siege";
  }
}
