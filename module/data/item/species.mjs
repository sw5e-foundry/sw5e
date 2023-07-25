import SystemDataModel from "../abstract.mjs";
import { AdvancementField, IdentifierField } from "../fields.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Species items.
 * @mixes ItemDescriptionTemplate
 *
 * @property {string} identifier        Identifier slug for this class.
 * @property {object[]} advancement     Advancement objects for this species.
 */
export default class SpeciesData extends SystemDataModel.mixin(ItemDescriptionTemplate) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      identifier: new IdentifierField({ required: true, label: "SW5E.Identifier" }),
      advancement: new foundry.data.fields.ArrayField(new AdvancementField(), { label: "SW5E.AdvancementTitle" }),
      details: new foundry.data.fields.SchemaField(
        {
          isDroid: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.IsDroid" })
        },
        { label: "SW5E.Details" }
      ),

      // non-droid visual characteristics
      skinColorOptions: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.skinColorOptions" }),
      }),
      hairColorOptions: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.hairColorOptions" }),
      }),
      eyeColorOptions: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.eyeColorOptions" }),
      }),
      distinctions: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.distinctions" }),
      }),

      // droid visual characteristics
      colorScheme: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.ColorScheme" }),
      }),
      droidDistinctions: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.DroidDistinctions" }),
      }),

      // physical characteristics
      heightAverage: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.HeightAverage" }),
      }),
      heightRollMod: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.HeightRollMod" }),
      }),
      weightAverage: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.WeightAverage" }),
      }),
      weightRollMod: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.WeightRollMod" }),
      }),

      // non-droid sociocultural characteristics
      homeworld: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.homeworld" }),
      }),
      slanguage: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.slanguage" }),
      }),

      // droid sociocultural characteristics
      manufacturer: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.manufacturer" }),
      }),
      droidLanguage: new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.StringField({ required: true, label: "SW5E.slanguage" }),
      })
    });
  }
}
