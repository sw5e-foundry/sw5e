import Advancement from "../../documents/advancement/advancement.mjs";
import HitPointsFlow from "./hit-points-flow.mjs";

/**
 * Inline application that presents hull points selection upon level up.
 */
export default class HullPointsFlow extends HitPointsFlow {
  /** @inheritdoc */
  getData() {
    return foundry.utils.mergeObject( super.getData(), {
      isFirstClassLevel: false,
      labels: {
        average: "SW5E.AdvancementHullPointsAverage",
        roll: "SW5E.AdvancementHullPointsRollButton"
      }
    } );
  }

  /* -------------------------------------------- */

  /**
   * Update the roll result display when the average result is taken.
   * @protected
   */
  _updateRollResult() {
    if ( !this.form.elements.useAverage?.checked ) return;
    const quant = parseInt( this.advancement.quantForLevel( this.level ) );
    let avg = ( this.advancement.hitDieValue / 2 ) + 1;
    this.form.elements.value.value = quant * avg;
    if ( this.level === 0 ) this.form.elements.value.value = parseInt( this.form.elements.value.value ) + this.advancement.hitDieValue - avg;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _updateObject( event, formData ) {
    let value;
    if ( formData.useMax ) value = "max";
    else if ( formData.useAverage ) value = "avg";
    else if ( Number.isInteger( formData.value ) ) value = parseInt( formData.value );

    if ( value !== undefined ) return this.advancement.apply( this.level, { [this.level]: value } );

    this.form.querySelector( ".rollResult" )?.classList.add( "error" );
    const errorType = formData.value ? "Invalid" : "Empty";
    throw new Advancement.ERROR( game.i18n.localize( `SW5E.AdvancementHullPoints${errorType}Error` ) );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  rollHitPoints() {
    return this.advancement.actor.rollStarshipHullPoints( this.advancement.item, this.level );
  }
}
