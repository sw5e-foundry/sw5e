import SystemDataModel from "../abstract.mjs";
import { FormulaField, MappingField } from "../fields.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Power items.
 * @mixes ItemDescriptionTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {string} modificationType      Modification type as defined in `SW5E.maneuverTypes`.
 */
export default class PowerData extends SystemDataModel.mixin(
  ItemDescriptionTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      maneuverType: new foundry.data.fields.StringField({
        required: true,
        initial: "general",
        label: "SW5E.ItemManeuverType"
      })
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
    PowerData.#migrateComponentData(source);
    PowerData.#migrateScaling(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the power's component object to remove any old, non-boolean values.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateComponentData(source) {
    if (!source.components) return;
    for (const [key, value] of Object.entries(source.components)) {
      if (typeof value !== "boolean") delete source.components[key];
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate power scaling.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateScaling(source) {
    if (!("scaling" in source)) return;
    if (source.scaling.mode === "" || source.scaling.mode === null) source.scaling.mode = "none";
  }
}
