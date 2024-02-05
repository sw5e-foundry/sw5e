import { FormulaField } from "../fields.mjs";
import CreatureTypeField from "../shared/creature-type-field.mjs";
import SourceField from "../shared/source-field.mjs";
import AttributesFields from "./templates/attributes.mjs";
import CreatureTemplate from "./templates/creature.mjs";
import DetailsFields from "./templates/details.mjs";
import TraitsFields from "./templates/traits.mjs";

/**
 * System data definition for NPCs.
 *
 * @property {object} attributes
 * @property {object} attributes.ac
 * @property {number} attributes.ac.flat         Flat value used for flat or natural armor calculation.
 * @property {string} attributes.ac.calc         Name of one of the built-in formulas to use.
 * @property {string} attributes.ac.formula      Custom formula to use.
 * @property {object} attributes.hp
 * @property {number} attributes.hp.value        Current hit points.
 * @property {number} attributes.hp.max          Maximum allowed HP value.
 * @property {number} attributes.hp.temp         Temporary HP applied on top of value.
 * @property {number} attributes.hp.tempmax      Temporary change to the maximum HP.
 * @property {string} attributes.hp.formula      Formula used to determine hit points.
 * @property {object} details
 * @property {TypeData} details.type             Creature type of this NPC.
 * @property {string} details.type.value         NPC's type as defined in the system configuration.
 * @property {string} details.type.subtype       NPC's subtype usually displayed in parenthesis after main type.
 * @property {string} details.type.swarm         Size of the individual creatures in a swarm, if a swarm.
 * @property {string} details.type.custom        Custom type beyond what is available in the configuration.
 * @property {string} details.environment        Common environments in which this NPC is found.
 * @property {number} details.cr                 NPC's challenge rating.
 * @property {number} details.powerForceLevel    Forcecasting level of this NPC.
 * @property {number} details.powerTechLevel     Techcasting level of this NPC.
 * @property {number} details.superiorityLevel   Superiority level of this NPC.
 * @property {SourceField} details.source        Adventure or sourcebook where this NPC originated.
 * @property {object} resources
 * @property {object} resources.legact           NPC's legendary actions.
 * @property {number} resources.legact.value     Currently available legendary actions.
 * @property {number} resources.legact.max       Maximum number of legendary actions.
 * @property {object} resources.legres           NPC's legendary resistances.
 * @property {number} resources.legres.value     Currently available legendary resistances.
 * @property {number} resources.legres.max       Maximum number of legendary resistances.
 * @property {object} resources.lair             NPC's lair actions.
 * @property {boolean} resources.lair.value      Does this NPC use lair actions.
 * @property {number} resources.lair.initiative  Initiative count when lair actions are triggered.
 */
export default class NPCData extends CreatureTemplate {
  /** @inheritdoc */
  static _systemType = "npc";

  /* -------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      attributes: new foundry.data.fields.SchemaField(
        {
          ...AttributesFields.common,
          ...AttributesFields.creature,
          ac: new foundry.data.fields.SchemaField(
            {
              flat: new foundry.data.fields.NumberField({ integer: true, min: 0, label: "SW5E.ArmorClassFlat" }),
              calc: new foundry.data.fields.StringField({ initial: "default", label: "SW5E.ArmorClassCalculation" }),
              formula: new FormulaField({ deterministic: true, label: "SW5E.ArmorClassFormula" })
            },
            { label: "SW5E.ArmorClass" }
          ),
          hp: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.NumberField({
                nullable: false,
                integer: true,
                min: 0,
                initial: 10,
                label: "SW5E.HitPointsCurrent"
              }),
              max: new foundry.data.fields.NumberField({
                nullable: false,
                integer: true,
                min: 0,
                initial: 10,
                label: "SW5E.HitPointsMax"
              }),
              temp: new foundry.data.fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
                label: "SW5E.HitPointsTemp"
              }),
              tempmax: new foundry.data.fields.NumberField({
                integer: true,
                initial: 0,
                label: "SW5E.HitPointsTempMax"
              }),
              formula: new FormulaField({ required: true, label: "SW5E.HPFormula" })
            },
            { label: "SW5E.HitPoints" }
          )
        },
        { label: "SW5E.Attributes" }
      ),
      details: new foundry.data.fields.SchemaField(
        {
          ...DetailsFields.common,
          ...DetailsFields.creature,
          type: new CreatureTypeField(),
          environment: new foundry.data.fields.StringField({ required: true, label: "SW5E.Environment" }),
          cr: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            min: 0,
            initial: 1,
            label: "SW5E.ChallengeRating"
          }),
          powerForceLevel: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.ForcecasterLevel"
          }),
          powerTechLevel: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.TechcasterLevel"
          }),
          superiorityLevel: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            label: "SW5E.SuperiorityLevel"
          }),
          source: new SourceField()
        },
        { label: "SW5E.Details" }
      ),
      resources: new foundry.data.fields.SchemaField(
        {
          legact: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.LegActRemaining"
              }),
              max: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.LegActMax"
              })
            },
            { label: "SW5E.LegAct" }
          ),
          legres: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.LegResRemaining"
              }),
              max: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                label: "SW5E.LegResMax"
              })
            },
            { label: "SW5E.LegRes" }
          ),
          lair: new foundry.data.fields.SchemaField(
            {
              value: new foundry.data.fields.BooleanField({ required: true, label: "SW5E.LairAct" }),
              initiative: new foundry.data.fields.NumberField({
                required: true,
                integer: true,
                label: "SW5E.LairActionInitiative"
              })
            },
            { label: "SW5E.LairActionLabel" }
          )
        },
        { label: "SW5E.Resources" }
      ),
      traits: new foundry.data.fields.SchemaField(
        {
          ...TraitsFields.common,
          ...TraitsFields.creature
        },
        { label: "SW5E.Traits" }
      )
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData(source) {
    super._migrateData(source);
    NPCData.#migrateSource(source);
    NPCData.#migrateTypeData(source);
    NPCData.#migratePowercastingData(source);
    NPCData.#migrateArmorClass(source);
    AttributesFields._migrateInitiative(source.attributes);
  }

  /* -------------------------------------------- */

  /**
   * Convert source string into custom object.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateSource(source) {
    if ( source.details?.source && (foundry.utils.getType(source.details.source) !== "Object") ) {
      source.details.source = { custom: source.details.source };
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate the actor type string to type object.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateTypeData(source) {
    const original = source.type;
    if (typeof original !== "string") return;

    source.type = {
      value: "",
      subtype: "",
      swarm: "",
      custom: ""
    };

    // Match the existing string
    const pattern = /^(?:swarm of (?<size>[\w-]+) )?(?<type>[^(]+?)(?:\((?<subtype>[^)]+)\))?$/i;
    const match = original.trim().match(pattern);
    if (match) {
      // Match a known creature type
      const typeLc = match.groups.type.trim().toLowerCase();
      const typeMatch = Object.entries(CONFIG.SW5E.creatureTypes).find(([k, v]) => {
        return (
          typeLc === k
          || typeLc === game.i18n.localize(v.label).toLowerCase()
          || typeLc === game.i18n.localize(`${v.label}Pl`).toLowerCase()
        );
      });
      if (typeMatch) source.type.value = typeMatch[0];
      else {
        source.type.value = "custom";
        source.type.custom = match.groups.type.trim().titleCase();
      }
      source.type.subtype = match.groups.subtype?.trim().titleCase() ?? "";

      // Match a swarm
      if (match.groups.size) {
        const sizeLc = match.groups.size ? match.groups.size.trim().toLowerCase() : "tiny";
        const sizeMatch = Object.entries(CONFIG.SW5E.actorSizes).find(([k, v]) => {
          return sizeLc === k || sizeLc === game.i18n.localize(v.label).toLowerCase();
        });
        source.type.swarm = sizeMatch ? sizeMatch[0] : "tiny";
      } else source.type.swarm = "";
    }

    // No match found
    else {
      source.type.value = "custom";
      source.type.custom = original;
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate the actor type string to type object.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateArmorClass(source) {
    const ac = source.attributes.ac;
    // Remove invalid AC formula strings.
    if (ac?.formula) {
      try {
        const roll = new Roll(ac.formula);
        Roll.safeEval(roll.formula);
      } catch(e) {
        ac.formula = "";
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate the actor's powercasting data.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migratePowercastingData(source) {
    if (!source.details) return;

    let level = Number(source.details.cr);
    let hasCasting = false;

    if (source.details.powerLevel) {
      hasCasting = true;
      level = source.details.powerLevel;
      delete source.details.powerLevel;
    }

    if (source.attributes?.powercasting) {
      hasCasting = true;
      switch (source.attributes.powercasting) {
        case "consular":
          source.details.powerForceLevel = level;
          break;
        case "engineer":
          source.details.powerTechLevel = level;
          break;
        case "guardian":
          source.details.powerForceLevel = Math.ceil(level/2);
          break;
        case "scout":
          source.details.powerTechLevel = Math.ceil(level/2);
          break;
        case "sentinel":
          source.details.powerForceLevel = Math.ceil(3*level/4);
          break;
      }
      delete source.abilities.powercasting;
    }
    else if (hasCasting) {
      source.details.powerForceLevel = level;
      source.details.powerTechLevel = level;
    }
  }

  /* -------------------------------------------- */

  /**
   * Prepare remaining NPC data.
   */
  prepareDerivedData() {
    AttributesFields.prepareExhaustionLevel.call(this);
    AttributesFields.prepareMovement.call(this);
    TraitsFields.prepareResistImmune.call(this);
  }
}
