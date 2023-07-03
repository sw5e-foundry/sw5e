import { MappingField } from "../fields.mjs";
import PowerConfigurationData from "./power-config.mjs";

export default class ItemChoiceConfigurationData extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      hint: new foundry.data.fields.StringField({label: "SW5E.AdvancementHint"}),
      choices: new MappingField(new foundry.data.fields.NumberField(), {
        hint: "SW5E.AdvancementItemChoiceLevelsHint"
      }),
      allowDrops: new foundry.data.fields.BooleanField({
        initial: true, label: "SW5E.AdvancementConfigureAllowDrops",
        hint: "SW5E.AdvancementConfigureAllowDropsHint"
      }),
      type: new foundry.data.fields.StringField({
        blank: false, nullable: true, initial: null,
        label: "SW5E.AdvancementItemChoiceType", hint: "SW5E.AdvancementItemChoiceTypeHint"
      }),
      pool: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), {label: "DOCUMENT.Items"}),
      power: new foundry.data.fields.EmbeddedDataField(PowerConfigurationData, {nullable: true, initial: null}),
      restriction: new foundry.data.fields.SchemaField({
        type: new foundry.data.fields.StringField({label: "SW5E.Type"}),
        subtype: new foundry.data.fields.StringField({label: "SW5E.Subtype"}),
        level: new foundry.data.fields.StringField({label: "SW5E.PowerLevel"})
      })
    };
  }
}
