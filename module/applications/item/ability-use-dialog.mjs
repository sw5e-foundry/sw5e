/**
 * A specialized Dialog subclass for ability usage.
 *
 * @param {Item5e} item             Item that is being used.
 * @param {object} [dialogData={}]  An object of dialog data which configures how the modal window is rendered.
 * @param {object} [options={}]     Dialog rendering options.
 */
export default class AbilityUseDialog extends Dialog {
  constructor(item, dialogData = {}, options = {}) {
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
   * @param {Item5e} item                   Item being used.
   * @param {ItemUseConfiguration} config   The ability use configuration's values.
   * @returns {Promise}                     Promise that is resolved when the use dialog is acted upon.
   */
  static async create(item, config) {
    if ( !item.isOwned ) throw new Error("You cannot display an ability usage dialog for an unowned item");
    config ??= item._getUsageConfig();
    const slotOptions = config.consumePowerSlot ? this._createPowerSlotOptions(item.actor, item) : [];
    const resourceOptions = this._createResourceOptions(item);
    // Prepare dialog form data
    const data = {
      item,
      ...config,
      slotOptions,
      resourceOptions,
      scaling: item.usageScaling,
      note: this._getAbilityUseNote(item, config),
      title: game.i18n.format("SW5E.AbilityUseHint", {
        type: game.i18n.localize(CONFIG.Item.typeLabels[item.type]),
        name: item.name
      })
    };
    this._getAbilityUseWarnings(data);

    // Render the ability usage template
    const html = await renderTemplate("systems/sw5e/templates/apps/ability-use.hbs", data);

    // Create the Dialog and return data as a Promise
    const isPower = item.type === "power";
    const label = game.i18n.localize(`SW5E.AbilityUse${data.isPower ? "Cast" : "Use"}`);
    return new Promise(resolve => {
      const dlg = new this(item, {
        title: `${item.name}: ${game.i18n.localize("SW5E.AbilityUseConfig")}`,
        content: html,
        buttons: {
          use: {
            icon: `<i class="fas ${isPower ? "fa-magic" : "fa-fist-raised"}"></i>`,
            label,
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
   * Create an array of power slot options for a select.
   * @param {Actor5e} actor  The actor with power slots.
   * @param {Item5e} item    The item being cast.
   * @returns {object[]}     Array of power slot select options.
   * @private
   */
  static _createPowerSlotOptions(actor, item) {
    const level = item.system.level;
    const school = item.system.school;
    const schoolCfg = CONFIG.SW5E.powerSchools;
    const powerType = schoolCfg.isForce ? "force" : "tech";
    const points = actor.system.attributes[powerType]?.points?.value ?? 0;

    const pabbr = powerType.substring(0, 1);
    const pmax = `${pabbr}max`;
    const pval = `${pabbr}value`;
    const povr = `${pabbr}override`;

    // Determine the levels which are feasible
    let lmax = 0;
    const options = Array.fromRange(Object.keys(CONFIG.SW5E.powerLevels).length).reduce((arr, i) => {
      if ( i < level ) return arr;
      const label = CONFIG.SW5E.powerLevels[i];
      const l = actor.system.powers[`power${i}`] || { [pmax]: 0, [povr]: null };
      const max = parseInt(l[povr] || l[pmax] || 0);
      const infSlots = max === 1000;
      const slots = infSlots ? 1000 : Math.clamped(parseInt(l[pval] || 0), 0, max);
      if ( max > 0 ) lmax = i;
      arr.push({
        key: `power${i}`,
        level: i,
        label: (!infSlots && i > 0) ? game.i18n.format("SW5E.PowerLevelSlot", { level: label, n: `${slots}/${max}` }) : label,
        canCast: max > 0,
        hasSlots: slots > 0,
        hasPoints: points > i
      });
      return arr;
    }, []).filter(sl => sl.level <= lmax);

    return options;
  }

  /* -------------------------------------------- */

  /**
   * Configure resource consumption options for a select.
   * @param {Item5e} item     The item.
   * @returns {object|null}   Object of select options, or null if the item does not or cannot scale with resources.
   * @protected
   */
  static _createResourceOptions(item) {
    const consume = item.system.consume || {};
    if ( (item.type !== "power") || !consume.scale ) return null;
    const powerLevels = Object.keys(CONFIG.SW5E.powerLevels).length - 1;

    const min = consume.amount || 1;
    const cap = powerLevels + min - item.system.level;

    let target;
    let value;
    let label;
    switch ( consume.type ) {
      case "ammo":
      case "material": {
        target = item.actor.items.get(consume.target);
        label = target?.name;
        value = target?.system.quantity;
        break;
      }
      case "attribute": {
        target = item.actor;
        value = foundry.utils.getProperty(target.system, consume.target);
        break;
      }
      case "charges": {
        target = item.actor.items.get(consume.target);
        label = target?.name;
        value = target?.system.uses.value;
        break;
      }
      case "hitDice": {
        target = item.actor;
        if ( ["smallest", "largest"].includes(consume.target) ) {
          label = game.i18n.localize(`SW5E.ConsumeHitDice${consume.target.capitalize()}Long`);
          value = target.system.attributes.hd;
        } else {
          value = Object.values(item.actor.classes ?? {}).reduce((acc, cls) => {
            if ( cls.system.hitDice !== consume.target ) return acc;
            const hd = cls.system.levels - cls.system.hitDiceUsed;
            return acc + hd;
          }, 0);
          label = `${game.i18n.localize("SW5E.HitDice")} (${consume.target})`;
        }
        break;
      }
      // TODO SW5E: Add support for hullDice, shieldDice and powerDice
    }

    if ( !target ) return null;

    const max = Math.min(cap, value);
    return Array.fromRange(max, 1).reduce((acc, n) => {
      if ( n >= min ) acc[n] = `[${n}/${value}] ${label ?? consume.target}`;
      return acc;
    }, {});
  }

  /* -------------------------------------------- */

  /**
   * Get the ability usage note that is displayed.
   * @param {object} item                   Data for the item being used.
   * @param {ItemUseConfiguration} config   The ability use configuration's values.
   * @returns {string}                      The note to display.
   * @private
   */
  static _getAbilityUseNote(item, config) {
    const { quantity, recharge, uses } = item.system;
    // Zero quantity
    if (quantity <= 0) return game.i18n.localize("SW5E.AbilityUseUnavailableHint");

    // Abilities which use Recharge
    if (config.consumeUsage && recharge?.value) {
      return game.i18n.format(recharge.charged ? "SW5E.AbilityUseChargedHint" : "SW5E.AbilityUseRechargeHint", {
        type: game.i18n.localize(CONFIG.Item.typeLabels[item.type])
      });
    }

    // Does not use any resource
    if (!uses?.per || !uses?.max) return "";

    // Consumables
    if (uses.autoDestroy) {
      let str = "SW5E.AbilityUseNormalHint";
      if (uses.value > 1) str = "SW5E.AbilityUseConsumableChargeHint";
      else if ( quantity > 1 ) str = "SW5E.AbilityUseConsumableQuantityHint";
      return game.i18n.format(str, {
        type: game.i18n.localize(`SW5E.Consumable${item.system.type.value.capitalize()}`),
        value: uses.value,
        quantity: quantity,
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

  /* -------------------------------------------- */

  /**
   * Get the ability usage warnings to display.
   * @param {object} data  Template data for the AbilityUseDialog. **Will be mutated**
   * @private
   */
  static _getAbilityUseWarnings(data) {
    const warnings = [];
    const item = data.item;
    const { quantity, level, consume, preparation, school } = item.system;
    const scale = item.usageScaling;
    const levels = (preparation?.mode === "pact") ? [level, item.actor.system.powers.pact.level] : [level];
    const schoolCfg = CONFIG.SW5E.powerSchools;
    const powerType = schoolCfg.isForce ? "force" : "tech";

    if ( (scale === "slot") && data.slotOptions.every(o => !o.hasSlots) ) {
      // Warn that the actor has no power slots of any level with which to use this item.
      warnings.push(game.i18n.format("SW5E.PowerCastNoSlotsLeft", {
        name: item.name
      }));
    } else if ( (scale === "slot") && !data.slotOptions.some(o => levels.includes(o.level) && o.hasSlots) ) {
      // Warn that the actor has no power slots of this particular level with which to use this item.
      warnings.push(game.i18n.format("SW5E.PowerCastNoSlots", {
        level: CONFIG.SW5E.powerLevels[level],
        name: item.name
      }));
    }

    if ( (scale === "slot") && data.slotOptions.every(o => !o.hasPoints) ) {
      // Warn that the actor does not have enough power points to use this item at any level.
      warnings.push(game.i18n.format("SW5E.PowerCastNoPointsLeft", {
        name: item.name,
        type: powerType
      }));
    } else if ( (scale === "slot") && !data.slotOptions.some(o => levels.includes(o.level) && o.hasPoints) ) {
      // Warn that the actor does not have enough power points to use this item at this particular level.
      warnings.push(game.i18n.format("SW5E.PowerCastNoPoints", {
        level: CONFIG.SW5E.powerLevels[level],
        name: item.name,
        type: powerType
      }));
    }

    if ( (scale === "resource") && foundry.utils.isEmpty(data.resourceOptions) ) {
      // Warn that the resource does not have enough left.
      warnings.push(game.i18n.format("SW5E.ConsumeWarningNoQuantity", {
        name: item.name,
        type: CONFIG.SW5E.abilityConsumptionTypes[consume.type]
      }));
    }

    // Warn that the resource item is missing.
    if ( item.hasResource ) {
      const isItem = ["ammo", "material", "charges"].includes(consume.type);
      if ( isItem && !item.actor.items.get(consume.target) ) {
        warnings.push(game.i18n.format("SW5E.ConsumeWarningNoSource", {
          name: item.name, type: CONFIG.SW5E.abilityConsumptionTypes[consume.type]
        }));
      }
    }

    // Display warnings that the item or its resource item will be destroyed.
    if ( item.type === "consumable" ) {
      const type = game.i18n.localize(`SW5E.Consumable${item.system.type.value.capitalize()}`);
      if ( this._willLowerQuantity(item) && (quantity === 1) ) {
        warnings.push(game.i18n.format("SW5E.AbilityUseConsumableDestroyHint", {type}));
      }

      const resource = item.actor.items.get(consume.target);
      const qty = consume.amount || 1;
      if ( resource && (resource.system.quantity === 1) && this._willLowerQuantity(resource, qty) ) {
        warnings.push(game.i18n.format("SW5E.AbilityUseConsumableDestroyResourceHint", {type, name: resource.name}));
      }
    }

    data.warnings = warnings;
  }

  /* -------------------------------------------- */

  /**
   * Get whether an update for an item's limited uses will result in lowering its quantity.
   * @param {Item5e} item       The item targeted for updates.
   * @param {number} [consume]  The amount of limited uses to subtract.
   * @returns {boolean}
   * @private
   */
  static _willLowerQuantity(item, consume=1) {
    const hasUses = item.hasLimitedUses;
    const uses = item.system.uses;
    if ( !hasUses || !uses.autoDestroy ) return false;
    const value = uses.value - consume;
    return value <= 0;
  }
}
