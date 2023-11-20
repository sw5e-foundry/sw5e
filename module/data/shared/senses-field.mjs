/**
 * Field for storing senses data.
 */
export default class SensesField extends foundry.data.fields.SchemaField {
  constructor(fields={}, options={}) {
    const numberConfig = { required: true, nullable: true, integer: true, min: 0, initial: null };
    fields = {
      darkvision: new foundry.data.fields.NumberField({ ...numberConfig, label: "SW5E.SenseDarkvision" }),
      blindsight: new foundry.data.fields.NumberField({ ...numberConfig, label: "SW5E.SenseBlindsight" }),
      tremorsense: new foundry.data.fields.NumberField({ ...numberConfig, label: "SW5E.SenseTremorsense" }),
      truesight: new foundry.data.fields.NumberField({ ...numberConfig, label: "SW5E.SenseTruesight" }),
      units: new foundry.data.fields.StringField({
        required: true, nullable: true, blank: false, initial: null, label: "SW5E.SenseUnits"
      }),
      special: new foundry.data.fields.StringField({required: true, label: "SW5E.SenseSpecial"}),
      ...fields
    };
    Object.entries(fields).forEach(([k, v]) => !v ? delete fields[k] : null);
    super(fields, { label: "SW5E.Senses", ...options });
  }
}
