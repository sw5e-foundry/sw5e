import BaseConfigSheet from "./base-config.mjs";

/**
 * A simple form to set actor movement speeds.
 */
export default class ActorMovementConfig extends BaseConfigSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e"],
      template: "systems/sw5e/templates/apps/movement-config.hbs",
      width: 300,
      height: "auto",
      sheetConfig: false,
      keyPath: "system.attributes.movement"
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize("SW5E.MovementConfig")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  getData(options = {}) {
    const source = this.document.toObject();
    const movement = foundry.utils.getProperty(source, this.options.keyPath) ?? {};
    const speciesData = this.document.system.details?.species?.system?.movement ?? {};

    // Allowed speeds
    const speeds =
      source.type === "group"
        ? {
          land: "SW5E.MovementLand",
          water: "SW5E.MovementWater",
          air: "SW5E.MovementAir"
        }
        : {
          walk: "SW5E.MovementWalk",
          burrow: "SW5E.MovementBurrow",
          climb: "SW5E.MovementClimb",
          fly: "SW5E.MovementFly",
          swim: "SW5E.MovementSwim"
        };

    return {
      movement,
      movements: Object.entries(speeds).reduce((obj, [k, label]) => {
        obj[k] = { label, value: movement[k], placeholder: speciesData[k] ?? 0 };
        return obj;
      }, {}),
      selectUnits: Object.hasOwn(movement, "units"),
      canHover: Object.hasOwn(movement, "hover"),
      units: CONFIG.SW5E.movementUnits,
      unitsPlaceholder: game.i18n.format("SW5E.AutomaticValue", {
        value: CONFIG.SW5E.movementUnits[speciesData.units ?? Object.keys(CONFIG.SW5E.movementUnits)[0]]?.toLowerCase()
      }),
      keyPath: this.options.keyPath
    };
  }
}
