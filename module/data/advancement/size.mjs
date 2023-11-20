/**
 * Configuration data for the size advancement type.
 */
export class SizeConfigurationData extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      hint: new foundry.data.fields.StringField({label: "SW5E.AdvancementHint"}),
      sizes: new foundry.data.fields.SetField(
        new foundry.data.fields.StringField(), {required: false, initial: ["med"], label: "SW5E.Size"}
      )
    };
  }
}

/**
 * Value data for the size advancement type.
 */
export class SizeValueData extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      size: new foundry.data.fields.StringField({required: false, label: "SW5E.Size"})
    };
  }
}
