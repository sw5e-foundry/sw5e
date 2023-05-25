/**
 * A specialized Dialog subclass for ability usage.
 *
 * @param {Item5e} item             Item that is being used.
 * @param {object} [dialogData={}]  An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}]     Dialog rendering options.
 */
export default class AbilityUseDialog extends Dialog {
  constructor(item, dialogData={}, options={}) {
    super(dialogData, options);
    this.options.classes = ["sw5e", "dialog"];

    /**
     * Store a reference to the Item document being used
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
   * @param {Item5e} item  Item being used.
   * @returns {Promise}    Promise that is resolved when the use dialog is acted upon.
   */
  static async create(item) {
    if ( !item.isOwned ) throw new Error("You cannot display an ability usage dialog for an unowned item");

    // Prepare data
    const uses = item.system.uses ?? {};
    const resource = item.system.consume ?? {};
    const quantity = item.system.quantity ?? 0;
    const recharge = item.system.recharge ?? {};
    const recharges = !!recharge.value;
    const sufficientUses = (quantity > 0 && !uses.value) || uses.value > 0;

    // Prepare dialog form data
    const data = {
      item: item,
      title: game.i18n.format("SW5E.AbilityUseHint", {type: game.i18n.localize(CONFIG.Item.typeLabels[item.type]), name: item.name}),
      note: this._getAbilityUseNote(item, uses, recharge),
      consumePowerSlot: false,
      consumeRecharge: recharges,
      consumeResource: resource.target && (!item.hasAttack || (resource.type !== "ammo")),
      consumeUses: uses.per && (uses.max > 0),
      canUse: recharges ? recharge.charged : sufficientUses,
      createTemplate: game.user.can("TEMPLATE_CREATE") && item.hasAreaTarget,
      errors: []
    };
    if ( item.type === "power" ) this._getPowerData(item.actor.system, item.system, data);

    // Render the ability usage template
    const html = await renderTemplate("systems/sw5e/templates/apps/ability-use.hbs", data);

    // Create the Dialog and return data as a Promise
    const icon = data.isPower ? "fa-magic" : "fa-fist-raised";
    const label = game.i18n.localize(`SW5E.AbilityUse${data.isPower ? "Cast" : "Use"}`);
    return new Promise(resolve => {
      const dlg = new this(item, {
        title: `${item.name}: ${game.i18n.localize("SW5E.AbilityUseConfig")}`,
        content: html,
        buttons: {
          use: {
            icon: `<i class="fas ${icon}"></i>`,
            label: label,
            callback: html => {
              const fd = new FormDataExtended(html[0].querySelector("form"));
              resolve(fd.object);
            }
          }
        },
        default: "use",
        close: () => resolve(null)
      });
      dlg.render(true);
    });
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  /**
   * Get dialog data related to limited power slots.
   * @param {object} actorData  System data from the actor using the power.
   * @param {object} itemData   System data from the power being used.
   * @param {object} data       Data for the dialog being presented.
   * @returns {object}          Modified dialog data.
   * @private
   */
  static _getPowerData(actorData, itemData, data) {

    // Determine whether the power may be up-cast
    const lvl = itemData.level;
    const consumePowerSlot = (lvl > 0) && CONFIG.SW5E.powerUpcastModes.includes(itemData.preparation.mode);

    // If can't upcast, return early and don't bother calculating available power slots
    if (!consumePowerSlot) {
      return foundry.utils.mergeObject(data, { isPower: true, consumePowerSlot });
    }

    // Determine the levels which are feasible
    let lmax = 0;
    const powerLevels = Array.fromRange(10).reduce((arr, i) => {
      if ( i < lvl ) return arr;
      const label = CONFIG.SW5E.powerLevels[i];
      const l = actorData.powers[`power${i}`] || {max: 0, override: null};
      let max = parseInt(l.override || l.max || 0);
      let slots = Math.clamped(parseInt(l.value || 0), 0, max);
      if ( max > 0 ) lmax = i;
      arr.push({
        level: i,
        label: i > 0 ? game.i18n.format("SW5E.PowerLevelSlot", {level: label, n: slots}) : label,
        canCast: max > 0,
        hasSlots: slots > 0
      });
      return arr;
    }, []).filter(sl => sl.level <= lmax);

    // If this character has pact slots, present them as an option for casting the power.
    const pact = actorData.powers.pact;
    if (pact.level >= lvl) {
      powerLevels.push({
        level: "pact",
        label: `${game.i18n.format("SW5E.PowerLevelPact", {level: pact.level, n: pact.value})}`,
        canCast: true,
        hasSlots: pact.value > 0
      });
    }
    const canCast = powerLevels.some(l => l.hasSlots);
    if ( !canCast ) data.errors.push(game.i18n.format("SW5E.PowerCastNoSlots", {
      level: CONFIG.SW5E.powerLevels[lvl],
      name: data.item.name
    }));

    // Merge power casting data
    return foundry.utils.mergeObject(data, { isPower: true, consumePowerSlot, powerLevels });
  }

  /* -------------------------------------------- */

  /**
   * Get the ability usage note that is displayed.
   * @param {object} item                                     Data for the item being used.
   * @param {{value: number, max: number, per: string}} uses  Object uses and recovery configuration.
   * @param {{charged: boolean, value: string}} recharge      Object recharge configuration.
   * @returns {string}                                        Localized string indicating available uses.
   * @private
   */
  static _getAbilityUseNote(item, uses, recharge) {

    // Zero quantity
    const quantity = item.system.quantity;
    if ( quantity <= 0 ) return game.i18n.localize("SW5E.AbilityUseUnavailableHint");

    // Abilities which use Recharge
    if ( recharge.value ) {
      return game.i18n.format(recharge.charged ? "SW5E.AbilityUseChargedHint" : "SW5E.AbilityUseRechargeHint", {
        type: game.i18n.localize(CONFIG.Item.typeLabels[item.type])
      });
    }

    // Does not use any resource
    if ( !uses.per || !uses.max ) return "";

    // Consumables
    if ( item.type === "consumable" ) {
      let str = "SW5E.AbilityUseNormalHint";
      if ( uses.value > 1 ) str = "SW5E.AbilityUseConsumableChargeHint";
      else if ( item.system.quantity === 1 && uses.autoDestroy ) str = "SW5E.AbilityUseConsumableDestroyHint";
      else if ( item.system.quantity > 1 ) str = "SW5E.AbilityUseConsumableQuantityHint";
      return game.i18n.format(str, {
        type: game.i18n.localize(`SW5E.Consumable${item.system.consumableType.capitalize()}`),
        value: uses.value,
        quantity: item.system.quantity,
        max: uses.max,
        per: CONFIG.SW5E.limitedUsePeriods[uses.per]
      });
    }

    // Other Items
    else {
      return game.i18n.format("SW5E.AbilityUseNormalHint", {
        type: game.i18n.localize(CONFIG.Item.typeLabels[item.type]),
        value: uses.value,
        max: uses.max,
        per: CONFIG.SW5E.limitedUsePeriods[uses.per]
      });
    }
  }
}
