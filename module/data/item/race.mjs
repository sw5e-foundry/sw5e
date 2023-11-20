import Actor5e from "../../documents/actor/actor.mjs";
import SystemDataModel from "../abstract.mjs";
import { AdvancementField, IdentifierField } from "../fields.mjs";
import { CreatureTypeField, MovementField, SensesField } from "../shared/_module.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Species items.
 * @mixes ItemDescriptionTemplate
 *
 * @property {string} identifier       Identifier slug for this species.
 * @property {object[]} advancement    Advancement objects for this species.
 * @property {MovementField} movement
 * @property {SensesField} senses
 * @property {CreatureType} type
 */
export default class SpeciesData extends SystemDataModel.mixin(ItemDescriptionTemplate) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      identifier: new IdentifierField({label: "SW5E.Identifier"}),
      advancement: new foundry.data.fields.ArrayField(new AdvancementField(), {label: "SW5E.AdvancementTitle"}),
      movement: new MovementField(),
      senses: new SensesField(),
      type: new CreatureTypeField({ swarm: false }, { initial: { value: "humanoid" } })
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static metadata = Object.freeze({
    singleton: true
  });

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * Sheet labels for a species's movement.
   * @returns {Object<string>}
   */
  get movementLabels() {
    const units = CONFIG.SW5E.movementUnits[this.movement.units || Object.keys(CONFIG.SW5E.movementUnits)[0]];
    return Object.entries(CONFIG.SW5E.movementTypes).reduce((obj, [k, label]) => {
      const value = this.movement[k];
      if ( value ) obj[k] = `${label} ${value} ${units}`;
      return obj;
    }, {});
  }

  /* -------------------------------------------- */

  /**
   * Sheet labels for a species's senses.
   * @returns {Object<string>}
   */
  get sensesLabels() {
    const units = CONFIG.SW5E.movementUnits[this.senses.units || Object.keys(CONFIG.SW5E.movementUnits)[0]];
    return Object.entries(CONFIG.SW5E.senses).reduce((arr, [k, label]) => {
      const value = this.senses[k];
      if ( value ) arr.push(`${label} ${value} ${units}`);
      return arr;
    }, []).concat(this.senses.special.split(";").filter(l => l));
  }

  /* -------------------------------------------- */

  /**
   * Sheet label for a species's creature type.
   * @returns {Object<string>}
   */
  get typeLabel() {
    return Actor5e.formatCreatureType(this.type);
  }

  /* -------------------------------------------- */
  /*  Socket Event Handlers                       */
  /* -------------------------------------------- */

  /**
   * Create default advancement items when species is created.
   * @param {object} data               The initial data object provided to the document creation request.
   * @param {object} options            Additional options which modify the creation request.
   * @param {User} user                 The User requesting the document creation.
   * @returns {Promise<boolean|void>}   A return value of false indicates the creation operation should be cancelled.
   * @see {Document#_preCreate}
   * @protected
   */
  async _preCreate(data, options, user) {
    if ( data._id || foundry.utils.hasProperty(data, "system.advancement") ) return;
    const toCreate = [
      { type: "AbilityScoreImprovement" }, { type: "Size" },
      { type: "Trait", configuration: { grants: ["languages:standard:common"] } }
    ];
    this.parent.updateSource({"system.advancement": toCreate.map(c => {
      const AdvancementClass = CONFIG.SW5E.advancementTypes[c.type];
      return new AdvancementClass(c, { parent: this.parent }).toObject();
    })});
  }

  /* -------------------------------------------- */

  /**
   * Set the species reference in actor data.
   * @param {object} data     The initial data object provided to the document creation request
   * @param {object} options  Additional options which modify the creation request
   * @param {string} userId   The id of the User requesting the document update
   * @see {Document#_onCreate}
   * @protected
   */
  _onCreate(data, options, userId) {
    if ( (game.user.id !== userId) || this.parent.actor?.type !== "character" ) return;
    this.parent.actor.update({ "system.details.species": this.parent.id });
  }

  /* -------------------------------------------- */

  /**
   * Remove the species reference in actor data.
   * @param {object} options            Additional options which modify the deletion request
   * @param {documents.BaseUser} user   The User requesting the document deletion
   * @returns {Promise<boolean|void>}   A return value of false indicates the deletion operation should be cancelled.
   * @see {Document#_preDelete}
   * @protected
   */
  async _preDelete(options, user) {
    if ( (this.parent.actor?.type !== "character") ) return;
    await this.parent.actor.update({ "system.details.species": null });
  }
}
