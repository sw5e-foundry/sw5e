/**
 * A helper Dialog subclass for rolling Hull Dice on a recharge repair.
 *
 * @param {Actor5e} actor           Actor that is taking the recharge repair.
 * @param {object} [dialogData={}]  An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}]     Dialog rendering options.
 */
export default class RechargeRepairDialog extends Dialog {
  constructor(actor, dialogData = {}, options = {}) {
    super(dialogData, options);

    /**
     * Store a reference to the Actor document which is repairing
     * @type {Actor}
     */
    this.actor = actor;

    /**
     * Track the most recently used HD denomination for re-rendering the form
     * @type {string}
     */
    this._denom = null;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/sw5e/templates/apps/recharge-repair.hbs",
      classes: ["sw5e", "dialog"]
    });
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  getData() {
    const context = super.getData();
    context.isGroup = this.actor.type === "group";
    
    if ( foundry.utils.hasProperty(this.actor, "system.attributes.hulld") ) {
      // Determine Hull Dice
      context.availableHD = this.actor.itemTypes.starshipsize.reduce((hulld, item) => {
        const { tier, size, hullDice, hullDiceStart, hullDiceUsed } = item.system;
        const denom = hullDice ?? "d6";
        const hugeOrGrg = ["huge", "grg"].includes(size);
        const available =
          parseInt(hullDiceStart ?? 1)
          + (parseInt(hugeOrGrg ? 2 : 1) * parseInt(tier ?? 0))
          - parseInt(hullDiceUsed ?? 0);
        hulld[denom] = denom in hulld ? hulld[denom] + available : available;
        return hulld;
      }, {});
      context.canRoll = this.actor.system.attributes.hull.dice > 0;
      context.denomination = this._denom;
    }

    // Determine rest type
    const variant = game.settings.get("sw5e", "restVariant");
    context.promptNewDay = variant !== "epic";     // It's never a new day when only repairing 1 minute
    context.newDay = false;                        // It may be a new day, but not by default
    return context;
  }

  /* -------------------------------------------- */


  /** @inheritDoc */
  activateListeners(html) {
    super.activateListeners(html);
    let btn = html.find("#roll-hulld");
    btn.click(this._onRollHullDie.bind(this));
  }

  /* -------------------------------------------- */

  /**
   * Handle rolling a Hull Die as part of a Recharge Repair action
   * @param {Event} event     The triggering click event
   * @protected
   */
  async _onRollHullDie(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    this._denom = btn.form.hulld.value;
    await this.actor.rollHullDie(this._denom);
    this.render();
  }

  /* -------------------------------------------- */

  /**
   * A helper constructor function which displays the Recharge Repair dialog and
   * returns a Promise once it's workflow has been resolved.
   * @param {object} [options={}]
   * @param {Actor5e} [options.actor]  Actor that is taking the recharge repair.
   * @returns {Promise}                Promise that resolves when the repair is completed or rejects when canceled.
   */
  static async rechargeRepairDialog({ actor } = {}) {
    return new Promise((resolve, reject) => {
      const dlg = new this(actor, {
        title: `${game.i18n.localize("SW5E.RechargeRepair")}: ${actor.name}`,
        buttons: {
          rest: {
            icon: '<i class="fas fa-wrench"></i>',
            label: game.i18n.localize("SW5E.Repair"),
            callback: html => {
              const formData = new FormDataExtended(html.find("form")[0]);
              resolve(formData.object);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("Cancel"),
            callback: reject
          }
        },
        close: reject
      });
      dlg.render(true);
    });
  }
}
