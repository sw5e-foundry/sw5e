import { EnchantmentData } from "../../data/item/fields/enchantment-field.mjs";
import simplifyRollFormula from "../../dice/simplify-roll-formula.mjs";

/**
 * A specialized Dialog subclass for ability usage.
 *
 * @param {Item5e} item                                Item that is being used.
 * @param {object} [dialogData={}]                     An object of dialog data which configures
 *                                                     how the modal window is rendered.
 * @param {object} [options={}]                        Dialog rendering options.
 * @param {ItemUseConfiguration} [options.usageConfig] The ability use configuration's values.
 */
export default class AbilityUseDialog extends Dialog {
  constructor( item, dialogData = {}, options = {} ) {
    super( dialogData, options );
    this.options.classes = ["sw5e", "dialog"];

    /**
     * Store a reference to the Item document being used
     * @type {Item5e}
     */
    this.item = item;

    /**
     * Store a reference to the ItemUseConfiguration being used
     * @type {ItemUseConfiguration}
     */
    this.configuration = options.usageConfig ?? {};
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /**
   * Configuration options for displaying the ability use dialog.
   *
   * @typedef {object} AbilityUseDialogOptions
   * @property {object} [button]
   * @property {string} [button.icon]     Icon used for the activation button.
   * @property {string} [button.label]    Label used for the activation button.
   * @property {string} [disableScaling]  Should power or resource scaling be disabled?
   */

  /**
   * A constructor function which displays the Power Cast Dialog app for a given Actor and Item.
   * Returns a Promise which resolves to the dialog FormData once the workflow has been completed.
   * @param {Item5e} item                           Item being used.
   * @param {ItemUseConfiguration} config           The ability use configuration's values.
   * @param {AbilityUseDialogOptions} [options={}]  Additional options for displaying the dialog.
   * @returns {Promise}                             Promise that is resolved when the use dialog is acted upon.
   */
  static async create( item, config, options = {} ) {
    if ( !item.isOwned ) throw new Error( "You cannot display an ability usage dialog for an unowned item" );
    config ??= item._getUsageConfig();

    const limit = item.actor.system.attributes?.concentration?.limit ?? 0;
    const concentrationOptions = this._createConcentrationOptions( item );
    const resourceOptions = this._createResourceOptions( item );

    const slotOptions = this._createPowerSlotOptions( item, item.system.level );
    if ( item.type === "power" ) {
      const slot = slotOptions.find( s => s.key === config.slotLevel ) ?? slotOptions.find( s => s.canCast );
      if ( slot ) item = item.clone( { "system.level": slot.level } );
    }

    const data = {
      item,
      ...config,
      slotOptions: config.consumePowerSlot ? slotOptions : [],
      enchantmentOptions: this._createEnchantmentOptions( item ),
      summoningOptions: this._createSummoningOptions( item ),
      resourceOptions: resourceOptions,
      resourceArray: Array.isArray( resourceOptions ),
      concentration: {
        show: ( config.beginConcentrating !== null ) && !!concentrationOptions.length,
        options: concentrationOptions,
        optional: ( concentrationOptions.length < limit ) ? "—" : null
      },
      scaling: options.disableScaling ? null : item.usageScaling,
      note: this._getAbilityUseNote( item, config ),
      title: game.i18n.format( "SW5E.AbilityUseHint", {
        type: game.i18n.localize( CONFIG.Item.typeLabels[item.type] ),
        name: item.name
      } )
    };
    this._getAbilityUseWarnings( data, options );

    // Render the ability usage template
    const html = await renderTemplate( "systems/sw5e/templates/apps/ability-use.hbs", data );

    // Create the Dialog and return data as a Promise
    const isPower = item.type === "power";
    const label = game.i18n.localize( `SW5E.AbilityUse${isPower ? "Cast" : "Use"}` );
    return new Promise( resolve => {
      const dlg = new this( item, {
        title: `${item.name}: ${game.i18n.localize( "SW5E.AbilityUseConfig" )}`,
        content: html,
        buttons: {
          use: {
            icon: options.button?.icon ?? `<i class="fas ${isPower ? "fa-magic" : "fa-fist-raised"}"></i>`,
            label: options.button?.label ?? label,
            callback: html => {
              const fd = new FormDataExtended( html[0].querySelector( "form" ) );
              resolve( fd.object );
            }
          }
        },
        default: "use",
        close: () => resolve( null )
      }, {
        usageConfig: config
      } );
      dlg.render( true );
    } );
  }

  /* -------------------------------------------- */
  /*  Helpers                                     */
  /* -------------------------------------------- */

  /**
   * Create an array of options for which concentration effect to end or replace.
   * @param {Item5e} item     The item being used.
   * @returns {object[]}      Array of concentration options.
   * @private
   */
  static _createConcentrationOptions( item ) {
    const { effects } = item.actor.concentration;
    return effects.reduce( ( acc, effect ) => {
      const data = effect.getFlag( "sw5e", "itemData" );
      acc.push( {
        name: effect.id,
        label: data?.name ?? item.actor.items.get( data )?.name ?? game.i18n.localize( "SW5E.ConcentratingItemless" )
      } );
      return acc;
    }, [] );
  }

  /* -------------------------------------------- */

  /**
   * Create an array of power slot options for a select.
   * @param {Item5e} item    The item being cast.
   * @param {number} level   The minimum level.
   * @returns {object[]}     Array of power slot select options.
   * @private
   */
  static _createPowerSlotOptions( item, level ) {
    const actor = item.actor;
    if ( !actor.system.powers ) return [];

    const school = item.system.school;
    const powerType = ( school in CONFIG.SW5E.powerSchoolsForce ) ? "force" : "tech";
    const points = actor.system.attributes[powerType]?.points?.value ?? 0;

    const pabbr = powerType.substring( 0, 1 );
    const pmax = `${pabbr}max`;
    const pval = `${pabbr}value`;
    const povr = `${pabbr}override`;

    // Determine the levels which are feasible
    let lmax = 0;
    const options = Array.fromRange( Object.keys( CONFIG.SW5E.powerLevels ).length ).reduce( ( arr, i ) => {
      if ( i < level ) return arr;
      const label = CONFIG.SW5E.powerLevels[i];
      const l = actor.system.powers[`power${i}`] || { [pmax]: 0, [povr]: null };
      const max = parseInt( l[povr] || l[pmax] || 0 );
      const infSlots = max === 1000;
      const slots = infSlots ? 1000 : Math.clamp( parseInt( l[pval] || 0 ), 0, max );
      if ( max > 0 ) lmax = i;
      arr.push( {
        key: `power${i}`,
        level: i,
        label: ( !infSlots && i > 0 ) ? game.i18n.format( "SW5E.PowerLevelSlot", { level: label, n: `${slots}/${max}` } ) : label,
        canCast: max > 0,
        hasSlots: slots > 0,
        hasPoints: points > i
      } );
      return arr;
    }, [] ).filter( sl => sl.level <= lmax );

    // If this character has other kinds of slots, present them as well.
    for ( const k of Object.keys( CONFIG.SW5E.powercastingTypes ) ) {
      const powerData = actor.system.powers[k];
      if ( !powerData ) continue;
      if ( powerData.level >= level ) {
        options.push( {
          key: k,
          level: powerData.level,
          label: `${game.i18n.format( `SW5E.PowerLevel${k.capitalize()}`, { level: powerData.level, n: powerData.value } )}`,
          canCast: true,
          hasSlots: powerData.value > 0
        } );
      }
    }

    return options;
  }

  /* -------------------------------------------- */

  /**
   * Create details on enchantment that can be applied.
   * @param {Item5e} item  The item.
   * @returns {{ enchantments: object }|null}
   */
  static _createEnchantmentOptions( item ) {
    const enchantments = EnchantmentData.availableEnchantments( item );
    if ( !enchantments.length ) return null;
    const options = {};
    if ( enchantments.length > 1 ) options.profiles = Object.fromEntries( enchantments.map( e => [e._id, e.name] ) );
    else options.profile = enchantments[0]._id;
    return options;
  }

  /* -------------------------------------------- */

  /**
   * Create details on the summoning profiles and other related options.
   * @param {Item5e} item  The item.
   * @returns {{ profiles: object, creatureTypes: object }|null}
   */
  static _createSummoningOptions( item ) {
    const summons = item.system.summons;
    if ( !summons?.profiles.length ) return null;
    const options = {};
    const rollData = item.getRollData();
    const level = summons.relevantLevel;
    options.profiles = Object.fromEntries(
      summons.profiles
        .map( profile => {
          const doc = profile.uuid ? fromUuidSync( profile.uuid ) : null;
          const withinRange = ( ( profile.level.min ?? -Infinity ) <= level ) && ( level <= ( profile.level.max ?? Infinity ) );
          if ( !doc || !withinRange ) return null;
          let label = profile.name ? profile.name : ( doc?.name ?? "—" );
          let count = simplifyRollFormula( Roll.replaceFormulaData( profile.count ?? "1", rollData ) );
          if ( Number.isNumeric( count ) ) {
            count = parseInt( count );
            if ( count > 1 ) label = `${count} x ${label}`;
          } else if ( count ) label = `${count} x ${label}`;
          return [profile._id, label];
        } )
        .filter( f => f )
    );
    if ( Object.values( options.profiles ).length <= 1 ) {
      options.profile = Object.keys( options.profiles )[0];
      options.profiles = null;
    }
    if ( summons.creatureSizes.size > 1 ) options.creatureSizes = summons.creatureSizes.reduce( ( obj, k ) => {
      obj[k] = CONFIG.SW5E.actorSizes[k]?.label;
      return obj;
    }, {} );
    if ( summons.creatureTypes.size > 1 ) options.creatureTypes = summons.creatureTypes.reduce( ( obj, k ) => {
      obj[k] = CONFIG.SW5E.creatureTypes[k]?.label;
      return obj;
    }, {} );
    return options;
  }

  /* -------------------------------------------- */

  /**
   * Configure resource consumption options for a select.
   * @param {Item5e} item     The item.
   * @returns {object|null}   Object of select options, or null if the item does not or cannot scale with resources.
   * @protected
   */
  static _createResourceOptions( item ) {
    const consume = item.system.consume || {};
    if ( ( item.type !== "power" ) || !consume.scale ) return null;
    const powerLevels = Object.keys( CONFIG.SW5E.powerLevels ).length - 1;

    const min = consume.amount || 1;
    const cap = powerLevels + min - item.system.level;

    let target;
    let value;
    let label;
    switch ( consume.type ) {
      case "ammo":
      case "material": {
        target = item.actor.items.get( consume.target );
        label = target?.name;
        value = target?.system.quantity;
        break;
      }
      case "attribute": {
        target = item.actor;
        value = foundry.utils.getProperty( target.system, consume.target );
        break;
      }
      case "charges": {
        target = item.actor.items.get( consume.target );
        label = target?.name;
        value = target?.system.uses.value;
        break;
      }
      case "hitDice": {
        target = item.actor;
        if ( ["smallest", "largest"].includes( consume.target ) ) {
          label = game.i18n.localize( `SW5E.ConsumeHitDice${consume.target.capitalize()}Long` );
          value = target.system.attributes.hd.value;
        } else {
          value = item.actor.system.attributes.hd.bySize[consume.target] ?? 0;
          label = `${game.i18n.localize( "SW5E.HitDice" )} (${consume.target})`;
        }
        break;
      }
      // TODO SW5E: Add support for hullDice, shieldDice and powerDice
    }

    if ( !target ) return null;

    const consumesPowerSlot = consume.target.match( /powers\.([^.]+)\.value/ );
    if ( consumesPowerSlot ) {
      const [, key] = consumesPowerSlot;
      const powers = item.actor.system.powers[key] ?? {};
      const level = powers.level || 0;
      const minimum = ( item.type === "power" ) ? Math.max( item.system.level, level ) : level;
      return this._createPowerSlotOptions( item, minimum );
    }

    const max = Math.min( cap, value );
    return Array.fromRange( max, 1 ).reduce( ( acc, n ) => {
      if ( n >= min ) acc[n] = `[${n}/${value}] ${label ?? consume.target}`;
      return acc;
    }, {} );
  }

  /* -------------------------------------------- */

  /**
   * Get the ability usage note that is displayed.
   * @param {object} item                   Data for the item being used.
   * @param {ItemUseConfiguration} config   The ability use configuration's values.
   * @returns {string}                      The note to display.
   * @private
   */
  static _getAbilityUseNote( item, config ) {
    const { quantity, recharge, uses } = item.system;

    if ( !item.isActive ) return "";

    // Zero quantity
    if ( quantity <= 0 ) return game.i18n.localize( "SW5E.AbilityUseUnavailableHint" );

    // Abilities which use Recharge
    if ( config.consumeUsage && recharge?.value ) {
      return game.i18n.format( recharge.charged ? "SW5E.AbilityUseChargedHint" : "SW5E.AbilityUseRechargeHint", {
        type: game.i18n.localize( CONFIG.Item.typeLabels[item.type] )
      } );
    }

    // Does not use any resource
    if ( !uses?.per || !uses?.max ) return "";

    // Consumables
    if ( uses.autoDestroy ) {
      let str = "SW5E.AbilityUseNormalHint";
      if ( uses.value > 1 ) str = "SW5E.AbilityUseConsumableChargeHint";
      else if ( quantity > 1 ) str = "SW5E.AbilityUseConsumableQuantityHint";
      return game.i18n.format( str, {
        type: game.i18n.localize( `SW5E.Consumable${item.system.type.value.capitalize()}` ),
        value: uses.value,
        quantity: quantity,
        max: uses.max,
        per: CONFIG.SW5E.limitedUsePeriods[uses.per]?.label
      } );
    }

    // Other Items
    else {
      return game.i18n.format( `SW5E.AbilityUse${uses.value ? "Normal" : "Unavailable"}Hint`, {
        type: game.i18n.localize( CONFIG.Item.typeLabels[item.type] ),
        value: uses.value,
        max: uses.max,
        per: CONFIG.SW5E.limitedUsePeriods[uses.per]?.label
      } );
    }
  }

  /* -------------------------------------------- */

  /**
   * Get the ability usage warnings to display.
   * @param {object} data                           Template data for the AbilityUseDialog. **Will be mutated**
   * @param {AbilityUseDialogOptions} [options={}]  Additional options for displaying the dialog.
   * @private
   */
  static _getAbilityUseWarnings( data, options = {} ) {
    const warnings = [];
    const item = data.item;
    const { quantity, level, consume, preparation, school } = item.system;
    const scale = options.disableScaling ? null : item.usageScaling;
    const levels = [level];
    const powerType = ( school in CONFIG.SW5E.powerSchoolsForce ) ? "force" : "tech";

    if ( item.type === "power" ) {
      const powerData = item.actor.system.powers[preparation.mode] ?? {};
      if ( Number.isNumeric( powerData.level ) ) levels.push( powerData.level );
    }

    if ( ( scale === "slot" ) && data.slotOptions.every( o => !o.hasSlots ) ) {
      // Warn that the actor has no power slots of any level with which to use this item.
      warnings.push( game.i18n.format( "SW5E.PowerCastNoSlotsLeft", {
        name: item.name
      } ) );
    } else if ( ( scale === "slot" ) && !data.slotOptions.some( o => levels.includes( o.level ) && o.hasSlots ) ) {
      // Warn that the actor has no power slots of this particular level with which to use this item.
      warnings.push( game.i18n.format( "SW5E.PowerCastNoSlots", {
        level: CONFIG.SW5E.powerLevels[level],
        name: item.name
      } ) );
    }

    if ( ( scale === "slot" ) && data.slotOptions.every( o => !o.hasPoints ) ) {
      // Warn that the actor does not have enough power points to use this item at any level.
      warnings.push( game.i18n.format( "SW5E.PowerCastNoPointsLeft", {
        name: item.name,
        type: powerType
      } ) );
    } else if ( ( scale === "slot" ) && !data.slotOptions.some( o => levels.includes( o.level ) && o.hasPoints ) ) {
      // Warn that the actor does not have enough power points to use this item at this particular level.
      warnings.push( game.i18n.format( "SW5E.PowerCastNoPoints", {
        level: CONFIG.SW5E.powerLevels[level],
        name: item.name,
        type: powerType
      } ) );
    }

    if ( ( scale === "resource" ) && foundry.utils.isEmpty( data.resourceOptions ) ) {
      // Warn that the resource does not have enough left.
      warnings.push( game.i18n.format( "SW5E.ConsumeWarningNoQuantity", {
        name: item.name,
        type: CONFIG.SW5E.abilityConsumptionTypes[consume.type]
      } ) );
    }

    // Warn that the resource item is missing.
    if ( item.hasResource ) {
      const isItem = ["ammo", "material", "charges"].includes( consume.type );
      if ( isItem && !item.actor.items.get( consume.target ) ) {
        warnings.push( game.i18n.format( "SW5E.ConsumeWarningNoSource", {
          name: item.name, type: CONFIG.SW5E.abilityConsumptionTypes[consume.type]
        } ) );
      }
    }

    // Display warnings that the item or its resource item will be destroyed.
    if ( item.type === "consumable" ) {
      const type = game.i18n.localize( `SW5E.Consumable${item.system.type.value.capitalize()}` );
      if ( this._willLowerQuantity( item ) && ( quantity === 1 ) ) {
        warnings.push( game.i18n.format( "SW5E.AbilityUseConsumableDestroyHint", { type } ) );
      }

      const resource = item.actor.items.get( consume.target );
      const qty = consume.amount || 1;
      if ( resource && ( resource.system.quantity === 1 ) && this._willLowerQuantity( resource, qty ) ) {
        warnings.push( game.i18n.format( "SW5E.AbilityUseConsumableDestroyResourceHint", { type, name: resource.name } ) );
      }
    }

    // Display warnings that the actor cannot concentrate on this item, or if it must replace one of the effects.
    if ( data.concentration.show ) {
      const locale = `SW5E.ConcentratingWarnLimit${data.concentration.optional ? "Optional" : ""}`;
      warnings.push( game.i18n.localize( locale ) );
    } else if ( data.beginConcentrating && !item.actor.system.attributes?.concentration?.limit ) {
      const locale = "SW5E.ConcentratingWarnLimitZero";
      warnings.push( game.i18n.localize( locale ) );
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
  static _willLowerQuantity( item, consume = 1 ) {
    const hasUses = item.hasLimitedUses;
    const uses = item.system.uses;
    if ( !hasUses || !uses.autoDestroy ) return false;
    const value = uses.value - consume;
    return value <= 0;
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners( jQuery ) {
    super.activateListeners( jQuery );
    const [html] = jQuery;

    html.querySelector( '[name="slotLevel"]' )?.addEventListener( "change", this._onChangeSlotLevel.bind( this ) );
  }

  /* -------------------------------------------- */

  /**
   * Update summoning profiles when power slot level is changed.
   * @param {Event} event  Triggering change event.
   */
  _onChangeSlotLevel( event ) {
    const level = this.item.actor?.system.powers?.[event.target.value]?.level;
    const item = this.item.clone( { "system.level": level ?? this.item.system.level } );
    this._updateProfilesInput(
      "enchantmentProfile", "SW5E.Enchantment.Label", this.constructor._createEnchantmentOptions( item )
    );
    this._updateProfilesInput(
      "summonsProfile", "SW5E.Summoning.Profile.Label", this.constructor._createSummoningOptions( item )
    );
  }

  /* -------------------------------------------- */

  /**
   * Update enchantment or summoning profiles inputs when the level changes.
   * @param {string} name                Name of the field to update.
   * @param {string} label               Localization key for the field's aria label.
   * @param {object} options
   * @param {object} [options.profiles]  Profile options to display, if multiple.
   * @param {string} [options.profile]   Single profile to select, if only one.
   */
  _updateProfilesInput( name, label, options ) {
    const originalInput = this.element[0].querySelector( `[name="${name}"]` );
    if ( !originalInput ) return;

    // If multiple profiles, replace with select element
    if ( options.profiles ) {
      const select = document.createElement( "select" );
      select.name = name;
      select.ariaLabel = game.i18n.localize( label );
      for ( const [id, label] of Object.entries( options.profiles ) ) {
        const option = document.createElement( "option" );
        option.value = id;
        option.innerText = label;
        if ( id === originalInput.value ) option.selected = true;
        select.append( option );
      }
      originalInput.replaceWith( select );
    }

    // If only one profile, replace with hidden input
    else {
      const input = document.createElement( "input" );
      input.type = "hidden";
      input.name = name;
      input.value = options.profile ?? "";
      originalInput.replaceWith( input );
    }
  }
}
