import TraitAdvancement from "../../documents/advancement/trait.mjs";
import { ItemDataModel } from "../abstract.mjs";
import { AdvancementField, FormulaField, IdentifierField } from "../fields.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";
import StartingEquipmentTemplate from "./templates/starting-equipment.mjs";

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Data definition for Starship Size items.
 * @mixes ItemDescriptionTemplate
 * @mixes StartingEquipmentTemplate
 *
 * @property {string} identifier         Identifier slug for this.
 * @property {number} tier               Current tier.
 * @property {string} size               Short code for size as defined in `SW5E.actorSizes`.
 * @property {string} hullDice           Denomination of hull dice available as defined in `SW5E.hullDieTypes`.
 * @property {number} hullDiceStart      Number of hull dice at tier 0.
 * @property {number} hullDiceUsed       Number of hull dice consumed.
 * @property {string} shldDice           Denomination of shield dice available as defined in `SW5E.shldDieTypes`.
 * @property {number} shldDiceStart      Number of shield dice at tier 0.
 * @property {number} shldDiceUsed       Number of shield dice consumed.
 * @property {object[]} advancement      Advancement objects for this.
 * @property {number} buildBaseCost      Base cost of building a starship of this size.
 * @property {number} buildMinWorkforce  Minimum worforce needed to build a starship of this size.
 * @property {number} upgrdCostMult      Multiplier to the cost of upgrading a starship of this size.
 * @property {number} upgrdMinWorkforce  Minimum worforce needed to upgrade a starship of this size.
 * @property {number} baseSpaceSpeed     Starship's base space speed. // Only used with old movement rules.
 * @property {number} baseTurnSpeed      Starship's base turn speed. // Only used with old movement rules.
 * @property {number} crewMinWorkforce   Minimum workforce needed to crew a starship of this size.
 * @property {number} modBaseCap         Base capacity of mods on a starship of this size.
 * @property {number} modMaxSuitesBase   Base capacity of suite mods on a starship of this size.
 * @property {number} modMaxSuitesMult   Increase in capacity of suite mods per CON mod on a starship of this size.
 * @property {number} modMinWorkforce    Minimum workforce needed to install a mod on a starship of this size.
 * @property {number} hardpointMult      Multiplier to the amount of Fires per turn on a starship of this size.
 * @property {number} equipCostMult      Multiplier to the cost of equipment for a starship of this size.
 * @property {number} equipMinWorkforce  Minimum workforce needed to install equipment on a starship of this size.
 * @property {number} cargoCap           Starship's cargo capacity.
 * @property {number} fuelCost           Cost per unit of fuel for a starship of this size.
 * @property {number} fuelCap            Starship's fuel capacity.
 */
export default class StarshipSizeData extends ItemDataModel.mixin( ItemDescriptionTemplate, StartingEquipmentTemplate ) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema( super.defineSchema(), {
      identifier: new IdentifierField( { required: true, label: "SW5E.Identifier" } ),
      tier: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        // Min: 0, // Min removed because of advancements
        initial: 0,
        label: "SW5E.StarshipTiers"
      } ),
      size: new StringField( {
        required: true,
        initial: "med",
        blank: false,
        label: "SW5E.StarshipSize"
      } ),
      hullDice: new StringField( {
        required: true,
        initial: "d6",
        blank: false,
        label: "SW5E.HullDice",
        validate: v => /d\d+/.test( v ),
        validationError: "must be a dice value in the format d#"
      } ),
      hullDiceStart: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 3,
        min: 0,
        label: "SW5E.HullDiceStart"
      } ),
      hullDiceUsed: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        label: "SW5E.HullDiceUsed"
      } ),
      shldDice: new StringField( {
        required: true,
        initial: "d6",
        blank: false,
        label: "SW5E.ShieldDice",
        validate: v => /d\d+/.test( v ),
        validationError: "must be a dice value in the format d#"
      } ),
      shldDiceStart: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 3,
        min: 0,
        label: "SW5E.ShieldDiceStart"
      } ),
      shldDiceUsed: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        label: "SW5E.ShieldDiceUsed"
      } ),
      advancement: new ArrayField( new AdvancementField(), { label: "SW5E.AdvancementTitle" } ),

      buildBaseCost: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 50000,
        min: 0,
        label: "SW5E.BuildBaseCost"
      } ),
      buildMinWorkforce: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 5,
        min: 0,
        label: "SW5E.BuildMinWorkforce"
      } ),
      upgrdCostMult: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.UpgrdCostMult"
      } ),
      upgrdMinWorkforce: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.UpgrdMinWorkforce"
      } ),
      baseSpaceSpeed: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 300,
        min: 0,
        label: "SW5E.BaseSpaceSpeed"
      } ),
      baseTurnSpeed: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 250,
        min: 0,
        label: "SW5E.BaseTurnSpeed"
      } ),
      crewMinWorkforce: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.CrewMinWorkforce"
      } ),
      modBaseCap: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 20,
        min: 0,
        label: "SW5E.ModBaseCap"
      } ),
      modMaxSuitesBase: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        label: "SW5E.ModMaxSuitesBase"
      } ),
      modMaxSuitesMult: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.ModMaxSuitesMult"
      } ),
      modCostMult: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.ModCostMult"
      } ),
      modMinWorkforce: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 2,
        min: 0,
        label: "SW5E.ModMinWorkforce"
      } ),
      hardpointMult: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 2,
        min: 0,
        label: "SW5E.HardpointMult"
      } ),
      equipCostMult: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.EquipCostMult"
      } ),
      equipMinWorkforce: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.EquipMinWorkforce"
      } ),
      cargoCap: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 2,
        min: 0,
        label: "SW5E.CargoCap"
      } ),
      fuelCost: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 50,
        min: 0,
        label: "SW5E.FuelCost"
      } ),
      fuelCap: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 10,
        min: 0,
        label: "SW5E.FuelCap"
      } ),
      foodCap: new NumberField( {
        required: true,
        nullable: false,
        integer: true,
        initial: 10,
        min: 0,
        label: "SW5E.FoodCap"
      } ),
      source: new StringField( { required: true, label: "SW5E.Source", initial: "SotG" } )
    } );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static metadata = Object.freeze( foundry.utils.mergeObject( super.metadata, {
    singleton: true
  }, {inplace: false} ) );

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /** @inheritDoc */
  async getFavoriteData() {
    const context = await super.getFavoriteData();
    if ( this.parent.archetype ) context.subtitle = this.parent.archetype.name;
    context.value = this.levels;
    return context;
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData( source ) {
    super._migrateData( source );
    StarshipSizeData.#migrateSize( source );
  }

  /* -------------------------------------------- */

  /**
   * Apply migrations to the size field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateSize( source ) {
    const sizes = CONFIG.SW5E.actorSizes;
    if ( source.size in sizes ) return;
    for ( const [key, label] of Object.entries( sizes ) ) {
      if ( label.toLowerCase().match( source.identifier ) ) {
        source.size = key;
        return;
      }
    }
    source.size = "med";
  }

  /* -------------------------------------------- */
  /*  Socket Event Handlers                       */
  /* -------------------------------------------- */

  /**
   * Create default advancement items when starship size is created.
   * @param {object} data               The initial data object provided to the document creation request.
   * @param {object} options            Additional options which modify the creation request.
   * @param {User} user                 The User requesting the document creation.
   * @returns {Promise<boolean|void>}   A return value of false indicates the creation operation should be cancelled.
   * @see {Document#_preCreate}
   * @protected
   */
  async _preCreate( data, options, user ) {
    if ( data._id || foundry.utils.hasProperty( data, "system.advancement" ) ) return;
    const toCreate = [
      { type: "AbilityScoreImprovement" }, { type: "Size" }
    ];
    this.parent.updateSource( {"system.advancement": toCreate.map( c => {
      const config = CONFIG.SW5E.advancementTypes[c.type];
      const cls = config.documentClass ?? config;
      return new cls( c, { parent: this.parent } ).toObject();
    } )} );
  }

  /**
   * Set the size reference in actor data.
   * @param {object} data     The initial data object provided to the document creation request
   * @param {object} options  Additional options which modify the creation request
   * @param {string} userId   The id of the User requesting the document update
   * @see {Document#_onCreate}
   * @protected
   */
  _onCreate( data, options, userId ) {
    if ( ( game.user.id !== userId ) || this.parent.actor?.type !== "starship" ) return;
    this.parent.actor.update( {"system.details.starshipsize": this.parent.id} );
  }

  /* -------------------------------------------- */

  /**
   * Remove the size reference in actor data.
   * @param {object} options            Additional options which modify the deletion request
   * @param {documents.BaseUser} user   The User requesting the document deletion
   * @returns {Promise<boolean|void>}   A return value of false indicates the deletion operation should be cancelled.
   * @see {Document#_preDelete}
   * @protected
   */
  async _preDelete( options, user ) {
    if ( this.parent.actor?.type !== "starship" ) return;
    await this.parent.actor.update( {"system.details.starshipsize": null} );
  }
}
