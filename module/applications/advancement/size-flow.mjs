import AdvancementFlow from "./advancement-flow.mjs";

/**
 * Inline application that displays size advancement.
 */
export default class SizeFlow extends AdvancementFlow {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/sw5e/templates/advancement/size-flow.hbs"
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData() {
    const sizes = this.advancement.configuration.sizes;
    return foundry.utils.mergeObject(super.getData(), {
      singleSize: sizes.size === 1 ? sizes.first() : null,
      hint: this.advancement.configuration.hint || this.advancement.automaticHint,
      selectedSize: this.retainedData?.size ?? this.advancement.value.size,
      sizes: Array.from(sizes).reduce((obj, key) => {
        obj[key] = CONFIG.SW5E.actorSizes[key].label;
        return obj;
      }, {})
    });
  }
}
