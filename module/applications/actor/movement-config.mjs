import BaseConfigSheet from "./base-config.mjs";

/**
 * A simple form to set actor movement speeds.
 */
export default class ActorMovementConfig extends BaseConfigSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sw5e"],
      template: "systems/sw5e/templates/apps/movement-config.hbs",
      width: 300,
      height: "auto"
    });
  }

  /* -------------------------------------------- */

  /** @override */
  get title() {
    return `${game.i18n.localize("SW5E.MovementConfig")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options = {}) {
    const source = this.document.toObject();

    // Current movement values
    const movement = source.system.attributes?.movement || {};
    for (let [k, v] of Object.entries(movement)) {
      if (["units", "hover"].includes(k)) continue;
      movement[k] = Number.isNumeric(v) ? v.toNearest(0.1) : 0;
    }

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

    // Return rendering context
    return {
      speeds,
      movement,
      selectUnits: source.type !== "group",
      canHover: source.type !== "group",
      units: CONFIG.SW5E.movementUnits
    };
  }
}
