import SystemDataModel from "../abstract.mjs";
import { MappingField } from "../fields.mjs";

/**
 * A template for currently held currencies.
 *
 * @property {object} currency  Object containing currencies as numbers.
 * @mixin
 */
export default class CurrencyTemplate extends SystemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      currency: new MappingField(
        new foundry.data.fields.NumberField({
          required: true,
          nullable: false,
          integer: true,
          min: 0,
          initial: 0
        }),
        { initialKeys: CONFIG.SW5E.currencies, initialKeysOnly: true, label: "SW5E.Currency" }
      )
    };
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Get the weight of all of the currency. Always returns 0 if currency weight is disabled in settings.
   * @returns {number}
   */
  get currencyWeight() {
    if ( !game.settings.get("sw5e", "currencyWeight") ) return 0;
    const count = Object.values(this.currency).reduce((count, value) => count + value, 0);
    const currencyPerWeight = game.settings.get("sw5e", "metricWeightUnits")
      ? CONFIG.SW5E.encumbrance.currencyPerWeight.metric
      : CONFIG.SW5E.encumbrance.currencyPerWeight.imperial;
    return count / currencyPerWeight;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    CurrencyTemplate.#migrateCurrencyData(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the actor currency field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateCurrencyData(source) {
    if (source.currency === undefined) return;
    // If currency if for some reason null, set it to default values
    if (source.currency === null) source.currency = { gc: 0 };
    // If the actor has a numeric currency, then it has not been migrated yet.
    else if (Number.isNumeric(source.currency)) source.currency = { gc: source.currency };
    // If currency is an object, remove all but galactic credit
    else if (foundry.utils.getType(source.currency) === "Object") {
      const gc = source.currency.gc ?? source.currency.cr ?? 0;
      source.currency = { gc: gc };
    }
  }
}
