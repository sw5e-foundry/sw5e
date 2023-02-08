import SystemDataModel from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import EquippableItemTemplate from "./templates/equippable-item.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import makeItemProperties from "./helpers.mjs";

/**
 * Data definition for Consumable items.
 * @mixes ItemDescriptionTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {string} consumableType     Type of consumable as defined in `SW5E.consumableTypes`.
 * @property {object} uses
 * @property {boolean} uses.autoDestroy  Should this item be destroyed when it runs out of uses.
 * @property {object} properties         Mapping of various weapon property booleans and numbers.
 */
export default class ConsumableData extends SystemDataModel.mixin(
  ItemDescriptionTemplate,
  PhysicalItemTemplate,
  EquippableItemTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      consumableType: new foundry.data.fields.StringField({
        required: true,
        initial: "potion",
        label: "SW5E.ItemConsumableType"
      }),
      uses: new ActivatedEffectTemplate.ItemUsesField(
        {
          autoDestroy: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.ItemDestroyEmpty" })
        },
        { label: "SW5E.LimitedUses" }
      ),
      properties: makeItemProperties(CONFIG.SW5E.weaponProperties, {
        required: true,
        label: "SW5E.ItemWeaponProperties"
      }),
    });
  }
}
