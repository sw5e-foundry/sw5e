import { ItemDataModel } from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";

/**
 * Data definition for Feature items.
 * @mixes ItemDescriptionTemplate
 * @mixes ItemTypeTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {Set<string>} properties               General properties of a feature item.
 * @property {string} requirements                  Actor details required to use this feature.
 * @property {object} recharge                      Details on how a feature can roll for recharges.
 * @property {number} recharge.value                Minimum number needed to roll on a d6 to recharge this feature.
 * @property {boolean} recharge.charged             Does this feature have a charge remaining?
 * @property {object} attributes
 * @property {object} attributes.speed
 * @property {number} attributes.speed.space  Starship: Base Space speed.
 * @property {number} attributes.speed.turn   Starship: Base Turn speed.
 */
export default class FeatData extends ItemDataModel.mixin(
  ItemDescriptionTemplate,
  ItemTypeTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      type: new ItemTypeField({baseItem: false}, {label: "SW5E.ItemFeatureType"}),
      properties: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
        label: "SW5E.ItemFeatureProperties"
      }),
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
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    if ( !this.type.value ) return;
    const config = CONFIG.SW5E.featureTypes[this.type.value];
    this.type.label = this.type.subtype ? config.subtypes[this.type.subtype] : config.label;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async getFavoriteData() {
    return foundry.utils.mergeObject(await super.getFavoriteData(), {
      subtitle: [this.parent.labels.activation, this.parent.labels.recovery],
      uses: this.hasLimitedUses ? this.getUsesData() : null
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
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

  /**
   * Properties displayed on the item card.
   * @type {string[]}
   */
  get cardProperties() {
    return [this.requirements];
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get hasLimitedUses() {
    return this.isActive && (!!this.recharge.value || super.hasLimitedUses);
  }

  /* -------------------------------------------- */

  /**
   * The proficiency multiplier for this item.
   * @returns {number}
   */
  get proficiencyMultiplier() {
    return 1;
  }
}
