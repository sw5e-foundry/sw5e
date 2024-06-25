import { MappingField } from "../fields.mjs";
import { ItemDataModel } from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import EquippableItemTemplate from "./templates/equippable-item.mjs";
import IdentifiableTemplate from "./templates/identifiable.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import ItemTypeTemplate from "./templates/item-type.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import ItemTypeField from "./fields/item-type-field.mjs";
import { makeItemProperties, migrateItemProperties } from "./helpers.mjs";

const { NumberField, SchemaField, SetField, StringField } = foundry.data.fields;

/**
 * Data definition for Starship Modification items.
 * @mixes ItemDescriptionTemplate
 * @mixes ItemTypeTemplate
 * @mixes IdentifiableTemplate
 * @mixes PhysicalItemTemplate
 * @mixes EquippableItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {string} modificationType      Modification type as defined in `SW5E.modificationTypes`. * @property {object} armor               Armor details and equipment type information.
 * @property {object} system               The starship modification system information.
 * @property {string} system.value         The starship system being modified.
 * @property {object} grade                The starship modification grade information.
 * @property {string} grade.value          The grade of the modification.
 * @property {object} baseCost             The starship modification base cost information.
 * @property {number} baseCost.value       The base cost of the modification.
 * @property {object} free
 * @property {number} free.slot
 * @property {object} free.suite
 * @property {object} prerequisites        The starship modification prerequisite information.
 * @property {string} prerequisites.value  The prerequisite of the modification.
 */
export default class StarshipModData extends ItemDataModel.mixin(
  ItemDescriptionTemplate,
  IdentifiableTemplate,
  ItemTypeTemplate,
  PhysicalItemTemplate,
  EquippableItemTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema( super.defineSchema(), {
      system: new SchemaField(
        {
          value: new StringField( {
            required: true,
            initial: "",
            label: "SW5E.ModSystem"
          } )
        },
        { label: "SW5E.ModSystem" }
      ),
      grade: new SchemaField(
        {
          value: new NumberField( {
            required: true,
            min: 0,
            max: 5,
            integer: true,
            initial: 0,
            label: "SW5E.ModGrade"
          } )
        },
        { label: "SW5E.ModGrade" }
      ),
      baseCost: new SchemaField(
        {
          value: new NumberField( {
            required: true,
            min: 0,
            integer: true,
            initial: null,
            nullable: true,
            label: "SW5E.ModBaseCost"
          } )
        },
        { label: "SW5E.ModBaseCost" }
      ),
      free: new SchemaField(
        {
          slot: new BooleanField( { required: true, label: "SW5E.ModFreeSlot" } ),
          suite: new BooleanField( { required: true, label: "SW5E.ModFreeSuite" } )
        }
      ),
      prerequisites: new SchemaField(
        {
          value: new StringField( {
            required: true,
            initial: "",
            label: "SW5E.PrerequisitePl"
          } )
        },
        { label: "SW5E.PrerequisitePl" }
      )
    } );
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  // /** @inheritdoc */
  // static _migrateData(source) {
  //   super._migrateData(source);
  // }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  /**
   * Properties displayed in chat.
   * @type {string[]}
   */
  get chatProperties() {
    return [CONFIG.SW5E.ssModSystems[this.system.value]];
  }

  /**
   * Is this a starship item.
   * @type {boolean}
   */
  get isStarshipItem() {
    return true;
  }
}
