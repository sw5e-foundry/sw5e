import { FormulaField } from "../fields.mjs";

export default class PowerConfigurationData extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      ability: new foundry.data.fields.StringField( { label: "SW5E.AbilityModifier" } ),
      preparation: new foundry.data.fields.StringField( { label: "SW5E.PowerPreparationMode" } ),
      uses: new foundry.data.fields.SchemaField(
        {
          max: new FormulaField( { deterministic: true, label: "SW5E.UsesMax" } ),
          per: new foundry.data.fields.StringField( { label: "SW5E.UsesPeriod" } )
        },
        { label: "SW5E.LimitedUses" }
      )
    };
  }

  /* -------------------------------------------- */

  /**
   * Changes that this power configuration indicates should be performed on powers.
   * @type {object}
   */
  get powerChanges() {
    const updates = {};
    if ( this.ability ) updates["system.ability"] = this.ability;
    if ( this.preparation ) updates["system.preparation.mode"] = this.preparation;
    if ( this.uses.max && this.uses.per ) {
      updates["system.uses.max"] = this.uses.max;
      updates["system.uses.per"] = this.uses.per;
      if ( Number.isNumeric( this.uses.max ) ) updates["system.uses.value"] = parseInt( this.uses.max );
      else {
        try {
          const rollData = this.parent.parent.actor.getRollData( { deterministic: true } );
          const formula = Roll.replaceFormulaData( this.uses.max, rollData, { missing: 0 } );
          updates["system.uses.value"] = Roll.safeEval( formula );
        } catch( e ) {}
      }
    }
    return updates;
  }
}
