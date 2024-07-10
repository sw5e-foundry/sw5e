/**
 * Application for configuring the source data on actors and items.
 */
export default class SourceConfig extends DocumentSheet {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject( super.defaultOptions, {
      classes: ["sw5e", "source-config", "dialog"],
      template: "systems/sw5e/templates/apps/source-config.hbs",
      width: 400,
      height: "auto",
      sheetConfig: false,
      keyPath: "system.details.source"
    } );
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return `${game.i18n.localize( "SW5E.SourceConfig" )}: ${this.document.name}`;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData( options ) {
    const context = super.getData( options );
    context.appId = this.id;
    context.CONFIG = CONFIG.SW5E;
    context.source = foundry.utils.getProperty( this.document, this.options.keyPath );
    context.sourceUuid = this.document._stats.compendiumSource
      ?? foundry.utils.getProperty( this.document, "flags.core.sourceId" );
    context.hasSourceId = !!( await fromUuid( context.sourceUuid ) );
    return context;
  }

  /* -------------------------------------------- */
  /*  Event Handlers                              */
  /* -------------------------------------------- */

  /** @override */
  async _updateObject( event, formData ) {
    const source = foundry.utils.expandObject( formData ).source;
    return this.document.update( { [this.options.keyPath]: source } );
  }
}
