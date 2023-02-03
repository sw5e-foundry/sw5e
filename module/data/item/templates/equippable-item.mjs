/**
 * Data model template with information on items that can be attuned and equipped.
 *
 * @property {number} attunement  Attunement information as defined in `SW5E.attunementTypes`.
 * @property {boolean} equipped   Is this item equipped on its owning actor.
 * @mixin
 */
export default class EquippableItemTemplate extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      attunement: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        initial: CONFIG.SW5E.attunementTypes.NONE,
        label: "SW5E.Attunement"
      }),
      equipped: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.Equipped" })
    };
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    EquippableItemTemplate.#migrateAttunement(source);
    EquippableItemTemplate.#migrateEquipped(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the item's attuned boolean to attunement string.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateAttunement(source) {
    if (source.attuned === undefined || source.attunement !== undefined) return;
    source.attunement = source.attuned ? CONFIG.SW5E.attunementTypes.ATTUNED : CONFIG.SW5E.attunementTypes.NONE;
  }

  /* -------------------------------------------- */

  /**
   * Migrate the equipped field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateEquipped(source) {
    if (source.equipped === null || source.equipped === undefined) source.equipped = false;
  }
}
