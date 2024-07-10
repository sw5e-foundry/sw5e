import { ItemDataModel } from "../abstract.mjs";
import { FormulaField } from "../fields.mjs";
import EquippableItemTemplate from "./templates/equippable-item.mjs";
import IdentifiableTemplate from "./templates/identifiable.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemPropertiesTemplate from "./templates/item-properties.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";

/**
 * Data definition for Tool items.
 * @mixes ItemDescriptionTemplate
 * @mixes ItemPropertiesTemplate
 * @mixes ItemTypeTemplate
 * @mixes IdentifiableTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 *
 * @property {string} ability     Default ability when this tool is being used.
 * @property {string} chatFlavor  Additional text added to chat when this tool is used.
 * @property {number} proficient  Level of proficiency in this tool as defined in `SW5E.proficiencyLevels`.
 * @property {string} bonus       Bonus formula added to tool rolls.
 */
export default class ToolData extends ItemDataModel.mixin(
  ItemDescriptionTemplate,
  ItemPropertiesTemplate,
  ItemTypeTemplate,
  IdentifiableTemplate,
  PhysicalItemTemplate,
  EquippableItemTemplate,
  ActivatedEffectTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema( super.defineSchema(), {
      type: new ItemTypeField( { subtype: false }, { label: "SW5E.ItemToolType" } ),
      ability: new foundry.data.fields.StringField( {
        required: true, blank: true, label: "SW5E.DefaultAbilityCheck"
      } ),
      chatFlavor: new foundry.data.fields.StringField( { required: true, label: "SW5E.ChatFlavor" } ),
      proficient: new foundry.data.fields.NumberField( {
        required: true, initial: null, min: 0, max: 5, step: 0.5, label: "SW5E.ItemToolProficiency"
      } ),
      bonus: new FormulaField( { required: true, label: "SW5E.ItemToolBonus" } )
    } );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static metadata = Object.freeze( foundry.utils.mergeObject( super.metadata, {
    enchantable: true,
    inventoryItem: true,
    inventoryOrder: 400
  }, { inplace: false } ) );

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData( source ) {
    super._migrateData( source );
    ToolData.#migrateAbility( source );
  }

  /* -------------------------------------------- */

  /**
   * Migrate the ability field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateAbility( source ) {
    if ( Array.isArray( source.ability ) ) source.ability = source.ability[0];
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.type.label = CONFIG.SW5E.toolTypes[this.type.value] ?? game.i18n.localize( CONFIG.Item.typeLabels.tool );
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareFinalData() {
    this.prepareFinalEquippableData();
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async getFavoriteData() {
    return foundry.utils.mergeObject( await super.getFavoriteData(), {
      subtitle: this.type.label,
      modifier: this.parent.parent?.system.tools?.[this.type.baseItem]?.total
    } );
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [CONFIG.SW5E.abilities[this.ability]?.label];
  }

  /* -------------------------------------------- */

  /**
   * Properties displayed on the item card.
   * @type {string[]}
   */
  get cardProperties() {
    return [CONFIG.SW5E.abilities[this.ability]?.label];
  }

  /* -------------------------------------------- */

  /**
   * Which ability score modifier is used by this item?
   * @type {string|null}
   */
  get abilityMod() {
    return this.ability || "int";
  }

  /* -------------------------------------------- */

  /**
   * The proficiency multiplier for this item.
   * @returns {number}
   */
  get proficiencyMultiplier() {
    if ( Number.isFinite( this.proficient ) ) return this.proficient;
    const actor = this.parent.actor;
    if ( !actor ) return 0;
    if ( actor.type === "npc" ) return 1;
    const baseItemProf = actor.system.tools?.[this.type.baseItem];
    const categoryProf = actor.system.tools?.[this.type.value];
    return Math.min( Math.max( baseItemProf?.value ?? 0, categoryProf?.value ?? 0 ), 2 );
  }
}
