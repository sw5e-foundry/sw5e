import SystemDataModel from "../abstract.mjs";
import { AdvancementField, IdentifierField } from "../fields.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Deployment items.
 * @mixes ItemDescriptionTemplate
 *
 * @property {string} identifier                   Identifier slug for this deployment.
 * @property {number} rank                         Current rank in this deployment.
 * @property {object[]} advancement                Advancement objects for this deployment.
 */
export default class DeploymentData extends SystemDataModel.mixin(ItemDescriptionTemplate) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      identifier: new IdentifierField({ required: true, label: "SW5E.Identifier" }),
      rank: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        min: 0,
        initial: 1,
        label: "SW5E.Rank"
      }),
      advancement: new foundry.data.fields.ArrayField(new AdvancementField(), { label: "SW5E.AdvancementTitle" }),
      flavorText: new foundry.data.fields.SchemaField(
        { value: new foundry.data.fields.StringField({ required: true, initial: "" }) },
        { label: "SW5E.ChatFlavor" }
      )
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    DeploymentData.#migrateRank(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the deployment rank.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateRank(source) {
    if (typeof source.rank !== "string") return;
    if (source.rank === "") source.rank = 1;
    else if (Number.isNumeric(source.rank)) source.rank = Number(source.rank);
  }
}
