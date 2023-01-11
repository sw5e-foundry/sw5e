import BaseConfigSheet from "./base-config.mjs";

/**
 * A simple sub-application of the ActorSheet which is used to configure properties related to initiative.
 */
export default class ActorInitiativeConfig extends BaseConfigSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e"],
      template: "systems/sw5e/templates/apps/initiative-config.hbs",
      width: 360,
      height: "auto"
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return `${game.i18n.localize("SW5E.InitiativeConfig")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options={}) {
    const source = this.document.toObject();
    const init = source.system.attributes.init || {};
    const flags = source.flags.sw5e || {};
    return {
      ability: init.ability,
      abilities: CONFIG.SW5E.abilities,
      bonus: init.bonus,
      initiativeAlert: flags.initiativeAlert,
      initiativeAdv: flags.initiativeAdv
    };
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  _getSubmitData(updateData={}) {
    const formData = super._getSubmitData(updateData);
    formData.flags = {sw5e: {}};
    for ( const flag of ["initiativeAlert", "initiativeAdv"] ) {
      const k = `flags.sw5e.${flag}`;
      if ( formData[k] ) formData.flags.sw5e[flag] = true;
      else formData.flags.sw5e[`-=${flag}`] = null;
      delete formData[k];
    }
    return formData;
  }
}
