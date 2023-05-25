import { FormulaField, MappingField } from "../../fields.mjs";
import CommonTemplate from "./common.mjs";

/**
 * @typedef {object} SkillData
 * @property {number} value            Proficiency level creature has in this skill.
 * @property {string} ability          Default ability used for this skill.
 * @property {object} bonuses          Bonuses for this skill.
 * @property {string} bonuses.check    Numeric or dice bonus to skill's check.
 * @property {string} bonuses.passive  Numeric bonus to skill's passive check.
 */

/**
 * A template for all actors that are creatures
 *
 * @property {object} bonuses
 * @property {AttackBonusesData} bonuses.mwak        Bonuses to melee weapon attacks.
 * @property {AttackBonusesData} bonuses.rwak        Bonuses to ranged weapon attacks.
 * @property {AttackBonusesData} bonuses.mpak        Bonuses to melee power attacks.
 * @property {AttackBonusesData} bonuses.rpak        Bonuses to ranged power attacks.
 * @property {object} bonuses.abilities              Bonuses to ability scores.
 * @property {string} bonuses.abilities.check        Numeric or dice bonus to ability checks.
 * @property {string} bonuses.abilities.save         Numeric or dice bonus to ability saves.
 * @property {string} bonuses.abilities.skill        Numeric or dice bonus to skill checks.
 * @property {object} bonuses.power                  Bonuses to powers.
 * @property {string} bonuses.power.dc               Numeric bonus to powercasting DC.
 * @property {Object<string, SkillData>} skills      Actor's skills.
 * @property {Object<string, PowerSlotData>} powers  Actor's power slots.
 */
export default class CreatureTemplate extends CommonTemplate {
  static defineSchema() {
    return this.mergeSchema(super.defineSchema(), {
      bonuses: new foundry.data.fields.SchemaField({
        mwak: makeAttackBonuses({label: "SW5E.BonusMWAttack"}),
        rwak: makeAttackBonuses({label: "SW5E.BonusRWAttack"}),
        mpak: makeAttackBonuses({label: "SW5E.BonusMPAttack"}),
        rpak: makeAttackBonuses({label: "SW5E.BonusRPAttack"}),
        abilities: new foundry.data.fields.SchemaField({
          check: new FormulaField({required: true, label: "SW5E.BonusAbilityCheck"}),
          save: new FormulaField({required: true, label: "SW5E.BonusAbilitySave"}),
          skill: new FormulaField({required: true, label: "SW5E.BonusAbilitySkill"})
        }, {label: "SW5E.BonusAbility"}),
        power: new foundry.data.fields.SchemaField({
          dc: new FormulaField({required: true, deterministic: true, label: "SW5E.BonusPowerDC"})
        }, {label: "SW5E.BonusPower"})
      }, {label: "SW5E.Bonuses"}),
      skills: new MappingField(new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({
          required: true, min: 0, max: 2, step: 0.5, initial: 0, label: "SW5E.ProficiencyLevel"
        }),
        ability: new foundry.data.fields.StringField({required: true, initial: "dex", label: "SW5E.Ability"}),
        bonuses: new foundry.data.fields.SchemaField({
          check: new FormulaField({required: true, label: "SW5E.SkillBonusCheck"}),
          passive: new FormulaField({required: true, label: "SW5E.SkillBonusPassive"})
        }, {label: "SW5E.SkillBonuses"})
      }), {
        initialKeys: CONFIG.SW5E.skills, initialValue: this._initialSkillValue,
        initialKeysOnly: true, label: "SW5E.Skills"
      }),
      tools: new MappingField(new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({
          required: true, min: 0, max: 2, step: 0.5, initial: 1, label: "SW5E.ProficiencyLevel"
        }),
        ability: new foundry.data.fields.StringField({required: true, initial: "int", label: "SW5E.Ability"}),
        bonuses: new foundry.data.fields.SchemaField({
          check: new FormulaField({required: true, label: "SW5E.CheckBonus"})
        }, {label: "SW5E.ToolBonuses"})
      })),
      powers: new MappingField(new foundry.data.fields.SchemaField({
        value: new foundry.data.fields.NumberField({
          nullable: false, integer: true, min: 0, initial: 0, label: "SW5E.PowerProgAvailable"
        }),
        override: new foundry.data.fields.NumberField({
          integer: true, min: 0, label: "SW5E.PowerProgOverride"
        })
      }), {initialKeys: this._powerLevels, label: "SW5E.PowerLevels"})
    });
  }

  /* -------------------------------------------- */

  /**
   * Populate the proper initial abilities for the skills.
   * @param {string} key      Key for which the initial data will be created.
   * @param {object} initial  The initial skill object created by SkillData.
   * @returns {object}        Initial skills object with the ability defined.
   * @private
   */
  static _initialSkillValue(key, initial) {
    if ( CONFIG.SW5E.skills[key]?.ability ) initial.ability = CONFIG.SW5E.skills[key].ability;
    return initial;
  }

  /* -------------------------------------------- */

  /**
   * Helper for building the default list of power levels.
   * @type {string[]}
   * @private
   */
  static get _powerLevels() {
    const levels = Object.keys(CONFIG.SW5E.powerLevels).filter(a => a !== "0").map(l => `power${l}`);
    return [...levels, "pact"];
  }

  /* -------------------------------------------- */
  /*  Migrations                                  */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static migrateData(source) {
    super.migrateData(source);
    CreatureTemplate.#migrateSensesData(source);
    CreatureTemplate.#migrateToolData(source);
  }

  /* -------------------------------------------- */

  /**
   * Migrate the actor traits.senses string to attributes.senses object.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateSensesData(source) {
    const original = source.traits?.senses;
    if ( (original === undefined) || (typeof original !== "string") ) return;
    source.attributes ??= {};
    source.attributes.senses ??= {};

    // Try to match old senses with the format like "Darkvision 60 ft, Blindsight 30 ft"
    const pattern = /([A-z]+)\s?([0-9]+)\s?([A-z]+)?/;
    let wasMatched = false;

    // Match each comma-separated term
    for ( let s of original.split(",") ) {
      s = s.trim();
      const match = s.match(pattern);
      if ( !match ) continue;
      const type = match[1].toLowerCase();
      if ( type in CONFIG.SW5E.senses ) {
        source.attributes.senses[type] = Number(match[2]).toNearest(0.5);
        wasMatched = true;
      }
    }

    // If nothing was matched, but there was an old string - put the whole thing in "special"
    if ( !wasMatched && original ) source.attributes.senses.special = original;
  }

  /* -------------------------------------------- */

  /**
   * Migrate traits.toolProf to the tools field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateToolData(source) {
    const original = source.traits?.toolProf;
    if ( !original || foundry.utils.isEmpty(original.value) ) return;
    source.tools ??= {};
    for ( const prof of original.value ) {
      if ( !(prof in CONFIG.SW5E.toolProficiencies) && !(prof in CONFIG.SW5E.toolIds) ) continue;
      source.tools[prof] = {
        value: 1,
        ability: "int",
        bonuses: {check: ""}
      };
    }
  }
}

/* -------------------------------------------- */

/**
 * Data on configuration of a specific power slot.
 *
 * @typedef {object} PowerSlotData
 * @property {number} value     Currently available power slots.
 * @property {number} override  Number to replace auto-calculated max slots.
 */

/* -------------------------------------------- */

/**
 * Data structure for actor's attack bonuses.
 *
 * @typedef {object} AttackBonusesData
 * @property {string} attack  Numeric or dice bonus to attack rolls.
 * @property {string} damage  Numeric or dice bonus to damage rolls.
 */

/**
 * Produce the schema field for a simple trait.
 * @param {object} schemaOptions  Options passed to the outer schema.
 * @returns {AttackBonusesData}
 */
function makeAttackBonuses(schemaOptions={}) {
  return new foundry.data.fields.SchemaField({
    attack: new FormulaField({required: true, label: "SW5E.BonusAttack"}),
    damage: new FormulaField({required: true, label: "SW5E.BonusDamage"})
  }, schemaOptions);
}
