import Advancement from "../../documents/advancement/advancement.mjs";
import HitPointsFlow from "./hit-points-flow.mjs";

/**
 * Inline application that presents hull points selection upon level up.
 */
export default class HullPointsFlow extends HitPointsFlow {
  /** @inheritdoc */
  getData() {
    return foundry.utils.mergeObject(super.getData(), {
      isFirstClassLevel: false,
      labels: {
        average: "SW5E.AdvancementHullPointsAverage",
        roll: "SW5E.AdvancementHullPointsRollButton"
      }
    });
  }

  /* -------------------------------------------- */

  /**
   * Update the roll result display when the average result is taken.
   * @protected
   */
  _updateRollResult() {
    if (!this.form.elements.useAverage?.checked) return;
    let avg = (this.advancement.hitDieValue / 2) + 1;
    if (this.level === 0) avg = this.advancement.hitDieValue + ((this.advancement.item.system.hullDiceStart - 1) * avg);
    this.form.elements.value.value = avg;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _updateObject(event, formData) {
    let value;
    if (formData.useMax) value = "max";
    else if (formData.useAverage) value = "avg";
    else if (Number.isInteger(formData.value)) value = parseInt(formData.value);

    if (value !== undefined) return this.advancement.apply(this.level, { [this.level]: value });

    this.form.querySelector(".rollResult")?.classList.add("error");
    const errorType = formData.value ? "Invalid" : "Empty";
    throw new Advancement.ERROR(game.i18n.localize(`SW5E.AdvancementHullPoints${errorType}Error`));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  rollHitPoints() {
    return this.advancement.actor.rollStarshipHullPoints(this.advancement.item, this.level);
  }
}
