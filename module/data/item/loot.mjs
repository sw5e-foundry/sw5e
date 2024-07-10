import { ItemDataModel } from "../abstract.mjs";
import IdentifiableTemplate from "./templates/identifiable.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemPropertiesTemplate from "./templates/item-properties.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";

/**
 * Data definition for Loot items.
 * @mixes ItemDescriptionTemplate
 * @mixes ItemPropertiesTemplate
 * @mixes ItemTypeTemplate
 * @mixes IdentifiableTemplate
 * @mixes PhysicalItemTemplate
 */
export default class LootData extends ItemDataModel.mixin(
  ItemDescriptionTemplate,
  ItemPropertiesTemplate,
  ItemTypeTemplate,
  IdentifiableTemplate,
  PhysicalItemTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema( super.defineSchema(), {
      type: new ItemTypeField( { baseItem: false }, { label: "SW5E.ItemLootType" } )
    } );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static metadata = Object.freeze( foundry.utils.mergeObject( super.metadata, {
    enchantable: true,
    inventoryItem: true,
    inventoryOrder: 600
  }, { inplace: false } ) );

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.type.label = CONFIG.SW5E.lootTypes[this.type.value]?.label ?? game.i18n.localize( CONFIG.Item.typeLabels.loot );
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [
      this.type.label,
      this.weight ? `${this.weight.value} ${game.i18n.localize( "SW5E.AbbreviationLbs" )}` : null,
      this.priceLabel
    ];
  }
}
