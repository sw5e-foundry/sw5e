import { FormulaField, UUIDField } from "../../fields.mjs";
import MovementField from "../../shared/movement-field.mjs";
import SensesField from "../../shared/senses-field.mjs";
import ActiveEffect5e from "../../../documents/active-effect.mjs";

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
      movement: new MovementField()
    };
  }

  /* -------------------------------------------- */

  /**
   * Fields shared between characters and NPCs.
   *
   * @type {object}
   * @property {object} attunement
   * @property {number} attunement.max                     Maximum number of attuned items.
   * @property {object} senses
   * @property {number} senses.darkvision                  Creature's darkvision range.
   * @property {number} senses.blindsight                  Creature's blindsight range.
   * @property {number} senses.tremorsense                 Creature's tremorsense range.
   * @property {number} senses.truesight                   Creature's truesight range.
   * @property {string} senses.units                       Distance units used to measure senses.
   * @property {string} senses.special                     Description of any special senses or restrictions.
   * @property {object} force
   * @property {object} force.points
   * @property {number} force.points.value                 Current force points.
   * @property {number} force.points.max                   Override for maximum FP.
   * @property {number} force.points.temp                  Temporary FP applied on top of value.
   * @property {object} force.points.bonuses
   * @property {string} force.points.bonuses.level         Bonus formula applied for each class level.
   * @property {string} force.points.bonuses.overall       Bonus formula applied to total FP.
   * @property {object} tech
   * @property {object} tech.points
   * @property {number} tech.points.value                  Current tech points.
   * @property {number} tech.points.max                    Override for maximum TP.
   * @property {number} tech.points.temp                   Temporary TP applied on top of value.
   * @property {object} tech.points.bonuses
   * @property {string} tech.points.bonuses.level          Bonus formula applied for each class level.
   * @property {string} tech.points.bonuses.overall        Bonus formula applied to total TP.
   * @property {object} super
   * @property {number} super.die                          Override for SD size.
   * @property {object} super.dice
   * @property {number} super.dice.value                   Current superiority dice.
   * @property {number} super.dice.max                     Override for maximum SD.
   * @property {object} super.dice.bonuses
   * @property {string} super.dice.bonuses.level           Bonus formula applied for each class level.
   * @property {string} super.dice.bonuses.overall         Bonus formula applied to total SD.
   * @property {object} deployed
   * @property {string} deployed.uuid                      UUID of the starship this character is deployed on.
   * @property {Set<string>} deployed.deployments          Positions the actor is deployed on.
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
      senses: new SensesField(),
      force: new foundry.data.fields.SchemaField(
        { points: makePointsResource({ label: "SW5E.ForcePoint", hasTemp: true }) },
        { label: "SW5E.ForceCasting" }
      ),
      tech: new foundry.data.fields.SchemaField(
        { points: makePointsResource({ label: "SW5E.TechPoint", hasTemp: true }) },
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
          dice: makePointsResource({ label: "SW5E.SuperDice" })
        },
        { label: "SW5E.Superiority" }
      ),
      deployed: new foundry.data.fields.SchemaField(
        {
          uuid: new UUIDField({ label: "SW5E.DeployedStarship", nullable: true }),
          deployments: new foundry.data.fields.SetField(new foundry.data.fields.StringField(), {
            label: "SW5E.DeployedPositions"
          })
        },
        { label: "SW5E.Deployed" }
      ),
      exhaustion: new foundry.data.fields.NumberField(
        {
          required: true,
          nullable: false,
          integer: true,
          min: 0,
          initial: 0,
          label: "SW5E.Exhaustion"
        }
      )
    };
  }

  /* -------------------------------------------- */
  /*  Data Migration                              */
  /* -------------------------------------------- */

  /**
   * Migrate the old init.value and incorporate it into init.bonus.
   * @param {object} source  The source attributes object.
   * @internal
   */
  static _migrateInitiative(source) {
    const init = source?.init;
    if (!init?.value || typeof init?.bonus === "string") return;
    if (init.bonus) init.bonus += init.value < 0 ? ` - ${init.value * -1}` : ` + ${init.value}`;
    else init.bonus = `${init.value}`;
  }


  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  /**
   * Adjust exhaustion level based on Active Effects.
   * @this {CharacterData|NPCData}
   */
  static prepareExhaustionLevel() {
    const exhaustion = this.parent.effects.get(ActiveEffect5e.ID.EXHAUSTION);
    const level = exhaustion?.getFlag("sw5e", "exhaustionLevel");
    this.attributes.exhaustion = Number.isFinite(level) ? level : 0;
  }

  /* -------------------------------------------- */

  /**
   * Modify movement speeds taking exhaustion and any other conditions into account.
   * @this {CharacterData|NPCData}
   */
  static prepareMovement() {
    const statuses = this.parent.statuses;
    const noMovement = new Set(["grappled", "paralyzed", "petrified", "restrained", "stunned", "unconscious"])
      .intersection(statuses).size || (this.attributes.exhaustion >= 5);
    const halfMovement = statuses.has("prone") || (this.attributes.exhaustion >= 2);
    const reduction = statuses.has("heavilyEncumbered")
      ? CONFIG.SW5E.encumbrance.speedReduction.heavilyEncumbered
      : statuses.has("encumbered") ? CONFIG.SW5E.encumbrance.speedReduction.encumbered : 0;
    const crawl = statuses.has("prone") || statuses.has("exceedingCarryingCapacity");
    Object.keys(CONFIG.SW5E.movementTypes).forEach(k => {
      if ( reduction ) this.attributes.movement[k] = Math.max(0, this.attributes.movement[k] - reduction);
      if ( (crawl && (k !== "walk")) || noMovement ) this.attributes.movement[k] = 0;
      else if ( statuses.has("exceedingCarryingCapacity") ) this.attributes.movement[k] = 5;
      else if ( halfMovement ) this.attributes.movement[k] = Math.floor(this.attributes.movement[k] * 0.5);
    });
  }
}

/**
 * Produce the schema field for a points resource.
 * @param {object} [schemaOptions]    Options passed to the outer schema.
 * @returns {PowerCastingData}
 */
function makePointsResource(schemaOptions = {}) {
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
  };
  if (schemaOptions.hasTemp) schemaObj.temp = new foundry.data.fields.NumberField({
    integer: true,
    initial: 0,
    min: 0,
    label: `${baseLabel}Temp`
  });
  if (schemaOptions.hasTempMax) schemaObj.tempmax = new foundry.data.fields.NumberField({
    integer: true,
    initial: 0,
    label: `${baseLabel}TempMax`
  });
  return new foundry.data.fields.SchemaField(schemaObj, schemaOptions);
}
