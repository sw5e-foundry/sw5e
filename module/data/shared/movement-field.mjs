/**
 * Field for storing movement data.
 */
export default class MovementField extends foundry.data.fields.SchemaField {
  constructor( fields={}, options={} ) {
    const numberConfig = { required: true, nullable: true, min: 0, step: 0.1, initial: null };
    fields = {
      burrow: new foundry.data.fields.NumberField( { ...numberConfig, label: "SW5E.MovementBurrow" } ),
      climb: new foundry.data.fields.NumberField( { ...numberConfig, label: "SW5E.MovementClimb" } ),
      fly: new foundry.data.fields.NumberField( { ...numberConfig, label: "SW5E.MovementFly" } ),
      swim: new foundry.data.fields.NumberField( { ...numberConfig, label: "SW5E.MovementSwim" } ),
      walk: new foundry.data.fields.NumberField( { ...numberConfig, label: "SW5E.MovementWalk" } ),
      units: new foundry.data.fields.StringField( {
        required: true, nullable: true, blank: false, initial: null, label: "SW5E.MovementUnits"
      } ),
      hover: new foundry.data.fields.BooleanField( {required: true, label: "SW5E.MovementHover"} ),
      ...fields
    };
    Object.entries( fields ).forEach( ( [k, v] ) => !v ? delete fields[k] : null );
    super( fields, { label: "SW5E.Movement", ...options } );
  }
}
