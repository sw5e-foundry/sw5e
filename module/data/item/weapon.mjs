import SystemDataModel from "../abstract.mjs";
import { MappingField } from "../fields.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import EquippableItemTemplate from "./templates/equippable-item.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import MountableTemplate from "./templates/mountable.mjs";
import makeItemProperties from "./helpers.mjs";

/**
 * Data definition for Weapon items.
 * @mixes ItemDescriptionTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 * @mixes MountableTemplate
 *
 * @property {string} weaponType   Weapon category as defined in `SW5E.weaponTypes`.
 * @property {string} baseItem     Base weapon as defined in `SW5E.weaponIds` for determining proficiency.
 * @property {object} properties   Mapping of various equipment property booleans and numbers.
 * @property {boolean} proficient  Does the weapon's owner have proficiency?
 */
export default class WeaponData extends SystemDataModel.mixin(
  ItemDescriptionTemplate,
  PhysicalItemTemplate,
  EquippableItemTemplate,
  ActivatedEffectTemplate,
  ActionTemplate,
  MountableTemplate
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
      properties: makeItemProperties(CONFIG.SW5E.weaponProperties, {
        required: true,
        label: "SW5E.ItemWeaponProperties"
      }),
      proficient: new foundry.data.fields.BooleanField({ required: true, initial: true, label: "SW5E.Proficient" })
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
    WeaponData.#migrateProficient(source);
    WeaponData.#migrateWeaponType(source);
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
    if (source.weaponType === null) source.weaponType = "simpleM";
  }
}
