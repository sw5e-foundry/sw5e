import { replaceFormulaData } from "../../../utils.mjs";
import SystemDataModel from "../../abstract.mjs";
import { FormulaField } from "../../fields.mjs";

const { BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

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
 * @property {string} target.value          Length or radius of target depending on targeting mode selected.
 * @property {number} target.width          Width of line when line type is selected.
 * @property {string} target.units          Units used for value and width as defined in `SW5E.distanceUnits`.
 * @property {string} target.type           Targeting mode as defined in `SW5E.targetTypes`.
 * @property {boolean} target.prompt        Should the player be prompted to place the template?
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
      activation: new SchemaField({
        type: new StringField({required: true, blank: true, label: "SW5E.ItemActivationType"}),
        cost: new NumberField({required: true, label: "SW5E.ItemActivationCost"}),
        condition: new StringField({required: true, label: "SW5E.ItemActivationCondition"})
      }, {label: "SW5E.ItemActivation"}),
      duration: new SchemaField({
        value: new FormulaField({required: true, deterministic: true, label: "SW5E.Duration"}),
        units: new StringField({required: true, blank: true, label: "SW5E.DurationType"})
      }, {label: "SW5E.Duration"}),
      cover: new NumberField({
        required: true, nullable: true, min: 0, max: 1, label: "SW5E.Cover"
      }),
      crewed: new BooleanField({label: "SW5E.Crewed"}),
      target: new SchemaField({
        value: new FormulaField({required: true, deterministic: true, label: "SW5E.TargetValue"}),
        width: new NumberField({required: true, min: 0, label: "SW5E.TargetWidth"}),
        units: new StringField({required: true, blank: true, label: "SW5E.TargetUnits"}),
        type: new StringField({required: true, blank: true, label: "SW5E.TargetType"}),
        prompt: new BooleanField({initial: true, label: "SW5E.TemplatePrompt"})
      }, {label: "SW5E.Target"}),
      range: new SchemaField({
        value: new NumberField({required: true, min: 0, label: "SW5E.RangeNormal"}),
        long: new NumberField({required: true, min: 0, label: "SW5E.RangeLong"}),
        units: new StringField({required: true, blank: true, label: "SW5E.RangeUnits"})
      }, {label: "SW5E.Range"}),
      uses: new this.ItemUsesField({}, {label: "SW5E.LimitedUses"}),
      consume: new SchemaField({
        type: new StringField({required: true, blank: true, label: "SW5E.ConsumeType"}),
        target: new StringField({
          required: true, nullable: true, initial: null, label: "SW5E.ConsumeTarget"
        }),
        amount: new NumberField({required: true, integer: true, label: "SW5E.ConsumeAmount"}),
        scale: new BooleanField({label: "SW5E.ConsumeScaling"})
      }, {label: "SW5E.ConsumeTitle"})
    };
  }

  /* -------------------------------------------- */

  /**
   * Extension of SchemaField used to track item uses.
   * @internal
   */
  static ItemUsesField = class ItemUsesField extends SchemaField {
    constructor(extraSchema, options) {
      super(SystemDataModel.mergeSchema({
        value: new NumberField({
          required: true, min: 0, integer: true, label: "SW5E.LimitedUsesAvailable"
        }),
        max: new FormulaField({required: true, deterministic: true, label: "SW5E.LimitedUsesMax"}),
        per: new StringField({
          required: true, nullable: true, blank: false, initial: null, label: "SW5E.LimitedUsesPer"
        }),
        recovery: new FormulaField({required: true, label: "SW5E.RecoveryFormula"}),
        prompt: new BooleanField({initial: true, label: "SW5E.LimitedUsesPrompt"})
      }, extraSchema), options);
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

  /**
   * Prepare activated effect data, should be called during `prepareFinalData` stage.
   */
  prepareFinalActivatedEffectData() {
    // Initial data modifications
    if ( ["inst", "perm"].includes(this.duration.units) ) this.duration.value = null;
    if ( [null, "self"].includes(this.target.type) ) this.target.value = this.target.units = null;
    else if ( this.target.units === "touch" ) this.target.value = null;
    if ( [null, "touch", "self"].includes(this.range.units) ) this.range.value = this.range.long = null;

    // Prepare duration, targets, and max uses formulas
    const rollData = this.getRollData({ deterministic: true });
    this._prepareFinalFormula("duration.value", { label: "SW5E.Duration", rollData });
    this._prepareFinalFormula("target.value", { label: "SW5E.TargetValue", rollData });
    this._prepareFinalFormula("uses.max", { label: "SW5E.UsesMax", rollData });

    // Prepare labels
    this.parent.labels ??= {};
    this.parent.labels.duration = [this.duration.value, CONFIG.SW5E.timePeriods[this.duration.units]].filterJoin(" ");
    this.parent.labels.activation = this.activation.type ? [
      (this.activation.type in CONFIG.SW5E.staticAbilityActivationTypes) ? null : this.activation.cost,
      CONFIG.SW5E.abilityActivationTypes[this.activation.type]
    ].filterJoin(" ") : "";

    if ( this.hasTarget ) {
      const target = [this.target.value];
      if ( this.hasAreaTarget ) {
        if ( this.target.units in CONFIG.SW5E.movementUnits ) {
          target.push(game.i18n.localize(`SW5E.Dist${this.target.units.capitalize()}Abbr`));
        }
        else target.push(CONFIG.SW5E.distanceUnits[this.target.units]);
      }
      target.push(CONFIG.SW5E.targetTypes[this.target.type]);
      this.parent.labels.target = target.filterJoin(" ");
    }

    if ( this.isActive && this.range.units ) {
      const range = [this.range.value, this.range.long ? `/ ${this.range.long}` : null];
      if ( this.range.units in CONFIG.SW5E.movementUnits ) {
        range.push(game.i18n.localize(`SW5E.Dist${this.range.units.capitalize()}Abbr`));
      }
      else range.push(CONFIG.SW5E.distanceUnits[this.range.units]);
      this.parent.labels.range = range.filterJoin(" ");
    } else this.parent.labels.range = game.i18n.localize("SW5E.None");

    if ( this.recharge ) this.parent.labels.recharge = `${game.i18n.localize("SW5E.Recharge")} [${
      `${this.recharge.value}${parseInt(this.recharge.value) < 6 ? "+" : ""}`
    }]`;

    // Substitute source UUIDs in consumption targets
    if ( !this.parent.isEmbedded ) return;
    if ( ["ammo", "charges", "material"].includes(this.consume.type) && this.consume.target?.includes(".") ) {
      const item = this.parent.actor.sourcedItems?.get(this.consume.target);
      if ( item ) this.consume.target = item.id;
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare a specific final formula, passing resolution errors to actor if available.
   * @param {string} keyPath           Path within system data to where the property can be found.
   * @param {object} options
   * @param {string} options.label     Localizable name for the property to display in warnings.
   * @param {object} options.rollData  Roll data to use to evaluate the formula.
   */
  _prepareFinalFormula(keyPath, { label, rollData }) {
    const value = foundry.utils.getProperty(this, keyPath);
    if ( !value ) return;
    const property = game.i18n.localize(label);
    try {
      foundry.utils.setProperty(
        this, keyPath, Roll.safeEval(replaceFormulaData(value, rollData, { item: this.parent, property }))
      );
    } catch(err) {
      if ( this.parent.isEmbedded ) {
        const message = game.i18n.format("SW5E.FormulaMalformedError", { property, name: this.parent.name });
        this.parent.actor._preparationWarnings.push({ message, link: this.parent.uuid, type: "error" });
        console.error(message, err);
      }
    }
  }

  /* -------------------------------------------- */
  /*  Data Migration                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    ActivatedEffectTemplate.#migrateFormulaFields(source);
    ActivatedEffectTemplate.#migrateRanges(source);
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
    if ( [0, "0", null].includes(source.uses?.max) ) source.uses.max = "";
    else if ( typeof source.uses?.max === "number" ) source.uses.max = source.uses.max.toString();
    if ( [0, "0", null].includes(source.duration?.value) ) source.duration.value = "";
    else if ( typeof source.duration?.value === "number" ) source.duration.value = source.duration.value.toString();
  }

  /* -------------------------------------------- */

  /**
   * Fix issue with some imported range data that uses the format "100/400" in the range field,
   * rather than splitting it between "range.value" & "range.long".
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateRanges(source) {
    if ( !("range" in source) ) return;
    source.range ??= {};
    if ( source.range.units === "none" ) source.range.units = "";
    if ( typeof source.range.long === "string" ) {
      if ( source.range.long === "" ) source.range.long = null;
      else if ( Number.isNumeric(source.range.long) ) source.range.long = Number(source.range.long);
    }
    if ( typeof source.range.value !== "string" ) return;
    if ( source.range.value === "" ) {
      source.range.value = null;
      return;
    }
    const [value, long] = source.range.value.split("/");
    if ( Number.isNumeric(value) ) source.range.value = Number(value);
    if ( Number.isNumeric(long) ) source.range.long = Number(long);
  }

  /* -------------------------------------------- */

  /**
   * Ensure blank strings in targets are converted to null.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateTargets(source) {
    if ( !("target" in source) ) return;
    source.target ??= {};
    if ( source.target.value === "" ) source.target.value = null;
    if ( source.target.type === "none" ) source.target.type = "";
  }

  /* -------------------------------------------- */

  /**
   * Ensure a blank string in uses.value is converted to null.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateUses(source) {
    if ( !("uses" in source) ) return;
    source.uses ??= {};
    const value = source.uses.value;
    if ( typeof value === "string" ) {
      if ( value === "" ) source.uses.value = null;
      else if ( Number.isNumeric(value) ) source.uses.value = Number(source.uses.value);
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate the consume field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateConsume(source) {
    if ( !("consume" in source) ) return;
    source.consume ??= {};
    const amount = source.consume.amount;
    if ( typeof amount === "string" ) {
      if ( amount === "" ) source.consume.amount = null;
      else if ( Number.isNumeric(amount) ) source.consume.amount = Number(amount);
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
   * Does this Item draw from ammunition?
   * @type {boolean}
   */
  get hasAmmo() {
    const consume = this.consume;
    return this.isActive && !!consume.target && !!consume.type && this.hasAttack && (consume.type === "ammo");
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
}
