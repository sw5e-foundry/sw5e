const { StringField, NumberField, SchemaField } = foundry.data.fields;

/**
 * Field for storing data for a specific type of roll.
 */
export default class RollConfigField extends foundry.data.fields.SchemaField {
  constructor({roll={}, ability="", ...fields}={}, options={}) {
    const opts = { initial: null, nullable: true, min: 1, max: 20, integer: true };
    fields = {
      ability: new StringField({required: true, initial: ability, label: "SW5E.AbilityModifier"}),
      roll: new SchemaField({
        min: new NumberField({...opts, label: "SW5E.Minimum"}),
        max: new NumberField({...opts, label: "SW5E.Maximum"}),
        mode: new NumberField({choices: [-1, 0, 1], initial: 0, label: "SW5E.AdvantageMode"}),
        ...roll
      }),
      ...fields
    };
    super(fields, options);
  }
}
