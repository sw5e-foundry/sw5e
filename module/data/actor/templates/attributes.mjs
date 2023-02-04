import { FormulaField } from "../../fields.mjs";

/**
 * Shared contents of the attributes schema between various actor types.
 */
export default class AttributesFields {
  /**
   * Fields shared between characters, NPCs, and vehicles.
   *
   * @type {object}
   * @property {object} init
   * @property {number} init.value       Calculated initiative modifier.
   * @property {number} init.bonus       Fixed bonus provided to initiative rolls.
   * @property {object} movement
   * @property {number} movement.burrow  Actor burrowing speed.
   * @property {number} movement.climb   Actor climbing speed.
   * @property {number} movement.fly     Actor flying speed.
   * @property {number} movement.swim    Actor swimming speed.
   * @property {number} movement.walk    Actor walking speed.
   * @property {string} movement.units   Movement used to measure the various speeds.
   * @property {boolean} movement.hover  Is this flying creature able to hover in place.
   */
  static get common() {
    return {
      init: new foundry.data.fields.SchemaField(
        {
          ability: new foundry.data.fields.StringField({ label: "SW5E.AbilityModifier" }),
          bonus: new FormulaField({ label: "SW5E.InitiativeBonus" })
        },
        { label: "SW5E.Initiative" }
      ),
      movement: new foundry.data.fields.SchemaField(
        {
          burrow: new foundry.data.fields.NumberField({
            nullable: false,
            min: 0,
            step: 0.1,
            initial: 0,
            label: "SW5E.MovementBurrow"
          }),
          climb: new foundry.data.fields.NumberField({
            nullable: false,
            min: 0,
            step: 0.1,
            initial: 0,
            label: "SW5E.MovementClimb"
          }),
          fly: new foundry.data.fields.NumberField({
            nullable: false,
            min: 0,
            step: 0.1,
            initial: 0,
            label: "SW5E.MovementFly"
          }),
          swim: new foundry.data.fields.NumberField({
            nullable: false,
            min: 0,
            step: 0.1,
            initial: 0,
            label: "SW5E.MovementSwim"
          }),
          walk: new foundry.data.fields.NumberField({
            nullable: false,
            min: 0,
            step: 0.1,
            initial: 30,
            label: "SW5E.MovementWalk"
          }),
          units: new foundry.data.fields.StringField({ initial: "ft", label: "SW5E.MovementUnits" }),
          hover: new foundry.data.fields.BooleanField({ label: "SW5E.MovementHover" })
        },
        { label: "SW5E.Movement" }
      )
    };
  }

  /* -------------------------------------------- */

  /**
   * Fields shared between characters and NPCs.
   *
   * @type {object}
   * @property {object} attunement
   * @property {number} attunement.max      Maximum number of attuned items.
   * @property {object} senses
   * @property {number} senses.darkvision   Creature's darkvision range.
   * @property {number} senses.blindsight   Creature's blindsight range.
   * @property {number} senses.tremorsense  Creature's tremorsense range.
   * @property {number} senses.truesight    Creature's truesight range.
   * @property {string} senses.units        Distance units used to measure senses.
   * @property {string} senses.special      Description of any special senses or restrictions.
   * @property {string} powercasting        Primary powercasting ability.
   */
  static get creature() {
    return {
      attunement: new foundry.data.fields.SchemaField(
        {
          max: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 3,
            label: "SW5E.AttunementMax"
          })
        },
        { label: "SW5E.Attunement" }
      ),
      senses: new foundry.data.fields.SchemaField(
        {
          darkvision: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.SenseDarkvision"
          }),
          blindsight: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.SenseBlindsight"
          }),
          tremorsense: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.SenseTremorsense"
          }),
          truesight: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.SenseTruesight"
          }),
          units: new foundry.data.fields.StringField({ required: true, initial: "ft", label: "SW5E.SenseUnits" }),
          special: new foundry.data.fields.StringField({ required: true, label: "SW5E.SenseSpecial" })
        },
        { label: "SW5E.Senses" }
      ),
      powercasting: new foundry.data.fields.StringField({
        required: true,
        blank: true,
        initial: "int",
        label: "SW5E.PowerAbility"
      }),
      force: new foundry.data.fields.SchemaField(
        { points: makePointsResource({label: "SW5E.ForcePoint", hasTemp: true}) },
        { label: "SW5E.ForceCasting" }
      ),
      tech: new foundry.data.fields.SchemaField(
        { points: makePointsResource({label: "SW5E.TechPoint", hasTemp: true}) },
        { label: "SW5E.TechCasting" }
      ),
      super: new foundry.data.fields.SchemaField(
        {
          die: new foundry.data.fields.NumberField({
            nullable: true,
            integer: true,
            min: 0,
            initial: null,
            label: "SW5E.SuperiorityDieOverride"
          }),
          dice: makePointsResource({label: "SW5E.SuperiorityDice"})
        },
        { label: "SW5E.Superiority" }
      )
    };
  }

  /* -------------------------------------------- */

  /**
   * Migrate the old init.value and incorporate it into init.bonus.
   * @param {object} source  The source attributes object.
   * @internal
   */
  static _migrateInitiative(source) {
    const init = source?.init;
    if (!init?.value) return;
    if (init.bonus) init.bonus += init.value < 0 ? ` - ${init.value * -1}` : ` + ${init.value}`;
    else init.bonus = `${init.value}`;
  }
}

/**
 * Produce the schema field for a points resource.
 * @param {object} [schemaOptions]    Options passed to the outer schema.
 * @returns {PowerCastingData}
 */
function makePointsResource( schemaOptions = {} ) {
  const baseLabel = schemaOptions.label;
  const schemaObj = {
    value: new foundry.data.fields.NumberField({
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      label: `${baseLabel}Current`
    }),
    max: new foundry.data.fields.NumberField({
      nullable: true,
      integer: true,
      min: 0,
      initial: null,
      label: `${baseLabel}Override`
    }),
    bonuses: new foundry.data.fields.SchemaField({
      level: new FormulaField({ deterministic: true, label: `${baseLabel}BonusLevel` }),
      overall: new FormulaField({ deterministic: true, label: `${baseLabel}BonusOverall` })
    })
  }
  if ( schemaOptions.hasTemp ) schemaObj.temp = new foundry.data.fields.NumberField({
    integer: true,
    initial: 0,
    min: 0,
    label: `${baseLabel}Temp`
  });
  if ( schemaOptions.hasTempMax ) schemaObj.tempmax = new foundry.data.fields.NumberField({
    integer: true,
    initial: 0,
    label: `${baseLabel}TempMax`
  });
  return new foundry.data.fields.SchemaField(schemaObj, schemaOptions);
}
