/**
 * Object describing the shield dice for an actor.
 */
export default class ShieldDice {
  /**
   * Object describing the shield dice for an actor.
   * @param {Actor5e} actor     The actor whose shield dice this document describes.
   */
  constructor(actor) {
    this.actor = actor;

    for (const item of Object.values(actor.starships)) {
      if (/^d\d+$/.test(item.system.shldDice)) {
        this.starships.add(item);
        const hugeOrGrg = ["huge", "grg"].includes(item.system.size);
        this.max += (item.system.shldDiceStart ?? 0) + ((hugeOrGrg ? 2 : 1) * item.system.tier);
        this.value += (item.system.shldDiceStart ?? 0) + ((hugeOrGrg ? 2 : 1) * item.system.tier) - item.system.shldDiceUsed;
        this.sizes.add(parseInt(item.system.shldDice.slice(1)));
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
   * Remaining shield dice.
   * @type {number}
   */
  value = 0;

  /* -------------------------------------------- */

  /**
   * The actor's total amount of shield dice.
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
    return this.sizes.size ? Math.min(...this.sizes) : 0;
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
    return this.sizes.size ? Math.max(...this.sizes) : 0;
  }

  /* -------------------------------------------- */

  /**
   * The percentage of remaining shield dice.
   * @type {number}
   */
  get pct() {
    return Math.clamp(this.max ? (this.value / this.max) * 100 : 0, 0, 100);
  }

  /* -------------------------------------------- */

  /**
   * Return an object of remaining shield dice categorized by size.
   * @returns {object}
   */
  get bySize() {
    const shldd = {};
    this.starships.forEach(sship => {
      const d = sship.system.shieldDice;
      const hugeOrGrg = ["huge", "grg"].includes(sship.system.size);
      const max = (sship.system.shldDiceStart ?? 0) + ((hugeOrGrg ? 2 : 1) * sship.system.tier);
      const remaining = max - sship.system.shldDiceUsed;
      shldd[d] = (shldd[d] ?? 0) + remaining;
    });
    return shldd;
  }

  /* -------------------------------------------- */

  /**
   * Override the default `toString` method for backwards compatibility.
   * @returns {number}    Remaining shield dice.
   */
  toString() {
    return this.value;
  }

  /* -------------------------------------------- */

  /**
   * Create item updates for recovering shield dice during a rest.
   * @param {object} [options]
   * @param {number} [options.maxShieldDice]                      Maximum number of shield dice to recover.
   * @param {boolean} [options.largest]                           Whether to restore the largest shield dice first.
   * @returns {{updates: object[], shldDiceRecovered: number}}  Array of item updates and number of shield dice recovered.
   */
  createShieldDiceUpdates({ maxShieldDice, largest = true } = {}) {
    if (!Number.isInteger(maxShieldDice)) maxShieldDice = this.max;
    const sships = Array.from(this.starships).sort((a, b) => {
      a = parseInt(a.system.shldDice.slice(1));
      b = parseInt(b.system.shldDice.slice(1));
      return largest ? (b - a) : (a - b);
    });
    const updates = [];
    let recovered = 0;
    for (const item of sships) {
      const used = item.system.shldDiceUsed;
      if ((recovered < maxShieldDice) && (used > 0)) {
        const delta = Math.min(used, maxShieldDice - recovered);
        recovered += delta;
        updates.push({ _id: item.id, "system.shldDiceUsed": used - delta });
      }
    }
    return { updates, shldDiceRecovered: recovered };
  }
}
