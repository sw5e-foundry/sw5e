import { MappingField } from "../fields.mjs";
import SystemDataModel from "../abstract.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import PhysicalItemTemplate from "./templates/physical-item.mjs";
import { makeItemProperties, migrateItemProperties } from "./helpers.mjs";

/**
 * Data definition for Starship Modification items.
 * @mixes ItemDescriptionTemplate
 * @mixes PhysicalItemTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {string} modificationType      Modification type as defined in `SW5E.modificationTypes`.
 */
export default class StarshipModData extends SystemDataModel.mixin(
  ItemDescriptionTemplate,
  PhysicalItemTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      system: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.StringField({
            required: true,
            initial: "",
            label: "SW5E.ModSystem"
          })
        },
        { label: "SW5E.ModSystem" }
      ),
      grade: new foundry.data.fields.SchemaField(
        {
          proficient: new foundry.data.fields.NumberField({
            required: true,
            min: 0,
            max: 5,
            integer: true,
            initial: 0,
            label: "SW5E.ModGrade"
          }),
        },
        { label: "SW5E.ModGrade" }
      ),
      baseCost: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.NumberField({
            required: true,
            min: 0,
            integer: true,
            initial: 0,
            label: "SW5E.ModBaseCost"
          })
        },
        { label: "SW5E.ModBaseCost" }
      ),
      free: new foundry.data.fields.SchemaField(
        {
          slot: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.ModFreeSlot" }),
          suite: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.ModFreeSuite" })
        }
      )
    });
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
