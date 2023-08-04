import SystemDataModel from "../abstract.mjs";
import { AdvancementField, IdentifierField } from "../fields.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Class items.
 * @mixes ItemDescriptionTemplate
 *
 * @property {string} identifier                   Identifier slug for this class.
 * @property {number} levels                       Current number of levels in this class.
 * @property {string} hitDice                      Denomination of hit dice available as defined in `SW5E.hitDieTypes`.
 * @property {number} hitDiceUsed                  Number of hit dice consumed.
 * @property {object[]} advancement                Advancement objects for this class.
 * @property {string[]} saves                      Savings throws in which this class grants proficiency.
 * @property {object} skills                       Available class skills and selected skills.
 * @property {number} skills.number                Number of skills selectable by the player.
 * @property {string[]} skills.choices             List of skill keys that are valid to be chosen.
 * @property {string[]} skills.value               List of skill keys the player has chosen.
 * @property {object} powercasting                 Details on class's powercasting ability.
 * @property {string} powercasting.force           Force power progression as defined in `SW5E.powerProgression`.
 * @property {string} powercasting.forceOverride   Ability score to use for forcecasting.
 * @property {string} powercasting.tech            Tech power progression as defined in `SW5E.powerProgression`.
 * @property {string} powercasting.techOverride    Ability score to use for techcasting.
 * @property {object} superiority
 * @property {string} superiority.progression      Superiority progression as defined in `SW5E.superiorityProgression`.
 * @property {object} atFlavorText
 * @property {string} atFlavorText.value           Flavor and list of class archetypes.
 * @property {object} invocations
 * @property {string} invocations.value            Flavor and list of class invocations.
 */
export default class ClassData extends SystemDataModel.mixin(ItemDescriptionTemplate) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      identifier: new IdentifierField({ required: true, label: "SW5E.Identifier" }),
      levels: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        min: 0,
        initial: 1,
        label: "SW5E.ClassLevels"
      }),
      hitDice: new foundry.data.fields.StringField({
        required: true,
        initial: "d6",
        blank: false,
        label: "SW5E.HitDice",
        validate: v => /d\d+/.test(v),
        validationError: "must be a dice value in the format d#"
      }),
      hitDiceUsed: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        label: "SW5E.HitDiceUsed"
      }),
      advancement: new foundry.data.fields.ArrayField(new AdvancementField(), { label: "SW5E.AdvancementTitle" }),
      saves: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), { label: "SW5E.ClassSaves" }),
      skills: new foundry.data.fields.SchemaField({
        number: new foundry.data.fields.NumberField({
          required: true,
          nullable: false,
          integer: true,
          min: 0,
          initial: 2,
          label: "SW5E.ClassSkillsNumber"
        }),
        choices: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), {
          label: "SW5E.ClassSkillsEligible"
        }),
        value: new foundry.data.fields.ArrayField(new foundry.data.fields.StringField(), {
          label: "SW5E.ClassSkillsChosen"
        })
      }),
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
      ),
      atFlavorText: new foundry.data.fields.SchemaField(
        { value: new foundry.data.fields.StringField({ required: true, initial: "" }) },
        { label: "SW5E.ArchetypePl" }
      ),
      invocations: new foundry.data.fields.SchemaField(
        { value: new foundry.data.fields.StringField({ required: true, initial: "" }) },
        { label: "SW5E.Invocations" }
      )
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
    ClassData.#migrateLevels(source);
    ClassData.#migratePowercastingData(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the class levels.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateLevels(source) {
    if (typeof source.levels !== "string") return;
    if (source.levels === "") source.levels = 1;
    else if (Number.isNumeric(source.levels)) source.levels = Number(source.levels);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the class's powercasting string to object.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migratePowercastingData(source) {
    if (source.powercasting?.force === "") source.powercasting.force = "none";
    if (source.powercasting?.tech === "") source.powercasting.tech = "none";
    if (source.superiority?.progression === "") source.superiority.progression = "none";
  }
}
