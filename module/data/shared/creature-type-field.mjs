/**
 * Field for storing creature type data.
 */
export default class CreatureTypeField extends foundry.data.fields.SchemaField {
  constructor(fields={}, options={}) {
    fields = {
      value: new foundry.data.fields.StringField({blank: true, label: "SW5E.CreatureType"}),
      subtype: new foundry.data.fields.StringField({label: "SW5E.CreatureTypeSelectorSubtype"}),
      swarm: new foundry.data.fields.StringField({blank: true, label: "SW5E.CreatureSwarmSize"}),
      custom: new foundry.data.fields.StringField({label: "SW5E.CreatureTypeSelectorCustom"}),
      ...fields
    };
    Object.entries(fields).forEach(([k, v]) => !v ? delete fields[k] : null);
    super(fields, { label: "SW5E.CreatureType", ...options });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options={}) {
    const obj = super.initialize(value, model, options);

    Object.defineProperty(obj, "label", {
      get() {
        return sw5e.documents.Actor5e.formatCreatureType(this);
      },
      enumerable: false
    });
    Object.defineProperty(obj, "config", {
      get() {
        return CONFIG.SW5E.creatureTypes[this.value];
      },
      enumerable: false
    });

    return obj;
  }
}
