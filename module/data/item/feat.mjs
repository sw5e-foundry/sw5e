import SystemDataModel from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Feature items.
 * @mixes ItemDescriptionTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {object} type
 * @property {string} type.value         Category to which this feature belongs.
 * @property {string} type.subtype       Feature subtype according to its category.
 * @property {string} requirements       Actor details required to use this feature.
 * @property {object} recharge           Details on how a feature can roll for recharges.
 * @property {number} recharge.value     Minimum number needed to roll on a d6 to recharge this feature.
 * @property {boolean} recharge.charged  Does this feature have a charge remaining?
 * @property {object} attributes
 * @property {object} attributes.speed
 * @property {number} attributes.speed.space  Starship: Base Space speed.
 * @property {number} attributes.speed.turn   Starship: Base Turn speed.
 */
export default class FeatData extends SystemDataModel.mixin(
  ItemDescriptionTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      type: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.StringField({ required: true, label: "SW5E.Type" }),
          subtype: new foundry.data.fields.StringField({ required: true, label: "SW5E.Subtype" })
        },
        { label: "SW5E.ItemFeatureType" }
      ),
      requirements: new foundry.data.fields.StringField({ required: true, nullable: true, label: "SW5E.Requirements" }),
      recharge: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.NumberField({
            required: true,
            integer: true,
            min: 1,
            label: "SW5E.FeatureRechargeOn"
          }),
          charged: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.Charged" })
        },
        { label: "SW5E.FeatureActionRecharge" }
      ),
      // Starship features
      attributes: new foundry.data.fields.SchemaField({
        speed: new foundry.data.fields.SchemaField(
          {
            space: new foundry.data.fields.NumberField({
              required: true,
              nullable: true,
              integer: true,
              initial: 300,
              min: 0,
              label: "SW5E.BaseSpaceSpeed"
            }),
            turn: new foundry.data.fields.NumberField({
              required: true,
              nullable: true,
              integer: true,
              initial: 250,
              min: 0,
              label: "SW5E.BaseTurnSpeed"
            })
          },
          { required: true }
        )
      })
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
    FeatData.#migrateType(source);
    FeatData.#migrateRecharge(source);
  }

  /* -------------------------------------------- */

  /**
   * Ensure feats have a type object.
   * @param {object} source The candidate source data from which the model will be constructed.
   */
  static #migrateType(source) {
    if (!("type" in source)) return;
    if (!source.type) source.type = { value: "", subtype: "" };
  }

  /* -------------------------------------------- */

  /**
   * Migrate 0 values to null.
   * @param {object} source The candidate source data from which the model will be constructed.
   */
  static #migrateRecharge(source) {
    if (!("recharge" in source)) return;
    const value = source.recharge.value;
    if (value === 0 || value === "") source.recharge.value = null;
    else if (typeof value === "string" && Number.isNumeric(value)) source.recharge.value = Number(value);
    if (source.recharge.charged === null) source.recharge.charged = false;
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [this.requirements];
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get hasLimitedUses() {
    return !!this.recharge.value || super.hasLimitedUses;
  }
}
