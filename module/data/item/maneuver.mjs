import SystemDataModel from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Maneuver items.
 * @mixes ItemDescriptionTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {string} maneuverTypes      Maneuver type as defined in `SW5E.maneuverTypes`.
 */
export default class ManeuverData extends SystemDataModel.mixin(
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
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeAbilityMod() {
    const type = this.maneuverType;
    const item = this?.parent;
    const actor = item?.parent;
    const abilities = actor?.system?.abilities;

    let attrs = [];
    if (type === "physical") attrs = ["str", "dex", "con"];
    else if (type === "mental") attrs = ["int", "wis", "cha"];
    else attrs = ["str", "dex", "con", "int", "wis", "cha"];

    return attrs.reduce(
      (acc, attr) => {
        const mod = abilities?.[attr]?.mod ?? -Infinity;
        if (mod > acc.mod) acc = { attr, mod };
        return acc;
      },
      { attr: "str", mod: -Infinity }
    ).attr;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeCriticalThreshold() {
    return this.parent?.actor?.flags.sw5e?.maneuverCriticalThreshold ?? Infinity;
  }
}
