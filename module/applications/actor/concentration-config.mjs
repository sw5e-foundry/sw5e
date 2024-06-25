import BaseConfigSheet from "./base-config.mjs";

/**
 * A sub-application of the ActorSheet used to configure concentration saving throws.
 * @extends {BaseConfigSheet}
 */
export default class ActorConcentrationConfig extends BaseConfigSheet {
  /** @inheritDoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject( super.defaultOptions, {
      classes: ["sw5e"],
      template: "systems/sw5e/templates/apps/concentration-config.hbs",
      width: 500,
      height: "auto"
    } );
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return `${game.i18n.format( "SW5E.AbilityConfigure", {
      ability: game.i18n.localize( "SW5E.Concentration" ) } )
    }: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData( options={} ) {
    const src = this.document.toObject();
    const { ability, bonuses, limit, roll } = src.system.attributes.concentration;
    return {
      ability, limit,
      abilities: CONFIG.SW5E.abilities,
      bonus: bonuses.save,
      mode: roll.mode,
      modes: {
        "-1": "SW5E.Disadvantage",
        0: "SW5E.Normal",
        1: "SW5E.Advantage"
      },
      bonusGlobalSave: src.system.bonuses?.abilities?.save
    };
  }
}
