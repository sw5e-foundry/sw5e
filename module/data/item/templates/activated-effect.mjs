import SystemDataModel from "../../abstract.mjs";
import { FormulaField } from "../../fields.mjs";

/**
 * Data model template for items that can be used as some sort of action.
 *
 * @property {object} activation            Effect's activation conditions.
 * @property {string} activation.type       Activation type as defined in `SW5E.abilityActivationTypes`.
 * @property {number} activation.cost       How much of the activation type is needed to use this item's effect.
 * @property {string} activation.condition  Special conditions required to activate the item.
 * @property {object} duration              Effect's duration.
 * @property {number} duration.value        How long the effect lasts.
 * @property {string} duration.units        Time duration period as defined in `SW5E.timePeriods`.
 * @property {number} cover                 Amount of cover does this item affords to its crew on a vehicle.
 * @property {object} target                Effect's valid targets.
 * @property {number} target.value          Length or radius of target depending on targeting mode selected.
 * @property {number} target.width          Width of line when line type is selected.
 * @property {string} target.units          Units used for value and width as defined in `SW5E.distanceUnits`.
 * @property {string} target.type           Targeting mode as defined in `SW5E.targetTypes`.
 * @property {object} range                 Effect's range.
 * @property {number} range.value           Regular targeting distance for item's effect.
 * @property {number} range.long            Maximum targeting distance for features that have a separate long range.
 * @property {string} range.units           Units used for value and long as defined in `SW5E.distanceUnits`.
 * @property {object} uses                  Effect's limited uses.
 * @property {number} uses.value            Current available uses.
 * @property {string} uses.max              Maximum possible uses or a formula to derive that number.
 * @property {string} uses.per              Recharge time for limited uses as defined in `SW5E.limitedUsePeriods`.
 * @property {object} consume               Effect's resource consumption.
 * @property {string} consume.type          Type of resource to consume as defined in `SW5E.abilityConsumptionTypes`.
 * @property {string} consume.target        Item ID or resource key path of resource to consume.
 * @property {number} consume.amount        Quantity of the resource to consume per use.
 * @mixin
 */
export default class ActivatedEffectTemplate extends SystemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return {
      activation: new foundry.data.fields.SchemaField(
        {
          type: new foundry.data.fields.StringField({required: true, blank: true, label: "SW5E.ItemActivationType"}),
          cost: new foundry.data.fields.NumberField({required: true, label: "SW5E.ItemActivationCost"}),
          condition: new foundry.data.fields.StringField({required: true, label: "SW5E.ItemActivationCondition"})
        },
        { label: "SW5E.ItemActivation" }
      ),
      duration: new foundry.data.fields.SchemaField(
        {
          value: new FormulaField({ required: true, deterministic: true, label: "SW5E.Duration" }),
          units: new foundry.data.fields.StringField({ required: true, blank: true, label: "SW5E.DurationType" })
        },
        { label: "SW5E.Duration" }
      ),
      cover: new foundry.data.fields.NumberField({
        required: true,
        nullable: true,
        min: 0,
        max: 1,
        label: "SW5E.Cover"
      }),
      crewed: new foundry.data.fields.BooleanField({ label: "SW5E.Crewed" }),
      target: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.NumberField({ required: true, min: 0, label: "SW5E.TargetValue" }),
          width: new foundry.data.fields.NumberField({ required: true, min: 0, label: "SW5E.TargetWidth" }),
          units: new foundry.data.fields.StringField({ required: true, blank: true, label: "SW5E.TargetUnits" }),
          type: new foundry.data.fields.StringField({ required: true, blank: true, label: "SW5E.TargetType" }),
          prompt: new foundry.data.fields.BooleanField({ initial: true, label: "SW5E.TemplatePrompt" })
        },
        { label: "SW5E.Target" }
      ),
      range: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.NumberField({ required: true, min: 0, label: "SW5E.RangeNormal" }),
          long: new foundry.data.fields.NumberField({ required: true, min: 0, label: "SW5E.RangeLong" }),
          units: new foundry.data.fields.StringField({ required: true, blank: true, label: "SW5E.RangeUnits" })
        },
        { label: "SW5E.Range" }
      ),
      uses: new this.ItemUsesField({}, { label: "SW5E.LimitedUses" }),
      consume: new foundry.data.fields.SchemaField(
        {
          type: new foundry.data.fields.StringField({ required: true, blank: true, label: "SW5E.ConsumeType" }),
          target: new foundry.data.fields.StringField({
            required: true,
            nullable: true,
            initial: null,
            label: "SW5E.ConsumeTarget"
          }),
          amount: new foundry.data.fields.NumberField({ required: true, integer: true, label: "SW5E.ConsumeAmount" }),
          scale: new foundry.data.fields.BooleanField({ label: "SW5E.ConsumeScaling" })
        },
        { label: "SW5E.ConsumeTitle" }
      )
    };
  }

  /* -------------------------------------------- */

  /**
   * Extension of SchemaField used to track item uses.
   * @internal
   */
  static ItemUsesField = class ItemUsesField extends foundry.data.fields.SchemaField {
    constructor(extraSchema, options) {
      super(
        SystemDataModel.mergeSchema(
          {
            value: new foundry.data.fields.NumberField({
              required: true,
              min: 0,
              integer: true,
              label: "SW5E.LimitedUsesAvailable"
            }),
            max: new FormulaField({ required: true, deterministic: true, label: "SW5E.LimitedUsesMax" }),
            per: new foundry.data.fields.StringField({
              required: true,
              nullable: true,
              blank: false,
              initial: null,
              label: "SW5E.LimitedUsesPer"
            }),
            recovery: new FormulaField({ required: true, label: "SW5E.RecoveryFormula" }),
            prompt: new foundry.data.fields.BooleanField({ initial: true, label: "SW5E.LimitedUsesPrompt" })
          },
          extraSchema
        ),
        options
      );
    }
  };

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * Retrieve information on available uses for display.
   * @returns {{value: number, max: number, name: string}}
   */
  getUsesData() {
    return { value: this.uses.value, max: this.parent.system.uses.max, name: "system.uses.value" };
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    ActivatedEffectTemplate.#migrateFormulaFields(source);
    ActivatedEffectTemplate.#migrateRanges(source);
    ActivatedEffectTemplate.#migrateDuration(source);
    ActivatedEffectTemplate.#migrateTargets(source);
    ActivatedEffectTemplate.#migrateUses(source);
    ActivatedEffectTemplate.#migrateConsume(source);
  }

  /* -------------------------------------------- */

  /**
   * Ensure a 0 or null in max uses & durations are converted to an empty string rather than "0". Convert numbers into
   * strings.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateFormulaFields(source) {
    if ([0, "0", null].includes(source.uses?.max)) source.uses.max = "";
    else if (typeof source.uses?.max === "number") source.uses.max = source.uses.max.toString();
    if ([0, "0", null].includes(source.duration?.value)) source.duration.value = "";
    else if (typeof source.duration?.value === "number") source.duration.value = source.duration.value.toString();
  }

  /* -------------------------------------------- */

  /**
   * Fix issue with some imported range data that uses the format "100/400" in the range field,
   * rather than splitting it between "range.value" & "range.long".
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateRanges(source) {
    if (!("range" in source)) return;
    source.range ??= {};
    if (source.range.units === null) source.range.units = "";
    if (typeof source.range.long === "number" && Number.isNaN(source.range.long)) source.range.long = null;
    if (typeof source.range.long === "string") {
      if (source.range.long === "") source.range.long = null;
      else if (Number.isNumeric(source.range.long)) source.range.long = Number(source.range.long);
    }
    if (typeof source.range.value === "number" && Number.isNaN(source.range.value)) source.range.value = null;
    if (typeof source.range.value === "string") {
      if (source.range.value === "") {
        source.range.value = null;
        return;
      }
      const [value, long] = source.range.value.split("/");
      if (Number.isNumeric(value)) source.range.value = Number(value);
      if (Number.isNumeric(long)) source.range.long = Number(long);
    }
  }

  /* -------------------------------------------- */

  /**
   * Fix issue with some imported duration data that uses "instantaneous" in the duration value field,
   * rather than in the duration units field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateDuration(source) {
    if (!("duration" in source)) return;
    if (source.duration.value === "Instantaneous") {
      source.duration = {
        value: "",
        units: "inst"
      };
    }
  }

  /* -------------------------------------------- */

  /**
   * Ensure blank strings in targets are converted to null.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateTargets(source) {
    if (!("target" in source)) return;
    source.target ??= {};
    if (source.target.value === "") source.target.value = null;
    if (source.target.units === null) source.target.units = "";
    if (source.target.type === null) source.target.type = "";
  }

  /* -------------------------------------------- */

  /**
   * Ensure a blank string in uses.value is converted to null.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateUses(source) {
    if (!("uses" in source)) return;
    source.uses ??= {};
    const value = source.uses.value;
    if (typeof value === "string") {
      if (value === "") source.uses.value = null;
      else if (Number.isNumeric(value)) source.uses.value = Number(source.uses.value);
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate the consume field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateConsume(source) {
    if (!("consume" in source)) return;
    source.consume ??= {};
    if (source.consume.type === null) source.consume.type = "";
    const amount = source.consume.amount;
    if (typeof amount === "string") {
      if (amount === "") source.consume.amount = null;
      else if (Number.isNumeric(amount)) source.consume.amount = Number(amount);
    }
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Chat properties for activated effects.
   * @type {string[]}
   */
  get activatedEffectCardProperties() {
    return [
      this.parent.labels.activation,
      this.parent.labels.target,
      this.parent.labels.range,
      this.parent.labels.duration
    ];
  }

  /* -------------------------------------------- */

  /**
   * Does the Item have an area of effect target?
   * @type {boolean}
   */
  get hasAreaTarget() {
    return this.isActive && (this.target.type in CONFIG.SW5E.areaTargetTypes);
  }

  /* -------------------------------------------- */

  /**
   * Does the Item target one or more distinct targets?
   * @type {boolean}
   */
  get hasIndividualTarget() {
    return this.isActive && (this.target.type in CONFIG.SW5E.individualTargetTypes);
  }

  /* -------------------------------------------- */

  /**
   * Is this Item limited in its ability to be used by charges or by recharge?
   * @type {boolean}
   */
  get hasLimitedUses() {
    return this.isActive && (this.uses.per in CONFIG.SW5E.limitedUsePeriods) && (this.uses.max > 0);
  }

  /* -------------------------------------------- */

  /**
   * Does this Item draw from a resource?
   * @type {boolean}
   */
  get hasResource() {
    const consume = this.consume;
    return this.isActive && !!consume.target && !!consume.type && (!this.hasAttack || (consume.type !== "ammo"));
  }

  /* -------------------------------------------- */

  /**
   * Does this Item store ammunition internally?
   * @type {boolean}
   */
  get hasReload() {
    return this.isActive && !!this.ammo?.max;
  }

  /* -------------------------------------------- */

  /**
   * Does this Item draw from ammunition?
   * @type {boolean}
   */
  get hasAmmo() {
    const consume = this.consume;
    return this.isActive && !!consume.target && !!consume.type && this.hasAttack && (consume.type === "ammo");
  }

  /* -------------------------------------------- */

  /**
   * What item does this item use as ammunition?
   * @type {object|null}
   */
  get getAmmo() {
    const actor = this.parent?.actor;
    if (this.hasReload) {
      return {
        item: actor?.items?.get(this.ammo.target),
        quantity: this.ammo.value,
        consumeAmount: this.ammo?.use ?? this.ammo?.baseUse ?? 1,
        max: this.ammo.max
      };
    } else if (this.hasAmmo) {
      const item = actor?.items?.get(this.consume.target);
      return {
        item,
        quantity: item?.system?.quantity,
        consumeAmount: this.consume.ammount ?? 0,
        max: null
      };
    }
    return {
      item: null,
      quantity: 0,
      consumeAmount: 0,
      max: null
    };
  }

  /* -------------------------------------------- */

  /**
   * Does the Item duration accept an associated numeric value or formula?
   * @type {boolean}
   */
  get hasScalarDuration() {
    return this.duration.units in CONFIG.SW5E.scalarTimePeriods;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item range accept an associated numeric value?
   * @type {boolean}
   */
  get hasScalarRange() {
    return this.range.units in CONFIG.SW5E.movementUnits;
  }

  /* -------------------------------------------- */

  /**
   * Does the Item target accept an associated numeric value?
   * @type {boolean}
   */
  get hasScalarTarget() {
    return ![null, "", "self"].includes(this.target.type);
  }

  /* -------------------------------------------- */

  /**
   * Does the Item have a target?
   * @type {boolean}
   */
  get hasTarget() {
    return this.isActive && !["", null].includes(this.target.type);
  }

  /* -------------------------------------------- */

  /**
   * Is this Item an activatable item?
   * @type {boolean}
   */
  get isActive() {
    return !!this.activation.type;
  }

  /* -------------------------------------------- */
  /*  Deprecations                                */
  /* -------------------------------------------- */

  /**
   * @deprecated since SW5e 3.0, available until SW5e 3.2
   * @ignore
   */
  get activatedEffectChatProperties() {
    foundry.utils.logCompatibilityWarning("ActivatedEffectTemplate#activatedEffectChatProperties is deprecated. "
      + "Please use ActivatedEffectTemplate#activatedEffectCardProperties.",
      { since: "SW5e 3.0", until: "SW5e 3.2", once: true }
    );
    return [
      this.parent.labels.activation + (this.activation.condition ? ` (${this.activation.condition})` : ""),
      this.parent.labels.target,
      this.parent.labels.range,
      this.parent.labels.duration
    ];
  }
}
