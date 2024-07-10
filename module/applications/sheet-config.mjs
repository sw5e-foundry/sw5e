import { setTheme } from "../settings.mjs";

/**
 * Sheet config with extra options.
 */
export default class SheetConfig5e extends DocumentSheetConfig {

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject( super.defaultOptions, {
      template: "systems/sw5e/templates/shared/sheet-config.hbs"
    } );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData( options ) {
    const context = super.getData( options );
    context.CONFIG = CONFIG.SW5E;
    return context;
  }

  /* -------------------------------------------- */

  async _updateObject( event, formData ) {
    super._updateObject( event, formData );
    delete formData.sheetClass;
    delete formData.defaultClass;
    this.object.update( formData );

    if ( "flags.sw5e.theme" in formData ) {
      const sheet = this.object.sheet.element?.[0];
      if ( sheet ) setTheme( sheet, formData["flags.sw5e.theme"] );
    }
  }
}
