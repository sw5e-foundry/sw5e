import { FormulaField } from "../../fields.mjs";

/**
 * Data model template for item actions.
 *
 * @property {string} ability             Ability score to use when determining modifier.
 * @property {string} actionType          Action type as defined in `SW5E.itemActionTypes`.
 * @property {string} attackBonus         Numeric or dice bonus to attack rolls.
 * @property {string} chatFlavor          Extra text displayed in chat.
 * @property {object} critical            Information on how critical hits are handled.
 * @property {number} critical.threshold  Minimum number on the dice to roll a critical hit.
 * @property {string} critical.damage     Extra damage on critical hit.
 * @property {object} damage              Item damage formulas.
 * @property {string[][]} damage.parts    Array of damage formula and types.
 * @property {string} damage.versatile    Special versatile damage formula.
 * @property {string} formula             Other roll formula.
 * @property {object} save                Item saving throw data.
 * @property {string} save.ability        Ability required for the save.
 * @property {number} save.dc             Custom saving throw value.
 * @property {string} save.scaling        Method for automatically determining saving throw DC.
 * @mixin
 */
export default class ActionTemplate extends foundry.abstract.DataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      ability: new foundry.data.fields.StringField({
        required: true,
        nullable: true,
        initial: null,
        label: "SW5E.AbilityModifier"
      }),
      actionType: new foundry.data.fields.StringField({
        required: true,
        nullable: true,
        initial: null,
        label: "SW5E.ItemActionType"
      }),
      attackBonus: new FormulaField({ required: true, label: "SW5E.ItemAttackBonus" }),
      chatFlavor: new foundry.data.fields.StringField({ required: true, label: "SW5E.ChatFlavor" }),
      critical: new foundry.data.fields.SchemaField({
        threshold: new foundry.data.fields.NumberField({
          required: true,
          integer: true,
          initial: null,
          positive: true,
          label: "SW5E.ItemCritThreshold"
        }),
        damage: new FormulaField({ required: true, label: "SW5E.ItemCritExtraDamage" })
      }),
      damage: new foundry.data.fields.SchemaField(
        {
          parts: new foundry.data.fields.ArrayField(
            new foundry.data.fields.ArrayField(new foundry.data.fields.StringField({ nullable: true })),
            { required: true }
          ),
          versatile: new FormulaField({ required: true, label: "SW5E.VersatileDamage" })
        },
        { label: "SW5E.Damage" }
      ),
      formula: new FormulaField({ required: true, label: "SW5E.OtherFormula" }),
      save: new foundry.data.fields.SchemaField(
        {
          ability: new foundry.data.fields.StringField({ required: true, blank: true, label: "SW5E.Ability" }),
          dc: new foundry.data.fields.NumberField({
            required: true,
            min: 0,
            integer: true,
            label: "SW5E.AbbreviationDC"
          }),
          scaling: new foundry.data.fields.StringField({
            required: true,
            blank: false,
            initial: "power",
            label: "SW5E.ScalingFormula"
          })
        },
        { label: "SW5E.SavingThrow" }
      )
    };
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    ActionTemplate.#migrateAbility(source);
    ActionTemplate.#migrateAttackBonus(source);
    ActionTemplate.#migrateCritical(source);
    ActionTemplate.#migrateSave(source);
    ActionTemplate.#migrateDamage(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the ability field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateAbility(source) {
    if (Array.isArray(source.ability)) source.ability = source.ability[0];
  }

  /* -------------------------------------------- */

  /**
   * Ensure a 0 or null in attack bonus is converted to an empty string rather than "0".
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateAttackBonus(source) {
    if ([0, "0", null].includes(source.attackBonus)) source.attackBonus = "";
    else if (typeof source.attackBonus === "number") source.attackBonus = source.attackBonus.toString();
  }

  /* -------------------------------------------- */

  /**
   * Ensure the critical field is an object.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateCritical(source) {
    if (!("critical" in source)) return;
    if (source.critical?.damage === null) source.critical.damage = "";
    if (typeof source.critical !== "object" || source.critical === null) source.critical = {
      threshold: null,
      damage: ""
    };
  }

  /* -------------------------------------------- */

  /**
   * Migrate the save field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateSave(source) {
    if (source.save?.scaling === "") source.save.scaling = "power";
    if (source.save?.ability === null) source.save.ability = "";
    if (typeof source.save?.dc === "string") {
      if (source.save.dc === "") source.save.dc = null;
      else if (Number.isNumeric(source.save.dc)) source.save.dc = Number(source.save.dc);
    }
    if (typeof source.save?.dc === "number" && Number.isNaN(source.save?.dc)) source.save.dc = null;
  }

  /* -------------------------------------------- */

  /**
   * Migrate damage parts.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateDamage(source) {
    if (!("damage" in source)) return;
    source.damage.parts ??= [];
  }
}
