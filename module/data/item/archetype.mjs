import { ItemDataModel } from "../abstract.mjs";
import { AdvancementField, IdentifierField } from "../fields.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Archetype items.
 * @mixes ItemDescriptionTemplate
 *
 * @property {string} identifier       Identifier slug for this archetype.
 * @property {string} classIdentifier  Identifier slug for the class with which this archetype should be associated.
 * @property {object[]} advancement    Advancement objects for this archetype.
 * @property {object} powercasting                 Details on class's powercasting ability.
 * @property {string} powercasting.force           Force power progression as defined in `SW5E.powerProgression`.
 * @property {string} powercasting.forceOverride   Ability score to use for forcecasting.
 * @property {string} powercasting.tech            Tech power progression as defined in `SW5E.powerProgression`.
 * @property {string} powercasting.techOverride    Ability score to use for techcasting.
 * @property {object} superiority                  Details on class's superiority ability.
 * @property {string} superiority.progression      Superiority progression as defined in `SW5E.superiorityProgression`.
 */
export default class ArchetypeData extends ItemDataModel.mixin(ItemDescriptionTemplate) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      identifier: new IdentifierField({ required: true, label: "SW5E.Identifier" }),
      classIdentifier: new IdentifierField({
        required: true,
        label: "SW5E.ClassIdentifier",
        hint: "SW5E.ClassIdentifierHint"
      }),
      advancement: new foundry.data.fields.ArrayField(new AdvancementField(), { label: "SW5E.AdvancementTitle" }),
      powercasting: new foundry.data.fields.SchemaField(
        {
          force: new foundry.data.fields.StringField({
            required: true,
            initial: "none",
            blank: false,
            label: "SW5E.ForcePowerProgression"
          }),
          forceOverride: new foundry.data.fields.StringField({ required: true, label: "SW5E.ForceCastingOverride" }),
          tech: new foundry.data.fields.StringField({
            required: true,
            initial: "none",
            blank: false,
            label: "SW5E.TechPowerProgression"
          }),
          techOverride: new foundry.data.fields.StringField({ required: true, label: "SW5E.TechCastingOverride" })
        },
        { label: "SW5E.Powercasting" }
      ),
      superiority: new foundry.data.fields.SchemaField(
        {
          progression: new foundry.data.fields.NumberField({
            required: true,
            initial: 0,
            label: "SW5E.SuperiorityProgression"
          })
        },
        { label: "SW5E.Superiority" }
      )
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    ArchetypeData.#migrateProgression(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the archetype progression.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateProgression(source) {
    if (typeof source.superiority.progression !== "number") source.superiority.progression = 0;
  }
}
