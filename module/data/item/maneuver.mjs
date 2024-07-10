import { ItemDataModel } from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import { EnchantmentData } from "./fields/enchantment-field.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";

const { BooleanField, NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Maneuver items.
 * @mixes ItemDescriptionTemplate
 * @mixes ItemTypeTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {object} prerequisites
 * @property {number} prerequisites.level           Character or class level required to choose this maneuver.
 * @property {Set<string>} properties               General properties of a maneuver item.
 * @property {string} requirements                  Actor details required to use this maneuver.
 * @property {object} recharge                      Details on how a maneuver can roll for recharges.
 * @property {number} recharge.value                Minimum number needed to roll on a d6 to recharge this maneuver.
 * @property {boolean} recharge.charged             Does this maneuver have a charge remaining?
 */
export default class ManeuverData extends ItemDataModel.mixin(
  ItemDescriptionTemplate,
  ItemTypeTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {

  /** @override */
  static LOCALIZATION_PREFIXES = ["SW5E.Enchantment", "SW5E.Prerequisites"];

  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema( super.defineSchema(), {
      type: new ItemTypeField( { baseItem: false }, { label: "SW5E.ItemManeuverType" } ),
      prerequisites: new SchemaField( {
        level: new NumberField( { integer: true, min: 0 } )
      } ),
      properties: new SetField( new StringField(), {
        label: "SW5E.ItemManeuverProperties"
      } ),
      requirements: new StringField( { required: true, nullable: true, label: "SW5E.Requirements" } ),
      recharge: new SchemaField( {
        value: new NumberField( {
          required: true, integer: true, min: 1, label: "SW5E.ManeuverRechargeOn"
        } ),
        charged: new BooleanField( { required: true, label: "SW5E.Charged" } )
      }, { label: "SW5E.ManeuverActionRecharge" } )
    } );
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    if ( this.type.value ) {
      const config = CONFIG.SW5E.maneuverTypes[this.type.value];
      if ( config ) this.type.label = config.subtypes?.[this.type.subtype] ?? null;
      else this.type.label = game.i18n.localize( CONFIG.Item.typeLabels.maneuver );
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareFinalData() {
    this.prepareFinalActivatedEffectData();
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async getFavoriteData() {
    return foundry.utils.mergeObject( await super.getFavoriteData(), {
      subtitle: [this.parent.labels.activation, this.parent.labels.recovery],
      uses: this.hasLimitedUses ? this.getUsesData() : null
    } );
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData( source ) {
    super._migrateData( source );
    ManeuverData.#migrateType( source );
    ManeuverData.#migrateRecharge( source );
  }

  /* -------------------------------------------- */

  /**
   * Ensure feats have a type object.
   * @param {object} source The candidate source data from which the model will be constructed.
   */
  static #migrateType( source ) {
    if ( !( "type" in source ) ) return;
    if ( !source.type ) source.type = { value: "", subtype: "" };
  }

  /* -------------------------------------------- */

  /**
   * Migrate 0 values to null.
   * @param {object} source The candidate source data from which the model will be constructed.
   */
  static #migrateRecharge( source ) {
    if ( !( "recharge" in source ) ) return;
    const value = source.recharge.value;
    if ( ( value === 0 ) || ( value === "" ) ) source.recharge.value = null;
    else if ( ( typeof value === "string" ) && Number.isNumeric( value ) ) source.recharge.value = Number( value );
    if ( source.recharge.charged === null ) source.recharge.charged = false;
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [this.requirements];
  }

  /* -------------------------------------------- */

  /**
   * Properties displayed on the item card.
   * @type {string[]}
   */
  get cardProperties() {
    return [this.requirements];
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get hasLimitedUses() {
    return this.isActive && ( !!this.recharge.value || super.hasLimitedUses );
  }

  /* -------------------------------------------- */

  /**
   * Does this feature represent a group of individual enchantments (e.g. the "Infuse Item" feature stores data about
   * all of the character's infusions).
   * @type {boolean}
   */
  get isEnchantmentSource() {
    return EnchantmentData.isEnchantmentSource( this );
  }

  /* -------------------------------------------- */

  /**
   * The proficiency multiplier for this item.
   * @returns {number}
   */
  get proficiencyMultiplier() {
    return 1;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeAbilityMod() {
    const type = this.type.value;
    const item = this?.parent;
    const actor = item?.parent;
    const abilities = actor?.system?.abilities;

    let attrs = [];
    if ( type === "physical" ) attrs = ["str", "dex", "con"];
    else if ( type === "mental" ) attrs = ["int", "wis", "cha"];
    else attrs = ["str", "dex", "con", "int", "wis", "cha"];

    return attrs.reduce(
      ( acc, attr ) => {
        const mod = abilities?.[attr]?.mod ?? -Infinity;
        if ( mod > acc.mod ) acc = { attr, mod };
        return acc;
      },
      { attr: "str", mod: -Infinity }
    ).attr;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeCriticalThreshold() {
    return this.parent?.actor?.flags.sw5e?.maneuverCriticalThreshold ?? Infinity;
  }
}
