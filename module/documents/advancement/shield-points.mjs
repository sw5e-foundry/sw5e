import HitPointsAdvancement from "./hit-points.mjs";
import ShieldPointsConfig from "../../applications/advancement/shield-points-config.mjs";
import ShieldPointsFlow from "../../applications/advancement/shield-points-flow.mjs";
import { simplifyBonus } from "../../utils.mjs";

/**
 * Advancement that presents the player with the option to roll shield points at each tier or select the average value.
 * Keeps track of player shield point rolls or selection for each starship tier.
 * **Can only be added to starships and each starship can only have one.**
 */
export default class ShieldPointsAdvancement extends HitPointsAdvancement {
  /** @inheritdoc */
  static get metadata() {
    return foundry.utils.mergeObject( super.metadata, {
      title: game.i18n.localize( "SW5E.AdvancementShieldPointsTitle" ),
      hint: game.i18n.localize( "SW5E.AdvancementShieldPointsHint" ),
      apps: {
        config: ShieldPointsConfig,
        flow: ShieldPointsFlow
      }
    } );
  }

  /* -------------------------------------------- */
  /*  Instance Properties                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  get levels() {
    return Array.fromRange( this.item.maxAdvancementLevel + 1 ).slice( 0 );
  }

  /* -------------------------------------------- */

  /**
   * Shortcut to the shield die used by the class.
   * @returns {string}
   */
  get hitDie() {
    return this.item.system.shldDice;
  }

  /* -------------------------------------------- */
  /*  Display Methods                             */
  /* -------------------------------------------- */

  quantForLevel( level ) {
    return ( level === 0 ) ? this.item.system?.shldDiceStart : ["huge", "gargantuan"].includes( this.item.system.identifier ) ? 2 : 1;
  }

  /** @inheritdoc */
  valueForLevel( level ) {
    const quant = this.quantForLevel( level );
    return this.constructor.valueForLevel( this.value, this.hitDieValue, level, quant );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getAdjustedTotal( mod ) {
    return Object.keys( this.value ).reduce( ( total, level ) => {
      const quant = this.quantForLevel( level );
      return total + Math.max( this.valueForLevel( parseInt( level ) ) + ( quant * mod ), quant );
    }, 0 );
  }

  /* -------------------------------------------- */
  /*  Editing Methods                             */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static availableForItem( item ) {
    return !item.advancement.byType.ShieldPoints?.length;
  }

  /* -------------------------------------------- */
  /*  Application Methods                         */
  /* -------------------------------------------- */

  /**
   * Add the ability modifier and any bonuses to the provided shield points value to get the number to apply.
   * @param {number} value  Shield points taken at a given level.
   * @returns {number}      Shield points adjusted with ability modifier and per-level bonuses.
   */
  #getApplicableValue( value ) {
    const abilityId = CONFIG.SW5E.defaultAbilities.shieldPoints || "str";
    value = Math.max( value + ( this.actor.system.abilities[abilityId]?.mod ?? 0 ), 1 );
    value += simplifyBonus( this.actor.system.attributes.hp.bonuses?.templevel, this.actor.getRollData() );
    return value;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  apply( level, data ) {
    let value = this.constructor.valueForLevel( data, this.hitDieValue, level );
    if ( value === undefined ) return;
    this.actor.updateSource( {
      "system.attributes.hp.temp": this.actor.system.attributes.hp.temp + this.#getApplicableValue( value )
    } );
    this.updateSource( { value: data } );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  reverse( level ) {
    let value = this.valueForLevel( level );
    if ( value === undefined ) return;
    this.actor.updateSource( {
      "system.attributes.hp.temp": this.actor.system.attributes.hp.temp - this.#getApplicableValue( value )
    } );
    const source = { [level]: this.value[level] };
    this.updateSource( { [`value.-=${level}`]: null } );
    return source;
  }
}
