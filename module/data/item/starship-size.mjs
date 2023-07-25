import SystemDataModel from "../abstract.mjs";
import { AdvancementField, IdentifierField } from "../fields.mjs";
import ItemDescriptionTemplate from "./templates/item-description.mjs";

/**
 * Data definition for Starship Size items.
 * @mixes ItemDescriptionTemplate
 *
 * @property {string} identifier         Identifier slug for this.
 * @property {number} tier               Current tier.
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
 * @property {number} hardpointMult      Multiplier to the ammount of Fires per turn on a starship of this size.
 * @property {number} equipCostMult      Multiplier to the cost of equipment for a starship of this size.
 * @property {number} equipMinWorkforce  Minimum workforce needed to install equipment on a starship of this size.
 * @property {number} cargoCap           Starship's cargo capacity.
 * @property {number} fuelCost           Cost per unit of fuel for a starship of this size.
 * @property {number} fuelCap            Starship's fuel capacity.
 */
export default class StarshipSizeData extends SystemDataModel.mixin(ItemDescriptionTemplate) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      identifier: new IdentifierField({ required: true, label: "SW5E.Identifier" }),
      tier: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        // Min: 0, // Min removed because of advancements
        initial: 0,
        label: "SW5E.StarshipTiers"
      }),
      hullDice: new foundry.data.fields.StringField({
        required: true,
        initial: "d6",
        blank: false,
        label: "SW5E.HullDice",
        validate: v => /d\d+/.test(v),
        validationError: "must be a dice value in the format d#"
      }),
      hullDiceStart: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 3,
        min: 0,
        label: "SW5E.HullDiceStart"
      }),
      hullDiceUsed: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        label: "SW5E.HullDiceUsed"
      }),
      shldDice: new foundry.data.fields.StringField({
        required: true,
        initial: "d6",
        blank: false,
        label: "SW5E.ShieldDice",
        validate: v => /d\d+/.test(v),
        validationError: "must be a dice value in the format d#"
      }),
      shldDiceStart: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 3,
        min: 0,
        label: "SW5E.ShieldDiceStart"
      }),
      shldDiceUsed: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        label: "SW5E.ShieldDiceUsed"
      }),
      advancement: new foundry.data.fields.ArrayField(new AdvancementField(), { label: "SW5E.AdvancementTitle" }),

      buildBaseCost: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 50000,
        min: 0,
        label: "SW5E.BuildBaseCost"
      }),
      buildMinWorkforce: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 5,
        min: 0,
        label: "SW5E.BuildMinWorkforce"
      }),
      upgrdCostMult: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.UpgrdCostMult"
      }),
      upgrdMinWorkforce: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.UpgrdMinWorkforce"
      }),
      baseSpaceSpeed: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 300,
        min: 0,
        label: "SW5E.BaseSpaceSpeed"
      }),
      baseTurnSpeed: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 250,
        min: 0,
        label: "SW5E.BaseTurnSpeed"
      }),
      crewMinWorkforce: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.CrewMinWorkforce"
      }),
      modBaseCap: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 20,
        min: 0,
        label: "SW5E.ModBaseCap"
      }),
      modMaxSuitesBase: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        label: "SW5E.ModMaxSuitesBase"
      }),
      modMaxSuitesMult: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.ModMaxSuitesMult"
      }),
      modCostMult: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.ModCostMult"
      }),
      modMinWorkforce: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 2,
        min: 0,
        label: "SW5E.ModMinWorkforce"
      }),
      hardpointMult: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 2,
        min: 0,
        label: "SW5E.HardpointMult"
      }),
      equipCostMult: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.EquipCostMult"
      }),
      equipMinWorkforce: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 1,
        min: 0,
        label: "SW5E.EquipMinWorkforce"
      }),
      cargoCap: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 2,
        min: 0,
        label: "SW5E.CargoCap"
      }),
      fuelCost: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 50,
        min: 0,
        label: "SW5E.FuelCost"
      }),
      fuelCap: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 10,
        min: 0,
        label: "SW5E.FuelCap"
      }),
      foodCap: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 10,
        min: 0,
        label: "SW5E.FoodCap"
      }),
      source: new foundry.data.fields.StringField({ required: true, label: "SW5E.Source", initial: "SotG" })
    });
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
  }
}
