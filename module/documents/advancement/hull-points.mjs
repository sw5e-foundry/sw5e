import HitPointsAdvancement from "./hit-points.mjs";
import HullPointsConfig from "../../applications/advancement/hull-points-config.mjs";
import HullPointsFlow from "../../applications/advancement/hull-points-flow.mjs";
import { simplifyBonus } from "../../utils.mjs";

/**
 * Advancement that presents the player with the option to roll hull points at each tier or select the average value.
 * Keeps track of player hull point rolls or selection for each starship tier.
 * **Can only be added to starships and each starship can only have one.**
 */
export default class HullPointsAdvancement extends HitPointsAdvancement {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject(super.metadata, {
      title: game.i18n.localize("SW5E.AdvancementHullPointsTitle"),
      hint: game.i18n.localize("SW5E.AdvancementHullPointsHint"),
      apps: {
        config: HullPointsConfig,
        flow: HullPointsFlow
      }
    });
  }

  /* -------------------------------------------- */
  /*  Instance Properties                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return Array.fromRange(this.item.maxAdvancementLevel + 1).slice(0);
  }

  /* -------------------------------------------- */

  /**
   * Shortcut to the hull die used by the class.
   * @returns {string}
   */
  get hitDie() {
    return this.item.system.hullDice;
  }

  /* -------------------------------------------- */
  /*  Display Methods                             */
  /* -------------------------------------------- */

  quantForLevel(level) {
    return (level === 0) ? this.item.system?.hullDiceStart : ["huge", "gargantuan"].includes(this.item.system.identifier) ? 2 : 1;
  }

  /** @inheritdoc */
  valueForLevel(level) {
    const quant = this.quantForLevel(level);
    return this.constructor.valueForLevel(this.value, this.hitDieValue, level, quant);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getAdjustedTotal(mod) {
    return Object.keys(this.value).reduce((total, level) => {
      const quant = this.quantForLevel(level);
      return total + Math.max(this.valueForLevel(parseInt(level)) + (quant * mod), quant);
    }, 0);
  }

  /* -------------------------------------------- */
  /*  Editing Methods                             */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static availableForItem(item) {
    return !item.advancement.byType.HullPoints?.length;
  }

  /* -------------------------------------------- */
  /*  Application Methods                         */
  /* -------------------------------------------- */

  /**
   * Add the ability modifier and any bonuses to the provided hull points value to get the number to apply.
   * @param {number} value  Hull points taken at a given level.
   * @returns {number}      Hull points adjusted with ability modifier and per-level bonuses.
   */
  #getApplicableValue(value) {
    const abilityId = CONFIG.SW5E.defaultAbilities.hullPoints || "con";
    value = Math.max(value + (this.actor.system.abilities[abilityId]?.mod ?? 0), 1);
    value += simplifyBonus(this.actor.system.attributes.hp.bonuses?.level, this.actor.getRollData());
    return value;
  }

}
