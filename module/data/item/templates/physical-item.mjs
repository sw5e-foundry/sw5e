import SystemDataModel from "../../abstract.mjs";

/**
 * Data model template with information on physical items.
 *
 * @property {number} quantity            Number of items in a stack.
 * @property {number} weight              Item's weight in pounds or kilograms (depending on system setting).
 * @property {object} price
 * @property {number} price.value         Item's cost in the specified denomination.
 * @property {string} price.denomination  Currency denomination used to determine price.
 * @property {string} rarity              Item rarity as defined in `SW5E.itemRarity`.
 * @property {boolean} identified         Has this item been identified?
 * @mixin
 */
export default class PhysicalItemTemplate extends SystemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      quantity: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.Quantity"
      }),
      weight: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        min: 0,
        label: "SW5E.Weight"
      }),
      price: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            initial: 0,
            min: 0,
            label: "SW5E.Price"
          }),
          denomination: new foundry.data.fields.StringField({
            required: true,
            blank: false,
            initial: "gc",
            label: "SW5E.Currency"
          })
        },
        { label: "SW5E.Price" }
      ),
      rarity: new foundry.data.fields.StringField({ required: true, blank: true, label: "SW5E.Rarity" }),
      identified: new foundry.data.fields.BooleanField({ required: true, initial: true, label: "SW5E.Identified" })
    };
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Get a human-readable label for the price and denomination.
   * @type {string}
   */
  get priceLabel() {
    const { value, denomination } = this.price;
    const hasPrice = value && (denomination in CONFIG.SW5E.currencies);
    return hasPrice ? `${value} ${CONFIG.SW5E.currencies[denomination].label}` : null;
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    PhysicalItemTemplate.#migratePrice(source);
    PhysicalItemTemplate.#migrateRarity(source);
    PhysicalItemTemplate.#migrateWeight(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the item's price from a single field to an object with currency.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migratePrice(source) {
    if (!("price" in source) || foundry.utils.getType(source.price) === "Object") return;
    source.price = {
      value: Number.isNumeric(source.price) ? Number(source.price) : 0,
      denomination: "gc"
    };
  }

  /* -------------------------------------------- */

  /**
   * Migrate the item's rarity from freeform string to enum value.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateRarity(source) {
    if (!("rarity" in source) || CONFIG.SW5E.itemRarity[source.rarity]) return;
    source.rarity =
      Object.keys(CONFIG.SW5E.itemRarity).find(
        key => CONFIG.SW5E.itemRarity[key].toLowerCase() === source.rarity.toLowerCase()
      ) ?? "";
  }

  /* -------------------------------------------- */

  /**
   * Convert null weights to 0.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateWeight(source) {
    if (!("weight" in source)) return;
    if (source.weight === null || source.weight === undefined) source.weight = 0;
  }
}
