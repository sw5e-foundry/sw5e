import PowerConfigurationData from "./power-config.mjs";

export default class ItemGrantConfigurationData extends foundry.abstract.DataModel {
  /** @inheritDoc */
  static defineSchema() {
    return {
      items: new foundry.data.fields.ArrayField(new foundry.data.fields.SchemaField({
        uuid: new foundry.data.fields.StringField()
      }), {required: true, label: "DOCUMENT.Items"}),
      optional: new foundry.data.fields.BooleanField({
        required: true, label: "SW5E.AdvancementItemGrantOptional", hint: "SW5E.AdvancementItemGrantOptionalHint"
      }),
      power: new foundry.data.fields.EmbeddedDataField(PowerConfigurationData, {
        required: true, nullable: true, initial: null
      })
    };
  }

  /* -------------------------------------------- */
  /*  Data Migrations                             */
  /* -------------------------------------------- */

  /** @inheritDoc */
  static migrateData(source) {
    if ( "items" in source ) {
      source.items = source.items.map(i => foundry.utils.getType(i) === "string" ? { uuid: i } : i);
    }
    return source;
  }
}
