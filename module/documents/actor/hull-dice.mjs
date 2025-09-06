/**
 * Object describing the hull dice for an actor.
 */
export default class HullDice {
  /**
   * Object describing the hull dice for an actor.
   * @param {Actor5e} actor     The actor whose hull dice this document describes.
   */
  constructor( actor ) {
    this.actor = actor;

    for ( const item of Object.values( actor.starships ) ) {
      if ( /^d\d+$/.test( item.system.hullDice ) ) {
        this.starships.add( item );
        const hugeOrGrg = ["huge", "grg"].includes( item.system.size );
        this.max += ( item.system.hullDiceStart ?? 0 ) + ( ( hugeOrGrg ? 2 : 1 ) * item.system.tier );
        this.value += ( item.system.hullDiceStart ?? 0 ) + ( ( hugeOrGrg ? 2 : 1 ) * item.system.tier ) - item.system.hullDiceUsed;
        this.sizes.add( parseInt( item.system.hullDice.slice( 1 ) ) );
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Store a reference to the actor.
   * @type {Actor5e}
   */
  actor = null;

  /* -------------------------------------------- */

  /**
   * Remaining hull dice.
   * @type {number}
   */
  value = 0;

  /* -------------------------------------------- */

  /**
   * The actor's total amount of hull dice.
   * @type {number}
   */
  max = 0;

  /* -------------------------------------------- */

  /**
   * All valid die sizes derived from all starship sizes.
   * @type {Set<number>}
   */
  sizes = new Set();

  /* -------------------------------------------- */

  /**
   * Store valid starship size items.
   * @type {Set<Item5e>}
   */
  starships = new Set();

  /* -------------------------------------------- */

  /**
   * The smallest denomination.
   * @type {string}
   */
  get smallest() {
    return `d${this.smallestFace}`;
  }

  /* -------------------------------------------- */

  /**
   * The smallest die size.
   * @type {number}
   */
  get smallestFace() {
    return this.sizes.size ? Math.min( ...this.sizes ) : 0;
  }

  /* -------------------------------------------- */

  /**
   * The largest denomination.
   * @type {string}
   */
  get largest() {
    return `d${this.largestFace}`;
  }

  /* -------------------------------------------- */

  /**
   * The largest die size.
   * @type {number}
   */
  get largestFace() {
    return this.sizes.size ? Math.max( ...this.sizes ) : 0;
  }

  /* -------------------------------------------- */

  /**
   * The percentage of remaining hull dice.
   * @type {number}
   */
  get pct() {
    return Math.clamp( this.max ? ( this.value / this.max ) * 100 : 0, 0, 100 );
  }

  /* -------------------------------------------- */

  /**
   * Return an object of remaining hull dice categorized by size.
   * @returns {object}
   */
  get bySize() {
    const hulld = {};
    this.starships.forEach( sship => {
      const d = sship.system.hullDice;
      const hugeOrGrg = ["huge", "grg"].includes( sship.system.size );
      const max = ( sship.system.hullDiceStart ?? 0 ) + ( ( hugeOrGrg ? 2 : 1 ) * sship.system.tier );
      const remaining = max - sship.system.hullDiceUsed;
      hulld[d] = ( hulld[d] ?? 0 ) + remaining;
    } );
    return hulld;
  }

  /* -------------------------------------------- */

  /**
   * Override the default `toString` method for backwards compatibility.
   * @returns {number}    Remaining hull dice.
   */
  toString() {
    return this.value;
  }

  /* -------------------------------------------- */

  /**
   * Create item updates for recovering hull dice during a rest.
   * @param {object} [options]
   * @param {number} [options.maxHullDice]                      Maximum number of hull dice to recover.
   * @param {boolean} [options.largest]                         Whether to restore the largest hull dice first.
   * @returns {{updates: object[], hullDiceRecovered: number}}  Array of item updates and number of hull dice recovered.
   */
  createHullDiceUpdates( { maxHullDice, largest = true } = {} ) {
    if ( !Number.isInteger( maxHullDice ) ) maxHullDice = this.max;
    const sships = Array.from( this.starships ).sort( ( a, b ) => {
      a = parseInt( a.system.hullDice.slice( 1 ) );
      b = parseInt( b.system.hullDice.slice( 1 ) );
      return largest ? ( b - a ) : ( a - b );
    } );
    const updates = [];
    let recovered = 0;
    for ( const item of sships ) {
      const used = item.system.hullDiceUsed;
      if ( ( recovered < maxHullDice ) && ( used > 0 ) ) {
        const delta = Math.min( used, maxHullDice - recovered );
        recovered += delta;
        updates.push( { _id: item.id, "system.hullDiceUsed": used - delta } );
      }
    }
    return { updates, hullDiceRecovered: recovered };
  }
}
