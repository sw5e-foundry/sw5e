import { MappingField } from "../fields.mjs";
import { ItemDataModel } from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import IdentifiableTemplate from "./templates/identifiable.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";
import { makeItemProperties, migrateItemProperties } from "./helpers.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Equipment items.
 * @mixes ItemDescriptionTemplate
 * @mixes ItemTypeTemplate
 * @mixes IdentifiableTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {string} modificationType      Modification type as defined in `SW5E.modificationTypes`.
 * @property {string} modificationSlot      Modification slot as defined in `SW5E.modificationSlots`.
 * @property {object} modifying
 * @property {string} modifying.id          Id of the item this modification is applied to.
 * @property {boolean} modifying.disabled   Is this modification disabled?
 */
export default class ModificationData extends ItemDataModel.mixin(
  ItemDescriptionTemplate,
  IdentifiableTemplate,
  ItemTypeTemplate,
  PhysicalItemTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      modificationType: new StringField({
        required: true,
        initial: "vibroweapon",
        label: "SW5E.ItemModificationType"
      }),
      modificationSlot: new StringField({
        required: true,
        initial: "slot1",
        label: "SW5E.ItemModificationSlot"
      }),
      modifying: new SchemaField(
        {
          id: new ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
          disabled: new BooleanField({})
        },
        {}
      ),
      properties: makeItemProperties(
        {
          ...CONFIG.SW5E.weaponProperties,
          ...CONFIG.SW5E.castingProperties,
          ...CONFIG.SW5E.equipmentProperties
        },
        {
          required: true,
          extraFields: {
            indeterminate: new MappingField(new foundry.data.fields.BooleanField({ initial: true }), {
              required: true,
              initialKeys: {
                ...CONFIG.SW5E.weaponProperties,
                ...CONFIG.SW5E.castingProperties,
                ...CONFIG.SW5E.equipmentProperties
              }
            })
          }
        }
      )
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    migrateItemProperties(source.properties, {
      ...CONFIG.SW5E.weaponProperties,
      ...CONFIG.SW5E.castingProperties,
      ...CONFIG.SW5E.equipmentProperties
    });
  }
}
