import BaseConfigSheet from "./base-config.mjs";

/**
 * Interface for managing a character's armor calculation.
 */
export default class ActorArmorConfig extends BaseConfigSheet {
  constructor(...args) {
    super(...args);

    /**
     * Cloned copy of the actor for previewing changes.
     * @type {Actor5e}
     */
    this.clone = this.document.clone();
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "actor-armor-config",
      classes: ["sw5e", "actor-armor-config"],
      template: "systems/sw5e/templates/apps/actor-armor.hbs",
      width: 320,
      height: "auto"
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  get title() {
    return `${game.i18n.localize("SW5E.ArmorConfig")}: ${this.document.name}`;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async getData() {
    const ac = this.clone.system.attributes.ac;
    const isFlat = ["flat", "natural"].includes(ac.calc);

    // Get configuration data for the calculation mode, reset to flat if configuration is unavailable
    let cfg = CONFIG.SW5E.armorClasses[ac.calc];
    if (!cfg) {
      ac.calc = "flat";
      cfg = CONFIG.SW5E.armorClasses.flat;
      this.clone.updateSource({ "system.attributes.ac.calc": "flat" });
    }

    return {
      ac,
      isFlat,
      calculations: CONFIG.SW5E.armorClasses,
      valueDisabled: !isFlat,
      formula: ac.calc === "custom" ? ac.formula : cfg.formula,
      formulaDisabled: ac.calc !== "custom"
    };
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getActorOverrides() {
    return Object.keys(foundry.utils.flattenObject(this.object.overrides?.system?.attributes || {}));
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _updateObject(event, formData) {
    const ac = foundry.utils.expandObject(formData).ac;
    return this.document.update({ "system.attributes.ac": ac });
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeInput(event) {
    await super._onChangeInput(event);

    // Update clone with new data & re-render
    this.clone.updateSource({ [`system.attributes.${event.currentTarget.name}`]: event.currentTarget.value });
    this.render();
  }
}
