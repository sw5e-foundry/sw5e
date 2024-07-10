import AdvancementFlow from "./advancement-flow.mjs";

/**
 * Inline application that displays any changes to a scale value.
 */
export default class ScaleValueFlow extends AdvancementFlow {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject( super.defaultOptions, {
      template: "systems/sw5e/templates/advancement/scale-value-flow.hbs"
    } );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    return foundry.utils.mergeObject( super.getData(), {
      initial: this.advancement.valueForLevel( this.level - 1 )?.display,
      final: this.advancement.valueForLevel( this.level ).display
    } );
  }
}
