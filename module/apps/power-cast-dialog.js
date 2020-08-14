/**
 * A specialized Dialog subclass for casting a power item at a certain level
 * @extends {Dialog}
 */
export default class PowerCastDialog extends Dialog {
  constructor(actor, item, dialogData={}, options={}) {
    super(dialogData, options);
    this.options.classes = ["sw5e", "dialog"];

    /**
     * Store a reference to the Actor entity which is casting the power
     * @type {Actor5e}
     */
    this.actor = actor;

    /**
     * Store a reference to the Item entity which is the power being cast
     * @type {Item5e}
     */
    this.item = item;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * A constructor function which displays the Power Cast Dialog app for a given Actor and Item.
   * Returns a Promise which resolves to the dialog FormData once the workflow has been completed.
   * @param {Actor5e} actor
   * @param {Item5e} item
   * @return {Promise}
   */
  static async create(actor, item) {
    const ad = actor.data.data;
    const id = item.data.data;

    // Determine whether the power may be upcast
    const lvl = id.level;
    const canUpcast = (lvl > 0) && CONFIG.SW5E.powerUpcastModes.includes(id.preparation.mode);

    // Determine the levels which are feasible
    let lmax = 0;
    const powerLevels = Array.fromRange(10).reduce((arr, i) => {
      if ( i < lvl ) return arr;
      const l = ad.powers["power"+i] || {max: 0, override: null};
      let max = parseInt(l.override || l.max || 0);
      let slots = Math.clamped(parseInt(l.value || 0), 0, max);
      if ( max > 0 ) lmax = i;
      arr.push({
        level: i,
        label: i > 0 ? `${CONFIG.SW5E.powerLevels[i]} (${slots} Slots)` : CONFIG.SW5E.powerLevels[i],
        canCast: canUpcast && (max > 0),
        hasSlots: slots > 0
      });
      return arr;
    }, []).filter(sl => sl.level <= lmax);

    const pact = ad.powers.pact;
    if (pact.level >= lvl) {
      // If this character has pact slots, present them as an option for
      // casting the power.
      powerLevels.push({
        level: 'pact',
        label: game.i18n.localize('SW5E.PowerLevelPact')
          + ` (${game.i18n.localize('SW5E.Level')} ${pact.level}) `
          + `(${pact.value} ${game.i18n.localize('SW5E.Slots')})`,
        canCast: canUpcast,
        hasSlots: pact.value > 0
      });
    }
    const canCast = powerLevels.some(l => l.hasSlots);

    // Render the Power casting template
    const html = await renderTemplate("systems/sw5e/templates/apps/power-cast.html", {
      item: item.data,
      canCast: canCast,
      canUpcast: canUpcast,
      powerLevels,
      hasPlaceableTemplate: game.user.can("TEMPLATE_CREATE") && item.hasAreaTarget
    });

    // Create the Dialog and return as a Promise
    return new Promise((resolve, reject) => {
      const dlg = new this(actor, item, {
        title: `${item.name}: Power Configuration`,
        content: html,
        buttons: {
          cast: {
            icon: '<i class="fas fa-magic"></i>',
            label: "Cast",
            callback: html => resolve(new FormData(html[0].querySelector("#power-config-form")))
          }
        },
        default: "cast",
        close: reject
      });
      dlg.render(true);
    });
  }
}
