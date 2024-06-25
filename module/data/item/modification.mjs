import { ItemDataModel } from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import IdentifiableTemplate from "./templates/identifiable.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";

const { SchemaField, SetField, StringField } = foundry.data.fields;

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
    return this.mergeSchema( super.defineSchema(), {
      type: new ItemTypeField( { value: "vibroweapon", subtype: true }, { label: "SW5E.ItemModificationType" } ),
      modifying: new SchemaField(
        {
          id: new ForeignDocumentField( foundry.documents.BaseItem, { idOnly: true } ),
          disabled: new BooleanField( {} )
        },
        {}
      ),
      properties: new SetField( new StringField(), { label: "SW5E.ItemProperties" } )
    } );
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  // /** @inheritdoc */
  // static _migrateData( source ) {
  //   super._migrateData( source );
  // }
}
