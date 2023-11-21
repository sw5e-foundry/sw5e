import SystemDataModel from "../../abstract.mjs";

/**
 * Data model template with information on moddable items.
 *
 * @property {object} modify
 * @property {string} modify.chassis      Item's chassis type, as defined in `SW5E.chassisTypes`.
 * @property {number} modify.augmentSlots Number of available augment slots.
 * @property {number} modify.modSlots     Number of available modification slots.
 * @property {Array<object>} items        Copy of each installed modification.
 * @property {object} changes             Precalculated 'overrides' object to apply modification changes.
 * @mixin
 */
export default class ModdableTemplate extends SystemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      modify: new foundry.data.fields.SchemaField(
        {
          chassis: new foundry.data.fields.StringField({
            required: true,
            initial: "none",
            label: "SW5E.ItemChassisType"
          }),
          augmentSlots: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            initial: 0,
            min: 0,
            label: "SW5E.ItemChassisAugmentCount"
          }),
          modSlots: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            initial: 4,
            min: 0,
            label: "SW5E.ItemChassisModCount"
          }),
          items: new foundry.data.fields.ArrayField(new foundry.data.fields.ObjectField(), { required: true }),
          changes: new foundry.data.fields.ObjectField({ required: true })
        }, {}
      )
    };
  }
}
