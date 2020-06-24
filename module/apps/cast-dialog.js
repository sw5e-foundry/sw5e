/**
 * A specialized Dialog subclass for casting a cast item at a certain level
 * @type {Dialog}
 */
export class CastDialog extends Dialog {
  constructor(actor, item, dialogData={}, options={}) {
    super(dialogData, options);
    this.options.classes = ["sw5e", "dialog"];

    /**
     * Store a reference to the Actor entity which is casting the cast
     * @type {Actor5e}
     */
    this.actor = actor;

    /**
     * Store a reference to the Item entity which is the cast being cast
     * @type {Item5e}
     */
    this.item = item;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * A constructor function which displays the Cast Cast Dialog app for a given Actor and Item.
   * Returns a Promise which resolves to the dialog FormData once the workflow has been completed.
   * @param {Actor5e} actor
   * @param {Item5e} item
   * @return {Promise}
   */
  static async create(actor, item) {
    const ad = actor.data.data;
    const id = item.data.data;

    // Determine whether the cast may be upcast
    const lvl = id.level;
    const canUpcast = (lvl > 0) && CONFIG.SW5E.castUpcastModes.includes(id.preparation.mode);

    // Determine the levels which are feasible
    let lmax = 0;
    const castLevels = Array.fromRange(10).reduce((arr, i) => {
      if ( i < lvl ) return arr;
      const l = ad.casts["cast"+i] || {max: 0, override: null};
      let max = parseInt(l.override || l.max || 0);
      let slots = Math.clamped(parseInt(l.value || 0), 0, max);
      if ( max > 0 ) lmax = i;
      arr.push({
        level: i,
        label: i > 0 ? `${CONFIG.SW5E.castLevels[i]} (${slots} Slots)` : CONFIG.SW5E.castLevels[i],
        canCast: canUpcast && (max > 0),
        hasSlots: slots > 0
      });
      return arr;
    }, []).filter(sl => sl.level <= lmax);

    const pact = ad.casts.pact;
    if (pact.level >= lvl) {
      // If this character has pact slots, present them as an option for
      // casting the cast.
      castLevels.push({
        level: 'pact',
        label: game.i18n.localize('SW5E.CastLevelPact')
          + ` (${game.i18n.localize('SW5E.Level')} ${pact.level}) `
          + `(${pact.value} ${game.i18n.localize('SW5E.Slots')})`,
        canCast: canUpcast,
        hasSlots: pact.value > 0
      });
    }

    const canCast = castLevels.some(l => l.hasSlots);

    // Render the Cast casting template
    const html = await renderTemplate("systems/sw5e/templates/apps/cast-cast.html", {
      item: item.data,
      canCast: canCast,
      canUpcast: canUpcast,
      castLevels,
      hasPlaceableTemplate: game.user.can("TEMPLATE_CREATE") && item.hasAreaTarget
    });

    // Create the Dialog and return as a Promise
    return new Promise((resolve, reject) => {
      const dlg = new this(actor, item, {
        title: `${item.name}: Cast Configuration`,
        content: html,
        buttons: {
          cast: {
            icon: '<i class="fas fa-magic"></i>',
            label: "Cast",
            callback: html => resolve(new FormData(html[0].querySelector("#cast-config-form")))
          }
        },
        default: "cast",
        close: reject
      });
      dlg.render(true);
    });
  }
}
