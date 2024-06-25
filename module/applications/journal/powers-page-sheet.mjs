import PowerListJournalPageData from "../../data/journal/powers.mjs";
import { linkForUuid, sortObjectEntries } from "../../utils.mjs";
import Items5e from "../../data/collection/items-collection.mjs";
import PowersUnlinkedConfig from "./powers-unlinked-config.mjs";

/**
 * Journal entry page the displays a list of powers for a class, archetype, background, or something else.
 */
export default class JournalPowerListPageSheet extends JournalPageSheet {

  /** @inheritDoc */
  static get defaultOptions() {
    const options = foundry.utils.mergeObject( super.defaultOptions, {
      dragDrop: [{dropSelector: "form"}],
      submitOnChange: true,
      width: 700,
      displayAsTable: false,
      embedRendering: false,
      grouping: null
    } );
    options.classes.push( "powers" );
    return options;
  }

  /* -------------------------------------------- */

  /**
   * Different ways in which powers can be grouped on the sheet.
   * @type {Record<string, string>}
   */
  static get GROUPING_MODES() {
    return PowerListJournalPageData.GROUPING_MODES;
  }

  /* -------------------------------------------- */

  /**
   * Currently selected grouping mode.
   * @type {string|null}
   */
  grouping = null;

  /* -------------------------------------------- */

  /** @inheritDoc */
  get template() {
    if ( this.options.displayAsTable ) return "systems/sw5e/templates/journal/page-power-list-table.hbs";
    return `systems/sw5e/templates/journal/page-power-list-${this.isEditable ? "edit" : "view"}.hbs`;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async getData( options ) {
    const context = super.getData( options );
    context.CONFIG = CONFIG.SW5E;
    context.system = context.document.system;
    context.embedRendering = this.options.embedRendering ?? false;

    context.title = Object.fromEntries( Array.fromRange( 4, 1 ).map( n => [`level${n}`, context.data.title.level + n - 1] ) );

    context.description = await TextEditor.enrichHTML( context.system.description.value, {
      async: true, relativeTo: this
    } );
    if ( context.description === "<p></p>" ) context.description = "";

    context.GROUPING_MODES = this.constructor.GROUPING_MODES;
    context.grouping = this.grouping || this.options.grouping || context.system.grouping;

    context.powers = await this.preparePowers( context.grouping );

    context.sections = {};
    for ( const data of context.powers ) {
      const power = data.power ?? data.unlinked;
      let section;
      switch ( context.grouping ) {
        case "level":
          const level = power.system.level;
          section = context.sections[level] ??= { header: CONFIG.SW5E.powerLevels[level], powers: [] };
          break;
        case "school":
          const school = power.system.school;
          section = context.sections[school] ??= { header: CONFIG.SW5E.powerSchools[school]?.label, powers: [] };
          break;
        case "alphabetical":
          const letter = power.name.slice( 0, 1 ).toLowerCase();
          section = context.sections[letter] ??= { header: letter.toUpperCase(), powers: [] };
          break;
        default:
          continue;
      }
      section.powers.push( data );
    }
    if ( context.grouping === "school" ) context.sections = sortObjectEntries( context.sections, "header" );

    if ( this.options.displayAsTable ) Object.values( context.sections ).forEach( section => {
      const powers = section.powers.map( s => linkForUuid( s.uuid ) );
      section.powerList = game.i18n.getListFormatter( { type: "unit" } ).format( powers );
    } );

    return context;
  }

  /* -------------------------------------------- */

  /**
   * Load indices with necessary information for powers.
   * @param {string} grouping  Grouping mode to respect.
   * @returns {object[]}
   */
  async preparePowers( grouping ) {
    let fields;
    switch ( grouping ) {
      case "level": fields = ["system.level"]; break;
      case "school": fields = ["system.school"]; break;
      default: fields = []; break;
    }

    const unlinkedData = {};
    const uuids = new Set( this.document.system.powers );
    for ( const unlinked of this.document.system.unlinkedPowers ) {
      if ( unlinked.source.uuid ) {
        uuids.add( unlinked.source.uuid );
        unlinkedData[unlinked.source.uuid] = unlinked;
      }
    }

    let collections = new Collection();
    for ( const uuid of uuids ) {
      const { collection } = foundry.utils.parseUuid( uuid );
      if ( collection && !collections.has( collection ) ) {
        if ( collection instanceof Items5e ) collections.set( collection, collection );
        else collections.set( collection, collection.getIndex( { fields } ) );
      } else if ( !collection ) uuids.delete( uuid );
    }

    const powers = ( await Promise.all( collections.values() ) ).flatMap( c => c.filter( s => uuids.has( s.uuid ) ) );

    for ( const unlinked of this.document.system.unlinkedPowers ) {
      if ( !uuids.has( unlinked.source.uuid ) ) powers.push( { unlinked } );
    }

    return powers
      .map( power => {
        const data = power.unlinked ? power : { power };
        data.unlinked ??= unlinkedData[data.power?.uuid];
        data.name = data.power?.name ?? data.unlinked?.name ?? "";
        if ( data.power ) {
          data.display = linkForUuid( data.power.uuid, {
            tooltip: '<section class="loading"><i class="fas fa-spinner fa-spin-pulse"></i></section>'
          } );
        } else {
          data.display = `<span class="unlinked-power"
            data-tooltip="${data.unlinked.source.label}">${data.unlinked.name ?? "—"}*</span>`;
        }
        return data;
      } )
      .sort( ( a, b ) => a.name.localeCompare( b.name, game.i18n.lang ) );
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @inheritDoc */
  activateListeners( jQuery ) {
    super.activateListeners( jQuery );
    const [html] = jQuery;

    html.querySelector( '[name="grouping"]' )?.addEventListener( "change", event => {
      this.grouping = ( event.target.value === this.document.system.grouping ) ? null : event.target.value;
      this.object.parent.sheet.render();
    } );
    html.querySelectorAll( "[data-action]" ).forEach( e => {
      e.addEventListener( "click", this._onAction.bind( this ) );
    } );
  }

  /* -------------------------------------------- */

  /**
   * Handle performing an action.
   * @param {PointerEvent} event  This triggering click event.
   */
  async _onAction( event ) {
    event.preventDefault();
    const { action } = event.target.dataset;

    const { itemUuid, unlinkedId } = event.target.closest( ".item" )?.dataset ?? {};
    switch ( action ) {
      case "add-unlinked":
        await this.document.update( {"system.unlinkedPowers": [...this.document.system.unlinkedPowers, {}]} );
        const id = this.document.toObject().system.unlinkedPowers.pop()._id;
        new PowersUnlinkedConfig( id, this.document ).render( true );
        break;
      case "delete":
        if ( itemUuid ) {
          const powerSet = this.document.system.powers.filter( s => s !== itemUuid );
          await this.document.update( {"system.powers": Array.from( powerSet )} );
        } else if ( unlinkedId ) {
          const unlinkedSet = this.document.system.unlinkedPowers.filter( s => s._id !== unlinkedId );
          await this.document.update( {"system.unlinkedPowers": Array.from( unlinkedSet )} );
        }
        this.render();
        break;
      case "edit-unlinked":
        if ( unlinkedId ) new PowersUnlinkedConfig( unlinkedId, this.document ).render( true );
        break;
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async _onDrop( event ) {
    const data = TextEditor.getDragEventData( event );
    let powers;
    switch ( data?.type ) {
      case "Folder":
        powers = ( await Folder.implementation.fromDropData( data ) )?.contents;
        break;
      case "Item":
        powers = [await Item.implementation.fromDropData( data )];
        break;
      default: return false;
    }

    const powerUuids = this.document.system.powers;
    powers = powers.filter( item => ( item.type === "power" ) && !powerUuids.has( item.uuid ) );
    if ( !powers.length ) return false;

    powers.forEach( i => powerUuids.add( i.uuid ) );
    await this.document.update( {"system.powers": Array.from( powerUuids )} );
    this.render();
  }
}
