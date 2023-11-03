import SystemDataModel from "../abstract.mjs";
import { FormulaField, MappingField } from "../fields.mjs";
import ActionTemplate from "./templates/action.mjs";
import ActivatedEffectTemplate from "./templates/activated-effect.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Power items.
 * @mixes ItemDescriptionTemplate
 * @mixes ActivatedEffectTemplate
 * @mixes ActionTemplate
 *
 * @property {number} level                      Base level of the power.
 * @property {string} school                     Magical school to which this power belongs.
 * @property {object} components                 General components and tags for this power.
 * @property {boolean} components.vocal          Does this power require vocal components?
 * @property {boolean} components.somatic        Does this power require somatic components?
 * @property {boolean} components.material       Does this power require material components?
 * @property {boolean} components.ritual         Can this power be cast as a ritual?
 * @property {boolean} components.concentration  Does this power require concentration?
 * @property {object} materials                  Details on material components required for this power.
 * @property {string} materials.value            Description of the material components required for casting.
 * @property {boolean} materials.consumed        Are these material components consumed during casting?
 * @property {number} materials.cost             GP cost for the required components.
 * @property {number} materials.supply           Quantity of this component available.
 * @property {object} preparation                Details on how this power is prepared.
 * @property {string} preparation.mode           Power preparation mode as defined in `SW5E.powerPreparationModes`.
 * @property {boolean} preparation.prepared      Is the power currently prepared?
 * @property {object} scaling                    Details on how casting at higher levels affects this power.
 * @property {string} scaling.mode               Power scaling mode as defined in `SW5E.powerScalingModes`.
 * @property {string} scaling.formula            Dice formula used for scaling.
 */
export default class PowerData extends SystemDataModel.mixin(
  ItemDescriptionTemplate,
  ActivatedEffectTemplate,
  ActionTemplate
) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      level: new foundry.data.fields.NumberField({
        required: true,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.PowerLevel"
      }),
      school: new foundry.data.fields.StringField({ required: true, label: "SW5E.PowerSchool" }),
      components: new MappingField(new foundry.data.fields.BooleanField(), {
        required: true,
        label: "SW5E.PowerComponents",
        initialKeys: [...Object.keys(CONFIG.SW5E.powerComponents), ...Object.keys(CONFIG.SW5E.powerTags)]
      }),
      materials: new foundry.data.fields.SchemaField(
        {
          value: new foundry.data.fields.StringField({ required: true, label: "SW5E.PowerMaterialsDescription" }),
          consumed: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.PowerMaterialsConsumed" }),
          cost: new foundry.data.fields.NumberField({
            required: true,
            initial: 0,
            min: 0,
            label: "SW5E.PowerMaterialsCost"
          }),
          supply: new foundry.data.fields.NumberField({
            required: true,
            initial: 0,
            min: 0,
            label: "SW5E.PowerMaterialsSupply"
          })
        },
        { label: "SW5E.PowerMaterials" }
      ),
      preparation: new foundry.data.fields.SchemaField(
        {
          mode: new foundry.data.fields.StringField({
            required: true,
            initial: "prepared",
            label: "SW5E.PowerPreparationMode"
          }),
          prepared: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.PowerPrepared" })
        },
        { label: "SW5E.PowerPreparation" }
      ),
      scaling: new foundry.data.fields.SchemaField(
        {
          mode: new foundry.data.fields.StringField({ required: true, initial: "none", label: "SW5E.ScalingMode" }),
          formula: new FormulaField({ required: true, nullable: true, initial: null, label: "SW5E.ScalingFormula" })
        },
        { label: "SW5E.LevelScaling" }
      )
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
    PowerData.#migrateComponentData(source);
    PowerData.#migrateScaling(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the power's component object to remove any old, non-boolean values.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateComponentData(source) {
    if (!source.components) return;
    for (const [key, value] of Object.entries(source.components)) {
      if (typeof value !== "boolean") delete source.components[key];
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate power scaling.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateScaling(source) {
    if (!("scaling" in source)) return;
    if (source.scaling.mode === "" || source.scaling.mode === null) source.scaling.mode = "none";
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
      this.parent.labels.level,
      this.parent.labels.components.vsm + (this.parent.labels.materials ? ` (${this.parent.labels.materials})` : ""),
      ...this.parent.labels.components.tags
    ];
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeAbilityMod() {
    const abilities = this.parent?.actor?.system?.abilities;
    const attributes = this.parent?.actor?.system?.attributes;
    let school = this.school;
    if ( game.settings.get("sw5e", "simplifiedForcecasting") && ["lgt", "drk", "univ"].includes(school) ) school = "univ";
    return {
      lgt: attributes?.force?.override || "wis",
      drk: attributes?.force?.override || "cha",
      univ: attributes?.force?.override || (abilities.wis?.mod ?? 0) >= (abilities.cha?.mod ?? 0) ? "wis" : "cha",
      tech: attributes?.tech?.override || "int"
    }[school]
    || attributes?.powercasting || "int";
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get _typeCriticalThreshold() {
    return this.parent?.actor?.flags.sw5e?.powerCriticalThreshold ?? Infinity;
  }

  /* -------------------------------------------- */

  /**
   * The proficiency multiplier for this item.
   * @returns {number}
   */
  get proficiencyMultiplier() {
    return 1;
  }
}
