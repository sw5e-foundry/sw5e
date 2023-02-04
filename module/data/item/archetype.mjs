import SystemDataModel from "../abstract.mjs";
import { AdvancementField, IdentifierField } from "../fields.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Archetype items.
 * @mixes ItemDescriptionTemplate
 *
 * @property {string} identifier       Identifier slug for this archetype.
 * @property {string} classIdentifier  Identifier slug for the class with which this archetype should be associated.
 * @property {object[]} advancement    Advancement objects for this archetype.
 * @property {object} powercasting              Details on archetype's powercasting ability.
 * @property {string} powercasting.progression  Power progression granted by class as from `SW5E.powerProgression`.
 * @property {string} powercasting.ability      Ability score to use for powercasting.
 */
export default class ArchetypeData extends SystemDataModel.mixin(ItemDescriptionTemplate) {
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
          progression: new foundry.data.fields.StringField({
            required: true,
            initial: "none",
            blank: false,
            label: "SW5E.PowerProgression"
          }),
          ability: new foundry.data.fields.StringField({ required: true, label: "SW5E.PowerAbility" })
        },
        { label: "SW5E.Powercasting" }
      )
    });
  }
}
