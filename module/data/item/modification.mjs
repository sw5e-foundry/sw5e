import { MappingField } from "../fields.mjs";
import SystemDataModel from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import { MapField } from "../fields.mjs";


/**
 * Data definition for Equipment items.
 * @mixes ItemDescriptionTemplate
 * @mixes PhysicalItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {string} modificationType      Modification type as defined in `SW5E.modificationTypes`.
 * @property {string} modificationSlot      Modification slot as defined in `SW5E.modificationSlots`.
 * @property {object} modifying
 * @property {string} modifying.id          Id of the item this modification is applied to.
 * @property {boolean} modifying.disabled   Is this modification disabled?
 */
export default class ModificationData extends SystemDataModel.mixin(
  ItemDescriptionTemplate,
  PhysicalItemTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      modificationType: new foundry.data.fields.StringField({
        required: true,
        initial: "vibroweapon",
        label: "SW5E.ItemModificationType"
      }),
      modificationSlot: new foundry.data.fields.StringField({
        required: true,
        initial: "slot1",
        label: "SW5E.ItemModificationSlot"
      }),
      modifying: new foundry.data.fields.SchemaField(
        {
          id: new foundry.data.fields.ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
          disabled: new foundry.data.fields.BooleanField({})
        },
        {}
      ),
      properties: new foundry.data.fields.MapField({ label: "SW5E.ItemToolProperties" })
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
