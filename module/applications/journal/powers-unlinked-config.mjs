/**
 * Application for configuring a single unlinked power in a power list.
 */
export default class PowersUnlinkedConfig extends DocumentSheet {
  constructor( unlinkedId, object, options={} ) {
    super( object, options );
    this.unlinkedId = unlinkedId;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject( super.defaultOptions, {
      classes: ["sw5e", "unlinked-power-config"],
      template: "systems/sw5e/templates/journal/page-power-list-unlinked-config.hbs",
      width: 400,
      height: "auto",
      sheetConfig: false
    } );
  }

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * ID of the unlinked power entry being edited.
   * @type {string}
   */
  unlinkedId;

  /* -------------------------------------------- */

  /** @inheritDoc */
  get title() {
    return `${game.i18n.localize(
      "JOURNALENTRYPAGE.SW5E.PowerList.UnlinkedPowers.Configuration" )}: ${this.document.name}`;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @inheritDoc */
  getData() {
    const context = {
      ...super.getData(),
      ...this.document.system.unlinkedPowers.find( u => u._id === this.unlinkedId ),
      appId: this.id,
      CONFIG: CONFIG.SW5E
    };
    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _updateObject( event, formData ) {
    const unlinkedPowers = this.document.toObject().system.unlinkedPowers;
    const editing = unlinkedPowers.find( s => s._id === this.unlinkedId );
    foundry.utils.mergeObject( editing, formData );
    this.document.update( {"system.unlinkedPowers": unlinkedPowers} );
  }
}
