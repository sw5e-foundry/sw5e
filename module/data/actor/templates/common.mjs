import Proficiency from "../../../documents/actor/proficiency.mjs";
import { simplifyBonus } from "../../../utils.mjs";
import { ActorDataModel } from "../../abstract.mjs";
import { FormulaField, MappingField } from "../../fields.mjs";
import CurrencyTemplate from "../../shared/currency.mjs";

/**
 * @typedef {object} AbilityData
 * @property {number} value          Ability score.
 * @property {number} proficient     Proficiency value for saves.
 * @property {number} max            Maximum possible score for the ability.
 * @property {object} bonuses        Bonuses that modify ability checks and saves.
 * @property {string} bonuses.check  Numeric or dice bonus to ability checks.
 * @property {string} bonuses.save   Numeric or dice bonus to ability saving throws.
 */

/**
 * A template for all actors that share the common template.
 *
 * @property {Object<string, AbilityData>} abilities  Actor's abilities.
 * @mixin
 */
export default class CommonTemplate extends ActorDataModel.mixin( CurrencyTemplate ) {
  /** @inheritdoc */
  static defineSchema() {
    return this.mergeSchema( super.defineSchema(), {
      abilities: new MappingField(
        new foundry.data.fields.SchemaField( {
          value: new foundry.data.fields.NumberField( {
            required: true,
            nullable: false,
            integer: true,
            min: 0,
            initial: 10,
            label: "SW5E.AbilityScore"
          } ),
          proficient: new foundry.data.fields.NumberField( {
            required: true,
            min: 0,
            max: 5,
            step: 0.5,
            initial: 0,
            label: "SW5E.ProficiencyLevel"
          } ),
          max: new foundry.data.fields.NumberField( {
            required: true,
            integer: true,
            nullable: true,
            min: 0,
            initial: null,
            label: "SW5E.AbilityScoreMax"
          } ),
          bonuses: new foundry.data.fields.SchemaField(
            {
              check: new FormulaField( { required: true, label: "SW5E.AbilityCheckBonus" } ),
              save: new FormulaField( { required: true, label: "SW5E.SaveBonus" } )
            },
            { label: "SW5E.AbilityBonuses" }
          )
        } ),
        {
          initialKeys: CONFIG.SW5E.abilities,
          initialValue: this._initialAbilityValue.bind( this ),
          initialKeysOnly: true,
          label: "SW5E.Abilities"
        }
      )
    } );
  }

  /* -------------------------------------------- */

  /**
   * Populate the proper initial value for abilities.
   * @param {string} key       Key for which the initial data will be created.
   * @param {object} initial   The initial skill object created by SkillData.
   * @param {object} existing  Any existing mapping data.
   * @returns {object}         Initial ability object.
   * @private
   */
  static _initialAbilityValue( key, initial, existing ) {
    const config = CONFIG.SW5E.abilities[key];
    if ( config ) {
      let defaultValue = config.defaults?.[this._systemType] ?? initial.value;
      if ( typeof defaultValue === "string" ) defaultValue = existing?.[defaultValue]?.value ?? initial.value;
      initial.value = defaultValue;
    }
    return initial;
  }

  /* -------------------------------------------- */
  /*  Data Migration                              */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static _migrateData( source ) {
    super._migrateData( source );
    CommonTemplate.#migrateACData( source );
    CommonTemplate.#migrateMovementData( source );
  }

  /* -------------------------------------------- */

  /**
   * Migrate the actor ac.value to new ac.flat override field.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateACData( source ) {
    if ( !source.attributes?.ac ) return;
    const ac = source.attributes.ac;

    // If the actor has a numeric ac.value, then their AC has not been migrated to the auto-calculation schema yet.
    if ( Number.isNumeric( ac.value ) ) {
      ac.flat = parseInt( ac.value );
      ac.calc = this._systemType === "npc" ? "natural" : "flat";
      return;
    }

    // Migrate ac.base in custom formulas to ac.armor
    if ( typeof ac.formula === "string" && ac.formula.includes( "@attributes.ac.base" ) ) {
      ac.formula = ac.formula.replaceAll( "@attributes.ac.base", "@attributes.ac.armor" );
    }

    // Remove invalid AC formula strings.
    if ( ac?.formula ) {
      try {
        const roll = new Roll( ac.formula );
        Roll.safeEval( roll.formula );
      } catch( e ) {
        ac.formula = "";
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Migrate the actor speed string to movement object.
   * @param {object} source  The candidate source data from which the model will be constructed.
   */
  static #migrateMovementData( source ) {
    const original = source.attributes?.speed?.value ?? source.attributes?.speed;
    if ( typeof original !== "string" || source.attributes.movement?.walk !== undefined ) return;
    source.attributes.movement ??= {};
    const s = original.split( " " );
    if ( s.length > 0 ) source.attributes.movement.walk = Number.isNumeric( s[0] ) ? parseInt( s[0] ) : 0;
  }

  /* -------------------------------------------- */
  /*  Data Preparation                            */
  /* -------------------------------------------- */

  // TODO: Edit this with where it was pulled
  /**
   * Prepare modifiers and other values for abilities.
   * @param {object} [options={}]
   * @param {object} [options.rollData={}]    Roll data used to calculate bonuses.
   * @param {object} [options.originalSaves]  Original ability data for transformed actors.
   */
  prepareAbilities( { rollData={}, originalSaves }={} ) {
    const flags = this.parent.flags.sw5e ?? {};
    const prof = this.attributes?.prof ?? 0;
    const checkBonus = simplifyBonus( this.bonuses?.abilities?.check, rollData );
    const saveBonus = simplifyBonus( this.bonuses?.abilities?.save, rollData );
    const dcBonus = simplifyBonus( this.bonuses?.power?.dc, rollData );
    for ( const [id, abl] of Object.entries( this.abilities ) ) {
      if ( flags.diamondSoul ) abl.proficient = 1;  // Diamond Soul is proficient in all saves
      abl.mod = Math.floor( ( abl.value - 10 ) / 2 );

      const isRA = this.parent._getCharacterFlag( "remarkableAthlete", { ability: id } );
      abl.checkProf = new Proficiency( prof, ( isRA || flags.jackOfAllTrades ) ? 0.5 : 0, !isRA );
      const saveBonusAbl = simplifyBonus( abl.bonuses?.save, rollData );
      abl.saveBonus = saveBonusAbl + saveBonus;

      abl.saveProf = new Proficiency( prof, abl.proficient );
      const checkBonusAbl = simplifyBonus( abl.bonuses?.check, rollData );
      abl.checkBonus = checkBonusAbl + checkBonus;

      abl.save = abl.mod + abl.saveBonus;
      if ( Number.isNumeric( abl.saveProf.term ) ) abl.save += abl.saveProf.flat;
      abl.dc = 8 + abl.mod + prof + dcBonus;

      if ( !Number.isFinite( abl.max ) ) abl.max = CONFIG.SW5E.maxAbilityScore;

      // If we merged saves when transforming, take the highest bonus here.
      if ( originalSaves && abl.proficient ) abl.save = Math.max( abl.save, originalSaves[id].save );
    }
  }
}
