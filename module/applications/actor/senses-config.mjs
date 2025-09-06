import BaseConfigSheet from "./base-config.mjs";

/**
 * A simple form to configure Actor senses.
 */
export default class ActorSensesConfig extends BaseConfigSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject( super.defaultOptions, {
      classes: ["sw5e"],
      template: "systems/sw5e/templates/apps/senses-config.hbs",
      width: 300,
      height: "auto",
      keyPath: "system.attributes.senses"
    } );
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize( "SW5E.SensesConfig" )}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData( options ) {
    const source = this.document.toObject();
    const senses = foundry.utils.getProperty( source, this.options.keyPath ) ?? {};
    const speciesData = this.document.system.details?.species?.system?.senses ?? {};
    return foundry.utils.mergeObject( super.getData( options ), {
      senses: Object.entries( CONFIG.SW5E.senses ).reduce( ( obj, [k, label] ) => {
        obj[k] = { label, value: senses[k], placeholder: speciesData[k] ?? 0 };
        return obj;
      }, {} ),
      special: senses.special ?? "",
      units: senses.units, movementUnits: CONFIG.SW5E.movementUnits,
      unitsPlaceholder: game.i18n.format( "SW5E.AutomaticValue", {
        value: CONFIG.SW5E.movementUnits[speciesData.units ?? Object.keys( CONFIG.SW5E.movementUnits )[0]]?.toLowerCase()
      } ),
      keyPath: this.options.keyPath
    } );
  }
}
